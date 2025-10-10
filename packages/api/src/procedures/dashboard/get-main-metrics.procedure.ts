// packages/api/src/procedures/dashboard/get-main-metrics.procedure.ts

import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { count, sum, eq, isNull } from 'drizzle-orm';
import { poLineItems, poMappings, projects, costBreakdown } from '@cost-mgmt/db';
import { TRPCError } from '@trpc/server';

/**
 * Get Main Dashboard Metrics
 * Returns KPI card metrics for the main dashboard
 * - Unmapped POs count
 * - Total PO value
 * - Active projects count
 * - Budget variance percentage
 * Used by: main-dashboard-cell (KPI cards section)
 */
export const getMainMetrics = publicProcedure
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
          
          // Query 4: Total budget (SUM budget_cost)
          ctx.db
            .select({ total: sum(costBreakdown.budgetCost) })
            .from(costBreakdown),
          
          // Query 5: Total actual spend (SUM mapped_amount)
          ctx.db
            .select({ total: sum(poMappings.mappedAmount) })
            .from(poMappings),
        ]);
      
      // Extract values with null safety
      const unmappedPOs = unmappedResult[0]?.count || 0;
      const totalPOValue = Number(poValueResult[0]?.total || 0);
      const activeProjects = projectsResult[0]?.count || 0;
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
        message: 'Failed to fetch main metrics. Please try again.',
        cause: error,
      });
    }
  });

// File size: 95 lines ✅ (well under 200-line limit)
