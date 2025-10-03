import { z } from 'zod'
import { publicProcedure } from '../../trpc'
import { costBreakdown, forecastVersions, budgetForecasts } from '@cost-mgmt/db'
import { eq, desc, and } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'

export const createForecastVersion = publicProcedure
  .input(z.object({
    projectId: z.string().uuid(),
    reason: z.string().min(10, "Reason must be at least 10 characters").max(500),
    changes: z.record(z.string().uuid(), z.number().min(0)),
    newEntries: z.array(z.object({
      subBusinessLine: z.string().min(1),
      costLine: z.string().min(1),
      spendType: z.string().min(1),
      spendSubCategory: z.string().min(1),
      budgetCost: z.number().min(0.01, "Budget cost must be greater than 0"),
    })).default([]),
  }))
  .mutation(async ({ input, ctx }) => {
      return await ctx.db.transaction(async (tx) => {
        // Step 1: Get next version number
        const latestVersion = await tx
          .select({ versionNumber: forecastVersions.versionNumber })
          .from(forecastVersions)
          .where(eq(forecastVersions.projectId, input.projectId))
          .orderBy(desc(forecastVersions.versionNumber))
          .limit(1)
        
        const nextVersion = (latestVersion[0]?.versionNumber || 0) + 1
        
        // Step 2: Create new cost_breakdown entries (if any)
        const newEntryIds: string[] = []
        for (const entry of input.newEntries) {
          const [created] = await tx.insert(costBreakdown).values({
            projectId: input.projectId,
            subBusinessLine: entry.subBusinessLine,
            costLine: entry.costLine,
            spendType: entry.spendType,
            spendSubCategory: entry.spendSubCategory,
            budgetCost: entry.budgetCost.toString(),
          }).returning({ id: costBreakdown.id })
          
          newEntryIds.push(created.id)
        }
        
        // Step 3: Create forecast version record
        const [version] = await tx.insert(forecastVersions).values({
          projectId: input.projectId,
          versionNumber: nextVersion,
          reasonForChange: input.reason,
          createdBy: 'system', // TODO: Get from auth context
        }).returning({ id: forecastVersions.id })
        
        // Step 4: Get all existing cost breakdowns
        const existingCosts = await tx
          .select()
          .from(costBreakdown)
          .where(eq(costBreakdown.projectId, input.projectId))
        
        // Step 5: Get previous forecast version's data (if exists) to use as base
        let previousForecastData: Record<string, number> = {}
        
        if (nextVersion > 1) {
          // Get the previous version ID first
          const [prevVersion] = await tx
            .select({ id: forecastVersions.id })
            .from(forecastVersions)
            .where(and(
              eq(forecastVersions.projectId, input.projectId),
              eq(forecastVersions.versionNumber, nextVersion - 1)
            ))
            .limit(1)
          
          if (prevVersion) {
            // Get the previous version's forecasted values
            const previousForecasts = await tx
              .select({
                costBreakdownId: budgetForecasts.costBreakdownId,
                forecastedCost: budgetForecasts.forecastedCost,
              })
              .from(budgetForecasts)
              .where(eq(budgetForecasts.forecastVersionId, prevVersion.id))
            
            // Build lookup map of previous forecast values
            previousForecastData = previousForecasts.reduce((acc: Record<string, number>, item) => {
              acc[item.costBreakdownId] = Number(item.forecastedCost)
              return acc
            }, {})
          }
        }
        
        // Step 6: Create budget_forecasts for all items
        const forecastsToCreate = existingCosts.map(cost => {
          // Priority: 1) User changes, 2) Previous forecast, 3) Baseline budget
          let forecastValue: number
          
          if (input.changes[cost.id] !== undefined) {
            // User explicitly changed this value
            forecastValue = input.changes[cost.id]
          } else if (previousForecastData[cost.id] !== undefined) {
            // Use previous forecast version's value (inherits from previous version)
            forecastValue = previousForecastData[cost.id]
          } else {
            // New item not in previous forecast, use baseline budget
            forecastValue = Number(cost.budgetCost)
          }
          
          return {
            forecastVersionId: version.id,
            costBreakdownId: cost.id,
            forecastedCost: forecastValue.toString(),
          }
        })
        
        await tx.insert(budgetForecasts).values(forecastsToCreate)
        
        return {
          versionId: version.id,
          versionNumber: nextVersion,
          entriesCreated: newEntryIds.length,
          forecastsCreated: forecastsToCreate.length,
        }
      })
    })
