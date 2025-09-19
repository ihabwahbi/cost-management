'use client'

import { ChartContainer, ChartConfig, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

const chartConfig: ChartConfig = {
  amount: {
    label: 'Monthly Spend',
    color: '#0014dc',
  },
  cumulative: {
    label: 'Cumulative',
    color: '#00d2dc',
  }
}

interface BurnRateData {
  month: string
  amount: number
  cumulative: number
}

interface BurnRateChartProps {
  data: BurnRateData[]
}

export function BurnRateChart({ data }: BurnRateChartProps) {
  return (
    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
      <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
              formatter={(value: any) => {
                return `$${(Number(value) / 1000).toFixed(1)}K`
              }}
            />
          }
        />
        <Bar 
          dataKey="amount" 
          fill="var(--color-amount)"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  )
}