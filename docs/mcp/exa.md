# Welcome to Exa

> Exa is a search engine made for AIs.

***

Exa finds the exact content you're looking for on the web, with five core functionalities:

<a href="./search" target="_self" className="endpoint-link">/search -></a>\
Find webpages using Exa's embeddings-based or Google-style keyword search.

<a href="./get-contents" target="_self" className="endpoint-link">/contents -></a>\
Obtain clean, up-to-date, parsed HTML from Exa search results.

<a href="./find-similar-links" target="_self" className="endpoint-link">/findsimilar -></a>\
Based on a link, find and return pages that are similar in meaning.

<a href="./answer" target="_self" className="endpoint-link">/answer -></a>\
Get direct answers to questions using Exa's Answer API.

<a href="./research/create-a-task" target="_self" className="endpoint-link">/research -></a>\
Automate in-depth web research and receive structured JSON results with citations.

<br />

## Get Started

<CardGroup cols={2}>
  <Card title={<div className="card-title">API Playground</div>} icon="code" href="https://dashboard.exa.ai">
    <div className="text-lg">
      Explore the API playground and try Exa API.
    </div>
  </Card>

  <Card title={<div className="card-title">QuickStart</div>} icon="bolt-lightning" href="./quickstart">
    <div className="text-lg">
      Use our SDKs to do your first Exa search.
    </div>
  </Card>

  <Card title={<div className="card-title">Tool Calling with Exa</div>} icon="magnifying-glass" href="./rag-quickstart">
    <div className="text-lg">
      Give LLMs the ability to search the web with Exa.
    </div>
  </Card>

  <Card title={<div className="card-title">Examples</div>} icon="lightbulb" href="../examples">
    <div className="text-lg">
      Learn from our pre-built tutorials and live demos.
    </div>
  </Card>
</CardGroup>

<img src="https://mintcdn.com/exa-52/tmzyKnsgpKLGddKC/images/be0cab3-blue-wanderer.png?fit=max&auto=format&n=tmzyKnsgpKLGddKC&q=85&s=ad0d68efd38e9f5e794474adea0f3a68" alt="" width="1024" height="615" data-path="images/be0cab3-blue-wanderer.png" srcset="https://mintcdn.com/exa-52/tmzyKnsgpKLGddKC/images/be0cab3-blue-wanderer.png?w=280&fit=max&auto=format&n=tmzyKnsgpKLGddKC&q=85&s=7967dfd3cb9bb98a2bffc66d763cfa2e 280w, https://mintcdn.com/exa-52/tmzyKnsgpKLGddKC/images/be0cab3-blue-wanderer.png?w=560&fit=max&auto=format&n=tmzyKnsgpKLGddKC&q=85&s=6cdcf27e4cda9ab1641c4c4c4f85333c 560w, https://mintcdn.com/exa-52/tmzyKnsgpKLGddKC/images/be0cab3-blue-wanderer.png?w=840&fit=max&auto=format&n=tmzyKnsgpKLGddKC&q=85&s=8c58fce20e785b7bd2f205b0531dc2c1 840w, https://mintcdn.com/exa-52/tmzyKnsgpKLGddKC/images/be0cab3-blue-wanderer.png?w=1100&fit=max&auto=format&n=tmzyKnsgpKLGddKC&q=85&s=463a5f8e5596df3fcd82c9803c4e1a94 1100w, https://mintcdn.com/exa-52/tmzyKnsgpKLGddKC/images/be0cab3-blue-wanderer.png?w=1650&fit=max&auto=format&n=tmzyKnsgpKLGddKC&q=85&s=aadd8fde4f54f9ebe68b3f64785110c6 1650w, https://mintcdn.com/exa-52/tmzyKnsgpKLGddKC/images/be0cab3-blue-wanderer.png?w=2500&fit=max&auto=format&n=tmzyKnsgpKLGddKC&q=85&s=6de1508a386d4206b6f6af84bf2361a1 2500w" data-optimize="true" data-opv="2" />

# How Exa Search Works

> Exa is a novel search engine that utilizes the latest advancements in AI language processing to return the best possible results.

***

We offer four search types:

* **Auto (Default)** - Our best search, intelligently combines keyword and neural
* **Fast** - A streamlined implementation of keyword and neural search for faster results
* **Keyword** - Uses google-like search to find results with matching keywords
* **Neural** - Our AI search model, predicts relevant links based on query meaning

## Neural search via 'next-link prediction'

At Exa, we've built our very own index of high quality web content, and have trained a model to query this index powered by the same embeddings-based technology that makes modern LLMs so powerful.

By using embeddings, we move beyond keyword searches to use 'next-link prediction', understanding the semantic content of queries and indexed documents. This method predicts which web links are most relevant based on the semantic meaning, not just direct word matches.

By doing this, our model anticipates the most relevant links by understanding complex queries, including indirect or thematic relationships. This approach is especially effective for exploratory searches, where precise terms may be unknown, or where queries demand many, often semantically dense, layered filters.

You can query our search model directly with search type `neural`. It is also incorporated into the `auto` and `fast` search types.

## Auto search combines keyword and neural

Sometimes keyword search is the best way to query the web - for instance, you may have a specific word or piece of jargon that you want to match explicitly with results (often the case with proper nouns like place-names). In these cases, semantic searches are not the most useful.

To ensure our engine is comprehensive, we have built keyword search in parallel to our novel neural search capability. This means Exa is an 'all-in-one' search solution, no matter what your query needs are.

We surface both query archetypes through search type `auto`, to give users the best of both worlds. It uses a reranker model that understands your query and ranks results from keyword and neural search according to relevance.

## Fast search is the world's fastest search API

We built Fast search for when latency matters most. It trades off a small amount of performance for significant speed improvements.

Fast search is best for applications where milliseconds matter. It means a much better user experience for real-time applications like voice agents and autocomplete. It's also great for long running agents, like deep research, that might use hundreds of search calls so the latency adds up.

We achieved these latency improvements by making streamlined versions of our keyword, neural, and reranker models. You can expect Fast search to run in less than 400 milliseconds, not accounting for network latency or live crawling.

# The Exa Index

> We spend a lot of time and energy creating a high quality, curated index.

***

There are many types of content, and we're constantly discovering new things to search for as well. If there's anything you want to be more highly covered, just reach out to [hello@exa.ai](mailto:hello@exa.ai). See the following table for a high level overview of what is available in our index:

|                      Category                     | Availability in Exa Index |                                                           Description                                                           |                                                                                                                                                                                                                                     Example prompt link                                                                                                                                                                                                                                    |
| :-----------------------------------------------: | :-----------------------: | :-----------------------------------------------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
|                  Research papers                  |         Very High         | Offer semantic search over a very vast index of papers, enabling sophisticated, multi-layer and complex filtering for use cases |            [If you're looking for the most helpful academic paper on "embeddings for document retrieval", check this out (pdf:](https://search.exa.ai/search?q=If+you%27re+looking+for+the+most+helpful+academic+paper+on+%22embeddings+for+document+retrieval%22\&filters=%7B%22numResults%22%3A30%2C%22domainFilterType%22%3A%22include%22%2C%22type%22%3A%22neural%22%2C%22resolvedSearchType%22%3A%22neural%22%2C%22useAutoprompt%22%3Afalse%7D\&resolvedSearchType=neural)            |
|                   Personal pages                  |         Very High         |           Excels at finding personal pages, which are often extremely hard/impossible to find on services like Google           |                                                                           [Here is a link to the best life coach for when you're unhappy at work:](https://exa.ai/search?q=Here%20is%20a%20link%20to%20the%20best%20life%20coach%20for%20when%20you%27re%20unhappy%20at%20work%3A\&c=personal%20site\&filters=%7B%22numResults%22%3A30%2C%22useAutoprompt%22%3Afalse%2C%22domainFilterType%22%3A%22include%22%7D)                                                                          |
|                     Wikipedia                     |         Very High         |             Covers all of Wikipedia, providing comprehensive access to this vast knowledge base via semantic search             |                                                                      [Here is a Wikipedia page about a Roman emperor:](https://search.exa.ai/search?q=Here+is+a+Wikipedia+page+about+a+Roman+emperor%3A\&filters=%7B%22numResults%22%3A30%2C%22domainFilterType%22%3A%22include%22%2C%22type%22%3A%22neural%22%2C%22useAutoprompt%22%3Afalse%2C%22resolvedSearchType%22%3A%22neural%22%7D\&resolvedSearchType=neurall)                                                                     |
|                        News                       |         Very High         |                     Includes a wide, robust index of web news sources, providing coverage of current events                     |                                       [Here is news about war in the Middle East:](https://exa.ai/search?q=Here+is+news+about+war+in+the+Middle+East%3A\&c=personal+site\&filters=%7B%22numResults%22%3A30%2C%22domainFilterType%22%3A%22include%22%2C%22type%22%3A%22auto%22%2C%22useAutoprompt%22%3Afalse%2C%22resolvedSearchType%22%3A%22neural%22%2C%22startPublishedDate%22%3A%222024-10-29T01%3A45%3A46.055Z%22%7D\&resolvedSearchType=keyword)                                      |
|                 LinkedIn  profiles                |    *Very High (US+EU)*    |      Will provide extensive coverage of LinkedIn personal profiles, allowing for detailed professional information searches     |                         [best theoretical computer scientist at uc berkeley](https://exa.ai/search?q=best+theoretical+computer+scientist+at+uc+berkeley\&c=linkedin+profile\&filters=%7B%22numResults%22%3A30%2C%22domainFilterType%22%3A%22include%22%2C%22type%22%3A%22neural%22%2C%22useAutoprompt%22%3Atrue%2C%22resolvedSearchType%22%3A%22neural%22%7D\&autopromptString=A+leading+theoretical+computer+scientist+at+UC+Berkeley.\&resolvedSearchType=neural)                        |
|               LinkedIn company pages              |       *Coming Soon*       |       Will offer comprehensive access to LinkedIn company pages, enabling in-depth research on businesses and organization      |                                                                                                                                                                                                                                 (Best-practice example TBC)                                                                                                                                                                                                                                |
|                 Company home-pages                |         Very High         |        Wide index of companies covered; also available are curated, customized company datasets - reach out to learn more       |                                            [Here is the homepage of a company working on making space travel cheaper:](https://search.exa.ai/search?q=Here+is+the+homepage+of+a+company+working+on+making+space+travel+cheaper%3A\&filters=%7B%22numResults%22%3A30%2C%22domainFilterType%22%3A%22include%22%2C%22type%22%3A%22neural%22%2C%22useAutoprompt%22%3Afalse%2C%22resolvedSearchType%22%3A%22neural%22%7D\&resolvedSearchType=neural)                                            |
|                 Financial Reports                 |         Very High         |                Includes SEC 10k financial reports and information from other finance sources like Yahoo Finance.                |                    [Here is a source on Apple's revenue growth rate over the past years:](https://exa.ai/search?q=Here+is+a+source+on+Apple%27s+revenue+growth+rate+over+the+past+years%3A\&filters=%7B%22numResults%22%3A30%2C%22domainFilterType%22%3A%22include%22%2C%22type%22%3A%22neural%22%2C%22startPublishedDate%22%3A%222023-11-18T22%3A35%3A50.022Z%22%2C%22useAutoprompt%22%3Afalse%2C%22resolvedSearchType%22%3A%22neural%22%7D\&resolvedSearchType=neural)                   |
|                    GitHub repos                   |            High           |                                  Indexes open source code (which the Exa team use frequently!)                                  |                                                 [Here's a Github repo if you want to convert OpenAPI specs to Rust code:](https://exa.ai/search?q=Here%27s+a+Github+repo+if+you+want+to+convert+OpenAPI+specs+to+Rust+code%3A\&filters=%7B%22numResults%22%3A30%2C%22domainFilterType%22%3A%22include%22%2C%22type%22%3A%22neural%22%2C%22useAutoprompt%22%3Afalse%2C%22resolvedSearchType%22%3A%22neural%22%7D\&resolvedSearchType=neural)                                                |
|                       Blogs                       |            High           |                      Excels at finding high quality reading material, particularly useful for niche topics                      |                                                          [If you're a huge fan of Japandi decor, you'd love this blog:](https://exa.ai/search?q=If+you%27re+a+huge+fan+of+Japandi+decor%2C+you%27d+love+this+blog%3A\&filters=%7B%22numResults%22%3A30%2C%22domainFilterType%22%3A%22include%22%2C%22type%22%3A%22neural%22%2C%22useAutoprompt%22%3Afalse%2C%22resolvedSearchType%22%3A%22neural%22%7D\&resolvedSearchType=neural)                                                         |
|                 Places and things                 |            High           |              Covers a wide range of entities including hospitals, schools, restaurants, appliances, and electronics             |                                                             [Here is a high-rated Italian restaurant in downtown Chicago:](https://exa.ai/search?q=Here+is+a+high-rated+Italian+restaurant+in+downtown+Chicago%3A\&filters=%7B%22numResults%22%3A30%2C%22domainFilterType%22%3A%22include%22%2C%22type%22%3A%22neural%22%2C%22useAutoprompt%22%3Afalse%2C%22resolvedSearchType%22%3A%22neural%22%7D\&resolvedSearchType=neural)                                                            |
|              Legal and policy sources             |            High           |           Strong coverage of legal and policy information, (e.g., including sources like CPUC, Justia, Findlaw, etc.)           |                        [Here is a common law case in california on marital property rights:](https://search.exa.ai/search?q=Here+is+a+common+law+case+in+california+on+marital+property+rights%3A\&filters=%7B%22numResults%22%3A30%2C%22domainFilterType%22%3A%22include%22%2C%22type%22%3A%22neural%22%2C%22useAutoprompt%22%3Afalse%2C%22includeDomains%22%3A%5B%22law.justia.com%22%5D%2C%22resolvedSearchType%22%3A%22neural%22%7D\&resolvedSearchType=neural)                        |
| Government and international organization sources |            High           |                                Includes content from sources like the IMF and CDC amongst others                                |             [Here is a recent World Health Organization site on global vaccination rates:](https://exa.ai/search?q=Here+is+a+recent+World+Health+Organization+site+on+global+vaccination+rates%3A\&filters=%7B%22numResults%22%3A30%2C%22domainFilterType%22%3A%22include%22%2C%22type%22%3A%22neural%22%2C%22startPublishedDate%22%3A%222023-11-18T22%3A35%3A50.022Z%22%2C%22useAutoprompt%22%3Afalse%2C%22resolvedSearchType%22%3A%22neural%22%7D\&resolvedSearchType=neural)            |
|                       Events                      |          Moderate         |                      Reasonable coverage of events in major municipalities, suggesting room for improvement                     | [Here is an AI hackathon in SF:](https://search.exa.ai/search?q=Here+is+an+AI+hackathon+in+SF\&filters=%7B%22numResults%22%3A30%2C%22domainFilterType%22%3A%22exclude%22%2C%22type%22%3A%22neural%22%2C%22startPublishedDate%22%3A%222024-07-02T23%3A36%3A15.511Z%22%2C%22useAutoprompt%22%3Afalse%2C%22endPublishedDate%22%3A%222024-07-09T23%3A36%3A15.511Z%22%2C%22excludeDomains%22%3A%5B%22twitter.com%22%5D%2C%22resolvedSearchType%22%3A%22neural%22%7D\&resolvedSearchType=neural) |
|                        Jobs                       |          Moderate         |                                                    Can find some job listings                                                   |      [If you're looking for a software engineering job at a small startup working on an important mission, check out](https://search.exa.ai/search?q=If+you%27re+looking+for+a+software+engineering+job+at+a+small+startup+working+on+an+important+mission%2C+check+out\&filters=%7B%22numResults%22%3A30%2C%22domainFilterType%22%3A%22include%22%2C%22type%22%3A%22neural%22%2C%22useAutoprompt%22%3Afalse%2C%22resolvedSearchType%22%3A%22neural%22%7D\&resolvedSearchType=neural)      |

# Contents Retrieval

***

When using the Exa API, you can request different types of content to be returned for each search result.

## Text (text=True)

Returns the full text content of the result, formatted as markdown. It extracts the main content (like article body text) while filtering out navigation elements, pop-ups, and other peripheral text. This is extractive content taken directly from the page's source.

## Summary (summary=True)

Provides a concise summary generated from the text, tailored to a specific query you provide. This is abstractive content created by processing the source text using Gemini Flash.

### Structured Summaries

You can also request structured summaries by providing a JSON schema:

```json
{
  "summary": {
    "query": "Provide company information",
    "schema": {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "title": "Company Information",
      "type": "object",
      "properties": {
        "name": { "type": "string", "description": "The name of the company" },
        "industry": { "type": "string", "description": "The industry the company operates in" },
        "foundedYear": { "type": "number", "description": "The year the company was founded" }
      },
      "required": ["name", "industry"]
    }
  }
}
```

The API will return the summary as a JSON string that matches your schema structure, which you can parse to access the structured data.

## Highlights

Delivers key excerpts from the text that are most relevant to your search query, emphasizing important information within the content. This is also extractive content from the source.

You can configure highlights in two ways:

1. **Simple boolean** (`highlights=True`): Returns default highlights based on the search query

2. **Detailed configuration** (pass as an object):
   ```json
   {
     "contents": {
       "highlights": {
         "query": "Your specific highlight query",
         "numSentences": 3,
         "highlightsPerUrl": 5
       }
     }
   }
   ```
   * `query`: The specific query to use for generating highlights (if different from search query)
   * `numSentences`: Number of sentences per highlight (minimum: 1)
   * `highlightsPerUrl`: Maximum number of highlights to return per URL (minimum: 1)

## Images and favicons

You can get images from webpages by setting `imageLinks` (under `contents.extras.imageLinks`) to specify how many images you want per result. Each result also includes the website's `favicon` URL and a representative `image` URL when available.

## Crawl Errors

The contents endpoint provides detailed status information for each URL through the `statuses` field in the response. The endpoint only returns an error if there's an internal issue on Exa's end - all other cases are reported through individual URL statuses.

Each response includes a `statuses` array with status information for each requested URL:

```json
{
  "results": [...],
  "statuses": [
    {
      "id": "https://example.com",
      "status": "success" | "error",
      "error": {
        "tag": "CRAWL_NOT_FOUND" | "CRAWL_TIMEOUT" | "CRAWL_LIVECRAWL_TIMEOUT" | "SOURCE_NOT_AVAILABLE" | "CRAWL_UNKNOWN_ERROR",
        "httpStatusCode": 404 | 408 | 403 | 500
      }
    }
  ]
}
```

The error tags correspond to different failure scenarios:

* `CRAWL_NOT_FOUND`: Content not found (HTTP 404)
* `CRAWL_TIMEOUT`: The target page returned a timeout error (HTTP 408)
* `CRAWL_LIVECRAWL_TIMEOUT`: The `livecrawlTimeout` parameter limit was reached during crawling
* `SOURCE_NOT_AVAILABLE`: Access forbidden or source unavailable (HTTP 403)
* `CRAWL_UNKNOWN_ERROR`: Other errors (HTTP 500+)

To handle errors, check the `statuses` field for each URL:

```python
result = exa.get_contents(["https://example.com"])
for status in result.statuses:
    if status.status == "error":
        print(f"Error for {status.id}: {status.error.tag} ({status.error.httpStatusCode})")
```

This allows you to handle different failure scenarios appropriately for each URL in your request.

# Crawling Subpages

***

When searching websites, you often need to explore beyond the main page to find relevant information. Exa's subpage crawling feature allows you to automatically discover and search through linked pages within a website.

## Using Subpage Crawling

Here's how to use Exa's subpage crawling feature:

<CodeGroup>
  ```bash cURL
  curl -X POST 'https://api.exa.ai/contents' \
    -H 'x-api-key: YOUR-EXA-API-KEY' \
    -H 'Content-Type: application/json' \
    -d '{
      "ids": ["https://example.com"],
      "subpages": 5,
      "subpageTarget": ["about", "products"]
    }'
  ```

  ```python Python
  results = exa.get_contents(
      ["https://example.com"], 
      subpages=5, 
      subpage_target=["about", "products"]
  )
  ```

  ```typescript TypeScript
  const results = await exa.getContents(
      ["https://example.com"], 
      {
          subpages: 5,
          subpageTarget: ["about", "products"]
      }
  );
  ```
</CodeGroup>

This will search through up to 5 subpages of the given website, and prioritize pages that contain the keywords "about" or "products" in their contents.

## Parameters

* `subpages`: Maximum number of subpages to crawl (integer)
* `subpage_target`: List of query keywords to target (e.g., \["about", "products", "news"])

## Best Practices

1. **Limit Depth**: Start with a smaller `subpages` value (5-10) and increase if needed
2. **Consider Caching**: Use `livecrawl='always'` only when you need the most recent content
3. **Target Specific Sections**: Use `subpage_target` to focus on relevant sections rather than crawling the entire site

## Combining with LiveCrawl

For the most up-to-date and comprehensive results, combine subpage crawling with livecrawl:

<CodeGroup>
  ```bash cURL
  curl -X POST 'https://api.exa.ai/contents' \
    -H 'x-api-key: YOUR-EXA-API-KEY' \
    -H 'Content-Type: application/json' \
    -d '{
      "ids": ["https://www.apple.com/"],
      "livecrawl": "always",
      "subpageTarget": ["news", "product"],
      "subpages": 10
    }'
  ```

  ```python Python
  result = exa.get_contents(
      ["https://www.apple.com/"],
      livecrawl="always",
      subpage_target=["news", "product"],
      subpages=10
  )
  ```

  ```typescript TypeScript
  const result = await exa.getContents(
      ["https://www.apple.com/"],
      {
          livecrawl: "always",
          subpageTarget: ["news", "product"],
          subpages: 10
      }
  );
  ```
</CodeGroup>

This ensures you get fresh content from all discovered subpages.

Note that regarding usage, additional subpages count as an additional piece of content retrieval for each type you specify.

## Examples

### Product Documentation

Search through documentation pages:

<CodeGroup>
  ```bash cURL
  curl -X POST 'https://api.exa.ai/contents' \
    -H 'x-api-key: YOUR-EXA-API-KEY' \
    -H 'Content-Type: application/json' \
    -d '{
      "ids": ["https://exa.ai"],
      "subpages": 9,
      "subpageTarget": ["docs", "tutorial"]
    }'
  ```

  ```python Python
  result = exa.get_contents(
      ["https://exa.ai"],
      subpages=9,
      subpage_target=["docs", "tutorial"]
  )
  ```

  ```typescript TypeScript
  const result = await exa.getContents(
      ["https://exa.ai"],
      {
          subpages: 9,
          subpageTarget: ["docs", "tutorial"]
      }
  );
  ```
</CodeGroup>

This example crawls up to 9 subpages from the main site, prioritizing pages that contain "docs" or "tutorial" in their content.

```Shell Shell
{
  "results": [
    {
      "id": "https://exa.ai",
      "url": "https://exa.ai/",
      "title": "Exa API",
      "author": "exa",
      "text": "AIs need powerful access to knowledge. But search engines haven't improved since 1998...",
      "image": "https://exa.imgix.net/og-image.png",
      "subpages": [
        {
          "id": "https://docs.exa.ai/reference/getting-started",
          "url": "https://docs.exa.ai/reference/getting-started",
          "title": "Getting Started",
          "author": "",
          "text": "Exa provides search for AI. Exa is a knowledge API for LLMs..."
        },
        {
          "id": "https://docs.exa.ai/reference/recent-news-summarizer",
          "url": "https://docs.exa.ai/reference/recent-news-summarizer",
          "title": "Recent News Summarizer",
          "author": null,
          "publishedDate": "2024-03-02T11:36:31.000Z",
          "text": "In this example, we will build a LLM-based news summarizer app..."
        },
        {
          "id": "https://docs.exa.ai/reference/company-analyst",
          "url": "https://docs.exa.ai/reference/company-analyst",
          "title": "Company Analyst",
          "author": null,
          "publishedDate": "2024-03-02T11:36:42.000Z",
          "text": "n this example, we&#39;ll build a company analyst tool that..."
        },
        {
          "id": "https://docs.exa.ai/reference/exa-researcher",
          "url": "https://docs.exa.ai/reference/exa-researcher",
          "title": "Exa Researcher",
          "author": null,
          "publishedDate": "2024-03-02T11:36:30.000Z",
          "text": "In this example, we will build Exa Researcher, a Javascript..."
        },
        {
          "id": "https://docs.exa.ai/reference/exa-rag",
          "url": "https://docs.exa.ai/reference/exa-rag",
          "title": "Exa RAG",
          "author": null,
          "publishedDate": "2024-03-02T11:36:43.000Z",
          "text": "LLMs are powerful because they compress large amounts of data..."
        },
        {
          "id": "https://docs.exa.ai/",
          "url": "https://docs.exa.ai/",
          "title": "Introduction",
          "author": "",
          "publishedDate": "2023-03-03T23:47:48.000Z",
          "text": "Exa is a search engine made for AIs.  \n Exa has three core..."
        },
        {
          "id": "https://exa.ai/blog/announcing-exa",
          "url": "https://exa.ai/blog/announcing-exa",
          "title": "Exa API",
          "author": "exa",
          "text": "Steps toward the mission Today, we're excited to announce...",
          "image": "https://exa.imgix.net/og-image.png"
        },
        {
          "id": "https://dashboard.exa.ai/",
          "url": "https://dashboard.exa.ai/",
          "title": "Exa API Dashboard",
          "author": "Exa",
          "publishedDate": "2012-01-06T00:00:00.000Z",
          "text": "Get started with Exa No credit card required. If you are..."
        }
      ]
    }
  ]
}
```

### News Archives

Crawl through a company's news section:

<CodeGroup>
  ```bash cURL
  curl -X POST 'https://api.exa.ai/contents' \
    -H 'x-api-key: YOUR-EXA-API-KEY' \
    -H 'Content-Type: application/json' \
    -d '{
      "ids": ["https://www.apple.com/"],
      "livecrawl": "always",
      "subpageTarget": ["news", "product"],
      "subpages": 10
    }'
  ```

  ```python Python
  result = exa.get_contents(
      ["https://www.apple.com/"],
      livecrawl="always",
      subpage_target=["news", "product"],
      subpages=10
  )
  ```

  ```typescript TypeScript
  const result = await exa.getContents(
      ["https://www.apple.com/"],
      {
          livecrawl: "always",
          subpageTarget: ["news", "product"],
          subpages: 10
      }
  );
  ```
</CodeGroup>

Output:

```Shell Shell
{
  "results": [
    {
      "id": "https://www.apple.com/",
      "url": "https://www.apple.com/",
      "title": "Apple",
      "author": "",
      "publishedDate": "2024-10-30T16:54:13.000Z",
      "text": "Apple Intelligence is here.\nExperience it now on the latest iPhone...",
      "image": "https://www.apple.com/ac/structured-data/images/open_graph_logo.png?202110180743",
      "subpages": [
        {
          "id": "https://www.apple.com/apple-news/",
          "url": "https://www.apple.com/apple-news/",
          "title": "Apple News+",
          "author": "",
          "publishedDate": "2024-05-07T20:24:00.000Z",
          "text": "Get 3 months of Apple News+ free with a new iPhone, iPad, or...",
          "image": "https://www.apple.com/v/apple-news/l/images/shared/apple-news__6xg2yiktruqy_og.png?202401091100"
        },
        {
          "id": "https://www.apple.com/us/shop/goto/store",
          "url": "https://www.apple.com/us/shop/goto/store",
          "title": "Apple Store Online",
          "author": "",
          "publishedDate": "2024-06-18T09:56:09.000Z",
          "text": "Apple Intelligence is available in beta on all iPhone 16 models...",
          "image": "https://as-images.apple.com/is/og-default?wid=1200&hei=630&fmt=jpeg&qlt=95&.v=1525370171638"
        },
        {
          "id": "https://www.apple.com/mac/",
          "url": "https://www.apple.com/mac/",
          "title": "Mac",
          "author": "",
          "publishedDate": "2024-05-07T20:24:00.000Z",
          "text": "Answer calls or messages from your iPhone directly on your Mac...",
          "image": "https://www.apple.com/v/mac/home/cb/images/meta/mac__c3zv0c86zu0y_og.png?202410291046"
        },
        {
          "id": "https://www.apple.com/ipad/",
          "url": "https://www.apple.com/ipad/",
          "title": "iPad",
          "author": "",
          "publishedDate": "2024-05-07T20:24:00.000Z",
          "text": "Get 3% Daily Cash back with Apple Card. And pay for your new iPad...",
          "image": "https://www.apple.com/v/ipad/home/cm/images/meta/ipad__f350v51yy3am_og.png?202410241440"
        },
        {
          "id": "https://www.apple.com/iphone/",
          "url": "https://www.apple.com/iphone/",
          "title": "iPhone",
          "author": "",
          "publishedDate": "2024-05-07T20:24:00.000Z",
          "text": "Get credit toward iPhone 16 or iPhone 16 Pro when you trade...",
          "image": "https://www.apple.com/v/iphone/home/bx/images/meta/iphone__kqge21l9n26q_og.png?202410241440"
        },
        {
          "id": "https://www.apple.com/watch/",
          "url": "https://www.apple.com/watch/",
          "title": "Apple Watch",
          "author": "",
          "publishedDate": "2024-05-07T20:24:00.000Z",
          "text": "Combining Apple Watch and iPhone opens up a world of features...",
          "image": "https://www.apple.com/v/watch/bo/images/meta/apple-watch__f6h72tjlgx26_og.png?202410031527"
        },
        {
          "id": "https://www.apple.com/apple-vision-pro/",
          "url": "https://www.apple.com/apple-vision-pro/",
          "title": "Apple Vision Pro",
          "author": "",
          "publishedDate": "2024-05-07T20:24:00.000Z",
          "text": "Apple Vision Pro seamlessly blends digital content with your...",
          "image": "https://www.apple.com/v/apple-vision-pro/e/images/meta/apple-vision-pro-us__f28gp8ey4vam_og.png?202409261242"
        },
        {
          "id": "https://www.apple.com/airpods/",
          "url": "https://www.apple.com/airpods/",
          "title": "AirPods",
          "author": "",
          "publishedDate": "2024-09-27T17:22:17.000Z",
          "text": "AirPods Pro 2 now feature a scientifically validated Hearing...",
          "image": "https://www.apple.com/v/airpods/x/images/meta/airpods__dh7xkbort402_og.png?202410241631"
        },
        {
          "id": "https://www.apple.com/tv-home/",
          "url": "https://www.apple.com/tv-home/",
          "title": "TV & Home",
          "author": "",
          "publishedDate": "2024-05-07T20:24:00.000Z",
          "text": "The future hits home.\nSimply connect your favorite devices...",
          "image": "https://www.apple.com/v/tv-home/n/images/meta/tv-home__fedwm0ly3mqi_og.png?202409151638"
        }
      ]
    }
  ],
  "requestId": "17e8a79ff11bcb73115ef3efcb8e0457"
}
```

### Blog Content

Gather recent blog posts:

<CodeGroup>
  ```bash cURL
  curl -X POST 'https://api.exa.ai/contents' \
    -H 'x-api-key: YOUR-EXA-API-KEY' \
    -H 'Content-Type: application/json' \
    -d '{
      "ids": ["https://medium.com"],
      "subpages": 5,
      "subpageTarget": ["blog", "articles"],
      "livecrawl": "always"
    }'
  ```

  ```python Python
  results = exa.get_contents(
      ["https://medium.com"],
      subpages=5,
      subpage_target=["blog", "articles"],
      livecrawl='always'
  )
  ```

  ```typescript TypeScript
  const results = await exa.getContents(
      ["https://medium.com"],
      {
          subpages: 5,
          subpageTarget: ["blog", "articles"],
          livecrawl: "always"
      }
  );
  ```
</CodeGroup>

Output:

```Shell Shell
{
    "results": [
        {
            "id": "https://medium.com",
            "title": "Medium: Read and write stories.",
            "url": "https://medium.com",
            "publishedDate": "2025-08-12T20:25:00.000Z",
            "author": "",
            "text": "[Sitemap](https://medium.com/sitemap/sitemap.xml)\n\n[Medium Logo](https://medium.com/)...",
            "image": "https://miro.medium.com/v2/da:true/167cff2a3d17ac1e64d0762539978f2d54c0058886e8b3c8a03a725a83012ec0",
            "favicon": "https://miro.medium.com/v2/5d8de952517e8160e40ef9841c781cdc14a5db313057fa3c3de41c6f5b494b19",
            "subpages": [
                {
                    "id": "https://blog.medium.com",
                    "title": "The Medium Blog",
                    "url": "https://blog.medium.com",
                    "publishedDate": "2025-08-12T20:25:00.000Z",
                    "author": "",
                    "text": "[Sitemap](https://blog.medium.com/sitemap/sitemap.xml)...",
                    "image": "https://miro.medium.com/v2/resize:fit:1024/1*7eq6Xl7nRYU77U7IPYvoDg.jpeg",
                    "favicon": "https://miro.medium.com/v2/5d8de952517e8160e40ef9841c781cdc14a5db313057fa3c3de41c6f5b494b19"
                },
                {
                    "id": "https://medium.com/",
                    "title": "Medium: Read and write stories.",
                    "url": "https://medium.com/",
                    "publishedDate": "2025-08-12T20:25:00.000Z",
                    "author": "",
                    "text": "[Sitemap](https://medium.com/sitemap/sitemap.xml)...",
                    "image": "https://miro.medium.com/v2/da:true/167cff2a3d17ac1e64d0762539978f2d54c0058886e8b3c8a03a725a83012ec0",
                    "favicon": "https://miro.medium.com/v2/5d8de952517e8160e40ef9841c781cdc14a5db313057fa3c3de41c6f5b494b19"
                },
                {
                    "id": "https://medium.com/about?autoplay=1",
                    "title": "About Medium",
                    "url": "https://medium.com/about?autoplay=1",
                    "publishedDate": "2025-08-12T20:25:00.000Z",
                    "author": "",
                    "text": "[Sitemap](https://medium.com/sitemap/sitemap.xml)...",
                    "image": "https://miro.medium.com/v2/da:true/167cff2a3d17ac1e64d0762539978f2d54c0058886e8b3c8a03a725a83012ec0",
                    "favicon": "https://miro.medium.com/v2/5d8de952517e8160e40ef9841c781cdc14a5db313057fa3c3de41c6f5b494b19"
                },
                {
                    "id": "https://medium.com/membership",
                    "title": "Medium Membership",
                    "url": "https://medium.com/membership",
                    "publishedDate": "2025-08-12T20:25:00.000Z",
                    "author": "",
                    "text": "[Sitemap](https://medium.com/sitemap/sitemap.xml)...",
                    "image": "https://miro.medium.com/v2/da:true/167cff2a3d17ac1e64d0762539978f2d54c0058886e8b3c8a03a725a83012ec0",
                    "favicon": "https://miro.medium.com/v2/5d8de952517e8160e40ef9841c781cdc14a5db313057fa3c3de41c6f5b494b19"
                }
            ]
        }
    ],
  "requestId": "20163fc78142a5ff69c6959167417f1f"
}
```
# Livecrawling Contents

***

With Exa, we can already search the web using LLMs.

However, by default, we cache all of our links to bias for the fastest response possible. You may be interested in the live version of the page, which our `livecrawl` parameter can help with.

## LiveCrawl Options

Here are all livecrawl options and their behaviors:

| Option        | Crawl Behavior   | Cache Fallback              | Best For                                               |
| ------------- | ---------------- | --------------------------- | ------------------------------------------------------ |
| `"always"`    | Always crawls    | Never falls back            | Real-time data (news, stock prices, live events)       |
| `"preferred"` | Always crawls    | Falls back on crawl failure | Production apps needing fresh content with reliability |
| `"fallback"`  | Only if no cache | Uses cache first            | Balanced speed and freshness                           |
| `"never"`     | Never crawls     | Always uses cache           | Maximum speed, historical/static content               |

## When LiveCrawl Isn't Necessary

Cached data is sufficient for many queries, especially for historical topics like "What were the major causes of World War II?" or educational content such as "How does photosynthesis work?" These subjects rarely change, so reliable cached results can provide accurate information quickly.

## Examples

### Company News

Using `"always"` ensures you get the freshest content. If you're tracking Apple's latest releases, you'll want a live view of their homepage:

<CodeGroup>
  ```bash cURL
  curl -X POST 'https://api.exa.ai/contents' \
    -H 'x-api-key: YOUR-EXA-API-KEY' \
    -H 'Content-Type: application/json' \
    -d '{
      "ids": ["https://www.apple.com"],
      "livecrawl": "always"
    }'
  ```

  ```python Python
  result = exa.get_contents(
      ["https://www.apple.com"],
      livecrawl="always"
  )
  ```

  ```typescript TypeScript
  const result = await exa.getContents(
      ["https://www.apple.com"],
      {
          livecrawl: "always"
      }
  );
  ```
</CodeGroup>

Output without LiveCrawl: Results here are slightly dated, mentioning a fall release (later in the year)

```Shell Shell
{
  "results": [
    {
      "id": "https://www.apple.com",
      "url": "https://www.apple.com/",
      "title": "Apple",
      "author": "",
      "text": "Apple Footer\n 1. Apple Intelligence will be available in beta on iPhone 15 Pro, iPhone 15 Pro Max, and iPad and Mac with M1 and later, with Siri and device language set to U.S. English, as part of iOS 18, iPadOS 18, and macOS Sequoia this fall.\n 2. Trade-in values will vary based on the condition, year, and configuration of your eligible trade-in device. Not all devices are eligible for credit. You must be at least 18 years old to be eligible to trade in for credit or for an Apple Gift Card. Trade-in value may be applied toward qualifying new device purchase, or added to an Apple Gift Card. Actual value awarded is based on receipt of a qualifying device matching the description provided when estimate was made. Sales tax may be assessed on full value of a new device purchase. In-store trade-in requires presentation of a valid photo ID (local law may require saving this information). Offer may not be available in all stores, and may vary between in-store and online trade-in. Some stores may have additional requirements. Apple or its trade-in partners reserve the right to refuse or limit quantity of any trade-in transaction for any reason. More details are available from Apple's trade-in partner for trade-in and recycling of eligible devices. Restrictions and limitations may apply. \nA subscription is required for Apple TV+.\nAvailable in the U.S. on apple.com, in the Apple Store app, and at Apple Stores.\nTo access and use all Apple Card features and products available only to Apple Card users, you must add Apple Card to Wallet on an iPhone or iPad that supports and has the latest version of iOS or iPadOS. Apple Card is subject to credit approval, available only for qualifying applicants in the United States, and issued by Goldman Sachs Bank USA, Salt Lake City Branch. \nIf you reside in the U.S. territories, please call Goldman Sachs at 877-255-5923 with questions about Apple Card.\nLearn more about how Apple Card applications are evaluated at support.apple.com/kb/HT209218.\n A subscription is required for Apple TV+. \n Major League Baseball trademarks and copyrights are used with permission of MLB Advanced Media, L.P. All rights reserved. \n A subscription is required for Apple Arcade, Apple Fitness+, and Apple Music. \nApple Store\n Find a Store \n Genius Bar \n Today at Apple \n Group Reservations \n Apple Camp \n Apple Store App \n Certified Refurbished \n Apple Trade In \n Financing \n Carrier Deals at Apple \n Order Status \n Shopping Help",
      "image": "https://www.apple.com/ac/structured-data/images/open_graph_logo.png?202110180743"
    }
  ],
  "requestId": "f60d0828916fb43401ed90cd3c11dd59"
}
```

Output with LiveCrawl (as at Oct 30 2024): Now we see contents talking about Apple's upcoming specific release on November 11th

```Shell Shell
{
  "results": [
    {
      "id": "https://www.apple.com",
      "url": "https://www.apple.com",
      "title": "Apple",
      "author": "",
      "publishedDate": "2024-10-30T16:34:14.000Z",
      "text": "Apple Intelligence is here.\nExperience it now on the latest iPhone, iPad, and Mac models with a free software update.1 \nMacBook Pro\nA work of smart.\nAvailable starting 11.8\n Hello, Apple Intelligence. \nApple Intelligence is here.\nExperience it now on the latest iPhone, iPad, and Mac models with a free software update.1 \nMac mini\nSize down. Power up.\nAvailable starting 11.8\n Hello, Apple Intelligence. \nApple Intelligence is here.\nExperience it now on the latest iPhone, iPad, and Mac models with a free software update.1 \niMac\nBril l l l l liant.\nAvailable starting 11.8\n Hello, Apple Intelligence. \niPhone 16 Pro\nHello, Apple Intelligence.\niPhone 16\nHello, Apple Intelligence.\nAirPods Pro 2\nHearing Test, Hearing Aid, and Hearing Protection features in a free software update.2\n Apple Intelligence \nAI for the rest of us.\n Apple Trade In \nGet $180-$650 in credit when you trade in iPhone 12 or higher.3 \n Apple Card \nGet up to 3% Daily Cash back with every purchase.\nApple TV+\nFAM Gallery",
      "image": "https://www.apple.com/ac/structured-data/images/open_graph_logo.png?202110180743"
    }
  ],
  "requestId": "fdb7df2ef400b5994b0c5a855875cdce"
}
```

### Production Applications

Using `"preferred"` provides fresh content with fallback reliability. This is ideal for production applications:

<CodeGroup>
  ```bash cURL
  curl -X POST 'https://api.exa.ai/contents' \
    -H 'x-api-key: YOUR-EXA-API-KEY' \
    -H 'Content-Type: application/json' \
    -d '{
      "ids": ["https://www.apple.com"],
      "livecrawl": "preferred"
    }'
  ```

  ```python Python
  result = exa.get_contents(
      ["https://www.apple.com"],
      livecrawl="preferred"
  )
  ```

  ```typescript TypeScript
  const result = await exa.getContents(
      ["https://www.apple.com"],
      {
          livecrawl: "preferred"
      }
  );
  ```
</CodeGroup>

This will try to get the freshest content available, but if live crawling fails (due to website downtime, network issues, etc.), it falls back to cached content instead of failing entirely. This makes it ideal for production applications.

# Exa Research

> Automate in-depth web research with structured output support.

## How It Works

The Research API is an **asynchronous, multi-step pipeline** that transforms open-ended questions into grounded reports. You provide natural-language instructions (e.g. *"Compare the hardware roadmaps of the top GPU manufacturers"*) and an optional JSON Schema describing the output you want.

Under the hood, Exa agents perform multiple steps:

1. **Planning** – Your natural-language `instructions` are parsed by an LLM that decomposes the task into one or more research steps.

2. **Searching** – Specialized search agents issue semantic and keyword queries to Exa's search engine, continuously expanding and refining the result set until they can fulfil the request.

3. **Reasoning & synthesis** – Reasoning models combine facts across sources and return structured JSON (if you provide `outputSchema`) or a detailed markdown report.

Because tasks are **asynchronous**, you submit a request and immediately receive a `researchId`. You can [poll the request](/reference/research/get-a-task) until it is complete or failed, or [list all tasks](/reference/research/list-tasks) to monitor progress in bulk.

## Best Practices

* **Be explicit** – Clear, scoped instructions lead to faster tasks and higher-quality answers. You should describe (1) what information you want (2) how the agent should find that information and (3) how the agent should compose it's final report.
* **Keep schemas small** – 1-5 root fields is the sweet spot. If you need more, create multiple tasks.
* **Use enums** – Tight schema constraints improve accuracy and reduce hallucinations.

## Models

The Research API offers two advanced agentic researcher models that break down your instructions, search the web, extract and reason over facts, and return structured answers with citations.

* **exa-research** (default) adapts to the difficulty of the task, using more or less compute for individual steps. Recommended for most use cases.
* **exa-research-pro** maximizes quality by using the highest reasoning capability for every step. Recommended for the most complex, multi-step research tasks.

Here are typical completion times for each model:

| Model            | p50 (seconds) | p90 (seconds) |
| ---------------- | ------------- | ------------- |
| exa-research     | 45            | 90            |
| exa-research-pro | 90            | 180           |

## Pricing

The Research API now uses **variable usage-based pricing**. You are billed based on how much work and reasoning the research agent does.

<Note>You are ONLY charged for tasks that complete successfully.</Note>

| Operation            | exa-research      | exa-research-pro   | Notes                                                |
| -------------------- | ----------------- | ------------------ | ---------------------------------------------------- |
| **Search**           | \$5/1k searches   | \$5/1k searches    | Each unique search query issued by the agent         |
| **Page read**        | \$5/1k pages read | \$10/1k pages read | One "page" = 1,000 tokens from the web               |
| **Reasoning tokens** | \$5/1M tokens     | \$5/1M tokens      | Specific LLM tokens used for reasoning and synthesis |

**Example:**\
A research task with `exa-research` that performs 6 searches, reads 20 pages of content, and uses 1,000 reasoning tokens would cost:

$$
\begin{array}{rl}
& \$0.03 \text{ (6 searches × \$5/1000)} \\
+ & \$0.10 \text{ (20 pages × \$5/1000)} \\
+ & \$0.005 \text{ (1{,}000 reasoning tokens × \$5/1{,}000{,}000)} \\
\hline
& \$0.135
\end{array}
$$

For `exa-research-pro`, the same task would cost:

$$
\begin{array}{rl}
& \$0.03 \text{ (6 searches × \$5/1000)} \\
+ & \$0.20 \text{ (20 pages × \$10/1000)} \\
+ & \$0.005 \text{ (1{,}000 reasoning tokens × \$5/1{,}000{,}000)} \\
\hline
& \$0.235
\end{array}
$$

## Examples

### Competitive Landscape Table

Compare the current flagship GPUs from NVIDIA, AMD, and Intel and extract pricing, TDP, and release date.

<CodeGroup>
  ```python Python
  import os
  from exa_py import Exa

  exa = Exa(os.environ["EXA_API_KEY"])

  instructions = "Compare the current flagship GPUs from NVIDIA, AMD and Intel. Return a table of model name, MSRP USD, TDP watts, and launch date. Include citations for each cell."
  schema = {
      "type": "object",
      "required": ["gpus"],
      "properties": {
          "gpus": {
              "type": "array",
              "items": {
                  "type": "object",
                  "required": ["manufacturer", "model", "msrpUsd", "tdpWatts", "launchDate"],
                  "properties": {
                      "manufacturer": {"type": "string"},
                      "model": {"type": "string"},
                      "msrpUsd": {"type": "number"},
                      "tdpWatts": {"type": "integer"},
                      "launchDate": {"type": "string"}
                  }
              }
          }
      },
      "additionalProperties": False
  }

  research = exa.research.create(
      model="exa-research",
      instructions=instructions,
      output_schema=schema
  )

  # Poll until completion
  result = exa.research.poll_until_finished(research.researchId)
  print(result)
  ```

  ```javascript JavaScript
  import Exa, { ResearchModel } from "exa-js";

  const exa = new Exa(process.env.EXA_API_KEY);

  async function compareGPUs() {
    const research = await exa.research.create({
      model: ResearchModel.exa_research,
      instructions:
        "Compare the current flagship GPUs from NVIDIA, AMD and Intel. Return a table of model name, MSRP USD, TDP watts, and launch date. Include citations for each cell.",
      outputSchema: {
        type: "object",
        required: ["gpus"],
        properties: {
          gpus: {
            type: "array",
            items: {
              type: "object",
              required: [
                "manufacturer",
                "model",
                "msrpUsd",
                "tdpWatts",
                "launchDate",
              ],
              properties: {
                manufacturer: { type: "string" },
                model: { type: "string" },
                msrpUsd: { type: "number" },
                tdpWatts: { type: "integer" },
                launchDate: { type: "string" },
              },
            },
          },
        },
        additionalProperties: false,
      },
    });

    // Poll until completion
    const result = await exa.research.pollUntilFinished(research.researchId);
    console.log("Research result:", result);
  }

  compareGPUs();
  ```

  ```bash Curl
  curl -X POST https://api.exa.ai/research/v1 \
    -H "x-api-key: $EXA_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
      "instructions": "Compare the current flagship GPUs from NVIDIA, AMD and Intel. Return a table of model name, MSRP USD, TDP watts, and launch date. Include citations for each cell.",
      "outputSchema": {
        "type": "object",
        "required": ["gpus"],
        "properties": {
          "gpus": {
            "type": "array",
            "items": {
              "type": "object",
              "required": ["manufacturer", "model", "msrpUsd", "tdpWatts", "launchDate"],
              "properties": {
                "manufacturer": {"type": "string"},
                "model": {"type": "string"},
                "msrpUsd": {"type": "number"},
                "tdpWatts": {"type": "integer"},
                "launchDate": {"type": "string"}
              }
            }
          }
        },
        "additionalProperties": false
      }
    }'
  ```
</CodeGroup>

### Market Size Estimate

Estimate the total global market size (USD) for battery recycling in 2030 with a clear methodology.

<CodeGroup>
  ```python Python
  import os
  from exa_py import Exa

  exa = Exa(os.environ["EXA_API_KEY"])

  instructions = "Estimate the global market size for battery recycling in 2030. Provide reasoning steps and cite sources."
  schema = {
      "type": "object",
      "required": ["estimateUsd", "methodology"],
      "properties": {
          "estimateUsd": {"type": "number"},
          "methodology": {"type": "string"}
      },
      "additionalProperties": False
  }

  research = exa.research.create(
      model="exa-research",
      instructions=instructions,
      output_schema=schema
  )

  # Poll until completion
  result = exa.research.poll_until_finished(research.researchId)
  print(result)
  ```

  ```javascript JavaScript
  import Exa, { ResearchModel } from "exa-js";

  const exa = new Exa(process.env.EXA_API_KEY);

  async function estimateMarketSize() {
    const research = await exa.research.create({
      model: ResearchModel.exa_research,
      instructions:
        "Estimate the global market size for battery recycling in 2030. Provide reasoning steps and cite sources.",
      outputSchema: {
        type: "object",
        required: ["estimateUsd", "methodology"],
        properties: {
          estimateUsd: { type: "number" },
          methodology: { type: "string" },
        },
        additionalProperties: false,
      },
    });

    // Poll until completion
    const result = await exa.research.pollUntilFinished(research.researchId);
    console.log("Research result:", result);
  }

  estimateMarketSize();
  ```

  ```bash Curl
  curl -X POST https://api.exa.ai/research/v1 \
    -H "x-api-key: $EXA_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
      "instructions": "Estimate the global market size for battery recycling in 2030. Provide reasoning steps and cite sources.",
      "outputSchema": {
        "type": "object",
        "required": ["estimateUsd", "methodology"],
        "properties": {
          "estimateUsd": {"type": "number"},
          "methodology": {"type": "string"}
        },
        "additionalProperties": false
      }
    }'
  ```
</CodeGroup>

### Timeline of Key Events

Build a timeline of major OpenAI product releases from 2015 – 2023.

<CodeGroup>
  ```python Python
  import os
  from exa_py import Exa

  exa = Exa(os.environ["EXA_API_KEY"])

  instructions = "Create a chronological timeline (year, month, brief description) of major OpenAI product releases from 2015 to 2023."
  schema = {
      "type": "object",
      "required": ["events"],
      "properties": {
          "events": {
              "type": "array",
              "items": {
                  "type": "object",
                  "required": ["date", "description"],
                  "properties": {
                      "date": {"type": "string"},
                      "description": {"type": "string"}
                  }
              }
          }
      },
      "additionalProperties": False
  }

  research = exa.research.create(
      model="exa-research",
      instructions=instructions,
      output_schema=schema
  )

  # Poll until completion
  result = exa.research.poll_until_finished(research.researchId)
  print(result)
  ```

  ```javascript JavaScript
  import Exa, { ResearchModel } from "exa-js";

  const exa = new Exa(process.env.EXA_API_KEY);

  async function createTimeline() {
    const research = await exa.research.create({
      model: ResearchModel.exa_research,
      instructions:
        "Create a chronological timeline (year, month, brief description) of major OpenAI product releases from 2015 to 2023.",
      outputSchema: {
        type: "object",
        required: ["events"],
        properties: {
          events: {
            type: "array",
            items: {
              type: "object",
              required: ["date", "description"],
              properties: {
                date: { type: "string" },
                description: { type: "string" },
              },
            },
          },
        },
        additionalProperties: false,
      },
    });

    // Poll until completion
    const result = await exa.research.pollUntilFinished(research.researchId);
    console.log("Research result:", result);
  }

  createTimeline();
  ```

  ```bash Curl
  curl -X POST https://api.exa.ai/research/v1 \
    -H "x-api-key: $EXA_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
      "instructions": "Create a chronological timeline (year, month, brief description) of major OpenAI product releases from 2015 to 2023.",
      "outputSchema": {
        "type": "object",
        "required": ["events"],
        "properties": {
          "events": {
            "type": "array",
            "items": {
              "type": "object",
              "required": ["date", "description"],
              "properties": {
                "date": {"type": "string"},
                "description": {"type": "string"}
              }
            }
          }
        },
        "additionalProperties": false
      }
    }'
  ```
</CodeGroup>

## FAQs

<AccordionGroup>
  <Accordion title="Who is the Research API for?">
    Product teams, analysts, researchers, and anyone who needs **structured answers** that require reading multiple web sources — without having to build their own search + scraping + LLM pipeline.
  </Accordion>

  <Accordion title="How is this different from the /answer endpoint?">
    `/answer` is designed for **single-shot Q\&A**. The Research API handles
    **long-running, multi-step investigations**. It's suitable for tasks that
    require complex reasoning over web data.
  </Accordion>

  <Accordion title="How long do tasks take?">
    Tasks generally complete in 20–40 seconds. Simple tasks that can be solved
    with few searches complete faster, while complex schema's targeting niche
    subjects may take longer.
  </Accordion>

  <Accordion title="What are best practices for writing instructions?">
    Be explicit about the objective and any constraints - Specify the **time
    range** or **types of sources** to consult if important - Use imperative verbs
    ("Compare", "List", "Summarize") - Keep it under 4096 characters
  </Accordion>

  <Accordion title="How large can my output schema be?">
    You must have ≤ 8 root fields. It must not be more than 5 fields deep.
  </Accordion>

  <Accordion title="What happens if my schema validation fails?">
    If your schema is not valid, an error will surface *before the task is
    created* with a message about what is invalid. You will not be charged for
    such requests.
  </Accordion>
</AccordionGroup>
