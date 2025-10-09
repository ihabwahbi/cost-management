"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { trpc } from "@/lib/trpc"
import { AppShell } from "@/components/cells/app-shell-cell/component"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { FilterSidebarCell } from "@/components/cells/filter-sidebar-cell/component"
import { POTable } from "@/components/po-table"
import { DetailsPanel } from "@/components/cells/details-panel/component"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { POFilters } from "@/types/filters"

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

export default function POMapping() {
  const [selectedPO, setSelectedPO] = useState<PO | null>(null)
  const [currentFilters, setCurrentFilters] = useState<POFilters>({})
  
  // Track if we've loaded data at least once (prevents UI unmount on filter changes)
  const hasLoadedOnce = useRef(false)

  const queryInput = useMemo(() => ({
    poNumbers: currentFilters.poNumbers,
    dateRange: currentFilters.dateRange?.from && currentFilters.dateRange?.to ? {
      from: currentFilters.dateRange.from.toISOString(),
      to: currentFilters.dateRange.to.toISOString()
    } : undefined,
    location: currentFilters.location,
    fmtPo: currentFilters.fmtPo,
    mappingStatus: currentFilters.mappingStatus,
    limit: 100,
    offset: 0
  }), [currentFilters])

  const { data: posData, isLoading, error, refetch, isFetching } = 
    trpc.poMapping.getPOsWithLineItems.useQuery(queryInput, {
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    })

  useEffect(() => {
    if (posData) {
      hasLoadedOnce.current = true
    }
  }, [posData])

  const transformedPOs: PO[] = useMemo(() => {
    if (!posData) return []
    
    return posData.map(po => ({
      id: po.id,
      po_number: po.poNumber,
      vendor_name: po.vendorName,
      total_value: Number(po.totalValue),
      po_creation_date: po.poCreationDate,
      location: po.location,
      fmt_po: po.fmtPo,
      project_name: null,
      asset_code: null,
      line_items: po.lineItems.map(item => ({
        id: item.id,
        line_item_number: item.lineItemNumber,
        part_number: item.partNumber,
        description: item.description,
        quantity: Number(item.quantity),
        uom: item.uom,
        line_value: Number(item.lineValue),
        is_mapped: item.isMapped
      })),
      mapped_count: po.mappedCount,
      total_line_items: po.totalLineItems
    }))
  }, [posData])

  const bulkCreateMappings = trpc.poMapping.bulkCreateMappings.useMutation({
    onSuccess: () => {
      refetch()
    },
    onError: (error) => {
      console.error("Failed to create mappings:", error.message)
    }
  })

  const handleFilterChange = (filters: POFilters) => {
    setCurrentFilters(filters)
  }

  const handleMappingChange = async () => {
    await refetch()
  }

  // Show loading screen only on very first load
  if (!hasLoadedOnce.current && isLoading) {
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

  if (error) {
    return (
      <AppShell>
        <div className="h-[calc(100vh-4rem)] flex items-center justify-center p-4">
          <Alert variant="destructive" className="max-w-md">
            <AlertTitle>Error Loading POs</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="h-[calc(100vh-4rem)] relative">
        {/* Loading overlay for filter changes (preserves UI state) */}
        {isFetching && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground text-sm">Applying filters...</p>
            </div>
          </div>
        )}
        
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <FilterSidebarCell onFilterChange={handleFilterChange} />
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={50} minSize={40}>
            <POTable
              pos={transformedPOs}
              selectedPO={selectedPO}
              selectedPOs={[]}
              onPOSelect={setSelectedPO}
              onPOsSelection={() => {}}
            />
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
