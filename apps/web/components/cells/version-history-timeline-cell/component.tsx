"use client"

import { useState, useMemo } from "react"
import { trpc } from "@/lib/trpc"
import { getVersionStatus, calculateVersionChanges, type CostBreakdown } from "@/lib/version-utils"
import { useCompareDialog } from "@/lib/hooks/use-compare-dialog"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { GitCompare, Download } from "lucide-react"
import { VersionCompareDialog } from "./components/version-compare-dialog"
import { VersionTimelineItem } from "./components/version-timeline-item"

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
                const isExpanded = expandedVersion === version.id

                return (
                  <VersionTimelineItem
                    key={version.id}
                    version={version}
                    index={index}
                    currentVersion={currentVersion}
                    isExpanded={isExpanded}
                    onToggleExpand={(versionId) => setExpandedVersion(isExpanded ? null : versionId)}
                    onVersionSelect={onVersionSelect}
                    changes={changes}
                    status={status}
                    costBreakdown={costBreakdowns?.[version.version_number]}
                  />
                )
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Compare Versions Dialog */}
      <VersionCompareDialog
        open={showCompareDialog}
        onOpenChange={handleDialogOpenChange}
        versions={sortedVersions}
        compareFrom={compareFrom}
        compareTo={compareTo}
        setCompareFrom={setCompareFrom}
        setCompareTo={setCompareTo}
        onCompare={handleCompare}
      />
    </>
  )
}
