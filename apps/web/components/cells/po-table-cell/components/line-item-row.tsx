/**
 * Line Item Row Component
 * 
 * Displays a single line item within an expanded PO.
 * Extracted from po-table.tsx lines 230-254
 */

import { TableRow, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { LineItemRowProps } from "../types"
import { formatCurrency } from "../utils/po-formatters"

export function LineItemRow({ item }: LineItemRowProps) {
  return (
    <TableRow className="bg-muted/20">
      <TableCell></TableCell>
      <TableCell></TableCell>
      <TableCell className="text-sm font-medium pl-8">
        Line {item.line_item_number}
      </TableCell>
      <TableCell className="text-sm">{item.part_number}</TableCell>
      <TableCell className="text-right text-sm">
        {formatCurrency(item.line_value)}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {item.description}
      </TableCell>
      <TableCell className="text-sm">
        {item.quantity} {item.uom}
      </TableCell>
      <TableCell></TableCell>
      <TableCell>
        {item.is_mapped ? (
          <Badge variant="secondary" className="text-xs">
            Mapped
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            Unmapped
          </Badge>
        )}
      </TableCell>
    </TableRow>
  )
}
