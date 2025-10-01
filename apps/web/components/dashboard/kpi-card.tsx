import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KPICardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: number
  format?: 'currency' | 'percent' | 'number'
  color?: 'primary' | 'success' | 'warning' | 'danger'
  className?: string
}

export function KPICard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  format = 'number',
  color = 'primary',
  className 
}: KPICardProps) {
  const formatValue = () => {
    const numValue = Number(value)
    switch(format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
          notation: numValue > 1000000 ? 'compact' : 'standard'
        }).format(numValue)
      case 'percent':
        return `${numValue.toFixed(1)}%`
      default:
        return value.toString()
    }
  }
  
  const borderColor = {
    primary: 'border-l-blue-500',
    success: 'border-l-green-500',
    warning: 'border-l-yellow-500',
    danger: 'border-l-red-500'
  }[color]
  
  return (
    <Card className={cn('border-l-4 hover:shadow-lg transition-shadow', borderColor, className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatValue()}</div>
        {trend !== undefined && (
          <div className={cn(
            'flex items-center text-xs mt-1',
            trend >= 0 ? 'text-green-600' : 'text-red-600'
          )}>
            {trend >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            <span>{Math.abs(trend).toFixed(1)}%</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}