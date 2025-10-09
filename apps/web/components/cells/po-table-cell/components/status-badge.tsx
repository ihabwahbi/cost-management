/**
 * Mapping Status Badge Component
 * 
 * Displays mapping status with appropriate icon and color.
 * Extracted from po-table.tsx lines 214-226
 */

import type { StatusBadgeProps } from "../types"

const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
)

const XCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
)

export function StatusBadge({ isMapped }: StatusBadgeProps) {
  if (isMapped) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 text-green-800 border border-green-200">
        <CheckCircleIcon className="h-4 w-4" />
        <span className="text-xs font-medium">Mapped</span>
      </div>
    )
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 text-red-700 border border-red-200">
      <XCircleIcon className="h-4 w-4" />
      <span className="text-xs font-medium">Not Mapped</span>
    </div>
  )
}
