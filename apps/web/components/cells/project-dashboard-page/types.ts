/**
 * Type definitions for Project Dashboard Page Cell
 * 
 * Replaces all 'any' types with proper TypeScript interfaces
 * Part of Phase C: Type Safety migration
 */

// ===== Project Types =====

/**
 * Project details from tRPC getProjectDetails output
 * Maps to database projects table schema
 */
export interface Project {
  id: string
  name: string
  sub_business_line: string  // Database uses snake_case
  created_at: string
  updated_at: string
}

// ===== Dashboard Filter Types =====

/**
 * Dashboard filter state structure
 * Used for filtering queries and UI state
 */
export interface DashboardFilters {
  dateRange: {
    from: Date
    to: Date
  }
  costLine?: string
  spendType?: string
  showForecasts: boolean
  comparisonMode: 'none' | 'period' | 'version'
}

// ===== Category Breakdown Types =====

/**
 * Category breakdown item from tRPC getProjectCategoryBreakdown
 * Represents spend by category with budget comparison
 * Matches actual API response shape: { name, value, budget }
 */
export interface CategoryData {
  name: string
  value: number
  budget: number
}

// ===== Subcategory Types =====

/**
 * Flattened subcategory item
 * Derived from hierarchical breakdown structure
 */
export interface SubcategoryData {
  category: string
  subcategory: string
  value: number
  budget: number
  percentage: number
}

// ===== Hierarchical Breakdown Types =====

/**
 * Hierarchical node structure (matches CostBreakdownRow from table component)
 * Recursive structure for 4-level hierarchy
 * Business Line → Cost Line → Spend Type → Subcategory
 * 
 * Note: API code assigns 'level' property at runtime even though
 * the API's HierarchyNode interface doesn't declare it.
 * This type matches the actual runtime data structure.
 */
export interface HierarchyNode {
  id: string
  level?: 'business_line' | 'cost_line' | 'spend_type' | 'sub_category' // Optional because API interface doesn't include it
  name: string
  budget: number
  actual: number
  variance: number
  utilization: number
  children?: HierarchyNode[]
}

/**
 * Hierarchical breakdown structure from tRPC
 * Returns array of business line nodes with nested children
 */
export interface BreakdownData {
  hierarchy: HierarchyNode[]
}

/**
 * Cost Breakdown Row for table display
 * Same as HierarchyNode but with required level property
 * Used by CostBreakdownTable component
 */
export interface CostBreakdownRow {
  id: string
  level: 'business_line' | 'cost_line' | 'spend_type' | 'sub_category'
  name: string
  budget: number
  actual: number
  variance: number
  utilization: number
  children?: CostBreakdownRow[]
}

// ===== Export Types =====

/**
 * PDF export configuration
 */
export interface PDFExportOptions {
  filename: string
  projectName: string
  includeCharts: boolean
  includeTable: boolean
}

/**
 * Excel export configuration
 */
export interface ExcelExportOptions {
  filename: string
  projectName: string
  includeMetrics: boolean
  includeBreakdown: boolean
  includeCategories: boolean
}

/**
 * Combined export options
 */
export interface ExportOptions {
  pdf?: PDFExportOptions
  excel?: ExcelExportOptions
}

// ===== Timeline/Burn Rate Types =====

/**
 * Monthly burn rate data point
 */
export interface BurnRateDataPoint {
  month: string
  amount: number
  cumulative: number
}

/**
 * Timeline data point for budget tracking
 */
export interface TimelineDataPoint {
  month: string
  budget: number
  actual: number
}

// ===== Realtime Event Types =====

/**
 * Supabase realtime event payload
 * Generic structure for postgres_changes events
 */
export interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: Record<string, any>
  old: Record<string, any>
  schema: string
  table: string
}
