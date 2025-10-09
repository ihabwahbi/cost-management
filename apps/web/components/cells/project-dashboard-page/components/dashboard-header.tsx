/**
 * Dashboard Header Component
 * 
 * Displays project name, sub-business line, and action buttons
 * (Refresh, Export PDF, Export Excel, Back to Projects)
 */

import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import type { Project } from '../types'
import type { ProjectMetrics } from '../hooks/use-dashboard-data'

export interface DashboardHeaderProps {
  /** Project details */
  project: Project | null
  
  /** Project metrics for export */
  metrics: ProjectMetrics | null
  
  /** Whether refresh is in progress */
  refreshing: boolean
  
  /** Refresh button click handler */
  onRefresh: () => void
  
  /** Export PDF button click handler */
  onExportPDF: () => void
  
  /** Export Excel button click handler */
  onExportExcel: () => void
  
  /** Back button click handler */
  onBack: () => void
}

/**
 * Dashboard header with project info and action buttons
 * 
 * Behavioral Assertions:
 * - BA-001: Displays project name and sub-business line
 * - BA-005: Refresh button triggers reload with spinner
 * - BA-006: Export PDF button generates PDF
 * - BA-007: Export Excel button generates Excel
 * - BA-011: Back button navigates to previous page
 */
export function DashboardHeader({
  project,
  metrics,
  refreshing,
  onRefresh,
  onExportPDF,
  onExportExcel,
  onBack
}: DashboardHeaderProps) {
  const canExport = !!(project && metrics)
  
  return (
    <div className="flex items-center justify-between mb-6">
      {/* Project Info (BA-001) */}
      <div>
        <h1 className="text-3xl font-bold">
          {project?.name ?? 'Loading...'} Dashboard
        </h1>
        <p className="text-muted-foreground">
          {project?.subBusinessLine ?? 'Loading...'}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {/* BA-005: Refresh Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={refreshing}
          aria-label="Refresh dashboard data"
        >
          <RefreshCw
            className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`}
          />
          Refresh
        </Button>

        {/* BA-006: Export PDF Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onExportPDF}
          disabled={!canExport}
          aria-label="Export dashboard to PDF"
        >
          Export PDF
        </Button>

        {/* BA-007: Export Excel Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onExportExcel}
          disabled={!canExport}
          aria-label="Export dashboard to Excel"
        >
          Export Excel
        </Button>

        {/* BA-011: Back Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          aria-label="Return to projects list"
        >
          Back to Projects
        </Button>
      </div>
    </div>
  )
}
