/**
 * PO Row Component
 * 
 * Displays a single PO row with expand/collapse and selection functionality.
 * Extracted from po-table.tsx lines 176-227
 */

import { TableRow, TableCell } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { PORowProps } from "../types"
import { formatCurrency, formatDate } from "../utils/po-formatters"
import { StatusBadge } from "./status-badge"
import { FMTBadge } from "./fmt-badge"

const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <polyline points="6,9 12,15 18,9" />
  </svg>
)

const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <polyline points="9,18 15,12 9,6" />
  </svg>
)

export function PORow({
  po,
  isExpanded,
  isSelected,
  isChecked,
  onToggleExpand,
  onSelect,
  onCheckboxChange,
}: PORowProps) {
  const isPOFullyMapped = po.mapped_count === po.total_line_items && (po.total_line_items ?? 0) > 0

  return (
    <TableRow
      className={cn(
        "cursor-pointer hover:bg-muted/50",
        isSelected && "bg-accent/10 border-l-4 border-l-primary",
      )}
      onClick={onSelect}
    >
      <TableCell onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={isChecked}
          onCheckedChange={(checked) => onCheckboxChange(checked as boolean)}
        />
      </TableCell>
      <TableCell onClick={(e) => e.stopPropagation()}>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 w-6 p-0" 
          onClick={onToggleExpand}
        >
          {isExpanded ? (
            <ChevronDownIcon className="h-4 w-4" />
          ) : (
            <ChevronRightIcon className="h-4 w-4" />
          )}
        </Button>
      </TableCell>
      <TableCell className="font-medium">{po.po_number}</TableCell>
      <TableCell>{po.vendor_name}</TableCell>
      <TableCell className="text-right font-medium">
        {formatCurrency(po.total_value)}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {formatDate(po.po_creation_date)}
      </TableCell>
      <TableCell>{po.location}</TableCell>
      <TableCell>
        <FMTBadge isFMT={po.fmt_po} />
      </TableCell>
      <TableCell>
        <StatusBadge isMapped={isPOFullyMapped} />
      </TableCell>
    </TableRow>
  )
}
