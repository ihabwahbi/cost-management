import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { eq } from 'drizzle-orm';
import { poLineItems, poMappings } from '@cost-mgmt/db';
import { TRPCError } from '@trpc/server';

/**
 * Create new PO mappings for all line items
 * Mutation operation
 */
export const createMapping = publicProcedure
  .input(z.object({
    poId: z.string().uuid(),
    costBreakdownId: z.string().uuid(),
    mappingNotes: z.string().optional()
  }))
  .output(z.object({ 
    success: z.boolean(), 
    count: z.number() 
  }))
  .mutation(async ({ ctx, input }) => {
    try {
      // Get all line items for PO
      const lineItems = await ctx.db
        .select({ 
          id: poLineItems.id, 
          lineValue: poLineItems.lineValue 
        })
        .from(poLineItems)
        .where(eq(poLineItems.poId, input.poId));
      
      // Create mapping for each line item
      const mappings = lineItems.map(item => ({
        poLineItemId: item.id,
        costBreakdownId: input.costBreakdownId,
        mappedAmount: item.lineValue || '0',
        mappingNotes: input.mappingNotes || null,
        mappedBy: 'system',
        mappedAt: new Date()
      }));
      
      await ctx.db.insert(poMappings).values(mappings);
      
      return { success: true, count: mappings.length };
    } catch (error) {
      console.error('[createMapping] Failed:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create mappings. Please try again.',
        cause: error,
      });
    }
  });
