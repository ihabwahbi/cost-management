import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { eq, sum } from 'drizzle-orm';
import { costBreakdown, poMappings } from '@cost-mgmt/db';
import { TRPCError } from '@trpc/server';

/**
 * Dashboard Router
 * Procedures for dashboard KPI metrics and visualizations
 */
export const dashboardRouter = router({
  /**
   * Get KPI Metrics for a project
   * Returns budget total, committed amount, and variance
   */
  getKPIMetrics: publicProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        // Calculate total budget from cost breakdown
        const budgetResult = await ctx.db
          .select({ total: sum(costBreakdown.budgetCost) })
          .from(costBreakdown)
          .where(eq(costBreakdown.projectId, input.projectId));

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
        // Log error for debugging
        console.error('Failed to fetch KPI metrics:', error);

        // Return user-friendly tRPC error
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch KPI metrics. Please try again.',
          cause: error,
        });
      }
    }),
});
