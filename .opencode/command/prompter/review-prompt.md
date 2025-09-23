---
description: Interactive template compliance review for agent/subagent/command prompts - systematic section-by-section updates with user approval
agent: prompter
---

## Variables

### Dynamic Variables
TARGET_PATH: $ARGUMENTS

## Instructions

Perform an interactive, section-by-section template compliance review of the prompt file at `[[TARGET_PATH]]`. 

**CRITICAL**: Work incrementally through **todowrite** and **todoread** tools - NEVER bulk process. Discuss each section with the user before implementing changes. Ensure perfect alignment with the appropriate template (primary agent, subagent, or command) while preserving any sections marked as IMMUTABLE.

The file path provided may be:
- Full path: `.opencode/agent/architect.md`
- Partial path: `agent/architect`
- Just a name: `architect`

Determine the correct file location and verify it exists before proceeding.

## Workflow

### Phase 1: File Discovery & Assessment

1. **Locate Target File**
   - Parse [[TARGET_PATH]] to determine actual file location
   - Check common patterns: `.opencode/agent/`, `.opencode/subagent/`, `.opencode/command/`
   - Verify file exists with read tool
   
2. **Determine Artifact Type**
   - Check frontmatter `mode` field if present:
     - `mode: primary` → Primary Agent template
     - `mode: subagent` → Subagent template
     - No mode field → Command template (commands don't have mode)
   - Identify which template to use for compliance checking
   
3. **Create Compliance Todo List**
   - Use **todowrite** to create comprehensive section list
   - Include all required template sections
   - Mark any missing sections as "to add"
   - Mark any extra sections as "to review/remove"
   
4. **Present Initial Assessment**
   - Show current structure vs. template requirements
   - Highlight IMMUTABLE sections if any
   - Get user confirmation to proceed

### Phase 2: Interactive Section-by-Section Review

For each todo item:

1. **Mark In Progress** with todowrite
2. **Analyze Current vs. Required**
   - Compare against template requirements
   - Identify specific improvements needed
   
3. **Present Proposed Changes**
   - Show current content
   - Explain what's missing or non-compliant
   - Present proposed update with rationale
   - Highlight emphasis keyword choices
   
4. **Get User Approval**
   - "Should we proceed with this update?"
   - Accept user modifications
   - Handle IMMUTABLE section preservation
   
5. **Implement Approved Changes**
   - Apply the approved edits
   - Mark todo complete
   - Move to next section

### Phase 3: Final Compliance Verification

1. **Check Todo Completion** with todoread
   - Ensure all items marked complete
   - No pending or in_progress items
   
2. **Present Summary**
   - List all sections updated
   - Highlight key improvements
   - Confirm template compliance achieved
   
3. **Final User Confirmation**
   - "The prompt is now fully compliant with the [[artifact_type]] template"
   - Any final adjustments needed?

## Special Considerations

- For primary agents: Ensure all required sections present, skip Orchestration Patterns if agent doesn't spawn subagents
- For subagents: Focus on specialist clarity and searchable descriptions
- For commands: Keep minimal, include only needed sections
- Always preserve embedded templates and reference materials exactly as they are
- Use emphasis keywords (CRITICAL, IMPORTANT, NEVER, ALWAYS) strategically based on observed issues