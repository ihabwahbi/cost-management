"use client"

import { useState, useMemo } from "react"
import { format } from "date-fns"
import { trpc } from "@/lib/trpc"
import { getVersionStatus, calculateVersionChanges, type CostBreakdown } from "@/lib/version-utils"
import { formatCurrency } from "@/lib/budget-utils"
import { useCompareDialog } from "@/lib/hooks/use-compare-dialog"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Clock,
  TrendingUp,
  TrendingDown,
  FileText,
  User,
  Calendar,
  Eye,
  GitCompare,
  Download,
} from "lucide-react"

interface VersionHistoryTimelineCellProps {
  projectId: string
  currentVersion: number | "latest"
  onVersionSelect: (version: number) => void
  onCompareVersions?: (v1: number, v2: number) => void
  costBreakdowns?: Record<number, CostBreakdown[]>
}

export function VersionHistoryTimelineCell({
  projectId,
  currentVersion,
  onVersionSelect,
  onCompareVersions,
  costBreakdowns,
}: VersionHistoryTimelineCellProps) {
  // Self-fetching with tRPC
  const { data: versions, isLoading, error } = trpc.forecasts.getForecastVersions.useQuery(
    { projectId },
    {
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000,
      retry: 1,
    }
  )
  // Dialog state management via custom hook
  const {
    showDialog: showCompareDialog,
    compareFrom,
    compareTo,
    setCompareFrom,
    setCompareTo,
    handleOpenChange: handleDialogOpenChange,
    handleCompare,
  } = useCompareDialog(onCompareVersions)
  // Local state (1 variable)
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null)
  // Transform camelCase → snake_case (CRITICAL: memoized to prevent infinite loops)
  const transformedVersions = useMemo(() => {
    if (!versions) return []
    
    return versions.map(v => ({
      id: v.id,
      project_id: v.projectId,
      version_number: v.versionNumber,
      reason_for_change: v.reasonForChange,
      created_at: v.createdAt ?? '',
      created_by: v.createdBy ?? '',
    }))
  }, [versions])
  // Sort versions (CRITICAL: memoized to prevent infinite loops - TP-001 fix)
  const sortedVersions = useMemo(
    () => [...transformedVersions].sort((a, b) => b.version_number - a.version_number),
    [transformedVersions]
  )

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Version History</CardTitle>
          <CardDescription>Loading versions...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Version History</CardTitle>
          <CardDescription className="text-destructive">
            Error loading versions: {error.message}
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  // Empty state
  if (!sortedVersions || sortedVersions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Version History</CardTitle>
          <CardDescription>No forecast versions yet</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  // Success state - render timeline
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Version History</CardTitle>
              <CardDescription>
                Track changes and evolution of budget assumptions
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDialogOpenChange(true)}
                disabled={sortedVersions.length < 2}
              >
                <GitCompare className="w-4 h-4 mr-2" />
                Compare
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {/* Export functionality */}}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-9 top-0 bottom-0 w-0.5 bg-gray-200"></div>

              {/* Version items */}
              {sortedVersions.map((version, index) => {
                const changes = calculateVersionChanges(version.version_number, costBreakdowns)
                const status = getVersionStatus(version.created_at)
                const isActive = 
                  currentVersion === version.version_number ||
                  (currentVersion === "latest" && index === 0)
                const isExpanded = expandedVersion === version.id

                return (
                  <div key={version.id} className="relative flex gap-4 pb-8">
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
                        onClick={() => setExpandedVersion(isExpanded ? null : version.id)}
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

                          {/* Change summary (only if costBreakdowns provided) */}
                          {version.version_number > 0 && costBreakdowns && (
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
                          {isExpanded && costBreakdowns?.[version.version_number] && (
                            <div className="mt-4 pt-4 border-t">
                              <h5 className="text-xs font-semibold text-gray-700 mb-2">
                                Top Changes
                              </h5>
                              <div className="space-y-1">
                                {costBreakdowns[version.version_number]
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
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Compare Versions Dialog */}
      <Dialog open={showCompareDialog} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Compare Versions</DialogTitle>
            <DialogDescription>
              Select two versions to see the differences between them
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <label className="text-sm font-medium">From Version</label>
              <select
                className="w-full mt-1 px-3 py-2 border rounded-md"
                value={compareFrom !== null ? compareFrom : ""}
                onChange={(e) => setCompareFrom(e.target.value ? Number(e.target.value) : null)}
                aria-label="Select from version"
              >
                <option value="">Select version</option>
                {sortedVersions.map((v) => (
                  <option key={v.id} value={v.version_number}>
                    Version {v.version_number}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">To Version</label>
              <select
                className="w-full mt-1 px-3 py-2 border rounded-md"
                value={compareTo !== null ? compareTo : ""}
                onChange={(e) => setCompareTo(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Select version</option>
                {sortedVersions
                  .filter((v) => compareFrom === null || v.version_number !== compareFrom)
                  .map((v) => (
                    <option key={v.id} value={v.version_number}>
                      Version {v.version_number}
                    </option>
                  ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => handleDialogOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCompare}
              disabled={compareFrom === null || compareTo === null}
            >
              <GitCompare className="w-4 h-4 mr-2" />
              Compare
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
