# shadcn MCP Server - Comprehensive Reference Guide

## Overview

The shadcn MCP (Model Context Protocol) server provides programmatic access to the shadcn/ui component registry, enabling AI agents and developers to discover, explore, and integrate UI components seamlessly into their projects.

**Last Updated:** 2025-10-11  
**Version:** Based on hands-on exploration and testing

---

## Table of Contents

1. [What is the shadcn MCP Server?](#what-is-the-shadcn-mcp-server)
2. [Available Tools](#available-tools)
3. [Tool Reference](#tool-reference)
4. [Common Workflows](#common-workflows)
5. [Best Practices](#best-practices)
6. [Error Handling](#error-handling)
7. [Integration Patterns](#integration-patterns)

---

## What is the shadcn MCP Server?

The shadcn MCP server is a specialized MCP server that provides 7 core tools for:

- **Discovery**: Finding available UI components, blocks, themes, and utilities
- **Exploration**: Viewing component details, dependencies, and structure
- **Learning**: Accessing complete, production-ready code examples
- **Installation**: Getting exact CLI commands for adding components
- **Quality Assurance**: Post-installation verification checklist

### Key Features

- **442+ Components** across multiple categories (UI, blocks, examples, themes, hooks, libs)
- **Complete Code Examples** with full implementations
- **Fuzzy Search** for flexible component discovery
- **Pagination Support** for large result sets
- **Multiple Component Types**: UI components, blocks, examples, themes, hooks, libraries, internal components

---

## Available Tools

| Tool Name | Purpose | Use When |
|-----------|---------|----------|
| `shadcn_get_project_registries` | Get configured registries | Starting a new session, verifying project setup |
| `shadcn_list_items_in_registries` | List all available items | Browsing catalog, discovering what's available |
| `shadcn_search_items_in_registries` | Search for components | Looking for specific components |
| `shadcn_view_items_in_registries` | View component details | Need file count, dependencies, type info |
| `shadcn_get_item_examples_from_registries` | Get complete code examples | Need implementation examples, demo code |
| `shadcn_get_add_command_for_items` | Get installation CLI command | Ready to install components |
| `shadcn_get_audit_checklist` | Get post-install checklist | After adding/generating components |

---

## Tool Reference

### 1. shadcn_get_project_registries

**Purpose**: Retrieve the list of configured registries in the current project.

**Parameters**: None

**Returns**: Human-readable text listing configured registries with usage examples.

**Example Output**:
```
The following registries are configured in the current project:

- @shadcn

You can view the items in a registry by running:
`pnpm dlx shadcn@latest view @name-of-registry`
```

**When to Use**:
- At the start of a component discovery session
- To verify project configuration
- To understand which registries are available

**Notes**:
- Requires a `components.json` file in the project
- Will error if no components.json exists

---

### 2. shadcn_list_items_in_registries

**Purpose**: List all available items from specified registries with optional pagination.

**Parameters**:
- `registries` (required): Array of registry names (e.g., `["@shadcn"]`)
- `limit` (optional): Maximum number of items to return
- `offset` (optional): Number of items to skip for pagination

**Returns**: Formatted list of items with names, types, and add commands.

**Example Usage**:
```javascript
// List first 10 items
shadcn_list_items_in_registries({
  registries: ["@shadcn"],
  limit: 10
})

// List items 11-20
shadcn_list_items_in_registries({
  registries: ["@shadcn"],
  limit: 10,
  offset: 10
})
```

**Example Output**:
```
Found 442 items in registries @shadcn:

Showing items 1-10 of 442:

- accordion (registry:ui) [@shadcn]
  Add command: `[object Promise]`
  
- alert (registry:ui) [@shadcn]
  Add command: `[object Promise]`
  
...

More items available. Use offset: 10 to see the next page.
```

**Component Types Discovered**:
- `registry:ui` - UI components (button, card, dialog, etc.)
- `registry:block` - Complete blocks (dashboards, sidebars, login pages)
- `registry:example` - Demo examples for components
- `registry:theme` - Theme configurations
- `registry:hook` - React hooks
- `registry:lib` - Utility libraries
- `registry:style` - Style configurations
- `registry:internal` - Internal components

**When to Use**:
- Browsing the full catalog
- Discovery phase
- Need to see all available components
- Building component inventories

**Best Practices**:
- Use pagination (limit/offset) for better performance
- Default returns all 442+ items if no limit specified

---

### 3. shadcn_search_items_in_registries

**Purpose**: Search for components using fuzzy matching across names and descriptions.

**Parameters**:
- `registries` (required): Array of registry names
- `query` (required): Search query string
- `limit` (optional): Maximum results to return
- `offset` (optional): Pagination offset

**Returns**: Filtered list of matching items.

**Example Usage**:
```javascript
// Search for button components
shadcn_search_items_in_registries({
  registries: ["@shadcn"],
  query: "button"
})

// Search with fuzzy matching
shadcn_search_items_in_registries({
  registries: ["@shadcn"],
  query: "btn"  // Finds button-related items
})

// Multi-term search
shadcn_search_items_in_registries({
  registries: ["@shadcn"],
  query: "calendar date"
})

// Search with pagination
shadcn_search_items_in_registries({
  registries: ["@shadcn"],
  query: "form",
  limit: 5
})
```

**Search Capabilities**:
- **Exact matches**: "button" finds `button` component
- **Partial matches**: "btn" finds button-related items
- **Fuzzy matching**: Abbreviated queries match expanded names
- **Multi-term**: "calendar date" searches across both terms
- **Description matching**: Searches component descriptions too

**Search Results Analysis**:
- `"button"` → 34 matches (exact + related)
- `"btn"` → 48 matches (fuzzy matching wider)
- `"calendar date"` → 13 matches (multi-term)
- `"form"` → 44 matches
- `"login"` → 10 matches (blocks + related)

**When to Use**:
- Looking for specific components
- Exploratory search
- Don't know exact component name
- Finding related components

**Best Practices**:
- Start with simple, descriptive terms
- Use abbreviations if unsure of exact names
- Try both single and multi-word queries
- Combine with pagination for large result sets

---

### 4. shadcn_view_items_in_registries

**Purpose**: View detailed information about specific registry items.

**Parameters**:
- `items` (required): Array of item names with registry prefix (e.g., `["@shadcn/button"]`)

**Returns**: Detailed information including type, file count, and dependencies.

**Example Usage**:
```javascript
// View single item
shadcn_view_items_in_registries({
  items: ["@shadcn/button"]
})

// View multiple items
shadcn_view_items_in_registries({
  items: ["@shadcn/button", "@shadcn/card"]
})
```

**Example Output**:
```
Item Details:

## button
**Type:** registry:ui
**Files:** 1 file(s)
**Dependencies:** @radix-ui/react-slot

---

## card
**Type:** registry:ui
**Files:** 1 file(s)
```

**Information Provided**:
- Item name
- Type (ui, block, example, etc.)
- Number of files
- Dependencies (when applicable)
- Description (for blocks)

**Type-Specific Patterns**:
- **UI Components**: Usually 1 file, may have dependencies
- **Blocks**: Multiple files (2+), includes descriptions
- **Examples**: 1 file, demo implementations
- **Hooks**: 1 file, utilities

**When to Use**:
- Need dependency information before installing
- Want to know file structure
- Planning component integration
- Understanding component complexity

**Best Practices**:
- Check dependencies before installation
- View multiple related components together
- Use before `get_add_command` to understand what you're installing

---

### 5. shadcn_get_item_examples_from_registries

**Purpose**: Get complete, production-ready code examples with full implementation details.

**Parameters**:
- `registries` (required): Array of registry names
- `query` (required): Search query for examples

**Returns**: Complete code examples with file paths, imports, and full implementations.

**Example Usage**:
```javascript
// Search with hyphenated pattern (most reliable)
shadcn_get_item_examples_from_registries({
  registries: ["@shadcn"],
  query: "button-demo"
})

// Search with space (may work)
shadcn_get_item_examples_from_registries({
  registries: ["@shadcn"],
  query: "accordion demo"
})

// Search for component examples
shadcn_get_item_examples_from_registries({
  registries: ["@shadcn"],
  query: "card"
})

// Search for blocks
shadcn_get_item_examples_from_registries({
  registries: ["@shadcn"],
  query: "login"
})
```

**Search Patterns**:
- `{component}-demo` - Most reliable (e.g., "button-demo")
- `{component} demo` - Works with space
- `{component}` - Returns ALL related examples (can be 60+)
- Block names - Returns complete block implementations

**Example Output Structure**:
```markdown
# Usage Examples

Found 2 examples matching "button-demo":

## Example: button-demo
### Code (registry/new-york-v4/examples/button-demo.tsx):

```tsx
import { ArrowUpIcon } from "lucide-react"
import { Button } from "@/registry/new-york-v4/ui/button"

export default function ButtonDemo() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline">Button</Button>
      <Button variant="outline" size="icon">
        <ArrowUpIcon />
      </Button>
    </div>
  )
}
```

---

## Example: button-group-demo
### Code (registry/new-york-v4/examples/button-group-demo.tsx):
[Full component code...]
```

**What You Get**:
- **Complete, runnable code** - Copy-paste ready
- **All imports** - No guessing dependencies
- **File paths** - Know where code belongs
- **Multiple examples** - Different use cases
- **Complex implementations** - Multi-file components (like dashboard-01)

**Complex Block Examples**:
When searching for blocks (e.g., "dashboard-01", "login-01"), you get:
- Main page component
- Sub-components (sidebars, headers, forms)
- Data files (JSON fixtures)
- Complete file structure

**When to Use**:
- Need to see how to use a component
- Want implementation examples
- Learning component patterns
- Building similar functionality
- Need starter code

**Best Practices**:
- Use hyphenated patterns for specific demos
- Search component names for ALL examples
- Review multiple examples for different patterns
- Check for block implementations for complex features

**Warning**:
- Searching common terms like "card" returns 60+ examples
- Be specific to reduce results
- Results may be truncated for very common searches

---

### 6. shadcn_get_add_command_for_items

**Purpose**: Get the exact CLI command needed to install components.

**Parameters**:
- `items` (required): Array of item names with registry prefix

**Returns**: Copy-paste ready CLI command.

**Example Usage**:
```javascript
// Single component
shadcn_get_add_command_for_items({
  items: ["@shadcn/button"]
})
// Returns: pnpm dlx shadcn@latest add @shadcn/button

// Multiple components
shadcn_get_add_command_for_items({
  items: ["@shadcn/button", "@shadcn/card", "@shadcn/input"]
})
// Returns: pnpm dlx shadcn@latest add @shadcn/button @shadcn/card @shadcn/input

// Complex blocks
shadcn_get_add_command_for_items({
  items: ["@shadcn/dashboard-01"]
})
// Returns: pnpm dlx shadcn@latest add @shadcn/dashboard-01
```

**Command Format**:
```bash
pnpm dlx shadcn@latest add <item1> [item2] [item3] ...
```

**When to Use**:
- Ready to install components
- Want exact installation command
- Need to document installation steps
- Automating component setup

**Best Practices**:
- Install related components together
- Check dependencies first with `view_items`
- Run in project directory
- Verify components exist before requesting command

---

### 7. shadcn_get_audit_checklist

**Purpose**: Get a post-installation verification checklist.

**Parameters**: None

**Returns**: Markdown checklist of common issues to check.

**Example Output**:
```markdown
## Component Audit Checklist

After adding or generating components, check the following common issues:

- [ ] Ensure imports are correct i.e named vs default imports
- [ ] If using next/image, ensure images.remotePatterns next.config.js is configured correctly.
- [ ] Ensure all dependencies are installed.
- [ ] Check for linting errors or warnings
- [ ] Check for TypeScript errors
- [ ] Use the Playwright MCP if available.
```

**When to Use**:
- After installing components
- After generating custom components
- Quality assurance phase
- Before committing changes
- Debugging component issues

**Checklist Items Explained**:

1. **Imports Verification**
   - Named vs default imports are critical
   - Mismatched imports cause runtime errors
   - Check both component imports and dependencies

2. **Next.js Image Configuration**
   - Required if components use `next/image`
   - Configure `images.remotePatterns` in `next.config.js`
   - Missing config blocks image loading

3. **Dependency Installation**
   - Components may require additional packages
   - Run `npm install` or `pnpm install`
   - Check `package.json` for new dependencies

4. **Linting Checks**
   - Run project linter
   - Fix warnings before committing
   - Ensures code quality

5. **TypeScript Verification**
   - Run `tsc --noEmit` or `npm run typecheck`
   - Fix type errors
   - Ensures type safety

6. **Playwright Testing**
   - Use Playwright MCP if available
   - Test component rendering
   - Verify interactions work

**Best Practices**:
- Run checklist after every component addition
- Automate checks in CI/CD pipeline
- Keep checklist in project documentation
- Add project-specific checks as needed

---

## Common Workflows

### Workflow 1: Discovering and Installing a Component

```javascript
// 1. Check available registries
shadcn_get_project_registries()

// 2. Search for component
shadcn_search_items_in_registries({
  registries: ["@shadcn"],
  query: "button"
})

// 3. View details
shadcn_view_items_in_registries({
  items: ["@shadcn/button"]
})

// 4. Get examples
shadcn_get_item_examples_from_registries({
  registries: ["@shadcn"],
  query: "button-demo"
})

// 5. Get install command
shadcn_get_add_command_for_items({
  items: ["@shadcn/button"]
})

// 6. After installation, run checklist
shadcn_get_audit_checklist()
```

### Workflow 2: Exploring Component Categories

```javascript
// 1. List all items
shadcn_list_items_in_registries({
  registries: ["@shadcn"],
  limit: 50
})

// 2. Search by category
shadcn_search_items_in_registries({
  registries: ["@shadcn"],
  query: "form"
})

// 3. View multiple related components
shadcn_view_items_in_registries({
  items: ["@shadcn/form", "@shadcn/input", "@shadcn/textarea"]
})
```

### Workflow 3: Finding and Using Blocks

```javascript
// 1. Search for blocks
shadcn_search_items_in_registries({
  registries: ["@shadcn"],
  query: "login"
})

// 2. Get complete implementation
shadcn_get_item_examples_from_registries({
  registries: ["@shadcn"],
  query: "login-01"
})

// 3. Install block
shadcn_get_add_command_for_items({
  items: ["@shadcn/login-01"]
})
```

### Workflow 4: Building a Form

```javascript
// 1. Search for form-related components
shadcn_search_items_in_registries({
  registries: ["@shadcn"],
  query: "form"
})

// 2. Get form examples
shadcn_get_item_examples_from_registries({
  registries: ["@shadcn"],
  query: "form-tanstack-demo"
})

// 3. Install all needed components
shadcn_get_add_command_for_items({
  items: ["@shadcn/form", "@shadcn/input", "@shadcn/button", "@shadcn/label"]
})
```

---

## Best Practices

### Discovery Phase

1. **Start Broad, Then Narrow**
   - Begin with `list_items` to see what's available
   - Use `search_items` to filter
   - Use `view_items` for details

2. **Use Descriptive Search Terms**
   - Simple terms work best: "button", "form", "calendar"
   - Try abbreviations: "btn", "dlg" (dialog)
   - Use multi-word for specific needs: "date picker"

3. **Leverage Fuzzy Search**
   - Don't worry about exact names
   - Search returns relevant matches even with partial terms
   - Experiment with different queries

### Implementation Phase

1. **Always Check Examples First**
   - Examples show best practices
   - Learn proper usage patterns
   - See real implementations

2. **Review Dependencies**
   - Use `view_items` before installing
   - Check for peer dependencies
   - Plan dependency installation

3. **Install Related Components Together**
   - Batch install dependent components
   - Reduces CLI invocations
   - Ensures compatibility

### Quality Assurance

1. **Run the Audit Checklist**
   - After every installation
   - Before committing changes
   - When debugging issues

2. **Test Thoroughly**
   - Use Playwright if available
   - Test all component variants
   - Verify responsive behavior

3. **Document Custom Modifications**
   - Note any changes from defaults
   - Track customizations
   - Share patterns with team

---

## Error Handling

### Common Errors and Solutions

#### 1. NOT_FOUND Error

**Error Message**:
```
Error (NOT_FOUND): The item at https://ui.shadcn.com/r/styles/new-york-v4/nonexistent-component.json was not found. It may not exist at the registry.
```

**Causes**:
- Typo in component name
- Component doesn't exist
- Wrong registry specified

**Solutions**:
- Verify component name with `search_items`
- Check spelling
- Use `list_items` to see available components

#### 2. No Search Results

**Error Message**:
```
No items found matching "xyz123notfound" in registries @shadcn, Try searching with a different query or registry.
```

**Causes**:
- Query too specific
- Misspelled term
- Component in different registry

**Solutions**:
- Broaden search terms
- Try alternative names
- Check with `list_items`

#### 3. No Examples Found

**Error Message**:
```
No examples found for query "totally-nonexistent-example".

Try searching with patterns like:
- "accordion-demo" for accordion examples
- "button demo" or "button example"
```

**Causes**:
- Wrong example pattern
- Example doesn't exist
- Incorrect naming convention

**Solutions**:
- Use suggested patterns
- Try `{component}-demo` format
- Search component name directly
- Use `search_items` first

#### 4. Missing components.json

**Error**: Tool fails to execute

**Causes**:
- No components.json in project
- Not in project root directory

**Solutions**:
- Initialize shadcn: `pnpm dlx shadcn@latest init`
- Run from project root
- Verify project setup

---

## Integration Patterns

### Pattern 1: AI Agent Component Selection

```javascript
async function selectComponent(userRequest) {
  // 1. Search based on user request
  const searchResults = await shadcn_search_items_in_registries({
    registries: ["@shadcn"],
    query: extractKeywords(userRequest)
  })
  
  // 2. Get details for top matches
  const details = await shadcn_view_items_in_registries({
    items: topMatches(searchResults)
  })
  
  // 3. Present options to user
  presentOptions(details)
  
  // 4. Get examples for selected component
  const examples = await shadcn_get_item_examples_from_registries({
    registries: ["@shadcn"],
    query: selectedComponent + "-demo"
  })
  
  // 5. Install
  const command = await shadcn_get_add_command_for_items({
    items: [selectedComponent]
  })
  
  return { examples, command }
}
```

### Pattern 2: Automated Component Audit

```javascript
async function auditInstalledComponents() {
  // Get checklist
  const checklist = await shadcn_get_audit_checklist()
  
  // Run automated checks
  const results = {
    imports: await checkImports(),
    dependencies: await checkDependencies(),
    typescript: await runTypeCheck(),
    linting: await runLinter()
  }
  
  return {
    checklist,
    results,
    passed: allChecksPassed(results)
  }
}
```

### Pattern 3: Component Discovery Assistant

```javascript
async function discoverComponents(category) {
  // List all components
  const allComponents = await shadcn_list_items_in_registries({
    registries: ["@shadcn"]
  })
  
  // Filter by type
  const filtered = filterByType(allComponents, category)
  
  // Get examples for each
  const withExamples = await Promise.all(
    filtered.map(async (component) => {
      const examples = await shadcn_get_item_examples_from_registries({
        registries: ["@shadcn"],
        query: component.name
      })
      return { ...component, examples }
    })
  )
  
  return withExamples
}
```

---

## System Prompt Guidelines

### When to Use shadcn MCP in Prompts

Include shadcn MCP tools when:

1. **Building UI Components**
   - User requests specific components
   - Need to explore available options
   - Implementing forms, dialogs, buttons, etc.

2. **Learning Implementations**
   - User asks "how to" implement something
   - Need example code
   - Want to see best practices

3. **Project Setup**
   - New project initialization
   - Adding component library
   - Setting up design system

4. **Component Discovery**
   - User unsure what components exist
   - Exploring options
   - Finding alternatives

### How to Integrate in Prompts

```markdown
You have access to the shadcn MCP server which provides access to 442+ production-ready UI components, blocks, and examples.

When the user:
- Asks for UI components → Use `search_items` to find options
- Needs implementation examples → Use `get_item_examples` for complete code
- Wants to install components → Use `get_add_command` for CLI commands
- Needs quality checks → Use `get_audit_checklist` after installation

Available component types:
- UI Components: buttons, forms, dialogs, cards, etc.
- Blocks: complete features like dashboards, login pages, sidebars
- Examples: demo implementations showing best practices
- Themes: color schemes and styling
- Hooks: reusable React hooks
- Utils: helper functions and utilities

Workflow:
1. Search or list to discover components
2. View details to understand structure
3. Get examples to see implementation
4. Get add command for installation
5. Use audit checklist for verification
```

### Prompt Templates

**For Component Selection**:
```
User needs: {requirement}
1. Search for components matching "{keywords}"
2. Present top 3-5 options with descriptions
3. Get examples for user's selection
4. Provide installation command
```

**For Learning/Examples**:
```
User wants to learn: {topic}
1. Search for related components
2. Get multiple examples showing different patterns
3. Explain each example's approach
4. Suggest best option for user's use case
```

**For Installation**:
```
User wants to install: {components}
1. Verify components exist with search
2. Check dependencies with view
3. Provide add command
4. Share audit checklist for post-install verification
```

---

## Advanced Tips

### Tip 1: Batch Operations

Install multiple related components at once:
```javascript
shadcn_get_add_command_for_items({
  items: [
    "@shadcn/form",
    "@shadcn/input",
    "@shadcn/label",
    "@shadcn/button",
    "@shadcn/textarea"
  ]
})
```

### Tip 2: Example-Driven Development

Start with examples, then customize:
```javascript
// 1. Get example code
const examples = await shadcn_get_item_examples_from_registries({
  registries: ["@shadcn"],
  query: "form-tanstack-complex"
})

// 2. Install required components
// 3. Copy example code
// 4. Customize for your needs
```

### Tip 3: Registry Exploration

Systematically explore by type:
```javascript
// Explore UI components
shadcn_search_items_in_registries({
  registries: ["@shadcn"],
  query: "registry:ui"
})

// Explore blocks
shadcn_search_items_in_registries({
  registries: ["@shadcn"],
  query: "registry:block"
})
```

### Tip 4: Component Comparison

Compare similar components:
```javascript
// Get examples for comparison
const examples = await shadcn_get_item_examples_from_registries({
  registries: ["@shadcn"],
  query: "button"  // Returns 34 examples
})

// Review different patterns, choose best fit
```

---

## Limitations and Considerations

### Known Limitations

1. **Search Results Can Be Large**
   - Common terms return many results (e.g., "card" = 63 examples)
   - Be specific in queries
   - Use pagination for manageable sets

2. **Registry Dependency**
   - Requires components.json in project
   - Only works with configured registries
   - Must be in project root directory

3. **CLI Command Format**
   - Commands use `pnpm dlx` by default
   - Adapt for npm/yarn if needed
   - Commands must be run in terminal

4. **Example Code Context**
   - Examples show ideal implementations
   - May need adaptation for your project
   - Check compatibility with your setup

### Best Practices for Scale

1. **Cache Results**
   - List/search results rarely change
   - Cache for session duration
   - Refresh periodically

2. **Optimize Queries**
   - Use specific terms
   - Leverage pagination
   - Batch related operations

3. **Error Handling**
   - Always handle NOT_FOUND errors
   - Provide fallback options
   - Guide users to alternatives

---

## Conclusion

The shadcn MCP server is a powerful tool for:
- **Discovering** production-ready UI components
- **Learning** through complete code examples  
- **Installing** components with exact CLI commands
- **Ensuring Quality** with automated checklists

**Key Takeaways**:
- 7 tools covering full component lifecycle
- 442+ components across 8 types
- Complete, copy-paste ready examples
- Fuzzy search for flexible discovery
- Error handling with helpful suggestions

**Use When**:
- Building UI with React/Next.js
- Need pre-built components
- Learning implementation patterns
- Setting up design systems
- Exploring component options

This MCP server dramatically accelerates UI development by providing instant access to a comprehensive component library with battle-tested implementations.

---

## Quick Reference

### Tool Selection Matrix

| Need | Tool | Example |
|------|------|---------|
| See all components | `list_items` | Browse catalog |
| Find specific component | `search_items` | "button", "form" |
| Check dependencies | `view_items` | Before installing |
| See implementation | `get_item_examples` | Learn patterns |
| Install component | `get_add_command` | Get CLI command |
| Verify installation | `get_audit_checklist` | QA checks |
| Check setup | `get_project_registries` | Verify config |

### Search Pattern Cheatsheet

| Pattern | Query | Results |
|---------|-------|---------|
| Exact name | "button" | 34 matches |
| Abbreviation | "btn" | 48 matches (fuzzy) |
| Multi-term | "calendar date" | 13 matches |
| Demo pattern | "button-demo" | Specific demos |
| Component type | Component name | All related examples |
| Block search | "login", "dashboard" | Complete blocks |

---

**Document Version**: 1.0  
**Last Tested**: 2025-10-11  
**Based On**: Comprehensive hands-on exploration and testing

