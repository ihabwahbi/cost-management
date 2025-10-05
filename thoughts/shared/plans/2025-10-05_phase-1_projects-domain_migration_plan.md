# Migration Plan: Phase 1 - Projects Domain Migration

**Date**: 2025-10-05  
**Architect**: MigrationArchitect  
**Workflow Phase**: Phase 3 - Migration Planning  
**Enhancement Mode**: ✅ ULTRATHINK ACTIVE  
**Status**: ready_for_implementation  
**Phase**: 1 of 7  

---

## Metadata

**Based On**:
- **Discovery Report**: `thoughts/shared/discoveries/2025-10-05_discovery-report.md`
- **Analysis Report**: `thoughts/shared/analysis/2025-10-05_16-00_projects-page_analysis.md`

**Migration Target**:
- **Component**: Projects Domain (extracted from `projects/page.tsx`)
- **Current Lines**: 2,803 total (Projects domain: ~400 lines)
- **Target Lines**: ~200 lines (Cell + orchestrator integration)
- **Complexity**: MEDIUM
- **Strategy**: Standard 7-step sequence
- **Estimated Duration**: 3-5 days (24-40 hours)

---

## Executive Summary

Phase 1 establishes the foundation for the 7-phase monolith extraction by migrating the **Projects Domain** to ANDA Cell architecture. This phase creates 4 specialized tRPC procedures (following M1-M4 mandates) and the `project-list-cell` Cell component, replacing all direct Supabase database access for the `projects` table.

**Scope**:
- Extract project CRUD operations (lines 402-418, 1728-1770)
- Create 4 specialized tRPC procedures (one per file, ≤200 lines each)
- Build `project-list-cell` with 6 behavioral assertions
- Atomic replacement - no parallel implementations

**Priority**: **HIGH** - Unblocks other phases, establishes migration pattern

**Risk Level**: **LOW-MEDIUM** - Simple domain, well-bounded functionality, no complex state

---

## Migration Overview

### Component Details

**Current Implementation**:
```yaml
Location: apps/web/app/projects/page.tsx (lines 402-418, 1728-1770)
Functions:
  - loadProjects (lines 402-418): SELECT all projects
  - createNewProject (lines 1744-1770): INSERT project
  - deleteProject (lines 1728-1742): DELETE project
  - (Update not currently implemented)
Database Access: Direct Supabase client
State Management: Local useState (projects, creatingNewProject, newProjectData, deletingProject)
```

**Target Architecture**:
```yaml
API Layer: 4 specialized procedures in packages/api/src/procedures/projects/
Cell: components/cells/project-list-cell/
Orchestrator: apps/web/app/projects/page.tsx (projects section only)
```

### Dependencies

**Data Dependencies**:
- **Database**: `projects` table (Drizzle schema already exists ✅)
- **Foreign Keys**: None (projects is root entity)

**Component Dependencies**:
- **Child Components**: KeyboardShortcutsHelp (minimal coupling)
- **UI Dependencies**: shadcn Button, Dialog, Input components

**Importers**: 
- Current page only - no external components depend on projects logic

---

## Architecture Compliance Validation

**Pre-Implementation Verification** (Phase 5.5 Self-Validation):

### Architectural Mandates

- **M-CELL-1** (All Functionality as Cells): ✅ **COMPLIANT**
  - **Classification**: Project management UI with state = **Cell** (per decision tree)
  - **Justification**: Combines data fetching (tRPC), local state (project creation/deletion), and rendering

- **M-CELL-2** (Complete Atomic Migrations): ✅ **COMPLIANT**
  - **Deletion**: Old projects logic removed from page.tsx in **same commit** as Cell creation (Step 6)
  - **Atomic Scope**: All 4 CRUD operations migrated together, no partial state

- **M-CELL-3** (Zero God Components): ✅ **COMPLIANT**
  - **Cell Size**: project-list-cell estimated ~180 lines (well under 400)
  - **No Extraction Needed**: Single-purpose component (project list management)

- **M-CELL-4** (Explicit Behavioral Contracts): ✅ **COMPLIANT**
  - **Assertions Planned**: 6 behavioral assertions (exceeds minimum of 3)
  - **Source**: BA-001, BA-002, BA-007, BA-010, BA-011, BA-021 from analysis

### Specialized Procedure Architecture

- **One Procedure Per File (M1)**: ✅ 4 procedure files planned
  - `get-projects-list.procedure.ts`
  - `create-project.procedure.ts`
  - `update-project.procedure.ts`
  - `delete-project.procedure.ts`

- **Procedure Size Limits (M2)**: ✅ All procedures ≤200 lines
  - Largest: get-projects-list.procedure.ts (~40 lines)
  - Smallest: delete-project.procedure.ts (~25 lines)

- **Router Complexity**: ✅ Domain router ≤50 lines
  - `projects.router.ts` estimated ~15 lines (import + merge only)

- **No Parallel Implementations (M3)**: ✅ Verified
  - All procedures in `packages/api/src/procedures/projects/`
  - No code in deprecated `supabase/functions/trpc/` location

### Forbidden Pattern Scan

- ✅ **"optional" phases**: None detected (all steps required)
- ✅ **"future cleanup"**: None detected (immediate deletion planned)
- ✅ **"temporary exemption"**: None detected
- ✅ **File size exemptions**: None detected (all files ≤400 lines)

**Compliance Status**: ✅ **COMPLIANT** - Ready for Phase 4 implementation

---

## Data Layer Specifications

### Drizzle Schema

**Status**: ✅ **ALREADY EXISTS** - No changes needed

**Schema Location**: `packages/db/src/schema/projects.ts`

**Schema Verification**:
```typescript
// Existing schema matches database 100%
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  subBusinessLine: text('sub_business_line').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

// Relationships: Root entity (no foreign keys)
// Indexes: Primary key on id (sufficient for this domain)
```

---

### tRPC Procedures (Specialized Architecture)

**Domain Router**: `packages/api/src/procedures/projects/projects.router.ts`

#### Procedure 1: Get Projects List

**File**: `packages/api/src/procedures/projects/get-projects-list.procedure.ts`  
**Estimated Size**: ~40 lines  
**Purpose**: Retrieve all projects with optional search and ordering

**Input Schema**:
```typescript
.input(z.object({
  orderBy: z.enum(['name', 'createdAt']).optional().default('createdAt'),
  orderDirection: z.enum(['asc', 'desc']).optional().default('desc'),
  search: z.string().optional()
}))
```

**Output Schema**:
```typescript
z.array(z.object({
  id: z.string().uuid(),
  name: z.string(),
  subBusinessLine: z.string(),
  createdAt: z.date(),
  updatedAt: z.date()
}))
```

**Implementation Notes**:
```typescript
import { z } from 'zod'
import { publicProcedure, router } from '../../trpc'
import { db } from '@/db'
import { projects } from '@/db/schema'
import { desc, asc, like, or } from 'drizzle-orm'

export const getProjectsListRouter = router({
  getProjectsList: publicProcedure
    .input(z.object({
      orderBy: z.enum(['name', 'createdAt']).optional().default('createdAt'),
      orderDirection: z.enum(['asc', 'desc']).optional().default('desc'),
      search: z.string().optional()
    }))
    .query(async ({ input }) => {
      let query = db.select().from(projects)
      
      // Search filter
      if (input.search) {
        query = query.where(like(projects.name, `%${input.search}%`))
      }
      
      // Ordering
      const orderFn = input.orderDirection === 'asc' ? asc : desc
      const orderCol = input.orderBy === 'name' ? projects.name : projects.createdAt
      query = query.orderBy(orderFn(orderCol))
      
      return await query
    })
})
```

**Curl Test Command**:
```bash
curl -X POST https://[PROJECT].supabase.co/functions/v1/trpc/projects.getProjectsList \
  -H "Content-Type: application/json" \
  -d '{
    "0": {
      "json": {
        "orderBy": "createdAt",
        "orderDirection": "desc"
      }
    }
  }'
```

**Expected Response**: `200 OK` with array of project objects

---

#### Procedure 2: Create Project

**File**: `packages/api/src/procedures/projects/create-project.procedure.ts`  
**Estimated Size**: ~30 lines  
**Purpose**: Create new project with validation

**Input Schema**:
```typescript
.input(z.object({
  name: z.string().min(1, "Project name required").max(255),
  subBusinessLine: z.enum([
    'Wireline',
    'Drilling & Measurement',
    'Well Construction',
    'Completions',
    'OneSubsea',
    'Production Systems'
  ])
}))
```

**Output Schema**:
```typescript
z.object({
  id: z.string().uuid(),
  name: z.string(),
  subBusinessLine: z.string(),
  createdAt: z.date(),
  updatedAt: z.date()
})
```

**Implementation Notes**:
```typescript
import { z } from 'zod'
import { publicProcedure, router } from '../../trpc'
import { db } from '@/db'
import { projects } from '@/db/schema'
import { TRPCError } from '@trpc/server'

export const createProjectRouter = router({
  createProject: publicProcedure
    .input(z.object({
      name: z.string().min(1, "Project name required").max(255),
      subBusinessLine: z.enum([
        'Wireline', 'Drilling & Measurement', 'Well Construction',
        'Completions', 'OneSubsea', 'Production Systems'
      ])
    }))
    .mutation(async ({ input }) => {
      try {
        const [newProject] = await db
          .insert(projects)
          .values({
            name: input.name,
            subBusinessLine: input.subBusinessLine
          })
          .returning()
        
        if (!newProject) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create project'
          })
        }
        
        return newProject
      } catch (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error instanceof Error ? error.message : 'Failed to create project'
        })
      }
    })
})
```

**Curl Test Command**:
```bash
curl -X POST https://[PROJECT].supabase.co/functions/v1/trpc/projects.createProject \
  -H "Content-Type: application/json" \
  -d '{
    "0": {
      "json": {
        "name": "Test Project Migration Phase 1",
        "subBusinessLine": "Wireline"
      }
    }
  }'
```

**Expected Response**: `200 OK` with created project object including UUID

---

#### Procedure 3: Update Project

**File**: `packages/api/src/procedures/projects/update-project.procedure.ts`  
**Estimated Size**: ~35 lines  
**Purpose**: Update existing project (future-proofing, not currently used)

**Input Schema**:
```typescript
.input(z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  subBusinessLine: z.enum([
    'Wireline', 'Drilling & Measurement', 'Well Construction',
    'Completions', 'OneSubsea', 'Production Systems'
  ]).optional()
}))
```

**Output Schema**:
```typescript
z.object({
  id: z.string().uuid(),
  name: z.string(),
  subBusinessLine: z.string(),
  createdAt: z.date(),
  updatedAt: z.date()
})
```

**Implementation Notes**:
```typescript
import { z } from 'zod'
import { publicProcedure, router } from '../../trpc'
import { db } from '@/db'
import { projects } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'

export const updateProjectRouter = router({
  updateProject: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
      name: z.string().min(1).max(255).optional(),
      subBusinessLine: z.enum([
        'Wireline', 'Drilling & Measurement', 'Well Construction',
        'Completions', 'OneSubsea', 'Production Systems'
      ]).optional()
    }))
    .mutation(async ({ input }) => {
      const { id, ...updates } = input
      
      if (Object.keys(updates).length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No fields to update'
        })
      }
      
      const [updated] = await db
        .update(projects)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(projects.id, id))
        .returning()
      
      if (!updated) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found'
        })
      }
      
      return updated
    })
})
```

**Curl Test Command**:
```bash
curl -X POST https://[PROJECT].supabase.co/functions/v1/trpc/projects.updateProject \
  -H "Content-Type: application/json" \
  -d '{
    "0": {
      "json": {
        "id": "[REAL-PROJECT-UUID]",
        "name": "Updated Project Name"
      }
    }
  }'
```

**Expected Response**: `200 OK` with updated project object

---

#### Procedure 4: Delete Project

**File**: `packages/api/src/procedures/projects/delete-project.procedure.ts`  
**Estimated Size**: ~25 lines  
**Purpose**: Delete project with cascade confirmation

**Input Schema**:
```typescript
.input(z.object({
  id: z.string().uuid()
}))
```

**Output Schema**:
```typescript
z.object({
  success: z.boolean(),
  deletedId: z.string().uuid()
})
```

**Implementation Notes**:
```typescript
import { z } from 'zod'
import { publicProcedure, router } from '../../trpc'
import { db } from '@/db'
import { projects } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'

export const deleteProjectRouter = router({
  deleteProject: publicProcedure
    .input(z.object({
      id: z.string().uuid()
    }))
    .mutation(async ({ input }) => {
      const [deleted] = await db
        .delete(projects)
        .where(eq(projects.id, input.id))
        .returning()
      
      if (!deleted) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found'
        })
      }
      
      return {
        success: true,
        deletedId: deleted.id
      }
    })
})
```

**Curl Test Command**:
```bash
curl -X POST https://[PROJECT].supabase.co/functions/v1/trpc/projects.deleteProject \
  -H "Content-Type: application/json" \
  -d '{
    "0": {
      "json": {
        "id": "[PROJECT-UUID-TO-DELETE]"
      }
    }
  }'
```

**Expected Response**: `200 OK` with `{ success: true, deletedId: "uuid" }`

---

#### Domain Router

**File**: `packages/api/src/procedures/projects/projects.router.ts`  
**Estimated Size**: ~15 lines  
**Purpose**: Aggregate all projects procedures (M3 mandate: aggregation only)

**Implementation**:
```typescript
import { router } from '../../trpc'
import { getProjectsListRouter } from './get-projects-list.procedure'
import { createProjectRouter } from './create-project.procedure'
import { updateProjectRouter } from './update-project.procedure'
import { deleteProjectRouter } from './delete-project.procedure'

export const projectsRouter = router({
  ...getProjectsListRouter,
  ...createProjectRouter,
  ...updateProjectRouter,
  ...deleteProjectRouter,
})
```

**Validation**:
- ✅ File size: ~15 lines (well under 50-line limit)
- ✅ No business logic (imports + merge only)
- ✅ Aggregates 4 specialized procedure routers

---

### Main App Router Update

**File**: `packages/api/src/index.ts`

**Required Change**:
```typescript
// Add import
import { projectsRouter } from './procedures/projects/projects.router'

// Add to app router
export const appRouter = router({
  dashboard: dashboardRouter,
  forecasts: forecastsRouter,
  projects: projectsRouter,  // ← ADD THIS LINE
  // ... other domain routers
})
```

---

## Cell Structure Specifications

### Directory Structure

```
components/cells/project-list-cell/
├── component.tsx          # Main Cell component (~180 lines)
├── manifest.json         # 6 behavioral assertions
├── pipeline.yaml         # 5 validation gates
└── __tests__/
    └── component.test.tsx  # Unit tests
```

**Note**: No `state.ts` needed - local React state sufficient for simple project management

---

### Manifest Specification

**File**: `components/cells/project-list-cell/manifest.json`

```json
{
  "id": "project-list-cell",
  "version": "1.0.0",
  "description": "Project list management with CRUD operations - extracted from projects/page.tsx monolith",
  "behavioral_assertions": [
    {
      "id": "BA-001",
      "description": "Component displays list of all projects ordered by creation date",
      "verification": "Mock getProjectsList query with desc order, verify projects render in correct order",
      "source": "Original lines 402-418 (loadProjects)"
    },
    {
      "id": "BA-002",
      "description": "Component shows total budget for each project in project header",
      "verification": "Mock project with cost data, verify calculated total displays",
      "source": "Original lines 2054-2060"
    },
    {
      "id": "BA-007",
      "description": "Component shows 'No projects found' when project list is empty",
      "verification": "Mock empty array from getProjectsList, verify empty state message appears",
      "source": "Original lines 2022-2025"
    },
    {
      "id": "BA-010",
      "description": "Component creates new project when form submitted with valid data",
      "verification": "Fill project form, mock createProject mutation, verify success toast and project added to list",
      "source": "Original lines 1744-1770 (createNewProject)"
    },
    {
      "id": "BA-011",
      "description": "Component deletes project with confirmation dialog",
      "verification": "Click delete, verify confirm dialog appears, mock deleteProject mutation, verify project removed",
      "source": "Original lines 1728-1742, 2072-2096"
    },
    {
      "id": "BA-021",
      "description": "Component auto-expands first project on initial load",
      "verification": "Load component, verify first project in list is expanded automatically",
      "source": "Original lines 371-400 (auto-expand effect)"
    }
  ],
  "dependencies": {
    "data": ["projects"],
    "ui": ["shadcn/ui Button", "shadcn/ui Dialog", "shadcn/ui Input", "toast"],
    "api": ["projects.getProjectsList", "projects.createProject", "projects.deleteProject"]
  },
  "performance": {
    "baseline_load_time_ms": null,
    "target_load_time_ms": 200
  }
}
```

---

### Pipeline Specification

**File**: `components/cells/project-list-cell/pipeline.yaml`

```yaml
gates:
  - id: types
    name: "TypeScript Compilation"
    command: "pnpm type-check"
    requirement: "Zero TypeScript errors"
    automated: true
    
  - id: tests
    name: "Unit Tests"
    command: "pnpm test components/cells/project-list-cell"
    requirement: "All tests pass, coverage ≥80%"
    automated: true
    
  - id: build
    name: "Production Build"
    command: "pnpm build"
    requirement: "Build succeeds with zero errors"
    automated: true
    
  - id: performance
    name: "Performance Validation"
    requirement: "Load time ≤110% of baseline (≤220ms)"
    measurement: "React DevTools Profiler"
    automated: false
    
  - id: accessibility
    name: "Accessibility"
    standard: "WCAG AA"
    requirement: "Keyboard navigation, screen reader support, color contrast"
    automated: false
```

---

### Component Implementation Specifications

**File**: `components/cells/project-list-cell/component.tsx`

**Critical Patterns** (from cell-development-checklist.md):

#### 1. tRPC Query Implementation

```typescript
'use client'

import { useMemo, useCallback } from 'react'
import { trpc } from '@/lib/trpc'

export function ProjectListCell() {
  // ✅ CRITICAL: Memoize query inputs
  const queryInput = useMemo(() => ({
    orderBy: 'createdAt' as const,
    orderDirection: 'desc' as const
  }), [])  // Empty deps = stable reference
  
  const { data: projects, isLoading, error } = trpc.projects.getProjectsList.useQuery(
    queryInput,
    {
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000  // 5 minutes
    }
  )
  
  // Additional queries...
}
```

#### 2. Mutation Implementation

```typescript
const createProjectMutation = trpc.projects.createProject.useMutation({
  onSuccess: (newProject) => {
    toast.success(`Project "${newProject.name}" created successfully`)
    // Invalidate queries to refetch list
    utils.projects.getProjectsList.invalidate()
  },
  onError: (error) => {
    toast.error(`Failed to create project: ${error.message}`)
  }
})

const handleCreateProject = useCallback((data: CreateProjectInput) => {
  createProjectMutation.mutate(data)
}, [createProjectMutation])
```

#### 3. Loading/Error/Empty States

```typescript
if (isLoading) {
  return <ProjectListSkeleton />
}

if (error) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Error Loading Projects</AlertTitle>
      <AlertDescription>{error.message}</AlertDescription>
    </Alert>
  )
}

if (!projects || projects.length === 0) {
  return (
    <div className="text-center py-12">
      <p className="text-muted-foreground">No projects found</p>
      <Button onClick={() => setShowCreateDialog(true)}>
        Create First Project
      </Button>
    </div>
  )
}

// Render projects list...
```

#### 4. Memoization Pattern Enforcement

```typescript
// ✅ ALWAYS memoize callbacks passed as props
const handleProjectClick = useCallback((projectId: string) => {
  // Handle project selection
}, [])

const handleDeleteClick = useCallback((projectId: string) => {
  // Show confirmation dialog
  setProjectToDelete(projectId)
}, [])
```

**Estimated Component Size**: ~180 lines (well under 400 limit)

---

## Migration Sequence (7 Steps)

### Step 1: Create Drizzle Schemas

**Phase**: Data Layer  
**Action**: Verify schema exists  
**Duration**: 5 minutes  

**Tasks**:
- ✅ Schema already exists: `packages/db/src/schema/projects.ts`
- Verify schema matches database: ✅ Confirmed in analysis
- No changes required

**Validation**:
```bash
# Verify schema file exists
ls packages/db/src/schema/projects.ts

# Verify export in index
grep "projects" packages/db/src/schema/index.ts
```

**Success Criteria**: Schema file exists and is exported ✅

---

### Step 2: Create tRPC Specialized Procedures

**Phase**: Data Layer  
**Action**: Implement 4 specialized procedures + domain router  
**Duration**: 2-3 hours  

**Tasks**:
1. Create directory: `packages/api/src/procedures/projects/`
2. Implement `get-projects-list.procedure.ts` (~40 lines)
3. Implement `create-project.procedure.ts` (~30 lines)
4. Implement `update-project.procedure.ts` (~35 lines)
5. Implement `delete-project.procedure.ts` (~25 lines)
6. Create `projects.router.ts` (~15 lines)
7. Update `packages/api/src/index.ts` to include projectsRouter

**Validation**:
```bash
# Verify file sizes (M2 mandate)
wc -l packages/api/src/procedures/projects/*.procedure.ts
# All MUST be ≤200 lines

# Verify router size
wc -l packages/api/src/procedures/projects/projects.router.ts
# MUST be ≤50 lines

# Verify one procedure per file (M1)
for file in packages/api/src/procedures/projects/*.procedure.ts; do
  count=$(grep -c "publicProcedure" "$file")
  if [ "$count" -ne 1 ]; then
    echo "❌ M1 VIOLATION: $file has $count procedures"
  fi
done

# TypeScript compilation
pnpm type-check
```

**Success Criteria**:
- ✅ All 4 procedure files created
- ✅ All files ≤200 lines (M2 compliant)
- ✅ One procedure per file (M1 compliant)
- ✅ Domain router ≤50 lines
- ✅ TypeScript compiles with zero errors

---

### Step 3: Test Procedures with Curl & Deploy

**Phase**: Data Layer  
**Action**: Independent procedure testing + edge function deployment  
**Duration**: 30-45 minutes  

**Tasks**:
1. **Test locally (before deploy)**:
   ```bash
   # Start local development
   pnpm dev
   
   # Test each procedure with curl (use curl commands from Step 2 specs)
   # Test: getProjectsList
   # Test: createProject
   # Test: updateProject
   # Test: deleteProject
   ```

2. **Deploy edge function**:
   ```bash
   supabase functions deploy trpc --no-verify-jwt
   ```

3. **Wait for cold start**: 30 seconds

4. **Re-test deployed procedures**:
   ```bash
   # Re-run all curl tests against deployed endpoint
   # Use actual Supabase project URL
   ```

**Validation**:
```bash
# All curl tests MUST return 200 OK
# Verify response structure matches output schemas
# Test error cases (invalid UUID, missing fields)
```

**Success Criteria**:
- ✅ All procedures tested via curl before deployment
- ✅ Edge function deployed successfully
- ✅ All procedures return 200 OK after deployment
- ✅ Response structures match schemas
- ✅ Error handling works (400 Bad Request for invalid inputs)

**CRITICAL**: DO NOT proceed to Step 4 until all curl tests pass ✅

---

### Step 4: Create Cell Structure

**Phase**: Cell Creation  
**Action**: Create directory, manifest, pipeline files  
**Duration**: 30 minutes  

**Tasks**:
1. Create directory: `components/cells/project-list-cell/`
2. Create `manifest.json` (copy from Cell Structure Specifications above)
3. Create `pipeline.yaml` (copy from Cell Structure Specifications above)
4. Create `__tests__/component.test.tsx` (skeleton)

**Validation**:
```bash
# Verify structure
tree components/cells/project-list-cell/

# Validate manifest JSON
cat components/cells/project-list-cell/manifest.json | jq '.'

# Verify behavioral assertions count
cat components/cells/project-list-cell/manifest.json | jq '.behavioral_assertions | length'
# Must be ≥3 (we have 6)
```

**Success Criteria**:
- ✅ Directory structure complete
- ✅ Manifest valid JSON with 6 assertions
- ✅ Pipeline YAML valid
- ✅ Test file skeleton created

---

### Step 5: Implement Cell Component

**Phase**: Implementation  
**Action**: Build component with tRPC, memoization, tests  
**Duration**: 3-4 hours  

**Tasks**:
1. **Implement component.tsx** (~180 lines):
   - Import tRPC client
   - Implement queries with memoized inputs
   - Implement mutations with error handling
   - Add loading/error/empty states
   - Apply memoization patterns (useCallback for all event handlers)

2. **Critical Memoization Checklist**:
   - ✅ Query inputs wrapped in `useMemo`
   - ✅ Event handlers wrapped in `useCallback`
   - ✅ Computed values wrapped in `useMemo`
   - ✅ No inline object/array creation in JSX

3. **Implement unit tests** (6 tests for 6 assertions):
   ```typescript
   // Test BA-001: Displays projects in order
   // Test BA-002: Shows total budget
   // Test BA-007: Empty state
   // Test BA-010: Create project
   // Test BA-011: Delete with confirmation
   // Test BA-021: Auto-expand first project
   ```

4. **Add defensive logging** (temporary):
   ```typescript
   console.log('[ProjectListCell] Query state:', { 
     isLoading, 
     hasData: !!projects, 
     projectCount: projects?.length 
   })
   ```

**Validation**:
```bash
# TypeScript compilation
pnpm type-check

# Run tests
pnpm test components/cells/project-list-cell

# Check coverage
pnpm test:coverage components/cells/project-list-cell
# Must be ≥80%

# Verify file size
wc -l components/cells/project-list-cell/component.tsx
# Must be ≤400 lines (target: ~180)
```

**Success Criteria**:
- ✅ Component compiles with zero TypeScript errors
- ✅ All 6 tests pass
- ✅ Coverage ≥80%
- ✅ Component ≤400 lines (target: ~180)
- ✅ All memoization patterns applied

---

### Step 6: Update Imports & Delete Old Code

**Phase**: Integration  
**Action**: Atomic replacement - add Cell, remove old code  
**Duration**: 45 minutes  

**Tasks**:
1. **In `apps/web/app/projects/page.tsx`**:
   - Import ProjectListCell
   - Replace projects section with Cell component
   - Remove old functions: loadProjects, createNewProject, deleteProject
   - Remove old state: projects, creatingNewProject, newProjectData, deletingProject
   - Remove Supabase import for projects (keep for other domains)

2. **Update orchestrator props**:
   ```typescript
   // Old (REMOVE):
   const [projects, setProjects] = useState([])
   const loadProjects = async () => { /* ... */ }
   
   // New (ADD):
   import { ProjectListCell } from '@/components/cells/project-list-cell/component'
   
   // In JSX:
   <ProjectListCell 
     onProjectSelect={(projectId) => setExpandedProjects([projectId])}
   />
   ```

3. **Line count reduction tracking**:
   ```bash
   # Before: Count lines related to projects
   # After: Verify reduction
   ```

**Validation**:
```bash
# Verify no broken imports
pnpm type-check

# Verify old functions removed
grep "loadProjects\|createNewProject\|deleteProject" apps/web/app/projects/page.tsx
# Should return: NO MATCHES

# Verify Cell imported
grep "ProjectListCell" apps/web/app/projects/page.tsx
# Should return: MATCHES

# Build succeeds
pnpm build
```

**Success Criteria**:
- ✅ Cell imported and rendering
- ✅ Old functions deleted
- ✅ Old state removed
- ✅ TypeScript compiles
- ✅ Build succeeds
- ✅ No broken imports

**CRITICAL**: This is an ATOMIC operation - all changes in ONE commit

---

### Step 7: Full Validation Suite

**Phase**: Validation  
**Action**: Comprehensive testing and validation  
**Duration**: 30-45 minutes  

**Tasks**:

1. **Technical Validation**:
   ```bash
   # TypeScript
   pnpm type-check
   # Expected: Zero errors
   
   # Tests
   pnpm test
   # Expected: All tests pass
   
   # Build
   pnpm build
   # Expected: Production build succeeds
   ```

2. **Browser Manual Testing** (MANDATORY):
   - Open `http://localhost:3000/projects`
   - Verify projects list loads
   - Verify auto-expand of first project
   - Test create project flow
   - Test delete project flow
   - Check Network tab: Should see ONE POST to /trpc with batched queries
   - Check Console: No errors, defensive logs visible
   - Verify loading states (refresh page, watch skeleton)

3. **Performance Validation**:
   ```bash
   # Open React DevTools Profiler
   # Record project list load
   # Verify <5 renders total
   # Verify load time ≤220ms
   ```

4. **Accessibility Check**:
   - Tab through interface - all buttons reachable
   - Screen reader announces project names
   - Keyboard shortcuts work (if implemented)

**Human Validation Gate** (MANDATORY):

```markdown
🛑 HUMAN VALIDATION REQUIRED

Please validate in browser:
1. ✅ Project list displays correctly
2. ✅ Projects ordered by creation date (newest first)
3. ✅ First project auto-expanded
4. ✅ Create project works (shows in list immediately)
5. ✅ Delete project works (shows confirmation dialog)
6. ✅ Empty state shows when no projects
7. ✅ Loading skeleton appears on refresh
8. ✅ No console errors
9. ✅ Network tab shows successful batched tRPC request

Respond with "VALIDATED - proceed with commit" or "FIX ISSUES - [describe]"
```

**Success Criteria**:
- ✅ All technical gates pass
- ✅ Manual browser testing complete
- ✅ Performance within budget
- ✅ Accessibility validated
- ✅ **Human validation approved**

**DO NOT proceed to commit without human approval** ⚠️

---

## Rollback Strategy

### Trigger Conditions

Rollback if ANY of the following occur:
- ❌ TypeScript compilation fails
- ❌ Tests fail
- ❌ Build fails
- ❌ Curl tests fail (Step 3)
- ❌ Browser testing reveals broken functionality
- ❌ Performance regression >10% (load time >220ms)
- ❌ Human validation rejected

### Rollback Sequence

**Step 1: Git Revert**
```bash
# Undo migration commit
git revert HEAD

# Or if not yet committed:
git reset --hard HEAD
git clean -fd
```

**Step 2: Verify Revert Successful**
```bash
# Old code restored?
grep "loadProjects" apps/web/app/projects/page.tsx
# Should return: MATCHES (old function back)

# New Cell removed?
ls components/cells/project-list-cell/
# Should return: No such file or directory

# Build succeeds?
pnpm build
# Should return: Success
```

**Step 3: Update Ledger with Failure**
```bash
# Add entry to ledger.jsonl
{
  "iteration_id": "iter_20251005_phase1_projects_FAILED",
  "timestamp": "2025-10-05T[TIME]Z",
  "status": "FAILED",
  "failure_reason": "[Specific reason from trigger condition]",
  "failed_at_step": "[Step number]",
  "error_messages": "[Error details]",
  "lessons_learned": "[What to do differently next time]"
}
```

### Edge Function Handling

**Strategy**: Leave deployed procedures in place
- **Rationale**: tRPC procedures are additive - unused procedures don't break anything
- **Benefit**: Can reuse in next migration attempt without redeployment
- **Note**: If procedures have bugs, can deploy fix without full rollback

### Partial Progress Handling

**Philosophy**: NO partial migrations allowed (M-CELL-2 mandate)

**Action on ANY failure**: Full rollback, not partial fixes

**Rationale**: Atomic completeness principle - either fully migrated or fully rolled back

---

## Validation Strategy

### Technical Validation (Automated)

#### TypeScript Compilation
```yaml
Gate: types
Command: pnpm type-check
Requirement: Zero TypeScript errors
Automated: Yes
Blocking: Yes
```

#### Unit Tests
```yaml
Gate: tests
Command: pnpm test components/cells/project-list-cell
Requirements:
  - All tests pass (6 tests for 6 behavioral assertions)
  - Coverage ≥80%
  - All assertions verified
Automated: Yes
Blocking: Yes
```

#### Production Build
```yaml
Gate: build
Command: pnpm build
Requirement: Build succeeds with zero errors
Automated: Yes
Blocking: Yes
```

### Functional Validation (Manual + Automated)

#### Feature Parity
```yaml
Requirement: Cell works identically to old implementation
Method:
  - Side-by-side comparison (if old code still exists)
  - Test all CRUD operations
  - Verify project list ordering
  - Verify auto-expand behavior
Automated: Partial (unit tests cover some)
Blocking: Yes
```

#### Performance
```yaml
Gate: performance
Requirement: Load time ≤110% baseline
Baseline: TBD (measure current implementation first)
Target: ≤220ms (assuming 200ms baseline)
Measurement:
  - React DevTools Profiler
  - Network tab (Time to First Byte)
  - Console performance.now() logs
Automated: No
Blocking: Yes (if >10% regression)
```

### Architectural Validation (Automated)

#### Cell Structure Complete
```yaml
Requirements:
  - manifest.json exists with ≥3 assertions (we have 6) ✅
  - pipeline.yaml configured with all gates ✅
  - component.tsx uses only tRPC (no direct DB) ✅
  - Old code deleted from page.tsx ✅
Automated: Partial (file existence checks)
Blocking: Yes
```

#### Specialized Procedure Architecture
```yaml
Requirements:
  - One procedure per file (M1) ✅
  - All procedures ≤200 lines (M2) ✅
  - Domain router ≤50 lines ✅
  - No parallel implementations (M3) ✅
Validation:
  bash
  # Verify procedure counts
  find packages/api/src/procedures/projects -name "*.procedure.ts" -exec sh -c 'count=$(grep -c "publicProcedure" "$1"); if [ "$count" -ne 1 ]; then echo "❌ $1"; fi' _ {} \;
  
  # Verify file sizes
  wc -l packages/api/src/procedures/projects/*.ts
  
Automated: Yes (bash scripts)
Blocking: Yes
```

#### Ledger Updated
```yaml
Requirement: Migration entry created in ledger.jsonl
Content:
  - Migration ID
  - Timestamp
  - Artifacts created (4 procedures, 1 Cell, 1 router)
  - Artifacts modified (page.tsx, index.ts)
  - Validation status
Automated: No (manual entry)
Blocking: No (but required for completion)
```

### Manual Validation Gate (MANDATORY)

**Condition**: Phase 1 establishes pattern for 6 subsequent phases

**Human Validation Required**:

```yaml
Validation Checklist:
  - [ ] Project list displays correctly in browser
  - [ ] Projects ordered by creation date (newest first)
  - [ ] First project auto-expanded on load
  - [ ] Create project form works
  - [ ] New project appears immediately in list
  - [ ] Delete project shows confirmation dialog
  - [ ] Delete removes project from list
  - [ ] Empty state shows when no projects
  - [ ] Loading skeleton appears on page refresh
  - [ ] No console errors
  - [ ] Network tab shows ONE batched tRPC request
  - [ ] Network tab shows 200 OK response
  - [ ] No visual regressions compared to old implementation

Approval Format: "VALIDATED - proceed with commit"
Rejection Format: "FIX ISSUES - [specific issues]"
```

**Blocking**: YES - cannot commit without approval

**Rationale**: Phase 1 establishes the migration pattern that will be replicated 6 more times. Must be perfect.

---

## Success Criteria

### Deliverables Checklist

**API Layer**:
- [x] 4 specialized procedure files created (≤200 lines each)
- [x] 1 domain router created (≤50 lines)
- [x] Main app router updated
- [x] All procedures tested via curl
- [x] Edge function deployed

**Cell Layer**:
- [x] project-list-cell directory created
- [x] component.tsx implemented (~180 lines)
- [x] manifest.json with 6 behavioral assertions
- [x] pipeline.yaml with 5 gates
- [x] Unit tests with ≥80% coverage

**Integration**:
- [x] Cell imported in page.tsx
- [x] Old projects functions deleted
- [x] Old projects state removed
- [x] No broken imports

**Validation**:
- [x] All technical gates pass (types, tests, build)
- [x] All curl tests pass
- [x] Browser testing complete
- [x] Performance within budget (≤110% baseline)
- [x] Human validation approved
- [x] Ledger updated

### Measurable Outcomes

```yaml
Code Quality:
  - TypeScript errors: 0
  - Test coverage: ≥80%
  - Behavioral assertions verified: 6/6

Architecture Compliance:
  - M-CELL-1: ✅ (functionality is Cell)
  - M-CELL-2: ✅ (atomic migration, old code deleted)
  - M-CELL-3: ✅ (component ≤400 lines)
  - M-CELL-4: ✅ (6 behavioral assertions)
  - M1 (One procedure per file): ✅
  - M2 (Procedures ≤200 lines): ✅
  - M3 (No parallel implementations): ✅

Performance:
  - Load time: ≤220ms
  - Render count: ≤5
  - Network requests: 1 (batched)

Code Reduction:
  - Lines removed from page.tsx: ~400
  - Lines added (Cell + procedures): ~310
  - Net reduction: ~90 lines
  - page.tsx new size: ~2,400 lines (progress toward ~200 target)
```

### Phase 1 Completion Gate

Phase 1 is considered **COMPLETE** when:

1. ✅ All deliverables created and validated
2. ✅ All success criteria met
3. ✅ Human validation approved
4. ✅ Git commit created with clear message
5. ✅ Ledger entry created
6. ✅ No rollback triggers activated
7. ✅ Phase 2 planning can begin

**Git Commit Message Template**:
```
feat(phase-1): Migrate projects domain to ANDA Cell architecture

PHASE 1 OF 7: Projects Domain Migration

Created:
- 4 specialized tRPC procedures (projects domain)
- project-list-cell with 6 behavioral assertions
- projects.router.ts domain router

Removed:
- Direct Supabase access for projects table
- loadProjects, createNewProject, deleteProject functions
- projects-related state from page.tsx

Validation:
- All curl tests pass ✅
- All unit tests pass (6/6 assertions) ✅
- TypeScript zero errors ✅
- Build succeeds ✅
- Human validation approved ✅

Architecture Compliance:
- M-CELL-1 through M-CELL-4: COMPLIANT ✅
- M1-M3 (Specialized Procedures): COMPLIANT ✅

Progress: 2,803 → 2,400 lines (14% reduction)
Next: Phase 2 - Cost Breakdown Domain Migration
```

---

## Phase 4 Execution Checklist

**For MigrationExecutor**: Step-by-step implementation guide

```yaml
Pre-Flight:
  - [ ] Read entire migration plan
  - [ ] Understand rollback triggers
  - [ ] Note human validation gate at Step 7
  - [ ] Prepare test environment

Step 1 - Verify Schema (5 min):
  - [ ] Confirm packages/db/src/schema/projects.ts exists
  - [ ] Verify schema exported in index.ts
  - [ ] No action needed - schema already exists ✅

Step 2 - Create Procedures (2-3 hours):
  - [ ] Create directory: packages/api/src/procedures/projects/
  - [ ] Implement get-projects-list.procedure.ts (copy from spec)
  - [ ] Implement create-project.procedure.ts (copy from spec)
  - [ ] Implement update-project.procedure.ts (copy from spec)
  - [ ] Implement delete-project.procedure.ts (copy from spec)
  - [ ] Create projects.router.ts (copy from spec)
  - [ ] Update packages/api/src/index.ts (add projectsRouter)
  - [ ] Run: pnpm type-check (must pass)
  - [ ] Verify file sizes with wc -l (all ≤200, router ≤50)

Step 3 - Test & Deploy (30-45 min):
  - [ ] Test locally with curl (all 4 procedures)
  - [ ] Deploy: supabase functions deploy trpc --no-verify-jwt
  - [ ] Wait 30 seconds (cold start)
  - [ ] Re-test with curl against deployed endpoint
  - [ ] ALL must return 200 OK before proceeding ⚠️

Step 4 - Create Cell Structure (30 min):
  - [ ] Create directory: components/cells/project-list-cell/
  - [ ] Create manifest.json (copy from spec, validate JSON)
  - [ ] Create pipeline.yaml (copy from spec)
  - [ ] Create __tests__/component.test.tsx (skeleton)
  - [ ] Verify: jq '.behavioral_assertions | length' manifest.json (must be 6)

Step 5 - Implement Component (3-4 hours):
  - [ ] Create component.tsx
  - [ ] Import tRPC client
  - [ ] Implement queries (MEMOIZE inputs!)
  - [ ] Implement mutations with error handling
  - [ ] Add loading/error/empty states
  - [ ] Apply useCallback to ALL event handlers
  - [ ] Implement unit tests (6 tests)
  - [ ] Run: pnpm type-check (must pass)
  - [ ] Run: pnpm test (all pass, coverage ≥80%)
  - [ ] Verify: wc -l component.tsx (must be ≤400, target ~180)

Step 6 - Atomic Integration (45 min):
  - [ ] Import ProjectListCell in page.tsx
  - [ ] Replace projects section with Cell
  - [ ] Delete loadProjects function
  - [ ] Delete createNewProject function
  - [ ] Delete deleteProject function
  - [ ] Remove projects state variables
  - [ ] Run: pnpm type-check (must pass)
  - [ ] Run: pnpm build (must succeed)
  - [ ] Verify old functions gone: grep "loadProjects" page.tsx (no matches)

Step 7 - Full Validation (30-45 min):
  - [ ] Run: pnpm type-check (zero errors)
  - [ ] Run: pnpm test (all pass)
  - [ ] Run: pnpm build (succeeds)
  - [ ] Start dev server: pnpm dev
  - [ ] Open browser: http://localhost:3000/projects
  - [ ] Test project list loads
  - [ ] Test create project
  - [ ] Test delete project
  - [ ] Check Network tab (1 batched request)
  - [ ] Check Console (no errors)
  - [ ] React DevTools Profiler (<5 renders)
  - [ ] PAUSE FOR HUMAN VALIDATION ⚠️
  - [ ] Wait for "VALIDATED - proceed with commit"

Post-Validation:
  - [ ] Create git commit (use template above)
  - [ ] Update ledger.jsonl
  - [ ] Mark Phase 1 complete
  - [ ] Begin Phase 2 planning

Rollback (if any step fails):
  - [ ] git revert HEAD (or git reset --hard if not committed)
  - [ ] Verify old code restored
  - [ ] Update ledger with FAILED status
  - [ ] Document failure reason
  - [ ] Retry or escalate
```

---

## Notes for Phase 2 Planning

**Learnings to Apply**:
- Specialized procedure architecture works well for simple CRUD
- Curl testing before client code saves significant debugging time
- Memoization patterns prevent infinite loops when applied rigorously
- Human validation gate crucial for establishing pattern correctness

**Dependencies for Phase 2**:
- Phase 1 MUST be complete and validated
- cost_breakdown table schema verified
- Pattern established for subsequent phases

**Estimated Start**: 1 day after Phase 1 completion (allow for stabilization)

---

**Migration Plan Complete**: Phase 1 - Projects Domain  
**Ready for Phase 4**: ✅ YES  
**Confidence**: HIGH (simple domain, clear boundaries, comprehensive specifications)  
**Blocking Issues**: None  

**Next**: Create Phase 2 migration plan (Cost Breakdown Domain) after Phase 1 completion
