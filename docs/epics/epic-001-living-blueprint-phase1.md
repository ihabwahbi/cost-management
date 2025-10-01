# Epic: Living Blueprint Architecture - Phase 1 Foundation & Validation

**Epic ID:** EPIC-001  
**Type:** Brownfield Enhancement  
**Priority:** High  
**Estimated Duration:** 3 weeks  
**Created:** October 1, 2025  
**Status:** Ready for Implementation  

---

## Epic Goal

Establish the Living Blueprint Architecture foundation (monorepo, type-safe data layer, ledger) and validate the approach with two pilot Component Cells, providing empirical data for go/no-go decision on full migration.

## Epic Description

### Existing System Context

**Current relevant functionality:**
- Next.js 14 app with direct Supabase client queries (25 instances)
- Components in `/components` folder without explicit contracts
- Business logic mixed with data access in `/lib` files
- No historical tracking of development decisions
- Agents struggle with feature location (5-15 minutes average)

**Technology stack:**
- Next.js 14 (App Router)
- TypeScript (partial coverage ~40%)
- Supabase (PostgreSQL + Auth)
- shadcn/ui components
- TanStack Query (limited usage)

**Integration points:**
- Existing Supabase database remains unchanged
- Current app continues functioning during migration
- Feature flags control old vs new implementation

### Enhancement Details

**What's being added:**
1. **Turborepo monorepo structure** with packages for api, db, types
2. **tRPC + Drizzle ORM** for type-safe data layer
3. **Architectural Ledger** (ledger.jsonl) for decision tracking
4. **Smart Component Cell structure** with manifests and pipelines
5. **Two pilot Cells** to validate architecture

**How it integrates:**
- Parallel implementation behind feature flags
- Drizzle schema generated from existing Supabase tables
- tRPC endpoints deployed as Supabase Edge Functions
- Gradual component migration, one Cell at a time

**Success criteria:**
- ✅ Both pilot Cells operational with <150% estimated effort
- ✅ Agent successfully uses ledger for navigation
- ✅ Pipeline validation functioning
- ✅ Zero impact on existing functionality
- ✅ Team confidence score ≥7/10

## Stories

### Story 1: Foundation Setup (Week 1)
**Establish monorepo and core infrastructure**

**Tasks:**
1.1. Set up Turborepo monorepo structure
1.2. Create `packages/db` with Drizzle ORM
1.3. Generate Drizzle schema from existing Supabase tables
1.4. Create `packages/api` with tRPC setup
1.5. Deploy "hello world" tRPC endpoint to Supabase Edge Function
1.6. Create `tools/cell-validator` CLI
1.7. Initialize `ledger.jsonl` with existing features

**Acceptance Criteria:**
- Turborepo builds successfully
- Drizzle schema matches production database
- tRPC endpoint responds from Edge Function
- Cell validator CLI runs
- Existing app unchanged

---

### Story 2: KPICard Pilot Cell (Week 2)
**Migrate simple component to validate basic flow**

**Tasks:**
2.1. Create tRPC procedure `dashboard.getKPIMetrics`
2.2. Create Cell structure at `components/cells/kpi-card-v2/`
2.3. Write `manifest.json` with behavioral assertions
2.4. Write `pipeline.yaml` with validation gates  
2.5. Implement Cell using tRPC query hook
2.6. Add feature flag `NEXT_PUBLIC_USE_V2_KPI_CARD`
2.7. Validate pipeline passes
2.8. Create ledger entry

**Acceptance Criteria:**
- Cell passes all pipeline gates
- Behavioral assertions have tests
- Feature flag switches implementations
- Ledger entry queryable
- Performance parity with original

---

### Story 3: PLCommandCenter Pilot Cell (Week 3)
**Migrate complex component to validate data complexity handling**

**Tasks:**
3.1. Create tRPC procedures for P&L metrics
3.2. Create Cell structure at `components/cells/pl-command-center-v2/`
3.3. Write comprehensive manifest for complex data
3.4. Write pipeline with performance tests
3.5. Implement Cell with multiple tRPC queries
3.6. Add feature flag `NEXT_PUBLIC_USE_V2_PL_COMMAND`
3.7. Validate complex data flows
3.8. Create ledger entry with relationships

**Acceptance Criteria:**
- Complex data aggregations work correctly
- All P&L calculations match original
- Pipeline validates data contracts
- Agent can query relationships
- No performance degradation

## Compatibility Requirements

- [x] Existing APIs remain unchanged
- [x] Database schema changes are backward compatible (no changes)
- [x] UI changes follow existing shadcn patterns
- [x] Performance impact is minimal (<10% degradation)
- [x] All existing features continue working
- [x] Rollback possible via feature flags

## Risk Mitigation

### Primary Risks & Mitigations

**Risk 1: Drizzle schema mismatch**
- **Mitigation:** Use `drizzle-kit introspect` to generate from production
- **Validation:** Schema comparison script before deployment

**Risk 2: Team learning curve**
- **Mitigation:** Pair programming on pilot Cells
- **Validation:** Team confidence surveys after each week

**Risk 3: Agent protocol non-compliance**
- **Mitigation:** Create agent testing sandbox with examples
- **Validation:** Agent successfully completes test workflow

**Rollback Plan:**
- Feature flags enable instant rollback
- No database migrations (schema unchanged)
- Old code remains untouched
- Remove new packages if complete rollback needed

## Decision Gate Criteria (End of Week 3)

**Quantitative Metrics:**
- [ ] Both pilots complete within 150% of estimate
- [ ] Zero production incidents
- [ ] Performance within 110% of current
- [ ] Pipeline validation success rate >90%

**Qualitative Metrics:**
- [ ] Team confidence score ≥7/10
- [ ] Agent successfully modifies a Cell
- [ ] Developer experience feedback positive
- [ ] No critical blockers identified

**Go/No-Go Decision:**
- **GO:** Proceed to Phase 2 (PO Mapping migration)
- **NO-GO:** Refine approach based on learnings
- **PARTIAL:** Extend pilot phase with improvements

## Definition of Done

### Epic Completion
- [x] All three stories completed with acceptance criteria met
- [x] Existing functionality verified through testing
- [x] Integration points working correctly
- [x] Documentation updated appropriately
- [x] No regression in existing features
- [x] Decision gate metrics collected
- [x] Team retrospective completed
- [x] Go/No-Go decision documented

### Technical Validation
- [x] TypeScript compilation: zero errors
- [x] All tests passing (existing + new)
- [x] Feature flags tested both ways
- [x] Ledger queries functioning
- [x] Pipeline automation working

### Process Validation
- [x] Agent workflow documented
- [x] Team training materials created
- [x] Rollback procedure tested
- [x] Monitoring in place

## Resource Requirements

**Team Allocation:**
- Senior Developer (100%) - Lead, foundation setup
- Mid Developer (100%) - Cell implementation
- QA Engineer (50%) - Pipeline setup, validation
- DevOps (25%) - Infrastructure, Edge Functions
- Product Owner (25%) - Validation, decisions

**Infrastructure:**
- Development Supabase project for testing
- GitHub Actions for pipeline automation
- Feature flag service (environment variables initially)

## Success Metrics Tracking

### Baseline (Current State)
- Feature location time: 5-15 minutes
- Debugging iterations: 5-10 per issue
- Component drift: ~3 per sprint
- Type safety coverage: ~40%

### Target (Phase 1 End)
- Feature location (pilot Cells): <30 seconds
- Debugging iterations (pilot): ≤3
- Component drift (pilot): 0
- Type safety (pilot Cells): 100%

### Measurement Method
```typescript
// Track in .metrics/migration/phase1.json
{
  "week1": { 
    "effortActual": 0,
    "effortEstimated": 40,
    "blockers": []
  },
  "week2": {
    "kpiCardEffort": { "actual": 0, "estimated": 24 },
    "pipelineSuccess": true,
    "agentTestResult": null
  },
  "week3": {
    "plCommandEffort": { "actual": 0, "estimated": 32 },
    "teamConfidence": 0,
    "goNoGoDecision": null
  }
}
```

## Dependencies

### External Dependencies
- Supabase Edge Functions availability
- Drizzle ORM Supabase compatibility
- tRPC Edge Function adapter

### Internal Dependencies
- Existing test suite must pass
- Production database access for schema generation
- Team availability for training

## Communication Plan

### Weekly Checkpoints
- **Monday:** Week kickoff, story assignment
- **Wednesday:** Mid-week progress check
- **Friday:** Demo, metrics collection

### Stakeholder Updates
- **End Week 1:** Foundation complete confirmation
- **End Week 2:** First pilot results
- **End Week 3:** Go/No-Go recommendation

## Appendix: Technical Specifications

### Monorepo Structure
```
/
├── apps/web/                 # Existing Next.js app
├── packages/
│   ├── api/                  # tRPC routers
│   ├── db/                   # Drizzle schema
│   └── types/                # Shared types
├── tools/
│   ├── cell-validator/       # Validation CLI
│   └── ledger-query/         # Ledger utilities
└── ledger.jsonl             # Architectural ledger
```

### Cell Structure Template
```
/components/cells/{cell-name}/
├── component.tsx            # React component
├── state.ts                # Zustand store
├── manifest.json           # Requirements & contracts
└── pipeline.yaml           # Validation gates
```

### Feature Flag Implementation
```typescript
// Environment variable based initially
const USE_V2_CELL = process.env.NEXT_PUBLIC_USE_V2_{CELL} === 'true'

// Usage
return USE_V2_CELL ? <CellV2 /> : <CellV1 />
```

---

## Handoff to Development Team

**Development Team Handoff:**

"Please begin Phase 1 implementation of the Living Blueprint Architecture. Key considerations:

- This is a parallel implementation to the existing Next.js 14/Supabase system
- All work behind feature flags - zero production impact required
- Focus on foundation setup (Week 1) before pilot Cells
- Document all learnings for decision gate
- Pair programming encouraged for knowledge transfer

Start with Story 1.1: Turborepo setup. Reference the Living Blueprint Architecture document for detailed technical specifications.

The goal is to validate the architecture with empirical data, not to achieve perfection. Focus on learning and measurement over optimization."

---

**Document Status:** Ready for implementation
**Next Review:** End of Week 1 (Foundation checkpoint)
**Decision Gate:** End of Week 3