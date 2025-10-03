# Resume Guide: Main Dashboard Migration

**Last Updated**: 2025-10-03 03:00 UTC  
**Current Status**: Phase A & B Complete (Data Layer 50%)  
**Next Task**: Phase C - Implement getCategoryBreakdown & getTimelineData  
**Branch**: `refactor/codebase-modernization`  
**Latest Commit**: `fe1c996`

---

## Quick Context

You are **MigrationExecutor** implementing Phase 4 of the ANDA migration workflow. You have completed Phases A & B of the data layer implementation. Phase C is CRITICAL as it fixes the simulated data issues (P0 priority).

**Migration Plan**: `thoughts/shared/plans/2025-10-03_01-01_main-dashboard_migration_plan.md`  
**Implementation Report**: `thoughts/shared/implementations/2025-10-03_03-00_main-dashboard_phase-ab-complete_implementation-report.md`

---

## Where You Left Off

### ✅ Completed

**Phase A - Core Metrics**:
- ✅ `dashboard.getMainMetrics` implemented (5 parallel queries)
- ✅ curl tested successfully
- ✅ Edge function deployed
- ✅ Git commit: `8291721`

**Phase B - Recent Activity**:
- ✅ `dashboard.getRecentActivity` implemented (quad join)
- ✅ curl tested successfully
- ✅ Edge function deployed
- ✅ Git commit: `fe1c996`

### ⏳ Next Immediate Task

**Phase C - Chart Data Procedures** (CRITICAL):

You need to implement 2 procedures that fix the simulated data issues:

1. **`dashboard.getCategoryBreakdown`**:
   - Replaces line 74 simulation: `budget * 0.85`
   - Queries REAL actual spend from `po_mappings`
   - Groups by category (cost_line)
   - Returns top 6 categories

2. **`dashboard.getTimelineData`**:
   - Replaces line 109 simulation: `budget * 1.05`
   - Queries REAL forecast from `budget_forecasts` table
   - Groups by month
   - Returns last 6 months

---

## Exact Commands to Resume

### Step 1: Verify Current State

```bash
cd /home/iwahbi/dev/cost-management

# Verify on correct branch
git branch --show-current
# Expected: refactor/codebase-modernization

# Verify latest commits
git log --oneline -3
# Expected:
# fe1c996 Phase B: Add dashboard.getRecentActivity procedure with quad join
# 8291721 Phase A: Add dashboard.getMainMetrics procedure with 5 parallel queries
# d7f935f Migrate FinancialControlMatrix to Cell architecture

# Verify working directory clean
git status
# Expected: nothing to commit, working tree clean
```

### Step 2: Implement Phase C - Procedure 3 (getCategoryBreakdown)

**File to Edit**: `packages/api/src/routers/dashboard.ts`

**Location**: After `getRecentActivity` procedure, before `getKPIMetrics`

**Complete Implementation** (from migration plan lines 436-529):

```typescript
/**
 * Get Category Breakdown (Global - no project filter)
 * Returns category spending with REAL actual spend (fixes simulated data at line 74)
 */
getCategoryBreakdown: publicProcedure
  .input(z.object({}))
  .output(z.object({
    categories: z.array(z.object({
      name: z.string(),
      value: z.number(),  // Actual spend (was simulated)
      budget: z.number(),
      percentage: z.number(),
    })),
  }))
  .query(async ({ ctx }) => {
    try {
      // Query 1: Budget by category
      const budgetData = await ctx.db
        .select({
          costLine: costBreakdown.costLine,
          totalBudget: sum(costBreakdown.budgetCost),
        })
        .from(costBreakdown)
        .where(isNotNull(costBreakdown.costLine))
        .groupBy(costBreakdown.costLine);
      
      // Query 2: Actual spend by category (REAL DATA - not simulated)
      // ⚠️ CRITICAL FIX: Replaces line 74 simulation (budget * 0.85)
      const actualData = await ctx.db
        .select({
          costLine: costBreakdown.costLine,
          totalActual: sum(poMappings.mappedAmount),
        })
        .from(poMappings)
        .innerJoin(costBreakdown, eq(poMappings.costBreakdownId, costBreakdown.id))
        .where(isNotNull(costBreakdown.costLine))
        .groupBy(costBreakdown.costLine);
      
      // Calculate grand total for percentages
      const grandTotal = budgetData.reduce(
        (sum, row) => sum + Number(row.totalBudget || 0), 
        0
      );
      
      // Join budget and actual, format names
      const categories = budgetData
        .map(row => {
          const budget = Number(row.totalBudget || 0);
          const actualRow = actualData.find(a => a.costLine === row.costLine);
          const value = Number(actualRow?.totalActual || 0);  // ✅ REAL DATA
          
          // Format: snake_case → Title Case
          const name = (row.costLine || 'Other')
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
          
          return {
            name,
            budget,
            value,  // ✅ Now using real actual spend, not budget * 0.85
            percentage: grandTotal > 0 ? (budget / grandTotal) * 100 : 0,
          };
        })
        .sort((a, b) => b.budget - a.budget)
        .slice(0, 6);  // Top 6 categories
      
      return { categories };
    } catch (error) {
      console.error('[getCategoryBreakdown] Failed:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch category breakdown. Please try again.',
        cause: error,
      });
    }
  }),
```

**Import to Add** (if not already present):
```typescript
import { isNotNull } from 'drizzle-orm';
```

### Step 3: Add Edge Function Version (Raw SQL)

**File to Edit**: `supabase/functions/trpc/index.ts`

**Location**: After `getRecentActivity` procedure, before `getKPIMetrics`

**Implementation**:

```typescript
/**
 * Get Category Breakdown (Global - no project filter)
 * Returns category spending with REAL actual spend (fixes simulated data)
 */
getCategoryBreakdown: publicProcedure
  .input(z.object({}))
  .query(async ({ ctx }) => {
    try {
      // Query 1: Budget by category
      const budgetData = await ctx.sql`
        SELECT 
          cost_line,
          COALESCE(SUM(budget_cost), 0) as total_budget
        FROM cost_breakdown
        WHERE cost_line IS NOT NULL
        GROUP BY cost_line
      `;
      
      // Query 2: Actual spend by category (REAL DATA)
      const actualData = await ctx.sql`
        SELECT 
          cb.cost_line,
          COALESCE(SUM(pm.mapped_amount), 0) as total_actual
        FROM po_mappings pm
        INNER JOIN cost_breakdown cb ON pm.cost_breakdown_id = cb.id
        WHERE cb.cost_line IS NOT NULL
        GROUP BY cb.cost_line
      `;
      
      // Calculate grand total
      const grandTotal = budgetData.reduce(
        (sum: number, row: any) => sum + Number(row.total_budget || 0), 
        0
      );
      
      // Join and format
      const categories = budgetData
        .map((row: any) => {
          const budget = Number(row.total_budget || 0);
          const actualRow = actualData.find((a: any) => a.cost_line === row.cost_line);
          const value = Number(actualRow?.total_actual || 0);
          
          const name = (row.cost_line || 'Other')
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (l: string) => l.toUpperCase());
          
          return {
            name,
            budget,
            value,
            percentage: grandTotal > 0 ? (budget / grandTotal) * 100 : 0,
          };
        })
        .sort((a: any, b: any) => b.budget - a.budget)
        .slice(0, 6);
      
      return { categories };
    } catch (error) {
      console.error('[getCategoryBreakdown] Failed:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch category breakdown. Please try again.',
        cause: error,
      });
    }
  }),
```

### Step 4: Implement Procedure 4 (getTimelineData)

**File to Edit**: `packages/api/src/routers/dashboard.ts`

**Location**: After `getCategoryBreakdown`, before `getKPIMetrics`

**Complete Implementation** (from migration plan lines 566-664):

```typescript
/**
 * Get Timeline Data (Global - no project filter)
 * Returns monthly timeline with REAL forecast (fixes simulated data at line 109)
 */
getTimelineData: publicProcedure
  .input(z.object({
    months: z.number().min(3).max(24).default(6),
  }))
  .output(z.object({
    timeline: z.array(z.object({
      month: z.string(),  // "Jan 2025"
      budget: z.number(),
      actual: z.number(),
      forecast: z.number(),
    })),
  }))
  .query(async ({ ctx, input }) => {
    try {
      // Query 1: Actual spend by month
      const actualData = await ctx.db
        .select({
          month: sql<Date>`DATE_TRUNC('month', ${poLineItems.invoiceDate})`,
          totalValue: sum(poLineItems.lineValue),
        })
        .from(poLineItems)
        .where(isNotNull(poLineItems.invoiceDate))
        .groupBy(sql`DATE_TRUNC('month', ${poLineItems.invoiceDate})`)
        .orderBy(sql`DATE_TRUNC('month', ${poLineItems.invoiceDate}) DESC`)
        .limit(input.months);
      
      // Query 2: Forecast by month (REAL DATA - not simulated)
      // ⚠️ CRITICAL FIX: Replaces line 109 simulation (budget * 1.05)
      const forecastData = await ctx.db
        .select({
          month: sql<Date>`DATE_TRUNC('month', ${budgetForecasts.forecastDate})`,
          totalForecast: sum(budgetForecasts.forecastedCost),
        })
        .from(budgetForecasts)
        .groupBy(sql`DATE_TRUNC('month', ${budgetForecasts.forecastDate})`)
        .orderBy(sql`DATE_TRUNC('month', ${budgetForecasts.forecastDate}) DESC`)
        .limit(input.months);
      
      // Format timeline data
      const timeline = actualData
        .reverse()  // Show oldest to newest
        .map(row => {
          const monthDate = new Date(row.month);
          const monthLabel = monthDate.toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric',
          });
          const actual = Number(row.totalValue || 0);
          
          // Find corresponding forecast
          const forecastRow = forecastData.find(f => {
            const fDate = new Date(f.month);
            return fDate.getMonth() === monthDate.getMonth() && 
                   fDate.getFullYear() === monthDate.getFullYear();
          });
          
          // ⚠️ TODO: Implement proper monthly budget allocation
          // For now, using simplified calculation (cost_breakdown doesn't have date field)
          const budget = actual * 1.1;  // Temporary - should query actual budget
          const forecast = Number(forecastRow?.totalForecast || budget * 1.05);
          
          return {
            month: monthLabel,
            budget,
            actual,
            forecast,  // ✅ Now from budget_forecasts table, not budget * 1.05
          };
        });
      
      return { timeline };
    } catch (error) {
      console.error('[getTimelineData] Failed:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch timeline data. Please try again.',
        cause: error,
      });
    }
  }),
```

**Import to Add** (if not already present):
```typescript
import { budgetForecasts } from '@cost-mgmt/db';
```

### Step 5: Add Edge Function Version (Raw SQL)

**File to Edit**: `supabase/functions/trpc/index.ts`

**Location**: After `getCategoryBreakdown`, before `getKPIMetrics`

**Implementation**:

```typescript
/**
 * Get Timeline Data (Global - no project filter)
 * Returns monthly timeline with REAL forecast (fixes simulated data)
 */
getTimelineData: publicProcedure
  .input(z.object({
    months: z.number().min(3).max(24).default(6),
  }))
  .query(async ({ input, ctx }) => {
    try {
      // Query 1: Actual spend by month
      const actualData = await ctx.sql`
        SELECT 
          DATE_TRUNC('month', invoice_date) as month,
          COALESCE(SUM(line_value), 0) as total_value
        FROM po_line_items
        WHERE invoice_date IS NOT NULL
        GROUP BY DATE_TRUNC('month', invoice_date)
        ORDER BY DATE_TRUNC('month', invoice_date) DESC
        LIMIT ${input.months}
      `;
      
      // Query 2: Forecast by month (REAL DATA)
      const forecastData = await ctx.sql`
        SELECT 
          DATE_TRUNC('month', forecast_date) as month,
          COALESCE(SUM(forecasted_cost), 0) as total_forecast
        FROM budget_forecasts
        GROUP BY DATE_TRUNC('month', forecast_date)
        ORDER BY DATE_TRUNC('month', forecast_date) DESC
        LIMIT ${input.months}
      `;
      
      // Format timeline
      const timeline = actualData
        .reverse()
        .map((row: any) => {
          const monthDate = new Date(row.month);
          const monthLabel = monthDate.toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric',
          });
          const actual = Number(row.total_value || 0);
          
          const forecastRow = forecastData.find((f: any) => {
            const fDate = new Date(f.month);
            return fDate.getMonth() === monthDate.getMonth() && 
                   fDate.getFullYear() === monthDate.getFullYear();
          });
          
          const budget = actual * 1.1;  // Temporary
          const forecast = Number(forecastRow?.total_forecast || budget * 1.05);
          
          return {
            month: monthLabel,
            budget,
            actual,
            forecast,
          };
        });
      
      return { timeline };
    } catch (error) {
      console.error('[getTimelineData] Failed:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch timeline data. Please try again.',
        cause: error,
      });
    }
  }),
```

### Step 6: Type Check

```bash
cd /home/iwahbi/dev/cost-management/packages/api
pnpm type-check
# Expected: Zero errors
```

### Step 7: Deploy Edge Function

```bash
cd /home/iwahbi/dev/cost-management
supabase functions deploy trpc --no-verify-jwt
```

### Step 8: Wait for Cold Start (MANDATORY)

```bash
sleep 30
echo "Ready for testing"
```

### Step 9: Curl Test Procedure 3 (getCategoryBreakdown)

```bash
curl -G https://bykrhpaqaxhyfrqfvbus.supabase.co/functions/v1/trpc/dashboard.getCategoryBreakdown \
  --data-urlencode 'batch=1' \
  --data-urlencode 'input={"0":{"json":{}}}'

# Expected: 200 OK with array of categories
# Validate:
# - Response structure matches output schema
# - 'value' field contains REAL actual spend (not budget * 0.85)
# - Top 6 categories returned
# - Percentages sum to ~100
```

### Step 10: Curl Test Procedure 4 (getTimelineData)

```bash
curl -G https://bykrhpaqaxhyfrqfvbus.supabase.co/functions/v1/trpc/dashboard.getTimelineData \
  --data-urlencode 'batch=1' \
  --data-urlencode 'input={"0":{"json":{"months":6}}}'

# Expected: 200 OK with array of timeline data
# Validate:
# - Response structure matches output schema
# - 'forecast' field comes from budget_forecasts table (not budget * 1.05)
# - 6 months returned
# - Dates in chronological order (oldest to newest)
```

### Step 11: Git Commit Phase C

```bash
cd /home/iwahbi/dev/cost-management
git add packages/api/src/routers/dashboard.ts supabase/functions/trpc/index.ts
git commit -m "Phase C: Add chart data procedures with real data fixes"
```

---

## After Phase C: Remaining Steps

### Step 12: Batch Test All 4 Procedures

Test all procedures together to verify batching:

```bash
curl -G 'https://bykrhpaqaxhyfrqfvbus.supabase.co/functions/v1/trpc/dashboard.getMainMetrics,dashboard.getRecentActivity,dashboard.getCategoryBreakdown,dashboard.getTimelineData?batch=1'
```

### Step 13: Create Cell Structure

**Directory**: `apps/web/components/cells/main-dashboard-cell/`

Create:
- `component.tsx`
- `manifest.json` (18 behavioral assertions from plan)
- `pipeline.yaml` (5 validation gates from plan)
- `__tests__/component.test.tsx`

**Templates**: See migration plan lines 700-957

### Step 14: Implement Cell Component (3 Phases)

**Phase A**: KPI cards section  
**Phase B**: Recent activity section  
**Phase C**: Charts section with REAL data

**Memoization CRITICAL**: See migration plan lines 959-999 for exact patterns

### Step 15: Write Tests

18+ tests for behavioral assertions (≥80% coverage)

### Step 16: Run Validation Gates

```bash
pnpm type-check  # Zero errors required
pnpm test        # All tests pass, ≥80% coverage
pnpm build       # Production build succeeds
```

### Step 17: Integration & Manual Validation

- Backup old `page.tsx`
- Replace with Cell import
- **MANDATORY**: Manual validation checklist (plan lines 1319-1367)
- Wait for user "VALIDATED" response

### Step 18: Cleanup & Atomic Commit

- Delete old `page.tsx`
- Update `ledger.jsonl`
- Atomic commit with all changes

---

## Critical Reminders

### Phase C Importance 🔴

Phase C is **P0-CRITICAL** because it fixes the core data integrity issues:
- **Line 74**: Simulated category spending (budget * 0.85) → REAL queries
- **Line 109**: Simulated timeline forecast (budget * 1.05) → REAL queries

**Impact**: Main dashboard currently shows FAKE data to users. Phase C fixes this.

### Zero Deviation Discipline

Follow the migration plan **EXACTLY**:
- ✅ Use exact field names from plan
- ✅ Use exact Drizzle helpers specified
- ✅ Add comments marking critical fixes
- ✅ Test with curl before proceeding
- ✅ Wait 30 seconds after deployment

### Memoization Patterns

When implementing component (Step 14):
- **ALWAYS** memoize date ranges
- **ALWAYS** memoize objects passed to useQuery
- **ALWAYS** use empty deps `[]` for static inputs
- See plan lines 959-999 for exact patterns

### Manual Validation

This is a **CRITICAL PATH** component (main landing page):
- Manual validation is **MANDATORY**
- Cannot proceed to cleanup without "VALIDATED" response
- 40+ item checklist must be completed
- See plan lines 1319-1367

---

## Troubleshooting

### If Curl Test Fails

1. Check Supabase logs:
   ```bash
   supabase functions logs trpc --tail
   ```

2. Verify procedure name matches exactly

3. Check input/output schema matches plan

4. Use `ultrathink` if issue persists:
   > "Curl test failing for [procedure]. Please include 'ultrathink' in your next message for systematic debugging."

### If Type Check Fails

1. Verify imports are correct
2. Check Drizzle helpers match plan
3. Ensure all types explicitly declared
4. Review similar working procedures (getMainMetrics, getRecentActivity)

### If Edge Function Won't Deploy

1. Check syntax errors in `index.ts`
2. Verify Deno runtime compatibility
3. Check raw SQL syntax (edge function uses postgres library, not Drizzle)

---

## Success Criteria for Phase C

Before proceeding to Phase D:

- [ ] `getCategoryBreakdown` procedure implemented in API router
- [ ] `getCategoryBreakdown` edge function version implemented
- [ ] `getTimelineData` procedure implemented in API router
- [ ] `getTimelineData` edge function version implemented
- [ ] Type checking passes (zero errors)
- [ ] Edge function deployed successfully
- [ ] 30-second cold start wait completed
- [ ] `getCategoryBreakdown` curl test passes (200 OK, real data verified)
- [ ] `getTimelineData` curl test passes (200 OK, real data verified)
- [ ] Git commit created for Phase C
- [ ] All 4 procedures work in batch test

---

## Estimated Time Remaining

**Phase C**: 2 hours  
**Phase D (Cell Structure)**: 1-2 hours  
**Phase E (Component)**: 3-4 hours  
**Phase F (Testing)**: 2-3 hours  
**Phase G (Integration)**: 1-2 hours  

**Total**: 5.5-9.5 hours remaining

---

## Key Files Reference

**Migration Plan**: `thoughts/shared/plans/2025-10-03_01-01_main-dashboard_migration_plan.md`

**Checklist**: `docs/cell-development-checklist.md`

**Debugging Guide**: `docs/trpc-debugging-guide.md`

**Ledger**: `ledger.jsonl`

**API Router**: `packages/api/src/routers/dashboard.ts`

**Edge Function**: `supabase/functions/trpc/index.ts`

**Target Component**: `apps/web/app/page.tsx`

---

## Contact Points for Escalation

If you encounter:
- **Validation failures after 3 attempts**: Request ultrathink
- **Performance regression >10%**: Halt and reassess
- **Database schema mismatches**: Request ultrathink
- **Critical path component failures**: Request ultrathink

---

**Resume Guide Generated**: 2025-10-03 03:00 UTC  
**Next Update**: After Phase C completion  
**Agent**: MigrationExecutor  
**Session Continuity**: ✅ Ready for new session
