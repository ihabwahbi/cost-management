import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { eq, inArray } from 'drizzle-orm';
import { costBreakdown, poMappings, poLineItems } from '@cost-mgmt/db';
import { TRPCError } from '@trpc/server';
import { splitMappedAmount } from './helpers/split-mapped-amount.helper';

/**
 * Get Promise Dates (next P&L hits)
 * Returns upcoming promise dates with amounts
 * Used by: pl-command-center Cell
 */
export const getPromiseDates = publicProcedure
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
  });
