import { z } from 'zod'
import { publicProcedure } from '../../trpc'
import { costBreakdown, forecastVersions, budgetForecasts } from '@cost-mgmt/db'
import { eq, desc, and } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'

export const getForecastData = publicProcedure
  .input(z.object({
    projectId: z.string().uuid(),
    versionNumber: z.union([z.number().int().min(1), z.literal('latest')]),
  }))
  .query(async ({ input, ctx }) => {
      // Resolve 'latest' to actual version number
      let targetVersion: number
      
      if (input.versionNumber === 'latest') {
        const latest = await ctx.db
          .select({ versionNumber: forecastVersions.versionNumber })
          .from(forecastVersions)
          .where(eq(forecastVersions.projectId, input.projectId))
          .orderBy(desc(forecastVersions.versionNumber))
          .limit(1)
        
        if (!latest[0]) {
          // No versions exist, return base cost breakdown
          const costs = await ctx.db
            .select()
            .from(costBreakdown)
            .where(eq(costBreakdown.projectId, input.projectId))
          
          return costs.map(cost => ({
            ...cost,
            budgetCost: Number(cost.budgetCost),
            forecastedCost: Number(cost.budgetCost),
            forecastId: null,
          }))
        }
        
        targetVersion = latest[0].versionNumber
      } else {
        targetVersion = input.versionNumber
      }
      
      // Get version ID
      const version = await ctx.db
        .select({ id: forecastVersions.id })
        .from(forecastVersions)
        .where(and(
          eq(forecastVersions.projectId, input.projectId),
          eq(forecastVersions.versionNumber, targetVersion)
        ))
        .limit(1)
      
      if (!version[0]) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Forecast version ${targetVersion} not found`,
        })
      }
      
      // JOIN to get forecast data
      const data = await ctx.db
        .select({
          id: costBreakdown.id,
          projectId: costBreakdown.projectId,
          subBusinessLine: costBreakdown.subBusinessLine,
          costLine: costBreakdown.costLine,
          spendType: costBreakdown.spendType,
          spendSubCategory: costBreakdown.spendSubCategory,
          budgetCost: costBreakdown.budgetCost,
          forecastedCost: budgetForecasts.forecastedCost,
          forecastId: budgetForecasts.id,
        })
        .from(costBreakdown)
        .innerJoin(budgetForecasts, eq(budgetForecasts.costBreakdownId, costBreakdown.id))
        .where(eq(budgetForecasts.forecastVersionId, version[0].id))
      
      return data.map(row => ({
        ...row,
        budgetCost: Number(row.budgetCost),
        forecastedCost: Number(row.forecastedCost),
      }))
    })
