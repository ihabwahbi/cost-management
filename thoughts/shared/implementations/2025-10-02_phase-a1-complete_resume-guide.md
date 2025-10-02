# Migration Resume Guide: details-panel.tsx → Cell Architecture

## Session Summary

**Date**: 2025-10-02  
**Phase Completed**: A.1 (6/12 checkpoints)  
**Time Invested**: ~1.5 hours  
**Git Commit**: `86d9f0e` - "Phase A.1: Basic selectors (3 procedures)"  
**Status**: ✅ CLEAN CHECKPOINT - Safe to resume

---

## What Was Completed

### ✅ Phase A.1: Basic Selectors (Complete)

**tRPC Procedures Implemented** (3/9):
1. **poMapping.getProjects** 
   - Location: `supabase/functions/trpc/index.ts` (lines ~363-380)
   - Input: `z.void()`
   - Output: Array of `{id, name, subBusinessLine}`
   - Curl Test: ✅ PASSING
   - URL: `https://bykrhpaqaxhyfrqfvbus.supabase.co/functions/v1/trpc/poMapping.getProjects`

2. **poMapping.getSpendTypes**
   - Location: `supabase/functions/trpc/index.ts` (lines ~382-402)
   - Input: `{projectId: UUID}`
   - Output: Array of strings (distinct spend types)
   - Curl Test: ✅ PASSING
   - Test Data: `projectId: "94d1eaad-4ada-4fb6-b872-212b6cd6007a"` (Shell Crux)
   - Result: `["Operational"]`

3. **poMapping.getSpendSubCategories**
   - Location: `supabase/functions/trpc/index.ts` (lines ~404-424)
   - Input: `{projectId: UUID, spendType: string}`
   - Output: Array of strings (distinct subcategories)
   - Curl Test: ✅ PASSING
   - Test Data: `spendType: "Operational"`
   - Result: `["ACTive Parts", "CRIP M&S", "Drums", "Strings"]`

**Cell Component Created**:
- **details-panel-selector** (Partial - Phase A.1)
  - Location: `apps/web/components/cells/details-panel-selector/`
  - Files:
    - ✅ `component.tsx` - Cascading dropdowns with memoization
    - ✅ `manifest.json` - 3 behavioral assertions (BA-004, BA-005, BA-006)
    - ✅ `pipeline.yaml` - Validation gates
  - Status: **Partial** - uses procedures 1-3 only
  - Missing: Procedure 4 (findMatchingCostBreakdown) will be added in Phase A.2

**Infrastructure Updates**:
- ✅ `packages/api/src/routers/po-mapping.ts` - Created with procedures 1-3
- ✅ `packages/api/src/index.ts` - Exported poMapping router
- ✅ `supabase/functions/trpc/index.ts` - Added procedures 1-3 and router
- ✅ Edge function deployed to Supabase
- ✅ TypeScript compilation: ZERO ERRORS

**Validations Completed**:
- ✅ API package type-check: PASSING
- ✅ Web app type-check: PASSING
- ✅ Edge function deployment: SUCCESS
- ✅ Cold start wait: 30 seconds completed
- ✅ All curl tests: 3/3 PASSING

**Git State**:
- Branch: `refactor/codebase-modernization`
- Latest Commit: `86d9f0e`
- Commit Message: "Phase A.1: Basic selectors (3 procedures)"
- Files Changed: 9 files
- Insertions: +2362 lines
- Deletions: -1 line

---

## Current Codebase State

### Working Features
✅ **Cascading Dropdowns** (partial):
- Projects dropdown loads from tRPC
- Spend Types dropdown filters by selected project
- Subcategories dropdown filters by project + spend type
- Dropdowns properly disabled when upstream not selected
- Cascading reset logic working

### Test Project Available
- **Project ID**: `94d1eaad-4ada-4fb6-b872-212b6cd6007a`
- **Name**: "Shell Crux"
- **Sub Business Line**: "WIS"
- **Spend Type**: "Operational"
- **Subcategories**: 4 available (ACTive Parts, CRIP M&S, Drums, Strings)

### Supabase Configuration
- **Project Ref**: `bykrhpaqaxhyfrqfvbus`
- **Edge Function**: `trpc` (deployed and tested)
- **Database**: Connected and validated
- **RLS Status**: ⚠️ Disabled on PO tables (noted for future fix - NOT blocking)

---

## What's Next: Phase A.2

### Immediate Next Steps (4-5 hours)

#### Step 1: Implement Procedure 4 (findMatchingCostBreakdown) - 1 hour
**Location**: `supabase/functions/trpc/index.ts`

**Specification** (from migration plan):
```typescript
// Add to poMappingRouter after procedure 3

/**
 * Procedure 4: Find matching cost breakdown
 */
findMatchingCostBreakdown: publicProcedure
  .input(z.object({
    projectId: z.string().uuid(),
    spendType: z.string(),
    spendSubCategory: z.string()
  }))
  .query(async ({ ctx, input }) => {
    try {
      const result = await ctx.sql`
        SELECT 
          cb.id,
          cb.project_id as "projectId",
          cb.sub_business_line as "subBusinessLine",
          cb.cost_line as "costLine",
          cb.spend_type as "spendType",
          cb.spend_sub_category as "spendSubCategory",
          cb.budget_cost as "budgetCost"
        FROM cost_breakdown cb
        INNER JOIN projects p ON p.id = cb.project_id
        WHERE cb.project_id = ${input.projectId}
          AND cb.spend_type = ${input.spendType}
          AND cb.spend_sub_category = ${input.spendSubCategory}
      `;
      
      return result;
    } catch (error) {
      console.error('Failed to find matching cost breakdown:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to find matching cost breakdown. Please try again.',
        cause: error,
      });
    }
  }),
```

**Curl Test**:
```bash
curl -s -G 'https://bykrhpaqaxhyfrqfvbus.supabase.co/functions/v1/trpc/poMapping.findMatchingCostBreakdown' \
  --data-urlencode 'input={"projectId":"94d1eaad-4ada-4fb6-b872-212b6cd6007a","spendType":"Operational","spendSubCategory":"Drums"}'
```

Expected: Array of cost breakdown objects with matching criteria

---

#### Step 2: Implement Procedure 5 (getExistingMappings) - 1 hour
**Location**: `supabase/functions/trpc/index.ts`

**Specification** (from migration plan):
```typescript
/**
 * Procedure 5: Get existing PO mappings
 */
getExistingMappings: publicProcedure
  .input(z.object({
    poId: z.string().uuid()
  }))
  .query(async ({ ctx, input }) => {
    try {
      const result = await ctx.sql`
        SELECT 
          pm.id,
          pm.po_line_item_id as "poLineItemId",
          pm.cost_breakdown_id as "costBreakdownId",
          pm.mapped_amount as "mappedAmount",
          pm.mapping_notes as "mappingNotes",
          pli.line_item_number as "lineItemNumber",
          pli.description,
          pli.quantity,
          pli.line_value as "lineValue",
          cb.cost_line as "costLine",
          cb.spend_type as "spendType",
          cb.spend_sub_category as "spendSubCategory"
        FROM po_mappings pm
        INNER JOIN po_line_items pli ON pli.id = pm.po_line_item_id
        INNER JOIN cost_breakdown cb ON cb.id = pm.cost_breakdown_id
        WHERE pli.po_id = ${input.poId}
      `;
      
      return result;
    } catch (error) {
      console.error('Failed to fetch existing mappings:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch existing mappings. Please try again.',
        cause: error,
      });
    }
  }),
```

**Curl Test** (need valid PO ID from database):
```bash
# First find a PO with mappings:
# Run in Supabase SQL Editor or via MCP:
# SELECT id, po_number FROM pos WHERE id IN (SELECT DISTINCT po_id FROM po_line_items WHERE id IN (SELECT DISTINCT po_line_item_id FROM po_mappings)) LIMIT 1;

# Then test:
curl -s -G 'https://bykrhpaqaxhyfrqfvbus.supabase.co/functions/v1/trpc/poMapping.getExistingMappings' \
  --data-urlencode 'input={"poId":"[UUID-FROM-QUERY]"}'
```

---

#### Step 3: Deploy & Test Procedures 4-5 - 30 minutes
```bash
cd /home/iwahbi/dev/cost-management-v0
supabase functions deploy trpc --no-verify-jwt

# Wait 30 seconds for cold start
sleep 30

# Test procedure 4
curl -s -G 'https://bykrhpaqaxhyfrqfvbus.supabase.co/functions/v1/trpc/poMapping.findMatchingCostBreakdown' \
  --data-urlencode 'input={"projectId":"94d1eaad-4ada-4fb6-b872-212b6cd6007a","spendType":"Operational","spendSubCategory":"Drums"}'

# Test procedure 5 (use valid PO ID)
curl -s -G 'https://bykrhpaqaxhyfrqfvbus.supabase.co/functions/v1/trpc/poMapping.getExistingMappings' \
  --data-urlencode 'input={"poId":"[VALID-PO-ID]"}'
```

**Validation**: Both should return 200 OK with data

**Git Checkpoint**: 
```bash
git add -A
git commit -m "Phase A.2: Complex read operations (procedures 4-5)

- Implemented findMatchingCostBreakdown with JOIN
- Implemented getExistingMappings with 3-table JOIN
- Deployed and tested both procedures
- All curl tests passing

Phase: A.2 (procedures complete)
Next: Create viewer cell + update selector"
```

---

#### Step 4: Create details-panel-viewer Cell - 2 hours

**Directory**: `apps/web/components/cells/details-panel-viewer/`

**Files to Create**:

1. **component.tsx** - See migration plan lines 373-419 for full spec
2. **manifest.json** - See migration plan lines 422-453
3. **pipeline.yaml** - See migration plan lines 455-471

**Key Implementation Notes**:
- Uses procedure 5 (getExistingMappings)
- Memoization: `poId` is primitive string, no memoization needed
- Currency formatting: AUD, no decimals (existing helper can be reused)
- Behavioral Assertions: BA-001, BA-002, BA-003
- Displays mappings in green card (from original component design)

**Validation**:
```bash
cd apps/web
pnpm tsc --noEmit  # Must pass with zero errors
```

---

#### Step 5: Update Selector with Procedure 4 - 30 minutes

**File**: `apps/web/components/cells/details-panel-selector/component.tsx`

**Changes**:
1. Add procedure 4 query with memoization:
```typescript
// Add after subCategories query
const findInput = useMemo(
  () => ({
    projectId: props.selectedProject,
    spendType: props.selectedSpendType,
    spendSubCategory: props.selectedSpendSubCategory
  }),
  [props.selectedProject, props.selectedSpendType, props.selectedSpendSubCategory]
)
const { data: costBreakdowns } = trpc.poMapping.findMatchingCostBreakdown.useQuery(
  findInput,
  { enabled: !!props.selectedProject && !!props.selectedSpendType && !!props.selectedSpendSubCategory }
)

// Add effect to notify parent when found
useEffect(() => {
  if (costBreakdowns && costBreakdowns.length > 0) {
    props.onCostBreakdownFound(costBreakdowns[0].id)
  } else {
    props.onCostBreakdownFound(null)
  }
}, [costBreakdowns, props.onCostBreakdownFound])
```

2. Update props interface:
```typescript
interface SelectorProps {
  // ... existing props
  onCostBreakdownFound: (id: string | null) => void  // Add this
}
```

3. Update manifest.json:
- Change phase from "A.1" to "A.2"
- Change status from "partial" to "complete"
- Update notes: "Complete implementation with all 4 read procedures"
- Add procedure 4 to dependencies.trpc array

**Validation**:
```bash
pnpm tsc --noEmit  # Zero errors required
```

---

#### Step 6: Git Checkpoint - Phase A Complete - 10 minutes

```bash
git add -A
git commit -m "Phase A Complete: All read operations

- Created details-panel-viewer cell:
  - Displays existing PO mappings in green card
  - Currency formatting (AUD)
  - N/A handling for null values
  - 3 behavioral assertions (BA-001, BA-002, BA-003)

- Updated details-panel-selector:
  - Added procedure 4 (findMatchingCostBreakdown)
  - Complete cascading logic with all 4 queries
  - Notifies parent when cost breakdown found
  - 3 behavioral assertions (BA-004, BA-005, BA-006)

Phase A: COMPLETE (5/9 procedures, 2/4 cells)
All read operations implemented and tested
Next: Manual Validation Gate A"
```

---

#### Step 7: Request Manual Validation Gate A

**User Prompt**:
```markdown
🛑 MANUAL VALIDATION GATE A

Phase A (Read Operations) is complete. Please validate:

1. ✓ Cascading dropdowns work correctly
   - Test: Select Shell Crux → Operational → Drums
   - Expected: All dropdowns load and filter correctly

2. ✓ Existing mappings display correctly (if PO has mappings)
   - Test: Select a PO with existing mappings
   - Expected: Green card shows mapping details

3. ✓ No console errors
   - Test: Open browser DevTools → Console
   - Expected: No errors (warnings OK)

4. ✓ Network tab shows successful tRPC calls
   - Test: Open DevTools → Network → Filter "trpc"
   - Expected: All requests return 200 OK

5. ✓ Loading states work
   - Test: Refresh page, observe skeleton loaders
   - Expected: Skeletons show, then data appears

Respond with:
- "PHASE A VALIDATED - proceed to Phase B" OR
- "FIX ISSUES - [describe what's broken]"
```

**If validated**: Proceed to Phase B (mutations)  
**If issues found**: Debug and fix before continuing

---

## How to Resume

### Option 1: Quick Resume (Continue from current state)

```bash
# 1. Verify you're on correct branch
git branch  # Should show: refactor/codebase-modernization
git log -1  # Should show: 86d9f0e "Phase A.1: Basic selectors"

# 2. Verify working state
cd /home/iwahbi/dev/cost-management-v0
pnpm type-check  # Should pass with zero errors

# 3. Start with Step 1 above (Implement Procedure 4)
# Open: supabase/functions/trpc/index.ts
# Find: poMappingRouter (line ~363)
# Add: Procedure 4 after procedure 3
```

### Option 2: Fresh Context Resume

**Prompt to AI Assistant**:
```markdown
Resume migration execution from Phase A.1 checkpoint.

Migration: details-panel.tsx → Cell Architecture
Phase: A.1 Complete → Resume A.2
Commit: 86d9f0e
Resume Guide: @thoughts/shared/implementations/2025-10-02_phase-a1-complete_resume-guide.md
Migration Plan: @thoughts/shared/plans/2025-10-02_17-30_details-panel_migration_plan.md

Status: Phase A.1 complete (3 procedures, 1 partial cell). Ready to implement procedures 4-5 and complete Phase A.

Please start with implementing procedure 4 (findMatchingCostBreakdown) in supabase/functions/trpc/index.ts
```

---

## Critical Reminders for Next Session

### ⚠️ MUST DO
1. **Wait 30 seconds after edge function deployment** - No exceptions
2. **Test procedures with curl BEFORE client code** - Mandatory
3. **Memoize all non-primitive query inputs** - Prevent infinite loops
4. **Git checkpoint after each sub-phase** - A.2, then Phase A Complete
5. **Manual validation gate required** - User must approve Phase A before B

### ✅ PATTERNS TO FOLLOW
- **Date Handling**: Use `z.string().transform()` (NOT `z.date()`)
- **SQL**: Use raw SQL in edge function, Drizzle helpers in packages/api
- **Memoization**: All objects/arrays passed to useQuery must use useMemo()
- **Curl Format**: GET requests with `--data-urlencode 'input={...}'`

### 🚫 PITFALLS TO AVOID
- ❌ Don't skip curl testing - catches issues early
- ❌ Don't forget cold start wait - tests fail otherwise
- ❌ Don't create inline objects in query inputs - infinite loops
- ❌ Don't use z.date() - HTTP serialization fails
- ❌ Don't skip git checkpoints - lose rollback points

---

## Reference Files

**Migration Plan**: `thoughts/shared/plans/2025-10-02_17-30_details-panel_migration_plan.md`  
**Analysis Report**: `thoughts/shared/analysis/2025-10-02_16-30_details-panel_analysis.md`  
**Discovery Report**: `thoughts/shared/discoveries/2025-10-02_discovery-report.md`  
**Cell Checklist**: `docs/cell-development-checklist.md`  
**tRPC Debug Guide**: `docs/trpc-debugging-guide.md`

**Key Line References**:
- Migration Plan Procedure 4 Spec: Lines 144-186
- Migration Plan Procedure 5 Spec: Lines 188-236
- Migration Plan Viewer Cell Spec: Lines 369-471
- Migration Plan Selector Update: Lines 476-614

---

## Progress Tracker

**Overall Migration**:
- Total Phases: 3 (A, B, C)
- Total Checkpoints: 12
- Completed Checkpoints: 1/12 (8%)
- Estimated Total Duration: 22-24 hours
- Time Invested: ~1.5 hours (6%)

**Phase A Progress**:
- Procedures: 3/5 complete (60%)
- Cells: 1/2 partial (50%)
- Checkpoints: 1/2 complete (50%)
- Estimated Remaining: 4-5 hours

**Next Milestone**: Phase A Complete + Manual Validation Gate A

---

## Success Criteria Checklist

**Phase A.1** ✅ COMPLETE:
- [x] Procedures 1-3 implemented
- [x] All curl tests passing
- [x] Edge function deployed
- [x] Selector cell created (partial)
- [x] TypeScript zero errors
- [x] Git checkpoint created

**Phase A.2** (In Progress):
- [ ] Procedure 4 implemented
- [ ] Procedure 5 implemented
- [ ] Both curl tests passing
- [ ] Viewer cell created
- [ ] Selector updated with procedure 4
- [ ] TypeScript zero errors
- [ ] Git checkpoint created

**Phase A Complete**:
- [ ] 5/9 procedures working
- [ ] 2/4 cells created
- [ ] All read operations functional
- [ ] Manual validation approved

---

**End of Resume Guide**

Safe to pause. All work saved. Ready to resume Phase A.2 anytime.
