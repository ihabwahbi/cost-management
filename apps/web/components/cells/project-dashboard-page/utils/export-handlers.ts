/**
 * Export Handlers Utility
 * 
 * Extracts PDF and Excel export logic from dashboard component
 * Purpose: Generate downloadable files with dashboard data
 */

import { exportDashboardToPDF, exportDashboardToExcel } from '@/lib/dashboard-export'
import type { HierarchyNode, CategoryData, Project } from '../types'

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

export interface ExportData {
  metrics: ProjectMetrics | null
  breakdown: HierarchyNode[]
  categories: CategoryData[]
}

/**
 * Export dashboard to PDF
 * 
 * Uses browser print dialog to generate PDF from dashboard content
 * 
 * @param project - Project details for file naming
 * @returns Promise that resolves when export initiates
 * 
 * @throws Error if dashboard-content element not found
 */
export async function handleExportPDF(project: Project | null): Promise<void> {
  const dashboardElement = document.getElementById('dashboard-content')
  
  if (!dashboardElement) {
    throw new Error('Dashboard content element not found')
  }
  
  if (!project) {
    throw new Error('Project data not available')
  }
  
  await exportDashboardToPDF(dashboardElement, project.name)
}

/**
 * Export dashboard to Excel (CSV format)
 * 
 * Generates downloadable CSV file with dashboard metrics and breakdown data
 * 
 * @param project - Project details for file naming
 * @param data - Dashboard data to export (metrics, categories, hierarchy)
 * @returns Promise that resolves when export completes
 * 
 * @throws Error if required data not available
 */
export async function handleExportExcel(
  project: Project | null,
  data: ExportData
): Promise<void> {
  if (!project) {
    throw new Error('Project data not available')
  }
  
  if (!data.metrics) {
    throw new Error('Metrics data not available')
  }
  
  await exportDashboardToExcel(data, project.name)
}

/**
 * Check if export is ready (all required data loaded)
 * 
 * @param project - Project data
 * @param metrics - Metrics data
 * @returns true if export can proceed, false otherwise
 */
export function isExportReady(
  project: Project | null,
  metrics: ProjectMetrics | null
): boolean {
  return !!(project && metrics)
}
