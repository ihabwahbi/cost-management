import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { eq } from 'drizzle-orm';
import { costBreakdown } from '@cost-mgmt/db';
import { TRPCError } from '@trpc/server';

/**
 * Get unique spend types for a project
 * Returns: Array of spend type strings
 */
export const getSpendTypes = publicProcedure
  .input(z.object({
    projectId: z.string().uuid()
  }))
  .output(z.array(z.string()))
  .query(async ({ ctx, input }) => {
    try {
      const result = await ctx.db
        .selectDistinct({ spendType: costBreakdown.spendType })
        .from(costBreakdown)
        .where(eq(costBreakdown.projectId, input.projectId))
        .orderBy(costBreakdown.spendType);
      
      return result.map(r => r.spendType);
    } catch (error) {
      console.error('[getSpendTypes] Failed:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch spend types. Please try again.',
        cause: error,
      });
    }
  });
