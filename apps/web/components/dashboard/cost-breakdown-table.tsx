'use client'

import { useState } from 'react'
import { ChevronRight, ChevronDown, ExternalLink } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface CostBreakdownRow {
  id: string
  level: 'business_line' | 'cost_line' | 'spend_type' | 'sub_category'
  name: string
  budget: number
  actual: number
  variance: number
  utilization: number
  children?: CostBreakdownRow[]
}

interface CostBreakdownTableProps {
  data: CostBreakdownRow[]
}

export function CostBreakdownTable({ data }: CostBreakdownTableProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expanded)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpanded(newExpanded)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: Math.abs(value) > 999999 ? 'compact' : 'standard'
    }).format(value)
  }

  const getUtilizationColor = (utilization: number) => {
    if (utilization > 100) return 'text-red-600 font-bold'
    if (utilization > 90) return 'text-orange-600 font-semibold'
    if (utilization > 75) return 'text-yellow-600'
    return 'text-gray-600'
  }

  const getProgressColor = (utilization: number) => {
    if (utilization > 100) return 'bg-red-500'
    if (utilization > 90) return 'bg-orange-500'
    if (utilization > 75) return 'bg-yellow-500'
    return 'bg-blue-500'
  }

  const getLevelBadgeVariant = (level: string): "default" | "secondary" | "outline" | "destructive" => {
    switch(level) {
      case 'business_line': return 'default'
      case 'cost_line': return 'secondary'
      case 'spend_type': return 'outline'
      default: return 'outline'
    }
  }

  const renderRow = (row: CostBreakdownRow, depth: number = 0): React.ReactElement => {
    const isExpanded = expanded.has(row.id)
    const hasChildren = row.children && row.children.length > 0
    const indent = depth * 24

    return (
      <>
        <TableRow 
          key={row.id} 
          className={cn(
            "hover:bg-muted/50 transition-colors",
            depth === 0 && "font-semibold",
            depth === 1 && "font-medium"
          )}
        >
          <TableCell style={{ paddingLeft: `${indent + 16}px` }}>
            <div className="flex items-center gap-2">
              {hasChildren && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 h-5 w-5"
                  onClick={() => toggleExpand(row.id)}
                >
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              )}
              {!hasChildren && depth > 0 && <div className="w-5" />}
              <span className={cn(depth === 0 && "font-semibold")}>{row.name}</span>
              <Badge variant={getLevelBadgeVariant(row.level)} className="text-xs ml-2">
                {row.level.replace('_', ' ')}
              </Badge>
            </div>
          </TableCell>
          <TableCell className="text-right">{formatCurrency(row.budget)}</TableCell>
          <TableCell className="text-right">{formatCurrency(row.actual)}</TableCell>
          <TableCell className="text-right">
            <span className={cn(
              row.variance >= 0 ? 'text-green-600' : 'text-red-600',
              Math.abs(row.variance) > row.budget * 0.2 && 'font-semibold'
            )}>
              {formatCurrency(Math.abs(row.variance))}
              {row.variance < 0 && ' over'}
            </span>
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={cn("h-full transition-all", getProgressColor(row.utilization))}
                  style={{ width: `${Math.min(row.utilization, 100)}%` }}
                />
              </div>
              <span className={cn(
                "text-xs w-12 text-right",
                getUtilizationColor(row.utilization)
              )}>
                {row.utilization.toFixed(0)}%
              </span>
            </div>
          </TableCell>
          <TableCell>
            {row.level === 'sub_category' && (
              <Button variant="outline" size="sm" className="h-7">
                <ExternalLink className="h-3 w-3 mr-1" />
                Details
              </Button>
            )}
          </TableCell>
        </TableRow>
        {isExpanded && hasChildren && row.children?.map(child => renderRow(child, depth + 1))}
      </>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No cost breakdown data available
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%]">Category</TableHead>
            <TableHead className="text-right">Budget</TableHead>
            <TableHead className="text-right">Actual</TableHead>
            <TableHead className="text-right">Variance</TableHead>
            <TableHead className="w-[20%]">Utilization</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map(row => renderRow(row))}
        </TableBody>
      </Table>
    </div>
  )
}