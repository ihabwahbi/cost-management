import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CostBreakdownTableCell } from '../component'

// Mock tRPC
const mockUseQuery = vi.fn()
const mockUpdateMutation = vi.fn()
const mockDeleteMutation = vi.fn()
const mockBulkDeleteMutation = vi.fn()
const mockInvalidate = vi.fn()

vi.mock('@/lib/trpc', () => ({
  trpc: {
    costBreakdown: {
      getCostBreakdownByVersion: {
        useQuery: (...args: any[]) => mockUseQuery(...args),
      },
      updateCostEntry: {
        useMutation: (...args: any[]) => mockUpdateMutation(...args),
      },
      deleteCostEntry: {
        useMutation: (...args: any[]) => mockDeleteMutation(...args),
      },
      bulkDeleteCostEntries: {
        useMutation: (...args: any[]) => mockBulkDeleteMutation(...args),
      },
    },
    useUtils: () => ({
      costBreakdown: {
        getCostBreakdownByVersion: {
          invalidate: mockInvalidate,
        },
      },
    }),
  },
}))

// Mock toast
const mockToast = vi.fn()
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}))

describe('CostBreakdownTableCell', () => {
  const mockProjectId = 'test-project-123'
  
  const mockCosts = [
    {
      id: '1',
      projectId: mockProjectId,
      subBusinessLine: 'Wireline',
      costLine: 'Labor',
      spendType: 'Operating',
      spendSubCategory: 'Engineering',
      budgetCost: 100000,
      createdAt: new Date('2025-10-01'),
      updatedAt: new Date('2025-10-01'),
    },
    {
      id: '2',
      projectId: mockProjectId,
      subBusinessLine: 'Drilling',
      costLine: 'Equipment',
      spendType: 'Capital',
      spendSubCategory: null,
      budgetCost: 250000,
      createdAt: new Date('2025-10-02'),
      updatedAt: new Date('2025-10-02'),
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('BA-003: Component displays cost breakdown table when project is expanded', () => {
    it('should render cost breakdown table with all columns', () => {
      mockUseQuery.mockReturnValue({
        data: mockCosts,
        isLoading: false,
        error: null,
      })

      mockUpdateMutation.mockReturnValue({
        mutate: vi.fn(),
        isLoading: false,
      })

      mockDeleteMutation.mockReturnValue({
        mutate: vi.fn(),
        isLoading: false,
      })

      mockBulkDeleteMutation.mockReturnValue({
        mutate: vi.fn(),
        isLoading: false,
      })

      render(<CostBreakdownTableCell projectId={mockProjectId} />)

      // Verify table headers
      expect(screen.getByText('Cost Line')).toBeInTheDocument()
      expect(screen.getByText('Sub Business Line')).toBeInTheDocument()
      expect(screen.getByText('Spend Type')).toBeInTheDocument()
      expect(screen.getByText('Sub Category')).toBeInTheDocument()
      expect(screen.getByText('Budget Cost')).toBeInTheDocument()

      // Verify data rows
      expect(screen.getByText('Labor')).toBeInTheDocument()
      expect(screen.getByText('Equipment')).toBeInTheDocument()
      expect(screen.getByText('$100,000')).toBeInTheDocument()
      expect(screen.getByText('$250,000')).toBeInTheDocument()
    })
  })

  describe('BA-008: Component shows "No budget created yet" when cost breakdown is empty', () => {
    it('should render empty state with CTA message', () => {
      mockUseQuery.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      })

      render(<CostBreakdownTableCell projectId={mockProjectId} />)

      expect(screen.getByText('No budget created yet')).toBeInTheDocument()
      expect(screen.getByText('Add your first cost entry to get started')).toBeInTheDocument()
    })
  })

  describe('BA-009: Component enables inline editing on row double-click', () => {
    it('should show input fields when row is double-clicked', async () => {
      const user = userEvent.setup()
      
      mockUseQuery.mockReturnValue({
        data: mockCosts,
        isLoading: false,
        error: null,
      })

      mockUpdateMutation.mockReturnValue({
        mutate: vi.fn(),
        isLoading: false,
      })

      mockDeleteMutation.mockReturnValue({
        mutate: vi.fn(),
        isLoading: false,
      })

      mockBulkDeleteMutation.mockReturnValue({
        mutate: vi.fn(),
        isLoading: false,
      })

      render(<CostBreakdownTableCell projectId={mockProjectId} />)

      const laborRow = screen.getByText('Labor').closest('tr')
      expect(laborRow).toBeInTheDocument()

      // Double-click row
      await user.dblClick(laborRow!)

      // Verify input fields appear
      const inputs = screen.getAllByRole('textbox')
      expect(inputs.length).toBeGreaterThan(0)
      
      // Verify we're in edit mode (check for save/cancel buttons)
      const checkIcon = laborRow!.querySelector('svg[class*="lucide-check"]')
      expect(checkIcon).toBeInTheDocument()
    })
  })

  describe('BA-018: Component validates required fields before saving', () => {
    it('should show validation error when cost line is cleared', async () => {
      const user = userEvent.setup()
      const mockMutate = vi.fn()
      
      mockUseQuery.mockReturnValue({
        data: mockCosts,
        isLoading: false,
        error: null,
      })

      mockUpdateMutation.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
      })

      mockDeleteMutation.mockReturnValue({
        mutate: vi.fn(),
        isLoading: false,
      })

      mockBulkDeleteMutation.mockReturnValue({
        mutate: vi.fn(),
        isLoading: false,
      })

      render(<CostBreakdownTableCell projectId={mockProjectId} />)

      const laborRow = screen.getByText('Labor').closest('tr')
      await user.dblClick(laborRow!)

      // Find cost line input and clear it
      const costLineInput = screen.getAllByRole('textbox')[0]
      await user.clear(costLineInput)

      // Try to save
      const saveButton = laborRow!.querySelector('svg[class*="lucide-check"]')?.closest('button')
      await user.click(saveButton!)

      // Verify validation error appears
      await waitFor(() => {
        expect(screen.getByText('Cost Line is required')).toBeInTheDocument()
      })

      // Verify mutation not called
      expect(mockMutate).not.toHaveBeenCalled()
    })
  })

  describe('BA-022: Component shows unsaved changes bar when inline edits pending', () => {
    it('should display unsaved changes alert when editing', async () => {
      const user = userEvent.setup()
      
      mockUseQuery.mockReturnValue({
        data: mockCosts,
        isLoading: false,
        error: null,
      })

      mockUpdateMutation.mockReturnValue({
        mutate: vi.fn(),
        isLoading: false,
      })

      mockDeleteMutation.mockReturnValue({
        mutate: vi.fn(),
        isLoading: false,
      })

      mockBulkDeleteMutation.mockReturnValue({
        mutate: vi.fn(),
        isLoading: false,
      })

      render(<CostBreakdownTableCell projectId={mockProjectId} />)

      const laborRow = screen.getByText('Labor').closest('tr')
      await user.dblClick(laborRow!)

      // Verify unsaved changes alert
      await waitFor(() => {
        expect(screen.getByText('Unsaved Changes')).toBeInTheDocument()
        expect(screen.getByText(/Press Cmd\+S to save or Escape to cancel/i)).toBeInTheDocument()
      })
    })
  })

  describe('BA-023: Component supports keyboard shortcuts (Cmd+S to save, Escape to cancel)', () => {
    it('should save edits when Cmd+S is pressed', async () => {
      const user = userEvent.setup()
      const mockMutate = vi.fn()
      
      mockUseQuery.mockReturnValue({
        data: mockCosts,
        isLoading: false,
        error: null,
      })

      mockUpdateMutation.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
      })

      mockDeleteMutation.mockReturnValue({
        mutate: vi.fn(),
        isLoading: false,
      })

      mockBulkDeleteMutation.mockReturnValue({
        mutate: vi.fn(),
        isLoading: false,
      })

      render(<CostBreakdownTableCell projectId={mockProjectId} />)

      const laborRow = screen.getByText('Labor').closest('tr')
      await user.dblClick(laborRow!)

      // Press Cmd+S
      fireEvent.keyDown(window, { key: 's', metaKey: true })

      // Verify save mutation called
      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalled()
      })
    })

    it('should cancel edits when Escape is pressed', async () => {
      const user = userEvent.setup()
      
      mockUseQuery.mockReturnValue({
        data: mockCosts,
        isLoading: false,
        error: null,
      })

      mockUpdateMutation.mockReturnValue({
        mutate: vi.fn(),
        isLoading: false,
      })

      mockDeleteMutation.mockReturnValue({
        mutate: vi.fn(),
        isLoading: false,
      })

      mockBulkDeleteMutation.mockReturnValue({
        mutate: vi.fn(),
        isLoading: false,
      })

      render(<CostBreakdownTableCell projectId={mockProjectId} />)

      const laborRow = screen.getByText('Labor').closest('tr')
      await user.dblClick(laborRow!)

      // Verify unsaved changes alert appears
      expect(screen.getByText('Unsaved Changes')).toBeInTheDocument()

      // Press Escape
      fireEvent.keyDown(window, { key: 'Escape' })

      // Verify unsaved changes alert disappears
      await waitFor(() => {
        expect(screen.queryByText('Unsaved Changes')).not.toBeInTheDocument()
      })
    })
  })

  describe('BA-BULK-001: Component enables multi-select for bulk delete operations', () => {
    it('should enable bulk mode and delete multiple selected rows', async () => {
      const user = userEvent.setup()
      const mockBulkDelete = vi.fn()
      
      mockUseQuery.mockReturnValue({
        data: mockCosts,
        isLoading: false,
        error: null,
      })

      mockUpdateMutation.mockReturnValue({
        mutate: vi.fn(),
        isLoading: false,
      })

      mockDeleteMutation.mockReturnValue({
        mutate: vi.fn(),
        isLoading: false,
      })

      mockBulkDeleteMutation.mockReturnValue({
        mutate: mockBulkDelete,
        isLoading: false,
      })

      render(<CostBreakdownTableCell projectId={mockProjectId} />)

      // Enable bulk mode
      const bulkEditButton = screen.getByText('Bulk Edit')
      await user.click(bulkEditButton)

      // Verify checkboxes appear
      const checkboxes = screen.getAllByRole('checkbox')
      expect(checkboxes.length).toBeGreaterThan(0)

      // Select first two rows
      await user.click(checkboxes[1]) // First data row
      await user.click(checkboxes[2]) // Second data row

      // Click bulk delete button
      const deleteButton = screen.getByText(/Delete 2 selected/i)
      await user.click(deleteButton)

      // Verify bulk delete mutation called with correct IDs
      await waitFor(() => {
        expect(mockBulkDelete).toHaveBeenCalledWith({
          ids: expect.arrayContaining(['1', '2']),
        })
      })
    })
  })
})
