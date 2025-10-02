# Living Blueprint Architecture for AI-Agentic Development
## Cost Management Hub - Complete Refactoring Plan

**Document Version:** 1.0  
**Date:** October 1, 2025  
**Architect:** Winston  
**Status:** Draft for Approval  

---

## Executive Summary

This document defines the **Living Blueprint Architecture**, a comprehensive refactoring plan to transform the Cost Management Hub into an AI-optimized codebase through **100% adoption** of the new architecture. The architecture addresses critical failure modes experienced during AI-driven development: component drift, data-UI desynchronization, implicit requirement regression, and context degradation.

**Ultimate Goal:** Complete codebase refactor where every component becomes a Cell with manifest, every API call goes through tRPC, and the codebase maintains absolute leanness - optimized specifically for AI agent development, not human convenience.

### The Core Problem

Current AI agent development on this codebase suffers from:
- **Component Drift**: Agents create new components instead of modifying existing ones
- **Data-UI Desynchronization**: Type safety gaps between Supabase queries and UI components
- **Implicit Requirement Regression**: Behavioral requirements exist only in conversation history
- **Context Degradation**: Long debugging sessions lose track of original intent
- **Ambiguous Prompting**: Agents struggle to locate features in the growing codebase

### The Solution

A hybrid architecture that merges modern type-safety with radical explicitness:

1. **Type-Safe Data Layer** - Unbreakable contracts from database to UI via tRPC + Drizzle
2. **Smart Component Cells** - Self-documenting, self-validating UI units with explicit manifests
3. **Architectural Ledger** - Permanent, queryable memory of all development decisions and failures

### Key Outcomes

- **100% architecture adoption** - every component migrated to Cell architecture
- **Zero parallel implementations** - lean, single-source-of-truth codebase
- **End-to-end type safety** - from PostgreSQL → tRPC → React (100% coverage)
- **Zero implicit requirements** - all behaviors machine-readable in manifests
- **Instant feature location** - agents query ledger instead of searching
- **AI-optimized clarity** - no version suffixes, no feature flags, no dead code

---

## Part 1: Architectural Foundations

### 1.1 Core Principles

The Living Blueprint Architecture is built on four unwavering principles, each designed to solve a specific AI agent cognitive limitation:

#### Principle 1: Explicitness Over Implicitness
**Problem Solved:** Implicit requirements exist only in conversation history and are lost between sessions.

**Implementation:**
- Every component has a `manifest.json` that declares its data contracts, behavioral assertions, and success criteria
- Requirements are not "documented" in markdown—they are encoded in machine-readable format
- If a requirement isn't in a manifest, it doesn't exist for the agent

**Example:**
```json
// components/cells/waterfall-plot/manifest.json
{
  "id": "waterfall-plot",
  "dataContractId": "trpc.budget.getWaterfallData",
  "behavioralAssertions": [
    "The plot MUST show per-item granularity",
    "Tooltip MUST show exact amount and variance",
    "Increase bars MUST be green (#10b981)",
    "Decrease bars MUST be red (#ef4444)"
  ]
}
```

#### Principle 2: Radical Granularity & Isolation
**Problem Solved:** Large components exceed agent context windows and cause unintended side effects.

**Implementation:**
- Functionality decomposed into minimal, self-contained "Cells"
- Each Cell fits within a 4000-token context window
- Cells are independently verifiable and testable
- Clear boundaries prevent cascading changes

**Cell Structure:**
```
/components/cells/budget-waterfall/
├── component.tsx      # Pure UI (< 200 lines)
├── state.ts           # Local state only (Zustand)
├── manifest.json      # Explicit contract
└── pipeline.yaml      # Validation gates
```

#### Principle 3: Immutable Traceability
**Problem Solved:** Agents lack long-term memory and forget why decisions were made.

**Implementation:**
- All changes recorded in append-only `ledger.jsonl`
- Every entry links human prompts to specific artifacts
- Agents can query ledger to understand system evolution
- Full audit trail from initial prompt to final code

**Ledger Entry:**
```json
{
  "iterationId": "iter_20251001_140000_addWaterfallPlot",
  "timestamp": "2025-10-01T14:00:00Z",
  "humanPrompt": "Create waterfall plot for budget variance",
  "artifacts": {
    "created": [{"type": "cell", "id": "waterfall-plot"}],
    "modified": ["trpc.budget.getWaterfallData"]
  },
  "schemaChanges": []
}
```

#### Principle 4: Immutable History
**Problem Solved:** Agents lack context about past failures and decisions.

**Implementation:**
- All implementation attempts recorded in ledger (success and failure)
- Failure reports stored with root cause analysis
- Agents can query past failures to avoid repeating mistakes
- Complete audit trail enables learning from history

---

### 1.2 Why This Architecture Solves AI Agent Problems

| AI Agent Limitation | How Living Blueprint Solves It |
|---------------------|--------------------------------|
| **Limited Context Window** | Cells are < 4000 tokens; manifests provide complete context |
| **No Long-Term Memory** | Ledger provides queryable history of all decisions |
| **Ambiguous Instructions** | Manifests encode requirements in machine-readable format |
| **Poor Code Navigation** | Ledger maps features to exact Cell IDs |
| **Regression Risk** | Pipeline validation gates catch behavioral changes |
| **Past Failures Forgotten** | Ledger records failure reports with root cause analysis |

---

## Part 2: The Three Pillars

### 2.1 Pillar 1: Type-Safe Data Layer

#### Problem Statement
Current architecture has multiple type-safety gaps:
```typescript
// Current: No type safety between query and UI
const { data } = await supabase.from('cost_breakdown').select('*')
// data is 'any' - UI has no contract with database

// Component receives 'any' and hopes for the best
<BudgetChart data={data} />
```

#### Solution: tRPC + Drizzle Stack

**Architecture:**
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

**Implementation Details:**

**1. Database Layer (Drizzle ORM)**
```typescript
// packages/db/src/schema/cost-breakdown.ts
import { pgTable, uuid, decimal, timestamp } from 'drizzle-orm/pg-core'

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

**2. API Layer (tRPC Backend)**
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
        from: z.date(),
        to: z.date()
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

**3. Frontend Integration (React + TanStack Query)**
```typescript
// components/cells/budget-waterfall/component.tsx
import { trpc } from '@/lib/trpc'

export function BudgetWaterfall({ projectId }: { projectId: string }) {
  // ✅ Fully typed - IDE autocomplete works
  // ✅ Runtime validation via Zod
  // ✅ Automatic caching via TanStack Query
  const { data, isLoading } = trpc.budget.getWaterfallData.useQuery({
    projectId,
    dateRange: { from: new Date(), to: new Date() }
  })

  // TypeScript knows exact shape of 'data'
  // No possibility of runtime type mismatch
  return <WaterfallChart items={data?.items ?? []} />
}
```

**Benefits for AI Agents:**
- **No guessing about data shapes** - types are generated from source of truth
- **Immediate feedback on errors** - TypeScript catches mistakes before runtime
- **Self-documenting APIs** - agents can inspect tRPC router definitions
- **Impossible to create type mismatches** - compiler enforces correctness

---

### 2.2 Pillar 2: Smart Component Cells

#### Problem Statement
Current components lack explicit contracts:
- Behavioral requirements exist only in conversation history
- No validation that requirements are met
- Agents can't determine if a component is "done"
- No way to verify changes don't break requirements

#### Solution: Self-Documenting, Self-Validating Cells

**Cell Anatomy:**
```
/components/cells/budget-waterfall/
│
├── component.tsx      # Pure presentation logic
├── state.ts           # Local UI state (Zustand store)
├── manifest.json      # The Cell's "contract" and identity
└── pipeline.yaml      # Automated quality gates
```

**The Manifest (The Contract):**
```json
// components/cells/budget-waterfall/manifest.json
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
      "requirement": "Tooltip MUST show: Category Name, Budgeted Amount, Actual Amount, Variance %",
      "validation": "E2E test: hover on bar, verify tooltip content",
      "criticality": "high"
    },
    {
      "id": "BA-003",
      "requirement": "Positive variance MUST render as green bar (#10b981)",
      "validation": "Unit test: component.getBarColor(variance > 0) === '#10b981'",
      "criticality": "medium"
    },
    {
      "id": "BA-004",
      "requirement": "Negative variance MUST render as red bar (#ef4444)",
      "validation": "Unit test: component.getBarColor(variance < 0) === '#ef4444'",
      "criticality": "medium"
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
      "Each bar MUST be keyboard navigable",
      "Tooltip MUST be accessible via keyboard focus"
    ]
  },
  
  "metadata": {
    "createdBy": "iter_20251001_140000_addWaterfallPlot",
    "createdAt": "2025-10-01T14:00:00Z",
    "lastModified": "2025-10-01T14:00:00Z",
    "relatedCells": ["budget-timeline", "spend-category-chart"]
  }
}
```

**The Pipeline (Quality Gates):**
```yaml
# components/cells/budget-waterfall/pipeline.yaml
version: 1.0

# These gates MUST pass before an agent can mark work complete
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
    description: "Verifies all behavioral assertions have corresponding tests"
    
  - name: Accessibility Audit
    run: "axe-core ./component.tsx"
    required: true
    
  - name: Visual Regression Test
    run: "playwright test budget-waterfall.visual.spec.ts"
    required: false
    on_fail: warn

success_criteria:
  - "All required gates pass"
  - "Coverage >= 80%"
  - "All behavioral assertions have tests"
  - "Zero accessibility violations"
```

**Benefits for AI Agents:**

1. **Zero Ambiguity**: Agent reads manifest to understand exact requirements
2. **Automated Validation**: Pipeline prevents agents from "declaring victory" prematurely
3. **Explicit Success Criteria**: Agent knows exactly when component is complete
4. **Prevents Regression**: Future changes must still pass all assertions
5. **Self-Documenting**: New agent can understand component without reading implementation

**Agent Workflow:**
```
1. Agent reads manifest.json → understands requirements
2. Agent implements component.tsx
3. Agent runs pipeline.yaml → validation
4. If pipeline fails → agent fixes issues
5. Pipeline passes → work is complete (no debate)
```

---

### 2.3 Pillar 3: The Architectural Ledger

#### Problem Statement
Agents lack persistent memory:
- Can't remember why features were built
- Can't locate features after a few weeks
- Lose context between sessions
- No historical understanding of system evolution

#### Solution: Append-Only, Queryable History

**Ledger Structure:**
```jsonl
// ledger.jsonl (append-only, one entry per line)

{"iterationId":"iter_20251001_100000_setupMonorepo","timestamp":"2025-10-01T10:00:00Z","humanPrompt":"Set up Turborepo with tRPC and Drizzle","artifacts":{"created":[{"type":"package","id":"api"},{"type":"package","id":"db"}],"modified":[]},"schemaChanges":[]}

{"iterationId":"iter_20251001_140000_addWaterfallPlot","timestamp":"2025-10-01T14:00:00Z","humanPrompt":"Create a waterfall plot to show budget changes","artifacts":{"created":[{"type":"cell","id":"budget-waterfall","path":"components/cells/budget-waterfall"}],"modified":["trpc.budget.getWaterfallData"]},"schemaChanges":[]}

{"iterationId":"iter_20251002_093000_addFiltersToWaterfall","timestamp":"2025-10-02T09:30:00Z","humanPrompt":"Add date range filters to the waterfall plot","artifacts":{"created":[],"modified":[{"type":"cell","id":"budget-waterfall","changes":["Added dateRange prop","Added filter UI","Updated manifest.json"]}]},"schemaChanges":[]}
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
      id: string               // Unique identifier
      path?: string            // File system path
    }>
    modified: Array<string | { type: string, id: string, changes: string[] }>
  }
  
  schemaChanges: Array<{
    table: string
    operation: 'create' | 'alter' | 'drop'
    migration: string          // SQL or Drizzle migration file
  }>
  
  metadata?: {
    agent?: string             // Which agent performed the work
    duration?: number          // Time taken in seconds
    iterationCount?: number    // How many attempts were needed
  }
}
```

**Agent Query Patterns:**

**1. Feature Location:**
```typescript
// User: "Add export functionality to the waterfall plot"

// Agent queries ledger:
const results = await queryLedger({
  search: "waterfall plot",
  artifactType: "cell"
})
// Returns: { id: "budget-waterfall", path: "components/cells/budget-waterfall" }

// Agent now knows exactly where to work - no searching needed
```

**2. Historical Context:**
```typescript
// User: "Why does the waterfall plot use these specific colors?"

// Agent queries ledger:
const history = await getLedgerHistory("budget-waterfall")
// Returns timeline:
// - iter_20251001_140000: Created with requirement "positive=green, negative=red"
// - iter_20251001_153000: Colors changed to match brand guidelines
// - Manifest BA-003 and BA-004 capture color requirements

// Agent understands: "Colors are explicit behavioral assertions"
```

**3. Impact Analysis:**
```typescript
// User: "I want to change the budget data structure"

// Agent queries ledger:
const dependents = await findDependents("trpc.budget.getWaterfallData")
// Returns: ["budget-waterfall", "budget-timeline", "pl-command-center"]

// Agent knows: "This change will impact 3 Cells that must be validated"
```

**Ledger Maintenance:**

**Automated Entry Creation:**
```yaml
# .github/workflows/ledger-entry.yml
on:
  push:
    branches: [main]

jobs:
  create-ledger-entry:
    runs-on: ubuntu-latest
    steps:
      - name: Generate Ledger Entry
        run: |
          # Parse commit message for iteration ID
          # Scan for created/modified Cells
          # Append to ledger.jsonl
```

**Query Interface:**
```typescript
// lib/ledger-query.ts
export class LedgerQuery {
  static async findCell(searchTerm: string): Promise<CellInfo | null>
  static async getHistory(cellId: string): Promise<LedgerEntry[]>
  static async findDependents(apiId: string): Promise<string[]>
  static async getRecentChanges(since: Date): Promise<LedgerEntry[]>
}

// Agent can import and use directly
```

**Benefits for AI Agents:**
- **Instant Feature Location**: No more "searching for the component"
- **Historical Context**: Understand why decisions were made
- **Impact Analysis**: Know what will be affected by changes
- **Persistent Memory**: Context survives between sessions
- **Audit Trail**: Complete history of system evolution

---

## Part 3: Current State Analysis

### 3.1 Existing Codebase Assessment

**Current Architecture:**
```
/app                       # Next.js 14 App Router
  /po-mapping             # PO mapping feature
  /projects/[id]/dashboard # Project dashboard
/components
  /dashboard              # Dashboard components (14 files)
  /ui                     # shadcn/ui components (33 files)
  [25 other components]   # Various feature components
/lib
  /supabase              # Direct Supabase client usage
  dashboard-metrics.ts   # Business logic mixed with data access
  pl-tracking-service.ts # More business logic + data access
```

**Problems Identified:**

**1. Type Safety Gaps**
```typescript
// Current pattern (25 occurrences):
const { data } = await supabase.from('cost_breakdown').select('*')
// ❌ No type safety
// ❌ No validation
// ❌ Direct database coupling
```

**2. Business Logic Scattered**
```typescript
// lib/dashboard-metrics.ts (468 lines)
- Mixes data fetching with business calculations
- Direct Supabase queries throughout
- No clear separation of concerns
- Difficult for agents to understand data flow
```

**3. Component Complexity**
```typescript
// app/projects/[id]/dashboard/page.tsx (518 lines)
- Massive page component
- Mixed concerns: data fetching, state, rendering
- Multiple useEffect hooks
- Exceeds agent context window
```

**4. Implicit Requirements**
```typescript
// Example from components/dashboard/pl-command-center.tsx
// ❌ No manifest defining expected behavior
// ❌ No validation that requirements are met
// ❌ Agent must read entire component to understand it
```

**5. No Historical Context**
```typescript
// ❌ No ledger to explain why components exist
// ❌ No way to find related components
// ❌ Agent must search entire codebase for features
```

### 3.2 Migration Complexity Assessment

**Effort Matrix:**

| Area | Current Lines | Cells to Create | tRPC Procedures | Estimated Effort |
|------|--------------|-----------------|-----------------|------------------|
| PO Mapping | ~800 | 5 | 8 | 3 weeks |
| Project Dashboard | ~1200 | 12 | 15 | 5 weeks |
| Shared Components | ~600 | 8 | 0 | 2 weeks |
| Data Layer | ~1000 | 0 | 25 | 3 weeks |
| **TOTAL** | **~3600** | **25** | **48** | **13 weeks** |

**Risk Assessment:**

| Risk | Severity | Mitigation |
|------|----------|------------|
| Breaking changes during migration | High | Branch isolation + human validation gate per story |
| Data type mismatches | Medium | Drizzle schema validation before cutover |
| Lost functionality during refactor | High | Comprehensive manifest creation + testing before cleanup |
| Context pollution during migration | High | Immediate cleanup after validation (no parallel implementations) |
| Team velocity during transition | Medium | Phased rollout, one Cell at a time with clean commits |

---

## Part 4: Migration Strategy

### 4.1 Migration Principles (AI-Optimized Development)

**Context:** Solo development with AI agents. Each story completely replaces old implementation with new Cell. Git commits provide safety.

1. **Complete Replacement**: Each story creates new Cell and deletes old component
2. **No Parallel Implementations**: Never keep v1/v2 or old/new versions
3. **Story-Commit Cadence**: Each completed story = one git commit with only new Cell
4. **Immediate Cleanup**: Delete old implementation in same story, before commit
5. **Single Source of Truth**: Codebase contains only ONE implementation per feature
6. **Lean Codebase**: Optimize for AI agent clarity - no dead code, no feature flags
7. **Git-Based Safety**: Can revert entire commit if issues found

**Key Principle:** Maintain absolute leanness through 100% architecture adoption. AI agents work best with single, clean implementations - not parallel versions, not conditional logic, not versioned components. Every story must end with cleanup. The goal is complete refactor, not gradual hybrid coexistence.

### 4.2 Cell Migration Story Workflow

**Standard workflow for every Cell migration story:**

```yaml
Phase 1: Implementation
  - Agent creates new Cell (e.g., kpi-card)
  - Agent writes manifest.json with behavioral assertions
  - Agent writes pipeline.yaml with validation gates
  - Agent implements component with comprehensive tests
  - Agent runs automated pipeline validation
  - All gates must pass

Phase 2: Integration & Testing
  - Agent updates all imports to use new Cell
  - Agent runs all tests (unit + integration + e2e)
  - Agent verifies build succeeds
  - Agent tests manually in browser (npm run dev)
  - All functionality must work correctly with new Cell

Phase 3: Cleanup (Immediately after validation)
  - Agent deletes old component file(s)
  - Agent verifies no references remain: grep -r "old-component-name"
  - Agent runs all tests again to confirm nothing broke
  - Agent updates ledger to document replacement

Phase 4: Commit
  - Agent commits with message: "Story X.Y: [Component] migrated to Cell architecture"
  - Ledger entry appended to file
  - Codebase contains ONLY new Cell (lean and clean)

Phase 5: Verification
  - Agent confirms old component deleted
  - Agent confirms no references to old implementation exist
  - Agent confirms all tests pass
  - Story marked complete
```

**Critical Rules for Agents:**
- ALWAYS delete old implementation in same story
- NEVER leave parallel implementations (v1, v2, etc.)
- Each commit MUST contain only new Cell (no old code)
- Use git commits for safety (can revert entire commit if needed)
- Codebase must be LEAN - one implementation per feature

**Ledger Entry Pattern for Replacements:**
```json
{
  "artifacts": {
    "created": [{"type": "cell", "id": "kpi-card", "path": "components/cells/kpi-card"}],
    "replaced": [{
      "type": "component",
      "id": "kpi-card-old",
      "path": "components/dashboard/kpi-card.tsx",
      "deletedAt": "2025-10-01T16:00:00Z",
      "reason": "Migrated to Cell architecture"
    }]
  }
}
```

### 4.3 Target Monorepo Structure

```
cost-management-hub/
│
├── apps/
│   └── web/                          # Next.js 14 app
│       ├── app/
│       │   ├── projects/[id]/dashboard/
│       │   └── po-mapping/
│       └── components/
│           ├── cells/                 # New: Smart Component Cells
│           │   ├── budget-waterfall/
│           │   │   ├── component.tsx
│           │   │   ├── state.ts
│           │   │   ├── manifest.json
│           │   │   └── pipeline.yaml
│           │   ├── po-table/
│           │   └── ...
│           └── ui/                    # Existing: shadcn/ui
│
├── packages/
│   ├── api/                           # New: tRPC Backend
│   │   ├── src/
│   │   │   ├── routers/
│   │   │   │   ├── budget.ts
│   │   │   │   ├── projects.ts
│   │   │   │   ├── pos.ts
│   │   │   │   └── dashboard.ts
│   │   │   ├── procedures/            # Shared procedure logic
│   │   │   ├── trpc.ts                # tRPC setup
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── db/                            # New: Drizzle ORM + Schema
│   │   ├── src/
│   │   │   ├── schema/
│   │   │   │   ├── projects.ts
│   │   │   │   ├── cost-breakdown.ts
│   │   │   │   ├── pos.ts
│   │   │   │   └── po-line-items.ts
│   │   │   ├── migrations/            # Drizzle migrations
│   │   │   └── client.ts
│   │   └── package.json
│   │
│   ├── ui/                            # Shared UI package
│   │   └── src/
│   │       └── components/            # shadcn/ui components
│   │
│   └── types/                         # New: Shared TypeScript types
│       └── src/
│           └── index.ts               # Auto-generated from tRPC
│
├── tools/
│   ├── ledger-query/                  # Ledger query utilities
│   └── cell-validator/                # Manifest + pipeline validation
│
├── ledger.jsonl                       # Architectural Ledger
├── package.json                       # Turborepo root
└── turbo.json                         # Turborepo configuration
```

### 4.4 Migration Epics

#### Epic 1: Living Blueprint Phase 1 Foundation & Validation
**Epic ID:** EPIC-001  
**Goal:** Establish the Living Blueprint Architecture foundation and validate with pilot Cells

**Stories:**

**Story 1.1: Foundation Setup**
- Set up Turborepo monorepo structure
- Create `packages/db` with Drizzle ORM and schema generation
- Create `packages/api` with tRPC setup
- Deploy tRPC endpoint to Supabase Edge Function
- Create `tools/cell-validator` CLI
- Initialize `ledger.jsonl` with existing features

**Success Criteria:**
- Turborepo builds successfully
- Drizzle schema matches production database
- tRPC endpoint responds from Edge Function
- Cell validator CLI runs
- Existing app unchanged

**Story 1.2: KPICard Pilot Cell**
- Create tRPC procedure `dashboard.getKPIMetrics`
- Create Cell structure at `components/cells/kpi-card/`
- Write `manifest.json` with behavioral assertions
- Write `pipeline.yaml` with validation gates
- Implement Cell using tRPC query hook
- Write comprehensive tests
- Update all imports to use new Cell
- Delete old KPICard component
- Validate all tests pass
- Create ledger entry and commit

**Success Criteria:**
- Cell passes all pipeline gates
- Behavioral assertions have tests
- Old component deleted from codebase
- Ledger entry queryable
- Performance parity with original

**Story 1.2.1: KPICard Cleanup (Alignment Story)**
- **Context:** Story 1.2 was implemented with OLD approach (v2 suffix, feature flags, parallel implementations)
- Rename `components/cells/kpi-card-v2/` to `components/cells/kpi-card/`
- Update manifest.json: change `"id": "kpi-card-v2"` to `"id": "kpi-card"`
- Remove feature flag `NEXT_PUBLIC_FEATURE_KPI_CARD_V2` from all files
- Update dashboard page to use Cell directly (no conditional rendering)
- Delete old component at `components/dashboard/kpi-card.tsx`
- Update ledger entries to reflect correct Cell ID
- Verify no references to v2 or feature flags remain
- Run all tests and commit clean state

**Success Criteria:**
- No version suffixes in Cell names
- No feature flags in codebase
- Old component deleted
- Only one implementation exists
- All tests pass
- Ledger updated with cleanup entry

**Story 1.3: PLCommandCenter Pilot Cell (Optional)**
- Create tRPC procedures for P&L metrics
- Create Cell structure at `components/cells/pl-command-center/`
- Write comprehensive manifest for complex data
- Implement Cell with multiple tRPC queries
- Validate complex data flows work correctly

**Success Criteria:**
- Complex data aggregations correct
- All P&L calculations match original
- Pipeline validates data contracts
- No performance degradation

**Estimated Duration:** 3 weeks

---

#### Epic 2: PO Mapping Feature Migration
**Goal:** Migrate complete feature to validate multi-Cell architecture

**Stories:**

**3.1 Backend Foundation**
1. Create tRPC router `pos.router.ts`
2. Create procedures:
   - `pos.findAll` - List all POs with filters
   - `pos.findById` - Get single PO with line items
   - `lineItems.findByPO` - Get line items for PO
   - `mappings.save` - Save PO to cost breakdown mapping
   - `mappings.findByPO` - Get existing mappings

**3.2 Cell Decomposition**
Break existing PO Mapping page into Cells:

```
po-mapping (page) [orchestrator]
├── filter-sidebar-cell
│   └── Filters and search
├── po-table-cell
│   └── Main PO list table
├── details-panel-cell
│   └── PO details and mapping UI
└── batch-action-bar-cell
    └── Bulk operations
```

**3.3 Cell Creation (One Story Per Cell)**

**Story 3.3.1: Create `filter-sidebar-cell`**
- Manifest defines filter schema
- Behavior: "Filter changes update URL params"
- Pipeline validates filter logic

**Story 3.3.2: Create `po-table-cell`**
- Manifest defines table columns and sort behavior
- Behavior: "Selecting PO highlights row and emits event"
- Pipeline validates selection state management

**Story 3.3.3: Create `details-panel-cell`**
- Manifest defines mapping workflow
- Behavior: "Mapping saves only after confirmation"
- Pipeline validates mutation logic

**Story 3.3.4: Create `batch-action-bar-cell`**
- Manifest defines batch operation requirements
- Behavior: "Batch save creates individual mappings"
- Pipeline validates batch logic

**3.4 Integration & Cleanup**
**Story 3.4.1**: Integrate all PO Mapping Cells into page orchestrator
**Story 3.4.2**: Human validation of complete PO Mapping feature
**Story 3.4.3**: Delete old PO Mapping components + commit clean state

**Story 3.4.3 Cleanup Workflow:**
```yaml
1. All 4 Cells implemented and tested
2. Page integrates Cells successfully
3. Human validates complete feature functionality
4. Agent deletes old PO Mapping component files
5. Agent removes old component imports
6. Agent verifies no references remain (grep)
7. Agent updates ledger with replacements
8. Agent commits: "Epic 2 complete: PO Mapping migrated + cleanup"
```

**Success Criteria:**
- ✅ All Cells pass pipeline validation
- ✅ Feature parity with old implementation verified by human
- ✅ No regressions in functionality
- ✅ Old PO Mapping components deleted
- ✅ All Cells documented in ledger
- ✅ Commit contains only new Cell-based implementation

**Estimated Duration:** 3 weeks

---

#### Epic 3: Project Dashboard Migration
**Goal:** Migrate most complex feature to prove architecture scales

**Stories:**

**4.1 Backend Foundation**
1. Create `dashboard.router.ts`
2. Move logic from `lib/dashboard-metrics.ts` to tRPC procedures
3. Create procedures for:
   - `dashboard.getProjectMetrics`
   - `dashboard.getTimelineData`
   - `dashboard.getCategoryBreakdown`
   - `dashboard.getHierarchicalBreakdown`
   - `dashboard.getPLMetrics`
   - `dashboard.getPLTimeline`

**4.2 Cell Decomposition**

```
project-dashboard (page) [orchestrator]
├── pl-command-center-cell
│   └── P&L KPI summary
├── financial-control-matrix-cell
│   └── Budget control table
├── pl-timeline-cell
│   └── P&L over time chart
├── budget-timeline-chart-cell
│   └── Budget vs actual chart
├── spend-category-chart-cell
│   └── Spend by category pie chart
├── spend-subcategory-chart-cell
│   └── Subcategory breakdown
├── cost-breakdown-table-cell
│   └── Detailed cost table
└── supplier-promise-calendar-cell
    └── Promise date calendar
```

**4.3 Cell Creation** (12 stories, one per Cell)

**Example Story 4.3.1: Create `pl-command-center`**
```json
// Manifest excerpt
{
  "id": "pl-command-center",
  "dataContract": {
    "source": "trpc.dashboard.getPLMetrics",
    "refresh": "every 5 minutes"
  },
  "behavioralAssertions": [
    {
      "id": "BA-001",
      "requirement": "Committed value MUST equal sum of all PO mappings"
    },
    {
      "id": "BA-002",
      "requirement": "P&L Impact MUST equal sum of invoiced line items"
    },
    {
      "id": "BA-003",
      "requirement": "Next P&L Hits MUST show top 3 by promise date"
    }
  ]
}
```

**4.4 Integration & Cleanup** (2 weeks)

**Story 4.4.1**: Integrate all 12 Dashboard Cells into page orchestrator
**Story 4.4.2**: Human validation of complete Dashboard feature
**Story 4.4.3**: Delete old Dashboard components + commit clean state

**Story 4.4.3 Cleanup Workflow:**
```yaml
1. All 12 Cells implemented and tested
2. Dashboard page integrates Cells successfully
3. Performance validation (meets or exceeds old implementation)
4. Human validates complete dashboard functionality
5. Agent deletes old dashboard component files
6. Agent deletes lib/dashboard-metrics.ts (old business logic)
7. Agent removes old component imports
8. Agent verifies no references remain (grep)
9. Agent updates ledger with replacements
10. Agent commits: "Epic 3 complete: Dashboard migrated + cleanup"
```

**Success Criteria:**
- ✅ All 12 Cells pass pipeline validation
- ✅ Dashboard functionality verified by human
- ✅ Performance meets or exceeds old implementation
- ✅ All data calculations verified against old system
- ✅ Old dashboard components deleted
- ✅ Ledger contains complete dashboard architecture
- ✅ Commit contains only new Cell-based implementation

**Estimated Duration:** 5 weeks

---

#### Epic 4: Final Cleanup & Branch Merge
**Goal:** Final housekeeping and merge to main branch

**Note:** Most cleanup already completed during individual Cell migrations (Epics 1-3). Each story deleted old implementations. This epic is final verification.

**Stories:**
1. **Story 5.1**: Verify no old component files remain (grep audit)
2. **Story 5.2**: Remove any remaining direct Supabase client usage
3. **Story 5.3**: Update project documentation to reflect new architecture
4. **Story 5.4**: Final ledger review and consistency check
5. **Story 5.5**: Create migration retrospective ledger entry
6. **Story 5.6**: Merge `codebase-modernization` branch to `main`

**Story 5.6 Merge Workflow:**
```yaml
1. Final verification in codebase-modernization branch:
   - Run all tests across entire monorepo
   - Run full type check (tsc)
   - Verify all Cells have manifests and pipelines
   - Confirm ledger is complete
   
2. Create merge commit:
   - git checkout main
   - git merge codebase-modernization
   - Commit message: "Complete Living Blueprint Architecture migration"
   
3. Post-merge verification:
   - Run npm run dev
   - Human validates all features work
   - Run production build
   - Verify no regressions
   
4. Tag release:
   - git tag living-blueprint-complete
   - Document: Main branch now contains only new architecture
```

**Success Criteria:**
- ✅ Zero old component files in codebase (verified via grep)
- ✅ All data flows through tRPC
- ✅ All components are Cells with manifests
- ✅ Ledger is complete and queryable
- ✅ Branch successfully merged to main
- ✅ Post-merge validation passes
- ✅ Main branch contains clean, refactored architecture

**Estimated Duration:** 1 week

---

### 4.5 Migration Timeline

```
Week 1-3:   Epic 1 - Foundation & Pilot Cells Validation
Week 4-6:   Epic 2 - PO Mapping Feature
Week 7-11:  Epic 3 - Project Dashboard
Week 12-13: Epic 4 - Complete Migration
```

**Total Duration:** 13 weeks (~3 months)

**Milestones:**
- ✅ Week 1: New stack proven viable
- ✅ Week 2-3: Pilot Cells validated
- ✅ Week 6: First complete feature migrated
- ✅ Week 11: All features migrated
- ✅ Week 13: Old architecture removed

---

## Part 5: How This Solves Your Stated Problems

### Problem-Solution Matrix

| Problem You Experienced | Root Cause | Living Blueprint Solution |
|------------------------|------------|---------------------------|
| **Component Drift**<br>Agent created new component instead of modifying existing | No way to find existing components | **Ledger**: Agent queries `findCell("waterfall plot")` → instant location<br>**Manifest**: Cell ID is unique and discoverable |
| **Data-UI Desynchronization**<br>Wrong budget version numbers in UI | No type safety between DB and UI | **tRPC + Drizzle**: End-to-end type safety from PostgreSQL to React<br>Compiler catches mismatches before runtime |
| **Implicit Requirement Regression**<br>Waterfall plot lost per-item granularity | Requirements only in conversation history | **Manifest**: `behavioralAssertions` encode requirements in JSON<br>**Pipeline**: Validates assertions have tests before completion |
| **Context Degradation**<br>Long debugging sessions lose focus | Conversational iteration accumulates noise | **Formal Iteration**: Failed attempt → generate report → new clean session<br>Each iteration starts fresh with structured failure context |
| **Ambiguous Prompting**<br>Agent doesn't know where dashboard KPIs are | No semantic index of features | **Ledger**: Agent queries by concept → finds exact Cell ID and path<br>No more "search the codebase" |
| **Lost Behavioral Details**<br>Tooltip requirements forgotten | Implementation details not captured | **Manifest**: Exact tooltip content specified in `behavioralAssertions`<br>Agent reads manifest before any changes |
| **Unclear "Done" Criteria**<br>Agent claims completion prematurely | No objective validation | **Pipeline**: Automated gates define "done"<br>Agent cannot bypass validation |
| **Breaking Changes on Updates**<br>Modifying component breaks other features | No dependency tracking | **Ledger**: `findDependents(apiId)` shows all affected Cells<br>Agent knows impact before changing |

---

## Part 6: Agent Operating Procedures

### 6.1 Standard Agent Workflow

**For Any Development Task:**

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

### 6.2 Agent Commands Reference

**Ledger Queries:**
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
→ [Latest 10 entries]
```

**Manifest Operations:**
```typescript
// Read Cell manifest
manifest.read("budget-waterfall")
→ { dataContract, behavioralAssertions, dependencies, ... }

// Validate manifest
manifest.validate("budget-waterfall")
→ { valid: true, errors: [] }

// Check if assertion has test
manifest.checkAssertion("budget-waterfall", "BA-002")
→ { hasPendingTest: true, testFile: "budget-waterfall.test.tsx" }
```

**Pipeline Execution:**
```typescript
// Run Cell pipeline
pipeline.run("budget-waterfall")
→ {
    passed: false,
    failedGate: "Behavioral Assertions Validation",
    error: "BA-002 has no corresponding test"
  }

// Run specific gate
pipeline.runGate("budget-waterfall", "Type Check")
→ { passed: true }
```

### 6.3 Failure Recovery Protocol

**When Pipeline Fails:**

```typescript
// 1. Generate Failure Report
const report = generateFailureReport({
  cellId: "budget-waterfall",
  failedGate: "Behavioral Assertions Validation",
  attempt: 1,
  changes: ["Modified chart sorting logic"],
  error: "BA-002 test fails - tooltip shows wrong order"
})

// 2. Save report
saveFailureReport(report) 
→ "thoughts/failures/budget-waterfall-attempt-1.json"

// 3. Terminate session
// 4. New session starts with:
{
  originalPrompt: "Sort waterfall chart alphabetically",
  failureReport: report,
  manifest: manifest.read("budget-waterfall"),
  maxAttempts: 3,
  currentAttempt: 2
}
```

**Maximum Iteration Logic:**
```typescript
if (attempt > 3) {
  escalateToHuman({
    cellId,
    failureReports: [attempt1, attempt2, attempt3],
    message: "Unable to resolve after 3 attempts. Human intervention required."
  })
}
```

---

## Part 7: Validation & Success Metrics

### 7.1 Architecture Validation Checklist

**Before Considering Migration Complete:**

- [ ] **Type Safety**
  - [ ] Zero `any` types in components
  - [ ] All tRPC queries return typed data
  - [ ] Drizzle schema matches production database
  - [ ] TypeScript compilation has zero errors

- [ ] **Cell Quality**
  - [ ] All components converted to Cells
  - [ ] Every Cell has `manifest.json`
  - [ ] Every Cell has `pipeline.yaml`
  - [ ] All behavioral assertions have tests
  - [ ] All Cells pass pipeline validation

- [ ] **Ledger Completeness**
  - [ ] All Cells documented in ledger
  - [ ] All API procedures documented
  - [ ] Ledger query functions work correctly
  - [ ] Historical context is preserved

- [ ] **Agent Operability**
  - [ ] Agent can query ledger to find features
  - [ ] Agent can read manifests to understand requirements
  - [ ] Agent can run pipelines to validate work
  - [ ] Formal iteration protocol is functional

### 7.2 Success Metrics

**Quantitative Goals:**

| Metric | Current (Pre-Migration) | Target (Post-Migration) | Measurement Method |
|--------|------------------------|-------------------------|-------------------|
| **Component Drift Incidents** | ~3 per sprint | 0 per sprint | Track: "Created duplicate component" events |
| **Type Safety Coverage** | ~40% (TypeScript adoption) | 100% | Count: `any` types → should be 0 |
| **Implicit Requirements** | 100% (all in conversation) | 0% | Count: Behavioral assertions not in manifests |
| **Feature Location Time** | 5-15 minutes | < 30 seconds | Time from "find X" to "found X" |
| **Debugging Iteration Count** | 5-10 per issue | < 3 per issue | Average iterations to resolve |
| **Pipeline Validation Coverage** | 0% | 100% | Percentage of Cells with passing pipelines |

**Qualitative Goals:**
- **Agent Prompting**: Move from "Find the dashboard KPI component and modify it" to "Update budget-waterfall"
- **Requirement Clarity**: No more "I think it should..." → "Manifest specifies..."
- **Debugging Efficiency**: Replace 20-message debugging threads with 2-iteration cycles
- **Code Confidence**: Agent knows when work is complete (pipeline passes)

---

## Part 8: Risks & Mitigation

### 8.1 Technical Risks

#### Risk 1: Migration Introduces Bugs
**Severity:** High  
**Probability:** Medium  

**Mitigation:**
- Branch isolation keeps main branch stable
- Human validation gate before each cleanup
- Comprehensive testing (pipeline gates) before cleanup
- Git history provides complete rollback capability
- Gradual rollout: one Cell at a time, not big bang

**Contingency:**
- Git revert to any previous commit in branch
- Branch can be abandoned without affecting main
- Each commit is independently reviewable
- Human validation catches issues before cleanup

---

#### Risk 2: Drizzle Schema Doesn't Match Production
**Severity:** Critical  
**Probability:** Low  

**Mitigation:**
- Generate schema using `drizzle-kit introspect`
- Validate schema against production before any migrations
- Use Drizzle migrations for all schema changes
- Test migrations in staging first

**Contingency:**
- Manual schema reconciliation procedure
- Database snapshots before any migration
- Rollback SQL scripts prepared in advance

---

#### Risk 3: Performance Degradation
**Severity:** High  
**Probability:** Low  

**Mitigation:**
- Benchmark old vs new implementations
- tRPC batching for multiple queries
- Supabase Edge Functions are fast (globally distributed)
- Monitor performance during parallel implementation

**Contingency:**
- Performance profiling tools integrated
- Query optimization procedures documented
- Can add caching layer if needed

---

### 8.2 Organizational Risks

#### Risk 4: Team Resistance to Change
**Severity:** Medium  
**Probability:** Medium  

**Mitigation:**
- Clear documentation of "why" (this document)
- Pilot Cell demonstrates value
- Incremental adoption reduces disruption
- Training materials for new architecture

**Contingency:**
- Extended parallel period if needed
- Team feedback incorporated into process
- Can pause migration if major issues arise

---

#### Risk 5: Migration Takes Longer Than Estimated
**Severity:** Medium  
**Probability:** Medium  

**Mitigation:**
- Conservative estimates (13 weeks)
- Epic 2 (pilot) validates estimates early
- Can adjust scope if needed
- Phased approach allows partial delivery

**Contingency:**
- Prioritize high-value features first
- Can pause after Epic 3 or 4 if needed
- Hybrid architecture (some old, some new) is viable

---

### 8.3 Agent-Specific Risks

#### Risk 6: Agents Don't Follow New Protocols
**Severity:** High  
**Probability:** Low  

**Mitigation:**
- Clear agent operating procedures (Part 6)
- Automated validation enforces protocols
- Pipeline gates prevent non-compliant work
- Ledger queries become natural workflow

**Contingency:**
- Agent prompt engineering refinements
- More explicit validation rules
- Human review of initial agent work

---

#### Risk 7: Manifests Become Stale
**Severity:** Medium  
**Probability:** Medium  

**Mitigation:**
- Pipeline validates manifest completeness
- CI/CD fails if manifest doesn't match code
- Agents required to update manifest with code
- Regular manifest audits

**Contingency:**
- Automated manifest generation from code
- Manifest sync detection tools
- Periodic manual reviews

---

## Part 9: Post-Migration Operations

### 9.1 Maintaining the Living Blueprint

**Daily Operations:**
```typescript
// Every code change:
1. Agent queries ledger for Cell location
2. Agent reads manifest for requirements
3. Agent makes changes
4. Agent updates manifest if requirements changed
5. Agent runs pipeline
6. Agent appends ledger entry

// Pipeline failures:
1. Generate failure report
2. Start new session with report
3. Diagnose and correct
4. Maximum 3 iterations
```

**Weekly Maintenance:**
- Review ledger for patterns
- Identify commonly modified Cells
- Check for manifest drift
- Validate pipeline success rates

**Monthly Reviews:**
- Audit ledger completeness
- Review failure reports for systemic issues
- Update agent operating procedures if needed
- Refine Cell template based on learnings

### 9.2 Scaling the Architecture

**As Codebase Grows:**

**More Features → More Cells**
- Ledger scales linearly (append-only)
- Each Cell remains small and focused
- Query performance stays constant

**More Agents → Better Utilization**
- Multiple agents can work on different Cells simultaneously
- No conflicts - Cells are isolated
- Ledger provides coordination

**More Complexity → Better Structure**
- Manifests enforce discipline
- Pipeline prevents quality degradation
- Formal iteration prevents chaos

---

## Part 10: Conclusion & Next Steps

### 10.1 Summary

The **Living Blueprint Architecture** transforms the Cost Management Hub into an AI-optimized codebase through **100% architecture adoption**, addressing the fundamental cognitive limitations of AI agents:

1. **Type-Safe Data Layer** - Eliminates data-UI desynchronization
2. **Smart Component Cells** - Makes requirements explicit and verifiable  
3. **Architectural Ledger** - Provides persistent memory and feature discovery

This architecture is specifically designed for **AI-agentic development** with complete refactor as the goal:
- ✅ 100% Cell adoption - every component migrated, no exceptions
- ✅ Zero parallel implementations - absolute leanness maintained
- ✅ No versioning complexity - clean names only (kpi-card, not kpi-card-v2)
- ✅ No feature flags - direct replacement with git-based rollback
- ✅ Agents instantly locate features via ledger queries
- ✅ Agents understand requirements by reading manifests
- ✅ Agents know when work is complete via pipeline validation
- ✅ Codebase optimized for AI clarity, not human convenience

### 10.2 Decision Gate

**This document requires formal approval before implementation begins.**

**Approval Checklist:**
- [ ] Architecture principles align with project goals
- [ ] Migration timeline is acceptable (13 weeks)
- [ ] Resource allocation approved
- [ ] Risk mitigation strategies are adequate
- [ ] Success metrics are measurable and agreed upon

### 10.3 Next Steps

**Upon Approval:**

**Step 1: Epic 1 Kickoff (Week 1)**
- Set up Turborepo monorepo
- Initialize packages/db, packages/api
- Deploy first tRPC endpoint
- Create ledger infrastructure

**Step 2: Pilot Cell (Week 3)**
- Migrate KPICard to validate architecture
- Refine Cell template
- Update migration playbook

**Step 3: Feature Migration (Week 4-11)**
- Execute Epic 3: PO Mapping
- Execute Epic 4: Project Dashboard
- Capture learnings continuously

**Step 4: Complete Migration (Week 12-13)**
- Remove old architecture
- Finalize documentation
- Conduct retrospective

### 10.4 Document Maintenance

**This document is a living artifact and will be updated:**
- After Epic 2 completes (pilot learnings)
- After each feature migration (capture challenges)
- When agent protocols need refinement
- When new patterns emerge

**Document History:**
- v1.0 (2025-10-01): Initial architecture proposal

---
## Part 11: Development Pitfalls & Prevention

**Context:** Lessons learned from Story 1.3 (PLCommandCenter) implementation incident

### 11.1 Overview

During Story 1.3 implementation, the team encountered 4 critical issues that extended the estimated 2-hour task to 6+ hours. While all issues were ultimately resolved, they exposed gaps in our development workflow and documentation. This section captures these lessons to prevent future occurrences.

**Key Finding:** All issues were **workflow and discipline failures**, not architectural flaws. The Smart Cell architecture remains sound, but requires enhanced development procedures.

### 11.2 Pitfall #1: Infinite Render Loops with React Query

**Severity:** CRITICAL - Hardest to debug, most time-consuming (90 minutes lost)

**Symptom:**
- Component stuck in perpetual loading state
- Network tab shows successful 200 OK responses
- No error messages in console
- React Query status shows `pending` forever
- Data never appears in UI

**Root Cause:**
Unmemoized objects/arrays passed to React hooks create new references on every render, causing React Query to think the query key changed, abandoning the previous query and starting a new one infinitely.

**Example of Bug:**
```typescript
// ❌ WRONG - Creates new Date objects every render (milliseconds differ)
function PLCommandCenter({ projectId }: Props) {
  const { data } = trpc.getPLTimeline.useQuery({
    projectId,
    dateRange: {
      from: new Date(new Date().setMonth(new Date().getMonth() - 6)),
      to: new Date(new Date().setMonth(new Date().getMonth() + 6)),
    },
  })
  // ^ Every render creates new Date objects with different milliseconds
  // React Query sees: 2025-10-02T16:26:30.600Z vs 2025-10-02T16:26:30.601Z
  // Treats as different queries → infinite loop
}
```

**How to Fix:**
```typescript
// ✅ CORRECT - Memoized, stable reference across renders
function PLCommandCenter({ projectId }: Props) {
  const dateRange = useMemo(() => {
    const now = new Date()
    const from = new Date(now)
    from.setMonth(from.getMonth() - 6)
    from.setHours(0, 0, 0, 0) // Normalize time to prevent millisecond drift
    
    const to = new Date(now)
    to.setMonth(to.getMonth() + 6)
    to.setHours(23, 59, 59, 999)
    
    return { from, to }
  }, []) // Empty deps = memoized once, never recreated

  const { data } = trpc.getPLTimeline.useQuery({
    projectId,
    dateRange, // ✅ Stable reference
  })
}
```

**Prevention Strategy:**
1. **ALWAYS memoize** complex objects/arrays passed to hooks:
   - `useQuery` inputs
   - `useEffect` dependencies
   - `useMemo` dependencies
   - `useCallback` dependencies

2. **Debugging checklist** when component won't load:
   ```yaml
   - [ ] Check Network tab: Are requests succeeding? (200 OK?)
   - [ ] Check Console: Is React Query status stuck on 'pending'?
   - [ ] Add console.log for query inputs - do they change every render?
   - [ ] Wrap all object/array inputs in useMemo
   ```

3. **Mandatory review:** Before committing Cell code, verify ALL hook inputs are memoized

**Detection:**
```typescript
// Add defensive logging during development
const dateRange = useMemo(() => {
  const range = { from: new Date(), to: new Date() }
  console.log('[PLCommandCenter] dateRange created:', range)
  return range
}, [])
// If you see this log on EVERY render → you have an infinite loop
```

---

### 11.3 Pitfall #2: Date Serialization Over HTTP

**Severity:** HIGH - Causes 400 Bad Request errors (45 minutes lost)

**Symptom:**
- tRPC queries return 400 Bad Request
- Zod validation errors in console
- Error message: "Expected date, received string"
- Network tab shows request payload has ISO date strings

**Root Cause:**
JavaScript Date objects cannot be sent over HTTP. tRPC automatically serializes Date → ISO string on the client, but if the Zod schema expects `z.date()`, validation fails on the server.

**Example of Bug:**
```typescript
// ❌ WRONG - Schema expects Date object, but HTTP sends string
export const dashboardRouter = router({
  getPLTimeline: publicProcedure
    .input(z.object({
      projectId: z.string().uuid(),
      dateRange: z.object({
        from: z.date(),  // ❌ This expects Date object
        to: z.date(),    // ❌ But receives "2025-10-02T00:00:00Z" string
      })
    }))
    .query(async ({ input }) => { /* ... */ })
})

// Client sends:
// { dateRange: { from: "2025-10-02T00:00:00Z", to: "2025-10-02T23:59:59Z" } }
// Server schema expects Date objects → Zod rejects → 400 Bad Request
```

**How to Fix:**
```typescript
// ✅ CORRECT - Accept strings, transform to Date objects
export const dashboardRouter = router({
  getPLTimeline: publicProcedure
    .input(z.object({
      projectId: z.string().uuid(),
      dateRange: z.object({
        from: z.string().transform((val) => new Date(val)),
        to: z.string().transform((val) => new Date(val)),
      })
    }))
    .query(async ({ input }) => {
      // input.dateRange.from is now a Date object
      // input.dateRange.to is now a Date object
    })
})
```

**Prevention Strategy:**

1. **ALWAYS use `z.string().transform()` for dates** in tRPC input schemas
2. **Test procedures via curl BEFORE writing client code:**
   ```bash
   # Test with ISO string dates
   curl -X POST https://your-edge-function.supabase.co/trpc/getPLTimeline \
     -d '{"projectId":"uuid","dateRange":{"from":"2025-10-02T00:00:00Z","to":"2025-12-31T23:59:59Z"}}'
   
   # If this succeeds, your schema is correct
   ```

3. **Pattern to follow:**
   ```typescript
   // Date inputs: ALWAYS z.string().transform()
   // Date outputs: Return ISO strings or Date objects (both work)
   
   input: z.object({
     date: z.string().transform(val => new Date(val)),
     dateRange: z.object({
       from: z.string().transform(val => new Date(val)),
       to: z.string().transform(val => new Date(val)),
     })
   })
   ```

**Reference Implementation:**
See `supabase/functions/trpc/index.ts::getPLTimeline` for correct pattern.

---

### 11.4 Pitfall #3: SQL Syntax Confusion Across Query Builders

**Severity:** MEDIUM - Breaks edge function queries (20 minutes lost)

**Symptom:**
- Edge function throws SQL syntax errors
- Queries return no results when data exists
- PostgreSQL error messages about invalid syntax

**Root Cause:**
Mixing mental models between different SQL query builders:
- **Drizzle ORM** - TypeScript-first query builder
- **Raw SQL** - Template literals with `sql` tag
- **postgres package** - Used in Supabase Edge Functions

**Example of Bug:**
```typescript
// ❌ WRONG - Mixing raw SQL syntax with Drizzle
import { sql } from 'drizzle-orm'

const costBreakdownIds = [1, 2, 3]

const mappings = await db
  .select()
  .from(poMappings)
  .where(sql`${poMappings.costBreakdownId} = ANY(${costBreakdownIds})`)
  // ❌ ANY() is PostgreSQL syntax, not compatible with Drizzle's sql tag
```

**How to Fix:**
```typescript
// ✅ CORRECT - Use Drizzle's helper functions
import { inArray } from 'drizzle-orm'

const costBreakdownIds = [1, 2, 3]

const mappings = await db
  .select()
  .from(poMappings)
  .where(inArray(poMappings.costBreakdownId, costBreakdownIds))
  // ✅ Drizzle's inArray() handles the SQL generation correctly
```

**Prevention Strategy:**

1. **ALWAYS reference existing working procedures** before writing new queries
   - See: `supabase/functions/trpc/index.ts::getKPIMetrics` for patterns
   - Copy query structure, modify for your use case

2. **Use Drizzle helper functions:**
   ```typescript
   // Common patterns:
   import { eq, inArray, and, or, gt, lt, between } from 'drizzle-orm'
   
   // Single condition
   .where(eq(table.column, value))
   
   // Multiple values
   .where(inArray(table.column, [val1, val2, val3]))
   
   // Multiple conditions
   .where(and(
     eq(table.col1, val1),
     gt(table.col2, val2)
   ))
   
   // Date ranges
   .where(between(table.date, fromDate, toDate))
   ```

3. **Test queries in Supabase SQL Editor FIRST:**
   - Write raw SQL to verify logic
   - Then translate to Drizzle syntax
   - Reference Drizzle docs for helper functions

**Reference:**
- Drizzle ORM docs: https://orm.drizzle.team/docs/select
- Existing working queries: `supabase/functions/trpc/index.ts`

---

### 11.5 Pitfall #4: Infrastructure Confusion

**Severity:** MEDIUM - Can break existing features (30 minutes lost)

**Symptom:**
- Existing working features suddenly break (e.g., KPICard)
- tRPC client can't reach endpoints
- Environment variables pointing to wrong URLs

**Root Cause:**
Not understanding existing infrastructure setup, attempting to recreate what already exists (e.g., creating local API route when Supabase Edge Function already deployed).

**Example of Bug:**
Story 1.3 attempted to create a local Next.js API route instead of adding procedures to the existing Supabase Edge Function, which:
- Broke the working KPICard component (changed `NEXT_PUBLIC_TRPC_URL`)
- Added unnecessary complexity
- Violated the established pattern

**How to Fix:**
```typescript
// ✅ CORRECT - Add to existing edge function
// File: supabase/functions/trpc/index.ts

// Import existing router
import { router } from './trpc-setup'
import { dashboardRouter } from './routers/dashboard'

// Add new procedures to existing dashboard router
export const appRouter = router({
  dashboard: dashboardRouter, // Already exists
  // Just add procedures to dashboardRouter, don't create new infrastructure
})
```

**Prevention Strategy:**

1. **MANDATORY Task 0: Review Existing Patterns**
   ```yaml
   Before ANY implementation:
   - [ ] Query ledger for similar Cells
   - [ ] Review referenced Cell code
   - [ ] Check existing tRPC routers (what procedures exist?)
   - [ ] Verify edge function deployment status
   - [ ] Confirm environment variables point to correct endpoints
   - [ ] DO NOT recreate infrastructure that already exists
   ```

2. **Check before creating:**
   - New tRPC router? → Check if router already exists
   - New edge function? → Check if edge function deployed
   - New package? → Check if package already exists
   - **Default assumption: It probably exists, find it first**

3. **Reference checklist:**
   ```yaml
   - [ ] Existing edge function: supabase/functions/trpc/
   - [ ] Existing tRPC routers: supabase/functions/trpc/index.ts
   - [ ] Existing procedures: Check dashboardRouter
   - [ ] Environment variables: .env.local, .env.example
   - [ ] Deployment status: Check Supabase dashboard
   ```

---

### 11.6 Debugging Workflow for Async Issues

**When components won't load or queries fail:**

**Step 1: Check Network Tab (ALWAYS FIRST)**
```yaml
Questions to answer:
- [ ] Are requests being sent?
- [ ] What status codes? (200 OK = server success, 4xx/5xx = server error)
- [ ] What is the request payload?
- [ ] What is the response payload?
- [ ] How long do requests take?
```

**Step 2: Check Console Logs**
```yaml
Questions to answer:
- [ ] What is React Query status? (pending/success/error)
- [ ] Are there error messages?
- [ ] Are query inputs logged correctly?
- [ ] Any warnings or exceptions?
```

**Step 3: Isolate Client vs Server**
```yaml
If Network = 200 OK but UI stuck loading:
  → Issue is CLIENT-SIDE (React Query, memoization, rendering)
  → Check: Are inputs memoized? Is component re-rendering infinitely?

If Network = 4xx/5xx errors:
  → Issue is SERVER-SIDE (edge function, database, validation)
  → Check: Test procedure via curl, check Zod schemas, check SQL queries
```

**Step 4: Use Supabase CLI for Database Verification**
```bash
# Connect to database
supabase db connect

# Run query directly to verify data
SELECT * FROM cost_breakdown WHERE project_id = 'your-uuid';

# Check if query returns expected results
# Compare with what tRPC procedure is doing
```

**Step 5: Add Defensive Logging**
```typescript
// In component
const { data, status, error } = trpc.getPLMetrics.useQuery(input)

console.log('[Component] Query state:', {
  status,        // pending/success/error
  hasData: !!data,
  error: error?.message,
  input          // Check if input changes every render
})

// In tRPC procedure
.query(async ({ input }) => {
  console.log('[getPLMetrics] Called with:', input)
  const result = await db.query(...)
  console.log('[getPLMetrics] Result:', result)
  return result
})
```

**Step 6: Generate Failure Report (After 30 min debugging)**
If you can't resolve in 30 minutes:
1. Document symptoms, steps taken, hypotheses
2. Create failure report
3. Start new session with clean context
4. Maximum 3 attempts before escalating to human

---

### 11.7 Mandatory Checklists for Cell Development

**Pre-Implementation Checklist:**
```yaml
Before writing ANY code:
- [ ] Query ledger for reference Cells with similar complexity
- [ ] Review reference Cell implementation (copy successful patterns)
- [ ] Identify ALL tRPC procedures needed
- [ ] Test EACH procedure via curl (verify responses work)
- [ ] Verify existing infrastructure (don't recreate what exists)
- [ ] Read "Development Pitfalls" section (this section)
```

**During Implementation Checklist:**
```yaml
While writing code:
- [ ] Memoize ALL objects/arrays passed to hooks (useMemo required)
- [ ] Use z.string().transform() for dates (NOT z.date())
- [ ] Reference existing working procedures for SQL patterns
- [ ] Add defensive logging for all query states
- [ ] Test queries independently before integration
- [ ] Keep component under size limit (< 200 lines simple, < 300 complex)
```

**Validation Checklist:**
```yaml
Before marking complete:
- [ ] Check Network tab: All requests successful (200 OK)
- [ ] Check Console: Query states correct (not stuck on pending)
- [ ] Use Supabase CLI: Verify database queries return correct data
- [ ] Compare calculations: 100% parity with old implementation
- [ ] Measure performance: ≤110% of baseline
- [ ] Run all tests: 80%+ coverage, all behavioral assertions tested
- [ ] Verify cleanup: Old component deleted, no references remain
```

---

## Part 12: 100% Adoption Strategy

### 12.1 The Ultimate Goal

**Vision:** A codebase where AI agents operate at peak efficiency because:
- Every UI component is a Cell with manifest
- Every API call goes through tRPC
- Every data query uses Drizzle
- Every feature is documented in the ledger
- Zero legacy code remains

**This is not gradual addition - it is complete replacement.**

### 12.2 Adoption Metrics

**Current State (Pre-Migration):**
- Cell adoption: 0%
- tRPC adoption: 0%
- Type safety: ~40%
- Parallel implementations: N/A (no migration started)

**Target State (Post-Migration):**
- Cell adoption: 100%
- tRPC adoption: 100%
- Type safety: 100%
- Parallel implementations: 0% (all old code deleted)

**Tracking:**
- After each epic, calculate: (Cells / Total Components) × 100
- After each story, verify: Old component deleted? (Yes/No)
- Final validation: grep -r "components/dashboard" → should return 0 results

### 12.3 Non-Negotiable Rules

1. **No Hybrid Architecture**: Never acceptable to have some Cells and some old components long-term
2. **No Versioning**: Cell names never include v1, v2, etc.
3. **No Feature Flags**: Only acceptable during single story implementation, deleted before commit
4. **No Parallel Implementations**: Old code deleted in same story as new Cell creation
5. **No Exceptions**: Every component must migrate - no "too complex" or "too risky" excuses

### 12.4 Validation Gates

**Per Story:**
- [ ] Old component deleted?
- [ ] Grep returns zero references to old component?
- [ ] No version suffixes in Cell names?
- [ ] No feature flags committed?

**Per Epic:**
- [ ] All stories in epic follow deletion pattern?
- [ ] Cell adoption percentage increased?
- [ ] No regressions in test suite?

**Final (Pre-Main Merge):**
- [ ] 100% Cell adoption achieved?
- [ ] Zero old component files remain?
- [ ] Zero direct Supabase queries in components?
- [ ] All data flows through tRPC?
- [ ] Ledger contains all Cells?

### 12.5 Success Definition

**The migration is complete when:**
1. `/components/dashboard` directory is empty (deleted)
2. `/components/cells` directory contains all UI components
3. All tRPC routers handle all data fetching
4. All components have manifests and pipelines
5. Ledger contains complete history
6. grep -r "supabase.from" apps/web/components → returns 0 results
7. grep -r "v1\|v2\|v3" apps/web/components/cells → returns 0 results
8. AI agents can develop new features 3x faster than on old codebase

**Anything less than 100% is considered incomplete.**

---

## Part 13: Complex Cell Development Strategy

**Context:** Lessons from Story 1.3 - multi-query Cells require phased implementation

### 13.1 Cell Complexity Classification

**Simple Cells (1-2 queries):**
- Example: KPICard - single `getPLMetrics` query
- Low risk, straightforward implementation
- Follow standard Cell development workflow
- Estimated time: 2-4 hours

**Complex Cells (3+ queries, multiple data sources):**
- Example: PLCommandCenter - 3 separate queries (metrics, timeline, promise dates)
- Higher risk, requires phased implementation
- Follow enhanced validation workflow (see below)
- Estimated time: 6-8 hours

### 13.2 Phased Implementation for Complex Cells

**DO NOT attempt "big bang" migration with multiple untested queries.**

**Phase 1: Infrastructure Validation (BEFORE any Cell code)**

```yaml
- [ ] Design all tRPC procedures needed
- [ ] Implement procedures in edge function
- [ ] Test EACH procedure independently via curl:
      curl -X POST https://your-function.supabase.co/trpc/getPLMetrics \
        -d '{"projectId":"test-uuid"}'
- [ ] Verify each procedure returns expected data
- [ ] Document test data and expected outputs
- [ ] Use Supabase CLI to verify database queries
- [ ] Deploy edge function ONCE with all procedures
```

**Phase 2: Incremental Cell Development**

```yaml
Step 1: Create Cell skeleton (no queries):
  - [ ] Create Cell directory structure
  - [ ] Create component.tsx with loading/error states ONLY
  - [ ] Create state.ts (if needed)
  - [ ] Create manifest.json with behavioral assertions
  - [ ] Create pipeline.yaml
  - [ ] Verify component renders (shows loading state)

Step 2: Add FIRST query:
  - [ ] Add first tRPC query (simplest one)
  - [ ] Memoize all query inputs
  - [ ] Test query in isolation
  - [ ] Verify data displays correctly
  - [ ] Check Network tab (200 OK?)
  - [ ] Check Console (success state?)
  - [ ] COMMIT checkpoint (can rollback to this)

Step 3: Add SECOND query:
  - [ ] Add second tRPC query
  - [ ] Memoize all query inputs
  - [ ] Verify both queries work together
  - [ ] Check for race conditions
  - [ ] Test loading states for both queries
  - [ ] COMMIT checkpoint

Step 4: Add THIRD query (if needed):
  - [ ] Add third tRPC query
  - [ ] Memoize all query inputs
  - [ ] Verify all three queries work together
  - [ ] Verify tRPC batching (single HTTP request)
  - [ ] Test all permutations (loading, error, success)
  - [ ] COMMIT checkpoint

NEVER skip validation between queries.
```

**Phase 3: Calculation Validation (CRITICAL)**

```yaml
- [ ] Test old component in browser
- [ ] Record ALL calculations in spreadsheet:
      - Metric 1: [value]
      - Metric 2: [value]
      - Calculation formulas documented
- [ ] Test new Cell in browser
- [ ] Record ALL calculations from new Cell
- [ ] Compare side-by-side (MUST be 100% match)
- [ ] If mismatch found:
      - [ ] Use Supabase CLI to query database directly
      - [ ] Determine which implementation is correct
      - [ ] Debug and fix incorrect implementation
      - [ ] Re-validate until 100% parity achieved
```

**Phase 4: Performance Validation**

```yaml
- [ ] Measure old component (Chrome DevTools Performance tab):
      - Record 5 samples
      - Calculate average Time to Interactive (TTI)
      - Document baseline: Avg TTI = ___ ms
- [ ] Measure new Cell (same methodology):
      - Record 5 samples
      - Calculate average TTI
      - Document: New TTI = ___ ms
- [ ] Compare: New TTI ≤ 110% of baseline
- [ ] If performance fails:
      - [ ] Check tRPC batching (queries combined?)
      - [ ] Profile with React DevTools Profiler
      - [ ] Add React.memo if excessive re-renders
      - [ ] Check network waterfall for bottlenecks
      - [ ] Re-measure after optimization
```

**Phase 5: Cleanup (Only after ALL validations pass)**

```yaml
Prerequisites:
  - [x] Calculation validation: 100% parity ✅
  - [x] Performance validation: ≤110% baseline ✅
  - [x] All tests passing ✅
  - [x] Human approval received ✅

Actions:
  - [ ] Delete old component file
  - [ ] Update all imports to use new Cell
  - [ ] Verify no references remain (grep)
  - [ ] Update ledger with replacement entry
  - [ ] Run all tests one final time
  - [ ] Commit: "Story X.Y: [Component] Cell migration - complete"
```

### 13.3 Risk Management for Complex Cells

**Rollback Checkpoints:**

Create git commits at each phase:
```bash
# After Phase 1
git commit -m "Story 1.3: tRPC procedures deployed and tested"

# After Phase 2.2
git commit -m "Story 1.3: Cell with first query working"

# After Phase 2.3
git commit -m "Story 1.3: Cell with two queries working"

# After Phase 3
git commit -m "Story 1.3: Calculation validation passed"

# After Phase 4
git commit -m "Story 1.3: Performance validation passed"

# After Phase 5
git commit -m "Story 1.3: Cleanup complete - old component deleted"
```

**If issues arise:** `git reset --hard` to last working checkpoint

**Maximum Iteration Protocol:**
- Attempt 1 fails → Generate failure report, new session
- Attempt 2 fails → Generate detailed failure report, new session  
- Attempt 3 fails → ESCALATE TO HUMAN
- Never exceed 3 attempts per phase

**Escalation Criteria:**
- Calculation parity cannot be achieved (values don't match)
- Performance degradation >10% cannot be optimized
- Unexpected architectural issues discovered
- Component exceeds size limit (>300 lines) and cannot be refactored

### 13.4 When to Use Simple vs Complex Cell Approach

**Use Simple Cell Approach When:**
- Cell needs 1-2 tRPC queries
- Queries are independent (no complex aggregations)
- Component is straightforward (< 200 lines)
- No complex calculations required
- Low risk tolerance

**Use Complex Cell Approach When:**
- Cell needs 3+ tRPC queries
- Queries depend on each other or require aggregation
- Component has complex business logic
- High-value dashboard KPI component
- Requires careful validation

**Example Decision Matrix:**

| Component | Queries | Complexity | Approach |
|-----------|---------|------------|----------|
| KPICard | 1 | Low | Simple Cell (2-4 hours) |
| BudgetChart | 2 | Low | Simple Cell (3-5 hours) |
| PLCommandCenter | 3 | High | Complex Cell (6-8 hours) |
| Dashboard Summary | 5 | Very High | Complex Cell + phased (8-12 hours) |

### 13.5 Success Criteria for Complex Cells

**Before marking story complete:**

```yaml
Technical Validation:
  - [ ] All tRPC procedures tested independently via curl
  - [ ] All queries work correctly in Cell
  - [ ] tRPC batching confirmed (single HTTP request for parallel queries)
  - [ ] All calculations match old implementation (100% parity)
  - [ ] Performance meets target (≤110% baseline)
  - [ ] All tests passing (80%+ coverage)
  - [ ] Component size within limit (< 300 lines)

Process Validation:
  - [ ] All phases completed in sequence (no skipping)
  - [ ] Git commits created at each checkpoint
  - [ ] Calculation spreadsheet documented
  - [ ] Performance measurements documented
  - [ ] Human validation received
  - [ ] Old component deleted
  - [ ] Ledger updated

Quality Validation:
  - [ ] All behavioral assertions have tests
  - [ ] Loading states work correctly
  - [ ] Error states work correctly
  - [ ] Empty states work correctly
  - [ ] Type safety end-to-end verified
  - [ ] No TypeScript errors
  - [ ] Pipeline validation passes
```

**Only when ALL criteria met:** Proceed to cleanup and commit.

---

## Appendix A: Reference Documentation

### A.1 Technology Stack

**Core Technologies:**
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety throughout
- **Turborepo** - Monorepo build system
- **tRPC** - End-to-end type-safe APIs
- **Drizzle ORM** - Type-safe database access
- **Supabase** - PostgreSQL hosting + Edge Functions
- **TanStack Query** - Client-side data fetching
- **Zustand** - Lightweight state management
- **Zod** - Runtime validation

**Testing & Validation:**
- **Vitest** - Unit testing
- **Playwright** - E2E testing
- **axe-core** - Accessibility testing
- **TypeScript** - Compile-time validation

### A.2 Key Concepts Glossary

**Cell**: A self-contained, self-documenting UI unit with explicit requirements

**Manifest**: Machine-readable contract defining Cell behavior and requirements

**Pipeline**: Automated validation gates that define "done" criteria

**Ledger**: Append-only history of all development decisions

**Behavioral Assertion**: Explicit requirement encoded in manifest.json

**Formal Iteration**: Structured debugging cycle that prevents context degradation

**Type Contract**: Compile-time guarantee of data shape from DB to UI

---

## Appendix B: Agent Prompt Templates

### B.1 Feature Location Prompt
```
Query the ledger to find the Cell for [feature description].
Return the Cell ID and path.

Example:
Input: "waterfall plot showing budget variance"
Output: {
  cellId: "budget-waterfall",
  path: "components/cells/budget-waterfall"
}
```

### B.2 Cell Modification Prompt
```
1. Query ledger: ledger.findCell("[feature]")
2. Read manifest: manifest.read([cellId])
3. Review behavioral assertions
4. Make changes to component.tsx
5. Update manifest.json if requirements changed
6. Run pipeline: pipeline.run([cellId])
7. If pipeline fails → generate failure report
8. Append ledger entry with changes
```

### B.3 Failure Recovery Prompt
```
You are in iteration attempt [N] of 3.

Previous attempt failed with:
- Failed gate: [gate name]
- Error: [error message]
- Root cause: [diagnosed cause]

Your task:
1. Read the failure report carefully
2. Identify what was tried and didn't work
3. Propose a different approach
4. Implement and test
5. If fails again, generate new failure report

Do not repeat the same approach.
```

### B.4 Cell Migration Story Template
```
## Story X.Y: Migrate [ComponentName] to Cell

**Context:** Working in `codebase-modernization` branch

**Tasks:**

Phase 1 - Implementation:
1. Create Cell structure in components/cells/[component-name]/
2. Write manifest.json with behavioral assertions
3. Write pipeline.yaml with validation gates
4. Implement component.tsx with tRPC integration
5. Write comprehensive tests (80%+ coverage)
6. Run pipeline validation → all gates must pass

Phase 2 - Human Validation Gate:
7. Request human validation: "Implementation complete. Please validate:"
   - Run: npm run dev
   - Test: [specific scenarios to verify]
8. Wait for human decision: "Validated - proceed with cleanup" or "Fix issues"

Phase 3 - Cleanup (Only after human approval):
9. Delete old component file: [path/to/old-component.tsx]
10. Update imports in all consuming files
11. Remove any feature flag code (if present)
12. Verify no references: grep -r "[old-component-name]" apps/web/
13. Run all tests again to ensure nothing broke

Phase 4 - Commit:
14. Update ledger.jsonl with replacement entry
15. Commit: "Story X.Y: [ComponentName] Cell migration + cleanup"
16. Verify: Read codebase to confirm old component deleted

**Acceptance Criteria:**
- ✅ New Cell passes all pipeline gates
- ✅ Behavioral assertions have corresponding tests
- ✅ Human validation confirms correct behavior
- ✅ Old component deleted from codebase
- ✅ No references to old component (verified via grep)
- ✅ Ledger documents replacement
- ✅ All tests pass after cleanup
- ✅ Commit contains only new Cell (clean state)

**Agent Instructions:**
- STOP after Phase 1 and request human validation
- NEVER proceed to Phase 3 without explicit approval
- ALWAYS verify deletion completeness before committing
- Each commit must represent clean state (no parallel implementations)
```

---

## Appendix C: Cell Development Checklist

**Comprehensive checklist for ALL Cell development - print and follow**

### C.1 Pre-Implementation Phase

**Story Preparation:**
```yaml
- [ ] Read story requirements completely
- [ ] Verify prerequisites complete (if any)
- [ ] Check for dependency on previous stories
- [ ] Review reference implementations (query ledger)
- [ ] Estimate complexity (Simple vs Complex Cell)
```

**Pattern Review (MANDATORY - Task 0):**
```yaml
- [ ] Query ledger for similar Cells:
      ledger.findCell("[similar feature]")
- [ ] Read reference Cell code:
      - Component structure
      - tRPC query patterns
      - Testing approach
      - Memoization patterns
- [ ] Review existing tRPC procedures:
      supabase/functions/trpc/index.ts
- [ ] Verify infrastructure setup:
      - Edge function deployed?
      - Environment variables correct?
      - tRPC client configured?
- [ ] Document key learnings to apply
```

**Infrastructure Verification:**
```yaml
- [ ] Edge function exists: supabase/functions/trpc/
- [ ] tRPC routers location: Check index.ts
- [ ] Database schemas: packages/db/src/schema/
- [ ] Environment variables: .env.local has NEXT_PUBLIC_TRPC_URL
- [ ] Confirm: Do NOT recreate existing infrastructure
```

### C.2 Implementation Phase

**Phase 1: tRPC Procedures (Complex Cells Only)**

```yaml
Procedure Design:
- [ ] List ALL procedures needed
- [ ] Design input schemas (use z.string().transform() for dates!)
- [ ] Design output schemas
- [ ] Reference existing procedure patterns

Procedure Implementation:
- [ ] Add procedure to existing router (don't create new router)
- [ ] Use Drizzle helper functions (eq, inArray, between)
- [ ] Add Zod validation for inputs
- [ ] Add TRPCError handling
- [ ] Add console.log for debugging

Procedure Testing (BEFORE client code):
- [ ] Test via curl with sample data
- [ ] Verify response structure matches schema
- [ ] Test error cases (invalid inputs)
- [ ] Use Supabase CLI to verify database queries
- [ ] Document test data for future reference

Deployment:
- [ ] Deploy edge function: supabase functions deploy trpc
- [ ] Verify deployment successful
- [ ] Test deployed endpoint via curl
```

**Phase 2: Cell Structure**

```yaml
Directory Setup:
- [ ] Create: apps/web/components/cells/[cell-name]/
- [ ] Use kebab-case for directory (e.g., pl-command-center)
- [ ] No version suffixes (e.g., NOT kpi-card-v2)

Files to Create:
- [ ] component.tsx - React component
- [ ] state.ts - Zustand store (if needed)
- [ ] manifest.json - Behavioral assertions
- [ ] pipeline.yaml - Validation gates
- [ ] __tests__/component.test.tsx - Test file
```

**Phase 3: Component Implementation**

```yaml
Component Skeleton:
- [ ] Create basic component structure
- [ ] Add loading state UI
- [ ] Add error state UI
- [ ] Add empty state UI (if applicable)
- [ ] Verify skeleton renders

Query Integration (Simple Cells):
- [ ] Import tRPC client
- [ ] Add query hook(s)
- [ ] MEMOIZE all object/array inputs (useMemo)
- [ ] Add defensive console.logging
- [ ] Test query works
- [ ] Verify Network tab (200 OK)
- [ ] Verify Console (success state)

Query Integration (Complex Cells - INCREMENTAL):
- [ ] Add FIRST query only
      - [ ] Memoize inputs
      - [ ] Test in isolation
      - [ ] Verify data displays
      - [ ] COMMIT checkpoint
- [ ] Add SECOND query
      - [ ] Memoize inputs
      - [ ] Test both queries together
      - [ ] Check for race conditions
      - [ ] COMMIT checkpoint
- [ ] Add THIRD query (if needed)
      - [ ] Memoize inputs
      - [ ] Test all queries together
      - [ ] Verify tRPC batching
      - [ ] COMMIT checkpoint

Memoization Checklist (CRITICAL):
- [ ] All Date objects in useMemo
- [ ] All object literals in useMemo
- [ ] All array literals in useMemo
- [ ] All computed values in useMemo or useCallback
- [ ] No inline object/array creation in hook dependencies

Component Size:
- [ ] Check line count: component.tsx
- [ ] If > 250 lines: Extract formatters to lib/
- [ ] If > 280 lines: Extract calculations to lib/
- [ ] If > 300 lines: HALT - refactor required
- [ ] Target: < 200 lines (simple), < 300 lines (complex)

Code Quality:
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Clear variable names
- [ ] Comments for complex logic
- [ ] Accessibility attributes (aria-labels)
```

**Phase 4: Manifest & Pipeline**

```yaml
manifest.json:
- [ ] Set unique ID (kebab-case, no version suffix)
- [ ] Set version (semver: "1.0.0")
- [ ] Write description
- [ ] Define dataContract (list all tRPC procedures)
- [ ] Write behavioral assertions:
      - [ ] Each assertion has unique ID (BA-001, BA-002...)
      - [ ] Each assertion is testable
      - [ ] Each assertion has validation method
      - [ ] Each assertion has criticality (high/medium/low)
- [ ] List dependencies (UI components, state, APIs)
- [ ] Add accessibility requirements
- [ ] Add metadata (createdBy ledger iteration ID)

pipeline.yaml:
- [ ] Add Type Check gate
- [ ] Add Lint gate
- [ ] Add Unit Tests gate (80% coverage threshold)
- [ ] Add Behavioral Assertions Validation gate
- [ ] Add Build Check gate
- [ ] Define success criteria
```

### C.3 Testing Phase

```yaml
Test Setup:
- [ ] Create __tests__/component.test.tsx
- [ ] Import testing utilities (@testing-library/react)
- [ ] Mock tRPC client (vi.mock)
- [ ] Set up test data fixtures

Behavioral Assertion Tests (REQUIRED):
- [ ] Write test for each BA-XXX from manifest
- [ ] Include BA ID in test name or comment
- [ ] Test exact requirement (not implementation)
- [ ] Use meaningful assertions

State Tests:
- [ ] Test loading state (isLoading=true)
- [ ] Test error state (error present)
- [ ] Test success state (data present)
- [ ] Test empty state (data empty array)

Calculation Tests (if applicable):
- [ ] Test percentage calculations
- [ ] Test currency formatting
- [ ] Test date formatting
- [ ] Test aggregation logic
- [ ] Use known data sets

Coverage:
- [ ] Run: pnpm test --coverage
- [ ] Verify: Coverage ≥ 80%
- [ ] All behavioral assertions tested
- [ ] All conditional rendering tested
```

### C.4 Validation Phase

**Network Validation:**
```yaml
- [ ] Open Chrome DevTools → Network tab
- [ ] Trigger Cell render
- [ ] Check: Requests sent to edge function?
- [ ] Check: Status codes all 200 OK?
- [ ] Check: Response payloads correct structure?
- [ ] Check: Request batching working? (single HTTP request for multiple queries)
```

**Console Validation:**
```yaml
- [ ] Open Chrome DevTools → Console tab
- [ ] Check: No errors or warnings?
- [ ] Check: React Query status = 'success'?
- [ ] Check: Defensive logs show correct data?
- [ ] Check: No infinite re-render warnings?
```

**Calculation Validation (CRITICAL for Complex Cells):**
```yaml
- [ ] Open old component in browser
- [ ] Record ALL displayed values in spreadsheet
- [ ] Document calculation formulas
- [ ] Open new Cell in browser
- [ ] Record ALL displayed values from new Cell
- [ ] Compare side-by-side (MUST be 100% match)
- [ ] If mismatch:
      - [ ] Use Supabase CLI to query database
      - [ ] Determine which implementation is correct
      - [ ] Fix incorrect implementation
      - [ ] Re-validate until 100% parity
```

**Performance Validation (CRITICAL):**
```yaml
- [ ] Measure old component:
      - [ ] Open Chrome DevTools → Performance tab
      - [ ] Record page load (5 samples)
      - [ ] Calculate average Time to Interactive
      - [ ] Document: Baseline TTI = ___ ms
- [ ] Measure new Cell:
      - [ ] Same methodology (5 samples)
      - [ ] Calculate average TTI
      - [ ] Document: New TTI = ___ ms
- [ ] Compare: New TTI ≤ 110% of baseline
- [ ] If fails:
      - [ ] Profile with React DevTools Profiler
      - [ ] Check for excessive re-renders
      - [ ] Verify tRPC batching
      - [ ] Optimize and re-measure
```

**Pipeline Validation:**
```yaml
- [ ] Run: pnpm type-check (no errors)
- [ ] Run: pnpm lint (no warnings)
- [ ] Run: pnpm test (all tests pass)
- [ ] Run: pnpm build (build succeeds)
- [ ] Run: cell-validator validate [cell-path]
- [ ] All gates: PASS
```

### C.5 Integration Phase

```yaml
Page Integration:
- [ ] Update page file imports
- [ ] Remove old component import
- [ ] Add new Cell import
- [ ] Remove old data fetching logic (if applicable)
- [ ] Update JSX to use new Cell
- [ ] Pass only projectId prop (Cell fetches own data)

Manual Browser Testing:
- [ ] Run: pnpm dev
- [ ] Navigate to page with Cell
- [ ] Verify Cell displays correctly
- [ ] Test loading states (hard refresh)
- [ ] Test error states (break edge function temporarily)
- [ ] Verify all features work
- [ ] Check mobile responsiveness

Final Test Run:
- [ ] Run ALL tests: pnpm test
- [ ] Run type check: pnpm type-check
- [ ] Run build: pnpm build
- [ ] All MUST pass before cleanup
```

### C.6 Human Validation Gate (MANDATORY for Complex Cells)

```yaml
Request Human Validation:
- [ ] Agent: "Implementation complete. Request human validation."
- [ ] Provide checklist for human to verify:
      - [ ] Component displays correctly
      - [ ] All metrics/data visible
      - [ ] Loading states work
      - [ ] Error handling works
      - [ ] Calculations appear correct
      - [ ] No console errors

Wait for Human Decision:
- [ ] Human confirms: "Validated - proceed with cleanup" ✅
      → Proceed to Cleanup Phase
- [ ] Human rejects: "Fix issues" ❌
      → Return to Implementation Phase, address issues

Do NOT proceed to cleanup without explicit human approval.
```

### C.7 Cleanup Phase (ONLY after ALL validations pass)

```yaml
Prerequisites (ALL must be checked):
- [x] Calculation validation: 100% parity ✅
- [x] Performance validation: ≤110% baseline ✅
- [x] All tests passing ✅
- [x] Human approval received ✅

Delete Old Component:
- [ ] Identify old component file path
- [ ] Delete file: rm [old-component-path]
- [ ] Verify file deleted: ls [old-component-path]

Verify No References:
- [ ] Run: grep -r "[old-component-name]" apps/web/
- [ ] Exclude coverage/build artifacts
- [ ] Zero source code references = PASS
- [ ] If references found: Update imports, re-check

Update Ledger:
- [ ] Open: ledger.jsonl
- [ ] Create new entry:
      - iterationId: iter_YYYYMMDD_HHMMSS_[description]
      - artifacts.created: [new Cell]
      - artifacts.replaced: [old component]
      - deletedAt timestamp
      - reason: "Migrated to Cell architecture"
- [ ] Append to ledger.jsonl

Final Verification:
- [ ] Run: pnpm test (all tests pass)
- [ ] Run: pnpm type-check (no errors)
- [ ] Run: pnpm build (build succeeds)
- [ ] Verify: Old component file deleted
- [ ] Verify: No references to old component
- [ ] Verify: Ledger updated

Commit:
- [ ] Stage all changes: git add .
- [ ] Commit: "Story X.Y: [Component] Cell migration - complete"
- [ ] Verify commit contains:
      - New Cell files
      - Updated page integration
      - Deleted old component
      - Updated ledger
      - NO old component files
      - NO feature flag code
      - NO version suffixes
```

### C.8 Debugging Checklist (When Issues Arise)

```yaml
Symptom: Component won't load (stuck in loading state)
- [ ] Check Network tab: Requests successful? (200 OK?)
- [ ] Check Console: React Query status stuck on 'pending'?
- [ ] Check: Are query inputs memoized?
- [ ] Add console.log to query inputs - do they change every render?
- [ ] Likely cause: Unmemoized objects creating infinite loop

Symptom: 400 Bad Request errors
- [ ] Check: Using z.string().transform() for dates?
- [ ] Test procedure via curl with ISO string dates
- [ ] Verify Zod schema accepts strings, not Date objects
- [ ] Likely cause: Date serialization mismatch

Symptom: SQL errors in edge function
- [ ] Check: Using Drizzle helper functions (eq, inArray)?
- [ ] Reference existing working procedures
- [ ] Test SQL in Supabase SQL Editor first
- [ ] Likely cause: Wrong SQL syntax for Drizzle

Symptom: Calculations don't match old component
- [ ] Use Supabase CLI to query database directly
- [ ] Compare query results with old implementation
- [ ] Verify business logic matches exactly
- [ ] Document difference in spreadsheet
- [ ] Likely cause: Logic migration error

If stuck for 30+ minutes:
- [ ] Generate failure report
- [ ] Document: Symptoms, steps taken, hypotheses
- [ ] Start new session with clean context
- [ ] Maximum 3 attempts before escalating
```

---

**Print this checklist and check off each item as you complete it.**  
**Do not skip steps. Do not assume. Verify everything.**

---

---

**End of Document**

This Living Blueprint Architecture document is complete and ready for implementation.
