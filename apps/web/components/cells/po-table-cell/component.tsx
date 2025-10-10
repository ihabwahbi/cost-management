/**
 * PO Table Cell
 * 
 * Purchase order table with expand/collapse, selection, and status indicators.
 * Migrated from po-table.tsx (266 lines) to Cell architecture.
 * 
 * Critical fixes:
 * - Line 159 type safety: Use HTMLInputElement (not `as any`)
 * - Removed duplicate PO interface (now in types.ts)
 */

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import type { POTableCellProps } from "./types"
import { usePOExpansion } from "./hooks/use-po-expansion"
import { PORow } from "./components/po-row"
import { LineItemRow } from "./components/line-item-row"

export function POTableCell({ 
  pos, 
  selectedPO, 
  selectedPOs, 
  onPOSelect, 
  onPOsSelection 
}: POTableCellProps) {
  const { isExpanded, toggleExpanded } = usePOExpansion()

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onPOsSelection(pos.map((po) => po.id))
    } else {
      onPOsSelection([])
    }
  }

  const handleSelectPO = (poId: string, checked: boolean) => {
    if (checked) {
      onPOsSelection([...selectedPOs, poId])
    } else {
      onPOsSelection(selectedPOs.filter((id) => id !== poId))
    }
  }

  const allSelected = pos.length > 0 && selectedPOs.length === pos.length
  const someSelected = selectedPOs.length > 0 && selectedPOs.length < pos.length

  return (
    <Card className="h-full rounded-none border-0 border-r">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">PO Mapping</CardTitle>
        <p className="text-sm text-muted-foreground">Map purchase orders to project...</p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-auto h-[calc(100vh-200px)]">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    ref={(el) => {
                      // CRITICAL FIX: Use HTMLInputElement type (not `as any`)
                      // Original issue: po-table.tsx line 159
                      if (el) {
                        const checkbox = el as unknown as HTMLInputElement
                        checkbox.indeterminate = someSelected
                      }
                    }}
                  />
                </TableHead>
                <TableHead className="w-12"></TableHead>
                <TableHead>PO Number</TableHead>
                <TableHead>Vendor Name</TableHead>
                <TableHead>Total Value</TableHead>
                <TableHead>Creation Date</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>FMT PO</TableHead>
                <TableHead>Mapping Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pos.map((po) => (
                <>
                  <PORow
                    key={po.id}
                    po={po}
                    isExpanded={isExpanded(po.id)}
                    isSelected={selectedPO?.id === po.id}
                    isChecked={selectedPOs.includes(po.id)}
                    onToggleExpand={() => toggleExpanded(po.id)}
                    onSelect={() => onPOSelect(po)}
                    onCheckboxChange={(checked) => handleSelectPO(po.id, checked)}
                  />
                  {isExpanded(po.id) && (
                    <>
                      {po.line_items.map((item) => (
                        <LineItemRow key={item.id} item={item} />
                      ))}
                    </>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
