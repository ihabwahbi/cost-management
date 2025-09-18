# Fix Project Cost Breakdown Errors Implementation Plan

## Overview

Fix critical errors occurring when creating projects and saving initial cost breakdown entries, ensuring data integrity between staged entries and the database RPC function.

## Current State Analysis

The system fails when saving initial cost breakdown entries after project creation. Analysis reveals:
- RPC function `create_initial_forecast` expects specific JSONB structure but receives malformed data
- Staged entries use temporary IDs that aren't properly cleaned before database insertion
- No validation of required fields before RPC calls
- Generic error handling masks specific failure reasons

## Desired End State

A robust project creation workflow where:
- Cost breakdown entries save successfully on first attempt
- Clear error messages guide users to fix issues
- Data validation prevents invalid submissions
- State remains consistent between UI and database

### Key Discoveries:
- RPC function at `scripts/create_initial_forecast_function.sql:38-42` expects specific JSONB fields
- Staged entries at `app/projects/page.tsx:514` include temporary IDs that break RPC parsing
- Error at `app/projects/page.tsx:277` assumes array response without validation
- State synchronization at `app/projects/page.tsx:524-527` causes UI/database mismatch

## What We're NOT Doing

- Changing the database schema
- Modifying the RPC function signature
- Adding new dependencies or libraries
- Implementing authentication (remains placeholder)
- Refactoring entire state management system

## Implementation Approach

Add comprehensive error logging first to identify exact failure points, then fix data structure issues, add validation, and implement proper error recovery with extensive testing.

## Phase 1: Enhanced Error Logging and Debugging

### Overview
Add detailed console logging to identify exact failure points and data structure issues.

### Changes Required:

#### 1. Enhanced RPC Error Logging
**File**: `app/projects/page.tsx`
**Changes**: Add detailed logging before and after RPC call

```typescript
// Line 268: Before RPC call
const saveInitialVersion = async (projectId: string) => {
  setSavingForecast(true)

  try {
    const stagedEntries = stagedNewEntries[projectId] || []

    // Add detailed logging
    console.log('=== SAVING INITIAL VERSION DEBUG ===')
    console.log('Project ID:', projectId)
    console.log('Number of staged entries:', stagedEntries.length)
    console.log('Staged entries structure:', JSON.stringify(stagedEntries, null, 2))

    if (stagedEntries.length === 0) {
      alert("No entries to save")
      return
    }

    // Log what we're sending to RPC
    const rpcPayload = {
      p_project_id: projectId,
      p_cost_entries: stagedEntries,
    }
    console.log('RPC Payload:', JSON.stringify(rpcPayload, null, 2))

    // Call RPC with enhanced error handling
    const { data, error } = await supabase.rpc("create_initial_forecast", rpcPayload)

    console.log('RPC Response - Data:', data)
    console.log('RPC Response - Error:', error)

    if (error) {
      console.error('RPC Error Details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      throw error
    }

    // Validate response structure
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.error('Unexpected RPC response format:', data)
      throw new Error('Invalid response format from RPC function')
    }

    const result = data[0]
    console.log('RPC Result:', result)

    if (!result.success) {
      console.error('RPC Function Failed:', result.message)
      throw new Error(result.message || 'RPC function returned failure')
    }
```

### Success Criteria:

#### Automated Verification:
- [x] Console logs show complete staged entry structure
- [x] RPC payload format is logged before sending
- [x] Error details include Supabase error codes

#### Manual Verification:
- [ ] Browser console shows detailed error information
- [ ] Can identify exact field causing RPC failure
- [ ] Temporary IDs visible in logged data

---

## Phase 2: Fix Data Structure for RPC

### Overview
Remove temporary IDs and ensure staged entries match expected JSONB structure.

### Changes Required:

#### 1. Clean Staged Entries Before RPC Call
**File**: `app/projects/page.tsx`
**Changes**: Remove temporary fields and validate structure

```typescript
// Line 268: Clean entries before sending to RPC
const saveInitialVersion = async (projectId: string) => {
  setSavingForecast(true)

  try {
    const stagedEntries = stagedNewEntries[projectId] || []

    if (stagedEntries.length === 0) {
      alert("No entries to save")
      return
    }

    // Clean staged entries - remove temporary IDs and validate structure
    const cleanedEntries = stagedEntries.map(entry => {
      // Remove temporary ID if it exists
      const { id, ...entryWithoutId } = entry

      // Ensure all required fields are present
      return {
        project_id: entryWithoutId.project_id || projectId,
        sub_business_line: entryWithoutId.sub_business_line || '',
        cost_line: entryWithoutId.cost_line || '',
        spend_type: entryWithoutId.spend_type || '',
        spend_sub_category: entryWithoutId.spend_sub_category || '',
        budget_cost: parseFloat(entryWithoutId.budget_cost) || 0
      }
    })

    console.log('Cleaned entries for RPC:', JSON.stringify(cleanedEntries, null, 2))

    // Call RPC with cleaned data
    const { data, error } = await supabase.rpc("create_initial_forecast", {
      p_project_id: projectId,
      p_cost_entries: cleanedEntries,
    })
```

#### 2. Fix Temporary ID Generation
**File**: `app/projects/page.tsx`
**Changes**: Use more robust temporary ID system

```typescript
// Line 514: Better temporary ID generation
const addNewCostEntry = async (newCost: NewCostEntry) => {
  setSavingNewCost(true)

  try {
    if (isInitialBudgetMode === newCost.project_id || isForecasting === newCost.project_id) {
      // Use UUID-like temporary ID to avoid conflicts
      const tempId = `temp_${crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`}`

      // Don't include the temp ID in the actual data structure
      const stagedEntry = {
        ...newCost,
        _tempId: tempId // Use underscore prefix to clearly mark as metadata
      }

      // Add to staged entries
      setStagedNewEntries((prev) => ({
        ...prev,
        [newCost.project_id]: [...(prev[newCost.project_id] || []), stagedEntry],
      }))
```

### Success Criteria:

#### Automated Verification:
- [x] No temporary IDs in RPC payload
- [x] All required fields present in cleaned entries
- [x] budget_cost properly parsed as number

#### Manual Verification:
- [ ] Can save initial entries without errors
- [ ] Cleaned data structure matches RPC expectations
- [ ] No duplicate temporary IDs generated

---

## Phase 3: Add Data Validation Layer

### Overview
Validate staged entries before attempting RPC call to catch issues early.

### Changes Required:

#### 1. Entry Validation Function
**File**: `app/projects/page.tsx`
**Changes**: Add validation before save

```typescript
// Add new validation function at line 256
const validateStagedEntries = (entries: any[]): { valid: boolean; errors: string[] } => {
  const errors: string[] = []

  entries.forEach((entry, index) => {
    // Check required fields
    if (!entry.cost_line || entry.cost_line.trim() === '') {
      errors.push(`Entry ${index + 1}: Cost line is required`)
    }
    if (!entry.spend_type || entry.spend_type.trim() === '') {
      errors.push(`Entry ${index + 1}: Spend type is required`)
    }
    if (!entry.spend_sub_category || entry.spend_sub_category.trim() === '') {
      errors.push(`Entry ${index + 1}: Spend sub-category is required`)
    }
    if (!entry.sub_business_line || entry.sub_business_line.trim() === '') {
      errors.push(`Entry ${index + 1}: Sub-business line is required`)
    }

    // Validate budget cost is a valid number
    const budgetCost = parseFloat(entry.budget_cost)
    if (isNaN(budgetCost) || budgetCost < 0) {
      errors.push(`Entry ${index + 1}: Budget cost must be a valid positive number`)
    }

    // Check for decimal precision (max 2 decimal places)
    if (entry.budget_cost && entry.budget_cost.toString().includes('.')) {
      const decimals = entry.budget_cost.toString().split('.')[1]
      if (decimals && decimals.length > 2) {
        errors.push(`Entry ${index + 1}: Budget cost can have maximum 2 decimal places`)
      }
    }
  })

  return {
    valid: errors.length === 0,
    errors
  }
}

// Line 268: Use validation before save
const saveInitialVersion = async (projectId: string) => {
  setSavingForecast(true)

  try {
    const stagedEntries = stagedNewEntries[projectId] || []

    if (stagedEntries.length === 0) {
      alert("No entries to save")
      setSavingForecast(false)
      return
    }

    // Validate entries before proceeding
    const validation = validateStagedEntries(stagedEntries)
    if (!validation.valid) {
      console.error('Validation errors:', validation.errors)
      alert(`Cannot save - validation errors:\n${validation.errors.join('\n')}`)
      setSavingForecast(false)
      return
    }
```

### Success Criteria:

#### Automated Verification:
- [x] Validation function catches missing required fields
- [x] Invalid numbers are detected
- [x] Decimal precision validated

#### Manual Verification:
- [ ] Clear validation error messages shown to user
- [ ] Cannot save with invalid data
- [ ] All validation rules enforced

---

## Phase 4: Improved Error Recovery

### Overview
Replace generic error handling with specific, actionable error messages.

### Changes Required:

#### 1. Specific Error Messages
**File**: `app/projects/page.tsx`
**Changes**: Better error handling with recovery options

```typescript
// Line 296: Enhanced error handling
} catch (error: any) {
  console.error("Error saving initial version:", error)

  // Provide specific error messages based on error type
  let userMessage = "Error saving initial version. "

  if (error?.code === 'PGRST202') {
    userMessage += "The database function is not available. Please contact support."
  } else if (error?.code === '23505') {
    userMessage += "An initial version already exists for this project."
  } else if (error?.code === '22P02') {
    userMessage += "Invalid data format. Please check all fields are filled correctly."
  } else if (error?.message?.includes('violates foreign key')) {
    userMessage += "Project reference is invalid. Please refresh and try again."
  } else if (error?.message) {
    userMessage += `Details: ${error.message}`
  } else {
    userMessage += "Please check your entries and try again."
  }

  alert(userMessage)

  // Don't clear staged entries on error - allow user to fix and retry
  // setStagedNewEntries((prev) => ({ ...prev, [projectId]: [] }))
} finally {
  setSavingForecast(false)
}
```

#### 2. Add Retry Mechanism
**File**: `app/projects/page.tsx`
**Changes**: Add retry capability for transient failures

```typescript
// Add retry utility function at line 95
const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      if (i === maxRetries - 1) throw error

      console.log(`Retry attempt ${i + 1} of ${maxRetries} after ${delay}ms`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  throw new Error('Max retries exceeded')
}

// Use retry for RPC call at line 270
const { data, error } = await retryOperation(
  () => supabase.rpc("create_initial_forecast", {
    p_project_id: projectId,
    p_cost_entries: cleanedEntries,
  }),
  3,
  1000
)
```

### Success Criteria:

#### Automated Verification:
- [x] Error codes properly mapped to messages
- [x] Retry mechanism attempts 3 times
- [x] Staged entries preserved on error

#### Manual Verification:
- [ ] Specific error messages help identify issues
- [ ] Can retry after fixing validation errors
- [ ] Network errors handled gracefully

---

## Phase 5: Comprehensive Testing Suite

### Overview
Create thorough manual test scenarios to verify all fixes work correctly.

### Manual Testing Steps:

#### Test Scenario 1: Basic Project Creation with Cost Breakdown
1. Navigate to Projects page
2. Click "New Project" button
3. Enter project name: "Test Project 1"
4. Select sub-business line
5. Save project
6. Click on the new project to expand
7. Click "Initial Budget" button
8. Add 3 cost breakdown entries with valid data
9. Click "Save Initial Version"
10. **Expected**: Success message, entries saved to database

#### Test Scenario 2: Validation Error Handling
1. Create a new project
2. Enter initial budget mode
3. Add entry with missing spend type
4. Try to save
5. **Expected**: Validation error listing missing field
6. Fix the error
7. Save again
8. **Expected**: Successful save

#### Test Scenario 3: Empty Entries Prevention
1. Create a new project
2. Enter initial budget mode
3. Don't add any entries
4. Try to save
5. **Expected**: "No entries to save" message
6. Add one entry
7. Save
8. **Expected**: Successful save

#### Test Scenario 4: Decimal Precision
1. Create a new project
2. Add cost entry with budget_cost = 1234.567
3. Try to save
4. **Expected**: Validation error about decimal places
5. Change to 1234.56
6. Save
7. **Expected**: Successful save

#### Test Scenario 5: Network Error Recovery
1. Create project with entries
2. Open DevTools Network tab
3. Set to Offline mode
4. Try to save
5. **Expected**: Network error with retry attempts
6. Go back online
7. Retry save
8. **Expected**: Successful save without data loss

#### Test Scenario 6: Duplicate Version Prevention
1. Create project with initial version
2. Try to create another initial version
3. **Expected**: Error message about existing version
4. Switch to forecast mode instead
5. **Expected**: Can create forecast versions

### Browser Console Checks:
```javascript
// Run these in console to verify state
// Check staged entries
console.log('Staged entries:', stagedNewEntries)

// Check if project has initial version
console.log('Has initial version:', hasInitialVersion)

// Check current mode
console.log('Initial budget mode:', isInitialBudgetMode)
console.log('Forecasting mode:', isForecasting)

// Verify no temporary IDs in database calls
// Monitor Network tab for RPC payload structure
```

### Success Criteria:

#### Automated Verification:
- [ ] All console.log statements show expected data
- [ ] No JavaScript errors in console
- [ ] Network tab shows clean RPC payloads

#### Manual Verification:
- [ ] All 6 test scenarios pass
- [ ] Error messages are specific and helpful
- [ ] Data saves correctly to database
- [ ] UI state remains consistent
- [ ] Can recover from errors without data loss

---

## Testing Strategy

### Unit Tests:
- Validation function with various input combinations
- Temporary ID generation uniqueness
- Data cleaning function correctness

### Integration Tests:
- Complete workflow from project creation to cost breakdown save
- Error recovery and retry mechanisms
- State synchronization between UI and database

### Manual Testing Steps:
1. Test happy path: Create project → Add entries → Save successfully
2. Test validation: Try saving with missing/invalid fields
3. Test error recovery: Simulate network failures and retry
4. Test edge cases: Empty entries, decimal precision, special characters
5. Test state consistency: Verify UI matches database after operations

## Performance Considerations

- Retry mechanism adds up to 3 seconds delay on failures
- Validation runs synchronously but is fast for typical entry counts
- Console logging should be removed or reduced in production

## Migration Notes

No database migration needed. Changes are frontend-only to fix data structure and validation issues.

## References

- Original issue: Project creation with cost breakdown saving fails
- Research document: `docs/research/2025-09-17_19-23-33_codebase_architecture.md`
- RPC function: `scripts/create_initial_forecast_function.sql`
- Main implementation: `app/projects/page.tsx:257-301`