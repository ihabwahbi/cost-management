# Phase C Migration Plan: Cost Breakdown Cell Integration & Replacement

**Date**: 2025-10-05 15:12  
**Architect**: MigrationArchitect  
**Status**: ready_for_implementation  
**Phase**: 3 - Migration Planning  
**Workflow Phase**: Phase C (Integration & Replacement)

---

## Frontmatter

```yaml
migration_metadata:
  target_component: "projects/page.tsx (cost breakdown section)"
  target_path: "apps/web/app/projects/page.tsx"
  complexity: MEDIUM
  strategy: standard_integration
  estimated_duration: "2-3 hours"
  
based_on:
  phase_a_report: "thoughts/shared/implementations/2025-10-05_phase-a_cost-breakdown_complete.md"
  phase_b_report: "thoughts/shared/implementations/2025-10-05_phase-b_cost-breakdown_complete.md"
  phase_overview: "thoughts/shared/plans/2025-10-05_PHASE-OVERVIEW_all-7-phases.md"
  
prerequis:
  - phase_a_status: "✅ COMPLETE (6 tRPC procedures, domain router)"
  - phase_b_status: "✅ COMPLETE (Cell structure, 8 tests passing)"
  - procedures_tested: "✅ All procedures curl-tested"
  - cell_validated: "✅ Unit tests passing (8/8)"
```

---

## Executive Summary

Phase C completes the Cost Breakdown domain migration by **integrating** the fully-tested Cell into `projects/page.tsx` and **deleting** ~800 lines of inline cost breakdown logic. This is a pure integration phase - no new development, just atomic replacement.

**Current State**:
- ✅ Phase A: 6 tRPC procedures created and tested
- ✅ Phase B: Cell component created and tested (325+171+49 = 545 lines)
- ❌ Integration: Old code still in page.tsx (lines ~26-1374, ~2243-2580)

**Target State**:
- ✅ Cell imported and integrated
- ✅ ~800 lines of old code deleted
- ✅ All tests passing
- ✅ Feature parity maintained
- ✅ Atomic commit with ledger update

**Risk Level**: **MEDIUM**
- **Low technical risk** (Cell already tested)
- **Medium integration risk** (careful state management cleanup)
- **High importance** (critical user feature)

**Duration**: 2-3 hours (integration only, no development)

---

## Migration Overview

### Component Analysis

**Current Implementation** (`projects/page.tsx` lines to remove):

**State Variables** (~15-20 variables, lines 26-146):
```typescript
// TO BE REMOVED:
interface CostBreakdown { ... }  // Line 26-35 (Cell has own types)
const [costBreakdowns, setCostBreakdowns] = useState<...>  // Line 97
const [editingCost, setEditingCost] = useState<...>  // Line 98
const [editingValues, setEditingValues] = useState<...>  // Line 99
const [savingCosts, setSavingCosts] = useState<...>  // Line 101
const [addingNewCost, setAddingNewCost] = useState<...>  // Line 102
const [newCostValues, setNewCostValues] = useState<...>  // Line 103
const [savingNewCost, setSavingNewCost] = useState<...>  // Line 104
const [deletingCost, setDeletingCost] = useState<...>  // Line 105
const [selectedEntries, setSelectedEntries] = useState<...>  // Line 139
const [bulkEditMode, setBulkEditMode] = useState<...>  // Line 140
// Partial removal (used by other features):
const [stagedNewEntries, setStagedNewEntries] = useState<...>  // Line 133 - KEEP (initial budget mode)
const [unsavedChangesCount, setUnsavedChangesCount] = useState<...>  // Line 135 - KEEP (initial budget mode)
```

**Functions** (~30 functions, lines 149-1374):
```typescript
// TO BE REMOVED:
const getRowClassName = (cost: CostBreakdown) => { ... }  // Lines 149-162
const validateDatabaseEntry = (entry: any) => { ... }  // Lines 184-216
const cleanEntryForDatabase = (entry: any, projectId: string) => { ... }  // Lines 219-239
const calculateUnsavedChanges = (projectId: string) => { ... }  // Lines 242-246
const loadCostBreakdown = async (projectId: string) => { ... }  // Lines 420-452
const updateCostItem = async (costItem: CostBreakdown) => { ... }  // Lines 1304-1374
// Plus many more cost-related functions
```

**JSX Rendering** (~337 lines, lines 2243-2580):
```typescript
// TO BE REMOVED: Entire cost breakdown table rendering
// - Table header (lines 2252-2271)
// - Table rows with inline editing (lines 2274-2434)
// - Add new entry form (lines 2440-2580)
```

**TO BE REPLACED WITH**:
```typescript
import { CostBreakdownTableCell } from '@/components/cells/cost-breakdown-table-cell/component'

// In JSX (around line 2243):
<CostBreakdownTableCell 
  projectId={project.id} 
  versionNumber={activeVersion[project.id]}
/>
```

### Cell Specifications

**Cell Location**: `components/cells/cost-breakdown-table-cell/`

**Files** (from Phase B):
1. `component.tsx` (325 lines) - Main Cell with tRPC queries/mutations
2. `table-row.tsx` (171 lines) - Extracted table row rendering
3. `hooks.ts` (49 lines) - Keyboard shortcuts, validation
4. `manifest.json` - 7 behavioral assertions
5. `pipeline.yaml` - 5 validation gates
6. `__tests__/component.test.tsx` (396 lines) - 8 tests passing

**Props Interface**:
```typescript
interface CostBreakdownTableCellProps {
  projectId: string
  versionNumber?: number | "latest"
  onVersionChange?: (version: number) => void
}
```

**Features** (from Phase B manifest):
- ✅ Displays cost breakdown table (BA-003)
- ✅ Shows empty state (BA-008)
- ✅ Inline editing on double-click (BA-009)
- ✅ Validates required fields (BA-018)
- ✅ Unsaved changes bar (BA-022)
- ✅ Keyboard shortcuts (Cmd+S, Escape) (BA-023)
- ✅ Multi-select bulk delete (BA-BULK-001)

### Integration Points

**Dependencies**:
- ✅ Phase A procedures available: `costBreakdown.*` (6 procedures)
- ✅ Cell uses: `getCostBreakdownByProject`, `updateCostEntry`, `deleteCostEntry`, `bulkDeleteCostEntries`
- ❌ Version management: Cell needs `versionNumber` prop (from `activeVersion[projectId]`)

**State Coordination**:
- **Keep** in page.tsx: `activeVersion[projectId]` (Phase 4 concern - version management)
- **Keep** in page.tsx: `forecastVersions[projectId]` (Phase 4 concern)
- **Keep** in page.tsx: `isInitialBudgetMode` (Phase 3 concern - separate Cell)
- **Remove** from page.tsx: All cost breakdown editing state
- **Cell manages**: Inline editing, bulk selection, unsaved changes internally

**Critical Coordination Point**:
```typescript
// page.tsx keeps version state, passes to Cell
const [activeVersion, setActiveVersion] = useState<Record<string, number | "latest">>({})

// Cell receives version, queries appropriate data
<CostBreakdownTableCell 
  projectId={project.id} 
  versionNumber={activeVersion[project.id] || "latest"}
  onVersionChange={(v) => setActiveVersion(prev => ({ ...prev, [project.id]: v }))}
/>
```

---

## Architecture Compliance Validation

**Pre-Implementation Verification** (Phase 5.5 Self-Validation):

### Architectural Mandates

- ✅ **M-CELL-1** (All Functionality as Cells): Cost breakdown correctly classified as Cell (Phase B validated)
- ✅ **M-CELL-2** (Complete Atomic Migrations): Old code deletion in SAME commit as Cell integration
- ✅ **M-CELL-3** (Zero God Components): Cell files all ≤400 lines (325, 171, 49 lines validated in Phase B)
- ✅ **M-CELL-4** (Explicit Behavioral Contracts): 7 behavioral assertions in manifest (exceeds minimum of 3)

### Specialized Procedure Architecture

- ✅ **One Procedure Per File**: 6 procedures in 6 files (Phase A validated)
- ✅ **Procedure Size Limits**: All ≤200 lines (max 53 lines in Phase A)
- ✅ **Router Complexity**: Domain router 20 lines (≤50 limit)
- ✅ **No Parallel Implementations**: All in `packages/api/` (Phase A validated)

### Forbidden Pattern Scan

- ✅ **"optional" phases**: None detected in plan
- ✅ **"future cleanup"**: None detected in plan
- ✅ **"temporary exemption"**: None detected in plan
- ✅ **File size exemptions**: None - all files compliant

**Compliance Status**: ✅ **COMPLIANT** - Ready for Phase C execution

**Justification**: Phase C is pure integration - Cell already validated in Phase B, procedures validated in Phase A. No new development, only deletion and wiring.

---

## Integration Strategy

### Step-by-Step Integration Sequence

**Strategy**: Standard 3-step integration (not 7-step, since Cell already built)

```yaml
step_1:
  phase: "Import & Wire"
  action: "Import Cell and integrate into page.tsx"
  changes:
    - "Add import: CostBreakdownTableCell from component.tsx"
    - "Replace JSX table rendering (lines 2243-2580) with <CostBreakdownTableCell />"
    - "Pass props: projectId, versionNumber"
    - "Wire version change handler (optional)"
  validation: "TypeScript compiles, no import errors"
  duration: "15 minutes"
  
step_2:
  phase: "Cleanup & Delete"
  action: "Remove all unused cost breakdown code"
  deletions:
    state_variables:
      - "costBreakdowns" (line 97)
      - "editingCost" (line 98)
      - "editingValues" (line 99)
      - "savingCosts" (line 101)
      - "addingNewCost" (line 102)
      - "newCostValues" (line 103)
      - "savingNewCost" (line 104)
      - "deletingCost" (line 105)
      - "selectedEntries" (line 139)
      - "bulkEditMode" (line 140)
      - "CostBreakdown interface" (lines 26-35)
    functions:
      - "getRowClassName" (lines 149-162)
      - "validateDatabaseEntry" (lines 184-216)
      - "cleanEntryForDatabase" (lines 219-239)
      - "calculateUnsavedChanges" (lines 242-246)
      - "loadCostBreakdown" (lines 420-452)
      - "updateCostItem" (lines 1304-1374)
      - "All other cost-specific functions"
    effects:
      - "useEffect for unsaved changes count (lines 249-255)" - KEEP MODIFIED (still used by initial budget)
      - "Keyboard shortcuts useEffect" - SIMPLIFY (remove cost-specific shortcuts)
  critical: "ATOMIC operation - all deletions in same commit"
  validation: "TypeScript compiles, no unused variable warnings"
  duration: "30-45 minutes"
  
step_3:
  phase: "Validation & Commit"
  action: "Full validation suite & atomic commit"
  validation:
    - "TypeScript: pnpm type-check (zero errors)"
    - "Tests: pnpm test (all passing)"
    - "Build: pnpm build (production succeeds)"
    - "Manual: Cell displays correctly in browser"
    - "Manual: All 7 behavioral assertions verified"
  commit:
    message: "Phase C: Cost Breakdown Cell integration - complete replacement"
    includes:
      - "Modified: apps/web/app/projects/page.tsx (~800 lines removed)"
      - "Ledger: Updated with Phase C completion"
  duration: "1-1.5 hours"
```

### Detailed File Changes

**File**: `apps/web/app/projects/page.tsx`

**Add Import** (around line 14):
```typescript
import { CostBreakdownTableCell } from "@/components/cells/cost-breakdown-table-cell/component"
```

**Remove Interfaces** (lines 26-35):
```typescript
// DELETE:
interface CostBreakdown {
  id: string
  project_id: string
  sub_business_line: string
  cost_line: string
  spend_type: string
  spend_sub_category: string
  budget_cost: number
  _modified?: boolean
}
```

**Remove State Variables** (lines 97-146, selective):
```typescript
// DELETE (lines 97-105, 139-140):
const [costBreakdowns, setCostBreakdowns] = useState<Record<string, CostBreakdown[]>>({})
const [editingCost, setEditingCost] = useState<string | null>(null)
const [editingValues, setEditingValues] = useState<CostBreakdown | null>(null)
const [savingCosts, setSavingCosts] = useState<Set<string>>(new Set())
const [addingNewCost, setAddingNewCost] = useState<string | null>(null)
const [newCostValues, setNewCostValues] = useState<NewCostEntry | null>(null)
const [savingNewCost, setSavingNewCost] = useState(false)
const [deletingCost, setDeletingCost] = useState<string | null>(null)
const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set())
const [bulkEditMode, setBulkEditMode] = useState(false)

// KEEP (used by initial budget mode - Phase 3):
const [stagedNewEntries, setStagedNewEntries] = useState<{ [projectId: string]: any[] }>({})
const [unsavedChangesCount, setUnsavedChangesCount] = useState<{ [projectId: string]: number }>({})
```

**Remove Functions** (lines 149-1374, selective):
```typescript
// DELETE THESE FUNCTIONS (list not exhaustive):
const getRowClassName = (cost: CostBreakdown) => { ... }  // Lines 149-162
const validateDatabaseEntry = (entry: any): void => { ... }  // Lines 184-216
const cleanEntryForDatabase = (entry: any, projectId: string): any => { ... }  // Lines 219-239
const calculateUnsavedChanges = (projectId: string) => { ... }  // Lines 242-246
const loadCostBreakdown = async (projectId: string) => { ... }  // Lines 420-452
const updateCostItem = async (costItem: CostBreakdown) => { ... }  // Lines 1304-1374
// Plus many more - search for "cost" in function names and remove if Cell-specific
```

**Replace JSX Rendering** (lines 2243-2580):

**DELETE**:
```typescript
// Lines 2243-2580: Entire cost breakdown table with inline editing, add new entry form
```

**REPLACE WITH** (insert around line 2243):
```typescript
{/* Cost Breakdown Table Cell */}
{costBreakdowns[project.id] && (
  <CostBreakdownTableCell 
    projectId={project.id} 
    versionNumber={activeVersion[project.id] || "latest"}
  />
)}

{/* Empty state when no data */}
{!costBreakdowns[project.id] && !isInitialBudgetMode && (
  <div className="text-center py-8 bg-gray-50 rounded-lg">
    <p className="text-gray-600 mb-4">No budget has been created for this project yet.</p>
    <p className="text-sm text-gray-500">Click "Create Initial Budget" to get started.</p>
  </div>
)}
```

**NOTE**: The `costBreakdowns[project.id]` check can eventually be removed when Cell handles empty state internally. For Phase C, keep for safety.

**Simplify Keyboard Shortcuts** (lines 258-319):
```typescript
// MODIFY: Remove cost-specific keyboard shortcuts
// KEEP: Cmd+S for save all (used by initial budget mode)
// REMOVE: Escape for cancel editing (Cell handles internally)
// REMOVE: Delete key for bulk delete (Cell handles internally)
// REMOVE: Cmd+A for select all (Cell handles internally)
```

---

## Rollback Strategy

**Requirement**: MANDATORY for atomic migration

### Trigger Conditions

- TypeScript compilation fails after integration
- Tests fail after deletion
- Build fails (production)
- Manual validation reveals missing functionality
- Cell doesn't display correctly in browser
- Any behavioral assertion fails

### Rollback Sequence

```yaml
step_1:
  action: "git revert HEAD"
  result: "All changes undone - old code restored"
  duration: "5 seconds"
  
step_2:
  action: "Verify revert successful"
  checks:
    - "Old cost breakdown JSX restored (lines 2243-2580)"
    - "Old state variables restored"
    - "Old functions restored"
    - "Cell import removed"
    - "Build succeeds: pnpm build"
  duration: "2 minutes"
  
step_3:
  action: "Update ledger with FAILED status"
  entry:
    status: "FAILED"
    reason: "[Specific failure reason]"
    step_failed: "[Which step failed]"
    error_messages: "[Error details]"
    lessons_learned: "[What went wrong]"
  duration: "3 minutes"
  
step_4:
  action: "Document failure and retry plan"
  output: "Failure report with next steps"
  escalation: "If failure not understood, escalate to human"
```

### Edge Cases

**Cell Already Deployed (Edge Function)**:
- **Condition**: tRPC procedures already deployed from Phase A
- **Action**: Leave deployed (additive, no breaking changes)
- **Rationale**: Procedures are available but unused if rollback occurs

**Partial Integration (Unlikely)**:
- **Condition**: Some state removed but JSX still references it
- **Action**: Full rollback (no partial states allowed)
- **Philosophy**: Atomic completeness - all or nothing

### Recovery Testing

After rollback:
```bash
# Verify old implementation works
pnpm type-check  # Should pass
pnpm test        # Should pass
pnpm build       # Should succeed

# Manual test: Load page, expand project, verify cost breakdown renders
```

---

## Validation Strategy

### Technical Validation

**TypeScript** (Automated):
```bash
pnpm type-check
# Requirement: Zero errors
# Focus: No unused variables, no import errors, no type mismatches
```

**Tests** (Automated):
```bash
pnpm test
# Requirement: All tests pass (including Cell tests from Phase B)
# Coverage: ≥80% (Cell already at 100%)
# Assertions: All 7 behavioral assertions verified
```

**Build** (Automated):
```bash
pnpm build
# Requirement: Production build succeeds with zero errors
# Check: No missing dependencies, no circular imports
```

### Functional Validation

**Feature Parity Checklist** (Manual):

```yaml
validation_checklist:
  
  ba_003_display_cost_breakdown:
    requirement: "Displays cost breakdown table with all columns"
    method: "Load page, expand project, verify table appears"
    expected: "Table with columns: Status, Cost Line, Spend Type, Sub Category, Budget Cost, Actions"
    
  ba_008_empty_state:
    requirement: "Shows empty state for new projects"
    method: "Create new project, verify empty state message"
    expected: "Message: 'No budget created yet' with call-to-action"
    
  ba_009_inline_editing:
    requirement: "Double-click enables inline editing"
    method: "Double-click row, verify input fields appear"
    expected: "Row switches to edit mode with dropdowns and inputs"
    
  ba_018_validation:
    requirement: "Validates required fields before save"
    method: "Clear cost line field, attempt save, verify error"
    expected: "Error message shown, save blocked"
    
  ba_022_unsaved_changes:
    requirement: "Shows unsaved changes bar"
    method: "Edit entry, verify bar appears"
    expected: "Bar with count and Save/Discard buttons"
    
  ba_023_keyboard_shortcuts:
    requirement: "Cmd+S saves, Escape cancels"
    method: "Edit entry, press Cmd+S, verify saves; Edit again, press Escape, verify cancels"
    expected: "Shortcuts work as specified"
    
  ba_bulk_001_multi_select:
    requirement: "Bulk select and delete works"
    method: "Check multiple entries, click Delete Selected"
    expected: "All selected entries deleted after confirmation"
```

**Integration Validation**:
```yaml
integration_checks:
  
  version_switching:
    requirement: "Version dropdown still works"
    method: "Change version dropdown, verify Cell data updates"
    expected: "Cell queries with new version number"
    
  total_budget_display:
    requirement: "Total budget shown in project header"
    method: "Verify budget total matches sum of cost entries"
    expected: "Correct total displayed (Cell provides data)"
    note: "May need to expose data from Cell or query separately"
    
  initial_budget_mode:
    requirement: "Initial budget mode still works"
    method: "Create new project, click 'Create Initial Budget'"
    expected: "Initial budget mode activates (Phase 3 concern, verify not broken)"
    
  forecast_mode:
    requirement: "Forecast mode still accessible"
    method: "Click 'Create New Forecast' button"
    expected: "Forecast wizard opens (separate Cell, verify not broken)"
```

### Performance Validation

**Baseline** (from Phase 2 analysis):
- Load time: TBD (measure with old implementation)
- Render count: <5 renders expected

**Requirements**:
- Load time: ≤110% of baseline
- No infinite render loops
- Network requests: 1-2 (batched tRPC)

**Measurement**:
```typescript
// Open React DevTools Profiler
// 1. Start recording
// 2. Expand project
// 3. Stop recording
// 4. Verify: 2-3 renders total (initial + query completion)
// 5. Check Network tab: 1 POST to /trpc/ (batched)
```

### Manual Validation Gate (MANDATORY)

**Critical Path Component**: YES (core user workflow)

**Human Validation Required**:

```markdown
## 🛑 HUMAN VALIDATION REQUIRED

Please validate the following in your browser:

1. **Cell Displays Correctly**
   - [  ] Table renders with all columns
   - [  ] Data is visible and accurate
   - [  ] Styling matches old implementation

2. **All Data Accurate**
   - [  ] Budget values match expected amounts
   - [  ] Cost lines shown correctly
   - [  ] No missing entries

3. **Loading States Work**
   - [  ] Refresh page, verify skeleton/loading indicator
   - [  ] Data loads without errors

4. **Error States Work**
   - [  ] Disconnect network (DevTools → Network → Offline)
   - [  ] Verify error message displayed
   - [  ] Reconnect, verify recovery

5. **No Console Errors**
   - [  ] Open DevTools → Console
   - [  ] Verify no errors or warnings

6. **Network Tab Shows Successful Requests**
   - [  ] Open DevTools → Network
   - [  ] Filter by "trpc"
   - [  ] Verify 1 request per query, all 200 OK

7. **Inline Editing Works**
   - [  ] Double-click row, verify edit mode
   - [  ] Modify value, save, verify persisted
   - [  ] Cancel edit, verify reverted

8. **Bulk Delete Works**
   - [  ] Select multiple entries with checkboxes
   - [  ] Click Delete Selected
   - [  ] Verify all deleted after confirmation

**Approval Format**: Respond with:
- ✅ "VALIDATED - proceed with commit" OR
- ❌ "FIX ISSUES - [describe problems]"
```

---

## Success Criteria

### Deliverables

**Code Changes**:
- [x] Cell imported in `projects/page.tsx`
- [x] Old cost breakdown JSX removed (~337 lines)
- [x] Old cost breakdown state removed (~10 variables)
- [x] Old cost breakdown functions removed (~20 functions)
- [x] TypeScript compiles (zero errors)
- [x] All tests pass

**Validation**:
- [x] All 7 behavioral assertions verified
- [x] Feature parity maintained
- [x] No console errors
- [x] Performance ≤110% baseline
- [x] Human validation approved

**Documentation**:
- [x] Ledger updated with Phase C completion
- [x] Phase C implementation report created

### Measurable Outcomes

```yaml
code_quality:
  typescript_errors: 0
  test_coverage: "≥80% (Cell at 100%)"
  behavioral_assertions_verified: "7/7"
  
architecture_compliance:
  m_cell_1_to_4: "100% COMPLIANT (Phase B validated)"
  m1_to_m4_procedures: "100% COMPLIANT (Phase A validated)"
  forbidden_language: "0 violations"
  
performance:
  page_load_time: "≤110% baseline"
  render_count: "≤5 (2-3 expected)"
  network_requests: "1-2 (batched)"
  
code_reduction:
  lines_removed: "~800 lines from page.tsx"
  old_implementation_deleted: true
  net_change: "+545 Cell lines, -800 page.tsx = -255 total (more modular)"
  
maintainability:
  page_tsx_size: "2803 → ~2000 lines (29% reduction in this phase)"
  cost_breakdown_complexity: "Extracted to Cell (isolated, testable)"
  god_component_progress: "2803 → 2000 (ongoing reduction)"
```

---

## Phase 4 Execution Checklist

**For MigrationExecutor** (zero-deviation execution):

```yaml
pre_execution:
  - [ ] Load Phase A completion report
  - [ ] Load Phase B completion report
  - [ ] Load this Phase C migration plan
  - [ ] Verify Phase A procedures deployed and working
  - [ ] Verify Phase B tests passing (8/8)
  - [ ] Create new git branch: `refactor/codebase-modernization` (or use existing)
  
step_1_import_and_wire:
  - [ ] Add import in page.tsx line 14: CostBreakdownTableCell
  - [ ] Verify import resolves (TypeScript happy)
  - [ ] Replace JSX (lines 2243-2580) with <CostBreakdownTableCell />
  - [ ] Pass props: projectId, versionNumber
  - [ ] Run: pnpm type-check
  - [ ] ✓ Validation: TypeScript compiles with new import
  
step_2_cleanup_and_delete:
  - [ ] Remove CostBreakdown interface (lines 26-35)
  - [ ] Remove state variables:
      - [ ] costBreakdowns (line 97)
      - [ ] editingCost (line 98)
      - [ ] editingValues (line 99)
      - [ ] savingCosts (line 101)
      - [ ] addingNewCost (line 102)
      - [ ] newCostValues (line 103)
      - [ ] savingNewCost (line 104)
      - [ ] deletingCost (line 105)
      - [ ] selectedEntries (line 139)
      - [ ] bulkEditMode (line 140)
  - [ ] Remove functions (search for each, delete):
      - [ ] getRowClassName
      - [ ] validateDatabaseEntry
      - [ ] cleanEntryForDatabase
      - [ ] calculateUnsavedChanges
      - [ ] loadCostBreakdown
      - [ ] updateCostItem
      - [ ] (Search for more cost-specific functions and remove)
  - [ ] Simplify keyboard shortcuts useEffect (remove Cell-specific shortcuts)
  - [ ] Run: pnpm type-check
  - [ ] ✓ Validation: Zero TypeScript errors, no unused variables
  
step_3_validation:
  - [ ] Run: pnpm type-check (zero errors)
  - [ ] Run: pnpm test (all tests pass)
  - [ ] Run: pnpm build (production succeeds)
  - [ ] Start dev server: pnpm dev
  - [ ] Open browser: http://localhost:3000
  - [ ] Expand a project with cost data
  - [ ] ✓ Verify: Cell displays correctly
  - [ ] ✓ Verify: All columns visible
  - [ ] ✓ Verify: Data accurate
  - [ ] Test inline editing (double-click row)
  - [ ] Test bulk selection and delete
  - [ ] Test keyboard shortcuts (Cmd+S, Escape)
  - [ ] Check console: No errors
  - [ ] Check network tab: tRPC requests successful
  - [ ] **WAIT FOR HUMAN VALIDATION APPROVAL**
  
step_4_commit_and_ledger:
  - [ ] Stage changes: git add apps/web/app/projects/page.tsx
  - [ ] Commit: "Phase C: Cost Breakdown Cell integration - complete replacement"
  - [ ] Update ledger.jsonl:
      ```json
      {
        "iteration_id": "iter_20251005_phase_c_cost_breakdown_integration",
        "human_prompt": "Phase C: Integrate Cost Breakdown Cell and delete old implementation",
        "timestamp": "[ISO timestamp]",
        "status": "SUCCESS",
        "phase": "phase_c_integration",
        "artifacts_created": [],
        "artifacts_modified": [
          {
            "type": "component",
            "id": "projects-page-cost-breakdown-section",
            "path": "apps/web/app/projects/page.tsx",
            "lines_removed": 800,
            "reason": "Replaced with CostBreakdownTableCell"
          }
        ],
        "artifacts_deleted": [],
        "validation": {
          "all_tests_pass": true,
          "coverage_percent": 100,
          "typescript_errors": 0,
          "architecture_compliance": "100%",
          "human_validation": "approved",
          "performance_regression": false
        },
        "metrics": {
          "total_duration_hours": 2.5,
          "lines_reduced": 800,
          "cell_integration_success": true
        }
      }
      ```
  - [ ] Commit ledger update
  - [ ] Push to remote
  
step_5_documentation:
  - [ ] Create Phase C completion report: `2025-10-05_phase-c_cost-breakdown_integration_complete.md`
  - [ ] Document:
      - [ ] Files modified
      - [ ] Lines removed
      - [ ] Validation results
      - [ ] Lessons learned
      - [ ] Screenshots of working Cell (optional)
  - [ ] Commit completion report
```

---

## Risk Mitigation

### Known Risks & Mitigations

**Risk 1**: State variable references in unexpected places
- **Impact**: TypeScript errors after deletion
- **Mitigation**: Use IDE "Find All References" before deleting each variable
- **Fallback**: TypeScript will catch all references immediately

**Risk 2**: Version switching breaks
- **Impact**: Cell doesn't update when version dropdown changes
- **Mitigation**: Carefully wire `activeVersion[projectId]` to Cell's `versionNumber` prop
- **Fallback**: Test version switching in manual validation

**Risk 3**: Total budget calculation breaks
- **Impact**: Budget total in project header shows wrong value
- **Mitigation**: Verify total budget calculation still works (may need separate query)
- **Fallback**: If broken, add quick fix to query Cell data or tRPC directly

**Risk 4**: Initial budget mode breaks
- **Impact**: Can't create new project budgets
- **Mitigation**: Keep `stagedNewEntries` and related state (used by Phase 3 Cell)
- **Fallback**: Test initial budget mode in manual validation

**Risk 5**: Missing behavioral assertions in integration
- **Impact**: Feature works differently than old implementation
- **Mitigation**: Thorough manual validation against all 7 assertions
- **Fallback**: Human validation gate catches this

### Contingency Plans

**If Cell doesn't display**:
1. Check browser console for errors
2. Check Network tab for failed tRPC requests
3. Verify procedures deployed (Phase A)
4. Check Cell import path correct
5. Verify props passed correctly (`projectId` required)

**If data is incorrect**:
1. Check `versionNumber` prop value
2. Verify `activeVersion[projectId]` has correct value
3. Test tRPC procedures directly with curl (from Phase A tests)
4. Compare Cell data with old implementation data

**If inline editing doesn't work**:
1. Verify Cell has edit mode (should activate on double-click)
2. Check Cell's internal state management
3. Review Phase B tests - editing test should be passing
4. Check tRPC mutations are wired correctly

**If worst case (complete failure)**:
1. Execute rollback strategy (git revert)
2. Verify old implementation works
3. Document failure in ledger (FAILED status)
4. Analyze failure (logs, errors, screenshots)
5. Create revised plan addressing failure
6. Retry with fixes

---

## Appendix A: Code Removal Guide

### State Variables to Remove

**Search and destroy** (use IDE "Find All References"):

```typescript
// apps/web/app/projects/page.tsx

// DELETE these state variables:
const [costBreakdowns, setCostBreakdowns] = useState<Record<string, CostBreakdown[]>>({})
const [editingCost, setEditingCost] = useState<string | null>(null)
const [editingValues, setEditingValues] = useState<CostBreakdown | null>(null)
const [savingCosts, setSavingCosts] = useState<Set<string>>(new Set())
const [addingNewCost, setAddingNewCost] = useState<string | null>(null)
const [newCostValues, setNewCostValues] = useState<NewCostEntry | null>(null)
const [savingNewCost, setSavingNewCost] = useState(false)
const [deletingCost, setDeletingCost] = useState<string | null>(null)
const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set())
const [bulkEditMode, setBulkEditMode] = useState(false)

// KEEP (used by other features):
const [stagedNewEntries, setStagedNewEntries] = useState<...>  // Initial budget mode
const [unsavedChangesCount, setUnsavedChangesCount] = useState<...>  // Initial budget mode
const [activeVersion, setActiveVersion] = useState<...>  // Version management
const [forecastVersions, setForecastVersions] = useState<...>  // Version management
```

### Functions to Remove

**Search for these function names and delete entire function bodies**:

```typescript
// DELETE these functions:
getRowClassName
validateDatabaseEntry
cleanEntryForDatabase
calculateUnsavedChanges
loadCostBreakdown
updateCostItem

// Search for more by pattern:
// - Functions that operate on CostBreakdown type
// - Functions that use editingCost, editingValues state
// - Functions that reference "cost" in name
```

### JSX Sections to Remove

**Lines 2243-2580**: Entire cost breakdown table and add new entry form

**DELETE** from:
```typescript
{(!costBreakdowns[project.id] || costBreakdowns[project.id].length === 0) &&
```

**TO**:
```typescript
                        )}
                      </>
                    )}
                  </div>
```

**REPLACE** with:
```typescript
{/* Cost Breakdown Table Cell */}
<CostBreakdownTableCell 
  projectId={project.id} 
  versionNumber={activeVersion[project.id] || "latest"}
/>
```

---

## Appendix B: Cell Props Reference

**Cell Component**: `components/cells/cost-breakdown-table-cell/component.tsx`

**Props Interface**:
```typescript
interface CostBreakdownTableCellProps {
  projectId: string                    // REQUIRED: UUID of project
  versionNumber?: number | "latest"    // OPTIONAL: Version to display (default: "latest")
  onVersionChange?: (version: number) => void  // OPTIONAL: Callback when version changes
}
```

**Usage Examples**:

```typescript
// Minimal usage:
<CostBreakdownTableCell projectId={project.id} />

// With version control:
<CostBreakdownTableCell 
  projectId={project.id} 
  versionNumber={activeVersion[project.id] || "latest"}
/>

// With version change handler:
<CostBreakdownTableCell 
  projectId={project.id} 
  versionNumber={activeVersion[project.id] || "latest"}
  onVersionChange={(v) => setActiveVersion(prev => ({ ...prev, [project.id]: v }))}
/>
```

**Internal Features** (handled by Cell):
- ✅ tRPC queries for data fetching
- ✅ Inline editing state management
- ✅ Bulk selection state
- ✅ Unsaved changes tracking
- ✅ Keyboard shortcuts (Cmd+S, Escape)
- ✅ Validation
- ✅ Loading/error/empty states

**Props NOT needed** (Cell handles internally):
- ❌ `isEditing` - Cell manages editing state
- ❌ `onSave` - Cell uses tRPC mutations directly
- ❌ `onDelete` - Cell uses tRPC mutations directly
- ❌ `data` - Cell queries via tRPC

---

## Appendix C: Manual Testing Script

**Complete manual testing sequence** for human validator:

```markdown
## Cost Breakdown Cell - Manual Validation Script

**Objective**: Verify all 7 behavioral assertions and integration points

### Setup
1. Start dev server: `pnpm dev`
2. Open browser: http://localhost:3000
3. Open DevTools: F12
4. Open Console tab
5. Open Network tab, filter by "trpc"

### Test 1: BA-003 - Display Cost Breakdown Table
- [  ] Expand a project with existing cost data
- [  ] ✓ Verify: Table appears with columns: Status, Cost Line, Spend Type, Sub Category, Budget Cost, Actions
- [  ] ✓ Verify: All data rows visible
- [  ] ✓ Verify: Data matches expected values

### Test 2: BA-008 - Empty State
- [  ] Create new project (no budget yet)
- [  ] Expand project
- [  ] ✓ Verify: Empty state message: "No budget created yet"
- [  ] ✓ Verify: Call-to-action: "Click 'Create Initial Budget'"

### Test 3: BA-009 - Inline Editing
- [  ] Expand project with data
- [  ] Double-click any row
- [  ] ✓ Verify: Row switches to edit mode
- [  ] ✓ Verify: Dropdowns for Cost Line, Spend Type
- [  ] ✓ Verify: Input fields for Sub Category, Budget Cost
- [  ] ✓ Verify: Save and Cancel buttons appear

### Test 4: BA-018 - Validation
- [  ] Enter edit mode (double-click row)
- [  ] Clear Cost Line field
- [  ] Click Save
- [  ] ✓ Verify: Error message shown
- [  ] ✓ Verify: Save blocked (entry not updated)
- [  ] Fill Cost Line field
- [  ] Click Save
- [  ] ✓ Verify: Save succeeds

### Test 5: BA-022 - Unsaved Changes Bar
- [  ] Enter edit mode
- [  ] Modify Budget Cost field
- [  ] Click Save
- [  ] ✓ Verify: Unsaved changes bar appears
- [  ] ✓ Verify: Count shown (e.g., "1 unsaved change")
- [  ] ✓ Verify: Save All and Discard buttons visible

### Test 6: BA-023 - Keyboard Shortcuts
- [  ] Enter edit mode
- [  ] Modify a field
- [  ] Press Cmd+S (Mac) or Ctrl+S (Windows/Linux)
- [  ] ✓ Verify: Entry saves
- [  ] Enter edit mode again
- [  ] Modify a field
- [  ] Press Escape
- [  ] ✓ Verify: Edit cancelled, changes reverted

### Test 7: BA-BULK-001 - Bulk Delete
- [  ] Enable bulk edit mode (checkboxes should appear)
- [  ] Check 2-3 entry checkboxes
- [  ] ✓ Verify: Bulk action bar appears at bottom
- [  ] ✓ Verify: Count shown (e.g., "3 items selected")
- [  ] Click "Delete Selected"
- [  ] ✓ Verify: Confirmation dialog appears
- [  ] Confirm deletion
- [  ] ✓ Verify: All selected entries deleted

### Integration Test 1: Version Switching
- [  ] Find project with multiple versions
- [  ] Change version dropdown
- [  ] ✓ Verify: Cell data updates
- [  ] Check Network tab
- [  ] ✓ Verify: New tRPC request made with correct version

### Integration Test 2: Performance
- [  ] Open React DevTools → Profiler
- [  ] Start recording
- [  ] Expand project
- [  ] Stop recording
- [  ] ✓ Verify: 2-3 renders total (initial + query completion)
- [  ] ✓ Verify: No excessive re-renders
- [  ] Check Network tab
- [  ] ✓ Verify: 1-2 tRPC requests (batched)

### Integration Test 3: Error Handling
- [  ] DevTools → Network tab
- [  ] Enable "Offline" mode
- [  ] Expand new project
- [  ] ✓ Verify: Error state shown (not loading forever)
- [  ] Disable "Offline" mode
- [  ] Refresh page
- [  ] ✓ Verify: Data loads successfully

### Console Check
- [  ] Review Console tab
- [  ] ✓ Verify: No errors
- [  ] ✓ Verify: No warnings (or only expected warnings)

### Final Check
- [  ] All tests passing? → ✅ VALIDATED - proceed with commit
- [  ] Any failures? → ❌ FIX ISSUES - document problems below

**Problems Found** (if any):
_[Describe any issues encountered]_

**Validator**: _[Name]_  
**Date**: _[Date]_  
**Time**: _[Duration]_
```

---

**Phase C Status**: ✅ PLAN COMPLETE  
**Ready for Phase 4**: YES (MigrationExecutor execution)  
**Confidence**: HIGH (Cell already tested, integration straightforward)  
**Critical Path**: Cost breakdown table (core user feature)  

**Next Action**: MigrationExecutor executes Phase 4 following checklist above
