---
date: 2025-09-23T14:30:00Z
researcher: DiagnosticsResearcher
status: diagnosis-complete
ready_for: design-phase
synthesis_sources:
  - web_research: complete
  - code_analysis: complete
  - pattern_analysis: complete
  - database_analysis: complete
severity: high
issue_type: data_accuracy_and_ux
---

# Budget Version Comparison Diagnostic Report

## Executive Summary

The budget version comparison feature exhibits critical data accuracy issues when comparing non-sequential versions (e.g., version 0 to version 2), resulting in NaN values, incorrect status indicators, and zero values being displayed. Additionally, the current modal-based UI creates a cramped, poor user experience. Root causes have been identified in the data aggregation logic, null handling, and UI architecture.

## Issues Identified

### 1. Data Accuracy Problems

**Symptoms:**
- NaN values appearing in percentage change calculations
- All items showing 0 values when comparing version 0 to version 2
- Status incorrectly showing "changed" for items with no actual change
- Division by zero errors in percentage calculations

**Evidence from Shell Crux Project:**
```
Sub Business Line  Cost Line  Spend Type  Version 0 Cost  Version 2 Cost  Difference  % Change  Status
WIS               M&S        Operational  0              0              NaN        N/A       unchanged
WIS               M&S        Operational  0              0              NaN        N/A       changed
```

**Actual Database Values:**
- ACTive Parts: v0=$350,000 → v2=$350,000 (should show unchanged)
- CRIP M&S: v0=$900,000 → v2=$900,000 (should show unchanged)
- Drums: v0=$100,000 → v2=$370,000 (should show 270% increase)
- Strings: v0=$400,000 → v2=$450,000 (should show 12.5% increase)

### 2. UX/UI Problems

**Current State:**
- Version comparison confined to a modal dialog
- Cramped layout with insufficient space for data visualization
- Poor information hierarchy
- Limited screen real estate for complex comparisons

## Root Cause Analysis

### Primary Root Cause: Incorrect Data Mapping Logic

**Location:** `/components/version-comparison-worldclass.tsx:187-307`

The comparison logic fails when comparing non-sequential versions because:

1. **Version 0 Special Handling Issue** (lines 187-202):
```typescript
if (version1 === 0) {
  costBreakdowns.forEach(cost => {
    comparisonMap.set(cost.id, {
      v1_amount: cost.budget_cost,
      v2_amount: null,  // ← Problem: Sets v2 to null initially
      status: "removed", // ← Problem: Wrong default status
    })
  })
}
```

2. **Missing Data Validation** (lines 326-331):
```typescript
totalV1 += item.v1_amount || 0  // Can still produce NaN if item is malformed
totalV2 += item.v2_amount || 0
const changePercent = totalV1 > 0 ? (totalChange / totalV1) * 100 : 0
// Missing: Check if values are actually numbers
```

3. **Export Function Property Mismatch** (lines 438-443):
```typescript
// Uses wrong property names
item.version1_cost && item.version2_cost  // Should be v1_amount, v2_amount
  ? ((item.version2_cost - item.version1_cost) / item.version1_cost * 100)
  : "N/A"
```

### Secondary Root Cause: Database Query Logic

**Location:** `/app/projects/page.tsx:669-741`

The data loading function doesn't properly handle the relationship between:
- `cost_breakdown` table (version 0 baseline data)
- `budget_forecasts` table (version-specific forecasts)
- Missing forecast records for some items in non-sequential versions

### Tertiary Root Cause: UI Architecture Constraints

The modal-based approach limits the ability to:
- Display comprehensive comparisons
- Show multiple visualizations side-by-side
- Provide proper context and navigation

## Validated Solutions

### Solution 1: Defensive NaN Handling

**Source:** Mozilla Developer Network, Stack Overflow (validated)
**Implementation Pattern from:** `/lib/dashboard-metrics.ts`

```typescript
// Before calculation - validate all inputs
const safeV1 = Number.isFinite(item.v1_amount) ? item.v1_amount : 0;
const safeV2 = Number.isFinite(item.v2_amount) ? item.v2_amount : 0;

// Safe division pattern
const changePercent = safeV1 > 0 
  ? ((safeV2 - safeV1) / safeV1) * 100 
  : safeV2 > 0 ? 100 : 0;

// Prevent NaN propagation
const displayValue = Number.isNaN(changePercent) ? 0 : changePercent;
```

### Solution 2: Correct Version Comparison Logic

**Fix Location:** `/components/version-comparison-worldclass.tsx:224-290`

```typescript
// Process version 2 data correctly for non-sequential comparisons
if (version2 > 0) {
  // For each forecast in v2, update or create entry
  v2Forecasts.forEach(forecast => {
    const existing = comparisonMap.get(forecast.cost_breakdown_id);
    if (existing) {
      existing.v2_amount = forecast.forecasted_cost;
      // Correct status determination
      if (existing.v1_amount === existing.v2_amount) {
        existing.status = "unchanged";
      } else if (existing.v1_amount && existing.v2_amount) {
        existing.status = "changed";
      } else if (!existing.v1_amount && existing.v2_amount) {
        existing.status = "added";
      }
    } else {
      // New item in v2
      comparisonMap.set(forecast.cost_breakdown_id, {
        v1_amount: null,
        v2_amount: forecast.forecasted_cost,
        status: "added"
      });
    }
  });
}

// Handle items only in v1 (removed in v2)
comparisonMap.forEach((value, key) => {
  if (value.v2_amount === null && value.v1_amount !== null) {
    value.status = "removed";
  }
});
```

### Solution 3: Full-Page Comparison Layout

**Best Practice Sources:** GitHub, Figma, Google Docs
**Implementation Pattern:** Split-screen with synchronized scrolling

```typescript
// New route-based approach
// Route: /projects/[id]/compare?v1=0&v2=2

export function VersionComparisonPage() {
  return (
    <div className="h-screen flex flex-col">
      {/* Fixed header with version selectors */}
      <header className="h-16 border-b px-6 flex items-center justify-between">
        <h1>Budget Version Comparison</h1>
        <div className="flex gap-4">
          <VersionSelector label="Version 1" value={v1} onChange={setV1} />
          <VersionSelector label="Version 2" value={v2} onChange={setV2} />
        </div>
      </header>
      
      {/* Split view content */}
      <div className="flex-1 flex">
        {/* Version 1 Panel */}
        <div className="flex-1 border-r overflow-auto p-6">
          <VersionPanel version={v1} data={v1Data} />
        </div>
        
        {/* Version 2 Panel with diff highlighting */}
        <div className="flex-1 overflow-auto p-6">
          <VersionPanel version={v2} data={v2Data} highlights={changes} />
        </div>
      </div>
      
      {/* Summary bar */}
      <footer className="h-20 border-t px-6 flex items-center">
        <SummaryMetrics total1={total1} total2={total2} change={change} />
      </footer>
    </div>
  );
}
```

## Implementation Guidance for Phase 4

### Critical Code Changes Required

1. **Fix NaN Generation** (`/components/version-comparison-worldclass.tsx`):
   - Line 326-327: Add Number.isFinite() validation
   - Line 331: Implement safe division pattern
   - Line 438-443: Fix property name references

2. **Fix Data Loading** (`/app/projects/page.tsx`):
   - Line 677-693: Improve version 0 data transformation
   - Line 706-721: Add null checking for forecast data
   - Line 232-239: Fix status determination logic

3. **Implement UI Improvements**:
   - Create new route `/projects/[id]/compare`
   - Remove modal-based comparison
   - Implement split-screen layout
   - Add synchronized scrolling
   - Use inline diff highlighting

### Testing Scenarios

1. **Non-Sequential Version Comparison**:
   - Compare version 0 to version 2
   - Verify all values display correctly
   - Check percentage calculations

2. **Edge Cases**:
   - Items only in version 0
   - Items only in later versions
   - Items with zero values
   - Items with null values

3. **UI Testing**:
   - Test on different screen sizes
   - Verify synchronized scrolling
   - Check filter persistence

## Patterns to Adopt from Codebase

### From `/lib/dashboard-metrics.ts`:
```typescript
const total = data?.reduce((sum, item) => sum + (Number(item.value) || 0), 0) || 0;
```

### From `/components/dashboard/burn-rate-chart.tsx`:
```typescript
const percentage = actual > 0 ? (actual / budget) * 100 : 0;
```

### From `/components/budget-comparison.tsx`:
```typescript
<Progress value={Math.min(percentage, 100)} />
```

## External References

1. **NaN Handling**: 
   - Mozilla Developer Network: [NaN Documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NaN)
   - Stack Overflow: [JavaScript reduce with undefined values](https://stackoverflow.com/questions/48606852)

2. **UI Best Practices**:
   - Eleken: [Modal UX Best Practices](https://www.eleken.co/blog-posts/modal-ux)
   - Userpilot: [UI Examples and Patterns](https://userpilot.com/blog/ui-examples/)
   - RIB Software: [BI Dashboard Design Principles](https://www.rib-software.com/en/blogs/bi-dashboard-design-principles-best-practices)

3. **Version Control UI**:
   - GitHub diff view patterns
   - Google Docs version history
   - Figma version control interface

## Priority Implementation Order

1. **[CRITICAL]** Fix NaN generation in calculations
2. **[CRITICAL]** Correct version data mapping logic  
3. **[HIGH]** Fix status determination for unchanged items
4. **[HIGH]** Implement full-page comparison layout
5. **[MEDIUM]** Add synchronized scrolling
6. **[MEDIUM]** Implement inline diff highlighting
7. **[LOW]** Add export functionality for comparisons

## Monitoring & Validation

After implementation, monitor for:
- NaN values in production logs
- User engagement with new UI
- Performance metrics for large comparisons
- Error rates in version data loading

## Summary

The version comparison feature requires immediate fixes to its data aggregation logic and a complete UI redesign. The root causes are well-understood, solutions are validated from authoritative sources, and implementation patterns exist within the codebase. Phase 4 implementation should prioritize data accuracy fixes first, then proceed with UI improvements for a comprehensive solution.