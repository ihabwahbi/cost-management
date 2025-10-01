'use client'

import { ChartContainer, ChartConfig, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'

const COLORS = ['#0014dc', '#00d2dc', '#0099a3', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981']

interface CategoryData {
  name: string
  value: number
  budget: number
}

interface SpendCategoryChartProps {
  data: CategoryData[]
}

export function SpendCategoryChart({ data }: SpendCategoryChartProps) {
  const chartConfig: ChartConfig = data.reduce((config, item, index) => {
    config[item.name] = {
      label: item.name,
      color: COLORS[index % COLORS.length]
    }
    return config
  }, {} as ChartConfig)

  const RADIAN = Math.PI / 180
  const renderCustomizedLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, percent
  }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    if (percent < 0.05) return null // Don't show label for small slices

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <div className="grid grid-cols-1 gap-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">{data.name}:</span>
              <span className="text-sm font-bold">${(data.value / 1000).toFixed(1)}K</span>
            </div>
            {data.payload.budget && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">Budget:</span>
                <span className="text-xs">${(data.payload.budget / 1000).toFixed(1)}K</span>
              </div>
            )}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">Utilization:</span>
              <span className="text-xs">
                {data.payload.budget > 0 
                  ? `${((data.value / data.payload.budget) * 100).toFixed(1)}%`
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          verticalAlign="bottom" 
          height={36}
          iconType="square"
          formatter={(value: string) => (
            <span className="text-xs">{value}</span>
          )}
        />
      </PieChart>
    </ChartContainer>
  )
}