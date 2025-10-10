import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SmartKPICardProps {
  title: string
  value: number | string
  trend?: number
  status?: 'critical' | 'warning' | 'good' | 'neutral'
  progress?: number
  action?: string
  onClick?: () => void
  icon?: React.ReactNode
  subtitle?: string
  borderColor?: string
  formatter?: (value: number | string) => string
}

export const SmartKPICard = React.memo(({
  title,
  value,
  trend,
  status = 'neutral',
  progress,
  action,
  onClick,
  icon,
  subtitle,
  borderColor = 'border-l-primary',
  formatter
}: SmartKPICardProps) => {
  const getTrendIcon = () => {
    if (trend === undefined || trend === null) return null
    
    if (trend === 0) {
      return (
        <div className="flex items-center gap-1 text-muted-foreground">
          <Minus className="h-3 w-3" />
          <span className="text-xs">No change</span>
        </div>
      )
    }
    
    return trend > 0 ? (
      <div className="flex items-center gap-1 text-green-600">
        <TrendingUp className="h-3 w-3" />
        <span className="text-xs">+{Math.abs(trend)}%</span>
      </div>
    ) : (
      <div className="flex items-center gap-1 text-red-600">
        <TrendingDown className="h-3 w-3" />
        <span className="text-xs">{trend}%</span>
      </div>
    )
  }

  const getStatusVariant = () => {
    switch(status) {
      case 'critical': return 'destructive'
      case 'warning': return 'secondary'
      case 'good': return 'default'
      default: return 'outline'
    }
  }

  const getStatusIcon = () => {
    switch(status) {
      case 'critical': return <AlertCircle className="h-3 w-3" />
      case 'good': return <CheckCircle className="h-3 w-3" />
      default: return null
    }
  }

  const formattedValue = formatter ? formatter(value) : value

  return (
    <Card 
      className={cn(
        "relative overflow-hidden border-l-4 transition-all duration-200",
        borderColor,
        onClick && "hover:shadow-lg cursor-pointer hover:scale-[1.02]",
        "group"
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`${title}: ${formattedValue}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon && (
              <div className="text-muted-foreground">
                {icon}
              </div>
            )}
            <CardTitle className="text-sm font-medium" id={`kpi-${title.toLowerCase().replace(/\s+/g, '-')}`}>
              {title}
            </CardTitle>
          </div>
          {status !== 'neutral' && (
            <Badge variant={getStatusVariant()} className="flex items-center gap-1">
              {getStatusIcon()}
              <span>{status}</span>
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div 
            className="text-2xl font-bold text-card-foreground" 
            aria-labelledby={`kpi-${title.toLowerCase().replace(/\s+/g, '-')}`}
            aria-live="polite"
            aria-atomic="true"
          >
            {formattedValue}
          </div>
          
          {progress !== undefined && (
            <div className="space-y-1">
              <Progress 
                value={progress} 
                className="h-2"
                aria-label={`Progress: ${progress}%`}
              />
              <p className="text-xs text-muted-foreground">
                {progress}% complete
              </p>
            </div>
          )}
          
          {trend !== undefined && getTrendIcon()}
          
          {subtitle && (
            <p className="text-xs text-muted-foreground">
              {subtitle}
            </p>
          )}
          
          {action && (
            <p className="text-xs text-primary font-medium group-hover:underline">
              {action} →
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
})

SmartKPICard.displayName = 'SmartKPICard'

// Export a variant for minimal cards without progress/trend
export const MiniKPICard = React.memo(({
  title,
  value,
  icon,
  change,
  changeType = 'neutral'
}: {
  title: string
  value: string | number
  icon?: React.ReactNode
  change?: string
  changeType?: 'increase' | 'decrease' | 'neutral'
}) => {
  const changeColor = changeType === 'increase' ? 'text-green-600' : 
                      changeType === 'decrease' ? 'text-red-600' : 
                      'text-muted-foreground'
  
  return (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-2">
        {icon && (
          <div className="text-muted-foreground">
            {icon}
          </div>
        )}
        <div>
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="text-lg font-semibold">{value}</p>
        </div>
      </div>
      {change && (
        <p className={cn("text-xs", changeColor)}>
          {change}
        </p>
      )}
    </div>
  )
})

MiniKPICard.displayName = 'MiniKPICard'