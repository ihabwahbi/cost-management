/**
 * Budget Utilities
 * 
 * Pure utility functions for budget calculations and operations.
 * Extracted from forecast-wizard Cell for reusability.
 */

interface CostBreakdown {
  id: string
  budget_cost: number
  [key: string]: any
}

/**
 * Generate unique temporary ID for new budget entries
 */
export function generateTempId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Check if ID is a temporary ID
 */
export function isTempId(id: string): boolean {
  return id.startsWith('temp_')
}

/**
 * Calculate total budget from cost breakdown entries
 */
export function calculateTotalBudget(costs: CostBreakdown[]): number {
  return costs.reduce((sum, item) => sum + Number(item.budget_cost || 0), 0)
}

/**
 * Calculate total forecast including changes and new entries
 * 
 * @param costs - Original cost breakdown entries
 * @param changes - Record of changes (number = modified value, null = excluded, undefined = unchanged)
 * @param newEntries - Array of new budget entries
 */
export function calculateTotalForecast(
  costs: CostBreakdown[],
  changes: Record<string, number | null>,
  newEntries: CostBreakdown[]
): number {
  // Apply changes to existing costs
  const modifiedTotal = costs.reduce((sum, item) => {
    const newValue = changes[item.id]
    // null = excluded (contributes $0), undefined = unchanged (use original), number = modified value
    if (newValue === null) return sum + 0 // Excluded
    if (newValue === undefined) return sum + item.budget_cost // Unchanged
    return sum + newValue // Modified
  }, 0)
  
  // Add new entries
  const newEntriesTotal = calculateTotalBudget(newEntries)
  
  return modifiedTotal + newEntriesTotal
}

/**
 * Calculate change percentage with division-by-zero protection
 * 
 * ✅ CRITICAL: BA-008 - Prevents NaN by checking for zero denominator
 * 
 * @param change - The change amount
 * @param original - The original amount
 * @returns Percentage change (e.g., 15.5 for 15.5% increase), or 0 if original is 0
 */
export function calculateChangePercentage(
  change: number, 
  original: number
): number {
  if (original === 0) return 0  // ✅ Division by zero protection
  return (change / original) * 100
}

/**
 * Format number as currency (USD)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}
