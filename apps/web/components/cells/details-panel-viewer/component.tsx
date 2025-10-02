'use client'

import { useEffect } from 'react'
import { trpc } from '@/lib/trpc'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface DetailsPanelViewerProps {
  poId: string | null
  onEditMapping?: (mappingId: string) => void
  onMappingsLoaded?: (mappings: Array<{ id: string; poLineItemId: string }>) => void
}

export function DetailsPanelViewer({ poId, onEditMapping, onMappingsLoaded }: DetailsPanelViewerProps) {
  // No memoization needed - poId is primitive string
  const { data, isLoading, error } = trpc.poMapping.getExistingMappings.useQuery(
    { poId: poId! },
    { 
      enabled: !!poId,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000 // 5 minutes
    }
  )
  
  // Notify parent component when mappings data loads
  useEffect(() => {
    if (data && onMappingsLoaded) {
      // Extract just id and poLineItemId for orchestrator state management
      const mappingsData = data.map(m => ({ 
        id: m.id, 
        poLineItemId: m.poLineItemId 
      }))
      onMappingsLoaded(mappingsData)
    } else if (!data && onMappingsLoaded) {
      // No mappings - notify with empty array
      onMappingsLoaded([])
    }
  }, [data, onMappingsLoaded])
  
  // BA-002: Currency formatting helper - shows 'N/A' for null/invalid
  const formatCurrency = (value: string | null) => {
    if (!value || value === 'null') return 'N/A'
    const num = parseFloat(value)
    if (isNaN(num)) return 'N/A'
    // BA-003: Format as AUD with no decimals
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      maximumFractionDigits: 0
    }).format(num)
  }
  
  // Don't render if no PO selected
  if (!poId) return null
  
  // Loading state
  if (isLoading) {
    return (
      <Card className="border-green-500 bg-green-50">
        <CardContent className="pt-6">
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    )
  }
  
  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Error loading mappings: {error.message}
        </AlertDescription>
      </Alert>
    )
  }
  
  // No mappings - don't display viewer (empty state handled by parent)
  if (!data || data.length === 0) {
    return null
  }
  
  // BA-001: Display mappings in green card
  return (
    <Card className="border-green-500 bg-green-50">
      <CardHeader>
        <CardTitle className="text-green-800 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Current Mappings ({data.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((mapping) => (
            <div 
              key={mapping.id} 
              className="bg-white p-4 rounded-lg border border-green-200"
            >
              <div className="grid grid-cols-2 gap-4">
                {/* Line Item Info */}
                <div>
                  <div className="text-sm font-medium text-gray-500">Line Item</div>
                  <div className="text-sm">
                    #{mapping.lineItemNumber} - {mapping.description}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Qty: {mapping.quantity} | Value: {formatCurrency(mapping.lineValue)}
                  </div>
                </div>
                
                {/* Cost Breakdown Info */}
                <div>
                  <div className="text-sm font-medium text-gray-500">Mapped To</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <Badge variant="secondary">{mapping.costLine}</Badge>
                    <Badge variant="outline">{mapping.spendType}</Badge>
                    <Badge variant="outline">{mapping.spendSubCategory}</Badge>
                  </div>
                  <div className="text-sm font-semibold text-green-700 mt-2">
                    Mapped: {formatCurrency(mapping.mappedAmount)}
                  </div>
                </div>
              </div>
              
              {/* Mapping Notes (if present) */}
              {mapping.mappingNotes && (
                <div className="mt-3 pt-3 border-t border-green-100">
                  <div className="text-xs font-medium text-gray-500">Notes</div>
                  <div className="text-sm text-gray-700">{mapping.mappingNotes}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
