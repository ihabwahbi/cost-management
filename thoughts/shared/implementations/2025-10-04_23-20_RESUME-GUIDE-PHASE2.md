# Resume Guide: Forecast Wizard Extraction - Phase 2

**Quick Start Guide for Next Session**  
**Date**: 2025-10-04 23:20 UTC  
**Current State**: Phase 1 COMPLETE ✅  
**Next Phase**: Phase 2 - Table Decomposition  
**Estimated Duration**: 10 hours

---

## 🚀 Quick Resume (30 seconds)

### Current Progress
- ✅ **Phase 1 COMPLETE**: Foundation components extracted (4 files, 30 tests, all passing)
- ✅ **Git Commit**: `3b73269` - atomic, tested, validated
- ✅ **User Approval**: Manual validation passed
- ⏳ **Phase 2 READY**: Table decomposition with Pitfall #2 fix

### What's Already Done
1. Generic wizard infrastructure (WizardShell, WizardProgress, useWizardNavigation)
2. forecast-wizard.tsx reduced from 1,004 → 949 LOC (5.5%)
3. 100% test coverage on extracted components
4. All validations passing (types, build, tests, manual)

---

## 📋 Phase 2 Overview

### Goal
Break down the **283-line god component** (Modify Step) into 3 focused, reusable table components.

### Files to Create
1. **NewEntryForm** (115 LOC) + **Pitfall #2 Fix**
2. **ForecastEditableTable** (120 LOC)
3. **ChangeSummaryFooter** (40 LOC)

### Expected Outcome
- God component: 283 LOC → 80 LOC (**72% reduction**)
- 3 state variables moved to components
- Zero-value budget entries **blocked** (data quality fix)

---

## 🔧 Step-by-Step Instructions

### Step 2.1: Create components directory (5 min)
```bash
mkdir -p apps/web/components/forecast-wizard/components
```

### Step 2.2: Extract NewEntryForm component (3 hours)

**Location**: `apps/web/components/forecast-wizard/components/new-entry-form.tsx`

**Source**: Extract from forecast-wizard.tsx lines ~404-517 (add new entry dialog)

**CRITICAL - Pitfall #2 Fix**:
```typescript
// ✅ CORRECT - Explicit positive number validation
if (
  formData.cost_line &&
  formData.spend_type &&
  formData.spend_sub_category &&
  formData.budget_cost !== undefined &&
  formData.budget_cost > 0  // ← Prevents zero-value entries
) {
  // Submit entry
}
```

**State to Extract**:
- `addingNewEntry` → `isOpen` (component-local)
- `newEntry` → `formData` (component-local)

**Props Interface**:
```typescript
interface NewEntryFormProps {
  onSubmit: (entry: CostBreakdown) => void
  options: {
    costLines: string[]
    spendTypes: string[]
    subCategories: string[]
  }
}
```

### Step 2.3: Create NewEntryForm tests (1 hour)

**Location**: `apps/web/components/forecast-wizard/components/__tests__/new-entry-form.test.tsx`

**CRITICAL Tests**:
- ✅ BA-004: New entry validation
- ✅ Form opens/closes
- ✅ Can submit with valid data
- ✅ **PITFALL #2 TEST**: Cannot submit with budget_cost = 0
- ✅ Cannot submit with missing required fields
- ✅ Form resets after submission
- ✅ Temporary ID generated

### Step 2.4: Extract ForecastEditableTable component (4 hours)

**Location**: `apps/web/components/forecast-wizard/components/forecast-editable-table.tsx`

**Source**: Extract from forecast-wizard.tsx lines ~520-634 (editable table)

**State to Extract**:
- `editingItem` → component-local state

**Props Interface**:
```typescript
interface ForecastEditableTableProps {
  entries: CostBreakdown[]
  forecastChanges: Record<string, number>
  onValueChange: (id: string, newValue: number) => void
  onResetChange: (id: string) => void
  onDeleteEntry: (id: string) => void
}
```

**Key Features**:
- Inline editing on click (autofocus, Enter/Blur handlers)
- Modified badge for changed entries
- New badge for temp entries
- Reset button for modified entries
- Delete button for new entries

### Step 2.5: Create ForecastEditableTable tests (1 hour)

**Test Coverage**:
- ✅ BA-003: Modified items tracking
- ✅ BA-012: Inline edit mode
- ✅ Click value activates edit mode
- ✅ Enter/Blur exits edit mode
- ✅ Modified badge appears
- ✅ New badge appears for temp IDs
- ✅ Reset button works
- ✅ Delete button works

### Step 2.6: Extract ChangeSummaryFooter component (30 min)

**Location**: `apps/web/components/forecast-wizard/components/change-summary-footer.tsx`

**Source**: Extract from forecast-wizard.tsx lines ~638-660 (summary footer)

**Props Interface**:
```typescript
interface ChangeSummaryFooterProps {
  modifiedCount: number
  newEntriesCount: number
  totalChange: number
  changePercentage: number
}
```

### Step 2.7: Create ChangeSummaryFooter tests (15 min)

**Test Coverage**:
- Displays correct counts
- Displays formatted currency
- Color codes percentage (red/green)

### Step 2.8: Refactor BudgetModifyStep in forecast-wizard.tsx (30 min)

**Changes**:
1. Import NewEntryForm, ForecastEditableTable, ChangeSummaryFooter
2. Replace inline JSX with component composition
3. Pass appropriate props and callbacks
4. Remove component-local state (moved to extracted components)
5. **Verify**: Modify Step now ~80 LOC (down from 283)

### Step 2.9: Validation checkpoint (30 min)

**Automated**:
```bash
pnpm type-check    # Zero errors
pnpm build         # Success
pnpm test apps/web/components/forecast-wizard/components/
```

**Manual** (CRITICAL):
1. Navigate to Modify step
2. Verify inline editing works
3. Verify new entry form works
4. **✅ PITFALL #2 TEST**: Try adding entry with $0 → verify BLOCKED
5. Verify change summary updates

### Step 2.10: Commit Phase 2 (5 min)

```bash
git add apps/web/components/forecast-wizard/
git commit -m "refactor(forecast-wizard): Phase 2 - Extract table decomposition components

- Extract NewEntryForm (115 LOC, reusable)
  ✅ FIX PITFALL #2: Prevent zero-value budget entries
- Extract ForecastEditableTable (120 LOC, reusable for budget tables)
- Extract ChangeSummaryFooter (40 LOC)
- Refactor BudgetModifyStep: 283 LOC → 80 LOC (72% reduction)
- Extract state: editingItem, isOpen, formData to components
- Tests: All pass | Coverage: ≥80%"
```

---

## 📊 Success Criteria

- [ ] NewEntryForm created with zero-value validation
- [ ] ForecastEditableTable created with inline editing
- [ ] ChangeSummaryFooter created
- [ ] All tests pass (≥80% coverage)
- [ ] Build succeeds
- [ ] Type check passes
- [ ] God component reduced: 283 → 80 LOC
- [ ] Manual validation: inline editing works, zero-value blocked
- [ ] Atomic commit created
- [ ] User approval: "VALIDATED PHASE 2"

---

## 🔍 Key Files Reference

### Read These First
1. **Migration Plan**: `thoughts/shared/plans/2025-10-04_23-02_forecast-wizard-extraction_plan.md`
   - Lines 292-394: Phase 2 complete specifications
   
2. **Phase 1 Report**: `thoughts/shared/implementations/2025-10-04_23-20_forecast-wizard-extraction_phase1_complete.md`
   - Current state and context

3. **Source Component**: `apps/web/components/forecast-wizard.tsx`
   - Lines 404-517: New entry form (extract to NewEntryForm)
   - Lines 520-634: Editable table (extract to ForecastEditableTable)
   - Lines 638-660: Summary footer (extract to ChangeSummaryFooter)

### Pattern References
- **Cell Development Checklist**: `docs/cell-development-checklist.md`
- **tRPC Debugging Guide**: `docs/trpc-debugging-guide.md`

---

## ⚠️ Critical Reminders

### PITFALL #2 FIX (MANDATORY)
```typescript
// ❌ WRONG - Allows zero values
if (formData.budget_cost) { /* submit */ }

// ✅ CORRECT - Explicit positive check
if (formData.budget_cost !== undefined && formData.budget_cost > 0) {
  /* submit */
}
```

### State Extraction Rules
1. **Component-local state**: editingItem, isOpen, formData → Extract to components
2. **Business state**: forecastChanges, localStagedEntries → Keep in parent
3. **Never pollute parent with UI state**

### Validation Sequence
1. TypeScript check
2. Build
3. Unit tests
4. **Manual test** (inline edit, new entry, zero-value block)
5. User approval gate

---

## 🎯 Context for AI Agent

### What This Is
- **Component extraction** (refactoring), NOT a Cell migration
- tRPC layer already complete (no data layer work)
- No edge function deployment needed
- Focus: decomposition, reusability, pitfall fixes

### What to Avoid
- DO NOT modify tRPC procedures
- DO NOT create Cell structure (manifest, pipeline)
- DO NOT update edge functions
- DO NOT change parent props interface

### What to Prioritize
1. Extract components exactly as specified in plan
2. Implement Pitfall #2 fix (zero-value validation)
3. Maintain 100% test coverage pattern from Phase 1
4. Preserve functional equivalence (wizard works identically)

---

## 📈 Progress Tracker

**Overall Extraction**:
- Phase 1: ✅ COMPLETE (8 hours planned, ~2 hours actual)
- Phase 2: ⏳ NEXT (10 hours planned)
- Phase 3: 🔲 Pending (8 hours)
- Phase 4: 🔲 Pending (4 hours)
- Phase 5: 🔲 Pending (4 hours)

**Total**: 34 hours estimated, ~25% complete

**LOC Reduction**:
- Current: 1,004 → 949 LOC (5.5%)
- Phase 2 target: 949 → ~670 LOC (additional 29% reduction)
- Final target: ~180 LOC (82% total reduction)

---

## 💡 Quick Commands

```bash
# Resume context
cd /home/iwahbi/dev/cost-management
git log --oneline | head -5
git show 3b73269

# Start Phase 2
mkdir -p apps/web/components/forecast-wizard/components

# Validation after extraction
pnpm type-check
pnpm build
pnpm test apps/web/components/forecast-wizard/components/

# Commit when complete
git add apps/web/components/forecast-wizard/
git commit -m "refactor(forecast-wizard): Phase 2 - Extract table decomposition components"
```

---

**Ready to Resume**: ✅  
**Checkpoint Preserved**: Phase 1 commit `3b73269`  
**Next Action**: Create components directory and begin NewEntryForm extraction  

**Good luck with Phase 2!** 🚀
