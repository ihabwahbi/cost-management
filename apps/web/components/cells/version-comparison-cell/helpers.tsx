import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export function MetricCard({ 
  title, 
  value, 
  change, 
  trend = 'neutral', 
  icon, 
  description 
}: {
  title: string
  value: string | number
  change?: string | number
  trend?: 'up' | 'down' | 'neutral'
  icon?: React.ReactNode
  description?: string
}) {
  const trendIcons = {
    up: <TrendingUp className="h-4 w-4" />,
    down: <TrendingDown className="h-4 w-4" />,
    neutral: <Minus className="h-4 w-4" />
  }

  const trendColors = {
    up: 'text-red-600',
    down: 'text-green-600',
    neutral: 'text-muted-foreground'
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between space-x-2">
          <div className="space-y-1 flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
        {change !== undefined && (
          <div className={cn("flex items-center gap-1 mt-2", trendColors[trend])}>
            {trendIcons[trend]}
            <span className="text-xs font-medium">{change}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
