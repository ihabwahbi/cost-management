import { useState } from 'react'

/**
 * Hook for managing comparison dialog state
 * @param onCompare - Callback when comparison is confirmed
 * @returns Dialog state and handlers
 */
export function useCompareDialog(
  onCompare?: (v1: number, v2: number) => void
) {
  const [showDialog, setShowDialog] = useState(false)
  const [compareFrom, setCompareFrom] = useState<number | null>(null)
  const [compareTo, setCompareTo] = useState<number | null>(null)

  const handleOpenChange = (open: boolean) => {
    setShowDialog(open)
    if (!open) {
      setCompareFrom(null)
      setCompareTo(null)
    }
  }

  const handleCompare = () => {
    if (compareFrom !== null && compareTo !== null && onCompare) {
      onCompare(compareFrom, compareTo)
      setShowDialog(false)
    }
  }

  return {
    showDialog,
    compareFrom,
    compareTo,
    setCompareFrom,
    setCompareTo,
    handleOpenChange,
    handleCompare,
  }
}
