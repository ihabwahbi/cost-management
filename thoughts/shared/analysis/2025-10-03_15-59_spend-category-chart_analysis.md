# Migration Analysis Report: SpendCategoryChart

**Timestamp**: 2025-10-03 15:59:00  
**Agent**: MigrationAnalyst  
**Workflow Phase**: Phase 2 - Migration Analysis  
**Target Component**: SpendCategoryChart.tsx  
**Discovery Report**: `thoughts/shared/discoveries/2025-10-03_15-48_discovery-report.md`

---

## Executive Summary

**Component**: `SpendCategoryChart`  
**Path**: `apps/web/components/dashboard/spend-category-chart.tsx`  
**Complexity**: **SIMPLE** (Quick Win)  
**Migration Strategy**: Standard Cell Workflow  
**Estimated Duration**: 4-6 hours  
**Priority**: HIGH

**Key Findings**:
- ✅ Pure presentation component (no state, no side effects)
- ✅ Single integration point (dashboard page only)
- ✅ Clean data flow (helper function → props → render)
- ✅ Database schema verified and aligned
- ⚠️ 3 minor pitfalls detected (magic numbers, missing memoization)
- ✅ 8 behavioral assertions extracted
- ✅ Zero blocking issues

**Strategic Value**:
- Eliminates indirect database access pattern
- Improves type safety via tRPC + Zod
- Simplifies dashboard page (removes state management)
- Establishes pattern for other chart components

---

## Current Implementation

### File Structure

**Component**:
- **File**: `apps/web/components/dashboard/spend-category-chart.tsx`
- **Lines**: 110
- **Type**: Pure presentation component (pie chart visualization)
- **Framework**: React + Recharts + shadcn/ui

**Helper Function**:
- **File**: `apps/web/lib/dashboard-metrics.ts`
- **Function**: `getCategoryBreakdown` (lines 225-293)
- **Type**: Client-side database query + aggregation

**Integration**:
- **File**: `apps/web/app/projects/[id]/dashboard/page.tsx`
- **Usage**: Line 358
- **Pattern**: Page fetches data → passes to component as props

### Database Usage

#### Tables Accessed

**cost_breakdown** (verified schema):
```sql
id                  uuid          PRIMARY KEY
project_id          uuid          NOT NULL (FK → projects.id)
spend_type          text          NOT NULL  -- Used for category grouping
cost_line           text          NOT NULL  -- Used for filtering
budget_cost         numeric       NOT NULL DEFAULT 0
sub_business_line   text
spend_sub_category  text
created_at          timestamptz
updated_at          timestamptz
```

**po_mappings** (verified schema):
```sql
id                  uuid          PRIMARY KEY
cost_breakdown_id   uuid          NOT NULL (FK → cost_breakdown.id)
mapped_amount       numeric       NOT NULL  -- Actual spend amount
po_line_item_id     uuid          (FK → po_line_items.id)
mapping_notes       text          NULLABLE
mapped_by           varchar       NULLABLE
mapped_at           timestamptz
created_at          timestamptz
updated_at          timestamptz
```

#### Current Queries

**Query 1**: Cost Breakdown Data (lines 229-238)
```typescript
// Logical SQL
SELECT spend_type, budget_cost, id
FROM cost_breakdown
WHERE project_id = $1
  AND (cost_line = $2 OR $2 IS NULL)  -- Optional filter
```

**Query 2**: PO Mappings for Actual Spend (lines 253-256)
```typescript
// Logical SQL
SELECT cost_breakdown_id, mapped_amount
FROM po_mappings
WHERE cost_breakdown_id IN ($1, $2, ..., $n)
```

#### Client-Side Processing

**Aggregation Logic** (lines 264-290):
1. Group by `spend_type` (category)
2. Sum `budget_cost` for total budget per category
3. Sum `mapped_amount` for actual spend per category
4. **Fallback**: If no mappings exist, use `budget * 0.65` as demo data

**Example Output**:
```typescript
[
  { name: "Engineering Services", value: 125000.50, budget: 200000.00 },
  { name: "Equipment", value: 85000.00, budget: 150000.00 },
  { name: "Third Party", value: 42000.00, budget: 60000.00 }
]
```

### State Management

**Pattern**: ✅ **Pure Presentation Component**

**Characteristics**:
- ❌ No useState hooks
- ❌ No useEffect hooks
- ❌ No API calls
- ✅ Receives data via props only
- ✅ Renders based on props
- ✅ No shared state (Context, Zustand)

**State Source**: Parent component (dashboard page)
```typescript
// Dashboard page manages state
const [categoryData, setCategoryData] = useState<any[]>([])

// Fetches data on mount
const categories = await getCategoryBreakdown(projectId, filters)
setCategoryData(categories)

// Passes to component
<SpendCategoryChart data={categoryData} />
```

### Dependencies

**UI Libraries**:
- `@/components/ui/chart` (shadcn/ui) - ChartContainer, ChartConfig, ChartTooltip
- `recharts` (external) - PieChart, Pie, Cell, Tooltip, Legend

**Internal**:
- None (purely presentational)

**Data Dependencies**:
- Receives `CategoryData[]` via props
- No external data sources

### Business Logic

#### 1. Color Mapping (lines 6, 19-25)
```typescript
const COLORS = ['#0014dc', '#00d2dc', '#0099a3', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981']

// Modulo rotation for unlimited categories
const chartConfig = data.reduce((config, item, index) => {
  config[item.name] = {
    label: item.name,
    color: COLORS[index % COLORS.length]
  }
  return config
}, {} as ChartConfig)
```

**Logic**: 8 colors defined, supports unlimited categories via modulo rotation

#### 2. Custom Label Rendering (lines 28-49)
```typescript
const RADIAN = Math.PI / 180

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  if (percent < 0.05) return null  // Hide labels for slices < 5%

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}
```

**Logic**: 
- Polar to Cartesian coordinate conversion
- Hide labels for small slices (< 5%)
- Round percentage to whole number

#### 3. Custom Tooltip (lines 51-80)
```typescript
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0]
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-1 gap-1">
          <div>
            <span>{data.name}:</span>
            <span>${(data.value / 1000).toFixed(1)}K</span>  {/* Format as thousands */}
          </div>
          {data.payload.budget && (
            <div>
              <span>Budget:</span>
              <span>${(data.payload.budget / 1000).toFixed(1)}K</span>
            </div>
          )}
          <div>
            <span>Utilization:</span>
            <span>
              {data.payload.budget > 0 
                ? `${((data.value / data.payload.budget) * 100).toFixed(1)}%`
                : 'N/A'}  {/* Handle zero budget */}
            </span>
          </div>
        </div>
      </div>
    )
  }
  return null
}
```

**Logic**:
- Currency formatting: `value / 1000` with 1 decimal (e.g., $45.0K)
- Conditional budget display (only if exists)
- Utilization calculation: `(actual / budget) * 100`
- Zero budget handling: Shows "N/A"

---

## Required Changes

### Drizzle Schemas

**Required Schema Files** (both exist):

**1. cost_breakdown**
- **File**: `packages/db/src/schema/cost-breakdown.ts`
- **Status**: ✅ EXISTS
- **Usage**: Query budget data filtered by project_id and cost_line

**2. po_mappings**
- **File**: `packages/db/src/schema/po-mappings.ts`
- **Status**: ✅ EXISTS
- **Usage**: Query actual spend filtered by cost_breakdown_id array

**No new schemas required** - existing schemas cover all needs

### tRPC Procedures

#### Procedure Specification: getCategoryBreakdown

**File**: `packages/api/src/procedures/dashboard/get-category-breakdown.procedure.ts`

**Procedure Name**: `dashboard.getCategoryBreakdown`

**Architecture Compliance**:
- ✅ M1: One Procedure, One File
- ✅ M2: File size ≤200 lines (estimated ~100 lines)
- ✅ M3: No Parallel Implementations (Drizzle only)
- ✅ M4: Explicit Naming (`get-category-breakdown.procedure.ts`)

**Input Schema** (Zod):
```typescript
z.object({
  projectId: z.string().uuid(),
  filters: z.object({
    costLine: z.string().optional(),
  }).optional(),
})
```

**Input Parameters**:
- `projectId` (required): Project UUID to filter budget data
- `filters.costLine` (optional): Filter by cost line (e.g., "Capital", "Operating")

**Output Schema** (Zod):
```typescript
z.array(z.object({
  name: z.string(),       // Category name (spend_type)
  value: z.number(),      // Actual spend (from po_mappings)
  budget: z.number(),     // Budget allocation (from cost_breakdown)
}))
```

**Implementation Pattern**:

**Step 1**: Query cost_breakdown
```typescript
const whereConditions = [eq(costBreakdown.projectId, input.projectId)];

if (input.filters?.costLine) {
  whereConditions.push(eq(costBreakdown.costLine, input.filters.costLine));
}

const budgetData = await ctx.db
  .select({
    id: costBreakdown.id,
    spendType: costBreakdown.spendType,
    budgetCost: costBreakdown.budgetCost,
  })
  .from(costBreakdown)
  .where(and(...whereConditions));
```

**Step 2**: Query po_mappings
```typescript
const costBreakdownIds = budgetData.map((row) => row.id);

const mappingsData = costBreakdownIds.length > 0 
  ? await ctx.db
      .select({
        costBreakdownId: poMappings.costBreakdownId,
        mappedAmount: poMappings.mappedAmount,
      })
      .from(poMappings)
      .where(inArray(poMappings.costBreakdownId, costBreakdownIds))
  : [];
```

**Step 3**: Server-side aggregation
```typescript
const categoryMap = new Map<string, { name: string; value: number; budget: number }>();

// Initialize categories from budget data
for (const row of budgetData) {
  const category = row.spendType || 'Uncategorized';
  if (!categoryMap.has(category)) {
    categoryMap.set(category, {
      name: category,
      value: 0,
      budget: Number(row.budgetCost || 0),
    });
  } else {
    const existing = categoryMap.get(category)!;
    existing.budget += Number(row.budgetCost || 0);
  }
}

// Add actual spend from mappings
if (mappingsData.length > 0) {
  for (const mapping of mappingsData) {
    const budgetRow = budgetData.find((b) => b.id === mapping.costBreakdownId);
    if (!budgetRow) continue;

    const category = budgetRow.spendType || 'Uncategorized';
    const categoryData = categoryMap.get(category)!;
    categoryData.value += Number(mapping.mappedAmount || 0);
  }
} else {
  // Fallback: If no mappings, use 65% of budget as demo data
  for (const [category, data] of categoryMap.entries()) {
    data.value = data.budget * 0.65;
  }
}

return Array.from(categoryMap.values());
```

**Implementation Notes**:
1. Use `eq()` for project_id filter (indexed column)
2. Use `inArray()` for cost_breakdown_id filtering (efficient for small-medium arrays)
3. Use `Number()` for numeric conversion (PostgreSQL numeric → JS number)
4. Handle null values with `|| 0` for safe arithmetic
5. Server-side aggregation using JavaScript Map (maintains consistency with other procedures)
6. Fallback to demo data (65% of budget) when no mappings exist
7. Error handling with `TRPCError` wrapper
8. Log errors with `[getCategoryBreakdown]` prefix for debugging

**Required Imports**:
```typescript
import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { eq, inArray, and } from 'drizzle-orm';
import { costBreakdown, poMappings } from '@cost-mgmt/db';
import { TRPCError } from '@trpc/server';
```

**Router Integration**:

Update `packages/api/src/procedures/dashboard/dashboard.router.ts`:
```typescript
import { getCategoryBreakdownRouter } from './get-category-breakdown.procedure';

export const dashboardRouter = router({
  // ... existing procedures
  ...getCategoryBreakdownRouter,
});
```

**Domain Router Size**: File must remain ≤50 lines (architecture mandate)

---

### Cell Structure

**Location**: `components/cells/spend-category-chart/`

**File Structure**:
```
components/cells/spend-category-chart/
├── component.tsx          # Main Cell component with tRPC
├── manifest.json          # Behavioral assertions
├── pipeline.yaml          # Validation gates
└── __tests__/
    └── component.test.tsx # Unit tests
```

**Complexity**: Simple  
**Estimated Migration Time**: 4-6 hours  
**Strategy**: Standard Cell workflow

#### Behavioral Assertions (8 total)

**BA-001**: Displays pie chart with spend categories when valid data provided
- **Source**: `spend-category-chart.tsx:82-109`
- **Verification**: Render with category array, verify PieChart renders segments

**BA-002**: Renders empty state when no data available
- **Source**: Dashboard page integration `page.tsx:357-363`
- **Verification**: Query returns empty array, verify empty message shown

**BA-003**: Hides percentage labels for slices < 5%
- **Source**: `spend-category-chart.tsx:35`
- **Verification**: Create data with 3% slice, verify label not rendered

**BA-004**: Shows tooltip with value, budget, and utilization on hover
- **Source**: `spend-category-chart.tsx:51-80`
- **Verification**: Hover over slice, verify tooltip contains all metrics formatted

**BA-005**: Displays 'N/A' for utilization when budget is zero
- **Source**: `spend-category-chart.tsx:70-72`
- **Verification**: Pass category with budget: 0, verify tooltip shows 'N/A'

**BA-006**: Formats currency as thousands with one decimal (e.g., $45.0K)
- **Source**: `spend-category-chart.tsx:59, 64`
- **Verification**: Pass value 45000, verify displays '$45.0K'

**BA-007**: Assigns colors using modulo rotation through 8-color palette
- **Source**: `spend-category-chart.tsx:6, 22, 96`
- **Verification**: Pass 10 categories, verify colors cycle correctly

**BA-008**: Shows loading skeleton during data fetch
- **Source**: Cell implementation (new)
- **Verification**: Mock pending query, verify Skeleton component visible

#### Pipeline Gates (5 total)

**Gate 1**: TypeScript Zero Errors
- **Command**: `pnpm type-check`
- **Requirement**: Zero TypeScript compilation errors

**Gate 2**: Unit Test Coverage
- **Command**: `pnpm test spend-category-chart`
- **Requirement**: 80%+ coverage, all 8 assertions verified

**Gate 3**: Production Build
- **Command**: `pnpm build`
- **Requirement**: Build succeeds without errors

**Gate 4**: Performance Baseline
- **Requirement**: Load time ≤110% of current implementation

**Gate 5**: Accessibility
- **Requirement**: Chart has proper ARIA labels, keyboard navigation works

---

## Integration Analysis

### Imported By

**Import Count**: 1 component

**1. Dashboard Page** (Critical Path)
- **File**: `apps/web/app/projects/[id]/dashboard/page.tsx`
- **Import Statement** (line 13):
  ```typescript
  import { SpendCategoryChart } from '@/components/dashboard/spend-category-chart'
  ```
- **Usage** (line 358):
  ```typescript
  <SpendCategoryChart data={categoryData} />
  ```
- **Context**: Rendered inside Card component in dashboard grid layout
- **Navigation Path**: `/projects` → Dashboard button → `/projects/[id]/dashboard`

### Shared State

**Pattern**: ✅ **Pure Prop-Based (No Shared State)**

**Analysis**:
- ✅ No Context usage (only internal ChartContext from shadcn/ui)
- ✅ No Zustand stores
- ✅ No global state dependencies
- ✅ All data passed via `data` prop
- ✅ No side effects
- ✅ No mutations or callbacks

**State Flow**:
```
Dashboard Page State → SpendCategoryChart Props
     ↑
getCategoryBreakdown() function
     ↑
Supabase Database Query
```

### Breaking Changes

**Risk Level**: 🟢 **LOW**

**Files Requiring Updates**: **1 file only**
- `/home/iwahbi/dev/cost-management/apps/web/app/projects/[id]/dashboard/page.tsx`

**Critical Path Assessment**:
- ✅ IS a critical dashboard component
- ✅ IS on main user journey (Projects → Dashboard)
- ✅ IS actively used in production flow

**Risk Factors**:

| Factor | Risk Level | Details |
|--------|-----------|---------|
| Import Count | 🟢 Low | Only 1 file imports component |
| State Coupling | 🟢 Low | Zero shared state dependencies |
| Data Flow | 🟢 Low | Simple prop-based data passing |
| Side Effects | 🟢 Low | No side effects to manage |
| Interface Changes | 🟡 Medium | Props interface must remain compatible |
| Critical Path | 🔴 High | Dashboard is key user feature |

**Overall Risk**: **🟢 LOW-MEDIUM** (Low technical risk, medium business impact)

**Potential Breaking Changes**:
1. Component name change: `SpendCategoryChart` → `SpendCategoryChartCell`
   - **Impact**: Dashboard page import needs update
   - **Mitigation**: Atomic replacement in Phase 4

2. Props interface change: `data` prop → `projectId` + `filters` props
   - **Impact**: Dashboard page removes data fetching logic
   - **Mitigation**: Cell fetches own data via tRPC

**Migration Simplification**:

**Current Dashboard Complexity** (Before Cell):
```typescript
const [categoryData, setCategoryData] = useState<any[]>([])  // State
const categories = await getCategoryBreakdown(projectId, filters)  // Fetch
setCategoryData(categories)  // Update
<SpendCategoryChart data={categoryData} />  // Pass
```

**After Cell Migration** (Simplified):
```typescript
<SpendCategoryChartCell projectId={projectId} filters={filters} />
```

**Lines Removed**: ~15 lines of data fetching logic  
**State Variables Removed**: 1  
**Complexity Reduction**: 🟢 Significant

---

## Pitfall Warnings

### Detected Pitfalls: 3 warnings

**🟡 Pitfall #1: Unmemoized Chart Configuration**
- **Location**: `spend-category-chart.tsx:19-25`
- **Risk**: LOW (only recreated when data prop changes, which is infrequent)
- **Issue**: `chartConfig` object created on every render
- **Fix Required**:
  ```typescript
  const chartConfig = useMemo(() => 
    data.reduce((config, item, index) => {
      config[item.name] = {
        label: item.name,
        color: COLORS[index % COLORS.length]
      }
      return config
    }, {} as ChartConfig),
    [data]
  )
  ```

**🟡 Pitfall #2: Magic Number - Slice Threshold**
- **Location**: `spend-category-chart.tsx:35`
- **Risk**: LOW (but reduces maintainability)
- **Issue**: Hardcoded `0.05` (5% threshold) without named constant
- **Fix Required**:
  ```typescript
  const MIN_LABEL_THRESHOLD = 0.05  // 5% minimum for label display
  if (percent < MIN_LABEL_THRESHOLD) return null
  ```

**🟡 Pitfall #3: Magic Number - Demo Utilization Rate**
- **Location**: `dashboard-metrics.ts:288`
- **Risk**: MEDIUM (business logic should be explicit)
- **Issue**: Hardcoded `0.65` (65% fallback) without named constant
- **Fix Required**:
  ```typescript
  const DEMO_UTILIZATION_RATE = 0.65  // 65% of budget for demo data
  categories[key].value = categories[key].budget * DEMO_UTILIZATION_RATE
  ```

**✅ No Critical Issues**:
- ✅ No infinite render loop risk (pure presentation component)
- ✅ No date serialization issues (no dates used)
- ✅ No division by zero (protected by conditional)
- ✅ No SQL syntax issues (Supabase query builder)

---

## Recommendations

### Migration Strategy

**Approach**: **Standard Cell Workflow**

**Justification**:
- Simple component (110 lines)
- Single tRPC query needed
- No complex state management
- Clean integration point

**Phasing Required**: **NO**

**Reasons**:
- Only 1 database query pattern (aggregated into single tRPC procedure)
- Simple aggregation logic
- Low complexity overall

**Testing Requirements**: **Standard**

**Why**:
- Not complex enough to require extensive testing
- Dashboard is user-facing, but component is simple
- 80%+ unit test coverage sufficient

**Priority**: **HIGH (Quick Win)**

**Factors**:
- **Effort**: Low (4-6 hours)
- **Value**: High (simplifies critical dashboard)
- **Risk**: Low (isolated component)
- **Impact**: Positive (removes complexity from page)

### Phasing

**Phase A**: tRPC Procedure (2-3 hours)
1. Create `get-category-breakdown.procedure.ts`
2. Implement Drizzle queries with aggregation logic
3. Add Zod input/output schemas
4. Test via curl with real project UUID
5. Deploy to edge function
6. Verify response matches current implementation

**Phase B**: Cell Creation (1-2 hours)
1. Create Cell directory structure
2. Implement `component.tsx` with tRPC data fetching
3. Add loading, error, and empty states
4. Create `manifest.json` with 8 behavioral assertions
5. Create `pipeline.yaml` with 5 validation gates
6. Write unit tests for all assertions

**Phase C**: Integration + Testing (1 hour)
1. Update dashboard page import
2. Replace `<SpendCategoryChart data={...} />` with `<SpendCategoryChartCell projectId={...} filters={...} />`
3. Remove `categoryData` state variable
4. Remove `getCategoryBreakdown()` call from Promise.all
5. Test dashboard loads without errors
6. Verify chart renders correctly
7. Test filter changes propagate to Cell
8. Manual validation gate (human approval)
9. Delete old component file
10. Update ledger.jsonl

**Estimated Duration**: 4-6 hours total

---

## Next Steps

### Phase 3: Migration Planning (MigrationArchitect)

**Handoff Requirements**:
- ✅ Complete data flow mapping
- ✅ Zod schemas defined
- ✅ Behavioral assertions identified (8 total)
- ✅ Test scenarios documented
- ✅ Integration points mapped
- ✅ Architecture compliance verified
- ✅ Database schema verified

**MigrationArchitect Tasks**:
1. Create surgical 7-step migration plan
2. Define phased implementation (A: procedure, B: Cell, C: integration)
3. Plan rollback strategy
4. Set validation checkpoints
5. Document success criteria

### Success Criteria for Phase 2 Handoff

- [x] All parallel analyses complete and synthesized
- [x] Database schema verified against actual Supabase structure
- [x] Minimum 3 behavioral assertions extracted (8 extracted)
- [x] All pitfalls detected with file:line references (3 found)
- [x] Complete tRPC procedure specifications ready
- [x] Drizzle schema requirements documented
- [x] Cell structure fully specified
- [x] Migration complexity assessed with time estimate
- [x] Comprehensive analysis report generated
- [x] Ready for MigrationArchitect (Phase 3) handoff

---

## Appendix

### Analysis Methodology

**Parallel Discovery Execution**:
- **Subagents Deployed**: 3 specialists
  1. **codebase-analyzer**: Deep code tracing with ULTRATHINK enhancement
  2. **database-schema-analyzer**: Query mapping and tRPC procedure design with ULTRATHINK
  3. **codebase-locator**: Integration mapping and import chain analysis

**Database Verification**:
- Used Supabase MCP tools to verify actual schema
- Confirmed all fields and relationships match code expectations
- Verified foreign key constraints

**Evidence Collection**:
- ✅ Component code analyzed (110 lines)
- ✅ Helper function analyzed (69 lines)
- ✅ Database queries mapped (2 queries)
- ✅ Integration point verified (1 import)
- ✅ Behavioral assertions extracted (8 total)
- ✅ Pitfalls detected (3 warnings)
- ✅ Dependencies traced (Recharts, shadcn/ui)

### Decision Confidence

**Confidence Level**: **VERY HIGH**

**Reasons**:
- Complete source code review
- Database schema verified against actual Supabase structure
- All integration points mapped
- Parallel subagent analyses cross-validated
- No missing dependencies
- No blocking issues
- Clear migration path

### Key Files Analyzed

| Component | File | Lines |
|-----------|------|-------|
| Component | spend-category-chart.tsx | 110 |
| Props Interface | spend-category-chart.tsx | 8-16 |
| Color Array | spend-category-chart.tsx | 6 |
| Chart Config | spend-category-chart.tsx | 19-25 |
| Custom Label | spend-category-chart.tsx | 28-49 |
| Custom Tooltip | spend-category-chart.tsx | 51-80 |
| Pie Chart Render | spend-category-chart.tsx | 82-110 |
| Helper Function | dashboard-metrics.ts | 225-293 |
| DB Query 1 | dashboard-metrics.ts | 229-238 |
| DB Query 2 | dashboard-metrics.ts | 253-256 |
| Aggregation Logic | dashboard-metrics.ts | 264-290 |
| Demo Fallback | dashboard-metrics.ts | 285-290 |
| Dashboard Integration | page.tsx | 13, 106, 358 |

---

**Report Generated**: 2025-10-03 15:59:00  
**Agent**: MigrationAnalyst v2.0  
**Next Agent**: MigrationArchitect (Phase 3)  
**Status**: ✅ ANALYSIS COMPLETE - READY FOR PLANNING
