# Brownfield Modernization Workflow Guide

## Overview

This guide explains the correct 4-phase workflow for modernizing brownfield applications using our specialized primary agents. Each agent runs in its own session, with context passed through structured documents.

## ⚠️ CRITICAL: Primary Agents Cannot Spawn Each Other

**Important**: Primary agents (DiagnosticsResearcher, DesignIdeator, ModernizationOrchestrator, ModernizationImplementer) **CANNOT** spawn other primary agents. They can only spawn subagents. The user must manually invoke each primary agent in sequence.

## The 4-Phase Workflow

### Phase 1: Diagnostics (When Fixing Bugs)

**Agent**: `DiagnosticsResearcher`
**Purpose**: Investigate and diagnose issues
**Output**: Diagnostic report in `thoughts/shared/diagnostics/`

```bash
# User invokes:
DiagnosticsResearcher: Investigate the dashboard loading issue with outdated UI

# Agent will:
- Search for known issues (via web-search-researcher subagent)
- Analyze the problem (via codebase-analyzer subagent)
- Profile performance (via performance-profiler subagent)
- Generate debug instrumentation
- Produce diagnostic report
```

**Output Document**: `thoughts/shared/diagnostics/YYYY-MM-DD_HH-MM_[issue]_diagnostic.md`

### Phase 2: Design

**Agent**: `DesignIdeator`
**Purpose**: Create UI/UX design proposals
**Input**: Reads diagnostic report (if bug fix) or starts fresh (if enhancement)
**Output**: Design proposals in `thoughts/shared/proposals/`

```bash
# User invokes:
DesignIdeator: Create designs based on diagnostics report from [filename]
# OR for pure UI enhancement:
DesignIdeator: Modernize the dashboard UI

# Agent will:
- Read diagnostic report (if applicable)
- Research design trends (via web-search-researcher subagent)
- Analyze competitors (via competitive-ui-analyzer subagent)
- Verify component APIs (via documentation-verifier subagent)
- Generate 3 design alternatives (Conservative, Balanced, Ambitious)
- Produce design proposal document
```

**Output Document**: `thoughts/shared/proposals/YYYY-MM-DD_HH-MM_[component]_design_proposal.md`

### Phase 3: Orchestration & Planning

**Agent**: `ModernizationOrchestrator`
**Purpose**: Coordinate analysis and create implementation plan
**Input**: Reads both diagnostic report and design proposals
**Output**: Implementation plan in `thoughts/shared/plans/`

```bash
# User invokes:
ModernizationOrchestrator: Create implementation plan from diagnostics and designs

# Agent will:
- Read diagnostic report and design proposals
- Coordinate component analysis (via component-pattern-analyzer subagent)
- Research best practices (via web-search-researcher subagent)
- Verify feasibility (via documentation-verifier subagent)
- Check dependencies (via library-update-monitor subagent)
- Synthesize findings into comprehensive plan
- Produce implementation plan document
```

**Output Document**: `thoughts/shared/plans/YYYY-MM-DD_HH-MM_[component]_implementation_plan.md`

### Phase 4: Implementation

**Agent**: `ModernizationImplementer`
**Purpose**: Execute the approved plan
**Input**: Reads all previous documents (diagnostics, designs, plan)
**Output**: Implementation report and actual code changes

```bash
# User invokes:
ModernizationImplementer: Execute plan from [plan_filename]

# Agent will:
- Read all context documents
- Verify APIs are current (via documentation-verifier subagent)
- Research implementation patterns (via web-search-researcher subagent)
- Implement bug fixes (from diagnostics)
- Implement UI enhancements (from design)
- Add debug instrumentation
- Write/update tests
- Validate quality gates
- Produce implementation report
```

**Output Document**: `thoughts/shared/implementations/YYYY-MM-DD_HH-MM_[component]_implementation.md`

## Document Structure & Handover

### Context Documents Location

```
thoughts/
└── shared/
    ├── diagnostics/        # Phase 1 outputs
    │   └── YYYY-MM-DD_HH-MM_[issue]_diagnostic.md
    ├── proposals/          # Phase 2 outputs
    │   └── YYYY-MM-DD_HH-MM_[component]_design_proposal.md
    ├── plans/              # Phase 3 outputs
    │   └── YYYY-MM-DD_HH-MM_[component]_implementation_plan.md
    ├── implementations/    # Phase 4 outputs
    │   └── YYYY-MM-DD_HH-MM_[component]_implementation.md
    ├── context/            # Distilled context between iterations
    │   └── [component]_context.md
    ├── iterations/         # Iteration history
    │   └── iteration_[N]_[component].md
    └── design-evolution/   # Component evolution tracking
        └── [component]_evolution.md
```

### Document Templates

Each phase produces a structured document with metadata for the next phase:

#### Diagnostic Report (Phase 1)
```yaml
---
date: [ISO date]
researcher: DiagnosticsResearcher
issue: [identifier]
severity: [level]
status: root-cause-found
---
# Content with findings, solutions, recommendations
```

#### Design Proposal (Phase 2)
```yaml
---
date: [ISO date]
designer: DesignIdeator
component: [name]
diagnostic_report: [filename if applicable]
status: ready_for_orchestration
---
# Three design alternatives with verification
```

#### Implementation Plan (Phase 3)
```yaml
---
date: [ISO date]
orchestrator: ModernizationOrchestrator
based_on:
  - diagnostic_report: [filename]
  - design_proposals: [filename]
status: ready_for_implementation
---
# Comprehensive plan with specifications
```

#### Implementation Report (Phase 4)
```yaml
---
date: [ISO date]
implementer: ModernizationImplementer
based_on:
  - diagnostic_report: [filename]
  - design_proposal: [filename]
  - implementation_plan: [filename]
status: complete
---
# Implementation details and validation results
```

## Workflow Examples

### Example 1: Bug Fix with UI Enhancement

```bash
# Step 1: Diagnose the bug
User: DiagnosticsResearcher: Investigate slow dashboard loading

# Output: thoughts/shared/diagnostics/2024-01-15_10-30_dashboard_performance_diagnostic.md

# Step 2: Design improvements
User: DesignIdeator: Create designs based on dashboard performance diagnostic

# Output: thoughts/shared/proposals/2024-01-15_11-00_dashboard_design_proposal.md

# Step 3: Create plan
User: ModernizationOrchestrator: Create plan from diagnostics and designs

# Output: thoughts/shared/plans/2024-01-15_11-30_dashboard_implementation_plan.md

# Step 4: Implement
User: ModernizationImplementer: Execute plan from dashboard_implementation_plan.md

# Output: Code changes + thoughts/shared/implementations/2024-01-15_12-00_dashboard_implementation.md
```

### Example 2: Pure UI Modernization

```bash
# Step 1: Skip diagnostics (no bug)

# Step 2: Design new UI
User: DesignIdeator: Modernize the user profile page

# Output: thoughts/shared/proposals/2024-01-15_14-00_profile_design_proposal.md

# Step 3: Create plan
User: ModernizationOrchestrator: Create plan from profile design proposal

# Output: thoughts/shared/plans/2024-01-15_14-30_profile_implementation_plan.md

# Step 4: Implement
User: ModernizationImplementer: Execute plan from profile_implementation_plan.md

# Output: Code changes + report
```

## Available Subagents

Each primary agent can spawn these subagents:

### Analysis Subagents
- `component-pattern-analyzer` - Analyzes component patterns
- `visual-design-scanner` - Evaluates UI state
- `codebase-pattern-finder` - Finds code examples
- `codebase-locator` - Locates files
- `codebase-analyzer` - Deep code analysis

### Research Subagents
- `web-search-researcher` - Web research (Tavily/Exa)
- `competitive-ui-analyzer` - Competitor analysis
- `library-update-monitor` - Dependency monitoring
- `documentation-verifier` - API verification (Context7)

### Validation Subagents
- `accessibility-auditor` - WCAG compliance
- `performance-profiler` - Performance analysis
- `design-system-validator` - Design consistency
- `test-coverage-analyzer` - Testing gaps

### Utility Subagents
- `context-distiller` - Context compression
- `debug-trace-generator` - Debug instrumentation
- `thoughts-locator` - Find documents
- `thoughts-analyzer` - Extract insights

## Best Practices

### DO ✅
- Run agents in sequence (Phase 1 → 2 → 3 → 4)
- Let each agent complete before starting the next
- Check output documents between phases
- Provide clear context when invoking each agent
- Reference specific document filenames when needed

### DON'T ❌
- Try to skip phases (unless pure UI work - can skip Phase 1)
- Expect agents to spawn other primary agents
- Modify the workflow order
- Delete context documents between phases
- Run multiple primary agents simultaneously

## Troubleshooting

### "Missing context" errors
- Ensure previous phases completed successfully
- Check that output documents were created
- Verify document paths are correct

### "Cannot spawn primary agent" errors
- This is expected - manually invoke the next agent
- Primary agents can only spawn subagents

### "Implementation doesn't match design"
- Ensure ModernizationOrchestrator ran between design and implementation
- Check that implementation plan was created
- Verify all documents are being read

## Quick Reference

```bash
# Full workflow for bug with UI improvement
DiagnosticsResearcher: [investigate issue]
DesignIdeator: [create designs based on diagnostics]
ModernizationOrchestrator: [create plan from diagnostics and designs]
ModernizationImplementer: [execute plan]

# Workflow for pure UI enhancement
DesignIdeator: [create UI designs]
ModernizationOrchestrator: [create plan from designs]
ModernizationImplementer: [execute plan]

# Workflow for pure bug fix (minimal UI change)
DiagnosticsResearcher: [investigate issue]
ModernizationOrchestrator: [create fix plan from diagnostics]
ModernizationImplementer: [execute fix]
```

## Summary

The brownfield modernization workflow is a carefully orchestrated 4-phase process where:
1. Each primary agent runs independently
2. Context passes through structured documents
3. The user manually progresses through phases
4. Subagents provide specialized capabilities
5. Quality gates ensure each phase completes successfully

This approach ensures clear separation of concerns, comprehensive documentation, and high-quality modernization of brownfield applications.