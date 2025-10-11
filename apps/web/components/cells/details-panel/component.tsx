'use client'

import { useState, useEffect } from 'react'
import { DetailsPanelViewer } from '@/components/cells/details-panel-viewer/component'
import { DetailsPanelSelector } from '@/components/cells/details-panel-selector/component'
import { DetailsPanelMapper } from '@/components/cells/details-panel-mapper/component'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface DetailsPanelProps {
  selectedPO: { id: string; poNumber: string } | null
  onMappingChange?: () => Promise<void>
}

/**
 * DetailsPanel - Main Orchestrator Cell
 * 
 * Coordinates 3 sub-cells:
 * - DetailsPanelViewer: Display existing mappings
 * - DetailsPanelSelector: Cascading dropdowns
 * - DetailsPanelMapper: CRUD operations
 * 
 * Behavioral Assertions:
 * - BA-010: Shows empty state when no PO selected
 * - BA-011: Shows 'Not Mapped' state with create button
 * - BA-012: Resets all states when PO changes
 */
export function DetailsPanel({ selectedPO, onMappingChange }: DetailsPanelProps) {
  const [selectedProject, setSelectedProject] = useState('')
  const [selectedSpendType, setSelectedSpendType] = useState('')
  const [selectedSpendSubCategory, setSelectedSpendSubCategory] = useState('')
  const [costBreakdownId, setCostBreakdownId] = useState<string | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [existingMappings, setExistingMappings] = useState<Array<{ id: string; poLineItemId: string }>>([])
  const [hasDataLoaded, setHasDataLoaded] = useState(false)
  
  // BA-012: Reset all state when PO changes
  useEffect(() => {
    setSelectedProject('')
    setSelectedSpendType('')
    setSelectedSpendSubCategory('')
    setCostBreakdownId(null)
    setIsEditMode(false)
    setExistingMappings([])
    setHasDataLoaded(false)
  }, [selectedPO?.id])
  
  const handleMappingComplete = async () => {
    // Reset state
    setSelectedProject('')
    setSelectedSpendType('')
    setSelectedSpendSubCategory('')
    setCostBreakdownId(null)
    setIsEditMode(false)
    
    // Call parent callback to refresh PO table
    if (onMappingChange) {
      await onMappingChange()
    }
  }
  
  const handleViewerDataLoaded = (mappings: Array<{ id: string; poLineItemId: string }>) => {
    setExistingMappings(mappings)
    setHasDataLoaded(true)
    if (mappings.length > 0) {
      setIsEditMode(false)
    }
  }
  
  // BA-010: Empty state when no PO selected
  if (!selectedPO) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-500 text-center">Select a PO to view details</p>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>PO Details - {selectedPO.poNumber}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Viewer - always visible if mappings exist (GREEN CARD) */}
        <DetailsPanelViewer 
          key={selectedPO.id}
          poId={selectedPO.id}
          onMappingsLoaded={handleViewerDataLoaded}
        />
        
        {/* BA-011: Show unmapped state in RED CARD if no mappings and not editing */}
        {existingMappings.length === 0 && !isEditMode && hasDataLoaded && (
          <Card className="border-red-500 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Not Mapped
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-red-700">
                This PO has not been mapped to a cost breakdown. Click "Create Mapping" to assign it.
              </p>
            </CardContent>
          </Card>
        )}
        
        {/* Show create/edit UI ONLY when in edit mode (after clicking button) */}
        {isEditMode && (
          <>
            <DetailsPanelSelector
              selectedProject={selectedProject}
              selectedSpendType={selectedSpendType}
              selectedSpendSubCategory={selectedSpendSubCategory}
              onProjectChange={setSelectedProject}
              onSpendTypeChange={setSelectedSpendType}
              onSubCategoryChange={setSelectedSpendSubCategory}
              onCostBreakdownFound={setCostBreakdownId}
            />
            
            <DetailsPanelMapper
              poId={selectedPO.id}
              costBreakdownId={costBreakdownId}
              existingMappings={existingMappings}
              isEditMode={existingMappings.length > 0}
              onMappingComplete={handleMappingComplete}
            />
          </>
        )}
        
        {/* BA-011: Show create button if no mappings */}
        {existingMappings.length === 0 && !isEditMode && hasDataLoaded && (
          <div className="flex justify-center">
            <Button onClick={() => setIsEditMode(true)}>
              Create Mapping
            </Button>
          </div>
        )}
        
        {/* Show edit button if mappings exist and not in edit mode */}
        {existingMappings.length > 0 && !isEditMode && (
          <div className="flex justify-center">
            <Button variant="outline" onClick={() => setIsEditMode(true)}>
              Edit Mapping
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
