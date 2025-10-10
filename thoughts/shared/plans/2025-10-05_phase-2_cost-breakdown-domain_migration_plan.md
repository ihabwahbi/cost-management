# Migration Plan: Phase 2 - Cost Breakdown Domain Migration

**Date**: 2025-10-05  
**Architect**: MigrationArchitect  
**Workflow Phase**: Phase 3 - Migration Planning  
**Enhancement Mode**: ✅ ULTRATHINK ACTIVE  
**Status**: ready_for_implementation  
**Phase**: 2 of 7  
**Depends On**: Phase 1 (Projects Domain) COMPLETE

---

## Metadata

**Based On**:
- **Phase 1 Completion**: Projects domain migration validated
- **Analysis Report**: `thoughts/shared/analysis/2025-10-05_16-00_projects-page_analysis.md`

**Migration Target**:
- **Component**: Cost Breakdown Domain (extracted from `projects/page.tsx`)
- **Current Lines**: ~800 lines (cost CRUD operations + inline editing)
- **Target Lines**: ~250 lines (Cell component)
- **Complexity**: **HIGH** (6 procedures, bulk operations, inline editing state)
- **Strategy**: Standard 7-step with enhanced validation
- **Estimated Duration**: 5-7 days (40-56 hours)

---

## Executive Summary

Phase 2 migrates the **Cost Breakdown Domain** - the core budget management functionality. This phase is significantly more complex than Phase 1 due to:
- **6 specialized tRPC procedures** (including bulk operations)
- **Complex inline editing** state management
- **Real-time validation** and data transformations
- **Bulk delete** functionality requiring transaction handling

**Scope**:
- Extract cost breakdown CRUD (lines 420-452, 1304-1726)
- Create 6 specialized tRPC procedures (one per file, ≤200 lines each)
- Build `cost-breakdown-table-cell` with 7 behavioral assertions
- Implement inline editing with optimistic updates
- Support bulk operations (multi-select delete)

**Priority**: **HIGH** - Core budget functionality, blocks forecasting phases

**Risk Level**: **MEDIUM-HIGH** - Complex state, bulk operations, inline editing UX

---

## Migration Overview

### Component Details

**Current Implementation**:
```yaml
Location: apps/web/app/projects/page.tsx
Lines: 420-452, 1304-1726 (~800 lines total)

Functions:
  - loadCostBreakdown (lines 420-452): SELECT cost items
  - updateCostItem (lines 1304-1374): UPDATE single cost
  - deleteCostEntry (lines 1676-1726): DELETE single cost
  - Bulk delete loop (lines 1867-1891): DELETE multiple costs
  - New cost creation (lines 1134-1145): INSERT cost entry
  
Database Access: Direct Supabase client
State Management: 
  - editingCost, editingValues (inline editing)
  - addingNewCost, newCostValues (new entry form)
  - savingCosts, savingNewCost, deletingCost (loading states)
  - selectedEntries, bulkEditMode (bulk operations)
  - fieldErrors (validation)
```

**Target Architecture**:
```yaml
API Layer: 6 specialized procedures in packages/api/src/procedures/cost-breakdown/
Cell: components/cells/cost-breakdown-table-cell/
State: Local React state (no Zustand needed yet - save for Phase 3)
```

### Dependencies

**Data Dependencies**:
- **Database**: `cost_breakdown` table (Drizzle schema exists ✅)
- **Foreign Keys**: 
  - `project_id` → `projects.id` (from Phase 1)
  - Referenced by: `po_mappings`, `budget_forecasts` (future phases)

**Component Dependencies**:
- **Child Components**: 
  - InlineEdit (will be migrated to utility component)
  - EntryStatusIndicator (simple, low-priority migration)
  - UnsavedChangesBar (integrated into Cell)
- **Parent**: project-list-cell (Phase 1) - provides projectId

**Importers**: 
- Current page only (self-contained)

---

## Architecture Compliance Validation

**Pre-Implementation Verification** (Phase 5.5 Self-Validation):

### Architectural Mandates

- **M-CELL-1** (All Functionality as Cells): ✅ **COMPLIANT**
  - **Classification**: Cost breakdown table with inline editing + state = **Cell**
  - **Justification**: Complex UI with data fetching, mutations, local editing state

- **M-CELL-2** (Complete Atomic Migrations): ✅ **COMPLIANT**
  - **Deletion**: Old cost breakdown logic removed from page.tsx in **same commit**
  - **Atomic Scope**: All 6 CRUD operations + bulk delete migrated together

- **M-CELL-3** (Zero God Components): ✅ **COMPLIANT**
  - **Cell Size**: cost-breakdown-table-cell estimated ~250 lines (well under 400)
  - **Note**: Complex inline editing, but well-bounded single responsibility

- **M-CELL-4** (Explicit Behavioral Contracts): ✅ **COMPLIANT**
  - **Assertions Planned**: 7 behavioral assertions (exceeds minimum of 3)
  - **Source**: BA-003, BA-008, BA-009, BA-018, BA-022, BA-023 from analysis

### Specialized Procedure Architecture

- **One Procedure Per File (M1)**: ✅ 6 procedure files planned
- **Procedure Size Limits (M2)**: ✅ All ≤200 lines (largest: ~40 lines)
- **Router Complexity**: ✅ Domain router ≤50 lines (~20 lines estimated)
- **No Parallel Implementations (M3)**: ✅ All in packages/api/

### Forbidden Pattern Scan

- ✅ **"optional" phases**: None
- ✅ **"future cleanup"**: None (immediate deletion)
- ✅ **"temporary exemption"**: None
- ✅ **File size exemptions**: None

**Compliance Status**: ✅ **COMPLIANT** - Ready for Phase 4 implementation

---

## Data Layer Specifications

### Drizzle Schema

**Status**: ✅ **ALREADY EXISTS** - No changes needed

**Schema Location**: `packages/db/src/schema/cost-breakdown.ts`

**Schema Verification**:
```typescript
export const costBreakdown = pgTable('cost_breakdown', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  subBusinessLine: text('sub_business_line').notNull(),
  costLine: text('cost_line').notNull(),
  spendType: text('spend_type').notNull(),
  spendSubCategory: text('spend_sub_category'),
  budgetCost: numeric('budget_cost', { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

// Relationships:
// - belongsTo: projects (via projectId)
// - hasMany: poMappings (via cost_breakdown_id)
// - hasMany: budgetForecasts (via cost_breakdown_id)

// Indexes needed for performance:
// - idx_project_id on projectId (for WHERE project_id queries)
```

---

### tRPC Procedures (Specialized Architecture)

**Domain Router**: `packages/api/src/procedures/cost-breakdown/cost-breakdown.router.ts`

#### Procedure 1: Get Cost Breakdown by Project

**File**: `packages/api/src/procedures/cost-breakdown/get-cost-breakdown-by-project.procedure.ts`  
**Estimated Size**: ~30 lines  
**Purpose**: Retrieve all cost entries for a project

**Input Schema**:
```typescript
.input(z.object({
  projectId: z.string().uuid(),
  orderBy: z.enum(['costLine', 'budgetCost', 'createdAt']).optional().default('costLine')
}))
```

**Output Schema**:
```typescript
z.array(z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  subBusinessLine: z.string(),
  costLine: z.string(),
  spendType: z.string(),
  spendSubCategory: z.string().nullable(),
  budgetCost: z.number(),
  createdAt: z.date(),
  updatedAt: z.date()
}))
```

**Implementation**:
```typescript
import { z } from 'zod'
import { publicProcedure, router } from '../../trpc'
import { db } from '@/db'
import { costBreakdown } from '@/db/schema'
import { eq, asc, desc } from 'drizzle-orm'

export const getCostBreakdownByProjectRouter = router({
  getCostBreakdownByProject: publicProcedure
    .input(z.object({
      projectId: z.string().uuid(),
      orderBy: z.enum(['costLine', 'budgetCost', 'createdAt']).optional().default('costLine')
    }))
    .query(async ({ input }) => {
      const orderCol = 
        input.orderBy === 'budgetCost' ? costBreakdown.budgetCost :
        input.orderBy === 'createdAt' ? costBreakdown.createdAt :
        costBreakdown.costLine
      
      const data = await db
        .select()
        .from(costBreakdown)
        .where(eq(costBreakdown.projectId, input.projectId))
        .orderBy(asc(orderCol))
      
      return data.map(item => ({
        ...item,
        budgetCost: Number(item.budgetCost)
      }))
    })
})
```

**Curl Test**:
```bash
curl -X POST https://[PROJECT].supabase.co/functions/v1/trpc/costBreakdown.getCostBreakdownByProject \
  -H "Content-Type: application/json" \
  -d '{"0":{"json":{"projectId":"[REAL-UUID]"}}}'
```

---

#### Procedure 2: Get Baseline Cost Breakdown

**File**: `packages/api/src/procedures/cost-breakdown/get-cost-breakdown-baseline.procedure.ts`  
**Estimated Size**: ~35 lines  
**Purpose**: Get baseline budget (version 0) for comparison operations

**Input Schema**:
```typescript
.input(z.object({
  projectId: z.string().uuid(),
  minBudgetCost: z.number().optional()  // Filter out small line items
}))
```

**Implementation Note**: Used for version comparison - fetches original budget before any forecasts applied

---

#### Procedure 3: Create Cost Entry

**File**: `packages/api/src/procedures/cost-breakdown/create-cost-entry.procedure.ts`  
**Estimated Size**: ~35 lines  

**Input Schema**:
```typescript
.input(z.object({
  projectId: z.string().uuid(),
  subBusinessLine: z.string(),
  costLine: z.string().min(1).max(255),
  spendType: z.string(),
  spendSubCategory: z.string().optional(),
  budgetCost: z.number().min(0)
}))
```

**Implementation**:
```typescript
export const createCostEntryRouter = router({
  createCostEntry: publicProcedure
    .input(z.object({
      projectId: z.string().uuid(),
      subBusinessLine: z.string(),
      costLine: z.string().min(1).max(255),
      spendType: z.string(),
      spendSubCategory: z.string().optional(),
      budgetCost: z.number().min(0)
    }))
    .mutation(async ({ input }) => {
      const [newEntry] = await db
        .insert(costBreakdown)
        .values({
          projectId: input.projectId,
          subBusinessLine: input.subBusinessLine,
          costLine: input.costLine,
          spendType: input.spendType,
          spendSubCategory: input.spendSubCategory || null,
          budgetCost: input.budgetCost.toString()  // Convert to string for numeric type
        })
        .returning()
      
      if (!newEntry) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create cost entry'
        })
      }
      
      return {
        ...newEntry,
        budgetCost: Number(newEntry.budgetCost)
      }
    })
})
```

---

#### Procedure 4: Update Cost Entry

**File**: `packages/api/src/procedures/cost-breakdown/update-cost-entry.procedure.ts`  
**Estimated Size**: ~40 lines  
**Purpose**: Update existing cost entry (inline editing support)

**Input Schema**:
```typescript
.input(z.object({
  id: z.string().uuid(),
  subBusinessLine: z.string().optional(),
  costLine: z.string().min(1).max(255).optional(),
  spendType: z.string().optional(),
  spendSubCategory: z.string().optional(),
  budgetCost: z.number().min(0).optional()
}))
```

**Implementation Notes**:
- Supports partial updates (only changed fields)
- Automatically updates `updatedAt` timestamp
- Returns updated entry for optimistic UI update

---

#### Procedure 5: Delete Cost Entry

**File**: `packages/api/src/procedures/cost-breakdown/delete-cost-entry.procedure.ts`  
**Estimated Size**: ~25 lines  

**Input Schema**:
```typescript
.input(z.object({
  id: z.string().uuid()
}))
```

**Output Schema**:
```typescript
z.object({
  success: z.boolean(),
  deletedId: z.string().uuid()
})
```

---

#### Procedure 6: Bulk Delete Cost Entries

**File**: `packages/api/src/procedures/cost-breakdown/bulk-delete-cost-entries.procedure.ts`  
**Estimated Size**: ~30 lines  
**Purpose**: Delete multiple cost entries in single transaction

**Input Schema**:
```typescript
.input(z.object({
  ids: z.array(z.string().uuid()).min(1).max(100)  // Safety limit: max 100 at once
}))
```

**Output Schema**:
```typescript
z.object({
  success: z.boolean(),
  deletedCount: z.number(),
  deletedIds: z.array(z.string().uuid())
})
```

**Implementation**:
```typescript
import { inArray } from 'drizzle-orm'

export const bulkDeleteCostEntriesRouter = router({
  bulkDeleteCostEntries: publicProcedure
    .input(z.object({
      ids: z.array(z.string().uuid()).min(1).max(100)
    }))
    .mutation(async ({ input }) => {
      const deleted = await db
        .delete(costBreakdown)
        .where(inArray(costBreakdown.id, input.ids))
        .returning()
      
      return {
        success: true,
        deletedCount: deleted.length,
        deletedIds: deleted.map(item => item.id)
      }
    })
})
```

**Curl Test**:
```bash
curl -X POST https://[PROJECT].supabase.co/functions/v1/trpc/costBreakdown.bulkDeleteCostEntries \
  -H "Content-Type: application/json" \
  -d '{"0":{"json":{"ids":["uuid1","uuid2","uuid3"]}}}'
```

---

#### Domain Router

**File**: `packages/api/src/procedures/cost-breakdown/cost-breakdown.router.ts`  
**Estimated Size**: ~20 lines  

```typescript
import { router } from '../../trpc'
import { getCostBreakdownByProjectRouter } from './get-cost-breakdown-by-project.procedure'
import { getCostBreakdownBaselineRouter } from './get-cost-breakdown-baseline.procedure'
import { createCostEntryRouter } from './create-cost-entry.procedure'
import { updateCostEntryRouter } from './update-cost-entry.procedure'
import { deleteCostEntryRouter } from './delete-cost-entry.procedure'
import { bulkDeleteCostEntriesRouter } from './bulk-delete-cost-entries.procedure'

export const costBreakdownRouter = router({
  ...getCostBreakdownByProjectRouter,
  ...getCostBreakdownBaselineRouter,
  ...createCostEntryRouter,
  ...updateCostEntryRouter,
  ...deleteCostEntryRouter,
  ...bulkDeleteCostEntriesRouter,
})
```

---

## Cell Structure Specifications

### Directory Structure

```
components/cells/cost-breakdown-table-cell/
├── component.tsx          # Main Cell (~250 lines)
├── manifest.json         # 7 behavioral assertions
├── pipeline.yaml         # 5 validation gates
└── __tests__/
    └── component.test.tsx  # Unit tests (7 tests)
```

---

### Manifest Specification

**File**: `components/cells/cost-breakdown-table-cell/manifest.json`

```json
{
  "id": "cost-breakdown-table-cell",
  "version": "1.0.0",
  "description": "Cost breakdown table with inline editing and bulk operations - extracted from projects/page.tsx",
  "behavioral_assertions": [
    {
      "id": "BA-003",
      "description": "Component displays cost breakdown table when project is expanded",
      "verification": "Provide projectId, mock getCostBreakdownByProject, verify table renders",
      "source": "Original lines 2100-2437"
    },
    {
      "id": "BA-008",
      "description": "Component shows 'No budget created yet' when cost breakdown is empty",
      "verification": "Mock empty array, verify empty state with CTA button",
      "source": "Original lines 2243-2248"
    },
    {
      "id": "BA-009",
      "description": "Component enables inline editing on row double-click",
      "verification": "Double-click row, verify input fields appear, edit, save",
      "source": "Original lines 1304-1374 (updateCostItem)"
    },
    {
      "id": "BA-018",
      "description": "Component validates required fields before saving",
      "verification": "Clear cost line field, attempt save, verify validation error",
      "source": "Original lines 2002-2003, validation logic"
    },
    {
      "id": "BA-022",
      "description": "Component shows unsaved changes bar when inline edits pending",
      "verification": "Make edit, verify changes bar appears with count",
      "source": "Original lines 2764-2774"
    },
    {
      "id": "BA-023",
      "description": "Component supports keyboard shortcuts (Cmd+S to save, Escape to cancel)",
      "verification": "Make edit, press Cmd+S, verify save triggered",
      "source": "Original lines 258-319 (keyboard handler)"
    },
    {
      "id": "BA-BULK-001",
      "description": "Component enables multi-select for bulk delete operations",
      "verification": "Enable bulk mode, select multiple rows, delete, verify all removed",
      "source": "Original lines 1867-1891 (bulk delete loop)"
    }
  ],
  "dependencies": {
    "data": ["cost_breakdown"],
    "ui": ["shadcn/ui Table", "shadcn/ui Input", "shadcn/ui Checkbox", "toast"],
    "api": [
      "costBreakdown.getCostBreakdownByProject",
      "costBreakdown.createCostEntry",
      "costBreakdown.updateCostEntry",
      "costBreakdown.deleteCostEntry",
      "costBreakdown.bulkDeleteCostEntries"
    ]
  },
  "performance": {
    "baseline_load_time_ms": null,
    "target_load_time_ms": 300
  }
}
```

---

### Component Memoization Specifications

**Critical Patterns**:

```typescript
'use client'

import { useMemo, useCallback, useState } from 'react'
import { trpc } from '@/lib/trpc'

export function CostBreakdownTableCell({ projectId }: { projectId: string }) {
  // State
  const [editingRowId, setEditingRowId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Record<string, any>>({})
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  
  // ✅ CRITICAL: Memoize query input
  const queryInput = useMemo(() => ({
    projectId,
    orderBy: 'costLine' as const
  }), [projectId])
  
  // Query
  const { data: costs, isLoading } = trpc.costBreakdown.getCostBreakdownByProject.useQuery(
    queryInput,
    { refetchOnWindowFocus: false, staleTime: 5 * 60 * 1000 }
  )
  
  // Mutations
  const utils = trpc.useContext()
  
  const updateMutation = trpc.costBreakdown.updateCostEntry.useMutation({
    onSuccess: () => {
      utils.costBreakdown.getCostBreakdownByProject.invalidate()
      setEditingRowId(null)
      setEditValues({})
      toast.success('Cost updated')
    }
  })
  
  const bulkDeleteMutation = trpc.costBreakdown.bulkDeleteCostEntries.useMutation({
    onSuccess: (result) => {
      utils.costBreakdown.getCostBreakdownByProject.invalidate()
      setSelectedIds(new Set())
      toast.success(`Deleted ${result.deletedCount} cost entries`)
    }
  })
  
  // ✅ Memoize event handlers
  const handleRowDoubleClick = useCallback((row: CostBreakdown) => {
    setEditingRowId(row.id)
    setEditValues(row)
  }, [])
  
  const handleSaveEdit = useCallback(() => {
    if (!editingRowId) return
    updateMutation.mutate({
      id: editingRowId,
      ...editValues
    })
  }, [editingRowId, editValues, updateMutation])
  
  const handleBulkDelete = useCallback(() => {
    if (selectedIds.size === 0) return
    bulkDeleteMutation.mutate({
      ids: Array.from(selectedIds)
    })
  }, [selectedIds, bulkDeleteMutation])
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === 's' && editingRowId) {
        e.preventDefault()
        handleSaveEdit()
      }
      if (e.key === 'Escape' && editingRowId) {
        setEditingRowId(null)
        setEditValues({})
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [editingRowId, handleSaveEdit])
  
  // Render logic...
}
```

---

## Migration Sequence (7 Steps)

### Step 1: Verify Schema (5 min)
- ✅ Schema exists: `packages/db/src/schema/cost-breakdown.ts`

### Step 2: Create Procedures (3-4 hours)
- Implement 6 specialized procedures
- Create domain router
- Update main app router

### Step 3: Test & Deploy (45-60 min)
- Test all 6 procedures with curl
- Deploy edge function
- Re-test deployed

### Step 4: Create Cell Structure (30 min)
- Create directory and files
- Validate manifest (7 assertions)

### Step 5: Implement Component (4-5 hours)
- Implement inline editing logic
- Implement bulk operations
- Write 7 unit tests
- Achieve ≥80% coverage

### Step 6: Atomic Integration (1 hour)
- Import Cell in page.tsx
- Remove old cost breakdown functions
- Remove old state variables
- Verify TypeScript + build

### Step 7: Full Validation (45-60 min)
- Technical gates
- Browser testing (inline edit, bulk delete)
- **HUMAN VALIDATION REQUIRED** ⚠️

---

## Rollback Strategy

**Triggers**: Same as Phase 1 + additional:
- ❌ Inline editing broken
- ❌ Bulk delete fails
- ❌ Data corruption in edits

**Sequence**: Same as Phase 1 (git revert, verify, ledger)

---

## Success Criteria

```yaml
Code Quality:
  - TypeScript errors: 0
  - Test coverage: ≥80%
  - Behavioral assertions: 7/7

Architecture:
  - M-CELL-1 through M-CELL-4: COMPLIANT
  - M1-M3 (Procedures): COMPLIANT
  - All procedures ≤200 lines
  - Router ≤50 lines

Functionality:
  - Inline editing works
  - Bulk delete works (multi-select)
  - Keyboard shortcuts work
  - Validation works

Performance:
  - Load time: ≤330ms (110% of 300ms target)
  - Render count: ≤5

Code Reduction:
  - Lines removed: ~800
  - page.tsx new size: ~1,600 lines
```

---

## Phase 4 Execution Checklist

```yaml
Pre-Flight:
  - [ ] Phase 1 COMPLETE and validated
  - [ ] Understand inline editing complexity
  - [ ] Prepare test data (cost entries)

Step 2 - Procedures (3-4 hours):
  - [ ] All 6 procedure files
  - [ ] Special attention to bulk delete (transaction safety)
  - [ ] Verify file sizes ≤200 lines

Step 3 - Test (45-60 min):
  - [ ] Test bulk delete with multiple IDs
  - [ ] Test update with partial fields
  - [ ] ALL curl tests must pass

Step 5 - Component (4-5 hours):
  - [ ] Inline editing state management
  - [ ] Keyboard shortcuts (Cmd+S, Escape)
  - [ ] Bulk select UI (checkboxes)
  - [ ] 7 unit tests

Step 7 - Human Validation:
  - [ ] Double-click row to edit
  - [ ] Edit field, press Cmd+S, verify saved
  - [ ] Select multiple rows, bulk delete
  - [ ] Verify empty state when no costs
  - [ ] Check console (no errors)
```

---

**Migration Plan Complete**: Phase 2 - Cost Breakdown Domain  
**Ready for Phase 4**: ✅ YES (after Phase 1 complete)  
**Complexity**: HIGH (inline editing + bulk operations)  
**Risk Mitigation**: Comprehensive unit tests, human validation gate  

**Next**: Phase 3 - Initial Budget Workflow Migration
