// Version utility functions extracted from version-history-timeline component
// Purpose: Support version management with status categorization and change calculations

export interface VersionStatus {
  label: string
  variant: 'default' | 'secondary' | 'outline'
}

export interface CostBreakdown {
  id: string
  cost_line: string
  spend_type: string
  spend_sub_category: string
  budget_cost: number
  forecasted_cost?: number
}

export interface VersionChanges {
  totalChange: number
  changePercent: number
  itemsChanged: number
}

/**
 * Categorizes version by age
 * @param createdAt - ISO date string or Date object
 * @returns Status object with label and variant for Badge component
 */
export function getVersionStatus(createdAt: string | Date): VersionStatus {
  const versionAge = Date.now() - new Date(createdAt).getTime()
  const dayInMs = 1000 * 60 * 60 * 24

  if (versionAge < dayInMs) return { label: "New", variant: "default" }
  if (versionAge < dayInMs * 7) return { label: "Recent", variant: "secondary" }
  if (versionAge < dayInMs * 30) return { label: "Current", variant: "outline" }
  return { label: "Historical", variant: "outline" }
}

/**
 * Calculates version delta vs previous version
 * @param versionNumber - Version number to analyze
 * @param costBreakdowns - Record mapping version numbers to cost breakdown arrays
 * @returns Object with totalChange, changePercent, and itemsChanged
 */
export function calculateVersionChanges(
  versionNumber: number,
  costBreakdowns?: Record<number, CostBreakdown[]>
): VersionChanges {
  if (!costBreakdowns || versionNumber === 0) {
    return { totalChange: 0, changePercent: 0, itemsChanged: 0 }
  }

  const currentCosts = costBreakdowns[versionNumber] || []
  const previousVersion = versionNumber - 1
  const previousCosts = costBreakdowns[previousVersion] || []

  let totalChange = 0
  let itemsChanged = 0

  // Calculate changes for each item
  currentCosts.forEach((current) => {
    const previous = previousCosts.find((p) => p.id === current.id)
    if (previous) {
      const change = (current.forecasted_cost || current.budget_cost) - 
                    (previous.forecasted_cost || previous.budget_cost)
      if (change !== 0) {
        totalChange += change
        itemsChanged++
      }
    } else {
      // New item in this version
      totalChange += current.forecasted_cost || current.budget_cost
      itemsChanged++
    }
  })

  // Calculate percentage change
  const previousTotal = previousCosts.reduce(
    (sum, cost) => sum + (cost.forecasted_cost || cost.budget_cost),
    0
  )
  
  // Prevent division by zero (TP-001 protection)
  const changePercent = previousTotal > 0 ? (totalChange / previousTotal) * 100 : 0

  return { totalChange, changePercent, itemsChanged }
}
