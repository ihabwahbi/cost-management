'use client'

import { trpc } from '@/lib/trpc'
import { useMemo, useEffect } from 'react'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'

interface SelectorProps {
  selectedProject: string
  selectedSpendType: string
  selectedSpendSubCategory: string
  onProjectChange: (value: string) => void
  onSpendTypeChange: (value: string) => void
  onSubCategoryChange: (value: string) => void
}

/**
 * DetailsPanelSelector - Phase A.1 (Partial)
 * 
 * Cascading dropdown selectors for PO mapping workflow
 * Currently uses procedures 1-3 only
 * Procedure 4 (findMatchingCostBreakdown) will be added in Phase A.2
 */
export function DetailsPanelSelector(props: SelectorProps) {
  // No input required for projects query (void procedure)
  const { data: projects, isLoading: projectsLoading } = trpc.poMapping.getProjects.useQuery()
  
  // Memoized input for spend types
  const spendTypeInput = useMemo(
    () => ({ projectId: props.selectedProject }),
    [props.selectedProject]
  )
  const { data: spendTypes, isLoading: spendTypesLoading } = trpc.poMapping.getSpendTypes.useQuery(
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
  const { data: subCategories, isLoading: subCategoriesLoading } = trpc.poMapping.getSpendSubCategories.useQuery(
    subCatInput,
    { enabled: !!props.selectedProject && !!props.selectedSpendType }
  )
  
  // Cascading reset logic - BA-006
  useEffect(() => {
    if (!props.selectedProject) {
      props.onSpendTypeChange('')
      props.onSubCategoryChange('')
    }
  }, [props.selectedProject, props.onSpendTypeChange, props.onSubCategoryChange])
  
  useEffect(() => {
    if (!props.selectedSpendType) {
      props.onSubCategoryChange('')
    }
  }, [props.selectedSpendType, props.onSubCategoryChange])
  
  return (
    <div className="space-y-4">
      {/* Project selector */}
      <div>
        <Label htmlFor="project-select">Project</Label>
        {projectsLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <Select 
            value={props.selectedProject} 
            onValueChange={props.onProjectChange}
          >
            <SelectTrigger id="project-select">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects?.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      
      {/* Spend Type selector - BA-004: disabled until project selected */}
      <div>
        <Label htmlFor="spend-type-select">Spend Type</Label>
        {spendTypesLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <Select 
            value={props.selectedSpendType} 
            onValueChange={props.onSpendTypeChange}
            disabled={!props.selectedProject}
          >
            <SelectTrigger id="spend-type-select">
              <SelectValue placeholder="Select spend type" />
            </SelectTrigger>
            <SelectContent>
              {spendTypes?.map(st => (
                <SelectItem key={st} value={st}>{st}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      
      {/* Subcategory selector - BA-005: disabled until spend type selected */}
      <div>
        <Label htmlFor="subcategory-select">Subcategory</Label>
        {subCategoriesLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <Select 
            value={props.selectedSpendSubCategory} 
            onValueChange={props.onSubCategoryChange}
            disabled={!props.selectedSpendType}
          >
            <SelectTrigger id="subcategory-select">
              <SelectValue placeholder="Select subcategory" />
            </SelectTrigger>
            <SelectContent>
              {subCategories?.map(sc => (
                <SelectItem key={sc} value={sc}>{sc}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  )
}
