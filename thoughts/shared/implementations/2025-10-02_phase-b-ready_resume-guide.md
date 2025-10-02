# Migration Resume Guide: Phase B - Mutation Operations

## Session Summary

**Date**: 2025-10-02  
**Phase Completed**: A (Read Operations) ✅  
**Next Phase**: B (Mutation Operations)  
**Git Commit**: `9f0b58d` - "Phase A Complete: All read operations"  
**Status**: ✅ CLEAN CHECKPOINT - Safe to resume

---

## What Was Completed (Phase A)

### ✅ Phase A: Read Operations (COMPLETE)

**tRPC Procedures Implemented** (5/9):
1. ✅ **poMapping.getProjects** - No input, returns projects array
2. ✅ **poMapping.getSpendTypes** - Filters by projectId
3. ✅ **poMapping.getSpendSubCategories** - Filters by projectId + spendType
4. ✅ **poMapping.findMatchingCostBreakdown** - 3-table JOIN to find cost breakdown
5. ✅ **poMapping.getExistingMappings** - 3-table JOIN to get mapping details

**Cells Created** (2/4):
1. ✅ **details-panel-selector** (Complete - Phase A.2)
   - Location: `apps/web/components/cells/details-panel-selector/`
   - Files: `component.tsx`, `manifest.json`, `pipeline.yaml`
   - Status: Complete with all 4 read procedures
   - Features: Cascading dropdowns, memoization, cost breakdown finder

2. ✅ **details-panel-viewer** (Complete - Phase A.2)
   - Location: `apps/web/components/cells/details-panel-viewer/`
   - Files: `component.tsx`, `manifest.json`, `pipeline.yaml`
   - Status: Complete with green card display
   - Features: Mapping display, AUD formatting, null handling

**Infrastructure**:
- ✅ Edge function deployed to Supabase (bykrhpaqaxhyfrqfvbus)
- ✅ TypeScript types generated (packages/api)
- ✅ All curl tests passing
- ✅ TypeScript zero errors
- ✅ Manual validation: NO ISSUES

---

## What's Next: Phase B - Mutation Operations

### Immediate Next Steps (8 hours estimated)

Phase B will implement the CRUD operations (Create, Update, Delete) for PO mappings.

#### Overview of Phase B
- **3 mutation procedures** to implement
- **1 new cell** to create (details-panel-mapper)
- **5 git checkpoints** required
- **Manual validation gate** at end

---

### Step 1: Implement Procedure 6 (createMapping) - 1 hour

**Location**: Add to both:
1. `supabase/functions/trpc/index.ts` (edge function)
2. `packages/api/src/routers/po-mapping.ts` (TypeScript types)

**Specification** (from migration plan lines 238-277):

```typescript
/**
 * Procedure 6: Create new PO mappings for all line items
 */
createMapping: publicProcedure
  .input(z.object({
    poId: z.string().uuid(),
    costBreakdownId: z.string().uuid(),
    mappingNotes: z.string().optional()
  }))
  .output(z.object({ 
    success: z.boolean(), 
    count: z.number() 
  }))
  .mutation(async ({ ctx, input }) => {
    try {
      // Get all line items for PO
      const lineItems = await ctx.db
        .select({ 
          id: poLineItems.id, 
          lineValue: poLineItems.lineValue 
        })
        .from(poLineItems)
        .where(eq(poLineItems.poId, input.poId))
      
      // Create mapping for each line item
      const mappings = lineItems.map(item => ({
        poLineItemId: item.id,
        costBreakdownId: input.costBreakdownId,
        mappedAmount: item.lineValue || '0',
        mappingNotes: input.mappingNotes || null,
        mappedBy: 'system',
        mappedAt: new Date()
      }))
      
      await ctx.db.insert(poMappings).values(mappings)
      
      return { success: true, count: mappings.length }
    } catch (error) {
      console.error('Failed to create mappings:', error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create mappings. Please try again.',
        cause: error,
      })
    }
  })
```

**Edge Function Version** (use raw SQL):
```typescript
createMapping: publicProcedure
  .input(z.object({
    poId: z.string().uuid(),
    costBreakdownId: z.string().uuid(),
    mappingNotes: z.string().optional()
  }))
  .mutation(async ({ ctx, input }) => {
    try {
      // Get line items
      const lineItems = await ctx.sql`
        SELECT id, line_value as "lineValue"
        FROM po_line_items
        WHERE po_id = ${input.poId}
      `
      
      // Insert mappings
      for (const item of lineItems) {
        await ctx.sql`
          INSERT INTO po_mappings (
            po_line_item_id,
            cost_breakdown_id,
            mapped_amount,
            mapping_notes,
            mapped_by,
            mapped_at
          ) VALUES (
            ${item.id},
            ${input.costBreakdownId},
            ${item.lineValue || '0'},
            ${input.mappingNotes || null},
            'system',
            NOW()
          )
        `
      }
      
      return { success: true, count: lineItems.length }
    } catch (error) {
      console.error('Failed to create mappings:', error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create mappings. Please try again.',
        cause: error,
      })
    }
  })
```

**Curl Test** (after deployment):
```bash
# Test creating mapping
curl -s -X POST 'https://bykrhpaqaxhyfrqfvbus.supabase.co/functions/v1/trpc/poMapping.createMapping' \
  -H "Content-Type: application/json" \
  -d '{"poId":"[VALID-PO-ID]","costBreakdownId":"85bc1279-4b67-42c0-98f6-d680be8c4fca","mappingNotes":"Test mapping"}'

# Expected: {"result":{"data":{"success":true,"count":N}}}
```

**Validation**:
```bash
# Check database to verify insertion
psql> SELECT * FROM po_mappings WHERE cost_breakdown_id = '85bc1279-4b67-42c0-98f6-d680be8c4fca';
# Should show newly created mappings
```

---

### Step 2: Implement Procedure 7 (updateMapping) - 1 hour

**Specification** (from migration plan lines 279-306):

```typescript
/**
 * Procedure 7: Update existing mappings
 */
updateMapping: publicProcedure
  .input(z.object({
    mappingIds: z.array(z.string().uuid()),
    costBreakdownId: z.string().uuid(),
    mappingNotes: z.string().optional()
  }))
  .output(z.object({ 
    success: z.boolean(), 
    count: z.number() 
  }))
  .mutation(async ({ ctx, input }) => {
    try {
      await ctx.db
        .update(poMappings)
        .set({
          costBreakdownId: input.costBreakdownId,
          mappingNotes: input.mappingNotes || null,
          updatedAt: new Date()
        })
        .where(inArray(poMappings.id, input.mappingIds))
      
      return { success: true, count: input.mappingIds.length }
    } catch (error) {
      console.error('Failed to update mappings:', error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update mappings. Please try again.',
        cause: error,
      })
    }
  })
```

**Edge Function Version**:
```typescript
updateMapping: publicProcedure
  .input(z.object({
    mappingIds: z.array(z.string().uuid()),
    costBreakdownId: z.string().uuid(),
    mappingNotes: z.string().optional()
  }))
  .mutation(async ({ ctx, input }) => {
    try {
      for (const mappingId of input.mappingIds) {
        await ctx.sql`
          UPDATE po_mappings
          SET 
            cost_breakdown_id = ${input.costBreakdownId},
            mapping_notes = ${input.mappingNotes || null},
            updated_at = NOW()
          WHERE id = ${mappingId}
        `
      }
      
      return { success: true, count: input.mappingIds.length }
    } catch (error) {
      console.error('Failed to update mappings:', error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update mappings. Please try again.',
        cause: error,
      })
    }
  })
```

**Curl Test**:
```bash
# Test updating existing mapping
curl -s -X POST 'https://bykrhpaqaxhyfrqfvbus.supabase.co/functions/v1/trpc/poMapping.updateMapping' \
  -H "Content-Type: application/json" \
  -d '{"mappingIds":["7fe19abd-60ed-40b5-b907-87df445fd17c"],"costBreakdownId":"[NEW-CB-ID]","mappingNotes":"Updated via curl"}'

# Expected: {"result":{"data":{"success":true,"count":1}}}
```

---

### Step 3: Deploy & Test Procedures 6-7 - 30 minutes

```bash
cd /home/iwahbi/dev/cost-management-v0

# Deploy edge function
supabase functions deploy trpc --no-verify-jwt

# MANDATORY: Wait 30 seconds for cold start
sleep 30

# Test procedure 6 (create)
curl -s -X POST 'https://bykrhpaqaxhyfrqfvbus.supabase.co/functions/v1/trpc/poMapping.createMapping' \
  -H "Content-Type: application/json" \
  -d '{"poId":"[TEST-PO-ID]","costBreakdownId":"85bc1279-4b67-42c0-98f6-d680be8c4fca","mappingNotes":"Test creation"}'

# Test procedure 7 (update)
curl -s -X POST 'https://bykrhpaqaxhyfrqfvbus.supabase.co/functions/v1/trpc/poMapping.updateMapping' \
  -H "Content-Type: application/json" \
  -d '{"mappingIds":["[MAPPING-ID]"],"costBreakdownId":"[NEW-CB-ID]","mappingNotes":"Test update"}'

# Verify in database
# Check that mappings were created/updated correctly
```

**Git Checkpoint**:
```bash
git add -A
git commit -m "Phase B.1: Create/Update mutations (procedures 6-7)

- Implemented createMapping: Maps all PO line items to cost breakdown
- Implemented updateMapping: Updates existing mappings
- Deployed and tested both procedures
- All curl tests passing

Phase: B.1 (procedures 6-7 complete)
Next: Create mapper cell"
```

---

### Step 4: Create details-panel-mapper Cell - 3 hours

**Directory**: `apps/web/components/cells/details-panel-mapper/`

**Files to Create**:

#### 4.1 manifest.json
See migration plan lines 784-814 for full spec.

```json
{
  "id": "details-panel-mapper",
  "version": "1.0.0",
  "description": "CRUD operations for PO mappings",
  "phase": "B.1",
  "status": "complete",
  "behavioral_assertions": [
    {
      "id": "BA-007",
      "description": "Save button disabled when required fields missing",
      "verification": "Leave fields empty, verify button disabled",
      "source": "Original details-panel.tsx lines 549-555"
    },
    {
      "id": "BA-008",
      "description": "Shows two-step confirmation before clearing",
      "verification": "Click clear, verify dialog appears",
      "source": "Original details-panel.tsx lines 592-626"
    },
    {
      "id": "BA-009",
      "description": "Refreshes display after successful operation",
      "verification": "Complete operation, verify data reloads",
      "source": "Original callback patterns"
    }
  ],
  "dependencies": {
    "data": ["po_mappings", "cost_breakdown"],
    "trpc": [
      "poMapping.createMapping",
      "poMapping.updateMapping",
      "poMapping.clearMappings"
    ],
    "ui": [
      "@/components/ui/button",
      "@/components/ui/textarea",
      "@/components/ui/alert-dialog"
    ]
  }
}
```

#### 4.2 pipeline.yaml
```yaml
gates:
  - name: types
    command: pnpm type-check
    requirement: "TypeScript zero errors"
  
  - name: tests
    command: pnpm test -- components/cells/details-panel-mapper
    requirement: "80%+ coverage, 3 behavioral assertions verified"
  
  - name: build
    command: pnpm build
    requirement: "Production build succeeds"
  
  - name: performance
    requirement: "Load time ≤110% baseline"
  
  - name: accessibility
    requirement: "WCAG AA compliance"
```

#### 4.3 component.tsx

See migration plan lines 655-780 for full component spec. Key points:

**Props Interface**:
```typescript
interface MapperProps {
  poId: string | null
  costBreakdownId: string | null
  existingMappings: Array<{ id: string; poLineItemId: string }>
  isEditMode: boolean
  onMappingComplete: () => void
}
```

**Key Features**:
- Uses `useMutation()` for all 3 mutation procedures
- Memoizes all mutation inputs (objects)
- Two-step confirmation for clear operation (AlertDialog)
- Toast notifications for success/error
- Disabled states when required data missing

**Memoization Example**:
```typescript
const createInput = useMemo(
  () => ({
    poId: props.poId!,
    costBreakdownId: props.costBreakdownId!,
    mappingNotes: mappingNotes || undefined
  }),
  [props.poId, props.costBreakdownId, mappingNotes]
)

const createMutation = trpc.poMapping.createMapping.useMutation()

const handleSave = async () => {
  try {
    await createMutation.mutateAsync(createInput)
    toast({ title: 'Mapping created successfully' })
    props.onMappingComplete()
  } catch (error) {
    toast({ title: 'Error saving mapping', variant: 'destructive' })
  }
}
```

**Validation**:
```bash
cd apps/web
pnpm tsc --noEmit  # Must pass with zero errors
```

---

### Step 5: Implement Procedure 8 (clearMappings) - 1 hour

**Specification** (from migration plan lines 308-328):

```typescript
/**
 * Procedure 8: Clear/delete mappings
 */
clearMappings: publicProcedure
  .input(z.object({
    poLineItemIds: z.array(z.string().uuid())
  }))
  .output(z.object({ success: z.boolean() }))
  .mutation(async ({ ctx, input }) => {
    try {
      await ctx.db
        .delete(poMappings)
        .where(inArray(poMappings.poLineItemId, input.poLineItemIds))
      
      return { success: true }
    } catch (error) {
      console.error('Failed to clear mappings:', error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to clear mappings. Please try again.',
        cause: error,
      })
    }
  })
```

**Edge Function Version**:
```typescript
clearMappings: publicProcedure
  .input(z.object({
    poLineItemIds: z.array(z.string().uuid())
  }))
  .mutation(async ({ ctx, input }) => {
    try {
      for (const lineItemId of input.poLineItemIds) {
        await ctx.sql`
          DELETE FROM po_mappings
          WHERE po_line_item_id = ${lineItemId}
        `
      }
      
      return { success: true }
    } catch (error) {
      console.error('Failed to clear mappings:', error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to clear mappings. Please try again.',
        cause: error,
      })
    }
  })
```

**Curl Test**:
```bash
# Test clearing mappings
curl -s -X POST 'https://bykrhpaqaxhyfrqfvbus.supabase.co/functions/v1/trpc/poMapping.clearMappings' \
  -H "Content-Type: application/json" \
  -d '{"poLineItemIds":["[LINE-ITEM-ID-1]","[LINE-ITEM-ID-2]"]}'

# Expected: {"result":{"data":{"success":true}}}
```

---

### Step 6: Deploy & Test Procedure 8 - 30 minutes

```bash
# Deploy edge function
supabase functions deploy trpc --no-verify-jwt

# Wait 30 seconds
sleep 30

# Test clear operation
curl -s -X POST 'https://bykrhpaqaxhyfrqfvbus.supabase.co/functions/v1/trpc/poMapping.clearMappings' \
  -H "Content-Type: application/json" \
  -d '{"poLineItemIds":["[TEST-LINE-ITEM-ID]"]}'

# Verify in database
# Check that mappings were deleted
```

**Git Checkpoint**:
```bash
git add -A
git commit -m "Phase B.2: Clear operation (procedure 8)

- Implemented clearMappings with array deletion
- Deployed and tested procedure
- Curl test passing

Phase: B.2 (procedure 8 complete)
Next: Update mapper cell with clear functionality"
```

---

### Step 7: Update Mapper with Clear Functionality - 1 hour

Update `apps/web/components/cells/details-panel-mapper/component.tsx`:

**Add Clear Mutation**:
```typescript
const clearInput = useMemo(
  () => ({
    poLineItemIds: props.existingMappings.map(m => m.poLineItemId)
  }),
  [props.existingMappings]
)

const clearMutation = trpc.poMapping.clearMappings.useMutation()

const handleClear = async () => {
  try {
    await clearMutation.mutateAsync(clearInput)
    toast({ title: 'Mappings cleared successfully' })
    setShowClearDialog(false)
    props.onMappingComplete()
  } catch (error) {
    toast({ title: 'Error clearing mappings', variant: 'destructive' })
  }
}
```

**Add Clear Button** (only in edit mode):
```typescript
{props.isEditMode && (
  <Button 
    variant="destructive"
    onClick={() => setShowClearDialog(true)}
  >
    Clear All Mappings
  </Button>
)}
```

**Update manifest.json**:
- Add procedure 8 to dependencies.trpc array
- Change phase to "B.2"
- Update notes

**Validation**:
```bash
pnpm tsc --noEmit  # Zero errors required
```

**Git Checkpoint**:
```bash
git add -A
git commit -m "Phase B Complete: All mutation operations

- Completed details-panel-mapper cell:
  - Create, update, and clear operations
  - Two-step confirmation for clear (AlertDialog)
  - Toast notifications for success/error
  - Proper memoization for all mutation inputs
  - 3 behavioral assertions (BA-007, BA-008, BA-009)

- All 3 mutation procedures implemented:
  - createMapping (procedure 6)
  - updateMapping (procedure 7)
  - clearMappings (procedure 8)

Phase B: COMPLETE (8/9 procedures, 3/4 cells)
All mutation operations implemented and tested
Next: Manual Validation Gate B"
```

---

### Step 8: Request Manual Validation Gate B

**User Prompt**:
```markdown
🛑 MANUAL VALIDATION GATE B

Phase B (Mutation Operations) is complete. Please validate:

1. ✓ Create new mapping works
   - Test: Select unmapped PO → Choose cost breakdown → Click "Create Mapping"
   - Expected: Mapping created, green card appears with details

2. ✓ Update existing mapping works
   - Test: Select PO with mappings → Change cost breakdown → Click "Update Mapping"
   - Expected: Mapping updated, green card shows new cost breakdown

3. ✓ Clear shows confirmation and works
   - Test: Click "Clear All Mappings" → Verify dialog appears → Confirm
   - Expected: Dialog shown, mappings deleted after confirmation

4. ✓ Database shows correct data
   - Test: Check Supabase dashboard after operations
   - Expected: po_mappings table reflects create/update/delete operations

5. ✓ Toast notifications work
   - Expected: Success toasts for operations, error toasts for failures

Respond with:
- "PHASE B VALIDATED - proceed to Phase C" OR
- "FIX ISSUES - [describe what's broken]"
```

**If validated**: Proceed to Phase C (Integration)  
**If issues found**: Debug and fix before continuing

---

## How to Resume This Session

### Option 1: Quick Resume (Continue from Phase B)

```bash
# 1. Verify you're on correct branch
git branch  # Should show: refactor/codebase-modernization
git log -1  # Should show: 9f0b58d "Phase A Complete"

# 2. Verify working state
cd /home/iwahbi/dev/cost-management-v0
pnpm type-check  # Should pass with zero errors

# 3. Start with Step 1 above (Implement Procedure 6)
# Open: supabase/functions/trpc/index.ts AND packages/api/src/routers/po-mapping.ts
# Add: Procedure 6 (createMapping) to both files
```

### Option 2: Fresh Context Resume

**Prompt to AI Assistant**:
```markdown
Resume migration execution from Phase A checkpoint.

Migration: details-panel.tsx → Cell Architecture
Phase: A Complete → Resume Phase B
Commit: 9f0b58d
Implementation Report: @thoughts/shared/implementations/2025-10-02_phase-a-complete_implementation-report.md
Resume Guide: @thoughts/shared/implementations/2025-10-02_phase-b-ready_resume-guide.md
Migration Plan: @thoughts/shared/plans/2025-10-02_17-30_details-panel_migration_plan.md

Status: Phase A complete (5 procedures, 2 cells). Ready to implement Phase B mutation operations.

Please start with implementing procedure 6 (createMapping) in both:
- supabase/functions/trpc/index.ts
- packages/api/src/routers/po-mapping.ts
```

---

## Critical Reminders for Phase B

### ⚠️ MUST DO
1. **Wait 30 seconds after edge function deployment** - No exceptions
2. **Test procedures with curl BEFORE client code** - Mandatory for mutations
3. **Memoize all mutation inputs** - Objects passed to useMutation
4. **Add to BOTH files** - Edge function AND packages/api router
5. **Git checkpoint after each sub-phase** - B.1, B.2, then Phase B Complete
6. **Manual validation gate required** - User must approve Phase B before C
7. **Two-step confirmation for delete** - Use AlertDialog component

### ✅ PATTERNS TO FOLLOW
- **Mutations**: Use `.mutation()` not `.query()`
- **Memoization**: All objects in mutation inputs use useMemo()
- **Error Handling**: Try/catch with TRPCError
- **Success Feedback**: Toast notifications for all operations
- **Database Verification**: Check Supabase after mutations to confirm changes

### 🚫 PITFALLS TO AVOID
- ❌ Don't forget to add procedures to packages/api (type generation)
- ❌ Don't skip curl testing for mutations (harder to debug than queries)
- ❌ Don't use inline objects in mutation inputs (infinite loops)
- ❌ Don't skip cold start wait after deployment
- ❌ Don't forget AlertDialog for destructive operations

---

## Test Data Reference

### Shell Crux Project
- **Project ID**: `94d1eaad-4ada-4fb6-b872-212b6cd6007a`
- **Cost Breakdown ID**: `85bc1279-4b67-42c0-98f6-d680be8c4fca` (Operational/Drums)

### PO with Mappings (for testing update/clear)
- **PO ID**: `bb415ceb-e5c8-4ce3-97cc-e62251892b19`
- **PO Number**: "4584165035"
- **Mapping ID**: `7fe19abd-60ed-40b5-b907-87df445fd17c`
- **Line Item ID**: `0ae45bb0-6084-4661-b198-aacb90621a0f`

### Finding Test Data
```sql
-- Find POs without mappings (for testing create)
SELECT p.id, p.po_number
FROM pos p
WHERE NOT EXISTS (
  SELECT 1 FROM po_mappings pm
  INNER JOIN po_line_items pli ON pli.id = pm.po_line_item_id
  WHERE pli.po_id = p.id
)
LIMIT 5;

-- Find existing mappings (for testing update/clear)
SELECT pm.id, pm.po_line_item_id, pli.po_id
FROM po_mappings pm
INNER JOIN po_line_items pli ON pli.id = pm.po_line_item_id
LIMIT 5;
```

---

## Reference Files

**Implementation Report**: `thoughts/shared/implementations/2025-10-02_phase-a-complete_implementation-report.md`  
**Migration Plan**: `thoughts/shared/plans/2025-10-02_17-30_details-panel_migration_plan.md`  
**Analysis Report**: `thoughts/shared/analysis/2025-10-02_16-30_details-panel_analysis.md`  
**Cell Checklist**: `docs/cell-development-checklist.md`  
**tRPC Debug Guide**: `docs/trpc-debugging-guide.md`

**Key Line References**:
- Migration Plan Phase B Sequence: Lines 1025-1067
- Migration Plan Procedure 6 Spec: Lines 238-277
- Migration Plan Procedure 7 Spec: Lines 279-306
- Migration Plan Procedure 8 Spec: Lines 308-328
- Migration Plan Mapper Cell Spec: Lines 650-814

---

## Progress Tracker

**Overall Migration**:
- Total Procedures: 9
- Completed: 5/9 (56%)
- Remaining: 4 (3 in Phase B, 1 in Phase C)

**Phase B Estimate**:
- Procedures: 3 to implement
- Cells: 1 to create
- Checkpoints: 3 required
- Estimated: 8 hours

**Overall Remaining**: 13.5 hours (Phase B: 8h + Phase C: 5.5h)

---

**End of Resume Guide**

Safe to pause. All Phase A work saved and validated.  
Ready to resume Phase B (Mutation Operations) anytime.
