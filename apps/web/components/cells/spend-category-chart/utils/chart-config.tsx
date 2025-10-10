import type { TooltipProps } from 'recharts'

export const COLORS = [
  '#0014dc', '#00d2dc', '#0099a3', '#6366f1', 
  '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'
]

const RADIAN = Math.PI / 180

// Recharts Pie label props
interface PieLabelProps {
  cx: number
  cy: number
  midAngle: number
  innerRadius: number
  outerRadius: number
  percent: number
}

export const renderCustomizedLabel = ({
  cx, cy, midAngle, innerRadius, outerRadius, percent
}: PieLabelProps) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  if (percent < 0.05) return null

  return (
    <text 
      x={x} y={y} fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      className="text-xs font-medium"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const data = payload[0]
    const value = data.value ?? 0
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-1 gap-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">{data.name}:</span>
            <span className="text-sm font-bold">${(value / 1000).toFixed(1)}K</span>
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
                ? `${((value / data.payload.budget) * 100).toFixed(1)}%`
                : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    )
  }
  return null
}
