/**
 * Dashboard Data Hook
 * 
 * Consolidates all 4 tRPC queries for project dashboard with proper memoization
 * CRITICAL: Prevents infinite render loops by memoizing all query inputs
 */

import { useMemo, useEffect, useState } from 'react'
import { trpc } from '@/lib/trpc'
import { transformSubcategories } from '../utils/subcategory-transform'
import type { CategoryData, HierarchyNode, SubcategoryData, Project } from '../types'

export interface DashboardFilters {
  costLine?: string
  spendType?: string
}

export interface ProjectMetrics {
  totalBudget: number
  actualSpend: number
  variance: number
  variancePercent: number
  utilization: number
  invoicedAmount: number
  openOrders: number
  burnRate: number
  poCount: number
  lineItemCount: number
}

export interface UseDashboardDataReturn {
  // Individual query results
  project: Project | null
  metrics: ProjectMetrics | null
  categoryData: CategoryData[]
  breakdownData: HierarchyNode[]
  subcategoryData: SubcategoryData[]
  
  // Loading states
  isLoading: boolean
  anyLoading: boolean
  
  // Error states
  error: any
  
  // Refetch functions
  refetchAll: () => Promise<void>
}

/**
 * Consolidate all dashboard data queries
 * 
 * @param projectId - Project UUID from route params
 * @param filters - Optional dashboard filters
 * @returns Consolidated dashboard data with loading/error states
 */
export function useDashboardData(
  projectId: string,
  filters: DashboardFilters = {}
): UseDashboardDataReturn {
  // CRITICAL: Memoize filter object to prevent infinite loops
  const memoizedFilters = useMemo(() => ({
    costLine: filters.costLine,
    spendType: filters.spendType
  }), [filters.costLine, filters.spendType])

  // Query 1: Project details (from Phase A)
  const projectQuery = trpc.dashboard.getProjectDetails.useQuery(
    { projectId },
    {
      enabled: !!projectId,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000 // 5 minutes
    }
  )

  // Query 2: Metrics
  const metricsQuery = trpc.dashboard.getProjectMetrics.useQuery(
    { projectId, filters: memoizedFilters },
    {
      enabled: !!projectId,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      staleTime: 1 * 60 * 1000 // 1 minute
    }
  )

  // Query 3: Category breakdown
  const categoryQuery = trpc.dashboard.getProjectCategoryBreakdown.useQuery(
    { projectId, filters: { costLine: memoizedFilters.costLine } },
    {
      enabled: !!projectId,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      staleTime: 1 * 60 * 1000
    }
  )

  // Query 4: Hierarchical breakdown
  const hierarchyQuery = trpc.dashboard.getProjectHierarchicalBreakdown.useQuery(
    { projectId, filters: memoizedFilters },
    {
      enabled: !!projectId,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      staleTime: 1 * 60 * 1000
    }
  )

  // Transform hierarchy to subcategories with memoization
  const subcategoryData = useMemo(() => {
    if (!hierarchyQuery.data?.hierarchy) return []
    return transformSubcategories(hierarchyQuery.data.hierarchy)
  }, [hierarchyQuery.data])

  // Refetch all queries
  const refetchAll = async () => {
    await Promise.all([
      projectQuery.refetch(),
      metricsQuery.refetch(),
      categoryQuery.refetch(),
      hierarchyQuery.refetch()
    ])
  }

  return {
    // Data
    project: projectQuery.data ?? null,
    metrics: metricsQuery.data ?? null,
    categoryData: categoryQuery.data?.categories ?? [],
    breakdownData: hierarchyQuery.data?.hierarchy ?? [],
    subcategoryData,
    
    // Loading states
    isLoading: projectQuery.isLoading || metricsQuery.isLoading,
    anyLoading: projectQuery.isLoading || metricsQuery.isLoading || 
                 categoryQuery.isLoading || hierarchyQuery.isLoading,
    
    // Error states (prioritize project and metrics errors)
    error: projectQuery.error ?? metricsQuery.error ?? null,
    
    // Refetch
    refetchAll
  }
}
