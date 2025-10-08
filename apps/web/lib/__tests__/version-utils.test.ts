import { describe, it, expect } from 'vitest'
import { getVersionStatus, calculateVersionChanges, type CostBreakdown } from '../version-utils'

describe('version-utils', () => {
  describe('getVersionStatus', () => {
    const now = new Date()

    it('returns "New" for versions < 1 day old', () => {
      const lessThanOneDayAgo = new Date(now.getTime() - (12 * 60 * 60 * 1000)) // 12 hours ago
      const result = getVersionStatus(lessThanOneDayAgo)
      expect(result).toEqual({ label: "New", variant: "default" })
    })

    it('returns "New" for versions created exactly now', () => {
      const result = getVersionStatus(now)
      expect(result).toEqual({ label: "New", variant: "default" })
    })

    it('returns "Recent" for versions < 7 days old', () => {
      const threeDaysAgo = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000))
      const result = getVersionStatus(threeDaysAgo)
      expect(result).toEqual({ label: "Recent", variant: "secondary" })
    })

    it('returns "Recent" for versions exactly 6 days old', () => {
      const sixDaysAgo = new Date(now.getTime() - (6 * 24 * 60 * 60 * 1000))
      const result = getVersionStatus(sixDaysAgo)
      expect(result).toEqual({ label: "Recent", variant: "secondary" })
    })

    it('returns "Current" for versions < 30 days old', () => {
      const fifteenDaysAgo = new Date(now.getTime() - (15 * 24 * 60 * 60 * 1000))
      const result = getVersionStatus(fifteenDaysAgo)
      expect(result).toEqual({ label: "Current", variant: "outline" })
    })

    it('returns "Current" for versions exactly 29 days old', () => {
      const twentyNineDaysAgo = new Date(now.getTime() - (29 * 24 * 60 * 60 * 1000))
      const result = getVersionStatus(twentyNineDaysAgo)
      expect(result).toEqual({ label: "Current", variant: "outline" })
    })

    it('returns "Historical" for versions ≥ 30 days old', () => {
      const sixtyDaysAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000))
      const result = getVersionStatus(sixtyDaysAgo)
      expect(result).toEqual({ label: "Historical", variant: "outline" })
    })

    it('accepts ISO string format', () => {
      const oneDayAgo = new Date(now.getTime() - (1 * 24 * 60 * 60 * 1000))
      const result = getVersionStatus(oneDayAgo.toISOString())
      expect(result).toEqual({ label: "New", variant: "default" })
    })
  })

  describe('calculateVersionChanges', () => {
    const mockCostBreakdowns: Record<number, CostBreakdown[]> = {
      0: [
        {
          id: 'item-1',
          cost_line: 'Line 1',
          spend_type: 'Type A',
          spend_sub_category: 'SubCat A',
          budget_cost: 1000,
        },
        {
          id: 'item-2',
          cost_line: 'Line 2',
          spend_type: 'Type B',
          spend_sub_category: 'SubCat B',
          budget_cost: 2000,
        },
      ],
      1: [
        {
          id: 'item-1',
          cost_line: 'Line 1',
          spend_type: 'Type A',
          spend_sub_category: 'SubCat A',
          budget_cost: 1000,
          forecasted_cost: 1500, // +500
        },
        {
          id: 'item-2',
          cost_line: 'Line 2',
          spend_type: 'Type B',
          spend_sub_category: 'SubCat B',
          budget_cost: 2000,
          forecasted_cost: 1800, // -200
        },
      ],
      2: [
        {
          id: 'item-1',
          cost_line: 'Line 1',
          spend_type: 'Type A',
          spend_sub_category: 'SubCat A',
          budget_cost: 1000,
          forecasted_cost: 1500,
        },
        {
          id: 'item-2',
          cost_line: 'Line 2',
          spend_type: 'Type B',
          spend_sub_category: 'SubCat B',
          budget_cost: 2000,
          forecasted_cost: 1800,
        },
        {
          id: 'item-3',
          cost_line: 'Line 3',
          spend_type: 'Type C',
          spend_sub_category: 'SubCat C',
          budget_cost: 500,
          forecasted_cost: 500, // New item
        },
      ],
    }

    it('returns zeros for version 0', () => {
      const result = calculateVersionChanges(0, mockCostBreakdowns)
      expect(result).toEqual({ totalChange: 0, changePercent: 0, itemsChanged: 0 })
    })

    it('returns zeros when costBreakdowns undefined', () => {
      const result = calculateVersionChanges(1, undefined)
      expect(result).toEqual({ totalChange: 0, changePercent: 0, itemsChanged: 0 })
    })

    it('returns zeros when costBreakdowns is empty object', () => {
      const result = calculateVersionChanges(1, {})
      expect(result).toEqual({ totalChange: 0, changePercent: 0, itemsChanged: 0 })
    })

    it('calculates total change for modified items (version 1)', () => {
      const result = calculateVersionChanges(1, mockCostBreakdowns)
      // item-1: 1500 - 1000 = +500
      // item-2: 1800 - 2000 = -200
      // Total: +300
      expect(result.totalChange).toBe(300)
      expect(result.itemsChanged).toBe(2)
    })

    it('calculates change percentage correctly (version 1)', () => {
      const result = calculateVersionChanges(1, mockCostBreakdowns)
      // Previous total: 1000 + 2000 = 3000
      // Change: 300
      // Percentage: (300 / 3000) * 100 = 10%
      expect(result.changePercent).toBe(10)
    })

    it('counts new items as changes (version 2)', () => {
      const result = calculateVersionChanges(2, mockCostBreakdowns)
      // item-1: 1500 - 1500 = 0 (no change)
      // item-2: 1800 - 1800 = 0 (no change)
      // item-3: 500 - 0 = +500 (new item)
      expect(result.totalChange).toBe(500)
      expect(result.itemsChanged).toBe(1)
    })

    it('prevents division by zero when previousTotal = 0', () => {
      const zeroBreakdowns: Record<number, CostBreakdown[]> = {
        0: [],
        1: [
          {
            id: 'item-1',
            cost_line: 'Line 1',
            spend_type: 'Type A',
            spend_sub_category: 'SubCat A',
            budget_cost: 1000,
          },
        ],
      }
      const result = calculateVersionChanges(1, zeroBreakdowns)
      expect(result.changePercent).toBe(0) // Should not be NaN
      expect(result.totalChange).toBe(1000)
      expect(result.itemsChanged).toBe(1)
    })

    it('handles missing forecasted_cost (uses budget_cost)', () => {
      const breakdownsNoCast: Record<number, CostBreakdown[]> = {
        0: [
          {
            id: 'item-1',
            cost_line: 'Line 1',
            spend_type: 'Type A',
            spend_sub_category: 'SubCat A',
            budget_cost: 1000,
          },
        ],
        1: [
          {
            id: 'item-1',
            cost_line: 'Line 1',
            spend_type: 'Type A',
            spend_sub_category: 'SubCat A',
            budget_cost: 1500, // No forecasted_cost, uses budget_cost
          },
        ],
      }
      const result = calculateVersionChanges(1, breakdownsNoCast)
      expect(result.totalChange).toBe(500) // 1500 - 1000
      expect(result.itemsChanged).toBe(1)
    })

    it('handles negative changes correctly', () => {
      const decreasingBreakdowns: Record<number, CostBreakdown[]> = {
        0: [
          {
            id: 'item-1',
            cost_line: 'Line 1',
            spend_type: 'Type A',
            spend_sub_category: 'SubCat A',
            budget_cost: 5000,
          },
        ],
        1: [
          {
            id: 'item-1',
            cost_line: 'Line 1',
            spend_type: 'Type A',
            spend_sub_category: 'SubCat A',
            budget_cost: 5000,
            forecasted_cost: 3000, // -2000
          },
        ],
      }
      const result = calculateVersionChanges(1, decreasingBreakdowns)
      expect(result.totalChange).toBe(-2000)
      expect(result.changePercent).toBe(-40)
      expect(result.itemsChanged).toBe(1)
    })

    it('ignores items with zero change', () => {
      const noChangeBreakdowns: Record<number, CostBreakdown[]> = {
        0: [
          {
            id: 'item-1',
            cost_line: 'Line 1',
            spend_type: 'Type A',
            spend_sub_category: 'SubCat A',
            budget_cost: 1000,
          },
        ],
        1: [
          {
            id: 'item-1',
            cost_line: 'Line 1',
            spend_type: 'Type A',
            spend_sub_category: 'SubCat A',
            budget_cost: 1000,
            forecasted_cost: 1000, // No change
          },
        ],
      }
      const result = calculateVersionChanges(1, noChangeBreakdowns)
      expect(result.totalChange).toBe(0)
      expect(result.changePercent).toBe(0)
      expect(result.itemsChanged).toBe(0)
    })
  })
})
