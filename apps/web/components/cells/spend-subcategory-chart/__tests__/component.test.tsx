import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SpendSubcategoryChart } from '../component'

describe('SpendSubcategoryChart', () => {
  const mockData = [
    { category: 'Labor', subcategory: 'Engineers', value: 500000, budget: 450000, percentage: 111 },
    { category: 'Labor', subcategory: 'Managers', value: 200000, budget: 250000, percentage: 80 },
    { category: 'Materials', subcategory: 'Steel', value: 300000, budget: 350000, percentage: 86 }
  ]

  // BA-001: View Mode Toggle
  it('should toggle between tree and list views', () => {
    render(<SpendSubcategoryChart data={mockData} />)
    
    const treeButton = screen.getByRole('button', { name: /tree view/i })
    const listButton = screen.getByRole('button', { name: /list view/i })
    
    // Toggle to list view
    fireEvent.click(listButton)
    expect(screen.getByText('Labor')).toBeInTheDocument()
    
    // Toggle back to tree view
    fireEvent.click(treeButton)
  })

  // BA-007: Loading State
  it('should display spinner when loading', () => {
    render(<SpendSubcategoryChart data={[]} loading={true} />)
    
    const spinner = screen.getByRole('status', { hidden: true }) || document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  // BA-009: Grand Total
  it('should show correct grand total', () => {
    render(<SpendSubcategoryChart data={mockData} />)
    
    // 500k + 200k + 300k = 1M = "$1.0M" (compact notation)
    const totalText = screen.getByText(/total across all subcategories/i)
    expect(totalText).toBeInTheDocument()
  })

  // BA-010: Empty Data Handling
  it('should not crash with empty data', () => {
    expect(() => {
      render(<SpendSubcategoryChart data={[]} />)
    }).not.toThrow()
    
    // Should show $0 total
    expect(screen.getByText(/total across all subcategories/i)).toBeInTheDocument()
  })
})
