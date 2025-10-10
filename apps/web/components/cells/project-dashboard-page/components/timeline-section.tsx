/**
 * Timeline Section Component
 * 
 * Renders Budget vs Actual Timeline chart
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BudgetTimelineChartCell } from '@/components/cells/budget-timeline-chart/component'

export interface TimelineSectionProps {
  projectId: string
}

/**
 * Renders Budget vs Actual timeline section
 * 
 * Wraps BudgetTimelineChartCell in Card for consistent styling
 */
export function TimelineSection({ projectId }: TimelineSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget vs Actual Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <BudgetTimelineChartCell projectId={projectId} />
      </CardContent>
    </Card>
  )
}
