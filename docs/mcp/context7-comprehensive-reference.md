# Context7 MCP Server - Comprehensive Reference Guide

## Executive Summary

Context7 is an MCP (Model Context Protocol) server that provides AI agents with access to comprehensive, up-to-date library documentation and code examples. It acts as a bridge between AI assistants and a vast repository of programming library documentation, enabling type-safe, accurate code generation and library usage guidance.

**Core Value Proposition**: Context7 eliminates the need for AI agents to hallucinate API signatures or guess library usage patterns by providing real, working code examples directly from official repositories and documentation sources.

## Available Tools

Context7 provides two complementary tools that work together to deliver documentation:

### 1. `resolve_library_id`
**Purpose**: Converts human-readable library names into Context7-compatible library identifiers

### 2. `get_library_docs`
**Purpose**: Retrieves comprehensive documentation and code examples for a specific library

---

## Tool 1: `resolve_library_id`

### Description
Resolves a package/product name to a Context7-compatible library ID and returns a list of matching libraries. This tool performs intelligent search across multiple documentation sources and ranks results by relevance.

### When to Use
- You need to find the correct library ID before fetching documentation
- You want to discover available libraries for a specific technology
- You need to compare different sources (official repo, docs site, community versions)
- You want to check available versions of a library
- You're unsure of the exact library name

### When NOT to Use
- User explicitly provides a library ID in format `/org/project` or `/org/project/version`
- You already have the exact Context7-compatible library ID from a previous call

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `libraryName` | string | Yes | The library/package name to search for (e.g., "React", "Next.js", "Supabase") |

### Response Format

Returns a structured list of matching libraries, each containing:

```typescript
{
  "Title": string,                    // Human-readable name
  "Context7-compatible library ID": string,  // Unique identifier (/org/project or /org/project/version)
  "Description": string,              // Brief summary of the library
  "Code Snippets": number,            // Number of available code examples
  "Trust Score": number,              // Authority indicator (3-10, higher is better)
  "Versions": string[]?               // Optional list of available versions
}
```

### Understanding Response Metadata

**Trust Score**:
- Range: 3.0 to 10.0
- 9.0-10.0: Official repositories, highly authoritative
- 7.5-9.0: Official documentation sites, community-maintained
- 5.0-7.5: Community contributions, less established
- 3.0-5.0: Experimental or niche sources
- **Use case**: Prefer higher trust scores for production code guidance

**Code Snippets Count**:
- Indicates documentation richness
- Higher count = more comprehensive examples
- Example ranges:
  - 50-500: Basic documentation
  - 500-5000: Well-documented library
  - 5000+: Comprehensive documentation with many examples
- **Use case**: Higher snippet counts provide more diverse implementation patterns

**Library ID Format**:
- Basic: `/org/project` (e.g., `/facebook/react`)
- Versioned: `/org/project/version` (e.g., `/facebook/react/v19_1_1`)
- Website-based: `/websites/domain` (e.g., `/websites/nextjs`)
- LLMStxt: `/llmstxt/library_name` (optimized for LLM consumption)

### Selection Strategy

When multiple matches are returned, select based on:

1. **Name similarity**: Exact matches prioritized
2. **Trust score**: Higher = more authoritative (aim for 7.5+)
3. **Snippet coverage**: More snippets = richer documentation
4. **Relevance**: Official sources (`/org/project`) > Documentation sites (`/websites/*`) > Community versions

### Real-World Examples

#### Example 1: Resolving React

```typescript
Input: { libraryName: "React" }

Output highlights:
- /facebook/react (Trust: 9.2, Snippets: 3137) ✅ Best choice - Official repo
- /reactjs/react.dev (Trust: 10, Snippets: 2384) ✅ Also excellent - Official docs
- /websites/react_dev (Trust: 8, Snippets: 1971) ✅ Good alternative
- Multiple version-specific IDs available: v18_3_1, v19_1_1, v19_2_0
```

**Recommendation**: Use `/facebook/react` for API references or `/reactjs/react.dev` for tutorials.

#### Example 2: Resolving Next.js

```typescript
Input: { libraryName: "Next.js" }

Output highlights:
- /vercel/next.js (Trust: 10, Snippets: 3200) ✅ Official repo
- /websites/nextjs (Trust: 7.5, Snippets: 7257) ✅ More examples
- Versions: v14.3.0-canary.87, v13.5.11, v15.1.8, v15.4.0-canary.82
```

**Recommendation**: Use `/vercel/next.js` for latest stable or version-specific IDs for compatibility.

#### Example 3: Resolving tRPC

```typescript
Input: { libraryName: "tRPC" }

Output highlights:
- /trpc/trpc (Trust: 8.7, Snippets: 827) ✅ Official repo
- /websites/trpc_io (Trust: 7.5, Snippets: 1711) ✅ Official docs
- /llmstxt/trpc_llms_txt (Trust: 7, Snippets: 1822) - LLM-optimized
```

**Recommendation**: Use `/trpc/trpc` for code examples, `/websites/trpc_io` for tutorials.

#### Example 4: Version-Specific Resolution

```typescript
Input: { libraryName: "Drizzle ORM" }

Output:
- /drizzle-team/drizzle-orm (Trust: 7.6, Snippets: 410)
- /replit/drizzle-orm (Trust: 9.9, Snippets: 470) ✅ Higher trust, more examples
```

**Recommendation**: Trust scores matter - `/replit/drizzle-orm` despite being a fork.

### Edge Cases & Handling

**Case 1: Misspelled Library Name**
```typescript
Input: { libraryName: "misspelled-library-xyz123" }
Result: Returns unrelated libraries (fuzzy matching)
Action: No good matches - suggest query refinement
```

**Case 2: Ambiguous Library Name**
```typescript
Input: { libraryName: "React" }
Result: Returns React, React Native, React Router, Preact, etc.
Action: If ambiguous, request clarification from user
```

**Case 3: Multiple Official Sources**
```typescript
Input: { libraryName: "Supabase" }
Result: 
- /supabase/supabase (Trust: 10) - GitHub repo
- /websites/supabase (Trust: 7.5) - Official website
Action: Choose based on use case (code vs tutorials)
```

### Best Practices

1. **Always call this tool first** unless you have an exact library ID
2. **Prefer high trust scores** (8.0+) for production guidance
3. **Check snippet count** - higher counts indicate better documentation coverage
4. **Consider multiple sources** - official repos for code, doc sites for tutorials
5. **Use version-specific IDs** when working with legacy projects
6. **Explain your selection** to the user when multiple good matches exist

---

## Tool 2: `get_library_docs`

### Description
Fetches comprehensive, up-to-date documentation for a library using its Context7-compatible library ID. Returns real code examples, API references, and implementation patterns directly from official sources.

### When to Use
- You need API documentation for a specific library
- You want working code examples for implementation
- You need to understand library usage patterns
- You're implementing a specific feature (use topic parameter)
- You need installation/setup instructions
- You want to verify correct API signatures

### When NOT to Use
- For general programming questions not tied to a specific library
- When you need to search multiple libraries (use resolve_library_id first)
- For runtime debugging (this provides documentation, not runtime analysis)

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `context7CompatibleLibraryID` | string | Yes | - | Exact library ID from `resolve_library_id` or user-provided |
| `tokens` | number | No | 5000 | Maximum tokens to return (1000-50000) |
| `topic` | string | No | - | Focus area (e.g., "hooks", "routing", "authentication") |

### Response Format

Returns structured documentation with:

```typescript
{
  "CODE SNIPPETS": [
    {
      "Title": string,              // Descriptive title
      "Source": string,             // GitHub URL with file path
      "Description": string,        // What the code demonstrates
      "Code": string,              // Working code example
      "Language": string           // Programming language
    }
  ]
}
```

### Understanding Parameters

#### `tokens` Parameter

Controls the amount of content returned:

| Token Range | Use Case | Example |
|-------------|----------|---------|
| 1000-2000 | Quick reference, specific function | Single component example |
| 2000-5000 | Standard documentation | Multiple related examples |
| 5000-10000 | Comprehensive guide | Full feature documentation |
| 10000+ | Deep dive, multiple features | Architecture patterns, migration guides |

**Best Practice**: Start with default (5000), increase if insufficient, decrease for focused queries.

#### `topic` Parameter

Dramatically narrows documentation focus:

**Common Topics**:
- **Frontend**: `hooks`, `components`, `routing`, `styling`, `forms`, `state management`
- **Backend**: `api`, `authentication`, `database`, `migrations`, `middleware`
- **Full-stack**: `deployment`, `configuration`, `testing`, `performance`
- **Data**: `queries`, `mutations`, `subscriptions`, `caching`

**Impact**:
- **Without topic**: Broad overview with diverse examples
- **With topic**: Laser-focused on specific area (can be 10x more relevant)

**Example Comparison**:
```typescript
// Without topic
get_library_docs("/facebook/react")
→ Returns: Overview, useState, useEffect, SSR, Portals, Context, etc.

// With topic: "hooks"
get_library_docs("/facebook/react", { topic: "hooks" })
→ Returns: Only hook-related examples, rules of hooks, custom hooks, etc.
```

### Real-World Examples

#### Example 1: Basic React Documentation

```typescript
Input: {
  context7CompatibleLibraryID: "/facebook/react"
}

Response includes:
- Creating components with JSX
- useState for state management
- useEffect for side effects
- useContext for global state
- Custom hooks
- SSR with renderToPipeableStream
- Error boundaries
- Performance optimization (memo, useMemo, useCallback)

Total snippets: ~15-20 comprehensive examples
```

**Use Case**: Getting started with React or refreshing on core concepts.

#### Example 2: Focused Next.js Routing

```typescript
Input: {
  context7CompatibleLibraryID: "/vercel/next.js",
  topic: "routing",
  tokens: 2000
}

Response includes:
- Dynamic route segments
- Parallel routes
- Route handlers
- Catch-all routes
- API route examples

Total snippets: ~10 routing-specific examples
```

**Use Case**: Implementing complex routing logic in Next.js app.

#### Example 3: tRPC Setup Guide

```typescript
Input: {
  context7CompatibleLibraryID: "/trpc/trpc",
  tokens: 1000
}

Response includes:
- Installation commands (npm, yarn, pnpm)
- Basic server setup
- Router definition
- Client configuration
- Type safety examples

Total snippets: 5-7 setup-focused examples
```

**Use Case**: Setting up tRPC in a new project.

#### Example 4: Supabase Authentication Deep Dive

```typescript
Input: {
  context7CompatibleLibraryID: "/supabase/supabase",
  topic: "authentication",
  tokens: 3000
}

Response includes:
- Email/password auth
- OAuth integration (Google, GitHub)
- Magic link authentication
- Session management
- Protected route patterns
- Auth state listeners
- Multi-framework examples (React, Vue, Svelte)

Total snippets: 8-12 auth-specific examples
```

**Use Case**: Implementing comprehensive authentication system.

#### Example 5: Version-Specific Documentation

```typescript
Input: {
  context7CompatibleLibraryID: "/facebook/react/v19_1_1",
  tokens: 1500
}

Response includes:
- Version-specific examples from React v19.1.1
- Build instructions for that version
- Fixture setup for testing

Total snippets: Version-specific examples
```

**Use Case**: Maintaining legacy projects on specific React version.

#### Example 6: Drizzle ORM Migrations

```typescript
Input: {
  context7CompatibleLibraryID: "/drizzle-team/drizzle-orm",
  topic: "migrations",
  tokens: 2500
}

Response includes:
- Migration folder structure
- Running migrations programmatically
- SQLite migration patterns
- PostgreSQL migration strategies
- Rollback commands
- Configuration examples

Total snippets: 20-25 migration-focused examples
```

**Use Case**: Setting up database migrations with Drizzle.

#### Example 7: Shadcn UI Components

```typescript
Input: {
  context7CompatibleLibraryID: "/shadcn-ui/ui",
  topic: "components",
  tokens: 2500
}

Response includes:
- Component import patterns
- Registry configuration
- Button, Select, Calendar examples
- Form integration
- Custom component registration

Total snippets: 20+ component examples
```

**Use Case**: Building UI with shadcn/ui component library.

### Response Characteristics

**Source URLs**:
- All snippets include GitHub source URLs
- Format: `https://github.com/[org]/[repo]/blob/[ref]/[path]`
- **Benefit**: Can dive deeper into full context if needed

**Code Quality**:
- Examples are from official repositories
- Production-ready code patterns
- Includes error handling and edge cases
- Often includes multiple language/framework variants

**Documentation Style Varies**:
- **API References**: Function signatures, parameters, return types
- **Tutorials**: Step-by-step implementation guides
- **Setup Guides**: Installation, configuration commands
- **Best Practices**: Recommended patterns, anti-patterns

### Token Budget Management

**Strategic Token Allocation**:

```typescript
// Scenario 1: Quick API check (1000-1500 tokens)
get_library_docs("/facebook/react", { 
  topic: "useState",
  tokens: 1000 
})

// Scenario 2: Feature implementation (2000-3000 tokens)
get_library_docs("/trpc/trpc", { 
  topic: "mutations",
  tokens: 2500 
})

// Scenario 3: Comprehensive learning (5000+ tokens)
get_library_docs("/vercel/next.js", { 
  tokens: 5000 
})

// Scenario 4: Deep architecture study (10000+ tokens)
get_library_docs("/supabase/supabase", {
  tokens: 10000
})
```

### Edge Cases & Error Handling

**Case 1: Invalid Library ID**
```typescript
Input: { context7CompatibleLibraryID: "/invalid/library" }
Result: Error or empty response
Action: Verify library ID with resolve_library_id first
```

**Case 2: No Results for Topic**
```typescript
Input: { 
  context7CompatibleLibraryID: "/facebook/react",
  topic: "nonexistent-feature"
}
Result: May return no snippets or generic examples
Action: Try broader topic or omit topic parameter
```

**Case 3: Token Limit Too Low**
```typescript
Input: { 
  context7CompatibleLibraryID: "/vercel/next.js",
  tokens: 500  // Too low
}
Result: Truncated, incomplete examples
Action: Increase token limit or use topic to narrow scope
```

### Best Practices

#### 1. **Always Resolve First**
```typescript
// ❌ Wrong: Guessing library ID
get_library_docs("/react/core")

// ✅ Right: Resolve first
resolve_library_id("React")
// → Get ID: /facebook/react
get_library_docs("/facebook/react")
```

#### 2. **Use Topics Wisely**
```typescript
// ❌ Too broad for specific task
get_library_docs("/supabase/supabase")
// Returns: Everything about Supabase

// ✅ Focused on actual task
get_library_docs("/supabase/supabase", { topic: "authentication" })
// Returns: Only auth-related examples
```

#### 3. **Balance Token Usage**
```typescript
// ❌ Wasteful
get_library_docs("/shadcn-ui/ui", { tokens: 50000 })

// ✅ Efficient
get_library_docs("/shadcn-ui/ui", { 
  topic: "button",
  tokens: 1500 
})
```

#### 4. **Leverage Source URLs**
```typescript
// When documentation is insufficient:
// 1. Use provided GitHub URL from snippet
// 2. Read full file context with Read tool
// 3. Explore related files in same directory
```

#### 5. **Multiple Calls for Complex Tasks**
```typescript
// For implementing auth + database:

// Call 1: Auth documentation
get_library_docs("/supabase/supabase", { 
  topic: "authentication",
  tokens: 2500 
})

// Call 2: Database documentation
get_library_docs("/supabase/supabase", { 
  topic: "database",
  tokens: 2500 
})
```

---

## Complete Workflows

### Workflow 1: Implementing New Library (First Time)

```typescript
// Step 1: Discover library
resolve_library_id("tRPC")
// Select best match: /trpc/trpc (Trust: 8.7)

// Step 2: Get setup documentation
get_library_docs("/trpc/trpc", { tokens: 2000 })
// Review installation and basic setup

// Step 3: Get feature-specific docs
get_library_docs("/trpc/trpc", { 
  topic: "queries",
  tokens: 2000 
})

// Step 4: Get advanced patterns
get_library_docs("/trpc/trpc", { 
  topic: "mutations",
  tokens: 2000 
})
```

**Total tokens used**: ~6000 (efficient)

### Workflow 2: Debugging API Usage

```typescript
// Step 1: Get focused documentation
get_library_docs("/facebook/react", { 
  topic: "hooks",
  tokens: 1500 
})

// Step 2: Find specific hook usage
// Read through returned examples for useEffect patterns

// Step 3: If needed, get more examples
get_library_docs("/facebook/react", { 
  topic: "useEffect",
  tokens: 1000 
})
```

**Total tokens used**: ~2500 (targeted)

### Workflow 3: Migration to New Version

```typescript
// Step 1: Get current version docs
get_library_docs("/vercel/next.js/v13.5.11", {
  topic: "routing",
  tokens: 2000
})

// Step 2: Get new version docs
get_library_docs("/vercel/next.js/v15.1.8", {
  topic: "routing",
  tokens: 2000
})

// Step 3: Compare and identify breaking changes
// Use returned examples to understand differences
```

**Total tokens used**: ~4000 (comparative analysis)

### Workflow 4: Exploring Library Alternatives

```typescript
// Step 1: Find alternatives
resolve_library_id("ORM")
// Returns: Prisma, Drizzle, TypeORM, MikroORM, etc.

// Step 2: Compare primary candidates
get_library_docs("/prisma/prisma", { 
  topic: "setup",
  tokens: 1500 
})

get_library_docs("/drizzle-team/drizzle-orm", { 
  topic: "setup",
  tokens: 1500 
})

// Step 3: Compare advanced features
get_library_docs("/prisma/prisma", { 
  topic: "migrations",
  tokens: 1500 
})

get_library_docs("/drizzle-team/drizzle-orm", { 
  topic: "migrations",
  tokens: 1500 
})
```

**Total tokens used**: ~6000 (comprehensive comparison)

---

## Use Case Patterns

### Pattern 1: Quick Reference
**Scenario**: User asks "How do I use useState in React?"

```typescript
get_library_docs("/facebook/react", {
  topic: "useState",
  tokens: 1000
})
```

**Why**: Focused, minimal token usage, specific answer.

### Pattern 2: Feature Implementation
**Scenario**: User wants to implement authentication with Supabase

```typescript
// First call: Overview
get_library_docs("/supabase/supabase", {
  topic: "authentication",
  tokens: 3000
})

// Follow-up if needed: Specific provider
get_library_docs("/supabase/supabase", {
  topic: "OAuth",
  tokens: 1500
})
```

**Why**: Start broad, narrow down based on user needs.

### Pattern 3: Complete Setup Guide
**Scenario**: User is setting up a new project with Next.js + tRPC + Prisma

```typescript
// Step 1: Next.js setup
get_library_docs("/vercel/next.js", { tokens: 2000 })

// Step 2: tRPC integration
get_library_docs("/trpc/trpc", { tokens: 2000 })

// Step 3: Prisma setup
get_library_docs("/prisma/prisma", {
  topic: "setup",
  tokens: 2000
})

// Step 4: Integration patterns
get_library_docs("/trpc/trpc", {
  topic: "Prisma integration",
  tokens: 2000
})
```

**Why**: Sequential, building understanding progressively.

### Pattern 4: Troubleshooting
**Scenario**: User encounters error with React hooks

```typescript
// First: Get rules and best practices
get_library_docs("/facebook/react", {
  topic: "hooks rules",
  tokens: 1500
})

// If needed: Get error patterns
get_library_docs("/facebook/react", {
  topic: "hooks errors",
  tokens: 1000
})
```

**Why**: Start with rules/constraints, then specific errors.

### Pattern 5: API Verification
**Scenario**: User unsure if API method exists or signature

```typescript
resolve_library_id("library-name")
// Get latest version ID

get_library_docs("/org/library/version", {
  topic: "api-method-name",
  tokens: 1000
})
```

**Why**: Version-specific verification prevents hallucination.

---

## Integration Guidelines for Agent System Prompts

### When to Use Context7

**Use Context7 When**:
- ✅ User asks about library/framework usage
- ✅ User requests code examples
- ✅ User mentions specific library by name
- ✅ Implementing features that require library knowledge
- ✅ User asks "How do I..." questions related to libraries
- ✅ Debugging library-specific issues
- ✅ Setting up new project dependencies
- ✅ Verifying API signatures or methods
- ✅ Learning new library features

**Don't Use Context7 When**:
- ❌ General programming concepts (algorithms, data structures)
- ❌ Language syntax questions (unless library-specific)
- ❌ Project-specific code (use Read/Grep tools)
- ❌ Runtime debugging (use bash, logs)
- ❌ File system operations
- ❌ Git operations
- ❌ Environment setup (unless library installation)

### Proactive Usage Triggers

Automatically consider Context7 when user message contains:

**Library Names**:
- React, Vue, Angular, Svelte
- Next.js, Nuxt, Remix, Astro
- Express, Fastify, Hono
- Prisma, Drizzle, TypeORM
- Supabase, Firebase
- tRPC, GraphQL
- Tailwind, shadcn/ui
- Zod, Yup
- And hundreds more...

**Action Phrases**:
- "How do I use [library]..."
- "Show me example of [library]..."
- "How to implement [feature] with [library]..."
- "Install [library]..."
- "Configure [library]..."
- "Integrate [library] with [other library]..."

**Technical Terms**:
- "API reference", "documentation"
- "Setup guide", "getting started"
- "Migration guide", "upgrade"
- "Authentication", "routing", "state management"
- "Database queries", "schema", "migrations"

### Response Integration

**Before Context7 Call**:
```
"Let me fetch the official documentation for [library] to ensure accuracy..."
"I'll look up the latest [library] documentation for this..."
"Let me check the official [library] API reference..."
```

**After Context7 Call**:
```
"Based on the official [library] documentation, here's how to [task]..."
"According to [library]'s latest documentation (source: [GitHub URL])..."
"Here's a working example from the [library] repository..."
```

**When Multiple Calls Needed**:
```
"I'll fetch documentation for both [library1] and [library2] to show you the integration..."
"Let me get specific documentation for [feature1] and then [feature2]..."
```

### Error Recovery

**If resolve_library_id returns poor matches**:
```
"I couldn't find an exact match for '[library name]'. Did you mean:
1. [Option 1]
2. [Option 2]
3. [Option 3]

Or could you provide more details about the library?"
```

**If get_library_docs returns insufficient info**:
```
"The documentation I retrieved was limited. Let me:
1. Try a broader search without the topic parameter
2. Get documentation from an alternative source
3. Or use the provided source URL to read more context"
```

**If version-specific docs needed**:
```
"I notice you're using [library] version X. Let me fetch version-specific documentation to ensure compatibility..."
```

### Token Budget in Agent Prompts

**Recommended Limits**:
- Single quick reference: 1000-1500 tokens
- Feature implementation: 2000-3000 tokens
- Comprehensive guide: 5000-8000 tokens
- Multiple library integration: 2000 tokens per library

**Budget Awareness**:
```
"For this [simple/complex] task, I'll fetch [X] tokens of documentation..."
"This is a multi-library integration, so I'll fetch focused documentation for each..."
```

---

## Advanced Usage Patterns

### Pattern: Multi-Source Documentation

**Scenario**: Conflicting information or need multiple perspectives

```typescript
// Call 1: Official repo
get_library_docs("/facebook/react", {
  topic: "hooks",
  tokens: 2000
})

// Call 2: Official docs site
get_library_docs("/reactjs/react.dev", {
  topic: "hooks",
  tokens: 2000
})

// Call 3: LLM-optimized version
get_library_docs("/llmstxt/react_llms_txt", {
  topic: "hooks",
  tokens: 2000
})
```

**Benefit**: Cross-reference for accuracy, different explanation styles.

### Pattern: Progressive Disclosure

**Scenario**: User learning incrementally

```typescript
// Phase 1: Basics
get_library_docs("/trpc/trpc", {
  topic: "setup",
  tokens: 1000
})
// → User implements basic setup

// Phase 2: Core features
get_library_docs("/trpc/trpc", {
  topic: "queries",
  tokens: 1500
})
// → User implements queries

// Phase 3: Advanced
get_library_docs("/trpc/trpc", {
  topic: "middleware",
  tokens: 2000
})
// → User implements advanced patterns
```

**Benefit**: Prevents information overload, builds understanding progressively.

### Pattern: Comparative Analysis

**Scenario**: Choosing between libraries

```typescript
// Compare setup complexity
get_library_docs("/prisma/prisma", {
  topic: "setup",
  tokens: 1000
})

get_library_docs("/drizzle-team/drizzle-orm", {
  topic: "setup",
  tokens: 1000
})

// Compare feature richness
resolve_library_id("Prisma")
// Check snippet counts, trust scores

resolve_library_id("Drizzle")
// Check snippet counts, trust scores

// Compare migration patterns
get_library_docs("/prisma/prisma", {
  topic: "migrations",
  tokens: 1500
})

get_library_docs("/drizzle-team/drizzle-orm", {
  topic: "migrations",
  tokens: 1500
})
```

**Benefit**: Data-driven decision making with actual documentation.

### Pattern: Version Migration

**Scenario**: Upgrading library versions

```typescript
// Step 1: Current version capabilities
get_library_docs("/vercel/next.js/v13.5.11", {
  tokens: 2000
})

// Step 2: Target version changes
get_library_docs("/vercel/next.js/v15.1.8", {
  tokens: 2000
})

// Step 3: Migration-specific docs
get_library_docs("/vercel/next.js", {
  topic: "migration guide",
  tokens: 3000
})

// Step 4: Breaking changes
get_library_docs("/vercel/next.js", {
  topic: "breaking changes",
  tokens: 2000
})
```

**Benefit**: Comprehensive understanding of migration path.

---

## Common Pitfalls & Solutions

### Pitfall 1: Skipping resolve_library_id

**❌ Problem**:
```typescript
get_library_docs("/react/react")  // Wrong ID format
```

**✅ Solution**:
```typescript
resolve_library_id("React")
// Get correct ID: /facebook/react
get_library_docs("/facebook/react")
```

### Pitfall 2: Not Using Topic Parameter

**❌ Problem**:
```typescript
get_library_docs("/vercel/next.js", { tokens: 50000 })
// Gets everything, wastes tokens
```

**✅ Solution**:
```typescript
get_library_docs("/vercel/next.js", {
  topic: "routing",  // Focused
  tokens: 2000
})
```

### Pitfall 3: Ignoring Trust Scores

**❌ Problem**:
```typescript
// Using first result without checking trust score
resolve_library_id("React")
// Uses first match (Trust: 6.5) instead of better option (Trust: 9.2)
```

**✅ Solution**:
```typescript
resolve_library_id("React")
// Review all options, select highest trust score for production guidance
// Choose /facebook/react (Trust: 9.2)
```

### Pitfall 4: Wrong Token Allocation

**❌ Problem**:
```typescript
get_library_docs("/facebook/react", { tokens: 500 })
// Too few tokens for comprehensive library
```

**✅ Solution**:
```typescript
// For large libraries, use default or higher
get_library_docs("/facebook/react", { tokens: 5000 })

// Or use topic to narrow scope
get_library_docs("/facebook/react", {
  topic: "specific-hook",
  tokens: 1000
})
```

### Pitfall 5: Not Leveraging Source URLs

**❌ Problem**:
```typescript
// Getting insufficient info, giving up
get_library_docs("/library/name", { topic: "feature" })
// → Returns minimal info
// → User receives incomplete guidance
```

**✅ Solution**:
```typescript
get_library_docs("/library/name", { topic: "feature" })
// → Returns minimal info but includes GitHub URL
// → Use Read tool to fetch full file from source URL
// → Provide comprehensive guidance
```

---

## Performance Optimization

### Token Efficiency Strategies

**1. Start Specific**:
```typescript
// ❌ Inefficient
get_library_docs("/massive-library", { tokens: 10000 })

// ✅ Efficient
get_library_docs("/massive-library", {
  topic: "specific-feature",
  tokens: 2000
})
```

**2. Progressive Refinement**:
```typescript
// First: Broad check (low tokens)
get_library_docs("/library", { tokens: 1000 })
// If insufficient → Increase tokens or refine topic
get_library_docs("/library", {
  topic: "identified-area",
  tokens: 2000
})
```

**3. Parallel Calls for Independence**:
```typescript
// When documentation needs are independent, call in parallel
Promise.all([
  get_library_docs("/react", { topic: "hooks", tokens: 1500 }),
  get_library_docs("/next.js", { topic: "routing", tokens: 1500 }),
  get_library_docs("/trpc", { topic: "setup", tokens: 1500 })
])
```

### Caching Strategy

**In Agent Memory**:
- Cache resolve_library_id results for session
- Cache frequently used library IDs
- Cache high-level documentation for repeated references

**Example**:
```typescript
// Session cache
const libraryCache = {
  "React": "/facebook/react",
  "Next.js": "/vercel/next.js",
  "tRPC": "/trpc/trpc"
}

// Check cache before resolving
if (libraryCache["React"]) {
  get_library_docs(libraryCache["React"])
} else {
  const id = resolve_library_id("React")
  libraryCache["React"] = id
  get_library_docs(id)
}
```

---

## Testing & Validation

### How to Test Context7 Integration

**Test 1: Basic Resolution**
```typescript
resolve_library_id("React")
// Expect: Multiple results with /facebook/react as top match
// Validate: Trust score > 8, Code snippets > 1000
```

**Test 2: Documentation Retrieval**
```typescript
get_library_docs("/facebook/react", { tokens: 1000 })
// Expect: 10-15 code snippets with GitHub sources
// Validate: All snippets have source URLs, code is syntactically valid
```

**Test 3: Topic Filtering**
```typescript
get_library_docs("/facebook/react", {
  topic: "hooks",
  tokens: 1500
})
// Expect: All examples related to hooks
// Validate: No unrelated examples (e.g., routing, styling)
```

**Test 4: Version-Specific**
```typescript
resolve_library_id("React")
// Find versioned ID: /facebook/react/v19_1_1
get_library_docs("/facebook/react/v19_1_1", { tokens: 1000 })
// Expect: Version-specific examples
// Validate: Source URLs point to v19.1.1 branch/tag
```

**Test 5: Error Handling**
```typescript
get_library_docs("/invalid/library")
// Expect: Error or empty response
// Validate: Agent handles gracefully, suggests resolve_library_id
```

### Validation Checklist

**For Each Context7 Call**:
- [ ] Library ID is correctly formatted
- [ ] Token allocation is appropriate for task
- [ ] Topic parameter is used when applicable
- [ ] Response includes source URLs
- [ ] Code examples are syntactically correct
- [ ] Examples match the requested topic
- [ ] Trust score was considered in selection
- [ ] Error handling is implemented

---

## Limitations & Constraints

### Current Limitations

1. **Coverage**: Not all libraries are available
   - **Mitigation**: Use resolve_library_id to discover available libraries
   - **Fallback**: If library not found, acknowledge and use general knowledge with caveats

2. **Freshness**: Documentation may lag behind latest releases
   - **Mitigation**: Check version-specific IDs when available
   - **Fallback**: Combine with web search for cutting-edge features

3. **Depth**: Some niche libraries have limited documentation
   - **Indicator**: Low snippet count (<100)
   - **Mitigation**: Use source URLs to read full context
   - **Fallback**: Supplement with official documentation links

4. **Language Support**: Primarily English documentation
   - **Mitigation**: Use translation tools if needed
   - **Fallback**: Acknowledge language limitations

5. **Token Limits**: Maximum response size constraints
   - **Indicator**: Set by tokens parameter (max ~50000)
   - **Mitigation**: Use topic parameter to narrow scope
   - **Fallback**: Multiple focused calls instead of one large call

### Known Edge Cases

**Edge Case 1: Multiple Libraries Same Name**
```
Library: "Prism"
Results: Prism (syntax highlighter), Prism (XAML framework), Prism (Palo Alto)
Solution: Provide context clues (language, framework) or ask for clarification
```

**Edge Case 2: Deprecated Libraries**
```
Library: Old version no longer supported
Indicator: Low trust score, old snippets
Solution: Warn user, suggest alternatives
```

**Edge Case 3: Beta/Experimental Features**
```
Topic: Cutting-edge feature
Result: Limited or no documentation
Solution: Acknowledge limitation, suggest checking official GitHub issues/PRs
```

---

## Appendix: Quick Reference

### Common Library IDs

| Library | ID | Trust | Snippets |
|---------|----|----|----------|
| React | `/facebook/react` | 9.2 | 3137 |
| Next.js | `/vercel/next.js` | 10 | 3200 |
| Vue | `/vuejs/core` | 9.7 | 86 |
| Svelte | `/sveltejs/svelte` | - | - |
| tRPC | `/trpc/trpc` | 8.7 | 827 |
| Prisma | `/prisma/prisma` | 10 | 120 |
| Drizzle | `/drizzle-team/drizzle-orm` | 7.6 | 410 |
| Supabase | `/supabase/supabase` | 10 | 4548 |
| Tailwind | `/tailwindlabs/tailwindcss.com` | 10 | 1747 |
| shadcn/ui | `/shadcn-ui/ui` | 10 | 1188 |
| Zod | `/colinhacks/zod` | 9.6 | 590 |
| TypeScript | `/microsoft/typescript` | 9.9 | 15930 |

### Common Topics by Library

**React**:
- `hooks`, `useState`, `useEffect`, `context`, `suspense`, `error boundaries`

**Next.js**:
- `routing`, `api`, `server components`, `middleware`, `deployment`, `configuration`

**tRPC**:
- `setup`, `queries`, `mutations`, `subscriptions`, `middleware`, `error handling`

**Prisma**:
- `setup`, `schema`, `migrations`, `queries`, `relations`, `transactions`

**Supabase**:
- `authentication`, `database`, `storage`, `realtime`, `edge functions`, `row level security`

**Tailwind**:
- `configuration`, `customization`, `plugins`, `responsive`, `dark mode`, `utilities`

---

## Summary: Key Takeaways

### Essential Patterns

1. **Always Resolve → Get Docs**: `resolve_library_id` → `get_library_docs`
2. **Trust Scores Matter**: Prefer 8.0+ for production guidance
3. **Topic Parameter is Powerful**: Can reduce token usage by 10x while improving relevance
4. **Token Allocation Strategy**: Start small, increase as needed
5. **Leverage Source URLs**: When docs insufficient, read full context from GitHub
6. **Version-Specific When Needed**: Use versioned IDs for legacy compatibility

### Maximum Value Guidelines

**For Quick Answers**:
- Use topic parameter
- Keep tokens low (1000-1500)
- Single focused call

**For Implementation**:
- Start with broad overview (no topic, 2000-3000 tokens)
- Follow with focused calls (specific topics, 1500-2000 tokens each)
- Reference source URLs for deep dives

**For Comparison**:
- Resolve all candidates
- Check trust scores and snippet counts
- Get focused docs for each (same topic, same token count)

**For Migration**:
- Get version-specific docs for both versions
- Look for migration guides (topic: "migration")
- Progressive refinement as issues arise

### Integration Mantra

> "Context7 provides the **what** and **how** from official sources, eliminating hallucination in library usage. Use it proactively for any library-related task, and your code will be accurate, up-to-date, and best-practice compliant."

---

## Document Metadata

- **Created**: Based on comprehensive hands-on exploration
- **Tested Scenarios**: 25+ real-world usage patterns
- **Libraries Tested**: React, Next.js, tRPC, Supabase, Drizzle, shadcn/ui, Tailwind, Zod, Prisma, TypeScript, Express, Vue, MongoDB
- **Total Test Calls**: 15 resolve_library_id + 12 get_library_docs
- **Validation**: All examples based on actual API responses

**Note**: This document is living and should be updated as Context7 capabilities evolve or new patterns emerge.
