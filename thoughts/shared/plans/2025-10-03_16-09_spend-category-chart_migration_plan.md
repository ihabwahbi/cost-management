# Migration Plan: SpendCategoryChart → Cell Architecture

---

## Frontmatter

**Date**: 2025-10-03 16:09:00  
**Architect**: MigrationArchitect  
**Status**: ready_for_implementation  
**Phase**: 3 - Migration Planning  
**Workflow Phase**: Phase 3 of 5 (Planning)

**Based On**:
- **Discovery Report**: `thoughts/shared/discoveries/2025-10-03_15-48_discovery-report.md`
- **Analysis Report**: `thoughts/shared/analysis/2025-10-03_15-59_spend-category-chart_analysis.md`

**Migration Metadata**:
- **Target Component**: SpendCategoryChart.tsx
- **Target Path**: `apps/web/components/dashboard/spend-category-chart.tsx`
- **Complexity**: Simple (Quick Win)
- **Strategy**: Standard 7-step (NOT phased)
- **Estimated Duration**: 4-6 hours
- **Priority**: HIGH

**Enhancement**: ULTRATHINK applied for comprehensive planning

---

## Executive Summary

### Migration Overview

**Component**: SpendCategoryChart  
**Type**: Pure presentation component (pie chart visualization)  
**Current Lines**: 110  
**Queries**: 1 tRPC procedure (aggregates 2 DB queries server-side)  
**Importers**: 1 (dashboard page only)  
**Critical Path**: YES (key dashboard feature)

**Strategic Value**:
- ✅ Eliminates indirect database access pattern
- ✅ Improves type safety via tRPC + Zod validation
- ✅ Simplifies dashboard page (removes 15 lines of state management)
- ✅ Establishes pattern for other chart component migrations
- ✅ Quick win (4-6 hours) with high impact

### Complexity Assessment

**Rating**: **SIMPLE** (Quick Win)

**Factors**:
- ✅ Only 1 tRPC procedure needed
- ✅ No complex state management (pure presentation)
- ✅ Single integration point (low risk)
- ✅ 8 behavioral assertions identified (high confidence)
- ✅ All schemas exist (no new database work)
- ⚠️ 3 minor pitfalls detected (all addressable)

**Strategy Decision**: Standard 7-Step Sequence

**Justification**:
- Queries ≤2 (threshold for phasing is 3+)
- Simple component architecture
- Clean data flow
- Low integration complexity

**NOT Phased Because**:
- Only 1 tRPC procedure (phasing applies at 3+ queries)
- No incremental query addition needed
- Atomic implementation feasible in single session

### Risk Assessment

**Overall Risk**: 🟢 **LOW-MEDIUM**

**Risk Factors**:

| Factor | Risk Level | Mitigation |
|--------|-----------|------------|
| Technical Complexity | 🟢 Low | Simple component, 1 query |
| State Coupling | 🟢 Low | Pure props, no shared state |
| Integration Impact | 🟢 Low | Only 1 importer |
| Critical Path | 🔴 High | Dashboard is key feature |
| Pitfalls | 🟡 Medium | 3 detected, all addressed in plan |

**Key Risks Mitigated**:
1. **Infinite render loop** → Memoization patterns specified for chartConfig and query inputs
2. **Magic numbers** → Named constants specified (MIN_LABEL_THRESHOLD, DEMO_UTILIZATION_RATE)
3. **Data accuracy** → Server-side aggregation logic precisely specified with demo fallback

**Rollback Confidence**: HIGH (simple rollback via git revert, edge function can stay deployed)

---

## Migration Overview

### Target Component

**File**: `apps/web/components/dashboard/spend-category-chart.tsx`  
**Lines**: 110  
**Type**: Pure presentation component (Recharts pie chart)

**Current Architecture**:
- Receives `data` prop from parent (dashboard page)
- Parent fetches data via `getCategoryBreakdown()` helper function
- Helper queries database directly (Supabase client)
- Component renders pie chart with custom tooltips and labels

**New Architecture (Cell)**:
- Cell receives `projectId` and `filters` props
- Cell fetches own data via tRPC (`dashboard.getCategoryBreakdown`)
- tRPC procedure handles database queries + server-side aggregation
- Dashboard page simplified (removes data fetching logic)

### Scope of Changes

**Database Layer**: ✅ No changes (schemas exist)

**API Layer**: 
- ✅ Create specialized procedure file: `get-category-breakdown.procedure.ts` (~95 lines)
- ✅ Update domain router: `dashboard.router.ts` (+2 lines, stays < 50)

**Component Layer**:
- ✅ Create Cell structure: `components/cells/spend-category-chart/`
- ✅ Implement component with memoization patterns
- ✅ Create manifest with 8 behavioral assertions
- ✅ Create pipeline with 5 validation gates
- ✅ Write unit tests (≥80% coverage)

**Integration Layer**:
- ✅ Update dashboard page import
- ✅ Remove data fetching logic (~15 lines)
- ✅ Delete old component file
- ✅ Update ledger entry

**Total Files**:
- Created: 5 files (1 procedure, 4 Cell files)
- Modified: 2 files (domain router, dashboard page)
- Deleted: 1 file (old component)

### Dependencies

**Data Dependencies**:
- `cost_breakdown` table (project_id, spend_type, cost_line, budget_cost)
- `po_mappings` table (cost_breakdown_id, mapped_amount)
- Both schemas exist ✓

**UI Dependencies**:
- `recharts` (PieChart, Pie, Cell, Tooltip, Legend) - already installed
- `@/components/ui/chart` (shadcn) - already exists
- `@/components/ui/skeleton` (shadcn) - for loading state
- `@/components/ui/alert` (shadcn) - for error state

**Integration Dependencies**:
- Dashboard page: `/app/projects/[id]/dashboard/page.tsx`
- No other components import SpendCategoryChart ✓

---

## Data Layer Specifications

### Drizzle Schemas

**Status**: ✅ **All schemas exist - no creation required**

#### Schema 1: cost_breakdown

**File**: `packages/db/src/schema/cost-breakdown.ts` (EXISTS)

**Fields Used**:
```typescript
{
  id: uuid('id').primaryKey(),
  projectId: uuid('project_id').notNull(),
  spendType: text('spend_type').notNull(),      // For category grouping
  costLine: text('cost_line').notNull(),        // Optional filter
  budgetCost: numeric('budget_cost').notNull(),  // Sum for budget totals
  // ... other fields
}
```

**Usage**: 
- WHERE filter: `project_id = $1 AND (cost_line = $2 OR $2 IS NULL)`
- GROUP BY: `spend_type` for category aggregation
- SELECT: `id, spend_type, budget_cost`

#### Schema 2: po_mappings

**File**: `packages/db/src/schema/po-mappings.ts` (EXISTS)

**Fields Used**:
```typescript
{
  id: uuid('id').primaryKey(),
  costBreakdownId: uuid('cost_breakdown_id').notNull(),  // FK relationship
  mappedAmount: numeric('mapped_amount').notNull(),       // Sum for actual spend
  // ... other fields
}
```

**Usage**:
- WHERE filter: `cost_breakdown_id IN ($1, $2, ..., $n)`
- SELECT: `cost_breakdown_id, mapped_amount`

**Relationship**: `po_mappings.cost_breakdown_id` → `cost_breakdown.id`

**No schema modifications or additions required** ✓

---

### tRPC Procedure Specification

**CRITICAL**: API Procedure Specialization Architecture (M1-M4 Compliance)

#### Individual Procedure File

**File**: `packages/api/src/procedures/dashboard/get-category-breakdown.procedure.ts`  
**Procedure Name**: `dashboard.getCategoryBreakdown`  
**Exports**: `getCategoryBreakdownRouter` (router segment)  
**Estimated Lines**: ~95 (well under 200-line limit ✓)

**Architecture Compliance**:
- ✅ M1: One Procedure, One File
- ✅ M2: File size ≤200 lines
- ✅ M3: No Parallel Implementations (single source of truth)
- ✅ M4: Explicit Naming (`get-category-breakdown.procedure.ts`)

#### Input Schema (Zod)

```typescript
z.object({
  projectId: z.string().uuid(),
  filters: z.object({
    costLine: z.string().optional(),
  }).optional(),
})
```

**Input Parameters**:
- `projectId` (required): Project UUID to filter cost breakdown data
- `filters.costLine` (optional): Filter by specific cost line (e.g., "Capital", "Operating")

**Validation**:
- UUID format validated by Zod
- Optional fields handled correctly (undefined allowed)

#### Output Schema (Zod)

```typescript
z.array(z.object({
  name: z.string(),       // Category name (from spend_type)
  value: z.number(),      // Actual spend (from po_mappings aggregation)
  budget: z.number(),     // Budget allocation (from cost_breakdown aggregation)
}))
```

**Output Structure**:
```typescript
[
  { name: "Engineering Services", value: 125000.50, budget: 200000.00 },
  { name: "Equipment", value: 85000.00, budget: 150000.00 },
  { name: "Third Party", value: 42000.00, budget: 60000.00 }
]
```

#### Complete Implementation

**File Location**: `packages/api/src/procedures/dashboard/get-category-breakdown.procedure.ts`

```typescript
import { z } from 'zod'
import { publicProcedure, router } from '../../trpc'
import { eq, inArray, and } from 'drizzle-orm'
import { costBreakdown, poMappings } from '@cost-mgmt/db'
import { TRPCError } from '@trpc/server'

// Named constant for demo data fallback
const DEMO_UTILIZATION_RATE = 0.65  // 65% of budget when no mappings exist

export const getCategoryBreakdownRouter = router({
  getCategoryBreakdown: publicProcedure
    .input(z.object({
      projectId: z.string().uuid(),
      filters: z.object({
        costLine: z.string().optional(),
      }).optional(),
    }))
    .query(async ({ input, ctx }) => {
      try {
        // Step 1: Query cost_breakdown with conditional filtering
        const whereConditions = [eq(costBreakdown.projectId, input.projectId)]
        
        if (input.filters?.costLine) {
          whereConditions.push(eq(costBreakdown.costLine, input.filters.costLine))
        }
        
        const budgetData = await ctx.db
          .select({
            id: costBreakdown.id,
            spendType: costBreakdown.spendType,
            budgetCost: costBreakdown.budgetCost,
          })
          .from(costBreakdown)
          .where(and(...whereConditions))
        
        // Step 2: Query po_mappings for actual spend
        const costBreakdownIds = budgetData.map((row) => row.id)
        
        const mappingsData = costBreakdownIds.length > 0 
          ? await ctx.db
              .select({
                costBreakdownId: poMappings.costBreakdownId,
                mappedAmount: poMappings.mappedAmount,
              })
              .from(poMappings)
              .where(inArray(poMappings.costBreakdownId, costBreakdownIds))
          : []
        
        // Step 3: Server-side aggregation using Map
        const categoryMap = new Map<string, { name: string; value: number; budget: number }>()
        
        // Initialize categories from budget data
        for (const row of budgetData) {
          const category = row.spendType || 'Uncategorized'
          
          if (!categoryMap.has(category)) {
            categoryMap.set(category, {
              name: category,
              value: 0,
              budget: Number(row.budgetCost || 0),  // Handle null with || 0
            })
          } else {
            const existing = categoryMap.get(category)!
            existing.budget += Number(row.budgetCost || 0)
          }
        }
        
        // Add actual spend from mappings
        if (mappingsData.length > 0) {
          for (const mapping of mappingsData) {
            const budgetRow = budgetData.find((b) => b.id === mapping.costBreakdownId)
            if (!budgetRow) continue
            
            const category = budgetRow.spendType || 'Uncategorized'
            const categoryData = categoryMap.get(category)!
            categoryData.value += Number(mapping.mappedAmount || 0)  // Handle null
          }
        } else {
          // Fallback: Demo data when no PO mappings exist
          for (const [category, data] of categoryMap.entries()) {
            data.value = data.budget * DEMO_UTILIZATION_RATE
          }
        }
        
        return Array.from(categoryMap.values())
        
      } catch (error) {
        console.error('[getCategoryBreakdown] Error:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch category breakdown',
          cause: error,
        })
      }
    })
})

// File size: ~95 lines ✅ (well under 200-line limit)
```

#### Implementation Notes

**Drizzle Patterns Used**:
- `eq()` - Single condition filtering (project_id, cost_line)
- `inArray()` - Array filtering (cost_breakdown_id list)
- `and()` - Multiple WHERE conditions

**Null Handling**:
- `Number(value || 0)` - Safe conversion with fallback
- Prevents NaN in calculations
- Handles PostgreSQL numeric → JavaScript number conversion

**Aggregation Strategy**:
- Server-side using JavaScript Map (not SQL GROUP BY)
- Matches existing implementation pattern
- Maintains consistency with other procedures

**Demo Data Fallback**:
- Triggered when `mappingsData.length === 0`
- Uses 65% of budget as simulated actual spend
- Provides realistic demo visualization
- Named constant: `DEMO_UTILIZATION_RATE = 0.65`

**Error Handling**:
- Try-catch wrapper for all database operations
- TRPCError with INTERNAL_SERVER_ERROR code
- Console logging with `[getCategoryBreakdown]` prefix
- Original error included in cause for debugging

#### Domain Router Update

**File**: `packages/api/src/procedures/dashboard/dashboard.router.ts`

**Changes Required**:

```typescript
// Add import at top of file
import { getCategoryBreakdownRouter } from './get-category-breakdown.procedure'

// Add to router composition
export const dashboardRouter = router({
  // ... existing procedures (getKPIMetrics, getRecentActivity, etc.)
  ...getCategoryBreakdownRouter,  // ADD THIS LINE
})
```

**Post-Update Validation**:
```bash
# Verify router file stays under 50 lines (architecture mandate)
wc -l packages/api/src/procedures/dashboard/dashboard.router.ts
# Expected: ≤50 lines
```

**Router Size Check**: File must remain ≤50 lines (simple aggregation only, no business logic)

---

### Curl Test Specification

**CRITICAL**: Test procedure via curl BEFORE implementing client code

#### Test Setup

**Endpoint**: `https://[PROJECT-REF].supabase.co/functions/v1/trpc/dashboard.getCategoryBreakdown`

**Prerequisites**:
1. Edge function deployed: `supabase functions deploy trpc --no-verify-jwt`
2. Wait 30 seconds for cold start
3. Have real project UUID from database

#### Test 1: Basic Query with Filter

```bash
curl -X POST https://[PROJECT-REF].supabase.co/functions/v1/trpc/dashboard.getCategoryBreakdown \
  -H "Content-Type: application/json" \
  -d '{
    "0": {
      "json": {
        "projectId": "[REAL-PROJECT-UUID]",
        "filters": {
          "costLine": "Capital"
        }
      }
    }
  }'
```

**Expected Response**:
```json
{
  "0": {
    "result": {
      "data": {
        "json": [
          {
            "name": "Engineering Services",
            "value": 125000.50,
            "budget": 200000.00
          },
          {
            "name": "Equipment",
            "value": 85000.00,
            "budget": 150000.00
          }
        ]
      }
    }
  }
}
```

**Validation**:
- ✅ Status: 200 OK
- ✅ Response has `result.data.json` array
- ✅ Each category has `name` (string), `value` (number), `budget` (number)
- ✅ Only "Capital" cost line categories included

#### Test 2: Query Without Filter

```bash
curl -X POST https://[PROJECT-REF].supabase.co/functions/v1/trpc/dashboard.getCategoryBreakdown \
  -H "Content-Type: application/json" \
  -d '{
    "0": {
      "json": {
        "projectId": "[REAL-PROJECT-UUID]"
      }
    }
  }'
```

**Expected Response**: More categories (both Capital and Operating)

**Validation**:
- ✅ Status: 200 OK
- ✅ More categories than Test 1 (filter not applied)

#### Test 3: Empty Data (No Cost Breakdown)

```bash
curl -X POST https://[PROJECT-REF].supabase.co/functions/v1/trpc/dashboard.getCategoryBreakdown \
  -H "Content-Type: application/json" \
  -d '{
    "0": {
      "json": {
        "projectId": "00000000-0000-0000-0000-000000000000"
      }
    }
  }'
```

**Expected Response**:
```json
{
  "0": {
    "result": {
      "data": {
        "json": []
      }
    }
  }
}
```

**Validation**:
- ✅ Status: 200 OK
- ✅ Empty array (not error)

#### Test 4: Invalid UUID

```bash
curl -X POST https://[PROJECT-REF].supabase.co/functions/v1/trpc/dashboard.getCategoryBreakdown \
  -H "Content-Type: application/json" \
  -d '{
    "0": {
      "json": {
        "projectId": "not-a-uuid"
      }
    }
  }'
```

**Expected Response**:
```json
{
  "0": {
    "error": {
      "message": "Invalid input",
      "code": -32600,
      "data": {
        "code": "BAD_REQUEST",
        "zodError": { ... }
      }
    }
  }
}
```

**Validation**:
- ✅ Status: 400 Bad Request
- ✅ Zod validation error present

#### Test 5: Demo Data Fallback

Use a project UUID with cost_breakdown data but NO po_mappings.

**Expected Behavior**:
- Categories returned with `value = budget * 0.65`
- Demonstrates fallback logic working

**Validation**:
- ✅ Each category has value ≈ 65% of budget
- ✅ No error (fallback handled gracefully)

---

## Cell Structure Specifications

### Directory Structure

**Location**: `components/cells/spend-category-chart/`

**Complete Structure**:
```
components/cells/spend-category-chart/
├── component.tsx          # Main Cell component (150-200 lines estimated)
├── manifest.json          # 8 behavioral assertions
├── pipeline.yaml          # 5 validation gates
└── __tests__/
    └── component.test.tsx # Unit tests (80%+ coverage)
```

**Notes**:
- ✅ No `state.ts` needed (pure presentation, no complex state)
- ✅ Component fetches own data (dashboard page simplified)
- ✅ Tests colocated in `__tests__/` subdirectory

---

### Manifest Specification

**File**: `components/cells/spend-category-chart/manifest.json`

**Complete Manifest**:

```json
{
  "id": "spend-category-chart",
  "version": "1.0.0",
  "description": "Displays pie chart visualization of budget spend broken down by category (spend_type). Shows actual spend from PO mappings vs budget allocation with utilization percentages. Includes custom tooltips with budget comparison and percentage labels on slices.",
  "behavioral_assertions": [
    {
      "id": "BA-001",
      "description": "Displays pie chart with spend categories when valid data provided",
      "verification": "Render Cell with projectId that has cost_breakdown data, verify PieChart component renders with segments for each category",
      "source": "spend-category-chart.tsx:82-109"
    },
    {
      "id": "BA-002",
      "description": "Renders empty state when no data available",
      "verification": "Query returns empty array (projectId with no cost_breakdown), verify empty message displayed instead of chart",
      "source": "Dashboard page integration page.tsx:357-363"
    },
    {
      "id": "BA-003",
      "description": "Hides percentage labels for slices representing less than 5% of total",
      "verification": "Create test data with one category at 3% of total, verify label not rendered on that slice",
      "source": "spend-category-chart.tsx:35 (renderCustomizedLabel)"
    },
    {
      "id": "BA-004",
      "description": "Shows tooltip with value, budget, and utilization on hover",
      "verification": "Hover over pie slice, verify tooltip contains: actual value formatted as $XX.XK, budget formatted as $XX.XK, and utilization percentage",
      "source": "spend-category-chart.tsx:51-80 (CustomTooltip)"
    },
    {
      "id": "BA-005",
      "description": "Displays 'N/A' for utilization when budget is zero",
      "verification": "Pass category data with budget: 0 and value > 0, verify tooltip shows 'N/A' for utilization instead of percentage",
      "source": "spend-category-chart.tsx:70-72"
    },
    {
      "id": "BA-006",
      "description": "Formats currency as thousands with one decimal place (e.g., $45.0K)",
      "verification": "Pass value 45000, verify displays as '$45.0K' (not '$45000' or '$45K')",
      "source": "spend-category-chart.tsx:59, 64 (CustomTooltip formatting)"
    },
    {
      "id": "BA-007",
      "description": "Assigns colors using modulo rotation through 8-color palette",
      "verification": "Pass 10 categories, verify first category gets COLORS[0], 9th category gets COLORS[0] again (modulo wrapping)",
      "source": "spend-category-chart.tsx:6, 22, 96"
    },
    {
      "id": "BA-008",
      "description": "Shows loading skeleton during data fetch",
      "verification": "Mock pending query state, verify Skeleton component visible before data loads",
      "source": "Cell implementation (new - tRPC loading state)"
    }
  ],
  "dependencies": {
    "data": [
      "cost_breakdown (project_id, spend_type, budget_cost)",
      "po_mappings (cost_breakdown_id, mapped_amount)"
    ],
    "ui": [
      "recharts (PieChart, Pie, Cell, Tooltip, Legend)",
      "@/components/ui/chart (ChartContainer, ChartConfig, ChartTooltip)",
      "@/components/ui/skeleton (loading state)",
      "@/components/ui/alert (error state)"
    ],
    "trpc": [
      "dashboard.getCategoryBreakdown"
    ]
  },
  "props": {
    "projectId": {
      "type": "string (UUID)",
      "required": true,
      "description": "Project UUID to filter cost breakdown data"
    },
    "filters": {
      "type": "object { costLine?: string }",
      "required": false,
      "description": "Optional filters to apply (e.g., filter by Capital vs Operating)"
    }
  }
}
```

**Validation**:
- ✅ 8 behavioral assertions (exceeds minimum 3 requirement)
- ✅ All assertions have: id, description, verification, source
- ✅ Dependencies documented (data, ui, trpc)
- ✅ Props interface specified

---

### Pipeline Specification

**File**: `components/cells/spend-category-chart/pipeline.yaml`

**Complete Pipeline**:

```yaml
name: "Spend Category Chart Cell Pipeline"
version: "1.0.0"

gates:
  types:
    name: "TypeScript Type Checking"
    command: "pnpm type-check"
    requirement: "Zero TypeScript compilation errors"
    blocking: true
    
  tests:
    name: "Unit Test Coverage"
    command: "pnpm test spend-category-chart"
    requirements:
      - "All tests pass"
      - "Coverage ≥80%"
      - "All 8 behavioral assertions verified"
    blocking: true
    
  build:
    name: "Production Build"
    command: "pnpm build"
    requirement: "Build succeeds without errors or warnings"
    blocking: true
    
  performance:
    name: "Performance Baseline"
    measurement: "React DevTools Profiler"
    requirement: "Load time ≤110% of current implementation"
    baseline: "Current SpendCategoryChart load time from analysis"
    blocking: false
    note: "Performance should not regress, but slight variation acceptable"
    
  accessibility:
    name: "Accessibility Compliance"
    standard: "WCAG AA"
    requirements:
      - "Chart has aria-label describing content"
      - "Tooltip content readable by screen readers"
      - "Color contrast meets WCAG AA standards"
      - "Keyboard navigation works (tab through legend)"
    blocking: false
    method: "Manual review + automated axe-core checks"

validation:
  manual_required: true
  reason: "Critical path dashboard component - human validation mandatory"
  checklist:
    - "Cell displays correctly in browser at /projects/[id]/dashboard"
    - "Chart renders with correct category breakdown"
    - "All data values match old component output"
    - "Loading skeleton appears during initial fetch"
    - "Hover tooltips show correct formatting ($XX.XK)"
    - "No console errors present"
    - "Network tab shows single successful request to dashboard.getCategoryBreakdown"
```

**Validation**:
- ✅ 5 gates configured (types, tests, build, performance, accessibility)
- ✅ Manual validation required (critical path component)
- ✅ Clear requirements for each gate

---

### Component Memoization Specifications

**CRITICAL**: Memoization prevents infinite render loops and performance issues

#### Pattern 1: Query Input Memoization

**Purpose**: Stable query key for React Query (prevents refetch loops)

**Location**: Component body (before tRPC query)

```typescript
import { useMemo } from 'react'

const queryInput = useMemo(() => ({
  projectId,
  filters: filters || undefined  // Normalize null/undefined
}), [projectId, filters])

const { data, isLoading, error } = trpc.dashboard.getCategoryBreakdown.useQuery(queryInput)
```

**Why**: 
- React Query uses deep equality for query keys
- New object every render = new query = infinite refetch
- useMemo creates stable reference

#### Pattern 2: ChartConfig Memoization (Pitfall #1 Fix)

**Purpose**: Prevent recreating color configuration on every render

**Location**: After data is available

```typescript
const chartConfig = useMemo(() => 
  data?.reduce((config, item, index) => {
    config[item.name] = {
      label: item.name,
      color: COLORS[index % COLORS.length]
    }
    return config
  }, {} as ChartConfig) || {},
  [data]  // Only recreate when data changes
)
```

**Why**:
- chartConfig passed to ChartContainer component
- Unmemoized object causes child component re-renders
- Detected as Pitfall #1 in analysis

#### Pattern 3: Named Constants (Pitfall #2 & #3 Fix)

**Purpose**: Eliminate magic numbers, improve maintainability

**Location**: Top of file (outside component)

```typescript
// Color palette for category slices (8 colors with modulo rotation)
const COLORS = [
  '#0014dc',  // Blue
  '#00d2dc',  // Cyan
  '#0099a3',  // Teal
  '#6366f1',  // Indigo
  '#8b5cf6',  // Purple
  '#ec4899',  // Pink
  '#f59e0b',  // Amber
  '#10b981'   // Green
]

// Minimum percentage threshold for slice label display (5%)
const MIN_LABEL_THRESHOLD = 0.05

// Demo data utilization rate - fallback when no PO mappings exist (65%)
const DEMO_UTILIZATION_RATE = 0.65
```

**Why**:
- Named constants make intent explicit
- Easier to update in future
- Prevents "magic number" code smell
- Addresses Pitfalls #2 and #3 from analysis

#### Pattern 4: Defensive Logging (Development Only)

**Purpose**: Early detection of infinite loops or query issues

**Location**: After tRPC query hook

```typescript
const { data, isLoading, error, status } = trpc.dashboard.getCategoryBreakdown.useQuery(queryInput)

// TODO: Remove before production
if (process.env.NODE_ENV === 'development') {
  console.log('[SpendCategoryChart] Query state:', {
    status,
    isLoading,
    hasData: !!data,
    dataLength: data?.length,
    error: error?.message
  })
}
```

**Why**:
- Catches "status: 'pending' forever" issues immediately
- Verifies data structure matches expectations
- Removed in production builds

#### Memoization Rule of Thumb

**ANY non-primitive value passed to hooks MUST be memoized**:

✅ **Requires Memoization**:
- Objects: `{ key: value }`
- Arrays: `[item1, item2]`
- Functions: `() => {}`
- Date objects: `new Date()`

❌ **Does NOT Require Memoization**:
- Strings: `"projectId"`
- Numbers: `42`
- Booleans: `true`
- null/undefined

---

### Component Structure Outline

**Props Interface**:

```typescript
interface SpendCategoryChartProps {
  projectId: string          // Project UUID (required)
  filters?: {                // Optional filters
    costLine?: string        // Filter by 'Capital' | 'Operating'
  }
}
```

**Component Implementation Outline**:

```typescript
export function SpendCategoryChart({ projectId, filters }: SpendCategoryChartProps) {
  // 1. Named constants (top of component)
  // (COLORS, MIN_LABEL_THRESHOLD defined outside component)
  
  // 2. Memoize query input
  const queryInput = useMemo(() => ({ projectId, filters }), [projectId, filters])
  
  // 3. Fetch data via tRPC
  const { data, isLoading, error } = trpc.dashboard.getCategoryBreakdown.useQuery(queryInput)
  
  // 4. Defensive logging (development only)
  // console.log(...)
  
  // 5. Memoize chart config
  const chartConfig = useMemo(() => /* color mapping */, [data])
  
  // 6. Custom label function
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < MIN_LABEL_THRESHOLD) return null
    // ... polar to Cartesian conversion, return <text>
  }
  
  // 7. Custom tooltip component
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const item = payload[0]
    return (
      <div>
        {/* Category name */}
        {/* Value: (value / 1000).toFixed(1) + 'K' */}
        {/* Budget: (budget / 1000).toFixed(1) + 'K' */}
        {/* Utilization: (value / budget * 100) or 'N/A' if budget === 0 */}
      </div>
    )
  }
  
  // 8. Loading state
  if (isLoading) {
    return <Skeleton className="h-[400px] w-full" />
  }
  
  // 9. Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error Loading Category Breakdown</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    )
  }
  
  // 10. Empty state
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <p className="text-muted-foreground">No category data available</p>
      </div>
    )
  }
  
  // 11. Render chart
  return (
    <ChartContainer config={chartConfig} className="h-[400px]">
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          label={renderCustomizedLabel}
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={chartConfig[entry.name].color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend />
      </PieChart>
    </ChartContainer>
  )
}
```

**Estimated Lines**: 150-200 (including imports, comments, formatting)

---

## Migration Sequence (7 Steps)

### Overview

**Strategy**: Standard 7-Step Sequence (NOT phased)  
**Total Duration**: 4-6 hours  
**Approach**: Linear execution with validation checkpoints

**Step Dependencies**:
```
Step 1 (SKIP) → Step 2 → Step 3 → Step 4 → Step 5 → Step 6 → Step 7
                  ↓        ↓        ↓        ↓        ↓        ↓
                Create   Deploy   Build    Impl    Integrate Validate
                Proc     & Test  Cell     Comp    & Delete  All
```

---

### Step 1: Drizzle Schema Creation

**Phase**: Data Layer  
**Action**: ✅ **SKIP - Schemas Exist**  
**Duration**: 0 minutes

**Status**:
- `cost_breakdown` schema: ✅ EXISTS at `packages/db/src/schema/cost-breakdown.ts`
- `po_mappings` schema: ✅ EXISTS at `packages/db/src/schema/po-mappings.ts`

**No action required** - proceed to Step 2

---

### Step 2: Create tRPC Procedure

**Phase**: Data Layer  
**Action**: Create specialized procedure file and update domain router  
**Duration**: 1-2 hours

#### Files to Create

**File 1**: `packages/api/src/procedures/dashboard/get-category-breakdown.procedure.ts`

**Content**: Use complete implementation from "Data Layer Specifications" section above

**Checklist**:
- [ ] Copy procedure implementation from specification
- [ ] Verify imports: `z, publicProcedure, router, eq, inArray, and, costBreakdown, poMappings, TRPCError`
- [ ] Define `DEMO_UTILIZATION_RATE = 0.65` constant
- [ ] Implement input schema with optional filters
- [ ] Implement output schema (CategoryData[])
- [ ] Query cost_breakdown with conditional WHERE
- [ ] Query po_mappings with inArray()
- [ ] Aggregate using Map (not SQL GROUP BY)
- [ ] Handle null values with `Number(value || 0)`
- [ ] Implement demo fallback (no mappings)
- [ ] Add try-catch with TRPCError
- [ ] Export `getCategoryBreakdownRouter`

#### Files to Modify

**File 2**: `packages/api/src/procedures/dashboard/dashboard.router.ts`

**Changes**:
```typescript
// Add import
import { getCategoryBreakdownRouter } from './get-category-breakdown.procedure'

// Add to router composition
export const dashboardRouter = router({
  // ... existing procedures
  ...getCategoryBreakdownRouter,  // ADD THIS
})
```

**Checklist**:
- [ ] Add import statement
- [ ] Add router spread to composition
- [ ] Verify file ≤50 lines (architecture mandate)

#### Validation Checkpoints

**TypeScript Compilation**:
```bash
cd packages/api
pnpm type-check
# Expected: Zero errors
```

**Architecture Compliance**:
```bash
# Check procedure file size (MUST be ≤200 lines)
wc -l packages/api/src/procedures/dashboard/get-category-breakdown.procedure.ts
# Expected: ~95 lines ✅

# Check domain router size (MUST be ≤50 lines)
wc -l packages/api/src/procedures/dashboard/dashboard.router.ts
# Expected: ≤50 lines ✅

# Verify one procedure per file (M1)
grep -c "publicProcedure" packages/api/src/procedures/dashboard/get-category-breakdown.procedure.ts
# Expected: 1 ✅
```

**Build Test**:
```bash
pnpm build
# Expected: Build succeeds
```

**Completion Criteria**:
- [ ] Procedure file created at correct path
- [ ] Domain router updated
- [ ] TypeScript compiles without errors
- [ ] Build succeeds
- [ ] Architecture compliance verified (M1-M4)

---

### Step 3: Deploy Edge Function & Test

**Phase**: Data Layer  
**Action**: Deploy to Supabase and validate with curl  
**Duration**: 15-30 minutes

#### Deployment

**Commands**:
```bash
# Build API package
cd packages/api
pnpm build

# Deploy edge function
cd ../..
supabase functions deploy trpc --no-verify-jwt

# Wait for cold start
echo "Waiting 30 seconds for cold start..."
sleep 30
echo "Ready for testing!"
```

**Checklist**:
- [ ] API package builds successfully
- [ ] Deployment completes without errors
- [ ] Wait 30 seconds for cold start

#### Curl Testing

**Test 1: Basic Query with Filter**

```bash
curl -X POST https://[PROJECT-REF].supabase.co/functions/v1/trpc/dashboard.getCategoryBreakdown \
  -H "Content-Type: application/json" \
  -d '{
    "0": {
      "json": {
        "projectId": "[REAL-PROJECT-UUID]",
        "filters": {
          "costLine": "Capital"
        }
      }
    }
  }'
```

**Validation**:
- [ ] Status: 200 OK
- [ ] Response has `result.data.json` array
- [ ] Each category has `name`, `value`, `budget`
- [ ] Only Capital cost lines included

**Test 2: Query Without Filter**

```bash
curl -X POST https://[PROJECT-REF].supabase.co/functions/v1/trpc/dashboard.getCategoryBreakdown \
  -H "Content-Type: application/json" \
  -d '{
    "0": {
      "json": {
        "projectId": "[REAL-PROJECT-UUID]"
      }
    }
  }'
```

**Validation**:
- [ ] Status: 200 OK
- [ ] More categories than Test 1 (no filter applied)

**Test 3: Invalid UUID (Expect Error)**

```bash
curl -X POST https://[PROJECT-REF].supabase.co/functions/v1/trpc/dashboard.getCategoryBreakdown \
  -H "Content-Type: application/json" \
  -d '{
    "0": {
      "json": {
        "projectId": "invalid-uuid"
      }
    }
  }'
```

**Validation**:
- [ ] Status: 400 Bad Request
- [ ] Zod validation error present

**Test 4: Empty Data**

Use project UUID with no cost_breakdown entries.

**Validation**:
- [ ] Status: 200 OK
- [ ] Empty array returned `[]`

**CRITICAL**: ❌ **DO NOT PROCEED TO STEP 4** until all curl tests pass ✅

#### Completion Criteria

- [ ] All 4 curl tests pass
- [ ] Response structure matches specification
- [ ] No 500 errors (server issues)
- [ ] Demo fallback works (if testable)

---

### Step 4: Create Cell Structure

**Phase**: Cell Creation  
**Action**: Create directory, manifest, pipeline, test scaffold  
**Duration**: 30 minutes

#### Create Directory

```bash
mkdir -p components/cells/spend-category-chart/__tests__
```

#### Create Files

**File 1**: `components/cells/spend-category-chart/manifest.json`

**Content**: Use complete manifest from "Cell Structure Specifications" section

**Checklist**:
- [ ] Copy manifest JSON from specification
- [ ] Validate JSON syntax (use jsonlint or VS Code)
- [ ] Verify 8 behavioral assertions present
- [ ] Verify dependencies section complete
- [ ] Verify props interface specified

**File 2**: `components/cells/spend-category-chart/pipeline.yaml`

**Content**: Use complete pipeline from "Cell Structure Specifications" section

**Checklist**:
- [ ] Copy pipeline YAML from specification
- [ ] Validate YAML syntax (use yamllint or VS Code)
- [ ] Verify 5 gates configured
- [ ] Verify manual validation required
- [ ] Verify gate commands correct

**File 3**: `components/cells/spend-category-chart/__tests__/component.test.tsx`

**Content**: Test scaffold

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SpendCategoryChart } from '../component'

// Mock tRPC
vi.mock('@/lib/trpc', () => ({
  trpc: {
    dashboard: {
      getCategoryBreakdown: {
        useQuery: vi.fn()
      }
    }
  }
}))

describe('SpendCategoryChart Cell', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // TODO: Implement tests for all 8 behavioral assertions
  it.todo('BA-001: Displays pie chart with spend categories when valid data provided')
  it.todo('BA-002: Renders empty state when no data available')
  it.todo('BA-003: Hides percentage labels for slices < 5%')
  it.todo('BA-004: Shows tooltip with value, budget, and utilization on hover')
  it.todo('BA-005: Displays N/A for utilization when budget is zero')
  it.todo('BA-006: Formats currency as thousands with one decimal ($XX.XK)')
  it.todo('BA-007: Assigns colors using modulo rotation through 8-color palette')
  it.todo('BA-008: Shows loading skeleton during data fetch')
})
```

**Checklist**:
- [ ] Test file created with scaffold
- [ ] tRPC mock configured
- [ ] All 8 assertions have test stubs
- [ ] File compiles without errors

#### Validation

```bash
# Validate manifest JSON
cat components/cells/spend-category-chart/manifest.json | jq .
# Should output formatted JSON without errors

# Validate pipeline YAML
cat components/cells/spend-category-chart/pipeline.yaml | python -c "import sys, yaml; yaml.safe_load(sys.stdin)"
# Should exit without errors

# Verify test file compiles
pnpm type-check
# Should pass
```

#### Completion Criteria

- [ ] Directory structure created
- [ ] manifest.json valid and complete (8 assertions)
- [ ] pipeline.yaml valid and complete (5 gates)
- [ ] Test scaffold created and compiles

---

### Step 5: Implement Cell Component

**Phase**: Implementation  
**Action**: Create component.tsx with tRPC integration, memoization, tests  
**Duration**: 2-3 hours

#### 5.1 Setup & Imports (5 min)

**File**: `components/cells/spend-category-chart/component.tsx`

**Checklist**:
- [ ] Import React hooks: `useMemo` from 'react'
- [ ] Import tRPC client: `trpc` from '@/lib/trpc'
- [ ] Import Recharts: `PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer`
- [ ] Import shadcn components: `ChartContainer, ChartConfig, ChartTooltip, Skeleton, Alert, AlertTitle, AlertDescription`
- [ ] Define COLORS constant (8 colors)
- [ ] Define MIN_LABEL_THRESHOLD = 0.05
- [ ] Define props interface

#### 5.2 Query Setup with Memoization (15 min)

**Checklist**:
- [ ] Memoize query input: `useMemo(() => ({ projectId, filters }), [projectId, filters])`
- [ ] Call tRPC query: `trpc.dashboard.getCategoryBreakdown.useQuery(queryInput)`
- [ ] Extract: `data, isLoading, error, status`
- [ ] Add defensive logging (development only)

**Pattern**:
```typescript
const queryInput = useMemo(() => ({
  projectId,
  filters: filters || undefined
}), [projectId, filters])

const { data, isLoading, error, status } = trpc.dashboard.getCategoryBreakdown.useQuery(queryInput)

if (process.env.NODE_ENV === 'development') {
  console.log('[SpendCategoryChart] Query state:', { status, hasData: !!data })
}
```

#### 5.3 State Handlers (30 min)

**Loading State**:
```typescript
if (isLoading) {
  return <Skeleton className="h-[400px] w-full" />
}
```

**Error State**:
```typescript
if (error) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Error Loading Category Breakdown</AlertTitle>
      <AlertDescription>{error.message}</AlertDescription>
    </Alert>
  )
}
```

**Empty State**:
```typescript
if (!data || data.length === 0) {
  return (
    <div className="flex items-center justify-center h-[400px]">
      <p className="text-muted-foreground">No category data available</p>
    </div>
  )
}
```

**Checklist**:
- [ ] Loading state implemented with Skeleton
- [ ] Error state implemented with Alert
- [ ] Empty state implemented with message
- [ ] All states return early (guard clauses)

#### 5.4 Chart Config Memoization (10 min)

**Pattern**:
```typescript
const chartConfig = useMemo(() => 
  data.reduce((config, item, index) => {
    config[item.name] = {
      label: item.name,
      color: COLORS[index % COLORS.length]
    }
    return config
  }, {} as ChartConfig),
  [data]
)
```

**Checklist**:
- [ ] chartConfig wrapped in useMemo
- [ ] Depends on [data] only
- [ ] Color assigned via modulo rotation

#### 5.5 Custom Label Logic (20 min)

**Pattern**:
```typescript
const RADIAN = Math.PI / 180

const renderCustomizedLabel = ({ 
  cx, cy, midAngle, innerRadius, outerRadius, percent 
}: any) => {
  // Hide small slices
  if (percent < MIN_LABEL_THRESHOLD) return null
  
  // Polar to Cartesian conversion
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  
  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}
```

**Checklist**:
- [ ] Function defined (not inline)
- [ ] Hides labels when percent < 0.05
- [ ] Polar to Cartesian conversion correct
- [ ] Percentage formatted to whole number
- [ ] Text anchor positioned correctly

#### 5.6 Custom Tooltip (30 min)

**Pattern**:
```typescript
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || payload.length === 0) return null
  
  const item = payload[0]
  const { name, value, payload: { budget } } = item
  
  return (
    <div className="rounded-lg border bg-background p-2 shadow-sm">
      <div className="grid grid-cols-1 gap-1">
        <div className="flex justify-between gap-4">
          <span className="font-medium">{name}:</span>
          <span className="font-bold">${(value / 1000).toFixed(1)}K</span>
        </div>
        {budget > 0 && (
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Budget:</span>
            <span>${(budget / 1000).toFixed(1)}K</span>
          </div>
        )}
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Utilization:</span>
          <span>
            {budget > 0 
              ? `${((value / budget) * 100).toFixed(1)}%`
              : 'N/A'}
          </span>
        </div>
      </div>
    </div>
  )
}
```

**Checklist**:
- [ ] Null/undefined checks
- [ ] Category name displayed
- [ ] Value formatted as $XX.XK (thousands, 1 decimal)
- [ ] Budget formatted as $XX.XK
- [ ] Budget displayed conditionally
- [ ] Utilization calculated: (value / budget) * 100
- [ ] Zero budget shows 'N/A' for utilization

#### 5.7 Chart Render (20 min)

**Pattern**:
```typescript
return (
  <ChartContainer config={chartConfig} className="h-[400px]">
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          label={renderCustomizedLabel}
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={chartConfig[entry.name].color} 
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  </ChartContainer>
)
```

**Checklist**:
- [ ] ChartContainer wraps PieChart
- [ ] ResponsiveContainer for sizing
- [ ] Pie configured with data, dataKey, nameKey
- [ ] Custom label function attached
- [ ] Cell components map with colors
- [ ] Custom tooltip attached
- [ ] Legend included

#### 5.8 Write Unit Tests (45 min)

**Test Implementation Checklist**:

**BA-001**: Chart renders with data
```typescript
it('displays pie chart with spend categories when valid data provided', () => {
  const mockData = [
    { name: 'Engineering', value: 100000, budget: 150000 },
    { name: 'Equipment', value: 50000, budget: 80000 }
  ]
  
  trpc.dashboard.getCategoryBreakdown.useQuery.mockReturnValue({
    data: mockData,
    isLoading: false,
    error: null
  })
  
  render(<SpendCategoryChart projectId="test-uuid" />)
  
  expect(screen.getByRole('img')).toBeInTheDocument() // SVG chart
})
```

**BA-002**: Empty state
```typescript
it('renders empty state when no data available', () => {
  trpc.dashboard.getCategoryBreakdown.useQuery.mockReturnValue({
    data: [],
    isLoading: false,
    error: null
  })
  
  render(<SpendCategoryChart projectId="test-uuid" />)
  
  expect(screen.getByText(/no category data/i)).toBeInTheDocument()
})
```

**BA-003**: Labels hidden < 5%
```typescript
// Test via snapshot or custom render test
```

**BA-004**: Tooltip shows all metrics
```typescript
// Test with userEvent.hover() and screen.getByText()
```

**BA-005**: N/A for zero budget
```typescript
it('displays N/A for utilization when budget is zero', () => {
  const mockData = [
    { name: 'Test', value: 100, budget: 0 }
  ]
  
  // ... render and hover logic
  
  expect(screen.getByText('N/A')).toBeInTheDocument()
})
```

**BA-006**: Currency formatting
```typescript
it('formats currency as thousands with one decimal', () => {
  const mockData = [
    { name: 'Test', value: 45000, budget: 60000 }
  ]
  
  // ... render and hover
  
  expect(screen.getByText(/\$45.0K/)).toBeInTheDocument()
})
```

**BA-007**: Color modulo rotation
```typescript
// Test with 10 categories, verify color cycling
```

**BA-008**: Loading skeleton
```typescript
it('shows loading skeleton during data fetch', () => {
  trpc.dashboard.getCategoryBreakdown.useQuery.mockReturnValue({
    data: undefined,
    isLoading: true,
    error: null
  })
  
  render(<SpendCategoryChart projectId="test-uuid" />)
  
  expect(screen.getByTestId('skeleton')).toBeInTheDocument()
})
```

**Run Tests**:
```bash
pnpm test spend-category-chart --coverage
```

**Validation**:
- [ ] All 8 tests pass
- [ ] Coverage ≥80% (lines, branches, functions)
- [ ] No console errors during test execution

#### Completion Criteria

- [ ] Component implemented with all sections
- [ ] All memoization patterns applied
- [ ] Loading, error, empty states implemented
- [ ] Custom label and tooltip logic preserved
- [ ] All 8 unit tests implemented and passing
- [ ] Coverage ≥80%
- [ ] TypeScript compiles without errors
- [ ] No console warnings in test output

---

### Step 6: Update Imports & Delete Old Component

**Phase**: Integration  
**Action**: Atomic replacement in dashboard page  
**Duration**: 15 minutes

**CRITICAL**: This is an atomic operation - all changes in single commit

#### 6.1 Update Dashboard Page Import

**File**: `apps/web/app/projects/[id]/dashboard/page.tsx`

**Change 1**: Update import statement (around line 13)

```typescript
// OLD
import { SpendCategoryChart } from '@/components/dashboard/spend-category-chart'

// NEW
import { SpendCategoryChart } from '@/components/cells/spend-category-chart/component'
```

#### 6.2 Remove Data Fetching Logic

**Change 2**: Remove data fetching call (around line 106, inside Promise.all or similar)

```typescript
// DELETE THIS LINE:
const categoryData = await getCategoryBreakdown(projectId, filters)
```

**Change 3**: Remove state variable (if exists)

```typescript
// DELETE THIS LINE:
const [categoryData, setCategoryData] = useState<any[]>([])
```

#### 6.3 Update Component Usage

**Change 4**: Update JSX (around line 358)

```typescript
// OLD
<SpendCategoryChart data={categoryData} />

// NEW
<SpendCategoryChart projectId={projectId} filters={filters} />
```

#### 6.4 Delete Old Component File

```bash
rm apps/web/components/dashboard/spend-category-chart.tsx
```

#### 6.5 Verify Helper Function (Optional)

**Check if `getCategoryBreakdown` is used elsewhere**:

```bash
grep -r "getCategoryBreakdown" apps/web/ --exclude-dir=node_modules
```

**If only used by SpendCategoryChart**:
- Delete function from `apps/web/lib/dashboard-metrics.ts` (lines 225-293)

**If used by other components**:
- Leave function (will be removed when other components migrate)

#### Validation

**TypeScript Compilation**:
```bash
pnpm type-check
# Expected: Zero errors
```

**Build Test**:
```bash
pnpm build
# Expected: Build succeeds
```

**Import Check**:
```bash
# Should only show dashboard page and Cell
grep -r "SpendCategoryChart" apps/web/ --exclude-dir=node_modules
```

**File Deletion Verification**:
```bash
# Should return "No such file"
ls apps/web/components/dashboard/spend-category-chart.tsx
```

#### Completion Criteria

- [ ] Dashboard page import updated
- [ ] Data fetching logic removed (~15 lines)
- [ ] Component usage updated with new props
- [ ] Old component file deleted
- [ ] Helper function deleted (if not used elsewhere)
- [ ] TypeScript compiles without errors
- [ ] Build succeeds
- [ ] No broken imports remain

---

### Step 7: Full Validation Suite

**Phase**: Validation  
**Action**: Run all validation gates + manual verification  
**Duration**: 30-45 minutes

#### 7.1 Automated Validation

**TypeScript** (5 min):
```bash
pnpm type-check
# Expected: Zero errors across entire codebase
```

**Unit Tests** (5 min):
```bash
pnpm test spend-category-chart --coverage
# Expected: All tests pass, coverage ≥80%
```

**Production Build** (10 min):
```bash
pnpm build
# Expected: Build succeeds without errors or warnings
```

**Full Test Suite** (10 min):
```bash
pnpm test
# Expected: All tests pass (not just Cell tests)
```

**Validation Checklist**:
- [ ] TypeScript: ✅ Zero errors
- [ ] Unit Tests: ✅ All pass
- [ ] Coverage: ✅ ≥80%
- [ ] Build: ✅ Succeeds
- [ ] Full Tests: ✅ All pass

#### 7.2 Manual Validation (MANDATORY - Critical Path)

**Browser Testing Checklist**:

**Basic Rendering** (5 min):
- [ ] Navigate to `/projects/[id]/dashboard`
- [ ] Cell displays in correct position
- [ ] Pie chart renders with colored slices
- [ ] Categories match expected data
- [ ] Legend displays below chart
- [ ] No visual regressions from old component

**Data Accuracy** (5 min):
- [ ] Category names correct
- [ ] Budget amounts accurate
- [ ] Actual spend amounts accurate
- [ ] Utilization calculations correct
- [ ] Data matches old component (if comparable)

**Interactive Behavior** (5 min):
- [ ] Refresh page → Loading skeleton appears briefly
- [ ] Page loads → Chart appears after skeleton
- [ ] Hover over pie slice → Tooltip appears
- [ ] Tooltip shows:
  - [ ] Category name
  - [ ] Value formatted as $XX.XK
  - [ ] Budget formatted as $XX.XK
  - [ ] Utilization percentage (or 'N/A' if budget zero)
- [ ] Percentage labels on slices (hidden if < 5%)
- [ ] Colors cycle through 8-color palette

**Error States** (3 min):
- [ ] Disconnect network → Error message displays
- [ ] Reconnect → Chart recovers

**Console & Network** (2 min):
- [ ] Open DevTools → Console: ✅ No errors
- [ ] Console shows query state logs (development only)
- [ ] Open DevTools → Network tab
- [ ] Filter by "trpc"
- [ ] ✅ Single request to `dashboard.getCategoryBreakdown`
- [ ] ✅ Request is 200 OK
- [ ] Response structure matches output schema

**Accessibility** (3 min):
- [ ] Tab through page → Legend items keyboard accessible
- [ ] Run axe DevTools → No critical violations
- [ ] Chart has meaningful aria-label

#### 7.3 Human Validation Gate

**🛑 MANDATORY APPROVAL POINT**

```markdown
## 🛑 HUMAN VALIDATION REQUIRED

All automated tests passed ✅

Manual validation checklist completed (see 7.2 above)

**Please respond with ONE of the following**:
- "VALIDATED - proceed with ledger update"
- "FIX ISSUES - [describe problems found]"

DO NOT PROCEED without explicit approval.
```

**If "VALIDATED"** → Continue to Step 7.4  
**If "FIX ISSUES"** → ROLLBACK, address issues, retry migration

#### 7.4 Update Ledger (ONLY after VALIDATED)

**Command**:
```bash
echo '{
  "timestamp": "'"$(date -u +"%Y-%m-%dT%H:%M:%SZ")"'",
  "migration_id": "spend-category-chart-cell-migration",
  "phase": "complete",
  "component": "SpendCategoryChart",
  "artifacts": {
    "created": [
      "components/cells/spend-category-chart/component.tsx",
      "components/cells/spend-category-chart/manifest.json",
      "components/cells/spend-category-chart/pipeline.yaml",
      "components/cells/spend-category-chart/__tests__/component.test.tsx",
      "packages/api/src/procedures/dashboard/get-category-breakdown.procedure.ts"
    ],
    "modified": [
      "packages/api/src/procedures/dashboard/dashboard.router.ts",
      "apps/web/app/projects/[id]/dashboard/page.tsx"
    ],
    "deleted": [
      "apps/web/components/dashboard/spend-category-chart.tsx"
    ]
  },
  "validation": {
    "types": "pass",
    "tests": "pass",
    "build": "pass",
    "manual": "validated",
    "coverage": "≥80%"
  },
  "duration": "[ACTUAL HOURS - fill in]",
  "status": "success"
}' >> ledger.jsonl
```

**Checklist**:
- [ ] Ledger entry added
- [ ] Timestamp accurate
- [ ] All artifacts listed
- [ ] Validation status documented
- [ ] Actual duration recorded

#### 7.5 Git Commit (Single Atomic Commit)

**Command**:
```bash
git add -A
git commit -m "feat: Migrate SpendCategoryChart to Cell architecture

- Create dashboard.getCategoryBreakdown tRPC procedure (M1-M4 compliant)
- Implement SpendCategoryChart Cell with 8 behavioral assertions
- Add memoization patterns (chartConfig, query inputs) to prevent infinite loops
- Replace magic numbers with named constants (MIN_LABEL_THRESHOLD, DEMO_UTILIZATION_RATE)
- Simplify dashboard page (remove 15 lines of data fetching logic)
- Delete old component file
- All tests pass (≥80% coverage), manual validation complete

Architecture: API Procedure Specialization (one procedure, one file)
Duration: [X] hours
Refs: #spend-category-chart-migration"
```

**Checklist**:
- [ ] All files staged (git add -A)
- [ ] Commit message descriptive
- [ ] Includes key achievements
- [ ] Includes duration
- [ ] Single atomic commit ✅

#### Completion Criteria

- [ ] All automated gates pass
- [ ] Manual validation completed and approved
- [ ] Ledger updated
- [ ] Git commit created
- [ ] Migration complete ✅

---

## Rollback Strategy

### Philosophy

**NO partial migrations allowed** - complete rollback on any failure.

**Atomic Completeness Principle**: Migration succeeds completely or reverts completely. No "TODO later" or partial implementations.

---

### Trigger Conditions

Initiate rollback if **ANY** of these occur:

**Data Layer Failures**:
- TypeScript compilation errors in procedure file
- Curl tests fail (400/500 errors, incorrect data)
- Edge function deployment fails
- Domain router exceeds 50 lines (M2 violation)
- Procedure file exceeds 200 lines (M2 violation)

**Cell Implementation Failures**:
- Component stuck in infinite render loop
- TypeScript errors in component.tsx
- Unit tests fail
- Test coverage < 80%
- Build fails

**Integration Failures**:
- Dashboard page crashes after import update
- Broken imports after old component deletion
- Production build fails
- Performance regression > 10%

**Validation Failures**:
- Chart doesn't render in browser
- Data doesn't match old component
- Manual validation rejects ("FIX ISSUES")
- Critical accessibility violations

---

### Rollback Sequence

#### Step 1: Initiate Git Revert

**Command**:
```bash
# Identify migration commit
git log --oneline -5

# Revert the migration commit
git revert [commit-hash]
```

**OR if uncommitted**:
```bash
git reset --hard HEAD~1
git clean -fd  # Remove untracked files
```

#### Step 2: Verify Revert Successful

**Automated Checks**:
```bash
# Old component restored?
[ -f apps/web/components/dashboard/spend-category-chart.tsx ] && echo "✅ Restored" || echo "❌ Missing"

# Cell directory removed?
[ ! -d components/cells/spend-category-chart ] && echo "✅ Removed" || echo "❌ Still exists"

# Import reverted?
grep "from '@/components/dashboard/spend-category-chart'" apps/web/app/projects/[id]/dashboard/page.tsx && echo "✅ Reverted" || echo "❌ Not reverted"

# Build succeeds?
pnpm build && echo "✅ Build OK" || echo "❌ Build failed"
```

**Manual Checks**:
- [ ] Dashboard page loads at `/projects/[id]/dashboard`
- [ ] Old SpendCategoryChart renders correctly
- [ ] No console errors
- [ ] Data displays as before migration

#### Step 3: Update Ledger with Failure

**Command**:
```bash
echo '{
  "timestamp": "'"$(date -u +"%Y-%m-%dT%H:%M:%SZ")"'",
  "migration_id": "spend-category-chart-cell-migration",
  "phase": "failed",
  "component": "SpendCategoryChart",
  "failure_step": "[Step number and name]",
  "failure_reason": "[Specific error message]",
  "error_details": {
    "symptom": "[What went wrong]",
    "root_cause": "[Why it happened]",
    "attempted_fix": "[What was tried]"
  },
  "artifacts_attempted": {
    "created_files": ["list before failure"],
    "modified_files": ["list before failure"]
  },
  "rollback_status": "complete",
  "lessons_learned": [
    "[What to do differently next time]",
    "[Which checklist step was missed]"
  ],
  "next_steps": "[Plan for retry]",
  "duration_before_failure": "[X hours]"
}' >> ledger.jsonl
```

---

### Edge Function Handling

**Decision**: ✅ **Leave edge function deployed (no rollback)**

**Rationale**:
- tRPC procedures are additive
- Unused procedures don't break existing functionality
- `dashboard.getCategoryBreakdown` won't be called if Cell isn't integrated
- Avoids unnecessary deployment cycles
- Can be reused in next migration attempt

**Exception**: If procedure has critical bugs causing 500 errors:
- Deploy fixed version
- OR remove from domain router temporarily

---

### Partial Progress Handling

**Scenario**: Failure mid-migration (e.g., Step 5 fails after Steps 2-4 complete)

**Action**: ⚠️ **FULL ROLLBACK ONLY**

**Process**:
1. Revert ALL commits related to migration
2. Delete ALL Cell artifacts (even if partially complete)
3. Restore old component completely
4. Update ledger with partial progress details
5. Next attempt starts from Step 1 (procedure can be reused if working)

**Forbidden**:
- ❌ Keep procedure but use old component
- ❌ Keep Cell directory but don't import it
- ❌ "Complete later" flags or TODOs

---

### Rollback Validation Checklist

After rollback:
- [ ] `git status` shows clean working directory
- [ ] Old component file exists at original path
- [ ] New Cell directory does not exist
- [ ] Dashboard page imports old component
- [ ] All imports reference old component path
- [ ] `pnpm build` succeeds
- [ ] `pnpm type-check` passes
- [ ] Dashboard loads without errors in browser
- [ ] Ledger updated with FAILED entry
- [ ] No uncommitted changes remain

---

## Success Criteria

Migration is considered **SUCCESSFUL** when ALL criteria met:

### Technical Criteria

- [ ] ✅ All Drizzle schemas in place (cost_breakdown, po_mappings) - already exist
- [ ] ✅ tRPC procedure created and tested via curl
- [ ] ✅ Edge function deployed successfully
- [ ] ✅ Cell directory structure complete (component, manifest, pipeline, tests)
- [ ] ✅ TypeScript compilation: Zero errors
- [ ] ✅ Unit tests: All pass, coverage ≥80%
- [ ] ✅ Production build: Succeeds without errors
- [ ] ✅ All 8 behavioral assertions verified

### Functional Criteria

- [ ] ✅ Cell renders correctly in browser
- [ ] ✅ Chart displays with category breakdown
- [ ] ✅ Data values match old component (feature parity)
- [ ] ✅ Loading skeleton appears during fetch
- [ ] ✅ Error state displays on failure
- [ ] ✅ Empty state displays when no data
- [ ] ✅ Tooltips show correct formatting ($XX.XK)
- [ ] ✅ Percentage labels hidden for slices < 5%
- [ ] ✅ Colors cycle through 8-color palette
- [ ] ✅ Utilization shows 'N/A' when budget is zero

### Architectural Criteria

- [ ] ✅ API Procedure Specialization (M1-M4) compliance:
  - [ ] M1: One procedure per file ✅
  - [ ] M2: Procedure file ≤200 lines ✅
  - [ ] M3: No parallel implementations ✅
  - [ ] M4: Explicit naming (get-category-breakdown.procedure.ts) ✅
- [ ] ✅ Domain router ≤50 lines
- [ ] ✅ Cell uses ONLY tRPC (no direct DB access)
- [ ] ✅ Manifest has ≥3 assertions (8 provided)
- [ ] ✅ Pipeline has all 5 gates configured
- [ ] ✅ Memoization patterns applied (chartConfig, query inputs)
- [ ] ✅ Named constants replace magic numbers

### Integration Criteria

- [ ] ✅ Dashboard page import updated
- [ ] ✅ Dashboard page simplified (15 lines removed)
- [ ] ✅ Old component file DELETED
- [ ] ✅ Helper function deleted (if not used elsewhere)
- [ ] ✅ No broken imports remain
- [ ] ✅ Build succeeds after integration

### Validation Criteria

- [ ] ✅ Manual validation completed and approved
- [ ] ✅ Network tab shows single successful tRPC request
- [ ] ✅ No console errors in browser
- [ ] ✅ Accessibility: No critical violations
- [ ] ✅ Performance: ≤110% of baseline

### Documentation Criteria

- [ ] ✅ Ledger entry created with all artifacts
- [ ] ✅ Git commit with descriptive message
- [ ] ✅ Actual duration recorded
- [ ] ✅ Single atomic commit (all changes together)

---

## Phase 4 Execution Checklist

**For MigrationExecutor (Phase 4)**: Follow this checklist for zero-deviation execution.

### Pre-Flight

- [ ] Read entire migration plan thoroughly
- [ ] Understand all 7 steps and dependencies
- [ ] Have real project UUID ready for curl tests
- [ ] Have Supabase project reference ready
- [ ] Estimated time budgeted: 4-6 hours
- [ ] Clean git working directory (`git status` clean)

### Step-by-Step Execution

**Step 1: Schema Validation** (0 min)
- [ ] Verify `packages/db/src/schema/cost-breakdown.ts` exists ✅
- [ ] Verify `packages/db/src/schema/po-mappings.ts` exists ✅
- [ ] SKIP schema creation (already exist)

**Step 2: tRPC Procedure** (1-2 hours)
- [ ] Create `packages/api/src/procedures/dashboard/get-category-breakdown.procedure.ts`
- [ ] Copy implementation from "Data Layer Specifications" section
- [ ] Update `packages/api/src/procedures/dashboard/dashboard.router.ts`
- [ ] Add import and spread getCategoryBreakdownRouter
- [ ] Run `pnpm type-check` - expect zero errors
- [ ] Run `pnpm build` - expect success
- [ ] Verify procedure file ≤200 lines (~95 expected)
- [ ] Verify domain router ≤50 lines
- [ ] Verify one procedure per file (M1)

**Step 3: Deploy & Test** (15-30 min)
- [ ] Build API: `cd packages/api && pnpm build`
- [ ] Deploy: `supabase functions deploy trpc --no-verify-jwt`
- [ ] Wait 30 seconds for cold start
- [ ] Run curl Test 1 (with filter) - expect 200 OK with data
- [ ] Run curl Test 2 (no filter) - expect 200 OK with more categories
- [ ] Run curl Test 3 (invalid UUID) - expect 400 Bad Request
- [ ] Run curl Test 4 (empty data) - expect 200 OK with []
- [ ] ✅ ALL curl tests MUST pass before proceeding

**Step 4: Cell Structure** (30 min)
- [ ] Create directory: `mkdir -p components/cells/spend-category-chart/__tests__`
- [ ] Create `manifest.json` from specification
- [ ] Validate JSON syntax: `cat manifest.json | jq .`
- [ ] Verify 8 behavioral assertions present
- [ ] Create `pipeline.yaml` from specification
- [ ] Validate YAML syntax
- [ ] Verify 5 gates configured
- [ ] Create `__tests__/component.test.tsx` scaffold
- [ ] Run `pnpm type-check` - expect zero errors

**Step 5: Implement Component** (2-3 hours)
- [ ] Create `component.tsx`
- [ ] **5.1**: Add imports and constants (COLORS, MIN_LABEL_THRESHOLD)
- [ ] **5.2**: Memoize query input, call tRPC query
- [ ] **5.3**: Implement loading, error, empty states
- [ ] **5.4**: Memoize chartConfig
- [ ] **5.5**: Implement renderCustomizedLabel (hide < 5%)
- [ ] **5.6**: Implement CustomTooltip (formatting, N/A handling)
- [ ] **5.7**: Render PieChart with all components
- [ ] **5.8**: Write all 8 unit tests
- [ ] Run `pnpm test spend-category-chart --coverage`
- [ ] Verify all tests pass
- [ ] Verify coverage ≥80%
- [ ] Run `pnpm type-check` - expect zero errors

**Step 6: Integration** (15 min)
- [ ] Update `apps/web/app/projects/[id]/dashboard/page.tsx`:
  - [ ] Change import to Cell path
  - [ ] Remove getCategoryBreakdown() call
  - [ ] Remove categoryData state variable
  - [ ] Update JSX: `<SpendCategoryChart projectId={projectId} filters={filters} />`
- [ ] Delete old component: `rm apps/web/components/dashboard/spend-category-chart.tsx`
- [ ] Check helper usage: `grep -r "getCategoryBreakdown" apps/web/`
- [ ] Delete helper function if unused
- [ ] Run `pnpm type-check` - expect zero errors
- [ ] Run `pnpm build` - expect success

**Step 7: Validation** (30-45 min)
- [ ] **7.1 Automated**:
  - [ ] `pnpm type-check` - zero errors
  - [ ] `pnpm test spend-category-chart` - all pass, ≥80% coverage
  - [ ] `pnpm build` - success
  - [ ] `pnpm test` - all tests pass
- [ ] **7.2 Manual**:
  - [ ] Navigate to `/projects/[id]/dashboard` in browser
  - [ ] Verify Cell renders correctly
  - [ ] Verify chart displays with categories
  - [ ] Refresh page - loading skeleton appears
  - [ ] Hover tooltips - correct formatting
  - [ ] Check console - no errors
  - [ ] Check network - single tRPC request, 200 OK
  - [ ] Complete all browser testing checklist items
- [ ] **7.3 Human Gate**: Request validation approval
  - [ ] Wait for "VALIDATED - proceed" response
  - [ ] If "FIX ISSUES" → ROLLBACK and address
- [ ] **7.4 Ledger**: Update ledger.jsonl (only after VALIDATED)
- [ ] **7.5 Commit**: Single atomic commit with all changes

### Post-Migration

- [ ] Migration complete ✅
- [ ] All validation gates passed
- [ ] Ledger updated
- [ ] Commit pushed (if applicable)
- [ ] Duration recorded
- [ ] Phase 4 complete - ready for Phase 5 (Retrospective)

### Rollback Checklist (If Needed)

- [ ] Identify failure point
- [ ] Run `git revert [commit-hash]` OR `git reset --hard HEAD~1`
- [ ] Verify old component restored
- [ ] Verify Cell directory removed
- [ ] Verify import reverted
- [ ] Run `pnpm build` - should succeed
- [ ] Update ledger with FAILED entry
- [ ] Document failure reason and lessons learned

---

## Notes for MigrationExecutor

### Critical Patterns to Remember

**Memoization is CRITICAL**:
- ✅ Wrap ALL objects/arrays in `useMemo()`
- ✅ Query inputs MUST be memoized
- ✅ chartConfig MUST be memoized
- ❌ Forgetting memoization = infinite render loop

**Named Constants**:
- ✅ Define COLORS, MIN_LABEL_THRESHOLD, DEMO_UTILIZATION_RATE at top
- ❌ Don't use magic numbers (0.05, 0.65, etc.)

**Testing Order**:
- ✅ curl tests BEFORE client code
- ✅ Procedure MUST work before Cell implementation
- ❌ Don't skip curl tests (catches issues early)

**Atomic Integration**:
- ✅ ALL changes in Step 6 in single commit
- ✅ Import update + deletion together
- ❌ Don't commit partial integration

### Common Pitfalls (Already Addressed in Plan)

**Pitfall #1**: Unmemoized chartConfig  
**Fix**: useMemo with [data] dependency ✅

**Pitfall #2**: Magic number 0.05  
**Fix**: Named constant MIN_LABEL_THRESHOLD ✅

**Pitfall #3**: Magic number 0.65  
**Fix**: Named constant DEMO_UTILIZATION_RATE ✅

### Time Estimates

- Step 2 (Procedure): 1-2 hours
- Step 3 (Deploy & Test): 15-30 min
- Step 4 (Cell Structure): 30 min
- Step 5 (Implementation): 2-3 hours
- Step 6 (Integration): 15 min
- Step 7 (Validation): 30-45 min

**Total**: 4-6 hours (simple migration)

### Success Indicators

**You're on track if**:
- ✅ curl tests pass on first or second attempt
- ✅ Component renders on first integration attempt
- ✅ Tests pass with minimal debugging
- ✅ Manual validation finds no issues

**Red flags**:
- ❌ Multiple curl test failures (procedure logic issue)
- ❌ Infinite render loop (missing memoization)
- ❌ Tests fail repeatedly (logic or mock issues)
- ❌ Performance regression > 10% (optimization needed)

---

## Appendix

### File Locations Quick Reference

**Created**:
- `packages/api/src/procedures/dashboard/get-category-breakdown.procedure.ts`
- `components/cells/spend-category-chart/component.tsx`
- `components/cells/spend-category-chart/manifest.json`
- `components/cells/spend-category-chart/pipeline.yaml`
- `components/cells/spend-category-chart/__tests__/component.test.tsx`

**Modified**:
- `packages/api/src/procedures/dashboard/dashboard.router.ts`
- `apps/web/app/projects/[id]/dashboard/page.tsx`

**Deleted**:
- `apps/web/components/dashboard/spend-category-chart.tsx`
- `apps/web/lib/dashboard-metrics.ts` (lines 225-293, if not used elsewhere)

### Key Decisions

**Standard vs Phased**: Standard (only 1 query)  
**Manual Validation**: Required (critical path component)  
**Edge Function Rollback**: Not needed (leave deployed)  
**Helper Function**: Delete if unused, keep if used by other components

### Contacts & Resources

**Reference Documents**:
- Cell Development Checklist: `docs/cell-development-checklist.md`
- tRPC Debugging Guide: `docs/trpc-debugging-guide.md`
- API Procedure Specialization: `docs/2025-10-03_api_procedure_specialization_architecture.md`

**Analysis Reports**:
- Discovery: `thoughts/shared/discoveries/2025-10-03_15-48_discovery-report.md`
- Analysis: `thoughts/shared/analysis/2025-10-03_15-59_spend-category-chart_analysis.md`

---

**Plan Status**: ✅ READY FOR PHASE 4 EXECUTION

**Next Phase**: MigrationExecutor implements this plan with zero deviation

**Estimated Completion**: 4-6 hours from start to finish

---

*Generated by MigrationArchitect - Phase 3*  
*Date: 2025-10-03 16:09*  
*Enhancement: ULTRATHINK applied for comprehensive planning*
