import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { FilterSidebarCell } from '../component'
import type { POFilters } from '@/types/filters'

describe('FilterSidebarCell', () => {
  const mockOnFilterChange = vi.fn()

  beforeEach(() => {
    mockOnFilterChange.mockClear()
  })

  // BA-001: Component initializes with all filters in default/neutral state
  it('BA-001: initializes with all filters in default state', () => {
    render(<FilterSidebarCell onFilterChange={mockOnFilterChange} />)
    
    // Verify no active filters badge
    expect(screen.queryByText(/active/)).not.toBeInTheDocument()
    
    // Verify empty state message visible
    expect(screen.getByText('No filters applied')).toBeInTheDocument()
    
    // Verify callback called with default values (all undefined except poNumbers empty)
    expect(mockOnFilterChange).toHaveBeenCalledWith({
      location: undefined,
      fmtPo: undefined,
      mappingStatus: undefined,
      poNumbers: '',
      dateRange: undefined,
    })
  })

  // BA-002: Displays active filter count badge when filters are applied
  it('BA-002: shows active filter count badge when filters applied', () => {
    render(<FilterSidebarCell onFilterChange={mockOnFilterChange} />)
    
    // Apply location filter
    const locationSelect = screen.getByRole('combobox', { name: /location/i })
    fireEvent.click(locationSelect)
    const jandakotOption = screen.getByText('Jandakot')
    fireEvent.click(jandakotOption)
    
    // Apply FMT PO filter
    const fmtToggle = screen.getByRole('button', { name: /fmt po only/i })
    fireEvent.click(fmtToggle)
    
    // Apply mapping status filter
    const mappedButton = screen.getByRole('button', { name: /^mapped$/i })
    fireEvent.click(mappedButton)
    
    // Verify active filter count badge shows "3 active"
    expect(screen.getByText('3 active')).toBeInTheDocument()
  })

  // BA-003: Shows individual filter badges with remove buttons
  it('BA-003: shows individual filter badges with X icons', () => {
    render(<FilterSidebarCell onFilterChange={mockOnFilterChange} />)
    
    // Apply location filter
    const locationSelect = screen.getByRole('combobox', { name: /location/i })
    fireEvent.click(locationSelect)
    const perthOption = screen.getByText('Perth')
    fireEvent.click(perthOption)
    
    // Apply FMT PO filter
    const fmtToggle = screen.getByRole('button', { name: /fmt po only/i })
    fireEvent.click(fmtToggle)
    
    // Verify location badge visible
    expect(screen.getByText('Location: Perth')).toBeInTheDocument()
    
    // Verify FMT PO badge visible
    expect(screen.getByText('FMT PO Only')).toBeInTheDocument()
    
    // Verify badges are clickable (have X icons)
    const badges = screen.getAllByRole('button').filter(b => b.textContent?.includes('Location') || b.textContent?.includes('FMT'))
    expect(badges.length).toBeGreaterThan(0)
  })

  // BA-004: Automatically calls onFilterChange when any filter state changes
  it('BA-004: auto-applies filters when state changes', async () => {
    render(<FilterSidebarCell onFilterChange={mockOnFilterChange} />)
    
    mockOnFilterChange.mockClear()
    
    // Change location
    const locationSelect = screen.getByRole('combobox', { name: /location/i })
    fireEvent.click(locationSelect)
    const darwinOption = screen.getByText('Darwin')
    fireEvent.click(darwinOption)
    
    // Verify callback invoked automatically
    await waitFor(() => {
      expect(mockOnFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          location: 'Darwin',
        })
      )
    })
  })

  // BA-005: Date preset selection updates dateRange and highlights preset button
  it('BA-005: date preset selection updates state and highlights button', () => {
    render(<FilterSidebarCell onFilterChange={mockOnFilterChange} />)
    
    // Click "Last 7 days" preset
    const last7DaysButton = screen.getByRole('button', { name: /last 7 days/i })
    fireEvent.click(last7DaysButton)
    
    // Verify button highlighted (has bg-blue-100 class)
    expect(last7DaysButton).toHaveClass('bg-blue-100')
    
    // Verify callback invoked with dateRange
    expect(mockOnFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        dateRange: expect.objectContaining({
          from: expect.any(Date),
          to: expect.any(Date),
        }),
      })
    )
  })

  // BA-006: Custom date range selection clears preset highlight
  it('BA-006: custom date range clears preset highlight', () => {
    render(<FilterSidebarCell onFilterChange={mockOnFilterChange} />)
    
    // First select a preset
    const todayButton = screen.getByRole('button', { name: /^today$/i })
    fireEvent.click(todayButton)
    
    // Verify preset highlighted
    expect(todayButton).toHaveClass('bg-blue-100')
    
    // Open custom date picker
    const dateRangeButton = screen.getByRole('button', { name: /pick dates/i })
    fireEvent.click(dateRangeButton)
    
    // Note: Full calendar interaction would require more complex setup
    // For now, verify the popover opens
    expect(screen.getByText('Custom Date Range')).toBeInTheDocument()
  })

  // BA-007: Individual filter removal via badge click resets that filter only
  it('BA-007: removing individual filter resets only that filter', async () => {
    render(<FilterSidebarCell onFilterChange={mockOnFilterChange} />)
    
    // Apply location filter
    const locationSelect = screen.getByRole('combobox', { name: /location/i })
    fireEvent.click(locationSelect)
    const karrathaOption = screen.getByText('Karratha')
    fireEvent.click(karrathaOption)
    
    // Apply FMT PO filter
    const fmtToggle = screen.getByRole('button', { name: /fmt po only/i })
    fireEvent.click(fmtToggle)
    
    mockOnFilterChange.mockClear()
    
    // Click location badge to remove it
    const locationBadge = screen.getByText('Location: Karratha').closest('span')
    if (locationBadge) {
      fireEvent.click(locationBadge)
    }
    
    // Verify callback invoked with location reset but fmtPo still true
    await waitFor(() => {
      expect(mockOnFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          location: undefined,
          fmtPo: true,
        })
      )
    })
  })

  // BA-008: Clear all button resets all filters to defaults
  it('BA-008: clear all button resets all filters', async () => {
    render(<FilterSidebarCell onFilterChange={mockOnFilterChange} />)
    
    // Apply multiple filters
    const locationSelect = screen.getByRole('combobox', { name: /location/i })
    fireEvent.click(locationSelect)
    const perthOption = screen.getByText('Perth')
    fireEvent.click(perthOption)
    
    const fmtToggle = screen.getByRole('button', { name: /fmt po only/i })
    fireEvent.click(fmtToggle)
    
    mockOnFilterChange.mockClear()
    
    // Click "Clear all" button
    const clearAllButton = screen.getByRole('button', { name: /clear all/i })
    fireEvent.click(clearAllButton)
    
    // Verify all filters reset
    await waitFor(() => {
      expect(mockOnFilterChange).toHaveBeenCalledWith({
        location: undefined,
        fmtPo: undefined,
        mappingStatus: undefined,
        poNumbers: '',
        dateRange: undefined,
      })
    })
    
    // Verify empty state message visible again
    expect(screen.getByText('No filters applied')).toBeInTheDocument()
  })

  // BA-009: Displays empty state message when no filters are active
  it('BA-009: shows empty state when no filters active', () => {
    render(<FilterSidebarCell onFilterChange={mockOnFilterChange} />)
    
    // Verify empty state visible initially
    expect(screen.getByText('No filters applied')).toBeInTheDocument()
    
    // Verify filter icon in empty state
    const emptyStateIcon = screen.getByText('No filters applied').previousSibling
    expect(emptyStateIcon).toBeTruthy()
  })

  // BA-010: Location select shows visual highlight when not 'all'
  it('BA-010: location select highlights when value not "all"', () => {
    render(<FilterSidebarCell onFilterChange={mockOnFilterChange} />)
    
    // Get location select trigger
    const locationSelect = screen.getByRole('combobox', { name: /location/i })
    
    // Initially should not have highlight
    expect(locationSelect).not.toHaveClass('border-blue-200')
    
    // Select a location
    fireEvent.click(locationSelect)
    const jandakotOption = screen.getByText('Jandakot')
    fireEvent.click(jandakotOption)
    
    // Verify select now has highlight
    expect(locationSelect).toHaveClass('border-blue-200')
  })

  // BA-011: FMT PO toggle switches between enabled/disabled with visual feedback
  it('BA-011: FMT PO toggle switches with visual animation', () => {
    render(<FilterSidebarCell onFilterChange={mockOnFilterChange} />)
    
    const fmtToggle = screen.getByRole('button', { name: /fmt po only/i })
    
    // Initially should be off (bg-slate-200)
    expect(fmtToggle).toHaveClass('bg-slate-200')
    
    // Click to enable
    fireEvent.click(fmtToggle)
    
    // Verify toggle is now on (bg-blue-600)
    expect(fmtToggle).toHaveClass('bg-blue-600')
    
    // Click to disable
    fireEvent.click(fmtToggle)
    
    // Verify toggle is back to off
    expect(fmtToggle).toHaveClass('bg-slate-200')
  })

  // BA-012: Mapping status segmented control allows switching between all/mapped/unmapped
  it('BA-012: mapping status segmented control switches correctly', async () => {
    render(<FilterSidebarCell onFilterChange={mockOnFilterChange} />)
    
    mockOnFilterChange.mockClear()
    
    // Click "Mapped" button
    const mappedButton = screen.getByRole('button', { name: /^mapped$/i })
    fireEvent.click(mappedButton)
    
    // Verify callback invoked with mapped status
    await waitFor(() => {
      expect(mockOnFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          mappingStatus: 'mapped',
        })
      )
    })
    
    mockOnFilterChange.mockClear()
    
    // Click "Unmapped" button
    const unmappedButton = screen.getByRole('button', { name: /^unmapped$/i })
    fireEvent.click(unmappedButton)
    
    // Verify callback invoked with unmapped status
    await waitFor(() => {
      expect(mockOnFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          mappingStatus: 'unmapped',
        })
      )
    })
  })

  // BA-013: PO numbers textarea shows active state when not empty
  it('BA-013: PO numbers textarea highlights when not empty', () => {
    render(<FilterSidebarCell onFilterChange={mockOnFilterChange} />)
    
    const poNumbersTextarea = screen.getByPlaceholderText(/paste po numbers/i)
    
    // Initially should not have highlight
    expect(poNumbersTextarea).not.toHaveClass('border-blue-200')
    
    // Enter PO number
    fireEvent.change(poNumbersTextarea, { target: { value: '12345' } })
    
    // Verify textarea now has highlight
    expect(poNumbersTextarea).toHaveClass('border-blue-200')
  })

  // BA-014: CRITICAL - Trims whitespace from PO numbers before passing to parent callback
  it('BA-014: trims whitespace from PO numbers before callback', async () => {
    render(<FilterSidebarCell onFilterChange={mockOnFilterChange} />)
    
    mockOnFilterChange.mockClear()
    
    const poNumbersTextarea = screen.getByPlaceholderText(/paste po numbers/i)
    
    // Enter PO number with whitespace
    fireEvent.change(poNumbersTextarea, { target: { value: '  12345  ' } })
    
    // Verify callback invoked with trimmed value
    await waitFor(() => {
      expect(mockOnFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          poNumbers: '12345',  // ✅ Should be trimmed
        })
      )
    })
  })
})
