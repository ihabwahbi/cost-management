"use client"

import { format } from "date-fns"
import { formatCurrency } from "@/lib/budget-utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Clock,
  TrendingUp,
  TrendingDown,
  FileText,
  User,
  Calendar,
  Eye,
} from "lucide-react"

interface TransformedVersion {
  id: string
  project_id: string
  version_number: number
  reason_for_change: string
  created_at: string
  created_by: string
}

interface CostBreakdown {
  id: string
  cost_line: string
  spend_sub_category: string
  budget_cost: number
  forecasted_cost: number | null
}

interface VersionChanges {
  totalChange: number
  changePercent: number
  itemsChanged: number
}

interface VersionStatus {
  label: string
  variant: "default" | "secondary" | "destructive" | "outline"
}

interface VersionTimelineItemProps {
  version: TransformedVersion
  index: number
  currentVersion: number | "latest"
  isExpanded: boolean
  onToggleExpand: (versionId: string) => void
  onVersionSelect: (versionNumber: number) => void
  changes?: VersionChanges
  status: VersionStatus
  costBreakdown?: CostBreakdown[]
}

export function VersionTimelineItem({
  version,
  index,
  currentVersion,
  isExpanded,
  onToggleExpand,
  onVersionSelect,
  changes,
  status,
  costBreakdown,
}: VersionTimelineItemProps) {
  const isActive = 
    currentVersion === version.version_number ||
    (currentVersion === "latest" && index === 0)

  return (
    <div className="relative flex gap-4 pb-8">
      {/* Timeline dot */}
      <div
        className={`
          relative z-10 flex items-center justify-center w-10 h-10 rounded-full
          ${isActive 
            ? "bg-blue-600 text-white" 
            : "bg-white border-2 border-gray-300 text-gray-600"}
        `}
      >
        <span className="text-sm font-semibold">
          {version.version_number === 0 ? "Init" : `v${version.version_number}`}
        </span>
      </div>

      {/* Version card */}
      <div className="flex-1">
        <Card 
          className={`
            cursor-pointer transition-all hover:shadow-md
            ${isActive ? "ring-2 ring-blue-600 ring-offset-2" : ""}
          `}
          onClick={() => onToggleExpand(isExpanded ? "" : version.id)}
        >
          <CardContent className="p-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-sm">
                  {version.version_number === 0 
                    ? "Initial Budget" 
                    : `Version ${version.version_number}`}
                </h4>
                <Badge variant={status.variant}>
                  {status.label}
                </Badge>
                {isActive && (
                  <Badge variant="default" className="bg-blue-600">
                    Current
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onVersionSelect(version.version_number)
                }}
              >
                <Eye className="w-4 h-4" />
              </Button>
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(version.created_at), "MMM d, yyyy")}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {format(new Date(version.created_at), "h:mm a")}
              </div>
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {version.created_by}
              </div>
            </div>

            {/* Reason for change */}
            <div className="mb-3">
              <p className="text-sm text-gray-700">
                <FileText className="w-3 h-3 inline mr-1" />
                {version.reason_for_change}
              </p>
            </div>

            {/* Change summary (only if changes provided) */}
            {version.version_number > 0 && changes && (
              <div className="flex items-center gap-4 pt-3 border-t">
                <div className="flex items-center gap-1">
                  {changes.totalChange >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      changes.totalChange >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatCurrency(Math.abs(changes.totalChange))}
                  </span>
                </div>
                <div className="text-xs text-gray-600">
                  {changes.changePercent !== 0 && (
                    <span>
                      ({changes.changePercent > 0 ? "+" : ""}
                      {changes.changePercent.toFixed(1)}%)
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-600">
                  {changes.itemsChanged} items changed
                </div>
              </div>
            )}

            {/* Expanded details */}
            {isExpanded && costBreakdown && costBreakdown.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h5 className="text-xs font-semibold text-gray-700 mb-2">
                  Top Changes
                </h5>
                <div className="space-y-1">
                  {costBreakdown
                    .slice(0, 3)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between text-xs"
                      >
                        <span className="text-gray-600">
                          {item.cost_line} - {item.spend_sub_category}
                        </span>
                        <span className="font-medium">
                          {formatCurrency(
                            item.forecasted_cost || item.budget_cost
                          )}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
