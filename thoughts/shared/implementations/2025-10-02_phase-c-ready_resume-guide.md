# Migration Resume Guide: Phase C - Integration & Orchestration

## Session Summary

**Date**: 2025-10-02  
**Phase Completed**: B (Mutation Operations) ✅  
**Next Phase**: C (Integration & Orchestration)  
**Git Commit**: `e8fd4fa` - "Phase B Complete: All mutation operations"  
**Status**: ✅ CLEAN CHECKPOINT - Safe to resume

---

## What Was Completed (Phases A & B)

### ✅ Phase A: Read Operations (COMPLETE)

**tRPC Procedures** (5/9):
1. ✅ **poMapping.getProjects** - No input, returns projects array
2. ✅ **poMapping.getSpendTypes** - Filters by projectId
3. ✅ **poMapping.getSpendSubCategories** - Filters by projectId + spendType
4. ✅ **poMapping.findMatchingCostBreakdown** - 3-table JOIN to find cost breakdown
5. ✅ **poMapping.getExistingMappings** - 3-table JOIN to get mapping details

**Cells** (2/4):
1. ✅ **details-panel-selector** - Cascading dropdowns for project/spend type/subcategory
2. ✅ **details-panel-viewer** - Read-only display of existing mappings (green card)

### ✅ Phase B: Mutation Operations (COMPLETE)

**tRPC Procedures** (3/9):
6. ✅ **poMapping.createMapping** - Maps all PO line items to cost breakdown
7. ✅ **poMapping.updateMapping** - Updates existing mappings
8. ✅ **poMapping.clearMappings** - Deletes mappings with array of line item IDs

**Cells** (1/4):
3. ✅ **details-panel-mapper** - CRUD operations with two-step confirmation for clear

**Infrastructure**:
- ✅ Edge function deployed to Supabase (bykrhpaqaxhyfrqfvbus)
- ✅ All procedures curl-tested and database-verified
- ✅ TypeScript: Zero errors
- ✅ Git checkpoints: 3 created (B.1, B.2, B Complete)

---

## What's Next: Phase C - Integration & Orchestration

Phase C will complete the migration by creating the orchestrator cell and integrating all sub-cells into the main application.

### Overview of Phase C
- **1 helper procedure** to implement (getCostBreakdownById)
- **1 orchestrator cell** to create (details-panel)
- **Integration** into po-mapping page
- **Complete replacement** of old component
- **5 git checkpoints** required
- **Final validation gate**

**Estimated Duration**: 5.5 hours

---

## Step 1: Implement Procedure 9 (getCostBreakdownById) - 1 hour

### Purpose
Helper procedure to find a cost breakdown ID by project, spend type, and subcategory. Used by the orchestrator to initialize state.

### Specification (from migration plan lines 330-358)

**Input**:
```typescript
z.object({
  projectId: z.string().uuid(),
  spendType: z.string(),
  spendSubCategory: z.string()
})
```

**Output**:
```typescript
z.object({ id: z.string().uuid() }).nullable()
```

**Implementation (Edge Function - Raw SQL)**:

Location: `supabase/functions/trpc/index.ts` in `poMappingRouter`

```typescript
/**
 * Procedure 9: Get cost breakdown ID by criteria
 * Phase C: Helper procedure
 */
getCostBreakdownById: publicProcedure
  .input(z.object({
    projectId: z.string().uuid(),
    spendType: z.string(),
    spendSubCategory: z.string()
  }))
  .query(async ({ ctx, input }) => {
    try {
      const result = await ctx.sql`
        SELECT id
        FROM cost_breakdown
        WHERE project_id = ${input.projectId}
          AND spend_type = ${input.spendType}
          AND spend_sub_category = ${input.spendSubCategory}
        LIMIT 1
      `;
      
      return result[0] || null;
    } catch (error) {
      console.error('Failed to get cost breakdown ID:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get cost breakdown ID. Please try again.',
        cause: error,
      });
    }
  })
```

**Implementation (Packages/API - Drizzle)**:

Location: `packages/api/src/routers/po-mapping.ts`

```typescript
/**
 * Procedure 9: Get cost breakdown ID by criteria
 * Phase C: Helper procedure
 */
getCostBreakdownById: publicProcedure
  .input(z.object({
    projectId: z.string().uuid(),
    spendType: z.string(),
    spendSubCategory: z.string()
  }))
  .output(z.object({ id: z.string().uuid() }).nullable())
  .query(async ({ ctx, input }) => {
    try {
      const result = await ctx.db
        .select({ id: costBreakdown.id })
        .from(costBreakdown)
        .where(and(
          eq(costBreakdown.projectId, input.projectId),
          eq(costBreakdown.spendType, input.spendType),
          eq(costBreakdown.spendSubCategory, input.spendSubCategory)
        ))
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      console.error('Failed to get cost breakdown ID:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get cost breakdown ID. Please try again.',
        cause: error,
      });
    }
  })
```

### Validation Steps

1. **Type check**: `cd packages/api && pnpm tsc --noEmit`
2. **Deploy**: `supabase functions deploy trpc --no-verify-jwt`
3. **Wait**: 30 seconds for cold start
4. **Curl test**:
```bash
curl -s -X POST 'https://bykrhpaqaxhyfrqfvbus.supabase.co/functions/v1/trpc/poMapping.getCostBreakdownById' \
  -H "Content-Type: application/json" \
  -d '{"projectId":"94d1eaad-4ada-4fb6-b872-212b6cd6007a","spendType":"Operational","spendSubCategory":"Drums"}'

# Expected: {"result":{"data":{"id":"85bc1279-4b67-42c0-98f6-d680be8c4fca"}}}
```

### Git Checkpoint
```bash
git add -A
git commit -m "Phase C.1: Helper procedure (getCostBreakdownById)

- Implemented getCostBreakdownById to find cost breakdown by criteria
- Added to both edge function and packages/api
- Deployed and tested
- Returns nullable object with id

Phase: C.1 (procedure 9 complete)
Next: Create orchestrator cell"
```

---

## Step 2: Create Orchestrator Cell (details-panel) - 2 hours

### Purpose
Main coordinator cell that:
- Manages shared state across all 3 sub-cells
- Handles empty state when no PO selected
- Coordinates create/edit workflows
- Orchestrates refresh after mutations

### Directory Structure

```bash
mkdir -p apps/web/components/cells/details-panel/__tests__
```

### File 1: manifest.json

Location: `apps/web/components/cells/details-panel/manifest.json`

```json
{
  "id": "details-panel",
  "version": "1.0.0",
  "description": "PO mapping details panel orchestrator",
  "phase": "C",
  "status": "complete",
  "behavioral_assertions": [
    {
      "id": "BA-010",
      "description": "Shows empty state when no PO selected",
      "verification": "Render without selectedPO, verify message",
      "source": "Original lines 417-432"
    },
    {
      "id": "BA-011",
      "description": "Shows 'Not Mapped' state with create button",
      "verification": "PO with no mappings, verify create button",
      "source": "Original lines 448-465"
    },
    {
      "id": "BA-012",
      "description": "Resets all states when PO changes",
      "verification": "Change selectedPO prop, verify reset",
      "source": "Original lines 135-138"
    }
  ],
  "dependencies": {
    "data": [],
    "ui": ["@/components/ui/card", "@/components/ui/button"],
    "cells": [
      "details-panel-viewer",
      "details-panel-selector",
      "details-panel-mapper"
    ]
  }
}
```

### File 2: pipeline.yaml

Location: `apps/web/components/cells/details-panel/pipeline.yaml`

```yaml
gates:
  - name: types
    command: pnpm type-check
    requirement: "TypeScript zero errors"
  
  - name: tests
    command: pnpm test -- components/cells/details-panel
    requirement: "80%+ coverage, 3 behavioral assertions verified"
  
  - name: build
    command: pnpm build
    requirement: "Production build succeeds"
  
  - name: performance
    requirement: "Load time ≤110% baseline"
  
  - name: accessibility
    requirement: "WCAG AA compliance"
```

### File 3: component.tsx

Location: `apps/web/components/cells/details-panel/component.tsx`

**Full Implementation** (from migration plan lines 821-926):

```typescript
'use client'

import { useState, useEffect } from 'react'
import { DetailsPanelViewer } from '@/components/cells/details-panel-viewer/component'
import { DetailsPanelSelector } from '@/components/cells/details-panel-selector/component'
import { DetailsPanelMapper } from '@/components/cells/details-panel-mapper/component'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface DetailsPanelProps {
  selectedPO: { id: string; poNumber: string } | null
  onMappingChange?: () => Promise<void>
}

/**
 * DetailsPanel - Main Orchestrator Cell
 * 
 * Coordinates 3 sub-cells:
 * - DetailsPanelViewer: Display existing mappings
 * - DetailsPanelSelector: Cascading dropdowns
 * - DetailsPanelMapper: CRUD operations
 * 
 * Behavioral Assertions:
 * - BA-010: Shows empty state when no PO selected
 * - BA-011: Shows 'Not Mapped' state with create button
 * - BA-012: Resets all states when PO changes
 */
export function DetailsPanel({ selectedPO, onMappingChange }: DetailsPanelProps) {
  const [selectedProject, setSelectedProject] = useState('')
  const [selectedSpendType, setSelectedSpendType] = useState('')
  const [selectedSpendSubCategory, setSelectedSpendSubCategory] = useState('')
  const [costBreakdownId, setCostBreakdownId] = useState<string | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [existingMappings, setExistingMappings] = useState<Array<{ id: string; poLineItemId: string }>>([])
  
  // BA-012: Reset all state when PO changes
  useEffect(() => {
    setSelectedProject('')
    setSelectedSpendType('')
    setSelectedSpendSubCategory('')
    setCostBreakdownId(null)
    setIsEditMode(false)
    setExistingMappings([])
  }, [selectedPO?.id])
  
  const handleMappingComplete = async () => {
    // Reset state
    setSelectedProject('')
    setSelectedSpendType('')
    setSelectedSpendSubCategory('')
    setCostBreakdownId(null)
    setIsEditMode(false)
    
    // Call parent callback to refresh PO table
    if (onMappingChange) {
      await onMappingChange()
    }
  }
  
  const handleViewerDataLoaded = (mappings: Array<{ id: string; poLineItemId: string }>) => {
    setExistingMappings(mappings)
    if (mappings.length > 0) {
      setIsEditMode(false) // Hide create/edit UI if mappings exist
    }
  }
  
  // BA-010: Empty state when no PO selected
  if (!selectedPO) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-500 text-center">Select a PO to view details</p>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>PO Details - {selectedPO.poNumber}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Viewer - always visible if mappings exist */}
        <DetailsPanelViewer 
          poId={selectedPO.id}
          onMappingsLoaded={handleViewerDataLoaded}
        />
        
        {/* Show create/edit UI based on state */}
        {(existingMappings.length === 0 || isEditMode) && (
          <>
            <DetailsPanelSelector
              selectedProject={selectedProject}
              selectedSpendType={selectedSpendType}
              selectedSpendSubCategory={selectedSpendSubCategory}
              onProjectChange={setSelectedProject}
              onSpendTypeChange={setSelectedSpendType}
              onSubCategoryChange={setSelectedSpendSubCategory}
              onCostBreakdownFound={setCostBreakdownId}
            />
            
            <DetailsPanelMapper
              poId={selectedPO.id}
              costBreakdownId={costBreakdownId}
              existingMappings={existingMappings}
              isEditMode={isEditMode}
              onMappingComplete={handleMappingComplete}
            />
          </>
        )}
        
        {/* BA-011: Show create button if no mappings */}
        {existingMappings.length === 0 && !isEditMode && (
          <div className="flex justify-center">
            <Button onClick={() => setIsEditMode(true)}>
              Create Mapping
            </Button>
          </div>
        )}
        
        {/* Show edit button if mappings exist and not in edit mode */}
        {existingMappings.length > 0 && !isEditMode && (
          <div className="flex justify-center">
            <Button variant="outline" onClick={() => setIsEditMode(true)}>
              Edit Mapping
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

### Important Notes

1. **Viewer needs update**: The `DetailsPanelViewer` component needs to expose mappings data to orchestrator. Add this prop:
   ```typescript
   onMappingsLoaded?: (mappings: Array<{ id: string; poLineItemId: string }>) => void
   ```

2. **Type checking**: Run after creating orchestrator to ensure all sub-cells have correct prop interfaces

### Validation Steps

1. **Create all files** (manifest, pipeline, component)
2. **Update viewer** to expose mappings data
3. **Type check**: `cd apps/web && pnpm tsc --noEmit`
4. **Build check**: `pnpm build`

### Git Checkpoint
```bash
git add -A
git commit -m "Phase C.2: Orchestrator cell complete

- Created details-panel orchestrator cell
- Coordinates all 3 sub-cells (viewer, selector, mapper)
- Manages shared state and workflows
- Empty state, create, and edit modes implemented
- 3 behavioral assertions (BA-010, BA-011, BA-012)

Phase: C.2 (orchestrator complete)
Next: Integration testing"
```

---

## Step 3: Integration Testing - 1.5 hours

### Test All Workflows End-to-End

**Workflow 1: View Existing Mapping**
1. Select PO with existing mappings
2. Verify green card displays (DetailsPanelViewer)
3. Verify all mapping details shown
4. Verify currency formatting (AUD)

**Workflow 2: Create New Mapping**
1. Select PO without mappings
2. Verify "Create Mapping" button shown
3. Click button
4. Select project → spend type → subcategory
5. Add optional notes
6. Click "Create Mapping"
7. Verify toast notification
8. Verify green card appears with new mappings

**Workflow 3: Update Existing Mapping**
1. Select PO with mappings
2. Click "Edit Mapping" button
3. Change spend type/subcategory
4. Verify cost breakdown updates
5. Click "Update Mapping"
6. Verify toast notification
7. Verify green card shows updated data

**Workflow 4: Clear All Mappings**
1. Select PO with mappings
2. Click "Edit Mapping"
3. Click "Clear All Mappings"
4. Verify AlertDialog appears
5. Verify count shown in dialog
6. Click "Clear Mappings"
7. Verify toast notification
8. Verify mappings removed

### Performance Validation

Use React DevTools Profiler:
- Measure component render time
- Compare to baseline (original details-panel.tsx)
- Requirement: ≤110% of baseline

### Git Checkpoint
```bash
git add -A
git commit -m "Phase C.3: All workflows tested

- Tested view, create, update, clear workflows
- All operations working correctly
- Performance within acceptable range (≤110% baseline)
- No console errors

Phase: C.3 (integration testing complete)
Next: Update imports and delete old component"
```

---

## Step 4: Update Imports & Delete Old Component - 30 minutes

### Update po-mapping Page

Location: `apps/web/app/po-mapping/page.tsx`

**Find and replace**:

```typescript
// OLD IMPORT
import { DetailsPanel } from '@/components/details-panel'

// NEW IMPORT
import { DetailsPanel } from '@/components/cells/details-panel/component'
```

**Verify props match**:
```typescript
<DetailsPanel 
  selectedPO={selectedPO}
  onMappingChange={refetchPOs}
/>
```

### Test in Production Build

```bash
cd apps/web
pnpm build
# Should succeed with zero errors
```

### Delete Old Component (MANDATORY)

**CRITICAL**: This is the complete replacement - old component MUST be deleted.

```bash
rm apps/web/components/details-panel.tsx
```

### Verify No References Remain

```bash
grep -r "components/details-panel" apps/web/ --exclude-dir=node_modules
# Should return nothing (or only the new cell import)
```

### Atomic Commit

```bash
git add -A
git commit -m "Migration complete: details-panel → Cell architecture

COMPLETE REPLACEMENT:
- Updated po-mapping page to use orchestrator cell
- Tested in production build (zero errors)
- DELETED old component: apps/web/components/details-panel.tsx
- Verified no broken imports

Cell structure:
- details-panel (orchestrator)
- details-panel-viewer (read operations)
- details-panel-selector (cascading dropdowns)
- details-panel-mapper (CRUD operations)

Migration: details-panel.tsx (816 lines) → 4 specialized cells
Procedures: 9 tRPC procedures (5 read, 3 mutation, 1 helper)
Status: Production-ready
Validation: All workflows tested"
```

---

## Step 5: Full Validation Suite - 30 minutes

### Validation Gate 1: TypeScript

```bash
pnpm type-check
# Expected: Zero errors
```

### Validation Gate 2: Tests

```bash
pnpm test
# Expected: All tests pass, coverage ≥80%
```

### Validation Gate 3: Build

```bash
pnpm build
# Expected: Production build succeeds
```

### Validation Gate 4: Performance

Use React DevTools Profiler:
- Component renders: < 5 total
- No infinite loops
- Network: Batched tRPC requests
- Requirement: ≤110% baseline

### Validation Gate 5: Accessibility

Check:
- Keyboard navigation works
- Screen reader friendly
- Color contrast (WCAG AA)
- Focus indicators visible

### Final Git Checkpoint
```bash
git add -A
git commit -m "Phase C Complete: All validation gates passed

TypeScript: ✓ Zero errors
Tests: ✓ All passing, coverage ≥80%
Build: ✓ Production build successful
Performance: ✓ Within acceptable range
Accessibility: ✓ WCAG AA compliant

Migration validated and production-ready

Phase: C COMPLETE
Next: Update ledger and create final report"
```

---

## Step 6: Update Ledger - Final Documentation

### Ledger Entry

Append to `ledger.jsonl`:

```json
{
  "iterationId": "mig_20251002_details-panel",
  "timestamp": "2025-10-02T[CURRENT-TIME]Z",
  "humanPrompt": "Execute ANDA migration: details-panel.tsx → Cell architecture",
  "artifacts": {
    "created": [
      {
        "type": "cell",
        "id": "details-panel",
        "path": "apps/web/components/cells/details-panel"
      },
      {
        "type": "cell",
        "id": "details-panel-viewer",
        "path": "apps/web/components/cells/details-panel-viewer"
      },
      {
        "type": "cell",
        "id": "details-panel-selector",
        "path": "apps/web/components/cells/details-panel-selector"
      },
      {
        "type": "cell",
        "id": "details-panel-mapper",
        "path": "apps/web/components/cells/details-panel-mapper"
      },
      {
        "type": "trpc-router",
        "id": "poMapping",
        "path": "packages/api/src/routers/po-mapping.ts",
        "procedures": 9
      },
      {
        "type": "edge-function",
        "id": "trpc-poMapping",
        "path": "supabase/functions/trpc/index.ts"
      }
    ],
    "modified": [
      {
        "type": "page",
        "path": "apps/web/app/po-mapping/page.tsx",
        "changes": ["Updated import to use orchestrator cell"]
      }
    ],
    "replaced": [
      {
        "type": "component",
        "id": "DetailsPanel",
        "path": "apps/web/components/details-panel.tsx",
        "deletedAt": "[ISO-TIMESTAMP]",
        "reason": "Migrated to Cell architecture - complete replacement"
      }
    ]
  },
  "schemaChanges": [],
  "metadata": {
    "agent": "MigrationExecutor",
    "duration": "[ACTUAL-DURATION-MS]",
    "validationStatus": "SUCCESS",
    "complexity": "complex",
    "strategy": "phased",
    "procedures": 9,
    "cells": 4,
    "gitCheckpoints": 12,
    "adoptionProgress": "4 cells migrated (details-panel family complete)"
  }
}
```

### Git Checkpoint
```bash
git add ledger.jsonl
git commit -m "Update ledger: details-panel migration complete

Added ledger entry documenting:
- 4 cells created (orchestrator + 3 sub-cells)
- 9 tRPC procedures (5 read, 3 mutation, 1 helper)
- Complete replacement of 816-line component
- All validation gates passed

Migration: SUCCESS
Status: Production-ready"
```

---

## How to Resume This Session

### Option 1: Quick Resume (Start Phase C)

```bash
# 1. Verify you're on correct branch
git branch  # Should show: refactor/codebase-modernization
git log -1  # Should show: e8fd4fa "Phase B Complete"

# 2. Verify working state
cd /home/iwahbi/dev/cost-management-v0
pnpm type-check  # Should pass with zero errors

# 3. Start with Step 1 (Implement Procedure 9)
# Open: supabase/functions/trpc/index.ts AND packages/api/src/routers/po-mapping.ts
# Add: Procedure 9 (getCostBreakdownById) to both files
```

### Option 2: Fresh Context Resume

**Prompt to AI Assistant**:
```markdown
Resume migration execution from Phase B checkpoint.

Migration: details-panel.tsx → Cell Architecture
Phase: B Complete → Resume Phase C (Integration)
Commit: e8fd4fa
Phase B Report: @thoughts/shared/implementations/2025-10-02_phase-b-complete_implementation-report.md
Resume Guide: @thoughts/shared/implementations/2025-10-02_phase-c-ready_resume-guide.md
Migration Plan: @thoughts/shared/plans/2025-10-02_17-30_details-panel_migration_plan.md

Status: Phases A & B complete (8 procedures, 3 cells). Ready to implement Phase C integration.

Please start with implementing procedure 9 (getCostBreakdownById) in both:
- supabase/functions/trpc/index.ts
- packages/api/src/routers/po-mapping.ts

Then create the orchestrator cell and complete integration.
```

---

## Critical Reminders for Phase C

### ⚠️ MUST DO
1. **Wait 30 seconds after edge function deployment** - No exceptions
2. **Test procedure 9 with curl BEFORE creating orchestrator**
3. **Update DetailsPanelViewer** to expose mappings data to orchestrator
4. **Delete old component ONLY after all validations pass**
5. **Use atomic commit** for import updates + old component deletion
6. **Update ledger** with complete migration entry
7. **Verify no broken imports** after deleting old component

### ✅ PATTERNS TO FOLLOW
- **State Management**: Orchestrator manages all shared state
- **Props Flow**: Parent → orchestrator → sub-cells (one-way data flow)
- **Callbacks**: Sub-cells call `onMappingComplete()` to trigger refresh
- **Empty States**: Show appropriate UI for no PO, no mappings, edit mode
- **Type Safety**: All props properly typed, no `any` types

### 🚫 PITFALLS TO AVOID
- ❌ Don't skip orchestrator - it's the glue that holds everything together
- ❌ Don't forget to update viewer to expose mappings data
- ❌ Don't keep old component after migration (complete replacement only)
- ❌ Don't skip ledger update (mandatory documentation)
- ❌ Don't forget to test all 4 workflows (view, create, update, clear)

---

## Test Data Reference

### Shell Crux Project
- **Project ID**: `94d1eaad-4ada-4fb6-b872-212b6cd6007a`
- **Cost Breakdown ID**: `85bc1279-4b67-42c0-98f6-d680be8c4fca` (Operational/Drums)

### Test Queries
```sql
-- Find POs with mappings
SELECT DISTINCT pli.po_id, p.po_number
FROM po_mappings pm
INNER JOIN po_line_items pli ON pli.id = pm.po_line_item_id
INNER JOIN pos p ON p.id = pli.po_id
LIMIT 5;

-- Find POs without mappings
SELECT p.id, p.po_number
FROM pos p
WHERE NOT EXISTS (
  SELECT 1 FROM po_mappings pm
  INNER JOIN po_line_items pli ON pli.id = pm.po_line_item_id
  WHERE pli.po_id = p.id
)
LIMIT 5;
```

---

## Reference Files

**Phase B Report**: `thoughts/shared/implementations/2025-10-02_phase-b-complete_implementation-report.md`  
**Migration Plan**: `thoughts/shared/plans/2025-10-02_17-30_details-panel_migration_plan.md`  
**Analysis Report**: `thoughts/shared/analysis/2025-10-02_16-30_details-panel_analysis.md`  
**Cell Checklist**: `docs/cell-development-checklist.md`  
**tRPC Debug Guide**: `docs/trpc-debugging-guide.md`

**Key Line References**:
- Migration Plan Phase C Sequence: Lines 1068-1105
- Orchestrator Cell Spec: Lines 817-965
- Procedure 9 Spec: Lines 330-358

---

## Progress Tracker

**Overall Migration**:
- Total Procedures: 9
- Completed: 8/9 (89%)
- Remaining: 1 (procedure 9)

**Total Cells**:
- Planned: 4
- Completed: 3/4 (75%)
- Remaining: 1 (orchestrator)

**Phase C Estimate**: 5.5 hours
- Procedure 9: 1 hour
- Deploy & test: 30 min
- Orchestrator cell: 2 hours
- Integration testing: 1.5 hours
- Import updates + delete: 30 min
- Full validation: 30 min

**Git Checkpoints Remaining**: 5 more in Phase C

---

**End of Resume Guide**

Safe to pause. All Phase B work saved and validated.  
Ready to resume Phase C (Integration & Orchestration) anytime.

Current state is production-ready for Phase A & B operations.  
Phase C will complete the full migration.
