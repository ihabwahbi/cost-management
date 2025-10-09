/**
 * KPI Section Component
 * 
 * Simple wrapper for KPICard Cell
 */

import { KPICard } from '@/components/cells/kpi-card/component'

export interface KPISectionProps {
  projectId: string
}

/**
 * Renders KPI metrics section
 * 
 * Delegates to KPICard Cell which fetches its own data
 */
export function KPISection({ projectId }: KPISectionProps) {
  return <KPICard projectId={projectId} />
}
