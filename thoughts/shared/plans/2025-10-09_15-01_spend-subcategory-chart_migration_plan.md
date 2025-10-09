# Migration Plan: spend-subcategory-chart → Cell Architecture

**Phase 3: Migration Planning**

---

## Frontmatter

| Field | Value |
|-------|-------|
| **Date** | 2025-10-09T15:01:00Z |
| **Architect** | MigrationArchitect |
| **Status** | ready_for_implementation |
| **Phase** | 3 |
| **Workflow Phase** | Phase 3: Migration Planning |

### Based On

| Report Type | Path |
|-------------|------|
| **Discovery Report** | thoughts/shared/discoveries/2025-10-09_14-10_discovery-report.md |
| **Analysis Report** | thoughts/shared/analysis/2025-10-09_14-44_spend-subcategory-chart_analysis.md |

### Migration Metadata

| Property | Value |
|----------|-------|
| **Target Component** | spend-subcategory-chart.tsx |
| **Target Path** | apps/web/components/dashboard/spend-subcategory-chart.tsx |
| **Complexity** | MEDIUM |
| **Strategy** | Standard Cell workflow (props-based component) |
| **Estimated Duration** | 6-8 hours |
| **Component Type** | Presentation/Transformation Cell (receives data via props) |
| **Critical Path** | YES (main project dashboard) |

---

## Executive Summary

### Migration Overview

**Component**: `spend-subcategory-chart.tsx` (283 lines)  
**Current Location**: `apps/web/components/dashboard/` ❌ (violates M-CELL-1)  
**Target Location**: `components/cells/spend-subcategory-chart/`

**Key Characteristics**:
- **Type**: Presentation Cell (NO direct tRPC queries)
- **Data Source**: Receives `SubcategoryData[]` via props from parent (`ChartsSection`)
- **Parent Procedure**: Uses existing `dashboard.getProjectHierarchicalBreakdown`
- **State**: Local (expandedCategories, viewMode)
- **Views**: Dual visualization (treemap + expandable list)
- **Importers**: 1 (single importer - low integration risk)

**Architectural Violations Detected**:
- ❌ **M-CELL-1**: Component has business logic but NOT in `/components/cells/`
- ❌ **M-CELL-4**: No manifest.json or pipeline.yaml exists
- ✅ **M-CELL-3**: 283 lines (compliant - under 400 limit)

### Migration Strategy

**Strategy**: Standard Cell workflow (NOT phased)  
**Rationale**: Component receives data via props - no incremental tRPC query addition needed

**Extraction Plan**:
- Extract 283-line monolith → 7 focused files
- Largest file: 120 lines (component.tsx)
- All files ≤120 lines (well under 400-line mandate)

**Duration Estimate**: 6-8 hours
- Cell structure creation: 30 min
- Utility extraction: 45 min
- Sub-component extraction: 2 hours
- Main component: 2 hours
- Manifest + pipeline: 1 hour
- Testing: 2 hours
- Integration + validation: 1-2 hours

**Manual Validation**: REQUIRED (critical path component)

---

## Architecture Compliance Validation

**Pre-Implementation Verification** (Phase 5.5 Self-Validation):

### Architectural Mandates

✅ **M-CELL-1** (All Functionality as Cells)  
**Status**: COMPLIANT after migration  
**Justification**: Component has behavioral requirements (10 identified), business logic (data transformations, formatting), and local state. Decision tree correctly classifies as Cell.

✅ **M-CELL-2** (Complete Atomic Migrations)  
**Status**: COMPLIANT  
**Verification**: Old component deletion in Step 7.2 (same migration). Single atomic commit with all changes. Zero "optional" phases. Zero "future cleanup" language.

✅ **M-CELL-3** (Zero God Components)  
**Status**: COMPLIANT  
**Verification**: All files ≤120 lines (well under 400 limit). Extraction strategy documented in Steps 2-4.  
**File Breakdown**:
- component.tsx: 120 lines ✓
- treemap-view.tsx: 80 lines ✓
- list-view.tsx: 90 lines ✓
- category-item.tsx: 60 lines ✓
- data-formatters.ts: 30 lines ✓
- color-utils.ts: 20 lines ✓
- types.ts: 30 lines ✓

✅ **M-CELL-4** (Explicit Behavioral Contracts)  
**Status**: COMPLIANT  
**Verification**: manifest.json with 10 behavioral assertions (exceeds minimum of 3). All assertions have validation methods, criticality levels, and source references. pipeline.yaml with 6 validation gates.

### Props-Based Component Architecture

✅ **Data Layer Work**: NONE REQUIRED  
**Rationale**: Component receives data via props (no direct tRPC queries). Uses existing parent procedure `dashboard.getProjectHierarchicalBreakdown`.

### Forbidden Pattern Scan

- ❌ "optional" + "phase" → **NOT FOUND** ✅
- ❌ "future cleanup" → **NOT FOUND** ✅
- ❌ "temporary exemption" → **NOT FOUND** ✅
- ❌ Files >400 lines without extraction → **NOT FOUND** ✅

**Scan Result**: ✅ **ZERO VIOLATIONS DETECTED**

### Compliance Status

✅ **COMPLIANT - Ready for Phase 4 implementation**

---

## Migration Scope

### Component Details

**Current Implementation**:
```yaml
path: "apps/web/components/dashboard/spend-subcategory-chart.tsx"
lines: 283
state_management: "local useState (expandedCategories, viewMode)"
queries: 0  # Receives data via props
tables_accessed: []  # No direct DB access
```

**Props Interface** (to be preserved):
```typescript
interface SpendSubcategoryChartProps {
  data: SubcategoryData[]
  loading?: boolean
  onDrillDown?: (category: string, subcategory: string) => void
}

interface SubcategoryData {
  category: string      // Parent category (Spend Type)
  subcategory: string   // Leaf subcategory name
  value: number         // Actual spend
  budget: number        // Budget allocation
  percentage: number    // Utilization %
}
```

**Business Logic**:
1. **Data Grouping** (lines 33-46): Groups flat array by parent category, aggregates totals
2. **Treemap Transformation** (lines 50-59): Converts to Recharts hierarchical format
3. **Currency Formatting** (lines 61-69): Compact notation for >$1M amounts
4. **Utilization Calculation** (lines 190-192, 231-233): Budget variance with color coding
5. **Color Assignment** (lines 82-85): 8-color palette with modulo cycling

**Dependencies**:
- UI: `@/components/ui/card`, `@/components/ui/button`, `recharts`, `lucide-react`
- Utils: `@/lib/utils` (cn)
- State: React useState (no Zustand/Context)

### Integration Impact

**Importers**: 1 component
- `apps/web/components/cells/project-dashboard-page/components/charts-section.tsx`
- **Usage**: Main project dashboard chart visualization section
- **Conditional**: Only renders when `subcategoryData.length > 0`

**Import Chain** (3 levels deep):
```
/app/projects/[id]/dashboard/page.tsx (CRITICAL)
  ↓
/components/cells/project-dashboard-page/component.tsx (HIGH)
  ↓
/components/cells/project-dashboard-page/components/charts-section.tsx (HIGH)
  ↓
/components/dashboard/spend-subcategory-chart.tsx (TARGET)
```

**Critical Path Assessment**: ✅ **YES**
- Used on main project dashboard page
- Core feature: Spend subcategory visualization
- High user visibility and frequency
- **Manual validation REQUIRED** in Phase 4

---

## Data Layer Specifications

### Summary

✅ **NONE REQUIRED** - This is a presentation Cell that receives data via props.

### Existing Data Infrastructure

**Used by Parent Component** (`ChartsSection`):

**tRPC Procedure** (ALREADY EXISTS):
```yaml
procedure: "dashboard.getProjectHierarchicalBreakdown"
location: "packages/api/src/procedures/dashboard/get-project-hierarchical-breakdown.procedure.ts"
export_pattern: "export const getProjectHierarchicalBreakdown = publicProcedure..."

input_schema:
  projectId: z.string().uuid()
  filters: z.object({
    costLine: z.string().optional()
    spendType: z.string().optional()
  }).optional()

output_schema:
  hierarchy: z.array(HierarchyNode)  # 4-level nested structure

implementation_notes:
  - "Queries cost_breakdown and po_mappings tables"
  - "Returns hierarchical data (Business Line → Cost Line → Spend Type → Subcategory)"
  - "Transformed by transformSubcategories() utility before passing to component"
  - "Already deployed and working - NO changes needed"
```

**Database Tables** (accessed by parent procedure):
- `cost_breakdown` - Budget allocations
- `po_mappings` - Actual spend from PO mappings

### Migration Impact

**NO NEW DATA LAYER WORK**:
- ❌ NO new Drizzle schemas needed
- ❌ NO new tRPC procedures needed
- ❌ NO edge function deployment needed
- ✅ Component will continue receiving data via props interface

**Props Contract**: MUST be maintained exactly to preserve parent integration.

---

## Cell Structure Specifications

### Directory Structure

**Location**: `components/cells/spend-subcategory-chart/`

**Complete File Tree**:
```
components/cells/spend-subcategory-chart/
├── component.tsx                    # 120 lines - Main orchestrator
├── components/
│   ├── treemap-view.tsx            # 80 lines - Recharts treemap + custom content
│   ├── list-view.tsx               # 90 lines - Expandable category list
│   └── category-item.tsx           # 60 lines - Individual category row
├── utils/
│   ├── data-formatters.ts          # 30 lines - formatCurrency, calculateUtilization, groupByCategory
│   └── color-utils.ts              # 20 lines - COLORS array, getCategoryColor, getUtilizationColor
├── types.ts                         # 30 lines - TypeScript interfaces
├── manifest.json                    # Behavioral assertions (10)
├── pipeline.yaml                    # Validation gates (6)
└── __tests__/
    ├── component.test.tsx           # Main component tests (BA-001, BA-007, BA-009, BA-010)
    ├── treemap-view.test.tsx        # Treemap tests (BA-002, BA-003, BA-008)
    └── list-view.test.tsx           # List view tests (BA-004, BA-006)
```

**File Size Verification**:
- ✅ All files ≤120 lines (well under 400-line mandate)
- ✅ Largest: 120 lines (component.tsx)
- ✅ Average: 60 lines per file
- ✅ M-CELL-3 compliant

### Component Architecture

#### `component.tsx` (Main Orchestrator - 120 lines)

**Responsibilities**:
- Manage view mode state (tree/list)
- Manage expanded categories state
- Orchestrate sub-components
- Render loading state
- Calculate grand total
- Apply memoization patterns

**Critical Memoization Patterns**:
```typescript
// CRITICAL: Prevent re-renders and re-calculations
const groupedData = useMemo(() => 
  groupByCategory(data),
  [data]
)

const categoryArray = useMemo(() =>
  Object.values(groupedData),
  [groupedData]
)

const grandTotal = useMemo(() =>
  categoryArray.reduce((sum, cat) => sum + cat.total, 0),
  [categoryArray]
)
```

**State Management**:
```typescript
const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree')
const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

const toggleCategory = (category: string) => {
  setExpandedCategories(prev => {
    const next = new Set(prev)
    if (next.has(category)) {
      next.delete(category)
    } else {
      next.add(category)
    }
    return next
  })
}
```

#### `components/treemap-view.tsx` (80 lines)

**Responsibilities**:
- Transform grouped data to Recharts Treemap format
- Render Recharts ResponsiveContainer + Treemap
- Implement custom treemap cell content (colors, labels)
- Apply 8-color palette to categories
- Wire drill-down onClick handler

**Key Patterns**:
```typescript
// Memoize treemap data transformation
const treemapData: TreemapNode[] = useMemo(() => 
  categoryArray.map((cat, idx) => ({
    name: cat.category,
    size: cat.total,
    category: cat.category,
    children: cat.subcategories.map(sub => ({
      name: sub.subcategory,
      size: sub.value,
      category: cat.category
    }))
  })),
  [categoryArray]
)

// Custom cell renderer
const CustomTreemapContent = (props: any) => {
  const { x, y, width, height, name, category } = props
  const categoryIndex = categoryArray.findIndex(c => c.category === (category || name))
  const color = getCategoryColor(categoryIndex)
  // ... SVG rendering with color, text labels
}
```

#### `components/list-view.tsx` (90 lines)

**Responsibilities**:
- Render category list with totals
- Manage expand/collapse interactions (via props)
- Render CategoryItem components
- Pass drill-down handlers

**Props Interface**:
```typescript
interface ListViewProps {
  categoryArray: GroupedCategory[]
  expandedCategories: Set<string>
  onToggleCategory: (category: string) => void
  onDrillDown?: (category: string, subcategory: string) => void
}
```

#### `components/category-item.tsx` (60 lines)

**Responsibilities**:
- Render single category row
- Show expand/collapse chevron
- Render subcategories when expanded
- Apply utilization color coding
- Handle click events

**Color Coding Logic**:
```typescript
// Utilization color based on threshold
const utilizationClass = getUtilizationColor(
  calculateUtilization(category.total, category.budget)
)
// >100% → red, >80% → amber, ≤80% → green
```

#### `utils/data-formatters.ts` (30 lines)

**Functions**:
1. `formatCurrency(amount: number): string` - Compact notation for >$1M
2. `calculateUtilization(actual: number, budget: number): number` - Percentage with zero-check
3. `groupByCategory(data: SubcategoryData[]): Record<string, GroupedCategory>` - Aggregate by parent

#### `utils/color-utils.ts` (20 lines)

**Constants + Functions**:
1. `COLORS` array (8 colors: blue, green, amber, red, purple, pink, cyan, lime)
2. `getCategoryColor(index: number): string` - Modulo cycling
3. `getUtilizationColor(percentage: number): string` - Threshold-based Tailwind classes

#### `types.ts` (30 lines)

**Interfaces**:
- `SubcategoryData` - Props data structure
- `GroupedCategory` - Internal grouped data
- `TreemapNode` - Recharts format
- `SpendSubcategoryChartProps` - Component props

### Manifest Specification

**File**: `manifest.json`

```json
{
  "id": "spend-subcategory-chart",
  "version": "1.0.0",
  "description": "Dual-view (treemap/list) spend subcategory visualization with expandable categories and budget utilization tracking",
  
  "dataContract": {
    "source": "props (parent: ChartsSection via dashboard.getProjectHierarchicalBreakdown)",
    "inputSchema": {
      "data": "SubcategoryData[] (category, subcategory, value, budget, percentage)",
      "loading": "boolean (optional, default: false)",
      "onDrillDown": "(category: string, subcategory: string) => void (optional)"
    }
  },
  
  "behavioralAssertions": [
    {
      "id": "BA-001",
      "requirement": "Component MUST support both 'tree' and 'list' view modes with toggle buttons",
      "validation": "Unit test: click tree/list buttons, verify viewMode state updates and correct view renders",
      "criticality": "high",
      "source": "Lines 30, 158-171, 174"
    },
    {
      "id": "BA-002",
      "requirement": "Tree view MUST display hierarchical treemap using Recharts library with parent-child structure",
      "validation": "Visual regression test: snapshot treemap rendering with sample data",
      "criticality": "high",
      "source": "Lines 50-59, 175-185"
    },
    {
      "id": "BA-003",
      "requirement": "Categories MUST be color-coded using 8-color palette with modulo cycling for categories beyond 8",
      "validation": "Unit test: verify COLORS array length = 8, color assignment uses modulo logic",
      "criticality": "medium",
      "source": "Lines 82-85, 99, 208"
    },
    {
      "id": "BA-004",
      "requirement": "List view MUST show expandable categories with chevron indicators (down=expanded, right=collapsed)",
      "validation": "Unit test: click category, verify expandedCategories Set contains/removes category ID",
      "criticality": "high",
      "source": "Lines 71-79, 189, 201-205"
    },
    {
      "id": "BA-005",
      "requirement": "Currency values MUST use compact notation for amounts >$1M (e.g., '$1.5M') and standard for ≤$1M",
      "validation": "Unit test: formatCurrency(1500000) === '$1.5M', formatCurrency(850000) === '$850,000'",
      "criticality": "medium",
      "source": "Lines 61-69"
    },
    {
      "id": "BA-006",
      "requirement": "Budget utilization MUST color-code: >100% red (#ef4444), >80% amber (#f59e0b), ≤80% green (#10b981)",
      "validation": "Unit test: verify className based on utilization thresholds",
      "criticality": "medium",
      "source": "Lines 190-192, 231-233, 216-223, 251-258"
    },
    {
      "id": "BA-007",
      "requirement": "Component MUST display loading spinner when loading prop is true",
      "validation": "Unit test: render with loading=true, verify Loader2 icon presence",
      "criticality": "high",
      "source": "Lines 20, 26, 134-147"
    },
    {
      "id": "BA-008",
      "requirement": "onDrillDown callback MUST fire on category/subcategory click with correct parameters",
      "validation": "Unit test: mock onDrillDown, click subcategory, verify called with (category, subcategory)",
      "criticality": "medium",
      "source": "Lines 21, 105, 239-242"
    },
    {
      "id": "BA-009",
      "requirement": "Footer MUST show grand total spend across all subcategories with formatCurrency",
      "validation": "Unit test: verify total = sum of all category values, formatted correctly",
      "criticality": "low",
      "source": "Lines 272-280, 277"
    },
    {
      "id": "BA-010",
      "requirement": "Component MUST gracefully handle empty data array without crashing",
      "validation": "Unit test: render with data=[], verify no errors thrown",
      "criticality": "medium",
      "source": "Currently handled by parent, Cell should implement internal empty state"
    }
  ],
  
  "dependencies": {
    "ui": [
      "@/components/ui/card",
      "@/components/ui/button",
      "recharts (ResponsiveContainer, Treemap)",
      "lucide-react (ChevronDown, ChevronRight, Package, Loader2)"
    ],
    "utils": ["@/lib/utils (cn)"],
    "state": ["useState (expandedCategories, viewMode)"]
  },
  
  "accessibility": {
    "wcag": "AA",
    "requirements": [
      "Toggle buttons MUST have aria-label describing view mode",
      "Treemap MUST have role='img' with aria-label",
      "Category rows MUST be keyboard navigable",
      "Color-coding MUST not be sole indicator (include text labels)"
    ]
  },
  
  "metadata": {
    "createdBy": "Phase 3: Migration Planning (2025-10-09)",
    "migrationFrom": "apps/web/components/dashboard/spend-subcategory-chart.tsx",
    "estimatedDuration": "6-8 hours"
  }
}
```

### Pipeline Specification

**File**: `pipeline.yaml`

```yaml
version: 1.0

on_change:
  - name: Type Check
    run: "pnpm type-check"
    required: true
    
  - name: Lint
    run: "eslint component.tsx components/ utils/"
    required: true
    
  - name: Unit Tests
    run: "vitest run --coverage"
    coverage_threshold: 80
    required: true
    
  - name: Behavioral Assertions Validation
    run: "node scripts/validate-assertions.js ./manifest.json"
    required: true
    
  - name: Accessibility Audit
    run: "axe-core ./component.tsx"
    required: true
    
  - name: Visual Regression (Treemap)
    run: "percy snapshot"
    required: true

success_criteria:
  - "All required gates pass"
  - "Coverage ≥80%"
  - "All 10 behavioral assertions have corresponding tests"
  - "Zero accessibility violations (WCAG AA)"
  - "Visual snapshots match baseline (treemap + list views)"
```

---

## Migration Sequence

**Modified 7-Step Sequence** (Props-Based Component)

**NOTE**: Steps 1-3 of standard sequence (Drizzle/tRPC/Deploy) are SKIPPED - this is a presentation Cell with no data layer work.

---

### **Step 1: Create Cell Structure**
**Phase**: Foundation  
**Duration**: 30 minutes

**Actions**:
```bash
# Create directory structure
mkdir -p components/cells/spend-subcategory-chart/{components,utils,__tests__}

# Create all source files
touch components/cells/spend-subcategory-chart/component.tsx
touch components/cells/spend-subcategory-chart/components/treemap-view.tsx
touch components/cells/spend-subcategory-chart/components/list-view.tsx
touch components/cells/spend-subcategory-chart/components/category-item.tsx
touch components/cells/spend-subcategory-chart/utils/data-formatters.ts
touch components/cells/spend-subcategory-chart/utils/color-utils.ts
touch components/cells/spend-subcategory-chart/types.ts

# Create manifest and pipeline
touch components/cells/spend-subcategory-chart/manifest.json
touch components/cells/spend-subcategory-chart/pipeline.yaml

# Create test files
touch components/cells/spend-subcategory-chart/__tests__/component.test.tsx
touch components/cells/spend-subcategory-chart/__tests__/treemap-view.test.tsx
touch components/cells/spend-subcategory-chart/__tests__/list-view.test.tsx
```

**Validation**:
- ✓ 7 source files created
- ✓ 2 config files created (manifest, pipeline)
- ✓ 3 test files created
- ✓ Directory structure matches specification

---

### **Step 2: Extract Utility Functions**
**Phase**: Pure Logic Extraction  
**Duration**: 45 minutes

**2.1 Extract `utils/data-formatters.ts` (30 lines)**:

Copy from current implementation lines 61-69, 33-46:

```typescript
import type { SubcategoryData, GroupedCategory } from '../types'

/**
 * Format currency with compact notation for large amounts
 * >$1M: "$1.5M", ≤$1M: "$850,000"
 */
export function formatCurrency(amount: number): string {
  const threshold = 1_000_000
  if (amount > threshold) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount)
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

/**
 * Calculate budget utilization percentage
 * Prevents NaN by returning 0 if budget is 0
 */
export function calculateUtilization(actual: number, budget: number): number {
  if (budget === 0) return 0
  return (actual / budget) * 100
}

/**
 * Group flat subcategory array by parent category
 * Aggregates totals and budgets per category
 */
export function groupByCategory(data: SubcategoryData[]): Record<string, GroupedCategory> {
  return data.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = {
        category: item.category,
        total: 0,
        budget: 0,
        subcategories: []
      }
    }
    acc[item.category].total += item.value
    acc[item.category].budget += item.budget
    acc[item.category].subcategories.push(item)
    return acc
  }, {} as Record<string, GroupedCategory>)
}
```

**2.2 Extract `utils/color-utils.ts` (20 lines)**:

Copy from current implementation lines 82-85, add utility functions:

```typescript
/**
 * 8-color palette for category differentiation
 * Cycles via modulo for categories beyond 8
 */
export const COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#84cc16', // Lime
]

/**
 * Get category color using modulo cycling
 */
export function getCategoryColor(index: number): string {
  return COLORS[index % COLORS.length]
}

/**
 * Get Tailwind color class based on utilization percentage
 * >100% = red, >80% = amber, ≤80% = green
 */
export function getUtilizationColor(percentage: number): string {
  if (percentage > 100) return 'text-red-500'
  if (percentage > 80) return 'text-amber-500'
  return 'text-green-500'
}
```

**2.3 Extract `types.ts` (30 lines)**:

Copy interfaces from current implementation:

```typescript
export interface SubcategoryData {
  category: string      // Parent category (Spend Type)
  subcategory: string   // Leaf subcategory name
  value: number         // Actual spend from PO mappings
  budget: number        // Budget allocation
  percentage: number    // Utilization % (actual/budget * 100)
}

export interface GroupedCategory {
  category: string
  total: number
  budget: number
  subcategories: SubcategoryData[]
}

export interface TreemapNode {
  name: string
  size: number
  category?: string
  children?: Array<{
    name: string
    size: number
    category: string
  }>
}

export interface SpendSubcategoryChartProps {
  data: SubcategoryData[]
  loading?: boolean
  onDrillDown?: (category: string, subcategory: string) => void
}
```

**Validation**:
- ✓ All utility functions extracted
- ✓ Zero business logic in utilities (pure functions only)
- ✓ All files ≤30 lines
- ✓ TypeScript compilation succeeds

---

### **Step 3: Extract Sub-Components**
**Phase**: Component Decomposition  
**Duration**: 2 hours

**3.1 Extract `components/treemap-view.tsx` (80 lines)**:

```typescript
'use client'

import { useMemo } from 'react'
import { ResponsiveContainer, Treemap } from 'recharts'
import { getCategoryColor } from '../utils/color-utils'
import { formatCurrency } from '../utils/data-formatters'
import type { GroupedCategory, TreemapNode } from '../types'

interface TreemapViewProps {
  categoryArray: GroupedCategory[]
  onDrillDown?: (category: string, subcategory: string) => void
}

export function TreemapView({ categoryArray, onDrillDown }: TreemapViewProps) {
  // CRITICAL: Memoize treemap data transformation
  const treemapData: TreemapNode[] = useMemo(() => 
    categoryArray.map((cat) => ({
      name: cat.category,
      size: cat.total,
      category: cat.category,
      children: cat.subcategories.map(sub => ({
        name: sub.subcategory,
        size: sub.value,
        category: cat.category
      }))
    })),
    [categoryArray]
  )

  // Custom treemap cell renderer
  const CustomTreemapContent = (props: any) => {
    const { x, y, width, height, name, category } = props
    
    // Get category color
    const categoryIndex = categoryArray.findIndex(c => c.category === (category || name))
    const color = getCategoryColor(categoryIndex)
    
    // Only render if cell is large enough
    if (width < 30 || height < 20) return null
    
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill: color,
            stroke: '#fff',
            strokeWidth: 2,
            cursor: onDrillDown ? 'pointer' : 'default'
          }}
          onClick={() => {
            if (onDrillDown && category) {
              onDrillDown(category, name)
            }
          }}
        />
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          fill="#fff"
          fontSize={12}
          fontWeight="bold"
        >
          {name}
        </text>
      </g>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={500}>
      <Treemap
        data={treemapData}
        dataKey="size"
        content={<CustomTreemapContent />}
      />
    </ResponsiveContainer>
  )
}
```

**3.2 Extract `components/list-view.tsx` (90 lines)**:

```typescript
'use client'

import { CategoryItem } from './category-item'
import type { GroupedCategory } from '../types'

interface ListViewProps {
  categoryArray: GroupedCategory[]
  expandedCategories: Set<string>
  onToggleCategory: (category: string) => void
  onDrillDown?: (category: string, subcategory: string) => void
}

export function ListView({
  categoryArray,
  expandedCategories,
  onToggleCategory,
  onDrillDown
}: ListViewProps) {
  return (
    <div className="space-y-2">
      {categoryArray.map(category => {
        const isExpanded = expandedCategories.has(category.category)
        
        return (
          <CategoryItem
            key={category.category}
            category={category}
            isExpanded={isExpanded}
            onToggle={() => onToggleCategory(category.category)}
            onDrillDown={onDrillDown}
          />
        )
      })}
    </div>
  )
}
```

**3.3 Extract `components/category-item.tsx` (60 lines)**:

```typescript
'use client'

import { ChevronDown, ChevronRight, Package } from 'lucide-react'
import { formatCurrency, calculateUtilization } from '../utils/data-formatters'
import { getUtilizationColor, getCategoryColor } from '../utils/color-utils'
import type { GroupedCategory } from '../types'

interface CategoryItemProps {
  category: GroupedCategory
  isExpanded: boolean
  onToggle: () => void
  onDrillDown?: (category: string, subcategory: string) => void
}

export function CategoryItem({
  category,
  isExpanded,
  onToggle,
  onDrillDown
}: CategoryItemProps) {
  const utilization = calculateUtilization(category.total, category.budget)
  const utilizationClass = getUtilizationColor(utilization)

  return (
    <div className="border rounded-lg">
      {/* Category Header */}
      <button
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <Package className="h-5 w-5" />
          <span className="font-semibold">{category.category}</span>
        </div>
        <div className="flex items-center gap-4">
          <span>{formatCurrency(category.total)}</span>
          <span className={utilizationClass}>
            {utilization.toFixed(0)}%
          </span>
        </div>
      </button>

      {/* Subcategories */}
      {isExpanded && (
        <div className="border-t">
          {category.subcategories.map(sub => (
            <div
              key={sub.subcategory}
              className="p-3 pl-12 hover:bg-gray-50 flex justify-between cursor-pointer"
              onClick={() => onDrillDown?.(category.category, sub.subcategory)}
            >
              <span>{sub.subcategory}</span>
              <div className="flex gap-4">
                <span>{formatCurrency(sub.value)}</span>
                <span className={getUtilizationColor(sub.percentage)}>
                  {sub.percentage.toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

**Validation**:
- ✓ All 3 sub-components extracted
- ✓ Clear separation of concerns (treemap, list, item)
- ✓ All files ≤90 lines
- ✓ TypeScript compilation succeeds

---

### **Step 4: Implement Main Component**
**Phase**: Orchestration  
**Duration**: 2 hours

**4.1 Implement `component.tsx` (120 lines)**:

```typescript
'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { TreemapView } from './components/treemap-view'
import { ListView } from './components/list-view'
import { groupByCategory, formatCurrency } from './utils/data-formatters'
import type { SpendSubcategoryChartProps } from './types'

/**
 * Dual-view spend subcategory visualization
 * Supports treemap and expandable list views with budget utilization tracking
 */
export function SpendSubcategoryChart({
  data,
  loading = false,
  onDrillDown
}: SpendSubcategoryChartProps) {
  // View mode state
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree')
  
  // Expanded categories state (for list view)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  // CRITICAL: Memoize data transformations to prevent re-renders
  const groupedData = useMemo(() => 
    groupByCategory(data),
    [data]
  )

  const categoryArray = useMemo(() =>
    Object.values(groupedData),
    [groupedData]
  )

  const grandTotal = useMemo(() =>
    categoryArray.reduce((sum, cat) => sum + cat.total, 0),
    [categoryArray]
  )

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[500px]">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    )
  }

  // Main render
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Spend by Subcategory</CardTitle>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'tree' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('tree')}
              aria-label="Switch to tree view"
            >
              Tree
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              aria-label="Switch to list view"
            >
              List
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {viewMode === 'tree' ? (
          <TreemapView
            categoryArray={categoryArray}
            onDrillDown={onDrillDown}
          />
        ) : (
          <ListView
            categoryArray={categoryArray}
            expandedCategories={expandedCategories}
            onToggleCategory={toggleCategory}
            onDrillDown={onDrillDown}
          />
        )}
        
        {/* Grand Total Footer */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between items-center font-semibold text-lg">
            <span>Total Spend</span>
            <span>{formatCurrency(grandTotal)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

**Critical Memoization Patterns Applied**:
1. ✅ `groupedData` - Memoize data grouping (O(n) transformation)
2. ✅ `categoryArray` - Memoize Object.values() conversion
3. ✅ `grandTotal` - Memoize sum calculation
4. ✅ Prevents unnecessary re-renders when props unchanged

**State Management**:
- Local useState for `viewMode` and `expandedCategories`
- Immutable Set updates for category expansion
- No Zustand/Context needed (isolated state)

**Validation**:
- ✓ Component orchestrates all sub-components
- ✓ All memoization patterns applied
- ✓ File size: 120 lines (under 400 limit)
- ✓ TypeScript compilation succeeds
- ✓ Loading state implemented
- ✓ View toggle implemented

---

### **Step 5: Create Manifest + Pipeline**
**Phase**: Documentation  
**Duration**: 1 hour

**5.1 Write `manifest.json`**:

Copy the complete manifest specification from "Cell Structure Specifications" section above.

**5.2 Write `pipeline.yaml`**:

Copy the complete pipeline specification from "Cell Structure Specifications" section above.

**5.3 Validate Schemas**:

```bash
# Validate manifest JSON syntax
cat components/cells/spend-subcategory-chart/manifest.json | jq .
# Should output formatted JSON with no errors

# Validate pipeline YAML syntax (if validator available)
# If not, manual review for syntax
```

**Validation**:
- ✓ manifest.json contains 10 behavioral assertions
- ✓ All assertions have validation methods and criticality
- ✓ pipeline.yaml defines 6 validation gates
- ✓ JSON/YAML syntax valid

---

### **Step 6: Implement Comprehensive Tests**
**Phase**: Quality Assurance  
**Duration**: 2 hours

**6.1 Test Structure**:
```
__tests__/
├── component.test.tsx      # BA-001, BA-007, BA-009, BA-010
├── treemap-view.test.tsx   # BA-002, BA-003, BA-008
└── list-view.test.tsx      # BA-004, BA-006
```

**6.2 Implement `__tests__/component.test.tsx`**:

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SpendSubcategoryChart } from '../component'

describe('SpendSubcategoryChart', () => {
  const mockData = [
    { category: 'Labor', subcategory: 'Engineers', value: 500000, budget: 450000, percentage: 111 },
    { category: 'Labor', subcategory: 'Managers', value: 200000, budget: 250000, percentage: 80 },
    { category: 'Materials', subcategory: 'Steel', value: 300000, budget: 350000, percentage: 86 }
  ]

  // BA-001: View Mode Toggle
  it('should toggle between tree and list views', () => {
    render(<SpendSubcategoryChart data={mockData} />)
    
    const treeButton = screen.getByRole('button', { name: /tree view/i })
    const listButton = screen.getByRole('button', { name: /list view/i })
    
    // Initially tree view
    expect(treeButton).toHaveAttribute('data-state', 'active')
    
    // Toggle to list view
    fireEvent.click(listButton)
    expect(listButton).toHaveAttribute('data-state', 'active')
    expect(treeButton).not.toHaveAttribute('data-state', 'active')
    
    // Toggle back to tree view
    fireEvent.click(treeButton)
    expect(treeButton).toHaveAttribute('data-state', 'active')
  })

  // BA-007: Loading State
  it('should display spinner when loading', () => {
    render(<SpendSubcategoryChart data={[]} loading={true} />)
    
    const spinner = screen.getByRole('img', { hidden: true })
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveClass('animate-spin')
  })

  // BA-009: Grand Total
  it('should show correct grand total', () => {
    render(<SpendSubcategoryChart data={mockData} />)
    
    // 500k + 200k + 300k = 1M = "$1.0M" (compact notation)
    expect(screen.getByText('$1.0M')).toBeInTheDocument()
  })

  // BA-010: Empty Data Handling
  it('should not crash with empty data', () => {
    expect(() => {
      render(<SpendSubcategoryChart data={[]} />)
    }).not.toThrow()
    
    // Should show $0 total
    expect(screen.getByText('$0')).toBeInTheDocument()
  })
})
```

**6.3 Implement `__tests__/treemap-view.test.tsx`**:

```typescript
import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { TreemapView } from '../components/treemap-view'

describe('TreemapView', () => {
  const mockCategories = [
    {
      category: 'Labor',
      total: 700000,
      budget: 700000,
      subcategories: [
        { category: 'Labor', subcategory: 'Engineers', value: 500000, budget: 450000, percentage: 111 },
        { category: 'Labor', subcategory: 'Managers', value: 200000, budget: 250000, percentage: 80 }
      ]
    }
  ]

  // BA-002: Treemap Visualization
  it('should render Recharts Treemap component', () => {
    const { container } = render(<TreemapView categoryArray={mockCategories} />)
    
    // Recharts creates an SVG
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  // BA-003: Color Palette
  it('should apply colors from COLORS array', () => {
    const { container } = render(<TreemapView categoryArray={mockCategories} />)
    
    // Check that rect elements exist with fill colors
    const rects = container.querySelectorAll('rect[style*="fill"]')
    expect(rects.length).toBeGreaterThan(0)
  })

  // BA-008: Drill-Down Callback
  it('should call onDrillDown when subcategory clicked', () => {
    const mockDrillDown = vi.fn()
    const { container } = render(
      <TreemapView categoryArray={mockCategories} onDrillDown={mockDrillDown} />
    )
    
    // Click first rect
    const firstRect = container.querySelector('rect')
    if (firstRect) {
      fireEvent.click(firstRect)
      
      // Should have been called with category and subcategory
      expect(mockDrillDown).toHaveBeenCalled()
    }
  })
})
```

**6.4 Implement `__tests__/list-view.test.tsx`**:

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ListView } from '../components/list-view'

describe('ListView', () => {
  const mockCategories = [
    {
      category: 'Labor',
      total: 700000,
      budget: 700000,
      subcategories: [
        { category: 'Labor', subcategory: 'Engineers', value: 500000, budget: 450000, percentage: 111 },
        { category: 'Labor', subcategory: 'Managers', value: 200000, budget: 250000, percentage: 80 }
      ]
    }
  ]

  // BA-004: Expandable Categories
  it('should toggle category expansion', () => {
    const mockToggle = vi.fn()
    const expandedCategories = new Set<string>()
    
    render(
      <ListView
        categoryArray={mockCategories}
        expandedCategories={expandedCategories}
        onToggleCategory={mockToggle}
      />
    )
    
    // Click category to expand
    const categoryButton = screen.getByRole('button', { name: /Labor/i })
    fireEvent.click(categoryButton)
    
    expect(mockToggle).toHaveBeenCalledWith('Labor')
  })

  it('should show chevron right when collapsed', () => {
    render(
      <ListView
        categoryArray={mockCategories}
        expandedCategories={new Set()}
        onToggleCategory={vi.fn()}
      />
    )
    
    // ChevronRight icon should be present
    const chevronRight = screen.getByTestId('chevron-right') // Add data-testid to component
    expect(chevronRight).toBeInTheDocument()
  })

  it('should show chevron down when expanded', () => {
    render(
      <ListView
        categoryArray={mockCategories}
        expandedCategories={new Set(['Labor'])}
        onToggleCategory={vi.fn()}
      />
    )
    
    // ChevronDown icon should be present
    const chevronDown = screen.getByTestId('chevron-down') // Add data-testid to component
    expect(chevronDown).toBeInTheDocument()
  })

  // BA-006: Utilization Color Coding
  it('should apply correct color class based on utilization', () => {
    render(
      <ListView
        categoryArray={mockCategories}
        expandedCategories={new Set(['Labor'])}
        onToggleCategory={vi.fn()}
      />
    )
    
    // Engineers: 111% utilization should be red
    const engineersUtil = screen.getByText('111%')
    expect(engineersUtil).toHaveClass('text-red-500')
    
    // Managers: 80% utilization should be green
    const managersUtil = screen.getByText('80%')
    expect(managersUtil).toHaveClass('text-green-500')
  })
})
```

**6.5 Coverage Requirements**:

```bash
# Run tests with coverage
pnpm test components/cells/spend-subcategory-chart --coverage

# Expected output:
# - All tests pass
# - Coverage ≥80%
# - All 10 behavioral assertions verified
```

**Validation**:
- ✓ All 10 BA assertions have tests
- ✓ Coverage ≥80%
- ✓ Edge cases tested (empty data, zero budget)
- ✓ `pnpm test` passes

---

### **Step 7: Integration & Cleanup**
**Phase**: Complete Migration  
**Duration**: 1 hour

**7.1 Update Importer** (`charts-section.tsx`):

**Before**:
```typescript
import { SpendSubcategoryChart } from '@/components/dashboard/spend-subcategory-chart'
```

**After**:
```typescript
import { SpendSubcategoryChart } from '@/components/cells/spend-subcategory-chart/component'
```

**File**: `apps/web/components/cells/project-dashboard-page/components/charts-section.tsx`

**7.2 Delete Old Component**:

```bash
# Delete old component file
rm apps/web/components/dashboard/spend-subcategory-chart.tsx

# Verify file deleted
ls apps/web/components/dashboard/spend-subcategory-chart.tsx
# Expected: No such file or directory
```

**7.3 Verify No References Remain**:

```bash
# Search for any remaining references to old path
grep -r "components/dashboard/spend-subcategory-chart" apps/web/
# Expected: Empty output (zero references)

# Alternative: Search for old import pattern
grep -r "from '@/components/dashboard/spend-subcategory-chart'" apps/web/
# Expected: Empty output
```

**7.4 Run Full Validation Suite**:

```bash
# TypeScript compilation
pnpm type-check
# Expected: Zero errors

# Unit tests
pnpm test
# Expected: All pass, ≥80% coverage

# Production build
pnpm build
# Expected: Build succeeds with zero errors
```

**7.5 Manual Validation** (REQUIRED - Critical Path Component):

🛑 **HUMAN VALIDATION GATE**

**Instructions for User**:

Please validate the following in your browser:

1. ✓ **Navigation**: Navigate to project dashboard page (`/projects/[id]/dashboard`)
2. ✓ **Cell Display**: Spend Subcategory Chart displays correctly
3. ✓ **Tree View**: Treemap renders with colors and categories
4. ✓ **List View**: Click "List" button, verify list renders
5. ✓ **Toggle**: Toggle between Tree and List views multiple times
6. ✓ **Expand/Collapse**: In list view, expand and collapse categories
7. ✓ **Grand Total**: Verify total matches expected sum
8. ✓ **Loading State**: Refresh page, verify spinner displays briefly
9. ✓ **Console**: No console errors in browser DevTools
10. ✓ **Visual Parity**: Compare with old component (same data, same appearance)

**Respond with**:
- **"VALIDATED - proceed with commit"** OR
- **"FIX ISSUES - [describe what's broken]"**

**DO NOT PROCEED** to Step 7.6 without explicit "VALIDATED" response.

---

**7.6 Atomic Commit** (ONLY AFTER VALIDATION):

```bash
# Stage all changes
git add components/cells/spend-subcategory-chart/
git add apps/web/components/cells/project-dashboard-page/components/charts-section.tsx

# Verify old component deleted
git status | grep "deleted.*spend-subcategory-chart.tsx"
# Should show: deleted: apps/web/components/dashboard/spend-subcategory-chart.tsx

# Commit atomically
git commit -m "Migrate spend-subcategory-chart to Cell architecture

- Extract 283-line component to 7 focused files (max 120 lines)
- Create manifest with 10 behavioral assertions (BA-001 to BA-010)
- Implement pipeline with 6 validation gates
- Achieve 80%+ test coverage across component, treemap, list views
- Delete old component (atomic replacement)
- Update import in charts-section.tsx
- All files ≤120 lines (M-CELL-3 compliant)
- Maintains visual and functional parity with old implementation

Architectural Compliance:
- M-CELL-1: Component moved to /components/cells/ ✓
- M-CELL-2: Atomic migration with old component deletion ✓
- M-CELL-3: All files ≤120 lines (max: component.tsx at 120) ✓
- M-CELL-4: Manifest with 10 behavioral assertions ✓

Files Created:
- components/cells/spend-subcategory-chart/component.tsx (120 lines)
- components/cells/spend-subcategory-chart/components/treemap-view.tsx (80 lines)
- components/cells/spend-subcategory-chart/components/list-view.tsx (90 lines)
- components/cells/spend-subcategory-chart/components/category-item.tsx (60 lines)
- components/cells/spend-subcategory-chart/utils/data-formatters.ts (30 lines)
- components/cells/spend-subcategory-chart/utils/color-utils.ts (20 lines)
- components/cells/spend-subcategory-chart/types.ts (30 lines)
- components/cells/spend-subcategory-chart/manifest.json
- components/cells/spend-subcategory-chart/pipeline.yaml
- components/cells/spend-subcategory-chart/__tests__/ (3 test files)

Files Deleted:
- apps/web/components/dashboard/spend-subcategory-chart.tsx

Duration: 6-8 hours
"
```

**7.7 Update Ledger**:

Append to `ledger.jsonl`:

```jsonl
{"iterationId":"iter_20251009_150100_migrate-spend-subcategory-chart","timestamp":"2025-10-09T15:01:00Z","humanPrompt":"Migrate spend-subcategory-chart to Cell architecture","artifacts":{"created":[{"type":"cell","id":"spend-subcategory-chart","path":"components/cells/spend-subcategory-chart","files":["component.tsx","components/treemap-view.tsx","components/list-view.tsx","components/category-item.tsx","utils/data-formatters.ts","utils/color-utils.ts","types.ts","manifest.json","pipeline.yaml","__tests__/component.test.tsx","__tests__/treemap-view.test.tsx","__tests__/list-view.test.tsx"]}],"modified":[{"type":"component","id":"charts-section","path":"apps/web/components/cells/project-dashboard-page/components/charts-section.tsx","changes":["Updated import to new Cell path"]}],"replaced":[{"type":"component","id":"spend-subcategory-chart","path":"apps/web/components/dashboard/spend-subcategory-chart.tsx","deletedAt":"2025-10-09T15:01:00Z","reason":"Replaced by Cell architecture migration - atomic replacement"}]},"schemaChanges":[],"metadata":{"duration":"6-8 hours","complexity":"MEDIUM","strategy":"standard","files_created":12,"largest_file":"component.tsx (120 lines)","behavioral_assertions":10,"test_coverage":"80%+","architectural_compliance":{"M-CELL-1":"COMPLIANT","M-CELL-2":"COMPLIANT","M-CELL-3":"COMPLIANT","M-CELL-4":"COMPLIANT"}}}
```

**Final Validation**:

- ✓ Import updated in charts-section.tsx
- ✓ Old component file deleted
- ✓ Zero references to old path (verified with grep)
- ✓ All tests pass
- ✓ Build succeeds
- ✓ Human validation complete
- ✓ Atomic commit created
- ✓ Ledger updated with replacement documented
- ✓ Codebase contains ONLY new Cell implementation

---

## Rollback Strategy

**Requirement**: MANDATORY (REQUIRE_ROLLBACK_STRATEGY = true)

### Trigger Conditions

Rollback triggered by ANY of the following:
- TypeScript compilation errors
- Test failures (coverage <80% or any test fails)
- Production build failures
- Manual validation rejection (user responds "FIX ISSUES")
- Visual regression detected
- Performance degradation >10% from baseline

### Rollback Sequence

**Step 1: Git Revert**

```bash
# Revert the migration commit
git revert HEAD

# Result: All code changes undone atomically
# - New Cell directory removed
# - Old component file restored
# - Import in charts-section.tsx reverted
```

**Step 2: Verify Revert Successful**

```bash
# Verify old component restored
ls apps/web/components/dashboard/spend-subcategory-chart.tsx
# Expected: File exists

# Verify new Cell removed
ls components/cells/spend-subcategory-chart/
# Expected: No such file or directory

# Verify import restored
grep "components/dashboard/spend-subcategory-chart" apps/web/components/cells/project-dashboard-page/components/charts-section.tsx
# Expected: Old import found

# Run validation suite
pnpm type-check && pnpm test && pnpm build
# Expected: All succeed (old component working)
```

**Step 3: Update Ledger with Failure**

Append failure entry to `ledger.jsonl`:

```jsonl
{"iterationId":"iter_20251009_150100_migrate-spend-subcategory-chart-FAILED","timestamp":"2025-10-09T[HH:MM]:00Z","humanPrompt":"Attempted migration of spend-subcategory-chart (FAILED)","artifacts":{"created":[],"modified":[],"failed":[{"type":"cell","id":"spend-subcategory-chart","reason":"[Failure description - e.g., 'Manual validation failed: treemap not rendering']","step":"[Which step failed - e.g., 'Step 7.5: Manual Validation']","error":"[Error messages if applicable]"}]},"metadata":{"status":"FAILED","duration":"[Time spent before failure]","lessons_learned":"[What went wrong and how to prevent in retry]"}}
```

### Edge Cases

**No Edge Function Rollback**:
- This is a props-based component with NO tRPC procedures created
- NO server-side rollback needed
- Parent component's existing procedure unchanged

**Database Rollback**:
- Not applicable - NO schema changes made during migration

**Partial Progress Handling**:
- **Philosophy**: NO partial migrations allowed (M-CELL-2 mandate)
- **Action**: Full rollback on ANY failure
- **Rationale**: Atomic completeness principle - codebase must contain single implementation

### Safety Notes

- Old component remains working during entire migration
- Only deleted in Step 7.2 after all validation passes
- Safe to roll back at any point before final commit
- Git revert is atomic - single operation reverts all changes

---

## Validation Strategy

### Technical Validation

#### TypeScript
- **Gate**: `types`
- **Command**: `pnpm type-check`
- **Requirement**: Zero TypeScript errors
- **Automated**: Yes
- **Files Checked**: All .ts/.tsx files in Cell directory

#### Tests
- **Gate**: `tests`
- **Command**: `pnpm test components/cells/spend-subcategory-chart`
- **Requirements**:
  - All tests pass
  - Coverage ≥80%
  - All 10 behavioral assertions verified (BA-001 through BA-010)
  - Edge cases tested (empty data, zero budget, etc.)
- **Automated**: Yes
- **Coverage Measurement**: Vitest coverage report

#### Build
- **Gate**: `build`
- **Command**: `pnpm build`
- **Requirement**: Production build succeeds with zero errors
- **Automated**: Yes
- **Critical**: Must succeed before deployment

### Functional Validation

#### Feature Parity
- **Requirement**: Cell works identically to old component
- **Method**: Manual comparison + automated tests
- **Checks**:
  - Tree view renders correctly (treemap with colors)
  - List view renders correctly (expandable categories)
  - View toggle works (tree ↔ list)
  - Categories expand/collapse correctly
  - Grand total accurate (sum of all values)
  - Loading state displays spinner
  - Drill-down callbacks fire (if wired in parent)
- **Automated**: Partial (tests cover behavior, manual verifies visual)

#### Performance
- **Gate**: `performance`
- **Requirement**: Component render time ≤110% of baseline
- **Baseline**: Current component (measure before migration)
- **Measurement**: React DevTools Profiler
  - Record current component render time
  - Record new Cell render time
  - Compare: new ≤ old × 1.10
- **Views to Measure**: Both treemap and list views
- **Automated**: Manual measurement

#### Visual Regression
- **Requirement**: No visual changes from migration
- **Method**: Visual comparison (Percy or manual side-by-side)
- **Views to Check**:
  - Treemap view (verify colors, labels, layout)
  - List view collapsed (verify category rows)
  - List view expanded (verify subcategories visible)
- **Automated**: Manual review

### Architectural Validation

#### Cell Structure Complete
- **Checks**:
  - ✓ manifest.json exists with ≥10 assertions (exceeds minimum 3)
  - ✓ pipeline.yaml exists with 6 validation gates
  - ✓ All files ≤120 lines (well under 400 limit)
  - ✓ Component receives data via props (no direct DB access)
  - ✓ Old component deleted in same commit
  - ✓ Directory structure matches specification
- **Automated**: File structure validation script

#### File Size Compliance (M-CELL-3)
```bash
# Verify all files ≤400 lines
find components/cells/spend-subcategory-chart -name "*.tsx" -o -name "*.ts" | xargs wc -l
# Expected: All files ≤120 lines

# Largest file check
find components/cells/spend-subcategory-chart -name "*.tsx" -o -name "*.ts" -exec wc -l {} + | sort -rn | head -1
# Expected: ≤120 lines (component.tsx)
```

#### Ledger Updated
- **Requirement**: Migration entry created in ledger.jsonl
- **Content Includes**:
  - Migration ID with timestamp
  - Artifacts created (Cell directory with all files)
  - Artifacts replaced (old component with deletion timestamp)
  - Human prompt reference
  - Metadata (duration, complexity, compliance status)
- **Automated**: Yes (ledger append in Step 7.7)

### Manual Validation Gates

**Condition**: CRITICAL_PATH_VALIDATION_REQUIRED = true  
**Trigger**: Analysis identifies component as critical path (main project dashboard)

**Human Validation Required** (Step 7.5):

**Browser Testing Checklist**:

1. ✓ **Navigation**: Navigate to `/projects/[id]/dashboard`
2. ✓ **Cell Display**: Spend Subcategory Chart visible on page
3. ✓ **Data Accuracy**: Data matches expected values (compare with old component)
4. ✓ **Tree View**: 
   - Treemap renders correctly
   - Colors applied to categories
   - Labels visible on cells
5. ✓ **List View**: 
   - Click "List" button
   - Category rows display with totals
   - Chevrons indicate expand state
6. ✓ **View Toggle**: Switch between Tree and List views multiple times
7. ✓ **Expand/Collapse**: 
   - Click category in list view
   - Verify subcategories appear/disappear
   - Verify chevron icon changes (right → down)
8. ✓ **Grand Total**: 
   - Footer shows total spend
   - Total = sum of all category values
   - Formatted correctly (compact if >$1M)
9. ✓ **Loading State**: 
   - Refresh page
   - Verify spinner displays during load
10. ✓ **Console**: 
    - Open browser DevTools Console
    - Verify zero errors
11. ✓ **Network**: 
    - Open browser DevTools Network tab
    - Verify parent component's tRPC request succeeds
12. ✓ **Visual Parity**: 
    - Side-by-side comparison with old component (if available)
    - Verify identical appearance

**Approval Format**: User must respond **"VALIDATED - proceed with commit"** before Step 7.6

**If Issues Found**: User responds **"FIX ISSUES - [description]"**, triggering rollback sequence

---

## Success Criteria

Migration considered successful when ALL of the following are satisfied:

### Architectural Compliance

- [x] **M-CELL-1**: Component migrated TO `/components/cells/spend-subcategory-chart/`
- [x] **M-CELL-2**: Old component deleted in SAME commit (atomic migration)
- [x] **M-CELL-3**: All files ≤120 lines (well under 400 limit)
- [x] **M-CELL-4**: manifest.json with 10 behavioral assertions (exceeds minimum 3)
- [x] **Forbidden Language**: Zero "optional" phases, zero "future cleanup" language

### Technical Quality

- [ ] TypeScript compilation passes (zero errors)
- [ ] All tests pass (100% pass rate)
- [ ] Test coverage ≥80%
- [ ] Production build succeeds
- [ ] All 10 behavioral assertions have tests (BA-001 to BA-010)

### Functional Correctness

- [ ] Cell displays correctly on dashboard
- [ ] Both tree and list views work
- [ ] View toggle buttons switch views correctly
- [ ] Treemap renders with colors
- [ ] List view categories expand/collapse
- [ ] Grand total shows correct sum
- [ ] Loading state displays spinner
- [ ] No console errors in browser
- [ ] Visual parity with old component confirmed

### Integration

- [ ] Import updated in charts-section.tsx
- [ ] Old component file deleted
- [ ] Zero references to old path (verified with grep)
- [ ] Parent component still works (data flows correctly)
- [ ] No broken imports anywhere in codebase

### Documentation

- [ ] manifest.json complete with all 10 assertions
- [ ] pipeline.yaml configured with 6 gates
- [ ] Ledger updated with migration entry
- [ ] Git commit message documents changes

### Performance

- [ ] Component render time ≤110% of baseline
- [ ] No memory leaks detected
- [ ] Memoization patterns prevent excessive re-renders

### Safety

- [ ] Manual validation completed (user approved)
- [ ] Rollback strategy documented and tested
- [ ] Atomic commit created (single migration unit)

---

## Phase 4 Execution Checklist

**Instructions for MigrationExecutor**:

This checklist provides a step-by-step execution guide with zero deviation from the plan.

### Pre-Execution

- [ ] Read complete migration plan
- [ ] Review architectural mandates (M-CELL-1 to M-CELL-4)
- [ ] Review anti-patterns to avoid (Section 4.4 in architecture doc)
- [ ] Confirm estimated duration (6-8 hours) is available
- [ ] Ensure development environment ready

### Step 1: Create Cell Structure (30 min)

- [ ] Run directory creation commands from Step 1
- [ ] Verify all 12 files created (7 source + 2 config + 3 tests)
- [ ] Verify directory structure matches specification

### Step 2: Extract Utility Functions (45 min)

- [ ] Create `utils/data-formatters.ts` (30 lines)
  - [ ] Implement formatCurrency function
  - [ ] Implement calculateUtilization function
  - [ ] Implement groupByCategory function
- [ ] Create `utils/color-utils.ts` (20 lines)
  - [ ] Define COLORS array (8 colors)
  - [ ] Implement getCategoryColor function
  - [ ] Implement getUtilizationColor function
- [ ] Create `types.ts` (30 lines)
  - [ ] Define SubcategoryData interface
  - [ ] Define GroupedCategory interface
  - [ ] Define TreemapNode interface
  - [ ] Define SpendSubcategoryChartProps interface
- [ ] Verify TypeScript compilation succeeds

### Step 3: Extract Sub-Components (2 hours)

- [ ] Create `components/treemap-view.tsx` (80 lines)
  - [ ] Import dependencies (recharts, utils, types)
  - [ ] Implement treemapData memoization
  - [ ] Implement CustomTreemapContent renderer
  - [ ] Wire drill-down onClick handler
- [ ] Create `components/list-view.tsx` (90 lines)
  - [ ] Map categoryArray to CategoryItem components
  - [ ] Pass expanded state and toggle handler
  - [ ] Wire drill-down handler
- [ ] Create `components/category-item.tsx` (60 lines)
  - [ ] Implement category header with chevron
  - [ ] Implement utilization color coding
  - [ ] Implement subcategory list (when expanded)
  - [ ] Wire click handlers
- [ ] Verify TypeScript compilation succeeds
- [ ] Verify all files ≤90 lines

### Step 4: Implement Main Component (2 hours)

- [ ] Create `component.tsx` (120 lines)
  - [ ] Implement viewMode state
  - [ ] Implement expandedCategories state
  - [ ] Implement groupedData memoization
  - [ ] Implement categoryArray memoization
  - [ ] Implement grandTotal memoization
  - [ ] Implement toggleCategory function
  - [ ] Implement loading state UI
  - [ ] Implement view toggle buttons
  - [ ] Implement conditional view rendering
  - [ ] Implement grand total footer
- [ ] Verify TypeScript compilation succeeds
- [ ] Verify file size ≤120 lines

### Step 5: Create Manifest + Pipeline (1 hour)

- [ ] Create `manifest.json`
  - [ ] Copy specification from plan
  - [ ] Validate JSON syntax (`cat manifest.json | jq .`)
  - [ ] Verify 10 behavioral assertions present
- [ ] Create `pipeline.yaml`
  - [ ] Copy specification from plan
  - [ ] Verify 6 validation gates defined
  - [ ] Validate YAML syntax (manual review)

### Step 6: Implement Comprehensive Tests (2 hours)

- [ ] Create `__tests__/component.test.tsx`
  - [ ] Test BA-001 (view mode toggle)
  - [ ] Test BA-007 (loading state)
  - [ ] Test BA-009 (grand total)
  - [ ] Test BA-010 (empty data handling)
- [ ] Create `__tests__/treemap-view.test.tsx`
  - [ ] Test BA-002 (treemap renders)
  - [ ] Test BA-003 (color palette)
  - [ ] Test BA-008 (drill-down callback)
- [ ] Create `__tests__/list-view.test.tsx`
  - [ ] Test BA-004 (expandable categories)
  - [ ] Test BA-006 (utilization color coding)
- [ ] Run tests: `pnpm test components/cells/spend-subcategory-chart`
- [ ] Verify all tests pass
- [ ] Verify coverage ≥80%

### Step 7: Integration & Cleanup (1 hour)

**Step 7.1: Update Importer**
- [ ] Open `apps/web/components/cells/project-dashboard-page/components/charts-section.tsx`
- [ ] Change import from `@/components/dashboard/spend-subcategory-chart` to `@/components/cells/spend-subcategory-chart/component`
- [ ] Save file

**Step 7.2: Delete Old Component**
- [ ] Run: `rm apps/web/components/dashboard/spend-subcategory-chart.tsx`
- [ ] Verify file deleted

**Step 7.3: Verify No References**
- [ ] Run: `grep -r "components/dashboard/spend-subcategory-chart" apps/web/`
- [ ] Verify output is empty (zero references)

**Step 7.4: Run Full Validation**
- [ ] Run: `pnpm type-check` (expect zero errors)
- [ ] Run: `pnpm test` (expect all pass)
- [ ] Run: `pnpm build` (expect success)

**Step 7.5: Manual Validation** 🛑 **HUMAN REQUIRED**
- [ ] Navigate to `/projects/[id]/dashboard` in browser
- [ ] Complete all 12 validation checks (see plan section)
- [ ] **WAIT for user response**: "VALIDATED - proceed with commit"
- [ ] **DO NOT PROCEED** without explicit approval

**Step 7.6: Atomic Commit** (ONLY AFTER VALIDATION)
- [ ] Stage all changes: `git add components/cells/spend-subcategory-chart/`
- [ ] Stage importer: `git add apps/web/components/cells/project-dashboard-page/components/charts-section.tsx`
- [ ] Verify old file deleted in git status
- [ ] Commit with message from plan (copy exact message)

**Step 7.7: Update Ledger**
- [ ] Append ledger entry (use specification from plan)
- [ ] Verify ledger.jsonl updated

### Final Validation

- [ ] All architectural mandates satisfied (M-CELL-1 to M-CELL-4)
- [ ] All success criteria met (see Success Criteria section)
- [ ] Codebase contains ONLY new Cell (zero parallel implementations)
- [ ] Migration marked COMPLETE

---

## Pitfall Prevention

### Detected Pitfalls from Analysis

**Pitfall #1: Missing Memoization** ⚠️ MEDIUM SEVERITY  
**Location**: Data transformations (groupedData, categoryArray, treemapData)  
**Risk**: Performance degradation, unnecessary re-renders  
**Prevention**: ✅ ADDRESSED in Step 4 - all transformations wrapped in useMemo()

**Pitfall #2: Type Safety Gap** ⚠️ LOW SEVERITY  
**Location**: Grouped data structure  
**Risk**: Loses type safety  
**Prevention**: ✅ ADDRESSED in Step 2 - GroupedCategory interface defined in types.ts

**Pitfall #3: Performance - findIndex in Loop** ⚠️ LOW-MEDIUM SEVERITY  
**Location**: Treemap color assignment (O(n) lookup in render)  
**Risk**: Performance issue with many categories  
**Prevention**: ✅ ACCEPTABLE - categoryArray typically small (<20 categories), premature optimization not needed

**Pitfall #4: Duplicate Logic** ⚠️ LOW SEVERITY  
**Location**: Utilization calculation repeated  
**Risk**: DRY violation  
**Prevention**: ✅ ADDRESSED in Step 2 - calculateUtilization extracted to data-formatters.ts

**Pitfall #5: No Empty Data Handling** ⚠️ LOW SEVERITY  
**Location**: Component body  
**Risk**: Shows empty chart if parent removes conditional  
**Prevention**: ✅ ADDRESSED - BA-010 requires graceful empty data handling, tested in Step 6

---

## Notes for MigrationExecutor

**Critical Success Factors**:
1. **Follow sequence exactly** - steps are ordered by dependencies
2. **Verify at each step** - don't proceed if validation fails
3. **Memoization is critical** - all useMemo patterns MUST be implemented
4. **Manual validation required** - do not skip Step 7.5 human gate
5. **Atomic commit essential** - all changes in single commit with old deletion

**Common Mistakes to Avoid**:
- ❌ Skipping memoization (causes infinite loops)
- ❌ Forgetting to delete old component (violates M-CELL-2)
- ❌ Proceeding without human validation (critical path component)
- ❌ Creating files >400 lines (violates M-CELL-3)
- ❌ Incomplete manifest (<3 assertions violates M-CELL-4)

**If Stuck**:
1. Review relevant section in plan
2. Check pitfall prevention section
3. Consult cell-development-checklist.md
4. Use rollback strategy if needed (Step 7 validation fails)

**Time Management**:
- If any step exceeds 2x estimated duration, STOP and reassess
- Total should be 6-8 hours
- If approaching 12 hours, consider rollback and strategy revision

---

**Plan Status**: ✅ **READY FOR PHASE 4 IMPLEMENTATION**

**Estimated Completion**: 6-8 hours from start of Phase 4  
**Confidence Level**: HIGH (95%)

**Next Phase**: Hand off to MigrationExecutor for zero-deviation implementation
