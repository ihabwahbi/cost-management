"use client"

import { useMemo } from "react"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  ComposedChart,
  Line
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react"

interface WaterfallChartProps {
  data: Array<{
    id: string
    category: string
    v1_amount: number | null
    v2_amount: number | null
    change: number
  }>
  title?: string
  description?: string
}

export function WaterfallChart({ data, title = "Budget Change Waterfall", description }: WaterfallChartProps) {
  // Process data for waterfall visualization
  const chartData = useMemo(() => {
    console.log('[Charts] WaterfallChart rendering:', {
      inputData: data,
      dataLength: data.length,
      timestamp: Date.now()
    })
    
    // Aggregate by category
    const categoryTotals = new Map<string, number>()
    data.forEach(item => {
      const current = categoryTotals.get(item.category) || 0
      categoryTotals.set(item.category, current + item.change)
    })
    
    // Build waterfall data
    const result: any[] = []
    let cumulative = data.reduce((sum, item) => sum + (item.v1_amount || 0), 0)
    
    // Start bar
    result.push({
      name: 'Start',
      value: cumulative,
      displayValue: cumulative,
      fill: '#6366f1',
      isTotal: true
    })
    
    // Category changes
    Array.from(categoryTotals.entries()).forEach(([category, change]) => {
      if (change !== 0) {
        const previousCumulative = cumulative
        cumulative += change
        
        result.push({
          name: category,
          // For floating bars: [min, max] array
          value: change > 0 
            ? [previousCumulative, cumulative]  // Increase: float up from previous
            : [cumulative, previousCumulative],  // Decrease: float down to new value
          displayValue: Math.abs(change),
          actualChange: change,
          fill: change > 0 ? '#22c55e' : '#ef4444',
          isTotal: false
        })
      }
    })
    
    // End bar
    result.push({
      name: 'End',
      value: cumulative,
      displayValue: cumulative,
      fill: '#6366f1',
      isTotal: true
    })
    
    return result
  }, [data])
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(value))
  }
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload
      
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-sm">{data.name}</p>
          <p className={`text-sm font-semibold ${
            data.isTotal ? 'text-blue-600' : 
            data.actualChange > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {data.isTotal ? 'Total: ' : data.actualChange > 0 ? '+' : '-'}
            {formatCurrency(data.displayValue)}
          </p>
        </div>
      )
    }
    return null
  }
  
  // Custom bar shape for floating effect
  const FloatingBar = (props: any) => {
    const { fill, x, y, width, height, payload } = props
    
    // For total bars, render normally from 0
    if (payload.isTotal) {
      return <rect x={x} y={y} width={width} height={height} fill={fill} rx={4} />
    }
    
    // For change bars, we already have the correct y and height from Recharts
    // when using array values [min, max]
    return <rect x={x} y={y} width={width} height={height} fill={fill} rx={4} />
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart 
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={100}
              tick={{ fontSize: 11 }}
            />
            <YAxis 
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
              tick={{ fontSize: 11 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="value"
              shape={FloatingBar}
              isAnimationActive={false}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

interface CategoryComparisonChartProps {
  data: Array<{
    category: string
    v1_total: number
    v2_total: number
    change: number
    changePercent: number
  }>
}

export function CategoryComparisonChart({ data }: CategoryComparisonChartProps) {
  const chartData = useMemo(() => {
    console.log('[Charts] CategoryComparison data:', {
      inputData: data,
      dataLength: data.length,
      timestamp: Date.now()
    })
    
    return data.map(item => ({
      ...item,
      changePercent: item.changePercent || 0,
      changeColor: item.change > 0 ? "#22c55e" : item.change < 0 ? "#ef4444" : "#94a3b8"
    }))
  }, [data])
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Category-Level Comparison</CardTitle>
        <CardDescription>Budget changes by business line</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="category" 
              angle={-45}
              textAnchor="end"
              height={100}
              tick={{ fontSize: 11 }}
            />
            <YAxis 
              yAxisId="amount"
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
              tick={{ fontSize: 11 }}
            />
            <YAxis 
              yAxisId="percent"
              orientation="right"
              tickFormatter={(value) => `${value}%`}
              tick={{ fontSize: 11 }}
            />
            <Tooltip 
              formatter={(value: any, name: string) => {
                if (name === "Change %") return `${value.toFixed(1)}%`
                return `$${(value / 1000).toFixed(1)}K`
              }}
            />
            <Bar yAxisId="amount" dataKey="v1_total" fill="#cbd5e1" name="Version 1" />
            <Bar yAxisId="amount" dataKey="v2_total" fill="#6366f1" name="Version 2" />
            <Line 
              yAxisId="percent" 
              type="monotone" 
              dataKey="changePercent" 
              stroke="#f97316"
              strokeWidth={2}
              name="Change %"
              dot={{ fill: '#f97316', r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

interface VarianceInsightsProps {
  data: Array<{
    category: string
    item: string
    change: number
    changePercent: number
  }>
}

export function VarianceInsights({ data }: VarianceInsightsProps) {
  // Find significant changes
  const insights = useMemo(() => {
    const sorted = [...data].sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
    const topIncreases = sorted.filter(d => d.change > 0).slice(0, 3)
    const topDecreases = sorted.filter(d => d.change < 0).slice(0, 3)
    const largestPercent = sorted.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))[0]
    
    return { topIncreases, topDecreases, largestPercent }
  }, [data])
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(value))
  }
  
  return (
    <div className="grid gap-4">
      {insights.topIncreases.length > 0 && (
        <Card className="border-green-200 bg-green-50/30">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <CardTitle className="text-base">Top Budget Increases</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {insights.topIncreases.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.category}</p>
                    <p className="text-xs text-muted-foreground">{item.item}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-600">
                      +{formatCurrency(item.change)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      +{item.changePercent.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {insights.topDecreases.length > 0 && (
        <Card className="border-red-200 bg-red-50/30">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <TrendingDown className="w-5 h-5 text-red-600" />
              <CardTitle className="text-base">Top Budget Decreases</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {insights.topDecreases.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.category}</p>
                    <p className="text-xs text-muted-foreground">{item.item}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-red-600">
                      -{formatCurrency(Math.abs(item.change))}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.changePercent.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {insights.largestPercent && Math.abs(insights.largestPercent.changePercent) > 10 && (
        <Card className="border-orange-200 bg-orange-50/30">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <CardTitle className="text-base">Significant % Change</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              <span className="font-medium">{insights.largestPercent.category}</span> had a{" "}
              <span className={`font-bold ${insights.largestPercent.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {insights.largestPercent.changePercent > 0 ? '+' : ''}{insights.largestPercent.changePercent.toFixed(1)}%
              </span>{" "}
              change ({insights.largestPercent.change > 0 ? '+' : ''}{formatCurrency(insights.largestPercent.change)})
            </p>
            <p className="text-xs text-muted-foreground mt-1">{insights.largestPercent.item}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}