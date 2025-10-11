# Tavily MCP Server - Comprehensive Reference Guide

## Overview

The Tavily MCP (Model Context Protocol) server provides powerful web research capabilities through four complementary tools: Search, Extract, Crawl, and Map. This guide documents real-world usage patterns, capabilities, limitations, and best practices discovered through hands-on testing.

**Core Value Proposition**: Tavily transforms AI agents from isolated systems into web-connected researchers capable of finding, extracting, and synthesizing real-time information from the internet.

---

## Architecture & Design Philosophy

### Tool Relationships

```
tavily_search     → Find relevant URLs from web-wide search
     ↓
tavily_extract   → Get full content from specific URLs
     ↓
tavily_crawl     → Navigate site structure with content snippets
     ↓
tavily_map       → Discover site structure (URLs only)
```

### When to Use Each Tool

| Tool | Use When | Don't Use When |
|------|----------|----------------|
| **Search** | Need to find information across the web | You already have specific URLs |
| **Extract** | Have URLs and need full content | Exploring unknown site structure |
| **Crawl** | Need to navigate site + preview content | Only need URL discovery |
| **Map** | Need to discover site structure quickly | Need actual page content |

---

## Tool 1: tavily_tavily_search

### Purpose
Real-time web search with advanced filtering, topic specialization, and content extraction capabilities.

### Core Parameters

```typescript
{
  query: string,                    // REQUIRED: Search query
  max_results?: number,             // Default: 5, Max: varies by plan
  search_depth?: "basic"|"advanced",// Default: "basic"
  topic?: "general"|"news"|"finance",// Default: "general"
  
  // Time filtering
  time_range?: "day"|"week"|"month"|"year",
  start_date?: string,              // Format: YYYY-MM-DD
  end_date?: string,                // Format: YYYY-MM-DD
  days?: number,                    // For news topic only
  
  // Domain filtering
  include_domains?: string[],       // Only these domains
  exclude_domains?: string[],       // Exclude these domains
  country?: string,                 // Boost results from country
  
  // Content enhancement
  include_raw_content?: boolean,    // Include full page HTML/text
  include_images?: boolean,         // Include image URLs
  include_image_descriptions?: boolean, // AI-generated descriptions
  include_favicon?: boolean,        // Include favicon URLs
}
```

### Response Structure

```typescript
{
  query: string,
  results: [
    {
      url: string,              // Source URL
      title: string,            // Page title
      content: string,          // Content snippet (summary)
      score: number,            // Relevance score 0-1
      published_date?: string,  // For news results
      raw_content?: string,     // Full content (if requested)
    }
  ],
  images?: string[],            // Image URLs (if requested)
  response_time: number,        // Milliseconds
  request_id: string
}
```

### Real-World Usage Patterns

#### Pattern 1: Technical Documentation Search
```typescript
// Find specific technical content
tavily_search({
  query: "React Server Components best practices",
  search_depth: "basic",
  max_results: 3
})

// Returns focused, high-relevance results (score > 0.7)
// Perfect for quick technical lookups
```

#### Pattern 2: News Monitoring
```typescript
// Recent AI developments
tavily_search({
  query: "latest AI developments",
  topic: "news",
  days: 7,              // Last week only
  max_results: 5
})

// Results include published_date for temporal context
// Automatically filters for recent news sources
```

#### Pattern 3: Financial Research
```typescript
// Market-specific search
tavily_search({
  query: "Tesla stock performance",
  topic: "finance",
  max_results: 2
})

// Returns finance-focused sources (Yahoo Finance, Bloomberg, etc.)
// Higher relevance scores for financial content
```

#### Pattern 4: Domain-Specific Research
```typescript
// Search only trusted sources
tavily_search({
  query: "machine learning tutorials",
  include_domains: ["github.com", "medium.com"],
  max_results: 3
})

// Forces results from specified domains only
// Useful for quality control and source verification
```

#### Pattern 5: Content Exclusion
```typescript
// Filter out video platforms
tavily_search({
  query: "React hooks tutorial",
  exclude_domains: ["youtube.com", "udemy.com"],
  max_results: 3
})

// Returns text-based tutorials only
// Reduces noise from video content
```

#### Pattern 6: Deep Content Extraction
```typescript
// Get full page content in search results
tavily_search({
  query: "Python async programming tutorial",
  search_depth: "advanced",
  include_raw_content: true,
  include_image_descriptions: true,
  max_results: 2
})

// raw_content contains full HTML/markdown
// image_descriptions provide AI-generated alt text
// Significantly longer response time
```

#### Pattern 7: Visual Content Discovery
```typescript
// Find images related to query
tavily_search({
  query: "beautiful mountain landscapes",
  include_images: true,
  max_results: 2
})

// Returns images array with direct URLs
// Useful for visual research or context
```

### Performance Characteristics

| Configuration | Response Time | Content Size | Use Case |
|--------------|---------------|--------------|----------|
| Basic depth, no extras | 0.5-1s | Small snippets | Quick lookups |
| Advanced depth | 4-7s | Full content | Deep research |
| News topic | 1-2s | Medium | Current events |
| Finance topic | 1-2s | Medium | Market research |
| With images | 1-2s | Medium + URLs | Visual context |

### Best Practices

**DO:**
- Use `search_depth: "basic"` for speed (default behavior)
- Set `max_results: 2-3` for focused results
- Use `topic` parameter to improve relevance
- Combine `include_domains` with critical sources
- Use `exclude_domains` to filter noise

**DON'T:**
- Request `include_raw_content` unless you need full text
- Set `max_results` too high (increases latency and token usage)
- Mix incompatible parameters (e.g., `days` with non-news topics)
- Use advanced depth for every query

### Common Pitfalls

1. **Time Range Confusion**: `days` parameter only works with `topic: "news"`
2. **Country Boosting**: Only available for `topic: "general"`
3. **Raw Content Bloat**: Can return 10-100x more data than snippets
4. **Score Interpretation**: Scores are relative, not absolute thresholds

---

## Tool 2: tavily_tavily_extract

### Purpose
Extract full, clean content from specific URLs. Unlike search, this focuses on comprehensive content retrieval from known sources.

### Core Parameters

```typescript
{
  urls: string[],                   // REQUIRED: One or more URLs
  format?: "markdown"|"text",       // Default: "markdown"
  extract_depth?: "basic"|"advanced",// Default: "basic"
  include_images?: boolean,         // Include image URLs found
  include_favicon?: boolean,        // Include site favicon
}
```

### Response Structure

```typescript
{
  results: [
    {
      url: string,
      raw_content: string,      // Full page content in requested format
      images?: string[],        // Image URLs if requested
    }
  ],
  failed_results: string[],     // URLs that failed to extract
  response_time: number,
  request_id: string
}
```

### Real-World Usage Patterns

#### Pattern 1: Documentation Extraction
```typescript
// Get full React docs page
tavily_extract({
  urls: ["https://react.dev/learn"],
  extract_depth: "basic",
  format: "markdown"
})

// Returns clean markdown with navigation structure
// Preserves headings, code blocks, and links
// Removes ads and unnecessary UI elements
```

#### Pattern 2: Multiple URL Batch Processing
```typescript
// Extract from multiple sources at once
tavily_extract({
  urls: [
    "https://nodejs.org/en/about",
    "https://github.com/features"
  ],
  extract_depth: "basic",
  format: "text"
})

// Processes in parallel
// Each URL gets separate result object
// Failed URLs listed in failed_results array
```

#### Pattern 3: Advanced Content Extraction
```typescript
// Extract complex content (tables, embedded media)
tavily_extract({
  urls: ["https://www.typescriptlang.org/docs/"],
  extract_depth: "advanced",
  format: "markdown",
  include_images: true
})

// Advanced extracts tables, code blocks, nested structures
// More comprehensive but slightly slower
// Images array populated with all found image URLs
```

### Format Comparison

| Format | Output | Best For | Considerations |
|--------|--------|----------|----------------|
| **markdown** | Structured MD with headings, links, code | Documentation, structured content | Preserves hierarchy |
| **text** | Plain text, minimal structure | Simple reading, token efficiency | Loses some structure |

### Depth Comparison

| Depth | Extraction | Speed | Use Case |
|-------|-----------|-------|----------|
| **basic** | Main content, standard elements | Fast (~0.01s) | Most pages, clean sites |
| **advanced** | Tables, embedded content, complex layouts | Slower | Complex documentation, data tables |

### Best Practices

**DO:**
- Batch multiple URLs in one call (parallel processing)
- Use `basic` depth first, upgrade to `advanced` if needed
- Choose `markdown` for structured content analysis
- Check `failed_results` for error handling

**DON'T:**
- Extract the same URL repeatedly (cache results)
- Use `advanced` by default (unnecessary overhead)
- Assume all URLs will succeed (handle failures)

### Common Pitfalls

1. **Format Confusion**: Markdown isn't HTML - it's cleaned and simplified
2. **Image Arrays**: Only populated if `include_images: true`
3. **Failed Extractions**: Paywalls, JavaScript-heavy sites may fail
4. **Content Truncation**: None! Unlike crawl, extract returns full content

---

## Tool 3: tavily_tavily_crawl

### Purpose
Navigate website structures by following links, extracting content previews. Perfect for exploring documentation sites or discovering related pages.

### Core Parameters

```typescript
{
  url: string,                      // REQUIRED: Starting URL
  max_depth?: number,               // Default: 1, how far to follow links
  max_breadth?: number,             // Default: 20, links per page
  limit?: number,                   // Default: 50, total pages to process
  format?: "markdown"|"text",       // Default: "markdown"
  extract_depth?: "basic"|"advanced",// Default: "basic"
  
  // Link filtering
  select_paths?: string[],          // Regex patterns to include
  exclude_paths?: string[],         // Regex patterns to exclude
  select_domains?: string[],        // Domain patterns to include
  exclude_domains?: string[],       // Domain patterns to exclude
  
  // Behavior control
  instructions?: string,            // Natural language guidance
  allow_external?: boolean,         // Include external links
  include_images?: boolean,
  include_favicon?: boolean,
}
```

### Response Structure

```typescript
{
  base_url: string,
  results: [
    {
      url: string,
      raw_content: string | null,   // Truncated to ~500 chars
    }
  ],
  response_time: number,
  request_id: string
}
```

### Real-World Usage Patterns

#### Pattern 1: Shallow Documentation Crawl
```typescript
// Explore main sections of React docs
tavily_crawl({
  url: "https://react.dev/learn",
  max_depth: 1,
  limit: 5,
  format: "markdown"
})

// Discovers immediate child pages
// Content truncated to 500 chars per page
// Fast overview of site structure
```

#### Pattern 2: Guided Crawl with Instructions
```typescript
// Find specific content types
tavily_crawl({
  url: "https://nextjs.org/docs",
  max_depth: 2,
  max_breadth: 3,
  limit: 10,
  extract_depth: "basic",
  instructions: "Focus on pages about routing and data fetching"
})

// AI interprets instructions to prioritize relevant links
// Filters out unrelated sections
// More targeted than path regex
```

#### Pattern 3: Path-Filtered Crawl
```typescript
// Only documentation pages
tavily_crawl({
  url: "https://docs.python.org",
  max_depth: 1,
  limit: 3,
  exclude_paths: [".*/download.*", ".*/bugs.*"],
  format: "text"
})

// Regex patterns filter URLs before crawling
// Saves time by avoiding irrelevant paths
// Combines with depth/breadth for precision
```

### Depth & Breadth Strategy

```
max_depth: 1
    URL (start)
    ├── Link 1 (depth 1)
    ├── Link 2 (depth 1)
    └── Link 3 (depth 1)

max_depth: 2
    URL (start)
    ├── Link 1 (depth 1)
    │   ├── Link 1.1 (depth 2)
    │   └── Link 1.2 (depth 2)
    └── Link 2 (depth 1)

max_breadth: 3
    Only follows first 3 links per page
```

### Key Limitation: Content Truncation

**CRITICAL**: Crawl truncates content to ~500 characters per page. For full content:
1. Use `tavily_crawl` to discover URLs
2. Use `tavily_extract` on specific URLs for full content

### Best Practices

**DO:**
- Start with `max_depth: 1` to understand structure
- Use `instructions` for natural language filtering
- Combine `select_paths` and `exclude_paths` for precision
- Set reasonable `limit` (10-20 for exploration)

**DON'T:**
- Expect full content (it's truncated to 500 chars)
- Set `max_depth > 2` without good reason (exponential growth)
- Ignore `max_breadth` (can explode with many links)
- Use crawl when you only need URLs (use map instead)

### Performance Characteristics

| Configuration | Time | Pages Discovered | Use Case |
|--------------|------|------------------|----------|
| depth:1, limit:5 | 1-2s | 5 | Quick preview |
| depth:2, limit:10 | 10-15s | 10 | Structure discovery |
| depth:3, limit:20 | 30-60s | 20+ | Deep exploration |

---

## Tool 4: tavily_tavily_map

### Purpose
Discover website URL structure without extracting content. Fastest way to understand site organization and find specific pages.

### Core Parameters

```typescript
{
  url: string,                      // REQUIRED: Starting URL
  max_depth?: number,               // Default: 1
  max_breadth?: number,             // Default: 20
  limit?: number,                   // Default: 50
  
  // Link filtering (same as crawl)
  select_paths?: string[],
  exclude_paths?: string[],
  select_domains?: string[],
  exclude_domains?: string[],
  instructions?: string,
  allow_external?: boolean,         // Default: true
}
```

### Response Structure

```typescript
{
  base_url: string,
  results: string[],                // Array of URLs only
  response_time: number,
  request_id: string
}
```

### Real-World Usage Patterns

#### Pattern 1: Fast Site Discovery
```typescript
// Map React docs structure
tavily_map({
  url: "https://react.dev",
  max_depth: 2,
  limit: 15
})

// Returns only URLs, no content
// 10-100x faster than crawl
// Perfect for sitemap generation
```

#### Pattern 2: Filtered URL Discovery
```typescript
// Find only documentation URLs
tavily_map({
  url: "https://nextjs.org/docs",
  max_depth: 1,
  max_breadth: 10,
  limit: 10,
  select_paths: [".*docs.*"],
  instructions: "Find documentation pages"
})

// Combines regex filtering with AI guidance
// Returns focused URL list
// Can then extract specific URLs for content
```

### Map vs Crawl Decision Matrix

| Need | Use Map | Use Crawl |
|------|---------|-----------|
| Just URLs | ✓ | |
| Content previews | | ✓ |
| Speed priority | ✓ | |
| Structure + snippets | | ✓ |
| Sitemap generation | ✓ | |
| Research preparation | ✓ | |

### Best Practices

**DO:**
- Use map first to discover, then extract specific URLs
- Set appropriate `limit` based on site size
- Use `select_paths` to focus on relevant sections
- Enable `allow_external: false` for site-only mapping

**DON'T:**
- Use map when you need content (use crawl/extract)
- Set `max_depth` too high (URL explosion)
- Ignore response time (still needs to follow links)

---

## Decision Tree: Which Tool to Use?

```
START
│
├─ Do you know specific URLs?
│  ├─ YES → tavily_extract (full content)
│  └─ NO → Continue
│
├─ Searching across web?
│  ├─ YES → tavily_search (find URLs + snippets)
│  └─ NO → Continue
│
├─ Need content from pages?
│  ├─ YES → tavily_crawl (structure + previews)
│  └─ NO → tavily_map (URLs only)
```

## Advanced Usage Patterns

### Pattern: Two-Phase Research

```typescript
// Phase 1: Discover (fast)
const urlMap = await tavily_map({
  url: "https://docs.example.com",
  max_depth: 2,
  select_paths: [".*api.*"],
  limit: 20
});

// Phase 2: Extract (targeted)
const fullContent = await tavily_extract({
  urls: urlMap.results.slice(0, 5),  // Top 5 relevant
  format: "markdown",
  extract_depth: "basic"
});
```

### Pattern: Search-Extract Pipeline

```typescript
// Find relevant pages
const searchResults = await tavily_search({
  query: "React performance optimization",
  max_results: 3
});

// Get full content from top results
const fullArticles = await tavily_extract({
  urls: searchResults.results.map(r => r.url),
  format: "markdown"
});
```

### Pattern: News Monitoring + Analysis

```typescript
// Get recent news
const news = await tavily_search({
  query: "AI policy updates",
  topic: "news",
  days: 7,
  max_results: 5
});

// Deep dive on specific articles
const articles = await tavily_extract({
  urls: news.results.filter(r => r.score > 0.7).map(r => r.url),
  format: "markdown",
  extract_depth: "advanced"
});
```

---

## Performance Optimization Guide

### Minimize Latency

1. **Use basic depth by default**: Only upgrade to advanced when necessary
2. **Limit max_results**: 2-3 for searches, 5-10 for crawls
3. **Batch extract calls**: Process multiple URLs in one request
4. **Cache results**: Don't re-fetch unchanged content

### Minimize Token Usage

1. **Search snippets vs raw content**: Snippets are 10-100x smaller
2. **Map before crawl**: URLs only, then targeted extraction
3. **Text format**: More compact than markdown for simple content
4. **Exclude unnecessary data**: Skip images, favicons if not needed

### Accuracy Improvements

1. **Use topic parameter**: Better relevance filtering
2. **Domain filtering**: Control source quality
3. **Instructions parameter**: Natural language guidance
4. **Score thresholds**: Filter low-relevance results

---

## Common Pitfalls & Solutions

### Pitfall 1: Raw Content Overload
**Problem**: Including raw_content in search returns massive responses
**Solution**: Use search for discovery, extract for full content

### Pitfall 2: Crawl Depth Explosion
**Problem**: max_depth: 3 discovers hundreds of pages
**Solution**: Start with depth 1, use breadth limits, add path filters

### Pitfall 3: Content Truncation Surprise
**Problem**: Crawl truncates content to 500 chars
**Solution**: Use crawl for URLs, extract for full content

### Pitfall 4: Topic/Time Mismatches
**Problem**: Using `days` parameter with non-news topics
**Solution**: Read parameter compatibility in docs

### Pitfall 5: Ignoring Failed Results
**Problem**: Assuming all extracts succeed
**Solution**: Check failed_results array, implement retry logic

---

## Error Handling Patterns

```typescript
// Graceful search degradation
try {
  const results = await tavily_search({
    query: userQuery,
    search_depth: "advanced",
    include_raw_content: true
  });
} catch (error) {
  // Retry with simpler configuration
  const results = await tavily_search({
    query: userQuery,
    search_depth: "basic"
  });
}

// Extract with failure handling
const extracted = await tavily_extract({
  urls: urlList
});

if (extracted.failed_results.length > 0) {
  console.warn("Failed URLs:", extracted.failed_results);
  // Implement retry or alternative strategy
}
```

---

## Integration with Agent Systems

### When to Use Tavily in Agent Workflows

**ALWAYS USE when:**
- Agent needs real-time web information
- Verifying claims against current sources
- Researching emerging topics (post-training date)
- Finding documentation for new libraries/APIs
- Gathering competitive intelligence

**CONSIDER NOT USING when:**
- Information is in training data (faster, cheaper)
- User provided specific URLs (use extract directly)
- Offline/local information preferred
- Rate limits or costs are concerns

### Agent Prompt Patterns

```markdown
You have access to Tavily MCP tools for web research:

1. tavily_search - Search across the web
   - Use for: Finding information, discovering sources
   - Best practice: Start with basic depth, 2-3 results
   
2. tavily_extract - Get full content from URLs
   - Use for: Reading complete articles/docs
   - Best practice: Batch multiple URLs together
   
3. tavily_crawl - Explore site structure + previews
   - Use for: Documentation discovery, related pages
   - Warning: Content limited to 500 chars/page
   
4. tavily_map - Fast URL discovery
   - Use for: Site structure, finding specific pages
   - Best practice: Use before extract for efficiency

WORKFLOW:
1. Search to find relevant sources
2. Map/Crawl to discover structure (if needed)
3. Extract for full content from best matches
```

### Cost-Efficiency Strategies

1. **Cascade from cheap to expensive**:
   - Try training data recall first
   - Search with snippets (no raw_content)
   - Extract only when necessary

2. **Deduplicate before extraction**:
   - Multiple searches may return same URLs
   - Cache extracted content

3. **Use appropriate granularity**:
   - Don't extract entire site for one fact
   - Search snippets often sufficient

---

## Real-World Use Cases

### Use Case 1: Technical Documentation Assistant
```typescript
// User: "Show me Next.js data fetching options"

// Step 1: Search
const search = await tavily_search({
  query: "Next.js data fetching methods",
  max_results: 2
});

// Step 2: Extract official docs
const docs = await tavily_extract({
  urls: search.results
    .filter(r => r.url.includes("nextjs.org"))
    .map(r => r.url),
  format: "markdown"
});

// Return: Comprehensive, current documentation
```

### Use Case 2: Competitive Analysis
```typescript
// User: "Compare features of Vercel vs Netlify"

// Search both companies
const vercelInfo = await tavily_search({
  query: "Vercel features pricing 2024",
  include_domains: ["vercel.com"],
  max_results: 3
});

const netlifyInfo = await tavily_search({
  query: "Netlify features pricing 2024",
  include_domains: ["netlify.com"],
  max_results: 3
});

// Extract marketing pages
const details = await tavily_extract({
  urls: [...vercelInfo.results, ...netlifyInfo.results].map(r => r.url)
});

// Synthesize comparison
```

### Use Case 3: Breaking News Monitor
```typescript
// Monitor AI developments

const newsCheck = async () => {
  const results = await tavily_search({
    query: "AI breakthroughs GPT Claude",
    topic: "news",
    time_range: "day",
    max_results: 5
  });
  
  return results.results
    .filter(r => r.score > 0.6)
    .map(r => ({
      title: r.title,
      url: r.url,
      published: r.published_date,
      summary: r.content
    }));
};
```

### Use Case 4: Research Paper Discovery
```typescript
// Find recent ML papers

const papers = await tavily_search({
  query: "transformer architecture improvements 2024",
  include_domains: ["arxiv.org", "papers.nips.cc"],
  search_depth: "advanced",
  max_results: 5
});

// Get abstracts
const abstracts = await tavily_extract({
  urls: papers.results.map(r => r.url),
  format: "text"
});
```

---

## Testing & Validation

### Verify Setup
```typescript
// Basic connectivity test
const test = await tavily_search({
  query: "test query",
  max_results: 1
});

console.log("Tavily operational:", test.results.length > 0);
```

### Benchmark Performance
```typescript
const start = Date.now();

await tavily_search({
  query: "React hooks",
  max_results: 3
});

console.log("Search latency:", Date.now() - start, "ms");
// Expected: 500-2000ms for basic searches
```

### Validate Response Quality
```typescript
const results = await tavily_search({
  query: "TypeScript generics",
  max_results: 5
});

// Check relevance scores
const avgScore = results.results.reduce((sum, r) => sum + r.score, 0) / results.results.length;
console.log("Average relevance:", avgScore);
// Expected: > 0.5 for good queries
```

---

## Troubleshooting Guide

### Problem: Low Relevance Scores
**Symptoms**: Results have scores < 0.5
**Solutions**:
- Refine query with more specific terms
- Use topic parameter (news/finance)
- Add domain filtering for quality sources

### Problem: No Results
**Symptoms**: Empty results array
**Solutions**:
- Broaden query terms
- Remove overly restrictive filters
- Check domain spelling in include_domains

### Problem: Slow Responses
**Symptoms**: Response time > 10s
**Solutions**:
- Remove include_raw_content
- Switch from advanced to basic depth
- Reduce max_results
- Check network latency

### Problem: Extraction Failures
**Symptoms**: URLs in failed_results
**Solutions**:
- Check URL accessibility (paywall, auth)
- Try basic extraction depth
- Verify URL format and protocol

### Problem: Crawl Overwhelming
**Symptoms**: Too many URLs, long wait times
**Solutions**:
- Reduce max_depth (start with 1)
- Lower max_breadth (5-10 per page)
- Add exclude_paths for noise
- Set conservative limit (10-20)

---

## Limitations & Constraints

### API Limits
- Rate limits vary by plan
- Token costs for large responses
- Timeout thresholds for long crawls

### Content Limitations
- JavaScript-heavy sites may not extract fully
- Paywalled content returns limited/no data
- Crawl truncates to ~500 chars per page
- Some sites block automated access

### Structural Limitations
- Map/Crawl may miss AJAX-loaded content
- Single-page apps (SPAs) harder to crawl
- Dynamic routes require specific URLs

### Best Practices for Limits
1. Implement retry logic with backoff
2. Cache results aggressively
3. Use appropriate tool for task (don't over-crawl)
4. Monitor response times and adjust

---

## Version & Compatibility

**Tested Configuration**:
- Tavily API version: Latest (2024)
- Response formats: JSON
- Supported protocols: HTTPS (HTTP auto-upgraded)

**Breaking Changes Watch**:
- Parameter renames (rare)
- Format changes in responses
- New required fields

---

## Summary & Quick Reference

### Tool Selection Cheat Sheet

| Goal | Tool | Key Params |
|------|------|------------|
| Find info | search | query, max_results, topic |
| Full article | extract | urls, format |
| Preview pages | crawl | url, max_depth, limit |
| URL list | map | url, max_depth, select_paths |

### Response Time Expectations

| Operation | Typical Time |
|-----------|--------------|
| Basic search | 0.5-2s |
| Advanced search + raw content | 4-8s |
| Extract 1 URL | 0.01s |
| Extract 5 URLs | 0.5-1s |
| Crawl depth=1, limit=5 | 1-2s |
| Map depth=2, limit=10 | 10-15s |

### Token Usage Estimates

| Response Type | Approximate Size |
|---------------|------------------|
| Search snippet (each) | 100-300 tokens |
| Search with raw_content | 2000-10000 tokens |
| Extract markdown | 1000-5000 tokens |
| Crawl preview (each) | 100-200 tokens |
| Map URLs (each) | 10-50 tokens |

---

## Conclusion

The Tavily MCP server transforms AI agents from knowledge-cutoff-limited systems into dynamic web researchers. By combining Search, Extract, Crawl, and Map tools strategically, agents can:

1. **Discover** relevant information across the web
2. **Retrieve** comprehensive content from specific sources
3. **Navigate** complex documentation hierarchies
4. **Synthesize** real-time, accurate responses

**Key Success Factors**:
- Choose the right tool for each task
- Start simple (basic depth, low limits) and upgrade as needed
- Cache and batch for efficiency
- Handle failures gracefully
- Monitor performance and costs

**When in Doubt**:
1. Search to find
2. Map to explore
3. Extract to read

This reference is based on hands-on testing and real-world usage patterns. Adapt these guidelines to your specific use cases and constraints.
