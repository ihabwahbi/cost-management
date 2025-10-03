import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { eq, sum, sql, inArray, and, desc, count, isNull } from 'drizzle-orm';
import { costBreakdown, poMappings, poLineItems, budgetForecasts, forecastVersions, projects, pos } from '@cost-mgmt/db';
import { TRPCError } from '@trpc/server';

// Import helpers from dedicated files
import { getRelativeTime } from '../procedures/dashboard/helpers/get-relative-time.helper';
import { splitMappedAmount } from '../procedures/dashboard/helpers/split-mapped-amount.helper';
import { generatePLTimeline } from '../procedures/dashboard/helpers/generate-pl-timeline.helper';
import { FALLBACK_INVOICE_RATIO } from '../procedures/dashboard/helpers/constants';

// Import specialized procedures
import { getKPIMetrics } from '../procedures/dashboard/get-kpi-metrics.procedure';
import { getPLMetrics } from '../procedures/dashboard/get-pl-metrics.procedure';
import { getPLTimeline } from '../procedures/dashboard/get-pl-timeline.procedure';
import { getPromiseDates } from '../procedures/dashboard/get-promise-dates.procedure';
import { getTimelineBudget } from '../procedures/dashboard/get-timeline-budget.procedure';
import { getFinancialControlMetrics } from '../procedures/dashboard/get-financial-control-metrics.procedure';

/**
 * Dashboard Router
 * Procedures for dashboard KPI metrics and visualizations
 */

export const dashboardRouter = router({
  // Specialized procedures
  getKPIMetrics,
  getPLMetrics,
  getPLTimeline,
  getPromiseDates,
  getTimelineBudget,
  getFinancialControlMetrics,
  
  // Old procedures (still in this file - to be refactored)
  /**
   * Get Main Dashboard Metrics (Global - no project filter)
   * Consolidates 5 queries for all KPI cards on main dashboard
   * Returns: unmappedPOs, totalPOValue, activeProjects, budgetVariance, totalBudget, totalActual
   */
  getMainMetrics: publicProcedure
    .input(z.object({}))
    .output(z.object({
      unmappedPOs: z.number(),
      totalPOValue: z.number(),
      activeProjects: z.number(),
      budgetVariance: z.number(),
      totalBudget: z.number(),
      totalActual: z.number(),
    }))
    .query(async ({ ctx }) => {
      try {
        // Execute all 5 queries in parallel with Promise.all()
        const [unmappedResult, poValueResult, projectsResult, budgetResult, actualResult] = 
          await Promise.all([
            // Query 1: Unmapped POs (LEFT JOIN to find nulls)
            ctx.db
              .select({ count: count() })
              .from(poLineItems)
              .leftJoin(poMappings, eq(poLineItems.id, poMappings.poLineItemId))
              .where(isNull(poMappings.id)),
            
            // Query 2: Total PO value (SUM line_value)
            ctx.db
              .select({ total: sum(poLineItems.lineValue) })
              .from(poLineItems),
            
            // Query 3: Active projects count
            ctx.db
              .select({ count: count() })
              .from(projects),
            
            // Query 4: Total budget (SUM budget_cost from cost_breakdown)
            ctx.db
              .select({ total: sum(costBreakdown.budgetCost) })
              .from(costBreakdown),
            
            // Query 5: Total actual spend (SUM mapped_amount)
            ctx.db
              .select({ total: sum(poMappings.mappedAmount) })
              .from(poMappings),
          ]);
        
        // Extract values with null safety
        const unmappedPOs = Number(unmappedResult[0]?.count || 0);
        const totalPOValue = Number(poValueResult[0]?.total || 0);
        const activeProjects = Number(projectsResult[0]?.count || 0);
        const totalBudget = Number(budgetResult[0]?.total || 0);
        const totalActual = Number(actualResult[0]?.total || 0);
        
        // Calculate variance with division-by-zero protection
        const budgetVariance = totalBudget > 0 
          ? ((totalActual - totalBudget) / totalBudget) * 100 
          : 0;
        
        return {
          unmappedPOs,
          totalPOValue,
          activeProjects,
          budgetVariance,
          totalBudget,
          totalActual,
        };
      } catch (error) {
        console.error('[getMainMetrics] Failed:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch main dashboard metrics. Please try again.',
          cause: error,
        });
      }
    }),

  /**
   * Get Recent Activity (Global - no project filter)
   * Returns recent PO mappings with full relationship details (quad join)
   * Formats activity with relative time and descriptive text
   */
  getRecentActivity: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(5),
    }))
    .output(z.object({
      activities: z.array(z.object({
        id: z.string().uuid(),
        type: z.literal('po_mapped'),
        description: z.string(),
        time: z.string(),
        timestamp: z.string(),
        poNumber: z.string(),
        projectName: z.string(),
        mappedAmount: z.number(),
      })),
    }))
    .query(async ({ input, ctx }) => {
      try {
        const result = await ctx.db
          .select({
            id: poMappings.id,
            poNumber: pos.poNumber,
            projectName: projects.name,
            mappedAmount: poMappings.mappedAmount,
            createdAt: poMappings.createdAt,
            mappedAt: poMappings.mappedAt,
          })
          .from(poMappings)
          .innerJoin(poLineItems, eq(poMappings.poLineItemId, poLineItems.id))
          .innerJoin(pos, eq(poLineItems.poId, pos.id))
          .innerJoin(costBreakdown, eq(poMappings.costBreakdownId, costBreakdown.id))
          .innerJoin(projects, eq(costBreakdown.projectId, projects.id))
          .orderBy(desc(poMappings.createdAt))
          .limit(input.limit);
        
        const activities = result.map(row => {
          const timestamp = new Date(row.createdAt || row.mappedAt || new Date());
          return {
            id: row.id,
            type: 'po_mapped' as const,
            description: `PO ${row.poNumber} mapped to ${row.projectName}`,
            time: getRelativeTime(timestamp),
            timestamp: timestamp.toISOString(),
            poNumber: row.poNumber,
            projectName: row.projectName,
            mappedAmount: Number(row.mappedAmount || 0),
          };
        });
        
        return { activities };
      } catch (error) {
        console.error('[getRecentActivity] Failed:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch recent activity. Please try again.',
          cause: error,
        });
      }
    }),

  /**
   * Get KPI Metrics for a project
   * Returns budget total, committed amount, and variance
   */




});
