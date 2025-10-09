'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, Activity, Package, Calculator, FileText } from 'lucide-react'
// Import new P&L components
import { PLCommandCenter } from '@/components/cells/pl-command-center/component'
import { FinancialControlMatrixCell } from '@/components/cells/financial-control-matrix/component'
import { SpendSubcategoryChart } from '@/components/dashboard/spend-subcategory-chart'
// Keep existing components for now
import { BudgetTimelineChartCell } from '@/components/cells/budget-timeline-chart/component'
import { SpendCategoryChart } from '@/components/dashboard/spend-category-chart'
import { CostBreakdownTable } from '@/components/dashboard/cost-breakdown-table'
import { DashboardFilterPanel } from '@/components/dashboard/dashboard-filters'
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'
// Living Blueprint Architecture - Smart Cell
import { KPICard } from '@/components/cells/kpi-card/component'
import { trpc } from '@/lib/trpc'
import { useToast } from '@/hooks/use-toast'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { exportDashboardToPDF, exportDashboardToExcel } from '@/lib/dashboard-export'
// Phase C: Type Safety - Import TypeScript interfaces
import type {
  Project,
  CategoryData,
  SubcategoryData,
  HierarchyNode,
  CostBreakdownRow,
  BurnRateDataPoint,
  TimelineDataPoint,
  RealtimePayload
} from '@/components/cells/project-dashboard-page/types'

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
  const queryClient = useQueryClient()
  const [metrics, setMetrics] = useState<ProjectMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  // Phase C: Type Safety - Replace 'any' with proper types
  const [project, setProject] = useState<Project | null>(null)
  const [categoryData, setCategoryData] = useState<CategoryData[]>([])
  const [breakdownData, setBreakdownData] = useState<HierarchyNode[]>([])
  const [burnRateData, setBurnRateData] = useState<BurnRateDataPoint[]>([])
  const [refreshing, setRefreshing] = useState(false)
  
  // New P&L tracking states
  const [subcategoryData, setSubcategoryData] = useState<SubcategoryData[]>([])
  
  const [filters, setFilters] = useState<DashboardFilters>({
    dateRange: {
      from: new Date(new Date().setMonth(new Date().getMonth() - 6)),
      to: new Date()
    },
    showForecasts: true,
    comparisonMode: 'none'
  })

  // Memoize filter inputs to prevent infinite loops
  const memoizedFilters = useMemo(() => ({
    costLine: filters.costLine,
    spendType: filters.spendType
  }), [filters.costLine, filters.spendType])

  // tRPC queries replace utility functions
  const { data: metricsData, isLoading: metricsLoading, error: metricsError } = 
    trpc.dashboard.getProjectMetrics.useQuery({
      projectId,
      filters: memoizedFilters
    })

  const { data: categoryDataResponse, isLoading: categoryLoading } = 
    trpc.dashboard.getProjectCategoryBreakdown.useQuery({
      projectId,
      filters: { costLine: memoizedFilters.costLine }
    })

  const { data: breakdownDataResponse, isLoading: breakdownLoading } = 
    trpc.dashboard.getProjectHierarchicalBreakdown.useQuery({
      projectId,
      filters: memoizedFilters
    })

  useEffect(() => {
    // Update local state when tRPC data arrives
    if (metricsData) {
      setMetrics(metricsData)
    }
    if (categoryDataResponse) {
      setCategoryData(categoryDataResponse.categories)
    }
    if (breakdownDataResponse) {
      setBreakdownData(breakdownDataResponse.hierarchy)
      
      // Process subcategory data (Phase C: Type Safety - properly typed)
      const subcategoryArray: SubcategoryData[] = []
      breakdownDataResponse.hierarchy.forEach(businessLine => {
        if (businessLine.children) {
          businessLine.children.forEach(costLine => {
            if (costLine.children) {
              costLine.children.forEach(spendType => {
                if (spendType.children) {
                  spendType.children.forEach(subCategory => {
                    subcategoryArray.push({
                      category: spendType.name,
                      subcategory: subCategory.name,
                      value: subCategory.actual,
                      budget: subCategory.budget,
                      percentage: subCategory.utilization
                    })
                  })
                }
              })
            }
          })
        }
      })
      setSubcategoryData(subcategoryArray)
    }
  }, [metricsData, categoryDataResponse, breakdownDataResponse])

  useEffect(() => {
    loadProjectData()
    const subscription = setupRealtimeSubscription()
    
    return () => {
      subscription?.unsubscribe()
    }
  }, [projectId])

  const loadProjectData = async () => {
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

  // Phase C: Type Safety - Properly typed realtime event handler
  const handleRealtimeEvent = async (payload: RealtimePayload) => {
    console.log('Cost breakdown changed:', payload)
    
    // Invalidate ALL dashboard queries to refresh data
    await queryClient.invalidateQueries({
      queryKey: ['trpc', 'dashboard']
    })
    
    // Also refresh project details query
    await queryClient.invalidateQueries({
      queryKey: ['trpc', 'dashboard', 'getProjectDetails']
    })
  }

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`project-${projectId}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cost_breakdown',
          filter: `project_id=eq.${projectId}`
        },
        handleRealtimeEvent
      )
      .subscribe()
    
    return channel
  }

  // Phase C: Type Safety - Properly typed burn rate calculation
  const calculateBurnRateFromTimeline = (timeline: TimelineDataPoint[]): BurnRateDataPoint[] => {
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
    await loadProjectData()
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
      categories: categoryData
    }
    
    await exportDashboardToExcel(data, project.name)
    toast({
      title: 'Export Successful',
      description: 'Dashboard exported to Excel'
    })
  }

  if (loading || metricsLoading || categoryLoading || breakdownLoading) {
    return <DashboardSkeleton />
  }

  if (metricsError) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Dashboard</AlertTitle>
          <AlertDescription>{metricsError.message}</AlertDescription>
        </Alert>
      </div>
    )
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

      {/* Filter Panel - Temporarily disabled until fully functional
      <DashboardFilterPanel 
        filters={filters} 
        onFilterChange={handleFilterChange} 
      /> */}

       <div id="dashboard-content" className="space-y-6 mt-6">
        {/* Living Blueprint Architecture - Smart Cell */}
        <KPICard projectId={projectId} />

        {/* P&L Command Center - Living Blueprint Cell (fetches own data via tRPC) */}
        <PLCommandCenter
          projectId={projectId}
          onViewGapAnalysis={() => {
            // Navigate to detailed analysis
            console.log('View gap analysis')
          }}
        />

        {/* Financial Control Matrix - Living Blueprint Cell (fetches own data via tRPC) */}
        <FinancialControlMatrixCell
          projectId={projectId}
          onDrillDown={(category) => {
            console.log('Drill down into:', category)
          }}
          onCustomize={() => {
            console.log('Customize matrix view')
          }}
        />

        {/* Budget Timeline Visualization */}
        <Card>
          <CardHeader>
            <CardTitle>Budget vs Actual Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <BudgetTimelineChartCell projectId={projectId} />
          </CardContent>
        </Card>

        {/* Category and Subcategory Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Spend by Category chart */}
          <Card>
            <CardHeader>
              <CardTitle>Spend by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryData.length > 0 ? (
                <SpendCategoryChart data={categoryData} />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No category data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Spend by Subcategory chart */}
          <Card>
            <CardHeader>
              <CardTitle>Spend by Subcategory</CardTitle>
            </CardHeader>
            <CardContent>
              {subcategoryData.length > 0 ? (
                <SpendSubcategoryChart
                  data={subcategoryData}
                  loading={loading}
                  onDrillDown={(category, subcategory) => {
                    console.log('Drill down:', category, subcategory)
                  }}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No subcategory data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cost Breakdown Table */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Phase C: Type assertion - API data has 'level' at runtime even though type doesn't declare it */}
            <CostBreakdownTable data={breakdownData as CostBreakdownRow[]} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}