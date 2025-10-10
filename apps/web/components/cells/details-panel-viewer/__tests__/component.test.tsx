import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { DetailsPanelViewer } from '../component'
import { trpc } from '@/lib/trpc'

// Mock tRPC
vi.mock('@/lib/trpc', () => ({
  trpc: {
    poMapping: {
      getExistingMappings: {
        useQuery: vi.fn()
      }
    }
  }
}))

describe('DetailsPanelViewer', () => {
  const mockOnMappingsLoaded = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('BA-001: Displays Current Mappings in Green Card When Data Exists', () => {
    it('should display green card with mappings when data exists', () => {
      vi.mocked(trpc.poMapping.getExistingMappings.useQuery).mockReturnValue({
        data: [
          {
            id: 'mapping-1',
            poLineItemId: 'po-line-1',
            lineValue: '50000',
            mappedAmount: '50000',
            costLine: 'Personnel',
            spendType: 'Engineers',
            spendSubCategory: 'Senior Engineers',
            mappingNotes: null
          }
        ],
        isLoading: false,
        error: null
      } as any)

      const { container } = render(
        <DetailsPanelViewer poId="po-123" onMappingsLoaded={mockOnMappingsLoaded} />
      )

      // Check for green card styling
      const greenCard = container.querySelector('.border-green-500')
      expect(greenCard).toBeInTheDocument()

      // Should display "PO Mapped" title
      expect(screen.getByText('PO Mapped')).toBeInTheDocument()

      // Should display mapping data in badges
      expect(screen.getByText('Personnel')).toBeInTheDocument()
      expect(screen.getByText('Engineers')).toBeInTheDocument()
      expect(screen.getByText('Senior Engineers')).toBeInTheDocument()
    })

    it('should call onMappingsLoaded with mapping data', () => {
      vi.mocked(trpc.poMapping.getExistingMappings.useQuery).mockReturnValue({
        data: [
          { 
            id: 'mapping-1', 
            poLineItemId: 'po-line-1',
            lineValue: '1000',
            mappedAmount: '1000',
            costLine: 'Personnel',
            spendType: 'Test',
            spendSubCategory: 'Test',
            mappingNotes: null
          },
          { 
            id: 'mapping-2', 
            poLineItemId: 'po-line-2',
            lineValue: '2000',
            mappedAmount: '2000',
            costLine: 'Equipment',
            spendType: 'Test',
            spendSubCategory: 'Test',
            mappingNotes: null
          }
        ],
        isLoading: false,
        error: null
      } as any)

      render(
        <DetailsPanelViewer poId="po-123" onMappingsLoaded={mockOnMappingsLoaded} />
      )

      // Component renders green card with formatted currency
      expect(screen.getByText('PO Mapped')).toBeInTheDocument()
      expect(mockOnMappingsLoaded).toHaveBeenCalledWith([
        { id: 'mapping-1', poLineItemId: 'po-line-1' },
        { id: 'mapping-2', poLineItemId: 'po-line-2' }
      ])
    })

    it('should handle null values gracefully', () => {
      vi.mocked(trpc.poMapping.getExistingMappings.useQuery).mockReturnValue({
        data: [
          {
            id: 'mapping-1',
            poLineItemId: 'po-line-1',
            lineValue: null,
            mappedAmount: null,
            costLine: 'Personnel',
            spendType: 'Engineers',
            spendSubCategory: 'Senior',
            mappingNotes: null
          }
        ],
        isLoading: false,
        error: null
      } as any)

      render(
        <DetailsPanelViewer poId="po-123" onMappingsLoaded={mockOnMappingsLoaded} />
      )

      // Component renders green card (null values treated as 0)
      expect(screen.getByText('PO Mapped')).toBeInTheDocument()
      const zeroValues = screen.getAllByText('$0')
      expect(zeroValues.length).toBeGreaterThanOrEqual(1)
    })

    it('should display $0 when lineValue is zero', () => {
      vi.mocked(trpc.poMapping.getExistingMappings.useQuery).mockReturnValue({
        data: [
          {
            id: 'mapping-1',
            poLineItemId: 'po-line-1',
            lineValue: '0',
            mappedAmount: '0',
            costLine: 'Personnel',
            spendType: 'Engineers',
            spendSubCategory: 'Senior',
            mappingNotes: null
          }
        ],
        isLoading: false,
        error: null
      } as any)

      render(
        <DetailsPanelViewer poId="po-123" onMappingsLoaded={mockOnMappingsLoaded} />
      )

      // Zero is a valid number, should be formatted as currency
      const zeroValues = screen.getAllByText('$0')
      expect(zeroValues.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('BA-003: Formats Currency as AUD With No Decimals', () => {
    it('should format valid lineValue as AUD currency', () => {
      vi.mocked(trpc.poMapping.getExistingMappings.useQuery).mockReturnValue({
        data: [
          {
            id: 'mapping-1',
            poLineItemId: 'po-line-1',
            lineValue: '50000',
            mappedAmount: '50000',
            costLine: 'Personnel',
            spendType: 'Engineers',
            spendSubCategory: 'Senior',
            mappingNotes: null
          }
        ],
        isLoading: false,
        error: null
      } as any)

      render(
        <DetailsPanelViewer poId="po-123" onMappingsLoaded={mockOnMappingsLoaded} />
      )

      // Should display formatted currency (AUD format with no decimals)
      // Both Total PO Value and Total Mapped Amount show same value
      const currencyElements = screen.getAllByText(/50,000/)
      expect(currencyElements.length).toBeGreaterThanOrEqual(2)
    })

    it('should format large numbers with thousand separators', () => {
      vi.mocked(trpc.poMapping.getExistingMappings.useQuery).mockReturnValue({
        data: [
          {
            id: 'mapping-1',
            poLineItemId: 'po-line-1',
            lineValue: '1250000',
            mappedAmount: '1250000',
            costLine: 'Personnel',
            spendType: 'Engineers',
            spendSubCategory: 'Senior',
            mappingNotes: null
          }
        ],
        isLoading: false,
        error: null
      } as any)

      render(
        <DetailsPanelViewer poId="po-123" onMappingsLoaded={mockOnMappingsLoaded} />
      )

      // Multiple matches expected (PO Value and Mapped Amount)
      const currencyElements = screen.getAllByText(/1,250,000/)
      expect(currencyElements.length).toBeGreaterThanOrEqual(2)
    })

    it('should format without decimal places', () => {
      vi.mocked(trpc.poMapping.getExistingMappings.useQuery).mockReturnValue({
        data: [
          {
            id: 'mapping-1',
            poLineItemId: 'po-line-1',
            lineValue: '50123.99',
            mappedAmount: '50123.99',
            costLine: 'Personnel',
            spendType: 'Engineers',
            spendSubCategory: 'Senior',
            mappingNotes: null
          }
        ],
        isLoading: false,
        error: null
      } as any)

      render(
        <DetailsPanelViewer poId="po-123" onMappingsLoaded={mockOnMappingsLoaded} />
      )

      // Should round to no decimal places (50123.99 rounds to 50,124)
      const roundedElements = screen.getAllByText(/50,124/)
      expect(roundedElements.length).toBeGreaterThanOrEqual(2)
      // Should NOT show decimals
      expect(screen.queryByText(/\.99/)).not.toBeInTheDocument()
    })
  })

  describe('Loading and Error States', () => {
    it('should display skeleton when loading', () => {
      vi.mocked(trpc.poMapping.getExistingMappings.useQuery).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null
      } as any)

      const { container } = render(
        <DetailsPanelViewer poId="po-123" onMappingsLoaded={mockOnMappingsLoaded} />
      )

      // Skeleton uses data-slot attribute
      const skeleton = container.querySelector('[data-slot="skeleton"]')
      expect(skeleton).toBeInTheDocument()
    })

    it('should display error alert when query fails', () => {
      vi.mocked(trpc.poMapping.getExistingMappings.useQuery).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to fetch mappings')
      } as any)

      render(
        <DetailsPanelViewer poId="po-123" onMappingsLoaded={mockOnMappingsLoaded} />
      )

      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText(/Failed to fetch mappings/i)).toBeInTheDocument()
    })

    it('should call onMappingsLoaded with empty array when no data', () => {
      vi.mocked(trpc.poMapping.getExistingMappings.useQuery).mockReturnValue({
        data: [],
        isLoading: false,
        error: null
      } as any)

      render(
        <DetailsPanelViewer poId="po-123" onMappingsLoaded={mockOnMappingsLoaded} />
      )

      expect(mockOnMappingsLoaded).toHaveBeenCalledWith([])
    })
  })
})
