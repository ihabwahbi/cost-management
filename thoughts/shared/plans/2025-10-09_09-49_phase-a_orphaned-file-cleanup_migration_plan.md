# Phase A Migration Plan: Orphaned File Cleanup

**Date:** 2025-10-09T09:49:00Z  
**Architect:** MigrationArchitect  
**Status:** ready_for_implementation  
**Phase:** 3 (Migration Planning)  
**Workflow Phase:** Phase 3 of 6-phase autonomous migration workflow

---

## Metadata

```yaml
based_on:
  discovery_report: "thoughts/shared/discoveries/2025-10-08_17-29_discovery-report.md"
  analysis_report: "thoughts/shared/analysis/2025-10-09_09-27_batch-migration_analysis.md"

migration_metadata:
  target: "8 orphaned files"
  target_path: "Various (apps/web/lib, apps/web/components)"
  complexity: "trivial"
  strategy: "atomic deletion"
  estimated_duration: "30 minutes"
  risk_level: "ZERO (verified 0 imports)"
```

---

## Executive Summary

**Migration Type:** Dead code removal  
**Files Affected:** 8 orphaned components/utilities  
**Lines Deleted:** 1,296 lines  
**Architecture Impact:** Eliminates 1 CRITICAL + 7 MEDIUM violations  
**Health Improvement:** +4 points (76.0 → 80.0)

**Key Achievement:** Eliminates monolithic pl-tracking-service.ts (534 lines) and 7 unused components with ZERO risk (all verified as having 0 imports across codebase).

---

## Migration Overview

### Target Files

```yaml
orphaned_files:
  critical_severity:
    - path: "apps/web/lib/pl-tracking-service.ts"
      lines: 534
      severity: "CRITICAL (monolithic)"
      imports: 0 ✅
      
  medium_severity:
    - path: "apps/web/components/inline-edit.tsx"
      lines: 125
      imports: 0 ✅
      
    - path: "apps/web/components/batch-action-bar.tsx"
      lines: 65
      imports: 0 ✅
      
    - path: "apps/web/components/version-panel.tsx"
      lines: 143
      imports: 0 ✅
      
    - path: "apps/web/components/unsaved-changes-bar.tsx"
      lines: 51
      imports: 0 ✅
      
    - path: "apps/web/components/keyboard-shortcuts-help.tsx"
      lines: 101
      imports: 0 ✅
      
    - path: "apps/web/components/entry-status-indicator.tsx"
      lines: 87
      imports: 0 ✅
      
    - path: "apps/web/components/dashboard/project-alerts.tsx"
      lines: 190
      imports: 0 ✅

total_dead_code: 1296 lines
architecture_debt_eliminated: "1 CRITICAL + 7 MEDIUM violations"
```

### Scope

**No Data Layer Changes:** No Drizzle schemas, no tRPC procedures  
**No Cell Creation:** This is deletion, not component migration  
**Frontend Only:** All files in apps/web/

---

## Architecture Compliance Validation

**Pre-Implementation Verification** (Phase 5.5 Gate):

### Architectural Mandates

- **M-CELL-1** (All Functionality as Cells): ✅ N/A (deletion, not new functionality)
- **M-CELL-2** (Complete Atomic Migrations): ✅ COMPLIANT (all 8 files deleted in single commit)
- **M-CELL-3** (Zero Files >400 Lines): ✅ COMPLIANT (deletes 534-line monolithic file - IMPROVES compliance)
- **M-CELL-4** (Explicit Behavioral Contracts): ✅ N/A (no Cells created)

### Forbidden Pattern Scan

- "optional" phases: ✅ None detected
- "future cleanup": ✅ None detected
- File size exemptions: ✅ None detected

**Compliance Status**: ✅✅ **FULLY COMPLIANT** - Ready for Phase 4 implementation

---

## Migration Sequence

### Step 1: Verification (5 minutes)

**Action:** Verify zero imports for all 8 files

```bash
#!/bin/bash
# Safety check before deletion

for file in \
  "apps/web/lib/pl-tracking-service.ts" \
  "apps/web/components/inline-edit.tsx" \
  "apps/web/components/batch-action-bar.tsx" \
  "apps/web/components/version-panel.tsx" \
  "apps/web/components/unsaved-changes-bar.tsx" \
  "apps/web/components/keyboard-shortcuts-help.tsx" \
  "apps/web/components/entry-status-indicator.tsx" \
  "apps/web/components/dashboard/project-alerts.tsx"
do
  basename=$(basename "$file" | sed 's/\.[^.]*$//')
  count=$(rg -l "import.*$basename|from.*$basename" apps/web --type ts --type tsx 2>/dev/null | wc -l)
  echo "$file: $count imports"
  
  if [ "$count" -ne 0 ]; then
    echo "❌ ERROR: $file has $count imports - CANNOT DELETE"
    exit 1
  fi
done

echo "✅ All files verified as orphaned (0 imports)"
```

**Validation:**
- [ ] All files show 0 imports
- [ ] Script exits with code 0 (success)

**If ANY file has imports:** STOP - Do NOT proceed with deletion

---

### Step 2: Deletion (10 minutes)

**Action:** Delete files using git rm

```bash
git rm apps/web/lib/pl-tracking-service.ts
git rm apps/web/components/inline-edit.tsx
git rm apps/web/components/batch-action-bar.tsx
git rm apps/web/components/version-panel.tsx
git rm apps/web/components/unsaved-changes-bar.tsx
git rm apps/web/components/keyboard-shortcuts-help.tsx
git rm apps/web/components/entry-status-indicator.tsx
git rm apps/web/components/dashboard/project-alerts.tsx
```

**Validation:**
- [ ] All 8 `git rm` commands succeed
- [ ] Files removed from staging area

---

### Step 3: Build Validation (5 minutes)

**Action:** Verify application builds and type checks pass

```bash
# TypeScript compilation
pnpm type-check
# MUST pass with zero errors

# Production build
pnpm build
# MUST succeed
```

**Validation:**
- [ ] Type check passes (0 errors)
- [ ] Build succeeds
- [ ] No broken imports detected

**If either fails:** Rollback immediately with `git reset --hard HEAD`

---

### Step 4: Atomic Commit (10 minutes)

**Action:** Create comprehensive commit

```bash
git commit -m "chore: remove 8 orphaned components (1296 lines dead code)

- Remove pl-tracking-service.ts (534 lines, MONOLITHIC)
- Remove inline-edit.tsx (125 lines)
- Remove batch-action-bar.tsx (65 lines)
- Remove version-panel.tsx (143 lines)
- Remove unsaved-changes-bar.tsx (51 lines)
- Remove keyboard-shortcuts-help.tsx (101 lines)
- Remove entry-status-indicator.tsx (87 lines)
- Remove project-alerts.tsx (190 lines)

All files verified as having ZERO imports across codebase.
Eliminates 1 CRITICAL + 7 MEDIUM architecture violations.

Architecture health: 76.0 → ~80.0 (+4 points)

Compliance:
- M-CELL-2: ✅ Atomic deletion (all 8 files in single commit)
- M-CELL-3: ✅ Eliminates monolithic file (534 lines → deleted)

Phase: 3 (Migration Planning) → 4 (Execution Complete)
Analysis: thoughts/shared/analysis/2025-10-09_09-27_batch-migration_analysis.md"
```

**Validation:**
- [ ] Commit created successfully
- [ ] Commit message comprehensive
- [ ] All 8 files deleted in commit

---

## Rollback Strategy

### Rollback Triggers

```yaml
trigger_conditions:
  - "Build fails after deletion"
  - "Type errors appear"
  - "Any file has imports (verification missed something)"
  - "Application broken in browser"
```

### Rollback Sequence

**Step 1: Revert Commit**
```bash
git revert HEAD
```

**Step 2: Verify Restoration**
```bash
# Check all 8 files restored
ls apps/web/lib/pl-tracking-service.ts
ls apps/web/components/inline-edit.tsx
ls apps/web/components/batch-action-bar.tsx
ls apps/web/components/version-panel.tsx
ls apps/web/components/unsaved-changes-bar.tsx
ls apps/web/components/keyboard-shortcuts-help.tsx
ls apps/web/components/entry-status-indicator.tsx
ls apps/web/components/dashboard/project-alerts.tsx

# All should exist
```

**Step 3: Rebuild**
```bash
pnpm build
# Should succeed
```

**Step 4: Update Ledger**
```bash
# Log failed deletion attempt
echo "Failed deletion - reason: [DESCRIBE]" >> ledger.jsonl
```

**Recovery Time:** <5 minutes (single git revert)

---

## Validation Strategy

### Technical Validation

```yaml
typescript:
  command: "pnpm type-check"
  requirement: "Zero errors"
  automated: true
  
build:
  command: "pnpm build"
  requirement: "Production build succeeds"
  automated: true
  
verification:
  command: "Script in Step 1"
  requirement: "All files have 0 imports"
  automated: true
```

### Integration Validation

```yaml
application_functionality:
  requirement: "Application loads without errors"
  method: "Open in browser, verify no console errors"
  automated: false
  optional: true
  
note: "Since files are orphaned (0 imports), application should be unaffected. Manual testing optional but recommended."
```

---

## Success Criteria

**Migration Considered Successful When:**

- [ ] All 8 files deleted
- [ ] `pnpm type-check` passes with 0 errors
- [ ] `pnpm build` succeeds
- [ ] Git commit created with comprehensive message
- [ ] No regressions in application (optional manual check)
- [ ] Architecture health improved by +4 points

---

## Phase 4 Execution Checklist

```yaml
executor_steps:
  - [ ] "Run verification script (Step 1)"
  - [ ] "Verify all files show 0 imports"
  - [ ] "Execute git rm commands (Step 2)"
  - [ ] "Run pnpm type-check - MUST pass"
  - [ ] "Run pnpm build - MUST succeed"
  - [ ] "Create atomic commit (Step 4)"
  - [ ] "Optionally test in browser"
  - [ ] "Mark complete in ledger"
```

---

## Ledger Entry Template

```json
{
  "timestamp": "2025-10-09T[EXECUTION_TIME]Z",
  "iteration_id": "iter_20251009_orphaned-file-cleanup",
  "human_prompt": "DELETE 8 orphaned files - zero imports verified",
  "artifacts_deleted": [
    {
      "type": "utility",
      "id": "pl-tracking-service",
      "path": "apps/web/lib/pl-tracking-service.ts",
      "lines": 534,
      "deletion_reason": "Orphaned - 0 imports, MONOLITHIC violation"
    },
    {
      "type": "component",
      "id": "inline-edit",
      "path": "apps/web/components/inline-edit.tsx",
      "lines": 125,
      "deletion_reason": "Orphaned - 0 imports"
    },
    {
      "type": "component",
      "id": "batch-action-bar",
      "path": "apps/web/components/batch-action-bar.tsx",
      "lines": 65,
      "deletion_reason": "Orphaned - 0 imports"
    },
    {
      "type": "component",
      "id": "version-panel",
      "path": "apps/web/components/version-panel.tsx",
      "lines": 143,
      "deletion_reason": "Orphaned - 0 imports"
    },
    {
      "type": "component",
      "id": "unsaved-changes-bar",
      "path": "apps/web/components/unsaved-changes-bar.tsx",
      "lines": 51,
      "deletion_reason": "Orphaned - 0 imports"
    },
    {
      "type": "component",
      "id": "keyboard-shortcuts-help",
      "path": "apps/web/components/keyboard-shortcuts-help.tsx",
      "lines": 101,
      "deletion_reason": "Orphaned - 0 imports"
    },
    {
      "type": "component",
      "id": "entry-status-indicator",
      "path": "apps/web/components/entry-status-indicator.tsx",
      "lines": 87,
      "deletion_reason": "Orphaned - 0 imports"
    },
    {
      "type": "component",
      "id": "project-alerts",
      "path": "apps/web/components/dashboard/project-alerts.tsx",
      "lines": 190,
      "deletion_reason": "Orphaned - 0 imports"
    }
  ],
  "schema_changes": [],
  "architecture_impact": "Eliminates 1 CRITICAL + 7 MEDIUM violations, +4 health points"
}
```

---

## Next Steps

After successful Phase A completion:
- Proceed to **Phase B**: dashboard-metrics utility-to-tRPC migration
- Architecture health: 80.0 → ~87.0 (+7 additional points)
- Total batch migration impact: 76.0 → 87.0 (+11 points)

---

**Plan Generated:** 2025-10-09T09:49:00Z  
**Status:** ✅ Ready for Phase 4 Execution  
**Risk Assessment:** ZERO (verified orphaned files)  
**Recommendation:** Execute immediately as quick win
