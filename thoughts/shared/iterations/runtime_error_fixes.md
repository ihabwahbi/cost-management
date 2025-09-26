# Runtime Error Fix Requirements

---
date: "2025-09-26T16:00:00Z"
type: "implementation_fix"
iteration: "not_required"
---

## Issue Analysis

### 1. Font Loading Errors (404)
**Issue**: Fonts referenced as `/fonts/` in CSS but not served by Next.js
**Root Cause**: Font files are in root `fonts/` directory instead of `public/fonts/`
**Solution**: Move fonts to public directory OR update CSS to use proper font loading

### 2. Supabase Query Errors (400 Bad Request)
**Issue**: Multiple database queries returning 400 errors
**Root Causes**:
- Incorrect relationship checking: `.is('po_mappings', null)`
- Non-existent columns: `status` in `projects` table  
- Wrong join syntax in queries

## Required Fixes

### Fix 1: Font File Location
**Option A (Recommended)**: Move font files
```bash
# Move fonts to public directory
mv fonts/ public/fonts/
```

**Option B**: Update CSS to use proper Next.js font loading (requires more changes)

### Fix 2: Supabase Query Corrections

#### Query 1: Unmapped POs
**Current (Wrong):**
```typescript
.from('po_line_items')
.select('*', { count: 'exact', head: true })
.is('po_mappings', null)
```

**Corrected:**
```typescript
// Get PO line items that don't have mappings
.from('po_line_items')
.select(`
  *,
  po_mappings!left(id)
`, { count: 'exact', head: true })
.is('po_mappings.id', null)
```

#### Query 2: Active Projects
**Current (Wrong):**
```typescript
.from('projects')
.select('*', { count: 'exact', head: true })
.eq('status', 'active')
```

**Corrected:**
```typescript
// Remove status filter if column doesn't exist
.from('projects')
.select('*', { count: 'exact', head: true })
// Or use a different filter based on actual schema
```

#### Query 3: Recent Activity
**Current (Wrong):**
```typescript
.from('po_mappings')
.select(`
  *,
  po_line_items(po_number),
  cost_breakdown(
    projects(name)
  )
`)
```

**Corrected:**
```typescript
.from('po_mappings')
.select(`
  *,
  po_line_items!inner(po_number),
  cost_breakdown!inner(
    project_id,
    projects!inner(name)
  )
`)
```

#### Query 4: Cost Breakdown with Line Items
**Current (Wrong):**
```typescript
.from('cost_breakdown')
.select('cost_line_items,budget_cost')
.not('cost_line_items', 'is', null)
```

**Corrected:**
```typescript
// Use correct column name
.from('cost_breakdown')
.select('cost_line,budget_cost')
.not('cost_line', 'is', null)
```

## Implementation Checklist

- [ ] Move font files to public/fonts/ directory
- [ ] Fix unmapped POs query to use proper left join syntax
- [ ] Remove or fix projects status filter
- [ ] Fix po_mappings joins with proper !inner syntax
- [ ] Correct cost_breakdown column references
- [ ] Test all queries work without 400 errors
- [ ] Verify fonts load correctly

## Validation
After fixes:
1. No 404 errors for font files
2. No 400 errors from Supabase
3. Dashboard displays data correctly
4. Real-time updates functioning