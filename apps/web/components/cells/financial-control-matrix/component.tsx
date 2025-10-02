'use client'

import { useMemo } from 'react'
import { trpc } from '@/lib/trpc'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { FinancialControlMatrix } from './financial-control-matrix'

interface FinancialControlMatrixCellProps {
  projectId: string
  filters?: {
    costLine?: string
    spendType?: string
  }
  onDrillDown?: (category: string) => void
  onCustomize?: () => void
}

export function FinancialControlMatrixCell({
  projectId,
  filters,
  onDrillDown,
  onCustomize,
}: FinancialControlMatrixCellProps) {
  // ✅ CRITICAL: Memoize query input to prevent infinite render loop
  const queryInput = useMemo(() => ({
    projectId,
    filters: filters || undefined,
  }), [projectId, filters])
  
  const { data, isLoading, error } = trpc.dashboard.getFinancialControlMetrics.useQuery(
    queryInput,
    {
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,  // 5 minutes (dashboard data)
      retry: 1,
    }
  )
  
  // Error State
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Failed to Load Financial Control Matrix</AlertTitle>
        <AlertDescription>
          {error.message || 'Unable to fetch financial control metrics. Please try again.'}
        </AlertDescription>
      </Alert>
    )
  }
  
  // Pass data to presentation component
  return (
    <FinancialControlMatrix
      categories={data || []}
      onDrillDown={onDrillDown}
      onCustomize={onCustomize}
      loading={isLoading}
    />
  )
}
