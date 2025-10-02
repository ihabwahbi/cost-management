# Migration Plan: budget-timeline-chart.tsx → Cell

## Frontmatter

**Date**: 2025-10-02T21:16:00Z  
**Architect**: MigrationArchitect  
**Status**: ready_for_implementation  
**Phase**: 3 - Migration Planning  
**Workflow Phase**: Phase 3: Migration Planning

**Based On**:
- Discovery Report: `thoughts/shared/discoveries/2025-10-02_18-00_discovery-report.md`
- Analysis Report: `thoughts/shared/analysis/2025-10-02_18-30_budget-timeline-chart_analysis.md`

**Migration Metadata**:
- **Target Component**: BudgetTimelineChart
- **Target Path**: `apps/web/components/dashboard/budget-timeline-chart.tsx`
- **Complexity**: Simple-Medium
- **Strategy**: Standard 7-step (not phased)
- **Estimated Duration**: 3-4 hours
- **Critical Path**: YES (manual validation required)

---

## Executive Summary

**Migration Target**: budget-timeline-chart.tsx (87 lines)  
**Destination**: components/cells/budget-timeline-chart/  
**Migration Strategy**: Standard 7-step migration with single tRPC query

**Complexity Assessment**:
- Line count: 87 (simple)
- tRPC queries: 1 (dashboard.getTimelineBudget)
- Database tables: 1 (cost_breakdown - existing schema)
- Importers: 1 (dashboard page)
- State management: None (pure presentational)
- Pitfalls detected: 4

**Key Improvements**:
- ✅ Eliminate type safety gap ('any' type in tooltip formatter)
- ✅ Add loading and error states
- ✅ Implement proper memoization patterns
- ✅ Add comprehensive test coverage (80%+)
- ✅ Direct data fetching via tRPC (no prop drilling)

**Critical Considerations**:
- Component is on critical path (project dashboard)
- Manual validation gate REQUIRED before completion
- Single atomic commit (new Cell + delete old + update imports)
- Performance baseline: 150ms → must stay ≤165ms (110%)

---

## Migration Overview

### Component Details

**Current Implementation**:
- **Location**: `apps/web/components/dashboard/budget-timeline-chart.tsx`
- **Type**: Pure presentational component (receives data via props)
- **Dependencies**: Recharts, shadcn chart components
- **Lines**: 87
- **State**: None

**New Cell Implementation**:
- **Location**: `components/cells/budget-timeline-chart/`
- **Type**: Smart Cell with tRPC data fetching
- **Dependencies**: Same UI libs + tRPC client
- **Estimated Lines**: ~120 (with loading/error states)
- **State**: tRPC query state only

### Scope

**In Scope**:
- Create tRPC procedure: `dashboard.getTimelineBudget`
- Build Cell with loading, error, empty states
- Implement 6 behavioral assertions
- Configure 5 validation gates
- Update dashboard page to use Cell
- Delete old component atomically
- Update ledger with migration entry

**Out of Scope**:
- Database schema changes (costBreakdown already exists)
- Actual spend data integration (uses simulated data like current)
- Forecast algorithm changes (maintains current logic)
- Chart type changes (keeps ComposedChart)

### Dependencies

**Database Tables**:
- `cost_breakdown` (existing) - Budget data source

**Imported By**:
- `apps/web/app/projects/[id]/dashboard/page.tsx` (line 15, usage line 433)
  - **Impact**: Remove data fetching call, pass projectId instead of data
  - **Risk**: Low (simple prop change)

**UI Dependencies**:
- `recharts` - Chart library (no changes)
- `@/components/ui/chart` - shadcn chart wrapper (no changes)
- `@/components/ui/alert` - Error state display (new)
- `@/components/ui/skeleton` - Loading state (new)

---

## Data Layer Specifications

### Drizzle Schema

**Schema: costBreakdown** (Already Exists - No Changes Needed)

**File**: `packages/db/src/schema/cost-breakdown.ts`

```typescript
// EXISTING SCHEMA - Reference only, DO NOT modify
import { pgTable, uuid, text, numeric, timestamp } from 'drizzle-orm/pg-core'
import { projects } from './projects'

export const costBreakdown = pgTable('cost_breakdown', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => projects.id),
  subBusinessLine: text('sub_business_line'),
  costLine: text('cost_line'),
  spendType: text('spend_type'),
  spendSubCategory: text('spend_sub_category'),
  budgetCost: numeric('budget_cost', { precision: 15, scale: 2 }).default('0'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})
```

**Validation**: Schema exists and matches database ✓

---

### tRPC Procedure Specification

**Procedure Name**: `dashboard.getTimelineBudget`  
**File**: `packages/api/src/routers/dashboard.ts`  
**Router**: `dashboard`

#### Input Schema

```typescript
.input(z.object({
  projectId: z.string().uuid(),
  filters: z.object({
    costLine: z.string().optional(),
    spendType: z.string().optional(),
    dateRange: z.object({
      from: z.string().transform(val => new Date(val)),  // CRITICAL: NOT z.date()
      to: z.string().transform(val => new Date(val))
    }).optional()
  }).optional()
}))
```

**CRITICAL PATTERN**: Date handling MUST use `z.string().transform()`, NOT `z.date()` (prevents HTTP serialization failures)

#### Output Schema

```typescript
z.array(z.object({
  month: z.string(),      // Format: "Jan 2025"
  budget: z.number(),     // Aggregated budget for month
  actual: z.number(),     // Actual spend (currently 0 - future enhancement)
  forecast: z.number()    // Forecast (currently 0 - future enhancement)
}))
```

#### Implementation

```typescript
import { eq, and, sum } from 'drizzle-orm'
import { costBreakdown } from '@/db/schema'
import { TRPCError } from '@trpc/server'

getTimelineBudget: publicProcedure
  .input(z.object({
    projectId: z.string().uuid(),
    filters: z.object({
      costLine: z.string().optional(),
      spendType: z.string().optional(),
      dateRange: z.object({
        from: z.string().transform(val => new Date(val)),
        to: z.string().transform(val => new Date(val))
      }).optional()
    }).optional()
  }))
  .query(async ({ ctx, input }) => {
    // Build dynamic WHERE conditions
    const conditions = [eq(costBreakdown.projectId, input.projectId)]
    
    if (input.filters?.costLine && input.filters.costLine !== 'all') {
      conditions.push(eq(costBreakdown.costLine, input.filters.costLine))
    }
    
    if (input.filters?.spendType && input.filters.spendType !== 'all') {
      conditions.push(eq(costBreakdown.spendType, input.filters.spendType))
    }
    
    // Aggregate budget cost with null safety
    const result = await ctx.db
      .select({
        totalBudget: sum(costBreakdown.budgetCost)
      })
      .from(costBreakdown)
      .where(and(...conditions))
    
    const totalBudget = Number(result[0]?.totalBudget || 0)
    
    // Generate timeline data (12-month range from dateRange or default)
    const dateRange = input.filters?.dateRange || {
      from: new Date(new Date().setMonth(new Date().getMonth() - 6)),
      to: new Date(new Date().setMonth(new Date().getMonth() + 6))
    }
    
    return generateTimelineData(totalBudget, dateRange)
  })

// Helper function (add to same file)
function generateTimelineData(totalBudget: number, dateRange: { from: Date, to: Date }) {
  const months: Array<{ month: string; budget: number; actual: number; forecast: number }> = []
  const current = new Date(dateRange.from)
  
  while (current <= dateRange.to) {
    months.push({
      month: current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      budget: Math.round(totalBudget / 12),  // Evenly distribute across months
      actual: 0,  // Future: integrate with actual spend data
      forecast: 0  // Future: integrate with forecast data
    })
    current.setMonth(current.getMonth() + 1)
  }
  
  return months
}
```

#### Error Handling

```typescript
// Add to query implementation
if (!input.projectId) {
  throw new TRPCError({
    code: 'BAD_REQUEST',
    message: 'Project ID is required'
  })
}

// Handle database errors
try {
  const result = await ctx.db.select(...)
} catch (error) {
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Failed to fetch timeline data'
  })
}
```

#### Testing Specification

**Curl Test Command**:
```bash
curl -X POST https://[PROJECT].supabase.co/functions/v1/trpc/dashboard.getTimelineBudget \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "94d1eaad-4ada-4fb6-b872-212b6cd6007a",
    "filters": {
      "costLine": "all",
      "spendType": "all",
      "dateRange": {
        "from": "2025-01-01T00:00:00Z",
        "to": "2025-12-31T23:59:59Z"
      }
    }
  }'
```

**Expected Response**: 
```json
{
  "result": {
    "data": {
      "json": [
        {
          "month": "Jan 2025",
          "budget": 8333,
          "actual": 0,
          "forecast": 0
        },
        // ... 11 more months
      ]
    }
  }
}
```

**Edge Cases to Test**:
- Invalid UUID → 400 Bad Request with Zod error
- Missing projectId → 400 Bad Request
- Empty budget data → 200 OK with array of 0-value months
- Invalid date format → 400 Bad Request

---

## Cell Structure Specifications

### Directory Structure

**Location**: `components/cells/budget-timeline-chart/`

```
budget-timeline-chart/
├── component.tsx          # Main Cell component (120 lines estimated)
├── manifest.json         # 6 behavioral assertions
├── pipeline.yaml         # 5 validation gates
└── __tests__/
    └── component.test.tsx  # Unit tests (80%+ coverage)
```

### Manifest Specification

**File**: `components/cells/budget-timeline-chart/manifest.json`

```json
{
  "id": "budget-timeline-chart",
  "version": "1.0.0",
  "description": "Interactive budget timeline visualization with ComposedChart showing budget, actual, and forecast data over time",
  "behavioral_assertions": [
    {
      "id": "BA-001",
      "description": "Component renders ComposedChart with Area (budget), Line (actual), and Bar (forecast) elements",
      "verification": "Mock timeline data, verify three chart types render with correct data keys",
      "source": "Current implementation lines 64-84"
    },
    {
      "id": "BA-002",
      "description": "Y-axis formats currency values with K notation and no decimals (e.g., '$100K')",
      "verification": "Render chart with budget data, verify Y-axis tickFormatter output",
      "source": "Current implementation line 47"
    },
    {
      "id": "BA-003",
      "description": "Tooltip displays currency values with 1 decimal precision (e.g., '$100.5K')",
      "verification": "Mock tooltip interaction, verify formatter returns correct format",
      "source": "Current implementation line 54-55"
    },
    {
      "id": "BA-004",
      "description": "Component gracefully handles empty data array without crashing",
      "verification": "Pass empty array to component, verify no errors and graceful display",
      "source": "Implicit - enhancement for Cell version"
    },
    {
      "id": "BA-005",
      "description": "Component shows skeleton loader during data fetch",
      "verification": "Mock loading state from useQuery, verify skeleton element renders",
      "source": "New requirement for Cell version"
    },
    {
      "id": "BA-006",
      "description": "Component displays error alert on query failure",
      "verification": "Mock query error, verify error message displays",
      "source": "New requirement for Cell version"
    }
  ],
  "dependencies": {
    "data": ["cost_breakdown"],
    "ui": ["recharts", "@/components/ui/chart", "@/components/ui/alert", "@/components/ui/skeleton"]
  }
}
```

### Pipeline Configuration

**File**: `components/cells/budget-timeline-chart/pipeline.yaml`

```yaml
gates:
  - type: "types"
    requirement: "TypeScript zero errors"
    command: "pnpm type-check"
    automated: true
    
  - type: "tests"
    requirement: "80%+ coverage, all 6 behavioral assertions verified"
    command: "pnpm test budget-timeline-chart"
    automated: true
    
  - type: "build"
    requirement: "Production build succeeds"
    command: "pnpm build"
    automated: true
    
  - type: "performance"
    requirement: "Load time ≤110% of baseline (165ms max)"
    measurement: "React DevTools Profiler"
    baseline: "150ms"
    automated: true
    
  - type: "accessibility"
    requirement: "Chart has proper ARIA labels and keyboard navigation"
    standard: "WCAG AA"
    automated: false
```

### Component Architecture

**File**: `components/cells/budget-timeline-chart/component.tsx`

#### Required Imports

```typescript
'use client'

import { useMemo, useCallback } from 'react'
import { trpc } from '@/lib/trpc'
import { ChartContainer, ChartConfig, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Area, Bar, Line, XAxis, YAxis, CartesianGrid, Legend, ComposedChart } from 'recharts'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
```

#### Component Signature

```typescript
interface BudgetTimelineChartCellProps {
  projectId: string
  costLine?: string
  spendType?: string
}

export function BudgetTimelineChartCell({ 
  projectId, 
  costLine, 
  spendType 
}: BudgetTimelineChartCellProps) {
  // Implementation
}
```

#### Critical Memoization Patterns

**THESE PATTERNS PREVENT INFINITE RENDER LOOPS**

```typescript
// Pattern 1: Memoize chart configuration (ALWAYS)
const chartConfig = useMemo<ChartConfig>(() => ({
  budget: {
    label: 'Budget',
    color: '#0014dc',
  },
  actual: {
    label: 'Actual Spend',
    color: '#00d2dc',
  },
  forecast: {
    label: 'Forecast',
    color: '#0099a3',
  },
}), []) // Empty deps = created once

// Pattern 2: Memoize filters object
const filters = useMemo(() => ({
  costLine: costLine || 'all',
  spendType: spendType || 'all',
  dateRange: {
    from: new Date(new Date().setMonth(new Date().getMonth() - 6)),
    to: new Date(new Date().setMonth(new Date().getMonth() + 6))
  }
}), [costLine, spendType]) // Only recreate when filters change

// Pattern 3: Memoize margin object
const chartMargin = useMemo(() => ({ 
  top: 5, 
  right: 30, 
  left: 20, 
  bottom: 5 
}), [])

// Pattern 4: Type-safe tooltip formatter (FIXES TYPE SAFETY PITFALL)
const tooltipFormatter = useCallback((value: number | string) => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  return `$${(numValue / 1000).toFixed(1)}K`
}, [])

// Pattern 5: Y-axis formatter
const yAxisFormatter = useCallback((value: number) => 
  `$${(value / 1000).toFixed(0)}K`
, [])
```

#### tRPC Query Integration

```typescript
const { data, isLoading, error } = trpc.dashboard.getTimelineBudget.useQuery(
  { projectId, filters },
  {
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,      // Cache for 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1
  }
)
```

#### State Handlers

```typescript
// Loading state
if (isLoading) {
  return (
    <div className="min-h-[300px] w-full space-y-3">
      <Skeleton className="h-[300px] w-full" />
    </div>
  )
}

// Error state
if (error) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Error Loading Timeline</AlertTitle>
      <AlertDescription>
        {error.message || 'Failed to load budget timeline data'}
      </AlertDescription>
    </Alert>
  )
}

// Empty data state
if (!data || data.length === 0) {
  return (
    <div className="min-h-[300px] w-full flex items-center justify-center text-muted-foreground">
      No timeline data available
    </div>
  )
}
```

#### Chart Rendering

```typescript
return (
  <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
    <ComposedChart data={data} margin={chartMargin}>
      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
      <XAxis 
        dataKey="month" 
        className="text-xs"
        tick={{ fill: 'currentColor', fontSize: 12 }}
        tickLine={{ stroke: 'currentColor' }}
      />
      <YAxis 
        className="text-xs"
        tick={{ fill: 'currentColor', fontSize: 12 }}
        tickLine={{ stroke: 'currentColor' }}
        tickFormatter={yAxisFormatter}
      />
      <ChartTooltip 
        content={
          <ChartTooltipContent 
            className="w-[180px]"
            nameKey="month"
            formatter={tooltipFormatter}
          />
        }
      />
      <Legend 
        wrapperStyle={{ paddingTop: '20px' }}
        iconType="line"
      />
      <Area
        type="monotone"
        dataKey="budget"
        fill="var(--color-budget)"
        fillOpacity={0.2}
        stroke="var(--color-budget)"
        strokeWidth={2}
      />
      <Line
        type="monotone"
        dataKey="actual"
        stroke="var(--color-actual)"
        strokeWidth={2}
        dot={{ r: 3, fill: 'var(--color-actual)' }}
        activeDot={{ r: 5 }}
      />
      <Bar
        dataKey="forecast"
        fill="var(--color-forecast)"
        fillOpacity={0.6}
      />
    </ComposedChart>
  </ChartContainer>
)
```

---

## Migration Sequence (7 Steps)

### Step 1: Verify Drizzle Schema
- **Phase**: Data Layer Foundation
- **Action**: Confirm costBreakdown schema exists and matches specification
- **Files**: `packages/db/src/schema/cost-breakdown.ts`
- **Validation**: 
  - ✅ Schema file exists
  - ✅ Fields match database structure
  - ✅ `budgetCost` numeric field present with correct precision
  - ✅ Relationships defined
- **Commands**:
  ```bash
  # Verify schema exists
  cat packages/db/src/schema/cost-breakdown.ts
  
  # Verify exports
  grep "costBreakdown" packages/db/src/schema/index.ts
  ```
- **Duration**: 5 minutes
- **Success Criteria**: Schema verified, no changes needed

---

### Step 2: Create tRPC Procedure
- **Phase**: Data Layer Implementation
- **Action**: Implement `dashboard.getTimelineBudget` procedure in dashboard router
- **File**: `packages/api/src/routers/dashboard.ts`
- **Implementation**: See "tRPC Procedure Specification" section above (complete code provided)
- **CRITICAL PATTERNS**:
  - ✅ Use `z.string().transform()` for dates, NOT `z.date()`
  - ✅ Use Drizzle helpers: `eq()`, `and()`, `sum()` from 'drizzle-orm'
  - ✅ Null safety: `Number(result[0]?.totalBudget || 0)`
  - ✅ TRPCError for error cases
- **Testing**:
  ```bash
  # Test procedure with curl
  curl -X POST https://[PROJECT].supabase.co/functions/v1/trpc/dashboard.getTimelineBudget \
    -H "Content-Type: application/json" \
    -d '{
      "projectId": "94d1eaad-4ada-4fb6-b872-212b6cd6007a",
      "filters": {
        "costLine": "all",
        "spendType": "all",
        "dateRange": {
          "from": "2025-01-01T00:00:00Z",
          "to": "2025-12-31T23:59:59Z"
        }
      }
    }'
  ```
- **Expected Response**: 200 OK with array of 12 monthly timeline objects
- **Edge Case Tests**:
  - Invalid UUID → 400 Bad Request
  - Missing projectId → 400 Bad Request
  - Invalid date format → 400 Bad Request
- **Duration**: 45-60 minutes
- **Success Criteria**: 
  - ✅ Procedure compiles without TypeScript errors
  - ✅ Curl test returns 200 OK with correct data structure
  - ✅ All edge cases handled properly
  - ✅ **MUST PASS curl test before proceeding to Step 3**

---

### Step 3: Deploy Edge Function
- **Phase**: Data Layer Deployment
- **Action**: Deploy tRPC edge function to Supabase with new procedure
- **Location**: `supabase/functions/trpc/`
- **Commands**:
  ```bash
  # Navigate to functions directory
  cd supabase/functions
  
  # Deploy edge function
  supabase functions deploy trpc --no-verify-jwt
  
  # Wait for cold start (CRITICAL)
  sleep 30
  
  # Re-test against deployed endpoint
  curl -X POST https://[PROJECT].supabase.co/functions/v1/trpc/dashboard.getTimelineBudget \
    -H "Content-Type: application/json" \
    -d '{"projectId":"94d1eaad-4ada-4fb6-b872-212b6cd6007a","filters":{"dateRange":{"from":"2025-01-01T00:00:00Z","to":"2025-12-31T23:59:59Z"}}}'
  ```
- **Validation**:
  - ✅ Deployment succeeds without errors
  - ✅ Edge function logs show no errors
  - ✅ Curl test against deployed endpoint returns 200 OK
  - ✅ Response structure matches expected output schema
- **Duration**: 15 minutes
- **Success Criteria**: Deployed procedure tested and verified working
- **CRITICAL**: Do NOT proceed to Step 4 until deployed procedure passes curl test

---

### Step 4: Create Cell Structure
- **Phase**: Cell Foundation
- **Action**: Create Cell directory with all required files
- **Location**: `components/cells/budget-timeline-chart/`
- **Files to Create**:
  
  1. **manifest.json** (complete specification provided above)
  2. **pipeline.yaml** (complete specification provided above)
  3. **component.tsx** (skeleton with imports):
     ```typescript
     'use client'
     
     import { useMemo, useCallback } from 'react'
     import { trpc } from '@/lib/trpc'
     // ... other imports
     
     interface BudgetTimelineChartCellProps {
       projectId: string
       costLine?: string
       spendType?: string
     }
     
     export function BudgetTimelineChartCell(props: BudgetTimelineChartCellProps) {
       // TODO: Implement in Step 5
       return <div>Budget Timeline Chart Cell</div>
     }
     ```
  4. **__tests__/component.test.tsx** (test scaffolding):
     ```typescript
     import { describe, it, expect, vi } from 'vitest'
     import { render, screen } from '@testing-library/react'
     import { BudgetTimelineChartCell } from '../component'
     
     vi.mock('@/lib/trpc', () => ({
       trpc: {
         dashboard: {
           getTimelineBudget: {
             useQuery: vi.fn()
           }
         }
       }
     }))
     
     describe('BudgetTimelineChartCell', () => {
       it('BA-001: renders chart with Area, Line, and Bar', () => {
         // TODO: Implement
       })
       // ... other tests
     })
     ```
- **Commands**:
  ```bash
  mkdir -p components/cells/budget-timeline-chart/__tests__
  touch components/cells/budget-timeline-chart/component.tsx
  touch components/cells/budget-timeline-chart/manifest.json
  touch components/cells/budget-timeline-chart/pipeline.yaml
  touch components/cells/budget-timeline-chart/__tests__/component.test.tsx
  ```
- **Validation**:
  - ✅ All 4 files created
  - ✅ manifest.json has valid JSON with 6 assertions
  - ✅ pipeline.yaml has valid YAML with 5 gates
  - ✅ component.tsx imports compile
- **Duration**: 20 minutes
- **Success Criteria**: Cell structure complete and valid

---

### Step 5: Implement Component with tRPC and Memoization
- **Phase**: Cell Implementation
- **Action**: Build complete Cell component with data fetching, memoization, and state handling
- **File**: `components/cells/budget-timeline-chart/component.tsx`
- **Complete Implementation**: See "Component Architecture" section above

**CRITICAL PATTERNS TO IMPLEMENT** (prevents infinite loops):

1. ✅ **Memoize chartConfig** (useMemo with empty deps)
2. ✅ **Memoize filters** (useMemo with [costLine, spendType] deps)
3. ✅ **Memoize chartMargin** (useMemo with empty deps)
4. ✅ **Type-safe tooltip formatter** (useCallback, fixes 'any' pitfall)
5. ✅ **Y-axis formatter** (useCallback)
6. ✅ **Loading state** (Skeleton component)
7. ✅ **Error state** (Alert component)
8. ✅ **Empty data handling** (graceful message)

**tRPC Query Configuration**:
```typescript
const { data, isLoading, error } = trpc.dashboard.getTimelineBudget.useQuery(
  { projectId, filters },
  {
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1
  }
)
```

**Defensive Logging** (during development):
```typescript
console.log('[BudgetTimelineChartCell] Query state:', {
  isLoading,
  hasData: !!data,
  dataLength: data?.length,
  error: error?.message
})
```

**Testing in Browser**:
- Open Chrome DevTools → Network tab
- Filter by "trpc"
- Verify ONE request to dashboard.getTimelineBudget
- Verify 200 OK response
- Check Console for query state logs
- Verify no infinite loop (no repeated requests)

**Validation**:
- ✅ Component renders without errors
- ✅ Network tab shows single request
- ✅ React DevTools shows <5 renders total
- ✅ All memoization patterns implemented
- ✅ Loading/error/empty states work
- ✅ No TypeScript errors
- ✅ No 'any' types (fixes pitfall)

**Duration**: 1-1.5 hours

**Success Criteria**: 
- Component functional and tested in browser
- No infinite render loops
- All states working correctly

---

### Step 6: Update Imports & DELETE Old Component
- **Phase**: Integration & Cleanup
- **Action**: ATOMIC operation - update dashboard page, delete old component (single commit)

**Files to Modify**:

1. **Dashboard Page** (`apps/web/app/projects/[id]/dashboard/page.tsx`):
   
   **Remove**:
   ```typescript
   import { BudgetTimelineChart } from '@/components/dashboard/budget-timeline-chart'
   import { getTimelineData } from '@/lib/dashboard-metrics'
   
   // Remove this call
   const timelineData = await getTimelineData(project.id, { costLine, spendType })
   ```
   
   **Add**:
   ```typescript
   import { BudgetTimelineChartCell } from '@/components/cells/budget-timeline-chart/component'
   ```
   
   **Replace Usage** (around line 433):
   ```typescript
   // OLD
   <BudgetTimelineChart data={timelineData} />
   
   // NEW
   <BudgetTimelineChartCell 
     projectId={project.id}
     costLine={costLine}
     spendType={spendType}
   />
   ```

2. **DELETE Old Component**:
   ```bash
   rm apps/web/components/dashboard/budget-timeline-chart.tsx
   ```

**CRITICAL**: These changes MUST be in ONE commit (atomic operation)

**Validation**:
```bash
# Verify no broken imports
grep -r "BudgetTimelineChart" apps/web/
# Should return ONLY the Cell import

# Verify old file deleted
ls apps/web/components/dashboard/budget-timeline-chart.tsx
# Should return: No such file or directory

# Verify build succeeds
pnpm build
# Should succeed with no errors
```

**Commands**:
```bash
# Update dashboard page
# (manual edit required)

# Delete old component
rm apps/web/components/dashboard/budget-timeline-chart.tsx

# Verify no broken imports
rg "BudgetTimelineChart" apps/web/

# Test build
pnpm build
```

**Duration**: 20 minutes

**Success Criteria**:
- ✅ Dashboard page imports Cell correctly
- ✅ Old component deleted
- ✅ No broken imports
- ✅ Build succeeds
- ✅ All changes in single commit (not yet committed - part of Step 7)

---

### Step 7: Full Validation Suite
- **Phase**: Quality Assurance & Finalization
- **Action**: Run all validation gates + manual validation + commit

**Technical Validation** (Automated):

1. **TypeScript Check**:
   ```bash
   pnpm type-check
   # Expected: ✅ No errors
   ```

2. **Unit Tests**:
   ```bash
   pnpm test budget-timeline-chart
   # Expected: ✅ All 6 behavioral assertions pass
   # Expected: ✅ Coverage ≥80%
   ```

3. **Build**:
   ```bash
   pnpm build
   # Expected: ✅ Production build succeeds
   ```

**Performance Validation**:
```yaml
tool: React DevTools Profiler
steps:
  - Open browser to /projects/[id]/dashboard
  - Open DevTools → Profiler tab
  - Click "Record"
  - Refresh page
  - Click "Stop"
  - Check BudgetTimelineChartCell render time
  - Verify: ≤165ms (110% of 150ms baseline)
```

**Manual Validation** (REQUIRED - Critical Path Component):

**🛑 HUMAN VALIDATION GATE**

User MUST validate the following before proceeding:

1. **Visual Validation**:
   - [ ] Cell displays correctly at `/projects/[id]/dashboard`
   - [ ] Chart shows Area (budget - blue), Line (actual - cyan), Bar (forecast - teal)
   - [ ] Colors match original implementation
   - [ ] Legend displays correctly with proper labels

2. **Data Accuracy**:
   - [ ] Timeline data values match old component output
   - [ ] Y-axis shows currency format: "$100K" (no decimals)
   - [ ] Tooltip shows currency format: "$100.5K" (1 decimal)
   - [ ] Month labels display correctly: "Jan 2025" format

3. **State Handling**:
   - [ ] Loading state works (refresh page, see skeleton)
   - [ ] Error state works (disconnect network, see error message)
   - [ ] Empty data handled gracefully (if applicable)

4. **Technical Checks**:
   - [ ] No errors in browser console
   - [ ] Network tab shows ONE successful request to getTimelineBudget
   - [ ] No infinite loop (no repeated requests with same timestamp)
   - [ ] Performance acceptable (no lag or stuttering)

**Approval Format**:
```markdown
User must respond with EXACTLY:
✅ "VALIDATED - proceed with commit" 
OR
❌ "FIX ISSUES - [description]"
```

**DO NOT PROCEED** without explicit "VALIDATED" response.

**Finalization** (after validation approval):

1. **Commit Changes**:
   ```bash
   git add -A
   git commit -m "Cell Migration: budget-timeline-chart.tsx → Cell

   - Created dashboard.getTimelineBudget tRPC procedure
   - Built Cell with loading/error/empty states
   - Fixed type safety issue (removed 'any' in tooltip formatter)
   - Implemented comprehensive memoization patterns
   - Added 6 behavioral assertions with tests
   - Configured 5 validation gates
   - Updated dashboard page to use Cell
   - Deleted old component
   
   Validated: All gates passed, manual validation approved
   Performance: ≤165ms (within 110% baseline)
   Coverage: ≥80%"
   ```

2. **Update Ledger**:
   ```bash
   echo '{
     "timestamp": "'$(date -Iseconds)'",
     "event": "CELL_MIGRATION_SUCCESS",
     "component": "budget-timeline-chart.tsx",
     "cell": "components/cells/budget-timeline-chart/",
     "phase": "Phase 4",
     "artifacts": {
       "created": [
         "components/cells/budget-timeline-chart/component.tsx",
         "components/cells/budget-timeline-chart/manifest.json",
         "components/cells/budget-timeline-chart/pipeline.yaml",
         "components/cells/budget-timeline-chart/__tests__/component.test.tsx"
       ],
       "modified": [
         "apps/web/app/projects/[id]/dashboard/page.tsx",
         "packages/api/src/routers/dashboard.ts"
       ],
       "deleted": [
         "apps/web/components/dashboard/budget-timeline-chart.tsx"
       ]
     },
     "validation": {
       "technical_gates": "passed",
       "manual_validation": "approved",
       "performance_baseline": "150ms",
       "performance_actual": "[X]ms",
       "coverage": "[Y]%"
     }
   }' >> ledger.jsonl
   ```

**Duration**: 30-45 minutes

**Success Criteria**:
- ✅ All technical gates passed
- ✅ Manual validation approved
- ✅ Atomic commit created
- ✅ Ledger updated
- ✅ Migration complete

---

## Rollback Strategy

### Trigger Conditions

Rollback is initiated if ANY of the following occur:

- ✗ TypeScript compilation errors
- ✗ Unit tests fail
- ✗ Production build fails
- ✗ Performance regression >10% (load time >165ms)
- ✗ Curl test fails (procedure returns error)
- ✗ Manual validation fails (user reports issues)
- ✗ Infinite render loop detected (Network tab shows repeated requests)
- ✗ Runtime errors in browser console
- ✗ Data accuracy issues (values don't match old component)

### Rollback Sequence

#### Step 1: Git Revert Migration Commit

```bash
# Revert the migration commit
git revert HEAD

# This creates a new commit that undoes all changes atomically:
# - Restores old budget-timeline-chart.tsx
# - Removes new Cell directory
# - Reverts dashboard page imports
# - Keeps tRPC procedure (harmless if unused)
```

**Result**: All code changes undone in single commit

#### Step 2: Verify Revert Successful

```bash
# 1. Check old component restored
ls apps/web/components/dashboard/budget-timeline-chart.tsx
# Expected: File exists ✓

# 2. Check new Cell removed
ls components/cells/budget-timeline-chart/
# Expected: No such file or directory ✓

# 3. Check dashboard imports reverted
grep "BudgetTimelineChart" apps/web/app/projects/[id]/dashboard/page.tsx
# Expected: Shows old import (not Cell) ✓

# 4. Verify build succeeds
pnpm build
# Expected: Production build succeeds ✓

# 5. Test in browser
# Expected: Old component renders correctly ✓
```

**Validation Checklist**:
- ✅ Old component file exists
- ✅ New Cell directory removed
- ✅ Dashboard page uses old component
- ✅ Build succeeds
- ✅ Application functional

#### Step 3: Update Ledger with Failure

```bash
echo '{
  "timestamp": "'$(date -Iseconds)'",
  "event": "MIGRATION_FAILED",
  "component": "budget-timeline-chart.tsx",
  "phase": "Phase 4",
  "failure_step": "[which step failed: Step 2, Step 5, Step 7, etc.]",
  "failure_reason": "[specific error message or issue description]",
  "failure_details": {
    "error_type": "[TypeScript | Tests | Build | Performance | Manual]",
    "error_message": "[full error output]",
    "attempted_fixes": "[any fixes attempted before rollback]"
  },
  "rollback_status": "SUCCESS",
  "rollback_commit": "'$(git rev-parse HEAD)'",
  "lessons_learned": [
    "[what went wrong]",
    "[what to do differently next time]"
  ]
}' >> ledger.jsonl
```

**Failure Analysis Template**:
```yaml
failure_step: "[Step number where failure occurred]"
failure_reason: "[Root cause]"
error_details:
  - "Symptom: [what was observed]"
  - "Root cause: [underlying issue]"
  - "Prevention: [how to avoid in future]"
lessons_learned:
  - "[Specific learning 1]"
  - "[Specific learning 2]"
next_attempt_changes:
  - "[What to change in next migration attempt]"
```

### Edge Function Handling

**Policy**: Leave deployed procedure in place

**Rationale**:
- tRPC procedures are additive (new endpoints don't break existing code)
- Unused procedures are harmless
- Can be reused in next migration attempt without redeployment
- Saves 15 minutes of redeployment time

**Action**: No cleanup needed for edge function

### Database Handling

**Policy**: No database changes in this migration

**Rationale**:
- Migration uses existing costBreakdown schema
- No schema modifications planned
- No data migrations required

**Action**: No database rollback needed

### Philosophy

**Zero Tolerance for Partial Migrations**:
- Full rollback on ANY failure
- No "partial success" states
- No "TODO later" items
- Atomic completion or complete rollback

**Safe Failure**:
- Rollback is as important as forward migration
- Tested rollback path = confidence in migration attempts
- Fail fast, rollback clean, try again with improvements

---

## Validation Strategy

### Technical Validation (Automated)

#### TypeScript Gate

```yaml
gate: types
command: pnpm type-check
requirement: Zero TypeScript errors
automated: true
failure_action: Immediate rollback

validation_steps:
  1. Run type-check command
  2. Parse output for errors
  3. If errors found → FAIL
  4. If no errors → PASS

pass_criteria:
  - No TypeScript errors in Cell component
  - No TypeScript errors in test files
  - No TypeScript errors in modified dashboard page
  - All imports resolve correctly
```

#### Tests Gate

```yaml
gate: tests
command: pnpm test budget-timeline-chart
requirements:
  - All 6 behavioral assertions verified
  - Coverage ≥80%
  - No test failures
  - No hanging tests (timeout within 30s)
automated: true
failure_action: Immediate rollback

validation_steps:
  1. Run test suite
  2. Check all assertions pass
  3. Verify coverage threshold
  4. Check for test failures

pass_criteria:
  - BA-001: Chart renders with Area, Line, Bar ✓
  - BA-002: Y-axis format "$100K" ✓
  - BA-003: Tooltip format "$100.5K" ✓
  - BA-004: Empty data handled ✓
  - BA-005: Loading state shows skeleton ✓
  - BA-006: Error state shows alert ✓
  - Coverage: ≥80% ✓
```

#### Build Gate

```yaml
gate: build
command: pnpm build
requirement: Production build succeeds with zero errors
automated: true
failure_action: Immediate rollback

validation_steps:
  1. Run production build
  2. Check for build errors
  3. Check for build warnings (should be minimal)
  4. Verify bundle size acceptable

pass_criteria:
  - Build completes successfully
  - No compilation errors
  - No critical warnings
  - Bundle size ≤ baseline + 10%
```

### Functional Validation (Mixed)

#### Performance Gate

```yaml
gate: performance
requirement: Load time ≤165ms (110% of 150ms baseline)
measurement: React DevTools Profiler
baseline: 150ms (from analysis report)
automated: true (manual measurement required)

validation_steps:
  1. Open browser to /projects/[id]/dashboard
  2. Open React DevTools → Profiler tab
  3. Click "Record"
  4. Refresh page (hard refresh: Ctrl+Shift+R)
  5. Click "Stop" after page loads
  6. Locate BudgetTimelineChartCell in flamegraph
  7. Check render time in right panel
  8. Compare to 165ms threshold

pass_criteria:
  - Initial render: ≤165ms
  - Re-render count: ≤3
  - No infinite loops
  - No performance warnings
```

#### Feature Parity Validation

```yaml
gate: feature_parity
requirement: Cell works identically to old component
method: Visual comparison + data validation
automated: false (manual review)

validation_steps:
  1. Load dashboard with old component (if still available in git history)
  2. Note data values, chart appearance, formatting
  3. Load dashboard with new Cell
  4. Compare side-by-side

comparison_checklist:
  - [ ] Chart types identical (Area, Line, Bar)
  - [ ] Colors match (blue, cyan, teal)
  - [ ] Y-axis format matches ("$100K")
  - [ ] Tooltip format matches ("$100.5K")
  - [ ] Month labels match ("Jan 2025")
  - [ ] Data values identical
  - [ ] Legend labels match
  - [ ] Grid styling matches

pass_criteria:
  - Visual: 100% match
  - Data: 100% match
  - Format: 100% match
```

### Architectural Validation (Automated)

#### Cell Structure Validation

```yaml
gate: cell_structure
automated: true

validation_steps:
  1. Check manifest.json exists and is valid JSON
  2. Verify ≥3 behavioral assertions in manifest
  3. Check pipeline.yaml exists and is valid YAML
  4. Verify 5 gates configured in pipeline
  5. Confirm component.tsx uses only tRPC (no direct DB)
  6. Verify old component deleted
  7. Check no parallel implementations

pass_criteria:
  - manifest.json: Valid, ≥6 assertions ✓
  - pipeline.yaml: Valid, 5 gates ✓
  - component.tsx: tRPC only, no Supabase client ✓
  - Old component: Deleted ✓
  - No duplicates: Only Cell version exists ✓
```

#### Ledger Validation

```yaml
gate: ledger
automated: true (part of Step 7)

validation_steps:
  1. Check ledger.jsonl updated with migration entry
  2. Verify all required fields present
  3. Confirm timestamp accurate
  4. Validate artifacts list complete

required_fields:
  - timestamp (ISO 8601)
  - event ("CELL_MIGRATION_SUCCESS")
  - component (original path)
  - cell (new Cell path)
  - phase ("Phase 4")
  - artifacts.created (array of new files)
  - artifacts.modified (array of changed files)
  - artifacts.deleted (array of removed files)
  - validation.technical_gates ("passed")
  - validation.manual_validation ("approved")
  - validation.performance_baseline (number)
  - validation.performance_actual (number)
  - validation.coverage (percentage)

pass_criteria:
  - Entry exists ✓
  - All fields present ✓
  - Data accurate ✓
```

### Manual Validation Gates (REQUIRED)

**Trigger**: Component on critical path (dashboard)  
**Required**: YES  
**Blocker**: Migration cannot complete without manual approval

#### Manual Validation Checklist

**🛑 HUMAN VALIDATION REQUIRED**

Before considering migration complete, user MUST validate:

##### 1. Visual Validation

```yaml
location: /projects/[id]/dashboard
checks:
  - [ ] Cell displays correctly in browser
  - [ ] Chart shows three elements:
        - Area chart (budget) - blue with light fill
        - Line chart (actual) - cyan with dots
        - Bar chart (forecast) - teal semi-transparent
  - [ ] Colors match original:
        - Budget: #0014dc (blue)
        - Actual: #00d2dc (cyan)
        - Forecast: #0099a3 (teal)
  - [ ] Legend displays with correct labels:
        - "Budget"
        - "Actual Spend"
        - "Forecast"
  - [ ] Grid lines visible (3-3 dash pattern)
  - [ ] Axes render correctly
```

##### 2. Data Accuracy

```yaml
comparison_method: Side-by-side with old component data
checks:
  - [ ] Timeline data values match old component
        (can check in browser console or Network tab)
  - [ ] Y-axis formatting correct:
        - Format: "$100K" (no decimals)
        - Values scaled to thousands
        - Example: 100000 → "$100K"
  - [ ] Tooltip formatting correct:
        - Format: "$100.5K" (1 decimal)
        - Shows on hover
        - Example: 100500 → "$100.5K"
  - [ ] Month labels correct:
        - Format: "Jan 2025"
        - Matches timeline range
        - All months present
  - [ ] Budget values distributed correctly across months
```

##### 3. State Handling

```yaml
loading_state_test:
  steps:
    - Open dashboard page
    - Before data loads, verify skeleton appears
    - Skeleton should be ~300px height, gray placeholder
  verification: [ ] Skeleton displays during load

error_state_test:
  steps:
    - Open dashboard page
    - Open DevTools → Network tab
    - Set network to "Offline"
    - Refresh page
    - Verify error alert appears with message
  verification: [ ] Error alert displays on failure

empty_state_test:
  steps:
    - (May not be testable if project always has data)
    - If testable: verify graceful "No data" message
  verification: [ ] Empty state handled (if applicable)
```

##### 4. Technical Checks

```yaml
console_check:
  steps:
    - Open browser DevTools → Console tab
    - Load dashboard page
    - Check for errors (red messages)
  verification: [ ] No console errors

network_check:
  steps:
    - Open DevTools → Network tab
    - Filter by "trpc"
    - Load dashboard page
    - Count requests to getTimelineBudget
  verification: [ ] Exactly ONE request (batching working)
  verification: [ ] Request returns 200 OK
  verification: [ ] Response has correct data structure

render_loop_check:
  steps:
    - Keep Network tab open
    - Watch for repeated requests to same endpoint
    - If requests keep firing every few ms → infinite loop
  verification: [ ] No infinite render loops

performance_check:
  steps:
    - Use page normally
    - Check for lag, stuttering, or freezing
    - Should feel responsive
  verification: [ ] Performance acceptable (no lag)
```

##### 5. Approval Format

**User must respond with EXACTLY ONE of these**:

✅ **PASS - All checks validated**
```
VALIDATED - proceed with commit
```

❌ **FAIL - Issues found**
```
FIX ISSUES - [specific description]

Examples:
- "FIX ISSUES - Tooltip showing wrong format, displays '$100K' instead of '$100.5K'"
- "FIX ISSUES - Infinite loop detected, Network tab shows 20+ requests"
- "FIX ISSUES - Colors don't match, budget line is green instead of blue"
```

**DO NOT PROCEED** without explicit "VALIDATED - proceed with commit" response.

**If validation fails**:
1. Document specific issues
2. Attempt fix (if quick, <15 min)
3. If cannot fix quickly → ROLLBACK
4. Update ledger with failure details
5. Analyze root cause
6. Plan fix for next attempt

---

## Success Criteria

Migration is considered **SUCCESSFUL** when ALL of the following are met:

### Data Layer ✅
- [ ] costBreakdown schema verified (already exists)
- [ ] dashboard.getTimelineBudget procedure created
- [ ] Procedure uses `z.string().transform()` for dates (not `z.date()`)
- [ ] Drizzle patterns use helpers (eq, and, sum)
- [ ] Curl test passes with 200 OK response
- [ ] Edge function deployed successfully
- [ ] Deployed procedure tested and verified

### Cell Structure ✅
- [ ] Cell directory created: `components/cells/budget-timeline-chart/`
- [ ] manifest.json exists with 6 behavioral assertions
- [ ] pipeline.yaml exists with 5 validation gates
- [ ] component.tsx implements all patterns correctly
- [ ] __tests__/component.test.tsx exists with 80%+ coverage

### Implementation ✅
- [ ] All memoization patterns implemented:
  - chartConfig memoized
  - filters object memoized
  - chartMargin memoized
  - tooltip formatter memoized and type-safe
  - Y-axis formatter memoized
- [ ] Loading state implemented (Skeleton)
- [ ] Error state implemented (Alert)
- [ ] Empty state handled gracefully
- [ ] tRPC query configured correctly (enabled, staleTime, etc.)
- [ ] No 'any' types (type safety pitfall fixed)

### Integration ✅
- [ ] Dashboard page updated to import Cell
- [ ] Data fetching removed from dashboard page
- [ ] Cell receives projectId instead of data prop
- [ ] Old component deleted
- [ ] No broken imports (`grep -r "BudgetTimelineChart"` returns only Cell)

### Validation ✅
- [ ] TypeScript check passes (zero errors)
- [ ] All tests pass (6 behavioral assertions)
- [ ] Coverage ≥80%
- [ ] Production build succeeds
- [ ] Performance within threshold (≤165ms)
- [ ] Manual validation approved (user responded "VALIDATED")
- [ ] No infinite render loops
- [ ] No console errors

### Finalization ✅
- [ ] Single atomic commit created with all changes
- [ ] Commit message follows format
- [ ] Ledger updated with migration entry
- [ ] Ledger includes all required fields
- [ ] Migration status: SUCCESS

### Measurable Outcomes ✅
- [ ] Load time: ≤165ms (110% of 150ms baseline)
- [ ] Test coverage: ≥80%
- [ ] Behavioral assertions: 6/6 verified
- [ ] Validation gates: 5/5 passed
- [ ] Type errors: 0 (down from 1)
- [ ] Critical path validated: Yes (manual approval obtained)

---

## Phase 4 Execution Checklist

**For MigrationExecutor**: Follow this checklist step-by-step with zero deviation

### Pre-Execution
- [ ] Read this entire migration plan
- [ ] Understand all 7 steps
- [ ] Identify critical patterns (memoization, date handling)
- [ ] Note manual validation requirement at Step 7
- [ ] Prepare for rollback if any step fails

### Step-by-Step Execution

#### ✅ Step 1: Verify Drizzle Schema (5 min)
- [ ] Check `packages/db/src/schema/cost-breakdown.ts` exists
- [ ] Verify budgetCost field present
- [ ] Confirm schema exports correctly
- [ ] **Success Criteria**: Schema verified, no changes needed

#### ✅ Step 2: Create tRPC Procedure (45-60 min)
- [ ] Open `packages/api/src/routers/dashboard.ts`
- [ ] Add getTimelineBudget procedure with exact specification
- [ ] Use `z.string().transform()` for dates (NOT z.date())
- [ ] Use Drizzle helpers: eq(), and(), sum()
- [ ] Add generateTimelineData helper function
- [ ] Test with curl command (provided in plan)
- [ ] **Success Criteria**: Curl test returns 200 OK with timeline array
- [ ] **BLOCKER**: Cannot proceed to Step 3 until curl test passes

#### ✅ Step 3: Deploy Edge Function (15 min)
- [ ] Run: `cd supabase/functions`
- [ ] Run: `supabase functions deploy trpc --no-verify-jwt`
- [ ] Wait 30 seconds for cold start
- [ ] Re-run curl test against deployed endpoint
- [ ] **Success Criteria**: Deployed procedure returns 200 OK
- [ ] **BLOCKER**: Cannot proceed to Step 4 until deployed test passes

#### ✅ Step 4: Create Cell Structure (20 min)
- [ ] Create directory: `components/cells/budget-timeline-chart/`
- [ ] Create `manifest.json` with 6 assertions (copy from plan)
- [ ] Create `pipeline.yaml` with 5 gates (copy from plan)
- [ ] Create `component.tsx` skeleton with imports
- [ ] Create `__tests__/component.test.tsx` scaffolding
- [ ] **Success Criteria**: All files valid and importable

#### ✅ Step 5: Implement Component (1-1.5 hours)
- [ ] Implement all memoization patterns (chartConfig, filters, margin, formatters)
- [ ] Add tRPC query with correct configuration
- [ ] Implement loading state (Skeleton)
- [ ] Implement error state (Alert)
- [ ] Implement empty state handling
- [ ] Implement chart rendering (Area, Line, Bar)
- [ ] Add defensive logging for development
- [ ] Test in browser:
  - [ ] Open /projects/[id]/dashboard
  - [ ] Check Network tab (1 request only)
  - [ ] Check Console (no errors, query logs)
  - [ ] Verify no infinite loop
- [ ] **Success Criteria**: Component renders, no loops, all states work

#### ✅ Step 6: Update Imports & Delete Old (20 min)
- [ ] Update dashboard page:
  - [ ] Remove BudgetTimelineChart import
  - [ ] Remove getTimelineData call
  - [ ] Add BudgetTimelineChartCell import
  - [ ] Update component usage (pass projectId)
- [ ] Delete old component: `rm apps/web/components/dashboard/budget-timeline-chart.tsx`
- [ ] Verify: `grep -r "BudgetTimelineChart" apps/web/` (should show only Cell)
- [ ] Run: `pnpm build` (must succeed)
- [ ] **Success Criteria**: Build succeeds, old file deleted
- [ ] **DO NOT COMMIT YET** - wait for Step 7 validation

#### ✅ Step 7: Full Validation (30-45 min)
- [ ] Run: `pnpm type-check` → must pass
- [ ] Run: `pnpm test budget-timeline-chart` → all 6 assertions pass, ≥80% coverage
- [ ] Run: `pnpm build` → must succeed
- [ ] Performance check:
  - [ ] Open React DevTools Profiler
  - [ ] Record page load
  - [ ] Verify Cell render time ≤165ms
- [ ] **MANUAL VALIDATION** (REQUIRED):
  - [ ] Complete all checks in "Manual Validation Checklist" section
  - [ ] Obtain user approval: "VALIDATED - proceed with commit"
  - [ ] **BLOCKER**: Cannot proceed without "VALIDATED" response
- [ ] Create atomic commit (message template in plan)
- [ ] Update ledger.jsonl (template in plan)
- [ ] **Success Criteria**: All gates passed, manual approval obtained, committed

### Post-Execution
- [ ] Verify commit exists in git log
- [ ] Verify ledger entry created
- [ ] Confirm dashboard works in production
- [ ] Remove defensive logging (optional cleanup)
- [ ] Update any relevant documentation

### Rollback Procedure (If Any Step Fails)
- [ ] Run: `git revert HEAD`
- [ ] Verify old component restored
- [ ] Verify new Cell removed
- [ ] Verify build succeeds
- [ ] Update ledger with failure details (template in Rollback section)
- [ ] Analyze failure, plan next attempt

---

## Appendix: Quick Reference

### Critical Patterns Checklist

**Memoization Patterns** (prevents infinite loops):
- ✅ chartConfig → `useMemo(() => ({...}), [])`
- ✅ filters → `useMemo(() => ({...}), [costLine, spendType])`
- ✅ chartMargin → `useMemo(() => ({...}), [])`
- ✅ tooltipFormatter → `useCallback((value) => {...}, [])`
- ✅ yAxisFormatter → `useCallback((value) => {...}, [])`

**Date Handling** (prevents serialization failure):
- ✅ Input schema: `z.string().transform(val => new Date(val))`
- ❌ Never use: `z.date()`

**Drizzle Patterns** (prevents SQL errors):
- ✅ Use: `eq()`, `and()`, `sum()` from 'drizzle-orm'
- ❌ Never use: Raw SQL strings

**Null Safety** (prevents NaN):
- ✅ Use: `Number(result[0]?.totalBudget || 0)`
- ❌ Never use: `result[0].totalBudget` (can be null)

### File Paths Reference

**Existing Files** (to modify):
- `packages/db/src/schema/cost-breakdown.ts` (verify only)
- `packages/api/src/routers/dashboard.ts` (add procedure)
- `apps/web/app/projects/[id]/dashboard/page.tsx` (update imports)

**New Files** (to create):
- `components/cells/budget-timeline-chart/component.tsx`
- `components/cells/budget-timeline-chart/manifest.json`
- `components/cells/budget-timeline-chart/pipeline.yaml`
- `components/cells/budget-timeline-chart/__tests__/component.test.tsx`

**Files to Delete**:
- `apps/web/components/dashboard/budget-timeline-chart.tsx` ❌

### Commands Reference

```bash
# Step 2: Test procedure
curl -X POST https://[PROJECT].supabase.co/functions/v1/trpc/dashboard.getTimelineBudget \
  -H "Content-Type: application/json" \
  -d '{"projectId":"94d1eaad-4ada-4fb6-b872-212b6cd6007a","filters":{"dateRange":{"from":"2025-01-01T00:00:00Z","to":"2025-12-31T23:59:59Z"}}}'

# Step 3: Deploy edge function
cd supabase/functions
supabase functions deploy trpc --no-verify-jwt
sleep 30

# Step 4: Create Cell structure
mkdir -p components/cells/budget-timeline-chart/__tests__

# Step 6: Verify no broken imports
rg "BudgetTimelineChart" apps/web/

# Step 7: Run validation
pnpm type-check
pnpm test budget-timeline-chart
pnpm build

# Rollback (if needed)
git revert HEAD
```

### Pitfall Prevention

**Pitfall 1: Type Safety** (line 54)
- ❌ Old: `formatter={(value: any) => ...}`
- ✅ New: `const tooltipFormatter = useCallback((value: number | string) => ...)`

**Pitfall 2: No Error Boundaries**
- ✅ Added: Alert component for error state
- ✅ Added: Empty state handling

**Pitfall 3: Unmemoized Configuration**
- ✅ Fixed: All configs memoized with useMemo/useCallback

**Pitfall 4: Missing Loading/Error States**
- ✅ Added: Skeleton for loading
- ✅ Added: Alert for errors
- ✅ Added: Message for empty data

---

**END OF MIGRATION PLAN**

**Ready for Phase 4: Migration Execution**

**Executor Instructions**: Follow Step-by-Step Execution Checklist with zero deviation. Contact for assistance if any step fails or is unclear. Rollback immediately on any validation failure.
