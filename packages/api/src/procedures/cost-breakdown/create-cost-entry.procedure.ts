import { z } from 'zod'
import { publicProcedure } from '../../trpc'
import { db, costBreakdown } from '@cost-mgmt/db'
import { TRPCError } from '@trpc/server'

/**
 * Create a new cost breakdown entry
 * Returns the created entry with numeric budgetCost
 */
export const createCostEntry = publicProcedure
  .input(z.object({
    projectId: z.string().uuid(),
    subBusinessLine: z.string(),
    costLine: z.string().min(1).max(255),
    spendType: z.string(),
    spendSubCategory: z.string(),
    budgetCost: z.number().min(0)
  }))
  .mutation(async ({ input }) => {
    const [newEntry] = await db
      .insert(costBreakdown)
      .values({
        projectId: input.projectId,
        subBusinessLine: input.subBusinessLine,
        costLine: input.costLine,
        spendType: input.spendType,
        spendSubCategory: input.spendSubCategory,
        budgetCost: input.budgetCost.toString()  // Convert to string for numeric type
      })
      .returning()
    
    if (!newEntry) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create cost entry'
      })
    }
    
    return {
      ...newEntry,
      budgetCost: Number(newEntry.budgetCost)
    }
  })
