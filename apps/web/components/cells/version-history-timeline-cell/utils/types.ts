// Shared types for version history timeline cell

export interface TransformedVersion {
  id: string
  project_id: string
  version_number: number
  reason_for_change: string
  created_at: string
  created_by: string
}

export interface CostBreakdown {
  id: string
  cost_line: string
  spend_sub_category: string
  budget_cost: number
  forecasted_cost: number | null
}

export interface VersionChanges {
  totalChange: number
  changePercent: number
  itemsChanged: number
}

export interface VersionStatus {
  label: string
  variant: "default" | "secondary" | "destructive" | "outline"
}
