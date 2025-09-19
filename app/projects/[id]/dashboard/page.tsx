'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, Activity, Package, Calculator, FileText } from 'lucide-react'
import { KPICard } from '@/components/dashboard/kpi-card'
import { BudgetTimelineChart } from '@/components/dashboard/budget-timeline-chart'
import { SpendCategoryChart } from '@/components/dashboard/spend-category-chart'
import { BurnRateChart } from '@/components/dashboard/burn-rate-chart'
import { CostBreakdownTable } from '@/components/dashboard/cost-breakdown-table'
import { ProjectAlerts } from '@/components/dashboard/project-alerts'
import { DashboardFilterPanel } from '@/components/dashboard/dashboard-filters'
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'
import { calculateProjectMetrics, getTimelineData, getCategoryBreakdown, getHierarchicalBreakdown } from '@/lib/dashboard-metrics'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { exportDashboardToPDF, exportDashboardToExcel } from '@/lib/dashboard-export'

// Next.js 14 App Router dynamic route params type
interface ProjectDashboardProps {
  params: { id: string }
  searchParams?: { [key: string]: string | string[] | undefined }
}

interface ProjectMetrics {
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

interface DashboardFilters {
  dateRange: { from: Date; to: Date }
  costLine?: string
  spendType?: string
  showForecasts: boolean
  comparisonMode: 'none' | 'period' | 'version'
}

export default function ProjectDashboard({ params }: ProjectDashboardProps) {
  const projectId = params.id
  const supabase = createClient()
  const { toast } = useToast()
  const [metrics, setMetrics] = useState<ProjectMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState<any>(null)
  const [timelineData, setTimelineData] = useState<any[]>([])
  const [categoryData, setCategoryData] = useState<any[]>([])
  const [breakdownData, setBreakdownData] = useState<any[]>([])
  const [burnRateData, setBurnRateData] = useState<any[]>([])
  const [refreshing, setRefreshing] = useState(false)
  
  const [filters, setFilters] = useState<DashboardFilters>({
    dateRange: {
      from: new Date(new Date().setMonth(new Date().getMonth() - 6)),
      to: new Date()
    },
    showForecasts: true,
    comparisonMode: 'none'
  })

  useEffect(() => {
    loadDashboardData()
    const subscription = setupRealtimeSubscription()
    
    return () => {
      subscription?.unsubscribe()
    }
  }, [projectId, filters])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch project details
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()
      
      if (projectError) throw projectError
      setProject(projectData)
      
      // Fetch aggregated metrics
      const metricsData = await calculateProjectMetrics(projectId, filters)
      setMetrics(metricsData)
      
      // Fetch chart data
      const [timeline, categories, breakdown] = await Promise.all([
        getTimelineData(projectId, filters),
        getCategoryBreakdown(projectId, filters),
        getHierarchicalBreakdown(projectId, filters)
      ])
      
      setTimelineData(timeline)
      setCategoryData(categories)
      setBreakdownData(breakdown)
      
      // Calculate burn rate data
      const burnRate = calculateBurnRateFromTimeline(timeline)
      setBurnRateData(burnRate)
      
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast({
        variant: 'destructive',
        title: 'Failed to Load Dashboard',
        description: 'Unable to load dashboard data. Please refresh the page.'
      })
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`project-${projectId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'po_mappings',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          console.log('PO mapping changed:', payload)
          handleRefresh() // Refresh metrics
        }
      )
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cost_breakdown',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          console.log('Cost breakdown changed:', payload)
          handleRefresh()
        }
      )
      .subscribe()
    
    return channel
  }

  const calculateBurnRateFromTimeline = (timeline: any[]) => {
    // Calculate monthly spending rate
    const monthlyData = timeline.map((item, index) => {
      const previousActual = index > 0 ? timeline[index - 1].actual : 0
      const monthlySpend = item.actual - previousActual
      
      return {
        month: item.month,
        amount: monthlySpend,
        cumulative: item.actual
      }
    })
    
    return monthlyData
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadDashboardData()
    setRefreshing(false)
  }

  const handleFilterChange = (newFilters: Partial<DashboardFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const handleExportPDF = async () => {
    const dashboardElement = document.getElementById('dashboard-content')
    if (dashboardElement && project) {
      await exportDashboardToPDF(dashboardElement, project.name)
      toast({
        title: 'Export Successful',
        description: 'Dashboard exported to PDF'
      })
    }
  }

  const handleExportExcel = async () => {
    if (!project || !metrics) return
    
    const data = {
      metrics,
      breakdown: breakdownData,
      timeline: timelineData,
      categories: categoryData
    }
    
    await exportDashboardToExcel(data, project.name)
    toast({
      title: 'Export Successful',
      description: 'Dashboard exported to Excel'
    })
  }

  if (loading) {
    return <DashboardSkeleton />
  }

  if (!project) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Project Not Found</AlertTitle>
          <AlertDescription>
            The requested project could not be found.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: value > 1000000 ? 'compact' : 'standard'
    }).format(value)
  }

  return (
    <div className="container mx-auto p-6 max-w-[1600px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{project.name} Dashboard</h1>
          <p className="text-muted-foreground">{project.sub_business_line}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            Export PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            Export Excel
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.history.back()}
          >
            Back to Projects
          </Button>
        </div>
      </div>

      {/* Filter Panel */}
      <DashboardFilterPanel 
        filters={filters} 
        onFilterChange={handleFilterChange} 
      />

      <div id="dashboard-content" className="space-y-6 mt-6">
        {/* Alerts Section */}
        <ProjectAlerts projectId={projectId} metrics={metrics} />

        {/* KPI Cards */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <KPICard
              title="Total Budget"
              value={metrics.totalBudget}
              icon={DollarSign}
              format="currency"
              color="primary"
            />
            <KPICard
              title="Actual Spend"
              value={metrics.actualSpend}
              icon={Activity}
              format="currency"
              color={metrics.actualSpend > metrics.totalBudget ? 'danger' : 'success'}
              trend={metrics.utilization > 100 ? metrics.utilization - 100 : undefined}
            />
            <KPICard
              title="Variance"
              value={metrics.variance}
              icon={metrics.variance >= 0 ? TrendingUp : TrendingDown}
              format="currency"
              color={metrics.variance >= 0 ? 'success' : 'danger'}
              trend={metrics.variancePercent}
            />
            <KPICard
              title="Utilization"
              value={metrics.utilization}
              icon={Calculator}
              format="percent"
              color={metrics.utilization > 90 ? 'warning' : 'primary'}
            />
            <KPICard
              title="Open Orders"
              value={metrics.openOrders}
              icon={Package}
              format="currency"
              color="primary"
            />
            <KPICard
              title="PO Count"
              value={metrics.poCount}
              icon={FileText}
              format="number"
              color="primary"
            />
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Budget vs Actual Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <BudgetTimelineChart data={timelineData} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Spend by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <SpendCategoryChart data={categoryData} />
            </CardContent>
          </Card>
        </div>

        {/* Burn Rate Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Burn Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <BurnRateChart data={burnRateData} />
          </CardContent>
        </Card>

        {/* Cost Breakdown Table */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <CostBreakdownTable data={breakdownData} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}