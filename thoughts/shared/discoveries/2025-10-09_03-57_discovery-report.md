# Migration Discovery Report

## Metadata
- **Timestamp**: 2025-10-09T03:57:00Z
- **Agent**: MigrationScout
- **Workflow Phase**: Phase 1 - Discovery & Selection
- **Discovery Mode**: Autonomous

---

## Selected Migration Target

### 🎯 Target Component
**Component**: `app/projects/[id]/dashboard/page.tsx`  
**Path**: `apps/web/app/projects/[id]/dashboard/page.tsx`  
**Score**: 115/100 (CRITICAL)  
**Severity**: 🔴 **CRITICAL** - Multiple architectural violations

---

## Selection Rationale

### Primary Factors (95 points)

1. **Direct Supabase Calls Detected** (+30 points)
   - Lines 55, 154-158: Direct `createClient()` usage
   - Lines 176-204: Manual realtime subscriptions
   - **Impact**: Bypasses entire tRPC type-safety layer
   - **Evidence**:
     ```typescript
     const supabase = createClient()
     const { data: projectData } = await supabase
       .from('projects')
       .select('*')
       .eq('id', projectId)
       .single()
     ```

2. **Type Safety Violations** (+25 points)
   - Line 114: `const subcategoryArray: any[] = []`
   - Line 117: `.forEach((costLine: any) => {`
   - Line 119: `.forEach((spendType: any) => {`
   - **Impact**: Zero compile-time safety on data transformations

3. **High Usage - Critical Path** (+20 points)
   - Main project dashboard route
   - Core user-facing feature
   - High traffic component

4. **Business Logic in Wrong Location** (+20 points)
   - 427 lines in page file (should be <50 line orchestrator)
   - 7 useState hooks with complex state management
   - Data transformations mixed with presentation
   - Realtime subscription logic in component

5. **High Complexity** (+15 points)
   - 427 lines total
   - 7 state variables: `metrics`, `loading`, `project`, `categoryData`, `breakdownData`, `burnRateData`, `refreshing`
   - 2 useEffect hooks with complex dependencies
   - Manual realtime channel setup/teardown
   - Complex subcategory aggregation logic

6. **User-Facing Critical Feature** (+5 points)
   - Primary dashboard visualization
   - Direct user impact on migration

### Severity Classification
**CRITICAL** - This component exhibits the highest severity violations:
- Direct database access (architectural emergency)
- Type safety gaps (compilation blind spots)
- Business logic in architectural wrong location (page should orchestrate, not implement)

---

## Dependencies Analysis

### Database Tables
- `projects` (direct query - line 154-158)
- `po_mappings` (realtime subscription - line 176-189)
- `cost_breakdown` (realtime subscription - line 190-201)

### tRPC Procedures Currently Used
- `dashboard.getProjectMetrics` (line 84)
- `dashboard.getProjectCategoryBreakdown` (line 92)
- `dashboard.getProjectHierarchicalBreakdown` (line 100)

### Components Imported
- 5 Cell components (BudgetTimelineChartCell, PLCommandCenter, etc.)
- Dashboard filters, KPI cards, charts
- Export functionality components

### Hooks Used
- `useState` (7 instances)
- `useEffect` (2 instances)
- `useMemo` (1 instance)
- `trpc` queries (3 instances)

---

## Migration Impact Assessment

### Affected Components
**Direct Impact**: 1 page file  
**Indirect Impact**: 5+ dashboard Cell components (orchestration changes)

### Feature Criticality
**Level**: CRITICAL - Core dashboard feature  
**User Impact**: HIGH - Primary project visualization interface  
**Data Flow**: Complex - 3 tRPC queries + 2 realtime subscriptions

### Migration Complexity
**Assessment**: HIGH

**Complexity Factors**:
- Direct Supabase → tRPC migration required
- Realtime subscription refactoring needed
- State management extraction (7 state variables)
- Data transformation logic extraction
- 427 lines to decompose into Cell structure

**Estimated Duration**: 8-12 hours

**Breakdown**:
- Phase A: Create tRPC procedures for direct queries (2 hours)
- Phase B: Create realtime Cell wrapper (3 hours)  
- Phase C: Extract data transformations (2 hours)
- Phase D: Create ProjectDashboardCell (3 hours)
- Phase E: Reduce page to orchestrator (1 hour)
- Phase F: Testing & validation (1 hour)

---

## Alternatives Considered

### Alternative 1: `app/po-mapping/page.tsx`
- **Score**: 80 points
- **Severity**: HIGH
- **Reason Not Selected**: Lower score, no direct DB calls (already uses tRPC)
- **Assessment**: Good candidate but less critical

### Alternative 2: `app/projects/page.tsx`
- **Score**: 80 points  
- **Severity**: HIGH
- **Reason Not Selected**: Similar score to Alternative 1, less complexity
- **Assessment**: Business logic in page, but no direct DB violations

### Alternative 3: `components/dashboard/spend-subcategory-chart.tsx`
- **Score**: 55 points
- **Severity**: MEDIUM
- **Reason Not Selected**: Below critical threshold, no direct DB issues
- **Assessment**: Non-Cell business logic, but acceptable as-is

---

## Ledger Insights

### Migration Progress
- **Cells Migrated**: 15 successful Cell migrations
- **Total Components**: 37 components analyzed
- **Adoption Rate**: 40.5% (15/37)
- **Architecture Health**: 76.0/100 (Good status)

### Recent Activity
- **Last Migration**: `version-history-timeline-cell` (Oct 8, 2025)
- **Last Rollback**: `cost-breakdown-table-cell` (Oct 9, 2025 - visual testing issues)
- **Last API Work**: `dashboard-metrics.ts → tRPC procedures` (Oct 9, 2025)

### Velocity Metrics
- **Recent Velocity**: 1-2 cells per week
- **Failed Migrations**: 1 rollback (visual testing)
- **Success Rate**: 93.75% (15 success / 16 total attempts)

### Pattern Analysis
**Success Pattern**: Cells with clear data contracts and <400 lines  
**Failure Pattern**: Complex visual components without sufficient testing  
**Recommendation**: Ensure comprehensive visual/functional testing before completion

---

## Discovery Methodology

### Phase 1: Ledger Learning ✅
- Queried `ledger.jsonl` for migration history
- Extracted 15 completed Cell migrations
- Identified 1 rollback (cost-breakdown-table-cell)
- Calculated adoption metrics: 15/37 (40.5%)

### Phase 2: Parallel Discovery ✅
**4 Simultaneous Subagent Investigations**:

1. **codebase-locator**: Found 12 components with business logic
   - 3 high priority (pages with complex state)
   - 4 medium priority
   - 5 low priority (acceptable)

2. **component-pattern-analyzer**: Anti-pattern scan
   - ✅ ZERO version suffixes detected
   - ✅ ZERO orphaned components
   - ✅ EXCELLENT architectural discipline

3. **codebase-analyzer**: Direct Supabase usage
   - 🔴 CRITICAL: `app/projects/[id]/dashboard/page.tsx` (direct queries + realtime)
   - 🟡 DEPRECATED: `lib/dashboard-metrics.ts` (marked for removal)
   - 🟡 INFRASTRUCTURE: `hooks/use-realtime-dashboard.ts` (infrastructure hook)

4. **codebase-analyzer (ultrathink)**: API architecture violations
   - ✅ ZERO CRITICAL violations (no monolithic files >500 lines)
   - ✅ ZERO HIGH violations (all procedures <200 lines, routers <50 lines)
   - 🟡 3 MEDIUM violations (large Cell components 343-375 lines, under 400 limit)

### Phase 3: Scoring Algorithm ✅
Applied weighted scoring system:
- Direct DB calls: +30
- Type errors: +25  
- High usage: +20
- Non-Cell business logic: +20
- High complexity: +15
- User-facing: +5

**Top Scores**:
1. Dashboard page: 115 points (CRITICAL)
2. PO mapping page: 80 points (HIGH)
3. Projects page: 80 points (HIGH)
4. Spend subcategory chart: 55 points (MEDIUM)

### Phase 4: Autonomous Selection ✅
**Decision Logic**:
- Clear winner: Dashboard page (115 points)
- Score differential: +35 points above next candidate
- Severity: CRITICAL (direct DB + type errors)
- No previous failures detected
- All dependencies identified

---

## Risk Assessment

### Technical Risks
**Level**: MEDIUM-HIGH

**Identified Risks**:
1. **Realtime Subscription Complexity**
   - Manual channel setup/teardown logic
   - Potential memory leaks if not properly migrated
   - Mitigation: Create dedicated realtime Cell wrapper

2. **Data Transformation Logic**
   - Complex subcategory aggregation (lines 114-140)
   - Multiple nested iterations
   - Mitigation: Extract to utility functions with unit tests

3. **State Management Complexity**
   - 7 interconnected state variables
   - Multiple useEffect dependencies
   - Mitigation: Consolidate state in Cell, use proper memoization

4. **Type Safety Restoration**
   - Current `any` types will be replaced with strict types
   - May expose existing type mismatches
   - Mitigation: Incremental type restoration with validation

### Migration Risks
**Level**: MEDIUM

**Identified Risks**:
1. **Visual Regression** (learned from rollback #49)
   - Recent rollback due to visual testing issues
   - Mitigation: Comprehensive visual testing before completion

2. **Performance Regression**
   - Realtime subscriptions may behave differently
   - Mitigation: Performance profiling before/after

3. **Feature Parity**
   - Complex dashboard with many features
   - Mitigation: Detailed behavioral assertions in manifest

---

## Recommended Migration Strategy

### Approach: Phased Execution (A → B → C → D → E)

**Phase A: API Layer Migration** (2 hours)
- Create `trpc.dashboard.getProjectById` procedure
- Migrate realtime to server-side subscriptions
- Test procedures independently (curl)

**Phase B: Realtime Cell Wrapper** (3 hours)
- Create `ProjectRealtimeCell` for subscription management
- Implement Zod validation for realtime payloads
- Add proper cleanup logic

**Phase C: Data Transformation Extraction** (2 hours)
- Extract subcategory aggregation to utility function
- Extract burn rate calculations
- Create unit tests for transformations

**Phase D: ProjectDashboardCell Creation** (3 hours)
- Create Cell structure with manifest + pipeline
- Move all tRPC queries to Cell
- Implement state management in Cell
- Keep component <400 lines (extract helpers if needed)

**Phase E: Page Reduction** (1 hour)
- Reduce page to <50 line orchestrator
- Update imports to use new Cell
- Remove direct Supabase usage
- Delete old implementation

**Phase F: Validation** (1 hour)
- Run all tests (unit + integration)
- Visual regression testing
- Performance profiling
- User acceptance testing

### Success Criteria
- [ ] Zero direct Supabase calls in page
- [ ] All `any` types replaced with proper types
- [ ] Page file <50 lines (thin orchestrator)
- [ ] ProjectDashboardCell <400 lines
- [ ] All tests passing (80%+ coverage)
- [ ] No visual regressions
- [ ] Performance within 110% baseline
- [ ] Manifest with 8+ behavioral assertions
- [ ] Pipeline with 5+ validation gates

---

## Next Steps - 6-Phase Workflow

### Phase 2: MigrationAnalyst (Deep Analysis)
**Task**: Perform comprehensive analysis of selected target
- Map all data flows (Supabase → tRPC)
- Identify realtime subscription patterns
- Document all behavioral requirements
- Create detailed dependency graph
- Estimate precise migration effort

### Phase 3: MigrationArchitect (Surgical Plan)
**Task**: Create detailed, step-by-step migration plan
- Define phased execution strategy
- Create tRPC procedure specifications
- Design Cell architecture (component/helpers/utils split)
- Specify test coverage requirements
- Define rollback procedures

### Phase 4: MigrationExecutor (Implementation)
**Task**: Execute migration plan with atomic commits
- Implement all tRPC procedures
- Create ProjectDashboardCell with complete structure
- Extract data transformations and utilities
- Achieve <400 line limit per file
- Comprehensive testing at each phase

### Phase 5: MigrationValidator (Verification)
**Task**: Validate migration success & mandate compliance
- Verify all mandate compliance (M-CELL-1 through M-CELL-4)
- Run technical validation (types, tests, build)
- Perform functional validation (feature parity, performance)
- Execute visual regression testing
- Confirm architectural compliance

### Phase 6: ArchitectureHealthMonitor (System-Wide Assessment)
**Task**: Assess overall architecture health post-migration
- Calculate new architecture health score
- Update adoption metrics (16/37 → 43.2%)
- Identify remaining architectural debt
- Recommend next migration target
- Update governance decisions (allow/pause migrations)

---

## Architecture Health Impact

### Current State (Pre-Migration)
- **Health Score**: 76.0/100 (Good)
- **Cell Adoption**: 15/37 (40.5%)
- **Direct DB Violations**: 3 files
- **Type Safety**: ~90% (gaps in dashboard)
- **API Compliance**: 93% (excellent)

### Expected State (Post-Migration)
- **Health Score**: 82-85/100 (Good → Excellent trajectory)
- **Cell Adoption**: 16/37 (43.2%)
- **Direct DB Violations**: 2 files (remove critical violation)
- **Type Safety**: ~95% (dashboard types restored)
- **API Compliance**: 93% (maintained)

### Key Improvements
1. ✅ Eliminate CRITICAL direct DB violation
2. ✅ Restore type safety in main dashboard
3. ✅ Reduce god component (427 → <50 lines)
4. ✅ Improve architectural alignment
5. ✅ Establish realtime subscription pattern

---

## Anti-Patterns Addressed

### Current Anti-Patterns in Target
1. **Direct Database Access** (CRITICAL)
   - Bypasses tRPC type safety layer
   - Exposes database credentials client-side
   - No centralized validation

2. **Business Logic in Page Component** (HIGH)
   - 427 lines in route file
   - Should be thin orchestrator (<50 lines)
   - Complex state management in wrong layer

3. **Type Safety Gaps** (HIGH)
   - Multiple `any` types in transformations
   - No compile-time validation
   - Runtime type errors possible

4. **Manual Subscription Management** (MEDIUM)
   - Memory leak risk
   - Complex cleanup logic
   - Should use abstracted pattern

### Post-Migration Architecture
1. ✅ **All DB Access via tRPC** - End-to-end type safety
2. ✅ **Page as Thin Orchestrator** - <50 lines, composition only
3. ✅ **Full Type Coverage** - Zero `any` types
4. ✅ **Abstracted Realtime** - Reusable Cell pattern

---

## Conclusion

**Selected Target**: `app/projects/[id]/dashboard/page.tsx`

**Justification**:
- Highest score: 115 points (CRITICAL severity)
- Multiple architectural violations (DB access, types, location)
- High user impact (main dashboard feature)
- Clear migration path (tRPC procedures available)
- No previous failure history
- Addresses critical technical debt

**Recommendation**: Proceed to Phase 2 (MigrationAnalyst) for deep analysis

**Strategic Value**:
- Eliminates most critical direct DB violation
- Establishes realtime subscription pattern
- Improves architecture health by ~8 points
- Demonstrates page → Cell migration pattern
- Sets precedent for remaining 2 page files

**Ready for Phase 2**: ✅ Yes

---

**Report Generated**: 2025-10-09T03:57:00Z  
**Discovery Complete**: ✅  
**Next Agent**: MigrationAnalyst (Phase 2)
