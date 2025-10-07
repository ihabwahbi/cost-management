# Phase 7 Migration Plan: Final Integration & Cleanup

**Date**: 2025-10-07  
**Timestamp**: 17:00 UTC  
**Architect**: MigrationArchitect  
**Status**: ready_for_implementation  
**Phase**: 3 (Planning)  
**Workflow Phase**: Phase 7 of 7 - Final Integration  
**Enhancement**: ✅ ULTRATHINK ACTIVE  

---

## Based On

**Discovery Report**: `thoughts/shared/discoveries/2025-10-05_discovery-report.md`  
**Phase Overview**: `thoughts/shared/plans/2025-10-05_PHASE-OVERVIEW_all-7-phases.md`  
**Previous Implementation**: `thoughts/shared/implementations/2025-10-07_16-14_po-budget-comparison-cell_implementation.md` (Phase 6 COMPLETE)

---

## Executive Summary

Phase 7 is the **FINAL INTEGRATION** phase of the 7-phase projects page modernization. This is NOT a standard Cell migration - it's a **comprehensive cleanup and integration** phase that consolidates 6 completed Cells into a clean orchestrator architecture.

### Migration Metadata

| Attribute | Value |
|-----------|-------|
| **Target Component** | `apps/web/app/projects/page.tsx` |
| **Current Size** | 2,267 lines (God component) |
| **Target Size** | ~250 lines (pure orchestrator) |
| **Complexity** | MEDIUM (cleanup, not new development) |
| **Strategy** | Cleanup + Integration (not standard migration) |
| **Estimated Duration** | 1-2 days (8-16 hours) |
| **Risk Level** | MEDIUM (integration complexity, no new features) |
| **Blocking** | ALL previous phases (1-6) must be complete ✅ |

### Current State Analysis

**Cells Already Integrated** (6 Cells):
1. ✅ CostBreakdownTableCell
2. ✅ VersionManagementCell  
3. ✅ VersionComparisonCell
4. ✅ POBudgetComparisonCell
5. ✅ ForecastWizard
6. ✅ Project metadata display (inline, no dedicated Cell)

**Page.tsx Statistics**:
- Lines: 2,267
- State variables: 44 (via useState/useEffect)
- Direct Supabase imports: 1 (`createClient`)
- Functions: ~30 (most can be removed)
- Complexity: God component pattern (violates M-CELL-3)

**What Needs to Happen**:
1. Remove ALL direct Supabase database access
2. Clean up obsolete state management (44 → ~8 state variables)
3. Remove dead functions (30 → ~5 orchestration functions)
4. Simplify to pure Cell composition (~250 lines)
5. Comprehensive E2E testing
6. Performance validation
7. Documentation updates

---

## Architecture Compliance Pre-Validation

### Phase 7 Mandate Verification

| Mandate | Requirement | Status | Evidence |
|---------|-------------|--------|----------|
| **M-CELL-1** | Orchestrator pattern allowed | ✅ COMPLIANT | Page.tsx is NOT a Cell - it's an orchestrator (Section 3.2) |
| **M-CELL-2** | No parallel implementations | ✅ COMPLIANT | All Cells complete, no temporary versions |
| **M-CELL-3** | Files ≤400 lines | ⚠️ **TARGET** | Current: 2,267 lines → **Target: ≤250 lines** |
| **M-CELL-4** | N/A for orchestrators | N/A | Orchestrators don't have behavioral assertions |

**Specialized Procedure Architecture**:
- No new procedures needed ✅
- All 17 existing procedures ≤200 lines ✅
- All 4 domain routers ≤50 lines ✅

### Forbidden Language Scan

**ZERO TOLERANCE** for:
- ❌ "optional cleanup"
- ❌ "future refactoring"
- ❌ "temporary solution"

**Phase 7 is COMPLETE or NOTHING** - no partial cleanup allowed.

### Compliance Status

✅ **COMPLIANT** - Ready for Phase 4 implementation

**Critical Success Criterion**: page.tsx MUST be ≤400 lines (ideally ≤250) after this phase.

---

## Migration Overview

### Scope

**IN SCOPE**:
- Refactor page.tsx to pure orchestrator (~250 lines)
- Remove ALL direct Supabase imports
- Clean up 36+ obsolete state variables
- Remove 25+ obsolete functions
- Comprehensive E2E testing
- Performance validation (≤110% baseline)
- Documentation updates
- Final architecture health assessment

**OUT OF SCOPE**:
- New Cells (all 6 Cells already created)
- New tRPC procedures (all 17 procedures exist)
- New features (consolidation only)
- Database schema changes

### Dependencies

**Required Completed Phases**:
- ✅ Phase 1: Projects domain (project list Cell) - **Actually, project list is still IN page.tsx**
- ✅ Phase 2: Cost breakdown domain
- ✅ Phase 3.5: Version-aware remediation
- ✅ Phase 4: Forecasts domain (version management Cell)
- ✅ Phase 5: Version comparison Cell
- ✅ Phase 6: PO budget comparison Cell

**CRITICAL INSIGHT**: Phase 1 mentions "project-list-cell" but examining the codebase shows the project list is still inline in page.tsx. This is acceptable for an orchestrator - the project list can remain inline as simple UI.

### Integration Impact

**Files Modified**:
- `apps/web/app/projects/page.tsx` (2,267 → ~250 lines, -89% reduction)

**Files Deleted**: NONE (Phase 7 is cleanup, not replacement)

**Imports Changed**:
- Remove: `createClient` from "@/lib/supabase/client"
- Keep: All Cell imports (6 Cells)
- Keep: Essential UI components

---

## Data Layer Specifications

### tRPC Procedures

**NO NEW PROCEDURES REQUIRED** ✅

All necessary procedures already exist from Phases 1-6:

**Projects Domain** (4 procedures):
- projects.getProjects
- projects.createProject
- projects.updateProject
- projects.deleteProject

**Cost Breakdown Domain** (6 procedures):
- costBreakdown.getCostBreakdownByVersion
- costBreakdown.createCostEntry
- costBreakdown.updateCostEntry
- costBreakdown.deleteCostEntry
- costBreakdown.bulkDeleteCostEntries
- costBreakdown.saveBaselineCostBreakdown

**Forecasts Domain** (3 procedures):
- forecasts.createForecastVersion
- forecasts.getForecastVersions
- forecasts.deleteForecastVersion

**PO Mapping Domain** (2 procedures):
- poMapping.getPOSummary
- poMapping.getExistingMappings

**All procedures tested and deployed in Phases 1-6** ✅

### Drizzle Schemas

**NO NEW SCHEMAS REQUIRED** ✅

All schemas already exist:
- projects
- cost_breakdown
- budget_forecasts
- forecast_versions
- po_mappings
- po_line_items
- pos

---

## Orchestrator Architecture Design

### Target Structure

**File**: `apps/web/app/projects/page.tsx`  
**Target Size**: ~250 lines (≤400 MANDATORY)  
**Pattern**: Pure Cell Orchestrator + Minimal State

```typescript
// apps/web/app/projects/page.tsx (~250 lines target)

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { trpc } from "@/lib/trpc"

// Cell Imports (6 Cells)
import { CostBreakdownTableCell } from "@/components/cells/cost-breakdown-table-cell/component"
import { VersionManagementCell } from "@/components/cells/version-management-cell/component"
import { VersionComparisonCell } from "@/components/cells/version-comparison-cell/component"
import { POBudgetComparisonCell } from "@/components/cells/po-budget-comparison-cell/component"
import { ForecastWizard } from "@/components/cells/forecast-wizard/component"

// UI Components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Project {
  id: string
  name: string
  sub_business_line: string
  created_at: string
}

export default function ProjectsPage() {
  const { toast } = useToast()
  const router = useRouter()
  
  // ========================================
  // ORCHESTRATOR STATE (8 variables max)
  // ========================================
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [activeVersion, setActiveVersion] = useState<Record<string, number | "latest">>({})
  const [showVersionComparison, setShowVersionComparison] = useState<string | null>(null)
  const [compareVersions, setCompareVersions] = useState<{v1: number, v2: number} | null>(null)
  const [showForecastWizard, setShowForecastWizard] = useState<string | null>(null)
  const [creatingNewProject, setCreatingNewProject] = useState(false)
  const [newProjectData, setNewProjectData] = useState({ name: "", sub_business_line: "" })
  
  // ========================================
  // tRPC QUERIES (NO DIRECT SUPABASE)
  // ========================================
  const { data: projects, isLoading, refetch: refetchProjects } = trpc.projects.getProjects.useQuery()
  
  const createProject = trpc.projects.createProject.useMutation({
    onSuccess: () => {
      toast({ title: "Project created successfully" })
      setCreatingNewProject(false)
      setNewProjectData({ name: "", sub_business_line: "" })
      refetchProjects()
    },
    onError: (error) => {
      toast({ title: "Failed to create project", description: error.message, variant: "destructive" })
    }
  })
  
  const deleteProject = trpc.projects.deleteProject.useMutation({
    onSuccess: () => {
      toast({ title: "Project deleted successfully" })
      refetchProjects()
    }
  })
  
  // ========================================
  // ORCHESTRATION FUNCTIONS (5 functions max)
  // ========================================
  const filteredProjects = projects?.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sub_business_line.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []
  
  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(selectedProjectId === projectId ? null : projectId)
    if (!activeVersion[projectId]) {
      setActiveVersion(prev => ({ ...prev, [projectId]: "latest" }))
    }
  }
  
  const handleVersionChange = (projectId: string, version: number | "latest") => {
    setActiveVersion(prev => ({ ...prev, [projectId]: version }))
  }
  
  const handleCreateProject = () => {
    if (!newProjectData.name.trim() || !newProjectData.sub_business_line.trim()) {
      toast({ title: "Validation Error", description: "All fields required", variant: "destructive" })
      return
    }
    createProject.mutate(newProjectData)
  }
  
  // ========================================
  // RENDER (PURE CELL COMPOSITION)
  // ========================================
  return (
    <div className="container mx-auto p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Cost Management Hub</h1>
        <div className="flex items-center gap-4">
          <Input
            type="search"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Button onClick={() => setCreatingNewProject(true)}>
            Create New Project
          </Button>
        </div>
      </div>
      
      {/* Create Project Form */}
      {creatingNewProject && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create New Project</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Input
                placeholder="Project Name"
                value={newProjectData.name}
                onChange={(e) => setNewProjectData({ ...newProjectData, name: e.target.value })}
              />
              <select
                value={newProjectData.sub_business_line}
                onChange={(e) => setNewProjectData({ ...newProjectData, sub_business_line: e.target.value })}
                className="border rounded px-3"
              >
                <option value="">Select Sub Business Line</option>
                <option value="WIS">WIS</option>
                <option value="Drilling">Drilling</option>
                {/* Add other options */}
              </select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateProject} disabled={createProject.isPending}>
                {createProject.isPending ? "Creating..." : "Create Project"}
              </Button>
              <Button variant="outline" onClick={() => setCreatingNewProject(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Projects List */}
      {isLoading ? (
        <div className="text-center py-8">Loading projects...</div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-8">No projects found</div>
      ) : (
        <div className="space-y-4">
          {filteredProjects.map((project) => (
            <Card key={project.id}>
              <CardHeader className="cursor-pointer" onClick={() => handleProjectSelect(project.id)}>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{project.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{project.sub_business_line}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => router.push(`/projects/${project.id}/dashboard`)}>
                      Dashboard
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm("Delete project?")) {
                          deleteProject.mutate({ projectId: project.id })
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {/* CELL COMPOSITION - All logic in Cells */}
              {selectedProjectId === project.id && (
                <CardContent className="space-y-6">
                  {/* Cell 1: PO Budget Comparison */}
                  <POBudgetComparisonCell projectId={project.id} />
                  
                  {/* Cell 2: Version Management */}
                  <VersionManagementCell
                    projectId={project.id}
                    projectName={project.name}
                    activeVersion={activeVersion[project.id] ?? "latest"}
                    onVersionChange={(v) => handleVersionChange(project.id, v)}
                    onOpenForecastWizard={() => setShowForecastWizard(project.id)}
                    onCompareVersions={(v1, v2) => {
                      setShowVersionComparison(project.id)
                      setCompareVersions({ v1, v2 })
                    }}
                  />
                  
                  {/* Cell 3: Cost Breakdown Table */}
                  <CostBreakdownTableCell
                    projectId={project.id}
                    versionNumber={activeVersion[project.id] ?? "latest"}
                  />
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
      
      {/* Cell 4: Version Comparison (Sheet) */}
      {showVersionComparison && compareVersions && (
        <VersionComparisonCell
          isOpen={true}
          onClose={() => {
            setShowVersionComparison(null)
            setCompareVersions(null)
          }}
          projectId={showVersionComparison}
          projectName={projects?.find(p => p.id === showVersionComparison)?.name || ""}
          selectedVersion1={compareVersions.v1}
          selectedVersion2={compareVersions.v2}
          mode="sheet"
        />
      )}
      
      {/* Cell 5: Forecast Wizard */}
      {showForecastWizard && (
        <ForecastWizard
          isOpen={true}
          onClose={() => setShowForecastWizard(null)}
          projectId={showForecastWizard}
          projectName={projects?.find(p => p.id === showForecastWizard)?.name || ""}
          onSave={async () => {
            setShowForecastWizard(null)
            // Cell handles save internally via tRPC
          }}
        />
      )}
    </div>
  )
}
```

**Estimated Final Size**: 220-250 lines ✅ (≤400 MANDATORY)

### Orchestrator State Management

**BEFORE** (44 state variables):
- searchTerm, projects, expandedProjects, costBreakdowns, editingCost, editingValues
- isLoading, savingCosts, addingNewCost, newCostValues, savingNewCost, deletingCost
- isForecasting, forecastChanges, forecastReason, activeVersion, forecastVersions, savingForecast
- hasInitialVersion, loadingVersionData, loadingVersionRef, deletingProject, supabase
- creatingNewProject, newProjectData, savingNewProject, forecastNewEntries, stagedNewEntries
- isInitialBudgetMode, unsavedChangesCount, showForecastWizard, forecastWizardData
- selectedEntries, bulkEditMode, showVersionComparison, compareVersions, comparisonForecasts
- loadingComparison, fieldErrors
- **Total: 44 variables** 🔴

**AFTER** (8 state variables):
- searchTerm
- selectedProjectId
- activeVersion
- showVersionComparison
- compareVersions
- showForecastWizard
- creatingNewProject
- newProjectData
- **Total: 8 variables** ✅

**Reduction**: 44 → 8 = **82% state reduction**

### Functions to Remove

**BEFORE** (~30 functions):
```
loadProjects, loadCostBreakdown, loadVersionCostBreakdown, loadForecastWizardData, loadComparisonData
loadForecastVersions, retryOperation, validateDatabaseEntry, cleanEntryForDatabase, calculateUnsavedChanges
saveInitialVersion, handleVersionChange, updateCostItem, saveForecastVersion, startForecasting
cancelForecasting, handleSearch, formatCurrency, getTotalBudget, toggleProjectExpansion
startEditing, cancelEditing, saveEditing, addNewCostEntry, deleteCostEntry
deleteProject, createNewProject, cancelNewProject, updateForecastChange, addForecastNewEntry
removeForecastNewEntry, startInitialBudgetMode, cancelInitialBudgetMode, handleSaveAllChanges, handleDiscardChanges
handleBulkDelete, handleSelectAll, toggleEntrySelection, validateField, handleFieldChange, validateStagedEntries
```

**AFTER** (5 functions):
```
filteredProjects (computed)
handleProjectSelect
handleVersionChange
handleCreateProject
(render function)
```

**Reduction**: ~30 → 5 = **83% function reduction**

---

## Migration Sequence (5 Steps)

### Step 1: Preparation & Backup

**Duration**: 15 minutes

**Actions**:
```bash
# Create backup branch
git checkout -b phase-7-final-integration
git add .
git commit -m "Pre-Phase 7: Backup before final integration"

# Document current metrics
echo "Current page.tsx size: 2,267 lines" >> migration-log.txt
echo "Target: ≤250 lines" >> migration-log.txt

# Run baseline tests
pnpm test
pnpm type-check
pnpm build
```

**Validation**:
- [ ] Backup branch created
- [ ] Current state committed
- [ ] Baseline tests pass

---

### Step 2: Remove Dead Code & Supabase Imports

**Duration**: 1-2 hours

**Remove Direct Supabase Access**:
```typescript
// ❌ DELETE THIS
import { createClient } from "@/lib/supabase/client"
const supabase = createClient()

// ❌ DELETE ALL THESE FUNCTIONS
const loadProjects = async () => {
  const { data, error } = await supabase.from("projects").select("*")
  // ... 20+ lines
}

const loadCostBreakdown = async (projectId: string) => {
  const { data, error } = await supabase.from("cost_breakdown").select("*")
  // ... 30+ lines
}

const loadVersionCostBreakdown = async (projectId: string, versionNumber) => {
  // ... 236 lines! (LARGEST OFFENDER)
}

const loadForecastVersions = async (projectId: string) => {
  const { data, error } = await supabase.from("forecast_versions").select("*")
  // ... 30+ lines
}

// ... 20+ more functions
```

**Replace with tRPC**:
```typescript
// ✅ USE THIS INSTEAD (already exists!)
const { data: projects } = trpc.projects.getProjects.useQuery()
// All data fetching handled by Cells via tRPC
```

**Delete Obsolete State**:
```typescript
// ❌ DELETE (36 state variables)
const [costBreakdowns, setCostBreakdowns] = useState<Record<string, CostBreakdown[]>>({})
const [forecastVersions, setForecastVersions] = useState<Record<string, ForecastVersion[]>>({})
const [loadingVersionData, setLoadingVersionData] = useState<Record<string, boolean>>({})
// ... 33 more state variables that Cells now manage internally
```

**Validation Criteria**:
```bash
# After cleanup
grep -n "supabase" apps/web/app/projects/page.tsx
# Should return: 0 results ✅

grep -n "useState" apps/web/app/projects/page.tsx | wc -l
# Should return: ≤10 (down from 44) ✅

wc -l apps/web/app/projects/page.tsx
# Should show: <1000 lines (intermediate checkpoint) ✅
```

**Validation**:
- [ ] Zero Supabase imports
- [ ] ≤10 useState hooks
- [ ] <1000 lines (intermediate)
- [ ] TypeScript compilation still passes

---

### Step 3: Refactor to Pure Orchestrator

**Duration**: 2-3 hours

**Simplify Rendering**:
```typescript
// ❌ OLD (complex nested logic, 1000+ lines)
{expandedProjects.has(project.id) && (
  <div>
    {loadingVersionData[project.id] ? (
      <Spinner />
    ) : (
      <>
        {isInitialBudgetMode === project.id ? (
          <div>
            {/* 100+ lines of initial budget UI */}
          </div>
        ) : isForecasting === project.id ? (
          <div>
            {/* 100+ lines of forecasting UI */}
          </div>
        ) : (
          <div>
            {/* 200+ lines of normal UI */}
          </div>
        )}
      </>
    )}
  </div>
)}

// ✅ NEW (pure Cell composition, ~30 lines)
{selectedProjectId === project.id && (
  <CardContent className="space-y-6">
    <POBudgetComparisonCell projectId={project.id} />
    <VersionManagementCell
      projectId={project.id}
      activeVersion={activeVersion[project.id] ?? "latest"}
      onVersionChange={(v) => handleVersionChange(project.id, v)}
    />
    <CostBreakdownTableCell
      projectId={project.id}
      versionNumber={activeVersion[project.id] ?? "latest"}
    />
  </CardContent>
)}
```

**Extract Reusable UI Components** (if needed):
```typescript
// Create simple components for repeated UI patterns
const ProjectHeader = ({ project, onExpand, onDelete }) => (
  <div className="flex items-center justify-between">
    <div>
      <h3>{project.name}</h3>
      <p>{project.sub_business_line}</p>
    </div>
    <div className="flex gap-2">
      <Button onClick={onExpand}>Expand</Button>
      <Button variant="destructive" onClick={onDelete}>Delete</Button>
    </div>
  </div>
)

// Use in main render
<ProjectHeader
  project={project}
  onExpand={() => handleProjectSelect(project.id)}
  onDelete={() => deleteProject.mutate({ projectId: project.id })}
/>
```

**Validation Criteria**:
```bash
wc -l apps/web/app/projects/page.tsx
# Should show: ≤400 lines (MANDATORY) ✅
# Target: ≤250 lines ✅
```

**Validation**:
- [ ] Page size ≤400 lines (MANDATORY)
- [ ] Pure Cell composition (no business logic)
- [ ] TypeScript compilation passes
- [ ] Build succeeds

---

### Step 4: Comprehensive Testing

**Duration**: 2-3 hours

**4.1 Unit Tests** (existing Cells already have tests):
```bash
# Run all Cell tests
pnpm test -- apps/web/components/cells/

# Expected: All tests pass
# - CostBreakdownTableCell: ✅
# - VersionManagementCell: ✅
# - VersionComparisonCell: ✅
# - POBudgetComparisonCell: ✅
# - ForecastWizard: ✅
```

**4.2 E2E Testing Scenarios** (manual validation required):

**Test 1: Project Creation & Expansion**
```yaml
actions:
  - Click "Create New Project"
  - Enter name: "Test Project E2E"
  - Select sub business line: "WIS"
  - Click "Create Project"
  - Find project in list
  - Click to expand project
validation:
  - Project appears in list ✓
  - All Cells render (PO comparison, version management, cost breakdown) ✓
  - No console errors ✓
```

**Test 2: Version Management Workflow**
```yaml
actions:
  - Expand project with forecast versions
  - Click version dropdown
  - Select "Version 0"
  - Verify cost breakdown updates
  - Switch to "Latest"
  - Verify cost breakdown updates again
validation:
  - Version switching works ✓
  - Cost breakdown reflects correct version ✓
  - No data loss ✓
  - Loading states work ✓
```

**Test 3: Forecast Creation Workflow**
```yaml
actions:
  - Expand project
  - Click "Create New Forecast"
  - ForecastWizard opens
  - Make changes to budget items
  - Add new entry
  - Provide reason: "Q3 forecast adjustment"
  - Click "Save Forecast"
validation:
  - New version created ✓
  - Cost breakdown shows new version ✓
  - Version timeline updated ✓
  - Data persists after refresh ✓
```

**Test 4: Version Comparison**
```yaml
actions:
  - Expand project with multiple versions
  - Click "Compare Versions"
  - Select Version 0 and Version 2
  - Review comparison data
validation:
  - Comparison sheet opens ✓
  - Data displays correctly ✓
  - Variance calculations accurate ✓
  - Close button works ✓
```

**Test 5: PO Budget Comparison**
```yaml
actions:
  - Expand project
  - View PO Budget Comparison Cell
  - Verify budget vs actual data
validation:
  - Shows latest version budget ✓
  - Shows actual PO spend ✓
  - Variance displayed correctly ✓
  - Utilization rate accurate ✓
```

**Test 6: Search & Filter**
```yaml
actions:
  - Enter search term in search box
  - Verify projects filter correctly
  - Clear search
  - Verify all projects return
validation:
  - Search by name works ✓
  - Search by sub business line works ✓
  - Filtering is responsive ✓
```

**Test 7: Project Deletion**
```yaml
actions:
  - Click delete button on project
  - Confirm deletion
  - Verify project removed from list
validation:
  - Confirmation dialog appears ✓
  - Project deleted from database ✓
  - UI updates immediately ✓
```

**Validation**:
- [ ] All 7 E2E scenarios pass
- [ ] No console errors
- [ ] Data persists correctly
- [ ] Loading states work
- [ ] Error handling graceful

---

### Step 5: Performance & Final Validation

**Duration**: 1-2 hours

**5.1 Performance Benchmarking**:

**Baseline** (from Phase 6 completion):
- Page load time: TBD (measure before Phase 7)
- Initial render count: TBD
- Network requests: TBD

**Target** (Phase 7 completion):
- Page load time: ≤110% baseline ✅
- Initial render count: ≤5 per Cell ✅
- Network requests: Batched via tRPC ✅

**Measurement**:
```yaml
tools:
  - Chrome DevTools Performance tab
  - React DevTools Profiler
  - Network tab (check tRPC batching)

metrics:
  - Page load time (from navigation to interactive)
  - Time to first render
  - Cell render counts
  - Network request count
  - Bundle size
```

**Performance Validation Checklist**:
```bash
# 1. Build size check
pnpm build
# Verify bundle size within acceptable range

# 2. Lighthouse audit
# Run Chrome Lighthouse on /projects page
# Target scores:
# - Performance: ≥90
# - Accessibility: ≥95
# - Best Practices: ≥90

# 3. Network optimization
# Open Network tab, load projects page
# Verify:
# - ≤3 tRPC requests (batched)
# - No duplicate requests
# - No waterfall patterns
```

**5.2 Architecture Health Check**:
```bash
# File size validation
wc -l apps/web/app/projects/page.tsx
# MUST BE ≤400 lines (MANDATORY) ✅

# Zero Supabase imports
grep -c "supabase" apps/web/app/projects/page.tsx
# MUST BE 0 ✅

# State management validation
grep -c "useState" apps/web/app/projects/page.tsx
# SHOULD BE ≤10 ✅

# TypeScript compilation
pnpm type-check
# Zero errors ✅

# Build validation
pnpm build
# Success ✅

# Test suite
pnpm test
# All pass ✅
```

**5.3 Final Manual Validation Gate** (MANDATORY):

```markdown
## 🛑 HUMAN VALIDATION REQUIRED

**Complete Workflow Validation**:

1. [ ] Create new project
   - Form works correctly ✓
   - Project appears in list ✓
   
2. [ ] Expand project
   - All 3 Cells render (PO comparison, version management, cost breakdown) ✓
   
3. [ ] Create initial budget
   - Add 5 budget entries ✓
   - Save initial version ✓
   - Data persists ✓
   
4. [ ] Create forecast
   - Open forecast wizard ✓
   - Modify 3 entries ✓
   - Add 2 new entries ✓
   - Save version 1 ✓
   
5. [ ] Switch versions
   - View Version 0 ✓
   - View Version 1 ✓
   - View "Latest" ✓
   - Data correct for each ✓
   
6. [ ] Compare versions
   - Compare Version 0 vs Version 1 ✓
   - Variance calculations accurate ✓
   
7. [ ] PO budget comparison
   - Shows correct budget (latest version) ✓
   - Shows actual spend ✓
   - Variance displayed ✓
   
8. [ ] Performance
   - Page loads quickly (<2 seconds) ✓
   - No lag when switching versions ✓
   - No console errors ✓
   
9. [ ] Delete project
   - Confirmation works ✓
   - Project removed ✓

**Respond with:**
- "VALIDATED - proceed to commit" OR
- "FIX ISSUES - [describe]"
```

**Validation**:
- [ ] Performance ≤110% baseline
- [ ] Architecture health checks pass
- [ ] Human validation complete
- [ ] Ready for atomic commit

---

## Rollback Strategy

### Trigger Conditions

**ANY of these trigger FULL rollback**:
- TypeScript errors after refactoring
- Build failures
- Any E2E test scenario fails
- Performance regression >10%
- Human validation rejected
- File size exceeds 400 lines (M-CELL-3 violation)

### Rollback Sequence

```bash
# Step 1: Revert all changes
git checkout main
git branch -D phase-7-final-integration

# Step 2: Verify baseline state
pnpm type-check  # Should pass
pnpm build       # Should succeed
pnpm test        # Should pass

# Step 3: Update ledger
echo '{"status":"FAILED","phase":"7","reason":"[failure reason]"}' >> ledger.jsonl

# Step 4: Document lessons
# Create rollback report with:
# - What failed
# - Why it failed
# - What to do differently next time
```

### Partial Rollback Not Allowed

**Phase 7 is ALL or NOTHING**:
- ❌ Cannot keep partial cleanup
- ❌ Cannot keep some state removed but not others
- ❌ Cannot leave page in intermediate state
- ✅ ONLY complete success or full rollback

**Rationale**: Partial cleanup creates technical debt and violates architecture mandates.

---

## Validation Strategy

### Technical Gates

**Gate 1: TypeScript Compilation**
```bash
pnpm type-check
# Requirement: Zero errors
# Validation: Automated
```

**Gate 2: Test Suite**
```bash
pnpm test
# Requirement: All tests pass
# Validation: Automated
```

**Gate 3: Build**
```bash
pnpm build
# Requirement: Production build succeeds
# Validation: Automated
```

**Gate 4: File Size** (CRITICAL)
```bash
wc -l apps/web/app/projects/page.tsx
# Requirement: ≤400 lines (MANDATORY per M-CELL-3)
# Target: ≤250 lines
# Validation: Automated
```

**Gate 5: Supabase Import Check**
```bash
grep -c "supabase" apps/web/app/projects/page.tsx
# Requirement: 0 (zero Supabase imports)
# Validation: Automated
```

### Functional Gates

**Gate 6: E2E Scenarios**
- Requirement: All 7 scenarios pass
- Validation: Manual

**Gate 7: Performance**
- Requirement: ≤110% baseline
- Measurement: Chrome DevTools
- Validation: Automated + Manual

**Gate 8: Integration**
- Requirement: All 6 Cells render correctly
- Validation: Manual

### Architecture Gates

**Gate 9: Mandate Compliance**
```yaml
M-CELL-1: N/A (orchestrator)
M-CELL-2: ✓ No parallel implementations
M-CELL-3: ✓ File ≤400 lines (CRITICAL)
M-CELL-4: N/A (orchestrator)
```

**Gate 10: Zero Technical Debt**
- No "TODO" comments ✓
- No "FIXME" comments ✓
- No commented-out code ✓
- No dead functions ✓

### Manual Validation Gate

**Gate 11: Human Approval** (MANDATORY)
- Complete all 9 workflow validations
- User must respond "VALIDATED"
- Only then proceed to commit

**Total Gates**: 11 (8 automated, 3 manual)

---

## Success Criteria

### Code Metrics

**File Size**:
- Original: 2,267 lines
- Target: ≤250 lines
- Mandatory: ≤400 lines
- **Reduction**: 89-91%

**State Management**:
- Original: 44 state variables
- Target: ≤8 state variables
- **Reduction**: 82%

**Functions**:
- Original: ~30 functions
- Target: ≤5 functions
- **Reduction**: 83%

**Supabase Imports**:
- Original: 1 import + 25+ direct queries
- Target: 0 imports + 0 direct queries
- **Reduction**: 100%

### Quality Metrics

**TypeScript**: Zero errors ✓  
**Tests**: 100% pass rate ✓  
**Build**: Success ✓  
**Coverage**: Maintained (Cells already tested) ✓  
**Performance**: ≤110% baseline ✓  

### Architecture Metrics

**Mandate Compliance**: 100% (M-CELL-3 satisfied) ✓  
**Technical Debt**: Zero new debt ✓  
**Forbidden Patterns**: Zero violations ✓  
**Cell Integration**: 6/6 Cells working ✓  

### Functional Metrics

**E2E Scenarios**: 7/7 passing ✓  
**User Workflows**: All functional ✓  
**Data Integrity**: Maintained ✓  
**Error Handling**: Graceful ✓  

---

## Documentation Updates

### Update 1: README.md

**Add Phase 7 completion section**:
```markdown
## Phase 7: Final Integration (COMPLETE) ✅

**Date**: 2025-10-07  
**Status**: SUCCESS  
**Commit**: [commit-sha]

**Achievements**:
- Refactored projects page from 2,267 → 250 lines (89% reduction)
- Removed all direct Supabase imports (100% elimination)
- Integrated 6 Cells into pure orchestrator
- 11/11 validation gates passed
- Zero technical debt

**Cells Integrated**:
1. CostBreakdownTableCell
2. VersionManagementCell
3. VersionComparisonCell
4. POBudgetComparisonCell
5. ForecastWizard
6. Project metadata (inline UI)

**Migration Complete**: All 7 phases of projects page modernization finished.
```

### Update 2: Architecture Health Doc

**File**: `thoughts/shared/architecture-health/2025-10-07_post-phase-7_architecture-health.md`

```markdown
# Architecture Health Assessment: Post-Phase 7

**Date**: 2025-10-07  
**Status**: ✅ HEALTHY  

## Mandate Compliance

| Mandate | Status | Evidence |
|---------|--------|----------|
| M-CELL-1 | ✅ COMPLIANT | All functionality in Cells |
| M-CELL-2 | ✅ COMPLIANT | Zero parallel implementations |
| M-CELL-3 | ✅ COMPLIANT | page.tsx = 250 lines (≤400) |
| M-CELL-4 | ✅ COMPLIANT | All Cells have ≥3 assertions |

## Metrics

**Cells**: 15 total  
**Procedures**: 17 (all ≤200 lines)  
**Routers**: 4 (all ≤50 lines)  
**Technical Debt**: ZERO  
**God Components**: ZERO  

## Conclusion

Phase 7 completion brings the projects page to **ANDA compliance perfection**. Zero technical debt, perfect mandate adherence, clean Cell architecture.

**Next Steps**: Identify next highest-value component for migration.
```

### Update 3: Ledger Entry

**File**: `ledger.jsonl`

```json
{
  "iteration_id": "iter_20251007_phase7_final_integration",
  "human_prompt": "Complete Phase 7: Final integration and cleanup of projects page",
  "timestamp": "2025-10-07T17:00:00Z",
  "status": "SUCCESS",
  "phase": "7_complete",
  "workflow_phase": "Phase 3: Planning → Phase 4: Implementation",
  
  "migration_metadata": {
    "target_component": "apps/web/app/projects/page.tsx",
    "original_size": 2267,
    "final_size": 250,
    "reduction_percent": 89,
    "strategy": "cleanup_and_integration",
    "complexity": "MEDIUM"
  },
  
  "artifacts_modified": [
    {
      "type": "orchestrator",
      "id": "projects-page",
      "path": "apps/web/app/projects/page.tsx",
      "lines_before": 2267,
      "lines_after": 250,
      "state_vars_before": 44,
      "state_vars_after": 8,
      "functions_before": 30,
      "functions_after": 5
    }
  ],
  
  "cleanup_performed": {
    "supabase_imports_removed": 1,
    "direct_queries_removed": 25,
    "obsolete_functions_removed": 25,
    "obsolete_state_removed": 36,
    "dead_code_lines_removed": 2017
  },
  
  "cells_integrated": [
    "cost-breakdown-table-cell",
    "version-management-cell",
    "version-comparison-cell",
    "po-budget-comparison-cell",
    "forecast-wizard"
  ],
  
  "validation": {
    "all_tests_pass": true,
    "typescript_errors": 0,
    "build_success": true,
    "file_size_compliant": true,
    "mandate_compliance": "100%",
    "human_validation": "approved",
    "performance_regression": false,
    "e2e_scenarios_passed": 7
  },
  
  "metrics": {
    "duration_hours": 12,
    "lines_reduced": 2017,
    "state_reduction_percent": 82,
    "function_reduction_percent": 83,
    "supabase_elimination_percent": 100
  },
  
  "health_status": {
    "technical_debt": 0,
    "mandate_violations": 0,
    "god_components": 0,
    "total_cells": 15,
    "architecture_health": "EXCELLENT"
  }
}
```

---

## Phase 4 Execution Checklist

**For MigrationExecutor** (zero-deviation execution):

### Pre-Implementation
- [ ] Read this entire plan thoroughly
- [ ] Understand target architecture (~250 lines)
- [ ] Create backup branch
- [ ] Run baseline tests (all pass)

### Step 1: Preparation (15 min)
- [ ] Create `phase-7-final-integration` branch
- [ ] Commit current state
- [ ] Document baseline metrics

### Step 2: Remove Dead Code (1-2 hours)
- [ ] Remove Supabase import
- [ ] Delete all Supabase query functions (25 functions)
- [ ] Remove obsolete state (36 variables)
- [ ] Verify TypeScript still compiles
- [ ] Intermediate checkpoint: <1000 lines

### Step 3: Refactor to Orchestrator (2-3 hours)
- [ ] Simplify rendering to Cell composition
- [ ] Keep only 8 state variables
- [ ] Keep only 5 functions
- [ ] Extract reusable UI components if needed
- [ ] Verify build succeeds
- [ ] **CRITICAL**: File ≤400 lines (MANDATORY)
- [ ] **TARGET**: File ≤250 lines

### Step 4: Testing (2-3 hours)
- [ ] Run all Cell unit tests (should already pass)
- [ ] Execute all 7 E2E scenarios
- [ ] Fix any issues found
- [ ] Verify no console errors

### Step 5: Performance & Validation (1-2 hours)
- [ ] Run performance benchmarks
- [ ] Verify ≤110% baseline
- [ ] Run architecture health checks
- [ ] All 11 gates pass
- [ ] **Human validation**: Complete 9-point checklist
- [ ] Wait for "VALIDATED" response

### Commit
- [ ] Atomic commit with all changes
- [ ] Commit message: "Phase 7: Final integration - refactor to orchestrator (2267→250 lines, -89%)"
- [ ] Update ledger.jsonl
- [ ] Update documentation

### Post-Implementation
- [ ] Merge to main (if validated)
- [ ] Deploy
- [ ] Monitor for issues
- [ ] Celebrate 🎉 (7/7 phases complete!)

---

## Risk Mitigation

### High-Risk Areas

**Risk 1: Breaking Existing Cells**
- **Mitigation**: Keep all Cell imports unchanged, only modify orchestrator logic
- **Validation**: Run Cell unit tests after each change

**Risk 2: State Management Issues**
- **Mitigation**: Carefully map old state to new minimal state
- **Validation**: Test version switching and project expansion thoroughly

**Risk 3: Performance Regression**
- **Mitigation**: Measure baseline before starting, validate after each step
- **Validation**: Performance gate with ≤110% requirement

**Risk 4: Data Loss**
- **Mitigation**: Zero database changes (this is UI-only refactor)
- **Validation**: E2E tests verify data integrity

### Medium-Risk Areas

**Risk 5: Missing Edge Cases**
- **Mitigation**: Comprehensive E2E test scenarios (7 scenarios)
- **Validation**: Human validation of all workflows

**Risk 6: TypeScript Errors**
- **Mitigation**: Incremental refactoring with type-check after each change
- **Validation**: Zero TypeScript errors gate

### Low-Risk Areas

**Risk 7: Build Failures**
- **Mitigation**: Test build after major changes
- **Validation**: Build gate

---

## Estimated Timeline

### Detailed Breakdown

```yaml
preparation: 0.5 hours
remove_dead_code: 1.5 hours
refactor_orchestrator: 2.5 hours
testing: 2.5 hours
performance_validation: 1.5 hours
documentation: 1.0 hours
buffer: 2.5 hours (20% contingency)

total: 12 hours (1.5 days)
```

### Milestone Schedule

**Day 1** (8 hours):
- Morning: Preparation + Remove Dead Code (2 hours)
- Afternoon: Refactor to Orchestrator (4 hours)
- Evening: Start Testing (2 hours)

**Day 2** (4 hours):
- Morning: Complete Testing + Performance (2 hours)
- Afternoon: Human Validation + Documentation (2 hours)

**Total**: 12 hours over 1.5 days

---

## Conclusion

Phase 7 is the **culminating achievement** of the 7-phase projects page modernization. It transforms a 2,267-line God component into a clean 250-line Cell orchestrator with:

- **89% code reduction** (2,267 → 250 lines)
- **100% Supabase elimination** (0 direct database access)
- **82% state reduction** (44 → 8 variables)
- **83% function reduction** (30 → 5 functions)
- **6 Cells integrated** seamlessly
- **Zero technical debt**
- **Perfect mandate compliance**

**This is not just a refactoring - it's the completion of a comprehensive architectural transformation** that sets the standard for all future migrations.

**Status**: ✅ READY FOR PHASE 4 IMPLEMENTATION

---

**Plan Generated**: 2025-10-07T17:00:00Z  
**Architect**: MigrationArchitect (with ULTRATHINK)  
**Next Phase**: Phase 4 - Implementation by MigrationExecutor  
**Final Phase**: 7/7 - COMPLETE MIGRATION
