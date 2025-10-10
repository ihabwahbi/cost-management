'use client'

import { useMemo } from 'react'
import { ResponsiveContainer, Treemap } from 'recharts'
import { getCategoryColor } from '../utils/color-utils'
import { formatCurrency } from '../utils/data-formatters'
import type { GroupedCategory, TreemapNode } from '../types'

// Recharts Treemap custom content props
interface TreemapContentProps {
  x?: number
  y?: number
  width?: number
  height?: number
  name?: string
  value?: number
  category?: string
  depth?: number
  root?: unknown // Complex Recharts internal type
}

interface TreemapViewProps {
  categoryArray: GroupedCategory[]
  onDrillDown?: (category: string, subcategory: string) => void
}

export function TreemapView({ categoryArray, onDrillDown }: TreemapViewProps) {
  // CRITICAL: Memoize treemap data transformation
  const treemapData: TreemapNode[] = useMemo(() => 
    categoryArray.map((cat) => ({
      name: cat.category,
      size: cat.total,
      category: cat.category,
      children: cat.subcategories.map(sub => ({
        name: sub.subcategory,
        size: sub.value,
        category: cat.category
      }))
    })),
    [categoryArray]
  )

  // Custom treemap cell renderer
  const CustomTreemapContent = (props: TreemapContentProps) => {
    const { x = 0, y = 0, width = 0, height = 0, name = '', value = 0, category } = props
    
    // Get category color
    const categoryIndex = categoryArray.findIndex(c => c.category === (category || name))
    const color = getCategoryColor(categoryIndex)
    
    // Only render if cell is large enough
    if (width < 60 || height < 30) return null
    
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill: color,
            stroke: '#fff',
            strokeWidth: 2,
            strokeOpacity: 1,
            cursor: onDrillDown ? 'pointer' : 'default'
          }}
          onClick={() => {
            if (onDrillDown && category) {
              onDrillDown(category, name)
            }
          }}
        />
        <text
          x={x + width / 2}
          y={y + height / 2 - 10}
          textAnchor="middle"
          fill="#fff"
          fontSize={12}
          fontWeight="bold"
        >
          {name}
        </text>
        <text
          x={x + width / 2}
          y={y + height / 2 + 10}
          textAnchor="middle"
          fill="#fff"
          fontSize={10}
        >
          {formatCurrency(value)}
        </text>
      </g>
    )
  }

  return (
    <div className="h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={treemapData}
          dataKey="size"
          aspectRatio={4/3}
          stroke="#fff"
          content={<CustomTreemapContent />}
        />
      </ResponsiveContainer>
    </div>
  )
}
