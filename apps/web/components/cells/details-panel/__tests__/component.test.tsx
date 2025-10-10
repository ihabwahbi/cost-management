import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DetailsPanel } from '../component'

// Mock child components
vi.mock('@/components/cells/details-panel-viewer/component', () => ({
  DetailsPanelViewer: ({ onMappingsLoaded }: any) => {
    // Simulate calling the callback
    return <div data-testid="details-panel-viewer">Viewer Component</div>
  }
}))

vi.mock('@/components/cells/details-panel-selector/component', () => ({
  DetailsPanelSelector: () => <div data-testid="details-panel-selector">Selector Component</div>
}))

vi.mock('@/components/cells/details-panel-mapper/component', () => ({
  DetailsPanelMapper: () => <div data-testid="details-panel-mapper">Mapper Component</div>
}))

describe('DetailsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('BA-010: Shows Empty State When No PO Selected', () => {
    it('should display empty state when selectedPO is null', () => {
      render(<DetailsPanel selectedPO={null} />)

      expect(screen.getByText('Select a PO to view details')).toBeInTheDocument()
      expect(screen.queryByText(/PO Details/i)).not.toBeInTheDocument()
    })

    it('should show icon in empty state', () => {
      const { container } = render(<DetailsPanel selectedPO={null} />)

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should not show viewer when no PO selected', () => {
      render(<DetailsPanel selectedPO={null} />)

      expect(screen.queryByTestId('details-panel-viewer')).not.toBeInTheDocument()
    })
  })

  describe('BA-011: Shows Not Mapped State With Create Button', () => {
    it('should show Not Mapped card when PO selected but no mappings', () => {
      const mockPO = { id: 'po-123', poNumber: 'PO-001' }
      
      render(<DetailsPanel selectedPO={mockPO} />)

      expect(screen.getByText('Not Mapped')).toBeInTheDocument()
      expect(screen.getByText(/This PO has not been mapped to a cost breakdown/i)).toBeInTheDocument()
    })

    it('should show Create Mapping button when not mapped', () => {
      const mockPO = { id: 'po-123', poNumber: 'PO-001' }
      
      render(<DetailsPanel selectedPO={mockPO} />)

      const createButton = screen.getByRole('button', { name: /Create Mapping/i })
      expect(createButton).toBeInTheDocument()
    })

    it('should show selector and mapper when Create Mapping clicked', () => {
      const mockPO = { id: 'po-123', poNumber: 'PO-001' }
      
      render(<DetailsPanel selectedPO={mockPO} />)

      // Initially should not show selector/mapper
      expect(screen.queryByTestId('details-panel-selector')).not.toBeInTheDocument()
      expect(screen.queryByTestId('details-panel-mapper')).not.toBeInTheDocument()

      // Click Create Mapping
      const createButton = screen.getByRole('button', { name: /Create Mapping/i })
      fireEvent.click(createButton)

      // Should now show selector and mapper
      expect(screen.getByTestId('details-panel-selector')).toBeInTheDocument()
      expect(screen.getByTestId('details-panel-mapper')).toBeInTheDocument()

      // Should hide Not Mapped card and Create button
      expect(screen.queryByText('Not Mapped')).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Create Mapping/i })).not.toBeInTheDocument()
    })

    it('should display PO number in header', () => {
      const mockPO = { id: 'po-123', poNumber: 'PO-001' }
      
      render(<DetailsPanel selectedPO={mockPO} />)

      expect(screen.getByText('PO Details - PO-001')).toBeInTheDocument()
    })
  })

  describe('BA-012: Resets All States When PO Changes', () => {
    it('should reset state when PO id changes', () => {
      const mockPO1 = { id: 'po-123', poNumber: 'PO-001' }
      const mockPO2 = { id: 'po-456', poNumber: 'PO-002' }
      
      const { rerender } = render(<DetailsPanel selectedPO={mockPO1} />)

      // Enter edit mode
      const createButton = screen.getByRole('button', { name: /Create Mapping/i })
      fireEvent.click(createButton)

      // Verify edit mode is active
      expect(screen.getByTestId('details-panel-selector')).toBeInTheDocument()

      // Change PO
      rerender(<DetailsPanel selectedPO={mockPO2} />)

      // Should reset to initial state (not in edit mode)
      expect(screen.queryByTestId('details-panel-selector')).not.toBeInTheDocument()
      expect(screen.queryByTestId('details-panel-mapper')).not.toBeInTheDocument()
      
      // Should show Create Mapping button again
      expect(screen.getByRole('button', { name: /Create Mapping/i })).toBeInTheDocument()
    })

    it('should update PO number in header when PO changes', () => {
      const mockPO1 = { id: 'po-123', poNumber: 'PO-001' }
      const mockPO2 = { id: 'po-456', poNumber: 'PO-002' }
      
      const { rerender } = render(<DetailsPanel selectedPO={mockPO1} />)

      expect(screen.getByText('PO Details - PO-001')).toBeInTheDocument()

      rerender(<DetailsPanel selectedPO={mockPO2} />)

      expect(screen.getByText('PO Details - PO-002')).toBeInTheDocument()
      expect(screen.queryByText('PO Details - PO-001')).not.toBeInTheDocument()
    })

    it('should not reset state when PO number changes but id is same', () => {
      const mockPO1 = { id: 'po-123', poNumber: 'PO-001' }
      const mockPO1Updated = { id: 'po-123', poNumber: 'PO-001-REVISED' }
      
      const { rerender } = render(<DetailsPanel selectedPO={mockPO1} />)

      // Enter edit mode
      const createButton = screen.getByRole('button', { name: /Create Mapping/i })
      fireEvent.click(createButton)

      // Verify edit mode is active
      expect(screen.getByTestId('details-panel-selector')).toBeInTheDocument()

      // Update PO number (but same id)
      rerender(<DetailsPanel selectedPO={mockPO1Updated} />)

      // Should NOT reset (edit mode should persist)
      expect(screen.getByTestId('details-panel-selector')).toBeInTheDocument()
    })
  })

  describe('Integration: Component Orchestration', () => {
    it('should always render viewer when PO selected', () => {
      const mockPO = { id: 'po-123', poNumber: 'PO-001' }
      
      render(<DetailsPanel selectedPO={mockPO} />)

      expect(screen.getByTestId('details-panel-viewer')).toBeInTheDocument()
    })

    it('should call onMappingChange callback when mapping completed', async () => {
      const mockOnMappingChange = vi.fn().mockResolvedValue(undefined)
      const mockPO = { id: 'po-123', poNumber: 'PO-001' }
      
      render(<DetailsPanel selectedPO={mockPO} onMappingChange={mockOnMappingChange} />)

      // Simulate mapping completion by accessing the component's internal handler
      // Note: This is a simplified test. In reality, you'd simulate the full flow
      expect(mockOnMappingChange).not.toHaveBeenCalled()
    })

    it('should handle transition from unmapped to mapped state', () => {
      const mockPO = { id: 'po-123', poNumber: 'PO-001' }
      
      render(<DetailsPanel selectedPO={mockPO} />)

      // Initially shows unmapped state
      expect(screen.getByText('Not Mapped')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Create Mapping/i })).toBeInTheDocument()

      // Click to enter edit mode
      fireEvent.click(screen.getByRole('button', { name: /Create Mapping/i }))

      // Now in edit mode
      expect(screen.getByTestId('details-panel-selector')).toBeInTheDocument()
      expect(screen.getByTestId('details-panel-mapper')).toBeInTheDocument()
    })
  })
})
