"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/app-shell"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { FilterSidebar } from "@/components/filter-sidebar"
import { POTable } from "@/components/po-table"
import { DetailsPanel } from "@/components/cells/details-panel/component"
import { BatchActionBar } from "@/components/batch-action-bar"
import { createClient } from "@/lib/supabase/client"

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

interface CostBreakdown {
  id: string
  project_id: string
  sub_business_line: string
  cost_line: string
  spend_type: string
  spend_sub_category: string
  budget_cost: number
  project: {
    name: string
  }
}

export default function POMapping() {
  const [selectedPO, setSelectedPO] = useState<PO | null>(null)
  const [selectedPOs, setSelectedPOs] = useState<string[]>([])
  const [filteredPOs, setFilteredPOs] = useState<PO[]>([])
  const [allPOs, setAllPOs] = useState<PO[]>([])
  const [costBreakdowns, setCostBreakdowns] = useState<CostBreakdown[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  const fetchPOs = async () => {
    try {
      const { data: posData, error: posError } = await supabase
        .from("pos")
        .select("*")
        .order("po_creation_date", { ascending: false })

      if (posError) throw posError

      const { data: lineItemsData, error: lineItemsError } = await supabase
        .from("po_line_items")
        .select("*")
        .order("line_item_number", { ascending: true })

      if (lineItemsError) throw lineItemsError

      const { data: mappingsData, error: mappingsError } = await supabase.from("po_mappings").select("po_line_item_id")

      if (mappingsError) throw mappingsError

      const mappedLineItemIds = new Set(mappingsData.map((m) => m.po_line_item_id))

      const posWithLineItems: PO[] = posData.map((po) => {
        const poLineItems = lineItemsData
          .filter((item) => item.po_id === po.id)
          .map((item) => ({
            id: item.id,
            line_item_number: item.line_item_number,
            part_number: item.part_number,
            description: item.description,
            quantity: item.quantity,
            uom: item.uom,
            line_value: item.line_value,
            is_mapped: mappedLineItemIds.has(item.id),
          }))

        return {
          id: po.id,
          po_number: po.po_number,
          vendor_name: po.vendor_name,
          total_value: po.total_value,
          po_creation_date: po.po_creation_date,
          location: po.location,
          fmt_po: po.fmt_po,
          project_name: po.project_name || null,
          asset_code: po.asset_code || null,
          line_items: poLineItems,
          mapped_count: poLineItems.filter((item) => item.is_mapped).length,
          total_line_items: poLineItems.length,
        }
      })

      setAllPOs(posWithLineItems)
      setFilteredPOs(posWithLineItems)
    } catch (error) {
      console.error("Error fetching POs:", error)
    }
  }

  const fetchCostBreakdowns = async () => {
    try {
      const { data, error } = await supabase
        .from("cost_breakdown")
        .select(`
          *,
          project:projects(name)
        `)
        .order("created_at", { ascending: false })

      if (error) throw error

      setCostBreakdowns(data || [])
    } catch (error) {
      console.error("Error fetching cost breakdowns:", error)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchPOs(), fetchCostBreakdowns()])
      setLoading(false)
    }
    loadData()
  }, [])

  const handlePOSelect = (po: PO) => {
    setSelectedPO(po)
  }

  const handlePOsSelection = (poIds: string[]) => {
    setSelectedPOs(poIds)
  }

  const handleFilterChange = (filters: any) => {
    console.log("[v0] Applying filters:", filters)
    let filtered = allPOs

    if (filters.poNumbers && filters.poNumbers.trim()) {
      const poNumberList = filters.poNumbers.split(/[\n,\s]+/).filter(Boolean)
      filtered = filtered.filter((po) => poNumberList.some((num: string) => po.po_number.includes(num.trim())))
    }

    if (filters.dateRange?.from || filters.dateRange?.to) {
      filtered = filtered.filter((po) => {
        const poDate = new Date(po.po_creation_date)
        if (filters.dateRange.from && poDate < filters.dateRange.from) return false
        if (filters.dateRange.to && poDate > filters.dateRange.to) return false
        return true
      })
    }

    if (filters.location && filters.location !== "all") {
      filtered = filtered.filter((po) => po.location.toLowerCase() === filters.location.toLowerCase())
    }

    if (filters.fmtPo !== undefined) {
      filtered = filtered.filter((po) => po.fmt_po === filters.fmtPo)
    }

    if (filters.mappingStatus && filters.mappingStatus !== "all") {
      if (filters.mappingStatus === "mapped") {
        filtered = filtered.filter((po) => po.mapped_count && po.mapped_count > 0)
      } else if (filters.mappingStatus === "unmapped") {
        filtered = filtered.filter((po) => !po.mapped_count || po.mapped_count === 0)
      }
    }

    console.log("[v0] Filtered POs count:", filtered.length)
    setFilteredPOs(filtered)
  }

  const handleSaveMapping = async (poId: string, costBreakdownId: string, notes?: string) => {
    try {
      // Get all line items for this PO
      const selectedPOData = allPOs.find((po) => po.id === poId)
      if (!selectedPOData) {
        throw new Error("PO not found")
      }

      // Create mappings for all line items in the PO
      const mappingPromises = selectedPOData.line_items.map((lineItem) =>
        supabase.from("po_mappings").upsert({
          po_line_item_id: lineItem.id,
          cost_breakdown_id: costBreakdownId,
          mapped_amount: lineItem.line_value, // Use the line item's actual value
          mapping_notes: notes || null,
          mapped_by: "current_user",
        }),
      )

      const results = await Promise.all(mappingPromises)

      // Check if any mapping failed
      const errors = results.filter((result) => result.error)
      if (errors.length > 0) {
        throw errors[0].error
      }

      await fetchPOs()
      console.log("Mapping saved successfully")
      return true
    } catch (error) {
      console.error("Error saving mapping:", error)
      return false
    }
  }

  const handleMappingChange = async () => {
    await fetchPOs()
    // If we have a selected PO, update it with the latest data
    if (selectedPO) {
      const updatedPO = allPOs.find((po) => po.id === selectedPO.id)
      if (updatedPO) {
        setSelectedPO(updatedPO)
      }
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading PO data...</p>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="h-[calc(100vh-4rem)]">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <FilterSidebar onFilterChange={handleFilterChange} />
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={50} minSize={40}>
            <div className="relative h-full">
              <POTable
                pos={filteredPOs}
                selectedPO={selectedPO}
                selectedPOs={selectedPOs}
                onPOSelect={handlePOSelect}
                onPOsSelection={handlePOsSelection}
              />
              {selectedPOs.length > 0 && (
                <BatchActionBar
                  selectedCount={selectedPOs.length}
                  onAssignProject={() => console.log("Assign project")}
                  onAssignSpendCategory={() => console.log("Assign spend category")}
                  onClear={() => setSelectedPOs([])}
                />
              )}
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={30} minSize={25} maxSize={40}>
            <DetailsPanel
              selectedPO={selectedPO ? {
                id: selectedPO.id,
                poNumber: selectedPO.po_number
              } : null}
              onMappingChange={handleMappingChange}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </AppShell>
  )
}
