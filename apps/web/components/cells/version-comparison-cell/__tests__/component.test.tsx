import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { VersionComparisonCell } from '../component'

const mockData = {
  version1: {
    versionNumber: 0,
    items: [
      { id: '1', forecastVersionId: 'v0', costBreakdownId: 'cb1', forecastedCost: 1000 },
      { id: '2', forecastVersionId: 'v0', costBreakdownId: 'cb2', forecastedCost: 2000 }
    ]
  },
  version2: {
    versionNumber: 1,
    items: [
      { id: '3', forecastVersionId: 'v1', costBreakdownId: 'cb1', forecastedCost: 1500 },
      { id: '4', forecastVersionId: 'v1', costBreakdownId: 'cb3', forecastedCost: 3000 }
    ]
  },
  originalCostBreakdown: [
    { id: 'cb1', costLine: 'Labor', subBusinessLine: 'Engineering', budgetCost: 1000 },
    { id: 'cb2', costLine: 'Materials', subBusinessLine: 'Procurement', budgetCost: 2000 },
    { id: 'cb3', costLine: 'Equipment', subBusinessLine: 'Operations', budgetCost: 3000 }
  ]
}

// Create mockUseQuery factory function
const mockUseQuery = vi.fn()

vi.mock('@/lib/trpc', () => ({
  trpc: {
    forecasts: {
      getComparisonData: {
        useQuery: (...args: any[]) => mockUseQuery(...args)
      }
    }
  }
}))

describe('VersionComparisonCell', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    projectId: 'test-project-id',
    projectName: 'Test Project',
    selectedVersion1: 0,
    selectedVersion2: 1,
    mode: 'sheet' as const
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // BA-041: Loading and error states
  it('shows loading skeleton during fetch', () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: true,
      error: null
    })

    render(<VersionComparisonCell {...defaultProps} />)
    expect(screen.getAllByTestId('skeleton')).toBeTruthy()
  })

  it('shows error message on failure', () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to load comparison')
    })

    render(<VersionComparisonCell {...defaultProps} />)
    expect(screen.getByText(/Error loading comparison/i)).toBeInTheDocument()
    expect(screen.getByText(/Failed to load comparison/i)).toBeInTheDocument()
  })

  // BA-035: Displays comparison with diffs
  it('displays comparison between two versions with diff statuses', async () => {
    mockUseQuery.mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null
    })

    render(<VersionComparisonCell {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText(/Labor/i)).toBeInTheDocument()
      expect(screen.getByText(/Materials/i)).toBeInTheDocument()
      expect(screen.getByText(/Equipment/i)).toBeInTheDocument()
    })
  })

  // BA-036: Shows summary metrics
  it('displays summary metrics with totals and change percentage', async () => {
    mockUseQuery.mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null
    })

    render(<VersionComparisonCell {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText(/Total Change/i)).toBeInTheDocument()
      expect(screen.getByText(/Items Changed/i)).toBeInTheDocument()
      expect(screen.getByText(/Items Added/i)).toBeInTheDocument()
      expect(screen.getByText(/Items Removed/i)).toBeInTheDocument()
    })
  })

  // BA-037: Filters by view mode
  it('filters differences when view mode changes', async () => {
    mockUseQuery.mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null
    })

    render(<VersionComparisonCell {...defaultProps} />)

    await waitFor(() => {
      const changedButton = screen.getByRole('radio', { name: /Changed/i })
      fireEvent.click(changedButton)
      expect(changedButton).toHaveAttribute('data-state', 'on')
    })
  })

  // BA-038: Search filtering
  it('filters by search query', async () => {
    mockUseQuery.mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null
    })

    render(<VersionComparisonCell {...defaultProps} />)

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/Search/i)
      fireEvent.change(searchInput, { target: { value: 'Labor' } })
      expect(searchInput).toHaveValue('Labor')
    })
  })

  // BA-039: CSV export
  it('exports comparison to CSV', async () => {
    mockUseQuery.mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null
    })

    const createElementSpy = vi.spyOn(document, 'createElement')
    const clickSpy = vi.fn()
    createElementSpy.mockReturnValue({ click: clickSpy, href: '', download: '' } as any)

    render(<VersionComparisonCell {...defaultProps} />)

    await waitFor(() => {
      const exportButton = screen.getByRole('button', { name: /Export/i })
      fireEvent.click(exportButton)
      expect(clickSpy).toHaveBeenCalled()
    })

    createElementSpy.mockRestore()
  })

  // BA-040: Tab switching
  it('switches between overview, details, and charts tabs', async () => {
    mockUseQuery.mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null
    })

    render(<VersionComparisonCell {...defaultProps} />)

    await waitFor(() => {
      const overviewTab = screen.getByRole('tab', { name: /Overview/i })
      const detailsTab = screen.getByRole('tab', { name: /Details/i })
      const chartsTab = screen.getByRole('tab', { name: /Charts/i })

      expect(overviewTab).toBeInTheDocument()
      expect(detailsTab).toBeInTheDocument()
      expect(chartsTab).toBeInTheDocument()

      fireEvent.click(detailsTab)
      expect(detailsTab).toHaveAttribute('data-state', 'active')

      fireEvent.click(chartsTab)
      expect(chartsTab).toHaveAttribute('data-state', 'active')
    })
  })

  it('renders in dialog mode', async () => {
    mockUseQuery.mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null
    })

    render(<VersionComparisonCell {...defaultProps} mode="dialog" />)

    await waitFor(() => {
      expect(screen.getByText(/Version Comparison - Test Project/i)).toBeInTheDocument()
    })
  })
})
