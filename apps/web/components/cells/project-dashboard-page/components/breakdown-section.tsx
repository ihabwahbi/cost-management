/**
 * Breakdown Section Component
 * 
 * Renders detailed cost breakdown table
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { HierarchicalCostView } from '@/components/cells/hierarchical-cost-view/component'
import type { HierarchyNode, CostBreakdownRow } from '../types'

export interface BreakdownSectionProps {
  /** Hierarchical breakdown data */
  breakdownData: HierarchyNode[]
}

/**
 * Renders detailed cost breakdown table section
 * 
 * Takes hierarchy data from parent and passes to table component
 */
export function BreakdownSection({ breakdownData }: BreakdownSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Detailed Cost Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Phase C: Type assertion - API data has 'level' at runtime even though type doesn't declare it */}
        <HierarchicalCostView data={breakdownData as CostBreakdownRow[]} />
      </CardContent>
    </Card>
  )
}
