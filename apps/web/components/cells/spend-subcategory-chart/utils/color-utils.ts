/**
 * 8-color palette for category differentiation
 * Cycles via modulo for categories beyond 8
 */
export const COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#84cc16', // Lime
]

/**
 * Get category color using modulo cycling
 */
export function getCategoryColor(index: number): string {
  return COLORS[index % COLORS.length]
}

/**
 * Get Tailwind color class based on utilization percentage
 * >100% = red, >80% = amber, ≤80% = green
 */
export function getUtilizationColor(percentage: number): string {
  if (percentage > 100) return 'text-red-500'
  if (percentage > 80) return 'text-amber-500'
  return 'text-green-500'
}
