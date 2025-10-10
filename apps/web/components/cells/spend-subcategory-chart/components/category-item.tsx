'use client'

import { ChevronDown, ChevronRight, Package } from 'lucide-react'
import { formatCurrency, calculateUtilization } from '../utils/data-formatters'
import { getUtilizationColor, getCategoryColor } from '../utils/color-utils'
import type { GroupedCategory } from '../types'
import { cn } from '@/lib/utils'

interface CategoryItemProps {
  category: GroupedCategory
  categoryIndex: number
  isExpanded: boolean
  onToggle: () => void
  onDrillDown?: (category: string, subcategory: string) => void
}

export function CategoryItem({
  category,
  categoryIndex,
  isExpanded,
  onToggle,
  onDrillDown
}: CategoryItemProps) {
  const utilization = calculateUtilization(category.total, category.budget)
  const utilizationClass = getUtilizationColor(utilization)

  return (
    <div className="border rounded-lg">
      {/* Category Header */}
      <div
        className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-500" />
          )}
          <div
            className="w-3 h-3 rounded"
            style={{ backgroundColor: getCategoryColor(categoryIndex) }}
          />
          <span className="font-medium">{category.category}</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-600">
            {formatCurrency(category.total)} / {formatCurrency(category.budget)}
          </span>
          <span className={cn("font-medium", utilizationClass)}>
            {utilization.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Subcategories */}
      {isExpanded && (
        <div className="px-3 pb-3">
          <div className="ml-6 space-y-1 pt-2 border-t">
            {category.subcategories.map((sub) => {
              const subUtil = calculateUtilization(sub.value, sub.budget)

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
                    <span className={cn("font-medium text-xs", getUtilizationColor(subUtil))}>
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
}
