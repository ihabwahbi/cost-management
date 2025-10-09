# Migration Plan: Project Dashboard Page → Cell Architecture

---

## Metadata

```yaml
date: "2025-10-09T12:15:00Z"
architect: "MigrationArchitect"
status: "ready_for_implementation"
phase: 3
workflow_phase: "Phase 3: Migration Planning"

based_on:
  discovery_report: "thoughts/shared/discoveries/2025-10-09_03-57_discovery-report.md"
  analysis_report: "thoughts/shared/analysis/2025-10-09_12-06_project-dashboard-page_analysis.md"
  
migration_metadata:
  target_component: "page.tsx"
  target_path: "apps/web/app/projects/[id]/dashboard/page.tsx"
  complexity: "complex"
  strategy: "phased_mandatory"
  estimated_duration: "8-12 hours"
  queries_count: 4
  phasing_required: true
  critical_path: true
```

---

## Executive Summary

### Migration Overview

**Component**: Project Dashboard Page  
**Current State**: 427-line Next.js 14 App Router page with critical architectural violations  
**Target State**: Cell architecture with 13 focused files (avg 64 lines/file, max 120)

**Complexity Assessment**: **8.5/10 - COMPLEX**
- 427 lines (27 lines over 400 limit - **M-CELL-3 violation**)
- 4 database queries (1 direct Supabase + 3 tRPC = **phased implementation MANDATORY**)
- 9 state variables with complex interdependencies
- 2 realtime subscriptions (1 is **BROKEN** - critical bug)
- O(n⁴) data transformation requiring optimization
- 17 component imports
- **CRITICAL PATH** component (high breaking change risk)

**Migration Strategy**: **PHASED Implementation (6 Phases)**

Per cell-development-checklist.md Section 4.4: "4+ queries → Phased implementation MANDATORY, add queries ONE AT A TIME with git commits"

**Estimated Duration**: 8-12 hours
- Phase A: API Migration (3h)
- Phase B: Realtime Fix (2h)
- Phase C: Type Safety (2h)
- Phase D: Cell Extraction (4-5h)
- Phase E: Testing & Validation (2h)
- Phase F: Cleanup (1h)

### Critical Issues Addressed

🔴 **CRITICAL BUGS FIXED**:
1. **Broken realtime subscription** - `po_mappings` table has NO `project_id` column → silent failure
2. **Direct Supabase calls** - Bypasses tRPC layer (architectural violation)
3. **God component** - 427 lines > 400 line limit (M-CELL-3 violation)
4. **Type safety gaps** - 4 of 9 state variables use `any` types
5. **Cache invalidation issue** - Realtime doesn't trigger React Query refresh

---

## Architecture Compliance Validation

**Pre-Implementation Verification** (Phase 5.5 Self-Validation):

### Architectural Mandates Compliance

✅ **M-CELL-1** (All Functionality as Cells):
- **Status**: COMPLIANT
- **Classification**: Page component with business logic → MUST be Cell
- **Justification**: Component has 11 behavioral assertions, multi-step user flows (filtering, exporting, refreshing), and complex data orchestration. Per decision tree in Section 3.2: "Does this component perform user-facing operation with business logic? YES → Is it testable with behavioral requirements? YES → Create as Cell"

✅ **M-CELL-2** (Complete Atomic Migrations):
- **Status**: COMPLIANT
- **Verification**: Old page deletion scheduled in Phase F (same migration)
- **Atomic Commit**: Single commit contains all changes (Cell creation + old page deletion + imports updated)
- **Zero Parallel Implementations**: Migration deletes `apps/web/app/projects/[id]/dashboard/page.tsx` completely
- **Ledger Entry**: Documents replacement with deletion timestamp

✅ **M-CELL-3** (Zero God Components):
- **Status**: COMPLIANT
- **Current Violation**: 427 lines > 400 limit (27 lines over)
- **Extraction Strategy**: Decompose to 13 files:
  - `component.tsx`: ~50 lines (orchestrator)
  - `components/dashboard-header.tsx`: ~80 lines
  - 6 section components: ~40-120 lines each (max 120)
  - 2 custom hooks: ~80-100 lines each
  - 2 utility files: ~60-80 lines each
  - `types.ts`: ~50 lines
- **Result**: All files ≤120 lines (well under 400 limit)

✅ **M-CELL-4** (Explicit Behavioral Contracts):
- **Status**: COMPLIANT
- **Assertions Extracted**: 11 behavioral assertions (minimum 3 required)
- **Manifest**: Complete with data contracts, dependencies, accessibility requirements
- **Critical Assertions**:
  - BA-001: Display project name/sub-business line (HIGH)
  - BA-003: Error handling for project not found (HIGH)
  - BA-008: Auto-refresh on database changes (HIGH)

### Specialized Procedure Architecture Compliance

✅ **API Procedure Specialization** (M1-M4 from API architecture):
- **M1 (One Procedure, One File)**: ✅ NEW procedure in separate file (`get-project-details.procedure.ts`)
- **M2 (File Size Limits)**: ✅ Procedure ~45 lines (≤200 limit)
- **M3 (No Parallel Implementations)**: ✅ Replaces direct Supabase call (no duplication)
- **M4 (Explicit Naming)**: ✅ `get-project-details.procedure.ts` (action-entity pattern)
- **Export Pattern**: ✅ Direct procedure export (NO router wrapper, NO "Router" suffix)
- **Domain Router**: ✅ dashboard.router.ts updated to ~30 lines (≤50 limit)

### Forbidden Language Scan

✅ **Zero Violations Detected**:
- ❌ "optional" + "phase" → NONE found
- ❌ "future cleanup" → NONE found
- ❌ "temporary exemption" → NONE found
- ❌ File size exemptions → NONE (all extraction planned)

### Compliance Status

**✅ COMPLIANT - Ready for Phase 4 Implementation**

All 4 architectural mandates satisfied. All API architecture mandates satisfied. Zero forbidden patterns detected. Plan approved for execution.

---

## Data Layer Specifications

### Overview

**Database Changes**: NONE required (all schemas verified correct in analysis)

**tRPC Procedures**:
- **NEW**: 1 procedure (`getProjectDetails`)
- **EXISTING**: 3 procedures (already working, no changes needed)
- **TOTAL**: 4 queries for this component

### NEW Procedure #1: Get Project Details

**Purpose**: Replace direct Supabase query (lines 154-161 of current implementation)

**File**: `packages/api/src/procedures/dashboard/get-project-details.procedure.ts`  
**Estimated Lines**: ~45 (well under 200-line procedure limit)  
**Export Pattern**: Direct procedure export (NO router wrapper)

#### Input Schema

```typescript
z.object({
  projectId: z.string().uuid()
})
```

**Validation**:
- `projectId`: Must be valid UUID format
- No optional fields

#### Output Schema

```typescript
z.object({
  id: z.string().uuid(),
  name: z.string(),
  subBusinessLine: z.string(),
  createdAt: z.date(),
  updatedAt: z.date()
})
```

**Type Safety**: Drizzle schema inference ensures exact match with database

#### Complete Implementation Specification

```typescript
// packages/api/src/procedures/dashboard/get-project-details.procedure.ts

import { z } from 'zod'
import { publicProcedure } from '../../trpc'
import { db } from '@cost-mgmt/db'
import { projects } from '@cost-mgmt/db/schema'
import { eq } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'

// CRITICAL: Direct export pattern (NO router wrapper, NO "Router" suffix)
// Import publicProcedure only (NOT router)
export const getProjectDetails = publicProcedure
  .input(z.object({
    projectId: z.string().uuid()
  }))
  .query(async ({ input, ctx }) => {
    // Use Drizzle eq() helper (NOT raw SQL)
    const [project] = await ctx.db
      .select({
        id: projects.id,
        name: projects.name,
        subBusinessLine: projects.subBusinessLine,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt
      })
      .from(projects)
      .where(eq(projects.id, input.projectId))
      .limit(1)

    // Error handling with TRPCError
    if (!project) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `Project ${input.projectId} not found`
      })
    }

    return project
  })

// File size: ~45 lines (well under 200-line limit) ✅
// Export pattern: Direct procedure (NO router wrapper) ✅
```

#### Implementation Notes

**CRITICAL Patterns** (from trpc-debugging-guide.md):
- ✅ Use `eq()` helper for WHERE clause (NOT raw SQL)
- ✅ Select only needed columns (NO `SELECT *`)
- ✅ Throw `TRPCError` with `NOT_FOUND` code for missing projects
- ✅ Export procedure directly (NO router wrapper)
- ✅ Import `publicProcedure` only (NOT `router`)
- ✅ Limit to 1 result for single record query

**Error Handling**:
- `NOT_FOUND`: Project ID doesn't exist
- Automatic Zod validation for invalid UUID format

#### Curl Test Command

```bash
curl -X POST https://[project].supabase.co/functions/v1/trpc/dashboard.getProjectDetails \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "94d1eaad-4ada-4fb6-b872-212b6cd6007a"
  }'
```

**Expected Response (200 OK)**:
```json
{
  "result": {
    "data": {
      "id": "94d1eaad-4ada-4fb6-b872-212b6cd6007a",
      "name": "Sample Project",
      "subBusinessLine": "Engineering",
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-10-09T12:00:00.000Z"
    }
  }
}
```

**Edge Cases to Test**:
```bash
# Test 1: Invalid UUID format
curl ... -d '{"projectId": "invalid-uuid"}'
# Expected: 400 Bad Request with Zod validation error

# Test 2: Non-existent project
curl ... -d '{"projectId": "00000000-0000-0000-0000-000000000000"}'
# Expected: 404 Not Found with TRPCError message
```

### EXISTING Procedures (No Changes Required)

All 3 existing procedures verified working in analysis:

1. **`dashboard.getProjectMetrics`** ✅
   - Input: `{ projectId: string, filters: DashboardFilters }`
   - Output: Budget/spend metrics
   - Status: Working correctly

2. **`dashboard.getProjectCategoryBreakdown`** ✅
   - Input: `{ projectId: string, filters: DashboardFilters }`
   - Output: Spend by category array
   - Status: Working correctly

3. **`dashboard.getProjectHierarchicalBreakdown`** ✅
   - Input: `{ projectId: string, filters: DashboardFilters }`
   - Output: 4-level hierarchy structure
   - Status: Working correctly

**No modifications needed** - these procedures will be used as-is by the new Cell.

### Domain Router Update

**File**: `packages/api/src/procedures/dashboard/dashboard.router.ts`

**Change**: Add `getProjectDetails` to router composition

```typescript
// packages/api/src/procedures/dashboard/dashboard.router.ts
import { router } from '../../trpc'

// EXISTING imports (13 procedures)
import { getKPIMetrics } from './get-kpi-metrics.procedure'
import { getPLMetrics } from './get-pl-metrics.procedure'
import { getPLTimeline } from './get-pl-timeline.procedure'
import { getPromiseDates } from './get-promise-dates.procedure'
import { getTimelineBudget } from './get-timeline-budget.procedure'
import { getFinancialControlMetrics } from './get-financial-control-metrics.procedure'
import { getMainMetrics } from './get-main-metrics.procedure'
import { getRecentActivity } from './get-recent-activity.procedure'
import { getCategoryBreakdown } from './get-category-breakdown.procedure'
import { getTimelineData } from './get-timeline-data.procedure'
import { getProjectMetrics } from './get-project-metrics.procedure'
import { getProjectCategoryBreakdown } from './get-project-category-breakdown.procedure'
import { getProjectHierarchicalBreakdown } from './get-project-hierarchical-breakdown.procedure'

// NEW import - Direct procedure import
import { getProjectDetails } from './get-project-details.procedure'

// Dashboard domain router - Direct composition (NO spread operators)
// CRITICAL: Direct references only (NO router segment merging)
export const dashboardRouter = router({
  getKPIMetrics,
  getPLMetrics,
  getPLTimeline,
  getPromiseDates,
  getTimelineBudget,
  getFinancialControlMetrics,
  getMainMetrics,
  getRecentActivity,
  getCategoryBreakdown,
  getTimelineData,
  getProjectMetrics,
  getProjectCategoryBreakdown,
  getProjectHierarchicalBreakdown,
  getProjectDetails,  // NEW - direct reference (no spread)
})

// File size: ~30 lines (well under 50-line limit for routers) ✅
// Pattern: Simple aggregation only (NO business logic) ✅
```

**Verification**:
```bash
# Verify router size
wc -l packages/api/src/procedures/dashboard/dashboard.router.ts
# Expected: ~30 lines (≤50 limit)

# Verify no business logic in router
grep -E "(publicProcedure|\.query|\.mutation|if|for|while)" packages/api/src/procedures/dashboard/dashboard.router.ts
# Expected: No matches (router only imports and composes)
```

---

## Cell Structure Specifications

### Directory Structure

**Location**: `components/cells/project-dashboard-page/`

**CRITICAL**: This is a **page-level Cell**, not a traditional component Cell. It orchestrates the entire dashboard route.

```
components/cells/project-dashboard-page/
│
├── component.tsx                      # Main orchestrator (~50 lines)
├── components/                        # Sub-components directory
│   ├── dashboard-header.tsx          # Header with project name, buttons (~80 lines)
│   ├── kpi-section.tsx               # KPICard wrapper (~40 lines)
│   ├── pl-section.tsx                # PLCommandCenter wrapper (~40 lines)
│   ├── financial-matrix-section.tsx  # FinancialControlMatrix wrapper (~40 lines)
│   ├── timeline-section.tsx          # BudgetTimelineChart wrapper (~40 lines)
│   ├── charts-section.tsx            # Category & Subcategory charts (~120 lines)
│   └── breakdown-section.tsx         # CostBreakdownTable wrapper (~50 lines)
├── hooks/                             # Custom hooks directory
│   ├── use-dashboard-data.ts         # Consolidate all 4 tRPC queries (~80 lines)
│   └── use-realtime-sync.ts          # Realtime subscription + React Query invalidation (~100 lines)
├── utils/                             # Pure functions directory
│   ├── subcategory-transform.ts      # Extract O(n⁴) transformation logic (~60 lines)
│   └── export-handlers.ts            # PDF/Excel export functions (~80 lines)
├── types.ts                           # TypeScript interfaces (~50 lines)
├── manifest.json                      # Behavioral assertions (11 assertions)
├── pipeline.yaml                      # Validation gates (5 gates)
└── __tests__/
    └── component.test.tsx             # Unit tests for assertions
```

### File Size Breakdown (All ≤400 lines)

| File | Estimated Lines | Purpose | Max Limit | Status |
|------|-----------------|---------|-----------|--------|
| `component.tsx` | ~50 | Thin orchestrator | 400 | ✅ |
| `components/dashboard-header.tsx` | ~80 | Header, buttons, navigation | 400 | ✅ |
| `components/kpi-section.tsx` | ~40 | Wraps KPICard | 400 | ✅ |
| `components/pl-section.tsx` | ~40 | Wraps PLCommandCenter | 400 | ✅ |
| `components/financial-matrix-section.tsx` | ~40 | Wraps FinancialControlMatrixCell | 400 | ✅ |
| `components/timeline-section.tsx` | ~40 | Wraps BudgetTimelineChartCell | 400 | ✅ |
| `components/charts-section.tsx` | ~120 | Category & Subcategory charts | 400 | ✅ |
| `components/breakdown-section.tsx` | ~50 | Wraps CostBreakdownTable | 400 | ✅ |
| `hooks/use-dashboard-data.ts` | ~80 | Consolidate 4 tRPC queries | 400 | ✅ |
| `hooks/use-realtime-sync.ts` | ~100 | Realtime + invalidation | 400 | ✅ |
| `utils/subcategory-transform.ts` | ~60 | Data transformation | 400 | ✅ |
| `utils/export-handlers.ts` | ~80 | PDF/Excel export | 400 | ✅ |
| `types.ts` | ~50 | TypeScript interfaces | 400 | ✅ |

**Total**: ~830 lines across 13 files  
**Average**: 64 lines/file  
**Maximum**: 120 lines (charts-section.tsx)  
**vs. Current**: 427 lines in 1 file

**Result**: ✅ All files well under 400-line limit (M-CELL-3 compliant)

### Manifest Specification (manifest.json)

**Minimum Required**: 3 behavioral assertions  
**Planned**: 11 behavioral assertions (exceeds minimum)

```json
{
  "id": "project-dashboard-page",
  "version": "1.0.0",
  "description": "Main project dashboard with budget tracking, P&L analysis, and realtime updates",
  
  "dataContract": {
    "sources": [
      "trpc.dashboard.getProjectDetails",
      "trpc.dashboard.getProjectMetrics",
      "trpc.dashboard.getProjectCategoryBreakdown",
      "trpc.dashboard.getProjectHierarchicalBreakdown"
    ],
    "inputSchema": {
      "projectId": "string (uuid from route params)",
      "filters": "DashboardFilters (optional user selections)"
    },
    "realtime": {
      "subscriptions": [
        {
          "table": "cost_breakdown",
          "filter": "project_id=eq.{projectId}",
          "events": ["INSERT", "UPDATE", "DELETE"],
          "action": "Invalidate all dashboard queries"
        }
      ]
    }
  },
  
  "behavioralAssertions": [
    {
      "id": "BA-001",
      "requirement": "Dashboard MUST display project name and sub-business line in header",
      "validation": "Unit test: Mock getProjectDetails, verify header renders project.name and project.subBusinessLine",
      "criticality": "high",
      "source": "Current lines 305-306"
    },
    {
      "id": "BA-002",
      "requirement": "Dashboard MUST show loading skeleton while data fetches",
      "validation": "Unit test: Mock pending queries, verify DashboardSkeleton renders",
      "criticality": "medium",
      "source": "Current lines 260-262"
    },
    {
      "id": "BA-003",
      "requirement": "Dashboard MUST display error alert if project not found",
      "validation": "Unit test: Mock NOT_FOUND error from getProjectDetails, verify Alert with 'Project Not Found' message",
      "criticality": "high",
      "source": "Current lines 276-288"
    },
    {
      "id": "BA-004",
      "requirement": "Dashboard MUST display error alert if metrics query fails",
      "validation": "Unit test: Mock query error, verify Alert with error message",
      "criticality": "high",
      "source": "Current lines 264-274"
    },
    {
      "id": "BA-005",
      "requirement": "Refresh button MUST trigger data reload and show spinning icon",
      "validation": "E2E test: Click refresh button, verify spinner animation, verify React Query invalidation",
      "criticality": "medium",
      "source": "Current lines 309-317"
    },
    {
      "id": "BA-006",
      "requirement": "Export PDF button MUST generate PDF via print dialog",
      "validation": "Integration test: Mock exportDashboardToPDF, verify called with correct arguments",
      "criticality": "low",
      "source": "Current lines 233-242"
    },
    {
      "id": "BA-007",
      "requirement": "Export Excel button MUST generate CSV file with dashboard data",
      "validation": "Integration test: Mock exportDashboardToExcel, verify data structure passed correctly",
      "criticality": "low",
      "source": "Current lines 244-258"
    },
    {
      "id": "BA-008",
      "requirement": "Dashboard MUST auto-refresh when cost_breakdown table changes",
      "validation": "Integration test: Trigger Supabase realtime event, verify React Query queries invalidated",
      "criticality": "high",
      "source": "Current lines 190-201 (FIXED - was broken)"
    },
    {
      "id": "BA-009",
      "requirement": "Spend subcategory chart MUST display flattened hierarchy from 4-level data",
      "validation": "Unit test: Provide nested hierarchy object, verify flat subcategory array output with useMemo optimization",
      "criticality": "medium",
      "source": "Current lines 113-137"
    },
    {
      "id": "BA-010",
      "requirement": "Dashboard MUST display 'No data' message when category data is empty",
      "validation": "Unit test: Provide empty categoryData array, verify 'No category data available' text renders",
      "criticality": "low",
      "source": "Current lines 382-388"
    },
    {
      "id": "BA-011",
      "requirement": "'Back to Projects' button MUST navigate to previous page",
      "validation": "E2E test: Click button, verify window.history.back() called or router.back() called",
      "criticality": "medium",
      "source": "Current lines 324-330"
    }
  ],
  
  "dependencies": {
    "cells": [
      "kpi-card",
      "pl-command-center",
      "financial-control-matrix",
      "budget-timeline-chart"
    ],
    "presentational": [
      "SpendCategoryChart",
      "SpendSubcategoryChart",
      "CostBreakdownTable"
    ],
    "ui": [
      "@/components/ui/card",
      "@/components/ui/button",
      "@/components/ui/alert",
      "@/components/ui/skeleton"
    ],
    "api": [
      "trpc.dashboard.getProjectDetails",
      "trpc.dashboard.getProjectMetrics",
      "trpc.dashboard.getProjectCategoryBreakdown",
      "trpc.dashboard.getProjectHierarchicalBreakdown"
    ],
    "external": [
      "@tanstack/react-query (for React Query invalidation)",
      "Supabase realtime (for database subscriptions)"
    ]
  },
  
  "accessibility": {
    "wcag": "AA",
    "requirements": [
      "All buttons MUST have accessible labels (aria-label)",
      "Loading states MUST announce to screen readers (aria-live)",
      "Error messages MUST use Alert role with appropriate aria attributes",
      "Navigation actions MUST be keyboard accessible"
    ]
  },
  
  "metadata": {
    "createdBy": "MigrationArchitect (Phase 3)",
    "createdAt": "2025-10-09T12:15:00Z",
    "replacesComponent": "apps/web/app/projects/[id]/dashboard/page.tsx",
    "replacementReason": "God component (427 lines) → Cell architecture migration",
    "criticalPath": true,
    "breakingChangeRisk": "HIGH"
  }
}
```

**Verification**:
- ✅ 11 assertions (exceeds minimum 3 requirement)
- ✅ All assertions have validation strategies
- ✅ All assertions map to source code locations
- ✅ Criticality levels assigned (high/medium/low)

### Pipeline Specification (pipeline.yaml)

```yaml
# components/cells/project-dashboard-page/pipeline.yaml
version: 1.0

on_change:
  - name: Type Check
    run: "pnpm type-check"
    required: true
    description: "Verify zero TypeScript errors"
    
  - name: Lint
    run: "eslint components/cells/project-dashboard-page/**/*.{ts,tsx}"
    required: true
    description: "Code quality and style enforcement"
    
  - name: Unit Tests
    run: "vitest run components/cells/project-dashboard-page/__tests__"
    coverage_threshold: 80
    required: true
    description: "Verify all behavioral assertions with tests"
    
  - name: Behavioral Assertions Validation
    run: "node tools/cell-validator/bin/cell-validator.ts components/cells/project-dashboard-page/manifest.json"
    required: true
    description: "Validate manifest schema and assertion completeness"
    
  - name: File Size Check
    run: "find components/cells/project-dashboard-page -name '*.tsx' -o -name '*.ts' | xargs wc -l | awk '$1 > 400 {exit 1}'"
    required: true
    description: "Ensure all files ≤400 lines (M-CELL-3 compliance)"
    
  - name: Build Test
    run: "pnpm build"
    required: true
    description: "Verify production build succeeds with new Cell"
    
  - name: Accessibility Audit
    run: "axe-core components/cells/project-dashboard-page/component.tsx"
    required: true
    description: "WCAG AA compliance verification"

success_criteria:
  - "All required gates pass"
  - "Coverage >= 80%"
  - "All 11 behavioral assertions have corresponding tests"
  - "Zero accessibility violations"
  - "All files ≤400 lines"
  - "Zero TypeScript errors"
  - "Production build succeeds"
  - "Old page component deleted in same commit"
```

### Component Memoization Patterns (CRITICAL)

**Purpose**: Prevent infinite render loops (most common pitfall)

From cell-development-checklist.md and trpc-debugging-guide.md, specify ALL memoization patterns:

#### Pattern 1: Date Range Memoization (ALWAYS for date-based queries)

**CRITICAL**: This prevents infinite loops - queries will re-run forever without memoization

```typescript
// hooks/use-dashboard-data.ts

import { useMemo } from 'react'

export function useDashboardData(projectId: string) {
  // CRITICAL: Memoize dateRange with normalized times
  const dateRange = useMemo(() => {
    const now = new Date()
    
    const from = new Date(now)
    from.setMonth(from.getMonth() - 6)
    from.setHours(0, 0, 0, 0)  // Normalize to prevent millisecond differences
    
    const to = new Date(now)
    to.setMonth(to.getMonth() + 6)
    to.setHours(23, 59, 59, 999)  // Normalize to end of day
    
    return { from, to }
  }, [])  // Empty deps = computed once, never recreated
  
  // Now use stable dateRange reference in queries
  // (dateRange object is the SAME reference on every render)
}
```

#### Pattern 2: Filters Object Memoization

```typescript
// If filters come from props or state
const filters = useMemo(() => ({
  costLine: selectedCostLine,
  spendType: selectedSpendType,
  // ... other filter fields
}), [selectedCostLine, selectedSpendType])  // Only recreate when dependencies change
```

#### Pattern 3: Subcategory Transformation with useMemo

**Current Problem**: O(n⁴) nested loops run on EVERY render

**Solution**: Memoize transformation result

```typescript
// utils/subcategory-transform.ts

export function transformSubcategories(hierarchy: Hierarchy[]): SubcategoryData[] {
  const result: SubcategoryData[] = []
  
  hierarchy.forEach(businessLine => {
    businessLine.costLines.forEach(costLine => {
      costLine.spendTypes.forEach(spendType => {
        spendType.subCategories.forEach(subCategory => {
          result.push({
            businessLine: businessLine.name,
            costLine: costLine.name,
            spendType: spendType.name,
            subCategory: subCategory.name,
            amount: subCategory.amount
          })
        })
      })
    })
  })
  
  return result
}

// In component:
const subcategoryData = useMemo(
  () => transformSubcategories(breakdownData?.hierarchy ?? []),
  [breakdownData]  // Only recompute when breakdownData changes
)

// Remove setSubcategoryData state entirely - use useMemo instead
```

#### Pattern 4: Query Input Object Memoization

```typescript
// ALWAYS wrap objects passed to useQuery
const queryInput = useMemo(() => ({
  projectId,
  dateRange,
  filters
}), [projectId, dateRange, filters])  // Include all dependencies

const { data } = trpc.dashboard.getProjectMetrics.useQuery(queryInput)
```

**Rule of Thumb**: ANY non-primitive value (object, array, function) passed to:
- `useQuery`
- `useEffect`
- `useMemo`
- `useCallback`

MUST be memoized or defined outside component.

---

## Migration Sequence (PHASED - 6 Phases)

### Migration Strategy Decision

**Analysis**:
- **Query Count**: 4 database queries (1 NEW + 3 existing tRPC)
- **Complexity**: 427 lines, 9 state variables, complex data transformations
- **Critical Path**: Yes (main dashboard route)
- **Realtime Refactoring**: Required (broken subscription fix)

**Decision**: **PHASED Implementation MANDATORY**

Per cell-development-checklist.md:
> "4+ queries → Phased implementation MANDATORY, add queries ONE AT A TIME with git commits"

**Rationale**:
- 4 queries exceed threshold for standard migration (>3 queries)
- Broken realtime subscription requires careful testing
- Type safety refactoring needs validation before Cell extraction
- Critical path component requires incremental risk management

### ULTRATHINK: Enhanced Sequencing Analysis

**Dependency Graph Analysis**:

```
Phase A (API Layer):
  └─> getProjectDetails procedure created
      └─> Tested independently via curl
          └─> Verified working before Cell creation
              └─> Foundation for all subsequent phases

Phase B (Realtime Fix):
  └─> Fix broken subscription (po_mappings → cost_breakdown)
      └─> Implement React Query invalidation
          └─> Verify auto-refresh works
              └─> Critical for data freshness

Phase C (Type Safety):
  └─> Define TypeScript interfaces
      └─> Remove all 'any' types
          └─> Enables type-safe Cell implementation
              └─> Prevents runtime errors

Phase D (Cell Extraction):
  └─> Create Cell structure
      └─> Extract to 13 files (all ≤400 lines)
          └─> Implement with memoization patterns
              └─> Integrate all 4 queries incrementally
                  └─> Test after EACH query added

Phase E (Testing & Validation):
  └─> Unit tests for 11 assertions
      └─> Integration tests for data flow
          └─> Manual browser validation
              └─> Performance profiling

Phase F (Cleanup):
  └─> Delete old page file
      └─> Verify no references remain
          └─> Update ledger
              └─> Atomic commit
```

**Risk Analysis**:
- **Phase A Risk**: LOW (isolated procedure creation)
- **Phase B Risk**: MEDIUM (realtime refactoring, but isolated from Cell)
- **Phase C Risk**: LOW (type definitions only)
- **Phase D Risk**: HIGH (complex extraction, many moving parts)
- **Phase E Risk**: MEDIUM (comprehensive testing required)
- **Phase F Risk**: LOW (cleanup only)

**Optimization**: Phases A-C are preparatory work that de-risks Phase D (the complex extraction).

### Phase A: API Migration (3 hours)

**Goal**: Create and verify NEW tRPC procedure for project details

```yaml
duration: 3 hours
risk_level: LOW
parallel_work_allowed: false

step_a1_create_procedure:
  action: "Create get-project-details.procedure.ts"
  file: "packages/api/src/procedures/dashboard/get-project-details.procedure.ts"
  specification: "See Data Layer Specifications section above"
  estimated_time: "1 hour"
  validation:
    - "File created with direct export pattern"
    - "Uses eq() helper (NOT raw SQL)"
    - "Throws TRPCError for NOT_FOUND"
    - "File ≤200 lines"
    - "TypeScript compiles"
  
step_a2_test_procedure:
  action: "Test procedure independently via curl"
  commands:
    - "Test with valid project ID (expect 200 OK)"
    - "Test with invalid UUID format (expect 400 Bad Request)"
    - "Test with non-existent project (expect 404 Not Found)"
  estimated_time: "30 minutes"
  validation:
    - "All curl tests pass with expected responses"
    - "Response structure matches output schema"
  
step_a3_update_router:
  action: "Add getProjectDetails to dashboard.router.ts"
  file: "packages/api/src/procedures/dashboard/dashboard.router.ts"
  change: "Add import and direct reference (NO spread operator)"
  estimated_time: "15 minutes"
  validation:
    - "Router file ≤50 lines"
    - "No business logic in router"
    - "Direct reference pattern used"
  
step_a4_deploy_verify:
  action: "Deploy edge function and verify"
  commands:
    - "supabase functions deploy trpc --no-verify-jwt"
    - "Wait 30 seconds for cold start"
    - "Re-test all 4 procedures via curl (1 new + 3 existing)"
  estimated_time: "1 hour 15 minutes"
  validation:
    - "All 4 procedures return 200 OK"
    - "getProjectDetails returns correct data"
    - "Existing procedures still work (no regression)"
  
checkpoint:
  action: "Git commit checkpoint"
  message: "Phase A: Add getProjectDetails tRPC procedure"
  files_changed:
    - "packages/api/src/procedures/dashboard/get-project-details.procedure.ts (NEW)"
    - "packages/api/src/procedures/dashboard/dashboard.router.ts (MODIFIED)"
  validation:
    - "All curl tests pass"
    - "Edge function deployed successfully"
```

### Phase B: Realtime Fix (2 hours)

**Goal**: Fix broken subscription and implement React Query invalidation

**CRITICAL BUG FIX**: Current subscription to `po_mappings.project_id` doesn't work because that column doesn't exist!

```yaml
duration: 2 hours
risk_level: MEDIUM
depends_on: Phase A

step_b1_fix_subscription:
  action: "Fix broken realtime subscription"
  problem: "Lines 178-189 subscribe to po_mappings with project_id filter, but po_mappings has NO project_id column"
  solution: "Subscribe to cost_breakdown table instead (which HAS project_id column)"
  
  implementation:
    old_code: |
      .on('postgres_changes', {
        table: 'po_mappings',
        filter: `project_id=eq.${projectId}`  // ❌ Column doesn't exist!
      })
    
    new_code: |
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'cost_breakdown',
        filter: `project_id=eq.${projectId}`  // ✅ This column exists
      }, handleRealtimeEvent)
  
  estimated_time: "1 hour"
  validation:
    - "Subscription successfully created"
    - "Manual test: Insert into cost_breakdown, verify event triggers"
  
step_b2_react_query_invalidation:
  action: "Implement React Query invalidation on realtime events"
  problem: "Current handleRefresh() only refreshes loadProjectData(), not tRPC queries"
  solution: "Use queryClient.invalidateQueries() to refresh ALL dashboard queries"
  
  implementation: |
    import { useQueryClient } from '@tanstack/react-query'
    
    const queryClient = useQueryClient()
    
    const handleRealtimeEvent = async (payload) => {
      console.log('Cost breakdown changed:', payload)
      
      // Invalidate ALL dashboard queries
      await queryClient.invalidateQueries({
        queryKey: ['trpc', 'dashboard']
      })
      
      // Also refresh project details
      await queryClient.invalidateQueries({
        queryKey: ['trpc', 'dashboard', 'getProjectDetails']
      })
    }
  
  estimated_time: "1 hour"
  validation:
    - "Realtime event triggers query invalidation"
    - "UI automatically updates with fresh data"
    - "Network tab shows new requests after realtime event"
  
checkpoint:
  action: "Git commit checkpoint"
  message: "Phase B: Fix realtime subscription and React Query invalidation"
  validation:
    - "Subscription triggers correctly"
    - "All queries refresh on database change"
```

### Phase C: Type Safety (2 hours)

**Goal**: Define TypeScript interfaces and eliminate all `any` types

```yaml
duration: 2 hours
risk_level: LOW
depends_on: Phase B

step_c1_define_interfaces:
  action: "Create types.ts with all TypeScript interfaces"
  file: "components/cells/project-dashboard-page/types.ts"
  
  interfaces_to_define:
    - "Project (from getProjectDetails output)"
    - "DashboardFilters (filter state structure)"
    - "CategoryData (category breakdown item)"
    - "SubcategoryData (flattened subcategory item)"
    - "BreakdownData (hierarchical breakdown structure)"
    - "ExportOptions (PDF/Excel export configuration)"
  
  implementation: |
    // components/cells/project-dashboard-page/types.ts
    
    // From tRPC getProjectDetails output
    export interface Project {
      id: string
      name: string
      subBusinessLine: string
      createdAt: Date
      updatedAt: Date
    }
    
    // Dashboard filter state
    export interface DashboardFilters {
      costLine?: string
      spendType?: string
      dateRange?: {
        from: Date
        to: Date
      }
    }
    
    // Category breakdown item
    export interface CategoryData {
      category: string
      budget: number
      actual: number
      variance: number
      variancePercent: number
    }
    
    // Flattened subcategory item
    export interface SubcategoryData {
      businessLine: string
      costLine: string
      spendType: string
      subCategory: string
      budget: number
      actual: number
    }
    
    // Hierarchical breakdown structure
    export interface BreakdownData {
      hierarchy: Array<{
        businessLine: string
        costLines: Array<{
          costLine: string
          spendTypes: Array<{
            spendType: string
            subCategories: Array<{
              subCategory: string
              budget: number
              actual: number
            }>
          }>
        }>
      }>
    }
  
  estimated_time: "1 hour"
  validation:
    - "File created with ~50 lines"
    - "All interfaces export correctly"
    - "TypeScript compilation succeeds"
  
step_c2_update_state_declarations:
  action: "Replace all 'any' types with proper interfaces"
  files_affected: "All components using state"
  
  changes:
    - "const [project, setProject] = useState<Project | null>(null)"
    - "const [categoryData, setCategoryData] = useState<CategoryData[]>([])"
    - "const [breakdownData, setBreakdownData] = useState<BreakdownData | null>(null)"
    - "const [filters, setFilters] = useState<DashboardFilters>({})"
  
  estimated_time: "1 hour"
  validation:
    - "Zero 'any' types remain in Cell code"
    - "TypeScript compilation succeeds with zero errors"
    - "IDE provides autocomplete for all typed variables"
  
checkpoint:
  action: "Git commit checkpoint"
  message: "Phase C: Add TypeScript interfaces and remove 'any' types"
  validation:
    - "pnpm type-check passes"
    - "Zero 'any' types detected"
```

### Phase D: Cell Extraction (4-5 hours)

**Goal**: Extract 427-line page into Cell structure with 13 files

**MOST COMPLEX PHASE** - Requires careful incremental implementation

```yaml
duration: 4-5 hours
risk_level: HIGH
depends_on: Phase C

step_d1_create_cell_structure:
  action: "Create complete Cell directory structure"
  commands:
    - "mkdir -p components/cells/project-dashboard-page/{components,hooks,utils,__tests__}"
    - "touch components/cells/project-dashboard-page/{component.tsx,manifest.json,pipeline.yaml,types.ts}"
  estimated_time: "15 minutes"
  validation:
    - "All directories created"
    - "Skeleton files exist"
  
step_d2_create_manifest_pipeline:
  action: "Write manifest.json and pipeline.yaml"
  files:
    - "manifest.json (see Manifest Specification section)"
    - "pipeline.yaml (see Pipeline Specification section)"
  estimated_time: "30 minutes"
  validation:
    - "Manifest has 11 behavioral assertions"
    - "Pipeline has 7 validation gates"
    - "JSON and YAML syntax valid"
  
step_d3_extract_utilities:
  action: "Extract pure functions to utils/"
  files:
    - "utils/subcategory-transform.ts (~60 lines)"
    - "utils/export-handlers.ts (~80 lines)"
  estimated_time: "45 minutes"
  validation:
    - "Functions are pure (no side effects)"
    - "All functions typed"
    - "Unit tests pass"
  
step_d4_create_custom_hooks:
  action: "Create custom hooks for data and realtime"
  
  hook_1_dashboard_data:
    file: "hooks/use-dashboard-data.ts"
    purpose: "Consolidate all 4 tRPC queries with memoization"
    implementation: |
      import { useMemo } from 'react'
      import { trpc } from '@/lib/trpc'
      import type { DashboardFilters } from '../types'
      
      export function useDashboardData(projectId: string, filters: DashboardFilters) {
        // CRITICAL: Memoize dateRange to prevent infinite loops
        const dateRange = useMemo(() => {
          const now = new Date()
          const from = new Date(now)
          from.setMonth(from.getMonth() - 6)
          from.setHours(0, 0, 0, 0)
          
          const to = new Date(now)
          to.setMonth(to.getMonth() + 6)
          to.setHours(23, 59, 59, 999)
          
          return { from, to }
        }, [])
        
        // Query 1: Project details
        const projectQuery = trpc.dashboard.getProjectDetails.useQuery(
          { projectId },
          { enabled: !!projectId }
        )
        
        // Query 2: Metrics
        const metricsQuery = trpc.dashboard.getProjectMetrics.useQuery(
          { projectId, filters },
          { enabled: !!projectId }
        )
        
        // Query 3: Category breakdown
        const categoryQuery = trpc.dashboard.getProjectCategoryBreakdown.useQuery(
          { projectId, filters },
          { enabled: !!projectId }
        )
        
        // Query 4: Hierarchical breakdown
        const hierarchyQuery = trpc.dashboard.getProjectHierarchicalBreakdown.useQuery(
          { projectId, filters },
          { enabled: !!projectId }
        )
        
        return {
          project: projectQuery,
          metrics: metricsQuery,
          category: categoryQuery,
          hierarchy: hierarchyQuery,
          isLoading: projectQuery.isLoading || metricsQuery.isLoading,
          error: projectQuery.error || metricsQuery.error
        }
      }
    
    estimated_time: "1 hour"
    validation:
      - "All 4 queries consolidated"
      - "Memoization patterns applied"
      - "File ~80 lines"
  
  hook_2_realtime_sync:
    file: "hooks/use-realtime-sync.ts"
    purpose: "Realtime subscription with React Query invalidation"
    implementation: |
      import { useEffect } from 'react'
      import { useQueryClient } from '@tanstack/react-query'
      import { createClient } from '@/lib/supabase/client'
      
      export function useRealtimeSync(projectId: string) {
        const queryClient = useQueryClient()
        
        useEffect(() => {
          const supabase = createClient()
          
          const channel = supabase
            .channel(`dashboard-${projectId}`)
            .on('postgres_changes', {
              event: '*',
              schema: 'public',
              table: 'cost_breakdown',
              filter: `project_id=eq.${projectId}`
            }, async (payload) => {
              console.log('[Realtime] Cost breakdown changed:', payload)
              
              // Invalidate ALL dashboard queries
              await queryClient.invalidateQueries({
                queryKey: ['trpc', 'dashboard']
              })
            })
            .subscribe()
          
          return () => {
            channel.unsubscribe()
          }
        }, [projectId, queryClient])
      }
    
    estimated_time: "1 hour"
    validation:
      - "Subscription created correctly"
      - "Queries invalidated on events"
      - "Cleanup on unmount"
      - "File ~100 lines"
  
step_d5_create_sub_components:
  action: "Extract section components"
  files:
    - "components/dashboard-header.tsx (~80 lines)"
    - "components/kpi-section.tsx (~40 lines)"
    - "components/pl-section.tsx (~40 lines)"
    - "components/financial-matrix-section.tsx (~40 lines)"
    - "components/timeline-section.tsx (~40 lines)"
    - "components/charts-section.tsx (~120 lines)"
    - "components/breakdown-section.tsx (~50 lines)"
  
  estimated_time: "1 hour 30 minutes"
  validation:
    - "All components created"
    - "All files ≤120 lines"
    - "Props interfaces defined"
    - "TypeScript compiles"
  
step_d6_create_orchestrator:
  action: "Create thin orchestrator component"
  file: "components/cells/project-dashboard-page/component.tsx"
  
  implementation: |
    'use client'
    
    import { useDashboardData } from './hooks/use-dashboard-data'
    import { useRealtimeSync } from './hooks/use-realtime-sync'
    import { DashboardHeader } from './components/dashboard-header'
    import { KPISection } from './components/kpi-section'
    import { PLSection } from './components/pl-section'
    import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'
    import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
    // ... other imports
    
    export function ProjectDashboardPage({ projectId }: { projectId: string }) {
      const [filters, setFilters] = useState<DashboardFilters>({})
      
      // Custom hooks handle all complexity
      const data = useDashboardData(projectId, filters)
      useRealtimeSync(projectId)
      
      if (data.isLoading) {
        return <DashboardSkeleton />
      }
      
      if (data.error) {
        return <Alert variant="destructive">...</Alert>
      }
      
      return (
        <div className="container mx-auto p-6">
          <DashboardHeader project={data.project.data} />
          <KPISection projectId={projectId} />
          <PLSection projectId={projectId} />
          {/* ... other sections */}
        </div>
      )
    }
  
  estimated_time: "45 minutes"
  validation:
    - "File ~50 lines (thin orchestrator)"
    - "No business logic (all in hooks)"
    - "Clean component composition"
  
checkpoint:
  action: "Git commit checkpoint"
  message: "Phase D: Extract dashboard page to Cell architecture"
  files_summary:
    created: 13
    max_lines: 120
    avg_lines: 64
  validation:
    - "All files ≤400 lines"
    - "Cell structure complete"
    - "TypeScript compiles"
    - "Build succeeds"
```

### Phase E: Testing & Validation (2 hours)

**Goal**: Comprehensive testing and manual validation

```yaml
duration: 2 hours
risk_level: MEDIUM
depends_on: Phase D

step_e1_unit_tests:
  action: "Write unit tests for all 11 behavioral assertions"
  file: "__tests__/component.test.tsx"
  
  test_coverage:
    - "BA-001: Project name/sub-business line display"
    - "BA-002: Loading skeleton renders"
    - "BA-003: Project not found error"
    - "BA-004: Metrics query error"
    - "BA-005: Refresh button functionality"
    - "BA-006: Export PDF button"
    - "BA-007: Export Excel button"
    - "BA-008: Realtime auto-refresh"
    - "BA-009: Subcategory transformation"
    - "BA-010: Empty data message"
    - "BA-011: Back button navigation"
  
  estimated_time: "1 hour"
  validation:
    - "All 11 assertions have tests"
    - "Coverage ≥80%"
    - "All tests pass"
  
step_e2_integration_tests:
  action: "Test data flow and query integration"
  
  tests:
    - "All 4 queries return data correctly"
    - "Realtime subscription triggers invalidation"
    - "Filters update query inputs correctly"
    - "Export functions receive correct data"
  
  estimated_time: "30 minutes"
  validation:
    - "Integration tests pass"
    - "No infinite loops detected"
  
step_e3_manual_validation:
  action: "Browser testing and visual verification"
  required: true
  reason: "Critical path component - manual validation MANDATORY"
  
  checklist:
    - "[ ] Cell displays correctly in browser at /projects/[id]/dashboard"
    - "[ ] Project name and sub-business line render"
    - "[ ] All data sections display (KPI, P&L, charts, table)"
    - "[ ] Loading states show skeleton"
    - "[ ] Error states show alerts"
    - "[ ] Refresh button works and shows spinner"
    - "[ ] Export buttons generate files"
    - "[ ] Realtime updates trigger (test by updating cost_breakdown in DB)"
    - "[ ] No console errors"
    - "[ ] Network tab shows 4 successful requests (batched into 1 if possible)"
    - "[ ] Performance ≤110% of baseline"
  
  estimated_time: "30 minutes"
  approval_required: true
  user_must_respond: "VALIDATED"
  
checkpoint:
  action: "Git commit checkpoint (if tests pass)"
  message: "Phase E: Add comprehensive tests for dashboard Cell"
  validation:
    - "All tests pass"
    - "Coverage ≥80%"
    - "Manual validation approved"
```

### Phase F: Cleanup (1 hour)

**Goal**: Delete old implementation and finalize migration

**CRITICAL**: This is NOT optional - required for M-CELL-2 compliance

```yaml
duration: 1 hour
risk_level: LOW
depends_on: Phase E (with manual approval)

step_f1_update_route:
  action: "Update Next.js route to use new Cell"
  file: "apps/web/app/projects/[id]/dashboard/page.tsx"
  
  change: |
    // BEFORE: 427 line god component
    export default function DashboardPage({ params }: Props) {
      // ... 427 lines of code
    }
    
    // AFTER: Thin route wrapper
    import { ProjectDashboardPage } from '@/components/cells/project-dashboard-page/component'
    
    export default function DashboardPage({ params }: { params: { id: string } }) {
      return <ProjectDashboardPage projectId={params.id} />
    }
  
  estimated_time: "15 minutes"
  validation:
    - "Route file now ~10 lines"
    - "Imports Cell correctly"
    - "Passes projectId prop"
  
step_f2_verify_no_references:
  action: "Verify old implementation has no references"
  commands:
    - "grep -r 'loadProjectData' apps/web/ (should be zero)"
    - "grep -r 'setupRealtimeSubscription' apps/web/ (should be zero)"
    - "grep -r 'calculateBurnRateFromTimeline' apps/web/ (should be zero)"
  
  estimated_time: "15 minutes"
  validation:
    - "Zero references to old functions"
    - "Only Cell import remains"
  
step_f3_delete_old_code:
  action: "Delete old implementation from route file"
  note: "Route file becomes thin wrapper (see step_f1)"
  
  estimated_time: "5 minutes"
  validation:
    - "Route file ~10 lines"
    - "No business logic in route file"
  
step_f4_final_validation:
  action: "Run all validation gates"
  commands:
    - "pnpm type-check (expect zero errors)"
    - "pnpm test (expect all tests pass)"
    - "pnpm build (expect success)"
    - "find components/cells/project-dashboard-page -name '*.tsx' -exec wc -l {} + | awk '$1 > 400' (expect empty)"
  
  estimated_time: "15 minutes"
  validation:
    - "TypeScript: ✅ Zero errors"
    - "Tests: ✅ All pass, ≥80% coverage"
    - "Build: ✅ Production build succeeds"
    - "File sizes: ✅ All ≤400 lines"
  
step_f5_update_ledger:
  action: "Create ledger entry documenting migration"
  file: "ledger.jsonl"
  
  entry: |
    {
      "iterationId": "iter_20251009_121500_dashboard-page-cell-migration",
      "timestamp": "2025-10-09T12:15:00Z",
      "humanPrompt": "Migrate project dashboard page from 427-line god component to Cell architecture",
      "agent": "MigrationExecutor",
      "phase": "4",
      "artifacts": {
        "created": [
          {
            "type": "cell",
            "id": "project-dashboard-page",
            "path": "components/cells/project-dashboard-page/",
            "files": [
              "component.tsx",
              "components/dashboard-header.tsx",
              "components/kpi-section.tsx",
              "components/pl-section.tsx",
              "components/financial-matrix-section.tsx",
              "components/timeline-section.tsx",
              "components/charts-section.tsx",
              "components/breakdown-section.tsx",
              "hooks/use-dashboard-data.ts",
              "hooks/use-realtime-sync.ts",
              "utils/subcategory-transform.ts",
              "utils/export-handlers.ts",
              "types.ts",
              "manifest.json",
              "pipeline.yaml"
            ]
          },
          {
            "type": "api",
            "id": "dashboard.getProjectDetails",
            "path": "packages/api/src/procedures/dashboard/get-project-details.procedure.ts",
            "lines": 45
          }
        ],
        "modified": [
          {
            "type": "router",
            "id": "dashboardRouter",
            "path": "packages/api/src/procedures/dashboard/dashboard.router.ts",
            "change": "Added getProjectDetails procedure"
          },
          {
            "type": "page",
            "id": "dashboard-route",
            "path": "apps/web/app/projects/[id]/dashboard/page.tsx",
            "change": "Converted to thin wrapper (~10 lines)"
          }
        ],
        "replaced": [
          {
            "type": "page_implementation",
            "id": "dashboard-page-business-logic",
            "path": "apps/web/app/projects/[id]/dashboard/page.tsx",
            "deletedAt": "2025-10-09T16:00:00Z",
            "reason": "God component (427 lines) replaced by Cell architecture",
            "lines": 427,
            "violations": [
              "God component (427 lines > 400 limit)",
              "Business logic in page component",
              "Direct Supabase calls",
              "Type safety violations (any types)",
              "Broken realtime subscription"
            ]
          }
        ]
      },
      "schemaChanges": [],
      "validation": {
        "mandate_compliance": {
          "M_CELL_1": "PASS",
          "M_CELL_2": "PASS",
          "M_CELL_3": "PASS",
          "M_CELL_4": "PASS"
        },
        "technical_validation": {
          "types_check": "PASS",
          "tests": "PASS",
          "build": "PASS",
          "performance": "PASS"
        }
      }
    }
  
  estimated_time: "10 minutes"
  validation:
    - "Ledger entry appended"
    - "All artifacts documented"
  
step_f6_atomic_commit:
  action: "Create single atomic commit"
  message: |
    Migrate project dashboard page to Cell architecture
    
    - Create project-dashboard-page Cell with 13 files (all ≤120 lines)
    - Add getProjectDetails tRPC procedure
    - Fix broken realtime subscription (po_mappings → cost_breakdown)
    - Remove all 'any' types (add TypeScript interfaces)
    - Delete old business logic from route file
    - Convert route to thin wrapper (~10 lines)
    
    Closes: God component migration
    Fixes: Broken realtime subscription bug
    Complies: M-CELL-1, M-CELL-2, M-CELL-3, M-CELL-4
  
  files_in_commit:
    new:
      - "components/cells/project-dashboard-page/**/*"
      - "packages/api/src/procedures/dashboard/get-project-details.procedure.ts"
    modified:
      - "packages/api/src/procedures/dashboard/dashboard.router.ts"
      - "apps/web/app/projects/[id]/dashboard/page.tsx"
    deleted: []  # Note: Old business logic removed from page.tsx, but file remains as thin wrapper
  
  estimated_time: "5 minutes"
  validation:
    - "Single commit contains all changes"
    - "Codebase contains only new Cell implementation"
    - "Zero parallel implementations"
```

### Total Estimated Duration: 8-12 hours

**Breakdown**:
- Phase A (API): 3h
- Phase B (Realtime): 2h
- Phase C (Types): 2h
- Phase D (Cell): 4-5h
- Phase E (Testing): 2h
- Phase F (Cleanup): 1h

**Parallelization**: Phases must be sequential (dependencies between phases)

---

## Rollback Strategy

**Requirement**: MANDATORY for every migration

### Trigger Conditions

Any of the following failures triggers rollback:

1. **TypeScript Compilation Fails**
   - Error: `pnpm type-check` exits with errors
   - Severity: CRITICAL

2. **Tests Fail**
   - Error: Unit tests fail or coverage <80%
   - Severity: CRITICAL

3. **Build Fails**
   - Error: `pnpm build` exits with errors
   - Severity: CRITICAL

4. **Performance Regression >10%**
   - Error: Dashboard load time >110% of baseline
   - Severity: HIGH

5. **Curl Tests Fail**
   - Error: getProjectDetails procedure returns errors
   - Severity: CRITICAL

6. **Manual Validation Rejected**
   - Error: User reports broken functionality
   - Severity: CRITICAL

### Rollback Sequence

```yaml
step_1_git_revert:
  action: "Revert all commits from this migration"
  commands:
    - "git log --oneline --grep='Phase [A-F]:' | wc -l  # Count migration commits"
    - "git revert HEAD~N..HEAD --no-edit  # Revert last N commits"
  
  result: "All code changes undone atomically"
  
  validation:
    - "Old page implementation restored"
    - "New Cell directory removed"
    - "tRPC procedure removed from router"
    - "Dashboard route works with old implementation"

step_2_verify_revert:
  action: "Verify rollback successful"
  
  checks:
    - "[ ] Route /projects/[id]/dashboard works"
    - "[ ] Old implementation file exists at correct path"
    - "[ ] New Cell directory does not exist"
    - "[ ] Dashboard displays data correctly"
    - "[ ] No TypeScript errors"
    - "[ ] Build succeeds"
    - "[ ] All tests pass"
  
  commands:
    - "pnpm type-check"
    - "pnpm test"
    - "pnpm build"
    - "curl test for existing procedures (verify no regression)"

step_3_update_ledger:
  action: "Document migration failure in ledger"
  
  entry_type: "FAILED_MIGRATION"
  
  ledger_entry: |
    {
      "iterationId": "iter_20251009_121500_dashboard-page-cell-migration_FAILED",
      "timestamp": "2025-10-09T16:00:00Z",
      "status": "FAILED",
      "failureReason": "[Specific failure reason]",
      "failedAtPhase": "[Phase letter A-F]",
      "failedAtStep": "[Specific step]",
      "errorMessages": ["Error details"],
      "lessonsLearned": [
        "What went wrong",
        "How to prevent in next attempt"
      ],
      "rollbackCompleted": true,
      "rollbackVerified": true
    }
  
  validation:
    - "Ledger entry appended"
    - "Failure documented for future reference"

step_4_analyze_failure:
  action: "Generate failure analysis"
  
  questions_to_answer:
    - "What specific step failed?"
    - "What was the error message?"
    - "Was it a code issue or process issue?"
    - "What needs to change for next attempt?"
    - "Were architectural mandates violated?"
  
  output: "Failure report for retrospective"
```

### Edge Function Rollback

**Special Case**: If edge function deployed in Phase A but later phases fail

**Action**: **Leave deployed** (do NOT revert edge function)

**Rationale**:
- tRPC procedures are **additive** (adding new procedure doesn't break existing ones)
- Unused procedure (`getProjectDetails`) is harmless if not called
- Reverting edge function risks breaking other deployed procedures
- Next migration attempt can reuse deployed procedure

**Verification**:
```bash
# Verify existing procedures still work after rollback
curl test dashboard.getProjectMetrics
curl test dashboard.getProjectCategoryBreakdown
curl test dashboard.getProjectHierarchicalBreakdown

# All should return 200 OK (no regression)
```

### Partial Progress Handling

**Philosophy**: **NO partial migrations allowed** (M-CELL-2 mandate)

**Action**: **Full rollback on ANY failure**

**Rationale**:
- Partial migrations create the problems this architecture prevents
- Parallel implementations confuse agents
- God components remain if extraction incomplete
- Violates atomic completeness principle

**Examples**:
- ❌ "Phase A-C complete, but Phase D failed" → FULL ROLLBACK
- ❌ "Cell created but tests fail" → FULL ROLLBACK
- ❌ "Keep new procedure, revert Cell" → FULL ROLLBACK
- ✅ "All phases pass" → COMMIT
- ✅ "Any phase fails" → FULL ROLLBACK

---

## Validation Strategy

### Technical Validation Gates

#### Gate 1: TypeScript Compilation

```yaml
command: "pnpm type-check"
requirement: "Zero TypeScript errors"
automated: true

validation_points:
  - "All Cell files type-check"
  - "tRPC procedure types correct"
  - "No 'any' types remain"
  - "Props interfaces match"

failure_action: "Trigger rollback"
```

#### Gate 2: Unit Tests

```yaml
command: "pnpm test components/cells/project-dashboard-page"
requirements:
  - "All tests pass"
  - "Coverage ≥80%"
  - "All 11 behavioral assertions have tests"
automated: true

validation_points:
  - "BA-001 through BA-011 all tested"
  - "Mocking patterns correct"
  - "Edge cases covered"
  - "No test flakiness"

failure_action: "Trigger rollback"
```

#### Gate 3: Build Success

```yaml
command: "pnpm build"
requirement: "Production build succeeds with zero errors"
automated: true

validation_points:
  - "Next.js build completes"
  - "No build-time errors"
  - "Cell imports resolve correctly"
  - "Route generation succeeds"

failure_action: "Trigger rollback"
```

#### Gate 4: File Size Compliance

```yaml
command: "find components/cells/project-dashboard-page -name '*.tsx' -o -name '*.ts' | xargs wc -l | awk '$1 > 400'"
requirement: "No output (all files ≤400 lines)"
automated: true

validation_points:
  - "component.tsx ≤400 lines"
  - "All sub-components ≤400 lines"
  - "All hooks ≤400 lines"
  - "All utils ≤400 lines"

failure_action: "M-CELL-3 violation - must extract further"
```

### Functional Validation

#### Feature Parity Check

```yaml
requirement: "Cell works identically to old page component"
method: "Manual comparison + automated tests"
automated: "partial"

checklist:
  - "[ ] Project name displays correctly"
  - "[ ] All KPI cards show metrics"
  - "[ ] P&L section renders"
  - "[ ] Charts display data"
  - "[ ] Breakdown table populates"
  - "[ ] Filters work correctly"
  - "[ ] Export buttons generate files"
  - "[ ] Refresh button triggers reload"
  - "[ ] Error states display"
  - "[ ] Loading states show skeleton"

comparison_method: "Side-by-side visual comparison"
```

#### Performance Validation

```yaml
requirement: "Load time ≤110% of baseline"
baseline: "[X ms from analysis report]"
measurement: "React DevTools Profiler + Network tab"
automated: true

metrics:
  - "Initial page load time"
  - "Time to interactive (TTI)"
  - "Number of network requests"
  - "React component render count"
  - "Bundle size change"

acceptance_criteria:
  - "Load time ≤110% baseline"
  - "Network requests ≤baseline (ideally batched)"
  - "Component renders ≤baseline + 20%"
  - "Bundle size increase ≤5%"
```

#### Data Accuracy Validation

```yaml
requirement: "All data matches exactly between old and new implementations"
method: "Automated comparison tests"

tests:
  - "Project details match"
  - "Metrics calculations identical"
  - "Category breakdown sums correct"
  - "Hierarchical structure preserved"
  - "Subcategory transformation accurate"

failure_action: "Trigger rollback - data correctness CRITICAL"
```

### Architectural Validation

#### Cell Structure Compliance

```yaml
requirements:
  - "manifest.json exists with ≥3 assertions"
  - "pipeline.yaml exists with validation gates"
  - "component.tsx uses only tRPC (no direct DB)"
  - "Old page implementation deleted"
automated: true

validation_commands:
  - "test -f components/cells/project-dashboard-page/manifest.json"
  - "test -f components/cells/project-dashboard-page/pipeline.yaml"
  - "jq '.behavioralAssertions | length' manifest.json  # ≥3"
  - "grep -r 'supabase.from' components/cells/project-dashboard-page/  # Should be zero"
  - "wc -l apps/web/app/projects/[id]/dashboard/page.tsx  # ≤20 (thin wrapper)"
```

#### Ledger Completeness

```yaml
requirement: "Migration entry created in ledger.jsonl"

content_includes:
  - "iterationId with timestamp"
  - "humanPrompt documenting intent"
  - "All created artifacts listed"
  - "Modified artifacts documented"
  - "Replaced artifacts with deletion timestamp"
  - "Validation status for all mandates"

verification:
  - "tail -1 ledger.jsonl | jq '.artifacts.created | length'  # ≥2 (Cell + procedure)"
  - "tail -1 ledger.jsonl | jq '.artifacts.replaced | length'  # ≥1 (old page)"
```

### Manual Validation Gates

**Condition**: CRITICAL_PATH_VALIDATION_REQUIRED = true (from analysis)

**Trigger**: Main dashboard route - high user impact

#### Human Validation Required

**🛑 MANDATORY CHECKPOINT - User must approve before Phase F cleanup**

```yaml
validation_checklist:
  display:
    - "[ ] Cell displays correctly at route /projects/[id]/dashboard"
    - "[ ] Project name and sub-business line render in header"
    - "[ ] All data sections visible (KPI, P&L, Financial Matrix, Timeline, Charts, Table)"
  
  data_accuracy:
    - "[ ] All data values accurate (compare with old implementation)"
    - "[ ] Metrics calculations correct"
    - "[ ] Charts display correct data"
    - "[ ] Table shows all rows"
  
  interactions:
    - "[ ] Refresh button works (spinner shows, data updates)"
    - "[ ] Export PDF button generates file"
    - "[ ] Export Excel button generates file"
    - "[ ] Back button navigates correctly"
  
  states:
    - "[ ] Loading skeleton displays on initial load"
    - "[ ] Error states work (test by breaking network)"
    - "[ ] Empty data states display correctly"
  
  realtime:
    - "[ ] Realtime updates work (update cost_breakdown in DB, verify UI refreshes)"
    - "[ ] No infinite loops (check React DevTools Profiler)"
  
  technical:
    - "[ ] No console errors"
    - "[ ] Network tab shows successful requests (all 200 OK)"
    - "[ ] Requests batched if possible (ideally 1 POST to /trpc)"
    - "[ ] Performance acceptable (load time ≤110% baseline)"

approval_format: |
  User must respond with EXACTLY:
  "VALIDATED - proceed with cleanup"
  
  OR provide specific issues:
  "FIX ISSUES - [describe problems]"

blocking: true
proceed_only_if: "User responds 'VALIDATED'"
```

**If Issues Reported**:
1. Document issues in failure report
2. Trigger rollback
3. Analyze root cause
4. Revise plan for next attempt
5. Do NOT proceed to Phase F

---

## Success Criteria

Migration is considered **SUCCESSFUL** when ALL criteria met:

### Functional Success

- ✅ Route `/projects/[id]/dashboard` navigates correctly
- ✅ All 4 tRPC queries return expected data
- ✅ Realtime updates trigger UI refresh (test with DB change)
- ✅ PDF export generates file
- ✅ Excel export generates file
- ✅ Error states display alerts correctly
- ✅ Loading states show DashboardSkeleton
- ✅ Project name and sub-business line display
- ✅ All charts and tables render data
- ✅ Filters update query results

### Technical Success

- ✅ All 11 behavioral assertions pass tests
- ✅ All files ≤400 lines (max 120 in this migration)
- ✅ Old page logic deleted (route file ~10 lines)
- ✅ Zero grep references to old functions
- ✅ TypeScript compiles with zero errors
- ✅ All tests pass with ≥80% coverage
- ✅ Production build succeeds
- ✅ Performance within 110% of baseline

### Architectural Success

- ✅ M-CELL-1 satisfied (component is Cell)
- ✅ M-CELL-2 satisfied (atomic migration, old deleted)
- ✅ M-CELL-3 satisfied (all files ≤400 lines)
- ✅ M-CELL-4 satisfied (11 assertions in manifest)
- ✅ Specialized procedure architecture (direct export pattern)
- ✅ No parallel implementations
- ✅ Ledger entry created
- ✅ WCAG AA accessibility maintained

### Validation Commands

```bash
# Run all success criteria checks

# 1. File size check (M-CELL-3)
find components/cells/project-dashboard-page -name '*.tsx' -o -name '*.ts' | xargs wc -l | awk '$1 > 400 {print "FAIL:", $2; exit 1}' && echo "✅ All files ≤400 lines"

# 2. TypeScript check
pnpm type-check && echo "✅ TypeScript compiles"

# 3. Tests check
pnpm test components/cells/project-dashboard-page && echo "✅ All tests pass"

# 4. Build check
pnpm build && echo "✅ Production build succeeds"

# 5. Old references check
grep -r "loadProjectData\|setupRealtimeSubscription\|calculateBurnRateFromTimeline" apps/web/ && echo "❌ Old references found" || echo "✅ Zero old references"

# 6. Manifest check
test -f components/cells/project-dashboard-page/manifest.json && jq '.behavioralAssertions | length' components/cells/project-dashboard-page/manifest.json | awk '$1 >= 3' && echo "✅ Manifest complete"

# 7. Route file check
wc -l apps/web/app/projects/[id]/dashboard/page.tsx | awk '$1 <= 20 {print "✅ Route is thin wrapper"}; $1 > 20 {print "❌ Route still has business logic"}'

# 8. Ledger check
tail -1 ledger.jsonl | jq -e '.artifacts.replaced | length >= 1' && echo "✅ Ledger documents replacement"
```

---

## Phase 4 Execution Checklist

**For MigrationExecutor**: Step-by-step checklist for zero-deviation execution

```yaml
PRE_EXECUTION:
  - [ ] Read this entire migration plan document
  - [ ] Review cell-development-checklist.md
  - [ ] Review trpc-debugging-guide.md
  - [ ] Verify analysis report path correct
  - [ ] Confirm architecture blueprint understood

PHASE_A_API_MIGRATION:
  - [ ] Create get-project-details.procedure.ts (spec in Data Layer section)
  - [ ] Use direct export pattern (NO router wrapper)
  - [ ] Import publicProcedure only (NOT router)
  - [ ] Use eq() helper for WHERE clause
  - [ ] Throw TRPCError for NOT_FOUND
  - [ ] Verify file ≤200 lines
  - [ ] Test with curl (valid UUID → 200 OK)
  - [ ] Test with curl (invalid UUID → 400 Bad Request)
  - [ ] Test with curl (missing project → 404 Not Found)
  - [ ] Update dashboard.router.ts (add direct reference)
  - [ ] Verify router ≤50 lines
  - [ ] Deploy edge function: supabase functions deploy trpc --no-verify-jwt
  - [ ] Wait 30 seconds for cold start
  - [ ] Re-test all 4 procedures via curl
  - [ ] Git commit: "Phase A: Add getProjectDetails tRPC procedure"

PHASE_B_REALTIME_FIX:
  - [ ] Fix subscription table (po_mappings → cost_breakdown)
  - [ ] Fix subscription filter (use project_id column)
  - [ ] Implement React Query invalidation (useQueryClient)
  - [ ] Test realtime trigger (update cost_breakdown, verify event)
  - [ ] Verify UI refreshes on database change
  - [ ] Git commit: "Phase B: Fix realtime subscription"

PHASE_C_TYPE_SAFETY:
  - [ ] Create types.ts with all interfaces (spec in Cell Structure section)
  - [ ] Define Project interface
  - [ ] Define DashboardFilters interface
  - [ ] Define CategoryData interface
  - [ ] Define SubcategoryData interface
  - [ ] Define BreakdownData interface
  - [ ] Update all state declarations (remove 'any' types)
  - [ ] Verify TypeScript compiles: pnpm type-check
  - [ ] Verify zero 'any' types remain
  - [ ] Git commit: "Phase C: Add TypeScript interfaces"

PHASE_D_CELL_EXTRACTION:
  - [ ] Create Cell directory structure
  - [ ] Write manifest.json (11 assertions from spec)
  - [ ] Write pipeline.yaml (7 gates from spec)
  - [ ] Create utils/subcategory-transform.ts (~60 lines)
  - [ ] Create utils/export-handlers.ts (~80 lines)
  - [ ] Create hooks/use-dashboard-data.ts (~80 lines)
  - [ ] CRITICAL: Memoize dateRange in hook
  - [ ] CRITICAL: Normalize dates (setHours)
  - [ ] Create hooks/use-realtime-sync.ts (~100 lines)
  - [ ] Create components/dashboard-header.tsx (~80 lines)
  - [ ] Create components/kpi-section.tsx (~40 lines)
  - [ ] Create components/pl-section.tsx (~40 lines)
  - [ ] Create components/financial-matrix-section.tsx (~40 lines)
  - [ ] Create components/timeline-section.tsx (~40 lines)
  - [ ] Create components/charts-section.tsx (~120 lines)
  - [ ] Create components/breakdown-section.tsx (~50 lines)
  - [ ] Create component.tsx orchestrator (~50 lines)
  - [ ] Verify all files ≤400 lines: find ... | xargs wc -l
  - [ ] Verify TypeScript compiles: pnpm type-check
  - [ ] Verify build succeeds: pnpm build
  - [ ] Git commit: "Phase D: Extract dashboard to Cell architecture"

PHASE_E_TESTING:
  - [ ] Write unit tests for BA-001 (project name display)
  - [ ] Write unit tests for BA-002 (loading skeleton)
  - [ ] Write unit tests for BA-003 (project not found error)
  - [ ] Write unit tests for BA-004 (metrics query error)
  - [ ] Write unit tests for BA-005 (refresh button)
  - [ ] Write unit tests for BA-006 (export PDF)
  - [ ] Write unit tests for BA-007 (export Excel)
  - [ ] Write unit tests for BA-008 (realtime auto-refresh)
  - [ ] Write unit tests for BA-009 (subcategory transformation)
  - [ ] Write unit tests for BA-010 (empty data message)
  - [ ] Write unit tests for BA-011 (back button)
  - [ ] Run tests: pnpm test components/cells/project-dashboard-page
  - [ ] Verify coverage ≥80%
  - [ ] Integration tests for data flow
  - [ ] MANUAL VALIDATION (REQUIRED):
  - [ ]   Navigate to /projects/[id]/dashboard
  - [ ]   Verify all sections display
  - [ ]   Verify all data accurate
  - [ ]   Test refresh button
  - [ ]   Test export buttons
  - [ ]   Test realtime updates (update DB, verify UI refresh)
  - [ ]   Check console (no errors)
  - [ ]   Check network tab (all 200 OK)
  - [ ]   Measure performance (≤110% baseline)
  - [ ] USER APPROVAL: Wait for "VALIDATED" response
  - [ ] Git commit: "Phase E: Add comprehensive tests"

PHASE_F_CLEANUP:
  - [ ] Update route file to thin wrapper (~10 lines)
  - [ ] Import Cell: import { ProjectDashboardPage } from '@/components/cells/...'
  - [ ] Return Cell with projectId prop
  - [ ] Verify no old function references: grep -r "loadProjectData" apps/
  - [ ] Verify route file ≤20 lines: wc -l page.tsx
  - [ ] Run all validation gates:
  - [ ]   pnpm type-check (zero errors)
  - [ ]   pnpm test (all pass, ≥80% coverage)
  - [ ]   pnpm build (succeeds)
  - [ ]   File size check (all ≤400)
  - [ ] Update ledger.jsonl (entry spec in Rollback section)
  - [ ] ATOMIC COMMIT with message from plan
  - [ ] Verify codebase contains only new Cell

POST_MIGRATION:
  - [ ] Confirm route /projects/[id]/dashboard works
  - [ ] Confirm all 4 queries return data
  - [ ] Confirm realtime updates trigger
  - [ ] Confirm exports work
  - [ ] Confirm no console errors
  - [ ] Mark migration COMPLETE
```

**Execution Mode**: Sequential (phases must complete in order A → F)

**Rollback Trigger**: ANY checklist item fails → See Rollback Strategy section

**Approval Gate**: Phase E manual validation MUST receive "VALIDATED" before Phase F

---

## Pitfall Prevention Specifications

### From Analysis Report - Critical Bugs to Fix

#### Pitfall #1: Broken Realtime Subscription (CRITICAL)

**Location**: Current lines 178-189  
**Severity**: 🔴 CRITICAL - Silent failure, data goes stale

**Problem**:
```typescript
// ❌ WRONG - po_mappings has NO project_id column
.on('postgres_changes', {
  table: 'po_mappings',
  filter: `project_id=eq.${projectId}`  // Column doesn't exist!
})
```

**Fix in Phase B**:
```typescript
// ✅ CORRECT - cost_breakdown HAS project_id column
.on('postgres_changes', {
  event: '*',
  schema: 'public',
  table: 'cost_breakdown',
  filter: `project_id=eq.${projectId}`
}, handleRealtimeEvent)
```

**Verification**:
```bash
# Verify table schema
echo "SELECT column_name FROM information_schema.columns WHERE table_name='po_mappings' AND column_name='project_id';" | psql

# Should return zero rows (column doesn't exist)
```

#### Pitfall #2: Realtime Doesn't Invalidate React Query Cache

**Location**: Current lines 187, 199  
**Severity**: 🟡 HIGH - Metrics/charts remain stale after DB change

**Problem**:
```typescript
// ❌ WRONG - Only refreshes loadProjectData(), not tRPC queries
const handleRefresh = async () => {
  setRefreshing(true)
  await loadProjectData()  // Only refreshes project details
  setRefreshing(false)
}
```

**Fix in Phase B**:
```typescript
// ✅ CORRECT - Invalidate all dashboard queries
import { useQueryClient } from '@tanstack/react-query'

const queryClient = useQueryClient()

const handleRealtimeEvent = async (payload) => {
  console.log('[Realtime] Database changed:', payload)
  
  // Invalidate ALL dashboard queries
  await queryClient.invalidateQueries({
    queryKey: ['trpc', 'dashboard']
  })
  
  // Queries automatically refetch
}
```

#### Pitfall #3: Unmemoized Subcategory Transformation

**Location**: Current lines 113-137  
**Severity**: 🟡 MEDIUM - Performance degradation, unnecessary re-renders

**Problem**:
```typescript
// ❌ WRONG - O(n⁴) nested loops run on EVERY render
useEffect(() => {
  if (!breakdownDataResponse) return
  
  const result: any[] = []
  breakdownDataResponse.hierarchy.forEach(businessLine => {
    businessLine.costLines.forEach(costLine => {
      costLine.spendTypes.forEach(spendType => {
        spendType.subCategories.forEach(subCategory => {
          result.push({ /* ... */ })
        })
      })
    })
  })
  
  setSubcategoryData(result)  // Triggers re-render
}, [breakdownDataResponse])
```

**Fix in Phase D**:
```typescript
// ✅ CORRECT - Memoized transformation, no state needed
const subcategoryData = useMemo(
  () => transformSubcategories(breakdownData?.hierarchy ?? []),
  [breakdownData]
)

// No setSubcategoryData state - use useMemo directly
// Transformation only runs when breakdownData actually changes
```

#### Pitfall #4: Type Safety Violations

**Location**: Lines 59, 60, 61, 66  
**Severity**: 🟡 MEDIUM - Runtime errors possible, poor developer experience

**Problem**:
```typescript
// ❌ WRONG - Multiple 'any' types
const [project, setProject] = useState<any>(null)
const [categoryData, setCategoryData] = useState<any[]>([])
const [breakdownData, setBreakdownData] = useState<any[]>([])
const [subcategoryData, setSubcategoryData] = useState<any[]>([])
```

**Fix in Phase C**:
```typescript
// ✅ CORRECT - Proper TypeScript interfaces
const [project, setProject] = useState<Project | null>(null)
const [categoryData, setCategoryData] = useState<CategoryData[]>([])
const [breakdownData, setBreakdownData] = useState<BreakdownData | null>(null)
// subcategoryData removed - use useMemo instead
```

### From cell-development-checklist.md - Common Pitfalls

#### Pitfall #5: Date Serialization Failures

**Severity**: 🔴 CRITICAL - Causes 400 Bad Request errors

**Problem**:
```typescript
// ❌ WRONG - z.date() expects Date object, receives string over HTTP
.input(z.object({
  dateRange: z.object({
    from: z.date(),  // Expects Date, gets string
    to: z.date()
  })
}))
```

**Prevention in Phase A**:
```typescript
// ✅ CORRECT - Use z.string().transform()
.input(z.object({
  dateRange: z.object({
    from: z.string().transform(val => new Date(val)),
    to: z.string().transform(val => new Date(val))
  })
}))
```

#### Pitfall #6: Infinite Render Loops

**Severity**: 🔴 CRITICAL - Most time-consuming to debug

**Problem**:
```typescript
// ❌ WRONG - Creates new object every render
const { data } = trpc.dashboard.getProjectMetrics.useQuery({
  projectId,
  dateRange: {
    from: new Date(),  // NEW object every time!
    to: new Date()
  }
})
```

**Prevention in Phase D**:
```typescript
// ✅ CORRECT - Memoize with normalized times
const dateRange = useMemo(() => {
  const now = new Date()
  const from = new Date(now)
  from.setMonth(from.getMonth() - 6)
  from.setHours(0, 0, 0, 0)  // CRITICAL: Normalize
  
  const to = new Date(now)
  to.setMonth(to.getMonth() + 6)
  to.setHours(23, 59, 59, 999)
  
  return { from, to }
}, [])  // Empty deps = stable reference
```

#### Pitfall #7: SQL Syntax Confusion

**Severity**: 🟡 MEDIUM - Breaks edge function queries

**Problem**:
```typescript
// ❌ WRONG - Mixing raw SQL with Drizzle
import { sql } from 'drizzle-orm'
const data = await db
  .select()
  .from(table)
  .where(sql`${table.id} = ANY(${ids})`)
```

**Prevention in Phase A**:
```typescript
// ✅ CORRECT - Use Drizzle helpers
import { eq, inArray, between } from 'drizzle-orm'
const data = await db
  .select()
  .from(table)
  .where(inArray(table.id, ids))
```

---

## Risk Mitigation Summary

| Risk | Severity | Mitigation | Phase |
|------|----------|------------|-------|
| Broken realtime subscription | 🔴 CRITICAL | Fix subscription table and filter | Phase B |
| Infinite render loops | 🔴 CRITICAL | Memoize ALL query inputs | Phase D |
| Date serialization failures | 🔴 CRITICAL | Use z.string().transform() | Phase A |
| Type safety violations | 🟡 HIGH | Define interfaces, remove 'any' | Phase C |
| React Query not invalidating | 🟡 HIGH | Implement queryClient.invalidateQueries | Phase B |
| Performance regression | 🟡 MEDIUM | Memoize transformations | Phase D |
| SQL syntax errors | 🟡 MEDIUM | Use Drizzle helpers | Phase A |
| Breaking route navigation | 🔴 CRITICAL | Extensive manual validation | Phase E |

---

## Appendix A: Quick Reference

### File Locations

**Target Component**:
```
apps/web/app/projects/[id]/dashboard/page.tsx (427 lines)
```

**New Cell Location**:
```
components/cells/project-dashboard-page/
```

**tRPC Procedures**:
```
packages/api/src/procedures/dashboard/
├── get-project-details.procedure.ts (NEW - ~45 lines)
├── get-project-metrics.procedure.ts (EXISTING)
├── get-project-category-breakdown.procedure.ts (EXISTING)
└── get-project-hierarchical-breakdown.procedure.ts (EXISTING)
```

### Key Metrics

| Metric | Value |
|--------|-------|
| Lines of Code | 427 → ~830 across 13 files |
| Complexity Score | 8.5/10 |
| Migration Strategy | Phased (6 phases) |
| Estimated Duration | 8-12 hours |
| State Variables | 9 → consolidated in hooks |
| tRPC Queries | 4 (1 NEW + 3 existing) |
| Behavioral Assertions | 11 |
| Component Imports | 17 |
| Breaking Change Risk | HIGH (critical path) |
| Max File Size After | 120 lines (charts-section.tsx) |
| Avg File Size After | 64 lines |

### Critical Commands

```bash
# Create procedure and test
curl -X POST https://[project].supabase.co/functions/v1/trpc/dashboard.getProjectDetails -H "Content-Type: application/json" -d '{"projectId":"[uuid]"}'

# Deploy edge function
supabase functions deploy trpc --no-verify-jwt

# Verify file sizes
find components/cells/project-dashboard-page -name '*.tsx' -o -name '*.ts' | xargs wc -l | awk '$1 > 400'

# Run all validation gates
pnpm type-check && pnpm test && pnpm build

# Check for old references
grep -r "loadProjectData\|setupRealtimeSubscription" apps/web/

# Verify ledger entry
tail -1 ledger.jsonl | jq '.artifacts.replaced'
```

---

## END OF MIGRATION PLAN

**Status**: ✅ Ready for Phase 4 Implementation  
**Compliance**: ✅ All architectural mandates satisfied (M-CELL-1 through M-CELL-4)  
**Next Phase**: MigrationExecutor - Zero-deviation execution  
**Plan Path**: `thoughts/shared/plans/2025-10-09_12-15_project-dashboard-page_migration_plan.md`

---

**CRITICAL REMINDERS FOR PHASE 4 EXECUTOR**:

1. ✅ **Phased implementation MANDATORY** (4 queries)
2. ✅ **Memoize ALL objects/arrays** passed to hooks
3. ✅ **Use z.string().transform()** for dates (NOT z.date())
4. ✅ **Direct export pattern** for procedure (NO router wrapper)
5. ✅ **Fix realtime subscription** (cost_breakdown, NOT po_mappings)
6. ✅ **React Query invalidation** on realtime events
7. ✅ **All files ≤400 lines** (extraction required)
8. ✅ **Manual validation REQUIRED** before Phase F cleanup
9. ✅ **Atomic commit** (Cell + old deletion in SAME commit)
10. ✅ **Zero tolerance** for partial migration or "optional" phases

**This is a complete replacement migration. No parallel implementations. No god components. Absolute leanness maintained.**
