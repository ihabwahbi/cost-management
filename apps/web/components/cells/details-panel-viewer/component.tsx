'use client'

import { useEffect, useMemo } from 'react'
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
  const { data, isLoading, error, refetch } = trpc.poMapping.getExistingMappings.useQuery(
    { poId: poId! },
    { 
      enabled: !!poId,
      refetchOnMount: true, // Changed: Allow refetch to catch updates
      refetchOnWindowFocus: false,
      staleTime: 1000 // Changed: 1 second to ensure fresh data after mutations
    }
  )
  
  // Notify parent component when mappings data loads
  useEffect(() => {
    if (data && onMappingsLoaded) {
      const mappingsData = data.map(m => ({ 
        id: m.id, 
        poLineItemId: m.poLineItemId 
      }))
      onMappingsLoaded(mappingsData)
    } else if (!data && !isLoading && onMappingsLoaded) {
      onMappingsLoaded([])
    }
  }, [data, isLoading]) // Removed callback from deps - event handlers don't need to be dependencies
  
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
  
  // Aggregate PO-level summary from line item mappings
  const poSummary = useMemo(() => {
    if (!data || data.length === 0) return null
    
    // All line items are mapped to the same cost breakdown (PO-level mapping)
    // Take cost breakdown info from first item
    const firstMapping = data[0]
    
    // Calculate total mapped amount across all line items
    const totalMappedAmount = data.reduce((sum, mapping) => {
      const amount = parseFloat(mapping.mappedAmount) || 0
      return sum + amount
    }, 0)
    
    // Calculate total PO value from line items
    const totalPOValue = data.reduce((sum, mapping) => {
      const value = parseFloat(mapping.lineValue || '0') || 0
      return sum + value
    }, 0)
    
    return {
      lineItemCount: data.length,
      totalMappedAmount: totalMappedAmount.toString(),
      totalPOValue: totalPOValue.toString(),
      costLine: firstMapping.costLine,
      spendType: firstMapping.spendType,
      spendSubCategory: firstMapping.spendSubCategory,
      mappingNotes: firstMapping.mappingNotes // Same notes for all line items
    }
  }, [data])
  
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
  if (!data || data.length === 0 || !poSummary) {
    return null
  }
  
  // BA-001: Display PO-level mapping in green card (MAPPED STATE)
  return (
    <Card className="border-green-500 bg-green-50">
      <CardHeader>
        <CardTitle className="text-green-800 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          PO Mapped
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-white p-4 rounded-lg border border-green-200">
          {/* PO Summary */}
          <div className="mb-4 pb-4 border-b border-green-100">
            <div className="text-sm font-medium text-gray-500 mb-2">PO Summary</div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Line Items:</span>
                <span className="ml-2 font-semibold">{poSummary.lineItemCount}</span>
              </div>
              <div>
                <span className="text-gray-600">Total PO Value:</span>
                <span className="ml-2 font-semibold">{formatCurrency(poSummary.totalPOValue)}</span>
              </div>
            </div>
          </div>
          
          {/* Cost Breakdown Mapping */}
          <div>
            <div className="text-sm font-medium text-gray-500 mb-2">Mapped To</div>
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant="secondary" className="text-sm">{poSummary.costLine}</Badge>
              <Badge variant="outline" className="text-sm">{poSummary.spendType}</Badge>
              <Badge variant="outline" className="text-sm">{poSummary.spendSubCategory}</Badge>
            </div>
            <div className="text-sm">
              <span className="text-gray-600">Total Mapped Amount:</span>
              <span className="ml-2 font-semibold text-green-700">
                {formatCurrency(poSummary.totalMappedAmount)}
              </span>
            </div>
          </div>
          
          {/* Mapping Notes (if present) */}
          {poSummary.mappingNotes && (
            <div className="mt-4 pt-4 border-t border-green-100">
              <div className="text-xs font-medium text-gray-500 mb-1">Mapping Notes</div>
              <div className="text-sm text-gray-700">{poSummary.mappingNotes}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
