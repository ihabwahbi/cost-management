import { z } from 'zod'
import { publicProcedure } from '../../trpc'
import { forecastVersions, budgetForecasts } from '@cost-mgmt/db'
import { eq, and } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'

export const deleteForecastVersion = publicProcedure
  .input(z.object({
    projectId: z.string().uuid(),
    versionNumber: z.number().int().min(1), // Cannot delete version 0
  }))
  .mutation(async ({ input, ctx }) => {
    return await ctx.db.transaction(async (tx) => {
      // Find version to delete
      const version = await tx
        .select()
        .from(forecastVersions)
        .where(and(
          eq(forecastVersions.projectId, input.projectId),
          eq(forecastVersions.versionNumber, input.versionNumber)
        ))
        .limit(1)
      
      if (!version[0]) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Version ${input.versionNumber} not found`,
        })
      }
      
      // Delete associated budget forecasts first (foreign key constraint)
      await tx
        .delete(budgetForecasts)
        .where(eq(budgetForecasts.forecastVersionId, version[0].id))
      
      // Delete forecast version
      await tx
        .delete(forecastVersions)
        .where(eq(forecastVersions.id, version[0].id))
      
      return {
        deleted: true,
        versionNumber: input.versionNumber,
        versionId: version[0].id,
      }
    })
  })
