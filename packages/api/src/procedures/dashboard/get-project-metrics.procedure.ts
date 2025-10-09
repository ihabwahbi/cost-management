import { z } from 'zod'
import { publicProcedure } from '../../trpc'
import { costBreakdown, poMappings, poLineItems } from '@cost-mgmt/db'
import { eq, inArray, and } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'
import { splitMappedAmount, normalizeLineItem, FALLBACK_INVOICE_RATIO } from '../../utils/pl-calculations'

export const getProjectMetrics = publicProcedure
  .input(z.object({
    projectId: z.string().uuid(),
    filters: z.object({
      costLine: z.string().optional(),
      spendType: z.string().optional(),
      dateRange: z.object({
        from: z.string().transform(val => new Date(val)),
        to: z.string().transform(val => new Date(val))
      }).optional()
    }).optional()
  }))
  .query(async ({ input, ctx }) => {
    const { projectId, filters } = input

    try {
      const conditions = [eq(costBreakdown.projectId, projectId)]
      if (filters?.costLine && filters.costLine !== 'all') {
        conditions.push(eq(costBreakdown.costLine, filters.costLine))
      }
      if (filters?.spendType && filters.spendType !== 'all') {
        conditions.push(eq(costBreakdown.spendType, filters.spendType))
      }

      const budgetData = await ctx.db
        .select({
          id: costBreakdown.id,
          budgetCost: costBreakdown.budgetCost,
          costLine: costBreakdown.costLine,
          spendType: costBreakdown.spendType
        })
        .from(costBreakdown)
        .where(and(...conditions))

      if (!budgetData || budgetData.length === 0) {
        return {
          totalBudget: 0,
          actualSpend: 0,
          variance: 0,
          variancePercent: 0,
          utilization: 0,
          invoicedAmount: 0,
          openOrders: 0,
          burnRate: 0,
          poCount: 0,
          lineItemCount: 0
        }
      }

      const totalBudget = budgetData.reduce((sum, item) => sum + (Number(item.budgetCost || 0)), 0)
      const budgetIds = budgetData.map(item => item.id)

      const mappingsData = await ctx.db
        .select({
          id: poMappings.id,
          mappedAmount: poMappings.mappedAmount,
          costBreakdownId: poMappings.costBreakdownId,
          poLineItemId: poMappings.poLineItemId
        })
        .from(poMappings)
        .where(inArray(poMappings.costBreakdownId, budgetIds))

      if (!mappingsData || mappingsData.length === 0) {
        return {
          totalBudget,
          actualSpend: 0,
          variance: totalBudget,
          variancePercent: 100,
          utilization: 0,
          invoicedAmount: 0,
          openOrders: 0,
          burnRate: 0,
          poCount: 0,
          lineItemCount: 0
        }
      }

      const actualSpend = mappingsData.reduce((sum, mapping) => sum + (Number(mapping.mappedAmount || 0)), 0)
      const lineItemIds = mappingsData.map(m => m.poLineItemId).filter((id): id is string => id !== null)

      let invoicedAmount = 0
      let openOrders = 0
      let poCount = 0
      let lineItemCount = 0

      if (lineItemIds.length > 0) {
        const lineItemsData = await ctx.db
          .select()
          .from(poLineItems)
          .where(inArray(poLineItems.id, lineItemIds))

        if (lineItemsData && lineItemsData.length > 0) {
          const lineItemMap = new Map<string, ReturnType<typeof normalizeLineItem>>()
          lineItemsData.forEach(item => {
            try {
              const normalized = normalizeLineItem(item)
              lineItemMap.set(normalized.id, normalized)
            } catch (error) {
              console.warn('Skipping malformed PO line item in metrics', error)
            }
          })

          mappingsData.forEach(mapping => {
            const amount = Number(mapping.mappedAmount || 0)
            const lineItem = mapping.poLineItemId 
              ? lineItemMap.get(mapping.poLineItemId) 
              : undefined

            if (!lineItem) {
              // Fall back to inferred actuals
              const inferredActual = amount * FALLBACK_INVOICE_RATIO
              invoicedAmount += inferredActual
              openOrders += Math.max(amount - inferredActual, 0)
              return
            }

            const { actual, future } = splitMappedAmount(amount, lineItem)
            invoicedAmount += actual
            openOrders += future
          })

          const uniquePOs = new Set(lineItemsData.map(item => item.poId))
          poCount = uniquePOs.size
          lineItemCount = lineItemsData.length
        }
      } else {
        invoicedAmount = actualSpend * FALLBACK_INVOICE_RATIO
        openOrders = actualSpend * (1 - FALLBACK_INVOICE_RATIO)
      }

      const variance = totalBudget - actualSpend
      const variancePercent = totalBudget > 0 ? (variance / totalBudget) * 100 : 0
      const utilization = totalBudget > 0 ? (actualSpend / totalBudget) * 100 : 0

      const projectStartDate = new Date(2024, 0, 1)
      const monthsElapsed = Math.max(1, Math.floor((Date.now() - projectStartDate.getTime()) / (1000 * 60 * 60 * 24 * 30)))
      const burnRate = actualSpend / monthsElapsed

      return {
        totalBudget,
        actualSpend,
        variance,
        variancePercent,
        utilization,
        invoicedAmount,
        openOrders,
        burnRate,
        poCount,
        lineItemCount
      }

    } catch (error) {
      console.error('Error in getProjectMetrics:', error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to calculate project metrics',
        cause: error
      })
    }
  })
