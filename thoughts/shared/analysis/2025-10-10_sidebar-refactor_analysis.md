# Sidebar Component Refactoring Analysis

**Date**: 2025-10-10  
**Phase**: 3.1 - God Component Elimination  
**Target**: sidebar.tsx (726 lines → 6 modular files)

---

## Current State

- **File**: `apps/web/components/ui/sidebar.tsx`
- **Lines**: 726
- **Violation**: 326 lines over limit (182% of maximum)
- **Pattern**: shadcn/ui vendor library style (monolithic component library)
- **Exports**: 25 components + 1 hook + constants

---

## Component Inventory

### Context Layer (Lines 28-54) - ~27 lines
- Constants (SIDEBAR_COOKIE_NAME, SIDEBAR_WIDTH, etc.)
- SidebarContextProps type definition
- SidebarContext creation
- useSidebar hook

### Provider Layer (Lines 56-152) - ~97 lines
- SidebarProvider component
- State management (open/collapsed)
- Cookie persistence
- Keyboard shortcuts
- Mobile handling

### Core Components (Lines 154-305) - ~152 lines
- Sidebar (main container with variants)
- SidebarTrigger (toggle button)
- SidebarRail (resize handle)

### Layout Components (Lines 307-382) - ~76 lines
- SidebarInset (main content wrapper)
- SidebarInput (search input)
- SidebarHeader (top section)
- SidebarFooter (bottom section)
- SidebarSeparator (divider)
- SidebarContent (scrollable content)

### Group Components (Lines 385-451) - ~67 lines
- SidebarGroup (section container)
- SidebarGroupLabel (section title)
- SidebarGroupAction (section action button)
- SidebarGroupContent (section content wrapper)

### Menu Components (Lines 454-699) - ~246 lines
- SidebarMenu (navigation list)
- SidebarMenuItem (list item)
- sidebarMenuButtonVariants (CVA styling)
- SidebarMenuButton (clickable item with tooltip)
- SidebarMenuAction (item action button)
- SidebarMenuBadge (item badge)
- SidebarMenuSkeleton (loading state)
- SidebarMenuSub (submenu)
- SidebarMenuSubItem (submenu item)
- SidebarMenuSubButton (submenu button)

### Exports (Lines 701-726) - ~26 lines
- Named exports for all components

---

## Proposed Split Strategy

6 files organized by responsibility:

### 1. `sidebar-context.tsx` (~60 lines)
**Responsibility**: Context + hook + constants  
**Exports**: SidebarContext, useSidebar, constants  
**Dependencies**: None

```
- SIDEBAR_* constants (8 lines)
- SidebarContextProps type (9 lines)
- SidebarContext creation (1 line)
- useSidebar hook (10 lines)
- Exports (5 lines)
```

### 2. `sidebar-provider.tsx` (~110 lines)
**Responsibility**: Provider with state management  
**Exports**: SidebarProvider  
**Dependencies**: sidebar-context.tsx, use-mobile hook

```
- Import statements (10 lines)
- SidebarProvider component (97 lines)
- Exports (3 lines)
```

### 3. `sidebar-core.tsx` (~170 lines)
**Responsibility**: Main Sidebar + Trigger + Rail  
**Exports**: Sidebar, SidebarTrigger, SidebarRail  
**Dependencies**: sidebar-context.tsx, UI components

```
- Import statements (15 lines)
- Sidebar component (100 lines)
- SidebarTrigger component (25 lines)
- SidebarRail component (25 lines)
- Exports (5 lines)
```

### 4. `sidebar-layout.tsx` (~90 lines)
**Responsibility**: Layout/structure components  
**Exports**: SidebarInset, SidebarInput, SidebarHeader, SidebarFooter, SidebarSeparator, SidebarContent  
**Dependencies**: UI components

```
- Import statements (10 lines)
- SidebarInset (13 lines)
- SidebarInput (10 lines)
- SidebarHeader (9 lines)
- SidebarFooter (9 lines)
- SidebarSeparator (10 lines)
- SidebarContent (11 lines)
- Exports (8 lines)
```

### 5. `sidebar-menu.tsx` (~260 lines)
**Responsibility**: All menu/navigation components  
**Exports**: SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuAction, SidebarMenuBadge, SidebarMenuSkeleton, SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton  
**Dependencies**: sidebar-context.tsx, UI components

```
- Import statements (15 lines)
- SidebarMenu (9 lines)
- SidebarMenuItem (9 lines)
- sidebarMenuButtonVariants (21 lines)
- SidebarMenuButton (48 lines)
- SidebarMenuAction (30 lines)
- SidebarMenuBadge (20 lines)
- SidebarMenuSkeleton (37 lines)
- SidebarMenuSub (13 lines)
- SidebarMenuSubItem (9 lines)
- SidebarMenuSubButton (30 lines)
- Exports (10 lines)
```

### 6. `sidebar-groups.tsx` (~80 lines)
**Responsibility**: Group/section components  
**Exports**: SidebarGroup, SidebarGroupLabel, SidebarGroupAction, SidebarGroupContent  
**Dependencies**: None (pure presentational)

```
- Import statements (10 lines)
- SidebarGroup (9 lines)
- SidebarGroupLabel (19 lines)
- SidebarGroupAction (20 lines)
- SidebarGroupContent (9 lines)
- Exports (5 lines)
```

### 7. `index.tsx` (~8 lines)
**Responsibility**: Re-export all components for backward compatibility  
**Exports**: All components from all files  
**Dependencies**: All 6 files above

```
export * from "./sidebar-context"
export * from "./sidebar-provider"
export * from "./sidebar-core"
export * from "./sidebar-layout"
export * from "./sidebar-menu"
export * from "./sidebar-groups"
```

---

## Dependencies Graph

```
sidebar-context.tsx
  └─ (no dependencies)

sidebar-provider.tsx
  └─ sidebar-context.tsx
  └─ use-mobile hook

sidebar-core.tsx
  └─ sidebar-context.tsx
  └─ UI components (Button, Sheet, Skeleton, etc.)

sidebar-layout.tsx
  └─ UI components (Input, Separator)

sidebar-menu.tsx
  └─ sidebar-context.tsx
  └─ UI components (Slot, Tooltip, Skeleton)
  └─ CVA (class-variance-authority)

sidebar-groups.tsx
  └─ UI components (Slot)

index.tsx
  └─ All 6 files above
```

---

## Import Update Impact

**Files using Sidebar**: Estimated 2-5 files (app-shell, layout)  
**Breaking Changes**: ZERO (index.tsx re-exports maintain API)  
**Import Pattern Change**: None required (backward compatible)

```typescript
// Before AND After (no change needed):
import { Sidebar, SidebarProvider, ... } from "@/components/ui/sidebar"
```

---

## Validation Strategy

1. **Type Check**: `pnpm --filter @cost-mgmt/web type-check`
2. **Build**: `pnpm --filter @cost-mgmt/web build`
3. **Visual Test**: Manual sidebar interaction testing
4. **Line Count Verification**: All files ≤400 lines
5. **Import Verification**: All consumers still work

---

## Metrics

**Before**:
- Files: 1
- Lines: 726
- Max file size: 726 lines
- M-CELL-3 compliance: 0% (1 violation)

**After**:
- Files: 7 (6 modules + 1 index)
- Lines: ~768 (with imports/exports overhead)
- Max file size: ~260 lines (sidebar-menu.tsx)
- M-CELL-3 compliance: 100%

---

## Risk Assessment

**Risk Level**: MEDIUM  
**Complexity**: HIGH (many components, complex context)  
**Breaking Changes**: ZERO (re-export strategy)  
**Visual Regression**: LOW (no logic changes)  
**Type Safety**: HIGH (full TypeScript preservation)
