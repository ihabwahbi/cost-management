import { z } from 'zod'
import { publicProcedure } from '../../trpc'
import { costBreakdown, forecastVersions, budgetForecasts } from '@cost-mgmt/db'
import { eq, and } from 'drizzle-orm'

export const getComparisonData = publicProcedure
  .input(z.object({
    projectId: z.string().uuid(),
    version1: z.number().int().min(0),
    version2: z.number().int().min(0),
  }))
  .query(async ({ input, ctx }) => {
    // Helper to load version forecast data
    const loadVersionData = async (versionNumber: number) => {
      // Check if forecast version exists
      const version = await ctx.db
        .select({ id: forecastVersions.id })
        .from(forecastVersions)
        .where(and(
          eq(forecastVersions.projectId, input.projectId),
          eq(forecastVersions.versionNumber, versionNumber)
        ))
        .limit(1)
      
      if (version[0]) {
        // Load budget forecasts for this version
        const forecastData = await ctx.db
          .select({
            id: budgetForecasts.id,
            forecastVersionId: budgetForecasts.forecastVersionId,
            costBreakdownId: budgetForecasts.costBreakdownId,
            forecastedCost: budgetForecasts.forecastedCost,
          })
          .from(budgetForecasts)
          .where(eq(budgetForecasts.forecastVersionId, version[0].id))
        
        return forecastData.map(f => ({
          ...f,
          forecastedCost: Number(f.forecastedCost),
        }))
      } else if (versionNumber === 0) {
        // Special handling for v0 if not in forecast_versions
        const baseData = await ctx.db
          .select()
          .from(costBreakdown)
          .where(eq(costBreakdown.projectId, input.projectId))
        
        // Transform to match forecast structure
        return baseData.map(cost => ({
          id: `v0_${cost.id}`,
          forecastVersionId: 'version_0',
          costBreakdownId: cost.id,
          forecastedCost: Number(cost.budgetCost),
        }))
      }
      
      return []
    }
    
    // Load both versions in parallel
    const [v1Data, v2Data] = await Promise.all([
      loadVersionData(input.version1),
      loadVersionData(input.version2),
    ])
    
    // Load original cost breakdown for context
    const originalItems = await ctx.db
      .select()
      .from(costBreakdown)
      .where(eq(costBreakdown.projectId, input.projectId))
    
    return {
      version1: {
        versionNumber: input.version1,
        items: v1Data,
      },
      version2: {
        versionNumber: input.version2,
        items: v2Data,
      },
      originalCostBreakdown: originalItems.map(item => ({
        ...item,
        budgetCost: Number(item.budgetCost),
      })),
    }
  })
