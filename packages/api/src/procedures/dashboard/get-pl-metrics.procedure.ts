import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { eq, sql, inArray, and } from 'drizzle-orm';
import { costBreakdown, poMappings, poLineItems, budgetForecasts, forecastVersions } from '@cost-mgmt/db';
import { TRPCError } from '@trpc/server';
import { splitMappedAmount } from './helpers/split-mapped-amount.helper';
import { FALLBACK_INVOICE_RATIO } from './helpers/constants';

/**
 * Get P&L Metrics for PLCommandCenter
 * Used by: pl-command-center Cell
 */
export const getPLMetrics = publicProcedure
  .input(
    z.object({
      projectId: z.string().uuid(),
      filters: z
        .object({
          costLine: z.string().optional(),
          spendType: z.string().optional(),
        })
        .optional(),
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

      // Get total budget from latest forecast version (not baseline)
      const budgetData = await ctx.db
        .select({ 
          id: costBreakdown.id,
          forecastedCost: budgetForecasts.forecastedCost 
        })
        .from(costBreakdown)
        .innerJoin(budgetForecasts, eq(budgetForecasts.costBreakdownId, costBreakdown.id))
        .innerJoin(forecastVersions, eq(budgetForecasts.forecastVersionId, forecastVersions.id))
        .where(and(
          eq(costBreakdown.projectId, input.projectId),
          eq(forecastVersions.versionNumber, latestVersion)
        ));

      const totalBudget = budgetData.reduce((sum, item) => sum + Number(item.forecastedCost || 0), 0);

      if (budgetData.length === 0) {
        return {
          totalBudget: 0,
          totalCommitted: 0,
          actualPLImpact: 0,
          futurePLImpact: 0,
          plGap: 0,
        };
      }

      const costBreakdownIds = budgetData.map(b => b.id);

      // Get PO mappings with line items
      const mappingsData = await ctx.db
        .select({
          mappedAmount: poMappings.mappedAmount,
          lineValue: poLineItems.lineValue,
          invoicedValueUsd: poLineItems.invoicedValueUsd,
        })
        .from(poMappings)
        .leftJoin(poLineItems, eq(poMappings.poLineItemId, poLineItems.id))
        .where(inArray(poMappings.costBreakdownId, costBreakdownIds));

      let totalCommitted = 0;
      let actualPLImpact = 0;
      let futurePLImpact = 0;

      mappingsData.forEach((mapping) => {
        const mappedAmount = Number(mapping.mappedAmount || 0);
        totalCommitted += mappedAmount;

        if (!mapping.lineValue) {
          // No line item data - use fallback ratio
          const inferredActual = mappedAmount * FALLBACK_INVOICE_RATIO;
          actualPLImpact += inferredActual;
          futurePLImpact += Math.max(mappedAmount - inferredActual, 0);
        } else {
          const { actual, future } = splitMappedAmount(mappedAmount, mapping);
          actualPLImpact += actual;
          futurePLImpact += future;
        }
      });

      return {
        totalBudget,
        totalCommitted,
        actualPLImpact,
        futurePLImpact,
        plGap: totalCommitted - actualPLImpact,
      };
    } catch (error) {
      console.error('Failed to fetch P&L metrics:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch P&L metrics. Please try again.',
        cause: error,
      });
    }
  });
