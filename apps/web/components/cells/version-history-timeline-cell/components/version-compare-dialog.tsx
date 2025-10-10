"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { GitCompare } from "lucide-react"

interface TransformedVersion {
  id: string
  project_id: string
  version_number: number
  reason_for_change: string
  created_at: string
  created_by: string
}

interface VersionCompareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  versions: TransformedVersion[]
  compareFrom: number | null
  compareTo: number | null
  setCompareFrom: (version: number | null) => void
  setCompareTo: (version: number | null) => void
  onCompare: () => void
}

export function VersionCompareDialog({
  open,
  onOpenChange,
  versions,
  compareFrom,
  compareTo,
  setCompareFrom,
  setCompareTo,
  onCompare,
}: VersionCompareDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              {versions.map((v) => (
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
              {versions
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
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={onCompare}
            disabled={compareFrom === null || compareTo === null}
          >
            <GitCompare className="w-4 h-4 mr-2" />
            Compare
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
