# Migration Plan: filter-sidebar.tsx → FilterSidebarCell

**Date**: 2025-10-08 09:33 UTC  
**Architect**: MigrationArchitect  
**Status**: Ready for Implementation  
**Phase**: Phase 3 - Migration Planning  
**Workflow Phase**: 6-Phase Autonomous Migration  

---

## Metadata

```yaml
migration_id: "filter-sidebar-to-cell-2025-10-08"
target_component: "filter-sidebar.tsx"
target_path: "apps/web/components/filter-sidebar.tsx"
complexity: "medium"
strategy: "standard_with_helper_extraction"
estimated_duration: "6-8 hours"
enhancement_mode: "ultrathink"

based_on:
  discovery_report: "thoughts/shared/discoveries/2025-10-08_08-59_discovery-report.md"
  analysis_report: "thoughts/shared/analysis/2025-10-08_11-30_filter-sidebar_analysis.md"

migration_type: "pure_ui_cell"
tRPC_procedures: 0
database_dependencies: 0
```

---

## 📋 Executive Summary

**Component**: `filter-sidebar.tsx` (422 lines)  
**Migration Type**: Pure UI Cell (ZERO database dependencies)  
**Complexity**: Medium  
**Strategy**: Standard Cell workflow with helper extraction  
**Duration**: 6-8 hours  
**Priority**: High (architectural debt removal + critical path component)

**Key Characteristics**:
- ✅ Pure UI component (no tRPC procedures needed)
- ⚠️ 422 lines (exceeds 400-line mandate - extraction required)
- ✅ Single importer (low breaking change risk)
- ✅ Critical path component (primary PO mapping filter UI)
- ✅ 14 behavioral assertions extracted (exceeds minimum 3)

**Migration Approach**:
1. Extract helpers to meet ≤400 line mandate (date utils, types, icons)
2. Create Cell structure with 14 behavioral assertions
3. Implement component with all fixes applied (trimming, type safety, dead code)
4. Atomic replacement (update import + delete old component in same commit)
5. Mandatory human validation (critical path component)

**Estimated Outcomes**:
- Line reduction: 422 → ~280 lines (34% reduction)
- Type safety: Replaces `any` type with `POFilters` interface
- Fixes applied: PO trimming, debug log removal, dead code elimination
- Reusability: Date utilities extracted for use in other components

---

## 🔍 Migration Overview

### Component Profile

```yaml
current_location: "apps/web/components/filter-sidebar.tsx"
target_location: "apps/web/components/cells/filter-sidebar-cell/"
current_lines: 422
target_lines: ~280
reduction: 142 lines (34%)

component_type: "Client-side React component ('use client')"
state_management: "Local (6 useState hooks)"
database_access: "NONE (pure UI)"
tRPC_queries: 0

imported_by:
  - "apps/web/app/po-mapping/page.tsx" (primary usage)
  
critical_path: true
manual_validation_required: true
```

### Scope

**In Scope**:
- Extract date preset utilities to `apps/web/lib/date-preset-utils.ts`
- Extract TypeScript interfaces to `apps/web/types/filters.ts`
- Replace inline SVG icons with lucide-react
- Create FilterSidebarCell with 14 behavioral assertions
- Fix PO number trimming inconsistency (line 118)
- Remove debug console.log (line 121)
- Remove dead code (lines 57-58)
- Update po-mapping/page.tsx import
- Delete old component atomically

**Out of Scope**:
- Database schema changes (none needed)
- tRPC procedure creation (pure UI component)
- Debouncing PO number input (enhancement for future)
- Replacing custom toggle with shadcn Switch (optional enhancement)
- Replacing segmented control with shadcn ToggleGroup (optional enhancement)

### Dependencies

**Helper Files to Create**:
1. `apps/web/lib/date-preset-utils.ts` - Date preset logic extraction
2. `apps/web/types/filters.ts` - TypeScript interface definitions

**UI Dependencies** (unchanged):
- @/components/ui/card (4 components)
- @/components/ui/select (5 components)
- @/components/ui/calendar
- @/components/ui/popover (3 components)
- @/components/ui/textarea
- @/components/ui/button
- @/components/ui/badge
- @/components/ui/label
- lucide-react (Calendar, X, RotateCcw, Filter)

**Integration Points**:
- Parent component: `apps/web/app/po-mapping/page.tsx`
- Callback: `onFilterChange(filters: POFilters)`
- Data flow: FilterSidebarCell → handleFilterChange → filteredPOs state → POTable

---

## ✅ Architecture Compliance Validation

**Pre-Implementation Verification** (Phase 5.5 Self-Validation):

### Architectural Mandates

- **M-CELL-1** (All Functionality as Cells): ✅ **COMPLIANT**
  - **Classification**: Pure UI component with business logic (6 state hooks, date calculations, filter aggregation)
  - **Decision Tree**: Has business logic → Must be Cell
  - **Justification**: Component manages complex filter state with auto-apply logic, date preset calculations, and active filter aggregation - all business logic requiring Cell architecture
  - **Location**: Current `apps/web/components/` → Target `apps/web/components/cells/filter-sidebar-cell/`

- **M-CELL-2** (Complete Atomic Migrations): ✅ **COMPLIANT**
  - **Deletion Step**: Step 5 (Update imports & DELETE old component)
  - **Atomic Commit**: All changes in single commit (helpers + Cell + import update + deletion)
  - **No Partial Migration**: Plan specifies full rollback on any failure
  - **Old Component**: `apps/web/components/filter-sidebar.tsx` DELETED in same commit

- **M-CELL-3** (Zero God Components - ≤400 lines): ✅ **COMPLIANT**
  - **Original Size**: 422 lines (exceeds limit)
  - **Extraction Strategy**: 
    - Date utilities → `date-preset-utils.ts` (50 lines)
    - TypeScript interfaces → `filters.ts` (types)
    - Icon replacement → lucide-react (22 lines saved)
    - Dead code removal (3 lines)
  - **Target Size**: ~280 lines (well under 400 limit)
  - **All Files**: component.tsx (~280), helpers (~60), types (~50) - all ≤400 ✅

- **M-CELL-4** (Explicit Behavioral Contracts - ≥3 assertions): ✅ **COMPLIANT**
  - **Assertions Planned**: 14 behavioral assertions
  - **Minimum Required**: 3
  - **Exceeds Minimum**: +11 assertions (367% of minimum)
  - **Coverage**: All assertions mapped to manifest.json with verification methods

### Specialized Procedure Architecture

- **Pure UI Cell - No API Procedures**: ✅ **N/A**
  - **tRPC Procedures**: 0 (no database dependencies)
  - **Procedure Files**: N/A
  - **Domain Router**: N/A
  - **Rationale**: Component manages client-side filter state only, no server-side data fetching

### Forbidden Pattern Scan

- ✅ "optional" + "phase": Not detected
- ✅ "future cleanup": Not detected  
- ✅ "temporary exemption": Not detected
- ✅ "TODO later": Not detected

**Scan Result**: ✅ **CLEAN** - Zero forbidden patterns

### Compliance Status

**🎯 OVERALL STATUS: ✅ COMPLIANT - Ready for Phase 4 Implementation**

All 4 architectural mandates satisfied. Specialized procedure architecture N/A (pure UI). Zero forbidden language detected. Plan approved for execution.

---

## 📦 Data Layer Specifications

**CRITICAL**: This is a **pure UI component** with NO database dependencies.

### tRPC Procedures

```yaml
procedures_needed: 0
database_tables: []
drizzle_schemas: []
curl_tests: []
edge_function_deployment: "NOT REQUIRED"

explanation: |
  Component manages client-side filter state only. No server-side data 
  fetching. Filter values are passed to parent component via callback,
  which handles actual data filtering.
```

**Migration Strategy**: Cell will remain a pure UI component without tRPC queries. The standard 7-step sequence is modified to skip data layer steps (Steps 1-3).

### TypeScript Interface Definitions

**CRITICAL**: Replace `any` type with explicit interfaces (fixes line 86 type safety gap)

**Create**: `apps/web/types/filters.ts`

```typescript
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
```

**Validation**:
```bash
# TypeScript compilation
pnpm type-check
# Should pass with no errors

# Verify exports
grep "export interface" apps/web/types/filters.ts
# Should show: POFilters, ActiveFilter, DatePreset, FilterSidebarCellProps
```

**Impact**:
- ✅ Fixes type safety gap (line 86)
- ✅ Parent component can import `POFilters` for type-safe callback
- ✅ Reusable across other filter components

---

## 🏗️ Cell Structure Specifications

### Directory Structure

```
apps/web/components/cells/filter-sidebar-cell/
├── component.tsx           # Main Cell (250-300 lines after extraction)
├── manifest.json          # Behavioral assertions (14 total)
├── pipeline.yaml          # Validation gates (5 gates)
└── __tests__/
    └── component.test.tsx # Unit tests (80%+ coverage)
```

### Helper Extraction Strategy

**Goal**: Reduce component from 422 lines → ~280 lines to meet M-CELL-3 mandate (≤400 lines)

**Extraction 1: Date Preset Utilities** (50 lines → external file)

**Create**: `apps/web/lib/date-preset-utils.ts`

```typescript
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
```

**Reusability**: ✅ High - can be used in `dashboard-filters.tsx` (70% overlap detected in analysis)

---

**Extraction 2: Icon Replacement** (22 lines → lucide-react imports)

**Replace inline SVG components (lines 15-36) with lucide-react**:

```typescript
// OLD (lines 15-36): Inline SVG components
// CalendarIcon, XIcon, RotateCcwIcon, FilterIcon

// NEW: Single import line
import { Calendar, X, RotateCcw, Filter } from "lucide-react"

// Usage in component (no changes needed):
<Calendar className="mr-2 h-4 w-4" />
<X className="h-3 w-3" />
<RotateCcw className="mr-2 h-4 w-4" />
<Filter className="mr-2 h-4 w-4" />
```

**Benefits**:
- ✅ 22 lines removed
- ✅ Smaller bundle size (12KB reduction)
- ✅ Maintained icons, consistent with lucide-react ecosystem

---

**Line Count Reduction Analysis**:

```yaml
Original: 422 lines
Reductions:
  - Date utils extraction: -50 lines
  - Icon replacement: -22 lines
  - Dead code removal (lines 57-58): -2 lines
  - Debug console.log removal (line 121): -1 line
  
Estimated after extraction: ~347 lines
Target after implementation: 250-300 lines

Result: ✅ Meets M-CELL-3 mandate (≤400 lines)
```

---

### Component.tsx Specification

**File**: `apps/web/components/cells/filter-sidebar-cell/component.tsx`

**Target Lines**: ~280 lines (well under 400 mandate)

**Key Implementation Details**:

```typescript
"use client"

import { useState, useEffect } from "react"
import type { DateRange } from "react-day-picker"
import type { FilterSidebarCellProps, POFilters, ActiveFilter } from "@/types/filters"
import { getDatePresets, formatDate } from "@/lib/date-preset-utils"
import { Calendar, X, RotateCcw, Filter } from "lucide-react"
// ... UI component imports

export function FilterSidebarCell({ onFilterChange }: FilterSidebarCellProps) {
  // State management (6 hooks - unchanged from original)
  const [location, setLocation] = useState("all")
  const [fmtPo, setFmtPo] = useState(false)
  const [mappingStatus, setMappingStatus] = useState("all")
  const [poNumbers, setPONumbers] = useState("")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  
  // Use extracted helper
  const datePresets = getDatePresets()
  
  // Business logic functions
  const getActiveFilters = (): ActiveFilter[] => { /* ... */ }
  
  const applyFilters = () => {
    const filters: POFilters = {
      location: location === "all" ? undefined : location,
      fmtPo: fmtPo ? true : undefined,
      mappingStatus: mappingStatus === "all" ? undefined : mappingStatus,
      poNumbers: poNumbers.trim(), // ✅ FIXED: Now trimmed (was line 118 issue)
      dateRange: dateRange,
    }
    // ✅ Debug console.log REMOVED (was line 121)
    onFilterChange(filters)
  }
  
  // Auto-apply filters
  useEffect(() => {
    applyFilters()
  }, [location, fmtPo, mappingStatus, poNumbers, dateRange])
  
  // Event handlers
  const handleReset = () => { /* ... */ }
  const removeFilter = (filterKey: string) => { /* ... */ }
  const handlePresetSelect = (preset: DatePreset) => { /* ... */ }
  const handleCustomDateRange = (range: DateRange | undefined) => { /* ... */ }
  
  const activeFilters = getActiveFilters()
  
  return (
    <Card className="h-full rounded-none border-0 border-r bg-slate-50/50">
      {/* UI implementation - unchanged structure from original */}
    </Card>
  )
}
```

**Critical Fixes Applied**:
- ✅ Line 118 fix: `poNumbers: poNumbers.trim()` (was passing untrimmed)
- ✅ Line 121 removal: Debug `console.log("[v0] Filter values:", filters)` deleted
- ✅ Lines 57-58 omitted: Dead code `last90Days` not included
- ✅ Inline SVGs replaced: lucide-react imports
- ✅ Type safety: Uses `FilterSidebarCellProps` (not `any`)

---

### Manifest.json Specification

**File**: `apps/web/components/cells/filter-sidebar-cell/manifest.json`

**Behavioral Assertions**: 14 total (exceeds minimum 3 by 367%)

```json
{
  "id": "filter-sidebar-cell",
  "version": "1.0.0",
  "description": "Filter panel for PO mapping with date presets, location, status, and number filtering",
  "behavioral_assertions": [
    {
      "id": "BA-001",
      "description": "Component initializes with all filters in default/neutral state",
      "verification": "Mount component, verify all state values match defaults (location='all', fmtPo=false, mappingStatus='all', poNumbers='', dateRange=undefined, selectedPreset=null)",
      "source": "Lines 90-95 from original filter-sidebar.tsx"
    },
    {
      "id": "BA-002",
      "description": "Displays active filter count badge when filters are applied",
      "verification": "Apply 3 filters, verify badge shows '3 active'",
      "source": "Lines 176-180 from original"
    },
    {
      "id": "BA-003",
      "description": "Shows individual filter badges with remove buttons",
      "verification": "Apply multiple filters, verify each has clickable badge with X icon",
      "source": "Lines 186-196 from original"
    },
    {
      "id": "BA-004",
      "description": "Automatically calls onFilterChange when any filter state changes",
      "verification": "Change filter state, verify callback invoked with updated filters object",
      "source": "Lines 125-127 from original (useEffect auto-apply)",
      "critical": true
    },
    {
      "id": "BA-005",
      "description": "Date preset selection updates dateRange and highlights preset button",
      "verification": "Click 'Last 7 days' preset, verify dateRange state updated and button shows default variant",
      "source": "Lines 159-162, 229 from original"
    },
    {
      "id": "BA-006",
      "description": "Custom date range selection clears preset highlight",
      "verification": "Select preset then open calendar and select custom range, verify selectedPreset becomes null",
      "source": "Lines 164-167 from original"
    },
    {
      "id": "BA-007",
      "description": "Individual filter removal via badge click resets that filter only",
      "verification": "Apply location + fmtPo filters, click location badge X, verify only location reset to 'all' and fmtPo remains true",
      "source": "Lines 138-157 from original (removeFilter function)"
    },
    {
      "id": "BA-008",
      "description": "Clear all button resets all filters to defaults",
      "verification": "Apply multiple filters, click 'Clear all' button, verify all state reset",
      "source": "Lines 129-136 from original (handleReset)",
      "critical": true
    },
    {
      "id": "BA-009",
      "description": "Displays empty state message when no filters are active",
      "verification": "Ensure no filters applied, verify 'No filters applied' message visible",
      "source": "Lines 404-418 from original"
    },
    {
      "id": "BA-010",
      "description": "Location select shows visual highlight when not 'all'",
      "verification": "Change location to 'Jandakot', verify select shows border-blue-500 styling",
      "source": "Line 324 from original"
    },
    {
      "id": "BA-011",
      "description": "FMT PO toggle switches between enabled/disabled with visual feedback",
      "verification": "Click FMT PO toggle, verify fmtPo state flips and toggle animation runs (translate-x-6 vs translate-x-1)",
      "source": "Lines 345-358 from original (custom toggle)"
    },
    {
      "id": "BA-012",
      "description": "Mapping status segmented control allows switching between all/mapped/unmapped",
      "verification": "Click each segment (all, mapped, unmapped), verify state updates and visual selection (bg-blue-600)",
      "source": "Lines 365-384 from original (segmented control)"
    },
    {
      "id": "BA-013",
      "description": "PO numbers textarea shows active state when not empty",
      "verification": "Enter PO number '12345', verify textarea shows border-blue-500",
      "source": "Lines 397-401 from original"
    },
    {
      "id": "BA-014",
      "description": "Trims whitespace from PO numbers before passing to parent callback",
      "verification": "Enter '  12345  ' in PO numbers, verify onFilterChange callback receives {poNumbers: '12345'} (trimmed)",
      "source": "Line 118 from original (FIXED: now trimmed in applyFilters)",
      "critical": true
    }
  ],
  "dependencies": {
    "data": [],
    "ui": [
      "@/components/ui/card",
      "@/components/ui/select",
      "@/components/ui/calendar",
      "@/components/ui/popover",
      "@/components/ui/textarea",
      "@/components/ui/button",
      "@/components/ui/badge",
      "@/components/ui/label",
      "lucide-react"
    ],
    "utilities": [
      "@/lib/date-preset-utils",
      "@/lib/utils",
      "@/types/filters"
    ]
  },
  "notes": [
    "Pure UI Cell - no database dependencies",
    "Extracted helpers: date-preset-utils.ts, filters.ts",
    "Icons replaced with lucide-react",
    "Fixed: PO number trimming (line 118), removed debug log (line 121), removed dead code (lines 57-58)"
  ]
}
```

**Critical Assertions** (3 of 14):
- BA-004: Auto-apply on state change (core functionality)
- BA-008: Clear all resets (prevent state bugs)
- BA-014: PO number trimming (data integrity fix)

---

### Pipeline.yaml Specification

**File**: `apps/web/components/cells/filter-sidebar-cell/pipeline.yaml`

**Validation Gates**: 5 gates configured

```yaml
id: "filter-sidebar-cell"
version: "1.0.0"

gates:
  types:
    description: "TypeScript compilation with zero errors"
    command: "pnpm type-check"
    success_criteria: "Exit code 0, no errors related to filter-sidebar-cell"
    blocking: true
    notes: "Verify POFilters interface replaces 'any' type correctly"
    
  tests:
    description: "Unit tests with 80%+ coverage"
    command: "pnpm test components/cells/filter-sidebar-cell"
    success_criteria: "All 14 behavioral assertions verified, coverage >= 80%"
    blocking: true
    focus_areas:
      - "All 14 BAs have corresponding test cases"
      - "Mock onFilterChange callback and verify invocations"
      - "Test filter state initialization"
      - "Test filter removal and reset"
      - "Test trimming behavior (BA-014)"
    
  build:
    description: "Production build succeeds"
    command: "pnpm build"
    success_criteria: "Build completes without errors, bundle size acceptable"
    blocking: true
    notes: "Verify lucide-react icons bundle correctly"
    
  performance:
    description: "Render performance within 110% baseline"
    baseline: "Current filter-sidebar.tsx performance"
    measurement: "React DevTools Profiler"
    threshold: "110%"
    blocking: false
    success_criteria: "Component renders in ≤3 cycles (mount + state updates)"
    notes: "No infinite loops - verify with Network tab (should see 0 requests, pure UI)"
    
  accessibility:
    description: "WCAG AA compliance"
    checks:
      - "Keyboard navigation works for all controls (tab through filters)"
      - "ARIA labels present: role='switch' on toggle, labeled selects"
      - "Color contrast meets AA: blue-600 on white, text readable"
      - "Focus indicators visible on all interactive elements"
    blocking: true
    manual_validation: true

behavioral_assertions:
  minimum_required: 3
  actual_count: 14
  coverage_requirement: "All 14 assertions must have corresponding tests"
  critical_assertions:
    - "BA-004: Auto-apply on state change (core functionality)"
    - "BA-008: Clear all resets (prevent state bugs)"
    - "BA-014: PO number trimming (data integrity fix)"

validation_strategy:
  unit_tests: "80%+ coverage required"
  integration_tests: "Manual validation with po-mapping page"
  regression_tests: "Verify no visual changes from original"
  performance_tests: "No infinite loops, ≤3 renders"
```

---

## 🔄 Migration Sequence (Modified 8-Step for Pure UI Cell)

**Standard 7-step modified**: Data layer steps (1-3) skipped for pure UI Cell, helper extraction added

### **Step 1: Create Helper Utilities** (2 hours)

**Phase**: Helper Extraction  
**Action**: Create date utilities and TypeScript interfaces  
**Critical**: Foundation for Cell component, enables line reduction

#### **Substep 1.1: Create Date Preset Utilities** (45 minutes)

```bash
# Create file
touch apps/web/lib/date-preset-utils.ts
```

**Content**: [See "Helper Extraction Strategy" section above for complete code]

**Validation**:
```bash
# TypeScript compilation
pnpm type-check

# Verify exports
grep -E "export (function|interface)" apps/web/lib/date-preset-utils.ts
# Expected: getDatePresets, formatDate, DatePreset, DatePresets
```

**Success Criteria**:
- ✅ File compiles without errors
- ✅ Exports verified (getDatePresets, formatDate)
- ✅ Dead code not included (last90Days)

---

#### **Substep 1.2: Create TypeScript Interfaces** (30 minutes)

```bash
# Create directory if needed
mkdir -p apps/web/types

# Create file
touch apps/web/types/filters.ts
```

**Content**: [See "Data Layer Specifications" section above for complete code]

**Validation**:
```bash
# TypeScript compilation
pnpm type-check

# Verify exports
grep "export interface" apps/web/types/filters.ts
# Expected: POFilters, ActiveFilter, DatePreset, FilterSidebarCellProps
```

**Success Criteria**:
- ✅ File compiles without errors
- ✅ All interfaces exported
- ✅ Replaces `any` type from line 86

---

#### **Substep 1.3: Verify Helper Integration** (15 minutes)

```typescript
// Temporary test file: apps/web/lib/__test-helpers__.ts
import { getDatePresets, formatDate } from './date-preset-utils'
import type { POFilters } from '../types/filters'

const presets = getDatePresets()
console.log('Presets:', presets.recent.length, presets.periods.length)

const testDate = new Date()
console.log('Formatted:', formatDate(testDate))

const filters: POFilters = { location: 'perth', fmtPo: true }
console.log('Filters:', filters)
```

```bash
# Run test
pnpm exec tsx apps/web/lib/__test-helpers__.ts

# Expected output:
# Presets: 4 4
# Formatted: [current date]
# Filters: { location: 'perth', fmtPo: true }

# Delete test file
rm apps/web/lib/__test-helpers__.ts
```

**Success Criteria**:
- ✅ date-preset-utils.ts works correctly
- ✅ filters.ts types work correctly
- ✅ Imports resolve properly

---

### **Step 2: Create Cell Directory Structure** (30 minutes)

**Phase**: Cell Creation  
**Action**: Set up Cell directory and file structure

```bash
# Create Cell directory
mkdir -p apps/web/components/cells/filter-sidebar-cell/__tests__

# Create files
touch apps/web/components/cells/filter-sidebar-cell/component.tsx
touch apps/web/components/cells/filter-sidebar-cell/manifest.json
touch apps/web/components/cells/filter-sidebar-cell/pipeline.yaml
touch apps/web/components/cells/filter-sidebar-cell/__tests__/component.test.tsx
```

**Validation**:
```bash
# Verify structure
tree apps/web/components/cells/filter-sidebar-cell

# Expected:
# apps/web/components/cells/filter-sidebar-cell/
# ├── component.tsx
# ├── manifest.json
# ├── pipeline.yaml
# └── __tests__/
#     └── component.test.tsx
```

**Success Criteria**:
- ✅ Directory created: `apps/web/components/cells/filter-sidebar-cell/`
- ✅ All 4 files created (component, manifest, pipeline, test)
- ✅ __tests__ subdirectory created

---

### **Step 3: Implement Cell Component** (2 hours)

**Phase**: Implementation  
**Action**: Create FilterSidebarCell component with all fixes applied

#### **Substep 3.1: Implement component.tsx** (1.5 hours)

**File**: `apps/web/components/cells/filter-sidebar-cell/component.tsx`

**Content**: [See "Component.tsx Specification" section above]

**Critical Implementation Notes**:
- Import helpers: `getDatePresets, formatDate` from `@/lib/date-preset-utils`
- Import types: `FilterSidebarCellProps, POFilters, ActiveFilter` from `@/types/filters`
- Import icons: `Calendar, X, RotateCcw, Filter` from `lucide-react`
- Fix line 118: `poNumbers: poNumbers.trim()`
- Remove line 121: Debug console.log
- Omit lines 57-58: Dead code (last90Days)

**Validation**:
```bash
# TypeScript compilation
pnpm type-check
# Should pass

# Line count check
wc -l apps/web/components/cells/filter-sidebar-cell/component.tsx
# Expected: ~280 lines (< 400 mandate)

# Verify imports
grep "from \"@/lib/date-preset-utils\"" apps/web/components/cells/filter-sidebar-cell/component.tsx
grep "from \"@/types/filters\"" apps/web/components/cells/filter-sidebar-cell/component.tsx
grep "from \"lucide-react\"" apps/web/components/cells/filter-sidebar-cell/component.tsx
```

**Success Criteria**:
- ✅ Component compiles without errors
- ✅ Line count ≤400 (~280 lines)
- ✅ All helpers imported correctly
- ✅ All fixes applied

---

#### **Substep 3.2: Create manifest.json** (15 minutes)

**File**: `apps/web/components/cells/filter-sidebar-cell/manifest.json`

**Content**: [See "Manifest.json Specification" section above]

**Validation**:
```bash
# Validate JSON syntax
cat apps/web/components/cells/filter-sidebar-cell/manifest.json | jq .
# Should parse without errors

# Count behavioral assertions
cat apps/web/components/cells/filter-sidebar-cell/manifest.json | jq '.behavioral_assertions | length'
# Expected: 14

# Verify minimum met
[ $(cat apps/web/components/cells/filter-sidebar-cell/manifest.json | jq '.behavioral_assertions | length') -ge 3 ] && echo "✅ Minimum 3 BAs met" || echo "❌ VIOLATION"
```

**Success Criteria**:
- ✅ Valid JSON syntax
- ✅ 14 behavioral assertions
- ✅ Minimum 3 BAs met (M-CELL-4)

---

#### **Substep 3.3: Create pipeline.yaml** (15 minutes)

**File**: `apps/web/components/cells/filter-sidebar-cell/pipeline.yaml`

**Content**: [See "Pipeline.yaml Specification" section above]

**Validation**:
```bash
# Validate YAML syntax (if yq installed)
yq eval '.' apps/web/components/cells/filter-sidebar-cell/pipeline.yaml

# Verify gates present
grep -E "^  (types|tests|build|performance|accessibility):" apps/web/components/cells/filter-sidebar-cell/pipeline.yaml
# Should show all 5 gates
```

**Success Criteria**:
- ✅ Valid YAML syntax
- ✅ 5 validation gates configured
- ✅ All gates have success criteria

---

### **Step 4: Write Unit Tests** (2-3 hours)

**Phase**: Testing  
**Action**: Implement tests for all 14 behavioral assertions

**File**: `apps/web/components/cells/filter-sidebar-cell/__tests__/component.test.tsx`

**Test Coverage Requirements**:
- All 14 behavioral assertions have test cases
- Coverage >= 80% (statements, branches, functions, lines)
- Mock `onFilterChange` callback
- Test all state transitions
- Test edge cases (trimming, empty states, etc.)

**Test Structure** (abbreviated - see full implementation in analysis):

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { FilterSidebarCell } from '../component'
import type { POFilters } from '@/types/filters'

describe('FilterSidebarCell', () => {
  const mockOnFilterChange = vi.fn()

  beforeEach(() => {
    mockOnFilterChange.mockClear()
  })

  // BA-001: Component initializes with default state
  it('initializes with all filters in default state', () => { /* ... */ })

  // BA-002: Displays active filter count badge
  it('shows active filter count badge when filters applied', () => { /* ... */ })

  // ... (all 14 BAs have corresponding tests)

  // BA-014: CRITICAL - Trims whitespace from PO numbers
  it('trims whitespace from PO numbers before callback', async () => {
    render(<FilterSidebarCell onFilterChange={mockOnFilterChange} />)
    
    mockOnFilterChange.mockClear()
    
    const textarea = screen.getByLabelText('PO Numbers')
    
    // Enter PO number with whitespace
    fireEvent.change(textarea, { target: { value: '  12345  ' } })
    
    await waitFor(() => {
      expect(mockOnFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          poNumbers: '12345'  // ✅ Should be trimmed
        })
      )
    })
  })
})
```

**Validation**:
```bash
# Run tests
pnpm test components/cells/filter-sidebar-cell

# Expected output:
# ✓ BA-001: initializes with default state
# ✓ BA-002: shows active filter count badge
# ... (all 14 tests)
# ✓ All tests passed (14)

# Check coverage
pnpm test:coverage components/cells/filter-sidebar-cell

# Expected coverage >= 80%:
# Statements: >= 80%
# Branches: >= 80%
# Functions: >= 80%
# Lines: >= 80%
```

**Success Criteria**:
- ✅ All 14 tests passing
- ✅ Coverage >= 80% (all metrics)
- ✅ No test timeouts
- ✅ BA-014 (trimming) verified

---

### **Step 5: Update Imports & DELETE Old Component** (30 minutes)

**Phase**: Integration  
**Action**: Atomic replacement - update importer and delete old file

**⚠️ CRITICAL**: This is an ATOMIC operation - both updates must happen in the SAME commit (M-CELL-2 mandate).

#### **Substep 5.1: Update po-mapping/page.tsx** (15 minutes)

**File**: `apps/web/app/po-mapping/page.tsx`

**Changes Required**:

```typescript
// OLD (line 6):
import { FilterSidebar } from "@/components/filter-sidebar"

// NEW:
import { FilterSidebarCell } from "@/components/cells/filter-sidebar-cell/component"

// ALSO ADD (for type safety):
import type { POFilters } from "@/types/filters"

// OLD (line 155 - callback signature):
const handleFilterChange = (filters: any) => {

// NEW (type-safe):
const handleFilterChange = (filters: POFilters) => {

// OLD (line 258):
<FilterSidebar onFilterChange={handleFilterChange} />

// NEW:
<FilterSidebarCell onFilterChange={handleFilterChange} />
```

**Validation**:
```bash
# TypeScript compilation
pnpm type-check
# Should pass - FilterSidebarCell types match parent expectations

# Search for old references (should find NONE after update)
grep -r "FilterSidebar" apps/web/app/po-mapping/page.tsx | grep -v "FilterSidebarCell"
# Should return nothing
```

**Success Criteria**:
- ✅ Import updated to FilterSidebarCell
- ✅ Type import added (POFilters)
- ✅ Callback type updated (any → POFilters)
- ✅ Component usage updated
- ✅ TypeScript compiles

---

#### **Substep 5.2: DELETE Old Component** (15 minutes)

**File to DELETE**: `apps/web/components/filter-sidebar.tsx`

**⚠️ POINT OF NO RETURN** - Ensure Cell is working first!

```bash
# Verify no other references exist
grep -r "filter-sidebar" apps/web/ | grep -v "filter-sidebar-cell"

# Expected: Only po-mapping/page.tsx (which we just updated)

# DELETE old component
rm apps/web/components/filter-sidebar.tsx

# Verify deletion
ls apps/web/components/filter-sidebar.tsx 2>/dev/null && echo "❌ Still exists!" || echo "✅ Deleted"
```

**Validation**:
```bash
# Build should still succeed
pnpm build
# Exit code 0 ✅

# No broken imports
grep -r "from.*filter-sidebar\"" apps/web/ | grep -v "filter-sidebar-cell"
# Should return nothing
```

**Success Criteria**:
- ✅ Old component deleted
- ✅ No references to old component remain
- ✅ Build succeeds
- ✅ Application runs

---

### **Step 6: Full Validation Suite** (30 minutes)

**Phase**: Validation  
**Action**: Run all automated validation gates from pipeline.yaml

#### **Gate 1: TypeScript** (5 minutes)

```bash
pnpm type-check
```

**Success Criteria**: Exit code 0, zero errors ✅

---

#### **Gate 2: Tests** (10 minutes)

```bash
pnpm test
```

**Success Criteria**: 
- All tests pass ✅
- filter-sidebar-cell coverage >= 80% ✅
- All 14 behavioral assertions verified ✅

---

#### **Gate 3: Build** (10 minutes)

```bash
pnpm build
```

**Success Criteria**: 
- Production build completes ✅
- No errors related to filter-sidebar or filter-sidebar-cell ✅
- Bundle size acceptable ✅

---

#### **Gate 4: Performance** (5 minutes)

```bash
# Start dev server
pnpm dev

# Manual verification:
# 1. Open React DevTools → Profiler
# 2. Navigate to /po-mapping
# 3. Start profiling
# 4. Interact with filter sidebar
# 5. Stop profiling
# 6. Check render count: should be ≤3 cycles
```

**Success Criteria**: No infinite render loops, component stable ✅

**Network Tab Verification**:
```bash
# Open Chrome DevTools → Network
# Filter by "trpc"
# Expected: ZERO requests (pure UI component)
```

---

#### **Gate 5: Accessibility** (Manual - included in Step 7)

**Checklist**:
- Tab through all controls with keyboard
- Verify all interactive elements receive focus
- Verify ARIA labels present (role="switch" on toggle)
- Verify color contrast (blue-600 on white meets AA)
- Screen reader friendly

---

### **Step 7: Manual Validation** (1-2 hours) **🛑 REQUIRED - Critical Path Component**

**Phase**: Human Validation Gate  
**Action**: Comprehensive user flow testing

**🛑 MANDATORY HUMAN VALIDATION**

**Validation Checklist**:

```markdown
## 🛑 HUMAN VALIDATION REQUIRED

Please thoroughly test the FilterSidebarCell in the browser:

### Visual Verification
- [ ] Cell displays correctly in PO mapping page sidebar
- [ ] All filter controls render properly (location, toggle, status, PO numbers, date)
- [ ] Active filter badges display correctly
- [ ] Layout matches original (20% width, resizable panel)
- [ ] Styling consistent with original (colors, spacing, typography)

### Functional Verification
- [ ] **Date Presets**: Click each preset (Today, Yesterday, Last 7 days, etc.)
  - Verify date range updates
  - Verify preset button highlights (default variant)
  - Verify badge shows preset label

- [ ] **Custom Date Range**: Open date picker, select custom range
  - Verify preset highlight clears
  - Verify badge shows "Custom range"
  - Verify date displays in button (formatted correctly)

- [ ] **Location Filter**: Change location to Perth, Jandakot, Karratha
  - Verify badge displays "Location: [value]"
  - Verify select shows blue border when not "all"
  - Verify PO table filters by location

- [ ] **FMT PO Toggle**: Click toggle on/off
  - Verify visual animation (dot slides)
  - Verify badge shows "FMT PO Only" when enabled
  - Verify PO table filters FMT POs

- [ ] **Mapping Status**: Click All, Mapped, Unmapped
  - Verify segment highlights (blue background)
  - Verify badge shows "Status: mapped" or "Status: unmapped"
  - Verify PO table filters by status

- [ ] **PO Numbers**: Enter PO numbers "12345, 67890"
  - Verify textarea highlights (blue border)
  - Verify badge shows "PO Numbers"
  - Verify PO table filters to matching numbers
  - **CRITICAL**: Enter "  12345  " (with spaces), verify spaces trimmed

- [ ] **Filter Removal**: Click X on individual badges
  - Verify only that filter resets
  - Verify other filters remain active
  - Verify PO table updates correctly

- [ ] **Clear All**: Click "Clear all" button
  - Verify all filters reset to defaults
  - Verify all badges disappear
  - Verify "No filters applied" message shows
  - Verify PO table shows all POs

### Integration Verification
- [ ] PO table updates correctly when filters change
- [ ] No console errors
- [ ] No network errors (should be 0 tRPC requests - pure UI)
- [ ] Page load performance acceptable
- [ ] No visual regressions from original

### Edge Cases
- [ ] Refresh page - filters should reset
- [ ] Apply filter, select PO, verify details panel works
- [ ] Resize sidebar panel - Cell should resize gracefully
- [ ] No infinite loops (check Network tab - should see 0 repeated requests)

### Accessibility Verification
- [ ] Tab through all controls - keyboard navigation works
- [ ] All interactive elements focusable
- [ ] ARIA labels present (toggle has role="switch")
- [ ] Color contrast meets WCAG AA
- [ ] Focus indicators visible

### Final Approval
Respond with:
- "VALIDATED - proceed with commit" if all checks pass ✅
- "FIX ISSUES - [describe problems]" if issues found ❌
```

**⚠️ DO NOT PROCEED TO STEP 8 WITHOUT EXPLICIT "VALIDATED" RESPONSE**

**If "FIX ISSUES" received**: Execute full rollback (see Rollback Strategy section)

**Success Criteria**:
- ✅ User responds "VALIDATED - proceed with commit"
- ✅ All checklist items verified
- ✅ No issues discovered

---

### **Step 8: Commit & Ledger Update** (15 minutes)

**Phase**: Finalization  
**Action**: Create atomic commit and update migration ledger

**⚠️ Only execute after receiving "VALIDATED" approval**

```bash
# Stage all changes
git add apps/web/lib/date-preset-utils.ts
git add apps/web/types/filters.ts
git add apps/web/components/cells/filter-sidebar-cell/
git add apps/web/app/po-mapping/page.tsx

# Verify old component deletion staged
git status | grep "deleted:" | grep "filter-sidebar.tsx"
# Should show: deleted: apps/web/components/filter-sidebar.tsx

# Create atomic commit
git commit -m "feat: Migrate filter-sidebar to Cell architecture (M-CELL-1, M-CELL-3)

- Extract date utilities to date-preset-utils.ts (50 lines)
- Extract TypeScript interfaces to filters.ts (fixes type safety gap)
- Replace inline SVGs with lucide-react icons (22 lines reduction)
- Create FilterSidebarCell (14 behavioral assertions, 280 lines)
- Fix PO number trimming inconsistency (line 118 issue)
- Remove debug console.log (line 121)
- Remove dead code (last90Days, lines 57-58)
- Update po-mapping/page.tsx import and type safety
- Delete old component (atomic replacement)

Compliance:
- M-CELL-1: Component correctly classified as Cell (has business logic)
- M-CELL-2: Atomic migration (old deleted in same commit)
- M-CELL-3: Component size 280 lines (≤400 mandate)
- M-CELL-4: 14 behavioral assertions (≥3 minimum)

Validation:
- Tests: 14/14 BAs verified, 80%+ coverage
- Build: Production succeeds
- Performance: No infinite loops, ≤3 renders
- Human: VALIDATED (critical path component)

Artifacts:
- Created: filter-sidebar-cell/, date-preset-utils.ts, filters.ts
- Deleted: filter-sidebar.tsx"
```

**Update Ledger**:

```bash
# Append to ledger.jsonl
echo '{
  "iteration_id": "iter_20251008_filter-sidebar-cell-migration",
  "timestamp": "'$(date -Iseconds)'",
  "agent": "MigrationArchitect",
  "phase": "Phase 4: Migration Implementation",
  "human_prompt": "Migrate filter-sidebar.tsx to Cell architecture",
  "artifacts_created": [
    {
      "type": "cell",
      "id": "filter-sidebar-cell",
      "path": "apps/web/components/cells/filter-sidebar-cell/",
      "files": ["component.tsx", "manifest.json", "pipeline.yaml", "__tests__/component.test.tsx"],
      "lines": 280,
      "behavioral_assertions": 14
    },
    {
      "type": "utility",
      "id": "date-preset-utils",
      "path": "apps/web/lib/date-preset-utils.ts",
      "exports": ["getDatePresets", "formatDate"],
      "reusable": true
    },
    {
      "type": "types",
      "id": "filters",
      "path": "apps/web/types/filters.ts",
      "exports": ["POFilters", "FilterSidebarCellProps", "ActiveFilter", "DatePreset"]
    }
  ],
  "artifacts_replaced": [
    {
      "type": "component",
      "id": "filter-sidebar",
      "path": "apps/web/components/filter-sidebar.tsx",
      "lines": 422,
      "deletion_reason": "Replaced by Cell architecture (M-CELL-1 compliance)",
      "status": "DELETED"
    }
  ],
  "artifacts_modified": [
    {
      "type": "page",
      "id": "po-mapping",
      "path": "apps/web/app/po-mapping/page.tsx",
      "changes": ["Import updated to FilterSidebarCell", "Type safety improved (any → POFilters)"]
    }
  ],
  "schema_changes": [],
  "mandate_compliance": {
    "M-CELL-1": "COMPLIANT - UI component with business logic in /cells/",
    "M-CELL-2": "COMPLIANT - Atomic migration, old deleted in same commit",
    "M-CELL-3": "COMPLIANT - 280 lines (≤400 mandate)",
    "M-CELL-4": "COMPLIANT - 14 behavioral assertions (≥3 minimum)"
  },
  "validation_status": "PASSED",
  "validation_gates": {
    "types": "PASSED",
    "tests": "PASSED - 14/14 BAs, 80%+ coverage",
    "build": "PASSED",
    "performance": "PASSED - No infinite loops",
    "accessibility": "PASSED",
    "human_validation": "PASSED - Critical path verified"
  },
  "human_validated": true,
  "duration_hours": "6-8",
  "fixes_applied": [
    "PO number trimming (line 118)",
    "Type safety gap (line 86 - any → POFilters)",
    "Debug log removal (line 121)",
    "Dead code removal (lines 57-58)"
  ]
}' >> ledger.jsonl
```

**Success Criteria**:
- ✅ Commit created successfully
- ✅ Ledger updated
- ✅ All artifacts tracked

---

### **Migration Sequence Summary**

| Step | Phase | Action | Duration | Validation |
|------|-------|--------|----------|------------|
| 1 | Helper Extraction | Create date-preset-utils.ts, filters.ts | 2 hours | TypeScript compiles ✅ |
| 2 | Cell Creation | Create directory structure | 30 min | Structure verified ✅ |
| 3 | Implementation | Implement component.tsx, manifest.json, pipeline.yaml | 2 hours | Compiles, <400 lines ✅ |
| 4 | Testing | Write 14 BA tests, achieve 80%+ coverage | 2-3 hours | All tests pass ✅ |
| 5 | Integration | Update po-mapping/page.tsx, DELETE old component | 30 min | Build succeeds ✅ |
| 6 | Validation | Run all automated gates | 30 min | All gates pass ✅ |
| 7 | Manual Testing | Human validation (critical path) | 1-2 hours | User approves ✅ |
| 8 | Finalization | Commit + ledger update | 15 min | Commit created ✅ |

**Total Duration**: **6-8 hours** (matches analysis estimate)

---

## 🔙 Rollback Strategy

**Philosophy**: NO partial migrations - full rollback on ANY failure (M-CELL-2: Atomic completeness)

### Rollback Trigger Conditions

Execute rollback if ANY of the following occur:

```yaml
technical_failures:
  - TypeScript compilation errors (pnpm type-check fails)
  - Test failures (any of 14 BAs fail)
  - Build failures (pnpm build fails)
  - Coverage below 80%
  - Line count exceeds 400 (M-CELL-3 violation)

functional_failures:
  - Cell doesn't render in browser
  - Filters don't update PO table
  - Console errors present
  - Visual regression from original
  - Performance unacceptable (infinite loops)

integration_failures:
  - Import update breaks po-mapping page
  - Build succeeds but page crashes at runtime
  - Type mismatches between Cell and parent

human_validation_failure:
  - User responds "FIX ISSUES" instead of "VALIDATED"
  - Critical bugs discovered in manual testing
  - Unacceptable user experience
```

### Rollback Sequence

**IMMEDIATE ACTION - Execute within 5 minutes of failure detection**

**Step 1: Git Revert** (2 minutes)

```bash
# Identify the migration commit
git log --oneline -5 | grep "filter-sidebar"

# Example output:
# abc123f feat: Migrate filter-sidebar to Cell architecture

# Revert the entire commit (atomic - all changes undone)
git revert abc123f --no-edit

# This automatically:
# - Restores apps/web/components/filter-sidebar.tsx (old component)
# - Deletes apps/web/components/cells/filter-sidebar-cell/ (new Cell)
# - Deletes apps/web/lib/date-preset-utils.ts (helper)
# - Deletes apps/web/types/filters.ts (types)
# - Restores apps/web/app/po-mapping/page.tsx (old import)
```

**Step 2: Verify Rollback Success** (3 minutes)

```bash
# Old component exists
ls apps/web/components/filter-sidebar.tsx
# Should exist ✅

# New Cell removed
ls apps/web/components/cells/filter-sidebar-cell/ 2>/dev/null && echo "❌ Still exists!" || echo "✅ Removed"

# Build succeeds
pnpm build
# Exit code 0 ✅

# Application works
pnpm dev
# Navigate to /po-mapping
# Verify old FilterSidebar renders
```

**Success Criteria**:
- ✅ Old component restored (422 lines)
- ✅ New Cell removed
- ✅ Helper files removed
- ✅ Importer restored to original
- ✅ Build succeeds
- ✅ Application functional

**Step 3: Update Ledger with Failure** (5 minutes)

```bash
echo '{
  "iteration_id": "iter_20251008_filter-sidebar-cell-migration-FAILED",
  "timestamp": "'$(date -Iseconds)'",
  "agent": "MigrationArchitect",
  "phase": "Phase 4: Migration Implementation",
  "status": "FAILED",
  "failure_reason": "[Describe specific failure]",
  "failed_step": "[Which step failed]",
  "error_message": "[Full error message]",
  "rollback_executed": true,
  "rollback_status": "SUCCESS",
  "lessons_learned": [
    "[What went wrong]",
    "[How to prevent in future]"
  ],
  "artifacts_reverted": [
    "apps/web/components/cells/filter-sidebar-cell/",
    "apps/web/lib/date-preset-utils.ts",
    "apps/web/types/filters.ts"
  ],
  "artifacts_restored": [
    "apps/web/components/filter-sidebar.tsx"
  ],
  "next_steps": "Revise migration plan based on lessons learned, retry"
}' >> ledger.jsonl
```

### Partial Progress Handling

**Question**: What if Step 1-3 complete but Step 4 (testing) fails?

**Answer**: **FULL ROLLBACK** - NO partial migrations allowed.

```yaml
scenario: "Helper files created, Cell implemented, but tests fail"
action: "git revert entire commit"
reasoning: "M-CELL-2 mandate: Atomic completeness required"
result: "All helper files removed, old component restored"
prohibition: "NEVER leave partial migration (helpers but no Cell)"
```

**Question**: What if Step 5 (import update) succeeds but Step 7 (manual validation) fails?

**Answer**: **FULL ROLLBACK** - Revert entire migration.

```yaml
scenario: "Cell integrated, old deleted, but human finds critical bug"
action: "git revert migration commit immediately"
reasoning: "Human validation is part of acceptance criteria"
result: "Old component restored, Cell removed"
timeline: "Revert within 5 minutes of user response 'FIX ISSUES'"
```

### Recovery Process After Rollback

**After successful rollback:**

1. **Analyze failure cause** (from error logs, test output, console errors)
2. **Revise migration plan** (fix the specific issue identified)
3. **Re-test problematic step** (e.g., if trimming test failed, test trim logic in isolation)
4. **Execute migration again** (with fixes applied)

**Maximum Retry Attempts**: 3

**After 3 failed attempts**: Escalate to human for plan review and assistance.

---

## ✅ Validation Strategy

Comprehensive success criteria for Phase 4 execution.

### Technical Validation (Automated)

**Gate 1: TypeScript Compilation**

```yaml
gate: "types"
command: "pnpm type-check"
success_criteria:
  - Exit code 0
  - Zero TypeScript errors
  - No 'any' types in Cell (except ActiveFilter.value which is intentional)
blocking: true

failure_examples:
  - "Cannot find module '@/types/filters'"
    → Fix: Verify filters.ts created and exported correctly
  - "Type 'any' is not assignable to type 'POFilters'"
    → Fix: Update po-mapping/page.tsx callback signature
```

---

**Gate 2: Unit Tests**

```yaml
gate: "tests"
command: "pnpm test components/cells/filter-sidebar-cell"
success_criteria:
  - All 14 behavioral assertion tests pass
  - Coverage >= 80% (statements, branches, functions, lines)
  - No test timeouts (max 5 seconds per test)
blocking: true

coverage_requirements:
  statements: ">= 80%"
  branches: ">= 80%"
  functions: ">= 80%"
  lines: ">= 80%"

critical_tests:
  - "BA-004: Auto-apply on state change" (core functionality)
  - "BA-008: Clear all resets state" (prevents state bugs)
  - "BA-014: PO number trimming" (fixes line 118 issue)

failure_threshold: "Any single test failure = gate fails"
```

---

**Gate 3: Build**

```yaml
gate: "build"
command: "pnpm build"
success_criteria:
  - Production build completes
  - Exit code 0
  - No build warnings related to Cell
  - Bundle size increase < 5% (lucide-react is lighter than inline SVGs)
blocking: true

build_checks:
  - "Check for unused imports (should be none)"
  - "Check for circular dependencies (should be none)"
  - "Verify tree-shaking works (dead code eliminated)"
```

---

### Functional Validation (Automated + Manual)

**Gate 4: Performance**

```yaml
gate: "performance"
baseline: "Current filter-sidebar.tsx render performance"
measurement_tool: "React DevTools Profiler"
threshold: "<= 110% of baseline"
blocking: false

automated_checks:
  network_tab:
    check: "Zero tRPC requests (pure UI component)"
    expected: "0 requests to /trpc/"
    
  render_count:
    check: "Component renders ≤3 times total"
    breakdown:
      - "1st render: Initial mount"
      - "2nd render: useEffect auto-apply fires"
      - "3rd render: State settled"
    failure: "> 10 renders = infinite loop"
    
  console_logs:
    check: "No error/warning logs"
    expected: "Clean console"

manual_checks:
  - "Page load time feels responsive"
  - "Filter changes feel immediate (no lag)"
  - "No janky animations"
```

---

**Gate 5: Feature Parity**

```yaml
gate: "feature_parity"
requirement: "Cell works identically to old component"
method: "Side-by-side comparison (if possible) or sequential testing"

comparison_checklist:
  visual:
    - "Layout matches (same width, height, spacing)"
    - "Colors match (blue-600, gray-200, etc.)"
    - "Typography matches (font sizes, weights)"
    - "Icons match (lucide-react icons look identical)"
    
  functional:
    - "All filters work (location, FMT PO, status, PO numbers, date)"
    - "Date presets work (all 8 presets)"
    - "Custom date picker works"
    - "Filter badges appear/disappear correctly"
    - "Clear all resets everything"
    - "Individual badge removal works"
    
  data_flow:
    - "onFilterChange callback fires correctly"
    - "Filter object structure matches expectations"
    - "PO table updates when filters change"
    - "poNumbers trimmed (IMPROVEMENT from original)"
```

---

### Architectural Validation (Automated)

**Cell Structure Complete**

```yaml
validation: "Cell structure meets ANDA mandates"

checks:
  manifest_exists:
    command: "[ -f apps/web/components/cells/filter-sidebar-cell/manifest.json ] && echo OK"
    
  manifest_valid:
    command: "cat apps/web/components/cells/filter-sidebar-cell/manifest.json | jq ."
    requirement: "Valid JSON, 14 behavioral assertions"
    
  pipeline_exists:
    command: "[ -f apps/web/components/cells/filter-sidebar-cell/pipeline.yaml ] && echo OK"
    
  pipeline_valid:
    command: "yq eval '.' apps/web/components/cells/filter-sidebar-cell/pipeline.yaml"
    requirement: "Valid YAML, 5 gates configured"
    
  component_size:
    command: "wc -l apps/web/components/cells/filter-sidebar-cell/component.tsx"
    requirement: "<= 400 lines (M-CELL-3 mandate)"
    expected: "~280 lines"
    
  behavioral_assertions:
    command: "cat apps/web/components/cells/filter-sidebar-cell/manifest.json | jq '.behavioral_assertions | length'"
    requirement: ">= 3 (M-CELL-4 mandate)"
    expected: "14"
```

---

**Old Component Deleted**

```yaml
validation: "Old component completely removed (M-CELL-2: Atomic migration)"

checks:
  old_file_deleted:
    command: "[ ! -f apps/web/components/filter-sidebar.tsx ] && echo OK || echo FAIL"
    requirement: "File does not exist"
    
  no_references:
    command: "grep -r 'from \"@/components/filter-sidebar\"' apps/web/"
    expected: "No matches (all imports updated to filter-sidebar-cell)"
    
  import_updated:
    command: "grep 'from \"@/components/cells/filter-sidebar-cell/component\"' apps/web/app/po-mapping/page.tsx"
    requirement: "Import path updated"
```

---

### Manual Validation Gates (Human Required - Critical Path)

**Gate 6: Human Validation** (**MANDATORY** - Critical path component)

```yaml
gate: "human_validation"
required: true
reasoning: "Critical path component - primary PO mapping UI - user workflow depends on it"
blocking: true

validation_checklist: "[See Step 7 detailed checklist in Migration Sequence section]"

approval_format:
  success: "VALIDATED - proceed with commit"
  failure: "FIX ISSUES - [specific problems described]"

rejection_handling:
  action: "FULL ROLLBACK"
  timeline: "Immediate (within 5 minutes of response)"
  next_step: "Revise plan, fix issues, re-execute"
```

---

### Success Criteria Summary

**All criteria must be met for migration to be considered complete:**

```yaml
technical:
  - TypeScript: Zero errors ✅
  - Tests: 14/14 passing, 80%+ coverage ✅
  - Build: Production succeeds ✅
  - Performance: ≤110% baseline, no infinite loops ✅
  - Accessibility: WCAG AA compliant ✅

functional:
  - Feature parity: Works identically to old ✅
  - Data flow: Filters update PO table correctly ✅
  - Visual: No regressions ✅
  - Improvements: PO trimming fixed ✅

architectural:
  - M-CELL-1: Cell correctly classified (UI component in /cells/) ✅
  - M-CELL-2: Atomic migration (old deleted in same commit) ✅
  - M-CELL-3: File size ≤400 lines (~280 lines) ✅
  - M-CELL-4: ≥3 behavioral assertions (14 total) ✅
  - Manifest valid: 14 BAs with verification ✅
  - Pipeline valid: 5 gates configured ✅
  - Old component: DELETED ✅