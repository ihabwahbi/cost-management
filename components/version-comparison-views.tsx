"use client"

import React, { createContext, useContext, useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Eye, Columns2, Layers } from "lucide-react"

// View mode types
type ViewMode = "split" | "unified" | "overlay"

interface ViewModeContextValue {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
}

// Context for managing view mode
const ViewModeContext = createContext<ViewModeContextValue | null>(null)

export function ViewModeProvider({ children }: { children: React.ReactNode }) {
  const [viewMode, setViewMode] = useState<ViewMode>("split")
  
  const value = useMemo(
    () => ({
      viewMode,
      setViewMode,
    }),
    [viewMode]
  )
  
  return (
    <ViewModeContext.Provider value={value}>
      {children}
    </ViewModeContext.Provider>
  )
}

export function useViewMode() {
  const context = useContext(ViewModeContext)
  if (!context) {
    throw new Error("useViewMode must be used within a ViewModeProvider")
  }
  return context
}

// View Mode Toggle Component
export function ViewModeToggle() {
  const { viewMode, setViewMode } = useViewMode()
  
  return (
    <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as ViewMode)}>
      <ToggleGroupItem value="split" aria-label="Split view">
        <Columns2 className="h-4 w-4 mr-2" />
        Split
      </ToggleGroupItem>
      <ToggleGroupItem value="unified" aria-label="Unified view">
        <Eye className="h-4 w-4 mr-2" />
        Unified
      </ToggleGroupItem>
      <ToggleGroupItem value="overlay" aria-label="Overlay view">
        <Layers className="h-4 w-4 mr-2" />
        Overlay
      </ToggleGroupItem>
    </ToggleGroup>
  )
}

// Data display component for split view
interface DataDisplayProps {
  data: any[]
  versionLabel: string
  className?: string
}

function DataDisplay({ data, versionLabel, className = "" }: DataDisplayProps) {
  return (
    <div className={className}>
      <h4 className="text-sm font-semibold text-muted-foreground mb-2">{versionLabel}</h4>
      <ScrollArea className="h-full">
        <div className="space-y-2">
          {data.map((item, index) => (
            <Card key={index} className="p-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-sm">{item.cost_line}</p>
                  <p className="text-xs text-muted-foreground">{item.sub_category}</p>
                </div>
                <span className="font-semibold">
                  ${(item.amount || 0).toLocaleString()}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

// Split View Component
interface SplitViewProps {
  v1Data: any[]
  v2Data: any[]
}

export function SplitView({ v1Data, v2Data }: SplitViewProps) {
  return (
    <div className="grid grid-cols-2 gap-4 h-full">
      <DataDisplay data={v1Data} versionLabel="Version 1" className="border-r pr-4" />
      <DataDisplay data={v2Data} versionLabel="Version 2" className="pl-4" />
    </div>
  )
}

// Change Card for unified view
interface ChangeCardProps {
  change: {
    id: string
    type: "added" | "removed" | "modified" | "unchanged"
    cost_line: string
    sub_category: string
    v1_amount?: number | null
    v2_amount?: number | null
    change_amount: number
    change_percent: number
  }
}

function ChangeCard({ change }: ChangeCardProps) {
  const getBadgeVariant = (type: string) => {
    switch (type) {
      case "added":
        return "default"
      case "removed":
        return "destructive"
      case "modified":
        return "secondary"
      default:
        return "outline"
    }
  }
  
  const getChangeColor = (amount: number) => {
    if (amount > 0) return "text-green-600"
    if (amount < 0) return "text-red-600"
    return "text-gray-600"
  }
  
  return (
    <Card className="p-4">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={getBadgeVariant(change.type)} className="text-xs">
              {change.type}
            </Badge>
            <h4 className="font-medium text-sm">{change.cost_line}</h4>
          </div>
          <p className="text-xs text-muted-foreground">{change.sub_category}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2 text-sm">
        {change.v1_amount !== null && (
          <div>
            <span className="text-muted-foreground">V1:</span>{" "}
            <span className="font-medium">${(change.v1_amount || 0).toLocaleString()}</span>
          </div>
        )}
        {change.v2_amount !== null && (
          <div>
            <span className="text-muted-foreground">V2:</span>{" "}
            <span className="font-medium">${(change.v2_amount || 0).toLocaleString()}</span>
          </div>
        )}
        {change.type === "modified" && (
          <div className={getChangeColor(change.change_amount)}>
            <span className="font-medium">
              {change.change_amount > 0 ? "+" : ""}
              ${Math.abs(change.change_amount).toLocaleString()}
              {change.change_percent !== 0 && (
                <span className="text-xs ml-1">
                  ({change.change_percent > 0 ? "+" : ""}
                  {change.change_percent.toFixed(1)}%)
                </span>
              )}
            </span>
          </div>
        )}
      </div>
    </Card>
  )
}

// Unified View Component
interface UnifiedViewProps {
  changes: Array<{
    id: string
    type: "added" | "removed" | "modified" | "unchanged"
    cost_line: string
    sub_category: string
    v1_amount?: number | null
    v2_amount?: number | null
    change_amount: number
    change_percent: number
  }>
}

export function UnifiedView({ changes }: UnifiedViewProps) {
  const groupedChanges = useMemo(() => {
    return {
      added: changes.filter(c => c.type === "added"),
      removed: changes.filter(c => c.type === "removed"),
      modified: changes.filter(c => c.type === "modified"),
    }
  }, [changes])
  
  return (
    <div className="space-y-6">
      {groupedChanges.added.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <span className="text-green-600 mr-2">➕</span>
            Added ({groupedChanges.added.length} items)
          </h3>
          <div className="space-y-2">
            {groupedChanges.added.map(change => (
              <ChangeCard key={change.id} change={change} />
            ))}
          </div>
        </div>
      )}
      
      {groupedChanges.removed.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <span className="text-red-600 mr-2">➖</span>
            Removed ({groupedChanges.removed.length} items)
          </h3>
          <div className="space-y-2">
            {groupedChanges.removed.map(change => (
              <ChangeCard key={change.id} change={change} />
            ))}
          </div>
        </div>
      )}
      
      {groupedChanges.modified.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <span className="text-blue-600 mr-2">🔄</span>
            Modified ({groupedChanges.modified.length} items)
          </h3>
          <div className="space-y-2">
            {groupedChanges.modified.map(change => (
              <ChangeCard key={change.id} change={change} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Overlay View Component with opacity slider
interface OverlayViewProps {
  v1Data: any[]
  v2Data: any[]
}

export function OverlayView({ v1Data, v2Data }: OverlayViewProps) {
  const [opacity, setOpacity] = useState(50)
  
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium">Version 1</span>
        <input
          type="range"
          min="0"
          max="100"
          value={opacity}
          onChange={(e) => setOpacity(Number(e.target.value))}
          className="flex-1"
          aria-label="Opacity slider"
        />
        <span className="text-sm font-medium">Version 2</span>
        <span className="text-xs text-muted-foreground">{opacity}%</span>
      </div>
      
      <div className="relative">
        <div className="absolute inset-0" style={{ opacity: (100 - opacity) / 100 }}>
          <DataDisplay data={v1Data} versionLabel="Version 1" />
        </div>
        <div style={{ opacity: opacity / 100 }}>
          <DataDisplay data={v2Data} versionLabel="Version 2" />
        </div>
      </div>
    </div>
  )
}