# Local-First Migration Strategy
## From Server-Side tRPC to SQLite WASM + ElectricSQL

**Document Version**: 1.0  
**Created**: 2025-10-02  
**Status**: Future Architecture Plan  
**Prerequisite**: Complete ANDA Cell migration (100% components as Cells)

---

## Executive Summary

This document outlines the migration path from the current **server-side tRPC architecture** to a **local-first architecture** using SQLite WASM + ElectricSQL/PowerSync, achieving **Linear-level (or better) responsiveness** with **<50ms interactions** while maintaining 100% compatibility with the ANDA Cell architecture.

**Key Insight**: The ANDA Cell architecture is the PERFECT foundation for this migration because:
- ✅ Each Cell is independent and can be migrated incrementally
- ✅ Manifests define exact behaviors that must be preserved
- ✅ Type safety is maintained end-to-end
- ✅ Behavioral assertions validate functional equivalence
- ✅ Ledger tracks the migration progress
- ✅ Can rollback per Cell if issues arise

---

## 1. Architecture Comparison

### 1.1. Current Architecture (Server-Side tRPC)

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (React)                          │
│  ┌────────────┐                                             │
│  │   Cell     │ ──→ trpc.useQuery() ──┐                    │
│  └────────────┘                        │                    │
└────────────────────────────────────────┼────────────────────┘
                                         │ Network Round-Trip
                                         │ (100-500ms)
┌────────────────────────────────────────┼────────────────────┐
│              Supabase Edge Function    ↓                    │
│  ┌──────────────────────────────────────────┐              │
│  │  tRPC Procedure                          │              │
│  │    ↓                                      │              │
│  │  Drizzle Query                           │              │
│  │    ↓                                      │              │
│  │  Postgres (10-50ms)                      │              │
│  └──────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────┘

Total Time per Read: 150-600ms (network-dependent)
```

**Performance Characteristics**:
- Every read = network round-trip
- Cascading queries = sequential waterfalls (300ms × 3 = 900ms)
- Optimizations: Prefetching, caching, batch queries
- Theoretical minimum: ~50ms (server-to-server on same datacenter)
- **User experience**: Acceptable but not "snappy"

### 1.2. Target Architecture (Local-First)

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (React)                          │
│  ┌────────────┐                                             │
│  │   Cell     │ ──→ useLocalQuery()                        │
│  └────────────┘           ↓                                 │
│                    ┌──────────────┐                         │
│                    │ Web Worker   │                         │
│                    │  SQLite WASM │  ← 0-5ms (in-memory)   │
│                    │  (OPFS)      │                         │
│                    └──────────────┘                         │
│                           ↕                                  │
│                    ┌──────────────┐                         │
│                    │ ElectricSQL  │  ← Background sync      │
│                    │ Sync Engine  │                         │
│                    └──────────────┘                         │
└────────────────────────────┬────────────────────────────────┘
                             │ WebSocket (push updates)
                             │ Background sync
┌────────────────────────────┼────────────────────────────────┐
│              Postgres (Source of Truth)                     │
│  ┌──────────────────────────────────────────┐              │
│  │  ElectricSQL Server                      │              │
│  │    ↓                                      │              │
│  │  Postgres Database                       │              │
│  └──────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────┘

Total Time per Read: 0-5ms (local SQLite query)
Total Time per Write: 10-50ms (optimistic UI + background sync)
```

**Performance Characteristics**:
- Every read = local SQLite query (0-5ms)
- Cascading dropdowns = instant filtering (0ms)
- Writes = optimistic with undo (instant UI feedback)
- Background sync ensures consistency
- **User experience**: Google Sheets-level responsiveness

---

## 2. Why This Migration is PERFECT for ANDA

### 2.1. Cell Architecture Compatibility

The ANDA Cell structure makes this migration **exceptionally agent-friendly**:

| ANDA Component | Role in Migration | Why It Helps |
|----------------|-------------------|--------------|
| **Manifest.json** | Behavioral assertions define success criteria | Agent knows when migration is complete |
| **Pipeline.yaml** | Validation gates ensure functional parity | Automated testing catches regressions |
| **Cell isolation** | Each Cell migrated independently | No big-bang rewrite, incremental progress |
| **Ledger** | Tracks migration progress | Agent knows what's migrated, what's pending |
| **Type safety** | Drizzle types flow to both architectures | Same types, different query mechanism |

### 2.2. Migration Pattern (Same for Every Cell)

```yaml
Before Migration (tRPC):
  Cell Component:
    - Uses: trpc.procedure.useQuery()
    - Data: Comes from server over network
    - Timing: 150-600ms per query
    - Works: Online only

After Migration (Local-First):
  Cell Component:
    - Uses: useLocalQuery(sql`...`)
    - Data: Comes from local SQLite WASM
    - Timing: 0-5ms per query
    - Works: Online + Offline
    
Behavioral Assertions: IDENTICAL
Visual Output: IDENTICAL
Type Safety: PRESERVED
```

### 2.3. Example: Budget Waterfall Cell Migration

**Before** (Current tRPC):
```typescript
// components/cells/budget-waterfall/component.tsx
export function BudgetWaterfall({ projectId }: Props) {
  const dateRange = useMemo(() => ({
    from: new Date(...),
    to: new Date(...)
  }), [])
  
  // SERVER QUERY - Network round-trip
  const { data, isLoading } = trpc.budget.getWaterfallData.useQuery({
    projectId,
    dateRange
  })
  
  if (isLoading) return <Skeleton />
  return <Chart data={data} />
}
```

**After** (Local-First):
```typescript
// components/cells/budget-waterfall/component.tsx
export function BudgetWaterfall({ projectId }: Props) {
  const dateRange = useMemo(() => ({
    from: new Date(...),
    to: new Date(...)
  }), [])
  
  // LOCAL QUERY - Instant
  const { data, isLoading } = useLocalQuery(
    sql`
      SELECT 
        spend_type as category,
        SUM(budget_cost) as budgeted,
        SUM(actual_cost) as actual,
        SUM(budget_cost - actual_cost) as variance
      FROM cost_breakdown
      WHERE project_id = ${projectId}
        AND created_at BETWEEN ${dateRange.from} AND ${dateRange.to}
      GROUP BY spend_type
    `
  )
  
  if (isLoading) return <Skeleton /> // Will flash for <5ms
  return <Chart data={data} />
}
```

**Behavioral Assertions**: Same tests, same validations, same visual output.

---

## 3. Migration Phases (Post-100% Cell Architecture)

### Phase 0: Prerequisites (MANDATORY)

```yaml
Before starting migration:
  ✓ 100% components converted to Cells
  ✓ All database queries go through tRPC (no direct Supabase)
  ✓ All Cells have manifests with behavioral assertions
  ✓ All Cells have pipeline.yaml with tests
  ✓ Ledger is complete and up-to-date
  ✓ Type safety at 100% (zero 'any' types)
```

**Rationale**: Local-first migration requires a stable, well-architected foundation. Migrating messy code to a new architecture multiplies complexity.

---

### Phase 1: Infrastructure Setup (Parallel to Current System)

**Duration**: 2-3 weeks  
**Risk**: Low (no production impact)  
**Approach**: Add new infrastructure alongside existing tRPC

#### 1.1. Add ElectricSQL / PowerSync

**Decision**: ElectricSQL vs PowerSync
```yaml
ElectricSQL:
  Pros:
    - Open source, self-hosted
    - Better for complex replication logic
    - More control over sync
  Cons:
    - More infrastructure to manage
    - Steeper learning curve

PowerSync:
  Pros:
    - Managed service (less ops)
    - Better for rapid development
    - Great Supabase integration
  Cons:
    - Vendor lock-in
    - Ongoing costs

Recommendation: PowerSync for faster time-to-market
```

**Installation**:
```bash
# Add dependencies
pnpm add @powersync/web
pnpm add @powersync/react

# Add SQLite WASM
pnpm add sql.js
pnpm add @sqlite.org/sqlite-wasm
```

**Setup PowerSync Connector**:
```typescript
// packages/db/src/local/connector.ts
import { WASQLitePowerSyncDatabaseOpenFactory } from '@powersync/web'

export const db = new WASQLitePowerSyncDatabaseOpenFactory({
  dbFilename: 'cost-management.db',
  schema: localSchema, // Mirror of Drizzle schema
  flags: {
    enableMultiTabs: true,
    useWebWorker: true // CRITICAL for performance
  }
}).getInstance()

// Configure sync
await db.connect({
  powerSyncUrl: process.env.NEXT_PUBLIC_POWERSYNC_URL,
  token: async () => {
    // Use existing Supabase auth token
    const session = await supabase.auth.getSession()
    return session.data.session?.access_token ?? ''
  }
})
```

#### 1.2. Define Local Schema (Mirror Drizzle)

**Critical Pattern**: Local schema MUST match server schema
```typescript
// packages/db/src/local/schema.ts
import { column, Schema, Table } from '@powersync/web'

// Mirror of Drizzle schema
const costBreakdown = new Table({
  id: column.text,
  project_id: column.text,
  sub_business_line: column.text,
  cost_line: column.text,
  spend_type: column.text,
  spend_sub_category: column.text,
  budget_cost: column.real, // Note: SQLite uses REAL for decimals
  created_at: column.integer // Note: SQLite uses INTEGER for timestamps
}, { indexes: { project_idx: ['project_id'] } })

const projects = new Table({
  id: column.text,
  name: column.text,
  sub_business_line: column.text,
  created_at: column.integer
})

const poMappings = new Table({
  id: column.text,
  po_line_item_id: column.text,
  cost_breakdown_id: column.text,
  mapped_amount: column.real,
  mapping_notes: column.text
}, { indexes: { 
  cost_breakdown_idx: ['cost_breakdown_id'],
  line_item_idx: ['po_line_item_id']
}})

export const localSchema = new Schema({
  cost_breakdown: costBreakdown,
  projects,
  po_mappings: poMappings
  // ... all other tables
})
```

**Type Generation** (maintain Drizzle types):
```typescript
// Drizzle types still work!
import type { CostBreakdown } from '@/db/schema'

// SQLite query returns same shape
const results: CostBreakdown[] = await db.execute(
  sql`SELECT * FROM cost_breakdown WHERE project_id = ?`,
  [projectId]
)
```

#### 1.3. Setup Web Worker Architecture

**Critical for Performance**: All database operations OFF main thread
```typescript
// lib/db-worker/worker.ts
import { expose } from 'comlink'
import { db } from '@/db/local/connector'

const dbWorker = {
  async query(sql: string, params: any[]) {
    return db.execute(sql, params)
  },
  
  async getAll(sql: string, params: any[]) {
    return db.getAll(sql, params)
  },
  
  async getSyncStatus() {
    return {
      connected: db.connected,
      hasSynced: db.hasSynced,
      lastSyncedAt: db.lastSyncedAt
    }
  }
}

expose(dbWorker)
```

**React Hook for Local Queries**:
```typescript
// lib/hooks/use-local-query.ts
import { useQuery } from '@tanstack/react-query'
import { dbWorker } from '@/lib/db-worker/client'

export function useLocalQuery<T>(
  sql: string,
  params: any[],
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ['local', sql, params],
    queryFn: () => dbWorker.query(sql, params) as Promise<T[]>,
    staleTime: Infinity, // Local data is always fresh
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    ...options
  })
}
```

#### 1.4. Setup Sync Rules (PowerSync)

**Define what data syncs to each client**:
```yaml
# powersync-sync-rules.yaml
bucket_definitions:
  # User's organization data
  user_data:
    parameters:
      - SELECT token_parameters.user_id as user_id
      - SELECT token_parameters.org_id as org_id
    data:
      # All projects in user's org
      - SELECT * FROM projects WHERE org_id = bucket.org_id
      
      # Cost breakdowns for user's projects
      - SELECT cb.* 
        FROM cost_breakdown cb
        INNER JOIN projects p ON p.id = cb.project_id
        WHERE p.org_id = bucket.org_id
      
      # PO mappings for user's projects
      - SELECT pm.*
        FROM po_mappings pm
        INNER JOIN po_line_items pli ON pli.id = pm.po_line_item_id
        INNER JOIN pos po ON po.id = pli.po_id
        INNER JOIN projects p ON p.id = po.project_id
        WHERE p.org_id = bucket.org_id
```

**What this does**: Only syncs data user has access to (RLS on sync, not just queries).

---

### Phase 2: Dual-Mode Operation (Gradual Cell Migration)

**Duration**: 8-12 weeks  
**Risk**: Medium (testing in production)  
**Approach**: Migrate one Cell at a time, feature-flag controlled

#### 2.1. Feature Flag System

```typescript
// lib/feature-flags.ts
export const USE_LOCAL_FIRST = {
  'budget-waterfall': false,  // Start with server-side
  'kpi-card': false,
  'po-mapping-inbox': false,
  'details-panel': false
  // ... all Cells enumerated
}

// Helper hook
export function useLocalFirstEnabled(cellId: string) {
  return USE_LOCAL_FIRST[cellId] ?? false
}
```

#### 2.2. Cell Migration Template

**Standard pattern for migrating ANY Cell**:

```typescript
// components/cells/{cell-name}/component.tsx

// BEFORE (tRPC version)
export function CellName({ projectId }: Props) {
  const { data, isLoading } = trpc.procedure.useQuery({ projectId })
  // ...
}

// AFTER (Hybrid version during migration)
export function CellName({ projectId }: Props) {
  const useLocalFirst = useLocalFirstEnabled('cell-name')
  
  // Server-side query (existing)
  const serverQuery = trpc.procedure.useQuery(
    { projectId },
    { enabled: !useLocalFirst } // Disable when using local
  )
  
  // Local-first query (new)
  const localQuery = useLocalQuery(
    sql`SELECT * FROM table WHERE project_id = ?`,
    [projectId],
    { enabled: useLocalFirst } // Enable only when flag on
  )
  
  // Use whichever is active
  const { data, isLoading } = useLocalFirst ? localQuery : serverQuery
  
  // Rest of component UNCHANGED
  if (isLoading) return <Skeleton />
  return <Chart data={data} />
}
```

**Behavioral Assertion Validation**:
```typescript
// components/cells/{cell-name}/__tests__/component.test.tsx

describe('CellName', () => {
  // Test BOTH modes
  describe('Server-side mode', () => {
    beforeEach(() => {
      USE_LOCAL_FIRST['cell-name'] = false
    })
    
    it('BA-001: Displays data when query succeeds', async () => {
      // Mock tRPC response
      mockTRPC('procedure', { data: mockData })
      
      render(<CellName projectId="uuid" />)
      
      await waitFor(() => {
        expect(screen.getByText('Expected Output')).toBeInTheDocument()
      })
    })
  })
  
  describe('Local-first mode', () => {
    beforeEach(() => {
      USE_LOCAL_FIRST['cell-name'] = true
      // Seed local database
      await seedLocalDB(mockData)
    })
    
    it('BA-001: Displays data when query succeeds', async () => {
      render(<CellName projectId="uuid" />)
      
      await waitFor(() => {
        expect(screen.getByText('Expected Output')).toBeInTheDocument()
      })
    })
  })
})
```

**Key Insight**: Same behavioral assertion tested in BOTH modes. If both pass, functional equivalence proven.

#### 2.3. Cell-by-Cell Migration Priority

**Phase 2A: Simple Read-Only Cells** (Weeks 1-2)
```yaml
Priority 1 (Low Risk):
  - kpi-card (simple aggregation)
  - project-list (simple select)
  - budget-summary (read-only display)

Complexity: LOW
Risk: LOW
User Impact: High visibility, performance improvements obvious
```

**Phase 2B: Interactive Cells** (Weeks 3-6)
```yaml
Priority 2 (Medium Risk):
  - budget-waterfall (filtering, date ranges)
  - pl-command-center (multiple queries, complex state)
  - details-panel-selector (cascading dropdowns)

Complexity: MEDIUM
Risk: MEDIUM
User Impact: Critical UX improvements (instant dropdowns)
```

**Phase 2C: Mutation-Heavy Cells** (Weeks 7-12)
```yaml
Priority 3 (Higher Risk):
  - details-panel-mapper (create/update/delete mappings)
  - po-table (inline editing)
  - budget-version-editor (complex writes)

Complexity: HIGH
Risk: HIGHER
User Impact: Optimistic UI + offline capability
```

#### 2.4. Writes: Optimistic UI Pattern

**Critical Pattern**: Instant UI feedback, background sync
```typescript
// lib/hooks/use-local-mutation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { dbWorker } from '@/lib/db-worker/client'

export function useLocalMutation<TInput, TResult>(
  mutationFn: (input: TInput) => Promise<TResult>,
  options?: {
    onOptimisticUpdate?: (input: TInput) => void
    onSuccess?: (result: TResult) => void
  }
) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (input: TInput) => {
      // 1. Apply optimistic update to local DB
      await dbWorker.executeLocal(/* local update */)
      
      // 2. Show instant UI feedback
      options?.onOptimisticUpdate?.(input)
      
      // 3. Queue for sync (background)
      await dbWorker.queueForSync(/* sync payload */)
      
      // 4. Wait for server confirmation
      return mutationFn(input)
    },
    
    onError: (error, input, context) => {
      // Rollback local change on server error
      queryClient.invalidateQueries({ queryKey: ['local'] })
      toast({
        title: 'Update failed - reverted',
        description: error.message,
        variant: 'destructive'
      })
    },
    
    onSuccess: (result) => {
      // Server confirmed, mark as synced
      options?.onSuccess?.(result)
      toast({
        title: 'Saved',
        action: <Button onClick={handleUndo}>Undo</Button>
      })
    }
  })
}
```

**Example: Create PO Mapping (Optimistic)**:
```typescript
// components/cells/details-panel-mapper/component.tsx
export function DetailsPanelMapper({ poId, costBreakdownId }: Props) {
  const createMapping = useLocalMutation(
    async (input: CreateMappingInput) => {
      // Server mutation (for sync)
      return trpc.poMapping.createMapping.mutate(input)
    },
    {
      onOptimisticUpdate: async (input) => {
        // Instant local update
        await dbWorker.execute(
          sql`INSERT INTO po_mappings (id, po_line_item_id, cost_breakdown_id, mapped_amount)
              VALUES (?, ?, ?, ?)`,
          [uuid(), input.poLineItemId, input.costBreakdownId, input.amount]
        )
        // UI updates INSTANTLY (0ms)
      }
    }
  )
  
  return (
    <Button onClick={() => createMapping.mutate({ ... })}>
      Create Mapping
    </Button>
  )
}
```

**User Experience**:
- Click "Create Mapping" → GREEN card appears **instantly**
- Toast shows "Saved • Undo"
- Background sync confirms to server
- If sync fails → Revert + show error

---

### Phase 3: Complete Migration & tRPC Deprecation

**Duration**: 2-4 weeks  
**Risk**: Low (all Cells already validated)  
**Approach**: Remove tRPC read procedures, keep write mutations

#### 3.1. Deprecate Read-Only tRPC Procedures

Once all Cells migrated:
```yaml
Step 1: Audit tRPC routers
  - Find all .query() procedures (read-only)
  - Verify no Cell still using them
  - Mark as deprecated in code comments

Step 2: Remove from API
  - Delete procedure definitions
  - Keep mutations (.mutate()) for writes
  - Update Supabase edge function

Step 3: Verify
  - Build succeeds
  - All tests pass
  - No runtime errors

Step 4: Update Ledger
  - Document tRPC deprecation
  - Link to local-first migration entries
```

#### 3.2. Write Mutations: Two Options

**Option A: Keep tRPC for Writes** (Simpler)
```typescript
// Reads: Local SQLite (instant)
const { data } = useLocalQuery(sql`SELECT ...`)

// Writes: tRPC mutation (validated on server)
const createMapping = trpc.poMapping.createMapping.useMutation({
  onSuccess: () => {
    // ElectricSQL syncs change back to local DB automatically
  }
})
```

**Option B: Full Local-First with Conflict Resolution** (More Complex)
```typescript
// All operations local
const { data } = useLocalQuery(sql`SELECT ...`)

const createMapping = useLocalMutation({
  local: sql`INSERT INTO po_mappings ...`,
  sync: async (payload) => {
    // PowerSync handles sync + conflict resolution
  }
})
```

**Recommendation**: Option A initially (keep tRPC for writes), migrate to Option B later if offline writes required.

---

### Phase 4: Full Offline Mode & Conflict Resolution

**Duration**: 4-6 weeks  
**Risk**: High (complex distributed systems problems)  
**Prerequisite**: Phase 3 complete and stable

#### 4.1. Conflict Resolution Strategies

**Define per-table conflict resolution**:
```yaml
# powersync-conflicts.yaml

po_mappings:
  strategy: last_write_wins
  resolution:
    - Compare timestamps
    - Keep most recent update
    - Log conflict for audit

budget_assumptions:
  strategy: append_only
  resolution:
    - Never update, only insert new versions
    - No conflicts possible

projects:
  strategy: manual_review
  resolution:
    - Flag conflict for user
    - Show both versions
    - User chooses which to keep
```

#### 4.2. Offline Queue Management

```typescript
// lib/offline/queue.ts
export class OfflineQueue {
  async addToQueue(operation: MutationOperation) {
    await dbWorker.execute(
      sql`INSERT INTO _offline_queue (id, operation, payload, created_at)
          VALUES (?, ?, ?, ?)`,
      [uuid(), operation.type, JSON.stringify(operation.data), Date.now()]
    )
  }
  
  async processQueue() {
    const pending = await dbWorker.getAll(
      sql`SELECT * FROM _offline_queue ORDER BY created_at ASC`
    )
    
    for (const item of pending) {
      try {
        // Sync to server
        await syncToServer(item)
        // Remove from queue
        await this.removeFromQueue(item.id)
      } catch (error) {
        // Keep in queue, retry later
        await this.incrementRetryCount(item.id)
      }
    }
  }
}
```

---

## 4. Implementation Checklist

### 4.1. Phase 1 Checklist: Infrastructure

```yaml
Setup:
  - [ ] Install PowerSync / ElectricSQL dependencies
  - [ ] Install SQLite WASM packages
  - [ ] Setup Web Worker architecture
  - [ ] Configure OPFS storage
  - [ ] Create local schema (mirror Drizzle)
  - [ ] Setup PowerSync sync rules
  - [ ] Configure authentication flow
  - [ ] Deploy PowerSync backend (if self-hosting)

Validation:
  - [ ] Local DB initializes successfully
  - [ ] Sync establishes connection
  - [ ] Data syncs from Postgres → SQLite
  - [ ] Web Worker executes queries off-main-thread
  - [ ] No impact to existing tRPC architecture
```

### 4.2. Phase 2 Checklist: Per-Cell Migration

```yaml
For EACH Cell (repeat until all migrated):
  
  Preparation:
    - [ ] Read Cell manifest (behavioral assertions)
    - [ ] Read Cell pipeline (test suite)
    - [ ] Identify tRPC procedures used
    - [ ] Design equivalent SQL queries
    
  Implementation:
    - [ ] Add feature flag for this Cell
    - [ ] Implement local query using useLocalQuery()
    - [ ] Keep existing tRPC query (dual-mode)
    - [ ] Add conditional logic to switch between modes
    
  Testing:
    - [ ] Run existing tests with feature flag OFF (tRPC)
    - [ ] Seed local DB with test data
    - [ ] Run tests with feature flag ON (local)
    - [ ] Both test suites MUST pass identically
    - [ ] Visual regression testing (screenshots match)
    - [ ] Performance testing (local < 10ms)
    
  Deployment:
    - [ ] Deploy with feature flag OFF
    - [ ] Enable for 10% of users (canary)
    - [ ] Monitor error rates
    - [ ] Enable for 50% of users
    - [ ] Enable for 100% of users
    
  Cleanup:
    - [ ] Remove tRPC query code (local-only now)
    - [ ] Remove feature flag
    - [ ] Update Cell manifest (note local-first)
    - [ ] Update ledger entry
    - [ ] Git commit: "Migrate {CellName} to local-first"
    
  Validation:
    - [ ] All behavioral assertions still pass
    - [ ] Pipeline validation succeeds
    - [ ] Performance < 10ms for reads
    - [ ] No user-reported issues for 1 week
```

### 4.3. Phase 3 Checklist: tRPC Deprecation

```yaml
Audit:
  - [ ] List all tRPC read procedures
  - [ ] Verify zero usage (grep codebase)
  - [ ] Document which procedures deleted
  
Removal:
  - [ ] Delete read-only tRPC procedures
  - [ ] Keep write mutations (or migrate to local)
  - [ ] Update edge function deployment
  - [ ] Remove unused dependencies
  
Validation:
  - [ ] Build succeeds
  - [ ] All tests pass
  - [ ] Production monitoring shows no errors
  - [ ] Update architecture documentation
```

### 4.4. Phase 4 Checklist: Offline Mode

```yaml
Conflict Resolution:
  - [ ] Define per-table strategies
  - [ ] Implement conflict UI
  - [ ] Test concurrent edits
  - [ ] Verify last-write-wins works
  
Offline Queue:
  - [ ] Implement offline queue table
  - [ ] Queue mutations when offline
  - [ ] Process queue when online
  - [ ] Handle sync failures gracefully
  
Testing:
  - [ ] Simulate offline scenario
  - [ ] Make changes while offline
  - [ ] Reconnect and verify sync
  - [ ] Test conflict scenarios
  - [ ] Verify data integrity
```

---

## 5. Performance Validation

### 5.1. Performance Budgets (Before → After)

| Operation | Current (tRPC) | Target (Local-First) | Improvement |
|-----------|----------------|---------------------|-------------|
| **KPI Card Load** | 200-400ms | <5ms | **40-80x faster** |
| **Cascading Dropdown** | 300ms per level | 0ms (filter) | **∞ faster** |
| **Budget Waterfall** | 400-600ms | <10ms | **40-60x faster** |
| **PO Table Scroll** | N/A (paginated) | 0ms (virtualized) | **Infinite scroll** |
| **Create Mapping** | 300-500ms | <50ms (optimistic) | **6-10x faster** |
| **Cold Start** | 1-2s | 3-4s (initial sync) | **Slower first load** |
| **Warm Navigation** | 200-400ms | <10ms | **20-40x faster** |

### 5.2. Measurement Tools

```typescript
// lib/performance/metrics.ts
export class PerformanceMetrics {
  static measureQueryTime(queryName: string) {
    const start = performance.now()
    
    return {
      end: () => {
        const duration = performance.now() - start
        
        // Log to analytics
        analytics.track('query_performance', {
          query: queryName,
          duration,
          mode: USE_LOCAL_FIRST ? 'local' : 'server'
        })
        
        // Fail if exceeds budget
        if (USE_LOCAL_FIRST && duration > 10) {
          console.warn(`Query ${queryName} exceeded 10ms budget: ${duration}ms`)
        }
        
        return duration
      }
    }
  }
}

// Usage in Cell
const { data } = useLocalQuery(sql`...`, [], {
  onSuccess: () => {
    PerformanceMetrics.measureQueryTime('budget-waterfall').end()
  }
})
```

---

## 6. Rollback Strategy

### 6.1. Per-Cell Rollback

If a Cell migration fails:
```yaml
Step 1: Disable feature flag
  - SET USE_LOCAL_FIRST['{cell-name}'] = false
  - Cell reverts to tRPC queries immediately
  - Zero deployment required

Step 2: Analyze failure
  - Check error logs
  - Review behavioral assertion failures
  - Identify root cause

Step 3: Fix and retry
  - Fix local query implementation
  - Re-test both modes
  - Re-enable feature flag

Step 4: Document in ledger
  - Record rollback event
  - Note failure reason
  - Link to fix commit
```

### 6.2. Full Architecture Rollback

If entire local-first approach fails:
```yaml
Severity: CRITICAL (should not happen with gradual migration)

Step 1: Disable ALL feature flags
  - All Cells revert to tRPC
  - Application still works (dual-mode design)

Step 2: Remove local-first infrastructure
  - Comment out PowerSync initialization
  - Keep code in place (don't delete)

Step 3: Production hotfix
  - Deploy tRPC-only version
  - Monitor stability

Step 4: Postmortem
  - Analyze what went wrong
  - Re-evaluate approach
  - Document lessons learned
```

**Key Safety**: Dual-mode operation means BOTH architectures work. Never fully remove tRPC until 100% confident in local-first.

---

## 7. Agent Instructions for Migration

### 7.1. When to Start This Migration

```yaml
Prerequisites:
  ✓ 100% components are Cells
  ✓ All queries go through tRPC
  ✓ All Cells have manifests + pipelines
  ✓ All tests passing
  ✓ Ledger is complete
  ✓ User has approved local-first migration

DO NOT start if:
  ✗ Any components not yet migrated to Cells
  ✗ Direct Supabase queries still exist
  ✗ Architecture is still being refactored
  ✗ User hasn't explicitly requested this migration
```

### 7.2. Standard Agent Workflow (Per Cell)

```yaml
1. Query Ledger
   - Check if Cell already migrated to local-first
   - Find reference Cells for pattern examples
   
2. Read Cell Manifest
   - Note all behavioral assertions
   - These MUST still pass after migration
   
3. Identify tRPC Procedures
   - What queries does this Cell use?
   - What data does it need?
   
4. Design Local Queries
   - Write equivalent SQL for SQLite
   - Ensure same data shape returned
   
5. Implement Dual-Mode
   - Add feature flag
   - Keep tRPC query
   - Add local query
   - Conditional switch
   
6. Test Both Modes
   - Run tests with flag OFF (verify tRPC still works)
   - Run tests with flag ON (verify local works identically)
   - Both MUST pass
   
7. Update Ledger
   - Document migration
   - Link to commit
   - Note performance improvement
   
8. Next Cell
   - Repeat process
   - Build migration momentum
```

### 7.3. Example Ledger Entry

```json
{
  "iterationId": "local_first_20260201_140000_migrate_budget_waterfall",
  "timestamp": "2026-02-01T14:00:00Z",
  "humanPrompt": "Migrate budget-waterfall Cell to local-first architecture",
  "artifacts": {
    "modified": [
      {
        "type": "cell",
        "id": "budget-waterfall",
        "changes": [
          "Added useLocalQuery() for local-first mode",
          "Kept trpc.budget.getWaterfallData.useQuery() for fallback",
          "Added feature flag: USE_LOCAL_FIRST['budget-waterfall']",
          "Updated tests to validate both modes"
        ]
      }
    ]
  },
  "performanceMetrics": {
    "before": { "queryTime": "380ms", "mode": "tRPC" },
    "after": { "queryTime": "4ms", "mode": "local-first" },
    "improvement": "95x faster"
  },
  "metadata": {
    "migrationPhase": "Phase 2A: Simple Read-Only Cells",
    "cellComplexity": "low",
    "behavioralAssertionsPassed": true,
    "dualModeValidated": true
  }
}
```

---

## 8. Success Metrics

### 8.1. Technical Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **Read Query Latency** | <10ms | Performance API timing |
| **Write Latency (Optimistic)** | <50ms | Time to UI update |
| **Sync Latency** | <5s | PowerSync metrics |
| **Offline Capability** | 100% reads work | Test with network off |
| **Type Safety** | 100% | Zero 'any' types |
| **Test Coverage** | ≥80% both modes | Jest coverage report |
| **Cell Migration Progress** | 100% | Ledger query count |

### 8.2. User Experience Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **Perceived Load Time** | <1s | User perception survey |
| **Dropdown Interaction** | Instant (0ms) | Performance monitoring |
| **Table Scroll FPS** | 60 FPS | Chrome DevTools |
| **Offline Usability** | "Works great" | User feedback |
| **Error Rate** | <0.1% | Error tracking |

---

## 9. Cost-Benefit Analysis

### 9.1. Development Investment

```yaml
Phase 1 (Infrastructure): 2-3 weeks
Phase 2 (Cell Migration): 8-12 weeks
Phase 3 (tRPC Deprecation): 2-4 weeks
Phase 4 (Offline Mode): 4-6 weeks

Total: 16-25 weeks of development time
```

### 9.2. Benefits

**Performance**:
- 40-80x faster reads
- Instant cascading dropdowns (previously 900ms)
- Offline capability
- Better UX than competitors

**User Experience**:
- "Snappy" interactions (Linear-level or better)
- No loading spinners for cached data
- Works on poor network conditions
- Better mobile experience

**Scalability**:
- Reduced server load (reads are local)
- Lower bandwidth costs
- Better handles high user concurrency

**Competitive Advantage**:
- Outperforms web-based competitors
- Desktop-app-like responsiveness
- Unique offline capability

### 9.3. Costs

**Complexity**:
- Two data access patterns during migration
- Sync logic adds cognitive load
- Conflict resolution needed

**Infrastructure**:
- PowerSync subscription costs (or self-hosting)
- Additional monitoring required
- Larger client-side storage

**Maintenance**:
- Keep local schema in sync with server
- Monitor sync health
- Handle edge cases (conflicts, offline queue)

---

## 10. Decision Framework

### 10.1. Should You Migrate?

**YES, migrate to local-first if**:
- ✅ Users complain about "slow" or "laggy" interface
- ✅ Competitive pressure (competitors have faster UX)
- ✅ Offline capability is valuable (field workers, poor connectivity)
- ✅ Cost of development justified by user satisfaction
- ✅ Team has 16-25 weeks for gradual migration

**NO, stay with current architecture if**:
- ❌ Current performance acceptable to users
- ❌ Budget/timeline constraints
- ❌ Team lacks bandwidth for migration
- ❌ Prefetching + caching already solved most issues
- ❌ Offline mode not required for use case

### 10.2. Hybrid Approach (Recommended)

**Migrate critical paths only**:
```yaml
Migrate to Local-First:
  - PO Inbox (high-frequency interactions)
  - Cascading dropdowns (instant filters)
  - Budget dashboards (read-heavy)
  - KPI cards (displayed everywhere)

Keep Server-Side:
  - Admin pages (low usage)
  - Report generation (compute-heavy)
  - Bulk imports (large data)
  - Settings pages (infrequent)

Benefits:
  - 80% of UX improvement with 40% of effort
  - Lower risk (critical paths only)
  - Faster time to value
```

---

## 11. Conclusion

The proposed **local-first architecture** is **highly compatible** with the current **ANDA Cell architecture** because:

1. ✅ **Cells remain isolated** - Each migrates independently
2. ✅ **Manifests still work** - Behavioral assertions validate equivalence
3. ✅ **Type safety preserved** - Same Drizzle types, different query layer
4. ✅ **Ledger tracks progress** - Agent knows what's done, what's next
5. ✅ **Dual-mode safety** - Can rollback per Cell if issues
6. ✅ **Gradual migration** - No big-bang rewrite required

**The migration transforms**:
```
tRPC Query (300ms)  →  Local SQLite Query (5ms)
      ↓                        ↓
   60x faster performance
   Offline capability
   Linear-level UX
```

**While preserving**:
```
✓ Cell architecture
✓ Type safety
✓ Behavioral assertions
✓ Validation pipelines
✓ Agent-friendly development
```

**Recommendation**: Execute this migration **AFTER** completing 100% Cell architecture adoption. The ANDA foundation makes this migration significantly easier and safer than a traditional big-bang rewrite.

---

**Status**: Ready for user approval to begin Phase 1  
**Next Step**: User decision on whether to proceed with local-first migration
