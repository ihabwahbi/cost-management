/**
 * Charts Section Component
 * 
 * Renders Category and Subcategory spend charts side-by-side
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SpendCategoryChart } from '@/components/dashboard/spend-category-chart'
import { SpendSubcategoryChart } from '@/components/dashboard/spend-subcategory-chart'
import type { CategoryData, SubcategoryData } from '../types'

export interface ChartsSectionProps {
  /** Category breakdown data */
  categoryData: CategoryData[]
  
  /** Flattened subcategory data */
  subcategoryData: SubcategoryData[]
  
  /** Whether data is still loading */
  loading: boolean
}

/**
 * Renders category and subcategory charts section
 * 
 * Behavioral Assertions:
 * - BA-009: Subcategory chart displays flattened hierarchy
 * - BA-010: Shows 'No data' message when empty
 */
export function ChartsSection({
  categoryData,
  subcategoryData,
  loading
}: ChartsSectionProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Spend by Category chart */}
      <Card>
        <CardHeader>
          <CardTitle>Spend by Category</CardTitle>
        </CardHeader>
        <CardContent>
          {categoryData.length > 0 ? (
            <SpendCategoryChart data={categoryData} />
          ) : (
            /* BA-010: Empty state message */
            <div className="text-center py-8 text-muted-foreground">
              No category data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Spend by Subcategory chart */}
      <Card>
        <CardHeader>
          <CardTitle>Spend by Subcategory</CardTitle>
        </CardHeader>
        <CardContent>
          {subcategoryData.length > 0 ? (
            /* BA-009: Display flattened subcategory data */
            <SpendSubcategoryChart
              data={subcategoryData}
              loading={loading}
              onDrillDown={(category, subcategory) => {
                console.log('[Dashboard] Drill down:', category, subcategory)
              }}
            />
          ) : (
            /* BA-010: Empty state message */
            <div className="text-center py-8 text-muted-foreground">
              No subcategory data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
