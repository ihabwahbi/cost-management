# 🎯 SESSION 2 RESUME GUIDE

**Quick Start:** Continue API Architecture Refactoring - Phase C Dashboard Specialization

---

## ⚡ Quick Context

**Branch:** `refactor/codebase-modernization`  
**Last Commit:** `c5a3227` - Phase C.1 complete (getKPIMetrics specialized)  
**Progress:** 1/6 dashboard procedures specialized (17%)  
**Next:** Specialize remaining 5 dashboard procedures

---

## 🚀 Immediate Next Steps

### Step 1: Verify Environment

```bash
# Confirm on correct branch
git branch --show-current
# Should show: refactor/codebase-modernization

# Confirm last commit
git log --oneline -1
# Should show: c5a3227 Phase C.1: Specialize getKPIMetrics...

# Verify type checks pass
cd packages/api && pnpm type-check
cd apps/web && pnpm type-check
```

### Step 2: Start Phase C.2 (getPLMetrics)

```bash
# Find procedure location
grep -n "getPLMetrics" packages/api/src/routers/dashboard.ts
# Output: Line number where procedure starts

# Read procedure
# Use line number from above to read the procedure
```

### Step 3: Create Specialized Procedure

**File:** `packages/api/src/procedures/dashboard/get-pl-metrics.procedure.ts`

**Template:**
```typescript
import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { /* imports */ } from 'drizzle-orm';
import { /* tables */ } from '@cost-mgmt/db';
import { TRPCError } from '@trpc/server';
import { splitMappedAmount } from './helpers/split-mapped-amount.helper';
import { FALLBACK_INVOICE_RATIO } from './helpers/constants';

/**
 * Get P&L Metrics for PLCommandCenter
 * Used by: pl-command-center Cell
 */
export const getPLMetrics = publicProcedure
  .input(/* copy from dashboard.ts */)
  .query(async ({ input, ctx }) => {
    // Copy logic from dashboard.ts
  });

// Verify: File ≤200 lines
```

### Step 4: Integrate into Router

```typescript
// packages/api/src/routers/dashboard.ts

// Add import
import { getPLMetrics } from '../procedures/dashboard/get-pl-metrics.procedure';

// Add to router
export const dashboardRouter = router({
  getKPIMetrics,    // Already specialized
  getPLMetrics,     // NEW
  // ... remaining old procedures
});
```

### Step 5: Remove Old Definition

- Delete `getPLMetrics: publicProcedure...` from dashboard.ts (entire procedure block)

### Step 6: Validate & Commit

```bash
# Type check
pnpm type-check

# Verify compliance
wc -l packages/api/src/procedures/dashboard/get-pl-metrics.procedure.ts
# Must be ≤200

# Commit
git add packages/api/src/procedures/dashboard/get-pl-metrics.procedure.ts packages/api/src/routers/dashboard.ts
git commit -m "Phase C.2: Specialize getPLMetrics procedure (M1-M4 compliant)

- Create get-pl-metrics.procedure.ts ([X] lines, ≤200 ✅)
- Export procedure for router composition
- Remove from monolithic dashboard.ts
- Test: Type checks pass ✅

Impact: None (logic unchanged)
Cells tested: pl-command-center (16 uses)
"
```

### Step 7: Repeat for Remaining Procedures

**C.3: getPLTimeline** (⚠️ **CRITICAL DATE FIX**)
```typescript
// MUST FIX:
.input(z.object({
  dateRange: z.object({
    from: z.string().transform(val => new Date(val)),  // ✅ NOT z.date()
    to: z.string().transform(val => new Date(val))
  })
}))
```

**C.4: getPromiseDates**  
**C.5: getTimelineBudget**  
**C.6: getFinancialControlMetrics**

---

## 📋 Procedure Checklist (Per Procedure)

- [ ] Find procedure in dashboard.ts with `grep -n`
- [ ] Create `[name].procedure.ts` file
- [ ] Copy procedure logic (EXACTLY as-is, no changes)
- [ ] Export procedure directly: `export const [name] = publicProcedure...`
- [ ] Import helpers if needed (splitMappedAmount, FALLBACK_INVOICE_RATIO, etc.)
- [ ] Verify M1-M2: `wc -l [file]` ≤200, `grep -c publicProcedure` = 2
- [ ] Add import to dashboard.ts
- [ ] Add to dashboardRouter object
- [ ] Remove old procedure definition
- [ ] Type check: `pnpm type-check`
- [ ] Commit with standard message

---

## 🔴 Critical Items

1. **getPLTimeline Date Fix** (C.3):
   - Line ~339: `from: z.date()` → `from: z.string().transform(val => new Date(val))`
   - Line ~340: `to: z.date()` → `to: z.string().transform(val => new Date(val))`
   - Test with curl after fix to ensure serialization works

2. **Helper Imports**:
   - Most procedures use `splitMappedAmount` helper
   - Import from: `'./helpers/split-mapped-amount.helper'`
   - Import FALLBACK_INVOICE_RATIO from: `'./helpers/constants'`

3. **Export Pattern**:
   ```typescript
   // ✅ CORRECT
   export const getPLMetrics = publicProcedure...
   
   // ❌ WRONG
   export const getPLMetricsRouter = router({ getPLMetrics: ... })
   ```

---

## 📊 Progress Tracking

| Procedure | Status | Lines | Cell Using | Priority |
|-----------|--------|-------|------------|----------|
| getKPIMetrics | ✅ Done | 73 | kpi-card | P1 |
| getPLMetrics | ⏳ Next | ? | pl-command-center | P1 |
| getPLTimeline | ⏳ | ? | pl-command-center | P1 |
| getPromiseDates | ⏳ | ? | pl-command-center | P1 |
| getTimelineBudget | ⏳ | ? | budget-timeline-chart | P1 |
| getFinancialControlMetrics | ⏳ | ? | financial-control-matrix | P1 |

**Target:** All 6 procedures specialized by end of Session 2

---

## 🎯 Session 2 End Goal

**Create domain router** after all 6 procedures specialized:

```typescript
// packages/api/src/procedures/dashboard/dashboard.router.ts

import { router } from '../../trpc';

// Import all specialized procedures
import { getKPIMetrics } from './get-kpi-metrics.procedure';
import { getPLMetrics } from './get-pl-metrics.procedure';
import { getPLTimeline } from './get-pl-timeline.procedure';
import { getPromiseDates } from './get-promise-dates.procedure';
import { getTimelineBudget } from './get-timeline-budget.procedure';
import { getFinancialControlMetrics } from './get-financial-control-metrics.procedure';

/**
 * Dashboard Domain Router
 * Aggregates all dashboard procedures
 */
export const dashboardRouter = router({
  getKPIMetrics,
  getPLMetrics,
  getPLTimeline,
  getPromiseDates,
  getTimelineBudget,
  getFinancialControlMetrics,
});

// File size: ~30 lines ✅ (well under 50-line limit)
```

Then:
1. Update `packages/api/src/index.ts` → import from `../procedures/dashboard/dashboard.router`
2. Delete `packages/api/src/routers/dashboard.ts`
3. Commit: "Phase C.FINAL: Complete dashboard specialization"

---

## ✅ Session 2 Success Criteria

- [ ] All 6 dashboard procedures in dedicated files (≤200 lines each)
- [ ] dashboard.router.ts created (≤50 lines)
- [ ] Old dashboard.ts DELETED
- [ ] Type checks pass (packages/api + apps/web)
- [ ] All dashboard cells functional
- [ ] M1-M4 compliance: 100% for dashboard domain

**Estimated Time:** 8-9 hours

---

## 🆘 If Issues Arise

1. **Type Error After Adding Procedure:**
   - Check export pattern (should be `export const [name] = publicProcedure`, NOT wrapped in router)
   - Ensure import path is correct
   - Verify procedure name in router matches export name

2. **"Cannot find module" Error:**
   - Check helper imports use relative paths: `'./helpers/...'`
   - Ensure all imports from '@cost-mgmt/db' are correct

3. **Procedure Logic Unclear:**
   - Copy EXACTLY from dashboard.ts - no modifications
   - Use grep line numbers to find exact procedure code
   - Keep all comments and error handling

---

**Ready to Resume! Start with Phase C.2 (getPLMetrics)**
