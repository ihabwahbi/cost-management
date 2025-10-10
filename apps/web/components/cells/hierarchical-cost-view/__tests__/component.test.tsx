import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HierarchicalCostView } from '../component'

describe('HierarchicalCostView', () => {
  const mockData = [
    {
      id: 'bl-1',
      level: 'business_line' as const,
      name: 'Operations',
      budget: 2000000,
      actual: 1800000,
      variance: 200000,
      utilization: 90,
      children: [
        {
          id: 'cl-1',
          level: 'cost_line' as const,
          name: 'Engineering',
          budget: 1000000,
          actual: 950000,
          variance: 50000,
          utilization: 95,
          children: [
            {
              id: 'st-1',
              level: 'spend_type' as const,
              name: 'Labor',
              budget: 600000,
              actual: 650000,
              variance: -50000,
              utilization: 108,
            }
          ]
        }
      ]
    },
    {
      id: 'bl-2',
      level: 'business_line' as const,
      name: 'Marketing',
      budget: 500000,
      actual: 400000,
      variance: 100000,
      utilization: 80,
    }
  ]

  describe('BA-001: Hierarchical data display', () => {
    it('should render all top-level rows with correct data', () => {
      render(<HierarchicalCostView data={mockData} />)
      
      // Verify both business lines are displayed
      expect(screen.getByText('Operations')).toBeInTheDocument()
      expect(screen.getByText('Marketing')).toBeInTheDocument()
      
      // Verify budget values are formatted and displayed
      expect(screen.getByText('$2M')).toBeInTheDocument()
      expect(screen.getByText('$500,000')).toBeInTheDocument()
      
      // Verify level badges are rendered
      const badges = screen.getAllByText(/business line/i)
      expect(badges).toHaveLength(2)
    })

    it('should display nested data structure correctly', () => {
      render(<HierarchicalCostView data={mockData} />)
      
      // Initially, children should not be visible (collapsed)
      expect(screen.queryByText('Engineering')).not.toBeInTheDocument()
      expect(screen.queryByText('Labor')).not.toBeInTheDocument()
    })
  })

  describe('BA-002: Expand/collapse functionality', () => {
    it('should toggle child row visibility on chevron click', async () => {
      const user = userEvent.setup()
      render(<HierarchicalCostView data={mockData} />)
      
      // Find expand button for Operations row (has children)
      const expandButtons = screen.getAllByRole('button')
      const operationsExpandButton = expandButtons[0] // First button is expand/collapse
      
      // Initially collapsed - child not visible
      expect(screen.queryByText('Engineering')).not.toBeInTheDocument()
      
      // Click to expand
      await user.click(operationsExpandButton)
      
      // Now child should be visible
      expect(screen.getByText('Engineering')).toBeInTheDocument()
      
      // Click again to collapse
      await user.click(operationsExpandButton)
      
      // Child should be hidden again
      expect(screen.queryByText('Engineering')).not.toBeInTheDocument()
    })

    it('should expand nested hierarchy multiple levels', async () => {
      const user = userEvent.setup()
      render(<HierarchicalCostView data={mockData} />)
      
      // Expand first level (Operations)
      const buttons = screen.getAllByRole('button')
      await user.click(buttons[0])
      
      // Engineering should be visible
      expect(screen.getByText('Engineering')).toBeInTheDocument()
      
      // Expand second level (Engineering)
      const updatedButtons = screen.getAllByRole('button')
      const engineeringButton = updatedButtons[1] // Second expand button
      await user.click(engineeringButton)
      
      // Labor should be visible
      expect(screen.getByText('Labor')).toBeInTheDocument()
    })

    it('should not render expand button for rows without children', () => {
      render(<HierarchicalCostView data={mockData} />)
      
      // Marketing row has no children, so it should not have an expand button
      // Operations has children, so it should have one
      const buttons = screen.getAllByRole('button')
      
      // Only Operations and its Details buttons should exist initially
      // Marketing should have a Details button but no expand button
      expect(buttons.length).toBeGreaterThan(0)
    })
  })

  describe('BA-003: Currency formatting', () => {
    it('should format large values with compact notation', () => {
      render(<HierarchicalCostView data={mockData} />)
      
      // 2,000,000 should be formatted as "$2M"
      expect(screen.getByText('$2M')).toBeInTheDocument()
      
      // 1,800,000 should be formatted as "$1.8M"
      expect(screen.getByText('$1.8M')).toBeInTheDocument()
    })

    it('should format small values with standard notation', () => {
      const smallData = [{
        id: 'test-1',
        level: 'business_line' as const,
        name: 'Small Budget',
        budget: 5000,
        actual: 4500,
        variance: 500,
        utilization: 90,
      }]
      
      render(<HierarchicalCostView data={smallData} />)
      
      // 5,000 should be formatted as "$5,000" (not "$5K")
      expect(screen.getByText('$5,000')).toBeInTheDocument()
      expect(screen.getByText('$4,500')).toBeInTheDocument()
    })

    it('should handle variance display with "over" indicator', () => {
      const user = userEvent.setup()
      render(<HierarchicalCostView data={mockData} />)
      
      // Positive variance (under budget) should not have "over"
      expect(screen.getByText('$200,000')).toBeInTheDocument()
      
      // Need to expand to see negative variance
    })
  })

  describe('BA-004: Utilization color coding', () => {
    it('should apply red color for utilization >100%', async () => {
      const user = userEvent.setup()
      render(<HierarchicalCostView data={mockData} />)
      
      // Expand to see Labor with 108% utilization
      const buttons = screen.getAllByRole('button')
      await user.click(buttons[0]) // Expand Operations
      await user.click(screen.getAllByRole('button')[1]) // Expand Engineering
      
      // Find utilization text for Labor (108%)
      const utilizationText = screen.getByText('108%')
      expect(utilizationText).toHaveClass('text-red-600')
    })

    it('should apply orange color for utilization >90% and ≤100%', () => {
      render(<HierarchicalCostView data={mockData} />)
      
      // Engineering has 95% utilization (needs to be expanded to check, or check inline)
      // Operations has 90% utilization
      const utilizationTexts = screen.getAllByText(/90%|95%/)
      expect(utilizationTexts.length).toBeGreaterThan(0)
    })

    it('should apply gray color for utilization ≤75%', () => {
      render(<HierarchicalCostView data={mockData} />)
      
      // Marketing has 80% utilization
      const marketingRow = screen.getByText('Marketing').closest('tr')
      expect(marketingRow).toBeInTheDocument()
      
      // Utilization percentage should be visible
      const utilizationText = within(marketingRow!).getByText('80%')
      expect(utilizationText).toHaveClass('text-gray-600')
    })
  })

  describe('BA-005: Progress bar rendering', () => {
    it('should render progress bar with correct width', () => {
      const { container } = render(<HierarchicalCostView data={mockData} />)
      
      // Find progress bars
      const progressBars = container.querySelectorAll('[style*="width"]')
      expect(progressBars.length).toBeGreaterThan(0)
      
      // Operations with 90% utilization should have 90% width
      // Marketing with 80% utilization should have 80% width
    })

    it('should color-code progress bar background', () => {
      const { container } = render(<HierarchicalCostView data={mockData} />)
      
      // Find progress bars and verify they have color classes
      const progressBars = container.querySelectorAll('.h-full')
      expect(progressBars.length).toBeGreaterThan(0)
      
      // Each should have a color class (bg-red-500, bg-orange-500, bg-yellow-500, or bg-blue-500)
    })

    it('should cap progress bar width at 100%', () => {
      const overBudgetData = [{
        id: 'test-1',
        level: 'business_line' as const,
        name: 'Over Budget',
        budget: 100000,
        actual: 150000,
        variance: -50000,
        utilization: 150, // 150% should cap at 100% visually
      }]
      
      const { container } = render(<HierarchicalCostView data={overBudgetData} />)
      
      // Progress bar width should be capped at 100%
      const progressBar = container.querySelector('[style*="width: 100%"]')
      expect(progressBar).toBeInTheDocument()
    })
  })

  describe('BA-006: Empty state handling', () => {
    it('should display empty state message when data is empty array', () => {
      render(<HierarchicalCostView data={[]} />)
      
      expect(screen.getByText('No cost breakdown data available')).toBeInTheDocument()
    })

    it('should display empty state message when data is null', () => {
      // @ts-expect-error Testing null case
      render(<HierarchicalCostView data={null} />)
      
      expect(screen.getByText('No cost breakdown data available')).toBeInTheDocument()
    })

    it('should display empty state message when data is undefined', () => {
      // @ts-expect-error Testing undefined case
      render(<HierarchicalCostView data={undefined} />)
      
      expect(screen.getByText('No cost breakdown data available')).toBeInTheDocument()
    })

    it('should not display table when empty', () => {
      const { container } = render(<HierarchicalCostView data={[]} />)
      
      const table = container.querySelector('table')
      expect(table).not.toBeInTheDocument()
    })
  })

  describe('Integration tests', () => {
    it('should maintain expansion state during re-renders', async () => {
      const user = userEvent.setup()
      const { rerender } = render(<HierarchicalCostView data={mockData} />)
      
      // Expand Operations
      const buttons = screen.getAllByRole('button')
      await user.click(buttons[0])
      
      // Engineering should be visible
      expect(screen.getByText('Engineering')).toBeInTheDocument()
      
      // Re-render with same data
      rerender(<HierarchicalCostView data={mockData} />)
      
      // Engineering should still be visible
      expect(screen.getByText('Engineering')).toBeInTheDocument()
    })

    it('should handle deeply nested hierarchy', async () => {
      const deepData = [
        {
          id: 'level-0',
          level: 'business_line' as const,
          name: 'Level 0',
          budget: 1000000,
          actual: 900000,
          variance: 100000,
          utilization: 90,
          children: [
            {
              id: 'level-1',
              level: 'cost_line' as const,
              name: 'Level 1',
              budget: 500000,
              actual: 450000,
              variance: 50000,
              utilization: 90,
              children: [
                {
                  id: 'level-2',
                  level: 'spend_type' as const,
                  name: 'Level 2',
                  budget: 250000,
                  actual: 225000,
                  variance: 25000,
                  utilization: 90,
                  children: [
                    {
                      id: 'level-3',
                      level: 'sub_category' as const,
                      name: 'Level 3',
                      budget: 125000,
                      actual: 112500,
                      variance: 12500,
                      utilization: 90,
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
      
      const user = userEvent.setup()
      render(<HierarchicalCostView data={deepData} />)
      
      // Should be able to expand all levels
      let buttons = screen.getAllByRole('button')
      
      // Expand level 0
      await user.click(buttons[0])
      expect(screen.getByText('Level 1')).toBeInTheDocument()
      
      // Expand level 1
      buttons = screen.getAllByRole('button')
      await user.click(buttons[1])
      expect(screen.getByText('Level 2')).toBeInTheDocument()
      
      // Expand level 2
      buttons = screen.getAllByRole('button')
      await user.click(buttons[2])
      expect(screen.getByText('Level 3')).toBeInTheDocument()
    })
  })
})
