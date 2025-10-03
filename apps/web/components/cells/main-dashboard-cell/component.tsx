'use client'

import { useMemo } from 'react'
import { trpc } from '@/lib/trpc'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { SmartKPICard } from '@/components/dashboard/smart-kpi-card'
import { AlertCircle, TrendingUp, Activity, DollarSign, FolderOpen } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export function MainDashboardCell() {
  // CRITICAL: Memoize ALL query inputs to prevent infinite loops
  const mainMetricsInput = useMemo(() => ({}), [])
  const recentActivityInput = useMemo(() => ({ limit: 5 }), [])
  const categoryBreakdownInput = useMemo(() => ({}), [])
  const timelineDataInput = useMemo(() => ({}), [])

  // Execute all 4 tRPC queries (will be batched into single HTTP request)
  const mainMetrics = trpc.dashboard.getMainMetrics.useQuery(mainMetricsInput, {
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  })

  const recentActivity = trpc.dashboard.getRecentActivity.useQuery(recentActivityInput, {
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  })

  const categoryBreakdown = trpc.dashboard.getCategoryBreakdown.useQuery(categoryBreakdownInput, {
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  })

  const timelineData = trpc.dashboard.getTimelineData.useQuery(timelineDataInput, {
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  })

  // Loading state (BA-001, BA-002, BA-003, BA-004)
  const isLoading = mainMetrics.isLoading || recentActivity.isLoading || categoryBreakdown.isLoading || timelineData.isLoading

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Error states (BA-005, BA-006)
  const hasError = mainMetrics.error || recentActivity.error || categoryBreakdown.error || timelineData.error
  
  if (hasError) {
    const errorMessage = mainMetrics.error?.message || recentActivity.error?.message || categoryBreakdown.error?.message || timelineData.error?.message
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Dashboard</AlertTitle>
        <AlertDescription>{errorMessage}</AlertDescription>
      </Alert>
    )
  }

  // Extract data with null safety (BA-018 division-by-zero protection)
  const metrics = mainMetrics.data || { unmappedPOs: 0, totalPOValue: 0, activeProjects: 0, budgetVariance: 0, totalBudget: 0, totalActual: 0 }
  const activities = recentActivity.data?.activities || []
  const categories = categoryBreakdown.data?.categories || []
  const timeline = timelineData.data?.timeline || []

  // Format currency (BA-014)
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Variance color coding (BA-011)
  const varianceColor = metrics.budgetVariance < 0 ? 'text-green-600' : 'text-red-600'

  return (
    <div className="space-y-6">
      {/* Main Metrics Cards (BA-008, BA-009, BA-010, BA-011) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SmartKPICard
          title="Unmapped POs"
          value={metrics.unmappedPOs.toString()}
          icon={<AlertCircle className="h-4 w-4" />}
          status={metrics.unmappedPOs === 0 ? 'good' : 'warning'}
        />
        <SmartKPICard
          title="Total PO Value"
          value={formatCurrency(metrics.totalPOValue)}
          icon={<DollarSign className="h-4 w-4" />}
          status="good"
        />
        <SmartKPICard
          title="Active Projects"
          value={metrics.activeProjects.toString()}
          icon={<FolderOpen className="h-4 w-4" />}
          status="good"
        />
        <SmartKPICard
          title="Budget Variance"
          value={`${metrics.budgetVariance.toFixed(2)}%`}
          icon={<TrendingUp className="h-4 w-4" />}
          status={metrics.budgetVariance < 0 ? 'good' : 'warning'}
        />
      </div>

      {/* Charts and Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Chart (BA-015 - REAL data, not simulated) */}
        <Card>
          <CardHeader>
            <CardTitle>Spend by Category</CardTitle>
            <CardDescription>Real data from PO mappings</CardDescription>
          </CardHeader>
          <CardContent>
            {categories.length === 0 ? (
              <p className="text-muted-foreground text-center py-12">No category data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categories}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {categories.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Timeline Chart (BA-016 - REAL forecast data, not simulated) */}
        <Card>
          <CardHeader>
            <CardTitle>Budget Timeline</CardTitle>
            <CardDescription>Real forecast data from budget_forecasts</CardDescription>
          </CardHeader>
          <CardContent>
            {timeline.length === 0 ? (
              <p className="text-muted-foreground text-center py-12">No timeline data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Line type="monotone" dataKey="budget" stroke="#8884d8" name="Budget" />
                  <Line type="monotone" dataKey="actual" stroke="#82ca9d" name="Actual" />
                  <Line type="monotone" dataKey="forecast" stroke="#ffc658" name="Forecast" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity (BA-007 empty state, BA-017 relative time) */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest PO mappings</CardDescription>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No recent activity</p>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start justify-between border-b pb-3 last:border-0">
                  <div className="flex items-start gap-3">
                    <Activity className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">{activity.description}</p>
                      <p className="text-sm text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">{formatCurrency(activity.mappedAmount)}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
