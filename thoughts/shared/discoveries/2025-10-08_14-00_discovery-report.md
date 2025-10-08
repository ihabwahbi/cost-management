# Migration Discovery Report
**Phase 1: Discovery & Selection**

---

## Metadata
- **Timestamp**: 2025-10-08T14:00:00Z
- **Agent**: MigrationScout
- **Workflow Phase**: Phase 1 of 6 (Discovery & Selection)
- **Session ID**: mig_20251008_140000_po-mapping-page

---

## 🎯 Selected Migration Target

### **Component**: `po-mapping/page.tsx`
**Path**: `apps/web/app/po-mapping/page.tsx`
**Score**: 115 points (HIGH severity)
**Status**: Main application route - PO Mapping feature

---

## Selection Rationale

### Primary Factors (High Impact)

1. **✅ Direct Database Calls Detected (6+ instances)**
   - **Impact**: CRITICAL - Bypasses tRPC architecture
   - **Evidence**: 
     ```typescript
     Line 60:  const supabase = createClient()
     Line 64:  supabase.from("pos").select("*")
     Line 71:  supabase.from("po_line_items").select("*")
     Line 78:  supabase.from("po_mappings").select("po_line_item_id")
     Line 123: supabase.from("cost_breakdown").select(...)
     Line 204: supabase.from("po_mappings").upsert({...}) // IN LOOP
     Line 163: supabase.channel(...).on(...) // 2 realtime subscriptions
     ```
   - **Tables Accessed**: `pos`, `po_line_items`, `po_mappings`, `cost_breakdown`, `projects`
   - **Scoring Impact**: +30 points

2. **✅ Type Safety Gaps (any types)**
   - **Impact**: HIGH - Missing type safety
   - **Evidence**: Filter state uses `any` type
   - **Scoring Impact**: +25 points

3. **✅ High Usage (Main Application Route)**
   - **Impact**: HIGH - Core user-facing feature
   - **Evidence**: Entry point at `/po-mapping`
   - **User Flow**: Primary PO mapping workflow
   - **Scoring Impact**: +20 points

4. **✅ Architectural Non-Compliance (Business Logic Location)**
   - **Impact**: HIGH - Violates M-CELL-1 (Cell-first mandate)
   - **Evidence**: 8 useState hooks, complex queries, realtime subscriptions in page component
   - **Should Be**: Cell architecture with tRPC procedures
   - **Scoring Impact**: +20 points

### Secondary Factors

5. **✅ High Complexity**
   - **Indicators**:
     - 8+ useState hooks (state management complexity)
     - Multiple database queries (data layer complexity)
     - Realtime subscriptions (architectural complexity)
     - Bulk operations in loops (performance risk)
     - Filter logic (business logic complexity)
   - **Migration Effort**: HIGH (12-16 hours estimated)
   - **Scoring Impact**: +15 points (INVERTED - high complexity = high priority)

6. **✅ User-Facing Core Feature**
   - **Evidence**: Main PO mapping page
   - **Business Impact**: High - primary workflow
   - **Scoring Impact**: +5 points

### Risk Assessment

**Overall Risk**: MEDIUM

**Risk Factors**:
- ⚠️ **Entry Point Component**: Requires careful migration to maintain user experience
- ⚠️ **Realtime Subscriptions**: Need proper cleanup and Cell integration
- ⚠️ **Bulk Operations**: Line 204 upsert in loop needs transaction safety
- ⚠️ **Complex State**: 8 useState hooks require careful state decomposition

**Mitigation Strategies**:
- ✅ **Phased Migration**: Use A-B-C-D phases (procedures → Cells → integration → validation)
- ✅ **Realtime Pattern**: Established pattern from version-management-cell migration
- ✅ **Transaction Safety**: Use ctx.db.transaction() for bulk operations
- ✅ **State Decomposition**: Extract to Cells + Zustand stores

---

## Dependencies

### Database Tables
- `pos` - Purchase orders
- `po_line_items` - PO line items
- `po_mappings` - PO to budget mappings
- `cost_breakdown` - Budget breakdown data
- `projects` - Project metadata

### Imported By
- Next.js App Router at `/po-mapping` (entry point)

### Imports
- `@/lib/supabase/client` - Direct Supabase client (TO BE REMOVED)
- `@/components/ui/*` - shadcn UI components ✅
- `@/components/cells/filter-sidebar-cell` - Already migrated Cell ✅
- `@/components/cells/details-panel` - Already migrated Cell ✅
- `@/components/po-table` - Legacy component (candidate for future migration)
- `@/components/batch-action-bar` - Legacy component

### tRPC Procedures Required
Based on current Supabase queries, need to create:

**New Procedures** (to be created):
1. `poMapping.getPOsList` - Replace `supabase.from("pos").select()`
2. `poMapping.getPOLineItems` - Replace `supabase.from("po_line_items").select()`
3. `poMapping.getMappedLineItems` - Replace `supabase.from("po_mappings").select()`
4. `poMapping.getCostBreakdownForMapping` - Replace cost_breakdown query
5. `poMapping.bulkUpsertMappings` - Replace loop upsert with transaction

**Existing Procedures** (can reuse):
- `poMapping.createMapping` ✅ (already exists)
- `poMapping.updateMapping` ✅ (already exists)
- `poMapping.clearMappings` ✅ (already exists)

---

## Estimated Impact

### Affected Components
- **Primary**: 1 component (`po-mapping/page.tsx`)
- **Child Components**: 2 already-migrated Cells (filter-sidebar-cell, details-panel)
- **Legacy Components**: 2 (po-table, batch-action-bar - future migration candidates)

### Feature Criticality
**CRITICAL** - Core PO mapping workflow
- Primary user feature for mapping purchase orders to budget
- High usage by finance/procurement teams
- Cannot be broken during migration

### Migration Complexity
**HIGH** - Complex multi-phase migration required

**Complexity Drivers**:
1. Multiple database queries (6+) → Multiple procedures
2. Realtime subscriptions → Cell integration pattern
3. Bulk operations → Transaction safety
4. Complex state (8 useState) → State decomposition
5. Filter integration → Already handled by filter-sidebar-cell ✅

### Estimated Duration
**12-16 hours** (Standard 7-phase ANDA migration)

**Phase Breakdown**:
- **Phase 1**: API Layer (5 new procedures) - 4-5 hours
- **Phase 2**: Cell Structure - 2-3 hours
- **Phase 3**: Component Implementation - 3-4 hours
- **Phase 4**: Integration & Testing - 2-3 hours
- **Phase 5**: Validation - 1 hour
- **Phase 6**: Architecture Health Assessment - 30 mins

---

## Alternatives Considered

### Rank 2: `apps/web/app/projects/[id]/dashboard/page.tsx`
- **Score**: 90 points (HIGH severity)
- **Reason Not Selected**: Lower score (25 point gap), fewer direct DB calls (2 vs 6)
- **Future Priority**: Second migration target after po-mapping

### Rank 3: `apps/web/lib/dashboard-metrics.ts`
- **Score**: 85 points (HIGH severity)
- **Reason Not Selected**: Library file, not user-facing entry point
- **Future Priority**: Should be migrated as part of dashboard page migration

### Rank 4: `apps/web/lib/pl-tracking-service.ts`
- **Score**: 85 points (HIGH severity)
- **Reason Not Selected**: Already partially migrated (used by tRPC procedures)
- **Future Priority**: Lower - already behind tRPC layer

### Rank 5: `apps/web/components/version-history-timeline.tsx`
- **Score**: 70 points (HIGH severity - location violation)
- **Reason Not Selected**: Lower score, single import (lower impact)
- **Future Priority**: High - needs refactoring (436 lines → decompose)

---

## Ledger Insights

### Adoption Progress
- **Cells Migrated**: 16/X components
- **Adoption Rate**: Estimated 70-80% (based on health score 86.60)
- **Domains Specialized**: 6 API domains (100% procedure compliance)

### Migration Velocity
- **Recent Migrations**: 
  - 2025-10-08: filter-sidebar-cell ✅
  - 2025-10-07: Phase 7 final integration ✅
  - 2025-10-07: po-budget-comparison-cell ✅
  - 2025-10-07: version-comparison-cell ✅
- **Trend**: Accelerating (dramatic improvement +25.5 points in 1 day)
- **Average Duration**: 6-12 hours per migration

### Architecture Health
- **Current Score**: 86.60/100 (GOOD status)
- **Improvement**: +33.10 points from baseline (53.5 → 86.60)
- **Trend**: DRAMATICALLY IMPROVING
- **Critical Issues**: 1 remaining (down from multiple)
- **Anti-Pattern Debt**: 11 total (CRITICAL: 1, HIGH: 0, MEDIUM: 1)

### Success Patterns from History
1. ✅ **Phased Execution (A-B-C-D)** - Prevents context overflow
2. ✅ **Procedure-First** - Build data layer before UI
3. ✅ **Complete Replacement** - Delete old component immediately
4. ✅ **Zero Deviation** - Follow plan strictly
5. ✅ **Curl Testing** - Validate procedures independently

### Failed Attempts
**None** - All 16 migrations completed successfully ✅

---

## Next Steps

### Phase 2: Migration Analysis (MigrationAnalyst)
**Deliverable**: Deep analysis report with surgical migration plan

**Analysis Required**:
1. **Database Schema Analysis**
   - Map all table relationships (pos → po_line_items → po_mappings → cost_breakdown)
   - Identify foreign key dependencies
   - Plan transaction boundaries for bulk operations

2. **State Management Audit**
   - Document all 8 useState hooks
   - Identify which state belongs in Cells vs orchestrator
   - Plan Zustand stores if needed

3. **Realtime Subscription Analysis**
   - Document 2 existing subscriptions (po_mappings, cost_breakdown)
   - Plan Cell integration pattern (from version-management-cell precedent)
   - Design cleanup strategy

4. **Procedure Design**
   - Design 5 new procedures with input/output schemas
   - Plan transaction strategy for bulk upsert
   - Optimize query patterns

5. **Risk Mitigation Plan**
   - Entry point migration strategy
   - Rollback plan
   - Feature flag requirements

### Phase 3: Migration Architecture (MigrationArchitect)
**Deliverable**: Surgical migration plan with precise implementation steps

**Plan Requirements**:
- 7-phase ANDA migration structure
- Git checkpoint strategy
- Curl test specifications
- Cell structure design
- Manifest with behavioral assertions

### Phase 4: Migration Execution (MigrationExecutor)
**Deliverable**: Complete migration with zero deviation

**Success Criteria**:
- All 6+ database calls migrated to tRPC procedures
- Page component reduced to Cell orchestrator
- Realtime subscriptions working in Cells
- Bulk operations use transactions
- Type safety (zero `any` types)
- All tests passing

### Phase 5: Migration Validation (MigrationValidator)
**Deliverable**: Comprehensive validation report

**Validation Gates**:
- TypeScript: Zero errors ✅
- Tests: All passing ✅
- Build: Production successful ✅
- Mandate Compliance: M-CELL-1, M-CELL-2, M-CELL-3, M-CELL-4 ✅
- Functional: Feature parity verified ✅

### Phase 6: Architecture Health Assessment (ArchitectureHealthMonitor)
**Deliverable**: Post-migration health report

**Expected Impact**:
- Health Score: 86.60 → 90+ (EXCELLENT threshold)
- Critical Issues: 1 → 0
- Anti-Pattern Debt: 11 → 5-7
- ANDA Pillar Scores: All 95+ (Type Safety, Cell Quality, Ledger)

---

## Discovery Statistics

### Candidates Discovered
- **Total Scanned**: 50+ files
- **Active Components**: 10 (excluding 6 orphaned)
- **Above Threshold (40 pts)**: 5 candidates
- **Orphaned (Dead Code)**: 6 components (697 LOC - cleanup candidates)

### Discovery Efficiency
- **Parallel Tasks Launched**: 4 subagents
- **Discovery Duration**: ~3 minutes
- **Synthesis Time**: ~2 minutes
- **Total Phase 1 Duration**: ~5 minutes

### Anti-Patterns Detected
- **Version Suffixes**: 0 ✅ (excellent naming discipline)
- **Orphaned Components**: 6 (technical debt - cleanup recommended)
- **Large Non-Cell Files**: 1 (version-history-timeline.tsx - 436 lines)
- **Direct DB Calls**: 2 page components (po-mapping, dashboard)
- **Type Safety Gaps**: Multiple (any types in filters)

---

## Architectural Context

### Current State
- **Architecture Health**: 86.60/100 (GOOD, dramatically improving)
- **ANDA Pillars**:
  - Type Safety Integrity: 97.4/100 ✅
  - Cell Quality Score: 100.0/100 ✅
  - Ledger Completeness: 100.0/100 ✅
- **Specialized Architecture**:
  - Procedure Compliance: 100% ✅
  - Router Compliance: 100% ✅
  - Monolithic Files: 1 (down from multiple)

### Migration Impact Projection
**Before Migration**:
- Direct DB Components: 2 (po-mapping, dashboard)
- Non-Cell Business Logic: 10 components
- Architecture Health: 86.60

**After This Migration**:
- Direct DB Components: 1 (dashboard only)
- Non-Cell Business Logic: 9 components
- Projected Health: 90+ (EXCELLENT status achievable)
- Critical Issues: 0 (eliminated)

### Strategic Value
This migration represents:
1. **High-Value Target**: Core feature with multiple violations
2. **Health Milestone**: Could push architecture to EXCELLENT (90+)
3. **Pattern Replication**: Sets precedent for dashboard page migration
4. **Debt Reduction**: Eliminates 6+ direct DB calls in single migration

---

## Recommendations

### Immediate Actions
1. ✅ **Proceed to Phase 2**: Hand off to MigrationAnalyst for deep analysis
2. ⚠️ **Stakeholder Communication**: Notify team of PO mapping feature migration
3. ⚠️ **Feature Flag Prep**: Consider flag for gradual rollout
4. ⚠️ **Backup Data**: Ensure po_mappings table backed up

### Success Criteria for Next Phases
- **Phase 2**: Complete analysis with procedure designs
- **Phase 3**: Surgical plan with curl test specs
- **Phase 4**: Zero-deviation implementation
- **Phase 5**: 100% mandate compliance validation
- **Phase 6**: Architecture health 90+ (EXCELLENT status)

---

## Confidence Assessment

**Selection Confidence**: **VERY HIGH**

**Justification**:
- ✅ Clear winner (25 point gap to second place)
- ✅ Highest severity (HIGH - multiple violations)
- ✅ Measurable impact (6+ DB calls eliminated)
- ✅ Pattern precedent (similar to projects page, but higher score)
- ✅ Success history (16/16 migrations succeeded, 0 failures)

**Risk Confidence**: **MEDIUM-HIGH**

**Justification**:
- ✅ Established migration patterns available
- ✅ Similar realtime subscription pattern (version-management-cell)
- ✅ tRPC domain already exists (poMapping router)
- ⚠️ High complexity (8 state variables)
- ⚠️ Entry point component (user-facing)

---

## Signature

**MigrationScout Decision**: SELECT `apps/web/app/po-mapping/page.tsx`

**Autonomous Selection**: YES (evidence-based algorithm)  
**Human Approval Required**: NO (score >100, clear winner)  
**Ready for Phase 2**: YES

---

**Next Agent**: MigrationAnalyst  
**Handoff Status**: READY  
**Timestamp**: 2025-10-08T14:00:00Z

---

*This discovery report represents Phase 1 of the 6-phase autonomous ANDA migration workflow. The selected target was chosen using evidence-based scoring across 10 candidates, with full consideration of architecture health, migration history, and strategic value.*
