import { describe, it, expect } from 'vitest'
import {
  generateTempId,
  isTempId,
  calculateTotalBudget,
  calculateTotalForecast,
  calculateChangePercentage,
  formatCurrency,
} from '../budget-utils'

describe('budget-utils', () => {
  describe('generateTempId', () => {
    it('generates ID with temp_ prefix', () => {
      const id = generateTempId()
      expect(id).toMatch(/^temp_\d+_[a-z0-9]+$/)
    })
    
    it('generates unique IDs', () => {
      const id1 = generateTempId()
      const id2 = generateTempId()
      expect(id1).not.toBe(id2)
    })
  })
  
  describe('isTempId', () => {
    it('returns true for temp IDs', () => {
      expect(isTempId('temp_123_abc')).toBe(true)
      expect(isTempId('temp_1234567890_xyz')).toBe(true)
    })
    
    it('returns false for regular IDs', () => {
      expect(isTempId('uuid-123')).toBe(false)
      expect(isTempId('regular-id')).toBe(false)
      expect(isTempId('')).toBe(false)
    })
  })
  
  describe('calculateTotalBudget', () => {
    it('calculates sum of budget costs', () => {
      const costs = [
        { id: '1', budget_cost: 100 },
        { id: '2', budget_cost: 200 },
        { id: '3', budget_cost: 300 },
      ]
      expect(calculateTotalBudget(costs)).toBe(600)
    })
    
    it('handles empty array', () => {
      expect(calculateTotalBudget([])).toBe(0)
    })
    
    it('handles null/undefined budget_cost', () => {
      const costs = [
        { id: '1', budget_cost: 100 },
        { id: '2', budget_cost: null as any },
        { id: '3', budget_cost: undefined as any },
      ]
      expect(calculateTotalBudget(costs)).toBe(100)
    })
  })
  
  describe('calculateTotalForecast', () => {
    it('applies changes to existing costs', () => {
      const costs = [
        { id: '1', budget_cost: 100 },
        { id: '2', budget_cost: 200 },
      ]
      const changes = { '1': 150 } // Modified item 1
      const newEntries: typeof costs = []
      
      expect(calculateTotalForecast(costs, changes, newEntries)).toBe(350) // 150 + 200
    })
    
    it('includes new entries', () => {
      const costs = [{ id: '1', budget_cost: 100 }]
      const changes = {}
      const newEntries: typeof costs = [{ id: 'temp_1', budget_cost: 50 }]
      
      expect(calculateTotalForecast(costs, changes, newEntries)).toBe(150) // 100 + 50
    })
    
    it('handles exclusions (null value)', () => {
      const costs = [
        { id: '1', budget_cost: 100 },
        { id: '2', budget_cost: 200 },
      ]
      const changes = { '1': null } // Excluded
      const newEntries: typeof costs = []
      
      expect(calculateTotalForecast(costs, changes, newEntries)).toBe(200) // 0 + 200
    })
    
    it('handles combination of changes, exclusions, and new entries', () => {
      const costs = [
        { id: '1', budget_cost: 100 },
        { id: '2', budget_cost: 200 },
        { id: '3', budget_cost: 300 },
      ]
      const changes = {
        '1': 150,  // Modified
        '2': null, // Excluded
        // '3' unchanged
      }
      const newEntries = [
        { id: 'temp_1', budget_cost: 50 },
      ]
      
      expect(calculateTotalForecast(costs, changes, newEntries)).toBe(500)
      // 150 (modified) + 0 (excluded) + 300 (unchanged) + 50 (new) = 500
    })
  })
  
  describe('calculateChangePercentage', () => {
    it('calculates percentage correctly', () => {
      expect(calculateChangePercentage(50, 100)).toBe(50) // 50% increase
      expect(calculateChangePercentage(-25, 100)).toBe(-25) // 25% decrease
      expect(calculateChangePercentage(100, 100)).toBe(100) // 100% increase
    })
    
    it('handles fractional percentages', () => {
      expect(calculateChangePercentage(15, 100)).toBe(15)
      expect(calculateChangePercentage(33.33, 100)).toBe(33.33)
    })
    
    // ✅ CRITICAL: Test BA-008 - Division by zero protection
    it('handles zero original value (BA-008)', () => {
      expect(calculateChangePercentage(100, 0)).toBe(0)
      expect(calculateChangePercentage(-50, 0)).toBe(0)
      expect(calculateChangePercentage(0, 0)).toBe(0)
    })
    
    it('returns number, not NaN', () => {
      const result = calculateChangePercentage(100, 0)
      expect(Number.isNaN(result)).toBe(false)
      expect(typeof result).toBe('number')
    })
  })
  
  describe('formatCurrency', () => {
    it('formats as USD with no decimals', () => {
      expect(formatCurrency(1234567)).toBe('$1,234,567')
      expect(formatCurrency(100)).toBe('$100')
      expect(formatCurrency(0)).toBe('$0')
    })
    
    it('handles negative values', () => {
      expect(formatCurrency(-1000)).toBe('-$1,000')
    })
    
    it('rounds to nearest dollar', () => {
      expect(formatCurrency(123.45)).toBe('$123')
      expect(formatCurrency(123.99)).toBe('$124')
    })
  })
})
