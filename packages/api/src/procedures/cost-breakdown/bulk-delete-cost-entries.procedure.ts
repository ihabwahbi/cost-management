import { z } from 'zod'
import { publicProcedure } from '../../trpc'
import { db, costBreakdown } from '@cost-mgmt/db'
import { inArray } from 'drizzle-orm'

/**
 * Delete multiple cost entries in a single transaction
 * Safety limit: maximum 100 entries at once
 */
export const bulkDeleteCostEntries = publicProcedure
  .input(z.object({
    ids: z.array(z.string().uuid()).min(1).max(100)  // Safety limit
  }))
  .mutation(async ({ input }) => {
    const deleted = await db
      .delete(costBreakdown)
      .where(inArray(costBreakdown.id, input.ids))
      .returning()
    
    return {
      success: true,
      deletedCount: deleted.length,
      deletedIds: deleted.map(item => item.id)
    }
  })
