import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { eq } from 'drizzle-orm';
import { poMappings, poLineItems, costBreakdown } from '@cost-mgmt/db';
import { TRPCError } from '@trpc/server';

/**
 * Get existing PO mappings
 * Returns: Array of mapping objects with line item and cost breakdown details
 */
export const getExistingMappings = publicProcedure
  .input(z.object({
    poId: z.string().uuid()
  }))
  .output(z.array(z.object({
    id: z.string().uuid(),
    poLineItemId: z.string().uuid(),
    costBreakdownId: z.string().uuid(),
    mappedAmount: z.string(),
    mappingNotes: z.string().nullable(),
    lineItemNumber: z.number(),
    description: z.string(),
    quantity: z.string(),
    lineValue: z.string().nullable(),
    costLine: z.string(),
    spendType: z.string(),
    spendSubCategory: z.string()
  })))
  .query(async ({ ctx, input }) => {
    try {
      const result = await ctx.db
        .select({
          id: poMappings.id,
          poLineItemId: poMappings.poLineItemId,
          costBreakdownId: poMappings.costBreakdownId,
          mappedAmount: poMappings.mappedAmount,
          mappingNotes: poMappings.mappingNotes,
          lineItemNumber: poLineItems.lineItemNumber,
          description: poLineItems.description,
          quantity: poLineItems.quantity,
          lineValue: poLineItems.lineValue,
          costLine: costBreakdown.costLine,
          spendType: costBreakdown.spendType,
          spendSubCategory: costBreakdown.spendSubCategory
        })
        .from(poMappings)
        .innerJoin(poLineItems, eq(poLineItems.id, poMappings.poLineItemId))
        .innerJoin(costBreakdown, eq(costBreakdown.id, poMappings.costBreakdownId))
        .where(eq(poLineItems.poId, input.poId));
      
      return result;
    } catch (error) {
      console.error('[getExistingMappings] Failed:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch existing mappings. Please try again.',
        cause: error,
      });
    }
  });
