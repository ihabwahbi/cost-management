'use client'

import { useMemo, useCallback } from 'react'
import { trpc } from '@/lib/trpc'
import { ChartContainer, ChartConfig, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Bar, XAxis, YAxis, CartesianGrid, Legend, ComposedChart, ReferenceLine } from 'recharts'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'

interface BudgetTimelineChartCellProps {
  projectId: string
  costLine?: string
  spendType?: string
}

export function BudgetTimelineChartCell({
  projectId,
  costLine,
  spendType,
}: BudgetTimelineChartCellProps) {
  // CRITICAL: Memoize chart configuration (ALWAYS)
  const chartConfig = useMemo<ChartConfig>(
    () => ({
      budget: {
        label: 'Total Budget Limit',
        color: '#dc2626', // Red reference line
      },
      actual: {
        label: 'Actual P&L Impact (Invoiced)',
        color: '#2563eb', // Blue for actuals
      },
      forecast: {
        label: 'Future P&L Commitments',
        color: '#f59e0b', // Orange for forecast
      },
    }),
    []
  )

  // No filters needed - P&L timeline shows all invoices and promises for project

  // CRITICAL: Memoize margin object
  const chartMargin = useMemo(() => ({ top: 5, right: 30, left: 20, bottom: 5 }), [])

  // CRITICAL: Type-safe tooltip formatter (FIXES TYPE SAFETY PITFALL)
  const tooltipFormatter = useCallback((value: string | number | Array<string | number>) => {
    const numValue = Array.isArray(value) ? 0 : (typeof value === 'string' ? parseFloat(value) : Number(value))
    return `$${(numValue / 1000).toFixed(1)}K`
  }, [])

  // CRITICAL: Y-axis formatter
  const yAxisFormatter = useCallback((value: number) => `$${(value / 1000).toFixed(0)}K`, [])

  // tRPC query - fetches all invoices and promises for P&L timeline
  const { data, isLoading, error } = trpc.dashboard.getTimelineBudget.useQuery(
    { projectId },
    {
      enabled: !!projectId,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: 1,
    }
  )

  // BA-005: Shows loading skeleton during fetch
  if (isLoading) {
    return (
      <div className="min-h-[300px] w-full space-y-3">
        <Skeleton className="h-[300px] w-full" />
      </div>
    )
  }

  // BA-006: Displays error alert on query failure
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error Loading Timeline</AlertTitle>
        <AlertDescription>
          {error.message || 'Failed to load budget timeline data'}
        </AlertDescription>
      </Alert>
    )
  }

  // BA-004: Component gracefully handles empty data array
  if (!data || data.length === 0) {
    return (
      <div className="min-h-[300px] w-full flex items-center justify-center text-muted-foreground">
        No timeline data available
      </div>
    )
  }

  // BA-001: Displays P&L timeline with budget reference line and stacked bars
  // Budget is fixed limit, actual shows cumulative invoiced, forecast shows future promises
  const budgetLimit = data[0]?.budget || 0

  return (
    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
      <ComposedChart data={data} margin={chartMargin}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="month"
          className="text-xs"
          tick={{ fill: 'currentColor', fontSize: 12 }}
          tickLine={{ stroke: 'currentColor' }}
        />
        {/* BA-002: Y-axis formats currency with K notation and no decimals */}
        <YAxis
          className="text-xs"
          tick={{ fill: 'currentColor', fontSize: 12 }}
          tickLine={{ stroke: 'currentColor' }}
          tickFormatter={yAxisFormatter}
          domain={[0, budgetLimit * 1.1]}
        />
        {/* BA-003: Tooltip displays currency with 1 decimal precision */}
        <ChartTooltip
          content={
            <ChartTooltipContent className="w-[220px]" nameKey="month" formatter={tooltipFormatter} />
          }
        />
        <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="rect" />
        
        {/* Budget as horizontal reference line (fixed limit) */}
        <ReferenceLine
          y={budgetLimit}
          stroke="var(--color-budget)"
          strokeDasharray="5 5"
          strokeWidth={2}
          label={{ value: 'Budget Limit', position: 'insideTopRight', fill: 'var(--color-budget)' }}
        />
        
        {/* Stacked bars: Actual (bottom) + Forecast (top) */}
        <Bar
          dataKey="actual"
          stackId="pl"
          fill="var(--color-actual)"
          name="Actual P&L Impact"
        />
        <Bar
          dataKey="forecast"
          stackId="pl"
          fill="var(--color-forecast)"
          fillOpacity={0.7}
          name="Future P&L Commitments"
        />
      </ComposedChart>
    </ChartContainer>
  )
}
