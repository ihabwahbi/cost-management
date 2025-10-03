# REVISED Migration Plan: Main Dashboard Page

## Metadata

**Generated**: 2025-10-03 16:23 UTC  
**Architect**: MigrationArchitect (Phase 3)  
**Status**: ready_for_implementation  
**Phase**: 3  
**Workflow Phase**: Phase 3 - Migration Planning (REVISED)  
**Enhancement Mode**: ULTRATHINK Applied

**Based On**:
- **Original Plan**: `thoughts/shared/plans/2025-10-03_01-01_main-dashboard_migration_plan.md`
- **Partial Implementation**: `thoughts/shared/implementations/2025-10-03_03-00_main-dashboard_phase-ab-complete_implementation-report.md`
- **Resume Guide**: `thoughts/shared/implementations/2025-10-03_03-00_main-dashboard_RESUME-GUIDE.md`
- **Architecture Documentation**: `docs/2025-10-03_api_procedure_specialization_architecture.md`

**Revision Metadata**:
- **Reason for Revision**: Architecture refactoring to API Procedure Specialization (M1-M4 mandates)
- **Old Implementation Status**: Phases A & B completed in monolithic pattern, then lost during architecture migration
- **Current State**: Clean slate - all procedures must be re-implemented in specialized architecture
- **Architecture Compliance**: MANDATORY M1-M4 compliance for all new code

---

## 🔴 CRITICAL: Architectural Context & Revision Summary

### What Happened: Timeline of Events

**October 3, 2025 - Morning (10:17-10:27 UTC+8)**:
- Phases A & B implemented following original migration plan
- Procedures added to `packages/api/src/routers/dashboard.ts` (monolithic router)
- Parallel implementation created in `supabase/functions/trpc/index.ts`
- Commits: 8291721 (Phase A), fe1c996 (Phase B)
- **Architecture Status**: ❌ Violated M1, M2, M3 mandates

**October 3, 2025 - Afternoon (13:53-14:12 UTC+8)**:
- ENTIRE codebase underwent API Procedure Specialization refactoring
- All dashboard procedures migrated to specialized files (6 procedures)
- Monolithic files deleted: `packages/api/src/routers/dashboard.ts`, `supabase/functions/trpc/index.ts`
- Next.js API route created at `/api/trpc` (commit feed25f)
- **Phases A & B procedures (getMainMetrics, getRecentActivity) were NOT migrated**
- **Architecture Status**: ✅ Now M1-M4 compliant (but missing 2 procedures)

### Current State Assessment

**✅ What Exists**:
- Dashboard domain router: `packages/api/src/procedures/dashboard/dashboard.router.ts` (30 lines)
- 6 specialized procedures (all <150 lines, M1-M4 compliant):
  - getKPIMetrics
  - getPLMetrics
  - getPLTimeline
  - getPromiseDates
  - getTimelineBudget
  - getFinancialControlMetrics
- Next.js API route at `/api/trpc/[trpc]/route.ts`
- Main dashboard page at `apps/web/app/page.tsx` (18,701 lines) - UNMIGRATED

**❌ What's Missing**:
- `get-main-metrics.procedure.ts` (from old Phase A)
- `get-recent-activity.procedure.ts` (from old Phase B)
- `get-category-breakdown.procedure.ts` (from old Phase C)
- `get-timeline-data.procedure.ts` (from old Phase C)
- Cell structure: `components/cells/main-dashboard-cell/`
- All tests and validation

**⚠️ Critical Data Issues in Current Implementation**:
- **Line 74**: Simulated category data (`budget * 0.85`) - FAKE DATA
- **Line 109**: Simulated timeline forecast (`budget * 1.05`) - FAKE DATA
- **Line 125**: Unmemoized Supabase client creation - PERFORMANCE ISSUE
- **Line 242**: Stale closure in useEffect - BUG

### Revision Strategy

This revised plan:
1. **Starts fresh with specialized procedures** following M1-M4 mandates
2. **Re-implements Phases A-D** (4 procedures as individual files)
3. **Continues with Phases E-H** (Cell structure, implementation, testing, integration)
4. **Uses Next.js API route** (no edge function deployment needed)
5. **Maintains phased approach** but with architectural checkpoints
6. **Includes architecture validation gates** at every step

---

## Executive Summary

**Component**: Main Dashboard Page (`apps/web/app/page.tsx`)  
**Lines of Code**: 18,701  
**Migration Score**: 95/100 (from discovery)  
**Risk Level**: MEDIUM (increased from LOW-MEDIUM due to re-implementation)  
**Confidence**: HIGH ✅ (architecture now battle-tested with 6 existing procedures)

### Migration Strategy: PHASED IMPLEMENTATION (Specialized Procedures)

**Rationale**:
- **4 tRPC procedures** (exceeds PHASED_THRESHOLD_QUERIES = 3)
- **Critical path component** (main landing page)
- **All procedures MUST be specialized** (one per file, ≤200 lines, M1-M4 compliance)
- **Architecture validation required** at every phase

**Phasing Approach (REVISED)**:
```
Phase A-NEW: Core Metrics Procedure (Specialized)
├─ Create get-main-metrics.procedure.ts (≤200 lines)
├─ 5 parallel queries with Promise.all()
├─ Update dashboard router to import
├─ Test via Next.js API route (no edge function)
└─ Git checkpoint after validation

Phase B-NEW: Recent Activity Procedure (Specialized)
├─ Create get-recent-activity.procedure.ts (≤200 lines)
├─ Quad join across 4 tables
├─ Extract helper to get-relative-time.helper.ts if needed
├─ Update dashboard router
├─ Test via API route
└─ Git checkpoint after validation

Phase C-NEW: Chart Data Procedures (Specialized, 2 files)
├─ Create get-category-breakdown.procedure.ts (≤200 lines)
├─ Create get-timeline-data.procedure.ts (≤200 lines)
├─ Both fix simulated data issues
├─ Update dashboard router
├─ Test both via API route
└─ Git checkpoint after validation

Phase D: Architecture Health Validation
├─ Verify all 10 procedures exist (6 old + 4 new)
├─ Verify all files ≤200 lines
├─ Verify dashboard router ≤50 lines
├─ Verify no M3 violations
└─ Run architecture compliance check
```

### Key Statistics

**Procedures to Create**: 4 new specialized procedures  
**Current Procedures**: 6 (already specialized)  
**Total After Migration**: 10 dashboard procedures

**Code Changes**:
- **New Files**: 8 total
  - 4 procedure files: `get-{main-metrics,recent-activity,category-breakdown,timeline-data}.procedure.ts`
  - 4 Cell files: `component.tsx`, `manifest.json`, `pipeline.yaml`, `__tests__/component.test.tsx`
- **Modified Files**: 2
  - `dashboard.router.ts` (add 4 imports)
  - `apps/web/app/page.tsx` (replace with Cell import)
- **Deleted Files**: 1
  - `apps/web/app/page.tsx` (original 18,701-line implementation)

**Quality Metrics**:
- **Behavioral Assertions**: 18 (minimum 3 required ✅)
- **Test Coverage**: ≥80% (18+ tests)
- **Validation Gates**: 6 (types, tests, build, performance, architecture, accessibility)
- **Manual Validation**: REQUIRED (critical path)

### Critical Fixes Included

1. 🔴 **P0-ARCHITECTURAL**: Re-implement all 4 procedures following M1-M4 mandates
2. 🔴 **P0-CRITICAL**: Replace simulated category data (line 74) with real queries
3. 🔴 **P0-CRITICAL**: Replace simulated timeline forecast (line 109) with budget_forecasts table
4. 🟡 **P1-HIGH**: Remove unmemoized Supabase client (line 125)
5. 🟡 **P1-MEDIUM**: Fix stale closure in useEffect (line 242)
6. 🟡 **P2-LOW**: Add proper unmount cleanup

---

## Migration Overview

### Component Profile

**Current Implementation**:
- **File**: `apps/web/app/page.tsx`
- **Type**: Client Component ('use client')
- **Line Count**: 18,701 lines
- **Complexity Score**: 7/10 (medium-high)
- **Data Access**: Direct Supabase queries (will be replaced with tRPC)

**Database Dependencies** (verified to exist):
- `po_line_items` - PO line item details
- `po_mappings` - PO to cost breakdown mappings
- `projects` - Project metadata
- `cost_breakdown` - Budget breakdown
- `pos` - Purchase order headers
- `budget_forecasts` - Forecast data

**UI Dependencies**:
- `@/components/app-shell` - Layout wrapper ✅
- `@/components/dashboard/smart-kpi-card` - KPI display ✅
- `@/components/ui/*` - shadcn components ✅
- `recharts` - Chart library ✅
- `lucide-react` - Icons ✅

**Integration Impact**:
- **Importers**: ZERO (page route, not imported)
- **Shared State**: NONE
- **Critical Path**: YES (main landing page)
- **Breaking Changes**: NONE (isolated migration)

### Target Cell Structure

**Cell Name**: `main-dashboard-cell`  
**Location**: `components/cells/main-dashboard-cell/`

```
components/cells/main-dashboard-cell/
├── component.tsx              # Main Cell component (~400-450 lines)
├── manifest.json             # 18 behavioral assertions
├── pipeline.yaml             # 6 validation gates
└── __tests__/
    └── component.test.tsx    # Test suite (18+ tests, 80%+ coverage)
```

**Note**: No `state.ts` needed - component uses local state only

---

## Data Layer Specifications (SPECIALIZED PROCEDURES)

### Architecture Requirements (M1-M4 Mandates)

**CRITICAL**: All procedures MUST follow API Procedure Specialization Architecture:

- **M1: One Procedure, One File** - Each procedure in its own `.procedure.ts` file
- **M2: Strict File Size Limit** - Each procedure file ≤200 lines
- **M3: No Parallel Implementations** - All procedures in `packages/api/src/procedures/`, NEVER in `supabase/functions/`
- **M4: Explicit Naming** - Files named `[action]-[entity].procedure.ts`

**Testing Method**: Next.js API route at `http://localhost:3000/api/trpc/dashboard.procedureName` (NO curl, NO edge function)

### Existing Schema Status

**✅ ALL Drizzle Schemas Exist** (verified):
- `packages/db/src/schema/po-line-items.ts`
- `packages/db/src/schema/po-mappings.ts`
- `packages/db/src/schema/projects.ts`
- `packages/db/src/schema/cost-breakdown.ts`
- `packages/db/src/schema/pos.ts`
- `packages/db/src/schema/budget-forecasts.ts`

**No schema migrations required** ✅


### Procedure 1 (PHASE A-NEW): `dashboard.getMainMetrics`

**Purpose**: Consolidate 5 queries for all KPI cards (unmapped POs, total PO value, active projects, budget variance)

**File**: `packages/api/src/procedures/dashboard/get-main-metrics.procedure.ts`  
**Max Lines**: 200 (M2 mandate)  
**Naming**: ✅ M4 compliant (get-main-metrics.procedure.ts)

**Input Schema**:
```typescript
z.object({})  // No filters - global dashboard metrics
```

**Output Schema**:
```typescript
z.object({
  unmappedPOs: z.number(),
  totalPOValue: z.number(),
  activeProjects: z.number(),
  budgetVariance: z.number(),  // Percentage (-100 to +100)
  totalBudget: z.number(),
  totalActual: z.number(),
})
```

**Complete Implementation**:
```typescript
// packages/api/src/procedures/dashboard/get-main-metrics.procedure.ts

import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { count, sum, eq, isNull } from 'drizzle-orm';
import { poLineItems, poMappings, projects, costBreakdown } from '@cost-mgmt/db';
import { TRPCError } from '@trpc/server';

/**
 * Get Main Dashboard Metrics
 * Returns KPI card metrics for the main dashboard
 * - Unmapped POs count
 * - Total PO value
 * - Active projects count
 * - Budget variance percentage
 * Used by: main-dashboard-cell (KPI cards section)
 */
export const getMainMetrics = publicProcedure
  .input(z.object({}))
  .output(z.object({
    unmappedPOs: z.number(),
    totalPOValue: z.number(),
    activeProjects: z.number(),
    budgetVariance: z.number(),
    totalBudget: z.number(),
    totalActual: z.number(),
  }))
  .query(async ({ ctx }) => {
    try {
      // Execute all 5 queries in parallel with Promise.all()
      const [unmappedResult, poValueResult, projectsResult, budgetResult, actualResult] = 
        await Promise.all([
          // Query 1: Unmapped POs (LEFT JOIN to find nulls)
          ctx.db
            .select({ count: count() })
            .from(poLineItems)
            .leftJoin(poMappings, eq(poLineItems.id, poMappings.poLineItemId))
            .where(isNull(poMappings.id)),
          
          // Query 2: Total PO value (SUM line_value)
          ctx.db
            .select({ total: sum(poLineItems.lineValue) })
            .from(poLineItems),
          
          // Query 3: Active projects count
          ctx.db
            .select({ count: count() })
            .from(projects),
          
          // Query 4: Total budget (SUM budget_cost)
          ctx.db
            .select({ total: sum(costBreakdown.budgetCost) })
            .from(costBreakdown),
          
          // Query 5: Total actual spend (SUM mapped_amount)
          ctx.db
            .select({ total: sum(poMappings.mappedAmount) })
            .from(poMappings),
        ]);
      
      // Extract values with null safety
      const unmappedPOs = unmappedResult[0]?.count || 0;
      const totalPOValue = Number(poValueResult[0]?.total || 0);
      const activeProjects = projectsResult[0]?.count || 0;
      const totalBudget = Number(budgetResult[0]?.total || 0);
      const totalActual = Number(actualResult[0]?.total || 0);
      
      // Calculate variance with division-by-zero protection
      const budgetVariance = totalBudget > 0 
        ? ((totalActual - totalBudget) / totalBudget) * 100 
        : 0;
      
      return {
        unmappedPOs,
        totalPOValue,
        activeProjects,
        budgetVariance,
        totalBudget,
        totalActual,
      };
    } catch (error) {
      console.error('[getMainMetrics] Failed:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch main metrics. Please try again.',
        cause: error,
      });
    }
  });

// File size estimate: ~95 lines ✅ (well under 200-line limit)
```

**Key Patterns**:
- ✅ Use `Promise.all()` for parallel execution (performance optimization)
- ✅ Use `count()`, `sum()` from drizzle-orm (NOT raw SQL)
- ✅ Use `leftJoin()` + `isNull()` to find unmapped records
- ✅ Handle null aggregations with `|| 0`
- ✅ Convert numeric strings with `Number()`
- ✅ Prevent division by zero with conditional
- ✅ Comprehensive error handling with TRPCError

**Testing** (Next.js API Route):
```bash
# Start dev server
pnpm dev

# Test in browser console:
const response = await fetch('/api/trpc/dashboard.getMainMetrics');
const data = await response.json();
console.log(data);

# Expected Response:
{
  "result": {
    "data": {
      "unmappedPOs": 0,
      "totalPOValue": 676241.18,
      "activeProjects": 2,
      "budgetVariance": -64.41,
      "totalBudget": 1900000,
      "totalActual": 676241.18
    }
  }
}
```

---

### Procedure 2 (PHASE B-NEW): `dashboard.getRecentActivity`

**Purpose**: Recent PO mappings with full relationship details (quad join)

**File**: `packages/api/src/procedures/dashboard/get-recent-activity.procedure.ts`  
**Max Lines**: 200 (M2 mandate)  
**Naming**: ✅ M4 compliant (get-recent-activity.procedure.ts)

**Helper Function** (if needed):
**File**: `packages/api/src/procedures/dashboard/helpers/get-relative-time.helper.ts`

**Input Schema**:
```typescript
z.object({
  limit: z.number().min(1).max(50).default(5),
})
```

**Output Schema**:
```typescript
z.object({
  activities: z.array(z.object({
    id: z.string().uuid(),
    type: z.literal('po_mapped'),
    description: z.string(),
    time: z.string(),  // "5 mins ago"
    timestamp: z.string(),  // ISO string
    poNumber: z.string(),
    projectName: z.string(),
    mappedAmount: z.number(),
  })),
})
```

**Complete Implementation**:
```typescript
// packages/api/src/procedures/dashboard/get-recent-activity.procedure.ts

import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { eq, desc } from 'drizzle-orm';
import { poMappings, poLineItems, pos, costBreakdown, projects } from '@cost-mgmt/db';
import { TRPCError } from '@trpc/server';
import { getRelativeTime } from './helpers/get-relative-time.helper';

/**
 * Get Recent PO Mapping Activity
 * Returns recent PO mappings with full relationship details
 * - Quad join: poMappings → poLineItems → pos, poMappings → costBreakdown → projects
 * - Relative time formatting ("5 mins ago")
 * Used by: main-dashboard-cell (recent activity section)
 */
export const getRecentActivity = publicProcedure
  .input(z.object({ 
    limit: z.number().min(1).max(50).default(5) 
  }))
  .output(z.object({
    activities: z.array(z.object({
      id: z.string().uuid(),
      type: z.literal('po_mapped'),
      description: z.string(),
      time: z.string(),
      timestamp: z.string(),
      poNumber: z.string(),
      projectName: z.string(),
      mappedAmount: z.number(),
    })),
  }))
  .query(async ({ input, ctx }) => {
    try {
      const result = await ctx.db
        .select({
          id: poMappings.id,
          poNumber: pos.poNumber,
          projectName: projects.name,
          mappedAmount: poMappings.mappedAmount,
          createdAt: poMappings.createdAt,
          mappedAt: poMappings.mappedAt,
        })
        .from(poMappings)
        .innerJoin(poLineItems, eq(poMappings.poLineItemId, poLineItems.id))
        .innerJoin(pos, eq(poLineItems.poId, pos.id))
        .innerJoin(costBreakdown, eq(poMappings.costBreakdownId, costBreakdown.id))
        .innerJoin(projects, eq(costBreakdown.projectId, projects.id))
        .orderBy(desc(poMappings.createdAt))
        .limit(input.limit);
      
      const activities = result.map(row => {
        const timestamp = new Date(row.createdAt || row.mappedAt || new Date());
        return {
          id: row.id,
          type: 'po_mapped' as const,
          description: `PO ${row.poNumber} mapped to ${row.projectName}`,
          time: getRelativeTime(timestamp),
          timestamp: timestamp.toISOString(),
          poNumber: row.poNumber,
          projectName: row.projectName,
          mappedAmount: Number(row.mappedAmount || 0),
        };
      });
      
      return { activities };
    } catch (error) {
      console.error('[getRecentActivity] Failed:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch recent activity. Please try again.',
        cause: error,
      });
    }
  });

// File size estimate: ~75 lines ✅ (well under 200-line limit)
```

**Helper Function** (create if doesn't exist):
```typescript
// packages/api/src/procedures/dashboard/helpers/get-relative-time.helper.ts

/**
 * Format timestamp as relative time ("5 mins ago", "2 hours ago")
 */
export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// File size: ~20 lines ✅
```

**Key Patterns**:
- ✅ Use `innerJoin()` for required relationships (4 tables)
- ✅ Chain joins properly: poMappings → poLineItems → pos, poMappings → costBreakdown → projects
- ✅ Use `desc()` for ORDER BY DESC
- ✅ Handle nullable timestamps with `||` fallback
- ✅ Extract helper function to separate file for reusability
- ✅ Comprehensive error handling

**Testing**:
```javascript
// Browser console:
const response = await fetch('/api/trpc/dashboard.getRecentActivity?input={"limit":5}');
const data = await response.json();
console.log(data);

// Expected: Array of 5 activities with relative time
```

---

