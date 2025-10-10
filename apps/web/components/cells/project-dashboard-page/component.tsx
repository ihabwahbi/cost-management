'use client'

/**
 * Project Dashboard Page Cell
 * 
 * Main orchestrator for project dashboard - thin wrapper using custom hooks and section components
 * 
 * CRITICAL: Replaces 443-line god component with focused, testable Cell architecture
 */

import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { DashboardSkeleton } from '@/components/cells/dashboard-skeleton/component'

// Custom hooks (all business logic extracted)
import { useDashboardData, type DashboardFilters } from './hooks/use-dashboard-data'

// Export handlers
import { handleExportPDF, handleExportExcel } from './utils/export-handlers'

// Section components (all UI extracted)
import { DashboardHeader } from './components/dashboard-header'
import { KPISection } from './components/kpi-section'
import { PLSection } from './components/pl-section'
import { FinancialMatrixSection } from './components/financial-matrix-section'
import { TimelineSection } from './components/timeline-section'
import { ChartsSection } from './components/charts-section'
import { BreakdownSection } from './components/breakdown-section'

export interface ProjectDashboardPageProps {
  projectId: string
}

/**
 * Project Dashboard Cell - Main Orchestrator
 * 
 * Coordinates data fetching, realtime sync, and section rendering
 */
export function ProjectDashboardPage({ projectId }: ProjectDashboardPageProps) {
  const { toast } = useToast()
  const [refreshing, setRefreshing] = useState(false)
  const [filters] = useState<DashboardFilters>({})

  // Custom hooks handle ALL data fetching
  const data = useDashboardData(projectId, filters)

  // Handlers
  const handleRefresh = async () => {
    setRefreshing(true)
    await data.refetchAll()
    setRefreshing(false)
  }

  const onExportPDF = async () => {
    try {
      await handleExportPDF(data.project)
      toast({ title: 'Export Successful', description: 'Dashboard exported to PDF' })
    } catch (error) {
      toast({ variant: 'destructive', title: 'Export Failed', description: String(error) })
    }
  }

  const onExportExcel = async () => {
    try {
      await handleExportExcel(data.project, {
        metrics: data.metrics,
        breakdown: data.breakdownData,
        categories: data.categoryData
      })
      toast({ title: 'Export Successful', description: 'Dashboard exported to Excel' })
    } catch (error) {
      toast({ variant: 'destructive', title: 'Export Failed', description: String(error) })
    }
  }

  // Loading state (BA-002)
  if (data.isLoading) {
    return <DashboardSkeleton />
  }

  // Error state (BA-004)
  if (data.error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Dashboard</AlertTitle>
          <AlertDescription>{data.error.message}</AlertDescription>
        </Alert>
      </div>
    )
  }

  // Project not found (BA-003)
  if (!data.project) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Project Not Found</AlertTitle>
          <AlertDescription>The requested project could not be found.</AlertDescription>
        </Alert>
      </div>
    )
  }

  // Success state - render all sections
  return (
    <div className="container mx-auto p-6 max-w-[1600px]">
      <DashboardHeader
        project={data.project}
        metrics={data.metrics}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onExportPDF={onExportPDF}
        onExportExcel={onExportExcel}
        onBack={() => window.history.back()}
      />

      <div id="dashboard-content" className="space-y-6 mt-6">
        <KPISection projectId={projectId} />
        <PLSection projectId={projectId} />
        <FinancialMatrixSection projectId={projectId} />
        <TimelineSection projectId={projectId} />
        <ChartsSection
          categoryData={data.categoryData}
          subcategoryData={data.subcategoryData}
          loading={data.anyLoading}
        />
        <BreakdownSection breakdownData={data.breakdownData} />
      </div>
    </div>
  )
}
