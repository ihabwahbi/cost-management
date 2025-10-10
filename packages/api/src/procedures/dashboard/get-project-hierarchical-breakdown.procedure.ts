import { z } from 'zod'
import { publicProcedure } from '../../trpc'
import { costBreakdown, poMappings } from '@cost-mgmt/db'
import { eq, inArray, and } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'

// Type definitions for hierarchical breakdown
interface HierarchyNodeBase {
  id: string
  name: string
  budget: number
  actual: number
  variance: number
  utilization: number
}

interface SubCategory extends HierarchyNodeBase {
  level: 'sub_category'
}

interface SpendType extends HierarchyNodeBase {
  level: 'spend_type'
  children: SubCategory[]
}

interface CostLine extends HierarchyNodeBase {
  level: 'cost_line'
  children: Record<string, SpendType>
}

interface BusinessLine extends HierarchyNodeBase {
  level: 'business_line'
  children: Record<string, CostLine>
}

// Final output type
interface HierarchyNode extends HierarchyNodeBase {
  level: 'business_line' | 'cost_line' | 'spend_type' | 'sub_category'
  children?: HierarchyNode[]
}

export const getProjectHierarchicalBreakdown = publicProcedure
  .input(z.object({
    projectId: z.string().uuid(),
    filters: z.object({
      costLine: z.string().optional(),
      spendType: z.string().optional()
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

      const costData = await ctx.db
        .select()
        .from(costBreakdown)
        .where(and(...conditions))
        .orderBy(
          costBreakdown.subBusinessLine,
          costBreakdown.costLine,
          costBreakdown.spendType,
          costBreakdown.spendSubCategory
        )

      if (!costData || costData.length === 0) {
        return { hierarchy: [] }
      }

      const costIds = costData.map(c => c.id)
      const mappingsData = await ctx.db
        .select({ costBreakdownId: poMappings.costBreakdownId, mappedAmount: poMappings.mappedAmount })
        .from(poMappings)
        .where(inArray(poMappings.costBreakdownId, costIds))

      const actualSpendMap: Record<string, number> = {}
      mappingsData.forEach(mapping => {
        actualSpendMap[mapping.costBreakdownId] = 
          (actualSpendMap[mapping.costBreakdownId] || 0) + (Number(mapping.mappedAmount || 0))
      })

      const hierarchy: Record<string, BusinessLine> = {}

      costData.forEach(item => {
        const { subBusinessLine, costLine, spendType, spendSubCategory } = item
        const budget = Number(item.budgetCost || 0)
        const actual = actualSpendMap[item.id] || 0

        if (!hierarchy[subBusinessLine || 'Unknown']) {
          hierarchy[subBusinessLine || 'Unknown'] = {
            id: `bl_${subBusinessLine}`,
            level: 'business_line',
            name: subBusinessLine || 'Unknown',
            budget: 0,
            actual: 0,
            variance: 0,
            utilization: 0,
            children: {}
          }
        }

        if (!hierarchy[subBusinessLine || 'Unknown'].children[costLine || 'Unknown']) {
          hierarchy[subBusinessLine || 'Unknown'].children[costLine || 'Unknown'] = {
            id: `cl_${subBusinessLine}_${costLine}`,
            level: 'cost_line',
            name: costLine || 'Unknown',
            budget: 0,
            actual: 0,
            variance: 0,
            utilization: 0,
            children: {}
          }
        }

        if (!hierarchy[subBusinessLine || 'Unknown'].children[costLine || 'Unknown'].children[spendType || 'Unknown']) {
          hierarchy[subBusinessLine || 'Unknown'].children[costLine || 'Unknown'].children[spendType || 'Unknown'] = {
            id: `st_${subBusinessLine}_${costLine}_${spendType}`,
            level: 'spend_type',
            name: spendType || 'Unknown',
            budget: 0,
            actual: 0,
            variance: 0,
            utilization: 0,
            children: []
          }
        }

        const subCategoryItem: SubCategory = {
          id: item.id,
          level: 'sub_category' as const,
          name: spendSubCategory || 'Unknown',
          budget,
          actual,
          variance: budget - actual,
          utilization: budget > 0 ? (actual / budget) * 100 : 0
        }

        hierarchy[subBusinessLine || 'Unknown'].children[costLine || 'Unknown'].children[spendType || 'Unknown'].children.push(subCategoryItem)

        hierarchy[subBusinessLine || 'Unknown'].children[costLine || 'Unknown'].children[spendType || 'Unknown'].budget += budget
        hierarchy[subBusinessLine || 'Unknown'].children[costLine || 'Unknown'].children[spendType || 'Unknown'].actual += actual

        hierarchy[subBusinessLine || 'Unknown'].children[costLine || 'Unknown'].budget += budget
        hierarchy[subBusinessLine || 'Unknown'].children[costLine || 'Unknown'].actual += actual

        hierarchy[subBusinessLine || 'Unknown'].budget += budget
        hierarchy[subBusinessLine || 'Unknown'].actual += actual
      })

      const result: HierarchyNode[] = []

      Object.values(hierarchy).forEach((businessLine: BusinessLine) => {
        businessLine.variance = businessLine.budget - businessLine.actual
        businessLine.utilization = businessLine.budget > 0 ? (businessLine.actual / businessLine.budget) * 100 : 0

        const costLines: HierarchyNode[] = []
        Object.values(businessLine.children).forEach((costLine: CostLine) => {
          costLine.variance = costLine.budget - costLine.actual
          costLine.utilization = costLine.budget > 0 ? (costLine.actual / costLine.budget) * 100 : 0

          const spendTypes: HierarchyNode[] = []
          Object.values(costLine.children).forEach((spendType: SpendType) => {
            spendType.variance = spendType.budget - spendType.actual
            spendType.utilization = spendType.budget > 0 ? (spendType.actual / spendType.budget) * 100 : 0

            spendTypes.push({ ...spendType, children: spendType.children })
          })

          costLines.push({ ...costLine, children: spendTypes })
        })

        result.push({ ...businessLine, children: costLines })
      })

      return { hierarchy: result }

    } catch (error) {
      console.error('Error in getProjectHierarchicalBreakdown:', error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get hierarchical breakdown',
        cause: error
      })
    }
  })
