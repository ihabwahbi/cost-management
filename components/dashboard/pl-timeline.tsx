'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'
import { 
  Calendar,
  TrendingUp,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface PLTimelineEntry {
  month: string
  actualPL: number
  projectedPL: number
  budget: number
  cumulative: number
}

interface PLEvent {
  date: string
  amount: number
  description: string
  type: 'invoice' | 'expected' | 'overdue'
}

interface PLTimelineProps {
  data: PLTimelineEntry[]
  events?: PLEvent[]
  currentMonth?: number
  view?: 'monthly' | 'quarterly' | 'yearly'
  onViewChange?: (view: 'monthly' | 'quarterly' | 'yearly') => void
  onRefresh?: () => void
  loading?: boolean
}

/**
 * P&L Timeline Component
 * Shows when actual costs have hit (invoiced) and when future costs will hit (based on supplier promises)
 */
export function PLTimeline({
  data,
  events = [],
  currentMonth = new Date().getMonth(),
  view = 'monthly',
  onViewChange,
  onRefresh,
  loading = false
}: PLTimelineProps) {


  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: value > 1000000 ? 'compact' : 'standard'
    }).format(value)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {data.actualPL > 0 && (
            <p className="text-sm text-green-600">
              Actual P&L: {formatCurrency(data.actualPL)}
            </p>
          )}
          {data.projectedPL > 0 && (
            <p className="text-sm text-amber-600">
              Projected P&L: {formatCurrency(data.projectedPL)}
            </p>
          )}
          <p className="text-sm text-blue-600">
            Budget: {formatCurrency(data.budget)}
          </p>
          <p className="text-sm font-semibold text-gray-900 mt-1 pt-1 border-t">
            Cumulative: {formatCurrency(data.cumulative)}
          </p>
        </div>
      )
    }
    return null
  }

  // Calculate max value for Y-axis
  const maxValue = Math.max(
    ...data.map(d => Math.max(d.actualPL + d.projectedPL, d.budget, d.cumulative))
  )

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>P&L IMPACT TIMELINE</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          ACTUAL COST TIMELINE (When Costs Hit)
        </CardTitle>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-md p-1">
            {(['monthly', 'quarterly', 'yearly'] as const).map((v) => (
              <Button
                key={v}
                variant={view === v ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  "px-3 py-1 text-xs",
                  view === v ? "bg-blue-600 text-white" : "text-gray-600"
                )}
                onClick={() => onViewChange?.(v)}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </Button>
            ))}
          </div>
          
          {/* Refresh Button */}
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Chart */}
        <div className="h-[400px] mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}

            >
              <defs>
                <pattern id="stripes" patternUnits="userSpaceOnUse" width="4" height="4">
                  <path d="M 0 4 L 4 0" stroke="#fbbf24" strokeWidth="1" opacity="0.5" />
                </pattern>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              
              <YAxis 
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
                tickFormatter={(value) => `$${(value / 1000)}K`}
                domain={[0, maxValue * 1.1]}
              />
              
              <Tooltip content={<CustomTooltip />} />
              
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="rect"
              />

              {/* Budget baseline */}
              <Line
                type="monotone"
                dataKey="budget"
                stroke="#3b82f6"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Budget Baseline"
                dot={false}
              />

              {/* Actual P&L (solid bars) */}
              <Bar
                dataKey="actualPL"
                fill="#10b981"
                name="Actual P&L Impact"
                radius={[4, 4, 0, 0]}
              />

              {/* Projected P&L (striped bars) */}
              <Bar
                dataKey="projectedPL"
                fill="url(#stripes)"
                name="Projected P&L Impact"
                radius={[4, 4, 0, 0]}
              />

              {/* Cumulative line */}
              <Line
                type="monotone"
                dataKey="cumulative"
                stroke="#6366f1"
                strokeWidth={3}
                name="Cumulative P&L"
                dot={{ fill: '#6366f1', r: 4 }}
              />

              {/* Current month marker */}
              <ReferenceLine
                x={data[currentMonth]?.month}
                stroke="#ef4444"
                strokeWidth={2}
                label={{ value: "TODAY", position: "top" }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded" />
            <span className="text-sm text-gray-600">Actual Cost (Invoiced)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-amber-400 rounded opacity-50" 
                 style={{ background: 'repeating-linear-gradient(45deg, #fbbf24, #fbbf24 2px, transparent 2px, transparent 4px)' }} />
            <span className="text-sm text-gray-600">Future Cost (Based on Promise Dates)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-blue-500" />
            <span className="text-sm text-gray-600">Monthly Budget</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-indigo-500" />
            <span className="text-sm text-gray-600">Cumulative Cost</span>
          </div>
        </div>

        {/* Key Events */}
        {events.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Key Cost Events
            </h4>
            <div className="space-y-2">
              {events.slice(0, 5).map((event, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {event.type === 'overdue' && (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    {event.type === 'invoice' && (
                      <Badge variant="outline" className="text-xs border-green-500 text-green-600">
                        INVOICED
                      </Badge>
                    )}
                    {event.type === 'expected' && (
                      <Badge variant="outline" className="text-xs border-amber-500 text-amber-600">
                        EXPECTED
                      </Badge>
                    )}
                    <span className="text-gray-700">
                      {formatDate(event.date)}: {event.description}
                    </span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(event.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}