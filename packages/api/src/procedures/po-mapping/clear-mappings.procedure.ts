import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { inArray } from 'drizzle-orm';
import { poMappings } from '@cost-mgmt/db';
import { TRPCError } from '@trpc/server';

/**
 * Clear/delete mappings
 * Mutation operation
 */
export const clearMappings = publicProcedure
  .input(z.object({
    poLineItemIds: z.array(z.string().uuid())
  }))
  .output(z.object({ success: z.boolean() }))
  .mutation(async ({ ctx, input }) => {
    try {
      await ctx.db
        .delete(poMappings)
        .where(inArray(poMappings.poLineItemId, input.poLineItemIds));
      
      return { success: true };
    } catch (error) {
      console.error('[clearMappings] Failed:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to clear mappings. Please try again.',
        cause: error,
      });
    }
  });
