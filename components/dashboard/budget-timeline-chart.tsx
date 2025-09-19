'use client'

import { ChartContainer, ChartConfig, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Area, Bar, Line, XAxis, YAxis, CartesianGrid, Legend, ComposedChart, ResponsiveContainer } from 'recharts'

const chartConfig: ChartConfig = {
  budget: {
    label: 'Budget',
    color: '#0014dc',
  },
  actual: {
    label: 'Actual Spend',
    color: '#00d2dc',
  },
  forecast: {
    label: 'Forecast',
    color: '#0099a3',
  },
}

interface TimelineData {
  month: string
  budget: number
  actual: number
  forecast: number
}

interface BudgetTimelineChartProps {
  data: TimelineData[]
}

export function BudgetTimelineChart({ data }: BudgetTimelineChartProps) {
  return (
    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
      <ComposedChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis 
          dataKey="month" 
          className="text-xs"
          tick={{ fill: 'currentColor', fontSize: 12 }}
          tickLine={{ stroke: 'currentColor' }}
        />
        <YAxis 
          className="text-xs"
          tick={{ fill: 'currentColor', fontSize: 12 }}
          tickLine={{ stroke: 'currentColor' }}
          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
        />
        <ChartTooltip 
          content={
            <ChartTooltipContent 
              className="w-[180px]"
              nameKey="month"
              formatter={(value: any) => {
                return `$${(Number(value) / 1000).toFixed(1)}K`
              }}
            />
          }
        />
        <Legend 
          wrapperStyle={{ paddingTop: '20px' }}
          iconType="line"
        />
        <Area
          type="monotone"
          dataKey="budget"
          fill="var(--color-budget)"
          fillOpacity={0.2}
          stroke="var(--color-budget)"
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="actual"
          stroke="var(--color-actual)"
          strokeWidth={2}
          dot={{ r: 3, fill: 'var(--color-actual)' }}
          activeDot={{ r: 5 }}
        />
        <Bar
          dataKey="forecast"
          fill="var(--color-forecast)"
          fillOpacity={0.6}
        />
      </ComposedChart>
    </ChartContainer>
  )
}