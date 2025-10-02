# Migration Analysis Report: budget-timeline-chart.tsx

## Metadata
- **Timestamp**: 2025-10-02T18:30:00Z
- **Agent**: MigrationAnalyst 
- **Workflow Phase**: Phase 2: Migration Analysis
- **Target Component**: budget-timeline-chart.tsx
- **Discovery Report**: thoughts/shared/discoveries/2025-10-02_18-00_discovery-report.md
- **Enhancement Mode**: ULTRATHINK applied for comprehensive analysis

## Current Implementation

### File Information
- **Path**: `apps/web/components/dashboard/budget-timeline-chart.tsx`
- **Line Count**: 87
- **Complexity Assessment**: Simple

### Database Usage
The component currently receives data via props, but the data originates from:

**Queries** (from `lib/dashboard-metrics.ts:getTimelineData()`):
```sql
-- Query 1: Fetch budget data
SELECT budget_cost 
FROM cost_breakdown 
WHERE project_id = ? 
  AND (cost_line = ? OR cost_line IS NULL)
  AND (spend_type = ? OR spend_type IS NULL)
```

**Tables Accessed**:
- `cost_breakdown` - For budget data aggregation
- No direct database access in component (receives via props)

**Query Type**: SELECT with optional filters

### State Management
- **Pattern**: Pure presentational component
- **State Variables**: None
- **Props Interface**:
  ```typescript
  interface BudgetTimelineChartProps {
    data: TimelineData[]
  }
  
  interface TimelineData {
    month: string
    budget: number
    actual: number
    forecast: number
  }
  ```

### Dependencies

**UI Libraries**:
- `recharts@2.15.4` - Chart visualization library
  - ComposedChart, Area, Bar, Line, XAxis, YAxis, CartesianGrid, Legend

**Internal Components**:
- `@/components/ui/chart` - shadcn chart infrastructure
  - ChartContainer (ResponsiveContainer wrapper)
  - ChartConfig (configuration type)
  - ChartTooltip (tooltip wrapper)
  - ChartTooltipContent (custom tooltip renderer)

### Business Logic

1. **Currency Formatting** (lines 47, 55)
   - Y-axis: `$${(value / 1000).toFixed(0)}K` - No decimal places
   - Tooltip: `$${(Number(value) / 1000).toFixed(1)}K` - 1 decimal place
   - Location: Embedded in component

2. **Chart Configuration** (lines 6-19)
   - Budget: Blue (#0014dc)
   - Actual: Cyan (#00d2dc) 
   - Forecast: Teal (#0099a3)
   - Colors applied via CSS variables

3. **Data Visualization**
   - Area chart for budget (with 0.2 opacity fill)
   - Line chart for actual spend (with dots)
   - Bar chart for forecast (0.6 opacity)

## Required Changes

### Drizzle Schemas

**Cost Breakdown Schema** (already exists):
```typescript
// packages/db/src/schema/cost-breakdown.ts
export const costBreakdown = pgTable('cost_breakdown', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => projects.id),
  subBusinessLine: text('sub_business_line'),
  costLine: text('cost_line'),
  spendType: text('spend_type'),
  spendSubCategory: text('spend_sub_category'),
  budgetCost: numeric('budget_cost', { precision: 15, scale: 2 }).default('0'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})
```

### tRPC Procedures

**Procedure 1: dashboard.getTimelineBudget**
```typescript
// packages/api/src/routers/dashboard.ts
.getTimelineBudget: publicProcedure
  .input(z.object({
    projectId: z.string().uuid(),
    filters: z.object({
      costLine: z.string().optional(),
      spendType: z.string().optional(),
      dateRange: z.object({
        from: z.string().transform(val => new Date(val)),
        to: z.string().transform(val => new Date(val))
      }).optional()
    }).optional()
  }))
  .query(async ({ ctx, input }) => {
    // Build query with Drizzle
    const conditions = [
      eq(costBreakdown.projectId, input.projectId)
    ]
    
    if (input.filters?.costLine && input.filters.costLine !== 'all') {
      conditions.push(eq(costBreakdown.costLine, input.filters.costLine))
    }
    
    if (input.filters?.spendType && input.filters.spendType !== 'all') {
      conditions.push(eq(costBreakdown.spendType, input.filters.spendType))
    }
    
    const result = await ctx.db
      .select({
        totalBudget: sum(costBreakdown.budgetCost)
      })
      .from(costBreakdown)
      .where(and(...conditions))
    
    const totalBudget = Number(result[0]?.totalBudget || 0)
    
    // Generate timeline data (similar to current implementation)
    return generateTimelineData(totalBudget, input.filters?.dateRange)
  })
```

**Output Schema**:
```typescript
z.array(z.object({
  month: z.string(),
  budget: z.number(),
  actual: z.number(),
  forecast: z.number()
}))
```

**Implementation Notes**:
- Use `sum()` for aggregation with null safety (|| 0)
- Use `and()` with conditional filter array
- Transform dates properly in input schema
- Consider caching timeline data with `staleTime`

### Cell Structure
- **Location**: `components/cells/budget-timeline-chart/`
- **Complexity**: Simple-Medium (with data fetching)
- **Estimated Migration Time**: 3-4 hours

**Required Files**:
```yaml
budget-timeline-chart/
├── component.tsx       # Main Cell with tRPC integration
├── manifest.json      # Behavioral assertions
├── pipeline.yaml      # Validation gates
└── __tests__/
    └── component.test.tsx  # Unit tests
```

### Behavioral Assertions

**BA-001: Chart Visualization**
- **Description**: Component renders ComposedChart with Area (budget), Line (actual), and Bar (forecast)
- **Source**: Current implementation lines 64-84
- **Verification**: Mock data, verify three chart types render

**BA-002: Currency Formatting - Y-Axis**
- **Description**: Y-axis formats values as currency with K notation (e.g., "$100K") 
- **Source**: Current implementation line 47
- **Verification**: Render chart, check Y-axis labels

**BA-003: Currency Formatting - Tooltip**
- **Description**: Tooltip shows values with 1 decimal precision (e.g., "$100.5K")
- **Source**: Current implementation line 55
- **Verification**: Hover over data point, verify tooltip format

**BA-004: Empty Data Handling**
- **Description**: Component gracefully handles empty data array
- **Source**: Implicit - needs to be added
- **Verification**: Pass empty array, verify no crash

**BA-005: Loading State Display**
- **Description**: Component shows skeleton loader during data fetch
- **Source**: To be implemented in Cell version
- **Verification**: Mock loading state, verify skeleton appears

**BA-006: Error State Handling**
- **Description**: Component displays error message on query failure
- **Source**: To be implemented in Cell version
- **Verification**: Mock query error, verify error message

### Pipeline Gates
```yaml
gates:
  - type: "types"
    requirement: "TypeScript zero errors"
  - type: "tests"  
    requirement: "80%+ coverage, all assertions verified"
  - type: "build"
    requirement: "Production build succeeds"
  - type: "performance"
    requirement: "Load time ≤110% of current implementation"
  - type: "accessibility"
    requirement: "Chart has proper ARIA labels"
```

## Integration Analysis

### Imported By
- **Count**: 1
- **Components**:
  - `apps/web/app/projects/[id]/dashboard/page.tsx` (line 15, usage at line 433)
  - **Usage**: Project dashboard budget visualization
  - **Criticality**: critical_path

### Shared State
- **Detected**: No
- **Notes**: Component is self-contained, receives data via props

### Breaking Changes
- **Risk Level**: Low-Medium
- **Potential Breaks**:
  - **Change**: Component will fetch its own data instead of receiving via props
  - **Impact**: Parent component needs to remove data fetching logic
  - **Mitigation**: Coordinate with dashboard page update
  
  - **Change**: Component name might change to follow Cell naming convention
  - **Impact**: Single import to update
  - **Mitigation**: Simple find/replace

### Critical Path Assessment
- **Is Critical**: Yes
- **Reason**: Core budget visualization on project dashboard
- **Testing Requirement**: Manual validation required in Phase 4

## Pitfall Warnings

### Detected Pitfalls

**Pitfall 1: Type Safety Issue**
- **Location**: Line 54
- **Risk**: Loss of type safety in tooltip formatter
- **Current Code**: 
  ```typescript
  formatter={(value: any) => {
    return `$${(Number(value) / 1000).toFixed(1)}K`
  }}
  ```
- **Fix Required**:
  ```typescript
  formatter={(value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    return `$${(numValue / 1000).toFixed(1)}K`
  }}
  ```

**Pitfall 2: No Error Boundaries**
- **Location**: Entire component
- **Risk**: Component crash affects entire dashboard
- **Fix Required**: Add error boundary and empty state handling

**Pitfall 3: Unmemoized Configuration**
- **Location**: Lines 6-19, 35
- **Risk**: Unnecessary re-renders
- **Fix Required**: Memoize chartConfig and margin objects

**Pitfall 4: Missing Loading/Error States**
- **Location**: Component interface
- **Risk**: Poor UX during data fetching
- **Fix Required**: Add loading skeleton and error message components

## Recommendations

### Migration Strategy
- **Approach**: Standard Cell workflow with tRPC integration
- **Phasing Required**: No (single query, simple component)
- **Estimated Duration**: 3-4 hours
- **Priority**: High (dashboard component, type safety issues)

### Implementation Order
1. **Phase A (1 hour)**: Create and test tRPC procedure
2. **Phase B (1.5 hours)**: Implement Cell with data fetching
3. **Phase C (0.5 hour)**: Add loading/error states
4. **Phase D (1 hour)**: Write tests and validate

### Special Considerations
- Coordinate with dashboard page maintainer for prop removal
- Ensure timeline data generation logic matches current behavior
- Consider extracting currency formatter to shared utility
- Evaluate shadcn chart alternatives for future consolidation

## Next Steps

### Phase 3: Migration Planning (MigrationArchitect)
1. Create detailed surgical migration plan
2. Design tRPC procedure with exact Drizzle queries
3. Plan Cell structure with all required files
4. Define test scenarios for behavioral assertions
5. Schedule coordination with dashboard page update

### Critical Information for Phase 3
- Component is actively used in critical path
- Data currently comes from direct Supabase queries
- Must maintain exact data shape for compatibility
- Type safety improvement is priority
- Loading/error states are new requirements

---

**Analysis Complete**: Ready for Phase 3 (Migration Planning)
**Confidence Level**: High
**All requirements analyzed**: ✅