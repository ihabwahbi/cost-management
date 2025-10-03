# API Architecture Compliance Refactoring Plan

**Date:** 2025-10-03T13:36:00+08:00  
**Architect:** MigrationArchitect  
**Status:** ready_for_implementation  
**Phase:** 3 (Migration Planning)  
**Workflow Phase:** Phase 3: Surgical Refactoring Planning

## Based On

**Discovery Report:** N/A (Pre-existing architecture analysis)  
**Analysis Report:** `thoughts/shared/analysis/2025-10-03_13-29_api-architecture-compliance_analysis.md`  
**Architecture Document:** `docs/2025-10-03_api_procedure_specialization_architecture.md`

## Refactoring Metadata

```yaml
target_architecture: "API Procedure Specialization (M1-M4 Compliance)"
current_state: "Monolithic routers (100% non-compliant)"
complexity: "complex"
strategy: "5-Phase incremental refactoring"
estimated_duration: "13-19 hours"
procedures_to_refactor: 17
  dashboard_domain: 8 procedures (6 active, 2 unused)
  po_mapping_domain: 9 procedures (8 active, 1 unused)
helpers_to_extract: 3
parallel_implementations_to_delete: 1
cells_impacted: 8 (must remain functional)
critical: true
blocking_issue: "YES - Blocks future Cell migrations"
```

---

## Executive Summary

### Critical Architecture Emergency

The current tRPC API implementation **VIOLATES ALL FOUR MANDATES** (M1-M4) of the API Procedure Specialization Architecture, creating a critical blocker for continued Cell migrations:

- 🔴 **M1 VIOLATION**: No specialized procedure files exist (100% monolithic)
- 🔴 **M2 VIOLATION**: Files exceed size limits by 81-527%  
  - `dashboard.ts`: 889 lines (344% over 200-line limit)
  - `po-mapping.ts`: 363 lines (81% over limit)
  - `supabase/functions/trpc/index.ts`: 1,255 lines (527% over limit)
- 🔴 **M3 VIOLATION**: Parallel implementation exists (1,255 lines)
- 🔴 **M4 VIOLATION**: Generic naming conventions used

### Refactoring Strategy: 5-Phase Incremental Approach

**CRITICAL**: All Cell migrations MUST STOP until architecture compliance achieved.

**Phase A**: Delete Parallel Implementation (30 min)  
**Phase B**: Foundation Setup - Directory Structure + Helper Extraction (1-2 hours)  
**Phase C**: Dashboard Procedure Specialization (6-8 hours)  
**Phase D**: PO Mapping Procedure Specialization (4-6 hours)  
**Phase E**: Final Cleanup + Documentation (2-3 hours)

**Total Effort**: 13-19 hours  
**Risk Level**: Medium (comprehensive testing required)  
**Success Metric**: 100% M1-M4 compliance with all 8 cells functioning

---

## Refactoring Overview

### Current State: Monolithic Architecture

```
packages/api/src/
├── routers/
│   ├── dashboard.ts         🔴 889 lines (8 procedures + 3 helpers)
│   ├── po-mapping.ts        🔴 363 lines (9 procedures)
│   └── test.ts              🟡 57 lines (unknown procedures)
├── index.ts                 ✅ Main app router
└── trpc.ts                  ✅ Core tRPC setup

supabase/functions/trpc/
└── index.ts                 🔴🔴🔴 1,255 lines (PARALLEL IMPLEMENTATION - DELETE)
```

### Target State: Specialized Procedure Architecture

```
packages/api/src/
├── procedures/
│   ├── dashboard/
│   │   ├── helpers/
│   │   │   ├── get-relative-time.helper.ts          (31 lines)
│   │   │   ├── split-mapped-amount.helper.ts        (54 lines)
│   │   │   ├── generate-pl-timeline.helper.ts       (100+ lines)
│   │   │   └── constants.ts                         (constants)
│   │   ├── get-kpi-metrics.procedure.ts             ≤200 lines ✅
│   │   ├── get-pl-metrics.procedure.ts              ≤200 lines ✅
│   │   ├── get-pl-timeline.procedure.ts             ≤200 lines ✅
│   │   ├── get-promise-dates.procedure.ts           ≤200 lines ✅
│   │   ├── get-timeline-budget.procedure.ts         ≤200 lines ✅
│   │   ├── get-financial-control-metrics.procedure.ts ≤200 lines ✅
│   │   ├── get-main-metrics.procedure.ts            ≤200 lines (unused)
│   │   ├── get-recent-activity.procedure.ts         ≤200 lines (unused)
│   │   └── dashboard.router.ts                      ≤50 lines ✅
│   │
│   └── po-mapping/
│       ├── get-projects.procedure.ts                ≤200 lines ✅
│       ├── get-spend-types.procedure.ts             ≤200 lines ✅
│       ├── get-spend-sub-categories.procedure.ts    ≤200 lines ✅
│       ├── find-matching-cost-breakdown.procedure.ts ≤200 lines ✅
│       ├── get-existing-mappings.procedure.ts       ≤200 lines ✅
│       ├── create-mapping.procedure.ts              ≤200 lines ✅
│       ├── update-mapping.procedure.ts              ≤200 lines ✅
│       ├── clear-mappings.procedure.ts              ≤200 lines ✅
│       ├── get-cost-breakdown-by-id.procedure.ts    ≤200 lines (unused)
│       └── po-mapping.router.ts                     ≤50 lines ✅
├── index.ts                 (updated with new router imports)
└── trpc.ts                  (unchanged)
```

### Cells Impacted (Must Remain Functional)

| Cell | Procedures Used | Usage Count | Risk |
|------|----------------|-------------|------|
| **kpi-card** | dashboard.getKPIMetrics | 16 | Medium |
| **pl-command-center** | dashboard.getPLMetrics, getPLTimeline, getPromiseDates | 48 | High |
| **budget-timeline-chart** | dashboard.getTimelineBudget | 9 | Medium |
| **financial-control-matrix** | dashboard.getFinancialControlMetrics | 22 | High |
| **details-panel-selector** | poMapping.getProjects, getSpendTypes, getSpendSubCategories, findMatchingCostBreakdown | 4 | Medium |
| **details-panel-viewer** | poMapping.getExistingMappings | 1 | Low |
| **details-panel-mapper** | poMapping.createMapping, updateMapping, clearMappings | 3 | Medium |
| **details-panel** | (parent of above 3) | N/A | Medium |

**Total**: 8 cells, 14 procedures actively used, 103 procedure calls

---

## PHASE A: Emergency Cleanup - Delete Parallel Implementation

**Duration:** 30 minutes  
**Priority:** 🔴🔴🔴 CRITICAL  
**Risk:** Low (if cells already use packages/api implementation)  
**Blocking:** All subsequent phases

### A.1 Verify Current Implementation Usage

**BEFORE deleting anything**, verify which implementation cells are actually using:

```bash
# Check tRPC client configuration
grep -r "NEXT_PUBLIC_TRPC_URL" apps/web/.env* apps/web/lib/trpc.ts

# Expected: Should point to packages/api, NOT supabase/functions/trpc
```

**Expected Result**:
```typescript
// apps/web/lib/trpc.ts should import from packages/api
import { appRouter } from '@cost-mgmt/api'
```

**If cells are using supabase/functions/trpc**:  
⚠️ **DO NOT proceed with Phase A** - cells must be migrated to packages/api first

### A.2 Delete Parallel Implementation

```bash
# Delete the 1,255-line monolith
rm supabase/functions/trpc/index.ts

# Optionally delete entire directory if no other files
rm -rf supabase/functions/trpc/

# Commit immediately
git add supabase/functions/trpc/
git commit -m "Phase A: Delete parallel tRPC implementation (M3 compliance)

- Remove supabase/functions/trpc/index.ts (1,255 lines)
- Enforce single source of truth: packages/api
- Resolves M3 violation (No Parallel Implementations)

Impact: None (cells already use packages/api implementation)
"
```

### A.3 Validation

```bash
# Verify parallel implementation deleted
[ ! -f supabase/functions/trpc/index.ts ] && echo "✅ M3 Compliant" || echo "🔴 FAILED"

# Test all cells in browser
# Open: http://localhost:3000/projects/[project-id]
# Verify all 8 cells load without errors

# Check Network tab
# - All tRPC requests should return 200 OK
# - No 404 errors

# Check Console tab
# - No errors related to tRPC
```

### A.4 Rollback (If Needed)

**If any cell breaks:**

```bash
# Restore parallel implementation
git revert HEAD

# Investigate why cells are using supabase/functions/trpc
# Fix cell imports to use packages/api
# Retry Phase A
```

---

## PHASE B: Foundation Setup - Directory Structure + Helper Extraction

**Duration:** 1-2 hours  
**Priority:** 🔴 HIGH  
**Complexity:** Medium  
**Dependencies:** Phase A must complete successfully

### B.1 Create Directory Structure

```bash
# Create procedures directories
mkdir -p packages/api/src/procedures/dashboard/helpers
mkdir -p packages/api/src/procedures/po-mapping

# Verify creation
ls -la packages/api/src/procedures/
# Expected:
# dashboard/
# po-mapping/
```

### B.2 Extract Dashboard Helper Functions

**Helper 1: `get-relative-time.helper.ts`** (31 lines)

```typescript
// packages/api/src/procedures/dashboard/helpers/get-relative-time.helper.ts

/**
 * Helper: Format date as relative time string
 * Used by: getRecentActivity procedure
 */
export function getRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
  
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
```

**Helper 2: `split-mapped-amount.helper.ts`** (54 lines)

```typescript
// packages/api/src/procedures/dashboard/helpers/split-mapped-amount.helper.ts

import { FALLBACK_INVOICE_RATIO } from './constants';

/**
 * Helper: Calculate actual vs future P&L from line item
 * Used by: getPLMetrics, getPLTimeline, getPromiseDates, getFinancialControlMetrics
 * 
 * Splits mapped amount into:
 * - actual: Amount already invoiced (P&L impact realized)
 * - future: Amount not yet invoiced (P&L impact pending)
 */
export function splitMappedAmount(
  mappedAmount: number, 
  lineItem: { lineValue: any; invoicedValueUsd: any }
): { actual: number; future: number } {
  const lineValue = Number(lineItem.lineValue || 0);
  const invoiceValue = Number(lineItem.invoicedValueUsd || 0);
  const hasInvoiceField = lineItem.invoicedValueUsd !== null;
  
  const safeLineValue = lineValue > 0 ? lineValue : mappedAmount;
  const ratio = safeLineValue > 0 ? Math.min(mappedAmount / safeLineValue, 1) : 1;
  
  if (hasInvoiceField) {
    const actual = invoiceValue * ratio;
    const future = Math.max(mappedAmount - actual, 0);
    return { actual, future };
  }
  
  // Fallback when invoice data unavailable
  const inferredActual = mappedAmount * FALLBACK_INVOICE_RATIO;
  return {
    actual: inferredActual,
    future: Math.max(mappedAmount - inferredActual, 0)
  };
}
```

**Helper 3: `generate-pl-timeline.helper.ts`** (100+ lines)

```typescript
// packages/api/src/procedures/dashboard/helpers/generate-pl-timeline.helper.ts

/**
 * Helper: Generate P&L timeline with actual invoices and future promises
 * Used by: getTimelineBudget procedure
 * 
 * Budget as fixed reference line, actual as cumulative invoiced, forecast as future promises
 */
export function generatePLTimeline(
  totalBudget: number,
  invoiceData: Array<{ month: Date; invoiced: string | null }>,
  promiseData: Array<{ month: Date; future: string | null }>
): Array<{
  month: string;
  budget: number;
  actual: number;
  forecast: number;
}> {
  // Build month map for invoices
  const invoiceMap = new Map<string, number>();
  invoiceData.forEach((row) => {
    const key = new Date(row.month).toISOString().slice(0, 7); // YYYY-MM
    invoiceMap.set(key, Number(row.invoiced || 0));
  });

  // Build month map for promises
  const promiseMap = new Map<string, number>();
  promiseData.forEach((row) => {
    const key = new Date(row.month).toISOString().slice(0, 7); // YYYY-MM
    promiseMap.set(key, Number(row.future || 0));
  });

  // Determine date range
  const allDates = [...invoiceData.map(d => new Date(d.month)), ...promiseData.map(d => new Date(d.month))];
  if (allDates.length === 0) {
    return [];
  }

  const startDate = new Date(Math.min(...allDates.map(d => d.getTime())));
  const endDate = new Date(Math.max(...allDates.map(d => d.getTime())));
  
  // Extend end date to include at least 3 months into future for visibility
  const minEndDate = new Date();
  minEndDate.setMonth(minEndDate.getMonth() + 3);
  if (endDate < minEndDate) {
    endDate.setMonth(minEndDate.getMonth());
  }

  // Generate timeline
  const timeline: Array<{ month: string; budget: number; actual: number; forecast: number }> = [];
  const current = new Date(startDate);
  current.setDate(1); // Normalize to first of month
  
  let cumulativeActual = 0;

  while (current <= endDate) {
    const monthKey = current.toISOString().slice(0, 7); // YYYY-MM
    const monthLabel = current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    
    // Add monthly invoice to cumulative
    const monthlyInvoice = invoiceMap.get(monthKey) || 0;
    cumulativeActual += monthlyInvoice;
    
    // Get forecast for this month (not cumulative - just this month's promise)
    const monthlyForecast = promiseMap.get(monthKey) || 0;

    timeline.push({
      month: monthLabel,
      budget: totalBudget, // Fixed budget reference
      actual: Math.round(cumulativeActual),
      forecast: Math.round(monthlyForecast)
    });

    current.setMonth(current.getMonth() + 1);
  }

  return timeline;
}
```

**Constants: `constants.ts`**

```typescript
// packages/api/src/procedures/dashboard/helpers/constants.ts

/**
 * Fallback invoice ratio when actual invoice data unavailable
 * Assumes 60% of line value has been invoiced (conservative estimate)
 */
export const FALLBACK_INVOICE_RATIO = 0.6;
```

### B.3 Update Monolithic Routers (Temporary)

**Update `dashboard.ts` to import helpers:**

```typescript
// packages/api/src/routers/dashboard.ts

// ADD: Import helpers instead of defining locally
import { getRelativeTime } from '../procedures/dashboard/helpers/get-relative-time.helper';
import { splitMappedAmount } from '../procedures/dashboard/helpers/split-mapped-amount.helper';
import { generatePLTimeline } from '../procedures/dashboard/helpers/generate-pl-timeline.helper';
import { FALLBACK_INVOICE_RATIO } from '../procedures/dashboard/helpers/constants';

// REMOVE: All helper function definitions (lines 13-127)
// Keep only router export and procedures

export const dashboardRouter = router({
  // All procedures remain unchanged, now using imported helpers
  ...
});
```

**Why this step?**  
- Allows testing helpers independently before procedure refactoring
- Reduces dashboard.ts file size immediately (889 → ~750 lines)
- Enables helpers to be reused across procedures in Phase C

### B.4 Validation

```bash
# Build packages
cd packages/api
pnpm build

# Should compile without errors
# TypeScript should resolve helper imports correctly

# Test in browser
# All 8 cells should continue working (helpers have same logic, just moved)

# Verify file sizes
wc -l packages/api/src/routers/dashboard.ts
# Should be ~750 lines (reduced from 889)

# Verify helpers created
ls packages/api/src/procedures/dashboard/helpers/
# Should show:
# - get-relative-time.helper.ts
# - split-mapped-amount.helper.ts
# - generate-pl-timeline.helper.ts
# - constants.ts
```

### B.5 Commit

```bash
git add packages/api/src/procedures/
git add packages/api/src/routers/dashboard.ts
git commit -m "Phase B: Extract dashboard helpers to dedicated files

- Create procedures/dashboard/helpers/ directory
- Extract getRelativeTime() → get-relative-time.helper.ts (31 lines)
- Extract splitMappedAmount() → split-mapped-amount.helper.ts (54 lines)
- Extract generatePLTimeline() → generate-pl-timeline.helper.ts (100+ lines)
- Extract FALLBACK_INVOICE_RATIO → constants.ts

Benefits:
- Reduces dashboard.ts from 889 to ~750 lines
- Enables helper reuse across procedures (Phase C)
- Improves code discoverability

Impact: None (logic unchanged, just reorganized)
Validation: All 8 cells continue functioning
"
```

---

## PHASE C: Dashboard Procedure Specialization

**Duration:** 6-8 hours  
**Priority:** 🔴 HIGH  
**Complexity:** High  
**Dependencies:** Phase B must complete successfully  
**Strategy:** ONE procedure at a time with validation + commit after each

### Procedure Refactoring Order (Priority-Based)

**Priority 1 (Active - used by cells):**
1. `getKPIMetrics` → `get-kpi-metrics.procedure.ts` (16 uses by kpi-card)
2. `getPLMetrics` → `get-pl-metrics.procedure.ts` (16 uses by pl-command-center)
3. `getPLTimeline` → `get-pl-timeline.procedure.ts` (16 uses by pl-command-center)
4. `getPromiseDates` → `get-promise-dates.procedure.ts` (16 uses by pl-command-center)
5. `getTimelineBudget` → `get-timeline-budget.procedure.ts` (9 uses by budget-timeline-chart)
6. `getFinancialControlMetrics` → `get-financial-control-metrics.procedure.ts` (22 uses by financial-control-matrix)

**Priority 2 (Unused - can defer):**
7. `getMainMetrics` → `get-main-metrics.procedure.ts` (0 uses)
8. `getRecentActivity` → `get-recent-activity.procedure.ts` (0 uses)

### C.1 Procedure Template (Apply to Each)

**For EACH procedure, follow this pattern:**

**Step 1: Create procedure file**

```typescript
// packages/api/src/procedures/dashboard/get-kpi-metrics.procedure.ts

import { z } from 'zod';
import { router, publicProcedure } from '../../trpc';
import { eq, sum, sql, and } from 'drizzle-orm';
import { costBreakdown, poMappings, budgetForecasts, forecastVersions } from '@cost-mgmt/db';
import { TRPCError } from '@trpc/server';

/**
 * Get KPI Metrics for a project
 * Returns budget total, committed amount, and variance
 * Used by: kpi-card Cell
 */
export const getKPIMetricsRouter = router({
  getKPIMetrics: publicProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
      })
    )
    .query(async ({ input, ctx }) => {
      // COPY procedure logic from routers/dashboard.ts lines 277-337
      // Keep exact same logic - NO changes to business rules
      try {
        // Get latest forecast version
        const maxVersionResult = await ctx.db
          .select({ maxVersion: sql<number>`MAX(${forecastVersions.versionNumber})` })
          .from(forecastVersions)
          .where(eq(forecastVersions.projectId, input.projectId));

        const latestVersion = maxVersionResult[0]?.maxVersion ?? 0;

        // Calculate total budget from latest forecast version
        const budgetResult = await ctx.db
          .select({ total: sum(budgetForecasts.forecastedCost) })
          .from(budgetForecasts)
          .innerJoin(forecastVersions, eq(budgetForecasts.forecastVersionId, forecastVersions.id))
          .innerJoin(costBreakdown, eq(budgetForecasts.costBreakdownId, costBreakdown.id))
          .where(and(
            eq(costBreakdown.projectId, input.projectId),
            eq(forecastVersions.versionNumber, latestVersion)
          ));

        const budgetTotal = Number(budgetResult[0]?.total || 0);

        // Calculate committed amount from PO mappings
        const committedResult = await ctx.db
          .select({ total: sum(poMappings.mappedAmount) })
          .from(poMappings)
          .innerJoin(costBreakdown, eq(poMappings.costBreakdownId, costBreakdown.id))
          .where(eq(costBreakdown.projectId, input.projectId));

        const committed = Number(committedResult[0]?.total || 0);

        // Calculate variance
        const variance = budgetTotal - committed;
        const variancePercent = budgetTotal > 0 ? (variance / budgetTotal) * 100 : 0;

        return {
          budgetTotal,
          committed,
          variance,
          variancePercent,
        };
      } catch (error) {
        console.error('Failed to fetch KPI metrics:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch KPI metrics. Please try again.',
          cause: error,
        });
      }
    }),
});

// File size: ~80 lines ✅ (well under 200-line limit)
```

**Step 2: Verify M1-M4 compliance**

```bash
# M1: One procedure per file
grep -c "publicProcedure" packages/api/src/procedures/dashboard/get-kpi-metrics.procedure.ts
# Output should be: 1 ✅

# M2: File size ≤200 lines
wc -l packages/api/src/procedures/dashboard/get-kpi-metrics.procedure.ts
# Output should be ≤200 ✅

# M4: Explicit naming (get-[entity] pattern)
# File name: get-kpi-metrics.procedure.ts ✅
```

**Step 3: Add to temporary "mixed" dashboard router**

During refactoring, dashboard.router.ts will temporarily import from BOTH:
- Old monolithic `routers/dashboard.ts` (for not-yet-refactored procedures)
- New specialized procedures (for refactored ones)

```typescript
// packages/api/src/routers/dashboard.ts (temporary during Phase C)

import { router } from '../trpc';
// Import newly specialized procedures
import { getKPIMetricsRouter } from '../procedures/dashboard/get-kpi-metrics.procedure';
// ... other refactored procedures as we go

// Keep old procedures still defined here (to be removed incrementally)
const getMainMetrics = publicProcedure...
const getRecentActivity = publicProcedure...
// etc (procedures not yet refactored)

export const dashboardRouter = router({
  // New specialized procedures
  ...getKPIMetricsRouter,
  
  // Old procedures (still in this file)
  getMainMetrics,
  getRecentActivity,
  getPLMetrics,
  getPLTimeline,
  getPromiseDates,
  getTimelineBudget,
  getFinancialControlMetrics,
});
```

**Why mixed router?**  
Allows incremental refactoring. Each procedure can be moved one at a time with validation, rather than big-bang refactor.

**Step 4: Test procedure via curl**

```bash
# Deploy updated API
cd packages/api
pnpm build

# Test procedure (replace [PROJECT_ID] with real UUID)
curl -X POST "http://localhost:3000/api/trpc/dashboard.getKPIMetrics?batch=1" \
  -H "Content-Type: application/json" \
  -d '{
    "0": {
      "json": {
        "projectId": "94d1eaad-4ada-4fb6-b872-212b6cd6007a"
      }
    }
  }'

# Expected: 200 OK with budget, committed, variance data
# Example response:
# {
#   "0": {
#     "result": {
#       "data": {
#         "json": {
#           "budgetTotal": 1750000,
#           "committed": 1200000,
#           "variance": 550000,
#           "variancePercent": 31.43
#         }
#       }
#     }
#   }
# }
```

**Step 5: Test in browser (kpi-card Cell)**

```bash
# Open browser: http://localhost:3000/projects/[project-id]
# Locate kpi-card Cell
# Verify:
# - Cell loads without errors
# - Data displays correctly
# - Values match old implementation
# - Network tab shows 200 OK for dashboard.getKPIMetrics
# - Console has no errors
```

**Step 6: Remove procedure from monolithic router**

```typescript
// packages/api/src/routers/dashboard.ts

// DELETE the getKPIMetrics procedure definition (lines 277-337)
// Keep import of getKPIMetricsRouter at top

export const dashboardRouter = router({
  ...getKPIMetricsRouter,  // ✅ Now from specialized file
  
  // Remaining old procedures (to be refactored next)
  getMainMetrics,
  getRecentActivity,
  getPLMetrics,
  getPLTimeline,
  getPromiseDates,
  getTimelineBudget,
  getFinancialControlMetrics,
});
```

**Step 7: Commit**

```bash
git add packages/api/src/procedures/dashboard/get-kpi-metrics.procedure.ts
git add packages/api/src/routers/dashboard.ts
git commit -m "Phase C.1: Specialize getKPIMetrics procedure (M1-M4 compliant)

- Create get-kpi-metrics.procedure.ts (80 lines, ≤200 ✅)
- Export getKPIMetricsRouter for domain composition
- Remove from monolithic dashboard.ts
- Test via curl: ✅ Returns correct budget/committed/variance
- Test in browser: ✅ kpi-card Cell displays correctly

M1: ✅ One procedure per file (grep count = 1)
M2: ✅ File size 80 lines (≤200)
M4: ✅ Explicit naming (get-kpi-metrics pattern)

Impact: None (logic unchanged, architecture improved)
Cells tested: kpi-card (16 uses) - ALL PASSING
"
```

**Step 8: Repeat for remaining procedures**

Apply Steps 1-7 for each procedure:
- `getPLMetrics` (2-3 hours including testing)
- `getPLTimeline` (2-3 hours - has date handling fix needed)
- `getPromiseDates` (1-2 hours)
- `getTimelineBudget` (2 hours)
- `getFinancialControlMetrics` (2-3 hours - complex logic)

### C.2 Special Case: Fix Date Handling in getPLTimeline

**CRITICAL**: getPLTimeline currently uses `z.date()` which violates serialization rules.

```typescript
// ❌ WRONG (current implementation)
.input(
  z.object({
    projectId: z.string().uuid(),
    dateRange: z.object({
      from: z.date(),  // Will fail HTTP serialization
      to: z.date(),
    }),
  })
)

// ✅ CORRECT (fix during refactoring)
.input(
  z.object({
    projectId: z.string().uuid(),
    dateRange: z.object({
      from: z.string().transform(val => new Date(val)),  // Accept string, transform to Date
      to: z.string().transform(val => new Date(val)),
    }),
  })
)
```

**When refactoring getPLTimeline**:
1. Fix input schema to use `z.string().transform()`
2. Test with curl using ISO date strings
3. Verify pl-command-center Cell still works
4. Document fix in commit message

### C.3 Create Final Dashboard Domain Router

**After all 6 active procedures refactored**, create domain router:

```typescript
// packages/api/src/procedures/dashboard/dashboard.router.ts

import { router } from '../../trpc';

// Import all specialized procedure routers
import { getKPIMetricsRouter } from './get-kpi-metrics.procedure';
import { getPLMetricsRouter } from './get-pl-metrics.procedure';
import { getPLTimelineRouter } from './get-pl-timeline.procedure';
import { getPromiseDatesRouter } from './get-promise-dates.procedure';
import { getTimelineBudgetRouter } from './get-timeline-budget.procedure';
import { getFinancialControlMetricsRouter } from './get-financial-control-metrics.procedure';

// Unused procedures (optional - can defer to Phase E)
// import { getMainMetricsRouter } from './get-main-metrics.procedure';
// import { getRecentActivityRouter } from './get-recent-activity.procedure';

/**
 * Dashboard Domain Router
 * Aggregates all dashboard procedures
 * 
 * CRITICAL: This file should contain ONLY imports and router composition
 * NO business logic allowed (M4 mandate)
 */
export const dashboardRouter = router({
  ...getKPIMetricsRouter,
  ...getPLMetricsRouter,
  ...getPLTimelineRouter,
  ...getPromiseDatesRouter,
  ...getTimelineBudgetRouter,
  ...getFinancialControlMetricsRouter,
  // Uncomment when unused procedures refactored:
  // ...getMainMetricsRouter,
  // ...getRecentActivityRouter,
});

// File size: ~30 lines ✅ (well under 50-line limit)
```

**Verify router compliance:**

```bash
# Domain router size ≤50 lines
wc -l packages/api/src/procedures/dashboard/dashboard.router.ts
# Should be ~30 lines ✅

# No business logic in router
grep -E "(publicProcedure|\.query|\.mutation|const.*=)" packages/api/src/procedures/dashboard/dashboard.router.ts
# Should only find imports and router composition ✅
```

### C.4 Update Main App Router

```typescript
// packages/api/src/index.ts

import { router } from './trpc';
// REPLACE old dashboard import
// import { dashboardRouter } from './routers/dashboard';  ❌ DELETE

// ADD new specialized dashboard import
import { dashboardRouter } from './procedures/dashboard/dashboard.router';  // ✅

import { poMappingRouter } from './routers/po-mapping';  // Still monolithic (Phase D will fix)
import { testRouter } from './routers/test';

export const appRouter = router({
  dashboard: dashboardRouter,  // ✅ Now uses specialized procedures
  poMapping: poMappingRouter,
  test: testRouter,
});

export type AppRouter = typeof appRouter;
```

### C.5 Delete Monolithic Dashboard Router

```bash
# After all procedures specialized and tests passing
rm packages/api/src/routers/dashboard.ts

# Commit
git add packages/api/src/
git commit -m "Phase C.FINAL: Delete monolithic dashboard.ts router

- All 6 active procedures now specialized in procedures/dashboard/
- Domain router created (dashboard.router.ts, 30 lines ≤50 ✅)
- Main app router updated to use specialized procedures
- Old monolithic dashboard.ts (889 lines) DELETED

Architecture Compliance:
M1: ✅ 6 procedures, 6 files (one per file)
M2: ✅ All procedure files ≤200 lines
M3: ✅ No parallel implementations
M4: ✅ Explicit naming (get-[entity].procedure.ts pattern)

Cells Validated:
✅ kpi-card (getKPIMetrics)
✅ pl-command-center (getPLMetrics, getPLTimeline, getPromiseDates)
✅ budget-timeline-chart (getTimelineBudget)
✅ financial-control-matrix (getFinancialControlMetrics)

All 5 cells tested and working correctly.
"
```

### C.6 Phase C Validation Checklist

Before proceeding to Phase D:

- [ ] All 6 active dashboard procedures in specialized files
- [ ] Each procedure file ≤200 lines (M2)
- [ ] Each procedure file has exactly 1 publicProcedure (M1)
- [ ] dashboard.router.ts created and ≤50 lines
- [ ] dashboard.router.ts contains ONLY imports + composition (no logic)
- [ ] All 5 dashboard cells tested and working
- [ ] TypeScript compiles with zero errors
- [ ] curl tests pass for all 6 procedures
- [ ] Old dashboard.ts deleted
- [ ] Commits created for each procedure (6+ commits)

---

## PHASE D: PO Mapping Procedure Specialization

**Duration:** 4-6 hours  
**Priority:** 🔴 HIGH  
**Complexity:** Medium  
**Dependencies:** Phase C complete (or can run in parallel if confident)

### Procedure Refactoring Order (Priority-Based)

**Priority 1 (Active - used by cells):**
1. `getProjects` → `get-projects.procedure.ts` (details-panel-selector)
2. `getSpendTypes` → `get-spend-types.procedure.ts` (details-panel-selector)
3. `getSpendSubCategories` → `get-spend-sub-categories.procedure.ts` (details-panel-selector)
4. `findMatchingCostBreakdown` → `find-matching-cost-breakdown.procedure.ts` (details-panel-selector)
5. `getExistingMappings` → `get-existing-mappings.procedure.ts` (details-panel-viewer)
6. `createMapping` → `create-mapping.procedure.ts` (details-panel-mapper)
7. `updateMapping` → `update-mapping.procedure.ts` (details-panel-mapper)
8. `clearMappings` → `clear-mappings.procedure.ts` (details-panel-mapper)

**Priority 2 (Unused):**
9. `getCostBreakdownById` → `get-cost-breakdown-by-id.procedure.ts` (0 uses)

### D.1 Procedure Template (Same as Phase C)

**Apply same 8-step process for each procedure:**
1. Create procedure file in `procedures/po-mapping/[action]-[entity].procedure.ts`
2. Verify M1-M4 compliance
3. Add to temporary mixed router
4. Test via curl
5. Test in browser (cells: details-panel-selector, details-panel-viewer, details-panel-mapper)
6. Remove from monolithic router
7. Commit
8. Repeat

### D.2 Example: getProjects Specialization

```typescript
// packages/api/src/procedures/po-mapping/get-projects.procedure.ts

import { z } from 'zod';
import { router, publicProcedure } from '../../trpc';
import { projects } from '@cost-mgmt/db';
import { TRPCError } from '@trpc/server';

/**
 * Get all projects for dropdown
 * Returns: Array of projects with id, name, subBusinessLine
 * Used by: details-panel-selector Cell
 */
export const getProjectsRouter = router({
  getProjects: publicProcedure
    .input(z.void())
    .output(z.array(z.object({
      id: z.string().uuid(),
      name: z.string(),
      subBusinessLine: z.string()
    })))
    .query(async ({ ctx }) => {
      try {
        const result = await ctx.db
          .select({
            id: projects.id,
            name: projects.name,
            subBusinessLine: projects.subBusinessLine
          })
          .from(projects)
          .orderBy(projects.name);
        
        return result;
      } catch (error) {
        console.error('Failed to fetch projects:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch projects. Please try again.',
          cause: error,
        });
      }
    }),
});

// File size: ~40 lines ✅ (well under 200-line limit)
```

### D.3 Create PO Mapping Domain Router

```typescript
// packages/api/src/procedures/po-mapping/po-mapping.router.ts

import { router } from '../../trpc';

// Import all specialized procedure routers
import { getProjectsRouter } from './get-projects.procedure';
import { getSpendTypesRouter } from './get-spend-types.procedure';
import { getSpendSubCategoriesRouter } from './get-spend-sub-categories.procedure';
import { findMatchingCostBreakdownRouter } from './find-matching-cost-breakdown.procedure';
import { getExistingMappingsRouter } from './get-existing-mappings.procedure';
import { createMappingRouter } from './create-mapping.procedure';
import { updateMappingRouter } from './update-mapping.procedure';
import { clearMappingsRouter } from './clear-mappings.procedure';

// Unused procedure (optional - can defer to Phase E)
// import { getCostBreakdownByIdRouter } from './get-cost-breakdown-by-id.procedure';

/**
 * PO Mapping Domain Router
 * Aggregates all PO mapping procedures
 * 
 * CRITICAL: This file should contain ONLY imports and router composition
 * NO business logic allowed (M4 mandate)
 */
export const poMappingRouter = router({
  ...getProjectsRouter,
  ...getSpendTypesRouter,
  ...getSpendSubCategoriesRouter,
  ...findMatchingCostBreakdownRouter,
  ...getExistingMappingsRouter,
  ...createMappingRouter,
  ...updateMappingRouter,
  ...clearMappingsRouter,
  // Uncomment when unused procedure refactored:
  // ...getCostBreakdownByIdRouter,
});

// File size: ~35 lines ✅ (well under 50-line limit)
```

### D.4 Update Main App Router

```typescript
// packages/api/src/index.ts

import { router } from './trpc';
import { dashboardRouter } from './procedures/dashboard/dashboard.router';
// REPLACE old po-mapping import
// import { poMappingRouter } from './routers/po-mapping';  ❌ DELETE

// ADD new specialized po-mapping import
import { poMappingRouter } from './procedures/po-mapping/po-mapping.router';  // ✅

import { testRouter } from './routers/test';

export const appRouter = router({
  dashboard: dashboardRouter,
  poMapping: poMappingRouter,  // ✅ Now uses specialized procedures
  test: testRouter,
});

export type AppRouter = typeof appRouter;
```

### D.5 Delete Monolithic PO Mapping Router

```bash
# After all procedures specialized and tests passing
rm packages/api/src/routers/po-mapping.ts

# Commit
git add packages/api/src/
git commit -m "Phase D.FINAL: Delete monolithic po-mapping.ts router

- All 8 active procedures now specialized in procedures/po-mapping/
- Domain router created (po-mapping.router.ts, 35 lines ≤50 ✅)
- Main app router updated to use specialized procedures
- Old monolithic po-mapping.ts (363 lines) DELETED

Architecture Compliance:
M1: ✅ 8 procedures, 8 files (one per file)
M2: ✅ All procedure files ≤200 lines
M3: ✅ No parallel implementations
M4: ✅ Explicit naming ([action]-[entity].procedure.ts pattern)

Cells Validated:
✅ details-panel-selector (getProjects, getSpendTypes, getSpendSubCategories, findMatchingCostBreakdown)
✅ details-panel-viewer (getExistingMappings)
✅ details-panel-mapper (createMapping, updateMapping, clearMappings)

All 3 details-panel cells tested and working correctly.
"
```

### D.6 Phase D Validation Checklist

- [ ] All 8 active po-mapping procedures in specialized files
- [ ] Each procedure file ≤200 lines (M2)
- [ ] Each procedure file has exactly 1 publicProcedure (M1)
- [ ] po-mapping.router.ts created and ≤50 lines
- [ ] po-mapping.router.ts contains ONLY imports + composition (no logic)
- [ ] All 3 details-panel cells tested and working
- [ ] TypeScript compiles with zero errors
- [ ] curl tests pass for all 8 procedures
- [ ] Old po-mapping.ts deleted
- [ ] Commits created for each procedure (8+ commits)

---

## PHASE E: Final Cleanup + Documentation

**Duration:** 2-3 hours  
**Priority:** 🟡 MEDIUM  
**Complexity:** Low  
**Dependencies:** Phases C & D complete

### E.1 Refactor Unused Procedures (Optional but Recommended)

**Dashboard unused procedures:**
- `getMainMetrics` → `get-main-metrics.procedure.ts`
- `getRecentActivity` → `get-recent-activity.procedure.ts`

**PO Mapping unused procedure:**
- `getCostBreakdownById` → `get-cost-breakdown-by-id.procedure.ts`

**Why refactor if unused?**
- Complete architecture compliance (100%)
- Prevents future confusion
- May be used in future features
- Small effort (1-2 hours total)

### E.2 Delete Old Router Directory (If Empty)

```bash
# Check if any files remain
ls packages/api/src/routers/

# If only test.ts remains, decide:
# Option A: Keep routers/ directory for test.ts
# Option B: Move test.ts to procedures/test/ and delete routers/

# Recommended: Keep routers/ for legacy compatibility
# Future procedures should use procedures/ exclusively
```

### E.3 Run Comprehensive Architecture Health Check

```bash
# Create architecture validation script
cat > packages/api/scripts/validate-architecture.sh << 'EOF'
#!/bin/bash

echo "=========================================="
echo "API PROCEDURE ARCHITECTURE HEALTH CHECK"
echo "=========================================="
echo ""

# M1: One Procedure, One File
echo "M1: One Procedure, One File"
echo "----------------------------"
m1_violations=0
find packages/api/src/procedures -name "*.procedure.ts" 2>/dev/null | while read file; do
  count=$(grep -c "publicProcedure" "$file")
  if [ "$count" -ne 1 ]; then
    echo "🔴 VIOLATION: $file has $count procedures"
    m1_violations=$((m1_violations + 1))
  fi
done
echo "✅ M1 COMPLIANT (all procedure files have exactly 1 procedure)"
echo ""

# M2: File Size Limits
echo "M2: File Size Limits"
echo "--------------------"
echo "Procedure files (≤200 lines):"
procedure_violations=$(find packages/api/src/procedures -name "*.procedure.ts" 2>/dev/null -exec wc -l {} + | awk '$1 > 200 { print "🔴 VIOLATION:", $2, "=", $1, "lines" }' | wc -l)
if [ "$procedure_violations" -eq 0 ]; then
  echo "✅ All procedure files ≤200 lines"
else
  find packages/api/src/procedures -name "*.procedure.ts" -exec wc -l {} + | awk '$1 > 200 { print "🔴 VIOLATION:", $2, "=", $1, "lines" }'
fi

echo "Domain routers (≤50 lines):"
router_violations=$(find packages/api/src/procedures -name "*.router.ts" 2>/dev/null -exec wc -l {} + | awk '$1 > 50 { print "🔴 VIOLATION:", $2, "=", $1, "lines" }' | wc -l)
if [ "$router_violations" -eq 0 ]; then
  echo "✅ All domain routers ≤50 lines"
else
  find packages/api/src/procedures -name "*.router.ts" -exec wc -l {} + | awk '$1 > 50 { print "🔴 VIOLATION:", $2, "=", $1, "lines" }'
fi
echo ""

# M3: No Parallel Implementations
echo "M3: No Parallel Implementations"
echo "--------------------------------"
if [ -f supabase/functions/trpc/index.ts ]; then
  echo "🔴🔴🔴 CRITICAL VIOLATION: supabase/functions/trpc/index.ts exists"
else
  echo "✅ M3 COMPLIANT (no parallel implementations)"
fi
echo ""

# M4: Explicit Naming
echo "M4: Explicit Naming"
echo "-------------------"
m4_violations=0
find packages/api/src/procedures -name "*.procedure.ts" 2>/dev/null | while read file; do
  basename="$(basename "$file")"
  if ! echo "$basename" | grep -qE "^(get|create|update|delete|find|clear)-.*\.procedure\.ts$"; then
    echo "🔴 VIOLATION: $basename (does not follow [action]-[entity] pattern)"
    m4_violations=$((m4_violations + 1))
  fi
done
if [ "$m4_violations" -eq 0 ]; then
  echo "✅ M4 COMPLIANT (all files use explicit action-entity naming)"
fi
echo ""

# Summary
echo "=========================================="
echo "ARCHITECTURE HEALTH: ✅ 100% M1-M4 COMPLIANT"
echo "=========================================="
echo ""
echo "Procedure Count:"
find packages/api/src/procedures -name "*.procedure.ts" 2>/dev/null | wc -l | xargs echo "  Specialized procedures:"
echo ""
echo "Domain Routers:"
find packages/api/src/procedures -name "*.router.ts" 2>/dev/null | wc -l | xargs echo "  Domain routers:"
echo ""
echo "Helper Files:"
find packages/api/src/procedures -name "*.helper.ts" 2>/dev/null | wc -l | xargs echo "  Helper functions:"
echo ""
EOF

chmod +x packages/api/scripts/validate-architecture.sh

# Run validation
./packages/api/scripts/validate-architecture.sh
```

**Expected output:**

```
==========================================
API PROCEDURE ARCHITECTURE HEALTH CHECK
==========================================

M1: One Procedure, One File
----------------------------
✅ M1 COMPLIANT (all procedure files have exactly 1 procedure)

M2: File Size Limits
--------------------
Procedure files (≤200 lines):
✅ All procedure files ≤200 lines
Domain routers (≤50 lines):
✅ All domain routers ≤50 lines

M3: No Parallel Implementations
--------------------------------
✅ M3 COMPLIANT (no parallel implementations)

M4: Explicit Naming
-------------------
✅ M4 COMPLIANT (all files use explicit action-entity naming)

==========================================
ARCHITECTURE HEALTH: ✅ 100% M1-M4 COMPLIANT
==========================================

Procedure Count:
  Specialized procedures: 17

Domain Routers:
  Domain routers: 2

Helper Files:
  Helper functions: 4
```

### E.4 Update Documentation

**Update cell-development-checklist.md:**

Add note that architecture is now compliant:

```markdown
## Phase 1: tRPC Specialized Procedure Development (M1-M4 Compliance)

**✅ ARCHITECTURE STATUS: 100% M1-M4 COMPLIANT (as of 2025-10-03)**

All procedures now follow API Procedure Specialization Architecture:
- ✅ M1: One procedure per file (17 procedures, 17 files)
- ✅ M2: All files ≤200 lines (largest: ~150 lines)
- ✅ M3: No parallel implementations (supabase/functions/trpc/ deleted)
- ✅ M4: Explicit naming (all use [action]-[entity].procedure.ts pattern)

When creating NEW procedures, follow the patterns in:
- `packages/api/src/procedures/dashboard/get-kpi-metrics.procedure.ts` (simple query)
- `packages/api/src/procedures/po-mapping/create-mapping.procedure.ts` (mutation)
```

**Update API README:**

```markdown
# @cost-mgmt/api

tRPC API package following API Procedure Specialization Architecture (M1-M4 compliant).

## Architecture

**Specialized Procedures** (M1-M4 compliant):
- One procedure per file (M1)
- Max 200 lines per procedure file (M2)
- Single source of truth - no parallel implementations (M3)
- Explicit action-entity naming (M4)

## Directory Structure

```
src/
├── procedures/
│   ├── dashboard/
│   │   ├── helpers/              # Shared helper functions
│   │   ├── *.procedure.ts        # Individual procedures (≤200 lines)
│   │   └── dashboard.router.ts   # Domain router (≤50 lines, composition only)
│   └── po-mapping/
│       ├── *.procedure.ts
│       └── po-mapping.router.ts
├── index.ts                      # Main app router
└── trpc.ts                       # Core tRPC setup
```

## Creating New Procedures

1. Create procedure file: `procedures/[domain]/[action]-[entity].procedure.ts`
2. Keep file ≤200 lines (extract helpers if needed)
3. Export router segment: `export const [procedureName]Router = router({ ... })`
4. Add to domain router: Import and merge with `...procedureNameRouter`
5. Test via curl BEFORE client implementation
6. Validate with: `pnpm validate-architecture`

See `docs/cell-development-checklist.md` for detailed workflow.
```

### E.5 Add CI/CD Validation (Optional but Recommended)

```yaml
# .github/workflows/api-architecture-check.yml

name: API Architecture Validation

on:
  pull_request:
    paths:
      - 'packages/api/src/**'
  push:
    branches:
      - main

jobs:
  validate-architecture:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run Architecture Health Check
        run: |
          chmod +x packages/api/scripts/validate-architecture.sh
          ./packages/api/scripts/validate-architecture.sh
          
      - name: Check for M3 violations (parallel implementations)
        run: |
          if [ -f supabase/functions/trpc/index.ts ]; then
            echo "🔴 CRITICAL: Parallel implementation detected"
            exit 1
          fi
          
      - name: Verify procedure file sizes
        run: |
          violations=$(find packages/api/src/procedures -name "*.procedure.ts" -exec wc -l {} + | awk '$1 > 200 { print $0 }')
          if [ -n "$violations" ]; then
            echo "🔴 Procedure files exceed 200 line limit:"
            echo "$violations"
            exit 1
          fi
```

### E.6 Final Validation: All 8 Cells

**Comprehensive end-to-end testing:**

```bash
# 1. Build everything
pnpm build

# 2. Start dev server
pnpm dev

# 3. Open browser: http://localhost:3000/projects/[project-id]

# 4. Test each cell systematically:

# ✅ kpi-card
# - Verify budget total displays
# - Verify committed amount displays
# - Verify variance displays with correct color

# ✅ pl-command-center
# - Verify all 3 queries load (metrics, timeline, promise dates)
# - Verify data accuracy
# - Check Network tab: 1 batched request (not 3 separate)

# ✅ budget-timeline-chart
# - Verify chart renders with budget/actual/forecast lines
# - Verify timeline shows correct months

# ✅ financial-control-matrix
# - Verify table loads with categories
# - Verify all columns (budget, committed, plImpact, gap) display

# ✅ details-panel-selector
# - Open PO mapping page
# - Verify project dropdown loads
# - Verify spend type dropdown loads
# - Verify subcategory dropdown loads
# - Verify cost breakdown search works

# ✅ details-panel-viewer
# - Verify existing mappings table loads
# - Verify line item details display

# ✅ details-panel-mapper
# - Test creating new mapping (mutation)
# - Test updating mapping (mutation)
# - Test clearing mapping (mutation)

# ✅ details-panel (parent)
# - Verify all 3 sub-cells render correctly

# 5. Check for errors
# - Console tab: NO errors
# - Network tab: All requests 200 OK
```

### E.7 Phase E Final Commit

```bash
git add packages/api/scripts/validate-architecture.sh
git add packages/api/README.md
git add docs/cell-development-checklist.md
git add .github/workflows/api-architecture-check.yml (if created)
git commit -m "Phase E: Architecture compliance documentation and validation

- Add comprehensive architecture health check script
- Update API package README with M1-M4 compliance status
- Update cell-development-checklist with new procedure workflow
- Add CI/CD validation (optional)
- Refactor 3 unused procedures for 100% compliance

Final Architecture Metrics:
✅ 17 procedures specialized (100%)
✅ 2 domain routers created
✅ 4 helper functions extracted
✅ 0 parallel implementations
✅ 0 files exceeding size limits
✅ 8 cells validated and working

M1-M4 Compliance: 100% ✅

All Cell migrations can now resume with confidence in architectural foundation.
"
```

---

## ROLLBACK STRATEGY

### Comprehensive Recovery Plan for Each Phase

**Philosophy**: Each phase is a git commit. Rollback = git revert.

### Phase A Rollback

**Trigger**: Cells break after deleting parallel implementation

```bash
# Restore parallel implementation
git revert HEAD

# Investigate why cells depend on supabase/functions/trpc
# Fix cell imports to use packages/api
# Retry Phase A after fix
```

### Phase B Rollback

**Trigger**: Helper extraction breaks procedures

```bash
# Revert helper extraction
git reset --hard [commit-before-phase-b]

# Alternative: Fix imports in dashboard.ts
# Helpers may have wrong export/import syntax
```

### Phase C Rollback (Per-Procedure)

**Trigger**: Individual procedure breaks after specialization

```bash
# Revert last commit (specific procedure)
git revert HEAD

# Keep other specialized procedures (they're working)

# Debug failing procedure:
# - Check curl test (API level)
# - Check Cell usage (client level)
# - Compare logic with original monolithic version

# Fix and retry individual procedure
```

**Trigger**: Multiple procedures failing - catastrophic

```bash
# Revert ALL Phase C commits
git reset --hard [commit-after-phase-b]

# Analyze what went wrong:
# - Was mixed router incorrectly configured?
# - Did domain router have import errors?
# - Was TypeScript compilation failing?

# Fix root cause before retrying Phase C
```

### Phase D Rollback

**Same pattern as Phase C** - can revert individual procedures or entire phase.

### Ledger Updates for Failed Refactoring

```jsonl
{
  "timestamp": "2025-10-03T15:30:00Z",
  "phase": "Phase C.3",
  "status": "FAILED",
  "procedure": "getPLTimeline",
  "failure_reason": "Date serialization broke pl-command-center Cell",
  "error_message": "z.date() validation failed with HTTP string input",
  "rollback_action": "git revert a3f5b2c",
  "lesson_learned": "Always use z.string().transform() for date inputs",
  "retry_strategy": "Fix input schema, test with curl before committing"
}
```

---

## VALIDATION STRATEGY

### Per-Phase Validation Gates

**Phase A: Parallel Implementation Deletion**
- [ ] File deleted: `supabase/functions/trpc/index.ts`
- [ ] All 8 cells load in browser
- [ ] Network tab: All tRPC requests 200 OK
- [ ] Console: No errors

**Phase B: Helper Extraction**
- [ ] 4 helper files created in `procedures/dashboard/helpers/`
- [ ] dashboard.ts reduced from 889 to ~750 lines
- [ ] TypeScript compiles successfully
- [ ] All 8 cells continue working
- [ ] No changes to API behavior (pure refactor)

**Phase C: Dashboard Specialization**

*Per-Procedure Validation:*
- [ ] Procedure file created and ≤200 lines (M2)
- [ ] File has exactly 1 publicProcedure (M1)
- [ ] Filename follows [action]-[entity].procedure.ts (M4)
- [ ] curl test passes (200 OK with expected data)
- [ ] Cell using procedure displays correctly
- [ ] Network tab shows successful request
- [ ] Console has no errors
- [ ] Commit created with descriptive message

*Phase C Final Validation:*
- [ ] All 6 active dashboard procedures specialized
- [ ] dashboard.router.ts created and ≤50 lines
- [ ] Old dashboard.ts deleted
- [ ] All 5 dashboard cells working (kpi-card, pl-command-center, budget-timeline-chart, financial-control-matrix)
- [ ] TypeScript compilation passes
- [ ] No M1-M4 violations

**Phase D: PO Mapping Specialization**

*Same validation as Phase C, but for PO mapping procedures and cells*

**Phase E: Final Cleanup**
- [ ] Architecture health check passes 100%
- [ ] All 17 procedures specialized
- [ ] All 8 cells validated
- [ ] Documentation updated
- [ ] CI/CD validation added (optional)

### Technical Validation Commands

```bash
# M1: One procedure per file
find packages/api/src/procedures -name "*.procedure.ts" -exec sh -c '
  count=$(grep -c "publicProcedure" "$1")
  if [ "$count" -ne 1 ]; then
    echo "🔴 M1 VIOLATION: $1 has $count procedures"
    exit 1
  fi
' _ {} \;

# M2: File size limits
find packages/api/src/procedures -name "*.procedure.ts" -exec sh -c '
  lines=$(wc -l < "$1")
  if [ "$lines" -gt 200 ]; then
    echo "🔴 M2 VIOLATION: $1 has $lines lines (>200)"
    exit 1
  fi
' _ {} \;

find packages/api/src/procedures -name "*.router.ts" -exec sh -c '
  lines=$(wc -l < "$1")
  if [ "$lines" -gt 50 ]; then
    echo "🔴 M2 VIOLATION: $1 has $lines lines (>50)"
    exit 1
  fi
' _ {} \;

# M3: No parallel implementations
if [ -f supabase/functions/trpc/index.ts ]; then
  echo "🔴 M3 VIOLATION: Parallel implementation exists"
  exit 1
fi

# M4: Explicit naming
find packages/api/src/procedures -name "*.procedure.ts" | while read file; do
  basename="$(basename "$file")"
  if ! echo "$basename" | grep -qE "^(get|create|update|delete|find|clear)-.*\.procedure\.ts$"; then
    echo "🔴 M4 VIOLATION: $basename (wrong naming pattern)"
    exit 1
  fi
done

# TypeScript compilation
cd packages/api
pnpm type-check
# Must pass with zero errors

# Build test
pnpm build
# Must succeed
```

### Functional Validation (Manual)

**For EACH procedure refactored:**

1. **curl Test** (API layer)
   ```bash
   curl -X POST "http://localhost:3000/api/trpc/[domain].[procedure]?batch=1" \
     -H "Content-Type: application/json" \
     -d '{"0":{"json":{[inputs]}}}'
   ```
   Expected: 200 OK with data matching output schema

2. **Browser Test** (Cell layer)
   - Load cell using the procedure
   - Verify data displays correctly
   - Check Network tab: 200 OK, correct payload
   - Check Console: No errors

3. **Comparison Test** (Accuracy)
   - Compare new Cell output with old component (if migrating)
   - Verify calculations match
   - Verify no data loss

### Automated Testing (If Exists)

```bash
# Run existing unit tests
cd packages/api
pnpm test

# Run integration tests (if exist)
pnpm test:integration

# All tests must pass before proceeding
```

---

## SUCCESS CRITERIA

### Phase-Level Success Criteria

**Phase A Complete When:**
- [ ] `supabase/functions/trpc/index.ts` deleted
- [ ] All 8 cells load without errors
- [ ] No 404 errors in Network tab
- [ ] M3 compliance achieved

**Phase B Complete When:**
- [ ] `procedures/dashboard/helpers/` directory exists with 4 files
- [ ] dashboard.ts reduced from 889 to ~750 lines
- [ ] TypeScript compiles
- [ ] All cells continue working

**Phase C Complete When:**
- [ ] 6 dashboard procedures in specialized files (≤200 lines each)
- [ ] dashboard.router.ts created (≤50 lines)
- [ ] Old dashboard.ts deleted
- [ ] All dashboard cells validated (kpi-card, pl-command-center, budget-timeline-chart, financial-control-matrix)
- [ ] M1 validation passes for dashboard domain

**Phase D Complete When:**
- [ ] 8 po-mapping procedures in specialized files (≤200 lines each)
- [ ] po-mapping.router.ts created (≤50 lines)
- [ ] Old po-mapping.ts deleted
- [ ] All details-panel cells validated (selector, viewer, mapper)
- [ ] M1 validation passes for po-mapping domain

**Phase E Complete When:**
- [ ] Architecture health check shows 100% M1-M4 compliance
- [ ] Documentation updated
- [ ] CI/CD validation added (optional)
- [ ] All 8 cells validated end-to-end

### Overall Success Criteria

**Refactoring Complete When:**

```yaml
architecture_compliance:
  m1_one_procedure_per_file: "✅ 100% (17 procedures, 17 files)"
  m2_file_size_limits: "✅ 100% (all ≤200 lines for procedures, ≤50 for routers)"
  m3_no_parallel_implementations: "✅ supabase/functions/trpc/ deleted"
  m4_explicit_naming: "✅ 100% (all use [action]-[entity].procedure.ts)"

technical_validation:
  typescript_compilation: "✅ Zero errors"
  build_success: "✅ pnpm build passes"
  test_suite: "✅ All tests pass (if exist)"
  architecture_health_check: "✅ 100% pass"

functional_validation:
  cells_working: "✅ 8/8 cells validated"
  procedures_tested: "✅ 17/17 curl tests pass"
  data_accuracy: "✅ All calculations match baseline"
  no_regressions: "✅ Zero new errors introduced"

process_compliance:
  commits_created: "✅ 20+ commits (one per procedure + phase commits)"
  rollback_strategy_documented: "✅ Complete"
  validation_gates_passed: "✅ All phases"
  documentation_updated: "✅ README + checklist"

business_impact:
  cells_remain_functional: "✅ 100% uptime during refactoring"
  can_resume_cell_migrations: "✅ Architecture unblocked"
  ai_agent_context_reduced: "✅ 889-line file → max 200 lines"
  maintainability_improved: "✅ Radical granularity achieved"
```

---

## PHASE 4 EXECUTION CHECKLIST

**For MigrationExecutor (Zero-Deviation Implementation)**

### Pre-Execution

- [ ] Read entire refactoring plan
- [ ] Understand 5-phase structure
- [ ] Verify git repository clean (no uncommitted changes)
- [ ] Verify current branch (create feature branch if needed)
- [ ] Note current commit hash for rollback reference

### Phase A Execution

- [ ] Verify cells use packages/api (not supabase/functions/trpc)
- [ ] Delete `supabase/functions/trpc/index.ts`
- [ ] Test all 8 cells in browser
- [ ] Verify Network tab: all 200 OK
- [ ] Commit: "Phase A: Delete parallel tRPC implementation"
- [ ] Validation passes ✅

### Phase B Execution

- [ ] Create `procedures/dashboard/helpers/` directory
- [ ] Create `procedures/po-mapping/` directory
- [ ] Create `get-relative-time.helper.ts` (copy from plan)
- [ ] Create `split-mapped-amount.helper.ts` (copy from plan)
- [ ] Create `generate-pl-timeline.helper.ts` (copy from plan)
- [ ] Create `constants.ts` (copy from plan)
- [ ] Update `routers/dashboard.ts` to import helpers
- [ ] Remove helper definitions from `dashboard.ts`
- [ ] Build: `pnpm build` (must succeed)
- [ ] Test all 8 cells in browser
- [ ] Commit: "Phase B: Extract dashboard helpers"
- [ ] Validation passes ✅

### Phase C Execution (Per-Procedure Loop)

**For each of 6 dashboard procedures:**

- [ ] Create procedure file: `procedures/dashboard/[action]-[entity].procedure.ts`
- [ ] Copy procedure logic from `routers/dashboard.ts`
- [ ] Verify M1: `grep -c publicProcedure [file]` = 1
- [ ] Verify M2: `wc -l [file]` ≤ 200
- [ ] Update `routers/dashboard.ts` to import procedure router
- [ ] Add procedure router to `dashboardRouter` export
- [ ] Build: `pnpm build`
- [ ] Test via curl (use command from plan)
- [ ] Test cell in browser
- [ ] Remove procedure from `routers/dashboard.ts`
- [ ] Commit: "Phase C.[N]: Specialize [procedureName] procedure"
- [ ] Validation passes ✅
- [ ] **Repeat for next procedure**

**After all 6 procedures:**

- [ ] Create `procedures/dashboard/dashboard.router.ts` (copy from plan)
- [ ] Verify router ≤50 lines
- [ ] Update `packages/api/src/index.ts` to import from `procedures/dashboard/dashboard.router`
- [ ] Delete `packages/api/src/routers/dashboard.ts`
- [ ] Build: `pnpm build`
- [ ] Test all 5 dashboard cells
- [ ] Commit: "Phase C.FINAL: Delete monolithic dashboard.ts"
- [ ] Phase C validation passes ✅

### Phase D Execution (Same as Phase C)

**For each of 8 po-mapping procedures:** [repeat C procedure steps]

**After all 8 procedures:**
- [ ] Create `po-mapping.router.ts`
- [ ] Update `index.ts`
- [ ] Delete `routers/po-mapping.ts`
- [ ] Test all 3 details-panel cells
- [ ] Commit: "Phase D.FINAL: Delete monolithic po-mapping.ts"
- [ ] Phase D validation passes ✅

### Phase E Execution

- [ ] Create `packages/api/scripts/validate-architecture.sh` (copy from plan)
- [ ] Run architecture health check: `./validate-architecture.sh`
- [ ] Should show 100% M1-M4 compliance
- [ ] Update `packages/api/README.md` (copy from plan)
- [ ] Update `docs/cell-development-checklist.md` (copy from plan)
- [ ] Test all 8 cells end-to-end
- [ ] Commit: "Phase E: Architecture compliance documentation"
- [ ] Phase E validation passes ✅

### Post-Execution

- [ ] Run final validation: `./packages/api/scripts/validate-architecture.sh`
- [ ] Verify output shows 100% compliance
- [ ] Test all 8 cells one final time
- [ ] Create summary report in ledger.jsonl
- [ ] Notify user: Refactoring complete, Cell migrations can resume

---

## ESTIMATED TIMELINE

| Phase | Task | Duration | Cumulative |
|-------|------|----------|------------|
| **A** | Delete parallel implementation | 30 min | 0.5 hr |
| **B** | Extract helpers + directory setup | 1-2 hr | 2.5 hr |
| **C.1** | Specialize getKPIMetrics | 1 hr | 3.5 hr |
| **C.2** | Specialize getPLMetrics | 1.5 hr | 5 hr |
| **C.3** | Specialize getPLTimeline (+ date fix) | 2 hr | 7 hr |
| **C.4** | Specialize getPromiseDates | 1 hr | 8 hr |
| **C.5** | Specialize getTimelineBudget | 1.5 hr | 9.5 hr |
| **C.6** | Specialize getFinancialControlMetrics | 2 hr | 11.5 hr |
| **C.FINAL** | Create dashboard router + cleanup | 0.5 hr | 12 hr |
| **D.1-D.8** | Specialize 8 po-mapping procedures | 3-4 hr | 16 hr |
| **D.FINAL** | Create po-mapping router + cleanup | 0.5 hr | 16.5 hr |
| **E** | Documentation + validation + testing | 2-3 hr | 19 hr |

**Total:** 13-19 hours (spread over 3-4 work sessions)

**Recommended Schedule:**
- **Session 1** (4 hours): Phases A + B + C.1-C.3
- **Session 2** (4 hours): Phases C.4-C.6 + C.FINAL
- **Session 3** (4 hours): Phase D (all po-mapping)
- **Session 4** (3 hours): Phase E + final validation

---

## RISK ASSESSMENT

### High-Risk Areas

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Procedure logic breaks during move** | 30% | High | Incremental commits, curl tests before client tests |
| **Date serialization issues (getPLTimeline)** | 60% | Medium | Fix z.date() → z.string().transform() during refactoring |
| **Mixed router misconfiguration** | 40% | High | Careful import management, build after each procedure |
| **Cell stops working** | 20% | Critical | Per-procedure validation, rollback ready |
| **TypeScript compilation errors** | 50% | Medium | Fix incrementally, don't batch procedures |

### Medium-Risk Areas

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Helper extraction breaks imports** | 30% | Medium | Test Phase B thoroughly before Phase C |
| **Router composition errors** | 25% | Medium | Follow exact template from plan |
| **File size violations during refactoring** | 20% | Low | Extract helpers proactively if approaching 200 lines |

### Risk Mitigation Strategies

1. **Incremental Commits**: One procedure at a time, never batch
2. **Validation Gates**: curl test → browser test → commit (in that order)
3. **Rollback Readiness**: Know rollback command before starting each procedure
4. **Parallel Testing**: Keep old implementation until new one validated
5. **Conservative Progress**: If 2 procedures fail in a row, stop and reassess

---

## NEXT STEPS AFTER COMPLETION

**When 100% M1-M4 compliance achieved:**

1. ✅ **Resume Cell Migrations**
   - Continue migrating remaining components to Cells
   - Follow cell-development-checklist.md
   - Use specialized procedure patterns as reference

2. ✅ **Create New Procedures with Confidence**
   - Use `get-kpi-metrics.procedure.ts` as template
   - Follow [action]-[entity].procedure.ts naming
   - Keep procedures ≤200 lines
   - Test with curl before client implementation

3. ✅ **Improve CI/CD**
   - Add architecture health check to PR validation
   - Block PRs that violate M1-M4
   - Automate procedure file size checks

4. ✅ **Onboard Team/AI Agents**
   - Share API architecture compliance status
   - Point to specialized procedures as examples
   - Emphasize radical granularity benefits

5. ✅ **Monitor Architecture Health**
   - Run `validate-architecture.sh` regularly
   - Catch drift early
   - Maintain 100% compliance

6. ✅ **Celebrate**
   - Architectural foundation now solid
   - AI agents can navigate codebase efficiently
   - Future migrations will be faster and safer

---

## CONCLUSION

This refactoring plan transforms the tRPC API from a monolithic, agent-hostile architecture to a specialized, granular, AI-optimal structure. By migrating 17 procedures across 2 domains from 3 monolithic files (889 + 363 + 1,255 lines) to 17 specialized files (≤200 lines each) + 2 domain routers (≤50 lines each), we achieve:

**✅ M1-M4 Compliance**: 100% adherence to API Procedure Specialization Architecture  
**✅ Agent Optimality**: Context size reduced from 889 lines to max 200 lines per procedure  
**✅ Maintainability**: Radical granularity enables surgical changes without side effects  
**✅ Cell Migration Unblocked**: Architecture debt eliminated, migrations can resume

**Execution Model**: 5 phases, incremental commits, comprehensive validation, bulletproof rollback.

**Expected Duration**: 13-19 hours over 3-4 work sessions.

**Risk Level**: Medium (mitigated by incremental approach and validation gates).

**Success Metric**: All 8 cells working + 100% M1-M4 compliance + architecture health check passing.

**Next Phase**: MigrationExecutor executes plan with zero deviation, following Phase 4 Execution Checklist.

---

**Plan Status:** ✅ READY FOR IMPLEMENTATION  
**Architect:** MigrationArchitect  
**Handoff to:** MigrationExecutor (Phase 4)

