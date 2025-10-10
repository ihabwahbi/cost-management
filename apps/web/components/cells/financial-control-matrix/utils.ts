// components/cells/financial-control-matrix/utils.ts

/**
 * Format number as USD currency
 * @param value - Number to format
 * @param compact - Use compact notation (e.g., $1.2M instead of $1,200,000)
 */
export function formatCurrency(value: number, compact: boolean = false): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: compact ? 'compact' : 'standard',
    minimumFractionDigits: 0,
    maximumFractionDigits: compact ? 1 : 0,
  }).format(value)
}

/**
 * Format number as percentage
 * @param value - Number to format (0-100)
 */
export function formatPercent(value: number): string {
  return `${Math.round(value)}%`
}

/**
 * Calculate percentage with zero-division protection
 * @param value - Numerator
 * @param total - Denominator
 * @returns Percentage (0-100) or 0 if total is zero
 */
export function calculatePercent(value: number, total: number): number {
  return total > 0 ? (value / total) * 100 : 0
}
