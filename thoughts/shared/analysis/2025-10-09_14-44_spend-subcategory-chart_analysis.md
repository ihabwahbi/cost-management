# Migration Analysis Report
**Phase 2: Migration Analysis**

---

## Metadata

| Field | Value |
|-------|-------|
| **Timestamp** | 2025-10-09T14:44:00Z |
| **Agent** | MigrationAnalyst |
| **Workflow Phase** | Phase 2: Migration Analysis |
| **Target Component** | spend-subcategory-chart.tsx |
| **Discovery Report** | thoughts/shared/discoveries/2025-10-09_14-10_discovery-report.md |
| **Discovery Score** | 35/100 (HIGH severity) |

---

## Current Implementation

### File Information
```yaml
path: "apps/web/components/dashboard/spend-subcategory-chart.tsx"
line_count: 283
complexity_assessment: "MEDIUM"
```

### Database Usage
```yaml
queries: []  # NONE - Pure presentation component
tables: []   # Data received via props
type: "props-only"
```

**Data Source**:
- Component receives `SubcategoryData[]` via props from parent (`ChartsSection`)
- Parent fetches via tRPC: `dashboard.getProjectHierarchicalBreakdown`
- Transformation: `transformSubcategories()` utility flattens 4-level hierarchy
- **NO direct database queries or tRPC calls in this component**

### State Management
```yaml
pattern: "local useState, no persistence"
state_vars:
  - name: "expandedCategories"
    type: "Set<string>"
    purpose: "Track expanded categories in list view"
    location: "line 29"
    
  - name: "viewMode"
    type: "'tree' | 'list'"
    purpose: "Toggle between treemap and list visualization"
    location: "line 30"
```

**State Analysis**:
- ✅ **Properly isolated**: No shared state or context dependencies
- ✅ **Immutable updates**: `expandedCategories` uses Set cloning pattern
- ⚠️ **Missing memoization**: Data transformations not wrapped in useMemo

### Dependencies

**External UI Components**:
- `@/components/ui/card` - Card, CardContent, CardHeader, CardTitle
- `@/components/ui/button` - Button  
- `recharts` - ResponsiveContainer, Treemap
- `lucide-react` - ChevronDown, ChevronRight, Package

**Utilities**:
- `@/lib/utils` - cn (className utility)
- `react` - useState

**Props Interface**:
```typescript
interface SubcategoryData {
  category: string      // Spend Type (parent category)
  subcategory: string   // Leaf subcategory name
  value: number         // Actual spend from PO mappings
  budget: number        // Budget allocation
  percentage: number    // Utilization % (actual/budget * 100)
}

interface SpendSubcategoryChartProps {
  data: SubcategoryData[]
  loading?: boolean
  onDrillDown?: (category: string, subcategory: string) => void
}
```

### Business Logic

#### 1. Data Grouping (lines 33-46)
```typescript
// Groups flat subcategory array by parent category
// Aggregates totals and budgets per category
// Collects subcategories into nested structure
```
**Input**: `SubcategoryData[]` (flat array)  
**Output**: `Record<string, GroupedCategory>` (nested object)  
**Complexity**: O(n)

#### 2. Treemap Data Transformation (lines 50-59)
```typescript
// Converts grouped data to Recharts Treemap format
// Hierarchical structure: parent nodes with children arrays
```
**Input**: `GroupedCategory[]`  
**Output**: `TreemapNode[]`  
**Complexity**: O(n×m) where m = avg subcategories per category

#### 3. Currency Formatting (lines 61-69)
```typescript
// Formats USD with intelligent notation
// >$1M uses compact notation ("$1.5M")
// ≤$1M uses standard notation ("$850,000")
```
**Threshold**: 1,000,000  
**Usage**: Treemap labels, list values, grand total

#### 4. Utilization Calculation (lines 190-192, 231-233)
```typescript
// Calculates budget utilization percentage
// Formula: (actual_spend / allocated_budget) × 100
// Safeguard: Returns 0 if budget is 0 (prevents NaN)
```
**Color Coding**:
- `>100%` → Red (#ef4444) - Over budget
- `>80%` → Amber (#f59e0b) - Warning  
- `≤80%` → Green (#10b981) - On track

#### 5. Color Assignment (lines 82-85, 99, 208)
```typescript
// 8-color palette for category differentiation
// Modulo cycling for categories beyond 8
```
**Colors**: Blue, Green, Amber, Red, Purple, Pink, Cyan, Lime  
**Algorithm**: `index % COLORS.length`

---

## Required Changes

### Drizzle Schemas
**NONE REQUIRED** - Component uses existing data from parent.

**Existing Schema Dependencies** (via parent):
- `cost_breakdown` table - Accessed via `dashboard.getProjectHierarchicalBreakdown`
- `po_mappings` table - Joined for actual spend calculation

### tRPC Procedures
**NONE REQUIRED** - Component receives data via props.

**Existing Procedure Used** (by parent):
```yaml
procedure: "dashboard.getProjectHierarchicalBreakdown"
location: "packages/api/src/procedures/dashboard/get-project-hierarchical-breakdown.procedure.ts"
export_pattern: "export const getProjectHierarchicalBreakdown = publicProcedure..."

input_schema: |
  z.object({
    projectId: z.string().uuid(),
    filters: z.object({
      costLine: z.string().optional(),
      spendType: z.string().optional()
    }).optional()
  })

output_schema: |
  z.object({
    hierarchy: z.array(HierarchyNode)  // 4-level nested structure
  })

implementation_notes:
  - "Queries cost_breakdown and po_mappings tables"
  - "Returns hierarchical data (Business Line → Cost Line → Spend Type → Subcategory)"
  - "Transformed by transformSubcategories() utility before passing to component"
  - "Already deployed and working - NO changes needed"
```

### Cell Structure

**Location**: `components/cells/spend-subcategory-chart/`  
**Complexity**: MEDIUM  
**Estimated Migration Time**: 6-8 hours

**File Structure**:
```yaml
components/cells/spend-subcategory-chart/
  ├── component.tsx              # 120 lines - Main orchestrator
  ├── components/
  │   ├── treemap-view.tsx       # 80 lines - Recharts treemap + custom SVG
  │   ├── list-view.tsx          # 90 lines - Expandable category list
  │   └── category-item.tsx      # 60 lines - Individual category row
  ├── utils/
  │   ├── data-formatters.ts     # 30 lines - formatCurrency, calculateUtilization
  │   └── color-utils.ts         # 20 lines - COLORS array, getColor, getUtilizationColor
  ├── types.ts                   # 30 lines - Interfaces (consolidate with parent)
  ├── manifest.json              # Behavioral assertions BA-001 to BA-010
  ├── pipeline.yaml              # Validation gates
  └── __tests__/
      ├── component.test.tsx     # Main component tests
      ├── treemap-view.test.tsx  # Treemap-specific tests
      └── list-view.test.tsx     # List view tests
```

**File Size Verification**:
- All files ≤120 lines ✅
- Maximum file: 120 lines (component.tsx) ✅
- Well under 400-line mandate ✅

### Behavioral Assertions

**Extracted**: 10 assertions (exceeds minimum of 3)

#### BA-001: View Mode Toggle
- **Requirement**: Component MUST support both 'tree' and 'list' view modes with toggle buttons
- **Source**: Lines 30, 158-171 (state + buttons), Line 174 (conditional render)
- **Validation**: Unit test - click tree/list buttons, verify correct view renders
- **Criticality**: HIGH

#### BA-002: Treemap Visualization
- **Requirement**: Tree view MUST display hierarchical treemap using Recharts library
- **Source**: Lines 50-59 (data prep), Lines 175-185 (Recharts Treemap)
- **Validation**: Visual regression test - snapshot treemap rendering
- **Criticality**: HIGH

#### BA-003: Color Palette
- **Requirement**: Categories MUST be color-coded using 8-color palette with modulo cycling
- **Source**: Lines 82-85 (COLORS definition), Lines 99, 208 (application)
- **Validation**: Unit test - verify COLORS array used, correct modulo logic
- **Criticality**: MEDIUM

#### BA-004: Expandable Categories
- **Requirement**: List view MUST show expandable categories with chevron indicators
- **Source**: Lines 71-79 (toggleCategory), 189 (isExpanded check), 201-205 (icons)
- **Validation**: Unit test - click category, verify expandedCategories state update
- **Criticality**: HIGH

#### BA-005: Currency Formatting
- **Requirement**: Currency values MUST use compact notation for amounts >$1M (e.g., "$1.5M")
- **Source**: Lines 61-69 (formatCurrency function), Line 67 (threshold logic)
- **Validation**: Unit test - formatCurrency(1500000) === "$1.5M"
- **Criticality**: MEDIUM

#### BA-006: Utilization Color Coding
- **Requirement**: Utilization MUST color-code: >100% red, >80% amber, ≤80% green
- **Source**: Lines 190-192, 231-233 (calculation), Lines 216-223, 251-258 (color logic)
- **Validation**: Unit test - verify className based on utilization thresholds
- **Criticality**: MEDIUM

#### BA-007: Loading State
- **Requirement**: Component MUST display spinner when loading prop is true
- **Source**: Lines 20 (prop), 26 (default), 134-147 (loading UI)
- **Validation**: Unit test - render with loading=true, verify spinner presence
- **Criticality**: HIGH

#### BA-008: Drill-Down Callback
- **Requirement**: onDrillDown callback MUST fire on category/subcategory click with correct params
- **Source**: Lines 21 (prop interface), 105 (treemap), 239-242 (list view)
- **Validation**: Unit test - mock callback, click subcategory, verify called with (category, subcategory)
- **Criticality**: MEDIUM

#### BA-009: Grand Total Summary
- **Requirement**: Footer MUST show total spend across all subcategories
- **Source**: Lines 272-280 (summary section), Line 277 (calculation)
- **Validation**: Unit test - verify sum calculation matches categoryArray.reduce()
- **Criticality**: LOW

#### BA-010: Empty Data Handling
- **Requirement**: Component MUST gracefully handle empty data array without crashing
- **Source**: Currently handled by ChartsSection parent (conditional render)
- **Validation**: Unit test - render with data=[], verify no crash or error message
- **Criticality**: MEDIUM

### Pipeline Gates

```yaml
on_change:
  - name: "Type Check"
    run: "tsc --noEmit"
    required: true
    
  - name: "Lint"
    run: "eslint component.tsx components/ utils/"
    required: true
    
  - name: "Unit Tests"
    run: "vitest run --coverage"
    coverage_threshold: 80
    required: true
    
  - name: "Behavioral Assertions Validation"
    run: "node scripts/validate-assertions.js ./manifest.json"
    required: true
    
  - name: "Accessibility Audit"
    run: "axe-core ./component.tsx"
    required: true
    
  - name: "Visual Regression"
    run: "percy snapshot"
    required: true

success_criteria:
  - "All required gates pass"
  - "Coverage ≥80%"
  - "All behavioral assertions have tests"
  - "Zero accessibility violations"
  - "Visual snapshots match baseline"
```

---

## Integration Analysis

### Imported By

**Direct Importers**: 1 component

#### `/apps/web/components/cells/project-dashboard-page/components/charts-section.tsx`
- **Usage Context**: Main project dashboard chart visualization section
- **Import Statement**: `import { SpendSubcategoryChart } from '@/components/dashboard/spend-subcategory-chart'`
- **Props Passed**:
  ```typescript
  <SpendSubcategoryChart
    data={subcategoryData}     // From parent prop
    loading={loading}          // From parent prop
    onDrillDown={(category, subcategory) => {
      console.log('[Dashboard] Drill down:', category, subcategory)
    }}
  />
  ```
- **Conditional Rendering**: Only renders when `subcategoryData.length > 0`
- **Empty State**: Handled by parent component

### Import Chain Analysis

**Entry Point to Component** (3 levels deep):
```
Level 0 (CRITICAL): /app/projects/[id]/dashboard/page.tsx
  ↓
Level 1 (HIGH): /components/cells/project-dashboard-page/component.tsx
  ↓
Level 2 (HIGH): /components/cells/project-dashboard-page/components/charts-section.tsx
  ↓
Level 3 (TARGET): /components/dashboard/spend-subcategory-chart.tsx
```

### Shared State

**State Isolation**: ✅ **FULLY ENCAPSULATED**
- No React Context usage
- No Zustand/Redux stores
- No prop drilling of state
- Both state variables (`expandedCategories`, `viewMode`) are 100% local

### Breaking Changes

**Risk Level**: 🟡 **LOW-MEDIUM**

**Low-Risk Factors**:
- ✅ Single importer (only 1 file to update)
- ✅ Well-defined TypeScript interfaces
- ✅ State fully isolated
- ✅ Optional callbacks (onDrillDown currently unused)
- ✅ No re-exports elsewhere

**Medium-Risk Factors**:
- ⚠️ Critical user path (main project dashboard)
- ⚠️ Core visualization feature
- ⚠️ Data shape dependency (tightly coupled to SubcategoryData)
- ⚠️ UI breaking changes could affect visual layout

**Potential Breaking Changes**:
1. **Changing data prop interface** - Would break parent's data passing
2. **Removing required props** - Only `data` is required, removal breaks usage
3. **Chart rendering logic changes** - Could break visual display
4. **Component removal** - Would break project dashboard page ❌ HIGH IMPACT

**Mitigation Strategy**: 
- Atomic replacement in single commit
- Update single importer (charts-section.tsx)
- Maintain identical props interface
- Test visual parity before deletion

### Critical Path Assessment

**Is Critical**: ✅ **YES**

**Reasons**:
1. **Main Dashboard Page**: Used on `/app/projects/[id]/dashboard/page.tsx`
   - Primary project detail view
   - Users navigate here from project list
   
2. **Core Feature**: Spend subcategory visualization
   - One of 6 main dashboard sections
   - Provides treemap and list views
   - Shows budget vs actual comparison

3. **User Impact if Broken**:
   - 🔴 High severity: Cannot view subcategory breakdown
   - 🔴 High visibility: Prominently displayed on dashboard
   - 🔴 High frequency: Viewed on every project load

**Testing Requirement**: ✅ **Manual validation required in Phase 4**

---

## Migration Constraints

### Replacement Mode
**Mode**: `complete`  
**Rationale**: ANDA mandate M-CELL-2 (Complete Atomic Migrations)

### Deletion Required

**Old Component Path**: `apps/web/components/dashboard/spend-subcategory-chart.tsx`  
**Deletion Timing**: Same commit as Cell creation  
**Verification Command**: `grep -r 'spend-subcategory-chart' apps/web/components --exclude-dir=cells`  
**Expected Result**: Zero references after migration

### Atomic Migration
**Required**: ✅ **YES**  
**Phases All Required**: ✅ **YES**  
**Parallel Implementation Forbidden**: ✅ **YES**

**Migration Steps (ALL MANDATORY)**:
1. ✅ Create Cell structure (`components/cells/spend-subcategory-chart/`)
2. ✅ Extract all code into files ≤400 lines (7 files planned)
3. ✅ Create manifest.json with 10 behavioral assertions
4. ✅ Create pipeline.yaml with validation gates
5. ✅ Implement comprehensive unit tests (≥80% coverage)
6. ✅ Update import in charts-section.tsx
7. ✅ Delete old component file
8. ✅ Commit as single atomic change

**Notes**: Migration MUST follow M-CELL-2 mandate - complete atomic transformation in single commit. NO partial migrations, NO optional phases, NO "future cleanup".

---

## Pitfall Warnings

### Detected Pitfalls

#### Pitfall #1: Missing Memoization ⚠️ MEDIUM SEVERITY
**Location**: Lines 33-46, 48, 50-59  
**Risk**: Performance degradation with large datasets, unnecessary re-renders  
**Description**: Data transformations (groupedData, categoryArray, treemapData) run on every render without useMemo

**Fix Required**:
```typescript
const groupedData = useMemo(() => 
  data.reduce((acc, item) => { /* ... */ }, {}),
  [data]
)

const categoryArray = useMemo(() => 
  Object.values(groupedData),
  [groupedData]
)

const treemapData = useMemo(() =>
  categoryArray.map(cat => ({ /* ... */ })),
  [categoryArray]
)
```

#### Pitfall #2: Type Safety Gap ⚠️ LOW SEVERITY
**Location**: Line 46  
**Risk**: Loses type safety for grouped data structure  
**Description**: Using `Record<string, any>` instead of specific interface

**Fix Required**:
```typescript
interface GroupedCategory {
  category: string
  total: number
  budget: number
  subcategories: SubcategoryData[]
}

{} as Record<string, GroupedCategory>
```

#### Pitfall #3: Performance - findIndex in Loop ⚠️ LOW-MEDIUM SEVERITY
**Location**: Line 99  
**Risk**: O(n) lookup inside render loop for every treemap node  
**Description**: `categoryArray.findIndex()` called repeatedly

**Fix Required**:
```typescript
// Pre-compute category index map
const categoryIndexMap = useMemo(() => 
  new Map(categoryArray.map((c, i) => [c.category, i])),
  [categoryArray]
)

// Use O(1) lookup
(categoryIndexMap.get(category || name) ?? 0) % COLORS.length
```

#### Pitfall #4: Duplicate Logic ⚠️ LOW SEVERITY
**Location**: Lines 190-192, 231-233  
**Risk**: DRY violation, harder to maintain  
**Description**: Identical utilization calculation repeated

**Fix Required**: Extract to `calculateUtilization()` utility function

#### Pitfall #5: No Empty Data Handling ⚠️ LOW SEVERITY
**Location**: Component body  
**Risk**: Shows empty chart if parent removes conditional  
**Description**: Component doesn't handle `data.length === 0`

**Fix Required**:
```typescript
if (data.length === 0 && !loading) {
  return <EmptyState message="No subcategory data available" />
}
```

### Architectural Anti-Patterns

#### AP-1: Misclassification ❌ VIOLATION
**Mandate**: M-CELL-1 (All Functionality as Cells)  
**Issue**: Component has business logic and state but NOT in `/components/cells/`  
**Current Location**: `/components/dashboard/` ← WRONG  
**Expected Location**: `/components/cells/spend-subcategory-chart/`  
**Severity**: HIGH

#### AP-5: Missing Contract ❌ VIOLATION
**Mandate**: M-CELL-4 (Explicit Behavioral Contracts)  
**Issue**: No manifest.json or pipeline.yaml files exist  
**Behavioral Assertions**: Implicit only (no documentation)  
**Required**: Minimum 3 assertions (10 identified)  
**Severity**: HIGH

---

## Recommendations

### Migration Strategy
**Strategy**: Standard Cell workflow (follow cell-development-checklist.md)  
**Phasing Required**: ❌ NO (component receives props only, no complex tRPC queries)  
**Estimated Duration**: 6-8 hours

**Breakdown**:
- Phase 1: Cell structure creation (1 hour)
- Phase 2: Component extraction to 7 files (3 hours)
- Phase 3: Manifest + pipeline creation (1 hour)
- Phase 4: Unit tests with 80%+ coverage (2 hours)
- Phase 5: Integration & validation (1-2 hours)

**Priority**: HIGH

**Justification**:
- Critical path component (main dashboard)
- 2 architectural mandate violations (M-CELL-1, M-CELL-4)
- High user visibility
- Clean extraction path (single importer)

### Enhancement Opportunities (Post-Migration)

**Priority: MEDIUM**
1. **Implement actual drill-down navigation** - Currently only logs to console
2. **Add export functionality** - CSV/image export for treemap/list
3. **Performance optimization** - Memoize expensive transformations
4. **Add data validation** - Validate SubcategoryData shape on render

**Priority: LOW**
5. **Consolidate type definitions** - Merge duplicate `SubcategoryData` interfaces
6. **Extract treemap logic** - Move `CustomTreemapContent` to separate component
7. **Add error boundaries** - Wrap component to prevent dashboard crash

---

## Ledger Entry Specification

### Iteration Metadata
```yaml
iteration_id: "iter_20251009_HHMMSS_migrate-spend-subcategory-chart-to-cell"
human_prompt: "[To be provided by user in Phase 4]"
```

### Artifacts Created
```yaml
artifacts_created:
  - type: "cell"
    id: "spend-subcategory-chart"
    path: "components/cells/spend-subcategory-chart/"
    files:
      - "component.tsx"
      - "components/treemap-view.tsx"
      - "components/list-view.tsx"
      - "components/category-item.tsx"
      - "utils/data-formatters.ts"
      - "utils/color-utils.ts"
      - "types.ts"
      - "manifest.json"
      - "pipeline.yaml"
      - "__tests__/component.test.tsx"
      - "__tests__/treemap-view.test.tsx"
      - "__tests__/list-view.test.tsx"
```

### Artifacts Replaced
```yaml
artifacts_replaced:
  - type: "component"
    id: "spend-subcategory-chart"
    path: "apps/web/components/dashboard/spend-subcategory-chart.tsx"
    deleted_at: "[Timestamp of Phase 4 completion]"
    deletion_reason: "Replaced by Cell architecture migration"
    # CRITICAL: File WILL BE DELETED in Phase 4, same commit as Cell creation
```

### Schema Changes
```yaml
schema_changes: []  # No schema changes - component uses existing data
```

---

## Architectural Mandate Compliance

### M-CELL-1: All Functionality as Cells
**Status**: ❌ **VIOLATION**  
**Current**: Component in `/components/dashboard/` with business logic and state  
**Required**: Must be in `/components/cells/` with manifest + pipeline  
**Post-Migration**: ✅ WILL BE COMPLIANT (Cell structure planned)

### M-CELL-2: Complete Atomic Migrations
**Status**: ⚠️ **AT RISK**  
**Risk**: Migration plan might include optional phases due to medium complexity  
**Required**: ALL phases mandatory, old component deleted in same commit  
**Mitigation**: Explicitly schedule deletion in migration plan, no "optional" language  
**Post-Migration**: ✅ WILL BE COMPLIANT (atomic migration enforced)

### M-CELL-3: Zero God Components
**Status**: ✅ **COMPLIANT**  
**Current**: 283 lines (under 400 threshold)  
**Post-Migration**: Largest file 120 lines (well under limit)  
**Verification**: All 7 extracted files ≤120 lines

### M-CELL-4: Explicit Behavioral Contracts
**Status**: ❌ **VIOLATION**  
**Current**: No manifest.json or pipeline.yaml  
**Required**: Minimum 3 behavioral assertions with validation  
**Identified**: 10 behavioral assertions extracted  
**Post-Migration**: ✅ WILL BE COMPLIANT (manifest + pipeline planned)

**Compliance Summary**: 2 violations, 1 warning, 1 compliant → Migration REQUIRED

---

## Next Steps

### Phase 3: Hand off to MigrationArchitect

**Critical Information for Planning**:
1. ✅ All analysis complete and synthesized
2. ✅ 10 behavioral assertions identified (exceeds minimum)
3. ✅ Cell structure designed (7 files, all ≤120 lines)
4. ✅ Single importer identified (charts-section.tsx)
5. ✅ NO new tRPC procedures needed (uses existing parent data)
6. ✅ Pitfalls detected and fixes documented
7. ✅ Architectural mandates validated (2 violations, migration required)

**Ready for**: Surgical migration plan creation

**Migration Constraints**:
- Must maintain identical props interface (SubcategoryData[])
- Must preserve visual parity (both treemap and list views)
- Must update single importer (charts-section.tsx)
- Must delete old component in same commit
- Must create manifest with 10 behavioral assertions
- Must implement tests with ≥80% coverage
- All files must be ≤400 lines (target: ≤120 lines)

**Recommended Approach**: Standard Cell workflow (6-8 hours estimated)

---

**Report Status**: ✅ COMPLETE  
**Analysis Phase**: ✅ COMPLETE  
**Ready for Phase 3**: ✅ YES  
**Confidence Level**: HIGH (95%)
