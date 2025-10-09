# Resume Guide: Project Dashboard Page Migration - Phase D

**Created**: 2025-10-09  
**Current Phase**: C Complete → Ready for Phase D  
**Session Boundary**: Fresh session recommended for complex Cell extraction  
**Next Phase**: D (Cell Extraction) - 4-5 hours, HIGH complexity  

---

## 🎯 Quick Start (Copy-Paste for Next Session)

### Load These Documents First

```
1. Migration Plan (PRIMARY REFERENCE):
   @thoughts/shared/plans/2025-10-09_12-15_project-dashboard-page_migration_plan.md
   
2. Phase A Completion (API Layer):
   @thoughts/shared/implementations/2025-10-09_phase-a_dashboard-page_complete.md
   
3. Phase B Completion (Realtime Fix):
   @thoughts/shared/implementations/2025-10-09_phase-b_dashboard-page_complete.md
   
4. Phase C Completion (Type Safety):
   @thoughts/shared/implementations/2025-10-09_phase-c_dashboard-page_complete.md
   
5. Cell Development Checklist:
   @docs/cell-development-checklist.md
```

### Execute Phase D

**Prompt to use**:
```
Execute Phase D: Cell Extraction for project-dashboard-page migration

Phases A, B, C complete and committed:
- Phase A (b933923): getProjectDetails tRPC procedure created and tested
- Phase B (918067f): Realtime subscription fixed, React Query invalidation added  
- Phase C (3e7f204): TypeScript interfaces created, all 'any' types eliminated

Please read:
1. thoughts/shared/plans/2025-10-09_12-15_project-dashboard-page_migration_plan.md (lines 1079-1309)
2. thoughts/shared/implementations/2025-10-09_RESUME-GUIDE_dashboard-page_phase-d.md

Execute Phase D: Cell Extraction (~4-5 hours)
- Extract utilities to utils/ (subcategory-transform.ts, export-handlers.ts)
- Create custom hooks (use-dashboard-data.ts, use-realtime-sync.ts)
- Extract section components (7 files, all ≤400 lines)
- Create thin orchestrator component (~50 lines)
- Create manifest.json and pipeline.yaml
```

---

## 📊 Current State (End of Phase C)

### Git Commits (3 phases completed)

| Phase | Commit | Files Changed | Status |
|-------|--------|---------------|--------|
| Phase A | `b933923` | API procedure created | ✅ COMMITTED |
| Phase B | `918067f` | Realtime fix complete | ✅ COMMITTED |
| Phase C | `3e7f204` | Type safety complete | ✅ COMMITTED |

### Files Created So Far

```
✅ packages/api/src/procedures/dashboard/get-project-details.procedure.ts
   - NEW tRPC procedure (45 lines)
   - Replaces direct Supabase query
   - Tested with curl ✓

✅ apps/web/components/cells/project-dashboard-page/types.ts
   - 8 TypeScript interfaces (144 lines)
   - 100% type coverage
   - Zero 'any' types remain

✅ Directory structure exists:
   components/cells/project-dashboard-page/
   ├── components/ (empty - Phase D will populate)
   ├── hooks/ (empty - Phase D will populate)
   ├── utils/ (empty - Phase D will populate)
   ├── __tests__/ (empty - Phase E will populate)
   └── types.ts ✅
```

### Current Dashboard Page State

**File**: `apps/web/app/projects/[id]/dashboard/page.tsx`  
**Lines**: 427 (still monolithic - Phase D will extract)  
**Type Safety**: 100% (all 'any' types removed)  
**Realtime**: Fixed (cost_breakdown subscription working)  
**tRPC Queries**: 4 queries (3 existing + 1 new getProjectDetails)

**Status**: Ready for extraction to Cell architecture

---

## 🎯 Phase D Overview (What You'll Do)

### Goal
Extract 427-line monolithic page into 13 focused files (all ≤400 lines)

### Duration
4-5 hours (COMPLEX phase - highest risk)

### Key Activities

**Step D1: Create Manifest & Pipeline** (~30 min)
- manifest.json with 11 behavioral assertions
- pipeline.yaml with 7 validation gates

**Step D2: Extract Utilities** (~45 min)
- `utils/subcategory-transform.ts` (~60 lines)
- `utils/export-handlers.ts` (~80 lines)

**Step D3: Create Custom Hooks** (~2 hours)
- `hooks/use-dashboard-data.ts` (~80 lines)
  - Consolidate all 4 tRPC queries
  - Apply memoization patterns
- `hooks/use-realtime-sync.ts` (~100 lines)
  - Realtime subscription logic
  - React Query invalidation

**Step D4: Extract Section Components** (~1.5 hours)
- `components/dashboard-header.tsx` (~80 lines)
- `components/kpi-section.tsx` (~40 lines)
- `components/pl-section.tsx` (~40 lines)
- `components/financial-matrix-section.tsx` (~40 lines)
- `components/timeline-section.tsx` (~40 lines)
- `components/charts-section.tsx` (~120 lines)
- `components/breakdown-section.tsx` (~50 lines)

**Step D5: Create Orchestrator** (~45 min)
- `component.tsx` (~50 lines)
  - Thin wrapper using hooks and sections
  - No business logic

**Step D6: Git Checkpoint** (~15 min)
- Atomic commit with all Cell files
- Verify all files ≤400 lines

---

## 🚨 Critical Patterns to Apply (Phase D)

### 1. Memoization (MANDATORY - Prevents Infinite Loops)

From `cell-development-checklist.md` lines 172-219:

```typescript
// ALWAYS memoize date ranges
const dateRange = useMemo(() => {
  const now = new Date()
  const from = new Date(now)
  from.setMonth(from.getMonth() - 6)
  from.setHours(0, 0, 0, 0)  // Normalize to prevent millisecond differences
  
  const to = new Date(now)
  to.setMonth(to.getMonth() + 6)
  to.setHours(23, 59, 59, 999)
  
  return { from, to }
}, [])  // Empty deps = computed once

// Use stable reference in queries
const { data } = trpc.dashboard.getProjectMetrics.useQuery({
  projectId,
  dateRange  // Stable reference prevents infinite re-renders
})
```

### 2. File Size Limits (ARCHITECTURAL MANDATE)

**M-CELL-3 Compliance**:
- ALL Cell files ≤400 lines
- NO god components
- Extract to helpers/utilities if approaching limit

**Verification**:
```bash
find components/cells/project-dashboard-page -name '*.tsx' -o -name '*.ts' | xargs wc -l | awk '$1 > 400'
# Should return NOTHING
```

### 3. Subcategory Transformation Optimization

**Current Problem** (lines 113-137): O(n⁴) nested loops run on EVERY render

**Solution**: Extract to utility + memoize

```typescript
// utils/subcategory-transform.ts
export function transformSubcategories(hierarchy: HierarchyNode[]): SubcategoryData[] {
  const result: SubcategoryData[] = []
  
  hierarchy.forEach(businessLine => {
    businessLine.children?.forEach(costLine => {
      costLine.children?.forEach(spendType => {
        spendType.children?.forEach(subCategory => {
          result.push({
            category: spendType.name,
            subcategory: subCategory.name,
            value: subCategory.actual,
            budget: subCategory.budget,
            percentage: subCategory.utilization
          })
        })
      })
    })
  })
  
  return result
}

// In component - memoize result
const subcategoryData = useMemo(
  () => transformSubcategories(breakdownData?.hierarchy ?? []),
  [breakdownData]  // Only recompute when breakdownData changes
)
```

---

## 📋 Manifest.json Structure (Phase D Step 1)

**Location**: `components/cells/project-dashboard-page/manifest.json`

**Required Fields** (from migration plan lines 426-583):

```json
{
  "id": "project-dashboard-page",
  "version": "1.0.0",
  "description": "Main project dashboard with budget tracking, P&L analysis, and realtime updates",
  
  "behavioralAssertions": [
    {
      "id": "BA-001",
      "requirement": "Dashboard MUST display project name and sub-business line in header",
      "validation": "Unit test: Mock getProjectDetails, verify header renders project.name and project.sub_business_line",
      "criticality": "high"
    },
    {
      "id": "BA-002",
      "requirement": "Dashboard MUST show loading skeleton while data fetches",
      "validation": "Unit test: Mock pending queries, verify DashboardSkeleton renders",
      "criticality": "medium"
    },
    {
      "id": "BA-003",
      "requirement": "Dashboard MUST display error alert if project not found",
      "validation": "Unit test: Mock NOT_FOUND error from getProjectDetails, verify Alert with 'Project Not Found' message",
      "criticality": "high"
    }
    // ... 8 more assertions (see migration plan lines 456-532)
  ],
  
  "dependencies": {
    "cells": [
      "kpi-card",
      "pl-command-center",
      "financial-control-matrix",
      "budget-timeline-chart"
    ],
    "api": [
      "trpc.dashboard.getProjectDetails",
      "trpc.dashboard.getProjectMetrics",
      "trpc.dashboard.getProjectCategoryBreakdown",
      "trpc.dashboard.getProjectHierarchicalBreakdown"
    ]
  }
}
```

**Minimum**: 3 behavioral assertions (M-CELL-4 mandate)  
**Planned**: 11 behavioral assertions ✅

---

## 🧪 Validation Checklist (Phase D Completion)

### File Size Compliance (M-CELL-3)

```bash
# Check all Cell files ≤400 lines
find components/cells/project-dashboard-page -name '*.tsx' -o -name '*.ts' | xargs wc -l

# Expected output - all files ≤400:
#   50 component.tsx
#   80 components/dashboard-header.tsx
#   40 components/kpi-section.tsx
#   ... (all ≤400)
```

### TypeScript Compilation

```bash
pnpm type-check
# Expected: Zero errors
```

### Build Success

```bash
pnpm build
# Expected: Production build succeeds
```

### Manifest Validation

```bash
# Verify ≥3 behavioral assertions
jq '.behavioralAssertions | length' components/cells/project-dashboard-page/manifest.json
# Expected: >= 3 (we have 11)
```

---

## 🎓 Key Reference Sections

### Migration Plan References

- **Phase D Full Specification**: Lines 1079-1309
- **Manifest Structure**: Lines 426-583
- **Pipeline Structure**: Lines 594-643
- **Memoization Patterns**: Lines 650-753
- **File Size Limits**: Lines 396-419

### Cell Development Checklist References

- **Memoization Rules**: Lines 172-219
- **Architecture Mandates**: Lines 252-327
- **Common Pitfalls**: Lines 417-459

---

## ⚠️ Known Risks (Phase D)

### High-Risk Activities

1. **File Size Violations**
   - Risk: Components exceed 400 lines
   - Mitigation: Extract aggressively, use utilities
   - Validation: Run wc -l after each component

2. **Infinite Render Loops**
   - Risk: Unmemoized objects cause infinite queries
   - Mitigation: Apply memoization patterns religiously
   - Validation: React DevTools Profiler (max 3-5 renders)

3. **Type Errors**
   - Risk: Component extraction breaks types
   - Mitigation: Run type-check frequently
   - Validation: Zero TypeScript errors before commit

### Rollback Triggers

If ANY of these occur, execute rollback:
- File size >400 lines (M-CELL-3 violation)
- TypeScript errors after 3 fix attempts
- Build fails
- Infinite render loops detected
- Can't complete extraction in 6 hours

---

## 📁 File Organization Reference

### Target Structure (End of Phase D)

```
components/cells/project-dashboard-page/
│
├── component.tsx                      # Main orchestrator (~50 lines) ✅
├── components/                        # Sub-components directory
│   ├── dashboard-header.tsx          # (~80 lines) ✅
│   ├── kpi-section.tsx               # (~40 lines) ✅
│   ├── pl-section.tsx                # (~40 lines) ✅
│   ├── financial-matrix-section.tsx  # (~40 lines) ✅
│   ├── timeline-section.tsx          # (~40 lines) ✅
│   ├── charts-section.tsx            # (~120 lines) ✅
│   └── breakdown-section.tsx         # (~50 lines) ✅
├── hooks/                             # Custom hooks directory
│   ├── use-dashboard-data.ts         # (~80 lines) ✅
│   └── use-realtime-sync.ts          # (~100 lines) ✅
├── utils/                             # Pure functions directory
│   ├── subcategory-transform.ts      # (~60 lines) ✅
│   └── export-handlers.ts            # (~80 lines) ✅
├── types.ts                           # ✅ ALREADY CREATED (Phase C)
├── manifest.json                      # 11 behavioral assertions ✅
├── pipeline.yaml                      # 7 validation gates ✅
└── __tests__/                         # (Phase E)
    └── component.test.tsx
```

**Total**: ~830 lines across 13 files  
**Average**: 64 lines/file  
**Maximum**: 120 lines (charts-section.tsx)  
**Status**: All ≤400 lines (M-CELL-3 compliant) ✅

---

## 🚀 Success Criteria (Phase D Complete)

- [ ] All 13 Cell files created
- [ ] All files ≤400 lines (verified with wc -l)
- [ ] manifest.json created with 11 behavioral assertions
- [ ] pipeline.yaml created with 7 validation gates
- [ ] TypeScript compilation succeeds (zero errors)
- [ ] Production build succeeds
- [ ] Memoization applied to all queries
- [ ] Git checkpoint created
- [ ] No infinite render loops (verified with profiler)

---

## 📞 Next Session Prompt (Copy This)

```
I'm resuming the project-dashboard-page migration at Phase D (Cell Extraction).

Phases A, B, C complete and committed:
- Phase A (b933923): API layer complete (getProjectDetails procedure)
- Phase B (918067f): Realtime fix complete (React Query invalidation)
- Phase C (3e7f204): Type safety complete (8 interfaces, zero 'any' types)

Please read:
1. thoughts/shared/implementations/2025-10-09_RESUME-GUIDE_dashboard-page_phase-d.md
2. thoughts/shared/plans/2025-10-09_12-15_project-dashboard-page_migration_plan.md (lines 1079-1309)

Execute Phase D: Cell Extraction
- Create manifest.json and pipeline.yaml
- Extract utilities (subcategory-transform.ts, export-handlers.ts)
- Create hooks (use-dashboard-data.ts, use-realtime-sync.ts)
- Extract section components (7 files, all ≤400 lines)
- Create thin orchestrator (~50 lines)
- Duration: ~4-5 hours
- Risk: HIGH (complex extraction)
```

---

**Ready for Phase D in next session! All context preserved. Good luck! 🚀**
