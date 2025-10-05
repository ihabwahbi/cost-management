import { z } from 'zod'
import { publicProcedure } from '../../trpc'
import { db, costBreakdown, budgetForecasts, forecastVersions } from '@cost-mgmt/db'
import { eq, desc, and, asc } from 'drizzle-orm'

/**
 * Get cost breakdown entries for a specific version
 * Supports: base data (v0), latest version, or specific version number
 * 
 * Version Resolution:
 * - "latest" → Query highest version_number from forecast_versions
 * - 0 → Query base cost_breakdown table
 * - N → Query specific forecast version N
 */
export const getCostBreakdownByVersion = publicProcedure
  .input(z.object({
    projectId: z.string().uuid(),
    versionNumber: z.union([
      z.literal('latest'),
      z.number().int().min(0)
    ]).optional().default('latest'),
    orderBy: z.enum(['costLine', 'budgetCost', 'createdAt']).optional().default('costLine')
  }))
  .query(async ({ input }) => {
    const { projectId, versionNumber, orderBy } = input

    // Determine order column
    const getOrderColumn = (table: any) => {
      return orderBy === 'budgetCost' ? table.budgetCost :
             orderBy === 'createdAt' ? table.createdAt :
             table.costLine
    }

    // Get latest or specific version (including version 0)
    let targetVersion

    if (versionNumber === 'latest') {
      // Find highest version number
      const versions = await db
        .select()
        .from(forecastVersions)
        .where(eq(forecastVersions.projectId, projectId))
        .orderBy(desc(forecastVersions.versionNumber))
        .limit(1)
      
      targetVersion = versions[0]
      
      // If no versions exist, fall back to base data
      if (!targetVersion) {
        const baseData = await db
          .select()
          .from(costBreakdown)
          .where(eq(costBreakdown.projectId, projectId))
          .orderBy(asc(getOrderColumn(costBreakdown)))
        
        return baseData.map(item => ({
          ...item,
          budgetCost: Number(item.budgetCost),
          isBaseVersion: true,
          versionNumber: 0
        }))
      }
    } else {
      // Get specific version
      const versions = await db
        .select()
        .from(forecastVersions)
        .where(and(
          eq(forecastVersions.projectId, projectId),
          eq(forecastVersions.versionNumber, versionNumber)
        ))
        .limit(1)
      
      targetVersion = versions[0]
      
      if (!targetVersion) {
        throw new Error(`Version ${versionNumber} not found for project ${projectId}`)
      }
    }

    // Query forecast data for the target version
    const forecastData = await db
      .select({
        forecastId: budgetForecasts.id,
        forecastedCost: budgetForecasts.forecastedCost,
        costBreakdown: costBreakdown
      })
      .from(budgetForecasts)
      .innerJoin(
        costBreakdown,
        eq(budgetForecasts.costBreakdownId, costBreakdown.id)
      )
      .where(eq(budgetForecasts.forecastVersionId, targetVersion.id))

    // Sort in memory (since we're selecting from joined tables)
    const sortedData = forecastData.sort((a, b) => {
      if (orderBy === 'budgetCost') {
        return Number(a.forecastedCost) - Number(b.forecastedCost)
      } else if (orderBy === 'createdAt') {
        return new Date(a.costBreakdown.createdAt || 0).getTime() - 
               new Date(b.costBreakdown.createdAt || 0).getTime()
      } else {
        return (a.costBreakdown.costLine || '').localeCompare(b.costBreakdown.costLine || '')
      }
    })

    // Transform to match expected structure
    return sortedData.map(item => ({
      ...item.costBreakdown,
      budgetCost: Number(item.forecastedCost), // Use forecasted value
      forecastId: item.forecastId,
      originalBudgetCost: Number(item.costBreakdown.budgetCost), // Keep original for reference
      versionNumber: targetVersion.versionNumber,
      isBaseVersion: false
    }))
  })
