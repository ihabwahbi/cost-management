// packages/api/src/procedures/dashboard/get-kpi-metrics.procedure.ts

import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { eq, sum, sql, and } from 'drizzle-orm';
import { costBreakdown, poMappings, budgetForecasts, forecastVersions } from '@cost-mgmt/db';
import { TRPCError } from '@trpc/server';

/**
 * Get KPI Metrics for a project
 * Returns budget total, committed amount, and variance
 * Used by: kpi-card Cell
 */
export const getKPIMetrics = publicProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        // Get latest forecast version
        const maxVersionResult = await ctx.db
          .select({ maxVersion: sql<number>`MAX(${forecastVersions.versionNumber})` })
          .from(forecastVersions)
          .where(eq(forecastVersions.projectId, input.projectId));

        const latestVersion = maxVersionResult[0]?.maxVersion ?? 0;

        // Calculate total budget from latest forecast version (not baseline)
        const budgetResult = await ctx.db
          .select({ total: sum(budgetForecasts.forecastedCost) })
          .from(budgetForecasts)
          .innerJoin(forecastVersions, eq(budgetForecasts.forecastVersionId, forecastVersions.id))
          .innerJoin(costBreakdown, eq(budgetForecasts.costBreakdownId, costBreakdown.id))
          .where(and(
            eq(costBreakdown.projectId, input.projectId),
            eq(forecastVersions.versionNumber, latestVersion)
          ));

        const budgetTotal = Number(budgetResult[0]?.total || 0);

        // Calculate committed amount from PO mappings
        // Join po_mappings with cost_breakdown to filter by projectId
        const committedResult = await ctx.db
          .select({ total: sum(poMappings.mappedAmount) })
          .from(poMappings)
          .innerJoin(costBreakdown, eq(poMappings.costBreakdownId, costBreakdown.id))
          .where(eq(costBreakdown.projectId, input.projectId));

        const committed = Number(committedResult[0]?.total || 0);

        // Calculate variance
        const variance = budgetTotal - committed;
        const variancePercent = budgetTotal > 0 ? (variance / budgetTotal) * 100 : 0;

        return {
          budgetTotal,
          committed,
          variance,
          variancePercent,
        };
      } catch (error) {
        console.error('Failed to fetch KPI metrics:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch KPI metrics. Please try again.',
          cause: error,
        });
      }
    });

// File size: 74 lines ✅ (well under 200-line limit)
