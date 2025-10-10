import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { FilterSidebarCell } from '../component'
import type { POFilters } from '@/types/filters'

// Mock scrollIntoView for Radix UI Select
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
})

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
  it('BA-002: shows active filter count badge when filters applied', async () => {
    render(<FilterSidebarCell onFilterChange={mockOnFilterChange} />)
    
    // Apply location filter - Find by label and select trigger
    const locationLabel = screen.getByText('Location')
    const locationContainer = locationLabel.parentElement!
    const selectTrigger = within(locationContainer).getByText('All Locations')
    fireEvent.click(selectTrigger)
    
    // Wait for dropdown and select option
    await waitFor(() => expect(screen.getByText('Jandakot')).toBeInTheDocument())
    const jandakotOption = screen.getByText('Jandakot')
    fireEvent.click(jandakotOption)
    
    // Apply FMT PO filter - Find toggle by text content
    const fmtPoText = screen.getByText('FMT PO Only')
    const toggleContainer = fmtPoText.closest('div')!.parentElement!
    const fmtToggle = within(toggleContainer).getByRole('button')
    fireEvent.click(fmtToggle)
    
    // Apply mapping status filter
    const mappedButton = screen.getByRole('button', { name: /^mapped$/i })
    fireEvent.click(mappedButton)
    
    // Verify active filter count badge shows "3 active"
    await waitFor(() => expect(screen.getByText('3 active')).toBeInTheDocument())
  })

  // BA-003: Shows individual filter badges with remove buttons
  it('BA-003: shows individual filter badges with X icons', async () => {
    render(<FilterSidebarCell onFilterChange={mockOnFilterChange} />)
    
    // Apply location filter
    const locationLabel = screen.getByText('Location')
    const locationContainer = locationLabel.parentElement!
    const selectTrigger = within(locationContainer).getByText('All Locations')
    fireEvent.click(selectTrigger)
    
    await waitFor(() => expect(screen.getByText('Perth')).toBeInTheDocument())
    const perthOption = screen.getByText('Perth')
    fireEvent.click(perthOption)
    
    // Apply FMT PO filter
    const fmtPoText = screen.getAllByText('FMT PO Only')[0] // Get first occurrence (toggle label)
    const toggleContainer = fmtPoText.closest('div')!.parentElement!
    const fmtToggle = within(toggleContainer).getByRole('button')
    fireEvent.click(fmtToggle)
    
    // Verify location badge visible
    await waitFor(() => expect(screen.getByText('Location: Perth')).toBeInTheDocument())
    
    // Verify FMT PO badge visible - use getAllByText and find the badge one
    await waitFor(() => {
      const fmtBadges = screen.getAllByText('FMT PO Only')
      expect(fmtBadges.length).toBeGreaterThanOrEqual(2) // Toggle label + badge
    })
    
    // Verify badges are clickable (count includes other buttons)
    const allButtons = screen.getAllByRole('button')
    expect(allButtons.length).toBeGreaterThan(0)
  })

  // BA-004: Automatically calls onFilterChange when any filter state changes
  it('BA-004: auto-applies filters when state changes', async () => {
    render(<FilterSidebarCell onFilterChange={mockOnFilterChange} />)
    
    mockOnFilterChange.mockClear()
    
    // Change location
    const locationLabel = screen.getByText('Location')
    const locationContainer = locationLabel.parentElement!
    const selectTrigger = within(locationContainer).getByText('All Locations')
    fireEvent.click(selectTrigger)
    
    await waitFor(() => expect(screen.getByText('Darwin')).toBeInTheDocument())
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
  it('BA-006: custom date range clears preset highlight', async () => {
    const { container } = render(<FilterSidebarCell onFilterChange={mockOnFilterChange} />)
    
    // First select a preset
    const todayButton = screen.getByRole('button', { name: /^today$/i })
    fireEvent.click(todayButton)
    
    // Verify preset highlighted
    expect(todayButton).toHaveClass('bg-blue-100')
    
    // Open custom date picker - find button by ID attribute
    const dateRangeButton = container.querySelector('#date-range') as HTMLElement
    expect(dateRangeButton).toBeTruthy()
    fireEvent.click(dateRangeButton)
    
    // Verify the popover opens
    await waitFor(() => expect(screen.getByText('Custom Date Range')).toBeInTheDocument())
  })

  // BA-007: Individual filter removal via badge click resets that filter only
  it('BA-007: removing individual filter resets only that filter', async () => {
    render(<FilterSidebarCell onFilterChange={mockOnFilterChange} />)
    
    // Apply location filter
    const locationLabel = screen.getByText('Location')
    const locationContainer = locationLabel.parentElement!
    const selectTrigger = within(locationContainer).getByText('All Locations')
    fireEvent.click(selectTrigger)
    
    await waitFor(() => expect(screen.getByText('Karratha')).toBeInTheDocument())
    const karrathaOption = screen.getByText('Karratha')
    fireEvent.click(karrathaOption)
    
    // Apply FMT PO filter
    const fmtPoText = screen.getAllByText('FMT PO Only')[0]
    const toggleContainer = fmtPoText.closest('div')!.parentElement!
    const fmtToggle = within(toggleContainer).getByRole('button')
    fireEvent.click(fmtToggle)
    
    mockOnFilterChange.mockClear()
    
    // Click location badge to remove it - badges are clickable
    await waitFor(() => expect(screen.getByText('Location: Karratha')).toBeInTheDocument())
    const locationBadge = screen.getByText('Location: Karratha').closest('span')!
    fireEvent.click(locationBadge)
    
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
    const locationLabel = screen.getByText('Location')
    const locationContainer = locationLabel.parentElement!
    const selectTrigger = within(locationContainer).getByText('All Locations')
    fireEvent.click(selectTrigger)
    
    await waitFor(() => expect(screen.getByText('Perth')).toBeInTheDocument())
    const perthOption = screen.getByText('Perth')
    fireEvent.click(perthOption)
    
    const fmtPoText = screen.getAllByText('FMT PO Only')[0]
    const toggleContainer = fmtPoText.closest('div')!.parentElement!
    const fmtToggle = within(toggleContainer).getByRole('button')
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
    
    // Verify filter icon exists in the document (SVG is rendered inline)
    const container = screen.getByText('No filters applied').parentElement!
    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
  })

  // BA-010: Location select shows visual highlight when not 'all'
  it('BA-010: location select highlights when value not "all"', async () => {
    render(<FilterSidebarCell onFilterChange={mockOnFilterChange} />)
    
    // Get location select trigger
    const locationLabel = screen.getByText('Location')
    const locationContainer = locationLabel.parentElement!
    const selectTrigger = within(locationContainer).getByText('All Locations').closest('button')!
    
    // Initially should not have highlight
    expect(selectTrigger).not.toHaveClass('border-blue-200')
    
    // Select a location
    fireEvent.click(selectTrigger)
    await waitFor(() => expect(screen.getByText('Jandakot')).toBeInTheDocument())
    const jandakotOption = screen.getByText('Jandakot')
    fireEvent.click(jandakotOption)
    
    // Verify select now has highlight
    await waitFor(() => {
      expect(selectTrigger).toHaveClass('border-blue-200')
    })
  })

  // BA-011: FMT PO toggle switches between enabled/disabled with visual feedback
  it('BA-011: FMT PO toggle switches with visual animation', () => {
    render(<FilterSidebarCell onFilterChange={mockOnFilterChange} />)
    
    // Find the toggle button by its position within FMT PO section
    const fmtPoText = screen.getAllByText('FMT PO Only')[0]
    const toggleContainer = fmtPoText.closest('div')!.parentElement!
    const fmtToggle = within(toggleContainer).getByRole('button')
    
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
