"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
// Define PO interface locally to avoid circular dependencies
interface PO {
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

interface POLineItem {
  id: string
  line_item_number: number
  part_number: string
  description: string
  quantity: number
  uom: string
  line_value: number
  is_mapped?: boolean
}
import { cn } from "@/lib/utils"

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

const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
)

const XCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
)

interface POTableProps {
  pos: PO[]
  selectedPO: PO | null
  selectedPOs: string[]
  onPOSelect: (po: PO) => void
  onPOsSelection: (poIds: string[]) => void
}

export function POTable({ pos, selectedPO, selectedPOs, onPOSelect, onPOsSelection }: POTableProps) {
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-AU", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const isPOFullyMapped = (po: PO) => {
    return po.mapped_count === po.total_line_items && (po.total_line_items ?? 0) > 0
  }

  const allSelected = pos.length > 0 && selectedPOs.length === pos.length
  const someSelected = selectedPOs.length > 0 && selectedPOs.length < pos.length

  return (
    <>
      <style jsx>{`
        .fmt-status-yes {
          background-color: #0014DC !important;
          color: #ffffff !important;
        }
        .fmt-status-no {
          background-color: #f3f4f6 !important;
          color: #374151 !important;
        }
      `}</style>
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
                        if (el) (el as any).indeterminate = someSelected
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
                    <TableRow
                      key={po.id}
                      className={cn(
                        "cursor-pointer hover:bg-muted/50",
                        selectedPO?.id === po.id && "bg-accent/10 border-l-4 border-l-primary",
                      )}
                      onClick={() => onPOSelect(po)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedPOs.includes(po.id)}
                          onCheckedChange={(checked) => handleSelectPO(po.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => toggleExpanded(po.id)}>
                          {expandedPOs.has(po.id) ? (
                            <ChevronDownIcon className="h-4 w-4" />
                          ) : (
                            <ChevronRightIcon className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">{po.po_number}</TableCell>
                      <TableCell>{po.vendor_name}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(po.total_value)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(po.po_creation_date)}</TableCell>
                      <TableCell>{po.location}</TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-medium",
                            po.fmt_po ? "fmt-status-yes" : "fmt-status-no",
                          )}
                        >
                          {po.fmt_po ? "Yes" : "No"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {isPOFullyMapped(po) ? (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 text-green-800 border border-green-200">
                            <CheckCircleIcon className="h-4 w-4" />
                            <span className="text-xs font-medium">Mapped</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                            <XCircleIcon className="h-4 w-4" />
                            <span className="text-xs font-medium">Not Mapped</span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                    {expandedPOs.has(po.id) && (
                      <>
                        {po.line_items.map((item) => (
                          <TableRow key={item.id} className="bg-muted/20">
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell className="text-sm font-medium pl-8">Line {item.line_item_number}</TableCell>
                            <TableCell className="text-sm">{item.part_number}</TableCell>
                            <TableCell className="text-right text-sm">{formatCurrency(item.line_value)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{item.description}</TableCell>
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
    </>
  )
}
