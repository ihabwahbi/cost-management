# AI Native Codebase Architecture - Living Blueprint

## 1. Introduction

This document outlines the **Agent-Navigable Dataflow Architecture (ANDA)**, also known as the **Living Blueprint Architecture**, a framework designed from the ground up to enable reliable, scalable, and iterative development of complex web applications using AI agents.

### 1.1. Purpose of the ANDA Framework

The primary purpose of ANDA is to provide an architectural blueprint that is fundamentally optimized for the cognitive model of an AI developer, rather than a human one. It addresses the unique strengths and weaknesses of AI agents—such as their perfect recall within a limited context but poor navigational and implicit reasoning skills.

Instead of merely structuring code, ANDA structures the **entire development workflow**. It achieves this by creating a system where every component, data flow, and historical change is made explicit, traceable, and verifiable.

**Ultimate Goal:** Complete codebase refactor where every component becomes a Cell with manifest, every API call goes through tRPC, and the codebase maintains absolute leanness - optimized specifically for AI agent development.

### 1.2. Core Problems Addressed

ANDA was designed specifically to solve the critical failure modes that emerge when traditional software architectures are used in agentic development workflows:

* **Component Drift & Code Obsolescence**: The tendency for agents to create new, duplicative components instead of refactoring existing ones, leading to a confusing and polluted codebase that misleads future agents.
* **Data-to-UI Desynchronization**: The extreme difficulty agents face in correctly and reliably reflecting backend database or API changes in the frontend UI, often resulting in bugs and incorrect data displays.
* **Implicit Requirement Regression**: The high risk of agents breaking crucial but unstated features during refactoring tasks, as they can only operate on explicit instructions and lack the "common sense" to preserve implicit functionality.
* **Context Degradation**: The rapid decline in agent performance and increase in error rates when attempting to fix bugs through long, conversational feedback loops within a single, ever-growing context window.

### 1.3. The Guiding Principles

The ANDA framework is built on four core principles:

1. **Radical Granularity & Atomicity**: Decompose all application functionality into the smallest possible, self-contained, and independently workable units ("Cells" and "Data Contracts"). Most components should fit comfortably within an AI agent context window (~4000 tokens or ~400 lines as a guideline).

2. **Explicitness over Implicitness**: Eradicate all "tribal knowledge." Every component's purpose, API, state, dependencies, and behavioral requirements must be explicitly defined in machine-readable manifests. If it isn't written down, it doesn't exist.

3. **Traceability & Historicity**: The entire evolution of the application—from the initial human prompt to the specific code changes—must be captured in an immutable, queryable "Architectural Ledger." This provides agents with the long-term memory and historical context they lack.

4. **Automated Verification**: Shift quality control as far left as possible. Every "Cell" must contain its own automated "Micro-Pipeline" for testing and validation, ensuring that changes are verified at the component level before they are ever integrated.

## 2. Technology Stack & Implementation

### 2.1. Core Technology Choices

The Living Blueprint Architecture leverages a modern, type-safe technology stack optimized for AI agent development:

```
PostgreSQL (Supabase)
    ↓
Drizzle ORM (Schema Definition)
    ↓
tRPC Backend (Supabase Edge Functions)
    ↓
tRPC Client (Type-Safe Queries)
    ↓
React Components (Guaranteed Types)
```

**Key Technologies:**
- **Database**: PostgreSQL via Supabase
- **ORM**: Drizzle ORM for type-safe schema definition
- **API Layer**: tRPC for end-to-end type safety
- **Runtime**: Supabase Edge Functions
- **Frontend**: React with TanStack Query
- **Monorepo**: Turborepo for package management
- **UI Components**: shadcn/ui for consistent design
- **State Management**: Zustand for local state

### 2.2. Monorepo Structure

```
project-root/
│
├── apps/
│   └── web/                          # Next.js 14 app
│       ├── app/
│       └── components/
│           ├── cells/                 # Smart Component Cells
│           └── ui/                    # shadcn/ui components
│
├── packages/
│   ├── api/                           # tRPC Backend
│   │   └── src/
│   │       ├── routers/
│   │       └── procedures/
│   │
│   ├── db/                            # Drizzle ORM + Schema
│   │   └── src/
│   │       ├── schema/
│   │       └── migrations/
│   │
│   └── types/                         # Shared TypeScript types
│
├── tools/
│   ├── ledger-query/                  # Ledger query utilities
│   └── cell-validator/                # Manifest + pipeline validation
│
├── ledger.jsonl                       # Architectural Ledger
├── package.json                       # Turborepo root
└── turbo.json                         # Turborepo configuration
```

## 3. The Three Pillars of ANDA

### 3.1. Pillar 1: Type-Safe Data Layer

#### Problem Statement
Current architectures often have multiple type-safety gaps:
```typescript
// Common anti-pattern: No type safety between query and UI
const { data } = await supabase.from('cost_breakdown').select('*')
// data is 'any' - UI has no contract with database
```

#### Solution: tRPC + Drizzle Stack

**Database Layer (Drizzle ORM):**
```typescript
// packages/db/src/schema/cost-breakdown.ts
import { pgTable, uuid, decimal, timestamp, text } from 'drizzle-orm/pg-core'

export const costBreakdown = pgTable('cost_breakdown', {
  id: uuid('id').primaryKey(),
  projectId: uuid('project_id').notNull(),
  subBusinessLine: text('sub_business_line').notNull(),
  costLine: text('cost_line').notNull(),
  spendType: text('spend_type').notNull(),
  budgetCost: decimal('budget_cost', { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Drizzle generates exact TypeScript types from schema
export type CostBreakdown = typeof costBreakdown.$inferSelect
export type NewCostBreakdown = typeof costBreakdown.$inferInsert
```

**API Layer (tRPC Backend):**
```typescript
// packages/api/src/routers/budget.ts
import { z } from 'zod'
import { publicProcedure, router } from '../trpc'
import { db } from '@/db'
import { costBreakdown } from '@/db/schema'

export const budgetRouter = router({
  getWaterfallData: publicProcedure
    .input(z.object({
      projectId: z.string().uuid(),
      dateRange: z.object({
        // CRITICAL: Use string transform for dates over HTTP
        from: z.string().transform((val) => new Date(val)),
        to: z.string().transform((val) => new Date(val)),
      })
    }))
    .query(async ({ input }) => {
      // Drizzle query - fully typed
      const data = await db
        .select()
        .from(costBreakdown)
        .where(eq(costBreakdown.projectId, input.projectId))
      
      // Return type is inferred from schema
      return {
        items: data.map(item => ({
          category: item.spendType,
          budgeted: Number(item.budgetCost),
          actual: 0, // Would come from PO mappings
          variance: 0
        }))
      }
    })
})
```

**Frontend Integration:**
```typescript
// components/cells/budget-waterfall/component.tsx
import { trpc } from '@/lib/trpc'
import { useMemo } from 'react'

export function BudgetWaterfall({ projectId }: { projectId: string }) {
  // CRITICAL: Memoize query inputs to prevent infinite loops
  const dateRange = useMemo(() => {
    const now = new Date()
    const from = new Date(now)
    from.setMonth(from.getMonth() - 6)
    from.setHours(0, 0, 0, 0)
    
    const to = new Date(now)
    to.setMonth(to.getMonth() + 6)
    to.setHours(23, 59, 59, 999)
    
    return { from, to }
  }, [])

  // Fully typed with IDE autocomplete
  const { data, isLoading } = trpc.budget.getWaterfallData.useQuery({
    projectId,
    dateRange
  })

  return <WaterfallChart items={data?.items ?? []} />
}
```

### 3.2. Pillar 2: Smart Component Cells

#### The Cell: Atomic Unit of Functionality

A **Cell** is a self-contained directory that encapsulates every aspect of a single piece of functionality—not just the UI component, but also its state, data dependencies, tests, and its "user manual" (the manifest).

**Standard Cell Structure:**
```
/components/cells/{cell-name}/
│
├── component.tsx          # React component (presentation logic only)
├── state.ts               # Local state management (Zustand)
├── manifest.json          # Machine-readable API and requirements
└── pipeline.yaml          # Automated quality gates
```

**The Manifest (The Cell's Contract):**
```json
{
  "id": "budget-waterfall",
  "version": "1.0.0",
  "description": "Waterfall chart showing budget variance by category",
  
  "dataContract": {
    "source": "trpc.budget.getWaterfallData",
    "inputSchema": {
      "projectId": "string (uuid)",
      "dateRange": { "from": "Date", "to": "Date" }
    },
    "outputSchema": {
      "items": "Array<{ category: string, budgeted: number, actual: number, variance: number }>"
    }
  },
  
  "behavioralAssertions": [
    {
      "id": "BA-001",
      "requirement": "Chart MUST display each budget category as a separate bar",
      "validation": "Visual inspection + snapshot test",
      "criticality": "high"
    },
    {
      "id": "BA-002",
      "requirement": "Positive variance MUST render as green bar (#10b981)",
      "validation": "Unit test: component.getBarColor(variance > 0) === '#10b981'",
      "criticality": "medium"
    },
    {
      "id": "BA-003",
      "requirement": "Tooltip MUST show: Category Name, Budgeted Amount, Variance %",
      "validation": "E2E test: hover on bar, verify tooltip content",
      "criticality": "high"
    }
  ],
  
  "dependencies": {
    "ui": ["@/components/ui/chart", "@/components/ui/tooltip"],
    "state": ["./state"],
    "api": ["trpc.budget.getWaterfallData"]
  },
  
  "accessibility": {
    "wcag": "AA",
    "requirements": [
      "Chart MUST have aria-label describing purpose",
      "Each bar MUST be keyboard navigable"
    ]
  },
  
  "metadata": {
    "createdBy": "iter_20251001_140000_addWaterfallPlot",
    "createdAt": "2025-10-01T14:00:00Z",
    "lastModified": "2025-10-01T14:00:00Z"
  }
}
```

**The Pipeline (Quality Gates):**
```yaml
# components/cells/budget-waterfall/pipeline.yaml
version: 1.0

on_change:
  - name: Type Check
    run: "tsc --noEmit"
    required: true
    
  - name: Lint
    run: "eslint component.tsx state.ts"
    required: true
    
  - name: Unit Tests
    run: "vitest run --coverage"
    coverage_threshold: 80
    required: true
    
  - name: Behavioral Assertions Validation
    run: "node scripts/validate-assertions.js ./manifest.json"
    required: true
    
  - name: Accessibility Audit
    run: "axe-core ./component.tsx"
    required: true

success_criteria:
  - "All required gates pass"
  - "Coverage >= 80%"
  - "All behavioral assertions have tests"
  - "Zero accessibility violations"
```

### 3.3. Pillar 3: The Architectural Ledger

#### Purpose
The Ledger acts as the system's long-term memory, providing agents with historical context they inherently lack.

**Ledger Structure (append-only `ledger.jsonl`):**
```jsonl
{"iterationId":"iter_20251001_140000_addWaterfallPlot","timestamp":"2025-10-01T14:00:00Z","humanPrompt":"Create a waterfall plot to show budget changes","artifacts":{"created":[{"type":"cell","id":"budget-waterfall","path":"components/cells/budget-waterfall"}],"modified":["trpc.budget.getWaterfallData"]},"schemaChanges":[]}

{"iterationId":"iter_20251002_093000_addFiltersToWaterfall","timestamp":"2025-10-02T09:30:00Z","humanPrompt":"Add date range filters to the waterfall plot","artifacts":{"created":[],"modified":[{"type":"cell","id":"budget-waterfall","changes":["Added dateRange prop","Added filter UI"]}]},"schemaChanges":[]}
```

**Ledger Entry Schema:**
```typescript
interface LedgerEntry {
  iterationId: string          // Unique ID: iter_YYYYMMDD_HHMMSS_description
  timestamp: string            // ISO 8601
  humanPrompt: string          // Original user instruction
  
  artifacts: {
    created: Array<{
      type: 'cell' | 'api' | 'schema' | 'package'
      id: string
      path?: string
    }>
    modified: Array<string | { type: string, id: string, changes: string[] }>
    replaced?: Array<{
      type: string
      id: string
      path: string
      deletedAt: string
      reason: string
    }>
  }
  
  schemaChanges: Array<{
    table: string
    operation: 'create' | 'alter' | 'drop'
    migration: string
  }>
  
  metadata?: {
    agent?: string
    duration?: number
    iterationCount?: number
    failureReports?: Array<any>
  }
}
```

## 4. Migration Strategy & Principles

### 4.1. Core Migration Principles

When refactoring existing codebases to the Living Blueprint Architecture:

1. **Complete Replacement**: Each migration creates new Cell and deletes old component
2. **No Parallel Implementations**: Never keep v1/v2 or old/new versions
3. **Story-Commit Cadence**: Each completed migration = one git commit with only new Cell
4. **Immediate Cleanup**: Delete old implementation in same migration
5. **Single Source of Truth**: Codebase contains only ONE implementation per feature
6. **Lean Codebase**: Optimize for AI agent clarity - no dead code, no feature flags
7. **Git-Based Safety**: Can revert entire commit if issues found

**Key Principle:** Maintain absolute leanness through 100% architecture adoption. AI agents work best with single, clean implementations - not parallel versions or conditional logic.

### 4.2. Cell Migration Workflow

```yaml
Phase 1: Implementation
  - Create new Cell structure
  - Write manifest.json with behavioral assertions
  - Write pipeline.yaml with validation gates
  - Implement component with comprehensive tests
  - Run automated pipeline validation
  - All gates must pass

Phase 2: Integration & Testing
  - Update all imports to use new Cell
  - Run all tests (unit + integration + e2e)
  - Verify build succeeds
  - Test manually in browser
  - All functionality must work correctly

Phase 3: Cleanup (Immediately after validation)
  - Delete old component file(s)
  - Verify no references remain: grep -r "old-component-name"
  - Run all tests again to confirm nothing broke
  - Update ledger to document replacement

Phase 4: Commit
  - Commit with message: "Migrate [Component] to Cell architecture"
  - Ledger entry appended
  - Codebase contains ONLY new Cell

Phase 5: Verification
  - Confirm old component deleted
  - Confirm no references to old implementation exist
  - Confirm all tests pass
  - Migration marked complete
```

## 5. Development Pitfalls & Prevention

### 5.1. Pitfall #1: Infinite Render Loops with React Query

**Severity:** CRITICAL - Most time-consuming to debug

**Symptom:**
- Component stuck in perpetual loading state
- Network tab shows successful 200 OK responses
- React Query status shows `pending` forever
- Data never appears in UI

**Root Cause:**
Unmemoized objects/arrays passed to React hooks create new references on every render.

**Example of Bug:**
```typescript
// ❌ WRONG - Creates new Date objects every render
function PLCommandCenter({ projectId }: Props) {
  const { data } = trpc.getPLTimeline.useQuery({
    projectId,
    dateRange: {
      from: new Date(new Date().setMonth(new Date().getMonth() - 6)),
      to: new Date(new Date().setMonth(new Date().getMonth() + 6)),
    },
  })
}
```

**How to Fix:**
```typescript
// ✅ CORRECT - Memoized, stable reference
function PLCommandCenter({ projectId }: Props) {
  const dateRange = useMemo(() => {
    const now = new Date()
    const from = new Date(now)
    from.setMonth(from.getMonth() - 6)
    from.setHours(0, 0, 0, 0) // Normalize time
    
    const to = new Date(now)
    to.setMonth(to.getMonth() + 6)
    to.setHours(23, 59, 59, 999)
    
    return { from, to }
  }, []) // Empty deps = memoized once

  const { data } = trpc.getPLTimeline.useQuery({
    projectId,
    dateRange, // Stable reference
  })
}
```

**Prevention:** ALWAYS memoize complex objects/arrays passed to hooks.

### 5.2. Pitfall #2: Date Serialization Over HTTP

**Severity:** HIGH - Causes 400 Bad Request errors

**Root Cause:**
JavaScript Date objects cannot be sent over HTTP. They serialize to strings, but if Zod schema expects `z.date()`, validation fails.

**Example of Bug:**
```typescript
// ❌ WRONG - Schema expects Date object
.input(z.object({
  dateRange: z.object({
    from: z.date(),  // Expects Date object
    to: z.date(),    // But receives string
  })
}))
```

**How to Fix:**
```typescript
// ✅ CORRECT - Accept strings, transform to Date
.input(z.object({
  dateRange: z.object({
    from: z.string().transform((val) => new Date(val)),
    to: z.string().transform((val) => new Date(val)),
  })
}))
```

**Prevention:** ALWAYS use `z.string().transform()` for dates in tRPC input schemas.

### 5.3. Pitfall #3: SQL Syntax Confusion

**Severity:** MEDIUM - Breaks edge function queries

**Root Cause:**
Mixing mental models between Drizzle ORM and raw SQL syntax.

**Example of Bug:**
```typescript
// ❌ WRONG - Mixing raw SQL with Drizzle
import { sql } from 'drizzle-orm'
const mappings = await db
  .select()
  .from(poMappings)
  .where(sql`${poMappings.costBreakdownId} = ANY(${costBreakdownIds})`)
```

**How to Fix:**
```typescript
// ✅ CORRECT - Use Drizzle's helper functions
import { inArray } from 'drizzle-orm'
const mappings = await db
  .select()
  .from(poMappings)
  .where(inArray(poMappings.costBreakdownId, costBreakdownIds))
```

**Prevention:** Use Drizzle helper functions: `eq`, `inArray`, `and`, `or`, `gt`, `lt`, `between`.

### 5.4. Pitfall #4: Infrastructure Confusion

**Severity:** MEDIUM - Can break existing features

**Symptom:**
- Existing working features suddenly break
- tRPC client can't reach endpoints
- Environment variables pointing to wrong URLs

**Root Cause:**
Not understanding existing infrastructure setup, attempting to recreate what already exists (e.g., creating local API route when Supabase Edge Function already deployed).

**Prevention Strategy:**

**MANDATORY Task 0: Review Existing Patterns**
```yaml
Before ANY implementation:
- [ ] Query ledger for similar Cells
- [ ] Review referenced Cell code
- [ ] Check existing tRPC routers (what procedures exist?)
- [ ] Verify edge function deployment status
- [ ] Confirm environment variables point to correct endpoints
- [ ] DO NOT recreate infrastructure that already exists
```

### 5.5. Debugging Workflow for Async Issues

```yaml
Step 1: Check Network Tab (ALWAYS FIRST)
  - Are requests being sent?
  - What status codes? (200 OK vs 4xx/5xx)
  - What is the request/response payload?

Step 2: Check Console Logs
  - What is React Query status?
  - Are there error messages?
  - Are query inputs changing every render?

Step 3: Isolate Client vs Server
  If Network = 200 OK but UI stuck:
    → Issue is CLIENT-SIDE (React Query, memoization)
  If Network = 4xx/5xx errors:
    → Issue is SERVER-SIDE (edge function, validation)

Step 4: Add Defensive Logging
  - Log query inputs to check for changes
  - Log server procedure calls
  - Log result transformations

Step 5: Generate Failure Report (After 30 min)
  - Document symptoms and steps taken
  - Start new session with clean context
  - Maximum 3 attempts before escalating
```

## 6. Agent Operating Procedures

### 6.1. Standard Agent Workflow

```
1. Query Ledger
   └─> "Where does this feature live?"
   └─> Returns: Cell ID + path

2. Read Manifest
   └─> "What are the requirements?"
   └─> Returns: Data contracts + behavioral assertions

3. Read Pipeline
   └─> "How do I know when I'm done?"
   └─> Returns: Validation gates + success criteria

4. Make Changes
   └─> Modify only the identified Cell
   └─> Update manifest if requirements changed

5. Run Pipeline
   └─> Execute validation gates
   └─> If fails → Generate Failure Report → New Session

6. Update Ledger
   └─> Append entry with changes
   └─> Link to human prompt
```

### 6.2. Ledger Query Operations

```typescript
// Find a Cell by feature description
ledger.findCell("waterfall plot") 
→ { id: "budget-waterfall", path: "components/cells/budget-waterfall" }

// Get history of a Cell
ledger.getHistory("budget-waterfall")
→ [iter_1, iter_2, iter_3...] // All changes to this Cell

// Find dependent Cells
ledger.findDependents("trpc.budget.getWaterfallData")
→ ["budget-waterfall", "budget-summary"]

// Get recent changes
ledger.getRecentChanges({ since: new Date("2025-10-01") })
→ [Latest entries]
```

### 6.3. Pre-Implementation Checklist

```yaml
Before writing ANY code:
- [ ] Query ledger for reference Cells with similar complexity
- [ ] Review reference Cell implementation
- [ ] Identify ALL tRPC procedures needed
- [ ] Test EACH procedure via curl
- [ ] Verify existing infrastructure
- [ ] Read Development Pitfalls section
```

### 6.4. During Implementation Checklist

```yaml
While writing code:
- [ ] Memoize ALL objects/arrays passed to hooks
- [ ] Use z.string().transform() for dates
- [ ] Reference existing procedures for patterns
- [ ] Add defensive logging for query states
- [ ] Test queries independently before integration
- [ ] Keep component manageable (~400 lines max)
```

### 6.5. Validation Checklist

```yaml
Before marking complete:
- [ ] Check Network tab: All requests successful
- [ ] Check Console: Query states correct
- [ ] Compare calculations: 100% parity with old
- [ ] Measure performance: ≤110% of baseline
- [ ] Run all tests: 80%+ coverage
- [ ] Verify cleanup: Old component deleted
```

## 7. Validation & Success Metrics

### 7.1. Architecture Validation

- **Type Safety**
  - Zero `any` types in components
  - All tRPC queries return typed data
  - Drizzle schema matches production database
  - TypeScript compilation has zero errors

- **Cell Quality**
  - All components converted to Cells
  - Every Cell has `manifest.json`
  - Every Cell has `pipeline.yaml`
  - All behavioral assertions have tests
  - All Cells pass pipeline validation

- **Ledger Completeness**
  - All Cells documented in ledger
  - All API procedures documented
  - Ledger query functions work correctly
  - Historical context is preserved

### 7.2. Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **Component Drift Incidents** | 0 per sprint | Track duplicate component events |
| **Type Safety Coverage** | 100% | Count `any` types → should be 0 |
| **Implicit Requirements** | 0% | Behavioral assertions in manifests |
| **Feature Location Time** | < 30 seconds | Time from query to location |
| **Debugging Iteration Count** | < 3 per issue | Average iterations to resolve |
| **Pipeline Validation Coverage** | 100% | Cells with passing pipelines |

## 8. How Agents Should Approach Migration

### 8.1. Discovery Phase

When asked to explore and decide what to migrate next:

1. **Analyze Current State**
   - Use grep/glob to find components without Cell structure
   - Check for direct Supabase usage (anti-pattern)
   - Identify components exceeding 400 lines
   - Find business logic mixed with data access

2. **Prioritize by Impact**
   - High-traffic components (used frequently)
   - Components with type safety issues
   - Features with known bugs or issues
   - Components referenced in multiple places

3. **Assess Complexity**
   - Count lines of code
   - Number of dependencies
   - Data flow complexity
   - State management requirements

### 8.2. Migration Decision Matrix

| Priority | Criteria | Example Components |
|----------|----------|-------------------|
| **HIGH** | • Used on every page<br>• Has type errors<br>• Frequently modified | Navigation, KPI cards, data tables |
| **MEDIUM** | • Feature-specific<br>• Moderate complexity<br>• Some tech debt | Forms, charts, filters |
| **LOW** | • Rarely used<br>• Simple logic<br>• Working fine | Static pages, simple displays |

### 8.3. Autonomous Migration Process

```yaml
Step 1: Query Ledger
  - Check what's already migrated
  - Avoid duplicating work

Step 2: Analyze Component
  - Read current implementation
  - Identify data dependencies
  - List behavioral requirements

Step 3: Create Migration Plan
  - Define new Cell structure
  - Identify needed tRPC procedures
  - Plan test coverage

Step 4: Execute Migration
  - Follow Cell Migration Workflow
  - Ensure complete replacement
  - No parallel implementations

Step 5: Validate & Commit
  - Run all pipelines
  - Delete old code
  - Update ledger
  - Single atomic commit
```

### 8.4. Example: Identifying Next Migration Candidate

```bash
# Step 1: Find components not in Cell structure
find apps/web/components -type f -name "*.tsx" | grep -v "/cells/" | grep -v "/ui/"

# Step 2: Check for direct Supabase usage (anti-pattern)
grep -r "supabase.from" apps/web/components --include="*.tsx"

# Step 3: Find large components (>400 lines)
find apps/web/components -name "*.tsx" -exec wc -l {} + | sort -rn | head -20

# Step 4: Check what's already migrated
cat ledger.jsonl | grep "created.*cell"
```

## 9. End-to-End Example Workflow

This section demonstrates how the ANDA framework components interact to execute a complex development task.

### 9.1. Scenario: Adding a Complex New Feature

**Initial State**: The application has a basic budgeting feature with a single budget table.

**The Goal**: Introduce a sophisticated versioning system for budgets.

**The Human Prompt**: "Add a feature to allow users to create and compare different versions of a project's budget."

### 9.2. Step-by-Step Execution

1. **Planning Agent - Ledger Query**:
   - Query the Architectural Ledger for "budget"
   - Find existing `budget-table` Cell and `get-budget-data` Data Contract
   - Gain perfect historical context

2. **Planning Agent - Strategy Formulation**:
   - Determine necessary steps:
     - Database schema needs changes
     - Old `get-budget-data` contract needs deprecation
     - New `get-budget-versions` Data Contract required
     - New `budget-version-selector` Cell needed
     - Existing `budget-table` Cell needs replacement

3. **Execution - Database & Data Contract**:
   - Create new `get-budget-versions` Data Contract
   - Apply schema changes for `budget_versions` table
   - Create `query.sql`, `schema.ts`, `transformer.ts`

4. **Execution - New UI Cells**:
   - Create `budget-version-selector` Cell
   - Create `budget-version-table` Cell
   - Write manifests and pipelines
   - Run Micro-Pipelines - all tests pass

5. **Execution - Integration**:
   - Modify main dashboard to import new Cells
   - Remove old `budget-table` Cell
   - Update old Cell manifest to `status: "deprecated"`

6. **Failure Recovery (if needed)**:
   - If tests fail → generate `failure-report.json`
   - Halt and start new clean session
   - Create corrected implementation

7. **Commit to Ledger**:
   - Record `humanPrompt`
   - Link to parent iteration
   - List all created/modified artifacts
   - Document schema changes

8. **Automated Cleanup**:
   - Codebase Janitor scans for deprecated Cells
   - Verifies no active dependencies
   - Safely prunes deprecated directories

## 10. The "Codebase Janitor" Agent

### 10.1. Purpose
Automated agent that maintains codebase health by removing deprecated components.

### 10.2. Operation
Runs on schedule (e.g., nightly or weekly CI job):

```yaml
1. Scan for deprecated Cells:
   - Find manifest.json with status: "deprecated"

2. Verify safety:
   - Check no active Cells depend on deprecated Cell
   - Verify deprecation period elapsed

3. Delete:
   - Remove entire deprecated Cell directory
   - Update ledger with deletion entry

4. Validate:
   - Run all tests
   - Ensure no breakage
```

This ensures the DVP (Deprecate-Verify-Prune) lifecycle doesn't lead to code bloat.

## 11. Conclusion

The Living Blueprint Architecture transforms codebases into AI-optimized systems through:

1. **Type-Safe Data Layer** - Eliminates data-UI desynchronization
2. **Smart Component Cells** - Makes requirements explicit and verifiable  
3. **Architectural Ledger** - Provides persistent memory and feature discovery

This architecture enables AI agents to:
- ✅ Instantly locate features via ledger queries
- ✅ Understand requirements by reading manifests
- ✅ Know when work is complete via pipeline validation
- ✅ Avoid common pitfalls through documented patterns
- ✅ Make autonomous migration decisions
- ✅ Maintain codebase leanness (no parallel implementations)

The goal is 100% adoption - every component a Cell, every query through tRPC, every requirement explicit. Agents using this document can autonomously explore codebases, identify migration candidates, and systematically transform them following these patterns.

**Remember:** This is not gradual addition - it is complete replacement. Maintain absolute leanness. No v2 suffixes. No feature flags. Clean, single implementations only.
