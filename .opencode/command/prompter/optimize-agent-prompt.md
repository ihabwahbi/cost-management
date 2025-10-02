---
description: Analyzes and optimizes an agent's system prompt to achieve maximum alignment with its documented workflow architecture
agent: prompter
---

## Variables

### Dynamic Variables
TARGET_AGENT: $ARGUMENTS

## Instructions

ultrathink: Deeply analyze the specified agent's architecture document and current system prompt, then perform surgical optimization to achieve hyper-alignment between prompt and workflow while converting high-impact sections to YAML where significant clarity gains exist.

## Workflow

### Phase 1: Architecture Deep Dive

1. **Read Architecture Document**
   - Read `.opencode/agent/{{TARGET_AGENT}}-architecture.md` or relevant workflow doc
   - Extract workflow phases, dependencies, and critical paths
   - Map tool usage patterns and constraints
   - Identify input/output specifications

2. **Workflow Pattern Extraction**
   Analyze for:
   - Sequential operation chains
   - Parallel execution opportunities
   - Decision branches and conditions
   - Error recovery requirements
   - Validation checkpoints
   - Performance bottlenecks

3. **Create Analysis Todos**
   ```
   - [ ] Map all workflow phases and dependencies
   - [ ] Document tool usage patterns
   - [ ] Identify critical execution paths
   - [ ] Note optimization opportunities
   - [ ] Extract success criteria
   ```

### Phase 2: Current Prompt Forensics

1. **Read Current System Prompt**
   - Read `.opencode/agent/{{TARGET_AGENT}}.md`
   - Perform line-by-line alignment audit
   - Score each section against workflow needs

2. **Gap Analysis Report**
   ```markdown
   ## Prompt-Workflow Alignment Analysis
   
   ### Alignment Gaps
   - **Missing**: {{workflow requirement not addressed}}
   - **Ambiguous**: {{instruction open to misinterpretation}}
   - **Redundant**: {{instruction serving no workflow purpose}}
   
   ### YAML Conversion Candidates
   | Section | Current Format | Clarity Gain | Decision |
   |---------|---------------|--------------|----------|
   | {{name}} | Natural Lang | {{%}} | {{CONVERT/KEEP}} |
   
   ### Priority Issues
   1. **CRITICAL**: {{workflow-breaking gap}}
   2. **HIGH**: {{performance-impacting issue}}
   3. **MEDIUM**: {{clarity improvement}}
   ```

3. **⚠️ CHECKPOINT** - Present findings and await prioritization guidance

### Phase 3: Strategic Refactoring

1. **Structural Optimization**
   Apply proven patterns:
   - Mirror workflow sequence in prompt structure
   - Add Variables section for reusable values
   - Strengthen boundaries with Who You Are/Are NOT
   - Create phase-based workflow with checkpoints
   - Add success criteria for validation

2. **Precision Language Engineering**
   ```markdown
   ## Language Optimization Plan
   
   **Before**: "The agent might try to search for..."
   **After**: "ALWAYS execute search with these parameters..."
   **Impact**: Removes ambiguity, ensures consistent behavior
   
   **Before**: "Handle errors appropriately"
   **After**: "When error X occurs → Execute recovery pattern Y"
   **Impact**: Provides deterministic error handling
   ```

3. **YAML Strategic Conversion**
   For sections exceeding 30% clarity improvement:
   ```yaml
   # Example: Tool Workflow Section
   tool_execution:
     sequence:
       - step: 1
         tool: "{{tool_name}}"
         params:
           required: "{{value}}"
         validate: "{{success_condition}}"
         on_error: "{{recovery_action}}"
   ```

4. **⚠️ CHECKPOINT** - Review proposed changes before implementation

### Phase 4: Enhancement Implementation

1. **Create Enhancement Todos**
   ```
   - [ ] Add Variables section with {{N}} config values
   - [ ] Restructure workflow to match architecture phases
   - [ ] Convert {{section}} to YAML ({{%}} improvement)
   - [ ] Add {{N}} CRITICAL/IMPORTANT emphasis markers
   - [ ] Create success criteria for {{N}} phases
   - [ ] Add cognitive enhancement triggers
   ```

2. **Section-by-Section Updates**
   For each todo item:
   - Present proposed changes with rationale
   - Show before/after comparison
   - Explain expected performance impact
   - Get approval before proceeding

3. **Apply Emphasis Patterns**
   - **CRITICAL**: Workflow-breaking if ignored
   - **IMPORTANT**: Significant performance impact
   - **ALWAYS/NEVER**: Absolute behavioral boundaries
   - **NOTE**: Helpful context and clarifications

### Phase 5: Validation & Finalization

1. **Workflow Simulation**
   ```markdown
   ## Validation Checklist
   
   ### Workflow Coverage
   - [ ] Phase 1: {{workflow_step}} → Prompt section {{X}}
   - [ ] Phase 2: {{workflow_step}} → Prompt section {{Y}}
   - [ ] All decision points have clear guidance
   - [ ] Error scenarios have recovery patterns
   
   ### YAML Conversions
   - [ ] {{Section}}: Clarity improved by {{%}}
   - [ ] All conversions maintain semantic meaning
   - [ ] YAML syntax validated
   ```

2. **Final Implementation**
   - Update the agent's system prompt file
   - Preserve all working elements
   - Include converted YAML blocks
   - Maintain markdown compatibility

3. **Summary Report**
   ```markdown
   ## ✅ Optimization Complete
   
   ### Key Enhancements
   - **Workflow Alignment**: {{N}} phases now directly mapped
   - **YAML Conversions**: {{N}} sections (avg {{%}} clarity gain)
   - **Ambiguity Reduction**: {{N}} vague instructions clarified
   - **Performance Impact**: Expected {{metrics}} improvement
   
   ### Structural Changes
   - Added Variables section with {{N}} reusable values
   - Created {{N}}-phase workflow matching architecture
   - Implemented {{N}} validation checkpoints
   
   The agent is now hyper-optimized for its documented workflow.
   ```

## YAML Conversion Criteria

Only convert to YAML when clarity improvement exceeds 30%:

**High-Impact Conversions** (>50% improvement):
- Tool parameter specifications
- Multi-step sequential instructions
- Configuration values and thresholds
- Output format templates
- Validation checklists

**Medium-Impact Conversions** (30-50% improvement):
- Conditional logic branches
- Example patterns with variations
- Error handling procedures

**Keep as Natural Language** (<30% improvement):
- Philosophy and principles
- Contextual explanations
- Creative problem-solving approaches
- Motivational guidance

## Error Recovery

When encountering:
- **Unclear workflow**: Request specific clarification before proceeding
- **Borderline YAML decision** (25-35%): Present both versions for user choice
- **Undocumented features**: Preserve and flag for user confirmation
- **Conflicting requirements**: Prioritize workflow document over current prompt

## Note

This command focuses on surgical optimization - enhancing specific weaknesses while preserving proven strengths. Every change must demonstrably improve the agent's ability to execute its documented workflow. The 30% YAML conversion threshold ensures format changes deliver meaningful clarity gains, not cosmetic improvements.