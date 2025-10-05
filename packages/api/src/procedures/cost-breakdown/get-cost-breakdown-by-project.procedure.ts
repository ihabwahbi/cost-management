import { z } from 'zod'
import { publicProcedure } from '../../trpc'
import { db, costBreakdown } from '@cost-mgmt/db'
import { eq, asc, desc } from 'drizzle-orm'

/**
 * Get all cost breakdown entries for a project
 * Supports ordering by different columns
 */
export const getCostBreakdownByProject = publicProcedure
  .input(z.object({
    projectId: z.string().uuid(),
    orderBy: z.enum(['costLine', 'budgetCost', 'createdAt']).optional().default('costLine')
  }))
  .query(async ({ input }) => {
    // Determine order column
    const orderCol = 
      input.orderBy === 'budgetCost' ? costBreakdown.budgetCost :
      input.orderBy === 'createdAt' ? costBreakdown.createdAt :
      costBreakdown.costLine
    
    const data = await db
      .select()
      .from(costBreakdown)
      .where(eq(costBreakdown.projectId, input.projectId))
      .orderBy(asc(orderCol))
    
    // Convert numeric budgetCost to number
    return data.map(item => ({
      ...item,
      budgetCost: Number(item.budgetCost)
    }))
  })
