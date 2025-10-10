/**
 * PO Expansion Hook
 * 
 * Manages expand/collapse state for PO line items.
 * Extracted from po-table.tsx lines 80-90
 */

import { useState } from "react"

export function usePOExpansion() {
  const [expandedPOs, setExpandedPOs] = useState<Set<string>>(new Set())

  const toggleExpanded = (poId: string) => {
    const newExpanded = new Set(expandedPOs)
    if (newExpanded.has(poId)) {
      newExpanded.delete(poId)
    } else {
      newExpanded.add(poId)
    }
    setExpandedPOs(newExpanded)
  }

  const isExpanded = (poId: string) => expandedPOs.has(poId)

  return {
    expandedPOs,
    toggleExpanded,
    isExpanded,
  }
}
