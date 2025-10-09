/**
 * Financial Control Matrix Section Component
 * 
 * Simple wrapper for FinancialControlMatrixCell
 */

import { FinancialControlMatrixCell } from '@/components/cells/financial-control-matrix/component'

export interface FinancialMatrixSectionProps {
  projectId: string
}

/**
 * Renders Financial Control Matrix section
 * 
 * Delegates to FinancialControlMatrixCell which fetches its own data
 */
export function FinancialMatrixSection({ projectId }: FinancialMatrixSectionProps) {
  return (
    <FinancialControlMatrixCell
      projectId={projectId}
      onDrillDown={(category) => {
        console.log('[Dashboard] Drill down into:', category)
      }}
      onCustomize={() => {
        console.log('[Dashboard] Customize matrix view')
      }}
    />
  )
}
