'use client'

import { trpc } from '@/lib/trpc'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  AlertDialog, 
  AlertDialogContent, 
  AlertDialogHeader, 
  AlertDialogFooter, 
  AlertDialogTitle, 
  AlertDialogDescription, 
  AlertDialogCancel, 
  AlertDialogAction 
} from '@/components/ui/alert-dialog'
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
 * CRUD operations for PO mappings (Phase B Complete)
 * Includes: Create, Update, and Clear operations
 * 
 * Behavioral Assertions:
 * - BA-007: Save button disabled when required fields missing
 * - BA-008: Shows two-step confirmation before clearing
 * - BA-009: Refreshes display after successful operation
 */
export function DetailsPanelMapper(props: MapperProps) {
  const [mappingNotes, setMappingNotes] = useState('')
  const [showClearDialog, setShowClearDialog] = useState(false)
  
  // Get tRPC utils for cache invalidation
  const utils = trpc.useUtils()
  
  const createMutation = trpc.poMapping.createMapping.useMutation()
  const updateMutation = trpc.poMapping.updateMapping.useMutation()
  const clearMutation = trpc.poMapping.clearMappings.useMutation()
  
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
  
  const clearInput = useMemo(
    () => ({
      poLineItemIds: props.existingMappings.map(m => m.poLineItemId)
    }),
    [props.existingMappings]
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
      
      // CRITICAL: Invalidate cache to force refetch of mappings
      await utils.poMapping.getExistingMappings.invalidate({ poId: props.poId! })
      
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
  
  const handleClear = async () => {
    try {
      await clearMutation.mutateAsync(clearInput)
      toast({ 
        title: 'Mappings cleared successfully',
        description: `Cleared ${clearInput.poLineItemIds.length} mapping(s)`
      })
      setShowClearDialog(false)
      
      // CRITICAL: Invalidate cache to force refetch and show unmapped state
      await utils.poMapping.getExistingMappings.invalidate({ poId: props.poId! })
      
      // BA-009: Refresh display after successful operation
      props.onMappingComplete()
    } catch (error) {
      console.error('Error clearing mappings:', error)
      toast({ 
        title: 'Error clearing mappings', 
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive' 
      })
    }
  }
  
  // BA-007: Save button disabled when required fields missing
  const isSaveDisabled = !props.poId || !props.costBreakdownId
  const isLoading = createMutation.isPending || updateMutation.isPending || clearMutation.isPending
  
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
        
        {/* BA-008: Clear button only in edit mode */}
        {props.isEditMode && props.existingMappings.length > 0 && (
          <Button 
            variant="destructive"
            onClick={() => setShowClearDialog(true)}
            disabled={isLoading}
          >
            Clear All Mappings
          </Button>
        )}
      </div>
      
      {/* BA-008: Two-step confirmation dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all mappings?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all {clearInput.poLineItemIds.length} PO line item mapping(s). 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClear} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Clear Mappings
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
