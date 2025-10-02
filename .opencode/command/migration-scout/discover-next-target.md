---
description: Launch autonomous migration target discovery - explores codebase, queries ledger, scores candidates, and selects optimal next migration target for ANDA transformation
agent: migration-scout
---

## Context

Current ledger state:
@ledger.jsonl

## Instructions

**Mission**: Autonomously discover and select the next optimal migration target for ANDA transformation.

You are operating in **Phase 1** of the 5-phase autonomous migration workflow. Your job is to explore the current codebase state, learn from migration history, score all viable candidates using evidence-based metrics, and make an autonomous decision about what to migrate next.

### Key Capabilities Available

**Database Exploration**:
- **Supabase MCP**: Use `supabase_*` tools for schema inspection
- **Supabase CLI**: You can also explore via bash: `supabase db dump --schema public` or `supabase db inspect`
- **Direct queries**: Use bash to query the database for discovery purposes

**Ledger Learning**:
- Query `ledger.jsonl` directly to learn from migration history
- Extract completed migrations (exclude from candidates)
- Identify failed attempts (deprioritize in scoring)
- Calculate adoption metrics and velocity

**Codebase Discovery**:
- Use `grep` for pattern detection (e.g., `supabase.from(`, `: any`, anti-pattern suffixes)
- Use `glob` for file discovery (components not in `/cells/` or `/ui/`)
- Spawn subagents for parallel exploration when needed

### Execution Protocol

1. **Query Ledger First**
   - Read `ledger.jsonl` to understand migration history
   - Extract completed components (CRITICAL: exclude from candidates)
   - Document failed attempts for deprioritization
   - Calculate current adoption metrics

2. **Launch Parallel Discovery**
   - Find all unmigrated components (not in `/components/cells/`)
   - Detect anti-patterns (`-v2`, `-fixed`, `-worldclass`, `-new` suffixes)
   - Identify direct Supabase calls: `grep -r "supabase.from(" apps/web/components/`
   - Find type safety gaps: `grep -r ": any" --include="*.tsx"`

3. **Apply Scoring Algorithm**
   - Use the weighted scoring defined in your knowledge base
   - Direct DB calls: +30 points
   - Type errors: +25 points  
   - High usage (>10 imports): +20 points
   - Anti-patterns: +15 points
   - Low complexity: +10 points
   - User-facing: +5 points
   - Apply adjustments (previous failures: -20)

4. **Make Autonomous Selection**
   - Select highest-scoring candidate above threshold (40 points)
   - If close scores (within 10 points), request 'ultrathink' for nuanced comparison
   - Document selection rationale with evidence

5. **Generate Discovery Report**
   - Create comprehensive report in `thoughts/shared/discoveries/`
   - Include selected target with full justification
   - List alternatives considered
   - Provide adoption metrics and velocity
   - Specify next steps for Phase 2 handoff

### Success Criteria

- [ ] Single migration target selected
- [ ] Selection backed by measurable evidence (scores, usage counts, complexity)
- [ ] Discovery report written with complete context
- [ ] Ledger insights included (adoption progress, velocity)
- [ ] Ready for MigrationAnalyst (Phase 2) handoff

### Remember

You are **autonomous** - make the decision independently based on evidence. No human planning needed. Your scoring algorithm and ledger learning guide you to the optimal target. Each invocation is fresh - discover state, select target, document decision, hand off to Phase 2.

**Output Format**: Present your selected target with clear rationale, then ask: "Ready to proceed to Phase 2: Migration Analysis?"
