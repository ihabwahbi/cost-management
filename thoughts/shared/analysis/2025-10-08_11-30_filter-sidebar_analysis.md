# 🔍 Migration Analysis Report: filter-sidebar.tsx

**Agent**: MigrationAnalyst  
**Workflow Phase**: Phase 2 - Deep Migration Analysis  
**Timestamp**: 2025-10-08 11:30 UTC  
**Discovery Report**: [2025-10-08 08:59 Discovery Report](../discoveries/2025-10-08_08-59_discovery-report.md)

---

## 📋 Executive Summary

**Selected Target**: `apps/web/components/filter-sidebar.tsx`  
**Discovery Score**: 80/100 (HIGH severity)  
**Analysis Mode**: ULTRATHINK Enhanced  
**Migration Complexity**: Medium  
**Estimated Duration**: 6-8 hours  

**Key Findings**:
- ✅ Pure UI component (NO database dependencies, NO tRPC procedures needed)
- ⚠️ 422 lines (exceeds 300-line threshold for non-Cell components)
- ⚠️ Type safety gap: `any` type on line 86
- ✅ Clean single-importer architecture (low breaking change risk)
- ✅ High-value extraction opportunities (date presets, filter badges)
- ✅ Clear Cell migration path with helper extraction strategy

---

## 📊 Metadata

| Attribute | Value |
|-----------|-------|
| **Component Path** | `apps/web/components/filter-sidebar.tsx` |
| **Current Lines** | 422 |
| **Target Location** | `apps/web/components/cells/filter-sidebar-cell/` |
| **Imported By** | 1 component (po-mapping page) |
| **Critical Path** | ✅ YES - Primary PO mapping filter UI |
| **Mandate Violations** | M-CELL-1 (business logic outside /cells/) |

---

## 1️⃣ CURRENT IMPLEMENTATION

### File Structure

```yaml
file_path: "apps/web/components/filter-sidebar.tsx"
line_count: 422
component_type: "Client-side React component ('use client')"
export_type: "Named export: FilterSidebar"

key_sections:
  - lines_15_36: "Inline SVG icon components (CalendarIcon, XIcon, RotateCcwIcon, FilterIcon)"
  - lines_38_44: "formatDate helper function"
  - lines_46_83: "getDatePresets business logic (date calculations)"
  - lines_85_87: "Props interface with ANY type issue"
  - lines_89_422: "Main FilterSidebar component"
  
imports:
  ui_libraries:
    - "@/components/ui/card" (4 components)
    - "@/components/ui/select" (5 components)
    - "@/components/ui/calendar"
    - "@/components/ui/popover" (3 components)
    - "@/components/ui/textarea"
    - "@/components/ui/button"
    - "@/components/ui/badge"
    - "@/components/ui/label"
  utilities:
    - "react-day-picker" (DateRange type)
    - "@/lib/utils" (cn helper)
  frameworks:
    - "react" (useState, useEffect)
```

### State Management Analysis

**Pattern**: Local component state (6 useState hooks)  
**Complexity**: Medium (auto-applies filters via useEffect)

#### Complete State Inventory

| Hook | Type | Initial Value | Purpose | Update Locations |
|------|------|---------------|---------|------------------|
| **location** | `string` | `"all"` | Location filter dropdown | Lines 90, 131, 141, 323 |
| **fmtPo** | `boolean` | `false` | FMT PO toggle switch | Lines 91, 132, 144, 346 |
| **mappingStatus** | `string` | `"all"` | Mapping status selector | Lines 92, 133, 147, 373 |
| **poNumbers** | `string` | `""` | PO numbers textarea | Lines 93, 134, 150, 396 |
| **dateRange** | `DateRange \| undefined` | `undefined` | Date range picker | Lines 94, 134, 153, 160, 165 |
| **selectedPreset** | `string \| null` | `null` | UI state for preset highlight | Lines 95, 135, 154, 161, 166 |

**State Dependencies**: 
- useEffect (lines 125-127) triggers `applyFilters()` on ANY state change
- No debouncing (immediate callback on every keystroke)

### Business Logic Extraction

#### Function #1: `getDatePresets()` (Lines 46-83)

**Purpose**: Generate date preset options for quick filtering

**Date Calculations**:
```yaml
presets_generated:
  recent:
    - Today: new Date()
    - Yesterday: today - 1 day
    - Last 7 days: today - 7 days  
    - Last 30 days: today - 30 days
  periods:
    - This month: First day of current month → today
    - Last month: First day of previous month → Last day of previous month
    - This quarter: First day of quarter → today
    - This year: Jan 1 → today

dead_code: "Line 57-58: last90Days calculated but NEVER USED"

return_structure:
  recent: Array<{ label: string, range: DateRange }>
  periods: Array<{ label: string, range: DateRange }>
```

**Reusability Assessment**: 
- ✅ Pure function (no side effects)
- ✅ High reuse potential across other filter components
- ⚠️ Similar logic exists in `dashboard-filters.tsx` (70% overlap)
- 🎯 **Extraction Target**: `apps/web/lib/date-preset-utils.ts`

#### Function #2: `getActiveFilters()` (Lines 99-111)

**Purpose**: Aggregate active filters into displayable badge objects

**Logic Flow**:
```typescript
// Builds array of active filter objects
const active = []

if (location !== "all") 
  → { key: "location", label: "Location: ${value}", value }

if (fmtPo) 
  → { key: "fmtPo", label: "FMT PO Only", value: true }

if (mappingStatus !== "all")
  → { key: "mappingStatus", label: "Status: ${value}", value }

if (poNumbers.trim())  // ⚠️ Uses trim HERE
  → { key: "poNumbers", label: "PO Numbers", value }

if (dateRange?.from || dateRange?.to)
  → { key: "dateRange", label: selectedPreset || "Custom range", value: dateRange }

return active
```

**Used By**: Active filter badge display (lines 169-208)

**Reusability**: Medium (component-specific, but pattern is reusable)

#### Function #3: `applyFilters()` (Lines 113-123)

**Purpose**: Transform component state → parent callback format

**Transformation Logic**:
```typescript
{
  location: location === "all" ? undefined : location,
  fmtPo: fmtPo ? true : undefined,
  mappingStatus: mappingStatus === "all" ? undefined : mappingStatus,
  poNumbers: poNumbers,  // ⚠️ NOT TRIMMED (but IS trimmed in getActiveFilters!)
  dateRange: dateRange
}
```

**Issues Detected**:
- ⚠️ **Line 118**: `poNumbers` passed untrimmed (inconsistent with line 105)
- ⚠️ **Line 121**: Debug console.log with `[v0]` prefix (should be removed)
- 🔴 **Type Safety**: Callback typed as `(filters: any) => void`

### Dependencies

**UI Components** (all shadcn/ui):
- Card, CardContent, CardHeader, CardTitle
- Label, Select (5 sub-components)
- Textarea, Button, Badge
- Calendar, Popover (3 sub-components)

**Custom Components**:
- 4 inline SVG icons (CalendarIcon, XIcon, RotateCcwIcon, FilterIcon)
- Custom toggle switch (lines 345-358) - should use shadcn Switch
- Custom segmented control (lines 362-384) - could use shadcn ToggleGroup

**Utilities**:
- `cn` from @/lib/utils
- `DateRange` type from react-day-picker

---

## 2️⃣ REQUIRED CHANGES

### tRPC Procedures

**CRITICAL**: This is a **pure UI component** with NO database dependencies.

```yaml
procedures_needed: 0
database_tables: []
drizzle_schemas: []
explanation: "Component manages client-side filter state only. No server-side data fetching."
```

**Migration Strategy**: Cell will remain a pure UI component without tRPC queries.

### TypeScript Interface Definitions

**CRITICAL**: Replace `any` type with explicit interfaces

#### Current (Line 86) ❌
```typescript
interface FilterSidebarProps {
  onFilterChange: (filters: any) => void
}
```

#### Required ✅

**Create**: `apps/web/types/filters.ts`

```typescript
import type { DateRange } from "react-day-picker"

/**
 * Filter state for PO Mapping page
 */
export interface POFilters {
  /** Selected location (undefined = all) */
  location?: string
  
  /** FMT PO filter enabled (undefined = disabled) */
  fmtPo?: boolean
  
  /** Mapping status filter */
  mappingStatus?: "mapped" | "unmapped"
  
  /** PO numbers (comma or newline separated) */
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
 * Date preset configuration
 */
export interface DatePreset {
  /** Display label */
  label: string
  
  /** Date range */
  range: DateRange
}

/**
 * Props for FilterSidebar component
 */
export interface FilterSidebarProps {
  /** Callback invoked when filters change */
  onFilterChange: (filters: POFilters) => void
}
```

### Helper Extraction Strategy

**Phase 1: Extract Date Utilities** (2 hours)

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
 * 
 * @returns Object with recent and period presets
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
 * Format date for display
 * 
 * @param date - Date to format
 * @returns Formatted date string (e.g., "Jan 15, 2025")
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  })
}
```

**Phase 2: Extract Icon Components** (30 minutes)

**Option A**: Replace with lucide-react icons (RECOMMENDED)
```typescript
// In Cell component
import { Calendar, X, RotateCcw, Filter } from "lucide-react"

// Usage
<Calendar className="mr-2 h-4 w-4" />
```

**Option B**: Extract to dedicated icon components
```typescript
// Create: apps/web/components/ui/icons/calendar-icon.tsx
// (Keep existing SVG implementations)
```

**Recommendation**: Use lucide-react (12KB smaller bundle, maintained)

### Cell Structure Design

**Location**: `apps/web/components/cells/filter-sidebar-cell/`

**Complexity**: Medium  
**Estimated Migration Time**: 6-8 hours

```
apps/web/components/cells/filter-sidebar-cell/
├── component.tsx           # Main Cell component (250-300 lines after extraction)
├── manifest.json          # Behavioral assertions (12 assertions)
├── pipeline.yaml          # Validation gates
└── __tests__/
    └── component.test.tsx # Unit tests
```

#### Required Files

**component.tsx** (250-300 lines):
```typescript
"use client"

import { useState, useEffect } from "react"
import type { POFilters } from "@/types/filters"
import { getDatePresets, formatDate } from "@/lib/date-preset-utils"
import { Calendar, X, RotateCcw, Filter } from "lucide-react"
// ... other imports

export interface FilterSidebarCellProps {
  onFilterChange: (filters: POFilters) => void
}

export function FilterSidebarCell({ onFilterChange }: FilterSidebarCellProps) {
  // State management
  const [location, setLocation] = useState("all")
  const [fmtPo, setFmtPo] = useState(false)
  const [mappingStatus, setMappingStatus] = useState("all")
  const [poNumbers, setPONumbers] = useState("")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  
  const datePresets = getDatePresets()
  
  // Business logic
  const getActiveFilters = () => {
    // ... implementation
  }
  
  const applyFilters = () => {
    const filters: POFilters = {
      location: location === "all" ? undefined : location,
      fmtPo: fmtPo ? true : undefined,
      mappingStatus: mappingStatus === "all" ? undefined : mappingStatus,
      poNumbers: poNumbers.trim(), // ✅ FIXED: Now trimmed
      dateRange: dateRange,
    }
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
      {/* UI implementation */}
    </Card>
  )
}
```

**manifest.json**:
```json
{
  "id": "filter-sidebar-cell",
  "version": "1.0.0",
  "description": "Filter panel for PO mapping with date presets, location, status, and number filtering",
  "behavioral_assertions": [
    {
      "id": "BA-001",
      "description": "Component initializes with all filters in default/neutral state",
      "test_scenario": "Mount component, verify all state values match defaults (location='all', fmtPo=false, etc.)"
    },
    {
      "id": "BA-002",
      "description": "Displays active filter count badge when filters are applied",
      "test_scenario": "Apply filters, verify badge shows correct count"
    },
    {
      "id": "BA-003",
      "description": "Shows individual filter badges with remove buttons",
      "test_scenario": "Apply multiple filters, verify each has clickable badge with X icon"
    },
    {
      "id": "BA-004",
      "description": "Automatically calls onFilterChange when any filter state changes",
      "test_scenario": "Change filter state, verify callback invoked with updated filters"
    },
    {
      "id": "BA-005",
      "description": "Date preset selection updates dateRange and highlights preset button",
      "test_scenario": "Click preset button, verify dateRange updated and button highlighted"
    },
    {
      "id": "BA-006",
      "description": "Custom date range selection clears preset highlight",
      "test_scenario": "Select preset then custom range, verify preset highlight removed"
    },
    {
      "id": "BA-007",
      "description": "Individual filter removal via badge click resets that filter only",
      "test_scenario": "Apply multiple filters, click one badge X, verify only that filter reset"
    },
    {
      "id": "BA-008",
      "description": "Clear all button resets all filters to defaults",
      "test_scenario": "Apply multiple filters, click Clear All, verify all filters reset"
    },
    {
      "id": "BA-009",
      "description": "Displays empty state message when no filters are active",
      "test_scenario": "Ensure no filters applied, verify 'No filters applied' message visible"
    },
    {
      "id": "BA-010",
      "description": "Location select updates state and shows visual highlight when not 'all'",
      "test_scenario": "Change location to Jandakot, verify state updated and select highlighted"
    },
    {
      "id": "BA-011",
      "description": "FMT PO toggle switches between enabled/disabled with visual feedback",
      "test_scenario": "Click toggle, verify state changes and toggle animates"
    },
    {
      "id": "BA-012",
      "description": "Mapping status segmented control allows switching between all/mapped/unmapped",
      "test_scenario": "Click each segment option, verify state updates and visual selection"
    },
    {
      "id": "BA-013",
      "description": "PO numbers textarea shows active state when not empty",
      "test_scenario": "Enter PO numbers, verify textarea highlighted"
    },
    {
      "id": "BA-014",
      "description": "Trims whitespace from PO numbers before passing to parent",
      "test_scenario": "Enter '  12345  ', verify callback receives '12345'"
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
      "@/types/filters"
    ]
  }
}
```

**pipeline.yaml**:
```yaml
id: "filter-sidebar-cell"
version: "1.0.0"

gates:
  types:
    description: "TypeScript compilation with zero errors"
    command: "pnpm type-check"
    success_criteria: "Exit code 0"
    blocking: true
    
  tests:
    description: "Unit tests with 80%+ coverage"
    command: "pnpm test components/cells/filter-sidebar-cell"
    success_criteria: "All tests pass, coverage >= 80%"
    blocking: true
    
  build:
    description: "Production build succeeds"
    command: "pnpm build"
    success_criteria: "Build completes without errors"
    blocking: true
    
  performance:
    description: "Render performance within 110% baseline"
    baseline: "Current filter-sidebar.tsx performance"
    threshold: "110%"
    blocking: false
    
  accessibility:
    description: "WCAG AA compliance"
    checks:
      - "Keyboard navigation works for all controls"
      - "ARIA labels present on interactive elements"
      - "Color contrast meets AA standards"
    blocking: true

behavioral_assertions:
  minimum_required: 3
  actual_count: 14
  coverage_requirement: "All 14 assertions must have corresponding tests"
```

---

## 3️⃣ INTEGRATION ANALYSIS

### Imported By

**Count**: 1 component (low integration risk)

#### `apps/web/app/po-mapping/page.tsx`

**Import Statement** (Line 6):
```typescript
import { FilterSidebar } from "@/components/filter-sidebar"
```

**Usage Context** (Line 258):
```tsx
<FilterSidebar onFilterChange={handleFilterChange} />
```

**Integration Details**:
- **Layout**: ResizablePanelGroup (3-panel layout)
- **Panel Position**: Left sidebar (defaultSize: 20%, minSize: 15%, maxSize: 30%)
- **Data Flow**: FilterSidebar → handleFilterChange → filteredPOs state → POTable
- **Sibling Components**: POTable (middle), DetailsPanel (right)
- **Critical Path**: ✅ YES - Primary user workflow for PO mapping

**Callback Implementation** (po-mapping/page.tsx, line 155):
```typescript
const handleFilterChange = (filters: any) => {
  // Apply filters to allPOs array
  // Update filteredPOs state
  // POTable re-renders with filtered data
}
```

### Shared State Dependencies

**Detected**: ❌ None

**Analysis**: Component is fully self-contained:
- Manages own state via useState hooks
- No Context consumption
- No Zustand store usage
- Communicates via props only (onFilterChange callback)

### Breaking Changes Assessment

**Risk Level**: 🟢 **LOW**

**Potential Breaks**:
1. **Import path change**: `filter-sidebar` → `cells/filter-sidebar-cell`
   - **Impact**: 1 file needs update
   - **Mitigation**: Atomic replacement in same commit
   
2. **Component name change**: `FilterSidebar` → `FilterSidebarCell`
   - **Impact**: 1 usage site needs update
   - **Mitigation**: Find/replace in po-mapping/page.tsx

3. **Props interface change**: `any` → `POFilters`
   - **Impact**: `handleFilterChange` callback signature must match
   - **Mitigation**: Update po-mapping/page.tsx callback type
   
4. **Filter object structure**: Internal changes (trimming, undefined mappings)
   - **Impact**: Parent page may receive slightly different filter values
   - **Mitigation**: Verify parent page handles trimmed poNumbers and undefined values

**Migration Strategy**: 
- ✅ Complete replacement in single commit
- ✅ Update import and component name in po-mapping/page.tsx
- ✅ Update callback type signature
- ✅ Manual validation of filter behavior after migration

### Critical Path Assessment

**Is Critical**: ✅ **ABSOLUTELY CRITICAL**

**Reasoning**:
1. **Core Feature**: PO Mapping is primary user workflow
2. **User Impact**: Without filters, users cannot search/narrow down POs
3. **Layout Integration**: Occupies 20% of viewport width (dedicated panel)
4. **No Alternatives**: Only filtering mechanism for PO mapping
5. **Blocking**: Removal would severely degrade UX

**User Journey**:
```
User → /po-mapping → Sees hundreds of POs 
    → Uses FilterSidebar to narrow down
    → Selects specific PO from filtered results
    → Maps PO in DetailsPanel
```

**Testing Requirements**: 
- Manual validation REQUIRED in Phase 4
- Full user flow testing (filter → table update → selection)

---

## 4️⃣ MIGRATION CONSTRAINTS

### Replacement Mode

```yaml
mode: "complete"
reasoning: "ANDA mandate M-CELL-2: Complete atomic transformation required"
parallel_implementation_forbidden: true
phased_approach: false
```

### Deletion Required

```yaml
old_component_path: "apps/web/components/filter-sidebar.tsx"
deletion_timing: "Same commit as Cell creation"
verification_command: "grep -r 'filter-sidebar' apps/web/ | grep -v 'filter-sidebar-cell'"
expected_result: "Zero references to old component after migration"
```

### Atomic Migration

```yaml
atomic: true
commit_strategy: "All changes in single atomic commit"
phases_required: ["All 14 behavioral assertions must be tested before deletion"]
partial_migration: false
notes: "Migration MUST follow M-CELL-2: complete atomic transformation"
```

---

## 5️⃣ PITFALL WARNINGS

### Technical Pitfalls

#### Pitfall #1: Inconsistent PO Number Trimming
**Location**: Lines 105, 118  
**Risk**: Data integrity issue  
**Details**:
- Line 105: `poNumbers.trim()` used for active filter display
- Line 118: `poNumbers` passed untrimmed to parent callback
- **Impact**: Parent receives untrimmed values, may cause filtering inconsistencies

**Fix Required**:
```typescript
// Line 118 - CURRENT (WRONG)
poNumbers: poNumbers,

// FIXED
poNumbers: poNumbers.trim(),
```

#### Pitfall #2: Debug Console Log
**Location**: Line 121  
**Risk**: Production noise, debug code  
**Details**: `console.log("[v0] Filter values:", filters)`

**Fix Required**: Remove or replace with proper logging utility

#### Pitfall #3: Dead Code
**Location**: Lines 57-58  
**Risk**: Code bloat, confusion  
**Details**: `last90Days` calculated but never used

**Fix Required**: Delete lines 57-58

#### Pitfall #4: No Debouncing on Text Input
**Location**: Lines 125-127 (useEffect)  
**Risk**: Performance issue  
**Details**: `applyFilters()` called on EVERY keystroke in PO numbers textarea

**Fix Required**:
```typescript
import { useDebouncedValue } from "@/hooks/use-debounced-value"

const debouncedPONumbers = useDebouncedValue(poNumbers, 300)

useEffect(() => {
  applyFilters()
}, [location, fmtPo, mappingStatus, debouncedPONumbers, dateRange])
```

### Architectural Anti-Patterns

#### AP1: Misclassification (M-CELL-1 Violation)
**Severity**: 🔴 HIGH  
**Details**: 
- Component has business logic (6 state hooks, date calculations, filter aggregation)
- Located in `apps/web/components/` (NOT in `/cells/`)
- **Violates**: M-CELL-1 (All functionality must be in Cells)

**Fix Required**: Migrate to `apps/web/components/cells/filter-sidebar-cell/`

#### AP2: God Component (M-CELL-3 Warning)
**Severity**: 🟡 MEDIUM  
**Details**:
- 422 lines exceeds 300-line threshold for non-Cell components
- No extraction strategy in place

**Fix Required**: Extract helpers (date presets, icons) to reduce to ~250-300 lines

#### AP3: Type Safety Gap (M-CELL-4 Related)
**Severity**: 🟡 MEDIUM  
**Details**:
- Line 86: `onFilterChange: (filters: any) => void`
- Weakens type safety guarantees

**Fix Required**: Replace with `POFilters` interface

#### AP4: Inconsistent UI Patterns
**Severity**: 🟡 MEDIUM  
**Details**:
- Custom toggle switch (lines 345-358) instead of shadcn Switch
- Custom segmented control (lines 362-384) instead of shadcn ToggleGroup
- Custom SVG icons instead of lucide-react

**Fix Required**: Standardize on shadcn/lucide-react components

---

## 6️⃣ COMPLEXITY ASSESSMENT

### Complexity Factors

```yaml
line_count:
  value: 422
  classification: "complex (> 300 lines for non-Cell)"
  
query_count:
  value: 0
  classification: "simple (no database queries)"
  note: "Pure UI component"
  
state_management:
  pattern: "Local useState (6 hooks)"
  classification: "medium"
  complexity_drivers:
    - "6 interdependent state hooks"
    - "Auto-apply via useEffect"
    - "Active filter tracking"
  
data_transformations:
  complexity: "medium"
  operations:
    - "Date preset calculations (8 presets)"
    - "Filter aggregation (getActiveFilters)"
    - "State → callback transformation (applyFilters)"
    
dependencies:
  ui_components: 17
  classification: "medium (15-20 imports)"
  
overall_complexity: "MEDIUM"
estimated_duration: "6-8 hours"
```

### Migration Time Estimate

**Standard Cell workflow**: 6-8 hours

**Breakdown**:
- Helper extraction (date utils, types): 2 hours
- Cell component creation: 2 hours
- Behavioral assertion tests (14 assertions): 2-3 hours
- Integration & manual validation: 1-2 hours
- Cleanup & documentation: 1 hour

---

## 7️⃣ BEHAVIORAL ASSERTIONS

**Minimum Required**: 3 (M-CELL-4)  
**Extracted**: 14 assertions

### Complete Behavioral Contract

| ID | Description | Source | Test Scenario |
|----|-------------|--------|---------------|
| **BA-001** | Component initializes with all filters in default state | Lines 90-95 | Mount component, verify location='all', fmtPo=false, mappingStatus='all', poNumbers='', dateRange=undefined, selectedPreset=null |
| **BA-002** | Displays active filter count badge when filters applied | Lines 176-180 | Apply 3 filters, verify badge shows "3 active" |
| **BA-003** | Shows individual filter badges with remove buttons | Lines 186-196 | Apply location + fmtPo, verify 2 badges with X icons |
| **BA-004** | Automatically calls onFilterChange on state changes | Lines 125-127 | Change location, verify callback invoked with updated filters |
| **BA-005** | Date preset selection updates range and highlights button | Lines 159-162, 229 | Click "Last 7 days", verify dateRange set and button highlighted |
| **BA-006** | Custom date range clears preset highlight | Lines 164-167 | Select preset, then custom range, verify selectedPreset=null |
| **BA-007** | Individual filter removal resets only that filter | Lines 138-157 | Apply location + fmtPo, remove location badge, verify only location reset |
| **BA-008** | Clear all button resets all filters to defaults | Lines 129-136 | Apply multiple filters, click "Clear all", verify all state reset |
| **BA-009** | Shows empty state when no filters active | Lines 404-418 | Clear all filters, verify "No filters applied" message |
| **BA-010** | Location select shows highlight when not "all" | Lines 324 | Select Jandakot, verify blue border styling applied |
| **BA-011** | FMT PO toggle switches with visual feedback | Lines 345-358 | Click toggle, verify fmtPo flips and animation runs |
| **BA-012** | Mapping status allows all/mapped/unmapped selection | Lines 365-384 | Click each option, verify state updates and visual selection |
| **BA-013** | PO numbers textarea highlights when not empty | Lines 397-401 | Enter "12345", verify blue border styling |
| **BA-014** | Trims whitespace from PO numbers before callback | Lines 113-123 (FIXED) | Enter "  12345  ", verify callback receives "12345" |

---

## 8️⃣ RECOMMENDATIONS

### Migration Strategy

**Classification**: Standard Cell workflow  
**Phasing Required**: No (pure UI, no database complexity)  
**Estimated Duration**: 6-8 hours  
**Priority**: High (architectural debt removal)

### Extraction Sequence

**Phase 1: Helper Extraction** (2 hours)
1. Create `apps/web/types/filters.ts` (TypeScript interfaces)
2. Create `apps/web/lib/date-preset-utils.ts` (date logic extraction)
3. Verify exports work correctly

**Phase 2: Cell Creation** (2 hours)
1. Create Cell directory structure
2. Implement component.tsx with extracted helpers
3. Replace custom toggle with shadcn Switch
4. Replace custom segmented control with shadcn ToggleGroup (optional)
5. Replace custom SVG icons with lucide-react
6. Fix trimming inconsistency (line 118)
7. Remove debug console.log (line 121)
8. Delete dead code (lines 57-58)

**Phase 3: Testing** (2-3 hours)
1. Create manifest.json with 14 behavioral assertions
2. Create pipeline.yaml with validation gates
3. Write unit tests for all assertions
4. Achieve 80%+ coverage

**Phase 4: Integration** (1-2 hours)
1. Update import in po-mapping/page.tsx
2. Update component name: FilterSidebar → FilterSidebarCell
3. Update callback type: any → POFilters
4. Manual validation of full user flow
5. Verify filter behavior matches original

**Phase 5: Cleanup** (1 hour)
1. Delete old component: apps/web/components/filter-sidebar.tsx
2. Verify no references remain: `grep -r 'filter-sidebar' apps/web/`
3. Update ledger.jsonl
4. Commit with clear message

### Enhancement Opportunities

**Optional Improvements** (can be done later):
1. Add debouncing for PO numbers input (30 min)
2. Extract active filter badge pattern to reusable component (2 hours)
3. Persist filter state to localStorage (1 hour)
4. Add URL param synchronization (1 hour)
5. Extract segmented control to shadcn ToggleGroup (30 min)

---

## 9️⃣ LEDGER ENTRY SPECIFICATION

### Iteration ID

```yaml
iteration_id: "iter_20251008_1130_filter-sidebar-cell-migration"
human_prompt: "[Will be provided in Phase 4 by user]"
```

### Artifacts Created

```yaml
artifacts_created:
  - type: "cell"
    id: "filter-sidebar-cell"
    path: "apps/web/components/cells/filter-sidebar-cell/"
    files:
      - "component.tsx"
      - "manifest.json"
      - "pipeline.yaml"
      - "__tests__/component.test.tsx"
    
  - type: "utility"
    id: "date-preset-utils"
    path: "apps/web/lib/date-preset-utils.ts"
    
  - type: "types"
    id: "filters"
    path: "apps/web/types/filters.ts"
```

### Artifacts Replaced

```yaml
artifacts_replaced:
  - type: "component"
    id: "filter-sidebar"
    path: "apps/web/components/filter-sidebar.tsx"
    deletion_reason: "Replaced by Cell architecture migration (M-CELL-1 compliance)"
    # CRITICAL: Will be DELETED in Phase 4
```

### Schema Changes

```yaml
schema_changes: []
# No database changes (pure UI component)
```

---

## 🔟 NEXT STEPS

### Phase 3: Migration Planning

**Hand off to**: MigrationArchitect  
**Expected Output**: Surgical migration plan

**Critical Information**:
- ✅ All analysis complete
- ✅ 14 behavioral assertions extracted
- ✅ Helper extraction strategy defined
- ✅ Type interfaces designed
- ✅ Integration impact assessed (low risk)
- ✅ Cell structure fully specified

**Key Focus Areas for Phase 3**:
1. Detailed step-by-step migration plan
2. Testing strategy for 14 behavioral assertions
3. Integration validation checklist
4. Rollback procedure if needed

---

## 📚 REFERENCE MATERIALS

### Key Files Referenced
- ✅ Discovery report: `thoughts/shared/discoveries/2025-10-08_08-59_discovery-report.md`
- ✅ Target component: `apps/web/components/filter-sidebar.tsx`
- ✅ Integration target: `apps/web/app/po-mapping/page.tsx`
- ✅ Similar component: `apps/web/components/dashboard/dashboard-filters.tsx`

### Architecture Documents
- ANDA Mandates: M-CELL-1, M-CELL-2, M-CELL-3, M-CELL-4
- Cell Development Checklist: `docs/cell-development-checklist.md`
- tRPC Debugging Guide: `docs/trpc-debugging-guide.md`

---

**End of Analysis Report**

**Confidence Level**: ✅ HIGH (Comprehensive analysis with exact file:line references)  
**Ready for Phase 3**: ✅ YES  
**Analyst**: MigrationAnalyst (Phase 2 Agent)  
**Timestamp**: 2025-10-08 11:30 UTC
