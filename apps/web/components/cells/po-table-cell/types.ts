/**
 * PO Table Cell Types
 * 
 * TypeScript types for PO table component.
 * Replaces duplicated interfaces from po-table.tsx lines 10-34
 */

/**
 * Purchase Order data structure
 * This matches the tRPC getPOsWithLineItems procedure output
 */
export interface PO {
  id: string
  po_number: string
  vendor_name: string
  total_value: number
  po_creation_date: string
  location: string
  fmt_po: boolean
  project_name: string | null
  asset_code: string | null
  line_items: POLineItem[]
  mapped_count?: number
  total_line_items?: number
}

/**
 * PO Line Item data structure
 */
export interface POLineItem {
  id: string
  line_item_number: number
  part_number: string
  description: string
  quantity: number
  uom: string
  line_value: number
  is_mapped?: boolean
}

/**
 * Main component props
 */
export interface POTableCellProps {
  pos: PO[]
  selectedPO: PO | null
  selectedPOs: string[]
  onPOSelect: (po: PO) => void
  onPOsSelection: (poIds: string[]) => void
}

/**
 * PO row component props
 */
export interface PORowProps {
  po: PO
  isExpanded: boolean
  isSelected: boolean
  isChecked: boolean
  onToggleExpand: () => void
  onSelect: () => void
  onCheckboxChange: (checked: boolean) => void
}

/**
 * Line item row component props
 */
export interface LineItemRowProps {
  item: POLineItem
}

/**
 * Status badge component props
 */
export interface StatusBadgeProps {
  isMapped: boolean
}

/**
 * FMT badge component props
 */
export interface FMTBadgeProps {
  isFMT: boolean
}
