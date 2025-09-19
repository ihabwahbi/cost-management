---
date: 2025-09-18T21:43:22+08:00
researcher: iwahbi
git_commit: a8efb0b6e9d817b5d80b40928907b7d5f8b83d33
branch: main
repository: cost-management-v0
topic: "Edit functionality not updating staged entries in Cost Breakdown"
tags: [research, codebase, bug, projects-page, cost-breakdown, state-management, staged-entries]
status: complete
last_updated: 2025-09-18
last_updated_by: iwahbi
---

# Research: Edit functionality not updating staged entries in Cost Breakdown

**Date**: 2025-09-18T21:43:22+08:00
**Researcher**: iwahbi
**Git Commit**: a8efb0b6e9d817b5d80b40928907b7d5f8b83d33
**Branch**: main
**Repository**: cost-management-v0

## Research Question
When following the flow in the projects page (Create New Project → Add Project Name → Select Sub Business Line → Create Project → Expand → Cost Breakdown → Create Initial Budget → Add New Entry → populate fields → Add Entry), editing an entry before clicking "Save Initial Budget" doesn't update the entry. The edit action appears to save but the values don't actually change.

## Summary
The root cause is that the `updateCostItem` function at line 561 in `app/projects/page.tsx` always attempts to update entries directly in the database, even for staged entries that only exist in memory with temporary IDs (prefixed with `temp_`). Since these entries don't exist in the database yet, the update silently fails. Additionally, the function never updates the `stagedNewEntries` state where these temporary entries are actually stored, causing edits to be lost.

## Detailed Findings

### The Bug Flow

#### 1. Initial Budget Mode Setup (`app/projects/page.tsx:929-932`)
When user clicks "Create Initial Budget":
```javascript
const startInitialBudgetMode = (projectId: string) => {
  setIsInitialBudgetMode(projectId)
  setStagedNewEntries((prev) => ({ ...prev, [projectId]: [] }))
}
```
- Sets the project into initial budget mode
- Initializes empty staged entries array for the project

#### 2. Adding New Entries (`app/projects/page.tsx:794-830`)
When user adds a new cost entry:
```javascript
if (isInitialBudgetMode === newCost.project_id || isForecasting === newCost.project_id) {
  // Use UUID-like temporary ID to avoid conflicts
  const tempId = `temp_${crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`}`
  
  const stagedEntry = {
    ...newCost,
    id: tempId,  // Keep for UI display
    _tempId: tempId // Use underscore prefix to clearly mark as metadata
  }
  
  // Add to staged entries
  setStagedNewEntries((prev) => ({
    ...prev,
    [newCost.project_id]: [...(prev[newCost.project_id] || []), stagedEntry],
  }))
  
  // Also add to current display for immediate feedback
  setCostBreakdowns((prev) => ({
    ...prev,
    [newCost.project_id]: [...(prev[newCost.project_id] || []), stagedEntry],
  }))
}
```
- Creates a temporary ID with `temp_` prefix
- Stores entry in both `stagedNewEntries` (for persistence) and `costBreakdowns` (for display)

#### 3. Editing Staged Entries - The Problem (`app/projects/page.tsx:561-594`)
When user edits a staged entry:
```javascript
const updateCostItem = async (costItem: CostBreakdown) => {
  setSavingCosts((prev) => new Set(prev).add(costItem.id))
  
  try {
    // BUG: This always attempts database update, even for temp IDs
    const { error } = await supabase
      .from("cost_breakdown")
      .update({
        sub_business_line: costItem.sub_business_line,
        cost_line: costItem.cost_line,
        spend_type: costItem.spend_type,
        spend_sub_category: costItem.spend_sub_category,
        budget_cost: costItem.budget_cost,
      })
      .eq("id", costItem.id)  // Tries to match temp_* ID in database
    
    if (error) throw error
    
    // Only updates display state, not staged entries
    setCostBreakdowns((prev) => ({
      ...prev,
      [costItem.project_id]:
        prev[costItem.project_id]?.map((cost) => (cost.id === costItem.id ? costItem : cost)) || [],
    }))
    
    // MISSING: No update to stagedNewEntries state!
  } catch (error) {
    console.error("Error updating cost item:", error)
  } finally {
    setSavingCosts((prev) => {
      const newSet = new Set(prev)
      newSet.delete(costItem.id)
      return newSet
    })
  }
}
```

### State Management Architecture

#### State Variables Involved
- `costBreakdowns` (line 58): Display state for all cost items
- `stagedNewEntries` (line 89): Storage for entries not yet saved to database
- `editingCost` (line 59): ID of currently editing item
- `editingValues` (line 60): Temporary values during edit
- `isInitialBudgetMode` (line 90): Tracks if in initial budget creation mode

#### The Dual State Problem
The system maintains two separate states:
1. **Display State** (`costBreakdowns`): What the user sees in the UI
2. **Persistence State** (`stagedNewEntries`): What gets saved to database

When editing, only the display state gets updated, not the persistence state.

### Database Schema (`scripts/001_create_projects_tables.sql`)
The `cost_breakdown` table structure:
```sql
CREATE TABLE cost_breakdown (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  sub_business_line TEXT,
  cost_line TEXT,
  spend_type TEXT,
  spend_sub_category TEXT,
  budget_cost NUMERIC(15, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
- Primary key is UUID, not string
- Cannot accept `temp_*` prefixed IDs
- Foreign key constraint requires valid project_id

### Validation and Cleanup Functions

#### Entry Validation (`app/projects/page.tsx:112-144`)
```javascript
const validateDatabaseEntry = (entry: any): void => {
  const invalidFields: string[] = []
  
  if ('id' in entry && typeof entry.id === 'string' && entry.id.startsWith('temp_')) {
    invalidFields.push('id (temporary)')
  }
  
  if ('_tempId' in entry) {
    invalidFields.push('_tempId')
  }
  
  // Check for any fields starting with underscore
  Object.keys(entry).forEach(key => {
    if (key.startsWith('_')) {
      invalidFields.push(key)
    }
  })
  
  if (invalidFields.length > 0) {
    throw new Error(`Cannot save entry with temporary fields: ${invalidFields.join(', ')}`)
  }
}
```

#### Cleanup Process (`app/projects/page.tsx:147-167`)
```javascript
const cleanEntryForDatabase = (entry: any, projectId: string): any => {
  // Remove all temporary fields
  const { id, _tempId, ...cleanEntry } = entry
  
  // Ensure all required fields have proper values
  const finalEntry = {
    project_id: cleanEntry.project_id || projectId,
    sub_business_line: cleanEntry.sub_business_line || '',
    cost_line: cleanEntry.cost_line || '',
    spend_type: cleanEntry.spend_type || '',
    spend_sub_category: cleanEntry.spend_sub_category || '',
    budget_cost: typeof cleanEntry.budget_cost === 'number'
      ? cleanEntry.budget_cost
      : parseFloat(cleanEntry.budget_cost) || 0
  }
  
  // Validate before returning
  validateDatabaseEntry(finalEntry)
  
  return finalEntry
}
```

## Code References
- `app/projects/page.tsx:561-594` - The broken `updateCostItem` function
- `app/projects/page.tsx:788-792` - `saveEditing` function that calls updateCostItem
- `app/projects/page.tsx:778-781` - `startEditing` function that initiates edit mode
- `app/projects/page.tsx:1236-1319` - Edit form UI rendering
- `app/projects/page.tsx:1342` - Edit button click handler
- `app/projects/page.tsx:794-830` - Adding new staged entries
- `app/projects/page.tsx:374-553` - `saveInitialVersion` function that properly saves staged entries
- `app/projects/page.tsx:112-144` - Validation logic for database entries
- `app/projects/page.tsx:147-167` - Cleanup logic for removing temporary fields
- `scripts/001_create_projects_tables.sql:12-27` - Database schema for cost_breakdown table

## Architecture Insights

### Design Patterns Found
1. **Temporary ID Pattern**: Uses `temp_` prefix to distinguish unsaved entries
2. **Dual State Management**: Maintains separate display and persistence states
3. **Validation-First Approach**: Validates entries before database operations
4. **Metadata Field Convention**: Uses underscore prefix for temporary/metadata fields
5. **Cleanup Before Save**: Removes temporary fields before database insertion

### Missing Functionality
The `updateCostItem` function needs to:
1. Check if the entry is staged (has temp ID)
2. Update `stagedNewEntries` for temp entries instead of database
3. Only perform database operations for persisted entries

## Root Causes

### Primary Cause
The `updateCostItem` function doesn't differentiate between staged (temporary) and persisted (database) entries. It always attempts to update the database, which fails silently for entries with temporary IDs that don't exist in the database.

### Secondary Causes
1. **Missing State Sync**: The function never updates `stagedNewEntries` state where staged entries are stored
2. **Silent Failure**: Database update failures don't produce user-visible errors
3. **No Branching Logic**: No conditional logic to handle temp vs real entries differently

## Recommended Fix

The `updateCostItem` function should be modified to handle staged entries:

```javascript
const updateCostItem = async (costItem: CostBreakdown) => {
  setSavingCosts((prev) => new Set(prev).add(costItem.id))

  try {
    // Check if this is a staged entry
    if (costItem.id && costItem.id.startsWith('temp_')) {
      // Update staged entries state
      setStagedNewEntries((prev) => ({
        ...prev,
        [costItem.project_id]: prev[costItem.project_id]?.map((entry) =>
          entry.id === costItem.id ? costItem : entry
        ) || [],
      }))
      
      // Update display state
      setCostBreakdowns((prev) => ({
        ...prev,
        [costItem.project_id]:
          prev[costItem.project_id]?.map((cost) => (cost.id === costItem.id ? costItem : cost)) || [],
      }))
    } else {
      // Only update database for persisted entries
      const { error } = await supabase
        .from("cost_breakdown")
        .update({
          sub_business_line: costItem.sub_business_line,
          cost_line: costItem.cost_line,
          spend_type: costItem.spend_type,
          spend_sub_category: costItem.spend_sub_category,
          budget_cost: costItem.budget_cost,
        })
        .eq("id", costItem.id)

      if (error) throw error

      setCostBreakdowns((prev) => ({
        ...prev,
        [costItem.project_id]:
          prev[costItem.project_id]?.map((cost) => (cost.id === costItem.id ? costItem : cost)) || [],
      }))
    }

    setEditingCost(null)
    setEditingValues(null)
  } catch (error) {
    console.error("Error updating cost item:", error)
    alert("Failed to update cost item. Please try again.")
  } finally {
    setSavingCosts((prev) => {
      const newSet = new Set(prev)
      newSet.delete(costItem.id)
      return newSet
    })
  }
}
```

## Additional Considerations

### Delete Function Issue
The `deleteCostEntry` function (lines 833-852) has the same problem - it tries to delete from database even for temporary entries. It should also check for temp IDs and remove from `stagedNewEntries` instead.

### Testing Recommendations
1. Test editing staged entries before saving initial budget
2. Test editing mix of staged and persisted entries
3. Test canceling edits on staged entries
4. Test deleting staged entries
5. Verify staged edits persist through save

## Open Questions
1. Should there be visual indication that an entry is staged vs persisted?
2. Should users be warned when editing staged entries?
3. Should the delete function also be fixed for staged entries?
4. Should there be a batch update option for multiple staged entries?