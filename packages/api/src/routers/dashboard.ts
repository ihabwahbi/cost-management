import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { eq, sum, sql, inArray, and, desc } from 'drizzle-orm';
import { costBreakdown, poMappings, poLineItems, budgetForecasts, forecastVersions } from '@cost-mgmt/db';
import { TRPCError } from '@trpc/server';

/**
 * Dashboard Router
 * Procedures for dashboard KPI metrics and visualizations
 */

// Constants for P&L calculations
const FALLBACK_INVOICE_RATIO = 0.6;

// Helper: Calculate actual vs future P&L from line item
function splitMappedAmount(mappedAmount: number, lineItem: any): { actual: number; future: number } {
  const lineValue = Number(lineItem.lineValue || 0);
  const invoiceValue = Number(lineItem.invoicedValueUsd || 0);
  const hasInvoiceField = lineItem.invoicedValueUsd !== null;
  
  const safeLineValue = lineValue > 0 ? lineValue : mappedAmount;
  const ratio = safeLineValue > 0 ? Math.min(mappedAmount / safeLineValue, 1) : 1;
  
  if (hasInvoiceField) {
    const actual = invoiceValue * ratio;
    const future = Math.max(mappedAmount - actual, 0);
    return { actual, future };
  }
  
  const inferredActual = mappedAmount * FALLBACK_INVOICE_RATIO;
  return {
    actual: inferredActual,
    future: Math.max(mappedAmount - inferredActual, 0)
  };
}

// Helper: Generate P&L timeline with actual invoices and future promises
// Budget as fixed reference line, actual as cumulative invoiced, forecast as future promises
function generatePLTimeline(
  totalBudget: number,
  invoiceData: Array<{ month: Date; invoiced: string | null }>,
  promiseData: Array<{ month: Date; future: string | null }>
): Array<{
  month: string;
  budget: number;
  actual: number;
  forecast: number;
}> {
  // Build month map for invoices
  const invoiceMap = new Map<string, number>();
  invoiceData.forEach((row) => {
    const key = new Date(row.month).toISOString().slice(0, 7); // YYYY-MM
    invoiceMap.set(key, Number(row.invoiced || 0));
  });

  // Build month map for promises
  const promiseMap = new Map<string, number>();
  promiseData.forEach((row) => {
    const key = new Date(row.month).toISOString().slice(0, 7); // YYYY-MM
    promiseMap.set(key, Number(row.future || 0));
  });

  // Determine date range
  const allDates = [...invoiceData.map(d => new Date(d.month)), ...promiseData.map(d => new Date(d.month))];
  if (allDates.length === 0) {
    // No data - return empty array
    return [];
  }

  const startDate = new Date(Math.min(...allDates.map(d => d.getTime())));
  const endDate = new Date(Math.max(...allDates.map(d => d.getTime())));
  
  // Extend end date to include at least 3 months into future for visibility
  const minEndDate = new Date();
  minEndDate.setMonth(minEndDate.getMonth() + 3);
  if (endDate < minEndDate) {
    endDate.setMonth(minEndDate.getMonth());
  }

  // Generate timeline
  const timeline: Array<{ month: string; budget: number; actual: number; forecast: number }> = [];
  const current = new Date(startDate);
  current.setDate(1); // Normalize to first of month
  
  let cumulativeActual = 0;

  while (current <= endDate) {
    const monthKey = current.toISOString().slice(0, 7); // YYYY-MM
    const monthLabel = current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    
    // Add monthly invoice to cumulative
    const monthlyInvoice = invoiceMap.get(monthKey) || 0;
    cumulativeActual += monthlyInvoice;
    
    // Get forecast for this month (not cumulative - just this month's promise)
    const monthlyForecast = promiseMap.get(monthKey) || 0;

    timeline.push({
      month: monthLabel,
      budget: totalBudget, // Fixed budget reference
      actual: Math.round(cumulativeActual),
      forecast: Math.round(monthlyForecast)
    });

    current.setMonth(current.getMonth() + 1);
  }

  return timeline;
}

export const dashboardRouter = router({
  /**
   * Get KPI Metrics for a project
   * Returns budget total, committed amount, and variance
   */
  getKPIMetrics: publicProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        // Get latest forecast version
        const maxVersionResult = await ctx.db
          .select({ maxVersion: sql<number>`MAX(${forecastVersions.versionNumber})` })
          .from(forecastVersions)
          .where(eq(forecastVersions.projectId, input.projectId));

        const latestVersion = maxVersionResult[0]?.maxVersion ?? 0;

        // Calculate total budget from latest forecast version (not baseline)
        const budgetResult = await ctx.db
          .select({ total: sum(budgetForecasts.forecastedCost) })
          .from(budgetForecasts)
          .innerJoin(forecastVersions, eq(budgetForecasts.forecastVersionId, forecastVersions.id))
          .innerJoin(costBreakdown, eq(budgetForecasts.costBreakdownId, costBreakdown.id))
          .where(and(
            eq(costBreakdown.projectId, input.projectId),
            eq(forecastVersions.versionNumber, latestVersion)
          ));

        const budgetTotal = Number(budgetResult[0]?.total || 0);

        // Calculate committed amount from PO mappings
        // Join po_mappings with cost_breakdown to filter by projectId
        const committedResult = await ctx.db
          .select({ total: sum(poMappings.mappedAmount) })
          .from(poMappings)
          .innerJoin(costBreakdown, eq(poMappings.costBreakdownId, costBreakdown.id))
          .where(eq(costBreakdown.projectId, input.projectId));

        const committed = Number(committedResult[0]?.total || 0);

        // Calculate variance
        const variance = budgetTotal - committed;
        const variancePercent = budgetTotal > 0 ? (variance / budgetTotal) * 100 : 0;

        return {
          budgetTotal,
          committed,
          variance,
          variancePercent,
        };
      } catch (error) {
        // Log error for debugging
        console.error('Failed to fetch KPI metrics:', error);

        // Return user-friendly tRPC error
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch KPI metrics. Please try again.',
          cause: error,
        });
      }
    }),

  /**
   * Get P&L Metrics for PLCommandCenter
   * Returns comprehensive P&L breakdown: budget, committed, actual PL, future PL, and gap
   */
  getPLMetrics: publicProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        filters: z
          .object({
            costLine: z.string().optional(),
            spendType: z.string().optional(),
          })
          .optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        // Get latest forecast version
        const maxVersionResult = await ctx.db
          .select({ maxVersion: sql<number>`MAX(${forecastVersions.versionNumber})` })
          .from(forecastVersions)
          .where(eq(forecastVersions.projectId, input.projectId));

        const latestVersion = maxVersionResult[0]?.maxVersion ?? 0;

        // Get total budget from latest forecast version (not baseline)
        const budgetData = await ctx.db
          .select({ 
            id: costBreakdown.id,
            forecastedCost: budgetForecasts.forecastedCost 
          })
          .from(costBreakdown)
          .innerJoin(budgetForecasts, eq(budgetForecasts.costBreakdownId, costBreakdown.id))
          .innerJoin(forecastVersions, eq(budgetForecasts.forecastVersionId, forecastVersions.id))
          .where(and(
            eq(costBreakdown.projectId, input.projectId),
            eq(forecastVersions.versionNumber, latestVersion)
          ));

        const totalBudget = budgetData.reduce((sum, item) => sum + Number(item.forecastedCost || 0), 0);

        if (budgetData.length === 0) {
          return {
            totalBudget: 0,
            totalCommitted: 0,
            actualPLImpact: 0,
            futurePLImpact: 0,
            plGap: 0,
          };
        }

        const costBreakdownIds = budgetData.map(b => b.id);

        // Get PO mappings with line items
        const mappingsData = await ctx.db
          .select({
            mappedAmount: poMappings.mappedAmount,
            lineValue: poLineItems.lineValue,
            invoicedValueUsd: poLineItems.invoicedValueUsd,
          })
          .from(poMappings)
          .leftJoin(poLineItems, eq(poMappings.poLineItemId, poLineItems.id))
          .where(inArray(poMappings.costBreakdownId, costBreakdownIds));

        let totalCommitted = 0;
        let actualPLImpact = 0;
        let futurePLImpact = 0;

        mappingsData.forEach((mapping) => {
          const mappedAmount = Number(mapping.mappedAmount || 0);
          totalCommitted += mappedAmount;

          if (!mapping.lineValue) {
            // No line item data - use fallback ratio
            const inferredActual = mappedAmount * FALLBACK_INVOICE_RATIO;
            actualPLImpact += inferredActual;
            futurePLImpact += Math.max(mappedAmount - inferredActual, 0);
          } else {
            const { actual, future } = splitMappedAmount(mappedAmount, mapping);
            actualPLImpact += actual;
            futurePLImpact += future;
          }
        });

        return {
          totalBudget,
          totalCommitted,
          actualPLImpact,
          futurePLImpact,
          plGap: totalCommitted - actualPLImpact,
        };
      } catch (error) {
        console.error('Failed to fetch P&L metrics:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch P&L metrics. Please try again.',
          cause: error,
        });
      }
    }),

  /**
   * Get P&L Timeline (monthly breakdown)
   * Returns historical and projected P&L by month
   */
  getPLTimeline: publicProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        dateRange: z.object({
          from: z.date(),
          to: z.date(),
        }),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        // Get cost breakdown IDs
        const budgetData = await ctx.db
          .select({ id: costBreakdown.id })
          .from(costBreakdown)
          .where(eq(costBreakdown.projectId, input.projectId));

        if (budgetData.length === 0) {
          return [];
        }

        const costBreakdownIds = budgetData.map(b => b.id);

        // Get mappings with line items
        const mappingsData = await ctx.db
          .select({
            mappedAmount: poMappings.mappedAmount,
            lineValue: poLineItems.lineValue,
            invoicedValueUsd: poLineItems.invoicedValueUsd,
            invoiceDate: poLineItems.invoiceDate,
            supplierPromiseDate: poLineItems.supplierPromiseDate,
            createdAt: poLineItems.createdAt,
          })
          .from(poMappings)
          .leftJoin(poLineItems, eq(poMappings.poLineItemId, poLineItems.id))
          .where(inArray(poMappings.costBreakdownId, costBreakdownIds));

        // Group by month
        const monthlyData = new Map<string, { actual: number; projected: number }>();

        const addToMonth = (date: Date | null, key: 'actual' | 'projected', amount: number) => {
          if (!date || amount <= 0) return;
          if (date < input.dateRange.from || date > input.dateRange.to) return;
          
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const current = monthlyData.get(monthKey) || { actual: 0, projected: 0 };
          current[key] += amount;
          monthlyData.set(monthKey, current);
        };

        mappingsData.forEach((mapping) => {
          const mappedAmount = Number(mapping.mappedAmount || 0);

          if (!mapping.lineValue) {
            // No line item - use fallback
            const inferredActual = mappedAmount * FALLBACK_INVOICE_RATIO;
            addToMonth(input.dateRange.from, 'actual', inferredActual);
            addToMonth(input.dateRange.to, 'projected', mappedAmount - inferredActual);
          } else {
            const { actual, future } = splitMappedAmount(mappedAmount, mapping);
            
            const invoiceDate = mapping.invoiceDate 
              ? new Date(mapping.invoiceDate) 
              : mapping.createdAt 
                ? new Date(mapping.createdAt) 
                : null;
            
            const promiseDate = mapping.supplierPromiseDate 
              ? new Date(mapping.supplierPromiseDate) 
              : null;

            addToMonth(invoiceDate, 'actual', actual);
            addToMonth(promiseDate || invoiceDate, 'projected', future);
          }
        });

        // Convert to sorted timeline
        const timeline = Array.from(monthlyData.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([monthKey, data]) => {
            const [year, month] = monthKey.split('-');
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            
            return {
              month: monthNames[parseInt(month) - 1],
              year: parseInt(year),
              actualPL: data.actual,
              projectedPL: data.projected,
              cumulative: 0, // Will calculate after
            };
          });

        // Calculate cumulative
        let cumulative = 0;
        timeline.forEach(entry => {
          cumulative += entry.actualPL + entry.projectedPL;
          entry.cumulative = cumulative;
        });

        return timeline;
      } catch (error) {
        console.error('Failed to fetch P&L timeline:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch P&L timeline. Please try again.',
          cause: error,
        });
      }
    }),

  /**
   * Get Promise Dates (next P&L hits)
   * Returns upcoming promise dates with amounts
   */
  getPromiseDates: publicProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        // Get cost breakdown IDs
        const budgetData = await ctx.db
          .select({ id: costBreakdown.id })
          .from(costBreakdown)
          .where(eq(costBreakdown.projectId, input.projectId));

        if (budgetData.length === 0) {
          return [];
        }

        const costBreakdownIds = budgetData.map(b => b.id);

        // Get mappings with line items that have promise dates
        const mappingsData = await ctx.db
          .select({
            mappedAmount: poMappings.mappedAmount,
            lineValue: poLineItems.lineValue,
            invoicedValueUsd: poLineItems.invoicedValueUsd,
            supplierPromiseDate: poLineItems.supplierPromiseDate,
          })
          .from(poMappings)
          .innerJoin(poLineItems, eq(poMappings.poLineItemId, poLineItems.id))
          .where(inArray(poMappings.costBreakdownId, costBreakdownIds));

        // Group by promise date
        const promiseDateMap = new Map<string, { amount: number; lineItemCount: number }>();

        mappingsData.forEach((mapping) => {
          // Only process if has a promise date
          if (!mapping.supplierPromiseDate) return;
          
          const mappedAmount = Number(mapping.mappedAmount || 0);
          const { future } = splitMappedAmount(mappedAmount, mapping);

          if (future <= 0) return;

          const dateKey = new Date(mapping.supplierPromiseDate).toISOString().split('T')[0];
          const existing = promiseDateMap.get(dateKey) || { amount: 0, lineItemCount: 0 };
          existing.amount += future;
          existing.lineItemCount += 1;
          promiseDateMap.set(dateKey, existing);
        });

        // Convert to array and sort by date
        return Array.from(promiseDateMap.entries())
          .map(([date, data]) => ({
            date,
            amount: data.amount,
            supplierName: undefined, // Not available in current query
            lineItemCount: data.lineItemCount,
          }))
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(0, 10); // Return top 10 upcoming dates
      } catch (error) {
        console.error('Failed to fetch promise dates:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch promise dates. Please try again.',
          cause: error,
        });
      }
    }),

  /**
   * Get Timeline Budget
   * Returns monthly budget timeline for visualization
   * Used by BudgetTimelineChartCell
   */
  getTimelineBudget: publicProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        filters: z
          .object({
            costLine: z.string().optional(),
            spendType: z.string().optional(),
            dateRange: z
              .object({
                from: z.string().transform((val) => new Date(val)),
                to: z.string().transform((val) => new Date(val)),
              })
              .optional(),
          })
          .optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        // Validate projectId
        if (!input.projectId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Project ID is required',
          });
        }

        // 1. Get latest budget forecast for project
        // Find max version number for this project
        const maxVersionResult = await ctx.db
          .select({ maxVersion: sql<number>`MAX(${forecastVersions.versionNumber})` })
          .from(forecastVersions)
          .where(eq(forecastVersions.projectId, input.projectId));

        const latestVersion = maxVersionResult[0]?.maxVersion ?? 0;

        // Get budget for latest version
        const budgetResult = await ctx.db
          .select({
            totalBudget: sum(budgetForecasts.forecastedCost),
          })
          .from(budgetForecasts)
          .innerJoin(forecastVersions, eq(budgetForecasts.forecastVersionId, forecastVersions.id))
          .innerJoin(costBreakdown, eq(budgetForecasts.costBreakdownId, costBreakdown.id))
          .where(
            and(
              eq(costBreakdown.projectId, input.projectId),
              eq(forecastVersions.versionNumber, latestVersion)
            )
          );

        const totalBudget = Number(budgetResult[0]?.totalBudget || 0);

        // 2. Get invoice timeline (cumulative actuals)
        const invoiceResult = await ctx.db
          .select({
            month: sql<Date>`DATE_TRUNC('month', ${poLineItems.invoiceDate})`,
            invoiced: sum(poLineItems.invoicedValueUsd),
          })
          .from(poLineItems)
          .innerJoin(poMappings, eq(poLineItems.id, poMappings.poLineItemId))
          .innerJoin(costBreakdown, eq(poMappings.costBreakdownId, costBreakdown.id))
          .where(
            and(
              eq(costBreakdown.projectId, input.projectId),
              sql`${poLineItems.invoiceDate} IS NOT NULL`
            )
          )
          .groupBy(sql`DATE_TRUNC('month', ${poLineItems.invoiceDate})`)
          .orderBy(sql`DATE_TRUNC('month', ${poLineItems.invoiceDate})`);

        // 3. Get supplier promise timeline (future P&L)
        const promiseResult = await ctx.db
          .select({
            month: sql<Date>`DATE_TRUNC('month', ${poLineItems.supplierPromiseDate})`,
            future: sum(
              sql<number>`${poLineItems.lineValue} - COALESCE(${poLineItems.invoicedValueUsd}, 0)`
            ),
          })
          .from(poLineItems)
          .innerJoin(poMappings, eq(poLineItems.id, poMappings.poLineItemId))
          .innerJoin(costBreakdown, eq(poMappings.costBreakdownId, costBreakdown.id))
          .where(
            and(
              eq(costBreakdown.projectId, input.projectId),
              sql`${poLineItems.supplierPromiseDate} IS NOT NULL`,
              sql`${poLineItems.supplierPromiseDate} >= CURRENT_DATE`
            )
          )
          .groupBy(sql`DATE_TRUNC('month', ${poLineItems.supplierPromiseDate})`)
          .orderBy(sql`DATE_TRUNC('month', ${poLineItems.supplierPromiseDate})`);

        // 4. Generate P&L timeline
        return generatePLTimeline(totalBudget, invoiceResult, promiseResult);
      } catch (error) {
        // Handle known tRPC errors
        if (error instanceof TRPCError) {
          throw error;
        }

        // Handle database errors
        console.error('Failed to fetch timeline budget:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch timeline data',
          cause: error,
        });
      }
    }),

  /**
   * Get Financial Control Metrics
   * Returns budget control matrix by category (spend_type) with real P&L tracking
   * Replaces fake 0.6 multiplier with actual invoiced_value_usd data
   */
  getFinancialControlMetrics: publicProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        filters: z
          .object({
            costLine: z.string().optional(),
            spendType: z.string().optional(),
          })
          .optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        // Step 1: Get latest forecast version for project
        const maxVersionResult = await ctx.db
          .select({ maxVersion: sql<number>`MAX(${forecastVersions.versionNumber})` })
          .from(forecastVersions)
          .where(eq(forecastVersions.projectId, input.projectId));

        const latestVersion = maxVersionResult[0]?.maxVersion ?? 0;

        // Step 2: Build where conditions for cost_breakdown query
        const whereConditions = [eq(costBreakdown.projectId, input.projectId)];

        // Apply optional filters
        if (input.filters?.spendType) {
          whereConditions.push(eq(costBreakdown.spendType, input.filters.spendType));
        }
        if (input.filters?.costLine) {
          whereConditions.push(eq(costBreakdown.costLine, input.filters.costLine));
        }

        // Step 3: Query budget data from LATEST forecast version (not baseline)
        const budgetData = await ctx.db
          .select({
            id: costBreakdown.id,
            spendType: costBreakdown.spendType,
            forecastedCost: budgetForecasts.forecastedCost,
          })
          .from(costBreakdown)
          .innerJoin(budgetForecasts, eq(budgetForecasts.costBreakdownId, costBreakdown.id))
          .innerJoin(forecastVersions, eq(budgetForecasts.forecastVersionId, forecastVersions.id))
          .where(and(...whereConditions, eq(forecastVersions.versionNumber, latestVersion)));

        if (budgetData.length === 0) {
          return []; // Early return for no data
        }

        // Step 3: Get all cost_breakdown IDs for mappings query
        const costBreakdownIds = budgetData.map((row) => row.id);

        // Step 4: Join po_mappings and po_line_items
        const mappingsData = await ctx.db
          .select({
            costBreakdownId: poMappings.costBreakdownId,
            mappedAmount: poMappings.mappedAmount,
            lineValue: poLineItems.lineValue,
            invoicedValueUsd: poLineItems.invoicedValueUsd,
          })
          .from(poMappings)
          .leftJoin(poLineItems, eq(poMappings.poLineItemId, poLineItems.id))
          .where(inArray(poMappings.costBreakdownId, costBreakdownIds));

        // Step 5: Aggregate by category (spend_type)
        const categoryMap = new Map<
          string,
          {
            budget: number;
            committed: number;
            actual: number;
            future: number;
          }
        >();

        // Initialize categories from budget data (using latest forecast version)
        for (const row of budgetData) {
          const category = row.spendType || 'Uncategorized';
          if (!categoryMap.has(category)) {
            categoryMap.set(category, {
              budget: Number(row.forecastedCost || 0),
              committed: 0,
              actual: 0,
              future: 0,
            });
          } else {
            // Sum budget if multiple cost lines in same category
            const existing = categoryMap.get(category)!;
            existing.budget += Number(row.forecastedCost || 0);
          }
        }

        // Add mappings data
        for (const mapping of mappingsData) {
          // Find which category this mapping belongs to
          const budgetRow = budgetData.find((b) => b.id === mapping.costBreakdownId);
          if (!budgetRow) continue;

          const category = budgetRow.spendType || 'Uncategorized';
          const categoryData = categoryMap.get(category)!;

          const mappedAmount = Number(mapping.mappedAmount || 0);
          categoryData.committed += mappedAmount;

          // ✅ CRITICAL: Use splitMappedAmount() helper for real P&L calculation
          const lineItem = {
            lineValue: mapping.lineValue,
            invoicedValueUsd: mapping.invoicedValueUsd,
          };

          const { actual, future } = splitMappedAmount(mappedAmount, lineItem);
          categoryData.actual += actual;
          categoryData.future += future;
        }

        // Step 6: Convert to output format
        const result = Array.from(categoryMap.entries()).map(([name, data]) => ({
          name,
          budget: data.budget,
          committed: data.committed,
          plImpact: data.actual, // ✅ REAL P&L impact
          gapToPL: data.future, // ✅ REAL open commitments
        }));

        // Step 7: Sort by budget descending (largest categories first)
        result.sort((a, b) => b.budget - a.budget);

        return result;
      } catch (error) {
        console.error('[getFinancialControlMetrics] Failed:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch financial control metrics. Please try again.',
          cause: error,
        });
      }
    }),
});
