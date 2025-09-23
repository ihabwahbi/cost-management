# Agent Boundaries and Responsibilities

## Overview

This document clearly defines what each primary agent can and cannot do in the 4-phase brownfield modernization workflow. Each agent has specific boundaries to ensure clean separation of concerns.

## 🔴 Phase 1: DiagnosticsResearcher

### ✅ DOES
- Investigate and reproduce bugs
- Search for known solutions online
- Analyze code (READ ONLY)
- Document root causes
- Recommend fixes with code examples
- Suggest debug instrumentation
- Create diagnostic reports

### ❌ DOES NOT
- Edit any source files
- Implement any fixes
- Apply any patches
- Modify components
- Execute solutions
- Change any code

### Tools Configuration
```yaml
edit: false  # Cannot edit files
patch: false # Cannot patch files
write: true  # Only for reports
```

### Output
- `thoughts/shared/diagnostics/[timestamp]_diagnostic.md`
- Contains: Issues, root causes, recommended fixes (not implemented)

---

## 🔵 Phase 2: DesignIdeator

### ✅ DOES
- Read diagnostic reports from Phase 1
- Analyze current UI state (READ ONLY)
- Research design trends
- Verify component availability
- Create 3 design alternatives (specs only)
- Generate mockups (ASCII/markdown)
- Document design specifications
- Create design proposals

### ❌ DOES NOT
- Edit any source files
- Write any code
- Implement designs
- Modify components
- Apply styling
- Execute changes

### Tools Configuration
```yaml
edit: false  # Cannot edit files
patch: false # Cannot patch files
write: true  # Only for proposals
```

### Output
- `thoughts/shared/proposals/[timestamp]_design_proposal.md`
- Contains: Design specifications, mockups, technical requirements (not code)

---

## 🟣 Phase 3: ModernizationOrchestrator

### ✅ DOES
- Read diagnostics from Phase 1
- Read designs from Phase 2
- Coordinate subagent analysis
- Research best practices
- Synthesize all findings
- Create detailed implementation plans
- Document technical specifications
- Define implementation priorities

### ❌ DOES NOT
- Edit any source files
- Write any code
- Implement anything
- Apply fixes
- Execute designs
- Modify components

### Tools Configuration
```yaml
edit: false  # Cannot edit files
patch: false # Cannot patch files
write: true  # Only for plans
```

### Output
- `thoughts/shared/plans/[timestamp]_implementation_plan.md`
- Contains: Synthesized plan combining all previous phases (no implementation)

---

## 🟢 Phase 4: ModernizationImplementer

### ✅ DOES (ONLY THIS AGENT)
- **Reads ALL context from Phases 1, 2, and 3**
- **Edits source code files**
- **Implements bug fixes from Phase 1**
- **Executes designs from Phase 2**
- **Follows plans from Phase 3**
- **Adds debug instrumentation**
- **Writes tests**
- **Modifies components**
- **Applies all changes**

### ❌ DOES NOT
- Skip reading previous context
- Implement without following specifications
- Make changes not documented in previous phases

### Tools Configuration
```yaml
edit: true   # CAN edit files
patch: true  # CAN patch files
write: true  # CAN write code and reports
```

### Output
- Actual code changes in the codebase
- `thoughts/shared/implementations/[timestamp]_implementation.md`
- Contains: Report of what was implemented

---

## Context Flow

```
Phase 1 (DiagnosticsResearcher)
    ↓ Produces: Diagnostic Report
    ↓ (User manually starts Phase 2)
    
Phase 2 (DesignIdeator)
    ↓ Reads: Diagnostic Report
    ↓ Produces: Design Proposals
    ↓ (User manually starts Phase 3)
    
Phase 3 (ModernizationOrchestrator)
    ↓ Reads: Diagnostic Report + Design Proposals
    ↓ Produces: Implementation Plan
    ↓ (User manually starts Phase 4)
    
Phase 4 (ModernizationImplementer)
    ↓ Reads: ALL previous documents
    ↓ Executes: Everything specified
    ↓ Produces: Live code + Report
```

## Key Principles

### 1. Clear Separation
- **Only Phase 4 implements** - all others document
- **Each phase has unique responsibilities** - no overlap
- **Context flows through documents** - not direct communication

### 2. Progressive Refinement
- Phase 1: Identifies what's wrong
- Phase 2: Designs how it should be
- Phase 3: Plans how to get there
- Phase 4: Makes it happen

### 3. Complete Context
- Each phase builds on previous work
- Phase 4 uses ALL accumulated knowledge
- Nothing is lost between phases

### 4. Quality Gates
- Each phase validates its output
- Next phase won't proceed without required input
- Phase 4 validates everything was implemented

## Common Mistakes to Avoid

### ❌ DON'T
- Let Phase 1, 2, or 3 edit code
- Skip reading previous phase outputs
- Implement partially in early phases
- Have Phase 4 ignore previous context

### ✅ DO
- Keep Phases 1-3 read-only for code
- Have each phase read all previous outputs
- Document thoroughly in each phase
- Have Phase 4 implement everything specified

## Verification Checklist

### Phase 1 Completion
- [ ] No source files edited
- [ ] Diagnostic report created
- [ ] Fixes documented (not implemented)

### Phase 2 Completion
- [ ] No source files edited
- [ ] Design proposals created
- [ ] Mockups provided (not code)

### Phase 3 Completion
- [ ] No source files edited
- [ ] Implementation plan created
- [ ] All context synthesized

### Phase 4 Completion
- [ ] Read ALL previous documents
- [ ] Implemented ALL bug fixes
- [ ] Implemented ALL designs
- [ ] Followed ALL plans
- [ ] Tests written and passing

## Summary

The 4-phase workflow ensures:
1. **Thorough investigation** before action (Phase 1)
2. **Thoughtful design** before coding (Phase 2)
3. **Comprehensive planning** before execution (Phase 3)
4. **Complete implementation** with full context (Phase 4)

Only ModernizationImplementer (Phase 4) can modify code. All others analyze, design, and plan.