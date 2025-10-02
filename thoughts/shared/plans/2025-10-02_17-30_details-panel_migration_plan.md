# Migration Plan: details-panel.tsx → Cell Architecture

## Frontmatter

```yaml
date: "2025-10-02T17:30:00Z"
architect: "MigrationArchitect"
status: "ready_for_implementation"
phase: 3
workflow_phase: "Phase 3: Migration Planning"

based_on:
  discovery_report: "thoughts/shared/discoveries/2025-10-02_discovery-report.md"
  analysis_report: "thoughts/shared/analysis/2025-10-02_16-30_details-panel_analysis.md"

migration_metadata:
  target_component: "details-panel.tsx"
  target_path: "apps/web/components/details-panel.tsx"
  complexity: "complex"
  strategy: "phased"
  estimated_duration: "22-24 hours"
  queries_count: 9
  sub_cells_count: 3
  git_checkpoints_required: 12
```

## Executive Summary

**Component**: details-panel.tsx (816 lines)  
**Complexity**: COMPLEX - 9 database queries, 15+ state variables  
**Strategy**: PHASED IMPLEMENTATION MANDATORY  
**Duration**: 22-24 hours across multiple work sessions

This migration requires breaking the monolithic details-panel into 3 specialized sub-cells plus an orchestrator. The phased approach with 12 git checkpoints ensures safe, incremental progress with rollback capability at each phase.

**Critical Requirements**:
- 9 tRPC procedures replacing direct Supabase queries
- 3 sub-cells: viewer, selector, mapper
- 12 behavioral assertions across all cells
- Manual validation at 3 checkpoints (critical path component)
- Complete type safety restoration (remove all `any` types)

## Migration Overview

### Scope
- **Current**: 816-line component with 9 direct database queries
- **Target**: 4 Cell components with tRPC integration
- **Breaking Changes**: None - maintaining prop interface compatibility

### Dependencies
- Database tables: projects, cost_breakdown, pos, po_line_items, po_mappings
- UI components: 15+ shadcn/ui components
- Single importer: apps/web/app/po-mapping/page.tsx

### Risk Factors
- **High Complexity**: 9 queries requires careful phasing
- **State Management**: 15+ useState hooks to migrate
- **Security**: RLS disabled on PO tables (noted for future fix)
- **Critical Path**: Core business feature requires thorough validation

## Data Layer Specifications

### Router File
**Location**: `packages/api/src/routers/po-mapping.ts`

### Procedure 1: poMapping.getProjects
```typescript
// No input required
.input(z.void())

// Output: Array of projects
.output(z.array(z.object({
  id: z.string().uuid(),
  name: z.string(),
  subBusinessLine: z.string()
})))

// Implementation
.query(async ({ ctx }) => {
  const result = await ctx.db
    .select()
    .from(projects)
    .orderBy(projects.name)
  return result
})

// Curl Test
curl -X POST https://[project].supabase.co/functions/v1/trpc/poMapping.getProjects \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Procedure 2: poMapping.getSpendTypes
```typescript
.input(z.object({
  projectId: z.string().uuid()
}))

.output(z.array(z.string()))

.query(async ({ ctx, input }) => {
  const result = await ctx.db
    .selectDistinct({ spendType: costBreakdown.spendType })
    .from(costBreakdown)
    .where(eq(costBreakdown.projectId, input.projectId))
    .orderBy(costBreakdown.spendType)
  return result.map(r => r.spendType)
})

// Curl Test
curl -X POST https://[project].supabase.co/functions/v1/trpc/poMapping.getSpendTypes \
  -H "Content-Type: application/json" \
  -d '{"projectId":"94d1eaad-4ada-4fb6-b872-212b6cd6007a"}'
```

### Procedure 3: poMapping.getSpendSubCategories
```typescript
.input(z.object({
  projectId: z.string().uuid(),
  spendType: z.string()
}))

.output(z.array(z.string()))

.query(async ({ ctx, input }) => {
  const result = await ctx.db
    .selectDistinct({ spendSubCategory: costBreakdown.spendSubCategory })
    .from(costBreakdown)
    .where(and(
      eq(costBreakdown.projectId, input.projectId),
      eq(costBreakdown.spendType, input.spendType)
    ))
    .orderBy(costBreakdown.spendSubCategory)
  return result.map(r => r.spendSubCategory)
})

// Curl Test
curl -X POST https://[project].supabase.co/functions/v1/trpc/poMapping.getSpendSubCategories \
  -H "Content-Type: application/json" \
  -d '{"projectId":"94d1eaad-4ada-4fb6-b872-212b6cd6007a","spendType":"Consumables"}'
```

### Procedure 4: poMapping.findMatchingCostBreakdown
```typescript
.input(z.object({
  projectId: z.string().uuid(),
  spendType: z.string(),
  spendSubCategory: z.string()
}))

.output(z.array(z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  subBusinessLine: z.string(),
  costLine: z.string(),
  spendType: z.string(),
  spendSubCategory: z.string(),
  budgetCost: z.string().nullable()
})))

.query(async ({ ctx, input }) => {
  const result = await ctx.db
    .select({
      id: costBreakdown.id,
      projectId: costBreakdown.projectId,
      subBusinessLine: costBreakdown.subBusinessLine,
      costLine: costBreakdown.costLine,
      spendType: costBreakdown.spendType,
      spendSubCategory: costBreakdown.spendSubCategory,
      budgetCost: costBreakdown.budgetCost
    })
    .from(costBreakdown)
    .innerJoin(projects, eq(projects.id, costBreakdown.projectId))
    .where(and(
      eq(costBreakdown.projectId, input.projectId),
      eq(costBreakdown.spendType, input.spendType),
      eq(costBreakdown.spendSubCategory, input.spendSubCategory)
    ))
  return result
})

// Curl Test
curl -X POST https://[project].supabase.co/functions/v1/trpc/poMapping.findMatchingCostBreakdown \
  -H "Content-Type: application/json" \
  -d '{"projectId":"94d1eaad-4ada-4fb6-b872-212b6cd6007a","spendType":"Consumables","spendSubCategory":"Tools"}'
```

### Procedure 5: poMapping.getExistingMappings
```typescript
.input(z.object({
  poId: z.string().uuid()
}))

.output(z.array(z.object({
  id: z.string().uuid(),
  poLineItemId: z.string().uuid(),
  costBreakdownId: z.string().uuid(),
  mappedAmount: z.string(),
  mappingNotes: z.string().nullable(),
  lineItemNumber: z.number(),
  description: z.string(),
  quantity: z.string(),
  lineValue: z.string().nullable(),
  costLine: z.string(),
  spendType: z.string(),
  spendSubCategory: z.string()
})))

.query(async ({ ctx, input }) => {
  const result = await ctx.db
    .select({
      id: poMappings.id,
      poLineItemId: poMappings.poLineItemId,
      costBreakdownId: poMappings.costBreakdownId,
      mappedAmount: poMappings.mappedAmount,
      mappingNotes: poMappings.mappingNotes,
      lineItemNumber: poLineItems.lineItemNumber,
      description: poLineItems.description,
      quantity: poLineItems.quantity,
      lineValue: poLineItems.lineValue,
      costLine: costBreakdown.costLine,
      spendType: costBreakdown.spendType,
      spendSubCategory: costBreakdown.spendSubCategory
    })
    .from(poMappings)
    .innerJoin(poLineItems, eq(poLineItems.id, poMappings.poLineItemId))
    .innerJoin(costBreakdown, eq(costBreakdown.id, poMappings.costBreakdownId))
    .where(eq(poLineItems.poId, input.poId))
  return result
})

// Curl Test
curl -X POST https://[project].supabase.co/functions/v1/trpc/poMapping.getExistingMappings \
  -H "Content-Type: application/json" \
  -d '{"poId":"550e8400-e29b-41d4-a716-446655440000"}'
```

### Procedure 6: poMapping.createMapping
```typescript
.input(z.object({
  poId: z.string().uuid(),
  costBreakdownId: z.string().uuid(),
  mappingNotes: z.string().optional()
}))

.output(z.object({ success: z.boolean(), count: z.number() }))

.mutation(async ({ ctx, input }) => {
  // Get all line items for PO
  const lineItems = await ctx.db
    .select({ 
      id: poLineItems.id, 
      lineValue: poLineItems.lineValue 
    })
    .from(poLineItems)
    .where(eq(poLineItems.poId, input.poId))
  
  // Create mapping for each
  const mappings = lineItems.map(item => ({
    poLineItemId: item.id,
    costBreakdownId: input.costBreakdownId,
    mappedAmount: item.lineValue || '0',
    mappingNotes: input.mappingNotes || null,
    mappedBy: 'system',
    mappedAt: new Date()
  }))
  
  await ctx.db.insert(poMappings).values(mappings)
  
  return { success: true, count: mappings.length }
})

// Curl Test
curl -X POST https://[project].supabase.co/functions/v1/trpc/poMapping.createMapping \
  -H "Content-Type: application/json" \
  -d '{"poId":"550e8400-e29b-41d4-a716-446655440000","costBreakdownId":"660e8400-e29b-41d4-a716-446655440001","mappingNotes":"Initial mapping"}'
```

### Procedure 7: poMapping.updateMapping
```typescript
.input(z.object({
  mappingIds: z.array(z.string().uuid()),
  costBreakdownId: z.string().uuid(),
  mappingNotes: z.string().optional()
}))

.output(z.object({ success: z.boolean(), count: z.number() }))

.mutation(async ({ ctx, input }) => {
  await ctx.db
    .update(poMappings)
    .set({
      costBreakdownId: input.costBreakdownId,
      mappingNotes: input.mappingNotes || null,
      updatedAt: new Date()
    })
    .where(inArray(poMappings.id, input.mappingIds))
  
  return { success: true, count: input.mappingIds.length }
})

// Curl Test
curl -X POST https://[project].supabase.co/functions/v1/trpc/poMapping.updateMapping \
  -H "Content-Type: application/json" \
  -d '{"mappingIds":["770e8400-e29b-41d4-a716-446655440002"],"costBreakdownId":"660e8400-e29b-41d4-a716-446655440001","mappingNotes":"Updated mapping"}'
```

### Procedure 8: poMapping.clearMappings
```typescript
.input(z.object({
  poLineItemIds: z.array(z.string().uuid())
}))

.output(z.object({ success: z.boolean() }))

.mutation(async ({ ctx, input }) => {
  await ctx.db
    .delete(poMappings)
    .where(inArray(poMappings.poLineItemId, input.poLineItemIds))
  
  return { success: true }
})

// Curl Test
curl -X POST https://[project].supabase.co/functions/v1/trpc/poMapping.clearMappings \
  -H "Content-Type: application/json" \
  -d '{"poLineItemIds":["880e8400-e29b-41d4-a716-446655440003","990e8400-e29b-41d4-a716-446655440004"]}'
```

### Procedure 9: poMapping.getCostBreakdownById
```typescript
.input(z.object({
  projectId: z.string().uuid(),
  spendType: z.string(),
  spendSubCategory: z.string()
}))

.output(z.object({ id: z.string().uuid() }).nullable())

.query(async ({ ctx, input }) => {
  const result = await ctx.db
    .select({ id: costBreakdown.id })
    .from(costBreakdown)
    .where(and(
      eq(costBreakdown.projectId, input.projectId),
      eq(costBreakdown.spendType, input.spendType),
      eq(costBreakdown.spendSubCategory, input.spendSubCategory)
    ))
    .limit(1)
  
  return result[0] || null
})

// Curl Test
curl -X POST https://[project].supabase.co/functions/v1/trpc/poMapping.getCostBreakdownById \
  -H "Content-Type: application/json" \
  -d '{"projectId":"94d1eaad-4ada-4fb6-b872-212b6cd6007a","spendType":"Consumables","spendSubCategory":"Tools"}'
```

**Critical Notes**:
- Import { eq, and, inArray } from 'drizzle-orm' for all procedures
- Import all tables from '@/db/schema'
- NO z.date() - dates handled as strings
- All numeric values returned as strings (PostgreSQL numeric type)
- Use || '0' or || null for null handling

## Cell Structure Specifications

### Sub-Cell 1: details-panel-viewer

**Location**: `components/cells/details-panel-viewer/`

#### component.tsx
```typescript
import { trpc } from '@/lib/trpc'
import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ViewerProps {
  poId: string | null
  onEditMapping?: (mappingId: string) => void
}

export function DetailsPanelViewer({ poId, onEditMapping }: ViewerProps) {
  // No memoization needed for primitive string
  const { data, isLoading, error } = trpc.poMapping.getExistingMappings.useQuery(
    { poId: poId! },
    { enabled: !!poId }
  )
  
  if (!poId) return null
  if (isLoading) return <Skeleton className="h-32" />
  if (error) return <Alert><AlertDescription>{error.message}</AlertDescription></Alert>
  if (!data || data.length === 0) return null
  
  // Currency formatting
  const formatCurrency = (value: string | null) => {
    if (!value || value === 'null') return 'N/A'
    const num = parseFloat(value)
    if (isNaN(num)) return 'N/A'
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      maximumFractionDigits: 0
    }).format(num)
  }
  
  return (
    <Card className="border-green-500 bg-green-50">
      <CardContent>
        {/* Display mappings grouped by cost breakdown */}
        {/* Implementation details... */}
      </CardContent>
    </Card>
  )
}
```

#### manifest.json
```json
{
  "id": "details-panel-viewer",
  "version": "1.0.0",
  "description": "Read-only display of PO mappings",
  "behavioral_assertions": [
    {
      "id": "BA-001",
      "description": "Displays current mappings in green card when data exists",
      "verification": "Mock query with mappings, verify green card shown",
      "source": "Original lines 564-751"
    },
    {
      "id": "BA-002",
      "description": "Shows 'N/A' for null or invalid line values",
      "verification": "Pass null line value, verify 'N/A' displayed",
      "source": "Original lines 803-805"
    },
    {
      "id": "BA-003",
      "description": "Formats currency as AUD with no decimals",
      "verification": "Pass numeric value, verify AUD formatting",
      "source": "Original lines 395-402"
    }
  ],
  "dependencies": {
    "data": ["po_mappings", "po_line_items", "cost_breakdown"],
    "ui": ["@/components/ui/card", "@/components/ui/badge"]
  }
}
```

#### pipeline.yaml
```yaml
gates:
  - name: types
    command: pnpm type-check
    requirement: "TypeScript zero errors"
  - name: tests
    command: pnpm test
    requirement: "80%+ coverage, 3 behavioral assertions verified"
  - name: build
    command: pnpm build
    requirement: "Production build succeeds"
  - name: performance
    requirement: "Load time ≤110% baseline"
  - name: accessibility
    requirement: "WCAG AA compliance"
```

### Sub-Cell 2: details-panel-selector

**Location**: `components/cells/details-panel-selector/`

#### component.tsx
```typescript
import { trpc } from '@/lib/trpc'
import { useMemo, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface SelectorProps {
  selectedProject: string
  selectedSpendType: string
  selectedSpendSubCategory: string
  onProjectChange: (value: string) => void
  onSpendTypeChange: (value: string) => void
  onSubCategoryChange: (value: string) => void
  onCostBreakdownFound: (id: string | null) => void
}

export function DetailsPanelSelector(props: SelectorProps) {
  // Empty object memoized for projects query
  const projectsInput = useMemo(() => ({}), [])
  const { data: projects } = trpc.poMapping.getProjects.useQuery(projectsInput)
  
  // Memoized input for spend types
  const spendTypeInput = useMemo(
    () => ({ projectId: props.selectedProject }),
    [props.selectedProject]
  )
  const { data: spendTypes } = trpc.poMapping.getSpendTypes.useQuery(
    spendTypeInput,
    { enabled: !!props.selectedProject }
  )
  
  // Memoized input for subcategories
  const subCatInput = useMemo(
    () => ({ 
      projectId: props.selectedProject, 
      spendType: props.selectedSpendType 
    }),
    [props.selectedProject, props.selectedSpendType]
  )
  const { data: subCategories } = trpc.poMapping.getSpendSubCategories.useQuery(
    subCatInput,
    { enabled: !!props.selectedProject && !!props.selectedSpendType }
  )
  
  // Find matching cost breakdown
  const findInput = useMemo(
    () => ({
      projectId: props.selectedProject,
      spendType: props.selectedSpendType,
      spendSubCategory: props.selectedSpendSubCategory
    }),
    [props.selectedProject, props.selectedSpendType, props.selectedSpendSubCategory]
  )
  const { data: costBreakdowns } = trpc.poMapping.findMatchingCostBreakdown.useQuery(
    findInput,
    { enabled: !!props.selectedProject && !!props.selectedSpendType && !!props.selectedSpendSubCategory }
  )
  
  // Cascading reset logic
  useEffect(() => {
    if (!props.selectedProject) {
      props.onSpendTypeChange('')
      props.onSubCategoryChange('')
    }
  }, [props.selectedProject])
  
  useEffect(() => {
    if (!props.selectedSpendType) {
      props.onSubCategoryChange('')
    }
  }, [props.selectedSpendType])
  
  useEffect(() => {
    if (costBreakdowns && costBreakdowns.length > 0) {
      props.onCostBreakdownFound(costBreakdowns[0].id)
    } else {
      props.onCostBreakdownFound(null)
    }
  }, [costBreakdowns])
  
  return (
    <div className="space-y-4">
      {/* Project selector */}
      <div>
        <Label>Project</Label>
        <Select value={props.selectedProject} onValueChange={props.onProjectChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select project" />
          </SelectTrigger>
          <SelectContent>
            {projects?.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Spend Type selector - disabled until project selected */}
      <div>
        <Label>Spend Type</Label>
        <Select 
          value={props.selectedSpendType} 
          onValueChange={props.onSpendTypeChange}
          disabled={!props.selectedProject}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select spend type" />
          </SelectTrigger>
          <SelectContent>
            {spendTypes?.map(st => (
              <SelectItem key={st} value={st}>{st}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Subcategory selector - disabled until spend type selected */}
      <div>
        <Label>Subcategory</Label>
        <Select 
          value={props.selectedSpendSubCategory} 
          onValueChange={props.onSubCategoryChange}
          disabled={!props.selectedSpendType}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select subcategory" />
          </SelectTrigger>
          <SelectContent>
            {subCategories?.map(sc => (
              <SelectItem key={sc} value={sc}>{sc}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
```

#### manifest.json
```json
{
  "id": "details-panel-selector",
  "version": "1.0.0",
  "description": "Cascading dropdown selectors for PO mapping",
  "behavioral_assertions": [
    {
      "id": "BA-004",
      "description": "Spend type dropdown disabled until project selected",
      "verification": "No project, verify spend type disabled",
      "source": "Original line 499"
    },
    {
      "id": "BA-005",
      "description": "Subcategory dropdown disabled until spend type selected",
      "verification": "No spend type, verify subcategory disabled",
      "source": "Original lines 517-518"
    },
    {
      "id": "BA-006",
      "description": "Resets downstream selections when upstream changes",
      "verification": "Change project, verify spend type/subcat reset",
      "source": "Original cascading logic"
    }
  ],
  "dependencies": {
    "data": ["projects", "cost_breakdown"],
    "ui": ["@/components/ui/select", "@/components/ui/label"]
  }
}
```

### Sub-Cell 3: details-panel-mapper

**Location**: `components/cells/details-panel-mapper/`

#### component.tsx
```typescript
import { trpc } from '@/lib/trpc'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog'
import { toast } from '@/hooks/use-toast'

interface MapperProps {
  poId: string | null
  costBreakdownId: string | null
  existingMappings: Array<{ id: string; poLineItemId: string }>
  isEditMode: boolean
  onMappingComplete: () => void
}

export function DetailsPanelMapper(props: MapperProps) {
  const [mappingNotes, setMappingNotes] = useState('')
  const [showClearDialog, setShowClearDialog] = useState(false)
  
  const createMutation = trpc.poMapping.createMapping.useMutation()
  const updateMutation = trpc.poMapping.updateMapping.useMutation()
  const clearMutation = trpc.poMapping.clearMappings.useMutation()
  
  // Memoize mutation inputs
  const createInput = useMemo(
    () => ({
      poId: props.poId!,
      costBreakdownId: props.costBreakdownId!,
      mappingNotes: mappingNotes || undefined
    }),
    [props.poId, props.costBreakdownId, mappingNotes]
  )
  
  const updateInput = useMemo(
    () => ({
      mappingIds: props.existingMappings.map(m => m.id),
      costBreakdownId: props.costBreakdownId!,
      mappingNotes: mappingNotes || undefined
    }),
    [props.existingMappings, props.costBreakdownId, mappingNotes]
  )
  
  const clearInput = useMemo(
    () => ({
      poLineItemIds: props.existingMappings.map(m => m.poLineItemId)
    }),
    [props.existingMappings]
  )
  
  const handleSave = async () => {
    try {
      if (props.isEditMode) {
        await updateMutation.mutateAsync(updateInput)
        toast({ title: 'Mapping updated successfully' })
      } else {
        await createMutation.mutateAsync(createInput)
        toast({ title: 'Mapping created successfully' })
      }
      props.onMappingComplete()
    } catch (error) {
      toast({ title: 'Error saving mapping', variant: 'destructive' })
    }
  }
  
  const handleClear = async () => {
    try {
      await clearMutation.mutateAsync(clearInput)
      toast({ title: 'Mappings cleared successfully' })
      setShowClearDialog(false)
      props.onMappingComplete()
    } catch (error) {
      toast({ title: 'Error clearing mappings', variant: 'destructive' })
    }
  }
  
  const isSaveDisabled = !props.poId || !props.costBreakdownId
  
  return (
    <div className="space-y-4">
      <div>
        <Label>Mapping Notes (Optional)</Label>
        <Textarea 
          value={mappingNotes}
          onChange={(e) => setMappingNotes(e.target.value)}
          placeholder="Add any notes about this mapping..."
        />
      </div>
      
      <div className="flex gap-2">
        <Button 
          onClick={handleSave}
          disabled={isSaveDisabled || createMutation.isLoading || updateMutation.isLoading}
        >
          {props.isEditMode ? 'Update Mapping' : 'Create Mapping'}
        </Button>
        
        {props.isEditMode && (
          <Button 
            variant="destructive"
            onClick={() => setShowClearDialog(true)}
          >
            Clear All Mappings
          </Button>
        )}
      </div>
      
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all mappings?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all PO line item mappings. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClear}>
              Clear Mappings
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
```

#### manifest.json
```json
{
  "id": "details-panel-mapper",
  "version": "1.0.0",
  "description": "CRUD operations for PO mappings",
  "behavioral_assertions": [
    {
      "id": "BA-007",
      "description": "Save button disabled when required fields missing",
      "verification": "Leave fields empty, verify button disabled",
      "source": "Original lines 549-555"
    },
    {
      "id": "BA-008",
      "description": "Shows two-step confirmation before clearing",
      "verification": "Click clear, verify dialog appears",
      "source": "Original lines 592-626"
    },
    {
      "id": "BA-009",
      "description": "Refreshes display after successful operation",
      "verification": "Complete operation, verify data reloads",
      "source": "Original callback patterns"
    }
  ],
  "dependencies": {
    "data": ["po_mappings", "cost_breakdown"],
    "ui": ["@/components/ui/button", "@/components/ui/textarea", "@/components/ui/alert-dialog"]
  }
}
```

### Main Orchestrator: details-panel

**Location**: `components/cells/details-panel/`

#### component.tsx
```typescript
import { useState, useEffect } from 'react'
import { DetailsPanelViewer } from '@/components/cells/details-panel-viewer/component'
import { DetailsPanelSelector } from '@/components/cells/details-panel-selector/component'
import { DetailsPanelMapper } from '@/components/cells/details-panel-mapper/component'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface DetailsPanelProps {
  selectedPO: { id: string; poNumber: string } | null
  costBreakdowns: any[] // Not used in new implementation
  onSaveMapping: (poId: string, costBreakdownId: string, notes?: string) => Promise<boolean>
  onMappingChange?: () => Promise<void>
}

export function DetailsPanel({ selectedPO, onMappingChange }: DetailsPanelProps) {
  const [selectedProject, setSelectedProject] = useState('')
  const [selectedSpendType, setSelectedSpendType] = useState('')
  const [selectedSpendSubCategory, setSelectedSpendSubCategory] = useState('')
  const [costBreakdownId, setCostBreakdownId] = useState<string | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [hasMappings, setHasMappings] = useState(false)
  
  // Reset all state when PO changes
  useEffect(() => {
    setSelectedProject('')
    setSelectedSpendType('')
    setSelectedSpendSubCategory('')
    setCostBreakdownId(null)
    setIsEditMode(false)
  }, [selectedPO?.id])
  
  const handleMappingComplete = async () => {
    // Reset state
    setSelectedProject('')
    setSelectedSpendType('')
    setSelectedSpendSubCategory('')
    setCostBreakdownId(null)
    
    // Call parent callback
    if (onMappingChange) {
      await onMappingChange()
    }
  }
  
  // Empty state when no PO selected
  if (!selectedPO) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <div className="text-gray-400">
            {/* Empty state icon SVG */}
          </div>
          <p className="text-gray-500 mt-4">Select a PO to view details</p>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>PO Details - {selectedPO.poNumber}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Viewer - always visible if mappings exist */}
        <DetailsPanelViewer 
          poId={selectedPO.id}
          onEditMapping={() => setIsEditMode(true)}
        />
        
        {/* Show create/edit UI based on state */}
        {(!hasMappings || isEditMode) && (
          <>
            <DetailsPanelSelector
              selectedProject={selectedProject}
              selectedSpendType={selectedSpendType}
              selectedSpendSubCategory={selectedSpendSubCategory}
              onProjectChange={setSelectedProject}
              onSpendTypeChange={setSelectedSpendType}
              onSubCategoryChange={setSelectedSpendSubCategory}
              onCostBreakdownFound={setCostBreakdownId}
            />
            
            <DetailsPanelMapper
              poId={selectedPO.id}
              costBreakdownId={costBreakdownId}
              existingMappings={[]} // Will be populated from viewer data
              isEditMode={isEditMode}
              onMappingComplete={handleMappingComplete}
            />
          </>
        )}
        
        {/* Show create button if no mappings */}
        {!hasMappings && !isEditMode && (
          <div className="flex justify-center">
            <Button onClick={() => setIsEditMode(true)}>
              Create Mapping
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

#### manifest.json
```json
{
  "id": "details-panel",
  "version": "1.0.0",
  "description": "PO mapping details panel orchestrator",
  "behavioral_assertions": [
    {
      "id": "BA-010",
      "description": "Shows empty state when no PO selected",
      "verification": "Render without selectedPO, verify message",
      "source": "Original lines 417-432"
    },
    {
      "id": "BA-011",
      "description": "Shows 'Not Mapped' state with create button",
      "verification": "PO with no mappings, verify create button",
      "source": "Original lines 448-465"
    },
    {
      "id": "BA-012",
      "description": "Resets all states when PO changes",
      "verification": "Change selectedPO prop, verify reset",
      "source": "Original lines 135-138"
    }
  ],
  "dependencies": {
    "data": [],
    "ui": ["@/components/ui/card", "@/components/ui/button"],
    "cells": [
      "details-panel-viewer",
      "details-panel-selector",
      "details-panel-mapper"
    ]
  }
}
```

## Migration Sequence (Phased Implementation)

### Phase A: Read Operations (Procedures 1-5) - 9.5 hours

#### Step 1: Data Layer Foundation (30 min)
- Create `packages/api/src/routers/po-mapping.ts`
- Setup imports and router structure
- Validation: File compiles

#### Step 2A: Implement Read Procedures 1-3 (2 hours)
- Implement: getProjects, getSpendTypes, getSpendSubCategories
- Test each with curl commands
- Validation: All 3 curl tests pass

#### Step 2B: Deploy and Verify (30 min)
- `supabase functions deploy trpc --no-verify-jwt`
- Wait 30 seconds for cold start
- Re-test procedures 1-3
- **Git Checkpoint**: "Phase A.1: Basic selectors (3 procedures)"

#### Step 3A: Create details-panel-selector Cell (2 hours)
- Create cell structure with manifest and pipeline
- Implement with procedures 1-3 only
- Apply memoization patterns
- Test cascading dropdowns
- **Git Checkpoint**: "Phase A.1: Selector cell with 3 queries"

#### Step 2C: Implement Procedures 4-5 (2 hours)
- Implement: findMatchingCostBreakdown, getExistingMappings
- Test with curl commands
- Validation: Both procedures pass

#### Step 2D: Deploy and Verify (30 min)
- Deploy edge function update
- Re-test procedures 4-5
- **Git Checkpoint**: "Phase A.2: Complex read operations"

#### Step 3B: Create details-panel-viewer Cell (2 hours)
- Create cell structure
- Implement with procedure 5
- Test mapping display
- **Git Checkpoint**: "Phase A.2: Viewer cell complete"

#### Step 3C: Update selector with procedure 4 (30 min)
- Add findMatchingCostBreakdown query
- Complete cascading logic
- **Git Checkpoint**: "Phase A Complete: All read operations"

**Manual Validation Gate A**:
```
Please validate:
1. Cascading dropdowns work correctly
2. Existing mappings display correctly
3. No console errors
4. Network tab shows successful tRPC calls
Respond with: "PHASE A VALIDATED"
```

### Phase B: Mutation Operations (Procedures 6-8) - 8 hours

#### Step 2E: Implement Mutations 6-7 (2 hours)
- Implement: createMapping, updateMapping
- Test with curl
- Verify database changes

#### Step 2F: Deploy and Verify (30 min)
- Deploy edge function update
- Test mutations
- **Git Checkpoint**: "Phase B.1: Create/Update mutations"

#### Step 3D: Create details-panel-mapper Cell (3 hours)
- Create cell structure
- Implement create and update
- Add confirmation dialogs
- Apply memoization
- **Git Checkpoint**: "Phase B.1: Mapper cell"

#### Step 2G: Implement Procedure 8 (1 hour)
- Implement: clearMappings
- Test deletion

#### Step 2H: Deploy and Verify (30 min)
- Deploy edge function
- Test clear operation
- **Git Checkpoint**: "Phase B.2: Clear operation"

#### Step 3E: Update mapper with clear (1 hour)
- Add clear functionality
- Test confirmation dialog
- **Git Checkpoint**: "Phase B Complete"

**Manual Validation Gate B**:
```
Please validate:
1. Create new mapping works
2. Update existing mapping works
3. Clear shows confirmation and works
4. Database shows correct data
Respond with: "PHASE B VALIDATED"
```

### Phase C: Integration (Procedure 9 + Orchestration) - 5.5 hours

#### Step 2I: Implement Helper Procedure (1 hour)
- Implement: getCostBreakdownById
- Test and deploy
- **Git Checkpoint**: "Phase C: Helper procedure"

#### Step 4: Create Orchestrator Cell (2 hours)
- Create main details-panel cell
- Import and coordinate sub-cells
- Manage shared state
- **Git Checkpoint**: "Phase C: Orchestrator complete"

#### Step 5: Integration Testing (1.5 hours)
- Test all workflows end-to-end
- Verify all CRUD operations
- Performance validation
- **Git Checkpoint**: "All cells integrated"

#### Step 6: Update Imports & Delete Old (30 min)
- Update: `apps/web/app/po-mapping/page.tsx`
- Test in production
- DELETE: `apps/web/components/details-panel.tsx`
- **ATOMIC COMMIT**: "Migration complete: details-panel → Cell architecture"

#### Step 7: Full Validation (30 min)
- Run all validation gates
- Update ledger.jsonl

**Final Validation Gate**:
```
Please validate:
1. Complete PO mapping workflow works
2. All UI states display correctly
3. Performance acceptable
4. Ready to delete old component
Respond with: "MIGRATION VALIDATED - DELETE OLD"
```

## Rollback Strategy

### Trigger Conditions
- TypeScript compilation errors
- Test failures (< 80% coverage)  
- Build failures
- Performance regression > 10%
- Curl test failures at any phase
- Manual validation rejection

### Phased Rollback Options

#### Phase A Failure
```bash
# If procedures 1-3 fail
git reset --hard [pre-Phase-A commit]
rm packages/api/src/routers/po-mapping.ts

# If selector cell fails
git revert [selector cell commits]
# Keep procedures deployed (safe)
```

#### Phase B Failure
```bash
# Preserve Phase A (working read operations)
git revert [Phase B commits]
# Fix mutations in separate branch
# Users can still view data
```

#### Complete Rollback
```bash
# List all phase commits
git log --oneline | grep "Phase"

# Revert in reverse order
git revert [Phase C commits]
git revert [Phase B commits]
git revert [Phase A commits]

# Or single atomic revert if exists
git revert [migration commit]

# Update ledger
echo '{"status":"FAILED","component":"details-panel","reason":"[error]"}' >> ledger.jsonl
```

### Recovery Process
1. Analyze failure point from logs
2. Create fix branch from last checkpoint
3. Fix specific issue
4. Resume from failed phase
5. Do NOT restart from beginning

## Validation Strategy

### Technical Gates

#### TypeScript
- Command: `pnpm type-check`
- Zero errors required
- Remove all `any` types
- Check after each phase

#### Tests
- Command: `pnpm test`
- 80%+ coverage per cell
- 12 behavioral assertions total:
  - 3 for viewer
  - 3 for selector
  - 3 for mapper
  - 3 for orchestrator

#### Build
- Command: `pnpm build`
- Must succeed with zero errors
- Check bundle size

### Functional Validation

#### Performance
- Baseline: 9 direct queries
- Target: ≤ 110% of baseline
- Measure with React DevTools
- Check tRPC batching

#### Feature Parity
- Cascading dropdowns identical
- CRUD operations work
- Currency formatting matches
- Empty states correct

### Manual Validation Checkpoints

Three required human validation gates at:
1. End of Phase A (read operations)
2. End of Phase B (mutations)
3. End of Phase C (complete integration)

## Success Criteria

- [ ] All 9 tRPC procedures implemented and tested
- [ ] All 9 procedures deployed successfully
- [ ] 3 sub-cells created with proper structure
- [ ] Orchestrator cell coordinating sub-cells
- [ ] 12 behavioral assertions verified
- [ ] Type safety restored (no `any` types)
- [ ] All memoization patterns applied
- [ ] Cascading dropdown logic preserved
- [ ] CRUD operations working identically
- [ ] Performance ≤ 110% of baseline
- [ ] Manual validation approved at all checkpoints
- [ ] Old component deleted
- [ ] Atomic commit or clear phase commits
- [ ] Ledger updated with SUCCESS

## Phase 4 Execution Checklist

### Phase A Checklist
- [ ] Create router file `packages/api/src/routers/po-mapping.ts`
- [ ] Implement procedures 1-3 (getProjects, getSpendTypes, getSpendSubCategories)
- [ ] Test procedures 1-3 with curl
- [ ] Deploy edge function
- [ ] Create details-panel-selector cell
- [ ] Git checkpoint: "Phase A.1"
- [ ] Implement procedures 4-5
- [ ] Test procedures 4-5 with curl
- [ ] Deploy edge function update
- [ ] Create details-panel-viewer cell
- [ ] Update selector with procedure 4
- [ ] Git checkpoint: "Phase A Complete"
- [ ] Get manual validation: "PHASE A VALIDATED"

### Phase B Checklist
- [ ] Implement procedures 6-7 (createMapping, updateMapping)
- [ ] Test mutations with curl
- [ ] Deploy edge function
- [ ] Create details-panel-mapper cell
- [ ] Git checkpoint: "Phase B.1"
- [ ] Implement procedure 8 (clearMappings)
- [ ] Test clear operation
- [ ] Deploy edge function
- [ ] Update mapper with clear functionality
- [ ] Git checkpoint: "Phase B Complete"
- [ ] Get manual validation: "PHASE B VALIDATED"

### Phase C Checklist
- [ ] Implement procedure 9 (getCostBreakdownById)
- [ ] Deploy and test
- [ ] Create orchestrator cell
- [ ] Test all workflows end-to-end
- [ ] Git checkpoint: "Phase C Complete"
- [ ] Update po-mapping page import
- [ ] Test in production build
- [ ] DELETE old component
- [ ] Create atomic commit
- [ ] Run full validation suite
- [ ] Get final validation: "MIGRATION VALIDATED"
- [ ] Update ledger.jsonl

## Critical Reminders

1. **NO z.date()** - Use z.string().transform() for all dates
2. **Memoize ALL non-primitives** passed to hooks
3. **Test procedures with curl BEFORE client code**
4. **Git checkpoint after EVERY phase completion**
5. **Manual validation at 3 checkpoints**
6. **Delete old component ONLY after final validation**
7. **Consider RLS enablement for PO tables (future task)**

---

*Migration plan complete. Ready for Phase 4: Migration Implementation by MigrationExecutor.*
*Estimated duration: 22-24 hours across multiple work sessions with 12 git checkpoints.*