import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { eq, sql, inArray, and } from 'drizzle-orm';
import { costBreakdown, poMappings, poLineItems, budgetForecasts, forecastVersions } from '@cost-mgmt/db';
import { TRPCError } from '@trpc/server';
import { splitMappedAmount } from './helpers/split-mapped-amount.helper';

/**
 * Get Financial Control Metrics
 * Returns budget control matrix by category (spend_type) with real P&L tracking
 * Replaces fake 0.6 multiplier with actual invoiced_value_usd data
 * Used by: financial-control-matrix Cell
 */
export const getFinancialControlMetrics = publicProcedure
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
  });
