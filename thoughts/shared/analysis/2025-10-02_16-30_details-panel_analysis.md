# Migration Analysis Report: details-panel.tsx

## Metadata

- **Timestamp**: 2025-10-02 16:30
- **Agent**: MigrationAnalyst  
- **Workflow Phase**: Phase 2: Migration Analysis
- **Target Component**: apps/web/components/details-panel.tsx
- **Discovery Report**: thoughts/shared/discoveries/2025-10-02_discovery-report.md
- **Analysis Depth**: Comprehensive with parallel subagent orchestration

## Current Implementation

### Component Overview
- **File Path**: apps/web/components/details-panel.tsx
- **Line Count**: 816 lines
- **Complexity Assessment**: COMPLEX (9 database queries, 15+ state variables)

### Database Usage

**9 Direct Supabase Queries Identified**:

| Query | Location | Table(s) | Type | Purpose |
|-------|----------|----------|------|---------|
| Q1 | Line 165 | projects | SELECT | Fetch all projects for dropdown |
| Q2 | Lines 177-180 | cost_breakdown | SELECT DISTINCT | Get unique spend types by project |
| Q3 | Lines 197-201 | cost_breakdown | SELECT DISTINCT | Get unique subcategories |
| Q4 | Lines 218-225 | cost_breakdown + projects (JOIN) | SELECT | Find matching cost breakdown |
| Q5 | Lines 237-249 | po_mappings + 3 tables (JOIN) | SELECT | Fetch existing mappings |
| Q6 | Lines 299-300 | cost_breakdown | SELECT | Find cost breakdown for update |
| Q7 | Lines 310-315 | po_mappings | UPDATE | Update existing mappings |
| Q8 | Line 342 | po_mappings | DELETE | Clear all mappings |

### State Management

**15 useState Hooks**:
```typescript
selectedProject: string          // Current project selection
selectedSpendType: string        // Current spend type
selectedSpendSubCategory: string // Current subcategory
mappingNotes: string            // User notes
existingMappings: any[]         // Current PO mappings (TYPE ISSUE)
saving: boolean                 // Save operation flag
projects: Project[]             // All projects
spendTypes: SpendType[]         // Filtered spend types
spendSubCategories: SubCat[]   // Filtered subcategories
availableCostBreakdowns: CB[]  // Matching breakdowns
editingMapping: string | null   // Edit mode ID
editProject: string            // Edit mode project
editSpendType: string          // Edit mode spend type
editSpendSubCategory: string   // Edit mode subcategory
editNotes: string              // Edit mode notes
hasMappings: boolean           // Mapping existence flag
isEditMode: boolean            // Create/update mode
showClearConfirmation: boolean // Clear dialog visible
clearing: boolean              // Clear operation flag
```

### Dependencies

**UI Libraries**:
- @/components/ui/card
- @/components/ui/label
- @/components/ui/select
- @/components/ui/textarea
- @/components/ui/button
- @/components/ui/badge
- @/components/ui/separator

**Data Libraries**:
- @/lib/supabase/client (direct database access)

**Internal Components**:
- Custom SVG icon components (defined inline)

### Business Logic

1. **PO Mapping Creation Workflow** (lines 273-291):
   - Select project → spend type → subcategory (cascading)
   - Find matching cost breakdown
   - Create mappings for all PO line items
   - Refresh display and invoke callback

2. **Mapping Update Workflow** (lines 293-333):
   - Find new cost breakdown based on selections
   - Batch update all mappings in group
   - Refresh display

3. **Clear Mapping Workflow** (lines 335-361):
   - Show confirmation dialog
   - Delete all mappings for PO line items
   - Refresh display

4. **Data Cascading Logic**:
   - Project selection → Load spend types → Reset downstream
   - Spend type selection → Load subcategories → Reset downstream
   - Subcategory selection → Find exact cost breakdown match

## Required Changes

### Drizzle Schemas

**1. projects.ts** (existing, verified):
```typescript
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  subBusinessLine: text('sub_business_line').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

**2. cost-breakdown.ts** (existing, verified):
```typescript
export const costBreakdown = pgTable('cost_breakdown', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => projects.id),
  subBusinessLine: text('sub_business_line').notNull(),
  costLine: text('cost_line').notNull(),
  spendType: text('spend_type').notNull(),
  spendSubCategory: text('spend_sub_category').notNull(),
  budgetCost: numeric('budget_cost', { precision: 15, scale: 2 }).default('0'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

**3. pos.ts** (existing, verified - RLS DISABLED ⚠️):
```typescript
export const pos = pgTable('pos', {
  id: uuid('id').primaryKey().defaultRandom(),
  poNumber: varchar('po_number').notNull(),
  vendorName: varchar('vendor_name').notNull(),
  totalValue: numeric('total_value').notNull(),
  poCreationDate: date('po_creation_date').notNull(),
  location: varchar('location'),
  fmtPo: boolean('fmt_po').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

**4. po-line-items.ts** (existing, verified - RLS DISABLED ⚠️):
```typescript
export const poLineItems = pgTable('po_line_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  poId: uuid('po_id').notNull().references(() => pos.id),
  lineItemNumber: integer('line_item_number').notNull(),
  partNumber: varchar('part_number'),
  description: text('description').notNull(),
  quantity: numeric('quantity').notNull(),
  uom: varchar('uom'),
  lineValue: numeric('line_value'),
  createdAt: timestamp('created_at').defaultNow(),
});
```

**5. po-mappings.ts** (existing, verified - RLS DISABLED ⚠️):
```typescript
export const poMappings = pgTable('po_mappings', {
  id: uuid('id').primaryKey().defaultRandom(),
  poLineItemId: uuid('po_line_item_id').notNull().references(() => poLineItems.id),
  costBreakdownId: uuid('cost_breakdown_id').notNull().references(() => costBreakdown.id),
  mappedAmount: numeric('mapped_amount').notNull(),
  mappingNotes: text('mapping_notes'),
  mappedBy: varchar('mapped_by'),
  mappedAt: timestamp('mapped_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

### tRPC Procedures

**New Router**: `packages/api/src/routers/po-mapping.ts`

```typescript
// 9 procedures needed to replace direct queries:

1. poMapping.getProjects
   Input: none
   Output: z.array(z.object({ id, name, subBusinessLine }))
   Implementation: SELECT * FROM projects ORDER BY name

2. poMapping.getSpendTypes
   Input: z.object({ projectId: z.string().uuid() })
   Output: z.array(z.string())
   Implementation: SELECT DISTINCT spend_type WHERE project_id = ?

3. poMapping.getSpendSubCategories
   Input: z.object({ projectId: z.string().uuid(), spendType: z.string() })
   Output: z.array(z.string())
   Implementation: SELECT DISTINCT spend_sub_category WHERE project_id = ? AND spend_type = ?

4. poMapping.findMatchingCostBreakdown
   Input: z.object({ projectId, spendType, spendSubCategory })
   Output: z.array(costBreakdownSchema)
   Implementation: SELECT with JOIN to projects

5. poMapping.getExistingMappings
   Input: z.object({ poId: z.string().uuid() })
   Output: z.array(mappingWithRelationsSchema)
   Implementation: Complex JOIN across 4 tables

6. poMapping.createMapping
   Input: z.object({ poId, costBreakdownId, mappingNotes: z.string().optional() })
   Output: z.object({ success: z.boolean() })
   Implementation: Insert po_mappings for all line items

7. poMapping.updateMapping
   Input: z.object({ mappingIds: z.array(z.string()), costBreakdownId, mappingNotes })
   Output: z.object({ success: z.boolean() })
   Implementation: Batch UPDATE po_mappings

8. poMapping.clearMappings
   Input: z.object({ poLineItemIds: z.array(z.string().uuid()) })
   Output: z.object({ success: z.boolean() })
   Implementation: DELETE FROM po_mappings WHERE po_line_item_id IN (?)

9. poMapping.getCostBreakdownById
   Input: z.object({ projectId, spendType, spendSubCategory })
   Output: z.object({ id: z.string().uuid() })
   Implementation: Find single cost breakdown for update
```

### Cell Structure

Due to complexity (816 lines, 9 queries), recommend **PHASED IMPLEMENTATION**:

```yaml
phase_1_sub_cells:
  details-panel-viewer:
    location: "components/cells/details-panel-viewer/"
    purpose: "Read-only PO details display"
    queries: 1 (getExistingMappings)
    complexity: "Simple"
    
  details-panel-selector:
    location: "components/cells/details-panel-selector/"
    purpose: "Cascading dropdown selectors"
    queries: 4 (projects, spend types, subcategories, find breakdown)
    complexity: "Medium"
    
  details-panel-mapper:
    location: "components/cells/details-panel-mapper/"
    purpose: "Mapping CRUD operations"
    queries: 4 (create, update, clear, refresh)
    complexity: "Medium"

phase_2_integration:
  combined_cell:
    location: "components/cells/details-panel/"
    purpose: "Orchestrate sub-cells"
    complexity: "Simple orchestration"
```

### Behavioral Assertions

1. **BA-001**: Component displays empty state message with icon when no PO is selected
   - Source: Lines 417-432
   - Test: Render without selectedPO prop, verify message shown

2. **BA-002**: Component shows "PO Not Mapped" state with create button when PO has no mappings
   - Source: Lines 448-465
   - Test: Pass PO with no existing mappings, verify create button visible

3. **BA-003**: Component displays current mappings in green card when PO has mappings
   - Source: Lines 564-751
   - Test: Pass PO with mappings, verify green card displayed

4. **BA-004**: Save button is disabled when required fields are not selected
   - Source: Lines 549-555
   - Test: Leave fields empty, verify button disabled state

5. **BA-005**: Component shows two-step confirmation dialog before clearing mappings
   - Source: Lines 592-626
   - Test: Click clear, verify confirmation dialog appears

6. **BA-006**: Component resets all selection states when PO changes
   - Source: Lines 135-138
   - Test: Change selectedPO prop, verify all states reset to empty

7. **BA-007**: Spend type dropdown is disabled until project is selected
   - Source: Line 499
   - Test: No project selected, verify spend type dropdown disabled

8. **BA-008**: Subcategory dropdown is disabled until spend type is selected
   - Source: Lines 517-518
   - Test: No spend type selected, verify subcategory dropdown disabled

9. **BA-009**: Currency values are formatted as AUD with no decimal places
   - Source: Lines 395-402
   - Test: Pass numeric value, verify AUD formatting

10. **BA-010**: Line items display "N/A" for invalid or null line values
    - Source: Lines 803-805
    - Test: Pass null/undefined line value, verify "N/A" displayed

### Pipeline Gates

```yaml
validation_gates:
  - gate: "types"
    requirement: "TypeScript compiles with zero errors"
    critical_areas: "Remove all 'any' types"
    
  - gate: "tests"
    requirement: "80%+ coverage, all 10 behavioral assertions verified"
    test_types: "Unit tests for each sub-cell"
    
  - gate: "build"
    requirement: "Production build succeeds"
    
  - gate: "performance"
    requirement: "Load time ≤110% of current implementation"
    baseline: "Current 9 direct queries"
    
  - gate: "accessibility"
    requirement: "WCAG AA compliance"
    focus_areas: "Dropdown keyboard navigation, form labels"
```

## Integration Analysis

### Imported By

**Count**: 1 component
- **Path**: apps/web/app/po-mapping/page.tsx (line 8)
- **Usage**: Main PO mapping page component
- **Criticality**: CRITICAL PATH - Core business feature

### Props Interface

```typescript
interface DetailsPanelProps {
  selectedPO: PO | null
  costBreakdowns: CostBreakdown[]
  onSaveMapping: (poId: string, costBreakdownId: string, notes?: string) => Promise<boolean>
  onMappingChange?: () => Promise<void>
}
```

### Shared State

**Detected**: NO
- Component is self-contained
- No context providers used
- No global state management

### Breaking Changes

**Risk Level**: LOW
- Only 1 importer to update
- Props interface will remain compatible
- Internal implementation changes only

**Potential Breaks**:
1. Component path change → Import update needed
2. Type definitions need extraction to shared file
3. Callbacks might need adjustment for tRPC

### Critical Path Assessment

- **Is Critical**: YES - Main dashboard PO mapping feature
- **Testing Requirement**: Manual validation required in Phase 4
- **User Impact**: High - Core financial tracking functionality

## Pitfall Warnings

### Detected Pitfalls

1. **Type Safety Violations**
   - **Location**: Line 110
   - **Issue**: `existingMappings: any[]` loses type safety
   - **Risk**: Runtime errors, incorrect data handling
   - **Fix Required**: Define proper TypeScript interface

2. **State Management Complexity**
   - **Location**: Lines 106-124
   - **Issue**: 15+ useState hooks in single component
   - **Risk**: State synchronization issues, re-render storms
   - **Fix Required**: Use useReducer or extract to custom hooks

3. **Direct Database Access**
   - **Location**: 9 locations (see database usage section)
   - **Issue**: Bypassing tRPC layer, no type safety
   - **Risk**: Schema changes break component silently
   - **Fix Required**: Migrate to tRPC procedures

4. **Missing Error Boundaries**
   - **Location**: All try-catch blocks
   - **Issue**: Only console.error, no user feedback
   - **Risk**: Silent failures, poor UX
   - **Fix Required**: Add toast notifications and error states

5. **Client-Side Data Filtering**
   - **Location**: Lines 184-186, 205-207
   - **Issue**: Fetching all data then filtering for unique values
   - **Risk**: Performance degradation with large datasets
   - **Fix Required**: Use DISTINCT in SQL or server-side filtering

6. **Missing Memoization**
   - **Location**: Throughout component
   - **Issue**: No useMemo for expensive operations
   - **Risk**: Potential infinite render loops with tRPC
   - **Fix Required**: Memoize all query inputs and expensive calculations

7. **Security Risk: RLS Disabled**
   - **Location**: Database tables
   - **Issue**: RLS disabled on pos, po_line_items, po_mappings tables
   - **Risk**: Unrestricted data access
   - **Fix Required**: Enable RLS with proper policies

## Recommendations

### Migration Strategy

**Approach**: PHASED IMPLEMENTATION (High Complexity)

**Phase 1**: Extract shared types (1 hour)
- Create `types/po-mapping.ts`
- Define all interfaces properly
- Remove type duplication

**Phase 2**: Create tRPC procedures (3 hours)
- Implement all 9 procedures
- Test with curl/Postman
- Deploy edge function

**Phase 3**: Create sub-cells (6-8 hours)
- details-panel-viewer (2 hours)
- details-panel-selector (3 hours)
- details-panel-mapper (3 hours)

**Phase 4**: Integration & Testing (2 hours)
- Combine sub-cells
- Update po-mapping page
- Manual validation

### Phasing Required

**YES** - Component complexity warrants phased approach:
- 816 lines → Break into 3-4 components
- 9 queries → Implement incrementally
- 15+ state variables → Gradual migration

### Estimated Duration

**Total**: 12-14 hours
- Type extraction: 1 hour
- tRPC procedures: 3 hours
- Sub-cell implementation: 6-8 hours
- Integration & testing: 2 hours
- Buffer for issues: 2 hours

### Priority

**HIGH** - Critical business feature with architectural violations

### Risk Mitigation

1. **Create comprehensive test suite first**
2. **Implement feature flag for gradual rollout**
3. **Keep old component as fallback**
4. **Test all CRUD operations thoroughly**
5. **Enable RLS before production**

## Next Steps

### Phase 3: Migration Planning

Hand off to MigrationArchitect for:
1. Create detailed sub-cell specifications
2. Define exact tRPC procedure implementations
3. Plan incremental migration steps
4. Design testing strategy
5. Create rollback plan

### Critical Information for Phase 3

1. **Complexity requires phased approach** - DO NOT attempt single migration
2. **Security risk** - RLS must be enabled before production
3. **Type safety** - All 'any' types must be properly defined
4. **Testing gap** - Zero test coverage currently exists
5. **Performance consideration** - 9 queries need optimization

### Success Criteria

- [ ] All 9 tRPC procedures tested independently
- [ ] 3 sub-cells created and tested
- [ ] Type safety restored (no 'any' types)
- [ ] All 10 behavioral assertions verified
- [ ] RLS enabled on PO tables
- [ ] Performance baseline maintained
- [ ] Manual validation by stakeholder

---

*Analysis complete. Component exhibits high complexity (816 lines, 9 queries, 15+ state variables) and requires phased implementation strategy. Critical security issue: RLS disabled on PO-related tables. Recommend 12-14 hour implementation with careful testing at each phase.*