import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { eq, sum, sql, inArray } from 'drizzle-orm';
import { costBreakdown, poMappings, poLineItems } from '@cost-mgmt/db';
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
        // Calculate total budget from cost breakdown
        const budgetResult = await ctx.db
          .select({ total: sum(costBreakdown.budgetCost) })
          .from(costBreakdown)
          .where(eq(costBreakdown.projectId, input.projectId));

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
        // Get total budget
        const budgetQuery = ctx.db
          .select({ 
            id: costBreakdown.id,
            budgetCost: costBreakdown.budgetCost 
          })
          .from(costBreakdown)
          .where(eq(costBreakdown.projectId, input.projectId));

        const budgetData = await budgetQuery;
        const totalBudget = budgetData.reduce((sum, item) => sum + Number(item.budgetCost || 0), 0);

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
});
