import { z } from 'zod'
import { publicProcedure } from '../../trpc'
import { db, costBreakdown } from '@cost-mgmt/db'
import { eq } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'

/**
 * Delete a single cost breakdown entry
 * Returns success confirmation with deleted ID
 */
export const deleteCostEntry = publicProcedure
  .input(z.object({
    id: z.string().uuid()
  }))
  .mutation(async ({ input }) => {
    const [deleted] = await db
      .delete(costBreakdown)
      .where(eq(costBreakdown.id, input.id))
      .returning()
    
    if (!deleted) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Cost entry not found'
      })
    }
    
    return {
      success: true,
      deletedId: deleted.id
    }
  })
