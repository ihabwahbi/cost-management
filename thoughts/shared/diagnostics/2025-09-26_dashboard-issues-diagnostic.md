# Dashboard Issues - Diagnostic Report

---
date: "2025-09-26T10:00:00Z"
researcher: "DiagnosticsResearcher"
status: "diagnosis-complete"
ready_for: "design-phase"
severity: "High"
issue_type: "bug|ux"
component_verification:
  active_components: ["app/page.tsx", "components/app-shell.tsx", "components/ui/card.tsx", "app/projects/[id]/dashboard/page.tsx"]
  orphaned_components: ["dashboard-filters.tsx", "dashboard-skeleton.tsx", "debug-panel.tsx", "burn-rate-chart.tsx", "project-alerts.tsx"]
  anti_pattern_components: []
synthesis_sources:
  code_analysis: "complete"
  web_research: "complete"
  pattern_analysis: "complete"
  database_analysis: "not-applicable"
---

# Dashboard Static Data, Header Layout & UX Issues - Diagnostic Report

## Executive Summary
severity: High
impact_scope: Main landing page dashboard, header branding across all pages
root_cause: Static mock data on landing page, CSS overflow hiding header subtitle, limited data visualization
solution_confidence: high

## Issues Identified

### ISSUE-001: Static Mock Data on Landing Page
- **Severity**: High
- **Component**: `app/page.tsx`
- **Description**: Main dashboard displays hardcoded mock data instead of dynamic database values
- **Evidence**:
  - Type: code
  - Location: `app/page.tsx:10-21`
  - Detail: Static `dashboardMetrics` object with hardcoded values:
    ```typescript
    const dashboardMetrics = {
      unmappedPOs: 47,
      totalPOValue: 12450000,
      activeProjects: 8,
      budgetVariance: -2.3,
      // ... more static data
    }
    ```

### ISSUE-002: Header Title Wrapping and Subtitle Clipping
- **Severity**: Medium
- **Component**: `components/app-shell.tsx` and `app/globals.css`
- **Description**: Header title "Cost Management Hub" wraps to two lines, subtitle "For a Balanced Planet" is clipped
- **Evidence**:
  - Type: code
  - Location: `app/globals.css:241`
  - Detail: `.quisitiveBrand` has `overflow: hidden` causing subtitle to be clipped
  - Location: `components/app-shell.tsx:94-96`
  - Detail: Insufficient space allocation for title and subtitle in flex layout

### ISSUE-003: Limited Data Visualization on Dashboard
- **Severity**: Medium
- **Component**: `app/page.tsx`
- **Description**: Landing page lacks visual charts/graphs for data presentation
- **Evidence**:
  - Type: code
  - Location: `app/page.tsx:36-82`
  - Detail: Only text-based KPI cards, no charts or visualizations

## Priority Implementation Order

priority_fixes:
  1_critical:
    - issue_id: "ISSUE-001"
      fix_summary: "Replace static mock data with dynamic database queries"
      estimated_impact: "Displays real-time accurate data"
  2_high:
    - issue_id: "ISSUE-002"
      fix_summary: "Fix CSS overflow and flex layout for header"
      estimated_impact: "Professional appearance, full text visibility"
  3_medium:
    - issue_id: "ISSUE-003"
      fix_summary: "Add data visualization charts to landing dashboard"
      estimated_impact: "Enhanced UX with visual insights"

## Root Cause Analysis

causality_chain:
  symptom: "Dashboard shows static numbers, header text is cut off, lacks visual appeal"
  immediate_cause: "Hardcoded mock data, CSS overflow:hidden, no chart components"
  underlying_cause: "Landing page not connected to data services, restrictive CSS, minimal UI implementation"
  root_cause: "Initial prototype implementation not replaced with production-ready dynamic components"
  evidence_trail:
    - "app/page.tsx:10-21 - Static dashboardMetrics object"
    - "app/globals.css:241 - overflow: hidden on quisitiveBrand"
    - "app/page.tsx:36-82 - Only Card components, no charts"

## Component Verification

verification_results:
  checked: ["app/page.tsx", "components/app-shell.tsx", "components/dashboard/*", "app/projects/[id]/dashboard/page.tsx"]
  active: ["app/page.tsx", "components/app-shell.tsx", "components/ui/card.tsx", "kpi-card.tsx", "budget-timeline-chart.tsx", "spend-category-chart.tsx"]
  orphaned: ["dashboard-filters.tsx", "dashboard-skeleton.tsx", "debug-panel.tsx", "burn-rate-chart.tsx", "project-alerts.tsx"]
  anti_patterns: []

## Solutions Validated

### Solution 1: Dynamic Data Integration
- **Source**: Next.js Official Documentation
- **URL**: https://nextjs.org/learn/dashboard-app/fetching-data
- **Solution**: Use Server Components to fetch data directly from Supabase
- **Confidence**: high
- **Implementation Notes**: Follow existing patterns in `lib/dashboard-metrics.ts`

### Solution 2: CSS Flexbox Header Fix
- **Source**: MDN CSS Text Module
- **URL**: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_text
- **Solution**: Remove overflow:hidden, add proper flex properties
- **Confidence**: high
- **Implementation Notes**: Prevent text truncation with proper min-width and flex-shrink

### Solution 3: Chart Integration
- **Source**: Tremor Blocks & Recharts Examples
- **URL**: https://raw.githubusercontent.com/tremorlabs/tremor-blocks
- **Solution**: Add Recharts visualizations following existing patterns
- **Confidence**: high
- **Implementation Notes**: Use existing chart patterns from project dashboard

## Implementation Guidance

### Fix 1: Replace Static Data with Dynamic Fetching

**File**: `app/page.tsx`
**Line Range**: 1-194
**Change Type**: replace
**Current Code**:
```typescript
"use client"

import Link from "next/link"
import { AppShell } from "@/components/app-shell"
// ... imports

// Mock data for dashboard metrics
const dashboardMetrics = {
  unmappedPOs: 47,
  totalPOValue: 12450000,
  activeProjects: 8,
  budgetVariance: -2.3,
  // ...
}

export default function Dashboard() {
  return (
    <AppShell>
      <div className="p-6 space-y-8">
        {/* Static KPI cards using mock data */}
```

**Fixed Code**:
```typescript
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AppShell } from "@/components/app-shell"
import { createClient } from '@/lib/supabase/client'
// ... other imports

interface DashboardMetrics {
  unmappedPOs: number
  totalPOValue: number
  activeProjects: number
  budgetVariance: number
  recentActivity: any[]
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadDashboardMetrics()
  }, [])

  const loadDashboardMetrics = async () => {
    try {
      // Get unmapped POs count
      const { count: unmappedCount } = await supabase
        .from('po_line_items')
        .select('*', { count: 'exact', head: true })
        .is('po_mappings', null)

      // Get total PO value
      const { data: poData } = await supabase
        .from('po_line_items')
        .select('total_line_value')
      
      const totalPOValue = poData?.reduce((sum, item) => 
        sum + (Number(item.total_line_value) || 0), 0) || 0

      // Get active projects count
      const { count: projectCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      // Calculate average budget variance
      const { data: budgetData } = await supabase
        .from('cost_breakdown')
        .select('budget_cost')
      
      const { data: actualData } = await supabase
        .from('po_mappings')
        .select('mapped_amount')
      
      const totalBudget = budgetData?.reduce((sum, item) => 
        sum + (Number(item.budget_cost) || 0), 0) || 0
      const totalActual = actualData?.reduce((sum, item) => 
        sum + (Number(item.mapped_amount) || 0), 0) || 0
      const variance = totalBudget > 0 ? 
        ((totalActual - totalBudget) / totalBudget) * 100 : 0

      // Get recent activity (last 5 items)
      const { data: recentMappings } = await supabase
        .from('po_mappings')
        .select('*, po_line_items(po_number)')
        .order('created_at', { ascending: false })
        .limit(5)

      setMetrics({
        unmappedPOs: unmappedCount || 0,
        totalPOValue,
        activeProjects: projectCount || 0,
        budgetVariance: variance,
        recentActivity: formatRecentActivity(recentMappings || [])
      })
    } catch (error) {
      console.error('Error loading dashboard metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="p-6 space-y-8">
          <DashboardSkeleton />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="p-6 space-y-8">
        {/* Now using dynamic metrics */}
        {/* Rest of component with metrics?.unmappedPOs etc. */}
```

**Rationale**: Follows existing Supabase data fetching patterns from the codebase, provides real-time data

### Fix 2: Header CSS Layout Fix

**File**: `app/globals.css`
**Line Range**: 238-278
**Change Type**: replace
**Current Code**:
```css
.quisitiveBrand {
  min-width: 120px;
  height: 60px;
  overflow: hidden;
  display: -ms-flexbox;
  display: flex;
  -ms-flex-align: center;
  align-items: center;
  padding: 0 24px;
  -ms-flex: 1 1 0%;
  flex: 1 1 0%;
}
```

**Fixed Code**:
```css
.quisitiveBrand {
  min-width: 250px; /* Increased to prevent wrapping */
  min-height: 60px; /* Changed from fixed height */
  height: auto;     /* Allow height to expand */
  overflow: visible; /* Show all content */
  display: -ms-flexbox;
  display: flex;
  -ms-flex-align: center;
  align-items: center;
  padding: 0 24px;
  -ms-flex: 1 1 auto; /* Allow natural sizing */
  flex: 1 1 auto;
  gap: 12px; /* Add spacing between logo and text */
}

/* Add responsive text handling */
.quisitiveBrand h1 {
  white-space: nowrap; /* Prevent title wrapping */
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 1; /* Allow shrinking if needed */
}

.quisitiveBrand p {
  white-space: nowrap; /* Prevent subtitle wrapping */
  flex-shrink: 0; /* Don't shrink subtitle */
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .quisitiveBrand {
    min-width: 180px;
  }
  
  .quisitiveBrand h1 {
    font-size: 1rem;
  }
  
  .quisitiveBrand p {
    font-size: 0.75rem;
  }
}
```

**Rationale**: Fixes overflow issue, prevents text clipping, maintains responsive layout

### Fix 3: Add Data Visualization Components

**File**: `app/page.tsx`
**Line Range**: 83-148 (after KPI cards)
**Change Type**: add
**New Code to Add**:
```typescript
import { SpendCategoryChart } from '@/components/dashboard/spend-category-chart'
import { BudgetTimelineChart } from '@/components/dashboard/budget-timeline-chart'

// After KPI cards section, add:
{/* Data Visualization Section */}
<div className="grid gap-6 md:grid-cols-2">
  <Card>
    <CardHeader>
      <CardTitle>Spend by Category</CardTitle>
      <CardDescription>Distribution of spending across categories</CardDescription>
    </CardHeader>
    <CardContent>
      <SpendCategoryChart data={categoryData} />
    </CardContent>
  </Card>
  
  <Card>
    <CardHeader>
      <CardTitle>Budget Timeline</CardTitle>
      <CardDescription>Budget vs Actual over time</CardDescription>
    </CardHeader>
    <CardContent>
      <BudgetTimelineChart data={timelineData} />
    </CardContent>
  </Card>
</div>

// In loadDashboardMetrics, add data fetching for charts:
const categoryData = await getCategoryBreakdown(supabase)
const timelineData = await getTimelineData(supabase)
```

**Rationale**: Reuses existing chart components, provides visual insights on landing page

## Testing Scenarios

1. **Dynamic Data Test**:
   - Verify unmapped PO count matches database
   - Confirm total PO value calculation is correct
   - Check project count reflects active projects only

2. **Header Layout Test**:
   - Verify title doesn't wrap on desktop (1920x1080)
   - Confirm subtitle is fully visible
   - Test responsive behavior on mobile

3. **Chart Integration Test**:
   - Verify charts render with real data
   - Test chart responsiveness
   - Confirm tooltips and interactions work

## Migration Strategy

1. **Phase 1**: Fix header CSS (immediate, low risk)
2. **Phase 2**: Replace static data with dynamic queries (requires testing)
3. **Phase 3**: Add visualization components (enhancement, can be gradual)

## Performance Considerations

- Use React Suspense for data loading
- Implement caching for dashboard metrics (5 minute TTL)
- Consider parallel data fetching with Promise.all
- Add loading skeletons during data fetch

## Success Metrics

- Zero static/mock data on production dashboard
- Header text fully visible on all screen sizes
- At least 2 data visualization charts on landing page
- Page load time < 2 seconds with real data