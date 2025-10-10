export interface SubcategoryData {
  category: string      // Parent category (Spend Type)
  subcategory: string   // Leaf subcategory name
  value: number         // Actual spend from PO mappings
  budget: number        // Budget allocation
  percentage: number    // Utilization % (actual/budget * 100)
}

export interface GroupedCategory {
  category: string
  total: number
  budget: number
  subcategories: SubcategoryData[]
}

export interface TreemapNode {
  name: string
  size: number
  category?: string
  children?: Array<{
    name: string
    size: number
    category: string
  }>
}

export interface SpendSubcategoryChartProps {
  data: SubcategoryData[]
  loading?: boolean
  onDrillDown?: (category: string, subcategory: string) => void
}
