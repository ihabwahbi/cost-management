import type { DateRange } from "react-day-picker"

/**
 * Filter state for PO Mapping page
 * Replaces 'any' type from filter-sidebar.tsx line 86
 */
export interface POFilters {
  /** Selected location (undefined = all) */
  location?: string
  
  /** FMT PO filter enabled (undefined = disabled) */
  fmtPo?: boolean
  
  /** Mapping status filter */
  mappingStatus?: "mapped" | "unmapped"
  
  /** PO numbers (comma or newline separated, TRIMMED) */
  poNumbers?: string
  
  /** Date range filter */
  dateRange?: DateRange
}

/**
 * Active filter badge representation
 */
export interface ActiveFilter {
  /** Unique filter key for removal */
  key: keyof POFilters
  
  /** Display label for badge */
  label: string
  
  /** Filter value (for debugging/tracking) */
  value: any
}

/**
 * Date preset configuration (re-exported for convenience)
 */
export interface DatePreset {
  label: string
  range: DateRange
}

/**
 * Props for FilterSidebarCell component
 * FIXES: Line 86 type safety gap (any → POFilters)
 */
export interface FilterSidebarCellProps {
  /** Callback invoked when filters change */
  onFilterChange: (filters: POFilters) => void
}
