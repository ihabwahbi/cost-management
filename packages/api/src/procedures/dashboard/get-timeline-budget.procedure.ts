import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { eq, sum, sql, and } from 'drizzle-orm';
import { budgetForecasts, forecastVersions, costBreakdown, poLineItems, poMappings } from '@cost-mgmt/db';
import { TRPCError } from '@trpc/server';
import { generatePLTimeline } from './helpers/generate-pl-timeline.helper';

/**
 * Get Timeline Budget
 * Returns monthly budget timeline for visualization
 * Used by: budget-timeline-chart Cell
 */
export const getTimelineBudget = publicProcedure
  .input(
    z.object({
      projectId: z.string().uuid(),
      filters: z
        .object({
          costLine: z.string().optional(),
          spendType: z.string().optional(),
          dateRange: z
            .object({
              from: z.string().transform((val) => new Date(val)),
              to: z.string().transform((val) => new Date(val)),
            })
            .optional(),
        })
        .optional(),
    })
  )
  .query(async ({ input, ctx }) => {
    try {
      // Validate projectId
      if (!input.projectId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Project ID is required',
        });
      }

      // 1. Get latest budget forecast for project
      // Find max version number for this project
      const maxVersionResult = await ctx.db
        .select({ maxVersion: sql<number>`MAX(${forecastVersions.versionNumber})` })
        .from(forecastVersions)
        .where(eq(forecastVersions.projectId, input.projectId));

      const latestVersion = maxVersionResult[0]?.maxVersion ?? 0;

      // Get budget for latest version
      const budgetResult = await ctx.db
        .select({
          totalBudget: sum(budgetForecasts.forecastedCost),
        })
        .from(budgetForecasts)
        .innerJoin(forecastVersions, eq(budgetForecasts.forecastVersionId, forecastVersions.id))
        .innerJoin(costBreakdown, eq(budgetForecasts.costBreakdownId, costBreakdown.id))
        .where(
          and(
            eq(costBreakdown.projectId, input.projectId),
            eq(forecastVersions.versionNumber, latestVersion)
          )
        );

      const totalBudget = Number(budgetResult[0]?.totalBudget || 0);

      // 2. Get invoice timeline (cumulative actuals)
      const invoiceResult = await ctx.db
        .select({
          month: sql<Date>`DATE_TRUNC('month', ${poLineItems.invoiceDate})`,
          invoiced: sum(poLineItems.invoicedValueUsd),
        })
        .from(poLineItems)
        .innerJoin(poMappings, eq(poLineItems.id, poMappings.poLineItemId))
        .innerJoin(costBreakdown, eq(poMappings.costBreakdownId, costBreakdown.id))
        .where(
          and(
            eq(costBreakdown.projectId, input.projectId),
            sql`${poLineItems.invoiceDate} IS NOT NULL`
          )
        )
        .groupBy(sql`DATE_TRUNC('month', ${poLineItems.invoiceDate})`)
        .orderBy(sql`DATE_TRUNC('month', ${poLineItems.invoiceDate})`);

      // 3. Get supplier promise timeline (future P&L)
      const promiseResult = await ctx.db
        .select({
          month: sql<Date>`DATE_TRUNC('month', ${poLineItems.supplierPromiseDate})`,
          future: sum(
            sql<number>`${poLineItems.lineValue} - COALESCE(${poLineItems.invoicedValueUsd}, 0)`
          ),
        })
        .from(poLineItems)
        .innerJoin(poMappings, eq(poLineItems.id, poMappings.poLineItemId))
        .innerJoin(costBreakdown, eq(poMappings.costBreakdownId, costBreakdown.id))
        .where(
          and(
            eq(costBreakdown.projectId, input.projectId),
            sql`${poLineItems.supplierPromiseDate} IS NOT NULL`,
            sql`${poLineItems.supplierPromiseDate} >= CURRENT_DATE`
          )
        )
        .groupBy(sql`DATE_TRUNC('month', ${poLineItems.supplierPromiseDate})`)
        .orderBy(sql`DATE_TRUNC('month', ${poLineItems.supplierPromiseDate})`);

      // 4. Generate P&L timeline
      return generatePLTimeline(totalBudget, invoiceResult, promiseResult);
    } catch (error) {
      // Handle known tRPC errors
      if (error instanceof TRPCError) {
        throw error;
      }

      // Handle database errors
      console.error('Failed to fetch timeline budget:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch timeline data',
        cause: error,
      });
    }
  });
