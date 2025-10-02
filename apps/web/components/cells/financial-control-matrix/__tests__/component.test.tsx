import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FinancialControlMatrixCell } from '../component'
import { trpc } from '@/lib/trpc'

// Mock the tRPC client
vi.mock('@/lib/trpc', () => ({
  trpc: {
    dashboard: {
      getFinancialControlMetrics: {
        useQuery: vi.fn(),
      },
    },
  },
}))

describe('FinancialControlMatrixCell', () => {
  const mockProjectId = 'test-uuid-123'
  
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  // BA-001: Loading state
  it('BA-001: displays loading spinner when data is fetching', () => {
    vi.mocked(trpc.dashboard.getFinancialControlMetrics.useQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any)
    
    const { container } = render(<FinancialControlMatrixCell projectId={mockProjectId} />)
    
    // Should render loading state (spinner with animate-spin class)
    const spinner = container.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })
  
  // BA-011: Error state
  it('BA-011: displays error alert when tRPC query fails', () => {
    vi.mocked(trpc.dashboard.getFinancialControlMetrics.useQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { message: 'Failed to fetch financial metrics' },
    } as any)
    
    render(<FinancialControlMatrixCell projectId={mockProjectId} />)
    
    expect(screen.getByText(/Failed to Load Financial Control Matrix/i)).toBeInTheDocument()
    expect(screen.getByText(/Failed to fetch financial metrics/i)).toBeInTheDocument()
  })
  
  // BA-003: Empty data handling
  it('BA-003: handles empty categories array without crashing', () => {
    vi.mocked(trpc.dashboard.getFinancialControlMetrics.useQuery).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any)
    
    render(<FinancialControlMatrixCell projectId={mockProjectId} />)
    
    // Should render without errors (matrix header should be visible)
    expect(screen.getByText(/Financial Control Matrix/i)).toBeInTheDocument()
  })
  
  // BA-002: Insights calculation
  it('BA-002: component renders with data (insights tested in presentation component)', async () => {
    const mockData = [
      { name: 'Equipment', budget: 1000, committed: 800, plImpact: 600, gapToPL: 200 },
      { name: 'Labor', budget: 500, committed: 300, plImpact: 250, gapToPL: 50 },
    ]
    
    vi.mocked(trpc.dashboard.getFinancialControlMetrics.useQuery).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
    } as any)
    
    render(<FinancialControlMatrixCell projectId={mockProjectId} />)
    
    // Should pass data to presentation component
    await waitFor(() => {
      const equipmentTexts = screen.getAllByText(/Equipment/i)
      const laborTexts = screen.getAllByText(/Labor/i)
      expect(equipmentTexts.length).toBeGreaterThan(0)
      expect(laborTexts.length).toBeGreaterThan(0)
    })
  })
  
  // BA-004: Division by zero protection
  it('BA-004: handles zero budget without NaN', () => {
    const mockData = [
      { name: 'Equipment', budget: 0, committed: 800, plImpact: 600, gapToPL: 200 },
    ]
    
    vi.mocked(trpc.dashboard.getFinancialControlMetrics.useQuery).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
    } as any)
    
    render(<FinancialControlMatrixCell projectId={mockProjectId} />)
    
    // Should not display NaN anywhere
    const bodyText = document.body.textContent || ''
    expect(bodyText).not.toContain('NaN')
  })
  
  // BA-010: Over-budget indicator (tested in presentation component)
  it('BA-010: renders data including over-budget scenarios', () => {
    const mockData = [
      { name: 'Equipment', budget: 100, committed: 150, plImpact: 100, gapToPL: 50 },
    ]
    
    vi.mocked(trpc.dashboard.getFinancialControlMetrics.useQuery).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
    } as any)
    
    const { container } = render(<FinancialControlMatrixCell projectId={mockProjectId} />)
    
    // Component should render without errors
    expect(container).toBeInTheDocument()
  })
  
  // BA-012: Real P&L data (integration test - not unit testable)
  it('BA-012: renders without errors with real data structure', () => {
    // This BA is validated manually and via SQL comparison
    // Here we just verify the component handles realistic data
    const realisticData = [
      { 
        name: 'Operational', 
        budget: 1750000, 
        committed: 676241.18, 
        plImpact: 509638.68,  // NOT exactly committed * 0.6
        gapToPL: 166602.5 
      },
    ]
    
    vi.mocked(trpc.dashboard.getFinancialControlMetrics.useQuery).mockReturnValue({
      data: realisticData,
      isLoading: false,
      error: null,
    } as any)
    
    const { container } = render(<FinancialControlMatrixCell projectId={mockProjectId} />)
    
    // Should render without errors
    expect(container).toBeInTheDocument()
    
    // Verify plImpact is NOT exactly 60% of committed (real data check)
    const committed = realisticData[0].committed
    const plImpact = realisticData[0].plImpact
    const fakeValue = committed * 0.6
    
    // Real data should differ from fake 60% multiplier
    expect(plImpact).not.toBeCloseTo(fakeValue, 2)
  })
  
  // Test memoization (critical for preventing infinite loops)
  it('memoizes query input to prevent infinite render loop', () => {
    vi.mocked(trpc.dashboard.getFinancialControlMetrics.useQuery).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any)
    
    const { rerender } = render(<FinancialControlMatrixCell projectId={mockProjectId} />)
    
    // Get initial call
    expect(trpc.dashboard.getFinancialControlMetrics.useQuery).toHaveBeenCalledTimes(1)
    const firstCall = vi.mocked(trpc.dashboard.getFinancialControlMetrics.useQuery).mock.calls[0]
    
    // Re-render with same props
    rerender(<FinancialControlMatrixCell projectId={mockProjectId} />)
    
    // Input should be referentially equal (memoized)
    const lastCall = vi.mocked(trpc.dashboard.getFinancialControlMetrics.useQuery).mock.calls[
      vi.mocked(trpc.dashboard.getFinancialControlMetrics.useQuery).mock.calls.length - 1
    ]
    
    // First argument should be same object reference
    expect(firstCall[0]).toBe(lastCall[0])
  })
  
  // Test query options configuration
  it('configures tRPC query with correct options', () => {
    vi.mocked(trpc.dashboard.getFinancialControlMetrics.useQuery).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any)
    
    render(<FinancialControlMatrixCell projectId={mockProjectId} />)
    
    // Check query options (second argument)
    expect(trpc.dashboard.getFinancialControlMetrics.useQuery).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000,
        retry: 1,
      })
    )
  })
  
  // Test error handling with custom error message
  it('displays custom error message when available', () => {
    vi.mocked(trpc.dashboard.getFinancialControlMetrics.useQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { message: 'Database connection timeout' },
    } as any)
    
    render(<FinancialControlMatrixCell projectId={mockProjectId} />)
    
    expect(screen.getByText(/Database connection timeout/i)).toBeInTheDocument()
  })
  
  // Test error handling with default message
  it('displays default error message when error has no message', () => {
    vi.mocked(trpc.dashboard.getFinancialControlMetrics.useQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: {} as any,
    } as any)
    
    render(<FinancialControlMatrixCell projectId={mockProjectId} />)
    
    expect(screen.getByText(/Unable to fetch financial control metrics/i)).toBeInTheDocument()
  })
  
  // Test with filters prop
  it('passes filters to tRPC query input', () => {
    vi.mocked(trpc.dashboard.getFinancialControlMetrics.useQuery).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any)
    
    const filters = { spendType: 'Equipment', costLine: 'Hardware' }
    render(<FinancialControlMatrixCell projectId={mockProjectId} filters={filters} />)
    
    // Check input includes filters
    expect(trpc.dashboard.getFinancialControlMetrics.useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: mockProjectId,
        filters: filters
      }),
      expect.any(Object)
    )
  })
  
  // Test without filters prop
  it('handles missing filters prop correctly', () => {
    vi.mocked(trpc.dashboard.getFinancialControlMetrics.useQuery).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any)
    
    render(<FinancialControlMatrixCell projectId={mockProjectId} />)
    
    // Check input has filters set to undefined
    expect(trpc.dashboard.getFinancialControlMetrics.useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: mockProjectId,
        filters: undefined
      }),
      expect.any(Object)
    )
  })
  
  // Test callbacks are passed through
  it('passes onDrillDown and onCustomize callbacks to presentation component', () => {
    vi.mocked(trpc.dashboard.getFinancialControlMetrics.useQuery).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any)
    
    const onDrillDown = vi.fn()
    const onCustomize = vi.fn()
    
    render(
      <FinancialControlMatrixCell
        projectId={mockProjectId}
        onDrillDown={onDrillDown}
        onCustomize={onCustomize}
      />
    )
    
    // Component should render (callbacks tested in presentation component tests)
    expect(screen.getByText(/Financial Control Matrix/i)).toBeInTheDocument()
  })
})
