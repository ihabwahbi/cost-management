'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Package } from 'lucide-react'
import { TreemapView } from './components/treemap-view'
import { ListView } from './components/list-view'
import { groupByCategory, formatCurrency } from './utils/data-formatters'
import type { SpendSubcategoryChartProps } from './types'

/**
 * Dual-view spend subcategory visualization
 * Supports treemap and expandable list views with budget utilization tracking
 */
export function SpendSubcategoryChart({
  data,
  loading = false,
  onDrillDown
}: SpendSubcategoryChartProps) {
  // View mode state
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree')
  
  // Expanded categories state (for list view)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  // CRITICAL: Memoize data transformations to prevent re-renders
  const groupedData = useMemo(() => 
    groupByCategory(data),
    [data]
  )

  const categoryArray = useMemo(() =>
    Object.values(groupedData),
    [groupedData]
  )

  const grandTotal = useMemo(() =>
    categoryArray.reduce((sum, cat) => sum + cat.total, 0),
    [categoryArray]
  )

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Spend by Subcategory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Main render
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-blue-600" />
          Spend by Subcategory
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'tree' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('tree')}
            aria-label="Switch to tree view"
          >
            Treemap
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            aria-label="Switch to list view"
          >
            List
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {viewMode === 'tree' ? (
          <TreemapView
            categoryArray={categoryArray}
            onDrillDown={onDrillDown}
          />
        ) : (
          <ListView
            categoryArray={categoryArray}
            expandedCategories={expandedCategories}
            onToggleCategory={toggleCategory}
            onDrillDown={onDrillDown}
          />
        )}
        
        {/* Grand Total Footer */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Total across all subcategories:</span>
            <span className="font-semibold text-gray-900">
              {formatCurrency(grandTotal)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
