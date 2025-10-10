import { z } from 'zod'
import { publicProcedure } from '../../trpc'
import { poMappings, poLineItems, costBreakdown, budgetForecasts, forecastVersions } from '@cost-mgmt/db'
import { eq, sum, desc } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'

/**
 * Get PO summary for budget comparison (VERSION-AWARE)
 * 
 * CRITICAL FIX #1: Replaces broken Supabase query that queried non-existent fields
 * CRITICAL FIX #2: Now version-aware - queries latest forecast version budget
 * Uses proper Drizzle joins through foreign keys
 */
export const getPOSummary = publicProcedure
  .input(z.object({
    projectId: z.string().uuid()
  }))
  .query(async ({ ctx, input }) => {
    try {
      // Get all PO mappings for this project via proper joins
      const mappingData = await ctx.db
        .select({
          mappedAmount: poMappings.mappedAmount,
          lineValue: poLineItems.lineValue,
          invoicedValueUsd: poLineItems.invoicedValueUsd,
        })
        .from(poMappings)
        .innerJoin(poLineItems, eq(poLineItems.id, poMappings.poLineItemId))
        .innerJoin(costBreakdown, eq(costBreakdown.id, poMappings.costBreakdownId))
        .where(eq(costBreakdown.projectId, input.projectId))
      
      // Calculate aggregates with null safety
      let total = 0
      let invoiced = 0
      let open = 0
      
      mappingData.forEach((mapping) => {
        const lineValue = Number(mapping.lineValue || 0)
        const invoicedValue = Number(mapping.invoicedValueUsd || 0)
        const mappedAmount = Number(mapping.mappedAmount || 0)
        
        // Calculate ratio of mapped amount to line value
        const mappedRatio = lineValue > 0 ? mappedAmount / lineValue : 1
        
        total += lineValue * mappedRatio
        invoiced += invoicedValue * mappedRatio
        open += (lineValue - invoicedValue) * mappedRatio
      })
      
      // Get total budget for this project (VERSION-AWARE)
      // Query latest forecast version to get current budget
      const versions = await ctx.db
        .select()
        .from(forecastVersions)
        .where(eq(forecastVersions.projectId, input.projectId))
        .orderBy(desc(forecastVersions.versionNumber))
        .limit(1)
      
      let budget = 0
      
      if (versions.length > 0) {
        // Query budget_forecasts for the latest version
        const budgetData = await ctx.db
          .select({ total: sum(budgetForecasts.forecastedCost) })
          .from(budgetForecasts)
          .innerJoin(costBreakdown, eq(costBreakdown.id, budgetForecasts.costBreakdownId))
          .where(eq(budgetForecasts.forecastVersionId, versions[0].id))
        
        budget = Number(budgetData[0]?.total || 0)
      } else {
        // No forecast versions - fall back to baseline cost_breakdown
        const budgetData = await ctx.db
          .select({ total: sum(costBreakdown.budgetCost) })
          .from(costBreakdown)
          .where(eq(costBreakdown.projectId, input.projectId))
        
        budget = Number(budgetData[0]?.total || 0)
      }
      
      return {
        total,
        invoiced,
        open,
        mappingCount: mappingData.length,
        budget
      }
    } catch (error) {
      console.error('[getPOSummary] Error:', error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch PO summary',
        cause: error
      })
    }
  })
