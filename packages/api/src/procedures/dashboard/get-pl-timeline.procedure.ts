import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { eq, inArray } from 'drizzle-orm';
import { costBreakdown, poMappings, poLineItems } from '@cost-mgmt/db';
import { TRPCError } from '@trpc/server';
import { splitMappedAmount, FALLBACK_INVOICE_RATIO } from '../../utils/pl-calculations';

/**
 * Get P&L Timeline (monthly breakdown)
 * Returns historical and projected P&L by month
 * Used by: pl-command-center Cell
 */
export const getPLTimeline = publicProcedure
  .input(
    z.object({
      projectId: z.string().uuid(),
      dateRange: z.object({
        // CRITICAL FIX: Use z.string().transform() instead of z.date()
        // HTTP serialization requires strings, not Date objects
        from: z.string().transform(val => new Date(val)),
        to: z.string().transform(val => new Date(val)),
      }),
    })
  )
  .query(async ({ input, ctx }) => {
    try {
      // Get cost breakdown IDs
      const budgetData = await ctx.db
        .select({ id: costBreakdown.id })
        .from(costBreakdown)
        .where(eq(costBreakdown.projectId, input.projectId));

      if (budgetData.length === 0) {
        return [];
      }

      const costBreakdownIds = budgetData.map(b => b.id);

      // Get mappings with line items
      const mappingsData = await ctx.db
        .select({
          mappedAmount: poMappings.mappedAmount,
          lineValue: poLineItems.lineValue,
          invoicedValueUsd: poLineItems.invoicedValueUsd,
          invoicedQuantity: poLineItems.invoicedQuantity,
          invoiceDate: poLineItems.invoiceDate,
          supplierPromiseDate: poLineItems.supplierPromiseDate,
          createdAt: poLineItems.createdAt,
        })
        .from(poMappings)
        .leftJoin(poLineItems, eq(poMappings.poLineItemId, poLineItems.id))
        .where(inArray(poMappings.costBreakdownId, costBreakdownIds));

      // Group by month
      const monthlyData = new Map<string, { actual: number; projected: number }>();

      const addToMonth = (date: Date | null, key: 'actual' | 'projected', amount: number) => {
        if (!date || amount <= 0) return;
        if (date < input.dateRange.from || date > input.dateRange.to) return;
        
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const current = monthlyData.get(monthKey) || { actual: 0, projected: 0 };
        current[key] += amount;
        monthlyData.set(monthKey, current);
      };

      mappingsData.forEach((mapping) => {
        const mappedAmount = Number(mapping.mappedAmount || 0);

        if (!mapping.lineValue) {
          // No line item - use fallback
          const inferredActual = mappedAmount * FALLBACK_INVOICE_RATIO;
          addToMonth(input.dateRange.from, 'actual', inferredActual);
          addToMonth(input.dateRange.to, 'projected', mappedAmount - inferredActual);
        } else {
          const { actual, future } = splitMappedAmount(mappedAmount, {
            lineValue: Number(mapping.lineValue),
            invoicedValueUsd: Number(mapping.invoicedValueUsd),
            invoicedQuantity: Number(mapping.invoicedQuantity),
          });
          
          const invoiceDate = mapping.invoiceDate 
            ? new Date(mapping.invoiceDate) 
            : mapping.createdAt 
              ? new Date(mapping.createdAt) 
              : null;
          
          const promiseDate = mapping.supplierPromiseDate 
            ? new Date(mapping.supplierPromiseDate) 
            : null;

          addToMonth(invoiceDate, 'actual', actual);
          addToMonth(promiseDate || invoiceDate, 'projected', future);
        }
      });

      // Convert to sorted timeline
      const timeline = Array.from(monthlyData.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([monthKey, data]) => {
          const [year, month] = monthKey.split('-');
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          
          return {
            month: monthNames[parseInt(month) - 1],
            year: parseInt(year),
            actualPL: data.actual,
            projectedPL: data.projected,
            cumulative: 0, // Will calculate after
          };
        });

      // Calculate cumulative
      let cumulative = 0;
      timeline.forEach(entry => {
        cumulative += entry.actualPL + entry.projectedPL;
        entry.cumulative = cumulative;
      });

      return timeline;
    } catch (error) {
      console.error('Failed to fetch P&L timeline:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch P&L timeline. Please try again.',
        cause: error,
      });
    }
  });
