# API Architecture Compliance Analysis - Forecast Wizard & tRPC Procedures

**Analysis ID**: `analysis_20251005_api-architecture-compliance`  
**Date**: 2025-10-05  
**Analyst**: MigrationArchitect  
**Trigger**: User question about tRPC procedure structure alignment

---

## Executive Summary

### Question
*"Are we adhering to the trpc procedures structure for the refactoring of this forecast wizard? If not, is this considered an issue and misalignment?"*

### Answer
**Forecast Wizard: ✅ FULLY COMPLIANT**  
**Overall API Architecture: ⚠️ PARTIALLY COMPLIANT (1 critical gap found)**

The forecast-wizard Cell is **perfectly aligned** with the Specialized Procedure Architecture. However, during the review, we discovered a **critical architectural violation** in the PO Mapping router that requires immediate attention.

---

## Detailed Findings

### 1. Forecast-Wizard API Alignment ✅

#### Procedure Structure
**Location**: `packages/api/src/procedures/forecasts/`

**Files**:
```
forecasts/
├── create-forecast-version.procedure.ts (131 LOC) ✅
├── get-forecast-data.procedure.ts (83 LOC) ✅
├── get-forecast-versions.procedure.ts (18 LOC) ✅
└── forecasts.router.ts (10 LOC) ✅
```

**Compliance Checklist**:
- ✅ One procedure per file (M-PROC-1)
- ✅ All procedures ≤200 LOC (largest: 131 LOC)
- ✅ Domain router aggregates procedures (10 LOC, well under 50 LOC limit)
- ✅ Router in `procedures/forecasts/` directory
- ✅ Proper naming convention: `[action]-[resource].procedure.ts`

**Example Structure**:
```typescript
// create-forecast-version.procedure.ts
export const createForecastVersion = publicProcedure
  .input(z.object({ /* ... */ }))
  .mutation(async ({ input, ctx }) => { /* ... */ })

// forecasts.router.ts
import { createForecastVersion } from './create-forecast-version.procedure'
import { getForecastVersions } from './get-forecast-versions.procedure'
import { getForecastData } from './get-forecast-data.procedure'

export const forecastsRouter = router({
  createForecastVersion,
  getForecastVersions,
  getForecastData,
})
```

#### Cell Integration
**Location**: `apps/web/components/cells/forecast-wizard/`

**Integration Pattern** (✅ CORRECT):
```typescript
// Parent page (projects/page.tsx) creates mutation
const createForecast = trpc.forecasts.createForecastVersion.useMutation({
  onSuccess: () => { /* ... */ }
})

// Passes as callback to Cell
<ForecastWizard
  onSave={async (changes, newEntries, reason) => {
    await createForecast.mutateAsync({
      projectId,
      changes,
      newEntries,
      reason,
    })
  }}
/>

// Cell component.tsx (does NOT directly call tRPC)
export function ForecastWizard({ onSave, ... }) {
  const handleSave = async () => {
    await onSave(forecastChanges, localStagedEntries, forecastReason)
  }
}
```

**Why This is Correct**:
1. Cell remains **presentation-focused** (no direct API coupling)
2. Parent controls **data fetching** (separation of concerns)
3. Cell is **reusable** (can be used with different data sources)
4. Follows **unidirectional data flow** (React best practice)

**Verdict**: ✅ **PERFECT ALIGNMENT** with Specialized Procedure Architecture

---

### 2. Overall API Architecture Status ⚠️

#### Compliant Routers ✅

**Dashboard Router** (GOLD STANDARD):
```
dashboard/
├── get-kpi-metrics.procedure.ts (73 LOC) ✅
├── get-pl-metrics.procedure.ts (109 LOC) ✅
├── get-pl-timeline.procedure.ts (125 LOC) ✅
├── get-promise-dates.procedure.ts (82 LOC) ✅
├── get-timeline-budget.procedure.ts (122 LOC) ✅
├── get-financial-control-metrics.procedure.ts (150 LOC) ✅
├── get-main-metrics.procedure.ts (91 LOC) ✅
├── get-recent-activity.procedure.ts (77 LOC) ✅
├── get-category-breakdown.procedure.ts (58 LOC) ✅
├── get-timeline-data.procedure.ts (67 LOC) ✅
└── dashboard.router.ts (43 LOC) ✅

Total: 10 procedures, largest 150 LOC (25% under limit)
```

**Forecasts Router** (COMPLIANT):
```
forecasts/
├── create-forecast-version.procedure.ts (131 LOC) ✅
├── get-forecast-data.procedure.ts (83 LOC) ✅
├── get-forecast-versions.procedure.ts (18 LOC) ✅
└── forecasts.router.ts (10 LOC) ✅

Total: 3 procedures, largest 131 LOC (34% under limit)
```

#### Non-Compliant Router ❌

**PO Mapping Router** (CRITICAL VIOLATION):
```
routers/
└── po-mapping.ts (363 LOC) ❌ MONOLITHIC

Issues:
1. ❌ 10 procedures defined INLINE (not in separate files)
2. ❌ 363 LOC (81% OVER 200 LOC limit)
3. ❌ Located in routers/ directory (not procedures/)
4. ❌ Violates M-PROC-1 (one procedure per file)
5. ❌ Violates router complexity limit (50 LOC max)
```

**Structure** (INCORRECT):
```typescript
// routers/po-mapping.ts (363 LOC - MONOLITHIC)
export const poMappingRouter = router({
  getProjects: publicProcedure
    .input(z.void())
    .output(/* ... */)
    .query(async ({ ctx }) => { /* 30+ LOC */ }),
  
  getCostBreakdown: publicProcedure
    .input(z.object({ /* ... */ }))
    .query(async ({ ctx }) => { /* 40+ LOC */ }),
  
  // ... 8 more procedures inline (VIOLATION)
})
```

**Expected Structure** (CORRECT):
```
procedures/po-mapping/
├── get-projects.procedure.ts (~50 LOC)
├── get-cost-breakdown.procedure.ts (~60 LOC)
├── get-po-mappings.procedure.ts (~50 LOC)
├── create-po-mapping.procedure.ts (~40 LOC)
├── update-po-mapping.procedure.ts (~45 LOC)
├── delete-po-mapping.procedure.ts (~30 LOC)
├── get-po-details.procedure.ts (~35 LOC)
├── get-po-line-items.procedure.ts (~30 LOC)
├── bulk-update-mappings.procedure.ts (~50 LOC)
├── validate-mapping.procedure.ts (~30 LOC)
└── po-mapping.router.ts (~20 LOC)

Total: 10 procedures, all under 60 LOC
```

---

## Impact Assessment

### Current State

| Router | Location | LOC | Procedures | Compliance |
|--------|----------|-----|------------|------------|
| Dashboard | procedures/dashboard/ | 43 (router) | 10 (specialized) | ✅ COMPLIANT |
| Forecasts | procedures/forecasts/ | 10 (router) | 3 (specialized) | ✅ COMPLIANT |
| **PO Mapping** | **routers/** | **363 (monolithic)** | **10 (inline)** | ❌ **NON-COMPLIANT** |

### Risk Analysis

**PO Mapping Violations**:

1. **Maintainability Risk**: ⚠️ HIGH
   - 363 LOC file difficult to maintain
   - Changes require editing large file
   - Merge conflicts likely
   - Hard for AI agents to understand

2. **Architecture Drift**: ⚠️ HIGH
   - Sets bad precedent for future code
   - Violates documented architecture mandates
   - Inconsistent with dashboard/forecasts patterns

3. **Testing Challenges**: ⚠️ MEDIUM
   - Procedures cannot be tested in isolation
   - Coupling makes unit testing difficult

4. **Reusability**: ⚠️ MEDIUM
   - Procedures cannot be imported individually
   - Difficult to share logic across domains

### Code Quality Metrics

**Compliant Routers** (Dashboard + Forecasts):
- Average procedure size: **85 LOC**
- Largest procedure: **150 LOC** (25% under limit)
- Router complexity: **10-43 LOC** (well under 50 LOC limit)
- Test coverage: **Easy to test** (isolated procedures)

**Non-Compliant Router** (PO Mapping):
- Monolithic file: **363 LOC** (81% over limit)
- Average procedure size: **~35 LOC** (inline, hard to measure)
- Router complexity: **363 LOC** (626% over limit!)
- Test coverage: **Difficult** (tightly coupled)

---

## Recommendations

### Immediate Action Required

**Priority 1: Migrate PO Mapping Router** (CRITICAL)

**Effort**: 4-6 hours  
**Impact**: HIGH (architectural compliance)  
**Urgency**: MEDIUM (functional but non-compliant)

**Migration Steps**:
1. Create `packages/api/src/procedures/po-mapping/` directory
2. Extract 10 procedures to individual files:
   - `get-projects.procedure.ts`
   - `get-cost-breakdown.procedure.ts`
   - `get-po-mappings.procedure.ts`
   - `create-po-mapping.procedure.ts`
   - `update-po-mapping.procedure.ts`
   - `delete-po-mapping.procedure.ts`
   - `get-po-details.procedure.ts`
   - `get-po-line-items.procedure.ts`
   - `bulk-update-mappings.procedure.ts`
   - `validate-mapping.procedure.ts`
3. Create `po-mapping.router.ts` (aggregate imports)
4. Update main `appRouter` to import from new location
5. Delete `routers/po-mapping.ts`
6. Verify all tests pass

**Expected Outcome**:
- 363 LOC → 10 files of ~30-60 LOC each
- Router: ~20 LOC (95% reduction)
- 100% architectural compliance

### Secondary Actions

**Priority 2: Remove Legacy Routers Directory**

After PO Mapping migration:
```bash
# Should only contain test.ts (1395 LOC - also needs review)
rm -rf packages/api/src/routers/
```

**Priority 3: Add Architecture Validation**

Create pre-commit hook to enforce:
- No procedure files >200 LOC
- No router files >50 LOC
- All procedures in `procedures/` directory
- One procedure per file

**Priority 4: Document Migration**

Update `docs/2025-10-03_api_procedure_specialization_architecture.md` with:
- PO Mapping migration completion
- Lessons learned
- Enforcement mechanisms

---

## Forecast Wizard Specific Answers

### Q1: Is forecast-wizard adhering to tRPC procedure structure?
**A: ✅ YES - PERFECT ALIGNMENT**

The forecast-wizard uses the `forecasts.createForecastVersion` procedure which:
- Lives in a specialized procedure file (131 LOC)
- Is aggregated by the forecasts domain router (10 LOC)
- Follows all architectural mandates (M-PROC-1 through M-PROC-4)

### Q2: How does the Cell integrate with tRPC?
**A: ✅ CORRECTLY - SEPARATION OF CONCERNS**

Pattern used:
1. Parent page creates `useMutation()` hook
2. Passes mutation function as `onSave` prop to Cell
3. Cell remains presentation-focused (no direct tRPC imports)
4. Maintains reusability and testability

This is the **recommended pattern** for Cell-tRPC integration.

### Q3: Are there any gaps for forecast-wizard?
**A: ❌ NO GAPS**

The forecast-wizard extraction (Phases 1-3.5) is **architecturally sound**:
- Cell structure: ✅ Compliant (M-CELL-1 to M-CELL-4)
- API procedures: ✅ Specialized architecture
- Integration pattern: ✅ Best practice
- Test coverage: ✅ Comprehensive (44 tests)

Phases 4-5 (hooks/utilities extraction) do NOT touch tRPC procedures - they only optimize the Cell component itself.

### Q4: Should we change anything for Phases 4-5?
**A: ❌ NO CHANGES NEEDED**

The Phase 4-5 plan is correct as-is:
- Extracts UI-layer utilities (useForecastCalculations)
- Extracts UI-layer hooks (useDraftPersistence)
- Does NOT modify API procedures (already compliant)
- Maintains separation between Cell and API layers

---

## Comparison: Forecast Wizard vs. PO Mapping

| Aspect | Forecast Wizard | PO Mapping |
|--------|----------------|------------|
| **Procedure Structure** | ✅ Specialized (3 files) | ❌ Monolithic (363 LOC) |
| **Router Complexity** | ✅ 10 LOC | ❌ 363 LOC (626% over) |
| **Directory Location** | ✅ procedures/forecasts/ | ❌ routers/ (legacy) |
| **Largest Procedure** | ✅ 131 LOC (34% under) | ❌ Unknown (inline) |
| **Cell Integration** | ✅ Separation of concerns | N/A (no Cell yet) |
| **Architectural Compliance** | ✅ 100% | ❌ 0% |
| **Recommended Action** | ✅ Continue as planned | ⚠️ Migrate immediately |

---

## Conclusion

### Forecast Wizard Verdict
**✅ FULLY COMPLIANT - NO ISSUES**

The forecast-wizard refactoring is a **model example** of proper API architecture:
- Specialized procedure files (all under 200 LOC)
- Clean domain router (10 LOC)
- Proper Cell integration (separation of concerns)
- Comprehensive testing (44 tests)

**No changes needed** - proceed with Phases 4-5 as planned.

### Overall API Verdict
**⚠️ PARTIALLY COMPLIANT - 1 CRITICAL GAP**

**Compliant**:
- Dashboard router (10 procedures, specialized) ✅
- Forecasts router (3 procedures, specialized) ✅

**Non-Compliant**:
- PO Mapping router (10 procedures, monolithic) ❌

**Action Required**: Migrate PO Mapping router to specialized architecture (4-6 hours effort).

### Next Steps

**For Forecast Wizard** (CONTINUE):
1. ✅ No API changes needed
2. ✅ Proceed with Phase 4 (extract hooks/utilities)
3. ✅ Proceed with Phase 5 (testing/validation)

**For Overall Architecture** (ADDRESS GAP):
1. ⚠️ Create migration plan for PO Mapping router
2. ⚠️ Execute migration (4-6 hours)
3. ⚠️ Add architectural validation hooks
4. ⚠️ Document completion

---

## References

- **API Architecture Doc**: `docs/2025-10-03_api_procedure_specialization_architecture.md`
- **Forecast Router**: `packages/api/src/procedures/forecasts/`
- **Dashboard Router**: `packages/api/src/procedures/dashboard/`
- **PO Mapping Router (non-compliant)**: `packages/api/src/routers/po-mapping.ts`
- **Forecast Wizard Cell**: `apps/web/components/cells/forecast-wizard/`
- **Phase 4-5 Plan**: `thoughts/shared/plans/2025-10-05_forecast-wizard-phases-4-5_plan.md`

---

**Analysis Complete** ✅  
**Analyst**: MigrationArchitect  
**Date**: 2025-10-05  
**Verdict**: Forecast Wizard = COMPLIANT | Overall API = 1 Critical Gap Found
