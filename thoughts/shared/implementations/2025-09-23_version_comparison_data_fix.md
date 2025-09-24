---
date: 2025-09-23T20:00:00Z
implementer: ModernizationImplementer  
status: investigating
issue_type: data_accuracy
---

# Version Comparison Data Accuracy Issue

## Problem Description
When comparing versions, the visual data displayed doesn't match the actual differences between versions. The comparison shows incorrect values and differences.

## Root Cause Analysis

### Issue 1: Data Transformation Logic
The current implementation in `/app/projects/page.tsx` has several flaws:

1. **Using Current View Data**: It's using `costBreakdowns[showVersionComparison]` which contains the currently displayed version's data, not the original baseline data.

2. **Incomplete Item List**: When building comparison data, it only includes items that have forecasts in the `comparisonForecasts` object. Items that exist in cost_breakdown but have no forecast in a particular version are being excluded.

3. **Version 0 Handling**: For version 0, the code tries to use `costItem.budget_cost`, but this field might be overwritten if a different version is currently loaded.

### Issue 2: Data Loading Sequence
The `loadComparisonData` function correctly loads forecast data for both versions, but the transformation logic doesn't properly use this data.

## Solution Approach

### Option 1: Fix Data Transformation (Implemented)
Update the transformation logic to:
1. Build a complete list of ALL cost items from both versions
2. Use the comparisonForecasts data correctly
3. Include items with zero values (important for showing what was added/removed)

### Option 2: Create Dedicated Comparison Component
Create a new component that loads its own data directly from the database, ensuring:
1. Fresh data load every time
2. No dependency on current view state
3. Complete cost item list

## Implementation Details

### Fixed Transformation Logic
```javascript
// Build complete item list from BOTH versions
const allCostItemIds = new Set();
v1Forecasts.forEach(f => allCostItemIds.add(f.cost_breakdown_id));
v2Forecasts.forEach(f => allCostItemIds.add(f.cost_breakdown_id));

// Map each item with values from both versions
const v1CostLines = Array.from(allCostItemIds).map(itemId => {
  const forecast = v1Forecasts.find(f => f.cost_breakdown_id === itemId);
  return {
    costLineName: getCostItemName(itemId),
    totalCost: forecast?.forecasted_cost || 0
  };
});
```

### Key Points
1. Include ALL items from both versions, not just non-zero ones
2. Use forecast data from `comparisonForecasts`, not current view data  
3. Handle version 0 specially by using its forecasted_cost (which is budget_cost)
4. Maintain item names from original cost_breakdown table

## Verification Steps

1. Compare Version 0 to Version 2
   - Should show baseline values for v0
   - Should show updated values for v2
   - Differences should be accurate

2. Compare Version 1 to Version 2
   - Should show v1 forecast values
   - Should show v2 forecast values
   - No reference to v0 data

3. Items with zero values
   - Items removed in v2 should show as 0 in v2 column
   - Items added in v2 should show as 0 in v1 column

## Status
The transformation logic has been updated. Additional debugging logs have been added to verify the data being processed. If issues persist, Option 2 (dedicated component) may be needed for a complete fix.