# Resume Guide: Forecast Wizard Extraction - Phase 3

**Quick Start Guide for Next Session**  
**Date**: 2025-10-05 00:15 UTC  
**Current State**: Phase 2 COMPLETE ✅  
**Next Phase**: Phase 3 - Step Components Extraction  
**Estimated Duration**: 5-6 hours (reduced from 8 due to Modify step already done)

---

## 🚀 Quick Resume (30 seconds)

### Current Progress
- ✅ **Phase 1 COMPLETE**: Foundation components extracted (4 files, 30 tests, commit `3b73269`)
- ✅ **Phase 2 COMPLETE**: Table decomposition + critical fixes (3 files, 42 tests, commit `78a358d`)
- ⏳ **Phase 3 READY**: Step components extraction
- 📊 **LOC**: 1,004 → 681 (32% reduction so far)

### What's Already Done
1. ✅ Generic wizard infrastructure (WizardShell, WizardProgress, useWizardNavigation)
2. ✅ Table decomposition (NewEntryForm, ForecastEditableTable, ChangeSummaryFooter)
3. ✅ **BudgetModifyStep already reduced**: 283 → 25 LOC (was part of Phase 2)
4. ✅ Critical fixes: zero-value prevention + exclude/include functionality
5. ✅ 100% test coverage maintained
6. ✅ All validations passing (types, build, tests, manual)

---

## 📋 Phase 3 Overview

### Goal
Extract individual **step components** from the main wizard to create clean, reusable, focused components.

### Files to Create
1. **BudgetReviewStep** (120 LOC) - **NEW**
2. ~~BudgetModifyStep~~ - **ALREADY DONE in Phase 2** (now 25 LOC) ✅
3. **ReasonStep** (80 LOC) - **NEW**
4. **PreviewStep** (150 LOC) - **NEW**
5. **ConfirmStep** (100 LOC) - **NEW**
6. **SuccessStep** (80 LOC) - **NEW**

**Note**: Only 5 components to create (Modify step was completed in Phase 2)

### Expected Outcome
- Main wizard: 681 LOC → ~200 LOC (**70% reduction**)
- 5 step directories with components, tests, and documentation
- Each step self-contained and reusable
- Zero functional changes (100% equivalence)

---

## 🔧 Step-by-Step Instructions

### Step 3.1: Create steps directory (5 min)
```bash
mkdir -p apps/web/components/forecast-wizard/steps
```

### Step 3.2: Extract BudgetReviewStep component (2 hours)

**Location**: `apps/web/components/forecast-wizard/steps/budget-review-step.tsx`

**Source**: Extract from forecast-wizard.tsx lines ~286-343 (review case)

**Purpose**: Read-only table showing current budget with totals

**Props Interface**:
```typescript
interface BudgetReviewStepProps {
  costs: CostBreakdown[]
  projectName: string
}
```

**Key Features**:
- Read-only table of current budget
- Total budget calculation
- Item count display
- Professional summary card

**Tests Required**:
- Displays all cost items correctly
- Shows correct total budget
- Shows correct item count
- Formatting is consistent

### Step 3.3: Create BudgetReviewStep tests (30 min)

**Location**: `apps/web/components/forecast-wizard/steps/__tests__/budget-review-step.test.tsx`

**Test Coverage**:
- ✅ Renders table with all entries
- ✅ Displays correct total budget
- ✅ Displays correct item count
- ✅ Currency formatting works
- ✅ Shows project name

### Step 3.4: Extract ReasonStep component (1.5 hours)

**Location**: `apps/web/components/forecast-wizard/steps/reason-step.tsx`

**Source**: Extract from forecast-wizard.tsx lines ~631-690 (add-reason case)

**Purpose**: Textarea for entering forecast reason with change summary

**Props Interface**:
```typescript
interface ReasonStepProps {
  reason: string
  onReasonChange: (value: string) => void
  changeSummary: {
    modifiedCount: number
    newEntriesCount: number
    excludedCount: number
    totalChange: number
    changePercentage: number
  }
}
```

**Key Features**:
- Textarea with 200+ character minimum
- Character count display
- Change summary preview
- Helpful placeholder text

**Tests Required**:
- Textarea updates on change
- Character count displays correctly
- Minimum length validation hint
- Change summary displays correctly

### Step 3.5: Create ReasonStep tests (30 min)

**Test Coverage**:
- ✅ Renders textarea
- ✅ Calls onReasonChange on input
- ✅ Shows character count
- ✅ Shows change summary with correct values
- ✅ Placeholder text present

### Step 3.6: Extract PreviewStep component (2 hours)

**Location**: `apps/web/components/forecast-wizard/steps/preview-step.tsx`

**Source**: Extract from forecast-wizard.tsx lines ~692-780+ (preview case)

**Purpose**: Show all changes before confirmation

**Props Interface**:
```typescript
interface PreviewStepProps {
  currentCosts: CostBreakdown[]
  forecastChanges: Record<string, number | null>
  newEntries: CostBreakdown[]
  reason: string
  totals: {
    currentTotal: number
    forecastTotal: number
    totalChange: number
    changePercentage: number
  }
}
```

**Key Features**:
- Modified items section with before/after values
- Excluded items section (grayed out)
- New items section
- Summary section with totals
- Reason display
- Color-coded changes (green/red)

**Tests Required**:
- Displays modified items correctly
- Shows excluded items with visual distinction
- Displays new items
- Shows reason
- Calculates totals correctly
- Color codes changes appropriately

### Step 3.7: Create PreviewStep tests (45 min)

**Test Coverage**:
- ✅ Renders all sections
- ✅ Modified items show before/after
- ✅ Excluded items shown distinctly
- ✅ New items displayed
- ✅ Totals calculated correctly
- ✅ Reason displayed
- ✅ Color coding works

### Step 3.8: Extract ConfirmStep component (1 hour)

**Location**: `apps/web/components/forecast-wizard/steps/confirm-step.tsx`

**Source**: Extract from forecast-wizard.tsx lines ~780-820+ (confirm case)

**Purpose**: Final confirmation with loading state

**Props Interface**:
```typescript
interface ConfirmStepProps {
  isSaving: boolean
  onConfirm: () => Promise<void>
  versionNumber: number
  totalChanges: number
}
```

**Key Features**:
- Confirmation message
- Version number display
- Save button with loading state
- Warning about irreversibility

**Tests Required**:
- Renders confirmation message
- Shows version number
- Save button works
- Loading state displays
- Disabled state during save

### Step 3.9: Create ConfirmStep tests (20 min)

**Test Coverage**:
- ✅ Renders confirmation UI
- ✅ Shows version number
- ✅ Calls onConfirm when clicked
- ✅ Shows loading state
- ✅ Disables button when saving

### Step 3.10: Extract SuccessStep component (30 min)

**Location**: `apps/web/components/forecast-wizard/steps/success-step.tsx`

**Source**: Create new success UI (currently just closes dialog)

**Purpose**: Success confirmation with actions

**Props Interface**:
```typescript
interface SuccessStepProps {
  versionNumber: number
  onClose: () => void
  onViewVersion: () => void
}
```

**Key Features**:
- Success message with checkmark
- Version number display
- "View Version" button
- "Close" button

**Tests Required**:
- Renders success message
- Shows version number
- Buttons call correct handlers

### Step 3.11: Create SuccessStep tests (20 min)

**Test Coverage**:
- ✅ Renders success UI
- ✅ Shows version number
- ✅ Calls onClose
- ✅ Calls onViewVersion

### Step 3.12: Refactor main wizard to use step components (1 hour)

**Changes to `forecast-wizard.tsx`**:
1. Import all step components
2. Replace switch cases with component rendering
3. Keep only orchestration logic (state, navigation, handlers)
4. **Verify**: Main wizard now ~200 LOC (down from 681)

**Example refactoring**:
```typescript
// Before (inline JSX):
case "review":
  return (
    <div className="space-y-4">
      <Alert>...</Alert>
      <div className="relative border rounded-md">
        <Table>...</Table>
      </div>
      <Card>...</Card>
    </div>
  )

// After (component composition):
case "review":
  return (
    <BudgetReviewStep
      costs={currentCosts}
      projectName={projectName}
    />
  )
```

### Step 3.13: Validation checkpoint (30 min)

**Automated**:
```bash
pnpm type-check    # Zero errors
pnpm build         # Success
pnpm test apps/web/components/forecast-wizard/steps/
```

**Manual** (CRITICAL):
1. Navigate through entire wizard
2. Verify each step displays correctly
3. Verify navigation works (Next/Back)
4. Verify data flows correctly between steps
5. Test full workflow: Review → Modify → Reason → Preview → Confirm → Success
6. Verify no console errors
7. Verify no visual regressions

### Step 3.14: Commit Phase 3 (5 min)

```bash
git add apps/web/components/forecast-wizard/
git commit -m "refactor(forecast-wizard): Phase 3 - Extract step components

- Extract BudgetReviewStep (120 LOC, reusable)
- Extract ReasonStep (80 LOC, reusable)
- Extract PreviewStep (150 LOC, reusable)
- Extract ConfirmStep (100 LOC, reusable)  
- Extract SuccessStep (80 LOC, reusable)
- Refactor main wizard: 681 LOC → 200 LOC (70% reduction)
- Maintain BudgetModifyStep composition from Phase 2
- Tests: All pass | Coverage: ≥80%
- Note: BudgetModifyStep already completed in Phase 2"
```

---

## 📊 Success Criteria

### Components Created (5 new)
- [ ] BudgetReviewStep created (120 LOC)
- [ ] ReasonStep created (80 LOC)
- [ ] PreviewStep created (150 LOC)
- [ ] ConfirmStep created (100 LOC)
- [ ] SuccessStep created (80 LOC)

### Tests & Validation
- [ ] All step tests pass (≥80% coverage per component)
- [ ] Build succeeds
- [ ] Type check passes
- [ ] Manual walkthrough successful

### LOC Reduction
- [ ] Main wizard: 681 → ~200 LOC (70% reduction)
- [ ] Total: 1,004 → ~450 LOC (55% cumulative reduction)

### Quality Gates
- [ ] Zero functional regressions
- [ ] All navigation flows work
- [ ] Data flows correctly between steps
- [ ] Loading states work
- [ ] Error handling preserved
- [ ] Atomic commit created
- [ ] User approval: "VALIDATED PHASE 3"

---

## 🔍 Key Files Reference

### Read These First
1. **Migration Plan**: `thoughts/shared/plans/2025-10-04_23-02_forecast-wizard-extraction_plan.md`
   - Lines 395-550: Phase 3 complete specifications
   
2. **Phase 2 Report**: `thoughts/shared/implementations/2025-10-05_00-10_forecast-wizard-extraction_phase2_complete.md`
   - Current state and context
   - Critical fixes implemented

3. **Source Component**: `apps/web/components/forecast-wizard.tsx`
   - Lines 269-343: Review step (extract to BudgetReviewStep)
   - Lines 345-630: Modify step (ALREADY extracted to components in Phase 2)
   - Lines 631-690: Reason step (extract to ReasonStep)
   - Lines 692-780: Preview step (extract to PreviewStep)
   - Lines 782-820: Confirm step (extract to ConfirmStep)
   - Success step: Create new

### Pattern References
- **Cell Development Checklist**: `docs/cell-development-checklist.md`
- **Phase 1 Components**: `apps/web/components/ui/wizard/` (reference for patterns)
- **Phase 2 Components**: `apps/web/components/forecast-wizard/components/` (reference for patterns)

---

## ⚠️ Critical Reminders

### State Ownership Rules (CRITICAL)
```typescript
// ✅ CORRECT - Parent state for shared data
const [forecastChanges, setForecastChanges] = useState<Record<string, number | null>>({})
const [localStagedEntries, setLocalStagedEntries] = useState<CostBreakdown[]>([])
const [forecastReason, setForecastReason] = useState("")

// ✅ CORRECT - Step receives props and callbacks
<ReasonStep
  reason={forecastReason}
  onReasonChange={setForecastReason}
  changeSummary={...}
/>

// ❌ WRONG - Don't duplicate state in step
// Don't create new useState in step for shared data
```

### Component Extraction Checklist
For EACH step component:
1. ✅ Identify all state used (which stays in parent, which moves to component)
2. ✅ Define clear props interface
3. ✅ Extract JSX to component file
4. ✅ Add imports for UI components
5. ✅ Create comprehensive tests
6. ✅ Verify type safety
7. ✅ Update parent to use component

### Validation Sequence
1. Extract component code
2. Create tests for component
3. Update parent to use component
4. TypeScript check
5. Run component tests
6. Run full build
7. Manual testing of that step
8. Move to next component
9. **Final**: Complete wizard walkthrough

---

## 🎯 Context for AI Agent

### What This Is
- **Component extraction** (refactoring), NOT a Cell migration
- Step-level decomposition for maintainability and reusability
- No tRPC layer changes (already complete from Phase 1)
- No edge function deployment needed
- Focus: separation of concerns, single responsibility

### What to Avoid
- DO NOT modify tRPC procedures (already complete)
- DO NOT create Cell structure (manifest, pipeline) for steps
- DO NOT update edge functions
- DO NOT change wizard state management
- DO NOT change navigation logic (handled by useWizardNavigation)

### What to Prioritize
1. Extract steps exactly as they exist (preserve logic)
2. Maintain prop interfaces consistency
3. Keep parent as orchestrator (state + navigation)
4. 100% test coverage pattern from Phase 1 & 2
5. Preserve functional equivalence (wizard works identically)

### Special Notes
- **BudgetModifyStep**: Already done in Phase 2! Currently 25 LOC using table components
- Keep that implementation, just ensure it's in its own step component file if needed
- Or reference it as-is in the switch statement

---

## 📈 Progress Tracker

**Overall Extraction**:
- Phase 1: ✅ COMPLETE (8 hours planned, ~2 hours actual)
- Phase 2: ✅ COMPLETE (10 hours planned, ~3 hours actual)
- Phase 3: ⏳ NEXT (8 hours planned, ~5 hours estimated)
- Phase 4: 🔲 Pending (4 hours)
- Phase 5: 🔲 Pending (4 hours)

**Total**: 34 hours estimated, ~40% complete after Phase 2

**LOC Reduction**:
- Phase 1: 1,004 → 949 LOC (5.5%)
- Phase 2: 949 → 681 LOC (28%)
- **Cumulative**: 1,004 → 681 LOC (32% reduction)
- Phase 3 target: 681 → ~200 wizard + ~250 steps = ~450 LOC total (additional 34% reduction)
- Final target: ~180 LOC wizard (82% total reduction)

**Components Created**:
- Phase 1: 4 components (wizard infrastructure)
- Phase 2: 3 components (table decomposition)
- Phase 3: 5 components (step extraction)
- **Total**: 12 reusable components by end of Phase 3

---

## 💡 Quick Commands

```bash
# Resume context
cd /home/iwahbi/dev/cost-management
git log --oneline | head -5
git show 78a358d

# Start Phase 3
mkdir -p apps/web/components/forecast-wizard/steps
mkdir -p apps/web/components/forecast-wizard/steps/__tests__

# Validation after each step extraction
pnpm type-check
pnpm build
pnpm test apps/web/components/forecast-wizard/steps/

# Validation after wizard refactoring
pnpm type-check
pnpm build  
pnpm test apps/web/components/forecast-wizard/

# Final commit
git add apps/web/components/forecast-wizard/
git commit -m "refactor(forecast-wizard): Phase 3 - Extract step components"
```

---

## 📝 Important Notes

### Phase 2 Achievements to Preserve
1. ✅ Zero-value validation (both new entries AND inline editing)
2. ✅ Exclude/Include functionality for existing entries
3. ✅ Enhanced change summary with excluded count
4. ✅ Backend support for null values (exclusions)

### Phase 3 Focus
- **Pure extraction**: Move existing code to step components
- **No new features**: Maintain 100% functional equivalence
- **Clean separation**: Each step is self-contained
- **Type safety**: Props interfaces prevent errors

### Integration Points
Each step component will:
- Receive props from parent orchestrator
- Call callbacks to update parent state
- Have NO direct access to wizard navigation (parent controls)
- Be testable in isolation

---

**Ready to Resume**: ✅  
**Checkpoint Preserved**: Phase 2 commit `78a358d`  
**Next Action**: Create steps directory and begin BudgetReviewStep extraction  

**Note**: BudgetModifyStep was already completed in Phase 2 as part of table decomposition! This reduces Phase 3 scope significantly.

**Good luck with Phase 3!** 🚀
