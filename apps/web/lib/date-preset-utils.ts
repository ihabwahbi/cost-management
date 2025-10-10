import type { DateRange } from "react-day-picker"

export interface DatePreset {
  label: string
  range: DateRange
}

export interface DatePresets {
  recent: DatePreset[]
  periods: DatePreset[]
}

/**
 * Generate date preset options for filtering
 * Extracted from filter-sidebar.tsx lines 46-83
 * 
 * IMPROVEMENT: Dead code removed (last90Days from lines 57-58)
 */
export function getDatePresets(): DatePresets {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const last7Days = new Date(today)
  last7Days.setDate(last7Days.getDate() - 7)

  const last30Days = new Date(today)
  last30Days.setDate(last30Days.getDate() - 30)

  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)
  const thisQuarter = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1)
  const thisYear = new Date(today.getFullYear(), 0, 1)

  return {
    recent: [
      { label: "Today", range: { from: today, to: today } },
      { label: "Yesterday", range: { from: yesterday, to: yesterday } },
      { label: "Last 7 days", range: { from: last7Days, to: today } },
      { label: "Last 30 days", range: { from: last30Days, to: today } },
    ],
    periods: [
      { label: "This month", range: { from: thisMonth, to: today } },
      { label: "Last month", range: { from: lastMonth, to: lastMonthEnd } },
      { label: "This quarter", range: { from: thisQuarter, to: today } },
      { label: "This year", range: { from: thisYear, to: today } },
    ],
  }
}

/**
 * Format date for display (e.g., "Jan 15, 2025")
 * Extracted from filter-sidebar.tsx lines 38-44
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  })
}
