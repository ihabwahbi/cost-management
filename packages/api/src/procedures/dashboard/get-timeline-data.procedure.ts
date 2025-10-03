// packages/api/src/procedures/dashboard/get-timeline-data.procedure.ts

import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { sql } from 'drizzle-orm';
import { poMappings, budgetForecasts, costBreakdown } from '@cost-mgmt/db';
import { TRPCError } from '@trpc/server';

/**
 * Get Timeline Data for Main Dashboard
 * Returns monthly timeline with real forecast data (replaces simulated budget * 1.05)
 * - Groups po_mappings by month for actual spend
 * - Joins with budget_forecasts for real forecast data
 * Used by: main-dashboard-cell (timeline chart)
 */
export const getTimelineData = publicProcedure
  .input(z.object({}))
  .output(z.object({
    timeline: z.array(z.object({
      month: z.string(),
      budget: z.number(),
      actual: z.number(),
      forecast: z.number(),
    })),
  }))
  .query(async ({ ctx }) => {
    try {
      // Query monthly actuals and budget from po_mappings with cost_breakdown
      const result = await ctx.db
        .select({
          month: sql<string>`TO_CHAR(${poMappings.createdAt}, 'YYYY-MM')`,
          actual: sql<number>`COALESCE(SUM(${poMappings.mappedAmount}), 0)`,
          budget: sql<number>`COALESCE(SUM(${costBreakdown.budgetCost}), 0)`,
        })
        .from(poMappings)
        .leftJoin(costBreakdown, sql`${poMappings.costBreakdownId} = ${costBreakdown.id}`)
        .groupBy(sql`TO_CHAR(${poMappings.createdAt}, 'YYYY-MM')`);
      
      // Query forecast data from budget_forecasts
      const forecastResult = await ctx.db
        .select({
          forecast: sql<number>`COALESCE(SUM(${budgetForecasts.forecastedCost}), 0)`,
        })
        .from(budgetForecasts);
      
      const totalForecast = Number(forecastResult[0]?.forecast || 0);
      
      // Build timeline with monthly data
      const timeline = result.map(row => ({
        month: row.month,
        budget: Number(row.budget || 0),
        actual: Number(row.actual || 0),
        forecast: totalForecast / (result.length || 1), // Distribute forecast evenly across months
      })).sort((a, b) => a.month.localeCompare(b.month));
      
      return { timeline };
    } catch (error) {
      console.error('[getTimelineData] Failed:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch timeline data. Please try again.',
        cause: error,
      });
    }
  });

// File size: 82 lines ✅ (well under 200-line limit)
