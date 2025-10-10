'use client'

import { CategoryItem } from './category-item'
import type { GroupedCategory } from '../types'

interface ListViewProps {
  categoryArray: GroupedCategory[]
  expandedCategories: Set<string>
  onToggleCategory: (category: string) => void
  onDrillDown?: (category: string, subcategory: string) => void
}

export function ListView({
  categoryArray,
  expandedCategories,
  onToggleCategory,
  onDrillDown
}: ListViewProps) {
  return (
    <div className="space-y-2">
      {categoryArray.map((category, idx) => {
        const isExpanded = expandedCategories.has(category.category)
        
        return (
          <CategoryItem
            key={category.category}
            category={category}
            categoryIndex={idx}
            isExpanded={isExpanded}
            onToggle={() => onToggleCategory(category.category)}
            onDrillDown={onDrillDown}
          />
        )
      })}
    </div>
  )
}
