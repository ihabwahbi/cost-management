import { useMemo } from 'react'
import { 
  calculateTotalBudget, 
  calculateTotalForecast, 
  calculateChangePercentage 
} from '@/lib/budget-utils'

interface CostBreakdown {
  id: string
  budget_cost: number
  [key: string]: any
}

interface ForecastCalculationsOptions {
  currentCosts: CostBreakdown[]
  forecastChanges: Record<string, number | null>
  newEntries: CostBreakdown[]
}

/**
 * Memoized budget calculation hook
 * 
 * Provides all calculated values for forecast wizard:
 * - Total budget (original)
 * - Total forecast (with changes, exclusions, new entries)
 * - Total change amount
 * - Change percentage (with division-by-zero protection)
 * - Counts of modified and new entries
 * 
 * All calculations are memoized to prevent recalculation on every render.
 */
export function useForecastCalculations({
  currentCosts,
  forecastChanges,
  newEntries,
}: ForecastCalculationsOptions) {
  const calculations = useMemo(() => {
    const totalBudget = calculateTotalBudget(currentCosts)
    const totalForecast = calculateTotalForecast(currentCosts, forecastChanges, newEntries)
    const totalChange = totalForecast - totalBudget
    const changePercentage = calculateChangePercentage(totalChange, totalBudget) // ✅ Safe (BA-008)
    
    // Count modifications (excluding null values which are exclusions)
    const modifiedCount = Object.entries(forecastChanges).filter(([_, value]) => value !== null).length
    const newEntriesCount = newEntries.length
    const excludedCount = Object.values(forecastChanges).filter(value => value === null).length
    
    return {
      totalBudget,
      totalForecast,
      totalChange,
      changePercentage,
      modifiedCount,
      newEntriesCount,
      excludedCount,
    }
  }, [currentCosts, forecastChanges, newEntries])
  
  return calculations
}
