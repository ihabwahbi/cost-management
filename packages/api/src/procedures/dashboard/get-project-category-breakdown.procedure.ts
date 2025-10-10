import { z } from 'zod'
import { publicProcedure } from '../../trpc'
import { costBreakdown, poMappings } from '@cost-mgmt/db'
import { eq, and, sql } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'

export const getProjectCategoryBreakdown = publicProcedure
  .input(z.object({
    projectId: z.string().uuid(),
    filters: z.object({
      costLine: z.string().optional()
    }).optional()
  }))
  .query(async ({ input, ctx }) => {
    const { projectId, filters } = input

    try {
      const conditions = [eq(costBreakdown.projectId, projectId)]
      if (filters?.costLine && filters.costLine !== 'all') {
        conditions.push(eq(costBreakdown.costLine, filters.costLine))
      }

      const results = await ctx.db
        .select({
          spendType: costBreakdown.spendType,
          budget: sql<number>`COALESCE(SUM(${costBreakdown.budgetCost}), 0)`,
          value: sql<number>`COALESCE(SUM(${poMappings.mappedAmount}), 0)`
        })
        .from(costBreakdown)
        .leftJoin(poMappings, eq(poMappings.costBreakdownId, costBreakdown.id))
        .where(and(...conditions))
        .groupBy(costBreakdown.spendType)

      const categories = results.map(row => ({
        name: formatCategoryName(row.spendType || 'Unknown'),
        value: Number(row.value || 0),
        budget: Number(row.budget || 0)
      }))

      return { categories }

    } catch (error) {
      console.error('Error in getProjectCategoryBreakdown:', error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get category breakdown',
        cause: error
      })
    }
  })

function formatCategoryName(name: string): string {
  return name
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
