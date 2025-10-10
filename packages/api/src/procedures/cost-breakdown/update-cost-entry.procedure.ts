import { z } from 'zod'
import { publicProcedure } from '../../trpc'
import { db, costBreakdown } from '@cost-mgmt/db'
import { eq } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'

/**
 * Update an existing cost breakdown entry
 * Supports partial updates - only changed fields
 * Automatically updates updatedAt timestamp
 */
export const updateCostEntry = publicProcedure
  .input(z.object({
    id: z.string().uuid(),
    subBusinessLine: z.string().optional(),
    costLine: z.string().min(1).max(255).optional(),
    spendType: z.string().optional(),
    spendSubCategory: z.string().optional(),
    budgetCost: z.number().min(0).optional()
  }))
  .mutation(async ({ input }) => {
    const { id, ...updates } = input
    
    // Build update object with only provided fields
    const updateData: Record<string, any> = {}
    
    if (updates.subBusinessLine !== undefined) updateData.subBusinessLine = updates.subBusinessLine
    if (updates.costLine !== undefined) updateData.costLine = updates.costLine
    if (updates.spendType !== undefined) updateData.spendType = updates.spendType
    if (updates.spendSubCategory !== undefined) updateData.spendSubCategory = updates.spendSubCategory
    if (updates.budgetCost !== undefined) updateData.budgetCost = updates.budgetCost.toString()
    
    // Always update timestamp
    updateData.updatedAt = new Date()
    
    const [updated] = await db
      .update(costBreakdown)
      .set(updateData)
      .where(eq(costBreakdown.id, id))
      .returning()
    
    if (!updated) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Cost entry not found'
      })
    }
    
    return {
      ...updated,
      budgetCost: Number(updated.budgetCost)
    }
  })
