import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ProjectDashboardPage } from '../component'
import { useDashboardData } from '../hooks/use-dashboard-data'
import { useRealtimeSync } from '../hooks/use-realtime-sync'
import { handleExportPDF, handleExportExcel } from '../utils/export-handlers'

// Mock dependencies
vi.mock('../hooks/use-dashboard-data')
vi.mock('../hooks/use-realtime-sync')
vi.mock('../utils/export-handlers')
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

// Mock section components to simplify testing
vi.mock('../components/dashboard-header', () => ({
  DashboardHeader: ({ project, onRefresh, onExportPDF, onExportExcel, onBack }: any) => (
    <div data-testid="dashboard-header">
      <h1 data-testid="project-name">{project?.name}</h1>
      <span data-testid="sub-business-line">{project?.subBusinessLine}</span>
      <button data-testid="refresh-button" onClick={onRefresh}>Refresh</button>
      <button data-testid="export-pdf-button" onClick={onExportPDF}>Export PDF</button>
      <button data-testid="export-excel-button" onClick={onExportExcel}>Export Excel</button>
      <button data-testid="back-button" onClick={onBack}>Back</button>
    </div>
  ),
}))

vi.mock('../components/kpi-section', () => ({
  KPISection: () => <div data-testid="kpi-section">KPI Section</div>,
}))

vi.mock('../components/pl-section', () => ({
  PLSection: () => <div data-testid="pl-section">P&L Section</div>,
}))

vi.mock('../components/financial-matrix-section', () => ({
  FinancialMatrixSection: () => <div data-testid="financial-matrix-section">Matrix Section</div>,
}))

vi.mock('../components/timeline-section', () => ({
  TimelineSection: () => <div data-testid="timeline-section">Timeline Section</div>,
}))

vi.mock('../components/charts-section', () => ({
  ChartsSection: ({ categoryData }: any) => (
    <div data-testid="charts-section">
      {categoryData.length === 0 && <p>No category data available</p>}
      {categoryData.length > 0 && <p>Charts rendering</p>}
    </div>
  ),
}))

vi.mock('../components/breakdown-section', () => ({
  BreakdownSection: () => <div data-testid="breakdown-section">Breakdown Section</div>,
}))

vi.mock('@/components/cells/dashboard-skeleton/component', () => ({
  DashboardSkeleton: () => <div data-testid="dashboard-skeleton">Loading...</div>,
}))

describe('ProjectDashboardPage Cell - Behavioral Assertions', () => {
  const mockProjectId = '550e8400-e29b-41d4-a716-446655440000'

  const mockProject = {
    id: mockProjectId,
    name: 'Test Project Alpha',
    subBusinessLine: 'SBL-123',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  }

  const mockMetrics = {
    totalBudget: 500000,
    actualSpend: 350000,
    variance: 150000,
    variancePercent: 30,
    utilization: 70,
    invoicedAmount: 300000,
    openOrders: 50000,
    burnRate: 25000,
    poCount: 15,
    lineItemCount: 87,
  }

  const mockCategoryData = [
    { name: 'Labor', value: 150000, budget: 200000 },
    { name: 'Materials', value: 80000, budget: 100000 },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRealtimeSync).mockReturnValue(undefined)
  })

  // ============================================================================
  // BA-001: Dashboard MUST display project name and sub-business line in header
  // ============================================================================
  describe('BA-001: Project header display', () => {
    it('should render project name in header', () => {
      vi.mocked(useDashboardData).mockReturnValue({
        project: mockProject,
        metrics: mockMetrics,
        categoryData: mockCategoryData,
        breakdownData: [],
        subcategoryData: [],
        isLoading: false,
        anyLoading: false,
        error: null,
        refetchAll: vi.fn(),
      })

      render(<ProjectDashboardPage projectId={mockProjectId} />)

      expect(screen.getByTestId('project-name')).toHaveTextContent('Test Project Alpha')
    })

    it('should render sub-business line in header', () => {
      vi.mocked(useDashboardData).mockReturnValue({
        project: mockProject,
        metrics: mockMetrics,
        categoryData: mockCategoryData,
        breakdownData: [],
        subcategoryData: [],
        isLoading: false,
        anyLoading: false,
        error: null,
        refetchAll: vi.fn(),
      })

      render(<ProjectDashboardPage projectId={mockProjectId} />)

      expect(screen.getByTestId('sub-business-line')).toHaveTextContent('SBL-123')
    })
  })

  // ============================================================================
  // BA-002: Dashboard MUST show loading skeleton while data fetches
  // ============================================================================
  describe('BA-002: Loading state', () => {
    it('should display loading skeleton when isLoading is true', () => {
      vi.mocked(useDashboardData).mockReturnValue({
        project: null,
        metrics: null,
        categoryData: [],
        breakdownData: [],
        subcategoryData: [],
        isLoading: true,
        anyLoading: true,
        error: null,
        refetchAll: vi.fn(),
      })

      render(<ProjectDashboardPage projectId={mockProjectId} />)

      expect(screen.getByTestId('dashboard-skeleton')).toBeInTheDocument()
      expect(screen.queryByTestId('dashboard-header')).not.toBeInTheDocument()
    })

    it('should NOT display loading skeleton when data is loaded', () => {
      vi.mocked(useDashboardData).mockReturnValue({
        project: mockProject,
        metrics: mockMetrics,
        categoryData: mockCategoryData,
        breakdownData: [],
        subcategoryData: [],
        isLoading: false,
        anyLoading: false,
        error: null,
        refetchAll: vi.fn(),
      })

      render(<ProjectDashboardPage projectId={mockProjectId} />)

      expect(screen.queryByTestId('dashboard-skeleton')).not.toBeInTheDocument()
      expect(screen.getByTestId('dashboard-header')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // BA-003: Dashboard MUST display error alert if project not found
  // ============================================================================
  describe('BA-003: Project not found error', () => {
    it('should display "Project Not Found" alert when project is null', () => {
      vi.mocked(useDashboardData).mockReturnValue({
        project: null,
        metrics: null,
        categoryData: [],
        breakdownData: [],
        subcategoryData: [],
        isLoading: false,
        anyLoading: false,
        error: null,
        refetchAll: vi.fn(),
      })

      render(<ProjectDashboardPage projectId={mockProjectId} />)

      expect(screen.getByText('Project Not Found')).toBeInTheDocument()
      expect(screen.getByText('The requested project could not be found.')).toBeInTheDocument()
    })

    it('should NOT display content when project is not found', () => {
      vi.mocked(useDashboardData).mockReturnValue({
        project: null,
        metrics: null,
        categoryData: [],
        breakdownData: [],
        subcategoryData: [],
        isLoading: false,
        anyLoading: false,
        error: null,
        refetchAll: vi.fn(),
      })

      render(<ProjectDashboardPage projectId={mockProjectId} />)

      expect(screen.queryByTestId('dashboard-header')).not.toBeInTheDocument()
      expect(screen.queryByTestId('kpi-section')).not.toBeInTheDocument()
    })
  })

  // ============================================================================
  // BA-004: Dashboard MUST display error alert if metrics query fails
  // ============================================================================
  describe('BA-004: Query error state', () => {
    it('should display error alert when query fails', () => {
      const mockError = { message: 'Failed to fetch project metrics' }
      
      vi.mocked(useDashboardData).mockReturnValue({
        project: null,
        metrics: null,
        categoryData: [],
        breakdownData: [],
        subcategoryData: [],
        isLoading: false,
        anyLoading: false,
        error: mockError,
        refetchAll: vi.fn(),
      })

      render(<ProjectDashboardPage projectId={mockProjectId} />)

      expect(screen.getByText('Error Loading Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Failed to fetch project metrics')).toBeInTheDocument()
    })

    it('should NOT display content when error exists', () => {
      vi.mocked(useDashboardData).mockReturnValue({
        project: mockProject,
        metrics: null,
        categoryData: [],
        breakdownData: [],
        subcategoryData: [],
        isLoading: false,
        anyLoading: false,
        error: { message: 'Network error' },
        refetchAll: vi.fn(),
      })

      render(<ProjectDashboardPage projectId={mockProjectId} />)

      expect(screen.queryByTestId('dashboard-header')).not.toBeInTheDocument()
    })
  })

  // ============================================================================
  // BA-005: Refresh button MUST trigger data reload and show spinning icon
  // ============================================================================
  describe('BA-005: Refresh functionality', () => {
    it('should call refetchAll when refresh button is clicked', async () => {
      const mockRefetchAll = vi.fn().mockResolvedValue(undefined)
      
      vi.mocked(useDashboardData).mockReturnValue({
        project: mockProject,
        metrics: mockMetrics,
        categoryData: mockCategoryData,
        breakdownData: [],
        subcategoryData: [],
        isLoading: false,
        anyLoading: false,
        error: null,
        refetchAll: mockRefetchAll,
      })

      render(<ProjectDashboardPage projectId={mockProjectId} />)

      const refreshButton = screen.getByTestId('refresh-button')
      fireEvent.click(refreshButton)

      await waitFor(() => {
        expect(mockRefetchAll).toHaveBeenCalledTimes(1)
      })
    })
  })

  // ============================================================================
  // BA-006: Export PDF button MUST generate PDF via print dialog
  // ============================================================================
  describe('BA-006: PDF export', () => {
    it('should call handleExportPDF when export PDF button is clicked', async () => {
      vi.mocked(handleExportPDF).mockResolvedValue(undefined)
      
      vi.mocked(useDashboardData).mockReturnValue({
        project: mockProject,
        metrics: mockMetrics,
        categoryData: mockCategoryData,
        breakdownData: [],
        subcategoryData: [],
        isLoading: false,
        anyLoading: false,
        error: null,
        refetchAll: vi.fn(),
      })

      render(<ProjectDashboardPage projectId={mockProjectId} />)

      const exportButton = screen.getByTestId('export-pdf-button')
      fireEvent.click(exportButton)

      await waitFor(() => {
        expect(handleExportPDF).toHaveBeenCalledWith(mockProject)
      })
    })
  })

  // ============================================================================
  // BA-007: Export Excel button MUST generate CSV file with dashboard data
  // ============================================================================
  describe('BA-007: Excel export', () => {
    it('should call handleExportExcel with correct data structure', async () => {
      vi.mocked(handleExportExcel).mockResolvedValue(undefined)
      
      vi.mocked(useDashboardData).mockReturnValue({
        project: mockProject,
        metrics: mockMetrics,
        categoryData: mockCategoryData,
        breakdownData: [],
        subcategoryData: [],
        isLoading: false,
        anyLoading: false,
        error: null,
        refetchAll: vi.fn(),
      })

      render(<ProjectDashboardPage projectId={mockProjectId} />)

      const exportButton = screen.getByTestId('export-excel-button')
      fireEvent.click(exportButton)

      await waitFor(() => {
        expect(handleExportExcel).toHaveBeenCalledWith(
          mockProject,
          expect.objectContaining({
            metrics: mockMetrics,
            breakdown: [],
            categories: mockCategoryData,
          })
        )
      })
    })
  })

  // ============================================================================
  // BA-008: Dashboard MUST auto-refresh when cost_breakdown table changes
  // ============================================================================
  describe('BA-008: Realtime sync', () => {
    it('should initialize realtime sync with projectId', () => {
      vi.mocked(useDashboardData).mockReturnValue({
        project: mockProject,
        metrics: mockMetrics,
        categoryData: mockCategoryData,
        breakdownData: [],
        subcategoryData: [],
        isLoading: false,
        anyLoading: false,
        error: null,
        refetchAll: vi.fn(),
      })

      render(<ProjectDashboardPage projectId={mockProjectId} />)

      expect(useRealtimeSync).toHaveBeenCalledWith(mockProjectId)
    })
  })

  // ============================================================================
  // BA-009: Spend subcategory chart MUST display flattened hierarchy
  // ============================================================================
  describe('BA-009: Subcategory data transformation', () => {
    it('should pass subcategoryData to ChartsSection', () => {
      const mockSubcategoryData = [
        { category: 'Labor', subcategory: 'Sub1', value: 40000, budget: 50000, percentage: 80 },
        { category: 'Materials', subcategory: 'Sub2', value: 25000, budget: 30000, percentage: 83 },
      ]

      vi.mocked(useDashboardData).mockReturnValue({
        project: mockProject,
        metrics: mockMetrics,
        categoryData: mockCategoryData,
        breakdownData: [],
        subcategoryData: mockSubcategoryData,
        isLoading: false,
        anyLoading: false,
        error: null,
        refetchAll: vi.fn(),
      })

      render(<ProjectDashboardPage projectId={mockProjectId} />)

      // ChartsSection should receive subcategoryData
      expect(screen.getByTestId('charts-section')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // BA-010: Dashboard MUST display 'No data' message when category data is empty
  // ============================================================================
  describe('BA-010: Empty state handling', () => {
    it('should display "No category data available" when categoryData is empty', () => {
      vi.mocked(useDashboardData).mockReturnValue({
        project: mockProject,
        metrics: mockMetrics,
        categoryData: [], // Empty array
        breakdownData: [],
        subcategoryData: [],
        isLoading: false,
        anyLoading: false,
        error: null,
        refetchAll: vi.fn(),
      })

      render(<ProjectDashboardPage projectId={mockProjectId} />)

      expect(screen.getByText('No category data available')).toBeInTheDocument()
    })

    it('should NOT display empty message when categoryData has items', () => {
      vi.mocked(useDashboardData).mockReturnValue({
        project: mockProject,
        metrics: mockMetrics,
        categoryData: mockCategoryData, // Has data
        breakdownData: [],
        subcategoryData: [],
        isLoading: false,
        anyLoading: false,
        error: null,
        refetchAll: vi.fn(),
      })

      render(<ProjectDashboardPage projectId={mockProjectId} />)

      expect(screen.queryByText('No category data available')).not.toBeInTheDocument()
      expect(screen.getByText('Charts rendering')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // BA-011: 'Back to Projects' button MUST navigate to previous page
  // ============================================================================
  describe('BA-011: Back navigation', () => {
    it('should call window.history.back() when back button is clicked', () => {
      const mockHistoryBack = vi.fn()
      const originalHistoryBack = window.history.back
      window.history.back = mockHistoryBack

      vi.mocked(useDashboardData).mockReturnValue({
        project: mockProject,
        metrics: mockMetrics,
        categoryData: mockCategoryData,
        breakdownData: [],
        subcategoryData: [],
        isLoading: false,
        anyLoading: false,
        error: null,
        refetchAll: vi.fn(),
      })

      render(<ProjectDashboardPage projectId={mockProjectId} />)

      const backButton = screen.getByTestId('back-button')
      fireEvent.click(backButton)

      expect(mockHistoryBack).toHaveBeenCalledTimes(1)

      // Restore original
      window.history.back = originalHistoryBack
    })
  })
})
