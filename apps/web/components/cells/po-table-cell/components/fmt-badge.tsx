/**
 * FMT PO Badge Component
 * 
 * Displays FMT status (Yes/No) with appropriate color.
 * Extracted from po-table.tsx lines 204-213
 */

import { cn } from "@/lib/utils"
import type { FMTBadgeProps } from "../types"

export function FMTBadge({ isFMT }: FMTBadgeProps) {
  return (
    <>
      <style jsx>{`
        .fmt-status-yes {
          background-color: #0014DC !important;
          color: #ffffff !important;
        }
        .fmt-status-no {
          background-color: #f3f4f6 !important;
          color: #374151 !important;
        }
      `}</style>
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-medium",
          isFMT ? "fmt-status-yes" : "fmt-status-no",
        )}
      >
        {isFMT ? "Yes" : "No"}
      </span>
    </>
  )
}
