---
date: 2025-01-25T00:00:00Z
architect: Assistant
user: iwahbi
topic: "Brownfield Modernization Agent Architecture"
tags: [architecture, agent-design, cli-agents, workflow, subagents, orchestration]
status: complete
last_updated: 2025-01-25
last_updated_by: Assistant
---

# Brownfield Modernization Agent Architecture

## Executive Summary

This document comprehensively captures the current state of the Brownfield Modernization Agent Architecture - a sophisticated 4-phase (with optional 5th iteration phase) sequential workflow system designed for transforming legacy codebases. The architecture consists of 5 primary agents orchestrating 15 specialized subagents through carefully designed delegation patterns, with strict phase boundaries and document-based context passing.

## System Overview

The Brownfield Modernization system operates as a **linear cascade workflow** where each primary agent produces structured documents that become inputs for subsequent phases. The system enforces complete phase separation with these fundamental constraints:

- **Primary agents CANNOT spawn other primary agents** - only users can invoke them
- **Subagents are STATELESS** between invocations
- **Communication is strictly ONE-WAY**: primary → subagent → result  
- **Only ModernizationImplementer can edit/patch code** - all other agents are read-only
- **Documents are the exclusive context-passing mechanism** between phases

## Architecture Specification

```yaml
architecture:
  name: BrownfieldModernizationSystem
  version: 2.0
  description: 4-phase sequential modernization with parallel subagent orchestration
  workflow_type: linear_cascade
  context_mechanism: document_based
  
  phases:
    - number: 1
      name: Diagnostics
      primary_agent: DiagnosticsResearcher
      optional: false
      
    - number: 2
      name: Design
      primary_agent: DesignIdeator
      optional: false_unless_pure_bug_fix
      
    - number: 3
      name: Orchestration
      primary_agent: ModernizationOrchestrator
      optional: false
      
    - number: 4
      name: Implementation
      primary_agent: ModernizationImplementer
      optional: false
      
    - number: 5
      name: Iteration
      primary_agent: IterationCoordinator
      optional: true
      trigger: implementation_blocked
```

## Primary Agents

### Phase 1: DiagnosticsResearcher

**Mode**: Primary  
**Color**: Red  
**Description**: Deep investigation specialist for bugs and system issues. Orchestrates parallel subagent analysis, synthesizes findings, and produces comprehensive diagnostic reports with actionable recommendations. Never implements - only diagnoses and documents.

**Tool Access**:
- ✅ bash, write, read, grep, glob, list, todowrite, todoread, webfetch
- ✅ tavily_*, exa_*, context7_*, supabase_*
- ❌ edit, patch (CRITICAL: Cannot modify code)

**Output**: `thoughts/shared/diagnostics/YYYY-MM-DD_HH-MM_[issue]_diagnostic.md`

**Subagents Orchestrated**:
- web-search-researcher
- codebase-locator
- codebase-analyzer
- codebase-pattern-finder
- performance-profiler

**Key Patterns**:
- Parallel Investigation Pattern
- Enhanced Direct Search Pattern
- Sequential Refinement Pattern
- Component Activity Verification Pattern
- Database Investigation Pattern
- NaN Forensics Pattern

**Static Variables**:
```yaml
DIAGNOSTICS_DIR: "thoughts/shared/diagnostics/"
MAX_PARALLEL_TASKS: 3
SEARCH_DEPTH: "comprehensive"
REPORT_FORMAT: "diagnostic-v2"
SEVERITY_LEVELS: ["Critical", "High", "Medium", "Low"]
DB_INVESTIGATION_TRIGGERS: ["data integrity", "query performance", "schema mismatch", "constraint violation", "migration issue"]
```

### Phase 2: DesignIdeator

**Mode**: Primary  
**Color**: Blue  
**Description**: World-class UI/UX proposal generator that orchestrates comprehensive design research, analyzes current state, creates three progressive alternatives, and produces implementation-ready specifications. Synthesizes diagnostic context, design patterns, and industry trends without implementing.

**Tool Access**:
- ✅ bash, write, read, grep, glob, list, todowrite, todoread, webfetch
- ✅ context7_*
- ❌ edit, patch, tavily_*, exa_*, supabase_*

**Output**: `thoughts/shared/proposals/YYYY-MM-DD_HH-MM_[component]_design_proposal.md`

**Subagents Orchestrated**:
- visual-design-scanner
- component-pattern-analyzer
- accessibility-auditor
- documentation-verifier
- web-search-researcher
- competitive-ui-analyzer

**Design Alternative Framework**:
1. **Conservative Enhancement** (1-2 days): Minimal risk, maximum compatibility
2. **Balanced Modernization** (3-5 days): Strategic improvements with measured risk
3. **Ambitious Transformation** (1-2 weeks): Industry-leading innovation

**Static Variables**:
```yaml
PROPOSALS_DIR: "thoughts/shared/proposals/"
DESIGN_ALTERNATIVES: 3
TIME_ESTIMATES: ["1-2 days", "3-5 days", "1-2 weeks"]
DESIGN_APPROACHES: ["Conservative", "Balanced", "Ambitious"]
MOCKUP_FORMAT: "ascii"
```

### Phase 3: ModernizationOrchestrator

**Mode**: Primary  
**Color**: Purple  
**Description**: Master orchestrator that synthesizes diagnostic findings and design proposals into comprehensive implementation blueprints. Coordinates parallel technical analysis, validates feasibility, manages dependencies, and produces risk-aware implementation plans without writing code.

**Tool Access**:
- ✅ bash, write, read, grep, glob, list, todowrite, todoread, webfetch
- ✅ tavily_*, context7_*, supabase_*
- ❌ edit, patch, exa_*

**Output**: `thoughts/shared/plans/YYYY-MM-DD_HH-MM_[component]_implementation_plan.md`

**Subagents Orchestrated**:
- component-pattern-analyzer
- web-search-researcher
- documentation-verifier
- library-update-monitor
- performance-profiler
- accessibility-auditor
- test-coverage-analyzer
- database-schema-analyzer

**Implementation Priority Framework**:
```yaml
priorities:
  0: Security Patches (CVEs) - ALWAYS FIRST
  1: Critical Bug Fixes from diagnostics
  2: Core Design Implementation from proposals
  3: Technical Enhancements
  4: Validation & Testing
```

**Static Variables**:
```yaml
PLANS_DIR: "thoughts/shared/plans/"
SYNTHESIS_DEPTH: "comprehensive"
RISK_LEVELS: ["Critical", "High", "Medium", "Low"]
IMPLEMENTATION_PHASES: ["Bug Fixes", "Core Design", "Enhancements", "Validation"]
CONFIDENCE_THRESHOLD: 0.8
```

### Phase 4: ModernizationImplementer

**Mode**: Primary  
**Color**: Green  
**Description**: The EXCLUSIVE implementation authority enhanced with real-time documentation, search capabilities, and validation tools. Transforms specifications from three phases into working code with current best practices, incremental validation, and comprehensive error recovery.

**Tool Access** (UNIQUE - ONLY AGENT WITH EDIT/PATCH):
- ✅ bash, **edit**, write, read, grep, glob, list, **patch**, todowrite, todoread, webfetch
- ✅ tavily_*, exa_*, context7_*, supabase_*

**Output**: `thoughts/shared/implementations/YYYY-MM-DD_HH-MM_[component]_implementation.md`

**No Subagents** - Uses tools directly for real-time assistance

**Implementation Patterns**:
- Context7 Verification Pattern
- Error Resolution Pattern
- Package Version Intelligence Pattern
- Frontend-Database Error Investigation Pattern
- Database Schema Validation Pattern
- Data Migration Safety Pattern

**Static Variables**:
```yaml
IMPLEMENTATIONS_DIR: "thoughts/shared/implementations/"
VALIDATION_CHECKPOINTS: ["syntax", "types", "tests", "build", "integration"]
ROLLBACK_THRESHOLD: 3
IMPLEMENTATION_PHASES: ["BugFixes", "CoreDesign", "Enhancements", "Validation"]
CONFIDENCE_LEVELS: ["Verified", "Tested", "Assumed", "Unknown"]
```

### Phase 5: IterationCoordinator

**Mode**: Primary  
**Color**: Orange  
**Status**: Documented but not actively in use  
**Description**: Manages iterative refinement cycles when Phase 4 implementation reveals issues requiring upstream adjustments. Coordinates selective phase re-runs with accumulated learning, manages feedback loops, and ensures continuous improvement without full workflow restarts.

**Tool Access**:
- ✅ bash, write, read, grep, glob, list, todowrite, todoread
- ❌ edit, patch, webfetch, all external tools

**Output**: `thoughts/shared/iterations/iteration_[N]_[phase].md`

**Subagents Orchestrated**:
- context-distiller

**Iteration Triggers**:
- Implementation Blocked
- Design Infeasible
- Requirements Changed
- Performance Inadequate

**Static Variables**:
```yaml
ITERATIONS_DIR: "thoughts/shared/iterations/"
MAX_ITERATIONS: 3
ITERATION_TRIGGERS: ["Implementation Blocked", "Design Infeasible", "Requirements Changed", "Performance Inadequate"]
REFINEMENT_SCOPE: ["Targeted", "Partial", "Full"]
```

## Subagents (15 Types)

### Analysis Subagents

#### codebase-locator
- **Description**: Lightning-fast file discovery specialist
- **Tools**: read, grep, glob, list
- **Called By**: DiagnosticsResearcher
- **Returns**: Categorized file paths with purpose annotations
- **Search Patterns**: `["*service*", "*handler*", "*controller*", "*model*", "*util*", "*helper*"]`

#### codebase-analyzer
- **Description**: Deep code comprehension specialist with database interaction verification
- **Tools**: read, grep, glob, list, supabase_*
- **Called By**: DiagnosticsResearcher, ModernizationOrchestrator
- **Returns**: Implementation details with exact file:line references
- **Special Capability**: Database interaction discovery and validation

#### codebase-pattern-finder
- **Description**: Pattern extraction specialist for reusable implementations
- **Tools**: read, grep, glob, list
- **Called By**: DiagnosticsResearcher, ModernizationOrchestrator
- **Returns**: Complete working code examples with context and variations
- **Min Pattern Instances**: 2

#### database-schema-analyzer
- **Description**: Supabase database specialist for schema introspection
- **Tools**: read, grep, glob, supabase_*
- **Called By**: ModernizationOrchestrator
- **Returns**: Complete schema analysis, code-database mismatches, migration recommendations
- **Performance Threshold**: 1000ms for slow queries

### Research Subagents

#### web-search-researcher
- **Description**: Elite AI-powered web research specialist
- **Tools**: read, grep, glob, list, todowrite, todoread, tavily_*, exa_*
- **Called By**: DiagnosticsResearcher, DesignIdeator, ModernizationOrchestrator
- **Returns**: Structured findings with complete source attribution
- **Max Search Iterations**: 3
- **Min Source Authority**: 0.7

#### competitive-ui-analyzer
- **Description**: Competitive intelligence for UI patterns and best practices
- **Tools**: read, grep, glob, list, tavily_*, exa_*
- **Called By**: DesignIdeator
- **Returns**: Industry patterns, successful implementations, actionable insights
- **Analysis Categories**: `["Layout", "Navigation", "Interaction", "Visual", "Features"]`

#### documentation-verifier
- **Description**: API and component availability verification specialist
- **Tools**: read, grep, glob, list, context7_*
- **Called By**: DesignIdeator, ModernizationOrchestrator
- **Returns**: Availability confirmations, version compatibility, deprecation warnings
- **Confidence Levels**: `["Verified", "Likely", "Uncertain", "Not Found"]`

#### library-update-monitor
- **Description**: Dependency monitoring and security scanning specialist
- **Tools**: bash, read, grep, glob, list, todowrite, todoread, context7_*
- **Called By**: ModernizationOrchestrator
- **Returns**: Version analysis, CVE alerts, upgrade recommendations
- **Risk Levels**: `["Critical", "High", "Medium", "Low", "None"]`

### Validation Subagents

#### performance-profiler
- **Description**: Performance bottleneck detective with database query analysis
- **Tools**: bash, read, grep, glob, supabase_*
- **Called By**: DiagnosticsResearcher, ModernizationOrchestrator
- **Returns**: Performance metrics, bottleneck identification, optimization opportunities
- **Performance Thresholds**: `{"render": 16, "api": 200, "query": 100}`

#### accessibility-auditor
- **Description**: WCAG compliance specialist for inclusive design
- **Tools**: read, grep, glob, list
- **Called By**: DesignIdeator, ModernizationOrchestrator
- **Returns**: WCAG violation reports with specific remediation guidance
- **WCAG Levels**: `["A", "AA", "AAA"]`
- **Severity Levels**: `["Critical", "Serious", "Moderate", "Minor"]`

#### test-coverage-analyzer
- **Description**: Testing strategy and gap identification specialist
- **Tools**: bash, read, grep, glob, list, todowrite, todoread
- **Called By**: ModernizationOrchestrator
- **Returns**: Coverage metrics, test specifications, quality assessments
- **Coverage Thresholds**: `{"statements": 80, "branches": 75, "functions": 80, "lines": 80}`

### Design Subagents

#### visual-design-scanner
- **Description**: Visual design evaluation for consistency and modern principles
- **Tools**: read, grep, glob, list
- **Called By**: DesignIdeator
- **Returns**: Visual consistency analysis, design gaps, modernization opportunities
- **Design Principles**: `["Hierarchy", "Consistency", "Spacing", "Color", "Typography", "Responsiveness"]`

#### component-pattern-analyzer
- **Description**: Component architecture and reusability specialist
- **Tools**: read, grep, glob, list
- **Called By**: DesignIdeator, ModernizationOrchestrator
- **Returns**: Component hierarchy, reusability metrics, consolidation opportunities
- **Pattern Types**: `["Atomic", "Composition", "Container", "Layout", "Feature"]`

### Utility Subagents

#### context-distiller
- **Description**: Context compression specialist for iterations
- **Tools**: Document processing capabilities
- **Called By**: IterationCoordinator
- **Returns**: Focused, actionable briefs from multiple documents
- **Purpose**: Compress accumulated learning for focused iteration

#### workflow-validator
- **Status**: Mentioned but not fully documented in system
- **Purpose**: Quality gate enforcement
- **Returns**: Validation reports

## Orchestration Patterns

### Parallel Investigation Pattern
Used by DiagnosticsResearcher for comprehensive initial analysis:
```python
tasks = [
    Task(CODE_LOCATOR, "Find all files related to [feature]", subagent_type="codebase-locator"),
    Task(WEB_RESEARCHER, "Search for error='[error]' framework=[framework]", subagent_type="web-search-researcher"),
    Task(PATTERN_FINDER, "Find similar error handling patterns", subagent_type="codebase-pattern-finder")
]
# All three run simultaneously, results synthesized after
```

### Comprehensive Parallel Analysis Pattern
Used by DesignIdeator for maximum efficiency:
```python
tasks = [
    Task(VISUAL_SCANNER, "Analyze current UI state"),
    Task(COMPONENT_ANALYZER, "Analyze component patterns with anti-pattern detection"),  
    Task(ACCESSIBILITY_AUDITOR, "Assess accessibility compliance"),
    Task(DOC_VERIFIER, "Verify available components"),
    Task(COMPETITIVE_ANALYZER, "Analyze competitor UIs")
]
# All 5+ analyses run in parallel - expect 25+ pages of insights
```

### Feasibility Assessment Pattern
Used by ModernizationOrchestrator (proven ~5 minute completion):
```python
tasks = [
    Task(DOC_VERIFIER, "Verify all APIs and components"),
    Task(LIBRARY_MONITOR, "Check dependencies and scan for CVEs"),
    Task(PERF_PROFILER, "Assess performance impact"),
    Task(COMPONENT_ANALYZER, "Analyze reusable patterns"),
    Task(TEST_ANALYZER, "Discover test coverage baseline")
]
# Security scanning in dependency check is mandatory
```

### Sequential Refinement Pattern
Used when each investigation builds on the previous:
```python
locations = Task(CODE_LOCATOR, "Find [component] implementation files")
analysis = Task(CODE_ANALYZER, f"Analyze implementation in {locations.primary_files}")
solutions = Task(WEB_RESEARCHER, f"Find solutions for {analysis.root_cause}")
```

### Component Activity Verification Pattern
Critical pattern used across all phases to ensure work targets active components:
```python
if component_name.includes('-fixed' or '-v2' or '-worldclass'):
    # Anti-pattern detected
    base_name = component_name.split('-')[0]
    # Verify base is imported/active
    # Redirect all work to base component
    # Document anti-pattern in reports
```

## Document Flow Architecture

### Directory Structure
```
thoughts/shared/
├── diagnostics/           # Phase 1 outputs
│   └── YYYY-MM-DD_HH-MM_[issue]_diagnostic.md
├── proposals/             # Phase 2 outputs  
│   └── YYYY-MM-DD_HH-MM_[component]_design_proposal.md
├── plans/                 # Phase 3 outputs
│   └── YYYY-MM-DD_HH-MM_[component]_implementation_plan.md
├── implementations/       # Phase 4 outputs
│   └── YYYY-MM-DD_HH-MM_[component]_implementation.md
├── iterations/           # Phase 5 outputs
│   └── iteration_[N]_[phase].md
└── context/              # Distilled context for iterations
```

### Document Metadata Structure
Each document includes:
```yaml
---
date: [ISO date]
[agent_role]: [AgentName]
status: [phase_status]
based_on:
  diagnostic_report: [path if applicable]
  design_proposal: [path if applicable]
  implementation_plan: [path if applicable]
synthesis_sources:
  - [source]: [complete/not_required]
component_verification:
  active_components: [list]
  orphaned_found: [list]
  anti_patterns: [list]
---
```

## Anti-Pattern Detection System

The architecture actively detects and handles:

### Component Version Suffixes
- **Pattern**: Files ending in `-fixed`, `-v2`, `-worldclass`, `-new`
- **Meaning**: Repeated fix attempts indicate persistent issues
- **Action**: Redirect to base component, never create new versions
- **Enforcement**: All phases check before design/implementation

### Orphaned Components
- **Pattern**: Components not imported anywhere in codebase
- **Meaning**: Dead code that shouldn't be modified
- **Action**: Exclude from all design and implementation work
- **Enforcement**: Component verification before any work

### Multiple Component Versions
- **Pattern**: Multiple files with same base name
- **Meaning**: Evolution of fixes over time
- **Action**: Only work on actively imported version
- **Enforcement**: Import checking determines active version

## Tool Integration Specifications

### Context7 Integration
- **Purpose**: Real-time API documentation and verification
- **Users**: DiagnosticsResearcher, DesignIdeator, ModernizationOrchestrator, ModernizationImplementer
- **Subagent**: documentation-verifier
- **Query Pattern**: Always append "use context7" to queries
- **Use Cases**:
  - Component availability verification
  - API deprecation checking
  - Syntax verification
  - Best practices lookup

### Supabase Integration
- **Purpose**: Database inspection, schema analysis, performance profiling
- **Users**: DiagnosticsResearcher, ModernizationOrchestrator, ModernizationImplementer
- **Subagents**: database-schema-analyzer, performance-profiler, codebase-analyzer
- **Available Functions**:
  - `supabase_tables()`: Get all tables
  - `supabase_table_info(table)`: Get table structure
  - `supabase_query(sql, params)`: Execute queries
- **Use Cases**:
  - Schema-code alignment verification
  - Query performance analysis
  - Data integrity checking
  - Migration planning

### Tavily & Exa Integration
- **Purpose**: Web research and solution finding
- **Users**: DiagnosticsResearcher, ModernizationImplementer
- **Subagents**: web-search-researcher, competitive-ui-analyzer
- **Tavily**: Optimized search for real-time accuracy
- **Exa**: Neural search for semantic understanding
- **Use Cases**:
  - Bug solution research
  - Best practices discovery
  - Competitor analysis
  - Implementation patterns

## Critical Constraints and Rules

### Authority Hierarchy
1. **Platform level** (highest): Model specs, safety
2. **System level**: System prompts, developer messages
3. **User level**: User messages, commands, context files
4. **Guideline level**: Default instructions (overridable)
5. **No authority**: Assistant messages, tool outputs

### Communication Rules
- **One-way only**: Primary → Subagent → Result
- **No state persistence**: Subagents reset completely between calls
- **No subagent chaining**: Subagents cannot call other subagents
- **Context injection**: Via prompt only, no shared memory

### Edit Capability Rules
- **ModernizationImplementer ONLY**: Exclusive edit/patch capability
- **All others read-only**: Can write new files but not edit existing
- **No code generation in Phase 1-3**: Only specifications and plans

### Component Verification Rules
- **Always verify before work**: Check component is imported/active
- **Never create version suffixes**: No -fixed, -v2, -worldclass files
- **Redirect to base**: When versions detected, use base component
- **Document anti-patterns**: Note all detected issues in reports

### Priority Rules
- **Security always Priority 0**: CVEs block all other work
- **Test coverage discovery**: <20% coverage elevates testing priority
- **Diagnostic fixes before design**: Bug fixes take precedence
- **Dependencies must resolve**: Before implementation can proceed

## Workflow Execution Flow

### Standard Bug Fix with UI Enhancement
```
1. User → DiagnosticsResearcher: "Investigate [issue]"
   Output: diagnostic report with root causes

2. User → DesignIdeator: "Create designs based on [diagnostic]"
   Output: 3 design alternatives addressing issues

3. User → ModernizationOrchestrator: "Create plan from diagnostics and designs"
   Output: prioritized implementation plan

4. User → ModernizationImplementer: "Execute plan from [plan file]"
   Output: working code + implementation report
```

### Pure UI Modernization
```
1. User → DesignIdeator: "Modernize [component]"
   Output: 3 progressive design alternatives

2. User → ModernizationOrchestrator: "Create plan from [design]"
   Output: implementation plan with feasibility verified

3. User → ModernizationImplementer: "Execute plan from [plan file]"
   Output: working code + implementation report
```

### Iteration Flow (When Blocked)
```
4a. User → IterationCoordinator: "Implementation blocked by [issue]"
    Output: iteration package with focused context

5. User → [Appropriate Phase Agent]: "Iterate with [iteration package]"
   Output: refined phase output

6. Return to implementation with refinements
```

## Quality Gates and Success Criteria

### Phase 1 (Diagnostics) Success Criteria
- [ ] All issues investigated through parallel subagents
- [ ] Root causes identified with evidence
- [ ] Solutions validated from authoritative sources
- [ ] Component verification completed
- [ ] File:line references preserved
- [ ] Severity assessments complete

### Phase 2 (Design) Success Criteria
- [ ] Three complete alternatives created
- [ ] Component availability verified
- [ ] Accessibility compliance checked
- [ ] Competitive patterns researched
- [ ] Implementation guidance included
- [ ] Risk assessment documented

### Phase 3 (Orchestration) Success Criteria
- [ ] All context synthesized from prior phases
- [ ] Dependencies resolved and compatible
- [ ] Security vulnerabilities identified (CVE scan)
- [ ] Test coverage baseline established
- [ ] Priorities ordered correctly (Security → Bugs → Design → Enhancements)
- [ ] Risk mitigations planned

### Phase 4 (Implementation) Success Criteria
- [ ] All specifications from 3 phases implemented
- [ ] APIs verified current before use
- [ ] Tests passing
- [ ] Build successful
- [ ] Performance targets met
- [ ] Documentation complete

### Phase 5 (Iteration) Success Criteria
- [ ] Issue correctly traced to source phase
- [ ] Minimal refinement scope defined
- [ ] Context distilled effectively
- [ ] Convergence validated
- [ ] Maximum iterations not exceeded

## Static Configuration Values

### Global Settings
```yaml
workflow:
  max_phases: 5
  required_phases: [1, 3, 4]  # 2 optional for pure bug fixes, 5 optional
  max_iterations: 3
  document_format: markdown
  timestamp_format: "YYYY-MM-DD_HH-MM"
```

### Phase-Specific Limits
```yaml
diagnostics:
  max_parallel_tasks: 3
  severity_levels: 4
  
design:
  alternatives_required: 3
  time_estimates: 3
  mockup_format: ascii
  
orchestration:
  confidence_threshold: 0.8
  risk_levels: 4
  implementation_phases: 4
  
implementation:
  validation_checkpoints: 5
  rollback_threshold: 3
  confidence_levels: 4
  
iteration:
  max_iterations: 3
  refinement_scopes: 3
```

## Current System Status

### Active Components
- ✅ DiagnosticsResearcher: Fully operational
- ✅ DesignIdeator: Fully operational
- ✅ ModernizationOrchestrator: Fully operational with security-first prioritization
- ✅ ModernizationImplementer: Fully operational with enhanced tool integration
- ⏸️ IterationCoordinator: Documented but not actively used

### Subagent Utilization
- **Most Used**: web-search-researcher, codebase-analyzer, documentation-verifier
- **Critical Path**: component-pattern-analyzer, library-update-monitor (CVE scanning)
- **Quality Gates**: test-coverage-analyzer, accessibility-auditor
- **Specialized**: database-schema-analyzer (Supabase-specific)

### Known Patterns
- Component anti-patterns actively detected and handled
- Parallel orchestration patterns proven effective (~5 min completion)
- Security-first prioritization established (Priority 0)
- Three-alternative design pattern standardized

---

*This document represents the complete current state of the Brownfield Modernization Agent Architecture as implemented, without modifications or additions.*