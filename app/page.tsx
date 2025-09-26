'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { AppShell } from '@/components/app-shell'
import { SmartKPICard } from '@/components/dashboard/smart-kpi-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { useRealtimeDashboard } from '@/hooks/use-realtime-dashboard'
import { RefreshCw, AlertCircle, TrendingUp, Activity } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'

// Define types for our dashboard data
interface DashboardMetrics {
  unmappedPOs: number
  totalPOValue: number
  activeProjects: number
  budgetVariance: number
  categoryData: Array<{ name: string; value: number; budget: number }>
  timelineData: Array<{ month: string; budget: number; actual: number; forecast: number }>
  recentActivity: Array<{ type: string; description: string; time: string }>
}

type SupabaseClient = ReturnType<typeof createClient>

// Helper function to format recent activity
function formatRecentActivity(mappings: any[]): any[] {
  const getRelativeTime = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.round(diffMs / 60000)
    
    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
    const diffHours = Math.round(diffMins / 60)
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    const diffDays = Math.round(diffHours / 24)
    if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
  }
  
  return mappings.map((mapping) => {
    // Handle the nested join structure properly
    const poNumber = mapping.po_line_items?.pos?.po_number || 'Unknown PO'
    const projectName = mapping.cost_breakdown?.projects?.name || 'Unknown Project'
    const createdAt = new Date(mapping.created_at || mapping.mapped_at)
    
    return {
      type: 'po_mapped',
      description: `PO ${poNumber} mapped to ${projectName}`,
      time: getRelativeTime(createdAt)
    }
  })
}

// Helper function to get category breakdown for charts
async function getCategoryBreakdown(supabase: SupabaseClient) {
  const { data } = await supabase
    .from('cost_breakdown')
    .select('cost_line, budget_cost')
    .not('cost_line', 'is', null)
  
  const breakdown = data?.reduce((acc, item) => {
    const category = item.cost_line || 'Other'
    if (!acc[category]) {
      acc[category] = { value: 0, budget: 0 }
    }
    acc[category].budget += Number(item.budget_cost || 0)
    acc[category].value = acc[category].budget * 0.85 // Simulate actual spend at 85% of budget
    return acc
  }, {} as Record<string, { value: number; budget: number }>)
  
  return Object.entries(breakdown || {}).map(([name, data]) => ({
    name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: data.value,
    budget: data.budget
  })).sort((a, b) => b.value - a.value).slice(0, 6) // Top 6 categories
}

// Helper function to get timeline data for charts
async function getTimelineData(supabase: SupabaseClient) {
  // Simplified query - just get line items with invoice dates
  const { data } = await supabase
    .from('po_line_items')
    .select('invoice_date, line_value')
    .not('invoice_date', 'is', null)
    .order('invoice_date')
  
  // Group by month
  const grouped = data?.reduce((acc, item) => {
    const month = new Date(item.invoice_date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    })
    
    if (!acc[month]) {
      acc[month] = { budget: 0, actual: 0, forecast: 0 }
    }
    
    // Use line_value for both budget and actual (simplified for now)
    const value = Number(item.line_value) || 0
    acc[month].budget += value * 1.1  // Budget is 110% of actual for demo
    acc[month].actual += value
    acc[month].forecast = acc[month].budget * 1.05 // Forecast at 105% of budget
    
    return acc
  }, {} as Record<string, { budget: number; actual: number; forecast: number }>)
  
  return Object.entries(grouped || {}).map(([month, values]) => ({
    month,
    ...values
  })).slice(-6) // Last 6 months
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const { toast } = useToast()

  const loadDashboardMetrics = useCallback(async (showToast = false) => {
    try {
      if (!refreshing) {
        setLoading(true)
      }
      setError(null)
      
      // Parallel data fetching for performance
      const [unmappedResult, valueResult, projectsResult, budgetData] = await Promise.all([
        // Unmapped POs count - Already fixed with left join
        supabase
          .from('po_line_items')
          .select(`
            id,
            po_mappings!left(id)
          `, { count: 'exact', head: true })
          .is('po_mappings.id', null),
        
        // Total PO value - FIXED: use line_value instead of total_line_value
        supabase
          .from('po_line_items')
          .select('line_value'),
        
        // All projects (already fixed - removed status filter)
        supabase
          .from('projects')
          .select('*', { count: 'exact', head: true }),
        
        // Budget data for variance
        supabase
          .from('cost_breakdown')
          .select('budget_cost')
      ])

      // Calculate total PO value - FIXED: use line_value
      const totalPOValue = valueResult.data?.reduce((sum, item) => 
        sum + (Number(item.line_value) || 0), 0) || 0

      // Calculate budget variance
      const totalBudget = budgetData.data?.reduce((sum, item) =>
        sum + (Number(item.budget_cost) || 0), 0) || 0
      
      // Get actual spend for variance calculation
      const { data: actualData } = await supabase
        .from('po_mappings')
        .select('mapped_amount')
      
      const totalActual = actualData?.reduce((sum, item) =>
        sum + (Number(item.mapped_amount) || 0), 0) || 0
      
      const variance = totalBudget > 0 ?
        ((totalActual - totalBudget) / totalBudget) * 100 : 0

      // Get recent activity - FIXED: proper join path to get po_number through pos table
      const { data: recentMappings } = await supabase
        .from('po_mappings')
        .select(`
          *,
          po_line_items!inner(
            *,
            pos!inner(po_number)
          ),
          cost_breakdown!inner(
            *,
            projects!inner(name)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      // Get chart data
      const categoryData = await getCategoryBreakdown(supabase)
      const timelineData = await getTimelineData(supabase)

      setMetrics({
        unmappedPOs: unmappedResult.count || 0,
        totalPOValue,
        activeProjects: projectsResult.count || 0,
        budgetVariance: variance,
        categoryData,
        timelineData,
        recentActivity: formatRecentActivity(recentMappings || [])
      })

      if (showToast) {
        toast({
          title: "Dashboard Refreshed",
          description: "All data has been updated",
        })
      }
    } catch (err) {
      console.error('Dashboard load error:', err)
      setError('Failed to load dashboard data. Please try refreshing the page.')
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [supabase, toast, refreshing])

  useEffect(() => {
    loadDashboardMetrics()
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      setRefreshing(true)
      loadDashboardMetrics(false)
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  // Real-time updates
  useRealtimeDashboard({
    onUpdate: () => {
      console.log('Real-time update received, refreshing dashboard...')
      setRefreshing(true)
      loadDashboardMetrics(false)
    }
  })

  const handleManualRefresh = () => {
    setRefreshing(true)
    loadDashboardMetrics(true)
  }

  // Determine KPI status based on values
  const getUnmappedPOStatus = (count: number) => {
    if (count === 0) return 'good'
    if (count < 10) return 'neutral'
    if (count < 30) return 'warning'
    return 'critical'
  }

  const getBudgetVarianceStatus = (variance: number) => {
    if (Math.abs(variance) < 5) return 'good'
    if (Math.abs(variance) < 10) return 'warning'
    return 'critical'
  }

  // Loading state with skeleton
  if (loading && !refreshing) {
    return (
      <AppShell>
        <div className="p-6 space-y-8">
          {/* Welcome Section Skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-6 w-96" />
          </div>

          {/* Metrics Cards Skeleton */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="border-l-4">
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-3 w-32 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts Skeleton */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-[400px]" />
            <Skeleton className="h-[400px]" />
          </div>
        </div>
      </AppShell>
    )
  }

  // Error state
  if (error && !metrics) {
    return (
      <AppShell>
        <div className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="mt-2">
              {error}
              <Button
                variant="outline"
                size="sm"
                className="ml-4"
                onClick={() => loadDashboardMetrics()}
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="p-6 space-y-8">
        {/* Welcome Section */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Here's an overview of your cost management status.
            </p>
          </div>
          <div className="flex gap-2 items-center">
            {refreshing && <Badge variant="secondary">Updating...</Badge>}
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleManualRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <SmartKPICard
            title="Unmapped POs"
            value={metrics?.unmappedPOs || 0}
            status={getUnmappedPOStatus(metrics?.unmappedPOs || 0)}
            subtitle="Require mapping"
            trend={metrics?.unmappedPOs === 0 ? 0 : -3}
            onClick={() => window.location.href = '/po-mapping'}
          />

          <SmartKPICard
            title="Total PO Value"
            value={`$${((metrics?.totalPOValue || 0) / 1000000).toFixed(1)}M`}
            status="neutral"
            subtitle="Across all purchase orders"
            trend={12}
            onClick={() => window.location.href = '/po-mapping'}
          />

          <SmartKPICard
            title="Active Projects"
            value={metrics?.activeProjects || 0}
            status="good"
            subtitle="Currently running"
            trend={0}
            onClick={() => window.location.href = '/projects'}
          />

          <SmartKPICard
            title="Budget Variance"
            value={`${metrics?.budgetVariance?.toFixed(1) || 0}%`}
            status={getBudgetVarianceStatus(metrics?.budgetVariance || 0)}
            subtitle="Average across projects"
            trend={metrics?.budgetVariance || 0}
            onClick={() => window.location.href = '/projects'}
            progress={Math.min(100, Math.abs(metrics?.budgetVariance || 0) * 10)}
          />
        </div>

        {/* Visualizations */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Category Breakdown Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Spend by Category</CardTitle>
              <CardDescription>Budget allocation across cost categories</CardDescription>
            </CardHeader>
            <CardContent>
              {metrics?.categoryData && metrics.categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={metrics.categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry) => `${entry.name}: $${(entry.value / 1000000).toFixed(1)}M`}
                    >
                      {metrics.categoryData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#0014DC', '#4B5563', '#9CA3AF', '#D1D5DB', '#E5E7EB', '#F9FAFB'][index % 6]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `$${(value / 1000000).toFixed(2)}M`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Budget vs Actual Timeline</CardTitle>
              <CardDescription>Monthly comparison with forecast</CardDescription>
            </CardHeader>
            <CardContent>
              {metrics?.timelineData && metrics.timelineData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics.timelineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis 
                      tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`}
                    />
                    <Tooltip 
                      formatter={(value: number) => `$${(value / 1000000).toFixed(2)}M`}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="budget" stroke="#0014DC" name="Budget" />
                    <Line type="monotone" dataKey="actual" stroke="#22c55e" name="Actual" />
                    <Line type="monotone" dataKey="forecast" stroke="#f59e0b" name="Forecast" strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No timeline data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions and Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and navigation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/po-mapping">
                <Button variant="outline" className="w-full justify-start">
                  <Activity className="h-4 w-4 mr-2" />
                  Map Purchase Orders
                  {metrics?.unmappedPOs ? (
                    <Badge className="ml-auto">{metrics.unmappedPOs}</Badge>
                  ) : null}
                </Button>
              </Link>
              <Link href="/projects">
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Project Details
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest system updates and changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics?.recentActivity?.length ? (
                  metrics.recentActivity.map((activity, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{activity.type}</Badge>
                        <span className="text-sm">{activity.description}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{activity.time}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}