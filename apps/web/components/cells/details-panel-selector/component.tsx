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
  onCostBreakdownFound: (id: string | null) => void
}

/**
 * DetailsPanelSelector - Phase A.2 (Complete)
 * 
 * Cascading dropdown selectors for PO mapping workflow
 * Uses all 4 read procedures to find matching cost breakdown
 */
export function DetailsPanelSelector(props: SelectorProps) {
  const {
    selectedProject,
    selectedSpendType,
    selectedSpendSubCategory,
    onProjectChange,
    onSpendTypeChange,
    onSubCategoryChange,
    onCostBreakdownFound
  } = props
  
  // No input required for projects query (void procedure)
  const { data: projects, isLoading: projectsLoading } = trpc.poMapping.getProjects.useQuery()
  
  // Memoized input for spend types
  const spendTypeInput = useMemo(
    () => ({ projectId: selectedProject }),
    [selectedProject]
  )
  const { data: spendTypes, isLoading: spendTypesLoading } = trpc.poMapping.getSpendTypes.useQuery(
    spendTypeInput,
    { enabled: !!selectedProject }
  )
  
  // Memoized input for subcategories
  const subCatInput = useMemo(
    () => ({ 
      projectId: selectedProject, 
      spendType: selectedSpendType 
    }),
    [selectedProject, selectedSpendType]
  )
  const { data: subCategories, isLoading: subCategoriesLoading } = trpc.poMapping.getSpendSubCategories.useQuery(
    subCatInput,
    { enabled: !!selectedProject && !!selectedSpendType }
  )
  
  // Memoized input for finding matching cost breakdown (Procedure 4)
  const findInput = useMemo(
    () => ({
      projectId: selectedProject,
      spendType: selectedSpendType,
      spendSubCategory: selectedSpendSubCategory
    }),
    [selectedProject, selectedSpendType, selectedSpendSubCategory]
  )
  const { data: costBreakdowns } = trpc.poMapping.findMatchingCostBreakdown.useQuery(
    findInput,
    { 
      enabled: !!selectedProject && !!selectedSpendType && !!selectedSpendSubCategory,
      refetchOnMount: false,
      refetchOnWindowFocus: false
    }
  )
  
  // Notify parent when cost breakdown is found
  useEffect(() => {
    if (costBreakdowns && costBreakdowns.length > 0) {
      onCostBreakdownFound(costBreakdowns[0].id)
    } else {
      onCostBreakdownFound(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [costBreakdowns])
  
  // Cascading reset logic - BA-006
  useEffect(() => {
    if (!selectedProject) {
      onSpendTypeChange('')
      onSubCategoryChange('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProject])
  
  useEffect(() => {
    if (!selectedSpendType) {
      onSubCategoryChange('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSpendType])
  
  return (
    <div className="space-y-4">
      {/* Project selector */}
      <div>
        <Label htmlFor="project-select">Project</Label>
        {projectsLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <Select 
            value={selectedProject} 
            onValueChange={onProjectChange}
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
            value={selectedSpendType} 
            onValueChange={onSpendTypeChange}
            disabled={!selectedProject}
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
            value={selectedSpendSubCategory} 
            onValueChange={onSubCategoryChange}
            disabled={!selectedSpendType}
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
