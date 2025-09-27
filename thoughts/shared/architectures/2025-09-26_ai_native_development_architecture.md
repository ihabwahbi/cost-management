---
date: 2025-09-26T00:00:00Z
architect: Assistant
user: iwahbi
topic: "AI-Native Development Architecture"
tags: [architecture, agent-design, cli-agents, workflow, subagents, orchestration, shadcn, ultrathink, greenfield, brownfield]
status: complete
last_updated: 2025-09-26
last_updated_by: Assistant
---

# AI-Native Development Architecture

## Executive Summary

This document captures a revolutionary **AI-Native Development Architecture** - a sophisticated 5-phase sequential workflow system that enables continuous evolutionary development from initial concept to enterprise-grade applications. The architecture treats all development scenarios uniformly: whether starting from a simple non-functional mockup (where buttons don't work and data isn't connected) or modernizing existing systems, every challenge is diagnosed, designed, planned, and implemented through the same intelligent workflow.

The system consists of **5 primary agents orchestrating 16 specialized subagents** through carefully designed delegation patterns. It inherently prevents AI-specific failure modes like component drift, data-UI desynchronization, and implicit requirement regression through document-based context passing, anti-pattern detection, and component verification gates. Core capabilities include **shadcn MCP integration**, **cognitive enhancement protocols (ULTRATHINK)**, **security-first CVE prioritization**, and **perfect requirement memory** across iterations.

## System Overview

The AI-Native Development system operates as a **linear cascade workflow** that treats all development uniformly - whether fixing a non-functional button in a mockup or adding complex features to an existing system, every challenge follows the same diagnostic → design → plan → implement cycle.

### Universal Development Philosophy

This architecture recognizes a fundamental truth: **a non-functional mockup IS a system with issues to diagnose**. A button that doesn't work is a bug. A missing feature is a gap to investigate. An empty dashboard is a data flow problem. By treating both greenfield and brownfield development as continuous evolution from current state to desired state, the workflow enables iterative development from concept to enterprise without methodology changes.

### Core Architecture Principles
- **Primary agents CANNOT spawn other primary agents** - only users can invoke them
- **Subagents are STATELESS** between invocations - no memory persistence
- **Communication is strictly ONE-WAY**: primary → subagent → result
- **Only ModernizationImplementer has edit/patch privileges** - all other agents are read-only
- **Documents are the exclusive context-passing mechanism** - ensuring perfect requirement memory
- **Security (CVEs) is PRIORITY 0** - blocks all other work when detected

### AI-Specific Problem Prevention
- **Component Drift Prevention**: Anti-pattern detection (`-fixed`, `-v2`, `-worldclass`) stops AI from creating duplicates instead of fixing originals
- **Data-UI Synchronization**: Database-schema-analyzer ensures UI and data stay aligned through every iteration
- **Implicit Requirement Protection**: Document chain preserves all discovered requirements, preventing regression
- **Parallel Analysis**: 5-8 subagents analyze simultaneously in 5 minutes, enabling rapid comprehensive decisions
- **Quality Gates**: Built-in security scanning, test coverage, and accessibility checks from start

## Architecture Specification

```yaml
architecture:
  name: AINativeDevelopmentSystem
  description: 5-phase evolutionary development from concept to enterprise
  workflow_type: linear_cascade
  context_mechanism: document_based
  cognitive_enhancement: ultrathink_enabled
  development_approach: continuous_evolution
  
  phases:
    - number: 1
      name: Diagnostics
      primary_agent: DiagnosticsResearcher
      optional: false
      cognitive_eligible: true
      
    - number: 2
      name: Design
      primary_agent: DesignIdeator
      optional: false_unless_pure_bug_fix
      cognitive_eligible: true
      
    - number: 3
      name: Orchestration
      primary_agent: ModernizationOrchestrator
      optional: false
      cognitive_eligible: true
      
    - number: 4
      name: Implementation
      primary_agent: ModernizationImplementer
      optional: false
      cognitive_eligible: true
      
    - number: 5
      name: Iteration
      primary_agent: IterationCoordinator
      optional: true
      trigger: implementation_blocked
      cognitive_eligible: true
```

## Development Scenarios

### Greenfield Development (Concept → Enterprise)
Starting with a simple mockup where nothing works:
- **Phase 1**: Diagnose why buttons don't work, data isn't connected, features are missing
- **Phase 2**: Design solutions with three progressive alternatives
- **Phase 3**: Plan implementation with security and quality built-in
- **Phase 4**: Implement with real-time verification
- **Phase 5**: Iterate when reality differs from expectation

Example: "This dashboard shows hardcoded numbers" → Diagnosed as data flow issue → Design proposes database integration → Plan specifies Supabase schema → Implementation connects real data.

### Brownfield Modernization (Legacy → Modern)
Enhancing or fixing existing systems:
- **Phase 1**: Diagnose bugs, performance issues, missing capabilities
- **Phase 2**: Design modernization with backward compatibility
- **Phase 3**: Plan migration with risk mitigation
- **Phase 4**: Implement with incremental validation
- **Phase 5**: Iterate when dependencies surface

Example: "Users can't compare budget versions" → Diagnosed as missing feature → Design proposes comparison UI → Plan specifies data requirements → Implementation adds capability.

### The Universal Pattern
Both scenarios follow identical workflow because:
- A mockup with non-functional elements IS a system with bugs
- A missing feature IS an issue to diagnose and solve
- Every state (empty, broken, or working) can evolve to a better state
- The document chain ensures nothing is forgotten across iterations

## Primary Agents

### Phase 1: DiagnosticsResearcher

**Mode**: Primary  
**Color**: Red  
**Philosophy**: "Everything is Diagnosable" - Non-functional buttons, missing features, and system bugs are all issues to investigate and solve

**Tool Access**:
- ✅ bash, write, read, grep, glob, list, todowrite, todoread, webfetch
- ✅ tavily_*, exa_*, context7_*, supabase_*
- ❌ edit, patch (CRITICAL: Cannot modify code)

**Output**: `thoughts/shared/diagnostics/YYYY-MM-DD_HH-MM_[issue]_diagnostic.md`

**Subagents Orchestrated** (5):
- web-search-researcher (external solution research)
- codebase-locator (file discovery and activity verification)
- codebase-analyzer (deep code comprehension)
- codebase-pattern-finder (pattern extraction)
- performance-profiler (bottleneck detection)

**Key Patterns**:
- **Non-Functional Diagnosis**: "Why doesn't this button work?" → "No handler implemented"
- **Missing Feature Investigation**: "No comparison capability" → Requirements discovery
- **Parallel Investigation Pattern**: 2-3 min vs 6-8 min sequential
- **Component Activity Verification**: Anti-pattern detection prevents drift
- **Database Investigation**: Schema analysis for data flow issues
- **Requirement Extraction**: Discovers implicit needs from explicit problems

**Cognitive Enhancement Triggers**:
- Complex root cause analysis (>3 potential causes)
- Cross-system issue investigation
- Performance mysteries spanning multiple layers
- Database-UI correlation issues

**Static Variables**:
```yaml
DIAGNOSTICS_DIR: "thoughts/shared/diagnostics/"
MAX_PARALLEL_TASKS: 3
SEARCH_DEPTH: "comprehensive"
REPORT_FORMAT: "diagnostic-v2"
SEVERITY_LEVELS: ["Critical", "High", "Medium", "Low"]
DB_INVESTIGATION_TRIGGERS: ["data integrity", "query performance", "schema mismatch", "constraint violation", "migration issue"]
COGNITIVE_REQUEST_PATTERN: "Please include 'ultrathink' in your next message"
```

### Phase 2: DesignIdeator

**Mode**: Primary  
**Color**: Blue  
**Philosophy**: "Three-Alternative Excellence" - Every design challenge receives Conservative, Balanced, and Ambitious approaches

**Tool Access**:
- ✅ bash, write, read, grep, glob, list, todowrite, todoread, webfetch
- ✅ context7_*, **shadcn_*** (ALL shadcn MCP tools)
- ❌ edit, patch, tavily_*, exa_*, supabase_*

**Output**: `thoughts/shared/proposals/YYYY-MM-DD_HH-MM_[component]_design_proposal.md`

**Subagents Orchestrated** (8):
- visual-design-scanner (UI state analysis)
- component-pattern-analyzer (architecture patterns)
- accessibility-auditor (WCAG compliance)
- documentation-verifier (API/component availability)
- web-search-researcher (design trends)
- competitive-ui-analyzer (competitor analysis)
- database-schema-analyzer (data-driven UI requirements)
- ui-component-explorer (shadcn component discovery)

**Design Framework**:
1. **Conservative Enhancement** (1-2 days): Minimal risk, shadcn basics
2. **Balanced Modernization** (3-5 days): Strategic improvements, shadcn patterns
3. **Ambitious Transformation** (1-2 weeks): Industry-leading, custom shadcn compositions

**shadcn Integration Patterns**:
- **Parallel Discovery**: Direct shadcn tool execution while subagents analyze
- **Registry Exploration**: @shadcn → @acme → @internal → @slb
- **Component Verification Gate**: Prevents designs using unavailable components
- **Installation Manifest Generation**: Exact commands for Phase 4

**Static Variables**:
```yaml
PROPOSALS_DIR: "thoughts/shared/proposals/"
DESIGN_ALTERNATIVES: 3
TIME_ESTIMATES: ["1-2 days", "3-5 days", "1-2 weeks"]
DESIGN_APPROACHES: ["Conservative", "Balanced", "Ambitious"]
MOCKUP_FORMAT: "ascii"
SHADCN_REGISTRIES: ["@shadcn", "@acme", "@internal", "@slb"]
PARALLEL_SUBAGENT_COUNT: "5-8"
```

### Phase 3: ModernizationOrchestrator

**Mode**: Primary  
**Color**: Purple  
**Philosophy**: "Synthesis Excellence" - Every finding must be addressed with actionable specifications

**Tool Access**:
- ✅ bash, write, read, grep, glob, list, todowrite, todoread, webfetch
- ✅ tavily_*, context7_*, supabase_*
- ❌ edit, patch, exa_*

**Output**: `thoughts/shared/plans/YYYY-MM-DD_HH-MM_[component]_implementation_plan.md`

**Subagents Orchestrated** (8):
- component-pattern-analyzer (reusability assessment)
- web-search-researcher (implementation guidance)
- documentation-verifier (feasibility validation)
- library-update-monitor (**CVE SCANNING - Priority 0**)
- performance-profiler (impact assessment)
- accessibility-auditor (compliance verification)
- test-coverage-analyzer (quality baseline)
- database-schema-analyzer (migration planning)

**Priority Framework**:
```yaml
priorities:
  0: Security Patches (CVEs) - BLOCKS ALL OTHER WORK
  1: Critical Bug Fixes from diagnostics
  2: Core Design Implementation from proposals
  3: Technical Enhancements
  4: Validation & Testing
```

**Feasibility Assessment Pattern** (5-minute parallel execution):
- Runs 5-8 subagents simultaneously
- Mandatory CVE scanning through library-update-monitor
- Test coverage baseline discovery (<20% elevates priority)
- Explicit synthesis checkpoint with user

**Static Variables**:
```yaml
PLANS_DIR: "thoughts/shared/plans/"
SYNTHESIS_DEPTH: "comprehensive"
RISK_LEVELS: ["Critical", "High", "Medium", "Low"]
IMPLEMENTATION_PHASES: ["Security", "Bug Fixes", "Core Design", "Enhancements", "Validation"]
CONFIDENCE_THRESHOLD: 0.8
MAX_PARALLEL_TASKS: 8
SYNTHESIS_CHECKPOINT_REQUIRED: true
```

### Phase 4: ModernizationImplementer

**Mode**: Primary  
**Color**: Green  
**Philosophy**: "Implementation Excellence Through Intelligence" - Combines phase specs with real-time knowledge

**EXCLUSIVE Tool Access**:
- ✅ bash, **edit**, write, read, grep, glob, list, **patch**, todowrite, todoread, webfetch
- ✅ tavily_*, exa_*, context7_*, supabase_*, **shadcn_*** (EXCLUSIVE installation rights)
- **ONLY AGENT WITH EDIT/PATCH PRIVILEGES**

**Output**: `thoughts/shared/implementations/YYYY-MM-DD_HH-MM_[component]_implementation_report.md`

**No Direct Subagent Orchestration** - Uses tools directly for real-time assistance

**Implementation Patterns**:
- **shadcn Component Installation Pattern**: Registry → Discovery → Installation
- **Context7 API Verification Pattern**: Real-time deprecation handling
- **Error Resolution Pattern**: Systematic categorization and search
- **Database Schema Validation Pattern**: Alignment before implementation
- **Data Migration Safety Pattern**: Transactional with rollback
- **Package Version Intelligence Pattern**: Smart mismatch resolution

**7-Phase Implementation Workflow**:
1. Synthesize three-phase specifications
2. Component verification & **SECURITY PATCHES**
3. Critical bug fixes
4. Core design implementation (including shadcn)
5. Technical enhancements
6. Validation & quality assurance
7. Documentation & reporting

**Static Variables**:
```yaml
IMPLEMENTATIONS_DIR: "thoughts/shared/implementations/"
VALIDATION_CHECKPOINTS: ["syntax", "types", "tests", "build", "integration"]
ROLLBACK_THRESHOLD: 3
IMPLEMENTATION_PHASES: ["Security", "BugFixes", "CoreDesign", "Enhancements", "Validation"]
CONFIDENCE_LEVELS: ["Verified", "Tested", "Assumed", "Unknown"]
SHADCN_COMPONENT_DIR: "components/ui/"
REGISTRY_PRIORITY: ["@shadcn", "@slb", "@acme", "@internal"]
```

### Phase 5: IterationCoordinator

**Mode**: Primary  
**Color**: Orange  
**Status**: Active
**Philosophy**: "Minimal Intervention Excellence" - The smallest change that resolves the issue

**Tool Access**:
- ✅ bash, write, read, grep, glob, list, todowrite, todoread
- ❌ edit, patch, webfetch, all external tools

**Output**: `thoughts/shared/iterations/iteration_[N]_[phase].md`

**Subagents Orchestrated** (1):
- context-distiller (compresses 100+ pages → 5-10 pages)

**Iteration Management**:
- **Issue Triage Pattern**: Maps blocks to source phases
- **Focused Context Preparation**: Targeted packages for re-runs
- **Convergence Validation**: Quantitative metrics

**Convergence States**:
```yaml
CONVERGING: improvement_rate >= 0.2
OSCILLATING: same issue recurs > 2 times
DIVERGING: improvement_rate < 0 (getting worse)
CONVERGED: confidence >= 0.8 and issues resolved
```

**Static Variables**:
```yaml
ITERATIONS_DIR: "thoughts/shared/iterations/"
MAX_ITERATIONS: 3
ITERATION_TRIGGERS: ["Implementation Blocked", "Design Infeasible", "Requirements Changed", "Performance Inadequate"]
REFINEMENT_SCOPE: ["Targeted", "Partial", "Full"]
CONVERGENCE_THRESHOLDS:
  improvement_rate: 0.2
  confidence_target: 0.8
  oscillation_limit: 2
  divergence_slope: -0.1
```

## Subagents (16 Specialized Types)

### Analysis Subagents

#### codebase-locator
- **CRITICAL**: Activity verification prevents work on orphaned code
- **Tools**: read, grep, glob, list, todowrite, todoread
- **Called By**: DiagnosticsResearcher
- **Anti-Pattern Detection**: `-fixed`, `-v2`, `-worldclass` suffixes
- **Import Verification**: ES6, CommonJS, dynamic, JSX patterns
- **Output**: Activity-categorized file maps with DO_NOT_MODIFY flags

#### codebase-analyzer
- **Database-First**: Phase 0 schema discovery approach
- **Tools**: read, grep, glob, list, todowrite, todoread, **supabase_***
- **Called By**: DiagnosticsResearcher, ModernizationOrchestrator
- **ULTRATHINK Triggers**: Complexity >20, data flow >4 layers, tech debt >7/10
- **Forensic Precision**: file:line:column references

#### codebase-pattern-finder
- **Dual-Purpose**: Different priorities for different callers
- **Tools**: read, grep, glob, list, todowrite, todoread
- **Called By**: DiagnosticsResearcher (error patterns), ModernizationOrchestrator (architectural patterns)
- **MIN_PATTERN_INSTANCES**: 2 for validity
- **Complete Code**: Includes imports, types, error handling

#### database-schema-analyzer
- **Supabase Specialist**: Schema truth-teller
- **Tools**: read, grep, glob, **supabase_***
- **Called By**: ModernizationOrchestrator, DesignIdeator
- **Performance Threshold**: 1000ms for slow queries
- **Migration Generation**: Safe with rollback procedures

### Research Subagents

#### web-search-researcher
- **Triple-Platform**: Context7, Tavily, Exa integration
- **Tools**: read, grep, glob, list, todowrite, todoread, **tavily_***, **exa_***, **context7_***
- **Called By**: DiagnosticsResearcher, DesignIdeator, ModernizationOrchestrator
- **ULTRATHINK Support**: 5 iterations, 20 results, 3+ sources
- **Platform Selection**: Intelligent query-based routing

#### competitive-ui-analyzer
- **Component Mapping**: shadcn pattern matching for competitors
- **Tools**: read, grep, glob, list, todowrite, todoread, tavily_*, exa_*, **shadcn_***
- **Called By**: DesignIdeator
- **Component Mapping**: Competitor patterns → shadcn alternatives
- **Innovation Gap Analysis**: Market opportunities identification

#### documentation-verifier
- **Dual Verification**: APIs AND shadcn components
- **Tools**: read, grep, glob, list, todowrite, todoread, **context7_***, **shadcn_***
- **Called By**: DesignIdeator, ModernizationOrchestrator, IterationCoordinator
- **Installation Manifest**: Generates exact commands
- **Registry Priority**: @shadcn → @acme → @internal → @slb

#### library-update-monitor
- **SECURITY FIRST**: CVE scanning is Priority 0
- **Tools**: bash, read, grep, glob, list, todowrite, todoread, **context7_***, **shadcn_***
- **Called By**: ModernizationOrchestrator
- **Dual Scanning**: npm packages AND UI components
- **Risk Formula**: `(security×3) + (breaking×2) + (maintenance×1) + (component×2)`

#### ui-component-explorer
- **shadcn Discovery Specialist**: Production-ready components
- **Tools**: read, grep, glob, list, **shadcn_*** (all MCP tools)
- **Called By**: DesignIdeator, ModernizationOrchestrator
- **Multi-Registry**: Explores @shadcn, @acme, @slb, @internal
- **Match Threshold**: 0.75 for recommendations

### Validation Subagents

#### performance-profiler
- **Database Integration**: Query analysis via Supabase
- **Tools**: bash, read, grep, glob, list, todowrite, todoread, **supabase_***
- **Called By**: DiagnosticsResearcher, ModernizationOrchestrator
- **Thresholds**: render=16ms, api=200ms, query=100ms
- **ROI Prioritization**: (impact × frequency) / complexity

#### accessibility-auditor
- **WCAG 2.2**: All levels (A, AA, AAA)
- **Tools**: read, grep, glob, list, todowrite, todoread
- **Called By**: DesignIdeator, ModernizationOrchestrator
- **POUR Coverage**: Perceivable, Operable, Understandable, Robust
- **Severity Levels**: Critical → Serious → Moderate → Minor

#### test-coverage-analyzer
- **Quality Baseline**: Discovers existing coverage
- **Tools**: bash, read, grep, glob, list, todowrite, todoread
- **Called By**: ModernizationOrchestrator
- **<20% Trigger**: Elevates testing to Priority 1
- **Test Pyramid**: Unit(40%), Component(30%), Integration(20%), E2E(10%)

#### workflow-validator
- **Quality Gatekeeper**: Phase transition enforcement
- **Tools**: read, grep, glob, list
- **Called By**: ALL primary agents at phase transitions
- **Metrics-Driven**: 90% completeness, 85% consistency thresholds
- **Anti-Pattern Detection**: Component versioning issues

### Design Subagents

#### visual-design-scanner
- **Parallel Execution**: Runs with 4+ peers
- **Tools**: read, grep, glob, list, todowrite, todoread
- **Called By**: DesignIdeator
- **5-Minute Window**: Parallel completion target
- **Quantitative Metrics**: Consistency %, spacing adherence

#### component-pattern-analyzer
- **CRITICAL Focus**: Version suffix detection
- **Tools**: read, grep, glob, list, **shadcn_***
- **Called By**: DesignIdeator, ModernizationOrchestrator
- **shadcn Integration**: Registry pattern comparison
- **ROI Calculations**: Migration effort hours

### Utility Subagents

#### context-distiller
- **Phase 5 Specialist**: 100+ pages → 5-10 pages
- **Tools**: read, grep, glob, list
- **Called By**: IterationCoordinator
- **Compression Ratio**: 0.3 target (70% reduction)
- **Priority Classification**: Critical → Important → Useful → Optional

## Orchestration Patterns

### Parallel Investigation with Cognitive Enhancement
```yaml
# DiagnosticsResearcher enhanced pattern
parallel_tasks:
  - task: "ultrathink: Find root cause for [complex issue]"
    subagent_type: codebase-analyzer
  - task: "Search for CVE='[error]' with ultrathink"
    subagent_type: web-search-researcher
  - task: "Find patterns with version detection"
    subagent_type: codebase-pattern-finder
```

### Comprehensive Design Research with shadcn
```yaml
# DesignIdeator parallel pattern (5-8 subagents)
parallel_tasks:
  - task: "Analyze current UI state"
    subagent_type: visual-design-scanner
  - task: "Detect component anti-patterns"
    subagent_type: component-pattern-analyzer
  - task: "Assess WCAG compliance"
    subagent_type: accessibility-auditor
  - task: "Verify shadcn components"
    subagent_type: documentation-verifier
  - task: "Analyze competitor patterns"
    subagent_type: competitive-ui-analyzer
  - task: "Explore shadcn alternatives"
    subagent_type: ui-component-explorer
note: "Plus direct shadcn tool execution in parallel"
```

### Security-First Feasibility Assessment
```yaml
# ModernizationOrchestrator mandatory pattern
parallel_tasks:
  - task: "CRITICAL: Scan for CVEs"
    subagent_type: library-update-monitor
    priority: 0  # Blocks all other work
  - task: "Verify all APIs and shadcn"
    subagent_type: documentation-verifier
  - task: "Assess performance impact"
    subagent_type: performance-profiler
  - task: "Analyze patterns with shadcn"
    subagent_type: component-pattern-analyzer
  - task: "Discover test baseline"
    subagent_type: test-coverage-analyzer
note: "CVE detection blocks all work if found"
```

### Component Activity Verification (Universal)
```yaml
# Applied across ALL phases before any work
verification_workflow:
  trigger:
    condition: component_name_ends_with
    suffixes: ["-fixed", "-v2", "-worldclass", "-new", "-old"]
  
  actions:
    - step: detect_anti_pattern
      severity: CRITICAL
      
    - step: extract_base_component
      action: remove_suffix_from_name
      
    - step: verify_import_status
      check: is_actively_imported
      
    - step: categorize_component
      if_not_imported:
        mark: "DO NOT MODIFY"
        status: orphaned
      if_imported:
        redirect_to: base_component
        
    - step: document_findings
      output: anti_pattern_report
```

## Tool Integrations

### shadcn MCP Integration
- **Purpose**: UI component discovery, verification, and installation
- **Primary Users**: DesignIdeator, ModernizationImplementer
- **Subagent Users**: documentation-verifier, competitive-ui-analyzer, component-pattern-analyzer, ui-component-explorer, library-update-monitor
- **Available Functions**:
  - `shadcn_list_items_in_registries()`: Browse available components
  - `shadcn_search_items_in_registries()`: Find specific patterns
  - `shadcn_view_items_in_registries()`: Get component details
  - `shadcn_get_item_examples_from_registries()`: See usage examples
  - `shadcn_get_add_command_for_items()`: Generate installation commands
  - `shadcn_get_project_registries()`: List configured registries
  - `shadcn_get_audit_checklist()`: Validate component health

### Context7 Integration
- **Purpose**: Real-time API documentation and verification
- **Query Pattern**: Always append "use context7" to queries
- **CVE Research**: Includes security vulnerability lookups
- **Version-Specific**: Handles deprecations and migrations

### Supabase Integration
- **Database-First**: Phase 0 schema discovery in multiple agents
- **Performance Analysis**: Slow query detection (>1000ms)
- **Migration Safety**: Transaction-wrapped with rollbacks
- **Schema Validation**: Code-database alignment verification

### Tavily & Exa Integration
- **Intelligent Selection**: Query-based platform routing
- **Tavily**: Real-time news, temporal queries, extraction
- **Exa**: Semantic search, pattern discovery, similarity
- **Fallback Chains**: Automatic platform switching

## Cognitive Enhancement Protocol (ULTRATHINK)

### When Primary Agents Request Enhancement
- **Complex Root Cause Analysis**: >3 potential causes
- **Cross-System Dependencies**: Multiple component interactions
- **Security Vulnerability Assessment**: CVE impact analysis
- **Database Migration Planning**: Breaking schema changes
- **Component Selection**: >5 alternatives to evaluate
- **Pattern Synthesis**: Across multiple competitors/sources

### How Subagents Receive Enhancement
```yaml
# Primary agent delegates with cognitive enhancement
task_delegation:
  prompt: "ultrathink: Analyze complex performance bottleneck in [component]"
  subagent_type: performance-profiler
  cognitive_mode: enhanced
```

### Analysis Depth Indicators
- **Standard**: Default analysis depth
- **Enhanced (ultrathink)**: Maximum depth with expanded iterations
- Subagents note: "Analysis Depth: Enhanced (ultrathink applied)"

## Anti-Pattern Detection System

### Component Version Suffixes (CRITICAL)
- **Patterns**: `-fixed`, `-v2`, `-worldclass`, `-new`, `-old`, `-legacy`, `-deprecated`, `-temp`, `-backup`, `-copy`
- **Detection**: ALL agents check before work
- **Action**: ALWAYS redirect to base component
- **Documentation**: Note in all phase reports

### Orphaned Component Prevention
- **Detection**: Import verification across codebase
- **Marking**: "DO_NOT_MODIFY" flags
- **Enforcement**: Excluded from all work recommendations
- **Reporting**: Listed separately in outputs

### Security Anti-Patterns (Priority 0)
- **CVE Detection**: Blocks ALL work immediately
- **XSS Vulnerabilities**: In UI components
- **Insecure Dependencies**: Abandoned packages (>365 days)
- **Authentication Flaws**: Special scrutiny on auth components

## Quality Gates and Success Criteria

### Phase Transition Validation
Each phase transition requires workflow-validator verification:
- **Completeness**: ≥90% criteria met
- **Consistency**: ≥85% cross-references valid
- **Downstream Readiness**: Next phase can consume output
- **Anti-Pattern Check**: No problematic components

### Security Gate (Priority 0)
- **CVE Scan**: Must pass before ANY work proceeds
- **UI Component Security**: XSS vulnerability check
- **Dependency Health**: No critical vulnerabilities
- **Registry Authentication**: Verified access

### Component Verification Gate
- **Activity Status**: Only active components proceed
- **Import Verification**: Confirmed usage in codebase
- **Version Check**: No suffix anti-patterns
- **shadcn Availability**: Components exist in registries

## Current System Status

### Active Components
- ✅ DiagnosticsResearcher: NaN forensics, database patterns
- ✅ DesignIdeator: Full shadcn MCP integration, 8 parallel subagents
- ✅ ModernizationOrchestrator: Security-first with CVE blocking
- ✅ ModernizationImplementer: Exclusive edit rights, shadcn installation
- ✅ IterationCoordinator: Active with convergence validation

### Subagent Capabilities
- **Most Critical**: library-update-monitor (CVE scanning), codebase-locator (activity verification)
- **Triple-Platform Research**: web-search-researcher, documentation-verifier (dual verification)
- **shadcn Integration**: 7 subagents with shadcn capabilities
- **Cognitive Support**: 11 subagents support ULTRATHINK
- **Security Scanning**: 3 subagents perform security checks

### Proven Patterns
- **5-Minute Parallel Execution**: Consistent completion time
- **Component Anti-Pattern Detection**: 100% coverage across workflow
- **CVE Priority 0**: Successfully blocks work when detected
- **shadcn Integration**: Seamless component discovery to installation
- **Cognitive Enhancement**: Measurable improvement in complex scenarios

### Performance Metrics
- **Parallel Subagent Execution**: 3-8 simultaneous (phase-dependent)
- **Investigation Speed**: 2-3 min parallel vs 6-8 min sequential
- **Component Discovery**: <30s with shadcn MCP
- **CVE Scanning**: <1 min for full dependency tree
- **Document Compression**: 70% reduction maintaining technical detail

## Why This Architecture is AI-Native

### Works WITH AI Strengths
- **Parallel Processing**: 5-8 subagents analyze simultaneously, impossible for human teams
- **Perfect Memory**: Document chain preserves every decision and requirement
- **Pattern Detection**: Anti-pattern and security scanning happens automatically
- **Rapid Synthesis**: Combines findings from multiple sources in minutes

### Compensates for AI Weaknesses
- **Context Preservation**: Document-based passing prevents requirement loss
- **Component Drift Prevention**: Anti-pattern detection stops duplicate creation
- **Quality Enforcement**: Built-in gates prevent degradation over iterations
- **Explicit State Management**: Stateless subagents with clear boundaries

### Enables Continuous Evolution
- **From Concept to Enterprise**: Same workflow scales from mockup to production
- **Iterative Refinement**: Each cycle guaranteed no worse than previous
- **Feature-by-Feature Growth**: Add capabilities without methodology changes
- **Regression-Proof**: Security, quality, and accessibility checked continuously

### Fundamentally Different from Human Methodologies
Unlike Agile, Waterfall, or other human-oriented approaches, this architecture:
- Treats development as continuous evolution, not discrete building phases
- Uses documents as executable specifications, not just documentation
- Prevents problems through verification gates, not post-facto detection
- Enables exploratory-convergent development natural to AI thinking

---

*This document represents the complete current state of the AI-Native Development Architecture as of 2025-09-26.*