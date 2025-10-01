"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const FolderOpenIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M22,19a2,2,0,0,1-2,2H4a2,2,0,0,1-2-2V5A2,2,0,0,1,4,3H9l2,3h9a2,2,0,0,1,2,2Z" />
  </svg>
)

const TagIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M20.59,13.41l-7.17,7.17a2,2,0,0,1-2.83,0L2,12V2H12l8.59,8.59A2,2,0,0,1,20.59,13.41Z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
)

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

interface BatchActionBarProps {
  selectedCount: number
  onAssignProject: () => void
  onAssignSpendCategory: () => void
  onClear: () => void
}

export function BatchActionBar({
  selectedCount,
  onAssignProject,
  onAssignSpendCategory,
  onClear,
}: BatchActionBarProps) {
  return (
    <Card className="absolute bottom-4 left-4 right-4 border shadow-lg">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="px-3 py-1">
            {selectedCount} selected
          </Badge>
          <div className="flex gap-2">
            <Button size="sm" onClick={onAssignProject}>
              <FolderOpenIcon className="mr-2 h-4 w-4" />
              Assign Project
            </Button>
            <Button size="sm" variant="outline" onClick={onAssignSpendCategory}>
              <TagIcon className="mr-2 h-4 w-4" />
              Assign Spend Category
            </Button>
          </div>
        </div>
        <Button size="sm" variant="ghost" onClick={onClear}>
          <XIcon className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  )
}
