'use client'

import { useMemo } from 'react'
import { trpc } from '@/lib/trpc'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { TrendingUp, TrendingDown, DollarSign, FileText, Package, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface POBudgetComparisonCellProps {
  projectId: string
  onViewDetails?: () => void
  className?: string
}

export function POBudgetComparisonCell({ 
  projectId, 
  onViewDetails,
  className 
}: POBudgetComparisonCellProps) {
  // Query PO summary with memoized input (CRITICAL: prevent infinite loops)
  const queryInput = useMemo(() => ({ projectId }), [projectId])
  
  const { data, isLoading, error } = trpc.poMapping.getPOSummary.useQuery(queryInput, {
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
  
  // Calculate metrics (memoized to prevent recalculation on every render)
  const metrics = useMemo(() => {
    if (!data) return null
    
    const variance = data.budget - data.total
    const variancePercent = data.budget > 0 ? (variance / data.budget) * 100 : 0
    const utilizationPercent = data.budget > 0 ? (data.total / data.budget) * 100 : 0
    const invoicedPercent = data.total > 0 ? (data.invoiced / data.total) * 100 : 0
    
    return {
      variance,
      variancePercent,
      utilizationPercent,
      invoicedPercent
    }
  }, [data])
  
  // Currency formatting helper
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(amount))
  }

  const formatCompactCurrency = (value: number) => {
    const absValue = Math.abs(value)
    if (absValue >= 1000000) {
      return `$${(absValue / 1000000).toFixed(1)}M`
    } else if (absValue >= 1000) {
      return `$${(absValue / 1000).toFixed(0)}K`
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(absValue)
  }
  
  const getVarianceColor = () => {
    if (!metrics) return ""
    if (metrics.variance >= 0) return "text-green-600"
    if (Math.abs(metrics.variancePercent) <= 10) return "text-yellow-600"
    return "text-red-600"
  }
  
  const getVarianceIcon = () => {
    if (!metrics) return null
    if (metrics.variance >= 0) return <TrendingDown className="w-4 h-4" />
    return <TrendingUp className="w-4 h-4" />
  }
  
  // Loading state (BA-002)
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Budget vs Actual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    )
  }
  
  // Error state (BA-004)
  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading PO Summary</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    )
  }
  
  // Empty state - no mappings (BA-003)
  if (!data || data.mappingCount === 0) {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Budget vs Actual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Package className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-sm text-muted-foreground">No PO mappings found</p>
            <p className="text-xs text-muted-foreground mt-1">Map POs to see actual spending</p>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  if (!metrics) return null
  
  // Success state - render full comparison (BA-001)
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Budget vs Actual
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Budget</p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-xl font-bold cursor-help">{formatCompactCurrency(data.budget)}</p>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{formatCurrency(data.budget)}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Actual (POs)</p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-xl font-bold cursor-help">{formatCompactCurrency(data.total)}</p>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{formatCurrency(data.total)}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        {/* Utilization Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Budget Utilization</span>
            <span className="font-medium">{metrics.utilizationPercent.toFixed(1)}%</span>
          </div>
          <Progress 
            value={Math.min(metrics.utilizationPercent, 100)} 
            className={cn(
              "h-2",
              metrics.utilizationPercent > 100 && "[&>div]:bg-red-500",
              metrics.utilizationPercent > 90 && metrics.utilizationPercent <= 100 && "[&>div]:bg-yellow-500"
            )}
          />
          {metrics.utilizationPercent > 100 && (
            <div className="flex items-center gap-1 text-xs text-red-600">
              <AlertCircle className="w-3 h-3" />
              Over budget by {formatCurrency(Math.abs(metrics.variance))}
            </div>
          )}
        </div>
        
        {/* PO Breakdown */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground flex items-center gap-1">
              <FileText className="w-3 h-3" />
              Invoiced
            </span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{formatCurrency(data.invoiced)}</span>
              <Badge variant="outline" className="text-xs">
                {metrics.invoicedPercent.toFixed(0)}%
              </Badge>
            </div>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground flex items-center gap-1">
              <Package className="w-3 h-3" />
              Open
            </span>
            <span className="font-medium">{formatCurrency(data.open)}</span>
          </div>
        </div>
        
        <Separator />
        
        {/* Variance */}
        <div className={cn("flex justify-between items-center", getVarianceColor())}>
          <div className="flex items-center gap-2">
            {getVarianceIcon()}
            <span className="font-medium">Variance</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold">
              {metrics.variance >= 0 ? '-' : '+'}{formatCurrency(metrics.variance)}
            </span>
            <Badge 
              variant={metrics.variance >= 0 ? "default" : "destructive"}
              className="text-xs"
            >
              {metrics.variancePercent > 0 ? '-' : '+'}{Math.abs(metrics.variancePercent).toFixed(1)}%
            </Badge>
          </div>
        </div>
        
        {/* PO Count and View Details */}
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground text-center">
            Based on {data.mappingCount} mapped PO{data.mappingCount !== 1 ? 's' : ''}
          </div>
          {onViewDetails && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={onViewDetails}
            >
              View PO Details
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
