'use client'

import { useMemo, useCallback, useState } from 'react'
import { trpc } from '@/lib/trpc'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { AlertCircle, Trash2 } from 'lucide-react'
import { useKeyboardShortcuts, useValidation } from './hooks'
import { CostBreakdownTableRow } from './table-row'

interface CostBreakdownTableCellProps {
  projectId: string
  versionNumber?: number | "latest"  // Version to display (defaults to "latest")
}

interface CostEntry {
  id: string
  projectId: string
  subBusinessLine: string
  costLine: string
  spendType: string
  spendSubCategory: string | null
  budgetCost: number
  createdAt: string | null
  updatedAt: string | null
}

export function CostBreakdownTableCell({ 
  projectId, 
  versionNumber = "latest" 
}: CostBreakdownTableCellProps) {
  console.log('[CostBreakdownTableCell] Component render:', { projectId, versionNumber })
  
  const { toast } = useToast()
  const utils = trpc.useUtils()

  // State: Inline editing
  const [editingRowId, setEditingRowId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Partial<CostEntry>>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // State: Bulk operations
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkEditMode, setBulkEditMode] = useState(false)

  // ✅ CRITICAL: Memoize query input with version
  const queryInput = useMemo(
    () => {
      const input = {
        projectId,
        versionNumber,
        orderBy: 'costLine' as const,
      }
      console.log('[CostBreakdownTableCell] Query input:', input)
      return input
    },
    [projectId, versionNumber]  // Include version in deps!
  )

  // tRPC queries - USE VERSIONED PROCEDURE
  const { 
    data: costs, 
    isLoading, 
    error 
  } = trpc.costBreakdown.getCostBreakdownByVersion.useQuery(queryInput, {
    refetchOnWindowFocus: false,
    staleTime: 1000, // Reduce to 1 second for version changes
  })
  
  // Debug: Log when data changes
  console.log('[CostBreakdownTableCell] Data state:', { 
    versionNumber, 
    isLoading, 
    itemCount: costs?.length,
    firstItem: costs?.[0]?.costLine,
    error: error?.message 
  })

  // tRPC mutations
  const updateMutation = trpc.costBreakdown.updateCostEntry.useMutation({
    onSuccess: () => {
      utils.costBreakdown.getCostBreakdownByVersion.invalidate()
      setEditingRowId(null)
      setEditValues({})
      setFieldErrors({})
      toast({
        title: 'Success',
        description: 'Cost entry updated',
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update: ${error.message}`,
        variant: 'destructive',
      })
    },
  })

  const deleteMutation = trpc.costBreakdown.deleteCostEntry.useMutation({
    onSuccess: () => {
      utils.costBreakdown.getCostBreakdownByVersion.invalidate()
      toast({
        title: 'Success',
        description: 'Cost entry deleted',
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete: ${error.message}`,
        variant: 'destructive',
      })
    },
  })

  const bulkDeleteMutation = trpc.costBreakdown.bulkDeleteCostEntries.useMutation({
    onSuccess: (result) => {
      utils.costBreakdown.getCostBreakdownByVersion.invalidate()
      setSelectedIds(new Set())
      setBulkEditMode(false)
      toast({
        title: 'Success',
        description: `Deleted ${result.deletedCount} cost entries`,
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to bulk delete: ${error.message}`,
        variant: 'destructive',
      })
    },
  })

  // Mutation status flags
  const isUpdating = updateMutation.isPending
  const isDeleting = deleteMutation.isPending
  const isBulkDeleting = bulkDeleteMutation.isPending

  // ✅ Memoize event handlers
  const handleRowDoubleClick = useCallback((row: CostEntry) => {
    setEditingRowId(row.id)
    setEditValues(row)
    setFieldErrors({})
  }, [])

  const validate = useValidation()

  const handleFieldChange = useCallback((field: keyof CostEntry, value: string | number) => {
    setEditValues((prev) => ({ ...prev, [field]: value }))
    setFieldErrors((prev) => ({ ...prev, [field]: '' }))
  }, [])

  const validateFields = useCallback(() => {
    const errors = validate(editValues)
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }, [editValues, validate])

  const handleSaveEdit = useCallback(() => {
    if (!editingRowId || !validateFields()) return

    updateMutation.mutate({
      id: editingRowId,
      subBusinessLine: editValues.subBusinessLine,
      costLine: editValues.costLine,
      spendType: editValues.spendType,
      spendSubCategory: editValues.spendSubCategory || undefined,
      budgetCost: editValues.budgetCost,
    })
  }, [editingRowId, editValues, updateMutation, validateFields])

  const handleCancelEdit = useCallback(() => {
    setEditingRowId(null)
    setEditValues({})
    setFieldErrors({})
  }, [])

  const handleDeleteRow = useCallback((id: string) => {
    deleteMutation.mutate({ id })
  }, [deleteMutation])

  const handleBulkDelete = useCallback(() => {
    if (selectedIds.size === 0) return
    bulkDeleteMutation.mutate({
      ids: Array.from(selectedIds),
    })
  }, [selectedIds, bulkDeleteMutation])

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const handleToggleSelectAll = useCallback(() => {
    if (!costs) return
    if (selectedIds.size === costs.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(costs.map((c) => c.id)))
    }
  }, [costs, selectedIds])

  // Keyboard shortcuts (BA-023)
  useKeyboardShortcuts(editingRowId, handleSaveEdit, handleCancelEdit)

  // Loading state (BA-002 implied)
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Cost Breakdown</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    )
  }

  // Empty state (BA-008)
  if (!costs || costs.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No budget created yet</AlertTitle>
        <AlertDescription>
          Add your first cost entry to get started
        </AlertDescription>
      </Alert>
    )
  }

  const hasUnsavedChanges = editingRowId !== null

  // BA-003: Display cost breakdown table
  return (
    <div className="space-y-4">
      {/* BA-022: Unsaved changes bar */}
      {hasUnsavedChanges && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Unsaved Changes</AlertTitle>
          <AlertDescription>
            You have unsaved edits. Press Cmd+S to save or Escape to cancel.
          </AlertDescription>
        </Alert>
      )}

      {/* BA-BULK-001: Bulk actions */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setBulkEditMode(!bulkEditMode)}
        >
          {bulkEditMode ? 'Exit Bulk Mode' : 'Bulk Edit'}
        </Button>
        {bulkEditMode && selectedIds.size > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            disabled={isBulkDeleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete {selectedIds.size} selected
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {bulkEditMode && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={costs.length > 0 && selectedIds.size === costs.length}
                    onCheckedChange={handleToggleSelectAll}
                  />
                </TableHead>
              )}
              <TableHead>Cost Line</TableHead>
              <TableHead>Sub Business Line</TableHead>
              <TableHead>Spend Type</TableHead>
              <TableHead>Sub Category</TableHead>
              <TableHead className="text-right">Budget Cost</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {costs.map((cost) => (
              <CostBreakdownTableRow
                key={cost.id}
                cost={cost}
                isEditing={editingRowId === cost.id}
                editValues={editValues}
                fieldErrors={fieldErrors}
                bulkEditMode={bulkEditMode}
                isSelected={selectedIds.has(cost.id)}
                isUpdating={isUpdating}
                isDeleting={isDeleting}
                onDoubleClick={handleRowDoubleClick}
                onFieldChange={handleFieldChange}
                onSaveEdit={handleSaveEdit}
                onCancelEdit={handleCancelEdit}
                onDelete={handleDeleteRow}
                onToggleSelect={handleToggleSelect}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
