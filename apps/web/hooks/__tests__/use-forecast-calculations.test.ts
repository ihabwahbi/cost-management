import { renderHook } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useForecastCalculations } from '../use-forecast-calculations'

describe('useForecastCalculations', () => {
  it('calculates total budget', () => {
    const { result } = renderHook(() =>
      useForecastCalculations({
        currentCosts: [
          { id: '1', budget_cost: 100 },
          { id: '2', budget_cost: 200 },
        ],
        forecastChanges: {},
        newEntries: [],
      })
    )
    
    expect(result.current.totalBudget).toBe(300)
  })
  
  // BA-006: Total forecast calculation
  it('calculates total forecast with changes (BA-006)', () => {
    const { result } = renderHook(() =>
      useForecastCalculations({
        currentCosts: [
          { id: '1', budget_cost: 100 },
          { id: '2', budget_cost: 200 },
        ],
        forecastChanges: { '1': 150 }, // Modified
        newEntries: [{ id: 'temp_1', budget_cost: 50 }], // New
      })
    )
    
    expect(result.current.totalForecast).toBe(400) // 150 + 200 + 50
    expect(result.current.totalChange).toBe(100) // 400 - 300
  })
  
  it('handles exclusions (null values)', () => {
    const { result } = renderHook(() =>
      useForecastCalculations({
        currentCosts: [
          { id: '1', budget_cost: 100 },
          { id: '2', budget_cost: 200 },
        ],
        forecastChanges: { '1': null }, // Excluded
        newEntries: [],
      })
    )
    
    expect(result.current.totalForecast).toBe(200) // 0 (excluded) + 200
    expect(result.current.excludedCount).toBe(1)
  })
  
  // BA-007: Change percentage calculation
  it('calculates change percentage (BA-007)', () => {
    const { result } = renderHook(() =>
      useForecastCalculations({
        currentCosts: [{ id: '1', budget_cost: 100 }],
        forecastChanges: { '1': 150 },
        newEntries: [],
      })
    )
    
    expect(result.current.changePercentage).toBe(50) // 50% increase
  })
  
  it('calculates negative change percentage', () => {
    const { result } = renderHook(() =>
      useForecastCalculations({
        currentCosts: [{ id: '1', budget_cost: 100 }],
        forecastChanges: { '1': 75 },
        newEntries: [],
      })
    )
    
    expect(result.current.changePercentage).toBe(-25) // 25% decrease
  })
  
  // BA-008: Division by zero protection (via budget-utils)
  it('handles zero budget safely (BA-008)', () => {
    const { result } = renderHook(() =>
      useForecastCalculations({
        currentCosts: [],
        forecastChanges: {},
        newEntries: [{ id: 'temp_1', budget_cost: 100 }],
      })
    )
    
    expect(result.current.totalBudget).toBe(0)
    expect(result.current.totalForecast).toBe(100)
    expect(result.current.changePercentage).toBe(0) // Not NaN
    expect(Number.isNaN(result.current.changePercentage)).toBe(false)
  })
  
  it('counts modifications and new entries', () => {
    const { result } = renderHook(() =>
      useForecastCalculations({
        currentCosts: [
          { id: '1', budget_cost: 100 },
          { id: '2', budget_cost: 200 },
          { id: '3', budget_cost: 300 },
        ],
        forecastChanges: {
          '1': 150,  // Modified
          '2': null, // Excluded (not counted in modifiedCount)
        },
        newEntries: [
          { id: 'temp_1', budget_cost: 50 },
          { id: 'temp_2', budget_cost: 75 },
        ],
      })
    )
    
    expect(result.current.modifiedCount).toBe(1) // Only '1' (not null)
    expect(result.current.newEntriesCount).toBe(2)
    expect(result.current.excludedCount).toBe(1) // '2'
  })
  
  it('memoizes calculations', () => {
    const props = {
      currentCosts: [{ id: '1', budget_cost: 100 }],
      forecastChanges: {},
      newEntries: [],
    }
    
    const { result, rerender } = renderHook(
      (p) => useForecastCalculations(p),
      { initialProps: props }
    )
    
    const firstResult = result.current
    rerender(props) // Same props
    
    expect(result.current).toBe(firstResult) // Should be same object reference (memoized)
  })
  
  it('recalculates when inputs change', () => {
    const { result, rerender } = renderHook(
      (p) => useForecastCalculations(p),
      {
        initialProps: {
          currentCosts: [{ id: '1', budget_cost: 100 }],
          forecastChanges: {},
          newEntries: [],
        }
      }
    )
    
    expect(result.current.totalBudget).toBe(100)
    
    // Change forecastChanges
    rerender({
      currentCosts: [{ id: '1', budget_cost: 100 }],
      forecastChanges: { '1': 150 },
      newEntries: [],
    })
    
    expect(result.current.totalForecast).toBe(150)
    expect(result.current.totalChange).toBe(50)
  })
})
