import { z } from 'zod'
import { publicProcedure } from '../../trpc'
import { costBreakdown, forecastVersions, budgetForecasts } from '@cost-mgmt/db'
import { eq, desc, and } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'

export const getForecastData = publicProcedure
  .input(z.object({
    projectId: z.string().uuid(),
    versionNumber: z.union([
      z.number().int().min(0),  // Allow 0 for baseline
      z.literal('latest')
    ]),
  }))
  .query(async ({ input, ctx }) => {
    // Step 1: Resolve version number
    let targetVersionNumber: number
    
    if (input.versionNumber === 'latest') {
      const latestVersion = await ctx.db
        .select({ versionNumber: forecastVersions.versionNumber })
        .from(forecastVersions)
        .where(eq(forecastVersions.projectId, input.projectId))
        .orderBy(desc(forecastVersions.versionNumber))
        .limit(1)
      
      if (!latestVersion[0]) {
        // No versions exist, return base cost breakdown as v0
        targetVersionNumber = 0
      } else {
        targetVersionNumber = latestVersion[0].versionNumber
      }
    } else {
      targetVersionNumber = input.versionNumber
    }
    
    // Step 2: Handle version 0 (baseline budget)
    if (targetVersionNumber === 0) {
      // CRITICAL: Check if v0 exists in forecast_versions first
      const v0Version = await ctx.db
        .select({ id: forecastVersions.id })
        .from(forecastVersions)
        .where(and(
          eq(forecastVersions.projectId, input.projectId),
          eq(forecastVersions.versionNumber, 0)
        ))
        .limit(1)
      
      if (v0Version[0]) {
        // Version 0 exists, query budget_forecasts
        const forecastData = await ctx.db
          .select({
            id: costBreakdown.id,
            projectId: costBreakdown.projectId,
            subBusinessLine: costBreakdown.subBusinessLine,
            costLine: costBreakdown.costLine,
            spendType: costBreakdown.spendType,
            spendSubCategory: costBreakdown.spendSubCategory,
            budgetCost: budgetForecasts.forecastedCost,  // Use forecasted value as budget
          })
          .from(budgetForecasts)
          .innerJoin(costBreakdown, eq(budgetForecasts.costBreakdownId, costBreakdown.id))
          .where(eq(budgetForecasts.forecastVersionId, v0Version[0].id))
        
        return forecastData.map(row => ({
          ...row,
          budgetCost: Number(row.budgetCost),
        }))
      } else {
        // No v0 in forecast_versions, return raw cost_breakdown
        const baseData = await ctx.db
          .select()
          .from(costBreakdown)
          .where(eq(costBreakdown.projectId, input.projectId))
        
        return baseData.map(row => ({
          ...row,
          budgetCost: Number(row.budgetCost),
        }))
      }
    }
    
    // Step 3: Handle version 1+ (forecasted data)
    const version = await ctx.db
      .select({ id: forecastVersions.id })
      .from(forecastVersions)
      .where(and(
        eq(forecastVersions.projectId, input.projectId),
        eq(forecastVersions.versionNumber, targetVersionNumber)
      ))
      .limit(1)
    
    if (!version[0]) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `Forecast version ${targetVersionNumber} not found`,
      })
    }
    
    // Query forecast data with cost breakdown join
    const data = await ctx.db
      .select({
        id: costBreakdown.id,
        projectId: costBreakdown.projectId,
        subBusinessLine: costBreakdown.subBusinessLine,
        costLine: costBreakdown.costLine,
        spendType: costBreakdown.spendType,
        spendSubCategory: costBreakdown.spendSubCategory,
        budgetCost: budgetForecasts.forecastedCost,
      })
      .from(budgetForecasts)
      .innerJoin(costBreakdown, eq(budgetForecasts.costBreakdownId, costBreakdown.id))
      .where(eq(budgetForecasts.forecastVersionId, version[0].id))
    
    return data.map(row => ({
      ...row,
      budgetCost: Number(row.budgetCost),
    }))
  })
