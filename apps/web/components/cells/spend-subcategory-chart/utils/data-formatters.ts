import type { SubcategoryData, GroupedCategory } from '../types'

/**
 * Format currency with compact notation for large amounts
 * >$1M: "$1.5M", ≤$1M: "$850,000"
 */
export function formatCurrency(amount: number): string {
  const threshold = 1_000_000
  if (amount > threshold) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount)
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

/**
 * Calculate budget utilization percentage
 * Prevents NaN by returning 0 if budget is 0
 */
export function calculateUtilization(actual: number, budget: number): number {
  if (budget === 0) return 0
  return (actual / budget) * 100
}

/**
 * Group flat subcategory array by parent category
 * Aggregates totals and budgets per category
 */
export function groupByCategory(data: SubcategoryData[]): Record<string, GroupedCategory> {
  return data.reduce((acc, item) => {
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
  }, {} as Record<string, GroupedCategory>)
}
