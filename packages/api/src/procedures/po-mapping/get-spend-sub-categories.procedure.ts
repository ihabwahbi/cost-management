import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { and, eq } from 'drizzle-orm';
import { costBreakdown } from '@cost-mgmt/db';
import { TRPCError } from '@trpc/server';

/**
 * Get unique spend subcategories for project + spend type
 * Returns: Array of subcategory strings
 */
export const getSpendSubCategories = publicProcedure
  .input(z.object({
    projectId: z.string().uuid(),
    spendType: z.string()
  }))
  .output(z.array(z.string()))
  .query(async ({ ctx, input }) => {
    try {
      const result = await ctx.db
        .selectDistinct({ spendSubCategory: costBreakdown.spendSubCategory })
        .from(costBreakdown)
        .where(and(
          eq(costBreakdown.projectId, input.projectId),
          eq(costBreakdown.spendType, input.spendType)
        ))
        .orderBy(costBreakdown.spendSubCategory);
      
      return result.map(r => r.spendSubCategory);
    } catch (error) {
      console.error('[getSpendSubCategories] Failed:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch spend subcategories. Please try again.',
        cause: error,
      });
    }
  });
