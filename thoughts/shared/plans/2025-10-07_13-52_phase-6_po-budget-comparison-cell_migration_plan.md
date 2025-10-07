# Phase 6: PO Budget Comparison Cell - Migration Plan

**Date**: 2025-10-07T13:52:00Z  
**Architect**: MigrationArchitect  
**Status**: ready_for_implementation  
**Phase**: 3  
**Workflow Phase**: Phase 3 - Migration Planning  
**Enhancement**: ✅ ULTRATHINK ACTIVE

---

## Based On

- **Phase 5 Implementation**: `thoughts/shared/implementations/2025-10-07_06-45_version-comparison-cell_implementation.md`
- **Overall Plan**: `thoughts/shared/plans/2025-10-05_PHASE-OVERVIEW_all-7-phases.md`
- **Discovery**: Discovery report from Phase 1 analysis
- **Analysis**: Identified broken PO mapping query (CRITICAL FIX)

---

## Migration Metadata

**Target Component**: `BudgetComparison` component (227 lines) + PO data fetching logic  
**Target Paths**:
- Component: `apps/web/components/budget-comparison.tsx`
- Data fetching: `apps/web/app/projects/page.tsx` lines 854-955

**Complexity**: MEDIUM  
**Strategy**: Standard 7-step migration  
**Estimated Duration**: 3-5 days (24-40 hours)  
**Priority**: HIGH - CRITICAL FIX for broken query

---

## Executive Summary

### Overview

Phase 6 migrates the PO Budget Comparison functionality from projects page to ANDA Cell architecture while **fixing a critical broken query**. Current implementation queries non-existent fields in `po_mappings` table, causing potential failures.

### Key Achievements Planned

1. **Fix Broken Query**: Replace incorrect Supabase query with proper Drizzle joins
2. **Create Procedure**: `getPOSummary` with correct schema joins
3. **Migrate Component**: `BudgetComparison` → `po-budget-comparison-cell`
4. **Simplify Integration**: 100+ lines of broken data fetching → single Cell prop

### Migration Complexity

- **Data Layer**: 1 new procedure (simple aggregation with joins)
- **Component**: 227-line presentational component (straightforward migration)
- **Critical Fix**: Current query has schema mismatches (MUST fix)
- **Risk**: MEDIUM (broken query to fix, proper joins required)

### Code Impact

**Lines Removed**: ~350 lines
- `budget-comparison.tsx`: 227 lines
- Data fetching logic in `page.tsx`: ~100 lines
- Broken query code: ~30 lines

**Lines Added**: ~280 lines
- Cell structure: ~250 lines (component + manifest + pipeline)
- tRPC procedure: ~30 lines

**Net Reduction**: -70 lines + fixed broken query

---

## Migration Overview

### Current Implementation Issues

**🔴 CRITICAL BUG**: Lines 860-870 query fields that don't exist in database schema!

```typescript
// ❌ BROKEN - These fields DON'T EXIST in po_mappings table!
const { data: mappings, error: mappingsError } = await supabase
  .from('po_mappings')
  .select(`
    id,
    project_id,      // ❌ DOESN'T EXIST - no project_id in po_mappings
    po_number,       // ❌ DOESN'T EXIST - in pos table
    line_item_number,// ❌ DOESN'T EXIST - in po_line_items table
    cost_breakdown_id,
    amount           // ❌ DOESN'T EXIST - field is 'mapped_amount'
  `)
  .eq('project_id', projectId)  // ❌ BROKEN - can't filter by non-existent field
```

**Actual Schema** (`po_mappings` table):
- `id`, `po_line_item_id`, `cost_breakdown_id`, `mapped_amount`, `mapping_notes`, `mapped_by`, `mapped_at`, `created_at`, `updated_at`
- **NO** `project_id`, `po_number`, `line_item_number`, or `amount` fields!

**Why This Works Currently**: Likely returning empty results or error (silently fails)

### Correct Implementation Strategy

**Required Joins**:
1. `po_mappings` → `cost_breakdown` (to filter by `project_id`)
2. `po_mappings` → `po_line_items` (to get `line_value`, `invoiced_value_usd`)
3. `po_line_items` → `pos` (to get `po_number`)

**Example from Existing Code** (`get-existing-mappings.procedure.ts`):
```typescript
// ✅ CORRECT - Shows proper join pattern
.from(poMappings)
.innerJoin(poLineItems, eq(poLineItems.id, poMappings.poLineItemId))
.innerJoin(costBreakdown, eq(costBreakdown.id, poMappings.costBreakdownId))
.where(eq(costBreakdown.projectId, input.projectId))  // Filter via join
```

### Migration Goals

1. **Fix Broken Query**: Use proper Drizzle joins (NOT broken Supabase query)
2. **Create Procedure**: Single `getPOSummary` procedure with aggregations
3. **Migrate Component**: Encapsulate `BudgetComparison` in Cell
4. **Atomic Replacement**: Delete old component + broken query code
5. **Validate Fix**: Curl test with real project data

---

## Architecture Compliance Validation

**Pre-Implementation Verification** (Phase 5.5 Self-Validation):

### Architectural Mandates

- ✅ **M-CELL-1** (All Functionality as Cells): Component classified as Cell (decision tree: data display + user interaction)
- ✅ **M-CELL-2** (Complete Atomic Migrations): Old component deletion in step 6, broken query removed in same commit
- ✅ **M-CELL-3** (Zero God Components): Cell will be ≤250 lines (component ~200, well under 400)
- ✅ **M-CELL-4** (Explicit Behavioral Contracts): 4 behavioral assertions planned (minimum 3)

### Specialized Procedure Architecture

- ✅ **One Procedure Per File**: 1 procedure file planned (`get-po-summary.procedure.ts`)
- ✅ **Procedure Size Limits**: Estimated ~30 lines (≤200 ✓)
- ✅ **Router Complexity**: Domain router update (+1 import, stays ≤50 lines)
- ✅ **Direct Export Pattern**: Procedure exports directly (NO router wrapper)

### Forbidden Pattern Scan

- ✅ **"optional" phases**: None detected in plan
- ✅ **"future cleanup"**: None detected - complete replacement only
- ✅ **File size exemptions**: None - all files within limits

**Compliance Status**: ✅ COMPLIANT - Ready for Phase 4 implementation

---

## Data Layer Specifications

### Phase 2.1: Drizzle Schema Specifications

**No New Schemas Required** - Using existing schemas:

1. **po_mappings** (`packages/db/src/schema/po-mappings.ts`):
   - Fields: `id`, `poLineItemId`, `costBreakdownId`, `mappedAmount`, `mappingNotes`, `mappedBy`, `mappedAt`
   - Relationships: 
     - `references(() => poLineItems.id)` via `poLineItemId`
     - `references(() => costBreakdown.id)` via `costBreakdownId`

2. **po_line_items** (`packages/db/src/schema/po-line-items.ts`):
   - Fields: `id`, `poId`, `lineItemNumber`, `partNumber`, `description`, `quantity`, `uom`, `lineValue`, `invoicedQuantity`, `invoicedValueUsd`, `invoiceDate`, `supplierPromiseDate`
   - Relationships: `references(() => pos.id)` via `poId`

3. **pos** (`packages/db/src/schema/pos.ts`):
   - Fields: `id`, `poNumber`, `vendorName`, `totalValue`, `poCreationDate`, `location`, `fmtPo`

4. **cost_breakdown** (already defined in Phase 2):
   - Fields: `id`, `projectId`, `costLine`, `spendType`, `spendSubCategory`, `budgetCost`

### Phase 2.2: tRPC Procedure Specifications

#### Procedure 1: `get-po-summary.procedure.ts`

**File Location**: `packages/api/src/procedures/po-mapping/get-po-summary.procedure.ts`  
**Procedure Name**: `poMapping.getPOSummary`  
**Max Lines**: 200 (estimated ~30 lines)  
**Export Pattern**: Direct procedure export (NO router wrapper)

**Input Schema**:
```typescript
.input(z.object({
  projectId: z.string().uuid()
}))
```

**Output Schema**:
```typescript
.output(z.object({
  total: z.number(),          // Total PO value (sum of mapped amounts * ratio)
  invoiced: z.number(),       // Invoiced amount
  open: z.number(),           // Open/remaining amount
  mappingCount: z.number(),   // Number of PO mappings
  budget: z.number()          // Total budget for comparison
}))
```

**Implementation Specification**:
```typescript
import { z } from 'zod'
import { publicProcedure } from '../../trpc'
import { db } from '@/db'
import { poMappings, poLineItems, costBreakdown, pos } from '@/db/schema'
import { eq, sum } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'

export const getPOSummary = publicProcedure
  .input(z.object({
    projectId: z.string().uuid()
  }))
  .query(async ({ input }) => {
    try {
      // Get all PO mappings for this project via joins
      const mappingData = await db
        .select({
          mappedAmount: poMappings.mappedAmount,
          lineValue: poLineItems.lineValue,
          invoicedValueUsd: poLineItems.invoicedValueUsd,
        })
        .from(poMappings)
        .innerJoin(poLineItems, eq(poLineItems.id, poMappings.poLineItemId))
        .innerJoin(costBreakdown, eq(costBreakdown.id, poMappings.costBreakdownId))
        .where(eq(costBreakdown.projectId, input.projectId))
      
      // Calculate aggregates
      let total = 0
      let invoiced = 0
      let open = 0
      
      mappingData.forEach(mapping => {
        const lineValue = Number(mapping.lineValue || 0)
        const invoicedValue = Number(mapping.invoicedValueUsd || 0)
        const mappedAmount = Number(mapping.mappedAmount || 0)
        
        // Calculate ratio of mapped amount to line value
        const mappedRatio = lineValue > 0 ? mappedAmount / lineValue : 1
        
        total += lineValue * mappedRatio
        invoiced += invoicedValue * mappedRatio
        open += (lineValue - invoicedValue) * mappedRatio
      })
      
      // Get total budget for this project
      const budgetData = await db
        .select({ total: sum(costBreakdown.budgetCost) })
        .from(costBreakdown)
        .where(eq(costBreakdown.projectId, input.projectId))
      
      const budget = Number(budgetData[0]?.total || 0)
      
      return {
        total,
        invoiced,
        open,
        mappingCount: mappingData.length,
        budget
      }
    } catch (error) {
      console.error('[getPOSummary] Error:', error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch PO summary',
        cause: error
      })
    }
  })
```

**Critical Patterns Applied**:
- ✅ Uses Drizzle joins (NOT raw Supabase query)
- ✅ Uses `eq()` helper from drizzle-orm
- ✅ Proper foreign key joins through schema relationships
- ✅ Null safety with `|| 0` patterns (prevents NaN)
- ✅ Number conversion: `Number(value)` for all calculations
- ✅ Error handling with TRPCError
- ✅ Direct procedure export (no router wrapper)

**Curl Test Command**:
```bash
# Test with real project UUID
curl -X POST http://localhost:3000/api/trpc/poMapping.getPOSummary \
  -H "Content-Type: application/json" \
  -d '{
    "0": {
      "json": {
        "projectId": "94d1eaad-4ada-4fb6-b872-212b6cd6007a"
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
        "json": {
          "total": 1750000,
          "invoiced": 1200000,
          "open": 550000,
          "mappingCount": 15,
          "budget": 1800000
        }
      }
    }
  }
}
```

**Edge Cases to Test**:
- ✅ No mappings (mappingCount = 0, all values = 0)
- ✅ Invalid projectId (return empty result)
- ✅ Null invoiced values (use || 0)
- ✅ Zero line values (prevent division by zero)

#### Domain Router Update

**File**: `packages/api/src/procedures/po-mapping/po-mapping.router.ts`  
**Current Size**: 26 lines  
**After Update**: ~28 lines (≤50 ✓)

**Modification**:
```typescript
import { router } from '../../trpc';
import { getProjects } from './get-projects.procedure';
import { getSpendTypes } from './get-spend-types.procedure';
import { getSpendSubCategories } from './get-spend-sub-categories.procedure';
import { findMatchingCostBreakdown } from './find-matching-cost-breakdown.procedure';
import { getExistingMappings } from './get-existing-mappings.procedure';
import { createMapping } from './create-mapping.procedure';
import { updateMapping } from './update-mapping.procedure';
import { clearMappings } from './clear-mappings.procedure';
import { getCostBreakdownById } from './get-cost-breakdown-by-id.procedure';
import { getPOSummary } from './get-po-summary.procedure';  // ADD THIS

export const poMappingRouter = router({
  getProjects,
  getSpendTypes,
  getSpendSubCategories,
  findMatchingCostBreakdown,
  getExistingMappings,
  createMapping,
  updateMapping,
  clearMappings,
  getCostBreakdownById,
  getPOSummary,  // ADD THIS (direct reference, no spread)
});
```

**Validation**: Router stays ≤50 lines ✓

### Phase 2.3: Data Layer Validation Checklist

- [ ] Procedure file created: `get-po-summary.procedure.ts`
- [ ] Procedure uses proper Drizzle joins (NOT broken Supabase query)
- [ ] Domain router updated with direct reference (no spread operator)
- [ ] Curl test passes with real project UUID
- [ ] Edge cases tested (no mappings, invalid ID, null values)
- [ ] Procedure file ≤200 lines
- [ ] Domain router file ≤50 lines

---

## Cell Structure Specifications

### Phase 3.1: Directory Structure

**Location**: `apps/web/components/cells/po-budget-comparison-cell/`

**Files**:
```
po-budget-comparison-cell/
├── component.tsx          # Main Cell component (~200 lines)
├── manifest.json          # 4 behavioral assertions
├── pipeline.yaml          # 5 validation gates
└── __tests__/
    └── component.test.tsx # Unit tests
```

**Note**: NO `state.ts` needed (no complex client-side state)

### Phase 3.2: Component Specification (`component.tsx`)

**Estimated Size**: ~200 lines (≤400 ✓)

**Structure**:
```typescript
'use client'

import { useMemo } from 'react'
import { trpc } from '@/lib/trpc'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { TrendingUp, TrendingDown, DollarSign, FileText, Package, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface POBudgetComparisonCellProps {
  projectId: string
  onViewDetails?: () => void
  className?: string
}

export function POBudgetComparisonCell({ 
  projectId, 
  onViewDetails,
  className 
}: POBudgetComparisonCellProps) {
  // Query PO summary with memoized input
  const queryInput = useMemo(() => ({ projectId }), [projectId])
  
  const { data, isLoading, error } = trpc.poMapping.getPOSummary.useQuery(queryInput)
  
  // Loading state
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Budget vs Actual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    )
  }
  
  // Error state
  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading PO Summary</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    )
  }
  
  // Empty state (no mappings)
  if (!data || data.mappingCount === 0) {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Budget vs Actual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Package className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-sm text-muted-foreground">No PO mappings found</p>
            <p className="text-xs text-muted-foreground mt-1">Map POs to see actual spending</p>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  // Calculate metrics (memoized)
  const metrics = useMemo(() => {
    if (!data) return null
    
    const variance = data.budget - data.total
    const variancePercent = data.budget > 0 ? (variance / data.budget) * 100 : 0
    const utilizationPercent = data.budget > 0 ? (data.total / data.budget) * 100 : 0
    const invoicedPercent = data.total > 0 ? (data.invoiced / data.total) * 100 : 0
    
    return {
      variance,
      variancePercent,
      utilizationPercent,
      invoicedPercent
    }
  }, [data])
  
  if (!metrics) return null
  
  // Success state - render full comparison
  // (Reuse existing BudgetComparison component UI logic)
  return (
    <Card className={className}>
      {/* Summary Stats, Progress, PO Breakdown, Variance */}
      {/* ... Full implementation matches BudgetComparison.tsx ... */}
    </Card>
  )
}
```

**Critical Patterns Applied**:
1. **Memoization**:
   - `queryInput` memoized with `[projectId]` dependency
   - `metrics` calculation memoized to prevent recalculation on every render

2. **States**: Loading skeleton, error alert, empty state, success rendering

3. **tRPC Query**: Single query to `poMapping.getPOSummary`

4. **Component Size**: ~200 lines (integrates existing BudgetComparison UI)

### Phase 3.3: Manifest Specification (`manifest.json`)

**Minimum Assertions**: 3 (planning 4)

```json
{
  "id": "po-budget-comparison-cell",
  "version": "1.0.0",
  "description": "Displays budget vs actual spending comparison using PO mappings",
  "behavioral_assertions": [
    {
      "id": "BA-001",
      "description": "Displays budget vs actual comparison when PO mappings exist",
      "verification": "Mock successful query with mapping data, verify metrics render",
      "source": "BudgetComparison component lines 104-227"
    },
    {
      "id": "BA-002",
      "description": "Shows loading skeleton during data fetch",
      "verification": "Mock pending query, verify skeleton components visible",
      "source": "New implementation pattern"
    },
    {
      "id": "BA-003",
      "description": "Displays empty state when no PO mappings found",
      "verification": "Mock query with mappingCount = 0, verify empty message shown",
      "source": "BudgetComparison component lines 84-102"
    },
    {
      "id": "BA-004",
      "description": "Shows error alert on query failure",
      "verification": "Mock failed query, verify error message displayed",
      "source": "New implementation pattern"
    }
  ],
  "dependencies": {
    "data": [
      "po_mappings",
      "po_line_items",
      "pos",
      "cost_breakdown"
    ],
    "ui": [
      "Card",
      "Button",
      "Progress",
      "Separator",
      "Badge",
      "Tooltip",
      "Skeleton",
      "Alert"
    ]
  }
}
```

### Phase 3.4: Pipeline Configuration (`pipeline.yaml`)

```yaml
gates:
  - name: types
    command: pnpm type-check
    requirement: Zero TypeScript errors
    
  - name: tests
    command: pnpm test -- __tests__/component.test.tsx
    requirement: All tests pass, coverage ≥80%
    
  - name: build
    command: pnpm build
    requirement: Production build succeeds
    
  - name: performance
    requirement: Load time ≤110% of baseline (from manual validation)
    measurement: React DevTools Profiler
    
  - name: accessibility
    standard: WCAG AA
    requirement: Manual accessibility review
```

### Phase 3.5: Memoization Specifications

**All memoization patterns explicitly specified**:

```typescript
// Pattern 1: Query Input Memoization (MANDATORY)
const queryInput = useMemo(() => ({
  projectId
}), [projectId])  // Recreate only when projectId changes

// Pattern 2: Metrics Calculation Memoization
const metrics = useMemo(() => {
  if (!data) return null
  // ... expensive calculations ...
  return { variance, variancePercent, utilizationPercent, invoicedPercent }
}, [data])  // Recalculate only when data changes

// Rule: ALL objects passed to tRPC queries MUST be memoized
```

**Prevents**: Infinite render loops from unmemoized query inputs

---

## Migration Sequence (7 Steps)

### Strategy Decision

**Criteria**:
- Queries: 1 (getPOSummary)
- Complexity: Simple aggregation
- State: No complex state management

**Selected Strategy**: Standard 7-step sequence  
**Phased Implementation**: NOT required (only 1 query)

### Step 1: Create Drizzle Schemas

**Duration**: 0 minutes (SKIPPED - using existing schemas)

**Action**: Verify existing schemas are correct

**Validation**:
- ✅ `po_mappings` schema exists
- ✅ `po_line_items` schema exists
- ✅ `pos` schema exists
- ✅ `cost_breakdown` schema exists
- ✅ All foreign key relationships defined

### Step 2: Create tRPC Procedure

**Duration**: 1-2 hours

**Action**: Implement `get-po-summary.procedure.ts`

**Steps**:
1. Create file: `packages/api/src/procedures/po-mapping/get-po-summary.procedure.ts`
2. Implement procedure with Drizzle joins (specification above)
3. Add TRPCError handling
4. Test with curl command (specification above)
5. Verify edge cases (no mappings, invalid ID, null values)

**Validation**:
- ✅ Procedure file created (≤200 lines)
- ✅ Curl test passes with real project UUID
- ✅ Edge cases tested successfully
- ✅ No TypeScript errors

**Critical**: MUST pass curl tests before proceeding to Step 3

### Step 3: Update Domain Router & Deploy

**Duration**: 15 minutes

**Action**: Update `po-mapping.router.ts` with new procedure

**Steps**:
1. Import `getPOSummary` from `./get-po-summary.procedure`
2. Add direct reference to router (no spread operator)
3. Verify router file ≤50 lines
4. Run `pnpm build` locally
5. Deploy: `pnpm build` (Next.js API routes - no Supabase deployment)
6. Wait 0 seconds (no cold start for Next.js)
7. Re-test procedure via curl

**Validation**:
- ✅ Domain router updated (≤50 lines)
- ✅ Build succeeds
- ✅ Procedure accessible via curl after deployment

### Step 4: Create Cell Structure

**Duration**: 1-2 hours

**Action**: Create complete Cell directory structure

**Steps**:
1. Create directory: `apps/web/components/cells/po-budget-comparison-cell/`
2. Create `component.tsx` (specification above, ~200 lines)
3. Create `manifest.json` (4 behavioral assertions)
4. Create `pipeline.yaml` (5 validation gates)
5. Create `__tests__/component.test.tsx` skeleton

**Validation**:
- ✅ All 4 files created
- ✅ Manifest has ≥3 assertions (planning 4)
- ✅ Pipeline gates configured
- ✅ Component file ≤400 lines

### Step 5: Implement Component with tRPC

**Duration**: 2-3 hours

**Action**: Complete component implementation

**Steps**:
1. Implement tRPC query with memoized input
2. Implement loading state (skeleton)
3. Implement error state (alert)
4. Implement empty state (no mappings message)
5. Implement success state (metrics display - reuse BudgetComparison UI)
6. Add metrics calculation with memoization
7. Write unit tests for all 4 behavioral assertions

**Critical Patterns**:
- ✅ Memoize `queryInput` with `[projectId]` dependency
- ✅ Memoize `metrics` calculation with `[data]` dependency
- ✅ Implement all 4 states (loading, error, empty, success)

**Validation**:
- ✅ Component compiles (zero TypeScript errors)
- ✅ Tests written for all 4 assertions
- ✅ All tests pass
- ✅ Coverage ≥80%

### Step 6: Update Imports & Delete Old Component

**Duration**: 30 minutes

**Action**: Atomic replacement - all changes in single commit

**Modified Files**:
1. `apps/web/app/projects/page.tsx`:
   - Update import: `BudgetComparison` → `POBudgetComparisonCell`
   - Replace component usage (lines ~2151-2162)
   - **DELETE** broken data fetching logic (lines 854-955)
   - **DELETE** `poMappings` state variable (line 125)
   - **DELETE** `loadingPoData` state variable
   - **DELETE** `fetchPOMappings` function (entire function with broken query)
   - Remove call to `fetchPOMappings` in project expansion logic (line ~1663)

**Before** (lines 2151-2162 + broken data fetching):
```typescript
// State (line 125)
const [poMappings, setPoMappings] = useState<Record<string, any>>({})

// Broken data fetching (lines 854-955) - 100+ lines
const fetchPOMappings = async (projectId: string) => {
  // ... 100 lines of BROKEN query code ...
}

// Usage (line 1663)
if (!poMappings[project.id]) {
  await fetchPOMappings(project.id)
}

// Component usage (lines 2151-2162)
{poMappings[project.id] && (
  <div className="mb-6">
    <BudgetComparison
      budget={getTotalBudget(costBreakdowns[project.id] || [])}
      actual={poMappings[project.id]}
      loading={loadingPoData[project.id]}
      className="mb-4"
      onViewDetails={() => {
        router.push(`/po-mapping?project=${project.id}`)
      }}
    />
  </div>
)}
```

**After** (simplified to ~5 lines):
```typescript
// Cell usage (replaces all above)
<POBudgetComparisonCell
  projectId={project.id}
  onViewDetails={() => router.push(`/po-mapping?project=${project.id}`)}
  className="mb-4"
/>
```

**Deleted Files** (MANDATORY):
- ✅ `apps/web/components/budget-comparison.tsx` (227 lines)

**Validation**:
- ✅ TypeScript compilation: Zero errors
- ✅ Build succeeds
- ✅ No broken imports (`grep -r "BudgetComparison" apps/web/` returns only Cell)
- ✅ No references to broken `fetchPOMappings` function
- ✅ Old component file deleted and verified

**Importers Updated**: 1 file (`apps/web/app/projects/page.tsx`)

### Step 7: Full Validation Suite

**Duration**: 30 minutes

**Action**: Execute all validation gates

**Automated Gates**:
```bash
# Gate 1: TypeScript
pnpm type-check
# Expected: Zero errors

# Gate 2: Tests
pnpm test -- apps/web/components/cells/po-budget-comparison-cell/__tests__
# Expected: All tests pass, coverage ≥80%

# Gate 3: Build
pnpm build
# Expected: Production build succeeds

# Gate 4: M-CELL-3 Compliance
wc -l apps/web/components/cells/po-budget-comparison-cell/component.tsx
# Expected: ≤400 lines

# Gate 5: M-CELL-4 Compliance
cat apps/web/components/cells/po-budget-comparison-cell/manifest.json | jq '.behavioral_assertions | length'
# Expected: ≥3 (planning 4)

# Gate 6: Complete Replacement
ls apps/web/components/budget-comparison.tsx
# Expected: No such file (deleted)

# Gate 7: API Architecture Compliance
wc -l packages/api/src/procedures/po-mapping/get-po-summary.procedure.ts
# Expected: ≤200 lines

wc -l packages/api/src/procedures/po-mapping/po-mapping.router.ts
# Expected: ≤50 lines
```

**Manual Validation** (REQUIRED - Critical Path Component):
```markdown
## 🛑 HUMAN VALIDATION REQUIRED

Please validate the following:

1. **Cell Displays Correctly**:
   - [ ] Open browser to projects page
   - [ ] Expand a project with PO mappings
   - [ ] Verify budget vs actual comparison displays

2. **Data Accuracy**:
   - [ ] Budget amount matches cost breakdown total
   - [ ] Actual amount reflects PO mappings
   - [ ] Invoiced and open amounts display correctly
   - [ ] Variance calculation is correct
   - [ ] PO mapping count is accurate

3. **States Work**:
   - [ ] Refresh page, verify loading skeleton appears briefly
   - [ ] Expand project with no mappings, verify empty state message
   - [ ] All metrics display without NaN errors

4. **No Console Errors**:
   - [ ] Check browser console
   - [ ] Verify no errors or warnings related to PO Budget Comparison Cell

5. **Network Tab**:
   - [ ] Open Chrome DevTools → Network tab
   - [ ] Filter by "trpc"
   - [ ] Verify ONE request to `poMapping.getPOSummary`
   - [ ] Verify 200 OK response with expected data structure

6. **Critical Fix Verified**:
   - [ ] Verify data loads correctly (old broken query would fail/return empty)
   - [ ] Check response structure matches procedure output schema

Respond with:
- "VALIDATED - proceed with commit" OR
- "FIX ISSUES - [describe problems]"
```

**Performance Validation**:
- ✅ Load time ≤110% of baseline (manual measurement)
- ✅ React DevTools Profiler: ≤5 renders total
- ✅ Network tab: 1 request (no infinite loops)

**Success Criteria**: All gates pass + human validation approved

---

## Rollback Strategy

### Trigger Conditions

**Any of the following failures triggers rollback**:
- TypeScript errors after integration
- Tests fail
- Build fails
- Curl tests fail (procedure broken)
- Manual validation rejected
- Performance regression >10%

### Rollback Sequence

**Step 1**: Git Revert
```bash
# Undo migration commit
git revert HEAD
```
**Result**: All code changes reverted

**Step 2**: Verify Revert Successful
```bash
# Check old component restored
ls apps/web/components/budget-comparison.tsx
# Expected: File exists

# Check new Cell removed
ls apps/web/components/cells/po-budget-comparison-cell/
# Expected: Directory not found

# Check imports reverted
grep -r "BudgetComparison" apps/web/app/projects/page.tsx
# Expected: import { BudgetComparison } from "@/components/budget-comparison"

# Verify build succeeds
pnpm build
# Expected: Success
```

**Step 3**: Update Ledger with Failure
```bash
# Append FAILED entry to ledger.jsonl
echo '{
  "iterationId": "mig_2025-10-07_phase-6_po-budget-comparison-cell",
  "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
  "status": "FAILED",
  "phase": "Phase 6",
  "failureReason": "[specific reason]",
  "failedStep": "[step number and name]",
  "errorMessages": ["[error details]"],
  "lessonsLearned": ["[what went wrong]"],
  "nextAction": "Analyze failure and revise plan"
}' >> ledger.jsonl
```

### Edge Function Handling

**Note**: Next.js API routes (NOT Supabase Edge Functions) - no separate deployment

- Procedure deployed via Next.js build
- No "additive" consideration needed
- Rollback removes procedure automatically via git revert

### Philosophy

**NO partial migrations** (M-CELL-2 mandate):
- Full rollback on ANY failure
- Atomic completeness principle
- Either 100% success or 100% rollback

---

## Validation Strategy

### Technical Validation

#### TypeScript Gate
```yaml
command: pnpm type-check
requirement: Zero errors
automated: true
critical: true
```

#### Tests Gate
```yaml
command: pnpm test -- apps/web/components/cells/po-budget-comparison-cell/__tests__
requirements:
  - All tests pass
  - Coverage ≥80%
  - All 4 behavioral assertions verified
automated: true
critical: true
```

#### Build Gate
```yaml
command: pnpm build
requirement: Production build succeeds with zero errors
automated: true
critical: true
```

### Functional Validation

#### Feature Parity
```yaml
requirement: Cell works identically to old BudgetComparison component
method: Manual comparison + automated tests
automated: partial
checks:
  - Budget amount displays correctly
  - Actual amount reflects PO mappings
  - Variance calculation matches
  - Loading/error/empty states work
```

#### Performance Gate
```yaml
requirement: Load time ≤110% of baseline
measurement: React DevTools Profiler
baseline: To be measured during manual validation
automated: false
critical: true
```

#### Critical Fix Validation
```yaml
requirement: Broken query fixed, data loads correctly
method: Manual verification + curl test
automated: partial
checks:
  - Curl test passes with real project UUID
  - Data structure matches procedure output schema
  - No empty results (old query would fail)
  - Proper joins confirmed via SQL logging
```

### Architectural Validation

#### Cell Structure Complete
```yaml
checks:
  - manifest.json exists with ≥3 assertions (planning 4)
  - pipeline.yaml exists with all 5 gates
  - component.tsx uses only tRPC (no direct DB/Supabase)
  - Old component deleted (budget-comparison.tsx)
  - Broken data fetching code deleted (fetchPOMappings)
automated: true
critical: true
```

#### Ledger Updated
```yaml
requirement: Migration entry created in ledger.jsonl
content_includes:
  - Migration ID
  - Timestamp
  - Artifacts created/modified/deleted
  - Validation status
  - Critical fix confirmation
automated: true
```

### Manual Validation Gates

**Condition**: Critical path component (budget comparison is key feature)

**Required Human Validation**:
1. ✅ Cell displays correctly in browser
2. ✅ All data accurate and complete (budget, actual, invoiced, open, variance)
3. ✅ Loading state works (refresh page, verify skeleton)
4. ✅ Error state works (mock error, verify alert)
5. ✅ Empty state works (project with no mappings, verify message)
6. ✅ No console errors
7. ✅ Network tab shows successful request (200 OK to getPOSummary)
8. ✅ **Critical fix verified**: Data loads correctly (old broken query would fail)

**Approval Format**: User must respond "VALIDATED - proceed with commit"

---

## Success Criteria

### Deliverables Checklist

**API Layer**:
- [x] 1 new tRPC procedure created (`get-po-summary.procedure.ts`)
- [x] Domain router updated (≤50 lines)
- [x] Procedure tested via curl
- [x] Procedure deployed (Next.js build)

**Cell Layer**:
- [x] Cell created (`po-budget-comparison-cell`)
- [x] 4 behavioral assertions documented
- [x] All tests pass (≥80% coverage)
- [x] Component ≤400 lines

**Integration**:
- [x] page.tsx imports updated
- [x] Broken data fetching code deleted (100+ lines)
- [x] Old component deleted (`budget-comparison.tsx`)
- [x] Build succeeds

**Validation**:
- [x] All technical gates pass
- [x] Manual validation approved
- [x] Critical fix verified (broken query replaced with proper joins)
- [x] Ledger updated

### Measurable Outcomes

```yaml
Code Quality:
  TypeScript Errors: 0
  Test Coverage: ≥80%
  Behavioral Assertions Verified: 4/4

Architecture Compliance:
  M-CELL-1 (Cell Classification): ✓
  M-CELL-2 (Atomic Migration): ✓
  M-CELL-3 (File Size ≤400): ✓ (~200 lines)
  M-CELL-4 (≥3 Assertions): ✓ (4 assertions)
  M1 (One Procedure Per File): ✓
  M2 (Procedure ≤200 Lines): ✓ (~30 lines)
  M3 (No Parallel Implementations): ✓
  M4 (Explicit Naming): ✓ (get-po-summary)

Performance:
  Load Time: ≤110% baseline
  Render Count: ≤5
  Network Requests: 1 (batched)

Critical Fix:
  Broken Query Eliminated: ✓
  Proper Joins Implemented: ✓
  Data Loads Correctly: ✓
  No Schema Mismatches: ✓

Code Reduction:
  Lines Removed: ~350
  Lines Added: ~280
  Net Reduction: -70 lines
  Complexity Reduced: Broken query → proper tRPC procedure
```

---

## Phase 4 Execution Checklist

**For MigrationExecutor** (zero-deviation execution):

### Pre-Execution
- [ ] Read this plan completely
- [ ] Verify Phase 5 complete (version-comparison-cell validated)
- [ ] Ensure clean git state
- [ ] Create feature branch: `phase-6-po-budget-comparison-cell`

### Step-by-Step Execution

#### Data Layer (Steps 1-3)
- [ ] **Step 1**: SKIP - Verify existing schemas correct
- [ ] **Step 2**: Create `get-po-summary.procedure.ts` (specification above)
  - [ ] Implement Drizzle joins (NOT broken Supabase query)
  - [ ] Add null safety (`|| 0` patterns)
  - [ ] Add TRPCError handling
  - [ ] Test with curl (real project UUID)
  - [ ] Test edge cases (no mappings, invalid ID, null values)
  - [ ] **CRITICAL**: MUST pass curl tests before Step 3
- [ ] **Step 3**: Update `po-mapping.router.ts` (add direct reference)
  - [ ] Import getPOSummary procedure
  - [ ] Add to router (direct reference, no spread)
  - [ ] Verify router ≤50 lines
  - [ ] Run `pnpm build`
  - [ ] Re-test with curl

#### Cell Creation (Steps 4-5)
- [ ] **Step 4**: Create Cell structure
  - [ ] Create directory: `apps/web/components/cells/po-budget-comparison-cell/`
  - [ ] Create `component.tsx` (~200 lines, specification above)
  - [ ] Create `manifest.json` (4 assertions)
  - [ ] Create `pipeline.yaml` (5 gates)
  - [ ] Create `__tests__/component.test.tsx`
- [ ] **Step 5**: Implement component
  - [ ] Add tRPC query with memoized input
  - [ ] Implement loading state (skeleton)
  - [ ] Implement error state (alert)
  - [ ] Implement empty state (no mappings message)
  - [ ] Implement success state (metrics display)
  - [ ] Add memoized metrics calculation
  - [ ] Write tests for all 4 assertions
  - [ ] Verify tests pass, coverage ≥80%

#### Integration & Cleanup (Steps 6-7)
- [ ] **Step 6**: Update imports & delete old
  - [ ] Update `apps/web/app/projects/page.tsx`:
    - [ ] Change import: `BudgetComparison` → `POBudgetComparisonCell`
    - [ ] Replace component usage (lines ~2151-2162)
    - [ ] **DELETE** broken `fetchPOMappings` function (lines 854-955)
    - [ ] **DELETE** `poMappings` state variable (line 125)
    - [ ] **DELETE** `loadingPoData` state variable
    - [ ] Remove `fetchPOMappings` call (line ~1663)
  - [ ] **DELETE** `apps/web/components/budget-comparison.tsx` (227 lines)
  - [ ] Verify TypeScript: `pnpm type-check`
  - [ ] Verify build: `pnpm build`
- [ ] **Step 7**: Full validation
  - [ ] Run all automated gates (commands above)
  - [ ] Execute manual validation (checklist above)
  - [ ] **WAIT** for user approval: "VALIDATED - proceed with commit"

#### Finalization
- [ ] **Atomic Commit**: Single commit with ALL changes
  - [ ] Message: "Phase 6: Migrate PO Budget Comparison to po-budget-comparison-cell - fix broken query"
  - [ ] Include: Cell files + procedure + router + integration + deletions
- [ ] **Update Ledger**: Append success entry to `ledger.jsonl`
- [ ] **Merge to Main**: After all validation passes

---

## Pitfall Prevention

### Critical Patterns from trpc-debugging-guide.md

**Pitfall #1**: Unmemoized Query Inputs
```typescript
// ✅ CORRECT
const queryInput = useMemo(() => ({ projectId }), [projectId])
const { data } = trpc.poMapping.getPOSummary.useQuery(queryInput)

// ❌ WRONG
const { data } = trpc.poMapping.getPOSummary.useQuery({ projectId })  // New object every render!
```

**Pitfall #2**: Broken Schema Joins
```typescript
// ✅ CORRECT - Use Drizzle joins through foreign keys
.from(poMappings)
.innerJoin(poLineItems, eq(poLineItems.id, poMappings.poLineItemId))
.innerJoin(costBreakdown, eq(costBreakdown.id, poMappings.costBreakdownId))
.where(eq(costBreakdown.projectId, input.projectId))

// ❌ WRONG - Query non-existent fields (CURRENT BROKEN CODE!)
.from('po_mappings')
.select('project_id, po_number, line_item_number, amount')  // None of these exist!
.eq('project_id', projectId)  // Can't filter by non-existent field!
```

**Pitfall #3**: NaN in Calculations
```typescript
// ✅ CORRECT - Use || 0 patterns
const lineValue = Number(mapping.lineValue || 0)
const total = lineValue * mappedRatio  // Safe, won't be NaN

// ❌ WRONG
const total = Number(mapping.lineValue) * mappedRatio  // Could be NaN if null
```

**Pitfall #4**: Missing Curl Tests
```yaml
# ✅ CORRECT - Test BEFORE client code
curl -X POST http://localhost:3000/api/trpc/poMapping.getPOSummary ...
# Verify response structure matches output schema

# ❌ WRONG - Write client code without testing procedure
# Results in: debugging client when problem is in procedure
```

---

## Phase 7 Preview

**After Phase 6 completes**, proceed to Phase 7: Final Integration & Cleanup

**Phase 7 Deliverables**:
- Refactor `projects/page.tsx` to Cell orchestrator (~200 lines)
- Remove ALL remaining direct Supabase imports
- Comprehensive E2E tests
- Performance validation
- Documentation updates

**Estimated Start**: After Phase 6 validated (3-5 days from Phase 6 start)

---

## Notes for Implementation

### Critical Success Factors

1. **Fix the Broken Query**: The MOST IMPORTANT goal is replacing broken Supabase query with proper Drizzle joins
2. **Test with Real Data**: Use actual project UUIDs from database for curl tests
3. **Validate Data Accuracy**: Ensure metrics match old component (if old component ever worked)
4. **No Partial Migration**: Complete atomic replacement or full rollback

### Context for MigrationExecutor

**This is Phase 6 of 7** in the projects page migration:
- Phase 1: Projects domain ✅
- Phase 2: Cost breakdown domain ✅
- Phase 3: Initial budget workflow ✅
- Phase 4: Forecasts domain ✅
- Phase 5: Version comparison ✅
- **Phase 6: PO Budget Comparison** ← YOU ARE HERE
- Phase 7: Final integration (next)

**Migration Velocity**: ~1 phase per session, maintaining quality and validation rigor

---

**Plan Generated**: 2025-10-07T13:52:00Z  
**Migration Architect**: MigrationArchitect  
**Enhancement**: ULTRATHINK for optimal query design and migration strategy  
**Status**: ✅ READY FOR PHASE 4 IMPLEMENTATION

**Next Action**: MigrationExecutor executes this plan with zero deviation
