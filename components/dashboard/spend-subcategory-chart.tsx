'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ResponsiveContainer, Treemap } from 'recharts'
import { ChevronDown, ChevronRight, Package } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface SubcategoryData {
  category: string
  subcategory: string
  value: number
  budget: number
  percentage: number
}

interface SpendSubcategoryChartProps {
  data: SubcategoryData[]
  loading?: boolean
  onDrillDown?: (category: string, subcategory: string) => void
}

export function SpendSubcategoryChart({ 
  data, 
  loading = false,
  onDrillDown 
}: SpendSubcategoryChartProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree')

  // Group data by category
  const groupedData = data.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = {
        category: item.category,
        total: 0,
        budget: 0,
        subcategories: []
      }
    }
    acc[item.category].total += item.value
    acc[item.category].budget += item.budget
    acc[item.category].subcategories.push(item)
    return acc
  }, {} as Record<string, any>)

  const categoryArray = Object.values(groupedData)

  // Prepare data for treemap
  const treemapData = categoryArray.map(cat => ({
    name: cat.category,
    value: cat.total,
    children: cat.subcategories.map((sub: SubcategoryData) => ({
      name: sub.subcategory,
      value: sub.value,
      category: cat.category
    }))
  }))

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: value > 1000000 ? 'compact' : 'standard'
    }).format(value)
  }

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }

  // Colors for categories
  const COLORS = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
  ]

  // Custom treemap content
  const CustomTreemapContent = (props: any) => {
    const { x, y, width, height, name, value, category } = props
    
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill: COLORS[categoryArray.findIndex(c => c.category === (category || name)) % COLORS.length],
            stroke: '#fff',
            strokeWidth: 2,
            strokeOpacity: 1,
            cursor: 'pointer'
          }}
          onClick={() => onDrillDown?.(category || name, name)}
        />
        {width > 60 && height > 30 && (
          <>
            <text 
              x={x + width / 2} 
              y={y + height / 2 - 10} 
              textAnchor="middle" 
              fill="#fff" 
              fontSize="12"
              fontWeight="bold"
            >
              {name}
            </text>
            <text 
              x={x + width / 2} 
              y={y + height / 2 + 10} 
              textAnchor="middle" 
              fill="#fff" 
              fontSize="10"
            >
              {formatCurrency(value)}
            </text>
          </>
        )}
      </g>
    )
  }

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
          >
            Treemap
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            List
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === 'tree' ? (
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <Treemap
                data={treemapData}
                dataKey="value"
                aspectRatio={4/3}
                stroke="#fff"
                content={<CustomTreemapContent />}
              />
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="space-y-2">
            {categoryArray.map((category, idx) => {
              const isExpanded = expandedCategories.has(category.category)
              const utilization = category.budget > 0 
                ? (category.total / category.budget) * 100 
                : 0

              return (
                <div key={category.category} className="border rounded-lg">
                  <div
                    className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleCategory(category.category)}
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      )}
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      <span className="font-medium">{category.category}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-600">
                        {formatCurrency(category.total)} / {formatCurrency(category.budget)}
                      </span>
                      <span className={cn(
                        "font-medium",
                        utilization > 100 ? "text-red-600" : 
                        utilization > 80 ? "text-amber-600" : 
                        "text-green-600"
                      )}>
                        {utilization.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-3 pb-3">
                      <div className="ml-6 space-y-1 pt-2 border-t">
                        {category.subcategories.map((sub: SubcategoryData) => {
                          const subUtil = sub.budget > 0 
                            ? (sub.value / sub.budget) * 100 
                            : 0

                          return (
                            <div
                              key={sub.subcategory}
                              className="flex items-center justify-between py-1 px-2 hover:bg-gray-50 rounded cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation()
                                onDrillDown?.(category.category, sub.subcategory)
                              }}
                            >
                              <span className="text-sm text-gray-700">
                                {sub.subcategory}
                              </span>
                              <div className="flex items-center gap-3 text-sm">
                                <span className="text-gray-600">
                                  {formatCurrency(sub.value)}
                                </span>
                                <span className={cn(
                                  "font-medium text-xs",
                                  subUtil > 100 ? "text-red-600" : 
                                  subUtil > 80 ? "text-amber-600" : 
                                  "text-green-600"
                                )}>
                                  {subUtil.toFixed(0)}%
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Summary */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Total across all subcategories:</span>
            <span className="font-semibold text-gray-900">
              {formatCurrency(categoryArray.reduce((sum, cat) => sum + cat.total, 0))}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}