import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { and, eq } from 'drizzle-orm';
import { costBreakdown, projects } from '@cost-mgmt/db';
import { TRPCError } from '@trpc/server';

/**
 * Find matching cost breakdown
 * Returns: Array of cost breakdown objects matching criteria
 */
export const findMatchingCostBreakdown = publicProcedure
  .input(z.object({
    projectId: z.string().uuid(),
    spendType: z.string(),
    spendSubCategory: z.string()
  }))
  .output(z.array(z.object({
    id: z.string().uuid(),
    projectId: z.string().uuid(),
    subBusinessLine: z.string(),
    costLine: z.string(),
    spendType: z.string(),
    spendSubCategory: z.string(),
    budgetCost: z.string().nullable()
  })))
  .query(async ({ ctx, input }) => {
    try {
      const result = await ctx.db
        .select({
          id: costBreakdown.id,
          projectId: costBreakdown.projectId,
          subBusinessLine: costBreakdown.subBusinessLine,
          costLine: costBreakdown.costLine,
          spendType: costBreakdown.spendType,
          spendSubCategory: costBreakdown.spendSubCategory,
          budgetCost: costBreakdown.budgetCost
        })
        .from(costBreakdown)
        .innerJoin(projects, eq(projects.id, costBreakdown.projectId))
        .where(and(
          eq(costBreakdown.projectId, input.projectId),
          eq(costBreakdown.spendType, input.spendType),
          eq(costBreakdown.spendSubCategory, input.spendSubCategory)
        ));
      
      return result;
    } catch (error) {
      console.error('[findMatchingCostBreakdown] Failed:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to find matching cost breakdown. Please try again.',
        cause: error,
      });
    }
  });
