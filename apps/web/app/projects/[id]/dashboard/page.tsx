'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, Activity, Package, Calculator, FileText } from 'lucide-react'
// Import new P&L components
import { PLCommandCenter } from '@/components/cells/pl-command-center/component'
import { FinancialControlMatrix } from '@/components/dashboard/financial-control-matrix'
import { SpendSubcategoryChart } from '@/components/dashboard/spend-subcategory-chart'
// Keep existing components for now
import { BudgetTimelineChartCell } from '@/components/cells/budget-timeline-chart/component'
import { SpendCategoryChart } from '@/components/dashboard/spend-category-chart'
import { CostBreakdownTable } from '@/components/dashboard/cost-breakdown-table'
import { DashboardFilterPanel } from '@/components/dashboard/dashboard-filters'
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'
// Living Blueprint Architecture - Smart Cell
import { KPICard } from '@/components/cells/kpi-card/component'
import { calculateProjectMetrics, getCategoryBreakdown, getHierarchicalBreakdown } from '@/lib/dashboard-metrics'
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
  const [categoryData, setCategoryData] = useState<any[]>([])
  const [breakdownData, setBreakdownData] = useState<any[]>([])
  const [burnRateData, setBurnRateData] = useState<any[]>([])
  const [refreshing, setRefreshing] = useState(false)
  
  // New P&L tracking states
  const [categoryPLData, setCategoryPLData] = useState<any[]>([])
  const [subcategoryData, setSubcategoryData] = useState<any[]>([])
  
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
      const [categories, breakdown] = await Promise.all([
        getCategoryBreakdown(projectId, filters),
        getHierarchicalBreakdown(projectId, filters)
      ])
      
      console.log('Category data:', categories) // Debug log
      console.log('Breakdown data:', breakdown) // Debug log
      setCategoryData(categories)
      setBreakdownData(breakdown)
      
      // Prepare category P&L data for Financial Control Matrix
      const categoryPL = categories.map(cat => ({
        name: cat.name,
        budget: cat.budget,
        committed: cat.value,
        plImpact: cat.value * 0.6, // This would come from actual P&L data
        gapToPL: cat.value * 0.4
      }))
      setCategoryPLData(categoryPL)
      
      // Prepare subcategory data from breakdown
      const subcategoryArray: any[] = []
      console.log('Processing breakdown for subcategories, breakdown length:', breakdown.length)
      breakdown.forEach(businessLine => {
        console.log('Business Line:', businessLine.name, 'has children:', !!businessLine.children)
        if (businessLine.children) {
          businessLine.children.forEach((costLine: any) => {
            console.log('  Cost Line:', costLine.name, 'has children:', !!costLine.children)
            if (costLine.children) {
              costLine.children.forEach((spendType: any) => {
                console.log('    Spend Type:', spendType.name, 'has children:', !!spendType.children)
                if (spendType.children) {
                  spendType.children.forEach((subCategory: any) => {
                    console.log('      Subcategory:', subCategory.name, 'actual:', subCategory.actual)
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
      console.log('Total subcategories found:', subcategoryArray.length)
      setSubcategoryData(subcategoryArray)
      
      // Calculate burn rate data
      // Note: Burn rate calculation removed as timeline data now fetched by Cell
      setBurnRateData([])
      
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

        {/* Financial Control Matrix */}
        {categoryPLData.length > 0 && (
          <FinancialControlMatrix
            categories={categoryPLData}
            onDrillDown={(category) => {
              console.log('Drill down into:', category)
            }}
            onCustomize={() => {
              console.log('Customize matrix view')
            }}
            loading={loading}
          />
        )}

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
            <CostBreakdownTable data={breakdownData} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}