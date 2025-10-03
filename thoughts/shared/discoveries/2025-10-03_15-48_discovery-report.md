# Discovery Report: Migration Target Selection

**Timestamp**: 2025-10-03 15:48:00  
**Agent**: MigrationScout  
**Workflow Phase**: Phase 1 - Discovery & Selection  
**Mode**: Autonomous Selection

---

## Executive Summary

**SELECTED TARGET**: `SpendCategoryChart.tsx`  
**Score**: 80/100  
**Migration Complexity**: LOW (Quick Win)  
**Estimated Duration**: 4-6 hours  
**Strategic Value**: Core dashboard visualization + type safety improvement

---

## Selected Migration Target

### Component Details

**Component**: `SpendCategoryChart`  
**Path**: `apps/web/components/dashboard/spend-category-chart.tsx`  
**Lines of Code**: 110  
**Current Usage**: Project Dashboard (1 import)  
**Type**: Pie chart visualization component

### Score Breakdown (80 points)

| Factor | Points | Evidence |
|--------|--------|----------|
| **Indirect Database Calls** | +30 | Receives data from `getCategoryBreakdown()` which makes direct Supabase queries |
| **Type Safety Issues** | +25 | 2 'any' types (Recharts library callbacks - lines 30, 51) |
| **High Usage** | 0 | Single import (dashboard page only) |
| **Anti-Patterns** | 0 | No version suffixes or orphaned status |
| **Low Complexity** | +10 | Simple component (110 lines, single responsibility) |
| **User-Facing** | +5 | Core dashboard visualization (pie chart) |
| **Critical Path** | +10 | Main project dashboard feature |
| **TOTAL** | **80** | **Above threshold (40), clear winner** |

### Selection Rationale

#### Primary Factors
1. **Indirect Database Access Pattern** (CRITICAL)
   - Currently receives `categoryData` from parent page
   - Parent calls `getCategoryBreakdown(projectId, filters)` from `lib/dashboard-metrics.ts`
   - Helper function makes direct Supabase queries:
     - `cost_breakdown` table (budget data)
     - `po_mappings` table (actual spend)
   - **Migration Impact**: Eliminates indirect database access, moves to tRPC layer

2. **Type Safety Improvement** (HIGH)
   - 2 'any' types from Recharts library (unavoidable but documented)
   - Migration to Cell will establish proper data contracts via Zod schemas
   - tRPC procedure will enforce type safety from database to UI

3. **Low Complexity = Quick Win** (HIGH)
   - Only 110 lines of code
   - Single responsibility (pie chart rendering)
   - Minimal state management
   - **Estimated migration**: 4-6 hours vs 8-12 hours for complex components

#### Secondary Factors
4. **User-Facing Dashboard Component**
   - Visible on every project dashboard page load
   - Critical for spend category analysis
   - High user value for completing migration

5. **Clean Migration Pattern**
   - Matches previous successful migrations (budget-timeline-chart, financial-control-matrix)
   - Clear data flow: page → helper → Supabase → props
   - Straightforward conversion to: Cell → tRPC → Supabase

#### Risk Assessment
- **Risk Level**: LOW
- **Complexity**: Simple pie chart with Recharts
- **Dependencies**: Minimal (shadcn/ui chart components, Recharts)
- **Boundary Clarity**: Clean component boundaries, well-defined props
- **Testing**: Straightforward - render with mock data, verify chart output

---

## Current Architecture Analysis

### Data Flow (Before Migration)

```
┌─────────────────────────────────────────────────────────┐
│ Page: apps/web/app/projects/[id]/dashboard/page.tsx    │
│                                                         │
│ 1. useEffect() triggered on mount                      │
│ 2. Calls: getCategoryBreakdown(projectId, filters)     │
│    ↓                                                    │
│ 3. Helper: lib/dashboard-metrics.ts                    │
│    - Queries cost_breakdown table (Supabase)           │
│    - Queries po_mappings table (Supabase)              │
│    - Client-side aggregation by spend_type             │
│    ↓                                                    │
│ 4. Sets: setCategoryData(aggregatedData)               │
│ 5. Passes: <SpendCategoryChart data={categoryData} />  │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ Component: spend-category-chart.tsx                     │
│                                                         │
│ - Receives CategoryData[] via props                    │
│ - Renders Recharts PieChart                            │
│ - No state, no side effects                            │
│ - Pure presentation logic                              │
└─────────────────────────────────────────────────────────┘
```

### Database Operations (Current)

**In `lib/dashboard-metrics.ts` → `getCategoryBreakdown()`**:

```typescript
// Line 227-232: Direct Supabase query
const { data: costData } = await supabase
  .from('cost_breakdown')
  .select('spend_type, budget_cost, id')
  .eq('project_id', projectId)

// Line 254: Direct Supabase query for actuals
const { data: mappings } = await supabase
  .from('po_mappings')
  .select('mapped_amount, cost_breakdown_id')
  .filter('cost_breakdown_id', 'in', costFilter)
```

**Tables Accessed**:
- `cost_breakdown` (budget data by spend type)
- `po_mappings` (actual spend amounts)

**Client-Side Processing**:
- Aggregation by `spend_type`
- Budget summation
- Actual spend calculation from mappings
- Utilization percentage calculation

---

## Target Architecture (After Migration)

### Proposed Data Flow

```
┌─────────────────────────────────────────────────────────┐
│ Page: apps/web/app/projects/[id]/dashboard/page.tsx    │
│                                                         │
│ 1. Renders: <SpendCategoryChartCell projectId={id} />  │
│    (No data fetching, no state)                        │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ Cell: components/cells/spend-category-chart/            │
│                                                         │
│ 1. component.tsx:                                      │
│    - Uses tRPC: trpc.dashboard.getCategoryBreakdown    │
│    - Handles loading/error states                      │
│    - Renders chart with fetched data                   │
│                                                         │
│ 2. manifest.json:                                      │
│    - Behavioral assertions (data fetch, error, loading) │
│                                                         │
│ 3. pipeline.yaml:                                      │
│    - Quality gates (types, tests, build)               │
│                                                         │
│ 4. __tests__/component.test.tsx:                       │
│    - MSW mocks for tRPC                                │
│    - Loading/error/success states                      │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ tRPC Procedure: packages/api/src/procedures/dashboard/  │
│                 get-category-breakdown.procedure.ts     │
│                                                         │
│ - Input: z.object({ projectId: z.string() })          │
│ - Output: z.array(CategoryBreakdownSchema)            │
│ - Query: cost_breakdown + po_mappings                  │
│ - Server-side aggregation by spend_type                │
│ - Returns: CategoryData[]                              │
└─────────────────────────────────────────────────────────┘
```

### Architecture Compliance

**ANDA Pillars**:
- ✅ Type-Safe Data Layer (tRPC + Zod)
- ✅ Smart Component Cells (self-contained)
- ✅ Architectural Ledger (migration documented)

**API Procedure Specialization** (M1-M4):
- ✅ M1: One procedure, one file
- ✅ M2: File size ≤200 lines
- ✅ M3: No parallel implementations
- ✅ M4: Explicit naming (get-category-breakdown.procedure.ts)

---

## Dependencies Analysis

### Database Tables
- `cost_breakdown` (budget data, filtered by project_id)
- `po_mappings` (actual spend, joined to cost_breakdown)

### Component Imports
```typescript
// UI Components (shadcn/ui)
import { ChartContainer, ChartConfig, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

// Visualization Library
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'
```

### Imported By
1. `apps/web/app/projects/[id]/dashboard/page.tsx` (line 13, used line 358)

### Data Contract
```typescript
interface CategoryData {
  name: string        // Spend type name
  value: number       // Actual spend amount
  budget: number      // Budget allocated
}
```

---

## Estimated Migration Impact

### Affected Components
- **Direct**: 1 component (SpendCategoryChart)
- **Indirect**: 1 page (dashboard page - simplified)
- **Created**: 1 Cell structure, 1 tRPC procedure
- **Modified**: Dashboard page (remove getCategoryBreakdown call, update import)

### Feature Criticality
- **Feature**: Project spend visualization by category
- **User Impact**: Core dashboard feature used on every project view
- **Business Value**: Essential for budget analysis and spend tracking

### Migration Complexity
- **Complexity Rating**: LOW
- **Component Complexity**: Simple (110 lines, pie chart)
- **Data Complexity**: MEDIUM (2-table join with aggregation)
- **Estimated Duration**: 4-6 hours

**Breakdown**:
- Phase A (tRPC procedure): 2-3 hours
- Phase B (Cell creation): 1-2 hours  
- Phase C (Integration + testing): 1 hour

### Success Metrics
- ✅ Zero TypeScript errors
- ✅ All tests passing (8+ test cases)
- ✅ Behavioral assertions validated (6+)
- ✅ Dashboard page renders chart correctly
- ✅ No performance regression
- ✅ Ledger entry created

---

## Alternatives Considered

### 2nd Place: CostBreakdownTable (55 points)
**Path**: `apps/web/components/dashboard/cost-breakdown-table.tsx`  
**Score**: 55/100  
**Reason Not Selected**: Lower score due to no type safety issues (0 points), slightly higher complexity (172 lines vs 110)

**Comparison**:
- ✅ Also uses indirect DB calls (+30)
- ❌ No type errors (0 vs +25 for SpendCategoryChart)
- ✅ Low complexity (+10)
- ✅ User-facing (+5)
- ✅ Critical path (+10)

**Why SpendCategoryChart Wins**: Type safety improvement opportunity (+25 points) makes it higher value for the same effort level.

---

### 3rd Place: SpendSubcategoryChart (50 points)
**Path**: `apps/web/components/dashboard/spend-subcategory-chart.tsx`  
**Score**: ~50/100  
**Reason Not Selected**: Higher complexity (284 lines), medium difficulty, lower score

**Comparison**:
- ✅ Indirect DB calls (+30)
- ✅ User-facing (+5)
- ✅ Critical path (+10)
- ❌ Medium complexity (284 lines) - only +5 instead of +10
- **Migration Estimate**: 6-8 hours (50% more effort than SpendCategoryChart)

**Why SpendCategoryChart Wins**: Better effort-to-value ratio (quick win vs moderate effort).

---

### Other Candidates Evaluated

**Forecast Wizard** (1010 lines) - **Not Selected**
- **Score**: ~30 points (below threshold)
- **Issues**: 
  - No direct DB calls (receives all data via props)
  - Extreme complexity (1010 lines)
  - Multi-step wizard flow (5 steps)
  - Would require 2-3 day migration
- **Recommendation**: Defer until simpler components migrated

**Version Comparison** (616 lines) - **Not Selected**
- **Score**: ~35 points (below threshold)
- **Issues**:
  - High complexity (617 lines)
  - Complex data processing
  - 8-12 hour migration estimate
- **Recommendation**: Future migration after quick wins

**Project Alerts** (190 lines) - **ORPHANED**
- **Score**: 55 points (but orphaned)
- **Status**: Zero imports detected
- **Recommendation**: DELETE, not migrate
- **Action**: Create separate ticket for removal

---

## Ledger Insights

### Adoption Progress
- **Total Components**: ~21 unmigrated components in `/components/` (excluding cells/ and ui/)
- **Migrated Cells**: 5 Cell families
  1. kpi-card
  2. pl-command-center
  3. details-panel family (4 Cells)
  4. budget-timeline-chart
  5. financial-control-matrix

- **Adoption Rate**: ~5/26 = 19% Cell adoption (dashboard components focus)
- **Remaining Dashboard Components**: 
  - ✅ Smart-KPI-Card (already optimized, uses tRPC)
  - 🔄 SpendCategoryChart (SELECTED TARGET)
  - 🔄 SpendSubcategoryChart
  - 🔄 CostBreakdownTable
  - 🔄 DashboardFilterPanel (currently commented out)
  - ✅ DashboardSkeleton (static, no migration needed)

### Velocity Analysis
- **Migrations Completed**: 5 Cell families
- **Time Period**: Oct 1-3 (3 days)
- **Velocity**: ~1.67 components per day (high velocity maintained)
- **Recent Pattern**: Alternating between complex (financial-control-matrix) and simple (budget-timeline-chart)
- **Next Strategic Move**: **Quick win (SpendCategoryChart) to maintain momentum**

### Success Patterns
1. **Simple components migrate faster** (4-6 hours) with high success rate
2. **Dashboard components** are clean candidates (clear boundaries, prop-based)
3. **Visualization components** (charts) have straightforward Cell conversion
4. **Type safety** enforcement via tRPC prevents future issues

### Failure Patterns
- **Zero failed migrations documented** ✅
- No deviations requiring rollback
- Emergency scope expansions handled successfully (budget-timeline-chart P&L awareness)

---

## Architecture Health Context

### Current State (from latest validation)
- **Architecture Health Score**: 85/100 (GOOD, IMPROVING)
- **Type Safety Integrity**: 95/100
- **Cell Quality Score**: 75/100
- **Critical Issues**: 0 (all resolved)
- **Technical Debt**: Minimal

### Anti-Pattern Status
- **Version Suffixes**: 0 detected ✅ EXCELLENT
- **Orphaned Components**: 1 detected (project-alerts.tsx)
- **Direct Database Calls**: 6 files (pages + libs, NOT components)
- **Monolithic Files**: 3 files in API (dashboard.ts being specialized)

### Migration Alignment
This migration continues the **positive trend**:
1. ✅ Reduces indirect database calls (helper function elimination)
2. ✅ Improves type safety (tRPC + Zod)
3. ✅ Maintains Cell quality score (simple, well-tested Cell)
4. ✅ Contributes to dashboard domain specialization

---

## Next Steps

### Phase 2: Deep Analysis (MigrationAnalyst)
**Handoff to**: MigrationAnalyst  
**Required Analysis**:
1. **Data Model Analysis**
   - Examine `getCategoryBreakdown()` implementation in detail
   - Identify all database queries and transformations
   - Map data flow from database to component

2. **Procedure Design**
   - Define Zod input/output schemas
   - Plan server-side aggregation logic
   - Optimize database queries (potential single query vs multiple)

3. **Cell Architecture**
   - Design Cell component structure
   - Plan state management (loading, error, success)
   - Define behavioral assertions (6+ assertions)

4. **Test Strategy**
   - Identify test scenarios (empty data, single category, multiple categories)
   - Plan MSW mocks for tRPC
   - Coverage targets (component + procedure)

### Phase 3: Migration Planning (MigrationArchitect)
**Create**:
1. Surgical 7-step migration plan
2. Phased implementation (A: procedure, B: Cell, C: integration)
3. Rollback strategy
4. Validation checkpoints

### Phase 4: Implementation (MigrationExecutor)
**Execute**:
1. Create tRPC procedure `getCategoryBreakdown`
2. Build Cell structure with manifest + pipeline
3. Implement comprehensive tests
4. Update dashboard page
5. Validate in production build

### Success Criteria for Phase 2 Handoff
- [ ] Complete data flow mapping
- [ ] Zod schemas defined
- [ ] Behavioral assertions identified (6+)
- [ ] Test scenarios documented
- [ ] Integration points mapped
- [ ] Ready for architectural planning

---

## Appendix: Discovery Methodology

### Parallel Discovery Execution
**Subagents Deployed**: 3 specialists
1. **codebase-locator**: Found 21 unmigrated components with complexity analysis
2. **component-pattern-analyzer**: Detected anti-patterns and orphans
3. **codebase-analyzer**: Identified indirect database access patterns

### Scoring Algorithm Applied
```typescript
score = 
  (indirectDbCalls ? 30 : 0) +
  (typeErrors ? 25 : 0) +
  (highUsage ? 20 : 0) +
  (antiPatterns ? 15 : 0) +
  (complexityScore) + // 10 (low), 5 (medium), 0 (high)
  (userFacing ? 5 : 0) +
  (criticalPath ? 10 : 0)
```

### Evidence Collection
- ✅ Ledger queried (18 entries analyzed)
- ✅ Component line counts verified (`wc -l`)
- ✅ Type safety checked (`grep ": any"`)
- ✅ Import usage counted (`grep -r "import.*Component"`)
- ✅ Database calls mapped (Supabase patterns)
- ✅ Component dependencies traced

### Decision Confidence
**Confidence Level**: **VERY HIGH**
- Clear scoring winner (80 vs 55 vs 50)
- Low risk, low complexity
- Proven migration pattern
- High strategic value (type safety + indirect DB elimination)

---

## Conclusion

**Selected Target**: `SpendCategoryChart.tsx`

**Strategic Justification**:
1. **Quick Win**: Low complexity (110 lines) = fast migration (4-6 hours)
2. **High Impact**: Eliminates indirect database access pattern
3. **Type Safety**: Improves overall codebase type safety (+25 points value)
4. **User Value**: Core dashboard visualization feature
5. **Momentum**: Maintains high velocity with successful pattern

**Autonomous Decision**: Based on evidence-based scoring (80/100), this is the optimal next migration target. No human planning required - algorithm selected highest-value, lowest-risk candidate.

**Ready for Phase 2**: Complete discovery report with all context needed for MigrationAnalyst to proceed with deep analysis.

---

**Report Generated**: 2025-10-03 15:48:00  
**Agent**: MigrationScout v1.0  
**Next Agent**: MigrationAnalyst (Phase 2)  
**Status**: ✅ DISCOVERY COMPLETE - READY FOR ANALYSIS
