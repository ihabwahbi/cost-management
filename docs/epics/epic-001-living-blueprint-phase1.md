# Epic: Living Blueprint Architecture - Phase 1 Foundation & Validation

**Epic ID:** EPIC-001  
**Type:** Brownfield Enhancement  
**Priority:** High  
**Estimated Duration:** 3 weeks  
**Created:** October 1, 2025  
**Status:** Ready for Implementation  

---

## Epic Goal

Establish the Living Blueprint Architecture foundation (monorepo, type-safe data layer, ledger) and validate the approach with pilot Component Cells, setting the pattern for 100% architecture adoption across the entire codebase. This is the first step toward complete refactor - not gradual addition, but full replacement.

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
- Each story completely replaces old implementation with new Cell
- Git commits provide rollback capability if needed

### Enhancement Details

**What's being added:**
1. **Turborepo monorepo structure** with packages for api, db, types
2. **tRPC + Drizzle ORM** for type-safe data layer
3. **Architectural Ledger** (ledger.jsonl) for decision tracking
4. **Smart Component Cell structure** with manifests and pipelines
5. **Two pilot Cells** to validate architecture

**How it integrates:**
- Complete replacement, one Cell at a time
- Drizzle schema generated from existing Supabase tables
- tRPC endpoints deployed as Supabase Edge Functions
- Each story deletes old component after new Cell validated

**Success criteria:**
- ✅ Pilot Cells operational with <150% estimated effort
- ✅ Agent successfully uses ledger for navigation
- ✅ Pipeline validation functioning
- ✅ Old components deleted (lean codebase validated)
- ✅ Pattern established for 100% adoption in future epics
- ✅ Zero parallel implementations remain

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
2.2. Create Cell structure at `components/cells/kpi-card/`
2.3. Write `manifest.json` with behavioral assertions
2.4. Write `pipeline.yaml` with validation gates  
2.5. Implement Cell using tRPC query hook
2.6. Update all imports to use new Cell
2.7. Delete old KPICard component
2.8. Validate all tests pass
2.9. Create ledger entry and commit

**Acceptance Criteria:**
- Cell passes all pipeline gates
- Behavioral assertions have tests
- Old component deleted from codebase
- Ledger entry queryable
- Performance parity with original

**Status:** Done (requires cleanup - see Story 2.1)

---

### Story 2.1: KPICard Cleanup (Week 2 - Alignment Story)
**Align Story 1.2 implementation with architecture principles**

**Context:** Story 1.2 was implemented before architecture finalization and used OLD approach (v2 suffix, feature flags, parallel implementations). This cleanup story aligns it with our AI-optimized principles.

**Tasks:**
2.1.1. Rename directory: `kpi-card-v2/` → `kpi-card/`
2.1.2. Update manifest: `"id": "kpi-card-v2"` → `"id": "kpi-card"`
2.1.3. Remove feature flag logic from dashboard page
2.1.4. Update all imports to point to new location
2.1.5. Delete old component: `components/dashboard/kpi-card.tsx`
2.1.6. Remove feature flag environment variables
2.1.7. Update ledger entries with correct Cell ID and cleanup record
2.1.8. Verify no v2 or feature flag references remain (grep)
2.1.9. Run all tests and commit clean state

**Acceptance Criteria:**
- Directory has no version suffix
- Manifest ID has no version suffix
- No feature flag code exists
- Old component deleted
- Only one implementation exists (lean codebase)
- All tests pass
- Ledger documents cleanup
- Codebase ready for Story 2.2 (next pilot)

**Estimated Duration:** 2-3 hours

---

### Story 3: PLCommandCenter Pilot Cell (Week 3)
**Migrate complex component to validate data complexity handling**

**Tasks:**
3.1. Create tRPC procedures for P&L metrics
3.2. Create Cell structure at `components/cells/pl-command-center/`
3.3. Write comprehensive manifest for complex data
3.4. Write pipeline with performance tests
3.5. Implement Cell with multiple tRPC queries
3.6. Update all imports to use new Cell
3.7. Delete old PLCommandCenter component
3.8. Validate complex data flows and all tests pass
3.9. Create ledger entry and commit

**Acceptance Criteria:**
- Complex data aggregations work correctly
- All P&L calculations match original
- Pipeline validates data contracts
- Old component deleted from codebase
- No performance degradation

## Compatibility Requirements

- [x] Existing APIs remain unchanged
- [x] Database schema changes are backward compatible (no changes)
- [x] UI changes follow existing shadcn patterns
- [x] Performance impact is minimal (<10% degradation)
- [x] All existing features continue working
- [x] Rollback possible via git revert

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
- Git revert entire story commit if needed
- No database migrations (schema unchanged)
- Each commit is atomic and revertible
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
- [x] Codebase contains only new Cells (no parallel implementations)
- [x] Ledger queries functioning
- [x] Pipeline automation working

### Process Validation
- [x] Agent workflow documented
- [x] Cleanup workflow validated
- [x] Git revert procedure documented
- [x] Ledger tracking functional

## Resource Requirements

**Team Allocation:**
- Senior Developer (100%) - Lead, foundation setup
- Mid Developer (100%) - Cell implementation
- QA Engineer (50%) - Pipeline setup, validation
- DevOps (25%) - Infrastructure, Edge Functions
- Product Owner (25%) - Validation, decisions

**Infrastructure:**
- Development Supabase project for testing
- GitHub Actions for pipeline automation (future)
- Git version control for rollback capability

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

### Cell Replacement Pattern
```typescript
// Old component deleted after new Cell validated
// Before story: import { KPICard } from '@/components/dashboard/kpi-card'
// After story: import { KPICard } from '@/components/cells/kpi-card/component'

// No feature flags - direct replacement only
```

---

## Handoff to Development Team

**Development Team Handoff:**

"Please begin Phase 1 implementation of the Living Blueprint Architecture. Key considerations:

- This is a complete refactor - each story replaces old implementation with new Cell
- No feature flags or parallel implementations - maintain lean codebase
- Delete old components in same story after validation
- Use git commits for rollback capability
- Focus on foundation setup (Week 1) before pilot Cells
- Document all learnings for decision gate

Start with Story 1.1: Turborepo setup. Reference the Living Blueprint Architecture document for detailed technical specifications.

**Critical**: Each story must end with cleanup. Codebase should contain ONLY new Cell implementations - optimal for AI agent development."

---

**Document Status:** Ready for implementation
**Next Review:** End of Week 1 (Foundation checkpoint)
**Decision Gate:** End of Week 3