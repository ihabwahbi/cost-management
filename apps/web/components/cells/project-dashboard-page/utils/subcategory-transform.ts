/**
 * Subcategory Transformation Utility
 * 
 * Extracts O(n⁴) nested loop logic from dashboard component
 * Purpose: Flatten 4-level hierarchy (businessLine > costLine > spendType > subCategory)
 * into flat array for charting
 * 
 * OPTIMIZATION: Should be used with useMemo() in component to prevent running on every render
 */

import type { HierarchyNode, SubcategoryData } from '../types'

/**
 * Transform nested hierarchy structure into flat subcategory array
 * 
 * Input: 4-level hierarchy from getProjectHierarchicalBreakdown
 * Output: Flat array of subcategories with budget/actual/utilization data
 * 
 * @param hierarchy - Nested hierarchy from tRPC query
 * @returns Flat array of subcategory data points
 * 
 * @example
 * const subcategoryData = useMemo(
 *   () => transformSubcategories(breakdownData ?? []),
 *   [breakdownData]
 * )
 */
export function transformSubcategories(hierarchy: HierarchyNode[]): SubcategoryData[] {
  const result: SubcategoryData[] = []
  
  // Level 1: Business Lines
  hierarchy.forEach(businessLine => {
    if (!businessLine.children) return
    
    // Level 2: Cost Lines
    businessLine.children.forEach(costLine => {
      if (!costLine.children) return
      
      // Level 3: Spend Types
      costLine.children.forEach(spendType => {
        if (!spendType.children) return
        
        // Level 4: Sub Categories (leaf nodes)
        spendType.children.forEach(subCategory => {
          result.push({
            category: spendType.name,          // Parent spend type
            subcategory: subCategory.name,      // Leaf subcategory
            value: subCategory.actual,          // Actual spend
            budget: subCategory.budget,         // Budget allocation
            percentage: subCategory.utilization // Utilization %
          })
        })
      })
    })
  })
  
  return result
}

/**
 * Calculate total budget from flattened subcategories
 * 
 * @param subcategories - Flattened subcategory array
 * @returns Total budget sum
 */
export function calculateTotalBudget(subcategories: SubcategoryData[]): number {
  return subcategories.reduce((sum, item) => sum + (item.budget || 0), 0)
}

/**
 * Calculate total actual spend from flattened subcategories
 * 
 * @param subcategories - Flattened subcategory array
 * @returns Total actual spend sum
 */
export function calculateTotalActual(subcategories: SubcategoryData[]): number {
  return subcategories.reduce((sum, item) => sum + (item.value || 0), 0)
}
