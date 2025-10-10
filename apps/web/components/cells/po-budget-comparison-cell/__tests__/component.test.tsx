import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { POBudgetComparisonCell } from '../component'

// Mock tRPC
vi.mock('@/lib/trpc', () => ({
  trpc: {
    poMapping: {
      getPOSummary: {
        useQuery: vi.fn()
      }
    }
  }
}))

// Import the mocked module to access it
import { trpc } from '@/lib/trpc'

describe('POBudgetComparisonCell', () => {
  const mockProjectId = '94d1eaad-4ada-4fb6-b872-212b6cd6007a'
  const mockOnViewDetails = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('BA-001: Displays budget vs actual comparison when PO mappings exist', () => {
    it('should render budget, actual, and variance when data exists', () => {
      // Mock successful query with mapping data
      vi.mocked(trpc.poMapping.getPOSummary.useQuery).mockReturnValue({
        data: {
          total: 676241.18,
          invoiced: 509638.68,
          open: 166602.50,
          mappingCount: 17,
          budget: 1750000
        },
        isLoading: false,
        error: null,
      } as any)

      render(
        <POBudgetComparisonCell 
          projectId={mockProjectId}
          onViewDetails={mockOnViewDetails}
        />
      )

      // Verify budget displays
      expect(screen.getByText('Budget')).toBeInTheDocument()
      expect(screen.getByText('$1.8M')).toBeInTheDocument()

      // Verify actual displays
      expect(screen.getByText('Actual (POs)')).toBeInTheDocument()
      expect(screen.getByText('$676K')).toBeInTheDocument()

      // Verify variance section displays
      expect(screen.getByText('Variance')).toBeInTheDocument()

      // Verify PO count displays
      expect(screen.getByText(/Based on 17 mapped POs/)).toBeInTheDocument()

      // Verify "View PO Details" button displays
      expect(screen.getByRole('button', { name: /View PO Details/i })).toBeInTheDocument()
    })

    it('should calculate and display utilization percentage', () => {
      vi.mocked(trpc.poMapping.getPOSummary.useQuery).mockReturnValue({
        data: {
          total: 876241.18,
          invoiced: 509638.68,
          open: 166602.50,
          mappingCount: 17,
          budget: 1750000
        },
        isLoading: false,
        error: null,
      } as any)

      render(<POBudgetComparisonCell projectId={mockProjectId} />)

      // Utilization should be (876241.18 / 1750000) * 100 = 50.1%
      expect(screen.getByText('Budget Utilization')).toBeInTheDocument()
      expect(screen.getByText('50.1%')).toBeInTheDocument()
    })

    it('should display invoiced and open amounts', () => {
      vi.mocked(trpc.poMapping.getPOSummary.useQuery).mockReturnValue({
        data: {
          total: 676241.18,
          invoiced: 509638.68,
          open: 166602.50,
          mappingCount: 17,
          budget: 1750000
        },
        isLoading: false,
        error: null,
      } as any)

      render(<POBudgetComparisonCell projectId={mockProjectId} />)

      // Verify invoiced amount
      expect(screen.getByText('Invoiced')).toBeInTheDocument()
      expect(screen.getByText('$509,639')).toBeInTheDocument()

      // Verify open amount
      expect(screen.getByText('Open')).toBeInTheDocument()
      expect(screen.getByText('$166,603')).toBeInTheDocument()
    })

    it('should show over-budget alert when utilization > 100%', () => {
      vi.mocked(trpc.poMapping.getPOSummary.useQuery).mockReturnValue({
        data: {
          total: 1850000,
          invoiced: 1500000,
          open: 350000,
          mappingCount: 25,
          budget: 1750000
        },
        isLoading: false,
        error: null,
      } as any)

      render(<POBudgetComparisonCell projectId={mockProjectId} />)

      // Should show over-budget message
      expect(screen.getByText(/Over budget by/)).toBeInTheDocument()
    })
  })

  describe('BA-002: Shows loading skeleton during data fetch', () => {
    it('should render skeleton components when loading', () => {
      // Mock pending query
      vi.mocked(trpc.poMapping.getPOSummary.useQuery).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any)

      render(<POBudgetComparisonCell projectId={mockProjectId} />)

      // Verify card header still shows
      expect(screen.getByText('Budget vs Actual')).toBeInTheDocument()

      // Verify skeleton components are visible (they have specific test IDs in Skeleton component)
      const skeletons = document.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThan(0)
    })
  })

  describe('BA-003: Displays empty state when no PO mappings found', () => {
    it('should show empty state message when mappingCount is 0', () => {
      // Mock query with mappingCount = 0
      vi.mocked(trpc.poMapping.getPOSummary.useQuery).mockReturnValue({
        data: {
          total: 0,
          invoiced: 0,
          open: 0,
          mappingCount: 0,
          budget: 1750000
        },
        isLoading: false,
        error: null,
      } as any)

      render(<POBudgetComparisonCell projectId={mockProjectId} />)

      // Verify empty state message
      expect(screen.getByText('No PO mappings found')).toBeInTheDocument()
      expect(screen.getByText('Map POs to see actual spending')).toBeInTheDocument()

      // Verify View PO Details button is NOT shown
      expect(screen.queryByRole('button', { name: /View PO Details/i })).not.toBeInTheDocument()
    })

    it('should show empty state when data is null', () => {
      vi.mocked(trpc.poMapping.getPOSummary.useQuery).mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      } as any)

      render(<POBudgetComparisonCell projectId={mockProjectId} />)

      expect(screen.getByText('No PO mappings found')).toBeInTheDocument()
    })
  })

  describe('BA-004: Shows error alert on query failure', () => {
    it('should display error message when query fails', () => {
      // Mock failed query
      vi.mocked(trpc.poMapping.getPOSummary.useQuery).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: {
          message: 'Failed to fetch PO summary',
          data: null,
          shape: null
        },
      } as any)

      render(<POBudgetComparisonCell projectId={mockProjectId} />)

      // Verify error alert displays
      expect(screen.getByText('Error Loading PO Summary')).toBeInTheDocument()
      expect(screen.getByText('Failed to fetch PO summary')).toBeInTheDocument()
    })

    it('should show database connection error', () => {
      vi.mocked(trpc.poMapping.getPOSummary.useQuery).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: {
          message: 'Database connection failed',
          data: null,
          shape: null
        },
      } as any)

      render(<POBudgetComparisonCell projectId={mockProjectId} />)

      expect(screen.getByText('Error Loading PO Summary')).toBeInTheDocument()
      expect(screen.getByText('Database connection failed')).toBeInTheDocument()
    })
  })

  describe('Query Configuration', () => {
    it('should use memoized query input to prevent infinite loops', () => {
      vi.mocked(trpc.poMapping.getPOSummary.useQuery).mockReturnValue({
        data: {
          total: 676241.18,
          invoiced: 509638.68,
          open: 166602.50,
          mappingCount: 17,
          budget: 1750000
        },
        isLoading: false,
        error: null,
      } as any)

      render(<POBudgetComparisonCell projectId={mockProjectId} />)

      // Verify useQuery was called with memoized input
      expect(trpc.poMapping.getPOSummary.useQuery).toHaveBeenCalledWith(
        { projectId: mockProjectId },
        expect.objectContaining({
          refetchOnMount: false,
          refetchOnWindowFocus: false,
          staleTime: 5 * 60 * 1000,
        })
      )
    })
  })
})
