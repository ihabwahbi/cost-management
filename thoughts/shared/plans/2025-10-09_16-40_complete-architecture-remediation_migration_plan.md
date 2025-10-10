# Complete Architecture Remediation - Migration Plan

**Date**: 2025-10-09 16:40 UTC  
**Architect**: MigrationArchitect  
**Status**: ready_for_implementation  
**Phase**: 3 - Migration Planning  
**Workflow Phase**: Phase 3 of 6-phase autonomous migration workflow  
**Enhancement**: ✅ ULTRATHINK applied

---

## Based On

**Discovery Report**: `thoughts/shared/discoveries/2025-10-09_17-00_complete-architecture-remediation_discovery.md`  
**Analysis Report**: `thoughts/shared/analysis/2025-10-09_16-24_complete-architecture-remediation_analysis.md`

---

## Migration Metadata

```yaml
target_scope: "Complete ANDA Architecture Adoption"
components_to_migrate: 2
cells_to_document: 3
api_consolidations: 1
policy_documents: 1
complexity: "complex"
strategy: "phased_essential_completion"
estimated_duration: "20.5-22.5 hours (2-3 days)"
```

---

## EXECUTIVE SUMMARY

### Mission

Transform codebase to 100% ANDA (Agent-Navigable Dataflow Architecture) compliance through systematic remediation of all architectural debt.

### Current State

- **Architecture Health**: 68.77/100 (FAIR)
- **Architecture Debt**: 23 points
- **M-CELL-1 Compliance**: 92% (2 components need migration)
- **M-CELL-4 Compliance**: 87% (3 cells need ≥3 assertions)
- **API Duplication**: 1 instance (splitMappedAmount)

### Target State

- **Architecture Health**: 100/100 (PERFECT)
- **Architecture Debt**: 0 points
- **M-CELL-1 Compliance**: 100% (all components as Cells + 1 documented exemption)
- **M-CELL-4 Compliance**: 100% (all 24 Cells have ≥3 assertions + pipelines)
- **API Duplication**: 0 instances

### Strategy: MODIFIED from Analysis

**Analysis Recommendation**: Exempt app-shell.tsx from Cell migration  
**Architect Decision**: ❌ REJECTED - Violates M-CELL-1  
**Reason**: app-shell.tsx has state, logic, and 5 behavioral requirements → MUST be Cell

**Final Strategy**:
- ✅ Migrate app-shell.tsx to Cell (NOT exemption)
- ✅ Migrate po-table.tsx to Cell
- ✅ Document 3 cells (manifests + pipelines + tests)
- ✅ Consolidate API duplicate
- ✅ Create policy for sidebar.tsx ONLY (valid exemption)

### Key Decisions

1. **M-CELL-1 Enforcement**: All components with behavioral requirements become Cells
2. **No Layout Component Exemption**: app-shell has logic/state → is a Cell
3. **Valid Exemption**: Only sidebar.tsx (third-party shadcn/ui component)
4. **Atomic Migrations**: All changes in single commits, old components deleted
5. **Complete Extraction**: All files ≤150 lines (target: ≤100 for most)

---

## ARCHITECTURE COMPLIANCE VALIDATION

**Pre-Implementation Verification** (Phase 5.5 Self-Validation):

### Architectural Mandates

✅ **M-CELL-1** (All Functionality as Cells):
- app-shell.tsx: Has state + logic + 5 behavioral assertions → Cell migration planned
- po-table.tsx: Has logic + 10 behavioral assertions → Cell migration planned
- sidebar.tsx: Third-party shadcn/ui component → Valid exemption documented
- **Status**: COMPLIANT - All components with behavioral requirements planned as Cells

✅ **M-CELL-2** (Complete Atomic Migrations):
- app-shell-cell: Old component deleted in Step 6 (same migration)
- po-table-cell: Old component deleted in Step 7 (same migration)
- No "optional" phases present
- **Status**: COMPLIANT - All migrations atomic

✅ **M-CELL-3** (Zero God Components):
- app-shell-cell: Max file 100 lines (7 files extracted)
- po-table-cell: Max file 150 lines (15 files extracted)
- All extraction strategies defined
- **Status**: COMPLIANT - All files ≤150 lines

✅ **M-CELL-4** (Explicit Behavioral Contracts):
- app-shell-cell: 5 assertions planned
- po-table-cell: 10 assertions planned
- cost-breakdown-table: 6 assertions (1→6)
- dashboard-skeleton: 4 assertions (1→4)
- smart-kpi-card: 6 assertions (1→6)
- **Status**: COMPLIANT - All ≥3 assertions

### Specialized Procedure Architecture

✅ **One Procedure Per File**: No new procedures (consolidation deletes duplicate)  
✅ **Procedure Size Limits**: All procedures ≤200 lines  
✅ **Router Complexity**: All routers ≤50 lines  
✅ **No Parallel Implementations**: Consolidation deletes duplicate helper

### Forbidden Pattern Scan

✅ "optional" phases: **None detected**  
✅ "future cleanup": **None detected**  
✅ File size exemptions: **None detected**  
✅ "temporary" implementations: **None detected**

### Compliance Status

**✅ COMPLIANT** - Ready for Phase 4 implementation

---

## CATEGORY 1: COMPONENT MIGRATIONS

### 1.1 app-shell.tsx → app-shell-cell

**File**: `apps/web/components/app-shell.tsx` (175 lines)  
**Target**: `apps/web/components/cells/app-shell-cell/`  
**Complexity**: Medium  
**Duration**: 3.5-4 hours  
**Strategy**: Standard 7-step with extraction

#### Classification Justification

**M-CELL-1 Compliance Check**:
- ✅ Has state management: `useState` for sidebar toggle
- ✅ Has business logic: `getBreadcrumbs()` routing function
- ✅ Has behavioral requirements: 5 behavioral assertions
- ✅ Has user interactions: Menu clicks, nav clicks, overlay clicks
- ✅ Is testable: All 5 assertions verifiable via unit tests

**Decision**: MUST be Cell (not layout exemption)

**Rejected Exemption Rationale**: Analysis proposed "layout component exemption" but this violates M-CELL-1. Components with state, logic, and behavioral requirements are Cells regardless of their role in the application structure.

#### Cell Structure Design

```
apps/web/components/cells/app-shell-cell/
├── component.tsx              # Main orchestrator (~100 lines)
├── components/
│   ├── mobile-sidebar.tsx     # Sidebar with overlay (~40 lines)
│   └── breadcrumbs.tsx        # Breadcrumb generation (~35 lines)
├── hooks/
│   └── use-sidebar-state.ts   # Sidebar toggle logic (~20 lines)
├── manifest.json              # 5 behavioral assertions
├── pipeline.yaml              # 5 validation gates
└── __tests__/
    └── component.test.tsx     # All BA tests
```

**File Count**: 7 files  
**Max File Size**: 100 lines ✅

#### Behavioral Assertions

```json
{
  "id": "app-shell-cell",
  "version": "1.0.0",
  "description": "Application shell with navigation, breadcrumbs, and mobile sidebar",
  "behavioral_assertions": [
    {
      "id": "BA-001",
      "requirement": "Sidebar MUST toggle visibility on mobile menu click",
      "validation": "Unit test: click menu button, verify sidebar slides in/out",
      "criticality": "high",
      "source": "Current implementation lines 38, 145-150"
    },
    {
      "id": "BA-002",
      "requirement": "Breadcrumbs MUST update based on current pathname",
      "validation": "Unit test: mock pathname changes, verify breadcrumb trail",
      "criticality": "high",
      "source": "Current implementation lines 41-57"
    },
    {
      "id": "BA-003",
      "requirement": "Active navigation item MUST be highlighted",
      "validation": "Unit test: navigate to route, verify className includes 'bg-primary'",
      "criticality": "high",
      "source": "Current implementation lines 90-110"
    },
    {
      "id": "BA-004",
      "requirement": "Clicking overlay MUST close mobile sidebar",
      "validation": "Unit test: open sidebar, click overlay, verify sidebar closes",
      "criticality": "medium",
      "source": "Current implementation line 145"
    },
    {
      "id": "BA-005",
      "requirement": "Clicking nav link MUST close mobile sidebar",
      "validation": "Unit test: open sidebar, click link, verify sidebar closes",
      "criticality": "medium",
      "source": "Current implementation lines 90-110"
    }
  ]
}
```

#### Migration Sequence: 7 Steps

**Step 1: Cell Structure Creation** (30 min)
```yaml
action: "Create Cell directory structure"
location: "apps/web/components/cells/app-shell-cell/"
files:
  - component.tsx (stub)
  - manifest.json (5 assertions)
  - pipeline.yaml (5 gates)
  - __tests__/component.test.tsx (stub)
validation: "Directory structure created"
```

**Step 2: Extract Sub-Components** (1 hour)
```yaml
extract_breadcrumbs:
  from: "app-shell.tsx lines 41-57"
  to: "components/breadcrumbs.tsx"
  size: "~35 lines"
  logic: "getBreadcrumbs() function → Breadcrumbs component"

extract_sidebar_hook:
  from: "app-shell.tsx line 38"
  to: "hooks/use-sidebar-state.ts"
  size: "~20 lines"
  logic: "useState → custom hook with toggle function"

extract_mobile_sidebar:
  from: "app-shell.tsx lines 145-170"
  to: "components/mobile-sidebar.tsx"
  size: "~40 lines"
  logic: "Mobile sidebar JSX → separate component"

validation: "All files ≤100 lines"
```

**Step 3: Implement Main Component** (1 hour)
```yaml
file: "component.tsx"
size: "~100 lines"
implementation:
  - Import use-sidebar-state hook
  - Import Breadcrumbs component
  - Import MobileSidebar component
  - Use Next.js usePathname
  - Render breadcrumbs with current path
  - Render desktop navigation
  - Render mobile sidebar with state
validation: "Component renders, no errors"
```

**Step 4: Write Tests** (1 hour)
```yaml
file: "__tests__/component.test.tsx"
tests:
  - BA-001: Sidebar toggle test
  - BA-002: Breadcrumb update test
  - BA-003: Active nav highlight test
  - BA-004: Overlay click test
  - BA-005: Nav link click test
coverage_target: "80%+"
validation: "All tests pass"
```

**Step 5: Integration** (15 min)
```yaml
affected_files:
  - apps/web/app/layout.tsx
changes:
  old: "import { AppShell } from '@/components/app-shell'"
  new: "import { AppShell } from '@/components/cells/app-shell-cell/component'"
validation: "Build succeeds"
```

**Step 6: Cleanup & Delete** (15 min)
```yaml
delete: "apps/web/components/app-shell.tsx"
verification:
  command: "grep -r 'app-shell' apps/web --exclude-dir=cells"
  expected: "Zero results"
validation: "Old component deleted"
```

**Step 7: Full Validation** (30 min)
```yaml
technical_gates:
  - "pnpm type-check" → Zero errors
  - "pnpm test" → All pass, coverage ≥80%
  - "pnpm build" → Production succeeds
file_size_check:
  command: "find components/cells/app-shell-cell -name '*.tsx' -exec wc -l {} +"
  requirement: "All files ≤100 lines"
manual_validation:
  - Cell displays correctly in browser
  - Sidebar toggles work on mobile
  - Breadcrumbs update on navigation
  - Active nav items highlighted
  - No console errors
approval: "User must respond 'VALIDATED'"
```

#### Rollback Strategy

```yaml
trigger_conditions:
  - TypeScript errors
  - Test failures
  - Build failures
  - Manual validation fails

rollback_sequence:
  step_1: "git revert [migration commit]"
  step_2: "Verify old component restored"
  step_3: "Update ledger with FAILED status"

philosophy: "Full rollback on any failure"
```

---

### 1.2 po-table.tsx → po-table-cell

**File**: `apps/web/components/po-table.tsx` (266 lines)  
**Target**: `apps/web/components/cells/po-table-cell/`  
**Complexity**: Complex  
**Duration**: 6-8 hours  
**Strategy**: Standard 7-step with extensive extraction

#### Critical Issues to Fix

1. 🔴 **Type Safety Violation** (Line 159): `(el as any).indeterminate`
   - Fix: Use `HTMLInputElement` type assertion
2. 🔴 **Duplicated Interfaces**: PO interface defined in 2 places
   - Fix: Use tRPC inferred types
3. 🔴 **Parent Component Bug** (po-mapping/page.tsx:170): `onPOsSelection={() => {}}`
   - Fix: Implement proper callback to update parent state

#### Cell Structure Design

```
apps/web/components/cells/po-table-cell/
├── component.tsx              # Main orchestrator (~150 lines)
├── components/
│   ├── po-row.tsx            # PO row component (~80 lines)
│   ├── line-item-row.tsx     # Line item row (~60 lines)
│   ├── status-badge.tsx      # Mapping status badge (~40 lines)
│   └── fmt-badge.tsx         # FMT badge (~30 lines)
├── hooks/
│   └── use-po-expansion.ts   # Expansion state logic (~30 lines)
├── utils/
│   └── po-formatters.ts      # Currency/date formatting (~40 lines)
├── types.ts                  # TypeScript types (~50 lines)
├── manifest.json             # 10 behavioral assertions
├── pipeline.yaml             # Validation gates
└── __tests__/
    ├── component.test.tsx
    ├── po-row.test.tsx
    └── utils.test.tsx
```

**File Count**: 15 files  
**Max File Size**: 150 lines ✅

#### Behavioral Assertions

```json
{
  "id": "po-table-cell",
  "version": "1.0.0",
  "description": "PO table with expand/collapse, selection, and status indicators",
  "behavioral_assertions": [
    {
      "id": "BA-001",
      "requirement": "Component MUST render all PO data in table format",
      "validation": "Unit test: verify all PO fields rendered",
      "criticality": "high"
    },
    {
      "id": "BA-002",
      "requirement": "Expand/collapse MUST toggle line item visibility",
      "validation": "Unit test: click expand, verify line items visible",
      "criticality": "high"
    },
    {
      "id": "BA-003",
      "requirement": "Row selection MUST highlight selected row",
      "validation": "Unit test: click row, verify bg-accent/10 class",
      "criticality": "high"
    },
    {
      "id": "BA-004",
      "requirement": "Select all checkbox MUST select/deselect all POs",
      "validation": "Unit test: click select-all, verify callback called with all IDs",
      "criticality": "high"
    },
    {
      "id": "BA-005",
      "requirement": "Indeterminate checkbox state MUST show when some selected",
      "validation": "Unit test: select 1 of 3, verify checkbox.indeterminate === true",
      "criticality": "medium"
    },
    {
      "id": "BA-006",
      "requirement": "Currency formatting MUST use AUD with no decimals",
      "validation": "Unit test: formatCurrency(10000) === 'A$10,000'",
      "criticality": "medium"
    },
    {
      "id": "BA-007",
      "requirement": "Date formatting MUST use DD MMM YYYY format",
      "validation": "Unit test: formatDate('2025-01-15') === '15 Jan 2025'",
      "criticality": "medium"
    },
    {
      "id": "BA-008",
      "requirement": "Mapping status badge MUST show green when fully mapped",
      "validation": "Unit test: mapped_count === total_line_items shows green",
      "criticality": "high"
    },
    {
      "id": "BA-009",
      "requirement": "FMT PO badge MUST show blue 'Yes' or gray 'No'",
      "validation": "Unit test: verify badge color based on fmt_po boolean",
      "criticality": "medium"
    },
    {
      "id": "BA-010",
      "requirement": "Checkbox clicks MUST not propagate to row click",
      "validation": "Unit test: click checkbox, verify onPOSelect NOT called",
      "criticality": "high"
    }
  ]
}
```

#### Migration Sequence: 8 Steps (Extended)

**Step 1: Utility Extraction** (30 min)
```yaml
create_currency_utils:
  file: "apps/web/lib/currency-utils.ts"
  exports: "formatCurrency(amount: number) => string"

create_date_utils:
  file: "apps/web/lib/date-utils.ts"
  exports: "formatDate(dateString: string) => string"
```

**Step 2: Type Extraction** (45 min)
```yaml
create_types:
  file: "cells/po-table-cell/types.ts"
  includes:
    - POData (from tRPC)
    - LineItemData
    - All component prop types
  fixes:
    - Remove duplicate interfaces
    - Fix type safety violation (HTMLInputElement)
```

**Step 3: Component Extraction** (2 hours)
```yaml
extract_hook:
  file: "hooks/use-po-expansion.ts"
  size: "~30 lines"

extract_po_row:
  file: "components/po-row.tsx"
  size: "~80 lines"

extract_line_item_row:
  file: "components/line-item-row.tsx"
  size: "~60 lines"

extract_status_badge:
  file: "components/status-badge.tsx"
  size: "~40 lines"

extract_fmt_badge:
  file: "components/fmt-badge.tsx"
  size: "~30 lines"
```

**Step 4: Main Component** (1 hour)
```yaml
file: "component.tsx"
size: "~150 lines"
fixes:
  - Use HTMLInputElement type (not any)
  - Fix indeterminate property assignment
```

**Step 5: Testing** (2-3 hours)
```yaml
test_files:
  - "__tests__/component.test.tsx" (6 tests)
  - "__tests__/po-row.test.tsx" (2 tests)
  - "__tests__/utils.test.tsx" (2 tests)
coverage: "80%+"
```

**Step 6: Integration & Parent Fix** (30 min)
```yaml
update_parent:
  file: "apps/web/app/po-mapping/page.tsx"
  line_170:
    old: "onPOsSelection={() => {}}"
    new: "onPOsSelection={(ids) => setSelectedPOs(ids)}"
  fix: "Broken multi-select functionality restored"
```

**Step 7: Cleanup & Delete** (30 min)
```yaml
delete: "apps/web/components/po-table.tsx"
verification: "grep -r 'po-table' apps/web --exclude-dir=cells"
```

**Step 8: Full Validation** (1 hour)
```yaml
technical_gates:
  - "pnpm type-check" → Zero errors
  - "pnpm test" → All pass, coverage ≥80%
  - "pnpm build" → Production succeeds
file_size_check: "All files ≤150 lines"
manual_validation:
  - Cell displays in PO mapping page
  - Multi-select works (parent bug fixed)
  - Status badges correct colors
  - Formatting correct
approval: "User must respond 'VALIDATED'"
```

---

## CATEGORY 2: CELL DOCUMENTATION

### 2.1 cost-breakdown-table

**Duration**: 4 hours  
**Current**: 1 assertion → **Target**: 6 assertions

**Task 1: Update manifest.json** (30 min)
- Add BA-002 through BA-006
- Document nested data structure
- Update dataContract section

**Task 2: Create pipeline.yaml** (30 min)
```yaml
gates:
  - type-check
  - unit-tests (coverage ≥80%)
  - behavioral-assertions (all 6 verified)
  - accessibility (WCAG AA)
  - lint
```

**Task 3: Write test suite** (3 hours)
- Test all 6 behavioral assertions
- Test expand/collapse logic
- Test formatters
- Test empty state
- Coverage: 80%+

---

### 2.2 dashboard-skeleton

**Duration**: 1 hour  
**Current**: 1 assertion → **Target**: 4 assertions  
**Note**: Tests already exist

**Task 1: Update manifest.json** (30 min)
- Add BA-002 through BA-004
- Document static component nature

**Task 2: Create pipeline.yaml** (30 min)

---

### 2.3 smart-kpi-card

**Duration**: 4 hours  
**Current**: 1 assertion → **Target**: 6 assertions

**Task 1: Update manifest.json** (1 hour)
- Add BA-002 through BA-006
- Document all prop variants
- Document MiniKPICard variant

**Task 2: Create pipeline.yaml** (30 min)

**Task 3: Write test suite** (2.5 hours)
- Test all 6 behavioral assertions
- Test MiniKPICard variant
- Test accessibility
- Coverage: 80%+

---

## CATEGORY 3: API CONSOLIDATION

**Duration**: 30 minutes

### splitMappedAmount Duplicate Removal

**Canonical**: `packages/api/src/utils/pl-calculations.ts` (lines 18-47)  
**Duplicate**: `packages/api/src/procedures/dashboard/helpers/split-mapped-amount.helper.ts`

**Step 1: Delete Duplicate** (2 min)
```bash
rm packages/api/src/procedures/dashboard/helpers/split-mapped-amount.helper.ts
```

**Step 2: Update Imports** (10 min)
```yaml
affected_procedures:
  - get-pl-metrics.procedure.ts
  - get-pl-timeline.procedure.ts
  - get-promise-dates.procedure.ts
  - get-financial-control-metrics.procedure.ts

change:
  old: "import { splitMappedAmount } from './helpers/split-mapped-amount.helper'"
  new: "import { splitMappedAmount } from '../../utils/pl-calculations'"
```

**Step 3: Test Procedures** (10 min)
```bash
./test-procedures.sh dashboard
# All procedures must return 200 OK
```

**Step 4: Verify Cleanup** (3 min)
```bash
grep -r 'split-mapped-amount' packages/api --include="*.ts"
# Expected: Zero results for helper path
```

**Breaking Change Risk**: ZERO (canonical is more robust)

---

## CATEGORY 4: POLICY DOCUMENTATION

**Duration**: 30 minutes

### Create architectural-policies.md

**File**: `docs/architectural-policies.md` (NEW)

**Purpose**: Document valid exemption for sidebar.tsx ONLY

**Content Structure**:
1. Third-Party Component Exemptions
   - Policy statement
   - 5 exemption criteria
   - Approved exemptions (sidebar.tsx only)
   - Exemption request process
2. Exemption Review (quarterly)
3. Layout Component Clarification
   - app-shell.tsx NOT exempt (has logic/state)
   - Only framework files + pure shadcn components exempt

**Sidebar.tsx Exemption**:
- ✅ Third-party shadcn/ui component
- ✅ 726 lines (vendor-maintained)
- ✅ No custom business logic
- ✅ Valid per Section 3.2 of architecture

---

## COMPLETE REMEDIATION SEQUENCING

### Phase A: Quick Wins (1 hour)

**A1: API Consolidation** (30 min)
1. Delete duplicate helper
2. Update 4 imports
3. Test procedures
4. Verify cleanup

**A2: Policy Documentation** (30 min)
1. Create architectural-policies.md
2. Document sidebar.tsx exemption

---

### Phase B: Cell Documentation (9 hours)

**B1: dashboard-skeleton** (1 hour)
1. Update manifest (add 3 assertions)
2. Create pipeline

**B2: cost-breakdown-table** (4 hours)
1. Update manifest (add 5 assertions)
2. Create pipeline
3. Write test suite

**B3: smart-kpi-card** (4 hours)
1. Update manifest (add 5 assertions)
2. Create pipeline
3. Write test suite

---

### Phase C: Component Migrations (10-12 hours)

**C1: app-shell-cell** (3.5-4 hours)
1. Create Cell structure
2. Extract components/hooks
3. Implement main component
4. Write tests
5. Update imports
6. Delete old component
7. Full validation

**C2: po-table-cell** (6-8 hours)
1. Extract utilities
2. Create types (fix type safety)
3. Extract components/hooks
4. Implement main component
5. Write tests
6. Update parent (fix bug)
7. Delete old component
8. Full validation

---

### Phase D: Final Validation (30 min)

**Run All Validation Commands**:
```bash
# M-CELL-1
grep -r "useState\|useEffect" apps/web/components --include="*.tsx" | grep -v "/cells/" | grep -v "/ui/"

# M-CELL-2
./scripts/validate-no-parallel-implementations.sh

# M-CELL-3
find apps/web/components/cells -name "*.tsx" -exec wc -l {} + | awk '$1 > 400'

# M-CELL-4
find apps/web/components/cells -name manifest.json -exec jq '.behavioral_assertions | length >= 3' {} \; | grep false
```

**Update Architecture Health**:
- M-CELL-1: 100% ✅ (24 Cells + 1 valid exemption)
- M-CELL-2: 100% ✅
- M-CELL-3: 100% ✅
- M-CELL-4: 100% ✅ (all 24 Cells have ≥3 assertions)

---

## SUCCESS CRITERIA

### Architecture Health Targets

```yaml
overall_health: "100/100 (PERFECT)"
type_safety: "100%"
cell_quality: "100/100"
mandate_compliance: "100%"
architecture_debt_points: "0"
```

### Validation Commands

All commands must pass before marking complete:

```bash
# God components check
find apps/web/components -name "*.tsx" -exec wc -l {} + | awk '$1 > 400'
# Expected: Empty output (or only sidebar.tsx with documented exemption)

# Cell structure compliance
total_cells=$(find components/cells -maxdepth 1 -type d | wc -l)
cells_with_manifest=$(find components/cells/*/manifest.json | wc -l)
compliance_rate=$((cells_with_manifest * 100 / total_cells))
# Expected: 100%

# Parallel implementation check
./scripts/validate-no-parallel-implementations.sh
# Expected: Exit 0
```

---

## ROLLBACK STRATEGIES

### Per-Migration Rollback

**For Each Migration**:
```yaml
trigger: "Any validation failure"
action: "git revert [migration commit]"
recovery:
  - Restore old component
  - Remove new Cell directory
  - Revert import changes
  - Update ledger with FAILED
philosophy: "Full rollback, no partial states"
```

### Global Rollback

**If Multiple Migrations Fail**:
```bash
# Revert all changes in Phase C
git revert --no-commit [start_commit]..HEAD
git commit -m "Rollback: Complete Architecture Remediation - validation failures"
```

---

## PITFALL PREVENTION

### From trpc-debugging-guide.md

✅ **Infinite Render Loops**: N/A (no tRPC queries in these components)  
✅ **Date Serialization**: N/A (no date inputs)  
✅ **SQL Syntax**: N/A (no new procedures)  
✅ **Missing Deployment**: N/A (no edge function changes)

### From cell-development-checklist.md

✅ **Memoization**: app-shell uses local state only (no complex objects)  
✅ **File Size**: All extractions planned to ≤150 lines  
✅ **Testing**: All BAs have test specifications  
✅ **Type Safety**: po-table type violations will be fixed

---

## LEDGER ENTRY SPECIFICATION

### Iteration Metadata

```json
{
  "iterationId": "mig_20251009_complete-architecture-remediation",
  "timestamp": "2025-10-09T16:40:00Z",
  "humanPrompt": "Complete 100% ANDA architecture adoption - address all remaining architectural debt with 100% compliance to architecture blueprint",
  "strategy": "phased_essential_completion_modified",
  "phases": [
    "A: Quick Wins (API + Policy)",
    "B: Cell Documentation (3 cells)",
    "C: Component Migrations (2 cells)",
    "D: Final Validation"
  ],
  "duration_estimate_ms": 79200000,
  "compliance_status": "100%_ANDA_compliant"
}
```

### Artifacts Created

```json
{
  "created": [
    {"type": "cell", "id": "app-shell-cell", "path": "apps/web/components/cells/app-shell-cell"},
    {"type": "cell", "id": "po-table-cell", "path": "apps/web/components/cells/po-table-cell"},
    {"type": "policy", "id": "architectural-policies", "path": "docs/architectural-policies.md"},
    {"type": "manifest", "id": "cost-breakdown-table-manifest", "path": "apps/web/components/cells/cost-breakdown-table/manifest.json"},
    {"type": "manifest", "id": "dashboard-skeleton-manifest", "path": "apps/web/components/cells/dashboard-skeleton/manifest.json"},
    {"type": "manifest", "id": "smart-kpi-card-manifest", "path": "apps/web/components/cells/smart-kpi-card/manifest.json"},
    {"type": "pipeline", "id": "cost-breakdown-table-pipeline", "path": "apps/web/components/cells/cost-breakdown-table/pipeline.yaml"},
    {"type": "pipeline", "id": "dashboard-skeleton-pipeline", "path": "apps/web/components/cells/dashboard-skeleton/pipeline.yaml"},
    {"type": "pipeline", "id": "smart-kpi-card-pipeline", "path": "apps/web/components/cells/smart-kpi-card/pipeline.yaml"},
    {"type": "tests", "id": "app-shell-cell-tests", "path": "apps/web/components/cells/app-shell-cell/__tests__/"},
    {"type": "tests", "id": "po-table-cell-tests", "path": "apps/web/components/cells/po-table-cell/__tests__/"},
    {"type": "tests", "id": "cost-breakdown-table-tests", "path": "apps/web/components/cells/cost-breakdown-table/__tests__/"},
    {"type": "tests", "id": "smart-kpi-card-tests", "path": "apps/web/components/cells/smart-kpi-card/__tests__/"}
  ]
}
```

### Artifacts Modified

```json
{
  "modified": [
    {"type": "layout", "path": "apps/web/app/layout.tsx", "changes": ["Updated import to app-shell-cell"]},
    {"type": "page", "path": "apps/web/app/po-mapping/page.tsx", "changes": ["Updated import to po-table-cell", "Fixed onPOsSelection callback"]},
    {"type": "procedure", "path": "packages/api/src/procedures/dashboard/get-pl-metrics.procedure.ts", "changes": ["Updated splitMappedAmount import"]},
    {"type": "procedure", "path": "packages/api/src/procedures/dashboard/get-pl-timeline.procedure.ts", "changes": ["Updated splitMappedAmount import"]},
    {"type": "procedure", "path": "packages/api/src/procedures/dashboard/get-promise-dates.procedure.ts", "changes": ["Updated splitMappedAmount import"]},
    {"type": "procedure", "path": "packages/api/src/procedures/dashboard/get-financial-control-metrics.procedure.ts", "changes": ["Updated splitMappedAmount import"]},
    {"type": "architecture-health", "path": "thoughts/shared/architecture-health/[latest].md", "changes": ["Updated all mandates to 100% compliance"]}
  ]
}
```

### Artifacts Replaced

```json
{
  "replaced": [
    {
      "type": "component",
      "id": "app-shell",
      "path": "apps/web/components/app-shell.tsx",
      "deletedAt": "[execution-timestamp]",
      "reason": "Migrated to Cell architecture (M-CELL-1 compliance - has state + logic + behavioral requirements)"
    },
    {
      "type": "component",
      "id": "po-table",
      "path": "apps/web/components/po-table.tsx",
      "deletedAt": "[execution-timestamp]",
      "reason": "Migrated to Cell architecture (M-CELL-1 compliance - has business logic + 10 behavioral requirements)"
    },
    {
      "type": "api-helper",
      "id": "split-mapped-amount-helper",
      "path": "packages/api/src/procedures/dashboard/helpers/split-mapped-amount.helper.ts",
      "deletedAt": "[execution-timestamp]",
      "reason": "Duplicate implementation consolidated to utils/pl-calculations.ts"
    }
  ]
}
```

---

## PHASE 4 EXECUTION CHECKLIST

**For MigrationExecutor**:

### Phase A: Quick Wins
- [ ] Delete split-mapped-amount.helper.ts
- [ ] Update 4 procedure imports
- [ ] Test procedures with curl
- [ ] Verify cleanup
- [ ] Create architectural-policies.md
- [ ] Document sidebar.tsx exemption

### Phase B: Cell Documentation
- [ ] Update dashboard-skeleton manifest + pipeline
- [ ] Update cost-breakdown-table manifest + pipeline + tests
- [ ] Update smart-kpi-card manifest + pipeline + tests

### Phase C: Component Migrations
- [ ] Migrate app-shell.tsx to app-shell-cell (7 steps)
- [ ] Migrate po-table.tsx to po-table-cell (8 steps)
- [ ] Fix parent component bug
- [ ] Fix type safety violations

### Phase D: Final Validation
- [ ] Run all validation commands
- [ ] Update architecture health report
- [ ] Confirm 100% ANDA compliance

---

## NEXT PHASE

**Phase 4: Migration Implementation** (MigrationExecutor)

**Ready to proceed**: ✅ YES

**Plan status**: ✅ COMPLIANT - All mandates satisfied

**Zero deviation execution**: Plan provides complete specifications for autonomous implementation

---

**Migration Plan Complete**  
**Status**: Ready for Phase 4 Execution  
**Compliance**: 100% ANDA Architecture Compliant  
**Path to 100% ANDA**: CLEAR ✅
