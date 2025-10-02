# Discovery Report: Migration Target Selection

## Metadata
- **Timestamp**: 2025-10-02
- **Agent**: MigrationScout
- **Workflow Phase**: Phase 1: Discovery & Selection
- **Discovery Type**: Autonomous Evidence-Based Selection

## Selected Target

**Component**: details-panel.tsx
**Path**: apps/web/components/details-panel.tsx
**Score**: 55/100
**Migration Priority**: HIGH

## Selection Rationale

### Primary Factors
- **Direct Supabase calls detected** (8+ database queries at lines 165, 177-180, 197-201, 218-225, 237-238, 299-300, 310-311, 342)
- **Type safety violations** (4 instances of `: any` types compromising type safety)
- **Critical architectural bypass** (Only component with direct database access, bypassing tRPC layer)
- **Complex state management** (15+ useState hooks managing PO mapping workflows)

### Secondary Factors
- **High complexity** (816 lines - will establish patterns for complex cell migrations)
- **Business-critical feature** (PO mapping is core to cost management functionality)
- **No previous migration failures** (Clean track record allows tackling complex component)

### Risk Assessment
**Risk Level**: Medium-High
- Component complexity requires careful state management migration
- Multiple database queries need tRPC procedure creation
- Extensive testing required due to business criticality
- Mitigation: Can be broken into smaller sub-cells if needed

## Dependencies

### Database Tables
- projects (id, name, sub_business_line)
- cost_breakdown (multiple fields)
- po_mappings (verification and updates)
- pos (selection queries)
- po_line_items (related data)

### Imported By
- apps/web/app/po-mapping/page.tsx

### Key Imports
- @/lib/supabase/client (TO BE REPLACED)
- @/components/ui/* (15+ UI components)
- React hooks (useState, useEffect, useCallback)
- date-fns
- lucide-react icons

## Estimated Impact

### Affected Components
- 1 direct consumer (po-mapping page)
- Potential pattern establishment for 6+ other complex components

### Feature Criticality
- Core PO mapping functionality
- Budget line mapping workflows
- Financial data accuracy

### Migration Complexity
- **High** (816 lines, 8+ DB queries, complex state)
- Breaking into sub-cells recommended if complexity proves challenging

### Estimated Duration
- 8-12 hours (including tRPC procedures, testing, validation)

## Alternatives Considered

### budget-timeline-chart.tsx
- **Score**: 40 points
- **Reason not selected**: Lower priority - no direct DB calls, simpler quick win could wait

### smart-kpi-card.tsx
- **Score**: 30 points
- **Reason not selected**: Duplicate of already-migrated KPICard, lower architectural value

### dashboard-filters.tsx
- **Score**: 30 points
- **Reason not selected**: Duplicate filter pattern, needs consolidation strategy first

### cost-breakdown-table.tsx
- **Score**: 15 points
- **Reason not selected**: Below complexity threshold for impactful migration

## Ledger Insights

### Migration Progress
- **Completed Migrations**: 2 (kpi-card, pl-command-center)
- **Failed Migrations**: 0
- **Adoption Rate**: 2/29 components (6.9%)
- **Current Velocity**: 1 component per day

### Success Patterns
- Both previous migrations successfully handled tRPC integration
- Complex multi-query components (pl-command-center) proven feasible
- Clean architectural separation achieved

### Learning Applied
- No failures to deprioritize
- Momentum allows tackling higher complexity
- Direct DB access is critical issue to address

## Discovered Issues

### Architectural Violations
- **7 components** with direct database access identified
- **37 type safety violations** (`: any`) across codebase
- **Critical**: apps/web/app/projects/page.tsx has 43+ direct DB queries (future consideration)

### Technical Debt
- Orphaned component: project-alerts.tsx (recommend deletion)
- Duplicate components: filter components, KPI variations
- Component fragmentation: version-related functionality spread across 4 files

## Next Steps

### Phase 2: Migration Analysis
Hand off to MigrationAnalyst for:
1. Deep dive into details-panel.tsx state management patterns
2. Map all 8+ database queries to tRPC procedures
3. Identify sub-cell decomposition opportunities
4. Analyze testing requirements

### Recommended tRPC Procedures
- `trpc.poMapping.getProjects`
- `trpc.poMapping.getSpendTypes`
- `trpc.poMapping.getSubCategories`
- `trpc.poMapping.matchCostBreakdown`
- `trpc.poMapping.verifyMappings`
- `trpc.poMapping.updateCostBreakdown`
- `trpc.poMapping.getMappings`

### Risk Mitigation
- Consider breaking into 3 sub-cells if complexity proves challenging:
  - details-panel-viewer (read-only display)
  - details-panel-editor (edit workflows)
  - details-panel-mapper (mapping logic)

## Confidence Assessment

**Selection Confidence**: HIGH
- Evidence-based scoring with clear winner
- Critical architectural issues to address
- Aligns with ANDA transformation goals
- No close competitors (15+ point margin)

**Migration Feasibility**: MEDIUM
- Complex but precedent exists (pl-command-center)
- Clear tRPC mapping path
- Testable boundaries

---

*Generated by MigrationScout - Autonomous Discovery Agent*
*Ready for Phase 2: Migration Analysis*