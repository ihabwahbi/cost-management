import { useEffect, useCallback } from 'react'

export function useKeyboardShortcuts(
  editingRowId: string | null,
  handleSaveEdit: () => void,
  handleCancelEdit: () => void
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+S / Ctrl+S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's' && editingRowId) {
        e.preventDefault()
        handleSaveEdit()
      }
      // Escape to cancel
      if (e.key === 'Escape' && editingRowId) {
        handleCancelEdit()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [editingRowId, handleSaveEdit, handleCancelEdit])
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

export function useValidation() {
  return useCallback((editValues: Partial<CostEntry>) => {
    const errors: Record<string, string> = {}
    if (!editValues.costLine || editValues.costLine.trim() === '') {
      errors.costLine = 'Cost Line is required'
    }
    if (editValues.budgetCost !== undefined && editValues.budgetCost < 0) {
      errors.budgetCost = 'Budget cost must be non-negative'
    }
    return errors
  }, [])
}
