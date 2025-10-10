import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DetailsPanelSelector } from '../component'
import { trpc } from '@/lib/trpc'

// Mock tRPC
vi.mock('@/lib/trpc', () => ({
  trpc: {
    poMapping: {
      getProjects: {
        useQuery: vi.fn()
      },
      getSpendTypes: {
        useQuery: vi.fn()
      },
      getSpendSubCategories: {
        useQuery: vi.fn()
      },
      findMatchingCostBreakdown: {
        useQuery: vi.fn()
      }
    }
  }
}))

describe('DetailsPanelSelector', () => {
  const mockOnProjectChange = vi.fn()
  const mockOnSpendTypeChange = vi.fn()
  const mockOnSubCategoryChange = vi.fn()
  const mockOnCostBreakdownFound = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock for projects query
    vi.mocked(trpc.poMapping.getProjects.useQuery).mockReturnValue({
      data: [
        { id: 'project-1', name: 'Project Alpha' },
        { id: 'project-2', name: 'Project Beta' }
      ],
      isLoading: false,
      error: null
    } as any)

    // Default mock for spend types
    vi.mocked(trpc.poMapping.getSpendTypes.useQuery).mockReturnValue({
      data: [],
      isLoading: false,
      error: null
    } as any)

    // Default mock for subcategories
    vi.mocked(trpc.poMapping.getSpendSubCategories.useQuery).mockReturnValue({
      data: [],
      isLoading: false,
      error: null
    } as any)

    // Default mock for cost breakdown finder
    vi.mocked(trpc.poMapping.findMatchingCostBreakdown.useQuery).mockReturnValue({
      data: null,
      isLoading: false,
      error: null
    } as any)
  })

  describe('BA-004: Spend Type Dropdown Disabled Until Project Selected', () => {
    it('should disable spend type dropdown when no project selected', () => {
      render(
        <DetailsPanelSelector
          selectedProject=""
          selectedSpendType=""
          selectedSpendSubCategory=""
          onProjectChange={mockOnProjectChange}
          onSpendTypeChange={mockOnSpendTypeChange}
          onSubCategoryChange={mockOnSubCategoryChange}
          onCostBreakdownFound={mockOnCostBreakdownFound}
        />
      )

      // Select component uses data-disabled attribute when disabled
      const spendTypeSelect = screen.getByRole('combobox', { name: /Spend Type/i })
      expect(spendTypeSelect).toHaveAttribute('data-disabled')
    })

    it('should enable spend type dropdown when project is selected', () => {
      // Mock spend types available for selected project (returns array of strings)
      vi.mocked(trpc.poMapping.getSpendTypes.useQuery).mockReturnValue({
        data: ['Personnel', 'Equipment'],
        isLoading: false,
        error: null
      } as any)

      render(
        <DetailsPanelSelector
          selectedProject="project-1"
          selectedSpendType=""
          selectedSpendSubCategory=""
          onProjectChange={mockOnProjectChange}
          onSpendTypeChange={mockOnSpendTypeChange}
          onSubCategoryChange={mockOnSubCategoryChange}
          onCostBreakdownFound={mockOnCostBreakdownFound}
        />
      )

      const spendTypeSelect = screen.getByRole('combobox', { name: /Spend Type/i })
      expect(spendTypeSelect).not.toHaveAttribute('data-disabled')
    })
  })

  describe('BA-005: Subcategory Dropdown Disabled Until Spend Type Selected', () => {
    it('should disable subcategory dropdown when no spend type selected', () => {
      render(
        <DetailsPanelSelector
          selectedProject="project-1"
          selectedSpendType=""
          selectedSpendSubCategory=""
          onProjectChange={mockOnProjectChange}
          onSpendTypeChange={mockOnSpendTypeChange}
          onSubCategoryChange={mockOnSubCategoryChange}
          onCostBreakdownFound={mockOnCostBreakdownFound}
        />
      )

      const subCategorySelect = screen.getByRole('combobox', { name: /Subcategory/i })
      expect(subCategorySelect).toHaveAttribute('data-disabled')
    })

    it('should enable subcategory dropdown when spend type is selected', () => {
      // Mock subcategories available (returns array of strings)
      vi.mocked(trpc.poMapping.getSpendSubCategories.useQuery).mockReturnValue({
        data: ['Engineers', 'Contractors'],
        isLoading: false,
        error: null
      } as any)

      render(
        <DetailsPanelSelector
          selectedProject="project-1"
          selectedSpendType="Personnel"
          selectedSpendSubCategory=""
          onProjectChange={mockOnProjectChange}
          onSpendTypeChange={mockOnSpendTypeChange}
          onSubCategoryChange={mockOnSubCategoryChange}
          onCostBreakdownFound={mockOnCostBreakdownFound}
        />
      )

      const subCategorySelect = screen.getByRole('combobox', { name: /Subcategory/i })
      expect(subCategorySelect).not.toHaveAttribute('data-disabled')
    })

    it('should keep subcategory disabled even with project selected if no spend type', () => {
      render(
        <DetailsPanelSelector
          selectedProject="project-1"
          selectedSpendType=""
          selectedSpendSubCategory=""
          onProjectChange={mockOnProjectChange}
          onSpendTypeChange={mockOnSpendTypeChange}
          onSubCategoryChange={mockOnSubCategoryChange}
          onCostBreakdownFound={mockOnCostBreakdownFound}
        />
      )

      const subCategorySelect = screen.getByRole('combobox', { name: /Subcategory/i })
      expect(subCategorySelect).toBeDisabled()
    })
  })

  describe('BA-006: Resets Downstream Selections When Upstream Changes', () => {
    it('should reset spend type and subcategory when project changes', () => {
      const { rerender } = render(
        <DetailsPanelSelector
          selectedProject="project-1"
          selectedSpendType="Personnel"
          selectedSpendSubCategory="Engineers"
          onProjectChange={mockOnProjectChange}
          onSpendTypeChange={mockOnSpendTypeChange}
          onSubCategoryChange={mockOnSubCategoryChange}
          onCostBreakdownFound={mockOnCostBreakdownFound}
        />
      )

      // Clear mocks after initial render
      mockOnSpendTypeChange.mockClear()
      mockOnSubCategoryChange.mockClear()

      // Change project to empty (triggers reset)
      rerender(
        <DetailsPanelSelector
          selectedProject=""
          selectedSpendType="Personnel"
          selectedSpendSubCategory="Engineers"
          onProjectChange={mockOnProjectChange}
          onSpendTypeChange={mockOnSpendTypeChange}
          onSubCategoryChange={mockOnSubCategoryChange}
          onCostBreakdownFound={mockOnCostBreakdownFound}
        />
      )

      // Should call callbacks to reset downstream selections (useEffect triggers on empty project)
      expect(mockOnSpendTypeChange).toHaveBeenCalledWith('')
      expect(mockOnSubCategoryChange).toHaveBeenCalledWith('')
    })

    it('should reset subcategory when spend type changes', () => {
      const { rerender } = render(
        <DetailsPanelSelector
          selectedProject="project-1"
          selectedSpendType="Personnel"
          selectedSpendSubCategory="Engineers"
          onProjectChange={mockOnProjectChange}
          onSpendTypeChange={mockOnSpendTypeChange}
          onSubCategoryChange={mockOnSubCategoryChange}
          onCostBreakdownFound={mockOnCostBreakdownFound}
        />
      )

      // Clear mocks after initial render
      mockOnSubCategoryChange.mockClear()

      // Change spend type to empty (triggers reset)
      rerender(
        <DetailsPanelSelector
          selectedProject="project-1"
          selectedSpendType=""
          selectedSpendSubCategory="Engineers"
          onProjectChange={mockOnProjectChange}
          onSpendTypeChange={mockOnSpendTypeChange}
          onSubCategoryChange={mockOnSubCategoryChange}
          onCostBreakdownFound={mockOnCostBreakdownFound}
        />
      )

      // Should call callback to reset subcategory (useEffect triggers on empty spendType)
      expect(mockOnSubCategoryChange).toHaveBeenCalledWith('')
    })
  })

  describe('Cost Breakdown Matching', () => {
    it('should call onCostBreakdownFound when all selections made', () => {
      vi.mocked(trpc.poMapping.findMatchingCostBreakdown.useQuery).mockReturnValue({
        data: [{ id: 'cost-breakdown-123' }],
        isLoading: false,
        error: null
      } as any)

      render(
        <DetailsPanelSelector
          selectedProject="project-1"
          selectedSpendType="Personnel"
          selectedSpendSubCategory="Engineers"
          onProjectChange={mockOnProjectChange}
          onSpendTypeChange={mockOnSpendTypeChange}
          onSubCategoryChange={mockOnSubCategoryChange}
          onCostBreakdownFound={mockOnCostBreakdownFound}
        />
      )

      expect(mockOnCostBreakdownFound).toHaveBeenCalledWith('cost-breakdown-123')
    })

    it('should handle no matching cost breakdown', () => {
      vi.mocked(trpc.poMapping.findMatchingCostBreakdown.useQuery).mockReturnValue({
        data: [],
        isLoading: false,
        error: null
      } as any)

      render(
        <DetailsPanelSelector
          selectedProject="project-1"
          selectedSpendType="Personnel"
          selectedSpendSubCategory="Engineers"
          onProjectChange={mockOnProjectChange}
          onSpendTypeChange={mockOnSpendTypeChange}
          onSubCategoryChange={mockOnSubCategoryChange}
          onCostBreakdownFound={mockOnCostBreakdownFound}
        />
      )

      expect(mockOnCostBreakdownFound).toHaveBeenCalledWith(null)
    })
  })

  describe('Loading States', () => {
    it('should show skeleton when projects are loading', () => {
      vi.mocked(trpc.poMapping.getProjects.useQuery).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null
      } as any)

      const { container } = render(
        <DetailsPanelSelector
          selectedProject=""
          selectedSpendType=""
          selectedSpendSubCategory=""
          onProjectChange={mockOnProjectChange}
          onSpendTypeChange={mockOnSpendTypeChange}
          onSubCategoryChange={mockOnSubCategoryChange}
          onCostBreakdownFound={mockOnCostBreakdownFound}
        />
      )

      // Skeleton uses data-slot attribute
      const skeleton = container.querySelector('[data-slot="skeleton"]')
      expect(skeleton).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('should render project selector button', () => {
      render(
        <DetailsPanelSelector
          selectedProject=""
          selectedSpendType=""
          selectedSpendSubCategory=""
          onProjectChange={mockOnProjectChange}
          onSpendTypeChange={mockOnSpendTypeChange}
          onSubCategoryChange={mockOnSubCategoryChange}
          onCostBreakdownFound={mockOnCostBreakdownFound}
        />
      )

      // Select component renders with role combobox
      const projectSelect = screen.getByRole('combobox', { name: /Project/i })
      expect(projectSelect).toBeInTheDocument()
    })
  })
})
