# Fix Staged Entries Bug and Enhance UX Implementation Plan

## Overview

This plan addresses critical bugs in the staged entries system where edits to temporary cost breakdown entries fail silently, and implements world-class UX patterns for data management, visual feedback, and user interaction.

## Current State Analysis

The application has a critical bug where editing staged (temporary) entries in cost breakdowns doesn't update the actual data. The `updateCostItem` function always attempts database updates even for entries that only exist in memory with temporary IDs. Additionally, the application lacks modern UX patterns for handling unsaved data, providing visual feedback, and communicating state changes to users.

### Key Discoveries:
- Bug in `app/projects/page.tsx:561-594` - `updateCostItem` doesn't handle staged entries
- Bug in `app/projects/page.tsx:833-852` - `deleteCostEntry` has same issue
- No visual distinction between staged and persisted entries
- Using `alert()` instead of toast notifications
- No undo/redo functionality
- Missing auto-save and draft recovery features
- No visual indicators for unsaved changes

## Desired End State

A robust, user-friendly cost management system with:
- All staged entry operations working correctly (create, edit, delete)
- Clear visual distinction between staged and saved data
- Modern toast notifications replacing alerts
- Undo/redo capability with history tracking
- Auto-save to localStorage with recovery
- Visual indicators showing data state and unsaved changes
- Consistent, professional UI patterns throughout

### Verification Criteria:
- Users can edit staged entries and changes persist through save
- Visual feedback clearly shows data state (staged/saved/modified)
- No data loss from browser refresh or network issues
- All user actions provide immediate feedback
- System feels responsive and professional

## What We're NOT Doing

- Real-time collaboration features (future enhancement)
- WebSocket-based live updates
- Complex conflict resolution for multi-user editing
- Complete refactor of state management (maintaining current architecture)
- Migration to different UI framework
- Changes to database schema

## Implementation Approach

We'll fix critical bugs first, then progressively enhance the UX with visual indicators, better feedback mechanisms, and data safety features. Each phase builds on the previous, ensuring the application remains functional throughout the implementation.

## Phase 1: Fix Critical Staged Entry Bugs

### Overview
Fix the core functionality bugs preventing staged entries from being edited and deleted correctly.

### Changes Required:

#### 1. Fix updateCostItem Function
**File**: `app/projects/page.tsx`
**Changes**: Modify function to handle staged entries differently from persisted entries

```typescript
// Line 561 - Replace entire updateCostItem function
const updateCostItem = async (costItem: CostBreakdown) => {
  setSavingCosts((prev) => new Set(prev).add(costItem.id))

  try {
    // Check if this is a staged entry
    if (costItem.id && costItem.id.startsWith('temp_')) {
      // Update staged entries state for temporary entries
      setStagedNewEntries((prev) => ({
        ...prev,
        [costItem.project_id]: prev[costItem.project_id]?.map((entry) =>
          entry.id === costItem.id ? { ...costItem, _modified: true } : entry
        ) || [],
      }))
      
      // Update display state
      setCostBreakdowns((prev) => ({
        ...prev,
        [costItem.project_id]:
          prev[costItem.project_id]?.map((cost) => 
            cost.id === costItem.id ? { ...costItem, _modified: true } : cost
          ) || [],
      }))
      
      // Provide feedback for staged entry update
      console.log("Staged entry updated:", costItem.id)
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

      // Update display state for saved entry
      setCostBreakdowns((prev) => ({
        ...prev,
        [costItem.project_id]:
          prev[costItem.project_id]?.map((cost) => 
            cost.id === costItem.id ? costItem : cost
          ) || [],
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

#### 2. Fix deleteCostEntry Function
**File**: `app/projects/page.tsx`
**Changes**: Handle deletion of staged entries

```typescript
// Line 833 - Replace deleteCostEntry function
const deleteCostEntry = async (costId: string, projectId: string) => {
  setDeletingCost(costId)
  
  try {
    // Check if this is a staged entry
    if (costId && costId.startsWith('temp_')) {
      // Remove from staged entries
      setStagedNewEntries((prev) => ({
        ...prev,
        [projectId]: prev[projectId]?.filter((entry) => entry.id !== costId) || [],
      }))
      
      // Remove from display state
      setCostBreakdowns((prev) => ({
        ...prev,
        [projectId]: prev[projectId]?.filter((cost) => cost.id !== costId) || [],
      }))
      
      console.log("Staged entry deleted:", costId)
    } else {
      // Only delete from database for persisted entries
      const { error } = await supabase
        .from("cost_breakdown")
        .delete()
        .eq("id", costId)

      if (error) throw error

      // Remove from display state
      setCostBreakdowns((prev) => ({
        ...prev,
        [projectId]: prev[projectId]?.filter((cost) => cost.id !== costId) || [],
      }))
    }
  } catch (error) {
    console.error("Error deleting cost entry:", error)
    alert("Failed to delete cost entry. Please try again.")
  } finally {
    setDeletingCost(null)
  }
}
```

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compilation passes: `npm run build`
- [ ] No ESLint errors: `npm run lint`
- [x] Application starts without errors: `npm run dev`

#### Manual Verification:
- [ ] Can edit staged entries and values update in UI
- [ ] Edited staged entries persist when saving initial budget
- [ ] Can delete staged entries without database errors
- [ ] No console errors when editing/deleting staged entries

---

## Phase 2: Add Visual Indicators for Data State

### Overview
Implement clear visual distinction between staged, modified, and saved entries to improve user understanding of data state.

### Changes Required:

#### 1. Add Status Indicator Component
**File**: Create new file `components/entry-status-indicator.tsx`
**Changes**: Create reusable status indicator component

```tsx
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Clock } from "lucide-react"

interface EntryStatusIndicatorProps {
  id: string
  modified?: boolean
  saving?: boolean
}

export function EntryStatusIndicator({ 
  id, 
  modified = false, 
  saving = false 
}: EntryStatusIndicatorProps) {
  const isStaged = id?.startsWith('temp_')
  
  if (saving) {
    return (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 animate-pulse">
        <Clock className="w-3 h-3 mr-1" />
        Saving...
      </Badge>
    )
  }
  
  if (isStaged) {
    return (
      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
        <AlertCircle className="w-3 h-3 mr-1" />
        Staged
      </Badge>
    )
  }
  
  if (modified) {
    return (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
        <AlertCircle className="w-3 h-3 mr-1" />
        Modified
      </Badge>
    )
  }
  
  return (
    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
      <CheckCircle className="w-3 h-3 mr-1" />
      Saved
    </Badge>
  )
}
```

#### 2. Add Row Styling for Staged Entries
**File**: `app/projects/page.tsx`
**Changes**: Add conditional styling to table rows

```tsx
// Add helper function after line 111
const getRowClassName = (cost: CostBreakdown) => {
  const isStaged = cost.id?.startsWith('temp_')
  const isModified = cost._modified
  
  let className = "border-b hover:bg-gray-50"
  
  if (isStaged) {
    className += " bg-amber-50/50 border-l-4 border-l-amber-500"
  } else if (isModified) {
    className += " bg-blue-50/50 border-l-4 border-l-blue-500"
  }
  
  return className
}

// Update table row rendering at line 1223
<tr key={cost.id} className={getRowClassName(cost)}>
```

#### 3. Add Status Column to Table
**File**: `app/projects/page.tsx`
**Changes**: Add status indicator to table

```tsx
// Add import at top of file
import { EntryStatusIndicator } from "@/components/entry-status-indicator"

// Add table header after line 1215
<th className="px-2 py-2 text-left text-xs font-medium text-gray-700">Status</th>

// Add table cell after line 1235 (in the table body)
<td className="px-2 py-2">
  <EntryStatusIndicator 
    id={cost.id} 
    modified={cost._modified}
    saving={savingCosts.has(cost.id)}
  />
</td>
```

### Success Criteria:

#### Automated Verification:
- [x] Component imports resolve correctly
- [x] TypeScript compilation passes: `npm run build`
- [ ] No styling conflicts: `npm run dev`

#### Manual Verification:
- [ ] Staged entries show amber badge and left border
- [ ] Modified entries show blue indicators
- [ ] Saved entries show green checkmark
- [ ] Visual indicators update correctly on state changes

---

## Phase 3: Implement Toast Notifications

### Overview
Replace all `alert()` calls with professional toast notifications for better user experience.

### Changes Required:

#### 1. Initialize Toast System
**File**: `app/projects/page.tsx`
**Changes**: Import and setup toast hook

```tsx
// Add import at top of file
import { useToast } from "@/hooks/use-toast"

// Add inside ProjectsPage component (after line 44)
const { toast } = useToast()
```

#### 2. Replace Alert Calls with Toasts
**File**: `app/projects/page.tsx`
**Changes**: Update all alert() calls

```tsx
// Replace alert at line 388
toast({
  variant: "destructive",
  title: "Validation Error",
  description: `Project name is required`,
})

// Replace alert at line 397
toast({
  variant: "destructive",
  title: "Validation Errors",
  description: errors.join(", "),
})

// Replace alert at line 546
toast({
  variant: "destructive",
  title: "Error Saving",
  description: userMessage,
})

// Replace alert at line 599 (updateCostItem)
toast({
  variant: "destructive",
  title: "Update Failed",
  description: "Failed to update cost item. Please try again.",
})

// Replace alert at line 696
toast({
  variant: "destructive",
  title: "Save Failed",
  description: userMessage,
})

// Add success toasts for operations
// After successful save at line 547
toast({
  variant: "default",
  title: "Success",
  description: "Initial budget saved successfully",
})

// After successful update in updateCostItem (for staged entries)
if (costItem.id?.startsWith('temp_')) {
  toast({
    variant: "default",
    title: "Changes Staged",
    description: "Your changes will be saved with the initial budget",
  })
}
```

#### 3. Add Toaster Component to Layout
**File**: `app/layout.tsx`
**Changes**: Add Toaster component

```tsx
// Add import
import { Toaster } from "@/components/ui/toaster"

// Add before closing body tag
<Toaster />
</body>
```

### Success Criteria:

#### Automated Verification:
- [x] All alert() calls removed from codebase
- [x] Toast imports resolve correctly
- [x] TypeScript compilation passes: `npm run build`

#### Manual Verification:
- [ ] Error messages appear as toast notifications
- [ ] Success messages show green toasts
- [ ] Toasts auto-dismiss after appropriate time
- [ ] Multiple toasts stack properly

---

## Phase 4: Add Unsaved Changes Indicator

### Overview
Implement a persistent indicator showing count of unsaved changes to prevent data loss.

### Changes Required:

#### 1. Create Unsaved Changes Bar Component
**File**: Create new file `components/unsaved-changes-bar.tsx`
**Changes**: Create floating indicator component

```tsx
import { AlertCircle, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface UnsavedChangesBarProps {
  count: number
  onSave: () => void
  onDiscard: () => void
}

export function UnsavedChangesBar({ 
  count, 
  onSave, 
  onDiscard 
}: UnsavedChangesBarProps) {
  if (count === 0) return null
  
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-amber-100 border-2 border-amber-300 rounded-lg shadow-lg p-4 max-w-sm">
      <div className="flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-900">
            {count} unsaved {count === 1 ? 'change' : 'changes'}
          </p>
          <p className="text-xs text-amber-700 mt-1">
            Your changes will be lost if you leave
          </p>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <Button 
          size="sm" 
          onClick={onSave}
          className="flex-1 bg-amber-600 hover:bg-amber-700"
        >
          <Save className="w-3 h-3 mr-1" />
          Save All
        </Button>
        <Button 
          size="sm" 
          variant="outline"
          onClick={onDiscard}
          className="flex-1"
        >
          <X className="w-3 h-3 mr-1" />
          Discard
        </Button>
      </div>
    </div>
  )
}
```

#### 2. Track Unsaved Changes Count
**File**: `app/projects/page.tsx`
**Changes**: Add state tracking and counter logic

```tsx
// Add state for tracking unsaved changes (after line 90)
const [unsavedChangesCount, setUnsavedChangesCount] = useState<{ [projectId: string]: number }>({})

// Add helper function to calculate unsaved changes
const calculateUnsavedChanges = (projectId: string) => {
  const stagedCount = stagedNewEntries[projectId]?.length || 0
  const modifiedCount = costBreakdowns[projectId]?.filter(c => c._modified).length || 0
  return stagedCount + modifiedCount
}

// Update count whenever staged entries or modifications change
useEffect(() => {
  const counts: { [projectId: string]: number } = {}
  Object.keys(projects).forEach(projectId => {
    counts[projectId] = calculateUnsavedChanges(projectId)
  })
  setUnsavedChangesCount(counts)
}, [stagedNewEntries, costBreakdowns, projects])
```

#### 3. Add Unsaved Changes Bar to UI
**File**: `app/projects/page.tsx`
**Changes**: Add component to render

```tsx
// Add import
import { UnsavedChangesBar } from "@/components/unsaved-changes-bar"

// Add handler functions (after line 900)
const handleSaveAllChanges = async (projectId: string) => {
  if (isInitialBudgetMode === projectId) {
    await saveInitialVersion(projectId)
  } else if (isForecasting === projectId) {
    await saveForecastVersion(projectId)
  }
}

const handleDiscardChanges = (projectId: string) => {
  if (!confirm("Are you sure you want to discard all unsaved changes?")) {
    return
  }
  
  // Reset staged entries
  setStagedNewEntries(prev => ({ ...prev, [projectId]: [] }))
  
  // Reset modifications
  setCostBreakdowns(prev => ({
    ...prev,
    [projectId]: prev[projectId]?.map(c => ({ ...c, _modified: false })) || []
  }))
  
  toast({
    title: "Changes Discarded",
    description: "All unsaved changes have been discarded",
  })
}

// Add before project cards (around line 1050)
{expandedProject && unsavedChangesCount[expandedProject] > 0 && (
  <UnsavedChangesBar
    count={unsavedChangesCount[expandedProject]}
    onSave={() => handleSaveAllChanges(expandedProject)}
    onDiscard={() => handleDiscardChanges(expandedProject)}
  />
)}
```

### Success Criteria:

#### Automated Verification:
- [x] Component renders without errors
- [x] State updates trigger re-renders
- [x] TypeScript compilation passes: `npm run build`

#### Manual Verification:
- [ ] Counter shows correct number of unsaved changes
- [ ] Bar appears when changes exist, hidden when none
- [ ] Save All button saves all pending changes
- [ ] Discard button removes all unsaved changes with confirmation

---

## Phase 5: Implement LocalStorage Backup and Recovery

### Overview
Add automatic backup to localStorage to prevent data loss from browser crashes or refreshes.

### Changes Required:

#### 1. Create LocalStorage Service
**File**: Create new file `lib/local-storage-service.ts`
**Changes**: Create service for managing localStorage backups

```typescript
export interface BackupData {
  stagedEntries: { [projectId: string]: any[] }
  timestamp: number
  version: string
}

const BACKUP_KEY = 'cost-management-backup'
const BACKUP_VERSION = '1.0.0'

export class LocalStorageService {
  static saveBackup(stagedEntries: { [projectId: string]: any[] }): void {
    try {
      const backup: BackupData = {
        stagedEntries,
        timestamp: Date.now(),
        version: BACKUP_VERSION
      }
      localStorage.setItem(BACKUP_KEY, JSON.stringify(backup))
    } catch (error) {
      console.error('Failed to save backup:', error)
    }
  }
  
  static loadBackup(): BackupData | null {
    try {
      const data = localStorage.getItem(BACKUP_KEY)
      if (!data) return null
      
      const backup = JSON.parse(data) as BackupData
      
      // Check if backup is recent (less than 24 hours old)
      const hoursSinceBackup = (Date.now() - backup.timestamp) / (1000 * 60 * 60)
      if (hoursSinceBackup > 24) {
        this.clearBackup()
        return null
      }
      
      // Check version compatibility
      if (backup.version !== BACKUP_VERSION) {
        console.warn('Backup version mismatch, discarding')
        this.clearBackup()
        return null
      }
      
      return backup
    } catch (error) {
      console.error('Failed to load backup:', error)
      return null
    }
  }
  
  static clearBackup(): void {
    try {
      localStorage.removeItem(BACKUP_KEY)
    } catch (error) {
      console.error('Failed to clear backup:', error)
    }
  }
  
  static hasBackup(): boolean {
    return localStorage.getItem(BACKUP_KEY) !== null
  }
}
```

#### 2. Add Auto-Save to LocalStorage
**File**: `app/projects/page.tsx`
**Changes**: Implement auto-save mechanism

```tsx
// Add import
import { LocalStorageService } from "@/lib/local-storage-service"

// Add auto-save effect (after line 100)
useEffect(() => {
  const saveTimer = setTimeout(() => {
    if (Object.keys(stagedNewEntries).some(k => stagedNewEntries[k].length > 0)) {
      LocalStorageService.saveBackup(stagedNewEntries)
      console.log('Auto-saved to localStorage')
    }
  }, 5000) // Save every 5 seconds when there are changes
  
  return () => clearTimeout(saveTimer)
}, [stagedNewEntries])

// Add recovery on mount (in existing useEffect or new one)
useEffect(() => {
  const backup = LocalStorageService.loadBackup()
  if (backup && backup.stagedEntries) {
    const hasData = Object.keys(backup.stagedEntries).some(
      k => backup.stagedEntries[k].length > 0
    )
    
    if (hasData) {
      toast({
        title: "Recovery Available",
        description: "Unsaved changes were recovered from your last session",
        action: (
          <Button
            size="sm"
            onClick={() => {
              setStagedNewEntries(backup.stagedEntries)
              // Also restore to display state
              Object.entries(backup.stagedEntries).forEach(([projectId, entries]) => {
                setCostBreakdowns(prev => ({
                  ...prev,
                  [projectId]: [...(prev[projectId] || []), ...entries]
                }))
              })
            }}
          >
            Restore
          </Button>
        ),
      })
    }
  }
}, [])

// Clear backup after successful save (in saveInitialVersion around line 550)
LocalStorageService.clearBackup()
toast({
  title: "Success",
  description: "Initial budget saved and backup cleared",
})
```

#### 3. Add Recovery Banner Component
**File**: Create new file `components/recovery-banner.tsx`
**Changes**: Create banner for recovery notification

```tsx
import { AlertCircle, RefreshCw, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface RecoveryBannerProps {
  onRestore: () => void
  onDismiss: () => void
  itemCount: number
}

export function RecoveryBanner({ 
  onRestore, 
  onDismiss, 
  itemCount 
}: RecoveryBannerProps) {
  return (
    <Alert className="mb-4 border-blue-200 bg-blue-50">
      <AlertCircle className="h-4 w-4 text-blue-600" />
      <AlertDescription className="flex items-center justify-between">
        <span className="text-sm">
          Found {itemCount} unsaved {itemCount === 1 ? 'entry' : 'entries'} from your previous session
        </span>
        <div className="flex gap-2 ml-4">
          <Button 
            size="sm" 
            onClick={onRestore}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Restore
          </Button>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={onDismiss}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
```

### Success Criteria:

#### Automated Verification:
- [x] LocalStorage operations don't throw errors
- [x] TypeScript compilation passes: `npm run build`
- [x] Auto-save timer functions correctly

#### Manual Verification:
- [ ] Staged entries auto-save to localStorage
- [ ] Recovery banner appears after page refresh with unsaved data
- [ ] Restore button successfully restores staged entries
- [ ] Backup clears after successful save
- [ ] Old backups (>24 hours) are ignored

---

## Phase 6: Add Undo/Redo Functionality

### Overview
Implement undo/redo capability with keyboard shortcuts for better user control.

### Changes Required:

#### 1. Create History Manager
**File**: Create new file `lib/history-manager.ts`
**Changes**: Create class for managing action history

```typescript
export interface HistoryEntry {
  type: 'add' | 'edit' | 'delete'
  data: any
  timestamp: number
  description: string
}

export class HistoryManager {
  private history: HistoryEntry[] = []
  private currentIndex: number = -1
  private maxSize: number = 50
  
  push(entry: HistoryEntry): void {
    // Remove any entries after current index
    this.history = this.history.slice(0, this.currentIndex + 1)
    
    // Add new entry
    this.history.push(entry)
    
    // Limit history size
    if (this.history.length > this.maxSize) {
      this.history.shift()
    } else {
      this.currentIndex++
    }
  }
  
  canUndo(): boolean {
    return this.currentIndex > 0
  }
  
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1
  }
  
  undo(): HistoryEntry | null {
    if (!this.canUndo()) return null
    this.currentIndex--
    return this.history[this.currentIndex]
  }
  
  redo(): HistoryEntry | null {
    if (!this.canRedo()) return null
    this.currentIndex++
    return this.history[this.currentIndex]
  }
  
  getHistory(): HistoryEntry[] {
    return this.history
  }
  
  clear(): void {
    this.history = []
    this.currentIndex = -1
  }
}
```

#### 2. Integrate History Manager
**File**: `app/projects/page.tsx`
**Changes**: Add undo/redo functionality

```tsx
// Add import
import { HistoryManager, HistoryEntry } from "@/lib/history-manager"

// Add state (after line 90)
const [historyManager] = useState(() => new HistoryManager())
const [canUndo, setCanUndo] = useState(false)
const [canRedo, setCanRedo] = useState(false)

// Add history tracking to operations
// In addCostBreakdown (after successful add, around line 830)
historyManager.push({
  type: 'add',
  data: { projectId: newCost.project_id, entry: stagedEntry },
  timestamp: Date.now(),
  description: `Added cost entry for ${newCost.cost_line}`
})
updateHistoryState()

// In updateCostItem (after successful update)
historyManager.push({
  type: 'edit',
  data: { previous: oldCost, updated: costItem },
  timestamp: Date.now(),
  description: `Edited ${costItem.cost_line}`
})
updateHistoryState()

// In deleteCostEntry (after successful delete)
historyManager.push({
  type: 'delete',
  data: { projectId, entry: deletedEntry },
  timestamp: Date.now(),
  description: `Deleted ${deletedEntry.cost_line}`
})
updateHistoryState()

// Add helper function
const updateHistoryState = () => {
  setCanUndo(historyManager.canUndo())
  setCanRedo(historyManager.canRedo())
}

// Add undo/redo handlers
const handleUndo = () => {
  const entry = historyManager.undo()
  if (!entry) return
  
  // Apply inverse operation based on type
  switch (entry.type) {
    case 'add':
      // Remove the added entry
      deleteCostEntry(entry.data.entry.id, entry.data.projectId)
      break
    case 'edit':
      // Restore previous values
      updateCostItem(entry.data.previous)
      break
    case 'delete':
      // Re-add the deleted entry
      addCostBreakdown(entry.data.entry)
      break
  }
  
  toast({
    title: "Undone",
    description: entry.description,
  })
  updateHistoryState()
}

const handleRedo = () => {
  const entry = historyManager.redo()
  if (!entry) return
  
  // Apply the original operation
  switch (entry.type) {
    case 'add':
      addCostBreakdown(entry.data.entry)
      break
    case 'edit':
      updateCostItem(entry.data.updated)
      break
    case 'delete':
      deleteCostEntry(entry.data.entry.id, entry.data.projectId)
      break
  }
  
  toast({
    title: "Redone",
    description: entry.description,
  })
  updateHistoryState()
}

// Add keyboard shortcuts
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault()
      handleUndo()
    } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault()
      handleRedo()
    }
  }
  
  window.addEventListener('keydown', handleKeyPress)
  return () => window.removeEventListener('keydown', handleKeyPress)
}, [canUndo, canRedo])
```

#### 3. Add Undo/Redo UI Controls
**File**: `app/projects/page.tsx`
**Changes**: Add buttons to UI

```tsx
// Add undo/redo buttons in the toolbar (around line 1130)
<div className="flex gap-2">
  <Button
    size="sm"
    variant="outline"
    onClick={handleUndo}
    disabled={!canUndo}
    title="Undo (Ctrl+Z)"
  >
    <Undo className="w-4 h-4" />
  </Button>
  <Button
    size="sm"
    variant="outline"
    onClick={handleRedo}
    disabled={!canRedo}
    title="Redo (Ctrl+Y)"
  >
    <Redo className="w-4 h-4" />
  </Button>
</div>
```

### Success Criteria:

#### Automated Verification:
- [ ] History manager class tests pass
- [ ] Keyboard event handlers register correctly
- [ ] TypeScript compilation passes: `npm run build`

#### Manual Verification:
- [ ] Ctrl+Z undoes last action
- [ ] Ctrl+Y redoes undone action
- [ ] Undo/redo buttons work correctly
- [ ] History limited to 50 entries
- [ ] Operations correctly reversed/reapplied

---

## Testing Strategy

### Unit Tests:
- Test staged entry identification logic
- Test history manager operations
- Test localStorage service methods
- Test validation functions

### Integration Tests:
- Test full flow: create → edit → save staged entries
- Test recovery after browser refresh
- Test undo/redo sequences
- Test concurrent operations

### Manual Testing Steps:
1. Create initial budget and add multiple entries
2. Edit staged entries and verify changes persist
3. Delete staged entries and verify removal
4. Refresh browser and verify recovery prompt
5. Test undo/redo with various operations
6. Verify visual indicators update correctly
7. Test toast notifications for all actions
8. Verify unsaved changes counter accuracy
9. Test save/discard all functionality
10. Verify localStorage cleanup after save

## Performance Considerations

- Debounce localStorage saves to prevent excessive writes
- Use React.memo for expensive components
- Implement virtual scrolling for large datasets
- Optimize re-renders with proper dependency arrays
- Consider using React Query for server state

## Migration Notes

- No database schema changes required
- Existing data remains compatible
- LocalStorage data uses versioning for future migrations
- History cleared on successful save to prevent confusion

## Rollback Plan

If issues arise:
1. Revert git commits in reverse order
2. Clear browser localStorage
3. Deploy previous version
4. Notify users of temporary rollback

## References

- Original bug research: `docs/research/2025-09-18_21-43-22_edit_staged_entries_bug.md`
- Database schema: `scripts/001_create_projects_tables.sql`
- Current implementation: `app/projects/page.tsx`
- UI components: `components/ui/`
