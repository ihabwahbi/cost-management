import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { and, eq } from 'drizzle-orm';
import { costBreakdown } from '@cost-mgmt/db';
import { TRPCError } from '@trpc/server';

/**
 * Get cost breakdown ID by criteria
 * Helper procedure
 */
export const getCostBreakdownById = publicProcedure
  .input(z.object({
    projectId: z.string().uuid(),
    spendType: z.string(),
    spendSubCategory: z.string()
  }))
  .output(z.object({ id: z.string().uuid() }).nullable())
  .query(async ({ ctx, input }) => {
    try {
      const result = await ctx.db
        .select({ id: costBreakdown.id })
        .from(costBreakdown)
        .where(and(
          eq(costBreakdown.projectId, input.projectId),
          eq(costBreakdown.spendType, input.spendType),
          eq(costBreakdown.spendSubCategory, input.spendSubCategory)
        ))
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      console.error('[getCostBreakdownById] Failed:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get cost breakdown ID. Please try again.',
        cause: error,
      });
    }
  });
