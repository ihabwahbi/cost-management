import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DetailsPanelMapper } from '../component'
import { trpc } from '@/lib/trpc'

// Mock tRPC
vi.mock('@/lib/trpc', () => ({
  trpc: {
    poMapping: {
      createMapping: {
        useMutation: vi.fn()
      },
      updateMapping: {
        useMutation: vi.fn()
      },
      clearMappings: {
        useMutation: vi.fn()
      }
    },
    useUtils: vi.fn()
  }
}))

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn()
}))

describe('DetailsPanelMapper', () => {
  const mockOnMappingComplete = vi.fn()
  const mockInvalidate = vi.fn()
  const mockMutateAsync = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock tRPC utils
    vi.mocked(trpc.useUtils).mockReturnValue({
      poMapping: {
        getExistingMappings: {
          invalidate: mockInvalidate
        }
      }
    } as any)

    // Default mutation mocks
    vi.mocked(trpc.poMapping.createMapping.useMutation).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false
    } as any)

    vi.mocked(trpc.poMapping.updateMapping.useMutation).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false
    } as any)

    vi.mocked(trpc.poMapping.clearMappings.useMutation).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false
    } as any)
  })

  describe('BA-007: Save Button Disabled - Required Fields Missing', () => {
    it('should disable save button when poId is null', () => {
      render(
        <DetailsPanelMapper
          poId={null}
          costBreakdownId="cost-123"
          existingMappings={[]}
          isEditMode={false}
          onMappingComplete={mockOnMappingComplete}
        />
      )

      const saveButton = screen.getByRole('button', { name: /Create Mapping/i })
      expect(saveButton).toBeDisabled()
    })

    it('should disable save button when costBreakdownId is null', () => {
      render(
        <DetailsPanelMapper
          poId="po-123"
          costBreakdownId={null}
          existingMappings={[]}
          isEditMode={false}
          onMappingComplete={mockOnMappingComplete}
        />
      )

      const saveButton = screen.getByRole('button', { name: /Create Mapping/i })
      expect(saveButton).toBeDisabled()
    })

    it('should disable save button when both required fields are null', () => {
      render(
        <DetailsPanelMapper
          poId={null}
          costBreakdownId={null}
          existingMappings={[]}
          isEditMode={false}
          onMappingComplete={mockOnMappingComplete}
        />
      )

      const saveButton = screen.getByRole('button', { name: /Create Mapping/i })
      expect(saveButton).toBeDisabled()
    })

    it('should enable save button when all required fields are provided', () => {
      render(
        <DetailsPanelMapper
          poId="po-123"
          costBreakdownId="cost-123"
          existingMappings={[]}
          isEditMode={false}
          onMappingComplete={mockOnMappingComplete}
        />
      )

      const saveButton = screen.getByRole('button', { name: /Create Mapping/i })
      expect(saveButton).not.toBeDisabled()
    })

    it('should disable save button during mutation (loading state)', () => {
      vi.mocked(trpc.poMapping.createMapping.useMutation).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true
      } as any)

      render(
        <DetailsPanelMapper
          poId="po-123"
          costBreakdownId="cost-123"
          existingMappings={[]}
          isEditMode={false}
          onMappingComplete={mockOnMappingComplete}
        />
      )

      const saveButton = screen.getByRole('button', { name: /Saving.../i })
      expect(saveButton).toBeDisabled()
    })
  })

  describe('BA-008: Two-Step Confirmation Before Clearing', () => {
    it('should show clear button only in edit mode with existing mappings', () => {
      const { rerender } = render(
        <DetailsPanelMapper
          poId="po-123"
          costBreakdownId="cost-123"
          existingMappings={[]}
          isEditMode={false}
          onMappingComplete={mockOnMappingComplete}
        />
      )

      // Should NOT show clear button when not in edit mode
      expect(screen.queryByRole('button', { name: /Clear All Mappings/i })).not.toBeInTheDocument()

      // Rerender in edit mode but with no mappings
      rerender(
        <DetailsPanelMapper
          poId="po-123"
          costBreakdownId="cost-123"
          existingMappings={[]}
          isEditMode={true}
          onMappingComplete={mockOnMappingComplete}
        />
      )

      // Should NOT show clear button when no existing mappings
      expect(screen.queryByRole('button', { name: /Clear All Mappings/i })).not.toBeInTheDocument()

      // Rerender in edit mode with existing mappings
      rerender(
        <DetailsPanelMapper
          poId="po-123"
          costBreakdownId="cost-123"
          existingMappings={[
            { id: 'mapping-1', poLineItemId: 'po-line-1' },
            { id: 'mapping-2', poLineItemId: 'po-line-2' }
          ]}
          isEditMode={true}
          onMappingComplete={mockOnMappingComplete}
        />
      )

      // Should show clear button when in edit mode with mappings
      expect(screen.getByRole('button', { name: /Clear All Mappings/i })).toBeInTheDocument()
    })

    it('should open confirmation dialog when clear button clicked', async () => {
      render(
        <DetailsPanelMapper
          poId="po-123"
          costBreakdownId="cost-123"
          existingMappings={[
            { id: 'mapping-1', poLineItemId: 'po-line-1' }
          ]}
          isEditMode={true}
          onMappingComplete={mockOnMappingComplete}
        />
      )

      const clearButton = screen.getByRole('button', { name: /Clear All Mappings/i })
      fireEvent.click(clearButton)

      await waitFor(() => {
        const dialog = screen.getByRole('alertdialog')
        expect(dialog).toBeInTheDocument()
        expect(screen.getByText(/This will remove all 1 PO line item mapping/i)).toBeInTheDocument()
      })
    })

    it('should show correct count in confirmation dialog', async () => {
      render(
        <DetailsPanelMapper
          poId="po-123"
          costBreakdownId="cost-123"
          existingMappings={[
            { id: 'mapping-1', poLineItemId: 'po-line-1' },
            { id: 'mapping-2', poLineItemId: 'po-line-2' },
            { id: 'mapping-3', poLineItemId: 'po-line-3' }
          ]}
          isEditMode={true}
          onMappingComplete={mockOnMappingComplete}
        />
      )

      const clearButton = screen.getByRole('button', { name: /Clear All Mappings/i })
      fireEvent.click(clearButton)

      await waitFor(() => {
        expect(screen.getByText(/This will remove all 3 PO line item mapping/i)).toBeInTheDocument()
      })
    })

    it('should allow canceling the clear operation', async () => {
      render(
        <DetailsPanelMapper
          poId="po-123"
          costBreakdownId="cost-123"
          existingMappings={[
            { id: 'mapping-1', poLineItemId: 'po-line-1' }
          ]}
          isEditMode={true}
          onMappingComplete={mockOnMappingComplete}
        />
      )

      // Open dialog
      const clearButton = screen.getByRole('button', { name: /Clear All Mappings/i })
      fireEvent.click(clearButton)

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument()
      })

      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /Cancel/i })
      fireEvent.click(cancelButton)

      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
      })

      // Verify mutation was NOT called
      expect(mockMutateAsync).not.toHaveBeenCalled()
    })

    it('should execute clear mutation when confirmed', async () => {
      mockMutateAsync.mockResolvedValue({ success: true })

      render(
        <DetailsPanelMapper
          poId="po-123"
          costBreakdownId="cost-123"
          existingMappings={[
            { id: 'mapping-1', poLineItemId: 'po-line-1' },
            { id: 'mapping-2', poLineItemId: 'po-line-2' }
          ]}
          isEditMode={true}
          onMappingComplete={mockOnMappingComplete}
        />
      )

      // Open dialog
      const clearButton = screen.getByRole('button', { name: /Clear All Mappings/i })
      fireEvent.click(clearButton)

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument()
      })

      // Confirm clear
      const confirmButton = screen.getByRole('button', { name: /Clear Mappings/i })
      fireEvent.click(confirmButton)

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          poLineItemIds: ['po-line-1', 'po-line-2']
        })
      })
    })
  })

  describe('BA-009: Refreshes Display After Successful Operation', () => {
    it('should invalidate cache and call onMappingComplete after create', async () => {
      mockMutateAsync.mockResolvedValue({ count: 1 })

      render(
        <DetailsPanelMapper
          poId="po-123"
          costBreakdownId="cost-123"
          existingMappings={[]}
          isEditMode={false}
          onMappingComplete={mockOnMappingComplete}
        />
      )

      const saveButton = screen.getByRole('button', { name: /Create Mapping/i })
      fireEvent.click(saveButton)

      await waitFor(() => {
        // Verify mutation was called
        expect(mockMutateAsync).toHaveBeenCalledWith({
          poId: 'po-123',
          costBreakdownId: 'cost-123',
          mappingNotes: undefined
        })

        // Verify cache invalidation
        expect(mockInvalidate).toHaveBeenCalledWith({ poId: 'po-123' })

        // Verify callback
        expect(mockOnMappingComplete).toHaveBeenCalled()
      })
    })

    it('should invalidate cache and call onMappingComplete after update', async () => {
      mockMutateAsync.mockResolvedValue({ success: true })

      render(
        <DetailsPanelMapper
          poId="po-123"
          costBreakdownId="cost-456"
          existingMappings={[
            { id: 'mapping-1', poLineItemId: 'po-line-1' }
          ]}
          isEditMode={true}
          onMappingComplete={mockOnMappingComplete}
        />
      )

      const saveButton = screen.getByRole('button', { name: /Update Mapping/i })
      fireEvent.click(saveButton)

      await waitFor(() => {
        // Verify mutation was called
        expect(mockMutateAsync).toHaveBeenCalledWith({
          mappingIds: ['mapping-1'],
          costBreakdownId: 'cost-456',
          mappingNotes: undefined
        })

        // Verify cache invalidation
        expect(mockInvalidate).toHaveBeenCalledWith({ poId: 'po-123' })

        // Verify callback
        expect(mockOnMappingComplete).toHaveBeenCalled()
      })
    })

    it('should invalidate cache and call onMappingComplete after clear', async () => {
      mockMutateAsync.mockResolvedValue({ success: true })

      render(
        <DetailsPanelMapper
          poId="po-123"
          costBreakdownId="cost-123"
          existingMappings={[
            { id: 'mapping-1', poLineItemId: 'po-line-1' }
          ]}
          isEditMode={true}
          onMappingComplete={mockOnMappingComplete}
        />
      )

      // Open dialog
      const clearButton = screen.getByRole('button', { name: /Clear All Mappings/i })
      fireEvent.click(clearButton)

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument()
      })

      // Confirm clear
      const confirmButton = screen.getByRole('button', { name: /Clear Mappings/i })
      fireEvent.click(confirmButton)

      await waitFor(() => {
        // Verify cache invalidation
        expect(mockInvalidate).toHaveBeenCalledWith({ poId: 'po-123' })

        // Verify callback
        expect(mockOnMappingComplete).toHaveBeenCalled()
      })
    })

    it('should include mapping notes in create mutation', async () => {
      mockMutateAsync.mockResolvedValue({ count: 1 })

      render(
        <DetailsPanelMapper
          poId="po-123"
          costBreakdownId="cost-123"
          existingMappings={[]}
          isEditMode={false}
          onMappingComplete={mockOnMappingComplete}
        />
      )

      // Add notes
      const notesTextarea = screen.getByLabelText(/Mapping Notes/i)
      fireEvent.change(notesTextarea, { target: { value: 'Test mapping notes' } })

      // Save
      const saveButton = screen.getByRole('button', { name: /Create Mapping/i })
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          poId: 'po-123',
          costBreakdownId: 'cost-123',
          mappingNotes: 'Test mapping notes'
        })
      })
    })

    it('should clear notes after successful save', async () => {
      mockMutateAsync.mockResolvedValue({ count: 1 })

      render(
        <DetailsPanelMapper
          poId="po-123"
          costBreakdownId="cost-123"
          existingMappings={[]}
          isEditMode={false}
          onMappingComplete={mockOnMappingComplete}
        />
      )

      // Add notes
      const notesTextarea = screen.getByLabelText(/Mapping Notes/i) as HTMLTextAreaElement
      fireEvent.change(notesTextarea, { target: { value: 'Test notes' } })
      expect(notesTextarea.value).toBe('Test notes')

      // Save
      const saveButton = screen.getByRole('button', { name: /Create Mapping/i })
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(notesTextarea.value).toBe('')
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle create mutation errors gracefully', async () => {
      mockMutateAsync.mockRejectedValue(new Error('Network error'))

      render(
        <DetailsPanelMapper
          poId="po-123"
          costBreakdownId="cost-123"
          existingMappings={[]}
          isEditMode={false}
          onMappingComplete={mockOnMappingComplete}
        />
      )

      const saveButton = screen.getByRole('button', { name: /Create Mapping/i })
      fireEvent.click(saveButton)

      await waitFor(() => {
        // Should not call callback on error
        expect(mockOnMappingComplete).not.toHaveBeenCalled()
      })
    })

    it('should handle clear mutation errors gracefully', async () => {
      mockMutateAsync.mockRejectedValue(new Error('Clear failed'))

      render(
        <DetailsPanelMapper
          poId="po-123"
          costBreakdownId="cost-123"
          existingMappings={[
            { id: 'mapping-1', poLineItemId: 'po-line-1' }
          ]}
          isEditMode={true}
          onMappingComplete={mockOnMappingComplete}
        />
      )

      // Open and confirm dialog
      const clearButton = screen.getByRole('button', { name: /Clear All Mappings/i })
      fireEvent.click(clearButton)

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument()
      })

      const confirmButton = screen.getByRole('button', { name: /Clear Mappings/i })
      fireEvent.click(confirmButton)

      await waitFor(() => {
        // Should not call callback on error
        expect(mockOnMappingComplete).not.toHaveBeenCalled()
      })
    })
  })
})
