import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { db, poLineItems, poMappings } from '@cost-mgmt/db';
import { eq, inArray } from 'drizzle-orm';

/**
 * Clear Mappings for PO
 * 
 * Purpose: New functionality - unmap entire PO
 * Complexity: ~60 lines (under 200 limit ✓)
 * 
 * Deletes all mappings for a PO's line items in a single transaction
 */
export const clearMappingsForPO = publicProcedure
  .input(
    z.object({
      poId: z.string().uuid(),
    })
  )
  .output(
    z.object({
      success: z.boolean(),
      deletedCount: z.number(),
      message: z.string(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    // Wrap in transaction for atomicity
    return await db.transaction(async (tx) => {
      // Get line item IDs for PO
      const lineItems = await tx
        .select({ id: poLineItems.id })
        .from(poLineItems)
        .where(eq(poLineItems.poId, input.poId));

      if (lineItems.length === 0) {
        return {
          success: true,
          deletedCount: 0,
          message: 'No line items found for this PO',
        };
      }

      const lineItemIds = lineItems.map((item) => item.id);

      // Bulk delete mappings
      const result = await tx
        .delete(poMappings)
        .where(inArray(poMappings.poLineItemId, lineItemIds))
        .returning({ id: poMappings.id });

      return {
        success: true,
        deletedCount: result.length,
        message: `Deleted ${result.length} mappings successfully`,
      };
    });
  });
