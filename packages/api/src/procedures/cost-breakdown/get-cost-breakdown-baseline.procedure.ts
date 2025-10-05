import { z } from 'zod'
import { publicProcedure } from '../../trpc'
import { db, costBreakdown } from '@cost-mgmt/db'
import { eq, gte } from 'drizzle-orm'

/**
 * Get baseline cost breakdown (version 0) for comparison operations
 * Optionally filter out small line items below a threshold
 */
export const getCostBreakdownBaseline = publicProcedure
  .input(z.object({
    projectId: z.string().uuid(),
    minBudgetCost: z.number().optional()
  }))
  .query(async ({ input }) => {
    const conditions = [eq(costBreakdown.projectId, input.projectId)]
    
    // Add budget threshold filter if specified
    if (input.minBudgetCost !== undefined) {
      conditions.push(gte(costBreakdown.budgetCost, input.minBudgetCost.toString()))
    }
    
    const data = await db
      .select()
      .from(costBreakdown)
      .where(
        conditions.length === 1 
          ? conditions[0] 
          : eq(costBreakdown.projectId, input.projectId)
      )
    
    // Convert numeric budgetCost to number
    return data.map(item => ({
      ...item,
      budgetCost: Number(item.budgetCost)
    }))
  })
