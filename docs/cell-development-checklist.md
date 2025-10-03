# Cell Development Checklist

**Version:** 2.0 (Updated Post-Story 1.3 Incident)  
**Purpose**: Ensure reliable Cell development using enhanced workflow from PO review

**Use this checklist for EVERY Cell migration or new Cell creation**

**IMPORTANT:** We are CONTINUING with Smart Cell architecture. The issues in Story 1.3 were workflow failures, not architectural flaws. Follow this enhanced checklist rigorously.

---

## Pre-Development Phase

### 1. Complexity Assessment
- [ ] Count number of tRPC queries needed (1 query = simple, 2-3 = moderate, 4+ = complex)
- [ ] Identify all data dependencies (props, context, URL params)
- [ ] Check if any inputs involve Date objects, arrays, or complex objects
- [ ] **For 3+ queries**: Use PHASED implementation strategy (see living-blueprint-architecture.md Part 13)

**Decision Point**: 
- ✅ Simple (1-2 queries) → Standard Cell workflow (2-4 hours)
- ✅ Moderate (3 queries) → Enhanced Cell workflow with phased implementation (6-8 hours)
- ✅ Complex (4+ queries) → Phased implementation MANDATORY, consider breaking into multiple Cells (8-12 hours)

---

## Phase 1: tRPC Specialized Procedure Development (M1-M4 Compliance)

### 2. Create Specialized Procedure File (M1: One Procedure, One File)

**CRITICAL**: Follow API Procedure Specialization Architecture mandates (M1-M4).

- [ ] Determine domain for procedure (dashboard, po-mapping, budget, etc.)
- [ ] Create procedure file: `packages/api/src/procedures/[domain]/[action]-[entity].procedure.ts`
  - Example: `packages/api/src/procedures/dashboard/get-kpi-metrics.procedure.ts`
  - Example: `packages/api/src/procedures/budget/update-forecast.procedure.ts`
- [ ] **Verify**: ONE procedure per file (M1 mandate)
- [ ] **Verify**: Explicit action verb in filename: get-, create-, update-, delete- (M4 mandate)
- [ ] **Verify**: File size will stay under 200 lines (M2 mandate)
- [ ] Add Zod input validation schemas
- [ ] **CRITICAL**: Use `z.string()` for dates, NOT `z.date()`
  ```typescript
  // ✅ CORRECT
  dateRange: z.object({
    from: z.string().transform((val) => new Date(val)),
    to: z.string().transform((val) => new Date(val)),
  })
  
  // ❌ WRONG (will fail HTTP serialization)
  dateRange: z.object({
    from: z.date(),
    to: z.date(),
  })
  ```
- [ ] Add error handling with `TRPCError`
- [ ] Reference existing working procedures for SQL patterns

### 3. Test Procedures Independently (MANDATORY)
- [ ] Test each procedure via `curl` or Postman BEFORE writing client code
  ```bash
  # Test with actual ISO date strings
  curl "https://[PROJECT].supabase.co/functions/v1/trpc/dashboard.getPLTimeline?batch=1&input=%7B%220%22%3A%7B%22projectId%22%3A%22[UUID]%22%2C%22dateRange%22%3A%7B%22from%22%3A%222025-01-01%22%2C%22to%22%3A%222025-12-31%22%7D%7D%7D"
  ```
- [ ] Verify response structure matches expected schema
- [ ] Test with edge cases (empty data, invalid IDs, null values)
- [ ] **Document curl commands** for future testing

### 4. Update Domain Router & Deploy

**IMPORTANT**: No parallel implementations (M3 mandate). All procedures live in `packages/api`.

- [ ] Update domain router: `packages/api/src/procedures/[domain]/[domain].router.ts`
  ```typescript
  // Example: dashboard.router.ts
  import { router } from '../../trpc'
  import { getKPIMetricsRouter } from './get-kpi-metrics.procedure'
  // Import your new procedure router
  import { getYourNewProcedureRouter } from './get-your-new-procedure.procedure'
  
  export const dashboardRouter = router({
    ...getKPIMetricsRouter,
    ...getYourNewProcedureRouter, // Add here
  })
  ```
- [ ] **Verify**: Domain router file is ≤50 lines (architecture mandate)
- [ ] **Verify**: Router contains ONLY imports and merges, NO business logic
- [ ] Build and test locally: `pnpm build`
- [ ] Deploy updated API to edge function
- [ ] Wait 30 seconds for cold start
- [ ] Re-test all procedures via curl after deployment
- [ ] **DO NOT touch client code until procedures verified**

**ARCHITECTURE CHECK**:
```bash
# Verify domain router size (MUST be ≤50 lines)
wc -l packages/api/src/procedures/[domain]/[domain].router.ts

# Verify your procedure file size (MUST be ≤200 lines)
wc -l packages/api/src/procedures/[domain]/your-procedure.procedure.ts

# Verify no parallel implementation exists (M3)
[ ! -f supabase/functions/trpc/index.ts ] && echo "✅ M3 Compliant" || echo "🔴 VIOLATION: Delete supabase/functions/trpc/index.ts"
```

---

## Phase 2: Client Component Development

### 5. Create Cell Structure
```
components/cells/[cell-name]/
├── component.tsx      # Main component
├── state.ts          # Zustand store (if needed)
├── manifest.json     # Behavioral assertions
├── pipeline.yaml     # Validation gates
└── __tests__/
    └── component.test.tsx
```

### 6. Implement Component with Memoization (CRITICAL)

#### ✅ ALWAYS Memoize Complex Objects
```typescript
// ✅ CORRECT - Memoized date range
const dateRange = useMemo(() => {
  const now = new Date();
  const from = new Date(now);
  from.setMonth(from.getMonth() - 6);
  from.setHours(0, 0, 0, 0); // Normalize to prevent millisecond differences
  
  const to = new Date(now);
  to.setMonth(to.getMonth() + 6);
  to.setHours(23, 59, 59, 999);
  
  return { from, to };
}, []); // Empty deps = computed once

const { data } = trpc.dashboard.getPLTimeline.useQuery({
  projectId,
  dateRange, // Stable reference
});
```

```typescript
// ❌ WRONG - Inline object creation
const { data } = trpc.dashboard.getPLTimeline.useQuery({
  projectId,
  dateRange: {
    from: new Date(new Date().setMonth(new Date().getMonth() - 6)),
    to: new Date(new Date().setMonth(new Date().getMonth() + 6)),
  }, // ← NEW OBJECT EVERY RENDER = INFINITE LOOP
});
```

#### ✅ Rule of Thumb
Any non-primitive value passed to `useQuery`, `useEffect`, `useMemo`, or `useCallback`:
- **MUST** be memoized with `useMemo`
- **OR** defined outside the component
- **OR** passed as a stable prop

Types that need memoization:
- Objects: `{ key: value }`
- Arrays: `[item1, item2]`
- Functions: `() => {}`
- Date objects: `new Date()`

### 7. Add Defensive Logging
```typescript
const { data, isLoading, error, status } = trpc.dashboard.getProcedure.useQuery(input);

// ✅ ALWAYS log query state during development
console.log('[ComponentName] Query state:', {
  isLoading,
  status,
  error: error?.message,
  hasData: !!data,
  data, // Include actual data to verify structure
});
```

**Remove logging only after component is stable and tested**

### 8. Configure Query Options
```typescript
const { data } = trpc.dashboard.getProcedure.useQuery(
  input,
  {
    refetchOnMount: false,       // Prevent refetch on remount
    refetchOnWindowFocus: false, // Prevent refetch on focus
    staleTime: 5 * 60 * 1000,   // Data fresh for 5 minutes
    retry: 1,                     // Only retry once on failure
  }
);
```

---

## Phase 2.5: Architecture Compliance Validation (M1-M4 Mandates)

**MANDATORY**: Verify all API Procedure Specialization Architecture mandates before proceeding.

### Architecture Mandate Checklist

- [ ] **M1: One Procedure, One File**
  ```bash
  # Verify procedure file contains exactly ONE publicProcedure
  grep -c "publicProcedure" packages/api/src/procedures/[domain]/your-procedure.procedure.ts
  # Output should be: 1
  ```

- [ ] **M2: Strict File Size Limit (≤200 lines)**
  ```bash
  # Check procedure file size
  wc -l packages/api/src/procedures/[domain]/your-procedure.procedure.ts
  # Output MUST be ≤200
  
  # If approaching limit, extract helpers or split into smaller procedures
  ```

- [ ] **M3: No Parallel Implementations**
  ```bash
  # Verify deprecated parallel implementation does NOT exist
  if [ -f supabase/functions/trpc/index.ts ]; then
    echo "🔴🔴🔴 CRITICAL VIOLATION: supabase/functions/trpc/index.ts exists"
    echo "This file violates M3 (No Parallel Implementations)"
    echo "DELETE this file immediately"
    exit 1
  else
    echo "✅ M3 Compliant: No parallel implementations"
  fi
  ```

- [ ] **M4: Explicit Naming Conventions**
  ```bash
  # Verify filename follows [action]-[entity].procedure.ts pattern
  # ✅ GOOD: get-kpi-metrics.procedure.ts, update-budget.procedure.ts
  # ❌ BAD: index.ts, api.ts, handler.ts, dashboard.ts
  ```

- [ ] **Domain Router Compliance (≤50 lines)**
  ```bash
  # Check domain router size
  wc -l packages/api/src/procedures/[domain]/[domain].router.ts
  # Output MUST be ≤50
  
  # Verify router contains ONLY imports and merges
  grep -E "(publicProcedure|\.query|\.mutation|business logic)" packages/api/src/procedures/[domain]/[domain].router.ts
  # Should return nothing (no business logic in routers)
  ```

### Architecture Health Check

Run comprehensive architecture validation:

```bash
# Find any monolithic files (>500 lines) - ARCHITECTURAL EMERGENCY
find packages/api/src -name "*.ts" -exec wc -l {} + | awk '$1 > 500 { print "🔴🔴🔴 EMERGENCY:", $2 }'

# Find procedure file violations (>200 lines)
find packages/api/src/procedures -name "*.procedure.ts" -exec wc -l {} + | awk '$1 > 200 { print "🔴 VIOLATION:", $2 }'

# Find router violations (>50 lines)
find packages/api/src/procedures -name "*.router.ts" -exec wc -l {} + | awk '$1 > 50 { print "🔴 VIOLATION:", $2 }'

# Count procedures per file (should always be 1)
find packages/api/src/procedures -name "*.procedure.ts" -exec sh -c 'count=$(grep -c "publicProcedure" "$1"); if [ "$count" -ne 1 ]; then echo "🔴 M1 VIOLATION: $1 has $count procedures"; fi' _ {} \;
```

**If ANY violations found:**
1. 🛑 STOP development immediately
2. 🔧 REFACTOR to fix violations
3. ✅ Re-run validation checks
4. ➡️ Only proceed when ALL checks pass

---

## Phase 3: Testing & Validation

### 9. Browser Testing
- [ ] Open Chrome DevTools → Network tab
- [ ] Filter by "trpc"
- [ ] Verify requests are being made (should see GET/POST requests)
- [ ] Check request count - should be ONE per query, not multiple
  - ⚠️ If you see multiple requests with slightly different timestamps → **infinite loop** (missing memoization)
- [ ] Verify responses are 200 OK with expected data structure
- [ ] Open Console tab
- [ ] Check for query state logs (should show `status: 'success'`)
- [ ] **If status stuck on `'pending'`** → Check for unmemoized inputs

### 10. React DevTools Profiler
- [ ] Install React DevTools browser extension
- [ ] Open Profiler tab
- [ ] Start recording
- [ ] Load component
- [ ] Stop recording
- [ ] Check "Ranked" view - component should render 2-3 times max (initial + query completion)
  - ⚠️ If component renders 10+ times → **infinite loop**

### 11. Unit Tests
- [ ] Write tests for all Behavioral Assertions (BA-001, BA-002, etc.)
- [ ] Mock tRPC queries:
  ```typescript
  vi.mock('@/lib/trpc', () => ({
    trpc: {
      dashboard: {
        getProcedure: {
          useQuery: vi.fn()
        }
      }
    }
  }))
  ```
- [ ] Test loading states
- [ ] Test error states
- [ ] Test with actual data structure from curl tests
- [ ] Achieve 80%+ coverage

### 12. Type Checking
```bash
pnpm type-check
# Should pass with NO errors related to your Cell
```

---

## Phase 4: Integration & Deployment

### 13. Dashboard Integration
- [ ] Import Cell component
- [ ] Replace old component (if migrating)
- [ ] **Keep old component file** until Cell is verified working
- [ ] Test in browser - Cell should load and display data
- [ ] **DO NOT delete old component yet**

### 14. Human Validation Gate (MANDATORY)
```markdown
## 🛑 HUMAN VALIDATION REQUIRED

Please validate:
1. Cell displays correctly in browser
2. All data is visible and accurate
3. Loading states work (refresh page, verify skeleton)
4. Error states work (disconnect network, verify error message)
5. No console errors
6. Network tab shows successful requests (one per query)

Respond with:
- "VALIDATED - proceed with cleanup" OR
- "FIX ISSUES - [describe]"
```

- [ ] Wait for human approval
- [ ] **DO NOT proceed** without explicit "VALIDATED" response

### 15. Cleanup (Only After Validation)
- [ ] Delete old component file
- [ ] Verify no imports reference old component: `grep -r "OldComponentName" apps/web/`
- [ ] Update ledger.jsonl with migration entry
- [ ] Run full test suite: `pnpm test`
- [ ] Commit with clear message: "Story X.X: [Component] Cell migration - [key achievement]"

---

## Common Pitfalls & Solutions

### Pitfall #1: Infinite Render Loop
**Symptoms**:
- Component stuck in loading state
- Network tab shows multiple requests with timestamps 1ms apart
- Console shows `status: 'pending'` forever
- Browser becomes slow/unresponsive

**Solution**:
- Memoize ALL non-primitive inputs to queries
- Normalize dates to start/end of day
- Use React DevTools Profiler to catch excessive renders

### Pitfall #2: Date Serialization Failures
**Symptoms**:
- 400 Bad Request errors
- Error: "Expected date, received string"

**Solution**:
- Use `z.string().transform((val) => new Date(val))` in Zod schema
- Test with ISO date strings via curl FIRST

### Pitfall #3: SQL Syntax Mismatches
**Symptoms**:
- 500 Internal Server Error from edge function
- Edge function logs show SQL syntax errors

**Solution**:
- Reference existing working procedures (e.g., getKPIMetrics)
- Use `inArray()` for filtering by array of IDs
- Test queries directly in Supabase SQL editor first

### Pitfall #4: Missing Edge Function Deployment
**Symptoms**:
- 404 Not Found errors
- Error: "Procedure not found"

**Solution**:
- Deploy edge function BEFORE writing client code
- Wait 30 seconds after deployment for cold start
- Test with curl to verify deployment

---

## Decision Tree: Which Cell Implementation Strategy?

```
How many tRPC queries does this component need?
├─ 1-2 queries → ✅ Standard Cell workflow (follow checklist, ~2-4 hours)
├─ 3 queries → ✅ Enhanced Cell workflow with phased implementation (~6-8 hours)
│               - Test each procedure via curl FIRST
│               - Add queries incrementally (one at a time)
│               - MANDATORY memoization for all inputs
│               - Human validation gate required
│
└─ 4+ queries → ⚠️ Consider decomposing into multiple Cells
                OR use phased implementation with EXTREME rigor (~8-12 hours)
                - Deploy all procedures first, test independently
                - Add queries ONE AT A TIME with git commits
                - Performance validation required
                - Consider if multiple smaller Cells would be better
```

**Key Principle:** Continue with Smart Cell architecture, but use appropriate development strategy based on complexity. ALL components WILL become Cells - the question is HOW, not IF.

---

## Estimated Time Allocations

- **Simple Cell (1 query)**: 2-3 hours
  - tRPC procedure: 30 min
  - Testing: 30 min
  - Component: 45 min
  - Tests: 45 min
  - Integration: 30 min

- **Complex Cell (3+ queries)**: 6-8 hours
  - tRPC procedures: 2 hours
  - Testing: 1 hour
  - Component (with memoization): 2 hours
  - Tests: 2 hours
  - Integration & debugging: 1-2 hours

**If actual time exceeds estimate by 2x, STOP and reconsider approach.**

---

## Success Criteria

A Cell is considered successfully implemented when:

- [ ] All tRPC procedures tested independently via curl
- [ ] Edge function deployed and verified
- [ ] Component renders without errors
- [ ] All queries complete successfully (status: 'success')
- [ ] No infinite render loops (< 5 renders total)
- [ ] Network tab shows ONE request per query
- [ ] Unit tests pass with 80%+ coverage
- [ ] Type checking passes
- [ ] Human validation completed
- [ ] Old component deleted (if migration)
- [ ] Commit created with clear message

---

## Emergency Rollback Procedure

If Cell implementation is failing and blocking progress:

### Option A: Quick Rollback (Git)
```bash
git reset --hard HEAD~1  # Undo last commit
git clean -fd            # Remove untracked files
```

### Option B: Revert to Old Component
1. Keep Cell files but don't import them
2. Re-import old component in dashboard page
3. Deploy with old component
4. Debug Cell in separate branch
5. Only merge when fully validated

### Option C: Disable Cell Temporarily
```typescript
// In dashboard page
const USE_NEW_CELL = false;

{USE_NEW_CELL ? (
  <PLCommandCenterCell projectId={projectId} />
) : (
  <PLCommandCenter {...props} />
)}
```

**Never let a Cell migration block development for > 4 hours. Rollback and reassess.**

---

## Retrospective Questions (Post-Implementation)

After completing Cell development, answer for continuous improvement:

1. **Did the phased implementation strategy work well?** (Yes/No)
   - If No: What additional steps would have helped?
   
2. **Were all memoization issues caught early?** (Yes/No)
   - If No: What checks were missing from the checklist?
   
3. **Did curl testing of procedures save time?** (Yes/No)
   - If No: What issues weren't caught by curl testing?
   
4. **Was the human validation gate valuable?** (Yes/No)
   - If No: Should validation criteria be more specific?
   
5. **Were calculation validations thorough?** (Yes/No)
   - If No: What comparison method would work better?

**Use answers to update this checklist for future Cell implementations.**

**Note:** We are committed to 100% Cell architecture adoption. These questions are for workflow improvement, not for questioning the architectural direction.

---

## References

- [API Procedure Specialization Architecture](./2025-10-03_api_procedure_specialization_architecture.md) - **REQUIRED READING**: M1-M4 mandates for all API development
- [AI Native Development Architecture](./2025-09-26_ai_native_development_architecture.md) - Pattern 4: API Procedure Specialization (Section 5.1)
- [Living Blueprint Architecture](./ai-native-codebase-architecture.md) - Section 2.1 (Monorepo Structure with specialized procedures)
- [Story 1.3 Complete Incident & Resolution](./stories/1.3-COMPLETE-INCIDENT-AND-RESOLUTION.md) - Comprehensive analysis of issues and resolution
- [tRPC Debugging Guide](./trpc-debugging-guide.md) - Step-by-step debugging workflow with specialized procedure patterns
- [React Query Docs - Important Defaults](https://tanstack.com/query/latest/docs/react/guides/important-defaults)
- [tRPC Docs - Data Transformers](https://trpc.io/docs/server/data-transformers)
