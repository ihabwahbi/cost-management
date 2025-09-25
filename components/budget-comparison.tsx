"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { TrendingUp, TrendingDown, DollarSign, FileText, Package, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface BudgetComparisonProps {
  budget: number
  actual: {
    total: number
    invoiced: number
    open: number
    mappingCount: number
  }
  loading?: boolean
  className?: string
  onViewDetails?: () => void
}

export function BudgetComparison({ budget, actual, loading = false, className, onViewDetails }: BudgetComparisonProps) {
  const variance = budget - actual.total
  const variancePercent = budget > 0 ? (variance / budget) * 100 : 0
  const utilizationPercent = budget > 0 ? (actual.total / budget) * 100 : 0
  const invoicedPercent = actual.total > 0 ? (actual.invoiced / actual.total) * 100 : 0
  
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
    if (variance >= 0) return "text-green-600"
    if (Math.abs(variancePercent) <= 10) return "text-yellow-600"
    return "text-red-600"
  }
  
  const getVarianceIcon = () => {
    if (variance >= 0) return <TrendingDown className="w-4 h-4" />
    return <TrendingUp className="w-4 h-4" />
  }
  
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Budget vs Actual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  if (actual.mappingCount === 0) {
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
                  <p className="text-xl font-bold cursor-help">{formatCompactCurrency(budget)}</p>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{formatCurrency(budget)}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Actual (POs)</p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-xl font-bold cursor-help">{formatCompactCurrency(actual.total)}</p>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{formatCurrency(actual.total)}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        {/* Utilization Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Budget Utilization</span>
            <span className="font-medium">{utilizationPercent.toFixed(1)}%</span>
          </div>
          <Progress 
            value={Math.min(utilizationPercent, 100)} 
            className={cn(
              "h-2",
              utilizationPercent > 100 && "[&>div]:bg-red-500",
              utilizationPercent > 90 && utilizationPercent <= 100 && "[&>div]:bg-yellow-500"
            )}
          />
          {utilizationPercent > 100 && (
            <div className="flex items-center gap-1 text-xs text-red-600">
              <AlertCircle className="w-3 h-3" />
              Over budget by {formatCurrency(Math.abs(variance))}
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
              <span className="font-medium">{formatCurrency(actual.invoiced)}</span>
              <Badge variant="outline" className="text-xs">
                {invoicedPercent.toFixed(0)}%
              </Badge>
            </div>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground flex items-center gap-1">
              <Package className="w-3 h-3" />
              Open
            </span>
            <span className="font-medium">{formatCurrency(actual.open)}</span>
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
              {variance >= 0 ? '-' : '+'}{formatCurrency(variance)}
            </span>
            <Badge 
              variant={variance >= 0 ? "default" : "destructive"}
              className="text-xs"
            >
              {variancePercent > 0 ? '-' : '+'}{Math.abs(variancePercent).toFixed(1)}%
            </Badge>
          </div>
        </div>
        
        {/* PO Count and View Details */}
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground text-center">
            Based on {actual.mappingCount} mapped PO{actual.mappingCount !== 1 ? 's' : ''}
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