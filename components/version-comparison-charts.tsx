"use client"

import { useMemo } from "react"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  ComposedChart,
  Line,
  Area
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
  // Aggregate data by category
  const aggregatedData = useMemo(() => {
    const categoryMap = new Map<string, { increase: number; decrease: number }>()
    
    data.forEach(item => {
      if (!categoryMap.has(item.category)) {
        categoryMap.set(item.category, { increase: 0, decrease: 0 })
      }
      
      const cat = categoryMap.get(item.category)!
      if (item.change > 0) {
        cat.increase += item.change
      } else if (item.change < 0) {
        cat.decrease += Math.abs(item.change)
      }
    })
    
    // Convert to waterfall format
    const waterfall: Array<{
      name: string
      value: number
      fill: string
      isTotal?: boolean
      start?: number
      end?: number
    }> = []
    let runningTotal = data.reduce((sum, item) => sum + (item.v1_amount || 0), 0)
    
    // Starting value
    waterfall.push({
      name: "Version " + (data[0]?.v1_amount !== null ? "Start" : "0"),
      value: runningTotal,
      fill: "#6366f1",
      isTotal: true
    })
    
    // Add changes by category
    Array.from(categoryMap.entries()).forEach(([category, changes]) => {
      if (changes.increase > 0) {
        waterfall.push({
          name: category + " (+)",
          value: changes.increase,
          fill: "#22c55e",
          start: runningTotal,
          end: runningTotal + changes.increase
        })
        runningTotal += changes.increase
      }
      
      if (changes.decrease > 0) {
        waterfall.push({
          name: category + " (-)",
          value: -changes.decrease,
          fill: "#ef4444",
          start: runningTotal,
          end: runningTotal - changes.decrease
        })
        runningTotal -= changes.decrease
      }
    })
    
    // Ending value
    waterfall.push({
      name: "Version End",
      value: runningTotal,
      fill: "#6366f1",
      isTotal: true
    })
    
    return waterfall
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
      const isIncrease = data.value > 0 && !data.isTotal
      const isDecrease = data.value < 0 && !data.isTotal
      
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-sm">{data.name}</p>
          <p className={`text-sm ${isIncrease ? 'text-green-600' : isDecrease ? 'text-red-600' : 'text-blue-600'}`}>
            {data.isTotal ? 'Total: ' : isIncrease ? 'Increase: +' : 'Decrease: -'}
            {formatCurrency(data.value)}
          </p>
          {!data.isTotal && (
            <p className="text-xs text-gray-500 mt-1">
              From {formatCurrency(data.start)} to {formatCurrency(data.end)}
            </p>
          )}
        </div>
      )
    }
    return null
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
            data={aggregatedData}
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
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {aggregatedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
            {/* Add connecting lines for waterfall effect */}
            {aggregatedData.map((entry, index) => {
              if (!entry.isTotal && index > 0) {
                return (
                  <ReferenceLine
                    key={`line-${index}`}
                    segment={[
                      { x: index - 0.4, y: entry.start },
                      { x: index + 0.4, y: entry.start }
                    ]}
                    stroke="#94a3b8"
                    strokeDasharray="3 3"
                  />
                )
              }
              return null
            })}
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
    return data.map(item => ({
      ...item,
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
            <Legend />
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
            <ul className="space-y-2 text-sm">
              {insights.topIncreases.map((item, index) => (
                <li key={index} className="flex justify-between items-center">
                  <span className="text-gray-700">{item.item}</span>
                  <span className="font-medium text-green-700">
                    +{formatCurrency(item.change)} ({item.changePercent > 0 ? '+' : ''}{item.changePercent.toFixed(1)}%)
                  </span>
                </li>
              ))}
            </ul>
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
            <ul className="space-y-2 text-sm">
              {insights.topDecreases.map((item, index) => (
                <li key={index} className="flex justify-between items-center">
                  <span className="text-gray-700">{item.item}</span>
                  <span className="font-medium text-red-700">
                    -{formatCurrency(Math.abs(item.change))} ({item.changePercent.toFixed(1)}%)
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      
      {insights.largestPercent && Math.abs(insights.largestPercent.changePercent) > 20 && (
        <Card className="border-amber-200 bg-amber-50/30">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <CardTitle className="text-base">Significant Change Alert</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700">
              <span className="font-medium">{insights.largestPercent.item}</span> has changed by{' '}
              <span className="font-bold text-amber-700">
                {insights.largestPercent.changePercent > 0 ? '+' : ''}{insights.largestPercent.changePercent.toFixed(1)}%
              </span>
              {' '}({insights.largestPercent.change > 0 ? '+' : '-'}{formatCurrency(Math.abs(insights.largestPercent.change))})
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}