# Exa MCP Server: Comprehensive Reference Guide

**Based on Hands-on Testing and Exploration**  
**Date:** October 11, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture & Core Concepts](#architecture--core-concepts)
3. [Tool-by-Tool Deep Dive](#tool-by-tool-deep-dive)
4. [Response Structures](#response-structures)
5. [Cost Analysis](#cost-analysis)
6. [Performance Characteristics](#performance-characteristics)
7. [Use Case Patterns](#use-case-patterns)
8. [Decision Matrix: Which Tool to Use](#decision-matrix-which-tool-to-use)
9. [Best Practices](#best-practices)
10. [Limitations & Gotchas](#limitations--gotchas)
11. [Integration Patterns](#integration-patterns)

---

## Overview

The Exa MCP (Model Context Protocol) Server provides AI-powered web search, research, and code discovery capabilities through seven specialized tools. Unlike traditional keyword-based search, Exa uses **neural/semantic search** to understand context and intent, delivering highly relevant results with full content extraction.

### What Makes Exa Different

1. **Full Content Extraction**: Returns complete text content, not just snippets
2. **Semantic Understanding**: Neural search understands meaning, not just keywords
3. **Structured Metadata**: Provides authors, publish dates, costs, and timing
4. **Code-Specialized Search**: Dedicated tool for finding relevant code examples
5. **Deep Research Agent**: Autonomous AI that performs comprehensive research

### The Seven Tools

| Tool | Purpose | Speed | Cost Range |
|------|---------|-------|------------|
| `exa_web_search_exa` | General web search | 4-5s | $0.008-0.012 |
| `exa_company_research_exa` | Business intelligence | 4-5s | $0.008-0.010 |
| `exa_crawling_exa` | URL content extraction | 13-22ms | $0.001 |
| `exa_linkedin_search_exa` | LinkedIn content search | 0.5-2s | $0.008-0.010 |
| `exa_deep_researcher_start` | Initiate deep research | Instant | Free |
| `exa_deep_researcher_check` | Poll research status | 5s+ | Variable |
| `exa_get_code_context_exa` | Find code examples | 2-3s | Variable |

---

## Architecture & Core Concepts

### Neural Search

All Exa search tools use `resolvedSearchType: "neural"` - a semantic search that:
- Understands query intent, not just keyword matching
- Returns contextually relevant results
- Ranks by semantic similarity (scored 0-1)
- Handles time-sensitive queries automatically

### Request/Response Pattern

Every tool returns:
```json
{
  "requestId": "unique-identifier",
  "resolvedSearchType": "neural",
  "results": [...],
  "searchTime": 4708.7,
  "costDollars": {
    "total": 0.008,
    "search": { "neural": 0.005 },
    "contents": { "text": 0.003 }
  }
}
```

### Auto-Enhancement

Exa automatically enhances queries:
- **Company Research**: "Anthropic" → "Anthropic company business corporation information news financial"
- **Time-Sensitive**: Adds `autoDate` field for queries mentioning dates/timeframes
- **Context Awareness**: Adjusts search strategy based on query type

---

## Tool-by-Tool Deep Dive

### 1. exa_web_search_exa

**Purpose**: General-purpose semantic web search with full content extraction

#### Parameters
```typescript
{
  query: string,           // Search query
  numResults?: number      // Results to return (default: 5)
}
```

#### Response Structure
```typescript
{
  requestId: string,
  autopromptString: string,  // Original query
  resolvedSearchType: "neural",
  autoDate?: string,         // Added for time-sensitive queries
  results: Array<{
    id: string,              // URL
    title: string,
    url: string,
    publishedDate: string,   // ISO 8601 or empty
    author: string,
    text: string,            // Full extracted content
    image?: string,
    favicon?: string
  }>,
  searchTime: number,        // milliseconds
  costDollars: {
    total: number,
    search: { neural: number },
    contents: { text: number }
  }
}
```

#### When to Use
- ✅ General information retrieval
- ✅ Finding recent articles/news
- ✅ Technical documentation search
- ✅ Getting comprehensive content from multiple sources
- ✅ Research requiring full text, not snippets

#### Cost Breakdown
- Base search: $0.005
- Content extraction: $0.001 per result (~$0.003-0.007 for 3-7 results)
- Total: $0.008-0.012 typical

#### Tested Observations
- **Time-sensitive queries** automatically add `autoDate` field (e.g., "October 2025")
- **Search time**: Consistently 4-5 seconds
- **Content quality**: Full articles extracted, not truncated
- **Result diversity**: Good mix of authoritative sources

#### Example Usage
```javascript
// Find recent AI news
const results = await exa_web_search_exa({
  query: "latest AI developments October 2025",
  numResults: 7
});

// Returns results with autoDate: "2025-10-01T00:00:00.000Z"
```

---

### 2. exa_company_research_exa

**Purpose**: Specialized business intelligence and company research

#### Parameters
```typescript
{
  companyName: string,
  numResults?: number      // Default: 5
}
```

#### Auto-Enhancement
Your query is automatically expanded:
- Input: `"Anthropic"`
- Enhanced: `"Anthropic company business corporation information news financial"`

#### Response Structure
Same as `exa_web_search_exa` but with:
- **autoDate**: Always present (recent time range)
- **Source focus**: Bloomberg, Reuters, Crunchbase, LinkedIn, PR Newswire
- **Content types**: Funding rounds, partnerships, financial performance, company metrics

#### When to Use
- ✅ Researching company funding/valuation
- ✅ Finding business partnerships
- ✅ Getting financial performance data
- ✅ Discovering company news/announcements
- ✅ Competitive intelligence

#### What You'll Get
| Company Type | Typical Sources |
|-------------|-----------------|
| Tech Startup | Crunchbase, TechCrunch, LinkedIn, Medium |
| Public Company | Bloomberg, Reuters, SEC filings, Yahoo Finance |
| Enterprise | Press releases, company blogs, industry publications |

#### Tested Observations
- Always adds recent date filter (60-90 days back)
- Cost: $0.008-0.010
- Speed: 4-5 seconds
- Result quality: Highly relevant business content

#### Example Usage
```javascript
// Research a startup
const anthropicData = await exa_company_research_exa({
  companyName: "Anthropic",
  numResults: 3
});

// Returns: Funding rounds, company profile, recent news
```

---

### 3. exa_crawling_exa

**Purpose**: Fast, targeted content extraction from specific URLs

#### Parameters
```typescript
{
  url: string,
  maxCharacters?: number   // Advisory (doesn't truncate in practice)
}
```

#### Response Structure
```typescript
{
  requestId: string,
  results: Array<{
    id: string,              // The URL
    title: string,
    url: string,
    author?: string,
    text: string,            // Full extracted text
    publishedDate?: string,
    image?: string
  }>,
  statuses: Array<{
    id: string,              // URL
    status: "success" | "failed",
    source?: "cached"        // Indicates cached result
  }>,
  costDollars: {
    total: 0.001,
    contents: { text: 0.001 }
  },
  searchTime: number         // 13-22ms typical
}
```

#### When to Use
- ✅ Follow-up deep-dive on search results
- ✅ Extract full article text
- ✅ Get structured content from known URLs
- ✅ Batch URL processing
- ✅ Fast content retrieval (cached results)

#### Key Characteristics
- **Blazing fast**: 13-22ms response time
- **Dirt cheap**: $0.001 per URL
- **Caching**: Previously crawled URLs return instantly with `"source": "cached"`
- **Clean extraction**: HTML removed, readable text only
- **maxCharacters advisory**: Returns full content regardless of limit (based on testing)

#### Tested Observations
```javascript
// Tested with different maxCharacters values
await exa_crawling_exa({ url: "...", maxCharacters: 1000 });   // Got full content
await exa_crawling_exa({ url: "...", maxCharacters: 3000 });   // Got full content
await exa_crawling_exa({ url: "..." });                        // Got full content

// Conclusion: maxCharacters appears advisory
```

#### Example Usage
```javascript
// Extract multiple URLs from search results
const searchResults = await exa_web_search_exa({
  query: "React Server Components tutorial",
  numResults: 5
});

// Deep-dive into top 3 results
const detailedContent = await Promise.all(
  searchResults.results.slice(0, 3).map(r => 
    exa_crawling_exa({ url: r.url, maxCharacters: 5000 })
  )
);
```

---

### 4. exa_linkedin_search_exa

**Purpose**: Search LinkedIn content (posts, jobs, company pages)

#### Parameters
```typescript
{
  query: string,
  searchType?: "profiles" | "companies" | "all",
  numResults?: number
}
```

#### Response Structure
Same as web search, plus:
- **score**: Relevance score (0-1 range, typically 0.23-0.28)

```typescript
{
  // ... standard response fields
  results: Array<{
    // ... standard result fields
    score: number,           // Unique to LinkedIn search
  }>
}
```

#### When to Use
- ✅ Finding job postings
- ✅ Researching companies on LinkedIn
- ✅ Getting public LinkedIn post content
- ⚠️ NOT for individual profile pages (limited access)

#### Limitations Discovered

**Expected vs Reality:**

| Expected | Actual Result |
|----------|--------------|
| `searchType: "profiles"` → Profile pages | Returns **job postings** |
| Individual profile URLs | Limited access to public posts only |
| `searchType: "companies"` → Company pages | Returns company products, posts, pages |
| `searchType: "all"` → Mixed results | Mostly public posts about topic |

**The searchType parameter has LIMITED effect** - Exa appears to return public LinkedIn content regardless of type specified.

#### What You Actually Get
- Job postings (even when searching for profiles)
- Company product pages
- Public LinkedIn posts
- Company announcements
- LinkedIn articles

#### Cost & Performance
- Cost: $0.008-0.010
- Speed: 525ms - 2s
- Quality: Good for public content, limited for profiles

#### Example Usage
```javascript
// What you might expect
const profiles = await exa_linkedin_search_exa({
  query: "AI research scientist machine learning",
  searchType: "profiles",
  numResults: 5
});

// What you actually get: Job postings for AI research scientists

// Better use case: Find company pages
const companies = await exa_linkedin_search_exa({
  query: "fintech payment processing startup",
  searchType: "companies",
  numResults: 4
});
// Returns: Company product pages, posts, LinkedIn presence
```

---

### 5. exa_deep_researcher_start

**Purpose**: Initiate autonomous AI research task

#### Parameters
```typescript
{
  instructions: string,      // Detailed research question
  model?: "exa-research" | "exa-research-pro"
}
```

#### Models Comparison

| Feature | exa-research | exa-research-pro |
|---------|-------------|------------------|
| Speed | 15-45 seconds | 45s - 2 minutes |
| Depth | Good | Comprehensive |
| Reliability | Can fail on complex queries | More reliable |
| Cost | Lower | Higher |
| Best For | Straightforward research | Complex analysis |

#### Response
```typescript
{
  success: true,
  taskId: string,            // Use for polling
  model: string,
  instructions: string,
  message: string,
  nextStep: string           // Instructions for polling
}
```

#### When to Use
- ✅ Complex research requiring multiple sources
- ✅ Comparative analysis
- ✅ Deep technical investigations
- ✅ When you need synthesized findings, not raw results
- ✅ Multi-faceted research questions

#### Async Pattern
```javascript
// 1. Start research
const { taskId } = await exa_deep_researcher_start({
  instructions: "Compare tRPC vs GraphQL with examples",
  model: "exa-research-pro"  // Use pro for complex queries
});

// 2. Poll until complete (see next tool)
```

---

### 6. exa_deep_researcher_check

**Purpose**: Poll research task status and retrieve results

#### Parameters
```typescript
{
  taskId: string            // From deep_researcher_start
}
```

#### Response States

**Running:**
```typescript
{
  success: true,
  status: "running",
  taskId: string,
  message: "🔄 Research in progress. Continue polling...",
  nextAction: string
}
```

**Completed:**
```typescript
{
  success: true,
  status: "completed",
  taskId: string,
  report: string,           // Comprehensive markdown report
  timeMs: number,           // Total research time
  model: string,
  message: "🎉 Deep research completed!"
}
```

**Failed:**
```typescript
{
  success: false,
  status: "failed",
  taskId: string,
  createdAt: string,
  instructions: string,
  message: "❌ Deep research task failed."
}
```

#### Polling Pattern
The tool has **built-in 5-second delay** before checking:

```javascript
async function pollResearch(taskId) {
  while (true) {
    const result = await exa_deep_researcher_check({ taskId });
    
    if (result.status === "completed") {
      return result.report;
    }
    
    if (result.status === "failed") {
      throw new Error("Research failed");
    }
    
    // Status is "running" - tool already waited 5s, loop continues
  }
}
```

#### Tested Observations

**Standard Model (exa-research):**
- Tested query: "tRPC vs GraphQL differences"
- Result: **FAILED** after ~80 seconds
- Conclusion: Can't handle moderately complex queries reliably

**Pro Model (exa-research-pro):**
- Tested query: "Rust web frameworks comprehensive analysis"
- Result: **SUCCESS** after 67 seconds
- Report quality: Excellent - citations, benchmarks, structured analysis

**Key Finding**: Always use `exa-research-pro` for anything beyond trivial queries.

#### Complete Report Structure
When successful, the `report` field contains:
- Executive summary
- Detailed analysis with subsections
- Code examples (if applicable)
- Citations with URLs
- Comparative tables
- Conclusions

Length: 3000-7000 words typically for pro model

---

### 7. exa_get_code_context_exa

**Purpose**: Find relevant code examples from repositories and documentation

#### Parameters
```typescript
{
  query: string,
  tokensNum?: "dynamic" | number   // 1000-50000 or "dynamic"
}
```

#### Token Strategy

| Mode | Behavior | Best For |
|------|----------|----------|
| `"dynamic"` | Returns 100-1000+ most useful tokens | Most queries (recommended) |
| `1000-5000` | Returns specific token count | Controlled context size |
| `5000+` | Comprehensive examples | Deep-dive investigations |

#### Response Format

**Unlike other tools**, returns markdown-formatted code snippets:

```markdown
## Title describing the code

https://source-url

\`\`\`language
code here
\`\`\`

## Next example title

https://another-url

\`\`\`language
more code
\`\`\`
```

#### Source Types
- Raw GitHub repository files
- Official documentation sites
- Educational platforms (Medium, Dev.to)
- Tutorial repositories
- Open-source examples

#### When to Use
- ✅ Finding implementation examples
- ✅ Learning library/framework patterns
- ✅ Discovering best practices
- ✅ Getting working code to adapt
- ✅ Understanding API usage

#### Response Characteristics
- No structured JSON (just markdown text)
- Multiple examples per query
- Complete, runnable code snippets
- Source attribution (GitHub URLs)
- Language-specific syntax highlighting

#### Tested Observations

**Query: "React useState with TypeScript"**
- Returns: ~15 code examples
- Sources: GitHub repos, official docs, tutorials
- Quality: Diverse examples from basic to advanced

**Query: "tRPC middleware authentication"**
- Returns: ~20 production-ready examples
- Sources: Official tRPC docs, real projects
- Quality: Complete, working implementations

**Query: "Drizzle ORM PostgreSQL connection pooling"**
- Returns: ~15 setup examples
- Sources: Framework starters, official guides
- Quality: Copy-paste ready configurations

#### Example Usage
```javascript
// Get React hook examples
const examples = await exa_get_code_context_exa({
  query: "React useState hook examples with TypeScript",
  tokensNum: "dynamic"
});

console.log(examples);
// Returns markdown with multiple code examples from:
// - w3schools.io
// - codefinity.com
// - francanete.com
// - Raw GitHub repos
// Each with title, URL, and complete code block
```

---

## Response Structures

### Common Fields Across All Tools

```typescript
interface CommonResponse {
  requestId: string;          // Unique request identifier
  resolvedSearchType?: "neural";
  searchTime?: number;        // Milliseconds
  costDollars?: {
    total: number;
    search?: { neural: number };
    contents?: { text: number };
  };
}
```

### Result Item Structure (Search Tools)

```typescript
interface SearchResult {
  id: string;                 // Usually the URL
  title: string;
  url: string;
  publishedDate?: string;     // ISO 8601 or empty
  author?: string;            // Author name or empty
  text: string;               // Full extracted content
  image?: string;             // Featured image URL
  favicon?: string;           // Site favicon
  score?: number;             // Relevance (LinkedIn only)
}
```

### Field Reliability

| Field | Always Present | Notes |
|-------|----------------|-------|
| `id` | ✅ | Always the URL |
| `title` | ✅ | Page title |
| `url` | ✅ | Same as id |
| `text` | ✅ | Full content (not truncated) |
| `publishedDate` | ⚠️ | Often empty string |
| `author` | ⚠️ | Often empty or partial |
| `image` | ❌ | Sometimes present |
| `favicon` | ❌ | Sometimes present |

---

## Cost Analysis

### Per-Tool Cost Breakdown

```
exa_web_search_exa (5 results):
  Search:   $0.005
  Content:  $0.005 (5 × $0.001)
  Total:    $0.010

exa_company_research_exa (5 results):
  Search:   $0.005
  Content:  $0.004-0.005
  Total:    $0.009-0.010

exa_crawling_exa (per URL):
  Content:  $0.001
  Total:    $0.001

exa_linkedin_search_exa (5 results):
  Search:   $0.005
  Content:  $0.004-0.005
  Total:    $0.009-0.010

exa_deep_researcher (varies):
  Pro:      Higher but not specified
  Standard: Lower but less reliable

exa_get_code_context (dynamic):
  Variable based on tokens
```

### Cost Optimization Strategies

1. **Use crawling for known URLs** - 5-10x cheaper than search
2. **Batch operations** - Extract multiple URLs in parallel
3. **Cache results** - Crawling shows "cached" status for repeat URLs
4. **Limit numResults** - Cost scales with result count
5. **Use dynamic tokens** - For code context, let Exa optimize

### Budget Examples

**Light Usage (100 searches/month):**
- 100 web searches × $0.010 = $1.00
- 200 URL extractions × $0.001 = $0.20
- Monthly: ~$1.20

**Heavy Usage (1000 searches/month):**
- 500 web searches × $0.010 = $5.00
- 300 company research × $0.010 = $3.00
- 1000 URL extractions × $0.001 = $1.00
- 50 deep research × $0.05 (est.) = $2.50
- 200 code context × $0.01 (est.) = $2.00
- Monthly: ~$13.50

---

## Performance Characteristics

### Speed Comparison

```
Tool                          Typical Response Time
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
exa_crawling_exa             13-22ms ⚡⚡⚡
exa_linkedin_search_exa      525ms - 2s ⚡⚡
exa_get_code_context_exa     2-3s ⚡⚡
exa_web_search_exa           4-5s ⚡
exa_company_research_exa     4-5s ⚡
exa_deep_researcher          15s - 2min ⏱️
  - Standard model           15-45s (but can fail)
  - Pro model                45s - 2min
```

### Parallelization

All search tools can be parallelized:

```javascript
// ❌ Sequential (slow)
const web = await exa_web_search_exa({ query: "A" });
const company = await exa_company_research_exa({ companyName: "B" });
const code = await exa_get_code_context_exa({ query: "C" });
// Total: ~11-13 seconds

// ✅ Parallel (fast)
const [web, company, code] = await Promise.all([
  exa_web_search_exa({ query: "A" }),
  exa_company_research_exa({ companyName: "B" }),
  exa_get_code_context_exa({ query: "C" })
]);
// Total: ~4-5 seconds (limited by slowest)
```

### Caching Behavior

**exa_crawling_exa** shows caching:
```json
{
  "statuses": [{
    "id": "https://example.com",
    "status": "success",
    "source": "cached"  // ← Instant return
  }]
}
```

**Other tools**: No apparent caching (same query = same cost/time)

---

## Use Case Patterns

### Pattern 1: Research → Deep-Dive

```javascript
// 1. Broad search
const overview = await exa_web_search_exa({
  query: "Rust web frameworks 2025",
  numResults: 10
});

// 2. Extract top 3 in detail
const details = await Promise.all(
  overview.results.slice(0, 3).map(r =>
    exa_crawling_exa({ url: r.url })
  )
);

// 3. Deep research for synthesis
const { taskId } = await exa_deep_researcher_start({
  instructions: `Synthesize information about Rust web frameworks from these sources: ${overview.results.map(r => r.url).join(', ')}`,
  model: "exa-research-pro"
});

const report = await pollForCompletion(taskId);
```

### Pattern 2: Company Intelligence

```javascript
// Multi-angle company research
const [companyData, news, team] = await Promise.all([
  exa_company_research_exa({ 
    companyName: "Anthropic",
    numResults: 5 
  }),
  exa_web_search_exa({ 
    query: "Anthropic news funding 2025",
    numResults: 3 
  }),
  exa_linkedin_search_exa({ 
    query: "Anthropic",
    searchType: "companies",
    numResults: 3 
  })
]);

// Combine and analyze
const analysis = {
  business: companyData.results,
  recentNews: news.results,
  linkedInPresence: team.results
};
```

### Pattern 3: Code Discovery

```javascript
// Find implementation pattern
const examples = await exa_get_code_context_exa({
  query: "Next.js 14 server actions with TypeScript validation",
  tokensNum: "dynamic"
});

// Parse markdown to extract code blocks
const codeBlocks = parseMarkdownCodeBlocks(examples);

// Use in your project
codeBlocks.forEach(block => {
  console.log(`Source: ${block.url}`);
  console.log(block.code);
});
```

### Pattern 4: Competitive Analysis

```javascript
async function analyzeCompetitors(competitors) {
  // Research all competitors in parallel
  const results = await Promise.all(
    competitors.map(company =>
      exa_company_research_exa({
        companyName: company,
        numResults: 5
      })
    )
  );
  
  // Deep analysis
  const { taskId } = await exa_deep_researcher_start({
    instructions: `Compare these companies: ${competitors.join(', ')}. Focus on market position, funding, technology stack, and key differentiators.`,
    model: "exa-research-pro"
  });
  
  return await pollForCompletion(taskId);
}
```

### Pattern 5: Technical Investigation

```javascript
// Investigate a technical problem
const [docsSearch, codeExamples, discussions] = await Promise.all([
  exa_web_search_exa({
    query: "PostgreSQL connection pool exhaustion solutions",
    numResults: 5
  }),
  exa_get_code_context_exa({
    query: "PostgreSQL connection pooling best practices Node.js",
    tokensNum: 5000
  }),
  exa_web_search_exa({
    query: "PostgreSQL connection pool debugging GitHub issues",
    numResults: 5
  })
]);

// Synthesize solution
const solution = {
  documentation: docsSearch.results,
  implementationExamples: codeExamples,
  realWorldSolutions: discussions.results
};
```

---

## Decision Matrix: Which Tool to Use

### By Objective

| Objective | Recommended Tool | Alternative |
|-----------|-----------------|-------------|
| Find recent articles | `exa_web_search_exa` | - |
| Research a company | `exa_company_research_exa` | `exa_web_search_exa` |
| Extract specific URL | `exa_crawling_exa` | - |
| Find job postings | `exa_linkedin_search_exa` | `exa_web_search_exa` |
| Comprehensive analysis | `exa_deep_researcher_pro` | Manual synthesis |
| Find code examples | `exa_get_code_context_exa` | `exa_web_search_exa` |
| Learn API usage | `exa_get_code_context_exa` | Documentation crawl |

### By Constraint

| Constraint | Best Choice | Why |
|------------|-------------|-----|
| Cost-sensitive | `exa_crawling_exa` | $0.001 per URL |
| Speed-critical | `exa_crawling_exa` | 13-22ms |
| Need depth | `exa_deep_researcher_pro` | AI synthesis |
| Need code | `exa_get_code_context_exa` | Code-specialized |
| Need business data | `exa_company_research_exa` | Auto-enhanced |

### By Content Type

| Content Type | Primary Tool | Why |
|--------------|-------------|-----|
| News/Articles | `exa_web_search_exa` | General purpose |
| Company info | `exa_company_research_exa` | Business-focused |
| Technical docs | `exa_web_search_exa` | Full content |
| Code snippets | `exa_get_code_context_exa` | GitHub sources |
| Academic papers | `exa_deep_researcher_pro` | Citation handling |

---

## Best Practices

### Search Query Optimization

**DO:**
- ✅ Be specific: "React Server Components authentication patterns"
- ✅ Include version: "Next.js 14 app router"
- ✅ Add time context: "PostgreSQL 16 features 2025"
- ✅ Specify format: "tutorial", "example", "guide"

**DON'T:**
- ❌ Be vague: "react stuff"
- ❌ Use only keywords: "database performance"
- ❌ Expect boolean operators: "React AND TypeScript"

### Error Handling

```javascript
// Always handle failures
async function robustSearch(query) {
  try {
    const result = await exa_web_search_exa({ query });
    return result;
  } catch (error) {
    if (error.code === 'RATE_LIMIT') {
      // Exponential backoff
      await sleep(5000);
      return robustSearch(query);
    }
    throw error;
  }
}

// Deep research can fail - be ready
async function robustDeepResearch(instructions) {
  const { taskId } = await exa_deep_researcher_start({
    instructions,
    model: "exa-research-pro"  // More reliable
  });
  
  const result = await pollWithTimeout(taskId, 120000);
  
  if (result.status === "failed") {
    // Fallback to simpler queries
    return await manualResearch(instructions);
  }
  
  return result.report;
}
```

### Resource Management

```javascript
// Batch URL extraction
async function extractMany(urls) {
  // Process in chunks to avoid overwhelming
  const CHUNK_SIZE = 10;
  const results = [];
  
  for (let i = 0; i < urls.length; i += CHUNK_SIZE) {
    const chunk = urls.slice(i, i + CHUNK_SIZE);
    const chunkResults = await Promise.all(
      chunk.map(url => 
        exa_crawling_exa({ url })
          .catch(err => ({ error: err, url }))
      )
    );
    results.push(...chunkResults);
  }
  
  return results;
}
```

### Polling Deep Research

```javascript
async function pollForCompletion(taskId, maxTime = 120000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxTime) {
    const result = await exa_deep_researcher_check({ taskId });
    
    if (result.status === "completed") {
      return result.report;
    }
    
    if (result.status === "failed") {
      throw new Error(`Research failed: ${result.message}`);
    }
    
    // Tool already waits 5s, just loop
  }
  
  throw new Error("Research timed out");
}
```

### Caching Strategy

```javascript
// Simple cache for crawled URLs
const urlCache = new Map();

async function cachedCrawl(url) {
  if (urlCache.has(url)) {
    return urlCache.get(url);
  }
  
  const result = await exa_crawling_exa({ url });
  
  // Only cache successful results
  if (result.statuses[0]?.status === "success") {
    urlCache.set(url, result);
  }
  
  return result;
}
```

---

## Limitations & Gotchas

### Known Issues

1. **LinkedIn Search Limitations**
   - ❌ Can't reliably access individual profiles
   - ❌ `searchType` parameter has limited effect
   - ❌ Returns job postings even when searching profiles
   - ✅ Works for company pages and public posts

2. **Deep Researcher Reliability**
   - ❌ Standard model fails on moderately complex queries
   - ⚠️ Pro model can take up to 2 minutes
   - ❌ No way to cancel running research
   - ❌ No progress indication during research

3. **maxCharacters Parameter**
   - ⚠️ In `exa_crawling_exa`, appears advisory only
   - ⚠️ Always returns full content regardless of limit
   - ⚠️ Can't use for truncation control

4. **Date Handling**
   - ⚠️ `publishedDate` often empty string
   - ⚠️ Date parsing inconsistent across sources
   - ⚠️ `autoDate` added automatically (can't disable)

5. **Author Attribution**
   - ⚠️ `author` field often empty or partial
   - ⚠️ Varies by source (good: Medium, bad: news sites)

### Rate Limiting

Not explicitly documented, but observed:
- Search tools: No obvious limits in testing
- Crawling: Very fast, no rate limit encountered
- Deep research: One task at a time per ID recommended

### Content Extraction Edge Cases

**Works Well:**
- ✅ News articles (Reuters, Bloomberg, TechCrunch)
- ✅ Blog posts (Medium, Dev.to)
- ✅ Documentation sites
- ✅ GitHub markdown files

**Problematic:**
- ⚠️ Paywalled content (partial extraction)
- ⚠️ JavaScript-heavy SPAs (limited content)
- ⚠️ PDF files (not supported)
- ⚠️ Video/audio content (no transcription)

---

## Integration Patterns

### Pattern: Search → Filter → Extract

```javascript
async function comprehensiveResearch(topic) {
  // 1. Broad search
  const search = await exa_web_search_exa({
    query: topic,
    numResults: 10
  });
  
  // 2. Filter for quality
  const quality = search.results.filter(r => 
    r.publishedDate && 
    r.text.length > 500 &&
    isReputableSite(r.url)
  );
  
  // 3. Extract top results
  const detailed = await Promise.all(
    quality.slice(0, 5).map(r =>
      exa_crawling_exa({ url: r.url })
    )
  );
  
  return {
    overview: search.results,
    detailed: detailed.map(d => d.results[0])
  };
}
```

### Pattern: Multi-Source Aggregation

```javascript
async function aggregateIntelligence(company) {
  const sources = await Promise.allSettled([
    exa_company_research_exa({ companyName: company }),
    exa_web_search_exa({ query: `${company} news` }),
    exa_linkedin_search_exa({ query: company, searchType: "companies" }),
    exa_get_code_context_exa({ query: `${company} GitHub examples` })
  ]);
  
  return {
    company: sources[0].status === "fulfilled" ? sources[0].value : null,
    news: sources[1].status === "fulfilled" ? sources[1].value : null,
    linkedin: sources[2].status === "fulfilled" ? sources[2].value : null,
    code: sources[3].status === "fulfilled" ? sources[3].value : null,
    errors: sources.filter(s => s.status === "rejected")
  };
}
```

### Pattern: Staged Research

```javascript
async function stagedResearch(query) {
  // Stage 1: Quick overview
  const quick = await exa_web_search_exa({
    query,
    numResults: 3
  });
  
  console.log("Quick results:", quick.results.length);
  
  // User decides to go deeper
  const shouldDeepDive = await askUser("Continue with deep research?");
  
  if (shouldDeepDive) {
    // Stage 2: Deep research
    const { taskId } = await exa_deep_researcher_start({
      instructions: `Comprehensive analysis: ${query}`,
      model: "exa-research-pro"
    });
    
    return await pollForCompletion(taskId);
  }
  
  return quick;
}
```

### Pattern: Code Learning System

```javascript
async function learnAPI(apiName, operation) {
  const [docs, examples, discussions] = await Promise.all([
    // Official documentation
    exa_web_search_exa({
      query: `${apiName} official documentation ${operation}`,
      numResults: 3
    }),
    
    // Real code examples
    exa_get_code_context_exa({
      query: `${apiName} ${operation} example TypeScript`,
      tokensNum: "dynamic"
    }),
    
    // Community discussions
    exa_web_search_exa({
      query: `${apiName} ${operation} best practices GitHub discussions`,
      numResults: 5
    })
  ]);
  
  return {
    documentation: docs.results,
    codeExamples: parseCodeBlocks(examples),
    bestPractices: discussions.results
  };
}
```

---

## Conclusion

The Exa MCP Server provides powerful AI-driven search and research capabilities through seven specialized tools. Key takeaways:

### When to Use Exa
- ✅ Need full content, not snippets
- ✅ Semantic/contextual search required
- ✅ Researching companies/businesses
- ✅ Finding code examples
- ✅ Comprehensive research with AI synthesis

### Key Strengths
1. **Neural search** understands intent
2. **Full content extraction** saves follow-up requests
3. **Fast URL extraction** for known sources
4. **Code-specialized search** for developers
5. **Deep research agent** for complex queries

### Key Limitations
1. LinkedIn profile access limited
2. Standard research model unreliable
3. No real-time or streaming results
4. Date/author metadata inconsistent
5. Deep research can take up to 2 minutes

### Cost-Benefit Analysis
- **Low cost**: $0.001-0.012 per operation
- **High value**: Full content + metadata
- **Caching**: URL extraction benefits from cache
- **Scalability**: Suitable for high-volume use

### Final Recommendation Matrix

| Scenario | Tool Choice | Priority |
|----------|-------------|----------|
| Quick lookup | `exa_web_search_exa` | First choice |
| Company research | `exa_company_research_exa` | Specialized |
| Known URLs | `exa_crawling_exa` | Fastest |
| Job search | `exa_linkedin_search_exa` | Limited |
| Deep analysis | `exa_deep_researcher_pro` | Reliable |
| Code search | `exa_get_code_context_exa` | Specialized |

---

**Document Version**: 1.0  
**Last Updated**: October 11, 2025  
**Based On**: Comprehensive hands-on testing of all 7 Exa MCP tools
