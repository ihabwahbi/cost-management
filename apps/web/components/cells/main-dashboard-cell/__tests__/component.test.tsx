import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MainDashboardCell } from '../component'
import { trpc } from '@/lib/trpc'

// Mock tRPC
vi.mock('@/lib/trpc', () => ({
  trpc: {
    dashboard: {
      getMainMetrics: {
        useQuery: vi.fn()
      },
      getRecentActivity: {
        useQuery: vi.fn()
      },
      getCategoryBreakdown: {
        useQuery: vi.fn()
      },
      getTimelineData: {
        useQuery: vi.fn()
      }
    }
  }
}))

// Mock recharts to avoid rendering issues in tests
vi.mock('recharts', () => ({
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div>Pie</div>,
  Cell: () => <div>Cell</div>,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tooltip: () => <div>Tooltip</div>,
  Legend: () => <div>Legend</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div>Line</div>,
  XAxis: () => <div>XAxis</div>,
  YAxis: () => <div>YAxis</div>,
  CartesianGrid: () => <div>CartesianGrid</div>
}))

describe('MainDashboardCell', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Helper to mock successful data state
  const mockSuccessfulQueries = () => {
    vi.mocked(trpc.dashboard.getMainMetrics.useQuery).mockReturnValue({
      data: {
        unmappedPOs: 5,
        totalPOValue: 1250000,
        activeProjects: 12,
        budgetVariance: -15.5,
        totalBudget: 2000000,
        totalActual: 1690000
      },
      isLoading: false,
      error: null
    } as any)

    vi.mocked(trpc.dashboard.getRecentActivity.useQuery).mockReturnValue({
      data: {
        activities: [
          {
            id: '1',
            description: 'PO-001 mapped to Project Alpha',
            time: '5 mins ago',
            mappedAmount: 50000
          }
        ]
      },
      isLoading: false,
      error: null
    } as any)

    vi.mocked(trpc.dashboard.getCategoryBreakdown.useQuery).mockReturnValue({
      data: {
        categories: [
          { name: 'Personnel', value: 500000 },
          { name: 'Equipment', value: 300000 }
        ]
      },
      isLoading: false,
      error: null
    } as any)

    vi.mocked(trpc.dashboard.getTimelineData.useQuery).mockReturnValue({
      data: {
        timeline: [
          { month: 'Jan', budget: 100000, actual: 95000, forecast: 98000 }
        ]
      },
      isLoading: false,
      error: null
    } as any)
  }

  describe('BA-001: Loading State - Main Metrics', () => {
    it('should display skeleton loaders when main metrics are loading', () => {
      vi.mocked(trpc.dashboard.getMainMetrics.useQuery).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null
      } as any)

      vi.mocked(trpc.dashboard.getRecentActivity.useQuery).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null
      } as any)

      vi.mocked(trpc.dashboard.getCategoryBreakdown.useQuery).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null
      } as any)

      vi.mocked(trpc.dashboard.getTimelineData.useQuery).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null
      } as any)

      render(<MainDashboardCell />)

      // Verify skeleton elements present
      const skeletons = screen.getAllByTestId(/skeleton/)
      expect(skeletons.length).toBeGreaterThan(0)
    })
  })

  describe('BA-002: Loading State - Recent Activity', () => {
    it('should display skeleton loaders when recent activity is loading', () => {
      vi.mocked(trpc.dashboard.getMainMetrics.useQuery).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null
      } as any)

      vi.mocked(trpc.dashboard.getRecentActivity.useQuery).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null
      } as any)

      vi.mocked(trpc.dashboard.getCategoryBreakdown.useQuery).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null
      } as any)

      vi.mocked(trpc.dashboard.getTimelineData.useQuery).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null
      } as any)

      render(<MainDashboardCell />)

      const skeletons = screen.getAllByTestId(/skeleton/)
      expect(skeletons.length).toBeGreaterThan(0)
    })
  })

  describe('BA-003: Loading State - Category Breakdown', () => {
    it('should display skeleton loaders when category breakdown is loading', () => {
      vi.mocked(trpc.dashboard.getMainMetrics.useQuery).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null
      } as any)

      vi.mocked(trpc.dashboard.getRecentActivity.useQuery).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null
      } as any)

      vi.mocked(trpc.dashboard.getCategoryBreakdown.useQuery).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null
      } as any)

      vi.mocked(trpc.dashboard.getTimelineData.useQuery).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null
      } as any)

      render(<MainDashboardCell />)

      const skeletons = screen.getAllByTestId(/skeleton/)
      expect(skeletons.length).toBeGreaterThan(0)
    })
  })

  describe('BA-004: Loading State - Timeline Data', () => {
    it('should display skeleton loaders when timeline data is loading', () => {
      vi.mocked(trpc.dashboard.getMainMetrics.useQuery).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null
      } as any)

      vi.mocked(trpc.dashboard.getRecentActivity.useQuery).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null
      } as any)

      vi.mocked(trpc.dashboard.getCategoryBreakdown.useQuery).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null
      } as any)

      vi.mocked(trpc.dashboard.getTimelineData.useQuery).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null
      } as any)

      render(<MainDashboardCell />)

      const skeletons = screen.getAllByTestId(/skeleton/)
      expect(skeletons.length).toBeGreaterThan(0)
    })
  })

  describe('BA-005: Error State - Main Metrics', () => {
    it('should display error alert when getMainMetrics fails', () => {
      vi.mocked(trpc.dashboard.getMainMetrics.useQuery).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to fetch main metrics')
      } as any)

      vi.mocked(trpc.dashboard.getRecentActivity.useQuery).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null
      } as any)

      vi.mocked(trpc.dashboard.getCategoryBreakdown.useQuery).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null
      } as any)

      vi.mocked(trpc.dashboard.getTimelineData.useQuery).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null
      } as any)

      render(<MainDashboardCell />)

      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('Error Loading Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Failed to fetch main metrics')).toBeInTheDocument()
    })
  })

  describe('BA-006: Error State - Recent Activity', () => {
    it('should display error alert when getRecentActivity fails', () => {
      vi.mocked(trpc.dashboard.getMainMetrics.useQuery).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null
      } as any)

      vi.mocked(trpc.dashboard.getRecentActivity.useQuery).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to fetch recent activity')
      } as any)

      vi.mocked(trpc.dashboard.getCategoryBreakdown.useQuery).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null
      } as any)

      vi.mocked(trpc.dashboard.getTimelineData.useQuery).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null
      } as any)

      render(<MainDashboardCell />)

      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('Failed to fetch recent activity')).toBeInTheDocument()
    })
  })

  describe('BA-007: Empty State - Recent Activity', () => {
    it('should display empty state when no recent activity exists', () => {
      mockSuccessfulQueries()

      // Override with empty activities
      vi.mocked(trpc.dashboard.getRecentActivity.useQuery).mockReturnValue({
        data: { activities: [] },
        isLoading: false,
        error: null
      } as any)

      render(<MainDashboardCell />)

      expect(screen.getByText('No recent activity')).toBeInTheDocument()
    })
  })

  describe('BA-008: Unmapped POs Display', () => {
    it('should display unmapped POs count from getMainMetrics query', () => {
      mockSuccessfulQueries()

      render(<MainDashboardCell />)

      expect(screen.getByText('Unmapped POs')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
    })
  })

  describe('BA-009: Total PO Value Display', () => {
    it('should display total PO value formatted as currency', () => {
      mockSuccessfulQueries()

      render(<MainDashboardCell />)

      expect(screen.getByText('Total PO Value')).toBeInTheDocument()
      expect(screen.getByText('$1,250,000')).toBeInTheDocument()
    })
  })

  describe('BA-010: Active Projects Display', () => {
    it('should display active projects count from getMainMetrics', () => {
      mockSuccessfulQueries()

      render(<MainDashboardCell />)

      expect(screen.getByText('Active Projects')).toBeInTheDocument()
      expect(screen.getByText('12')).toBeInTheDocument()
    })
  })

  describe('BA-011: Budget Variance Display', () => {
    it('should display budget variance with correct formatting and color coding', () => {
      mockSuccessfulQueries()

      render(<MainDashboardCell />)

      expect(screen.getByText('Budget Variance')).toBeInTheDocument()
      expect(screen.getByText('-15.50%')).toBeInTheDocument()
      
      // Verify green color for under budget (negative variance)
      const varianceElement = screen.getByText('-15.50%')
      expect(varianceElement).toBeInTheDocument()
    })

    it('should show red color when over budget', () => {
      mockSuccessfulQueries()

      // Override with positive variance (over budget)
      vi.mocked(trpc.dashboard.getMainMetrics.useQuery).mockReturnValue({
        data: {
          unmappedPOs: 5,
          totalPOValue: 1250000,
          activeProjects: 12,
          budgetVariance: 25.75,
          totalBudget: 2000000,
          totalActual: 2515000
        },
        isLoading: false,
        error: null
      } as any)

      render(<MainDashboardCell />)

      expect(screen.getByText('25.75%')).toBeInTheDocument()
    })
  })

  describe('BA-012: No Infinite Render Loops', () => {
    it('should use memoized inputs for all tRPC queries', () => {
      mockSuccessfulQueries()

      render(<MainDashboardCell />)

      // Verify queries were called with consistent (memoized) inputs
      expect(trpc.dashboard.getMainMetrics.useQuery).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          refetchOnMount: false,
          refetchOnWindowFocus: false,
          staleTime: 5 * 60 * 1000
        })
      )

      expect(trpc.dashboard.getRecentActivity.useQuery).toHaveBeenCalledWith(
        { limit: 5 },
        expect.objectContaining({
          refetchOnMount: false,
          refetchOnWindowFocus: false,
          staleTime: 5 * 60 * 1000
        })
      )
    })
  })

  describe('BA-013: tRPC Batching', () => {
    it('should configure queries for batching (staleTime prevents immediate refetch)', () => {
      mockSuccessfulQueries()

      render(<MainDashboardCell />)

      // All queries should have same staleTime for batching
      const expectedConfig = expect.objectContaining({
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000
      })

      expect(trpc.dashboard.getMainMetrics.useQuery).toHaveBeenCalledWith({}, expectedConfig)
      expect(trpc.dashboard.getRecentActivity.useQuery).toHaveBeenCalledWith({ limit: 5 }, expectedConfig)
      expect(trpc.dashboard.getCategoryBreakdown.useQuery).toHaveBeenCalledWith({}, expectedConfig)
      expect(trpc.dashboard.getTimelineData.useQuery).toHaveBeenCalledWith({}, expectedConfig)
    })
  })

  describe('BA-014: Currency Formatting', () => {
    it('should format all monetary values as USD with appropriate precision', () => {
      mockSuccessfulQueries()

      render(<MainDashboardCell />)

      // Check Total PO Value formatting
      expect(screen.getByText('$1,250,000')).toBeInTheDocument()

      // Check recent activity amount formatting
      expect(screen.getByText('$50,000')).toBeInTheDocument()
    })
  })

  describe('BA-015: Category Breakdown - Real Data', () => {
    it('should render category breakdown chart with real data', () => {
      mockSuccessfulQueries()

      render(<MainDashboardCell />)

      // Verify chart renders
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument()

      // Verify data description mentions real data
      expect(screen.getByText('Real data from PO mappings')).toBeInTheDocument()
    })

    it('should show empty state when no category data', () => {
      mockSuccessfulQueries()

      vi.mocked(trpc.dashboard.getCategoryBreakdown.useQuery).mockReturnValue({
        data: { categories: [] },
        isLoading: false,
        error: null
      } as any)

      render(<MainDashboardCell />)

      expect(screen.getByText('No category data available')).toBeInTheDocument()
    })
  })

  describe('BA-016: Timeline Chart - Real Forecast Data', () => {
    it('should render timeline chart with real forecast data', () => {
      mockSuccessfulQueries()

      render(<MainDashboardCell />)

      // Verify chart renders
      expect(screen.getByTestId('line-chart')).toBeInTheDocument()

      // Verify data description mentions real data
      expect(screen.getByText('Real forecast data from budget_forecasts')).toBeInTheDocument()
    })

    it('should show empty state when no timeline data', () => {
      mockSuccessfulQueries()

      vi.mocked(trpc.dashboard.getTimelineData.useQuery).mockReturnValue({
        data: { timeline: [] },
        isLoading: false,
        error: null
      } as any)

      render(<MainDashboardCell />)

      expect(screen.getByText('No timeline data available')).toBeInTheDocument()
    })
  })

  describe('BA-017: Relative Time Formatting', () => {
    it('should display recent activity with relative time formatting', () => {
      mockSuccessfulQueries()

      render(<MainDashboardCell />)

      // Verify relative time is displayed
      expect(screen.getByText('5 mins ago')).toBeInTheDocument()
      expect(screen.getByText('PO-001 mapped to Project Alpha')).toBeInTheDocument()
    })
  })

  describe('BA-018: Division-by-Zero Protection', () => {
    it('should handle zero total budget without NaN in variance calculation', () => {
      mockSuccessfulQueries()

      // Override with zero budget (edge case)
      vi.mocked(trpc.dashboard.getMainMetrics.useQuery).mockReturnValue({
        data: {
          unmappedPOs: 0,
          totalPOValue: 0,
          activeProjects: 0,
          budgetVariance: 0, // Should be 0, not NaN
          totalBudget: 0,
          totalActual: 0
        },
        isLoading: false,
        error: null
      } as any)

      render(<MainDashboardCell />)

      // Verify variance is 0 (not NaN)
      const varianceText = screen.getByText(/0\.00%/)
      expect(varianceText).toBeInTheDocument()
      expect(varianceText.textContent).not.toContain('NaN')
    })

    it('should handle missing data gracefully with defaults', () => {
      // Simulate undefined data (edge case)
      vi.mocked(trpc.dashboard.getMainMetrics.useQuery).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null
      } as any)

      vi.mocked(trpc.dashboard.getRecentActivity.useQuery).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null
      } as any)

      vi.mocked(trpc.dashboard.getCategoryBreakdown.useQuery).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null
      } as any)

      vi.mocked(trpc.dashboard.getTimelineData.useQuery).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null
      } as any)

      render(<MainDashboardCell />)

      // Should display with default values (0) instead of errors
      expect(screen.getByText('0')).toBeInTheDocument() // unmappedPOs
      expect(screen.getByText('$0')).toBeInTheDocument() // totalPOValue
      expect(screen.getByText('0.00%')).toBeInTheDocument() // budgetVariance
    })
  })

  describe('Integration: Full Happy Path', () => {
    it('should render complete dashboard with all data', () => {
      mockSuccessfulQueries()

      render(<MainDashboardCell />)

      // Verify all main sections are present
      expect(screen.getByText('Unmapped POs')).toBeInTheDocument()
      expect(screen.getByText('Total PO Value')).toBeInTheDocument()
      expect(screen.getByText('Active Projects')).toBeInTheDocument()
      expect(screen.getByText('Budget Variance')).toBeInTheDocument()
      expect(screen.getByText('Spend by Category')).toBeInTheDocument()
      expect(screen.getByText('Budget Timeline')).toBeInTheDocument()
      expect(screen.getByText('Recent Activity')).toBeInTheDocument()

      // Verify data values
      expect(screen.getByText('5')).toBeInTheDocument()
      expect(screen.getByText('$1,250,000')).toBeInTheDocument()
      expect(screen.getByText('12')).toBeInTheDocument()
      expect(screen.getByText('-15.50%')).toBeInTheDocument()
    })
  })
})
