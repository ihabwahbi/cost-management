import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { inArray } from 'drizzle-orm';
import { poMappings } from '@cost-mgmt/db';
import { TRPCError } from '@trpc/server';

/**
 * Update existing mappings
 * Mutation operation
 */
export const updateMapping = publicProcedure
  .input(z.object({
    mappingIds: z.array(z.string().uuid()),
    costBreakdownId: z.string().uuid(),
    mappingNotes: z.string().optional()
  }))
  .output(z.object({ 
    success: z.boolean(), 
    count: z.number() 
  }))
  .mutation(async ({ ctx, input }) => {
    try {
      await ctx.db
        .update(poMappings)
        .set({
          costBreakdownId: input.costBreakdownId,
          mappingNotes: input.mappingNotes || null,
          updatedAt: new Date()
        })
        .where(inArray(poMappings.id, input.mappingIds));
      
      return { success: true, count: input.mappingIds.length };
    } catch (error) {
      console.error('[updateMapping] Failed:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update mappings. Please try again.',
        cause: error,
      });
    }
  });
