'use client'

import { trpc } from '@/lib/trpc'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'

interface MapperProps {
  poId: string | null
  costBreakdownId: string | null
  existingMappings: Array<{ id: string; poLineItemId: string }>
  isEditMode: boolean
  onMappingComplete: () => void
}

/**
 * DetailsPanelMapper
 * 
 * CRUD operations for PO mappings (Phase B.1: Create/Update only)
 * Clear operation will be added in Phase B.2
 * 
 * Behavioral Assertions:
 * - BA-007: Save button disabled when required fields missing
 * - BA-008: Shows two-step confirmation before clearing (Phase B.2)
 * - BA-009: Refreshes display after successful operation
 */
export function DetailsPanelMapper(props: MapperProps) {
  const [mappingNotes, setMappingNotes] = useState('')
  
  const createMutation = trpc.poMapping.createMapping.useMutation()
  const updateMutation = trpc.poMapping.updateMapping.useMutation()
  
  // CRITICAL: Memoize all mutation inputs (objects passed to useMutation)
  const createInput = useMemo(
    () => ({
      poId: props.poId!,
      costBreakdownId: props.costBreakdownId!,
      mappingNotes: mappingNotes || undefined
    }),
    [props.poId, props.costBreakdownId, mappingNotes]
  )
  
  const updateInput = useMemo(
    () => ({
      mappingIds: props.existingMappings.map(m => m.id),
      costBreakdownId: props.costBreakdownId!,
      mappingNotes: mappingNotes || undefined
    }),
    [props.existingMappings, props.costBreakdownId, mappingNotes]
  )
  
  const handleSave = async () => {
    try {
      if (props.isEditMode) {
        await updateMutation.mutateAsync(updateInput)
        toast({ 
          title: 'Mapping updated successfully',
          description: `Updated ${updateInput.mappingIds.length} mapping(s)`
        })
      } else {
        const result = await createMutation.mutateAsync(createInput)
        toast({ 
          title: 'Mapping created successfully',
          description: `Created ${result.count} mapping(s)`
        })
      }
      
      // BA-009: Refresh display after successful operation
      props.onMappingComplete()
      
      // Reset notes
      setMappingNotes('')
    } catch (error) {
      console.error('Error saving mapping:', error)
      toast({ 
        title: 'Error saving mapping', 
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive' 
      })
    }
  }
  
  // BA-007: Save button disabled when required fields missing
  const isSaveDisabled = !props.poId || !props.costBreakdownId
  const isLoading = createMutation.isPending || updateMutation.isPending
  
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="mapping-notes">Mapping Notes (Optional)</Label>
        <Textarea 
          id="mapping-notes"
          value={mappingNotes}
          onChange={(e) => setMappingNotes(e.target.value)}
          placeholder="Add any notes about this mapping..."
          className="mt-2"
          disabled={isLoading}
        />
      </div>
      
      <div className="flex gap-2">
        <Button 
          onClick={handleSave}
          disabled={isSaveDisabled || isLoading}
        >
          {isLoading ? 'Saving...' : (props.isEditMode ? 'Update Mapping' : 'Create Mapping')}
        </Button>
        
        {/* Clear button will be added in Phase B.2 */}
      </div>
    </div>
  )
}
