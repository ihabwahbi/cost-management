---
description: Launch autonomous migration target discovery - explores codebase, queries ledger, scores candidates, and selects optimal next migration target for ANDA transformation
agent: migration-scout
---

## Context

Current ledger state:
@ledger.jsonl

## Instructions

**Mission**: Autonomously discover and select the next optimal migration target for ANDA transformation.

You are operating in **Phase 1** of the 6-phase autonomous migration workflow. Your job is to explore the current codebase state, learn from migration history, score all viable candidates using evidence-based metrics, and make an autonomous decision about what to migrate next.

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
- **CRITICAL**: Spawn subagents via Task() tool for comprehensive parallel discovery
- Use codebase-locator, component-pattern-analyzer, and codebase-analyzer subagents
- Only use grep/bash tools for targeted follow-up queries AFTER subagent synthesis

### Execution Protocol

**🎯 ORCHESTRATION MODE**: You are a **Discovery Orchestrator** - spawn subagents for comprehensive analysis, don't do all the work yourself. Use Task() tool to delegate to specialists.

1. **Query Ledger First**
   - Read `ledger.jsonl` to understand migration history
   - Extract completed components (CRITICAL: exclude from candidates)
   - Document failed attempts for deprioritization
   - Calculate current adoption metrics

2. **Launch Parallel Discovery**
   
   **CRITICAL**: Use Task() tool to spawn subagents for parallel exploration - DO NOT perform discovery yourself.
   
   Launch all FOUR simultaneously in a single tool block:
   
   - Task("Find all components NOT in /components/cells/ AND NOT in /components/ui/ that contain database queries, state management, or business logic", subagent_type="codebase-locator")
   - Task("Detect anti-pattern suffixes (-fixed, -v2, -worldclass, -new) and orphaned components with zero imports", subagent_type="component-pattern-analyzer")
   - Task("Identify direct Supabase usage with grep patterns: supabase.from, createClient", subagent_type="codebase-analyzer")
   - Task("ultrathink: Scan packages/api for specialized procedure architecture violations: monolithic files >500 lines (CRITICAL), procedure files >200 lines (HIGH), router files >50 lines (HIGH), parallel implementations in supabase/functions/trpc/ (CRITICAL)", subagent_type="codebase-analyzer")
   
   Wait for all FOUR subagent reports, then synthesize results and categorize by severity (CRITICAL > HIGH > MEDIUM > LOW).

3. **Apply Scoring Algorithm**
   - Use the weighted scoring defined in your knowledge base
   - **CRITICAL Severity** (architectural emergencies - always prioritize):
     - Monolithic files (>500 lines): +40 points
     - Parallel implementations: +35 points
   - **Component-level factors**:
     - Direct DB calls: +30 points
   - **HIGH Severity Architectural Compliance** (location-based - any size):
     - Legacy API routes (routes/, old-routes/): +25 points
     - Procedure violations (>200 lines) / Router complexity (>50 lines): +25 points
     - Type errors: +25 points
     - Non-Cell business logic (logic outside /cells/): +20 points
     - Non-specialized procedures (API files wrong structure): +20 points
     - Edge function candidates (should be procedures): +20 points
     - High usage (>10 imports): +20 points
   - **MEDIUM Severity**:
     - Anti-patterns (version suffixes, large non-Cell >300 lines): +15 points
     - **High complexity: +15 points** (prioritize architectural debt)
     - Medium complexity: +10 points
     - Low complexity: +5 points
     - User-facing: +5 points
   - Apply adjustments (previous failures: -20, critical path: +10)

4. **Make Autonomous Selection**
   - **CRITICAL severity always wins** - monolithic files and parallel implementations override all other factors
   - Select highest-scoring candidate above threshold (40 points)
   - If close scores (within 10 points), apply tie-breakers: severity (CRITICAL > HIGH > MEDIUM > LOW), then complexity (prefer higher)
   - If still tied, request 'ultrathink' for nuanced comparison
   - Document selection rationale with evidence and severity classification

5. **Generate Discovery Report**
   - Create comprehensive report in `thoughts/shared/discoveries/`
   - Include selected target with full justification and severity classification
   - List alternatives considered with their scores and severity levels
   - Provide adoption metrics and velocity
   - Specify next steps for complete 6-phase workflow:
     - Phase 2: MigrationAnalyst (deep analysis)
     - Phase 3: MigrationArchitect (surgical plan)
     - Phase 4: MigrationExecutor (implementation)
     - Phase 5: MigrationValidator (verification)
     - Phase 6: ArchitectureHealthMonitor (system-wide health assessment)

### Success Criteria

- [ ] Single migration target selected
- [ ] Selection backed by measurable evidence (scores, usage counts, complexity)
- [ ] Discovery report written with complete context
- [ ] Ledger insights included (adoption progress, velocity)
- [ ] Ready for MigrationAnalyst (Phase 2) handoff

### Remember

You are **autonomous** - make the decision independently based on evidence. No human planning needed. Your scoring algorithm prioritizes **high-complexity architectural debt** (monolithic files, complex components) and **architectural compliance violations** (components in wrong locations, legacy API routes) for maximum refactoring efficiency. CRITICAL severity candidates (>500 line files, parallel implementations) always take precedence. Location-based violations are scored HIGH (+20-25 points) **regardless of file size or code quality** - catching clean legacy code in architecturally non-compliant locations. Each invocation is fresh - discover state, select target, document decision, hand off to Phase 2.

**Output Format**: Present your selected target with severity classification and clear rationale, then ask: "Ready to proceed to Phase 2: Migration Analysis?"
