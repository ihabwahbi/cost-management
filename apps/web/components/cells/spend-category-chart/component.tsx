'use client'

import { useMemo } from 'react'
import { ChartContainer, ChartConfig } from '@/components/ui/chart'
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'
import { COLORS, renderCustomizedLabel, CustomTooltip } from './utils/chart-config'
import type { SpendCategoryChartProps } from './types'

export function SpendCategoryChart({ data }: SpendCategoryChartProps) {
  const chartConfig: ChartConfig = useMemo(() => 
    data.reduce((config, item, index) => {
      config[item.name] = {
        label: item.name,
        color: COLORS[index % COLORS.length]
      }
      return config
    }, {} as ChartConfig),
    [data]
  )

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
