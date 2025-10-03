// packages/api/src/procedures/dashboard/get-category-breakdown.procedure.ts

import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { sql } from 'drizzle-orm';
import { costBreakdown, poMappings } from '@cost-mgmt/db';
import { TRPCError } from '@trpc/server';

/**
 * Get Category Breakdown for Main Dashboard
 * Returns spend by category with real data (replaces simulated budget * 0.85)
 * - Groups by cost_line (category) from cost_breakdown
 * - Joins with po_mappings to get actual spend
 * Used by: main-dashboard-cell (category breakdown chart)
 */
export const getCategoryBreakdown = publicProcedure
  .input(z.object({}))
  .output(z.object({
    categories: z.array(z.object({
      name: z.string(),
      value: z.number(),
      budget: z.number(),
    })),
  }))
  .query(async ({ ctx }) => {
    try {
      // Query with LEFT JOIN to include categories with no mappings
      const result = await ctx.db
        .select({
          category: costBreakdown.costLine,
          budget: sql<number>`COALESCE(SUM(${costBreakdown.budgetCost}), 0)`,
          actual: sql<number>`COALESCE(SUM(${poMappings.mappedAmount}), 0)`,
        })
        .from(costBreakdown)
        .leftJoin(poMappings, sql`${poMappings.costBreakdownId} = ${costBreakdown.id}`)
        .groupBy(costBreakdown.costLine);
      
      // Format category names and structure data
      const categories = result.map(row => ({
        name: (row.category || 'Uncategorized')
          .replace(/_/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase()),
        value: Number(row.actual || 0),
        budget: Number(row.budget || 0),
      }));
      
      return { categories };
    } catch (error) {
      console.error('[getCategoryBreakdown] Failed:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch category breakdown. Please try again.',
        cause: error,
      });
    }
  });

// File size: 59 lines ✅ (well under 200-line limit)
