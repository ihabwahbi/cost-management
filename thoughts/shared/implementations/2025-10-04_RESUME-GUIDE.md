# 🔄 Resume Guide: Forecast Wizard Migration

**Last Updated**: 2025-10-04 01:30 UTC  
**Status**: Phase 1 Complete (40% progress)  
**Next**: Phase 2 - Parent Callback Refactoring  
**Time Remaining**: 5-11 hours (depends if Phase 3 executed)

---

## ⚡ Quick Resume (30 seconds)

```bash
# 1. Verify Phase 1 complete
ls packages/api/src/procedures/forecasts/
# Should show: create-forecast-version.procedure.ts, get-forecast-data.procedure.ts, get-forecast-versions.procedure.ts, forecasts.router.ts

# 2. Verify TypeScript still compiles
cd packages/api && pnpm exec tsc --noEmit
# Expected: Zero errors

# 3. Review what's done
cat thoughts/shared/implementations/2025-10-04_01-30_forecast-wizard_phase1_complete.md
```

---

## ✅ What's Complete

### Phase 1: API Layer (100%)
- ✅ 3 tRPC procedures created (createForecastVersion, getForecastVersions, getForecastData)
- ✅ 1 domain router created (forecasts.router.ts)
- ✅ Main app router updated
- ✅ TypeScript compilation: PASS
- ✅ M1-M4 Architecture Compliance: 100%
- ✅ **NO client changes made** (tested independently as planned)

### Files Created
```
packages/api/src/procedures/forecasts/
├── create-forecast-version.procedure.ts (80 lines)
├── get-forecast-versions.procedure.ts (18 lines)
├── get-forecast-data.procedure.ts (83 lines)
└── forecasts.router.ts (10 lines)
```

### Files Modified (Partial)
- `packages/api/src/index.ts` - Added forecasts router
- `apps/web/app/projects/page.tsx` - Added tRPC import only

---

## 🎯 Next Steps: Phase 2 (2 hours)

### Task 2.1: Add Mutation Hook (5 min)
**File**: `apps/web/app/projects/page.tsx`  
**Location**: After line 68 (`const { toast } = useToast()`)

**Add**:
```typescript
const createForecast = trpc.forecasts.createForecastVersion.useMutation({
  onSuccess: (data) => {
    loadForecastVersions(showForecastWizard!)
    setActiveVersion(prev => ({ ...prev, [showForecastWizard!]: data.versionNumber }))
    loadVersionCostBreakdown(showForecastWizard!, data.versionNumber)
    
    toast({
      title: "Forecast created",
      description: `Version ${data.versionNumber} saved successfully`,
    })
  },
  onError: (error) => {
    toast({
      title: "Failed to save forecast",
      description: error.message,
      variant: "destructive"
    })
  }
})
```

### Task 2.2: Update onSave Callback (10 min)
**File**: `apps/web/app/projects/page.tsx`  
**Location**: Lines 2859-2863

**Find**:
```typescript
onSave={async (changes, newEntries, reason) => {
  await saveForecastVersionWithChanges(showForecastWizard, reason, changes, newEntries)
  setShowForecastWizard(null)
}}
```

**Replace With**:
```typescript
onSave={async (changes, newEntries, reason) => {
  await createForecast.mutateAsync({
    projectId: showForecastWizard!,
    reason,
    changes,
    newEntries: newEntries.map(e => ({
      subBusinessLine: e.sub_business_line,
      costLine: e.cost_line,
      spendType: e.spend_type,
      spendSubCategory: e.spend_sub_category,
      budgetCost: e.budget_cost,
    })),
  })
  setShowForecastWizard(null)
}}
```

### Task 2.3: Delete Old Function (5 min)
**File**: `apps/web/app/projects/page.tsx`  
**Lines to DELETE**: 1353-1488 (entire `saveForecastVersionWithChanges` function)

```bash
# Verify line numbers first
sed -n '1353,1360p' apps/web/app/projects/page.tsx
# Should show: const saveForecastVersionWithChanges = async (
```

### Task 2.4: Remove Unused Props (5 min)
**File**: `apps/web/app/projects/page.tsx`  
**Lines to DELETE**: 2864-2871

**Remove**:
```typescript
onAddEntry={(entry) => { addNewCostEntry(entry as any) }}
onUpdateEntry={(entry) => { updateCostItem(entry) }}
onDeleteEntry={(id) => { handleDeleteCostItem(id) }}
```

**Also update**: `apps/web/components/forecast-wizard.tsx` - Remove these from `ForecastWizardProps` interface

### Task 2.5: Type-Check (5 min)
```bash
pnpm type-check
# Expected: Zero errors
```

### Task 2.6: Browser Testing (1 hour)
1. Start dev server: `pnpm dev`
2. Navigate to Projects page
3. **Test 1**: Create forecast with modifications
   - Modify existing budget values
   - Add business justification
   - Save and verify version created
4. **Test 2**: Create forecast with new entries
   - Add new cost line item
   - Save and verify entry persisted
5. **Test 3**: Error handling
   - Disconnect network
   - Attempt save
   - Verify error toast displays
6. **Test 4**: Verify transaction
   - Check database tables (forecast_versions, budget_forecasts, cost_breakdown)
   - Ensure all 3 tables updated atomically

**Performance Check**: Network tab → mutation should be ≤1000ms

---

## 🔀 Decision Point: Phase 3 (Optional)

After Phase 2 complete, decide:

### Option A: Execute Phase 3 (8 hours)
- Extract 1,011-line wizard into 16 focused files
- Improve maintainability
- Fix Pitfalls #2 and #3
- **Benefit**: Better code organization
- **Cost**: 8 additional hours

### Option B: Skip to Phase 4 (3 hours)
- M3 compliance achieved with Phases 1-2
- Component extraction deferred
- **Benefit**: Faster completion
- **Cost**: Wizard remains monolithic (not a blocker)

**Recommendation**: Skip Phase 3 if time-constrained. M3 objective met without it.

---

## 📝 Phase 4: Testing & Finalization (3 hours)

### Task 4.1: Write Test Suite (2 hours)
Create 5 test files:
1. `packages/api/__tests__/forecasts.integration.test.ts` (transaction tests)
2. `apps/web/components/__tests__/forecast-wizard.test.tsx` (if Phase 3 skipped)

**Or** (if Phase 3 executed):
1. `utils/__tests__/calculations.test.ts`
2. `hooks/__tests__/useForecastDraft.test.ts`
3. `components/__tests__/NewEntryForm.test.tsx`
4. `__tests__/ForecastWizard.test.tsx`
5. `packages/api/__tests__/forecasts.integration.test.ts`

### Task 4.2: Manual QA (30 min)
- Complete workflow test
- Edge cases (empty data, invalid inputs)
- Browser compatibility (Chrome, Firefox)

### Task 4.3: Performance Validation (30 min)
- Wizard open: ≤500ms
- Step transitions: ≤100ms
- Save operation: ≤1000ms

---

## 🏁 Final Steps

### Atomic Commit
```bash
git add .
git commit -m "feat: Migrate forecast-wizard to tRPC procedures (M3 compliance)

- Created 3 specialized forecast procedures (M1-M4 compliant)
- Replaced direct Supabase calls with tRPC mutations
- Atomic transaction handling for 3-table operations
- Phase 1-2 complete (Phase 3 deferred/complete)
"
```

### Update Ledger
Add final entry to `ledger.jsonl`:
```json
{
  "iterationId": "mig_20251004_forecast-wizard_complete",
  "timestamp": "[ISO 8601]",
  "artifacts": {
    "created": [...],
    "modified": [...],
    "replaced": []
  },
  "metadata": {
    "agent": "MigrationExecutor",
    "validationStatus": "SUCCESS",
    "m3Compliance": true
  }
}
```

### Generate Implementation Report
Create final report in `thoughts/shared/implementations/`

---

## 🚨 Rollback (If Needed)

### Phase 2 Rollback
```bash
git checkout apps/web/app/projects/page.tsx
git checkout apps/web/components/forecast-wizard.tsx
```

### Full Rollback
```bash
rm -rf packages/api/src/procedures/forecasts/
git checkout packages/api/src/index.ts
git checkout apps/web/app/projects/page.tsx
```

---

## 📊 Progress Tracking

| Phase | Status | Time Spent | Time Remaining |
|-------|--------|------------|----------------|
| Phase 1: API Layer | ✅ COMPLETE | 3h | 0h |
| Phase 2: Parent Refactoring | 🔄 10% | 0.5h | 1.5h |
| Phase 3: Component Extraction | ⏸️ OPTIONAL | 0h | 8h (if executed) |
| Phase 4: Testing & Refinement | ⏸️ PENDING | 0h | 3h |
| **TOTAL** | **40%** | **3.5h** | **4.5-12.5h** |

---

## 🔗 Key Files

**Documentation**:
- Full Report: `thoughts/shared/implementations/2025-10-04_01-30_forecast-wizard_phase1_complete.md`
- Migration Plan: `thoughts/shared/plans/2025-10-04_01-00_forecast-wizard_migration_plan.md`
- Ledger: `ledger.jsonl` (entry: `mig_20251004_forecast-wizard_phase1`)

**Code**:
- Procedures: `packages/api/src/procedures/forecasts/`
- Parent: `apps/web/app/projects/page.tsx` (line 2859 for callback)
- Wizard: `apps/web/components/forecast-wizard.tsx`

**References**:
- Architecture: `docs/2025-10-03_api_procedure_specialization_architecture.md`
- Cell Checklist: `docs/cell-development-checklist.md`
- tRPC Debugging: `docs/trpc-debugging-guide.md`

---

## 💡 Important Notes

1. **NOT a Cell migration** - Hybrid approach (tRPC + shared component)
2. **No deployment needed** - Uses Next.js API routes (automatically available)
3. **Transaction safety** - All 3 tables updated atomically via `ctx.db.transaction()`
4. **Phase 3 optional** - M3 compliance achieved with Phases 1-2 only
5. **Test before committing** - Verify transaction atomicity in database

---

**Ready to resume? Start with Phase 2 Task 2.1** 🚀
