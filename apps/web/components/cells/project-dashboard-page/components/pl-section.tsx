/**
 * P&L Section Component
 * 
 * Simple wrapper for PLCommandCenter Cell
 */

import { PLCommandCenter } from '@/components/cells/pl-command-center/component'

export interface PLSectionProps {
  projectId: string
}

/**
 * Renders P&L Command Center section
 * 
 * Delegates to PLCommandCenter Cell which fetches its own data
 */
export function PLSection({ projectId }: PLSectionProps) {
  return (
    <PLCommandCenter
      projectId={projectId}
      onViewGapAnalysis={() => {
        console.log('[Dashboard] View gap analysis')
      }}
    />
  )
}
