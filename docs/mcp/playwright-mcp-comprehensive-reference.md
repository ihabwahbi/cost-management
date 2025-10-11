# Playwright MCP Server - Comprehensive Reference Guide

**Based on Hands-on Testing and Exploration**  
**Date:** October 11, 2025  
**Environment:** WSL2 (Ubuntu on Windows)

---

## Table of Contents

1. [Overview](#overview)
2. [What is Playwright MCP?](#what-is-playwright-mcp)
3. [Configuration](#configuration)
4. [Available Tools](#available-tools)
5. [Tool-by-Tool Guide](#tool-by-tool-guide)
6. [Real-World Use Cases](#real-world-use-cases)
7. [Best Practices](#best-practices)
8. [Limitations & Known Issues](#limitations--known-issues)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The Playwright MCP (Model Context Protocol) server provides AI agents with browser automation capabilities through the Playwright library. It allows AI assistants to interact with web pages, test web applications, scrape data, and automate browser workflows—all through a comprehensive set of tools accessible via MCP.

### What Makes Playwright MCP Unique

1. **Full Browser Automation**: Control real browsers (Chromium, Firefox, WebKit) programmatically
2. **Accessibility-First**: Uses accessibility tree snapshots for reliable element interaction
3. **Multi-Tab Support**: Manage multiple browser tabs simultaneously
4. **Network & Console Monitoring**: Capture HTTP requests and console messages
5. **Screenshot & Visual Testing**: Take full-page or element-specific screenshots
6. **JavaScript Execution**: Run arbitrary JavaScript in the browser context

---

## What is Playwright MCP?

Playwright MCP is a local MCP server that runs Playwright browser automation through the `@playwright/mcp` npm package. It provides 23 tools that cover the full spectrum of browser automation needs:

- **Navigation**: Load pages, go back/forward
- **Interaction**: Click, type, fill forms, drag & drop
- **Inspection**: Take snapshots, screenshots, get console/network data
- **JavaScript**: Evaluate code in browser context
- **Tab Management**: Create, switch, close tabs

---

## Configuration

### OpenCode Configuration

The Playwright MCP server is configured in `/home/iwahbi/.config/opencode/opencode.json`:

```json
{
  "mcp": {
    "playwright": {
      "type": "local",
      "command": [
        "npx",
        "-y",
        "@playwright/mcp@latest"
      ],
      "enabled": true
    }
  },
  "tools": {
    "playwright_*": true
  }
}
```

### Key Configuration Points

- **Type**: `local` - Runs as a local process via npx
- **Command**: Uses npx to run `@playwright/mcp@latest` without requiring global installation
- **Auto-update**: `@latest` ensures you're always using the newest version
- **Tools**: All Playwright tools are enabled with the `playwright_*` glob pattern

---

## Available Tools

The Playwright MCP server provides 23 tools grouped into 6 categories:

| Category | Tools | Description |
|----------|-------|-------------|
| **Navigation** | `navigate`, `navigate_back` | Load URLs and navigate browser history |
| **Interaction** | `click`, `type`, `fill_form`, `hover`, `drag`, `select_option` | Interact with page elements |
| **Inspection** | `snapshot`, `take_screenshot`, `console_messages`, `network_requests` | Capture page state and debugging info |
| **Keyboard/Mouse** | `press_key`, `resize` | Low-level input control |
| **JavaScript** | `evaluate` | Execute JavaScript in browser context |
| **Dialogs** | `handle_dialog` | Respond to alert/confirm/prompt dialogs |
| **Files** | `file_upload` | Upload files to file inputs |
| **Tabs** | `tabs` | Manage browser tabs |
| **Browser** | `close`, `install` | Browser lifecycle management |

---

## Tool-by-Tool Guide

### 1. playwright_browser_navigate

**Purpose**: Navigate to a specific URL

**Parameters**:
```typescript
{
  url: string  // Full URL including protocol (https://)
}
```

**Response**:
```yaml
- Ran Playwright code (JavaScript snippet)
- Page state (URL, Title, Snapshot)
```

**Example**:
```javascript
await page.goto('https://example.com');
```

**Use Cases**:
- Load web applications for testing
- Scrape data from specific URLs
- Navigate between pages in automation workflows

**Tested Observations**:
- Automatically waits for page load
- Returns accessibility tree snapshot
- Works with HTTP and HTTPS URLs

---

### 2. playwright_browser_snapshot

**Purpose**: Capture accessibility tree representation of the page

**Parameters**: None

**Response**:
```yaml
- Page URL
- Page Title
- Page Snapshot (YAML accessibility tree)
- Console messages (if any new ones)
```

**Snapshot Format**:
```yaml
- generic [ref=e2]:
  - heading "Example Domain" [level=1] [ref=e3]
  - paragraph [ref=e4]: This domain is for use...
  - paragraph [ref=e5]:
    - link "Learn more" [ref=e6] [cursor=pointer]:
      - /url: https://iana.org/domains/example
```

**Use Cases**:
- Understand page structure before interaction
- Verify page content loaded correctly
- Get element references (`ref`) for interaction
- Accessibility testing

**Key Features**:
- **Element References**: Each element has a unique `ref` (e.g., `ref=e6`)
- **Semantic Structure**: Preserves HTML semantics (heading, link, button, etc.)
- **Accessibility Attributes**: Shows roles, states, and properties
- **Cursor Information**: Indicates clickable elements with `[cursor=pointer]`

---

### 3. playwright_browser_click

**Purpose**: Click on an element

**Parameters**:
```typescript
{
  element: string,    // Human-readable description
  ref: string,        // Element reference from snapshot (e.g., "e6")
  button?: "left" | "right" | "middle",  // Default: "left"
  doubleClick?: boolean,
  modifiers?: ["Alt" | "Control" | "Meta" | "Shift"]
}
```

**Example**:
```javascript
await page.getByRole('link', { name: 'Learn more' }).click();
```

**Use Cases**:
- Navigate by clicking links
- Submit forms via buttons
- Trigger JavaScript events
- Test interactive elements

**Tested Observations**:
- Automatically scrolls element into view
- Waits for element to be clickable
- Updates page state after click

---

### 4. playwright_browser_type

**Purpose**: Type text into an input element

**Parameters**:
```typescript
{
  element: string,    // Description of the element
  ref: string,        // Element reference
  text: string,       // Text to type
  slowly?: boolean,   // Type one character at a time
  submit?: boolean    // Press Enter after typing
}
```

**Example**:
```javascript
await page.getByRole('combobox', { name: 'Search' }).fill('playwright automation');
await page.getByRole('combobox', { name: 'Search' }).press('Enter');
```

**Use Cases**:
- Fill search boxes
- Enter form data
- Trigger autocomplete
- Submit forms with Enter key

**Tested Observations**:
- `submit: true` automatically presses Enter
- Works with text inputs, textareas, and contenteditable elements
- Triggers input events (useful for reactive UIs)

---

### 5. playwright_browser_fill_form

**Purpose**: Fill multiple form fields at once

**Parameters**:
```typescript
{
  fields: Array<{
    name: string,           // Field description
    ref: string,            // Element reference
    type: "textbox" | "checkbox" | "radio" | "combobox" | "slider",
    value: string           // Value to fill
  }>
}
```

**Use Cases**:
- Complete complex forms efficiently
- Fill registration forms
- Configure settings
- Automate repetitive form workflows

---

### 6. playwright_browser_evaluate

**Purpose**: Execute JavaScript in the browser context

**Parameters**:
```typescript
{
  function: string,   // JavaScript function as string
  element?: string,   // Optional: element description
  ref?: string        // Optional: element reference
}
```

**Example**:
```javascript
await page.evaluate('() => { 
  return { 
    title: document.title, 
    url: window.location.href,
    userAgent: navigator.userAgent 
  }; 
}');
```

**Response**:
```json
{
  "title": "playwright automation at DuckDuckGo",
  "url": "https://duckduckgo.com/?q=playwright+automation",
  "userAgent": "Mozilla/5.0 (X11; Linux x86_64)..."
}
```

**Use Cases**:
- Extract data from page
- Manipulate DOM directly
- Execute custom JavaScript logic
- Access browser APIs (localStorage, cookies, etc.)

**Tested Observations**:
- Can return JSON-serializable data
- Runs in page context (has access to all page variables)
- Function must be a string representation

---

### 7. playwright_browser_take_screenshot

**Purpose**: Capture screenshot of the page or specific element

**Parameters**:
```typescript
{
  element?: string,       // Optional: element to screenshot
  ref?: string,           // Optional: element reference
  filename?: string,      // Optional: custom filename
  type?: "png" | "jpeg",  // Default: "png"
  fullPage?: boolean      // Screenshot entire scrollable page
}
```

**Response**:
```
Saved to: /tmp/playwright-mcp-output/[session-id]/page-[timestamp].png
```

**Example Code**:
```javascript
await page.screenshot({
  path: '/tmp/playwright-mcp-output/.../page-2025-10-11T12-43-25.png',
  scale: 'css',
  type: 'png'
});
```

**Use Cases**:
- Visual regression testing
- Create documentation screenshots
- Capture error states
- Monitor UI changes

**Tested Observations**:
- Screenshots saved to `/tmp/playwright-mcp-output/` with session ID
- Can screenshot viewport or full page
- Supports element-specific screenshots

---

### 8. playwright_browser_console_messages

**Purpose**: Get all console messages from the page

**Parameters**:
```typescript
{
  onlyErrors?: boolean  // Filter to only show errors
}
```

**Response**:
```
[ERROR] Failed to load resource: 404 @ https://example.com/favicon.ico
[INFO] Slow network detected @ https://example.com:0
```

**Use Cases**:
- Debug JavaScript errors
- Monitor console warnings
- Capture application logs
- Verify expected console output

**Tested Observations**:
- Captures all console levels (log, info, warn, error)
- Includes source URLs
- Accumulates messages throughout the session

---

### 9. playwright_browser_network_requests

**Purpose**: Get all HTTP network requests made by the page

**Parameters**: None

**Response**:
```
[GET] https://example.com/ => [200] 
[GET] https://example.com/style.css => [200] OK
[GET] https://example.com/script.js => [200] OK
[GET] https://example.com/favicon.ico => [404] Not Found
```

**Use Cases**:
- Monitor API calls
- Debug failed requests
- Verify expected network behavior
- Audit external resource loading

**Tested Observations**:
- Shows HTTP method, URL, and status code
- Includes redirects (301, 302, 307)
- Captures all requests including XHR and Fetch

---

### 10. playwright_browser_navigate_back

**Purpose**: Navigate to the previous page in browser history

**Parameters**: None

**Example**:
```javascript
await page.goBack();
```

**Use Cases**:
- Return to previous page after clicking link
- Test browser back button functionality
- Navigate multi-page workflows

---

### 11. playwright_browser_resize

**Purpose**: Change browser viewport size

**Parameters**:
```typescript
{
  width: number,   // Width in pixels
  height: number   // Height in pixels
}
```

**Example**:
```javascript
await page.setViewportSize({ width: 800, height: 600 });
```

**Use Cases**:
- Test responsive designs
- Simulate different screen sizes
- Test mobile vs desktop layouts
- Capture screenshots at specific sizes

**Tested Observations**:
- Changes viewport immediately
- Does not require page reload
- Affects CSS media queries

---

### 12. playwright_browser_tabs

**Purpose**: Manage browser tabs

**Parameters**:
```typescript
{
  action: "list" | "new" | "close" | "select",
  index?: number  // For "close" or "select" actions
}
```

**Actions**:

| Action | Description | Example Response |
|--------|-------------|------------------|
| `list` | Show all open tabs | `- 0: (current) [Title] (URL)` |
| `new` | Create a new tab | Opens `about:blank` |
| `close` | Close a tab (or current if no index) | Tab closed |
| `select` | Switch to a specific tab by index | Switches to tab |

**Use Cases**:
- Test multi-tab workflows
- Compare pages side-by-side
- Automate tasks across multiple pages

**Tested Observations**:
- Tabs indexed from 0
- Current tab marked with `(current)`
- New tabs start at `about:blank`

---

### 13. playwright_browser_close

**Purpose**: Close the browser page

**Parameters**: None

**Example**:
```javascript
await page.close();
```

**Use Cases**:
- Clean up after automation
- End testing sessions
- Reset browser state

---

### 14. Additional Tools (Not Fully Tested)

The following tools are available but were not fully tested in this session:

- **playwright_browser_press_key**: Press keyboard keys
- **playwright_browser_hover**: Hover over elements
- **playwright_browser_drag**: Drag and drop elements
- **playwright_browser_select_option**: Select from dropdown menus
- **playwright_browser_file_upload**: Upload files
- **playwright_browser_handle_dialog**: Respond to JavaScript dialogs
- **playwright_browser_install**: Install Playwright browsers
- **playwright_browser_wait_for**: Wait for specific conditions

---

## Real-World Use Cases

### Use Case 1: Web Scraping

**Scenario**: Extract product information from an e-commerce site

```
1. navigate to product page
2. snapshot to see page structure
3. evaluate JavaScript to extract data
4. Return structured product data
```

**Benefits**:
- Handles JavaScript-rendered content
- Can interact with dynamic elements
- Captures network requests for API endpoints

---

### Use Case 2: Automated Testing

**Scenario**: Test a web application's login flow

```
1. navigate to login page
2. fill_form with username and password
3. click login button
4. snapshot to verify successful login
5. console_messages to check for errors
```

**Benefits**:
- Tests real browser behavior
- Captures console errors
- Verifies visual state

---

### Use Case 3: Visual Regression Testing

**Scenario**: Detect unwanted UI changes

```
1. navigate to page
2. take_screenshot (before changes)
3. Make code changes
4. navigate to page again
5. take_screenshot (after changes)
6. Compare screenshots
```

**Benefits**:
- Catches unintended visual changes
- Works across different screen sizes
- Can screenshot specific components

---

### Use Case 4: Form Automation

**Scenario**: Fill out repetitive web forms

```
1. navigate to form page
2. snapshot to get form fields
3. fill_form with all field data
4. click submit button
5. network_requests to verify submission
```

**Benefits**:
- Handles multi-field forms efficiently
- Works with various input types
- Verifies successful submission

---

### Use Case 5: Monitoring & Alerting

**Scenario**: Monitor a website for changes or errors

```
1. navigate to page
2. console_messages to check for errors
3. network_requests to verify API health
4. evaluate to extract specific data
5. Alert if errors or changes detected
```

**Benefits**:
- Detects runtime errors
- Monitors API failures
- Can run on a schedule

---

## Best Practices

### 1. Always Get a Snapshot First

Before interacting with a page, use `snapshot` to:
- Understand page structure
- Get element references (`ref` values)
- Verify page loaded correctly

### 2. Use Descriptive Element Names

When using `click`, `type`, etc., provide clear descriptions:
- ✅ Good: `"Search button in header"`
- ❌ Bad: `"button"`

This makes debugging easier and code more maintainable.

### 3. Wait for Page Loads

After navigation or interactions that trigger page loads:
- Use `snapshot` to verify new page loaded
- Check `console_messages` for JavaScript errors

### 4. Handle Dynamic Content

For JavaScript-heavy sites:
- Use `evaluate` to wait for specific elements
- Check `network_requests` to ensure API calls completed

### 5. Clean Up Resources

Always close browsers when done:
```
playwright_browser_close
```

### 6. Use Full URLs

Always include protocol in URLs:
- ✅ `https://example.com`
- ❌ `example.com`

### 7. Leverage Accessibility Tree

The snapshot's accessibility tree is more reliable than CSS selectors:
- Use `ref` values for element targeting
- Tests are less brittle when DOM changes

---

## Limitations & Known Issues

### 1. WSL2-Specific Considerations

**Issue**: Running in WSL2 (Linux subsystem on Windows)

**Impact**:
- Browser runs in headless mode (no GUI)
- Screenshots work but can't visually inspect browser
- Some Windows-specific features may not work

**Workaround**: This is actually ideal for automation and MCP usage

---

### 2. Temporary Output Directory

**Issue**: Screenshots saved to `/tmp/playwright-mcp-output/`

**Impact**:
- Files lost on system reboot
- Need to copy screenshots if you want to keep them

**Workaround**: Move important screenshots to permanent storage

---

### 3. Session-Based Browser

**Issue**: Browser state persists across tool calls within a session

**Impact**:
- Network requests and console messages accumulate
- Need to close and restart for clean state

**Workaround**: Use `close` to reset state when needed

---

### 4. Ref Values Change

**Issue**: Element `ref` values are session-specific

**Impact**:
- Can't hardcode ref values across sessions
- Must get fresh snapshot for each interaction sequence

**Workaround**: Always get a new snapshot when starting new automation

---

### 5. No Browser Installation Indicator

**Issue**: First run may take time to install browsers

**Impact**:
- Initial startup delay
- May appear frozen

**Workaround**: Be patient on first use; browsers are cached after

---

## Troubleshooting

### Problem: "No open tabs" Error

**Symptom**: Error when trying to use tools

**Cause**: Browser not initialized or was closed

**Solution**: Use `navigate` to load a page first

---

### Problem: Element Not Found

**Symptom**: Click or type fails

**Cause**: Stale `ref` value or element not visible

**Solution**:
1. Get fresh `snapshot`
2. Verify element is present
3. Check element is not in a hidden/collapsed section

---

### Problem: Slow Performance

**Symptom**: Tools taking long time to respond

**Cause**: Complex page with many elements

**Solution**:
1. Wait for page to fully load
2. Use `evaluate` for faster data extraction
3. Consider simpler CSS selectors if available

---

### Problem: Screenshots Not Found

**Symptom**: Can't locate screenshot files

**Cause**: Looking in wrong directory

**Solution**: Check `/tmp/playwright-mcp-output/[session-id]/` directory

---

### Problem: Console Messages Overwhelming

**Symptom**: Too many console messages

**Cause**: Page logs heavily

**Solution**: Use `onlyErrors: true` to filter

---

## Summary

The Playwright MCP server is a powerful tool for browser automation within AI-assisted workflows. It provides:

✅ **Complete Browser Control**: Navigate, interact, and extract data  
✅ **Accessibility-First**: Reliable element targeting via accessibility tree  
✅ **Debugging Tools**: Console messages, network requests, screenshots  
✅ **Multi-Tab Support**: Work with multiple pages simultaneously  
✅ **JavaScript Execution**: Full access to browser APIs

**Best For**:
- Web scraping dynamic content
- Automated testing of web applications
- Form automation
- Visual regression testing
- Website monitoring

**Not Ideal For**:
- Static page scraping (use simpler tools)
- Tasks requiring GUI interaction (headless only)
- Real-time user simulation (intended for automation)

**Key Takeaway**: Playwright MCP bridges the gap between AI assistance and browser automation, enabling AI agents to interact with the web as a human would, but programmatically.

---

## Appendix: Complete Tool List

| Tool | Purpose | Tested |
|------|---------|--------|
| `playwright_browser_navigate` | Load URL | ✅ |
| `playwright_browser_navigate_back` | Go back | ✅ |
| `playwright_browser_snapshot` | Get accessibility tree | ✅ |
| `playwright_browser_click` | Click element | ✅ |
| `playwright_browser_type` | Type text | ✅ |
| `playwright_browser_fill_form` | Fill multiple fields | ⚠️ (Available) |
| `playwright_browser_evaluate` | Run JavaScript | ✅ |
| `playwright_browser_take_screenshot` | Capture screenshot | ✅ |
| `playwright_browser_console_messages` | Get console logs | ✅ |
| `playwright_browser_network_requests` | Get HTTP requests | ✅ |
| `playwright_browser_resize` | Change viewport size | ✅ |
| `playwright_browser_tabs` | Manage tabs | ✅ |
| `playwright_browser_close` | Close browser | ✅ |
| `playwright_browser_press_key` | Press keyboard key | ⚠️ (Available) |
| `playwright_browser_hover` | Hover over element | ⚠️ (Available) |
| `playwright_browser_drag` | Drag and drop | ⚠️ (Available) |
| `playwright_browser_select_option` | Select dropdown | ⚠️ (Available) |
| `playwright_browser_file_upload` | Upload files | ⚠️ (Available) |
| `playwright_browser_handle_dialog` | Handle alerts/prompts | ⚠️ (Available) |
| `playwright_browser_install` | Install browsers | ⚠️ (Available) |
| `playwright_browser_wait_for` | Wait for conditions | ⚠️ (Available) |

**Legend**:
- ✅ Fully tested and working
- ⚠️ Available but not tested in this session

---

**Document Version**: 1.0  
**Last Updated**: October 11, 2025  
**Based On**: Hands-on testing in WSL2 environment with @playwright/mcp@latest
