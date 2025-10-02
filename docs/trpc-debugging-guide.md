# tRPC Debugging Guide for Living Blueprint Architecture

**Version:** 1.0  
**Date:** October 2, 2025  
**Context:** Lessons learned from Story 1.3 incident

---

## Quick Reference: Common Issues

| Symptom | Likely Cause | Quick Fix |
|---------|--------------|-----------|
| Component stuck loading forever | Unmemoized query inputs | Wrap inputs in `useMemo()` |
| 400 Bad Request on date inputs | Using `z.date()` instead of `z.string().transform()` | Change schema to transform strings |
| SQL syntax errors in edge function | Using wrong query builder syntax | Use Drizzle helpers: `eq()`, `inArray()` |
| KPICard suddenly broke | Changed NEXT_PUBLIC_TRPC_URL | Check env vars point to correct endpoint |
| Network 200 OK but UI stuck | React Query sees changing query keys | Memoize ALL objects/arrays in inputs |

---

## Debugging Workflow

### Step 1: Identify the Layer

**Check Network Tab FIRST:**

```yaml
Open Chrome DevTools → Network tab

Questions to answer:
- [ ] Are requests being sent? (Look for POST to /trpc/...)
- [ ] What status code? 
      200 OK = Server success → Issue is CLIENT-SIDE
      4xx = Bad request → Issue is INPUT VALIDATION
      5xx = Server error → Issue is SERVER-SIDE (edge function/DB)
- [ ] What is request payload? (Preview tab)
- [ ] What is response payload? (Response tab)
- [ ] How many requests? (Should be 1 for batched queries)
```

**Then Check Console:**

```yaml
Open Chrome DevTools → Console tab

Questions to answer:
- [ ] Any error messages?
- [ ] What is React Query status? 
      'pending' forever = Client-side infinite loop
      'error' = Check error message
      'success' but no data = Rendering issue
- [ ] Any warnings about re-renders?
- [ ] Are query inputs logged correctly?
```

---

### Step 2: Client-Side Issues (Network = 200 OK, UI stuck)

**Symptom:** Network tab shows successful response, but component never shows data

**Root Cause:** React Query thinks query key keeps changing, starts new query on every render

**How to Debug:**

```typescript
// Add this to your component
const { data, status, error } = trpc.getPLMetrics.useQuery(inputs)

console.log('[Component] Render #', ++renderCount)
console.log('[Component] Query inputs:', inputs)
console.log('[Component] Query status:', status)
console.log('[Component] Has data:', !!data)

// If you see:
// Render #1 - inputs: { dateRange: { from: "2025-10-02T16:26:30.600Z", ... }}
// Render #2 - inputs: { dateRange: { from: "2025-10-02T16:26:30.601Z", ... }}
// ^ Inputs changing every render = unmemoized objects
```

**How to Fix:**

```typescript
// ❌ WRONG - Creates new object every render
const { data } = trpc.getPLMetrics.useQuery({
  projectId,
  dateRange: { 
    from: new Date(),  // New object every time!
    to: new Date() 
  }
})

// ✅ CORRECT - Memoized, stable reference
const dateRange = useMemo(() => ({
  from: new Date(),
  to: new Date()
}), []) // Empty deps = created once, never recreated

const { data } = trpc.getPLMetrics.useQuery({
  projectId,
  dateRange  // Stable reference
})
```

**Prevention:**
- ALWAYS wrap objects/arrays in `useMemo()`
- ALWAYS use empty dependency array `[]` for static inputs
- Add defensive logging during development
- Use React DevTools Profiler to catch excessive re-renders

---

### Step 3: Input Validation Issues (Network = 400 Bad Request)

**Symptom:** tRPC returns 400 Bad Request, Zod validation error in console

**Common Causes:**

#### 3.1 Date Serialization Mismatch

```typescript
// ❌ WRONG - Zod expects Date object, HTTP sends string
.input(z.object({
  dateRange: z.object({
    from: z.date(),  // Expects Date
    to: z.date()     // But receives "2025-10-02T00:00:00Z" string
  })
}))

// ✅ CORRECT - Accept string, transform to Date
.input(z.object({
  dateRange: z.object({
    from: z.string().transform(val => new Date(val)),
    to: z.string().transform(val => new Date(val))
  })
}))
```

**How to Debug:**
```bash
# Test procedure directly with curl
curl -X POST https://your-edge-function.supabase.co/trpc/getPLMetrics \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "your-uuid",
    "dateRange": {
      "from": "2025-10-02T00:00:00Z",
      "to": "2025-12-31T23:59:59Z"
    }
  }'

# If this fails → Schema expects wrong type
# If this succeeds → Client sending wrong format
```

#### 3.2 UUID Validation

```typescript
// Ensure UUIDs are valid format
.input(z.object({
  projectId: z.string().uuid()  // Validates UUID format
}))

// Test with real UUID from database
```

#### 3.3 Required vs Optional Fields

```typescript
// Check if fields are correctly marked optional
.input(z.object({
  projectId: z.string().uuid(),           // Required
  filters: z.object({                     // Optional object
    costLine: z.string().optional(),
    spendType: z.string().optional()
  }).optional()
}))
```

---

### Step 4: Server-Side Issues (Network = 5xx errors)

**Symptom:** Edge function returns 500 Internal Server Error

**Common Causes:**

#### 4.1 SQL Syntax Errors

```typescript
// ❌ WRONG - Mixing SQL syntax styles
.where(sql`${poMappings.costBreakdownId} = ANY(${costBreakdownIds})`)

// ✅ CORRECT - Use Drizzle helpers
import { eq, inArray, and, or } from 'drizzle-orm'

.where(inArray(poMappings.costBreakdownId, costBreakdownIds))
```

**Drizzle Query Patterns:**

```typescript
// Single condition
.where(eq(table.column, value))

// Multiple values
.where(inArray(table.column, [val1, val2, val3]))

// Multiple conditions (AND)
.where(and(
  eq(table.col1, value1),
  gt(table.col2, value2)
))

// Multiple conditions (OR)
.where(or(
  eq(table.col1, value1),
  eq(table.col1, value2)
))

// Date range
.where(between(table.date, fromDate, toDate))

// Joins
.leftJoin(tableB, eq(tableA.id, tableB.foreignKey))
```

**How to Debug:**
1. Copy the SQL logic you're trying to implement
2. Test in Supabase SQL Editor first
3. Verify data exists and query returns results
4. Then translate to Drizzle syntax
5. Reference existing working procedures (e.g., `getKPIMetrics`)

#### 4.2 Database Connection Issues

```typescript
// Verify database client is imported correctly
import { db } from '@/db/client'

// Not: import { db } from 'drizzle-orm' (wrong import)
```

#### 4.3 Missing Table Imports

```typescript
// Ensure all tables are imported
import { costBreakdown, poMappings, poLineItems } from '@/db/schema'

// Check: Are these the correct table names?
// Verify in: packages/db/src/schema/index.ts
```

---

### Step 5: Using Supabase CLI for Database Verification

**When to Use:** 
- Verify database has expected data
- Test SQL queries before translating to Drizzle
- Compare query results between old and new implementations

**How to Use:**

```bash
# 1. Connect to database
supabase db connect

# 2. Run query to verify data exists
SELECT * FROM cost_breakdown 
WHERE project_id = 'your-uuid' 
LIMIT 10;

# 3. Test aggregations
SELECT 
  SUM(budget_cost) as total_budget,
  COUNT(*) as line_count
FROM cost_breakdown
WHERE project_id = 'your-uuid';

# 4. Test joins (verify relationships work)
SELECT 
  cb.cost_line,
  pm.mapped_amount,
  pli.quantity * pli.unit_price as line_value
FROM cost_breakdown cb
LEFT JOIN po_mappings pm ON pm.cost_breakdown_id = cb.id
LEFT JOIN po_line_items pli ON pli.id = pm.po_line_item_id
WHERE cb.project_id = 'your-uuid';

# 5. Compare results with what your procedure returns
```

**Example Debugging Flow:**

```bash
# Old component shows: totalBudget = $1,750,000
# New Cell shows: totalBudget = $1,500,000
# WHY THE DIFFERENCE?

# Use Supabase CLI:
supabase db connect

# Query the source of truth:
SELECT SUM(budget_cost) FROM cost_breakdown 
WHERE project_id = '94d1eaad-4ada-4fb6-b872-212b6cd6007a';

# Result: 1750000
# → New Cell is wrong, debug the Drizzle query

# Check the Drizzle query:
const result = await db
  .select({ total: sum(costBreakdown.budgetCost) })
  .from(costBreakdown)
  .where(eq(costBreakdown.projectId, input.projectId))

# Convert to decimal properly:
const budgetTotal = Number(result[0]?.total || 0)
```

---

### Step 6: Performance Debugging

**Symptom:** Cell loads slowly, poor performance

**Check 1: tRPC Batching**

```yaml
Open Network tab:
- [ ] How many POST requests to /trpc/?
      1 request = Batching working ✅
      3+ requests = Batching NOT working ❌
```

**If batching not working:**

```typescript
// Ensure queries are called in same component render
function MyCell() {
  // ✅ GOOD - All called together, batched automatically
  const metrics = trpc.getPLMetrics.useQuery(input1)
  const timeline = trpc.getPLTimeline.useQuery(input2)
  const dates = trpc.getPromiseDates.useQuery(input3)
  
  // All three will be combined into single HTTP request
}
```

**Check 2: Excessive Re-renders**

```yaml
Open React DevTools → Profiler:
- [ ] Start profiling
- [ ] Trigger component render
- [ ] Stop profiling
- [ ] Check: How many times did component render?
      1-2 renders = Good ✅
      10+ renders = Problem ❌
```

**If excessive re-renders:**

```typescript
// Likely causes:
1. Unmemoized query inputs (see Step 2)
2. Inline functions in JSX
3. Missing React.memo on sub-components

// Fix with React.memo:
const ExpensiveSubComponent = React.memo(function SubComponent(props) {
  return <div>{props.data.map(...)}</div>
})
```

**Check 3: Query Response Time**

```yaml
Open Network tab:
- [ ] Click on tRPC request
- [ ] Check "Timing" tab
- [ ] Look at "Waiting (TTFB)" time
      < 200ms = Excellent ✅
      200-500ms = Good ✅
      500-1000ms = Acceptable ⚠️
      > 1000ms = Needs optimization ❌
```

---

### Step 7: Testing Procedures Before Client Implementation

**ALWAYS test tRPC procedures via curl BEFORE writing client code**

```bash
# 1. Deploy edge function
supabase functions deploy trpc

# 2. Test procedure with curl
curl -X POST https://your-project.supabase.co/functions/v1/trpc \
  -H "Content-Type: application/json" \
  -d '{
    "0": {
      "json": {
        "projectId": "94d1eaad-4ada-4fb6-b872-212b6cd6007a",
        "dateRange": {
          "from": "2025-01-01T00:00:00Z",
          "to": "2025-12-31T23:59:59Z"
        }
      }
    }
  }'

# 3. Verify response
# Should see: {"result":{"data":{"json":{...your data...}}}}

# 4. Test error cases
# Invalid UUID:
curl -X POST ... -d '{"0":{"json":{"projectId":"invalid-uuid"}}}'
# Should see: 400 Bad Request with Zod error

# Missing required field:
curl -X POST ... -d '{"0":{"json":{}}}'
# Should see: 400 Bad Request

# 5. Only THEN write client code
```

---

## Common Patterns & Solutions

### Pattern 1: Memoizing Date Ranges

```typescript
// Use this pattern for all date-based queries
const dateRange = useMemo(() => {
  const now = new Date()
  
  const from = new Date(now)
  from.setMonth(from.getMonth() - 6)
  from.setHours(0, 0, 0, 0)  // Normalize to midnight
  
  const to = new Date(now)
  to.setMonth(to.getMonth() + 6)
  to.setHours(23, 59, 59, 999)  // Normalize to end of day
  
  return { from, to }
}, [])  // Empty deps = computed once

const { data } = trpc.getPLTimeline.useQuery({
  projectId,
  dateRange
})
```

### Pattern 2: Conditional Queries

```typescript
// Only run query when condition met
const { data } = trpc.getPLMetrics.useQuery(
  { projectId },
  {
    enabled: !!projectId,  // Only run if projectId exists
  }
)
```

### Pattern 3: Dependent Queries

```typescript
// Run second query only after first succeeds
const { data: metrics } = trpc.getPLMetrics.useQuery({ projectId })

const { data: timeline } = trpc.getPLTimeline.useQuery(
  { projectId, dateRange },
  {
    enabled: !!metrics,  // Only run after metrics loaded
  }
)
```

### Pattern 4: Error Handling

```typescript
const { data, error, isLoading } = trpc.getPLMetrics.useQuery({ projectId })

if (isLoading) return <Skeleton />

if (error) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Error Loading Metrics</AlertTitle>
      <AlertDescription>
        {error.message}
      </AlertDescription>
    </Alert>
  )
}

// data is guaranteed to exist here
return <div>{data.totalBudget}</div>
```

---

## Reference: Working Examples

**Simple Cell (1 query):**
- File: `apps/web/components/cells/kpi-card/component.tsx`
- Demonstrates: Single query, memoization, loading/error states

**Complex Cell (3 queries):**
- File: `apps/web/components/cells/pl-command-center/component.tsx`
- Demonstrates: Multiple queries, tRPC batching, complex calculations

**tRPC Procedures:**
- File: `supabase/functions/trpc/index.ts`
- Demonstrates: Procedure structure, Zod validation, Drizzle queries

---

## Escalation Checklist

**After 30 minutes of debugging without progress:**

```yaml
- [ ] Document symptoms clearly
- [ ] Document steps already taken
- [ ] Document current hypothesis
- [ ] Check: Did you test procedure via curl?
- [ ] Check: Did you verify database has data?
- [ ] Check: Did you verify query inputs are memoized?
- [ ] Check: Did you check Network AND Console tabs?
- [ ] Generate failure report with all above info
- [ ] Start new session with clean context
- [ ] Maximum 3 attempts before escalating to human
```

---

## Quick Copy-Paste Solutions

### Fix Infinite Render Loop

```typescript
// Before (WRONG):
const { data } = trpc.useQuery({ dateRange: { from: new Date(), to: new Date() } })

// After (CORRECT):
const dateRange = useMemo(() => ({ from: new Date(), to: new Date() }), [])
const { data } = trpc.useQuery({ dateRange })
```

### Fix Date Serialization

```typescript
// In tRPC procedure schema (WRONG):
dateRange: z.object({ from: z.date(), to: z.date() })

// In tRPC procedure schema (CORRECT):
dateRange: z.object({
  from: z.string().transform(v => new Date(v)),
  to: z.string().transform(v => new Date(v))
})
```

### Fix SQL Syntax

```typescript
// Wrong:
.where(sql`${table.column} = ANY(${array})`)

// Correct:
import { inArray } from 'drizzle-orm'
.where(inArray(table.column, array))
```

---

**Keep this guide open while debugging tRPC issues.**

**When in doubt: Network tab first, then Console, then Supabase CLI.**
