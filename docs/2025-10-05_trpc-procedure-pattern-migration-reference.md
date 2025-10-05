# tRPC Procedure Pattern Migration Reference

**Date:** October 5, 2025  
**Purpose:** Reference document for updating LLM agent personas with correct tRPC procedure architecture  
**Status:** Historical reference - Use to brief agents on current pattern

---

## Executive Summary

**What Changed:** Migrated from router segment exports (with spread operators) to direct procedure exports (with direct composition).

**Why:** The direct export pattern is simpler, cleaner, and better aligned with AI-native development principles.

**Impact:** All 17 existing procedures already use the new pattern. Documentation was updated to reflect reality.

**Action Required:** Update agent personas/prompts to implement new pattern for all future procedure creation.

---

## The Two Patterns Explained

### Pattern 1: Router Segment Export (OLD - Documented but Not Used)

**How it worked:**

```typescript
// File: packages/api/src/procedures/dashboard/get-kpi-metrics.procedure.ts
import { z } from 'zod'
import { publicProcedure, router } from '../../trpc'
import { db } from '@/db'
import { costBreakdown } from '@/db/schema'
import { eq } from 'drizzle-orm'

// Export a router segment containing the procedure
export const getKPIMetricsRouter = router({
  getKPIMetrics: publicProcedure
    .input(z.object({
      projectId: z.string().uuid(),
      dateRange: z.object({
        from: z.string().transform(val => new Date(val)),
        to: z.string().transform(val => new Date(val))
      })
    }))
    .query(async ({ input }) => {
      const data = await db
        .select()
        .from(costBreakdown)
        .where(eq(costBreakdown.projectId, input.projectId))
      
      return {
        totalBudget: data.reduce((sum, item) => sum + Number(item.budgetCost), 0),
        itemCount: data.length
      }
    })
})

// File size: ~35 lines
```

**Domain Router Composition (OLD):**

```typescript
// File: packages/api/src/procedures/dashboard/dashboard.router.ts
import { router } from '../../trpc'
import { getKPIMetricsRouter } from './get-kpi-metrics.procedure'
import { getRecentActivityRouter } from './get-recent-activity.procedure'
import { getPLMetricsRouter } from './get-pl-metrics.procedure'

export const dashboardRouter = router({
  ...getKPIMetricsRouter,      // Spread operator needed
  ...getRecentActivityRouter,  // Spread operator needed
  ...getPLMetricsRouter,       // Spread operator needed
})

// File size: ~15 lines
```

**Characteristics:**
- Each procedure wrapped in `router({ procedureName: ... })`
- Export name has "Router" suffix (e.g., `getKPIMetricsRouter`)
- Domain router uses spread operators (`...`) to merge router segments
- Requires importing `router` in every procedure file
- Extra layer of indirection

---

### Pattern 2: Direct Procedure Export (NEW - Current Pattern)

**How it works:**

```typescript
// File: packages/api/src/procedures/dashboard/get-kpi-metrics.procedure.ts
import { z } from 'zod'
import { publicProcedure } from '../../trpc'
import { db } from '@/db'
import { costBreakdown } from '@/db/schema'
import { eq } from 'drizzle-orm'

// Export the procedure directly (no router wrapper)
export const getKPIMetrics = publicProcedure
  .input(z.object({
    projectId: z.string().uuid(),
    dateRange: z.object({
      from: z.string().transform(val => new Date(val)),
      to: z.string().transform(val => new Date(val))
    })
  }))
  .query(async ({ input }) => {
    const data = await db
      .select()
      .from(costBreakdown)
      .where(eq(costBreakdown.projectId, input.projectId))
    
    return {
      totalBudget: data.reduce((sum, item) => sum + Number(item.budgetCost), 0),
      itemCount: data.length
    }
  })

// File size: ~30 lines (5 lines shorter)
```

**Domain Router Composition (NEW):**

```typescript
// File: packages/api/src/procedures/dashboard/dashboard.router.ts
import { router } from '../../trpc'
import { getKPIMetrics } from './get-kpi-metrics.procedure'
import { getRecentActivity } from './get-recent-activity.procedure'
import { getPLMetrics } from './get-pl-metrics.procedure'

export const dashboardRouter = router({
  getKPIMetrics,      // Direct reference (no spread)
  getRecentActivity,  // Direct reference (no spread)
  getPLMetrics,       // Direct reference (no spread)
})

// File size: ~12 lines (3 lines shorter)
```

**Characteristics:**
- Procedure exported directly (no wrapper)
- Export name matches procedure name exactly (no "Router" suffix)
- Domain router uses direct object references (no spread operators)
- Only domain router imports `router` function
- Single layer of abstraction

---

## Comparison Matrix

| Aspect | OLD Pattern (Router Segments) | NEW Pattern (Direct Exports) |
|--------|-------------------------------|------------------------------|
| **Export Pattern** | `export const getKPIMetricsRouter = router({ getKPIMetrics: ... })` | `export const getKPIMetrics = publicProcedure...` |
| **Export Name** | Has "Router" suffix | Matches procedure name exactly |
| **Domain Router** | Uses spread operators (`...`) | Uses direct references |
| **Lines of Code** | ~35 lines per procedure | ~30 lines per procedure |
| **Imports Needed** | `publicProcedure, router` | `publicProcedure` only |
| **Indirection Level** | 2 levels (procedure → router segment → domain router) | 1 level (procedure → domain router) |
| **Explicitness** | Less (wrapper adds layer) | More (direct export) |
| **AI Agent Navigation** | Harder (must unwrap router) | Easier (direct reference) |
| **Functional Result** | Identical tRPC router | Identical tRPC router |

---

## Code Savings Analysis

### Per-Procedure Savings

**OLD Pattern:**
```typescript
// Lines 1-5: Imports (including router)
// Lines 6-30: Procedure implementation
// Lines 31-35: Router wrapper and export

export const getProcedureRouter = router({
  getProcedure: publicProcedure  // <-- Wrapper adds 5 lines
    .input(...)
    .query(...)
})

// Total: ~35 lines
```

**NEW Pattern:**
```typescript
// Lines 1-4: Imports (no router needed)
// Lines 5-30: Procedure implementation

export const getProcedure = publicProcedure  // <-- Direct export
  .input(...)
  .query(...)

// Total: ~30 lines
```

**Savings:** 5-6 lines per procedure × 17 procedures = **85-102 lines saved**

### Per-Domain Router Savings

**OLD Pattern:**
```typescript
import { router } from '../../trpc'
import { getProcedure1Router } from './procedure1'
import { getProcedure2Router } from './procedure2'
import { getProcedure3Router } from './procedure3'

export const domainRouter = router({
  ...getProcedure1Router,   // <-- Spread operator needed
  ...getProcedure2Router,
  ...getProcedure3Router,
})

// Total: ~15 lines for 3 procedures
```

**NEW Pattern:**
```typescript
import { router } from '../../trpc'
import { getProcedure1 } from './procedure1'
import { getProcedure2 } from './procedure2'
import { getProcedure3 } from './procedure3'

export const domainRouter = router({
  getProcedure1,   // <-- Direct reference
  getProcedure2,
  getProcedure3,
})

// Total: ~12 lines for 3 procedures
```

**Savings:** 3 lines per domain router × 3 routers = **9 lines saved**

### Total Project Savings

| Component | Count | Savings/Item | Total Savings |
|-----------|-------|--------------|---------------|
| Procedures | 17 | 6 lines | 102 lines |
| Domain Routers | 3 | 3 lines | 9 lines |
| **TOTAL** | **20** | **-** | **111 lines** |

---

## Why We Migrated

### 1. **Simplicity**

**OLD:** Requires understanding of router wrapping concept
```typescript
// Developer must understand:
// 1. Why wrap in router?
// 2. Why "Router" suffix?
// 3. Why spread operators?
export const getProcedureRouter = router({ getProcedure: ... })
```

**NEW:** Direct and obvious
```typescript
// Developer sees:
// "This is the procedure, exported directly"
export const getProcedure = publicProcedure...
```

### 2. **Explicitness (ANDA Principle)**

From ANDA architecture: *"Explicitness over Implicitness"*

- **OLD:** Export name ≠ procedure name (`getKPIMetricsRouter` exports `getKPIMetrics`)
- **NEW:** Export name = procedure name (`getKPIMetrics` exports `getKPIMetrics`)

### 3. **AI Agent Navigation**

**OLD Pattern - Agent Analysis:**
```
1. Read file: get-kpi-metrics.procedure.ts
2. Find export: getKPIMetricsRouter
3. Unwrap router({ ... })
4. Find actual procedure: getKPIMetrics
5. Trace to domain router
6. Find spread operator: ...getKPIMetricsRouter
7. Understand composition
```

**NEW Pattern - Agent Analysis:**
```
1. Read file: get-kpi-metrics.procedure.ts
2. Find export: getKPIMetrics
3. Trace to domain router
4. Find direct reference: getKPIMetrics
5. Understand composition
```

**Conclusion:** 30% fewer steps for AI agents to trace procedure flow.

### 4. **Cognitive Load Reduction**

**OLD:** Multiple concepts to hold in mind
- Procedure definition
- Router wrapper concept
- Router segment naming convention
- Spread operator merging
- Domain router composition

**NEW:** Fewer concepts
- Procedure definition
- Direct export
- Domain router composition

### 5. **Alignment with tRPC Best Practices**

tRPC's own documentation shows direct procedure exports in most examples. The router segment pattern adds unnecessary abstraction.

---

## Actual Implementation Status

### Discovery Process

1. **Documentation Audit (October 2025):** Found that docs showed router segment pattern
2. **Codebase Audit:** Scanned all 17 existing procedures
3. **Finding:** 100% of procedures use direct export pattern
4. **Conclusion:** Documentation was wrong, code was right

### Current State

**All Domains Use Direct Exports:**

```bash
# Dashboard Domain (10 procedures)
packages/api/src/procedures/dashboard/
├── get-kpi-metrics.procedure.ts        # ✅ Direct export
├── get-pl-metrics.procedure.ts         # ✅ Direct export
├── get-pl-timeline.procedure.ts        # ✅ Direct export
├── get-promise-dates.procedure.ts      # ✅ Direct export
├── get-recent-activity.procedure.ts    # ✅ Direct export
├── get-project-details.procedure.ts    # ✅ Direct export
├── get-dashboard-data.procedure.ts     # ✅ Direct export
├── get-budget-summary.procedure.ts     # ✅ Direct export
├── get-cost-trends.procedure.ts        # ✅ Direct export
├── get-forecast-data.procedure.ts      # ✅ Direct export
└── dashboard.router.ts                 # ✅ Direct composition

# Forecasts Domain (3 procedures)
packages/api/src/procedures/forecasts/
├── create-forecast-version.procedure.ts  # ✅ Direct export
├── get-forecast-versions.procedure.ts    # ✅ Direct export
├── update-forecast-entry.procedure.ts    # ✅ Direct export
└── forecasts.router.ts                   # ✅ Direct composition

# Projects Domain (4 procedures)
packages/api/src/procedures/projects/
├── get-project-list.procedure.ts      # ✅ Direct export
├── get-project-details.procedure.ts   # ✅ Direct export
├── create-project.procedure.ts        # ✅ Direct export
├── update-project.procedure.ts        # ✅ Direct export
└── projects.router.ts                 # ✅ Direct composition
```

**Compliance:** 17/17 procedures (100%) use direct export pattern

---

## Migration Impact on Architecture Mandates

### Alignment with M1-M4 (API Procedure Specialization)

**M1: One Procedure, One File**
- ✅ OLD pattern: Compliant (one procedure per file)
- ✅ NEW pattern: Compliant (one procedure per file)
- **Impact:** No change

**M2: Strict File Size Limits (≤200 lines)**
- ✅ OLD pattern: Compliant but inefficient (extra lines wasted)
- ✅ NEW pattern: Compliant and efficient (fewer lines used)
- **Impact:** Improved compliance margin (+5-6 lines per file)

**M3: No Parallel Implementations**
- ✅ OLD pattern: Compliant (if used consistently)
- ✅ NEW pattern: Compliant (if used consistently)
- **Impact:** No change

**M4: Explicit Naming Conventions**
- ⚠️ OLD pattern: Less explicit (export name ≠ procedure name)
- ✅ NEW pattern: More explicit (export name = procedure name)
- **Impact:** Improved M4 compliance

### Alignment with ANDA Principles

**Radical Granularity & Atomicity**
- NEW pattern supports this better (less wrapper overhead per file)

**Explicitness over Implicitness**
- NEW pattern is MORE explicit (direct exports, no naming mismatch)

**Traceability & Historicity**
- NEW pattern improves traceability (simpler agent navigation)

**Automated Verification**
- NEW pattern easier to validate (simpler AST structure)

---

## Example: Complete Domain Migration

### Before (Router Segment Pattern)

```typescript
// ===== PROCEDURE FILE 1 =====
// packages/api/src/procedures/budget/get-overview.procedure.ts
import { z } from 'zod'
import { publicProcedure, router } from '../../trpc'
import { db } from '@/db'
import { costBreakdown } from '@/db/schema'

export const getBudgetOverviewRouter = router({
  getBudgetOverview: publicProcedure
    .input(z.object({
      projectId: z.string().uuid()
    }))
    .query(async ({ input }) => {
      const data = await db
        .select()
        .from(costBreakdown)
        .where(eq(costBreakdown.projectId, input.projectId))
      
      return { budget: data }
    })
})

// ===== PROCEDURE FILE 2 =====
// packages/api/src/procedures/budget/get-breakdown.procedure.ts
import { z } from 'zod'
import { publicProcedure, router } from '../../trpc'
import { db } from '@/db'
import { costBreakdown } from '@/db/schema'

export const getBudgetBreakdownRouter = router({
  getBudgetBreakdown: publicProcedure
    .input(z.object({
      projectId: z.string().uuid(),
      groupBy: z.enum(['category', 'spendType'])
    }))
    .query(async ({ input }) => {
      // Complex breakdown logic
      return { breakdown: [] }
    })
})

// ===== DOMAIN ROUTER =====
// packages/api/src/procedures/budget/budget.router.ts
import { router } from '../../trpc'
import { getBudgetOverviewRouter } from './get-overview.procedure'
import { getBudgetBreakdownRouter } from './get-breakdown.procedure'

export const budgetRouter = router({
  ...getBudgetOverviewRouter,
  ...getBudgetBreakdownRouter,
})

// ===== MAIN APP ROUTER =====
// packages/api/src/index.ts
import { router } from './trpc'
import { budgetRouter } from './procedures/budget/budget.router'

export const appRouter = router({
  budget: budgetRouter,
})

// Client usage:
// trpc.budget.getBudgetOverview.useQuery({ projectId: '...' })
```

### After (Direct Export Pattern)

```typescript
// ===== PROCEDURE FILE 1 =====
// packages/api/src/procedures/budget/get-overview.procedure.ts
import { z } from 'zod'
import { publicProcedure } from '../../trpc'
import { db } from '@/db'
import { costBreakdown } from '@/db/schema'

export const getBudgetOverview = publicProcedure
  .input(z.object({
    projectId: z.string().uuid()
  }))
  .query(async ({ input }) => {
    const data = await db
      .select()
      .from(costBreakdown)
      .where(eq(costBreakdown.projectId, input.projectId))
    
    return { budget: data }
  })

// ===== PROCEDURE FILE 2 =====
// packages/api/src/procedures/budget/get-breakdown.procedure.ts
import { z } from 'zod'
import { publicProcedure } from '../../trpc'
import { db } from '@/db'
import { costBreakdown } from '@/db/schema'

export const getBudgetBreakdown = publicProcedure
  .input(z.object({
    projectId: z.string().uuid(),
    groupBy: z.enum(['category', 'spendType'])
  }))
  .query(async ({ input }) => {
    // Complex breakdown logic
    return { breakdown: [] }
  })

// ===== DOMAIN ROUTER =====
// packages/api/src/procedures/budget/budget.router.ts
import { router } from '../../trpc'
import { getBudgetOverview } from './get-overview.procedure'
import { getBudgetBreakdown } from './get-breakdown.procedure'

export const budgetRouter = router({
  getBudgetOverview,
  getBudgetBreakdown,
})

// ===== MAIN APP ROUTER =====
// packages/api/src/index.ts
import { router } from './trpc'
import { budgetRouter } from './procedures/budget/budget.router'

export const appRouter = router({
  budget: budgetRouter,
})

// Client usage (IDENTICAL):
// trpc.budget.getBudgetOverview.useQuery({ projectId: '...' })
```

**Key Differences:**
1. Procedure exports: `getBudgetOverview` vs `getBudgetOverviewRouter`
2. No `router` import in procedure files
3. Domain router uses direct refs vs spread operators
4. Client usage: **100% IDENTICAL** (no breaking changes)

---

## Agent Persona Update Guidance

### What to Update in Agent Prompts

#### 1. **Code Generation Agents (e.g., MigrationExecutor, Implementation Agents)**

**OLD Instructions:**
```yaml
When creating tRPC procedures:
  1. Create procedure file: [action]-[entity].procedure.ts
  2. Export router segment: export const [name]Router = router({ [name]: publicProcedure... })
  3. Update domain router with spread operator: ...newProcedureRouter
```

**NEW Instructions:**
```yaml
When creating tRPC procedures:
  1. Create procedure file: [action]-[entity].procedure.ts
  2. Export procedure directly: export const [name] = publicProcedure...
  3. Update domain router with direct reference: [name],
```

#### 2. **Analysis Agents (e.g., CodebaseAnalyzer, PatternAnalyzer)**

**Add to Knowledge Base:**
```yaml
tRPC Procedure Pattern Recognition:
  
  Current Pattern (Correct):
    - Procedure files export procedures directly
    - Export name = procedure name (no "Router" suffix)
    - Domain routers use direct composition
    - Example: export const getProcedure = publicProcedure...
  
  Legacy Pattern (Incorrect - Deprecated):
    - If you see router segment exports, flag as architectural violation
    - Export pattern: export const getProcedureRouter = router({ getProcedure: ... })
    - This pattern should NOT be used
```

#### 3. **Validation Agents (e.g., ArchitectureValidator, ComplianceChecker)**

**Add Validation Rules:**
```yaml
Procedure Export Pattern Validation:
  
  Check 1: Direct Export
    - Scan: grep "export const.*Router = router({" [procedure-file]
    - Expected: No matches
    - If matches found: VIOLATION - Using deprecated router segment pattern
  
  Check 2: Export Name Consistency
    - Procedure file: get-kpi-metrics.procedure.ts
    - Export name should be: getKPIMetrics
    - Export name should NOT be: getKPIMetricsRouter
  
  Check 3: Domain Router Composition
    - Scan: grep "\\.\\.\\." [domain-router-file]
    - Expected: No spread operators
    - If spread found: VIOLATION - Using deprecated spread operator pattern
```

#### 4. **Documentation Agents**

**Pattern to Document:**
```markdown
## tRPC Procedure Architecture

### Procedure File Structure

Each procedure is exported directly:

```typescript
// packages/api/src/procedures/[domain]/[action]-[entity].procedure.ts
import { z } from 'zod'
import { publicProcedure } from '../../trpc'

export const [procedureName] = publicProcedure
  .input(z.object({ ... }))
  .query(async ({ input }) => {
    // Implementation
  })
```

### Domain Router Composition

Domain routers aggregate procedures via direct references:

```typescript
// packages/api/src/procedures/[domain]/[domain].router.ts
import { router } from '../../trpc'
import { procedure1 } from './procedure1.procedure'
import { procedure2 } from './procedure2.procedure'

export const [domain]Router = router({
  procedure1,
  procedure2,
})
```
```

---

## Testing & Verification

### How to Verify Pattern Compliance

#### Automated Checks

```bash
# Check 1: No router segment exports in procedure files
find packages/api/src/procedures -name "*.procedure.ts" \
  -exec grep -l "export const.*Router = router({" {} \;
# Expected output: (empty)
# If files found: Those files violate the pattern

# Check 2: No spread operators in domain routers
find packages/api/src/procedures -name "*.router.ts" \
  -exec grep -l "\.\.\." {} \;
# Expected output: (empty)
# If files found: Those files use deprecated spread pattern

# Check 3: Export name consistency
for file in packages/api/src/procedures/*/*.procedure.ts; do
  filename=$(basename "$file" .procedure.ts)
  camelCase=$(echo "$filename" | sed -r 's/(^|-)([a-z])/\U\2/g')
  grep -q "export const $camelCase = publicProcedure" "$file" || \
    echo "VIOLATION: $file has incorrect export name"
done
# Expected output: (empty)
```

#### Manual Verification

**Procedure File Checklist:**
- [ ] File exports procedure directly (no router wrapper)
- [ ] Export name matches procedure purpose
- [ ] No "Router" suffix in export name
- [ ] Only imports `publicProcedure` (not `router`)
- [ ] File size ≤200 lines

**Domain Router Checklist:**
- [ ] Imports procedures from separate files
- [ ] Uses `router({ ... })` for composition
- [ ] Direct references to procedures (no spread operators)
- [ ] No business logic (aggregation only)
- [ ] File size ≤50 lines

---

## Common Mistakes to Avoid

### ❌ Mistake 1: Mixed Patterns

**WRONG:**
```typescript
// Some procedures use old pattern
export const getProcedureARouter = router({ getProcedureA: ... })

// Some use new pattern
export const getProcedureB = publicProcedure...

// Domain router confused
export const domainRouter = router({
  ...getProcedureARouter,  // Old pattern
  getProcedureB,           // New pattern - INCONSISTENT!
})
```

**Correct:** Use new pattern for ALL procedures consistently.

### ❌ Mistake 2: Wrong Export Name

**WRONG:**
```typescript
// File: get-kpi-metrics.procedure.ts
export const getKPIMetricsRouter = publicProcedure...  // Has "Router" suffix
```

**Correct:**
```typescript
// File: get-kpi-metrics.procedure.ts
export const getKPIMetrics = publicProcedure...  // No "Router" suffix
```

### ❌ Mistake 3: Importing Router in Procedure Files

**WRONG:**
```typescript
import { publicProcedure, router } from '../../trpc'  // Unnecessary router import
```

**Correct:**
```typescript
import { publicProcedure } from '../../trpc'  // Only what's needed
```

### ❌ Mistake 4: Using Spread Operators in Domain Router

**WRONG:**
```typescript
export const domainRouter = router({
  ...getProcedure,  // Spread operator not needed
})
```

**Correct:**
```typescript
export const domainRouter = router({
  getProcedure,  // Direct reference
})
```

---

## Rollout Strategy (For Reference)

This section documents how we completed the migration (already done).

### Phase 1: Discovery ✅ Complete
- Audited all 17 procedures
- Found 100% already using direct export pattern
- Identified documentation mismatch

### Phase 2: Documentation Update ✅ Complete
- Updated ai-native-codebase-architecture.md
- Updated trpc-debugging-guide.md
- Updated cell-development-checklist.md
- Updated 2025-09-26_ai_native_development_architecture.md
- Removed all router segment pattern references

### Phase 3: Agent Persona Updates 🔄 In Progress
- Use this document to brief agents
- Update agent prompts/personas
- Validate agents generate correct pattern

### Phase 4: Continuous Validation 📋 Ongoing
- Monitor new procedures for compliance
- Run automated checks in CI/CD
- Include in code review checklist

---

## Quick Reference Card

### Pattern Summary

| Element | Direct Export Pattern (CURRENT) |
|---------|----------------------------------|
| **Procedure Export** | `export const getProcedure = publicProcedure...` |
| **Export Name** | Matches procedure name exactly |
| **Procedure Imports** | `import { publicProcedure } from '../../trpc'` |
| **Domain Router** | `router({ getProcedure1, getProcedure2 })` |
| **Composition** | Direct references (no spread) |
| **File Size** | Procedures ≤200 lines, Routers ≤50 lines |

### File Naming Convention

```
packages/api/src/procedures/
├── [domain]/
│   ├── [action]-[entity].procedure.ts    # get-kpi-metrics.procedure.ts
│   ├── [action]-[entity].procedure.ts    # create-forecast.procedure.ts
│   ├── [action]-[entity].procedure.ts    # update-project.procedure.ts
│   └── [domain].router.ts                # dashboard.router.ts
```

### Action Verbs

- `get-*` for queries
- `create-*` for insertions
- `update-*` for modifications
- `delete-*` for deletions
- `list-*` for multiple records

---

## Briefing LLMs in Other Sessions

### Recommended Briefing Script

```markdown
## tRPC Procedure Architecture Update

Our codebase uses a specific pattern for tRPC procedures:

**Pattern: Direct Procedure Exports**

1. Procedure files export procedures directly:
   ```typescript
   export const getProcedure = publicProcedure.input(...).query(...)
   ```

2. Domain routers compose via direct references:
   ```typescript
   export const domainRouter = router({ getProcedure1, getProcedure2 })
   ```

**DO NOT use:**
- Router segment exports: `export const getProcedureRouter = router({ ... })`
- Spread operators in domain routers: `...getProcedureRouter`
- "Router" suffix in export names

**Key Files:**
- Procedure pattern: See packages/api/src/procedures/dashboard/get-kpi-metrics.procedure.ts
- Router pattern: See packages/api/src/procedures/dashboard/dashboard.router.ts
- Full reference: docs/2025-10-05_trpc-procedure-pattern-migration-reference.md

All 17 existing procedures use this pattern. All new procedures MUST follow this pattern.
```

---

## FAQ

### Q: Why did documentation show router segment pattern if code used direct exports?

**A:** Early documentation was written based on one possible tRPC pattern. During implementation, the team chose the simpler direct export pattern. Documentation lagged behind code reality.

### Q: Do we need to refactor existing procedures?

**A:** No. All 17 existing procedures already use the direct export pattern. This was a documentation fix, not a code refactor.

### Q: Is the router segment pattern wrong?

**A:** No, it's functionally valid. It's just more complex than necessary. Direct exports achieve the same result with less code.

### Q: Will this break existing client code?

**A:** No. The client API is identical regardless of pattern used. `trpc.domain.procedure.useQuery()` works the same way.

### Q: Can I mix patterns in one codebase?

**A:** Technically yes, functionally no problem. But architecturally, mixing patterns violates the "Explicitness" principle and confuses agents. Use one pattern consistently.

### Q: What if an agent generates the old pattern?

**A:** Correct it immediately. Update the agent's persona with this reference document. Add validation rules to catch this in PR reviews.

---

## Appendix: Complete Working Examples

### Example 1: Simple Query Procedure

```typescript
// packages/api/src/procedures/projects/get-project-list.procedure.ts
import { z } from 'zod'
import { publicProcedure } from '../../trpc'
import { db } from '@cost-mgmt/db'
import { projects } from '@cost-mgmt/db/schema'

export const getProjectList = publicProcedure
  .input(z.object({
    status: z.enum(['active', 'archived', 'all']).optional(),
  }))
  .query(async ({ input }) => {
    let query = db.select().from(projects)
    
    if (input.status && input.status !== 'all') {
      query = query.where(eq(projects.status, input.status))
    }
    
    return await query.orderBy(projects.name)
  })
```

### Example 2: Mutation Procedure

```typescript
// packages/api/src/procedures/forecasts/create-forecast-version.procedure.ts
import { z } from 'zod'
import { publicProcedure } from '../../trpc'
import { db } from '@cost-mgmt/db'
import { forecastVersions } from '@cost-mgmt/db/schema'
import { TRPCError } from '@trpc/server'

export const createForecastVersion = publicProcedure
  .input(z.object({
    projectId: z.string().uuid(),
    versionName: z.string().min(1).max(100),
    reason: z.string().min(1),
  }))
  .mutation(async ({ input }) => {
    try {
      const [newVersion] = await db
        .insert(forecastVersions)
        .values({
          projectId: input.projectId,
          versionName: input.versionName,
          reason: input.reason,
          createdAt: new Date(),
        })
        .returning()
      
      return newVersion
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create forecast version',
        cause: error,
      })
    }
  })
```

### Example 3: Complex Query with Joins

```typescript
// packages/api/src/procedures/dashboard/get-pl-metrics.procedure.ts
import { z } from 'zod'
import { publicProcedure } from '../../trpc'
import { db } from '@cost-mgmt/db'
import { costBreakdown, poMappings, poLineItems } from '@cost-mgmt/db/schema'
import { eq, and, between, sum } from 'drizzle-orm'

export const getPLMetrics = publicProcedure
  .input(z.object({
    projectId: z.string().uuid(),
    dateRange: z.object({
      from: z.string().transform(val => new Date(val)),
      to: z.string().transform(val => new Date(val)),
    }),
  }))
  .query(async ({ input }) => {
    // Budget total
    const budgetResult = await db
      .select({ total: sum(costBreakdown.budgetCost) })
      .from(costBreakdown)
      .where(eq(costBreakdown.projectId, input.projectId))
    
    // Actual cost via PO mappings
    const actualResult = await db
      .select({ total: sum(poLineItems.totalCost) })
      .from(poMappings)
      .leftJoin(costBreakdown, eq(poMappings.costBreakdownId, costBreakdown.id))
      .leftJoin(poLineItems, eq(poMappings.poLineItemId, poLineItems.id))
      .where(
        and(
          eq(costBreakdown.projectId, input.projectId),
          between(poLineItems.deliveryDate, input.dateRange.from, input.dateRange.to)
        )
      )
    
    const budget = Number(budgetResult[0]?.total || 0)
    const actual = Number(actualResult[0]?.total || 0)
    
    return {
      totalBudget: budget,
      totalActual: actual,
      variance: budget - actual,
      variancePercent: budget > 0 ? ((budget - actual) / budget) * 100 : 0,
    }
  })
```

### Example 4: Complete Domain Router

```typescript
// packages/api/src/procedures/dashboard/dashboard.router.ts
import { router } from '../../trpc'
import { getKPIMetrics } from './get-kpi-metrics.procedure'
import { getPLMetrics } from './get-pl-metrics.procedure'
import { getPLTimeline } from './get-pl-timeline.procedure'
import { getPromiseDates } from './get-promise-dates.procedure'
import { getRecentActivity } from './get-recent-activity.procedure'
import { getProjectDetails } from './get-project-details.procedure'
import { getDashboardData } from './get-dashboard-data.procedure'
import { getBudgetSummary } from './get-budget-summary.procedure'
import { getCostTrends } from './get-cost-trends.procedure'
import { getForecastData } from './get-forecast-data.procedure'

export const dashboardRouter = router({
  getKPIMetrics,
  getPLMetrics,
  getPLTimeline,
  getPromiseDates,
  getRecentActivity,
  getProjectDetails,
  getDashboardData,
  getBudgetSummary,
  getCostTrends,
  getForecastData,
})

// File size: 25 lines (well under 50-line limit)
```

---

## Document Metadata

- **Created:** October 5, 2025
- **Author:** System Architect (Aster)
- **Purpose:** LLM briefing reference for tRPC procedure pattern
- **Status:** Active reference document
- **Audience:** AI agents, developers, technical leads
- **Maintenance:** Update if pattern evolves further

---

## Related Documentation

- **Current Architecture:** `docs/ai-native-codebase-architecture.md`
- **Debugging Guide:** `docs/trpc-debugging-guide.md`
- **Development Checklist:** `docs/cell-development-checklist.md`
- **Migration Workflow:** `docs/2025-09-26_ai_native_development_architecture.md`

---

**END OF REFERENCE DOCUMENT**
