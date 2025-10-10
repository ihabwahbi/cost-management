import { describe, it, expect } from 'vitest'
import { transformSubcategories } from '../utils/subcategory-transform'
import type { HierarchyNode } from '../types'

// Helper to create hierarchy nodes with required fields
const createNode = (partial: Partial<HierarchyNode>): HierarchyNode => ({
  id: partial.id || 'test-id',
  name: partial.name || '',
  budget: partial.budget || 0,
  actual: partial.actual || 0,
  variance: partial.variance || 0,
  utilization: partial.utilization || 0,
  ...partial,
})

describe('transformSubcategories - BA-009 Utility', () => {
  it('should return empty array when input is empty', () => {
    const result = transformSubcategories([])
    expect(result).toEqual([])
  })

  it('should flatten single-level hierarchy into subcategory array', () => {
    const hierarchy: HierarchyNode[] = [
      createNode({
        id: '1',
        level: 'business_line',
        name: 'Engineering',
        budget: 100000,
        actual: 80000,
        variance: 20000,
        utilization: 80,
        children: [
          createNode({
            id: '1-1',
            level: 'cost_line',
            name: 'Labor',
            budget: 60000,
            actual: 50000,
            variance: 10000,
            utilization: 83.33,
            children: [
              createNode({
                id: '1-1-1',
                level: 'spend_type',
                name: 'Direct',
                budget: 40000,
                actual: 35000,
                variance: 5000,
                utilization: 87.5,
                children: [
                  createNode({
                    id: '1-1-1-1',
                    level: 'sub_category',
                    name: 'Engineers',
                    budget: 40000,
                    actual: 35000,
                    variance: 5000,
                    utilization: 87.5,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ]

    const result = transformSubcategories(hierarchy)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      category: 'Direct',
      subcategory: 'Engineers',
      value: 35000,
      budget: 40000,
      percentage: 87.5,
    })
  })

  it('should flatten multi-level hierarchy with multiple subcategories', () => {
    const hierarchy: HierarchyNode[] = [
      createNode({
        id: '1',
        level: 'business_line',
        name: 'Engineering',
        budget: 200000,
        actual: 160000,
        variance: 40000,
        utilization: 80,
        children: [
          createNode({
            id: '1-1',
            level: 'cost_line',
            name: 'Labor',
            budget: 120000,
            actual: 100000,
            variance: 20000,
            utilization: 83.33,
            children: [
              createNode({
                id: '1-1-1',
                level: 'spend_type',
                name: 'Direct',
                budget: 80000,
                actual: 70000,
                variance: 10000,
                utilization: 87.5,
                children: [
                  createNode({
                    id: '1-1-1-1',
                    level: 'sub_category',
                    name: 'Senior Engineers',
                    budget: 50000,
                    actual: 45000,
                    variance: 5000,
                    utilization: 90,
                  }),
                  createNode({
                    id: '1-1-1-2',
                    level: 'sub_category',
                    name: 'Junior Engineers',
                    budget: 30000,
                    actual: 25000,
                    variance: 5000,
                    utilization: 83.33,
                  }),
                ],
              }),
              createNode({
                id: '1-1-2',
                level: 'spend_type',
                name: 'Indirect',
                budget: 40000,
                actual: 30000,
                variance: 10000,
                utilization: 75,
                children: [
                  createNode({
                    id: '1-1-2-1',
                    level: 'sub_category',
                    name: 'Contractors',
                    budget: 40000,
                    actual: 30000,
                    variance: 10000,
                    utilization: 75,
                  }),
                ],
              }),
            ],
          }),
          createNode({
            id: '1-2',
            level: 'cost_line',
            name: 'Materials',
            budget: 80000,
            actual: 60000,
            variance: 20000,
            utilization: 75,
            children: [
              createNode({
                id: '1-2-1',
                level: 'spend_type',
                name: 'Equipment',
                budget: 80000,
                actual: 60000,
                variance: 20000,
                utilization: 75,
                children: [
                  createNode({
                    id: '1-2-1-1',
                    level: 'sub_category',
                    name: 'Laptops',
                    budget: 50000,
                    actual: 40000,
                    variance: 10000,
                    utilization: 80,
                  }),
                  createNode({
                    id: '1-2-1-2',
                    level: 'sub_category',
                    name: 'Servers',
                    budget: 30000,
                    actual: 20000,
                    variance: 10000,
                    utilization: 66.67,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ]

    const result = transformSubcategories(hierarchy)

    expect(result).toHaveLength(5)
    
    // Verify flattened structure
    expect(result).toEqual([
      { category: 'Direct', subcategory: 'Senior Engineers', value: 45000, budget: 50000, percentage: 90 },
      { category: 'Direct', subcategory: 'Junior Engineers', value: 25000, budget: 30000, percentage: 83.33 },
      { category: 'Indirect', subcategory: 'Contractors', value: 30000, budget: 40000, percentage: 75 },
      { category: 'Equipment', subcategory: 'Laptops', value: 40000, budget: 50000, percentage: 80 },
      { category: 'Equipment', subcategory: 'Servers', value: 20000, budget: 30000, percentage: 66.67 },
    ])
  })

  it('should handle hierarchy nodes without children', () => {
    const hierarchy: HierarchyNode[] = [
      createNode({
        id: '1',
        level: 'business_line',
        name: 'Engineering',
        budget: 100000,
        actual: 80000,
        variance: 20000,
        utilization: 80,
        children: [],
      }),
    ]

    const result = transformSubcategories(hierarchy)
    expect(result).toEqual([])
  })

  it('should handle hierarchy with missing intermediate levels', () => {
    const hierarchy: HierarchyNode[] = [
      createNode({
        id: '1',
        level: 'business_line',
        name: 'Engineering',
        budget: 100000,
        actual: 80000,
        variance: 20000,
        utilization: 80,
        children: [
          createNode({
            id: '1-1',
            level: 'cost_line',
            name: 'Labor',
            budget: 60000,
            actual: 50000,
            variance: 10000,
            utilization: 83.33,
            children: [], // No spend types
          }),
        ],
      }),
    ]

    const result = transformSubcategories(hierarchy)
    expect(result).toEqual([])
  })

  it('should preserve budget/actual/utilization values accurately', () => {
    const hierarchy: HierarchyNode[] = [
      createNode({
        id: '1',
        level: 'business_line',
        name: 'Engineering',
        budget: 100000,
        actual: 80000,
        variance: 20000,
        utilization: 80,
        children: [
          createNode({
            id: '1-1',
            level: 'cost_line',
            name: 'Labor',
            budget: 60000,
            actual: 50000,
            variance: 10000,
            utilization: 83.33,
            children: [
              createNode({
                id: '1-1-1',
                level: 'spend_type',
                name: 'Direct',
                budget: 40000,
                actual: 35000,
                variance: 5000,
                utilization: 87.5,
                children: [
                  createNode({
                    id: '1-1-1-1',
                    level: 'sub_category',
                    name: 'Engineers',
                    budget: 12345.67,
                    actual: 9876.54,
                    variance: 2469.13,
                    utilization: 80.01,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ]

    const result = transformSubcategories(hierarchy)

    expect(result[0].budget).toBe(12345.67)
    expect(result[0].value).toBe(9876.54)
    expect(result[0].percentage).toBe(80.01)
  })

  it('should handle multiple business lines', () => {
    const hierarchy: HierarchyNode[] = [
      createNode({
        id: '1',
        level: 'business_line',
        name: 'Engineering',
        budget: 50000,
        actual: 40000,
        variance: 10000,
        utilization: 80,
        children: [
          createNode({
            id: '1-1',
            level: 'cost_line',
            name: 'Labor',
            budget: 50000,
            actual: 40000,
            variance: 10000,
            utilization: 80,
            children: [
              createNode({
                id: '1-1-1',
                level: 'spend_type',
                name: 'Direct',
                budget: 50000,
                actual: 40000,
                variance: 10000,
                utilization: 80,
                children: [
                  createNode({
                    id: '1-1-1-1',
                    level: 'sub_category',
                    name: 'Eng-Sub1',
                    budget: 50000,
                    actual: 40000,
                    variance: 10000,
                    utilization: 80,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      createNode({
        id: '2',
        level: 'business_line',
        name: 'Operations',
        budget: 30000,
        actual: 25000,
        variance: 5000,
        utilization: 83.33,
        children: [
          createNode({
            id: '2-1',
            level: 'cost_line',
            name: 'Materials',
            budget: 30000,
            actual: 25000,
            variance: 5000,
            utilization: 83.33,
            children: [
              createNode({
                id: '2-1-1',
                level: 'spend_type',
                name: 'Equipment',
                budget: 30000,
                actual: 25000,
                variance: 5000,
                utilization: 83.33,
                children: [
                  createNode({
                    id: '2-1-1-1',
                    level: 'sub_category',
                    name: 'Ops-Sub1',
                    budget: 30000,
                    actual: 25000,
                    variance: 5000,
                    utilization: 83.33,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ]

    const result = transformSubcategories(hierarchy)

    expect(result).toHaveLength(2)
    expect(result[0].subcategory).toBe('Eng-Sub1')
    expect(result[1].subcategory).toBe('Ops-Sub1')
  })
})
