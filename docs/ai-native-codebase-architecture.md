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
│   │       ├── procedures/              # Specialized, granular tRPC procedures
│   │       │   └── dashboard/
│   │       │       ├── get-main-metrics.procedure.ts
│   │       │       └── dashboard.router.ts
│   │       │
│   │       ├── index.ts                 # Main appRouter composition
│   │       └── trpc.ts                  # Core tRPC setup
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

**API Layer (Specialized tRPC Procedure):**
```typescript
// packages/api/src/procedures/budget/get-waterfall-data.procedure.ts
import { z } from 'zod'
import { publicProcedure, router } from '../trpc'
import { db } from '@/db'
import { costBreakdown } from '@/db/schema'
import { eq } from 'drizzle-orm';

// Each procedure is in its own file and exports a router segment.
export const getWaterfallDataRouter = router({
  getWaterfallData: publicProcedure
    .input(z.object({
      projectId: z.string().uuid(),
      dateRange: z.object({
        from: z.string().transform((val) => new Date(val)),
        to: z.string().transform((val) => new Date(val)),
      })
    }))
    .query(async ({ input }) => {
      const data = await db
        .select()
        .from(costBreakdown)
        .where(eq(costBreakdown.projectId, input.projectId))
      
      return {
        items: data.map(item => ({
          category: item.spendType,
          budgeted: Number(item.budgetCost),
          actual: 0, // Placeholder
          variance: 0
        }))
      }
    })
})

// These segments are then composed in a domain router, e.g., budget.router.ts
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

#### What Qualifies as a Cell?

**Definition:** Any component that represents discrete functionality with behavioral requirements.

**Cells Include:**
- Data-bound components (dashboards, charts, tables)
- User interaction flows (wizards, multi-step forms)
- Business logic components (calculators, validators)
- Feature modules (authentication, search, filtering)
- Complex modals with internal state and logic
- Any component with testable behavioral assertions

**NOT Cells (use components/ui/):**
- Pure UI primitives (buttons, inputs, badges)
- Layout components (containers, grids)
- Generic wrappers without business logic
- shadcn/ui components

**Decision Tree:**
```
Does this component perform a user-facing operation with business logic?
  ↓ YES → Is it testable with behavioral requirements?
            ↓ YES → Create as Cell
            ↓ NO → Re-evaluate (likely should be Cell)
  ↓ NO → Is it a pure UI component (button, input, layout)?
           ↓ YES → Use components/ui/
           ↓ NO → Review requirements (probably Cell)
```

**Common Misclassifications:**

| Component Type | Often Mislabeled As | Correct Classification | Rationale |
|----------------|---------------------|------------------------|-----------|
| Multi-step wizard | "Just a modal" | Cell | Has state, logic, and validation flow |
| Data entry form | "Shared component" | Cell | Business rules and data transformation |
| Feature dashboard | "Page component" | Cell | Data aggregation and display logic |
| Interactive chart | "UI component" | Cell | Data processing and user interactions |

**File Size Requirements:**
- Individual component files: ≤400 lines
- If functionality exceeds 400 lines, extract into multiple files within Cell directory
- Cell directory structure supports unlimited complexity through decomposition
- Complexity is the REASON for structure, not an exemption from it

**Standard Cell Structure:**
```
/components/cells/{cell-name}/
│
├── component.tsx          # Main orchestrator (≤400 lines)
├── components/            # Sub-components if needed
│   ├── sub-component-a.tsx
│   └── sub-component-b.tsx
├── hooks/                 # Custom hooks
│   └── use-feature-logic.ts
├── utils/                 # Pure functions
│   └── calculations.ts
├── state.ts               # Local state management (Zustand)
├── manifest.json          # Machine-readable API and requirements
├── pipeline.yaml          # Automated quality gates
└── __tests__/             # Test files
    └── component.test.tsx
```

**Example: Complex Wizard Cell**

A 1,000-line wizard component MUST be extracted into Cell structure:

```
Before (Violation):
components/
└── forecast-wizard.tsx    # ❌ 1,005 lines - god component

After (Compliant):
components/cells/forecast-wizard/
├── component.tsx                 # ✅ 180 lines - orchestrator
├── steps/                        # Step components
│   ├── review-step.tsx          # ✅ 120 lines
│   ├── modify-step.tsx          # ✅ 150 lines
│   ├── reason-step.tsx          # ✅ 60 lines
│   ├── preview-step.tsx         # ✅ 220 lines
│   └── confirm-step.tsx         # ✅ 60 lines
├── components/                   # Sub-components
│   ├── entry-form.tsx           # ✅ 115 lines
│   ├── editable-table.tsx       # ✅ 150 lines
│   └── progress-bar.tsx         # ✅ 50 lines
├── hooks/                        # Custom hooks
│   ├── use-wizard-navigation.ts # ✅ 50 lines
│   ├── use-calculations.ts      # ✅ 60 lines
│   └── use-draft-persistence.ts # ✅ 80 lines
├── utils/                        # Pure functions
│   ├── calculations.ts          # ✅ 40 lines
│   └── validation.ts            # ✅ 50 lines
├── types.ts                      # ✅ 30 lines
├── manifest.json                 # Behavioral assertions
├── pipeline.yaml                 # Validation gates
└── __tests__/
    └── component.test.tsx
```

**Result:**
- Original: 1 file, 1,005 lines
- Cell: 16 files, avg 68 lines/file, max 220 lines
- Complexity: Managed through decomposition
- Maintainability: High (each file focused)
- AI-Agent Navigability: Excellent (fits in context)

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
  - Extract to files ≤400 lines each
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
  - Confirm all files ≤400 lines
  - Confirm all tests pass
  - Migration marked complete
```

### 4.3. Architectural Mandates

These are hard requirements that cannot be marked "optional" or "deferred":

#### M-CELL-1: All Functionality as Cells
**Rule:** Every piece of discrete functionality MUST be implemented as a Cell.

**Applies To:**
- Components with behavioral requirements
- Multi-step user flows (wizards, forms)
- Data processing and display logic
- Feature modules with business rules

**Does NOT Exempt:**
- ❌ "It's a modal dialog" - modals with logic are Cells
- ❌ "It's single-use" - single-use components are still Cells
- ❌ "It's too complex" - complexity requires Cell structure more
- ❌ "It's tightly coupled to parent" - extract with clear interface

**Enforcement:** Architecture validation MUST reject plans that exempt functionality from Cell structure without valid justification.

---

#### M-CELL-2: Complete Atomic Migrations
**Rule:** Migrations MUST be complete, atomic transformations in a single commit.

**Required Steps (ALL required, none optional):**
1. ✅ Create new Cell structure with manifest + pipeline
2. ✅ Extract all code into files ≤400 lines
3. ✅ Implement comprehensive tests
4. ✅ Update all imports and references
5. ✅ Delete old implementation completely
6. ✅ Commit as single atomic change

**FORBIDDEN Patterns:**
- ❌ Marking extraction as "optional phase"
- ❌ Deferring cleanup to "future sprint"
- ❌ Partial migrations leaving god components
- ❌ "Phase 3 (optional)" in migration plans
- ❌ Keeping old implementation "for reference"

**If Time-Constrained:**
- Option A: Defer ENTIRE migration (select simpler component)
- Option B: Allocate sufficient time for complete migration
- NEVER: Execute partial migration

**Rationale:** Partial migrations create the exact problems this architecture prevents—parallel implementations, god components, and agent confusion.

---

#### M-CELL-3: Zero God Components
**Rule:** No component file may exceed 400 lines of code.

**Measurement:**
```bash
# Scan for violations
find apps/web/components -name "*.tsx" -exec wc -l {} + | awk '$1 > 400'

# Result MUST be empty (zero files found)
```

**Enforcement:**
- Migration plans MUST include extraction strategy for files >400 lines
- Code reviews MUST reject PRs introducing files >400 lines
- Automated checks SHOULD fail CI/CD for god components
- Existing violations MUST be addressed in migration backlog

**Handling Complexity:**
- Extract sub-components to `components/` subdirectory
- Move custom logic to `hooks/` subdirectory
- Move pure functions to `utils/` subdirectory
- If still >400 lines, decompose Cell into multiple Cells

---

#### M-CELL-4: Explicit Behavioral Contracts
**Rule:** Every Cell MUST document behavioral requirements in manifest.json.

**Minimum Required:**
- 3+ behavioral assertions with validation strategies
- Clear success criteria for each assertion
- Criticality level (high/medium/low)
- Test coverage mapping

**Example Violation:**
```json
{
  "behavioralAssertions": []  // ❌ INVALID - no assertions
}
```

**Example Compliance:**
```json
{
  "behavioralAssertions": [
    {
      "id": "BA-001",
      "requirement": "Component MUST display loading state during data fetch",
      "validation": "Unit test: verify spinner renders when isLoading=true",
      "criticality": "high"
    }
  ]
}
```

---

### 4.4. Anti-Patterns to Avoid

#### Anti-Pattern 1: Partial Migrations
**Description:** Completing tRPC migration but leaving component extraction "optional."

**Why It's Wrong:**
- Creates god components (violates M-CELL-3)
- Defeats purpose of granular architecture
- Agents struggle with large, complex files
- Future maintenance becomes difficult

**Example Violation:**
```yaml
Phase 1: API Migration [COMPLETE]
Phase 2: Parent Refactoring [COMPLETE]
Phase 3: Component Extraction [OPTIONAL]  # ❌ VIOLATION
```

**Correct Approach:**
```yaml
Phase 1: API Migration
Phase 2: Parent Refactoring
Phase 3: Component Extraction  # ✅ REQUIRED
# All phases complete before marking migration done
```

---

#### Anti-Pattern 2: Misclassifying Cells as "Shared Components"
**Description:** Treating functionality as generic component to avoid Cell structure.

**Why It's Wrong:**
- Business logic escapes architectural constraints
- No manifest means no behavioral contract
- No pipeline means no validation gates
- Agents can't discover requirements

**Example Violation:**
```
components/
├── cells/           # Proper Cells
└── forecast-wizard.tsx  # ❌ 1,005 lines, complex logic, NO manifest
```

**Correct Approach:**
```
components/
├── cells/
│   └── forecast-wizard/
│       ├── manifest.json      # ✅ Behavioral contract
│       ├── pipeline.yaml      # ✅ Validation gates
│       ├── component.tsx      # ✅ ≤400 lines
│       └── components/        # ✅ Sub-components extracted
└── ui/              # Only pure UI primitives
```

---

#### Anti-Pattern 3: "Optional Cleanup" in Plans
**Description:** Planning to delete old code in a future, unscheduled phase.

**Why It's Wrong:**
- Violates "No Parallel Implementations" principle
- Codebase contains duplicate implementations
- Agents may use wrong implementation
- Code bloat accumulates over time

**Example Violation:**
```markdown
## Cleanup (Future Phase)
We'll delete the old implementation once new one is stable.
```

**Correct Approach:**
```markdown
## Phase 3: Cleanup (Same Migration)
- Delete old component
- Verify no references remain
- Single atomic commit with new Cell only
```

---

#### Anti-Pattern 4: File Size Exemptions
**Description:** Allowing files >400 lines with justifications like "it's complex" or "one-time exception."

**Why It's Wrong:**
- Complexity is WHY we need <400 line limit
- Exemptions accumulate, architecture erodes
- Agents struggle with large context windows
- Sets precedent for future violations

**Example Violation:**
```typescript
// ❌ 1,200 line component
// "It's complex, so we'll keep it monolithic for now"
export function ComplexDashboard() {
  // ... 1,200 lines of tangled logic
}
```

**Correct Approach:**
```typescript
// ✅ Orchestrator: 180 lines
export function ComplexDashboard() {
  return (
    <>
      <DashboardHeader />      {/* 80 lines */}
      <MetricsPanel />         {/* 150 lines */}
      <ChartsSection />        {/* 200 lines */}
      <DataTable />            {/* 350 lines */}
    </>
  )
}
```

---

#### Anti-Pattern 5: Skipping Manifest Creation
**Description:** Creating Cell directory but omitting manifest.json "temporarily."

**Why It's Wrong:**
- No behavioral contract means agents don't know requirements
- Can't validate against assertions
- Breaks discoverability via ledger
- "Temporary" becomes permanent

**Enforcement:**
```bash
# Cell validation check
for cell in components/cells/*/; do
  if [ ! -f "$cell/manifest.json" ]; then
    echo "❌ VIOLATION: $cell missing manifest.json"
    exit 1
  fi
done
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
   └─> Ensure all files remain ≤400 lines

5. Run Pipeline
   └─> Execute validation gates
   └─> If fails → Generate Failure Report → New Session

6. Update Ledger
   └─> Append entry with changes
   └─> Link to human prompt
```

### 6.2. Migration Planning Workflow

When creating migration plans, agents MUST:

```
1. Read Architecture Document
   └─> Section 3.2: Cell classification
   └─> Section 4.3: Architectural mandates
   └─> Section 4.4: Anti-patterns to avoid

2. Classify Component
   └─> Apply decision tree
   └─> Determine if Cell or UI component
   └─> Document classification rationale

3. Draft Migration Plan
   └─> Include ALL required phases
   └─> Plan file extraction strategy (≤400 lines)
   └─> Schedule old component deletion (same migration)
   └─> FORBIDDEN: "optional" or "future" language

4. Self-Validate Plan
   └─> Check against M-CELL-1 through M-CELL-4
   └─> Search for anti-patterns (Section 4.4)
   └─> Verify completeness (manifest + pipeline + extraction + deletion)
   └─> If violations found → Revise (return to step 3)

5. Present Plan
   └─> Only after self-validation passes
   └─> Include compliance confirmation
   └─> Document how each mandate is satisfied
```

**Critical:** Plans with architectural violations MUST NOT be presented for approval. Agents must self-correct before human review.

### 6.3. Ledger Query Operations

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

### 6.4. Pre-Implementation Checklist

```yaml
Before writing ANY code:
- [ ] Read Section 4.3 (Architectural Mandates)
- [ ] Read Section 4.4 (Anti-Patterns to Avoid)
- [ ] Query ledger for reference Cells with similar complexity
- [ ] Review reference Cell implementation
- [ ] Identify ALL tRPC procedures needed
- [ ] Test EACH procedure via curl
- [ ] Verify existing infrastructure
- [ ] Read Development Pitfalls section
- [ ] Confirm migration plan has NO optional phases
```

### 6.5. Architecture Compliance Validation

Before implementation begins, validate migration plan against architectural mandates:

```yaml
Cell Classification Validation:
  - [ ] Does component represent discrete functionality?
  - [ ] Does it have behavioral requirements?
  - [ ] If YES to both → MUST be Cell (M-CELL-1)
  - [ ] Exemptions require explicit justification

Migration Completeness Validation:
  - [ ] Does plan include manifest.json creation?
  - [ ] Does plan include pipeline.yaml creation?
  - [ ] Does plan extract files to ≤400 lines? (M-CELL-3)
  - [ ] Does plan delete old implementation? (M-CELL-2)
  - [ ] Is deletion in SAME migration (not optional)?

Forbidden Patterns Check:
  - [ ] Search plan for "optional" + "phase" → VIOLATION
  - [ ] Search plan for "future cleanup" → VIOLATION
  - [ ] Search plan for "temporary exemption" → VIOLATION
  - [ ] Any file >400 lines without extraction → VIOLATION

Success Criteria:
  - [ ] All mandates satisfied
  - [ ] Zero anti-patterns detected
  - [ ] Plan approved for implementation
  - [ ] If violations found → Return to planning
```

**Validation Tools:**
```bash
# Check for god components
find apps/web/components -name "*.tsx" -exec wc -l {} + | awk '$1 > 400 {print "VIOLATION:", $2, "("$1" lines)"}'

# Check for Cells missing manifests
find components/cells/* -type d -exec test ! -f {}/manifest.json \; -print

# Check for non-Cell components with business logic
grep -r "useState\|useEffect\|trpc\." apps/web/components/*.tsx | grep -v "/cells/" | grep -v "/ui/"
```

### 6.6. During Implementation Checklist

```yaml
While writing code:
- [ ] Memoize ALL objects/arrays passed to hooks
- [ ] Use z.string().transform() for dates
- [ ] Reference existing procedures for patterns
- [ ] Add defensive logging for query states
- [ ] Test queries independently before integration
- [ ] Keep component manageable (~400 lines max)
```

### 6.7. Validation Checklist

```yaml
Before marking complete:
  
Functional Validation:
- [ ] Check Network tab: All requests successful
- [ ] Check Console: Query states correct
- [ ] Compare calculations: 100% parity with old
- [ ] Measure performance: ≤110% of baseline
- [ ] Run all tests: 80%+ coverage

Architectural Compliance (M-CELL-1 through M-CELL-4):
- [ ] Component is Cell (has manifest.json + pipeline.yaml)
- [ ] All files ≤400 lines (M-CELL-3)
- [ ] Old component deleted (M-CELL-2)
- [ ] No parallel implementations exist
- [ ] Behavioral assertions documented (M-CELL-4)
- [ ] Ledger entry created with replacement documented

File Size Verification:
- [ ] Run: find components/cells/{cell-name} -name "*.tsx" -exec wc -l {} +
- [ ] Confirm: All files ≤400 lines
- [ ] If violations: Extract further before completing

Cleanup Verification:
- [ ] Run: grep -r "old-component-name" apps/
- [ ] Confirm: Zero references found
- [ ] Codebase contains ONLY new Cell implementation
```

## 7. Validation & Success Metrics

### 7.1. Architecture Validation

- **Type Safety**
  - Zero `any` types in components
  - All tRPC queries return typed data
  - Drizzle schema matches production database
  - TypeScript compilation has zero errors

- **Cell Quality**
  - All components converted to Cells (M-CELL-1)
  - Every Cell has `manifest.json` (M-CELL-4)
  - Every Cell has `pipeline.yaml`
  - All behavioral assertions have tests
  - All Cells pass pipeline validation
  - Zero files >400 lines (M-CELL-3)

- **Migration Integrity**
  - Zero partial migrations (all phases complete)
  - Zero parallel implementations (M-CELL-2)
  - Old components deleted immediately upon Cell creation
  - All migrations are atomic (single commit per migration)
  - No "optional" phases in any migration plan

- **Ledger Completeness**
  - All Cells documented in ledger
  - All API procedures documented
  - All replacements tracked with deletion timestamps
  - Ledger query functions work correctly
  - Historical context is preserved

- **Architectural Mandate Compliance**
  - M-CELL-1: All functionality as Cells (100% compliance)
  - M-CELL-2: Complete atomic migrations (0 partial migrations)
  - M-CELL-3: Zero god components (0 files >400 lines)
  - M-CELL-4: All Cells have behavioral contracts

### 7.2. Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **Component Drift Incidents** | 0 per sprint | Track duplicate component events |
| **Type Safety Coverage** | 100% | Count `any` types → should be 0 |
| **God Components** | 0 files | Files >400 lines (M-CELL-3) |
| **Partial Migrations** | 0 migrations | Migrations with optional phases (M-CELL-2) |
| **Cell Mandate Compliance** | 100% | All functionality as Cells (M-CELL-1) |
| **Manifest Coverage** | 100% | Cells with manifest.json (M-CELL-4) |
| **Parallel Implementations** | 0 instances | Duplicate implementations exist |
| **Implicit Requirements** | 0% | Behavioral assertions in manifests |
| **Feature Location Time** | < 30 seconds | Time from query to location |
| **Debugging Iteration Count** | < 3 per issue | Average iterations to resolve |
| **Pipeline Validation Coverage** | 100% | Cells with passing pipelines |

**Critical Metrics (Architecture Health):**

These metrics measure adherence to architectural mandates and MUST remain at target:

```bash
# M-CELL-3: God Components Check
find apps/web/components/cells -name "*.tsx" -exec wc -l {} + | awk '$1 > 400'
# Target: Empty output (zero files)

# M-CELL-1 & M-CELL-4: Cell Structure Compliance
total_cells=$(find components/cells -maxdepth 1 -type d | wc -l)
cells_with_manifest=$(find components/cells/*/manifest.json | wc -l)
compliance_rate=$((cells_with_manifest * 100 / total_cells))
# Target: 100%

# M-CELL-2: Parallel Implementation Check
git log --all --grep="optional.*phase" | wc -l
# Target: 0 (no migrations with optional phases)

# Anti-Pattern Detection
grep -r "components/.*\.tsx" --include="*.tsx" | grep -v "/cells/" | grep -v "/ui/" | grep "useState\|useEffect" | wc -l
# Target: 0 (all stateful components are Cells)
```

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
  - Count lines of code (determine extraction needs)

Step 3: Cell Classification
  - Apply decision tree (Section 3.2)
  - Confirm component qualifies as Cell
  - If NOT Cell → use components/ui/
  - If Cell → proceed with migration

Step 4: Create Migration Plan
  - Define new Cell structure
  - Identify needed tRPC procedures
  - Plan test coverage
  - Plan extraction strategy (all files ≤400 lines)
  - CRITICAL: Plan must have ZERO optional phases
  - Include old component deletion in same migration

Step 5: Architecture Compliance Validation
  - Validate plan against M-CELL-1 through M-CELL-4
  - Check for anti-patterns (Section 4.4)
  - Verify no "optional" or "future cleanup" language
  - Confirm file size limits will be met
  - If violations found → Revise plan (return to Step 4)

Step 6: Execute Migration
  - Follow Cell Migration Workflow (Section 4.2)
  - Create Cell with manifest + pipeline
  - Extract to files ≤400 lines
  - Ensure complete replacement
  - No parallel implementations

Step 7: Validate & Commit
  - Run all pipelines
  - Verify all files ≤400 lines
  - Delete old code (same commit)
  - Update ledger with replacement documented
  - Single atomic commit
  - Confirm zero architecture violations
```

**Compliance Checkpoints:**

At each step, verify architectural compliance:

| Step | Compliance Check | Pass Criteria |
|------|------------------|---------------|
| 3 | Cell classification | Correct decision tree application |
| 4 | Plan completeness | Zero optional phases |
| 5 | Mandate validation | All M-CELL-1 to M-CELL-4 satisfied |
| 6 | File size limits | All files ≤400 lines during extraction |
| 7 | Cleanup completion | Old component deleted in same commit |

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

### Architectural Mandates: Non-Negotiable

The four architectural mandates (M-CELL-1 through M-CELL-4) are hard requirements:

1. **M-CELL-1:** All functionality MUST be Cells
2. **M-CELL-2:** Migrations MUST be complete and atomic
3. **M-CELL-3:** No files may exceed 400 lines
4. **M-CELL-4:** All Cells MUST have behavioral contracts

**These are not guidelines—they are constraints.** Migration plans that violate these mandates MUST be rejected and revised. "Optional" extraction phases, "temporary" god components, and "future" cleanup all violate this architecture.

### The Goal: 100% Compliance

Complete codebase adoption where:
- Every component is a Cell with manifest and pipeline
- Every API call goes through tRPC procedures
- Every file is ≤400 lines
- Every requirement is explicit in manifests
- Zero parallel implementations exist
- Codebase maintains absolute leanness

Agents using this document can autonomously explore codebases, identify migration candidates, and systematically transform them following these patterns—but only when architectural mandates are enforced without exception.

**Remember:** This is complete replacement, not gradual addition. Maintain absolute leanness through atomic migrations. No v2 suffixes. No feature flags. No optional phases. Clean, single implementations only.

**Partial compliance is non-compliance.** A codebase is either AI-native or it isn't. Half-migrated components defeat the architecture's purpose.
