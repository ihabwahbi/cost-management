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
        data: {
          mappings: [
            {
              id: 'mapping-1',
              poLineItemId: 'po-line-1',
              lineValue: 50000,
              costBreakdown: {
                costLine: 'Personnel',
                spendType: 'Engineers',
                spendSubCategory: 'Senior Engineers'
              }
            }
          ]
        },
        isLoading: false,
        error: null
      } as any)

      const { container } = render(
        <DetailsPanelViewer poId="po-123" onMappingsLoaded={mockOnMappingsLoaded} />
      )

      // Check for green card styling
      const greenCard = container.querySelector('.border-green-500, .bg-green-50')
      expect(greenCard).toBeInTheDocument()

      // Should display mapping data
      expect(screen.getByText(/Personnel/i)).toBeInTheDocument()
      expect(screen.getByText(/Engineers/i)).toBeInTheDocument()
      expect(screen.getByText(/Senior Engineers/i)).toBeInTheDocument()
    })

    it('should call onMappingsLoaded with mapping data', () => {
      const mockMappings = [
        { id: 'mapping-1', poLineItemId: 'po-line-1' },
        { id: 'mapping-2', poLineItemId: 'po-line-2' }
      ]

      vi.mocked(trpc.poMapping.getExistingMappings.useQuery).mockReturnValue({
        data: { mappings: mockMappings },
        isLoading: false,
        error: null
      } as any)

      render(
        <DetailsPanelViewer poId="po-123" onMappingsLoaded={mockOnMappingsLoaded} />
      )

      expect(mockOnMappingsLoaded).toHaveBeenCalledWith(mockMappings)
    })

    it('should display multiple mappings', () => {
      vi.mocked(trpc.poMapping.getExistingMappings.useQuery).mockReturnValue({
        data: {
          mappings: [
            {
              id: 'mapping-1',
              poLineItemId: 'po-line-1',
              lineValue: 50000,
              costBreakdown: {
                costLine: 'Personnel',
                spendType: 'Engineers',
                spendSubCategory: 'Senior'
              }
            },
            {
              id: 'mapping-2',
              poLineItemId: 'po-line-2',
              lineValue: 30000,
              costBreakdown: {
                costLine: 'Equipment',
                spendType: 'Hardware',
                spendSubCategory: 'Computers'
              }
            }
          ]
        },
        isLoading: false,
        error: null
      } as any)

      render(
        <DetailsPanelViewer poId="po-123" onMappingsLoaded={mockOnMappingsLoaded} />
      )

      expect(screen.getByText(/Personnel/i)).toBeInTheDocument()
      expect(screen.getByText(/Equipment/i)).toBeInTheDocument()
    })

    it('should not render green card when no mappings', () => {
      vi.mocked(trpc.poMapping.getExistingMappings.useQuery).mockReturnValue({
        data: { mappings: [] },
        isLoading: false,
        error: null
      } as any)

      const { container } = render(
        <DetailsPanelViewer poId="po-123" onMappingsLoaded={mockOnMappingsLoaded} />
      )

      const greenCard = container.querySelector('.border-green-500, .bg-green-50')
      expect(greenCard).not.toBeInTheDocument()
    })
  })

  describe('BA-002: Shows N/A for Null or Invalid Line Values', () => {
    it('should display N/A when lineValue is null', () => {
      vi.mocked(trpc.poMapping.getExistingMappings.useQuery).mockReturnValue({
        data: {
          mappings: [
            {
              id: 'mapping-1',
              poLineItemId: 'po-line-1',
              lineValue: null,
              costBreakdown: {
                costLine: 'Personnel',
                spendType: 'Engineers',
                spendSubCategory: 'Senior'
              }
            }
          ]
        },
        isLoading: false,
        error: null
      } as any)

      render(
        <DetailsPanelViewer poId="po-123" onMappingsLoaded={mockOnMappingsLoaded} />
      )

      expect(screen.getByText('N/A')).toBeInTheDocument()
    })

    it('should display N/A when lineValue is undefined', () => {
      vi.mocked(trpc.poMapping.getExistingMappings.useQuery).mockReturnValue({
        data: {
          mappings: [
            {
              id: 'mapping-1',
              poLineItemId: 'po-line-1',
              lineValue: undefined,
              costBreakdown: {
                costLine: 'Personnel',
                spendType: 'Engineers',
                spendSubCategory: 'Senior'
              }
            }
          ]
        },
        isLoading: false,
        error: null
      } as any)

      render(
        <DetailsPanelViewer poId="po-123" onMappingsLoaded={mockOnMappingsLoaded} />
      )

      expect(screen.getByText('N/A')).toBeInTheDocument()
    })

    it('should display N/A when lineValue is zero', () => {
      vi.mocked(trpc.poMapping.getExistingMappings.useQuery).mockReturnValue({
        data: {
          mappings: [
            {
              id: 'mapping-1',
              poLineItemId: 'po-line-1',
              lineValue: 0,
              costBreakdown: {
                costLine: 'Personnel',
                spendType: 'Engineers',
                spendSubCategory: 'Senior'
              }
            }
          ]
        },
        isLoading: false,
        error: null
      } as any)

      render(
        <DetailsPanelViewer poId="po-123" onMappingsLoaded={mockOnMappingsLoaded} />
      )

      expect(screen.getByText('N/A')).toBeInTheDocument()
    })
  })

  describe('BA-003: Formats Currency as AUD With No Decimals', () => {
    it('should format valid lineValue as AUD currency', () => {
      vi.mocked(trpc.poMapping.getExistingMappings.useQuery).mockReturnValue({
        data: {
          mappings: [
            {
              id: 'mapping-1',
              poLineItemId: 'po-line-1',
              lineValue: 50000,
              costBreakdown: {
                costLine: 'Personnel',
                spendType: 'Engineers',
                spendSubCategory: 'Senior'
              }
            }
          ]
        },
        isLoading: false,
        error: null
      } as any)

      render(
        <DetailsPanelViewer poId="po-123" onMappingsLoaded={mockOnMappingsLoaded} />
      )

      // Should display formatted currency (AUD format with no decimals)
      expect(screen.getByText(/\$50,000/i)).toBeInTheDocument()
    })

    it('should format large numbers with thousand separators', () => {
      vi.mocked(trpc.poMapping.getExistingMappings.useQuery).mockReturnValue({
        data: {
          mappings: [
            {
              id: 'mapping-1',
              poLineItemId: 'po-line-1',
              lineValue: 1250000,
              costBreakdown: {
                costLine: 'Personnel',
                spendType: 'Engineers',
                spendSubCategory: 'Senior'
              }
            }
          ]
        },
        isLoading: false,
        error: null
      } as any)

      render(
        <DetailsPanelViewer poId="po-123" onMappingsLoaded={mockOnMappingsLoaded} />
      )

      expect(screen.getByText(/\$1,250,000/i)).toBeInTheDocument()
    })

    it('should format without decimal places', () => {
      vi.mocked(trpc.poMapping.getExistingMappings.useQuery).mockReturnValue({
        data: {
          mappings: [
            {
              id: 'mapping-1',
              poLineItemId: 'po-line-1',
              lineValue: 50123.99,
              costBreakdown: {
                costLine: 'Personnel',
                spendType: 'Engineers',
                spendSubCategory: 'Senior'
              }
            }
          ]
        },
        isLoading: false,
        error: null
      } as any)

      render(
        <DetailsPanelViewer poId="po-123" onMappingsLoaded={mockOnMappingsLoaded} />
      )

      // Should round to no decimal places
      expect(screen.getByText(/\$50,124/i)).toBeInTheDocument()
      // Should NOT show decimals
      expect(screen.queryByText(/\.99/i)).not.toBeInTheDocument()
    })
  })

  describe('Loading and Error States', () => {
    it('should display skeleton when loading', () => {
      vi.mocked(trpc.poMapping.getExistingMappings.useQuery).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null
      } as any)

      render(
        <DetailsPanelViewer poId="po-123" onMappingsLoaded={mockOnMappingsLoaded} />
      )

      const skeletons = screen.getAllByTestId(/skeleton/)
      expect(skeletons.length).toBeGreaterThan(0)
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
        data: { mappings: [] },
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
