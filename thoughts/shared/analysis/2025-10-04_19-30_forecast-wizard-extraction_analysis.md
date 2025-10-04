# Forecast Wizard Component Extraction Analysis

**Analysis ID**: `analysis_20251004_forecast-wizard-extraction`  
**Timestamp**: 2025-10-04 19:30 UTC  
**Agent**: MigrationAnalyst  
**Workflow Phase**: Phase 2: Migration Analysis  
**Target**: Component Extraction (Skipped Phase 3 from original migration)  
**Enhancement**: ✅ ULTRATHINK Applied

---

## Executive Summary

### Mission

Analyze the **forecast-wizard.tsx** component (1,005 lines) for component extraction opportunities to create a highly reliable, maintainable architecture for AI agents. This analysis addresses the **skipped Phase 3** from the original migration plan, which focused on breaking down the monolithic wizard into smaller, focused components.

### Current State

**Component**: `apps/web/components/forecast-wizard.tsx`  
**Size**: 1,005 lines of code  
**Complexity**: 8/10 (High - God Component)  
**tRPC Migration**: ✅ Complete (Phases 1-2)  
**Component Extraction**: ❌ Not Started (Phase 3 was skipped)

### Key Findings

1. **Monolithic Structure**: Single file contains wizard orchestration, 5 distinct UI views, form handling, calculations, and state management
2. **High Extractability**: 49% of code (490 lines) can be extracted to reusable components and hooks
3. **8 State Variables**: Moderate coupling with opportunities for better separation
4. **No Test Coverage**: 0% coverage - critical gap for extraction confidence
5. **Type Duplication**: `CostBreakdown` interface defined in 3+ locations
6. **16 Extractable Components**: Clear boundaries identified for splitting

### Recommendations

**Priority**: 🔴 **PROCEED** with phased extraction strategy  
**Strategy**: 5-phase incremental approach over 2 weeks  
**Risk Level**: LOW-MEDIUM (managed via phased approach)  
**ROI**: HIGH (1,500-2,500 LOC saved across future wizards)

---

## Component Analysis

### Current Structure

```
forecast-wizard.tsx (1,005 LOC)
├── Imports & Types                     [59 lines]
├── Constants (OPTIONS)                  [28 lines]
├── State Management (8 useState)        [18 lines]
├── Effects (3 useEffect)                [39 lines]
├── Pure Functions (9 functions)         [86 lines]
├── Event Handlers (5 handlers)          [97 lines]
├── Step Rendering (renderStepContent)  [616 lines]
│   ├── Review Step                     [60 lines]
│   ├── Modify Step                    [283 lines] ⚠️ TOO LARGE
│   ├── Add Reason Step                 [59 lines]
│   ├── Preview Step                   [148 lines]
│   └── Confirm Step                    [53 lines]
└── Main Render (Dialog wrapper)         [68 lines]
```

### Complexity Hotspots

| Section | Lines | Complexity | Extract Priority |
|---------|-------|------------|------------------|
| **Modify Step** | 283 | 🔴 CRITICAL | HIGHEST |
| Preview Step | 148 | 🟡 High | HIGH |
| Review Step | 60 | 🟢 Medium | MEDIUM |
| Pure Functions | 86 | 🟢 Low | HIGH (utilities) |
| Event Handlers | 97 | 🟡 Medium | MEDIUM |
| Dialog Wrapper | 68 | 🟢 Low | LOW |

**Critical Issue**: Modify Step (lines 379-663) is a 283-line **god component** that needs immediate decomposition into 3 sub-components.

---

## Extracted Components Architecture

### Target Directory Structure

```
apps/web/
├── components/
│   ├── ui/
│   │   ├── wizard/
│   │   │   ├── wizard-shell.tsx                  [150 LOC] ⭐⭐⭐⭐⭐
│   │   │   ├── wizard-progress.tsx               [80 LOC]  ⭐⭐⭐⭐⭐
│   │   │   ├── reason-entry-step.tsx             [80 LOC]  ⭐⭐⭐⭐⭐
│   │   │   ├── confirmation-step.tsx             [90 LOC]  ⭐⭐⭐⭐⭐
│   │   │   └── types.ts                          [30 LOC]
│   │   │
│   │   └── change-comparison-card.tsx            [70 LOC]  ⭐⭐⭐⭐
│   │
│   ├── forecast-wizard/
│   │   ├── forecast-wizard.tsx                   [180 LOC] ⬅️ Orchestrator
│   │   ├── steps/
│   │   │   ├── budget-review-step.tsx            [120 LOC]
│   │   │   ├── budget-modify-step.tsx            [80 LOC]
│   │   │   └── change-preview-step.tsx           [220 LOC]
│   │   │
│   │   └── components/
│   │       ├── budget-summary-card.tsx           [40 LOC]
│   │       ├── new-entry-form.tsx                [115 LOC] ⭐⭐⭐⭐
│   │       ├── forecast-editable-table.tsx       [120 LOC] ⭐⭐⭐⭐
│   │       └── change-summary-footer.tsx         [40 LOC]
│   │
│   └── inline-edit.tsx                           [125 LOC] ✅ Already exists
│
├── hooks/
│   ├── use-forecast-calculations.ts              [60 LOC]  ⭐⭐⭐
│   ├── use-draft-persistence.ts                  [50 LOC]  ⭐⭐⭐⭐
│   └── use-wizard-navigation.ts                  [50 LOC]  ⭐⭐⭐⭐⭐
│
└── lib/
    └── budget-utils.ts                           [50 LOC]  ⭐⭐⭐⭐
```

**Total Files**: 19 files (vs. 1 monolithic file)  
**Average File Size**: 68 LOC (vs. 1,005 LOC)  
**Max File Size**: 220 LOC (ChangePreviewStep)  
**Reusability Score**: 10/19 components marked as highly reusable (⭐⭐⭐⭐+)

---

## State Management Analysis

### Current State Variables (8 total)

| Variable | Type | Scope | Consumers | Coupling | Extract Action |
|----------|------|-------|-----------|----------|----------------|
| `currentStep` | WizardStep | Navigation | 4+ | HIGH | → useWizardNavigation |
| `forecastChanges` | Record<string, number> | Business | 5+ | HIGH | Keep (core state) |
| `localStagedEntries` | CostBreakdown[] | Business | 5+ | HIGH | Keep (core state) |
| `forecastReason` | string | Business | 3 | MEDIUM | Keep (core state) |
| `isSaving` | boolean | UI | 2 | LOW | Keep (async flag) |
| `editingItem` | string \| null | UI | 2 | MEDIUM | → ForecastEditableTable |
| `addingNewEntry` | boolean | UI | 2 | LOW | → NewEntryForm |
| `newEntry` | Partial<CostBreakdown> | Form | 1 | LOW | → NewEntryForm |

### State Distribution After Extraction

**Parent Component** (forecast-wizard.tsx):
- Business State: `forecastChanges`, `localStagedEntries`, `forecastReason`, `isSaving`
- **4 state variables** (down from 8 - 50% reduction)

**useWizardNavigation Hook**:
- Navigation State: `currentStep` + derived values
- **1 encapsulated state variable**

**Component-Local State** (3 distributed):
- `ForecastEditableTable`: Editing UI state
- `NewEntryForm`: Form data state + visibility toggle
- **3 component-owned variables**

### Side Effects (3 useEffect hooks)

| Effect | Lines | Purpose | Extract To |
|--------|-------|---------|------------|
| Prop Sync | 143-145 | Initialize localStagedEntries | Keep (parent) |
| Auto-save Draft | 148-158 | Persist to localStorage | useDraftPersistence hook |
| Load Draft | 161-179 | Restore from localStorage | useDraftPersistence hook |

**Note**: Auto-save fires on **EVERY state change** - needs debouncing (performance issue)

---

## Behavioral Assertions

### BA-001: Wizard Step Navigation
**Description**: Component displays wizard steps in sequence (review → modify → add-reason → preview → confirm) with progress indicator

**Source**: Lines 181-187 (step definitions), 189-190 (progress calculation)

**Verification**:
1. Open wizard in browser
2. Verify progress bar shows 20% (step 1/5)
3. Click "Next"
4. Verify progress bar shows 40% (step 2/5)
5. Continue through all steps
6. Verify progress reaches 100% at step 5

**Test Scenario**:
```typescript
test('BA-001: Wizard navigation progresses sequentially', () => {
  render(<ForecastWizard {...props} />)
  expect(screen.getByText('Review Budget')).toBeVisible()
  
  fireEvent.click(screen.getByText('Next'))
  expect(screen.getByText('Modify Assumptions')).toBeVisible()
  
  // Progress bar should show 40%
  const progress = screen.getByRole('progressbar')
  expect(progress).toHaveAttribute('aria-valuenow', '40')
})
```

---

### BA-002: Validation Prevents Progression
**Description**: "Next" button disabled when step validation fails

**Source**: Lines 301-316 (`canProceed()` function)

**Verification Scenarios**:
- **Modify step**: Requires ≥1 change (modified item or new entry)
- **Add-reason step**: Requires non-empty reason text (min 1 char)
- Verify button disabled when conditions not met

**Test Scenario**:
```typescript
test('BA-002: Next button disabled without modifications', () => {
  render(<ForecastWizard {...props} />)
  
  // Navigate to modify step
  fireEvent.click(screen.getByText('Next'))
  
  // Next button should be disabled (no changes made)
  expect(screen.getByText('Next')).toBeDisabled()
  
  // Make a change
  const input = screen.getAllByRole('textbox')[0]
  fireEvent.change(input, { target: { value: '150000' } })
  
  // Next button should now be enabled
  expect(screen.getByText('Next')).toBeEnabled()
})
```

---

### BA-003: Modified Items Tracking
**Description**: Component tracks which budget items have been modified and displays "Modified" badge

**Source**: Lines 544-555 (status badge), 564-567 (change tracking)

**Verification**: Edit cost value inline, verify badge appears and change tracked in `forecastChanges` state

**Test Scenario**:
```typescript
test('BA-003: Tracks and displays modified items', () => {
  const { container } = render(<ForecastWizard {...props} />)
  
  // Navigate to modify step
  fireEvent.click(screen.getByText('Next'))
  
  // Edit a value
  const valueCell = screen.getByText('$100,000')
  fireEvent.click(valueCell)
  
  const input = screen.getByDisplayValue('100000')
  fireEvent.change(input, { target: { value: '150000' } })
  fireEvent.blur(input)
  
  // Verify "Modified" badge appears
  expect(screen.getByText('Modified')).toBeInTheDocument()
})
```

---

### BA-004: New Entry Validation
**Description**: New entry form validates all required fields before allowing submission

**Source**: Lines 265-270 (validation in `handleAddNewEntry`)

**Required Fields**: cost_line, spend_type, spend_sub_category, budget_cost > 0

**Verification**: Attempt to add entry with missing fields, verify submission prevented

**Test Scenario**:
```typescript
test('BA-004: New entry form validates required fields', () => {
  render(<ForecastWizard {...props} />)
  
  // Navigate to modify step
  fireEvent.click(screen.getByText('Next'))
  
  // Open new entry form
  fireEvent.click(screen.getByText('Add New Entry'))
  
  // Try to submit without filling fields
  fireEvent.click(screen.getByText('Add Entry'))
  
  // Form should still be visible (not submitted)
  expect(screen.getByText('Add New Cost Entry')).toBeInTheDocument()
  
  // Fill all fields
  fireEvent.change(screen.getByLabelText('Cost Line'), { target: { value: 'M&S' } })
  fireEvent.change(screen.getByLabelText('Spend Type'), { target: { value: 'Operational' } })
  fireEvent.change(screen.getByLabelText('Sub Category'), { target: { value: 'Materials' } })
  fireEvent.change(screen.getByLabelText('Budget Cost'), { target: { value: '50000' } })
  
  // Now submission should work
  fireEvent.click(screen.getByText('Add Entry'))
  
  // Form should close and entry should appear
  expect(screen.queryByText('Add New Cost Entry')).not.toBeInTheDocument()
  expect(screen.getByText('Materials')).toBeInTheDocument()
})
```

---

### BA-005: Temporary ID Generation
**Description**: New entries are assigned temporary UUIDs (temp_*) until persisted

**Source**: Line 271 (`temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)

**Verification**: Add new entry, verify ID format `temp_1696550400000_abc123`

**Test Scenario**:
```typescript
test('BA-005: New entries get temporary IDs', async () => {
  const onSaveMock = jest.fn()
  render(<ForecastWizard {...props} onSave={onSaveMock} />)
  
  // Add new entry
  fireEvent.click(screen.getByText('Next'))
  fireEvent.click(screen.getByText('Add New Entry'))
  
  // Fill form and submit
  // ... (fill fields)
  fireEvent.click(screen.getByText('Add Entry'))
  
  // Complete wizard
  // ... (navigate to end)
  fireEvent.click(screen.getByText('Save Forecast'))
  
  await waitFor(() => {
    expect(onSaveMock).toHaveBeenCalled()
    const newEntries = onSaveMock.mock.calls[0][1]
    expect(newEntries[0].id).toMatch(/^temp_\d+_[a-z0-9]+$/)
  })
})
```

---

### BA-006: Calculate Total Forecast
**Description**: Component displays updated total budget including modified amounts and new entries

**Source**: Lines 205-212 (`getTotalForecast()`)

**Formula**: `SUM(modified existing costs) + SUM(new entries)`

**Verification**:
- Original budget: $10,000 (2 items × $5,000)
- Modify item 1: $5,000 → $6,000
- Add new entry: $2,000
- Verify total: $13,000 ($6,000 + $5,000 + $2,000)

**Test Scenario**:
```typescript
test('BA-006: Calculates total forecast correctly', () => {
  const costs = [
    { id: '1', budget_cost: 5000, /* ... */ },
    { id: '2', budget_cost: 5000, /* ... */ }
  ]
  
  render(<ForecastWizard {...props} currentCosts={costs} />)
  
  // Navigate to modify step
  fireEvent.click(screen.getByText('Next'))
  
  // Modify first item
  fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: '6000' } })
  
  // Add new entry worth $2,000
  // ... (add entry)
  
  // Navigate to preview
  fireEvent.click(screen.getByText('Next'))
  fireEvent.click(screen.getByText('Next'))
  
  // Verify total displays $13,000
  expect(screen.getByText('$13,000')).toBeInTheDocument()
})
```

---

### BA-007: Calculate Change Percentage
**Description**: Component calculates and displays percentage change from original budget

**Source**: Lines 218-222 (`getChangePercentage()`)

**Formula**: `((forecast - budget) / budget) * 100`

**Verification**: Original $10,000, modify to $11,000, verify displays "+10.0%"

**Test Scenario**:
```typescript
test('BA-007: Calculates change percentage correctly', () => {
  const costs = [{ id: '1', budget_cost: 10000, /* ... */ }]
  
  render(<ForecastWizard {...props} currentCosts={costs} />)
  
  // Modify to $11,000
  fireEvent.click(screen.getByText('Next'))
  fireEvent.change(screen.getByDisplayValue('10000'), { target: { value: '11000' } })
  
  // Navigate to preview
  fireEvent.click(screen.getByText('Next'))
  fireEvent.click(screen.getByText('Next'))
  
  // Verify percentage
  expect(screen.getByText('+10.0%')).toBeInTheDocument()
})
```

---

### BA-008: Division by Zero Protection ✅
**Description**: Percentage calculation returns 0 when original budget is 0 (prevents NaN)

**Source**: Lines 219-220

**Protection**: `if (total === 0) return 0`

**Verification**: Project with $0 budget, add $1,000, verify doesn't crash, returns 0%

**Test Scenario**:
```typescript
test('BA-008: Handles zero budget without NaN', () => {
  const costs = [{ id: '1', budget_cost: 0, /* ... */ }]
  
  render(<ForecastWizard {...props} currentCosts={costs} />)
  
  // Add new entry worth $1,000
  fireEvent.click(screen.getByText('Next'))
  fireEvent.click(screen.getByText('Add New Entry'))
  // ... (fill form with $1,000)
  
  // Navigate to preview
  fireEvent.click(screen.getByText('Next'))
  fireEvent.click(screen.getByText('Next'))
  
  // Should show 0% (not NaN%)
  expect(screen.getByText('0.0%')).toBeInTheDocument()
  expect(screen.queryByText('NaN%')).not.toBeInTheDocument()
})
```

---

### BA-009: Draft Auto-Save
**Description**: Component auto-saves draft to localStorage on every state change (with debouncing after fix)

**Source**: Lines 148-158 (auto-save effect)

**Storage Key**: `forecast-draft-${projectId}`

**Verification**: Make changes, wait 1 second (debounce), check localStorage, verify draft exists with timestamp

**Test Scenario**:
```typescript
test('BA-009: Auto-saves draft to localStorage', async () => {
  jest.useFakeTimers()
  
  render(<ForecastWizard {...props} projectId="project-123" />)
  
  // Make a change
  fireEvent.click(screen.getByText('Next'))
  fireEvent.change(screen.getByDisplayValue('10000'), { target: { value: '15000' } })
  
  // Wait for debounce
  act(() => {
    jest.advanceTimersByTime(1000)
  })
  
  // Verify localStorage
  const draft = localStorage.getItem('forecast-draft-project-123')
  expect(draft).toBeTruthy()
  
  const parsed = JSON.parse(draft!)
  expect(parsed.forecastChanges).toHaveProperty('cost-1', 15000)
  expect(parsed.timestamp).toBeTruthy()
  
  jest.useRealTimers()
})
```

---

### BA-010: Draft Age Expiration
**Description**: Drafts older than 24 hours are not restored

**Source**: Lines 168-175 (age check)

**Expiration**: 24 hours (86,400,000 ms)

**Verification**: Mock localStorage with 25-hour-old draft, verify not restored on mount

**Test Scenario**:
```typescript
test('BA-010: Ignores drafts older than 24 hours', () => {
  const oldDraft = {
    projectId: 'project-123',
    forecastChanges: { 'cost-1': 15000 },
    timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString() // 25 hours ago
  }
  
  localStorage.setItem('forecast-draft-project-123', JSON.stringify(oldDraft))
  
  render(<ForecastWizard {...props} projectId="project-123" />)
  
  // Draft should NOT be restored (too old)
  expect(screen.queryByText('$15,000')).not.toBeInTheDocument()
  expect(screen.getByText('$10,000')).toBeInTheDocument() // Original value
})
```

---

### BA-011: Draft Cleanup on Save
**Description**: Successful save clears localStorage draft

**Source**: Line 248 (`localStorage.removeItem`)

**Verification**: Save forecast, verify `localStorage.getItem('forecast-draft-...') === null`

**Test Scenario**:
```typescript
test('BA-011: Clears draft after successful save', async () => {
  const onSaveMock = jest.fn().mockResolvedValue(undefined)
  
  // Set up draft
  localStorage.setItem('forecast-draft-project-123', JSON.stringify({
    projectId: 'project-123',
    forecastChanges: { 'cost-1': 15000 }
  }))
  
  render(<ForecastWizard {...props} projectId="project-123" onSave={onSaveMock} />)
  
  // Complete wizard and save
  // ... (navigate through steps)
  fireEvent.click(screen.getByText('Save Forecast'))
  
  await waitFor(() => {
    expect(onSaveMock).toHaveBeenCalled()
    expect(localStorage.getItem('forecast-draft-project-123')).toBeNull()
  })
})
```

---

### BA-012: Inline Edit Mode
**Description**: Click forecast value to enter inline edit mode, blur or Enter to exit

**Source**: Lines 559-585 (inline editing logic)

**Verification Scenarios**:
- Click value, verify input appears with autofocus (line 570)
- Type new value, press Enter, verify edit mode exits (lines 572-575)
- Click outside (blur), verify edit mode exits (line 571)

**Test Scenario**:
```typescript
test('BA-012: Inline editing with keyboard controls', () => {
  render(<ForecastWizard {...props} />)
  
  // Navigate to modify step
  fireEvent.click(screen.getByText('Next'))
  
  // Click value to edit
  const valueCell = screen.getByText('$10,000')
  fireEvent.click(valueCell)
  
  // Input should appear with focus
  const input = screen.getByDisplayValue('10000')
  expect(input).toHaveFocus()
  
  // Edit value
  fireEvent.change(input, { target: { value: '15000' } })
  
  // Press Enter to save
  fireEvent.keyDown(input, { key: 'Enter' })
  
  // Edit mode should exit
  expect(screen.queryByDisplayValue('15000')).not.toBeInTheDocument()
  expect(screen.getByText('$15,000')).toBeInTheDocument()
})
```

---

## Pitfall Warnings & Fixes

### 🔴 Pitfall #1: No Debouncing on Auto-Save (CRITICAL)

**Location**: Lines 148-158

**Current Code**: `useEffect` fires on EVERY keystroke

**Risk**: Excessive localStorage writes, potential performance degradation

**Severity**: HIGH (performance)

**Detection Indicators**:
- Multiple localStorage writes per second
- Browser lag during typing
- Console warnings about localStorage quota

**Fix** (MUST IMPLEMENT):
```typescript
import { useMemo } from 'react'
import { debounce } from 'lodash'

const debouncedSave = useMemo(
  () => debounce((data) => {
    localStorage.setItem(`forecast-draft-${projectId}`, JSON.stringify(data))
  }, 1000),  // Save 1 second after last change
  [projectId]
)

useEffect(() => {
  debouncedSave({
    projectId,
    forecastChanges,
    localStagedEntries,
    forecastReason,
    currentStep,
    timestamp: new Date().toISOString(),
  })
}, [forecastChanges, localStagedEntries, forecastReason, currentStep, debouncedSave])
```

**Status**: MUST FIX in extraction (useDraftPersistence hook)

---

### ⚠️ Pitfall #2: Budget Cost Validation Allows Zero

**Location**: Line 269

**Current Code**:
```typescript
if (
  newEntry.cost_line &&
  newEntry.spend_type &&
  newEntry.spend_sub_category &&
  newEntry.budget_cost  // ← Truthy check fails for 0!
) { ... }
```

**Risk**: Can create entries with `budget_cost: 0`

**Severity**: MEDIUM (data quality)

**Detection Indicators**:
- Entries with $0.00 values in database
- User reports unexpected zero-value entries
- Financial calculations include unwanted zeros

**Fix** (MUST IMPLEMENT):
```typescript
if (
  newEntry.cost_line &&
  newEntry.spend_type &&
  newEntry.spend_sub_category &&
  newEntry.budget_cost !== undefined &&
  newEntry.budget_cost > 0  // ← Explicit positive number check
) { ... }
```

**Status**: MUST FIX in extraction (NewEntryForm component)

---

### 🟢 Pitfall #3: NO Infinite Render Loops Detected ✅

**Analysis**: All objects/arrays in dependencies properly managed

**Evidence**:
- No inline object creation in useEffect dependencies
- No unmemoized objects passed to child components
- State updates are conditional or one-time

**Status**: ✅ Safe

---

### 🟢 Pitfall #4: NO Date Serialization Issues ✅

**Analysis**: Component doesn't use Dates or z.date() schemas

**Evidence**: Wizard manages string/number data only

**Status**: ✅ Safe

---

### 🟢 Pitfall #5: NaN Generation Protected ✅

**Location**: Lines 219-220

**Code**:
```typescript
const getChangePercentage = () => {
  const total = getTotalBudget()
  if (total === 0) return 0  // ← Protection against division by zero
  return (getTotalChange() / total) * 100
}
```

**Status**: ✅ Already protected

---

## Integration Analysis

### Component Usage

**Imported By**: 1 file (SAFE TO MODIFY)
- `apps/web/app/projects/page.tsx` (Lines 2734-2760)

**Usage Pattern**: Conditional render based on `showForecastWizard` state

**Props Passed**:
```typescript
<ForecastWizard
  isOpen={true}
  onClose={() => { setShowForecastWizard(null); /* cleanup */ }}
  projectId={showForecastWizard}
  projectName={projects.find(p => p.id === showForecastWizard)?.name || ""}
  currentCosts={costBreakdowns[showForecastWizard] || []}
  stagedEntries={stagedNewEntries[showForecastWizard] || []}
  onSave={async (changes, newEntries, reason) => {
    await createForecast.mutateAsync({ /* tRPC call */ })
  }}
/>
```

### Callback: onSave Handler

**Location**: Lines 2746-2760 in projects/page.tsx

**Data Transformation**: Snake_case → camelCase for tRPC
```typescript
newEntries.map(e => ({
  subBusinessLine: e.sub_business_line,
  costLine: e.cost_line,
  spendType: e.spend_type,
  spendSubCategory: e.spend_sub_category,
  budgetCost: e.budget_cost,
}))
```

### Breaking Change Risk Matrix

| Change Type | Risk Level | Files Affected | Impact |
|-------------|------------|----------------|--------|
| Props interface | 🔴 HIGH | 1 | Lines 2734-2760 |
| onSave callback | 🔴 HIGH | 1 | Lines 2746-2760 |
| CostBreakdown type | 🔴 HIGH | 3+ | Multiple files |
| Internal state | 🟡 MEDIUM | 1 | User drafts |
| UI/Styling | 🟢 LOW | 0 | None |
| Constants | 🟡 MEDIUM | 2 | Parent validation |

**Critical**: `CostBreakdown` interface defined in 3+ locations - risk of drift

---

## Extraction Strategy

### Phase 1: Foundation (8 hours) - **PRIORITY: 🔴 CRITICAL**

**Goal**: Extract core wizard machinery for immediate reuse

**Tasks**:
1. Extract `useWizardNavigation` hook (2h)
2. Extract `WizardProgressIndicator` component (2h)
3. Extract `WizardShell` component (4h)

**Deliverables**:
- `use-wizard-navigation.ts` with tests
- `wizard-progress.tsx` with variants
- `wizard-shell.tsx` with documentation
- `types.ts` with shared types
- forecast-wizard.tsx reduced by ~150 LOC

**Success Criteria**:
- All tests pass
- Wizard navigation works identically
- No visual regressions
- Code review approved

---

### Phase 2: Table Decomposition (10 hours) - **PRIORITY: 🔴 CRITICAL**

**Goal**: Break down 283-line Modify Step god component

**Tasks**:
1. Extract `NewEntryForm` (3h)
2. Extract `ForecastEditableTable` (5h) - integrate with existing InlineEdit
3. Extract `ChangeSummaryFooter` (1h)
4. Refactor `BudgetModifyStep` (1h)

**Deliverables**:
- `new-entry-form.tsx` with validation (fixes Pitfall #2)
- `forecast-editable-table.tsx` using InlineEdit
- `change-summary-footer.tsx`
- `budget-modify-step.tsx` reduced from 283 → 80 LOC

**Success Criteria**:
- Can add new cost entries
- Can edit existing entries inline
- Can reset individual changes
- Can delete staged entries
- Summary footer updates correctly

---

### Phase 3: Step Extraction (8 hours) - **PRIORITY: MEDIUM**

**Goal**: Extract remaining step components

**Tasks**:
1. Extract BudgetReviewStep + BudgetSummaryCard (2h)
2. Extract ReasonEntryStep (1h) - generic wizard component
3. Extract ChangePreviewStep + ChangeComparisonCard (3h)
4. Extract ConfirmationStep (1h) - generic wizard component
5. Refactor forecast-wizard.tsx (1h)

**Deliverables**:
- All step components extracted
- forecast-wizard.tsx reduced to ~180 LOC (orchestrator only)
- 2 generic wizard components (reason-entry, confirmation)

**Success Criteria**:
- All steps render correctly
- Step transitions work smoothly
- Data flows correctly between steps
- Validation works at each step

---

### Phase 4: Hooks & Utilities (4 hours) - **PRIORITY: LOW**

**Goal**: Extract calculation and persistence logic

**Tasks**:
1. Extract `useForecastCalculations` (2h)
2. Extract `useDraftPersistence` (2h) - with debouncing (fixes Pitfall #1)

**Deliverables**:
- `use-forecast-calculations.ts` with tests
- `use-draft-persistence.ts` with tests (debounced)
- forecast-wizard.tsx uses both hooks

**Success Criteria**:
- Calculations are accurate
- Draft auto-save works with debouncing
- Draft restoration works
- Old drafts are cleared

---

### Phase 5: Testing & Documentation (4 hours)

**Goal**: Ensure quality and maintainability

**Tasks**:
1. Integration Testing (2h)
2. Documentation (2h)

**Deliverables**:
- Comprehensive test suite
- Component documentation
- Usage examples
- Migration guide for future wizards

**Success Criteria**:
- >80% test coverage
- All components documented
- Examples provided
- Code review approved

---

## Complexity Assessment

### Before Extraction

| Metric | Value | Assessment |
|--------|-------|------------|
| Total Lines | 1,005 | 🔴 Critical |
| Max File Size | 1,005 | 🔴 Critical (god component) |
| State Variables | 8 | 🟡 Moderate |
| useEffect Count | 3 | 🟢 Low |
| Functions | 9 | 🟢 Low |
| Test Coverage | 0% | 🔴 Critical |

### After Extraction

| Metric | Value | Assessment |
|--------|-------|------------|
| Total Files | 19 | 🟢 Good |
| Avg File Size | 68 LOC | 🟢 Excellent |
| Max File Size | 220 LOC | 🟢 Acceptable |
| State Variables (parent) | 4 | 🟢 Good |
| Test Coverage | >80% | 🟢 Target |
| Reusable Components | 10/19 | 🟢 Excellent |

### Complexity Reduction

- **God Component Eliminated**: 1,005 LOC → 180 LOC (-82%)
- **State Coupling Reduced**: 8 vars → 4 vars (-50%)
- **Max File Complexity**: 1,005 LOC → 220 LOC (-78%)
- **Reusability Achieved**: 0 → 10 reusable components

---

## Performance Considerations

### Current Issues

1. **Auto-save Frequency**: Fires on every render (HIGH IMPACT)
2. **Unmemoized Calculations**: Functions called multiple times per render
3. **Large List Rendering**: No virtualization for >100 items

### Recommended Optimizations

1. **Debounce Auto-save**: 1000ms delay (reduce writes by ~80%)
2. **Memoize Calculations**: Wrap all `getTotal*()` with `useMemo`
3. **Virtual Scrolling**: Add for cost table if >100 items

---

## Success Criteria

### Pre-Extraction Checklist

- [x] Analysis report reviewed and understood
- [x] Extraction strategy clear
- [x] 34-hour migration effort scheduled
- [x] Test project IDs identified for validation

### Post-Extraction Validation

**Functional**:
- [ ] All wizard steps render correctly
- [ ] Navigation (back/next) works
- [ ] Data entry (add/edit/delete) works
- [ ] Validations work at each step
- [ ] Save functionality works
- [ ] Draft persistence works
- [ ] Draft restoration works
- [ ] Error handling works

**Non-Functional**:
- [ ] No performance regressions
- [ ] No visual regressions
- [ ] Keyboard navigation works
- [ ] Mobile responsiveness maintained

**Code Quality**:
- [ ] TypeScript types are correct
- [ ] ESLint passes
- [ ] Test coverage >80%
- [ ] All components documented

---

## ROI Analysis

### Effort vs. Benefit

| Phase | Effort (hours) | Lines Extracted | Reusability | ROI Score |
|-------|----------------|-----------------|-------------|-----------|
| Phase 1: Foundation | 8 | 230 LOC | ⭐⭐⭐⭐⭐ | 9/10 |
| Phase 2: Table Decomp | 10 | 335 LOC | ⭐⭐⭐⭐ | 9/10 |
| Phase 3: Steps | 8 | 470 LOC | ⭐⭐⭐⭐ | 8/10 |
| Phase 4: Hooks | 4 | 160 LOC | ⭐⭐⭐⭐ | 7/10 |
| Phase 5: Testing/Docs | 4 | N/A | N/A | 8/10 |
| **TOTAL** | **34 hours** | **1,195 LOC** | **High** | **8.5/10** |

### Future Savings Projection

**Conservative (3 more wizards)**:
- Reused components: 310 LOC per wizard
- **Savings**: 310 × 3 = 930 LOC
- **ROI**: 27 LOC per hour

**Realistic (5 more wizards)**:
- **Savings**: 310 × 5 = 1,550 LOC
- **ROI**: 45 LOC per hour

**Optimistic (8 wizards)**:
- **Savings**: 310 × 8 = 2,480 LOC
- **ROI**: 73 LOC per hour

---

## Recommendations

### Immediate Actions (This Week)

1. **Add Test Coverage** 🔴 CRITICAL
   - Create `forecast-wizard.test.tsx`
   - Focus on: Navigation, draft save/restore, calculations, validation

2. **Extract Pure Functions** 🟡 HIGH
   - Create `budget-utils.ts`
   - Move all calculation functions
   - Add unit tests

3. **Debounce Auto-save** 🟡 HIGH
   - Add to useDraftPersistence hook
   - Test localStorage behavior

4. **Add Named Constants** 🟢 LOW
   - Extract magic numbers
   - Improve code clarity

### Short-term (Next 2 Weeks)

**PROCEED** with phased extraction:
1. Phase 1: Foundation (Week 1)
2. Phase 2: Table Decomposition (Week 1)
3. Phase 3: Step Extraction (Week 2)
4. Phase 4: Hooks & Testing (Week 2)

### Decision

**RECOMMENDED**: **Strategy B (Incremental Phased Approach)**

**Rationale**:
1. ✅ Immediate benefit: Reduces god component by 82%
2. ✅ Long-term ROI: 1,500-2,500 LOC saved across future wizards
3. ✅ Risk managed: Phased approach with clear validation gates
4. ✅ Team growth: Establishes component library patterns
5. ✅ User benefit: Consistent wizard UX across application

**Start with Phase 1** (8 hours) to extract wizard foundation, then evaluate before proceeding.

---

## References

- **Implementation Report**: `thoughts/shared/implementations/2025-10-04_18-07_forecast-wizard_complete_implementation.md`
- **Original Migration Plan**: `thoughts/shared/plans/2025-10-04_01-00_forecast-wizard_migration_plan.md`
- **Cell Development Checklist**: `docs/cell-development-checklist.md`
- **API Architecture**: `docs/2025-10-03_api_procedure_specialization_architecture.md`

---

**Analysis Complete** ✅  
**Status**: Ready for Phase 3: Migration Planning  
**Next Step**: MigrationArchitect creates detailed extraction plan  
**Confidence**: HIGH (comprehensive analysis with ultrathink enhancement)
