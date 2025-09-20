'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Settings,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CategoryData {
  name: string
  budget: number
  committed: number
  plImpact: number
  gapToPL: number
}

interface FinancialControlMatrixProps {
  categories: CategoryData[]
  onDrillDown?: (category: string) => void
  onCustomize?: () => void
  loading?: boolean
}

export function FinancialControlMatrix({
  categories,
  onDrillDown,
  onCustomize,
  loading = false
}: FinancialControlMatrixProps) {
  
  const formatCurrency = (value: number, compact = false) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: compact ? 'compact' : 'standard'
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${value.toFixed(0)}%`
  }

  // Find insights from the data
  const getInsights = () => {
    const insights = []
    
    // Find category with largest P&L gap
    const largestGap = categories.reduce((max, cat) => 
      cat.gapToPL > max.gapToPL ? cat : max
    , categories[0])
    
    if (largestGap && largestGap.gapToPL > 0) {
      insights.push({
        type: 'warning',
        text: `${largestGap.name} has largest P&L gap (${formatCurrency(largestGap.gapToPL, true)} uncommitted)`
      })
    }

    // Find most efficient category (highest % of commitments in P&L)
    const mostEfficient = categories.reduce((best, cat) => {
      const catEfficiency = cat.committed > 0 ? (cat.plImpact / cat.committed) * 100 : 0
      const bestEfficiency = best.committed > 0 ? (best.plImpact / best.committed) * 100 : 0
      return catEfficiency > bestEfficiency ? cat : best
    }, categories[0])

    if (mostEfficient && mostEfficient.committed > 0) {
      const efficiency = (mostEfficient.plImpact / mostEfficient.committed) * 100
      insights.push({
        type: 'success',
        text: `${mostEfficient.name} most efficient (${efficiency.toFixed(0)}% of commitments in P&L)`
      })
    }

    // Find category with smallest future P&L risk
    const smallestRisk = categories.reduce((min, cat) => 
      cat.gapToPL < min.gapToPL ? cat : min
    , categories[0])
    
    if (smallestRisk) {
      insights.push({
        type: 'info',
        text: `${smallestRisk.name} has smallest future P&L risk (${formatCurrency(smallestRisk.gapToPL, true)})`
      })
    }

    return insights
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>FINANCIAL CONTROL MATRIX</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const insights = getInsights()

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">FINANCIAL CONTROL MATRIX</CardTitle>
        {onCustomize && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onCustomize}
            className="flex items-center gap-1"
          >
            <Settings className="h-4 w-4" />
            Customize
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Matrix Header */}
        <div className="grid grid-cols-5 gap-4 pb-3 border-b text-sm font-medium text-gray-600">
          <div>Category</div>
          <div className="text-right">Budget</div>
          <div className="text-right">Total PO Value</div>
          <div className="text-right">Actual Cost</div>
          <div className="text-right">Open PO</div>
        </div>

        {/* Category Rows */}
        <div className="space-y-4">
          {categories.map((category) => {
            const committedPercent = category.budget > 0 
              ? (category.committed / category.budget) * 100 : 0
            const plPercent = category.budget > 0 
              ? (category.plImpact / category.budget) * 100 : 0
            const gapPercent = category.budget > 0 
              ? (category.gapToPL / category.budget) * 100 : 0

            return (
              <div 
                key={category.name}
                className="group hover:bg-gray-50 rounded-lg p-3 transition-colors cursor-pointer"
                onClick={() => onDrillDown?.(category.name)}
              >
                {/* Category Name */}
                <div className="grid grid-cols-5 gap-4 items-center mb-3">
                  <div className="font-medium text-gray-900 flex items-center gap-2">
                    {category.name}
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                  <div className="text-right font-semibold">
                    {formatCurrency(category.budget)}
                  </div>
                  <div className="text-right font-semibold">
                    {formatCurrency(category.committed)}
                  </div>
                  <div className="text-right font-semibold text-green-600">
                    {formatCurrency(category.plImpact)}
                  </div>
                  <div className="text-right font-semibold text-amber-600">
                    {formatCurrency(category.gapToPL)}
                  </div>
                </div>

                {/* Progress Bars */}
                <div className="grid grid-cols-5 gap-4 items-center">
                  <div className="text-xs text-gray-500">
                    100%
                  </div>
                  
                  {/* Budget Bar (always 100%) */}
                  <div className="relative">
                    <Progress value={100} className="h-2" />
                    <span className="absolute -top-5 right-0 text-xs text-gray-500">100%</span>
                  </div>

                  {/* Committed Bar */}
                  <div className="relative">
                    <Progress 
                      value={Math.min(committedPercent, 100)} 
                      className={cn(
                        "h-2",
                        committedPercent > 100 && "[&>div]:bg-red-500"
                      )}
                    />
                    <span className="absolute -top-5 right-0 text-xs text-gray-500">
                      {formatPercent(committedPercent)}
                    </span>
                  </div>

                  {/* P&L Impact Bar */}
                  <div className="relative">
                    <Progress 
                      value={Math.min(plPercent, 100)} 
                      className="h-2 [&>div]:bg-green-500"
                    />
                    <span className="absolute -top-5 right-0 text-xs text-gray-500">
                      {formatPercent(plPercent)}
                    </span>
                  </div>

                  {/* Gap Bar */}
                  <div className="relative">
                    <Progress 
                      value={Math.min(gapPercent, 100)} 
                      className="h-2 [&>div]:bg-amber-500"
                    />
                    <span className="absolute -top-5 right-0 text-xs text-gray-500">
                      {formatPercent(gapPercent)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Insights Section */}
        {insights.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-blue-900 mb-2">
              <TrendingUp className="h-4 w-4" />
              Key Insights
            </div>
            {insights.map((insight, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm">
                {insight.type === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />}
                {insight.type === 'success' && <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />}
                {insight.type === 'info' && <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5" />}
                <span className="text-gray-700">{insight.text}</span>
              </div>
            ))}
            {onDrillDown && (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3"
                onClick={() => onDrillDown('all')}
              >
                Drill Into Categories
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}