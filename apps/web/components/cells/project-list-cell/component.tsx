'use client'

import { useMemo, useCallback, useState } from 'react'
import { trpc } from '@/lib/trpc'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { AlertCircle, Plus, Trash2 } from 'lucide-react'

interface ProjectListCellProps {
  onProjectSelect?: (projectId: string) => void
}

const SUB_BUSINESS_LINES = [
  'Wireline',
  'Drilling & Measurement',
  'Well Construction',
  'Completions',
  'OneSubsea',
  'Production Systems',
] as const

export function ProjectListCell({ onProjectSelect }: ProjectListCellProps) {
  const { toast } = useToast()
  const utils = trpc.useUtils()

  // Local state
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null)
  const [newProjectData, setNewProjectData] = useState<{
    name: string
    subBusinessLine: typeof SUB_BUSINESS_LINES[number] | ''
  }>({
    name: '',
    subBusinessLine: '',
  })

  // ✅ CRITICAL: Memoize query inputs
  const queryInput = useMemo(
    () => ({
      orderBy: 'createdAt' as const,
      orderDirection: 'desc' as const,
    }),
    []
  )

  // tRPC queries
  const { data: projects, isLoading, error } = trpc.projects.getProjectsList.useQuery(
    queryInput,
    {
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  )

  // tRPC mutations
  const createProjectMutation = trpc.projects.createProject.useMutation({
    onSuccess: (newProject) => {
      toast({
        title: 'Success',
        description: `Project "${newProject.name}" created successfully`,
      })
      utils.projects.getProjectsList.invalidate()
      setShowCreateDialog(false)
      setNewProjectData({ name: '', subBusinessLine: '' })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create project: ${error.message}`,
        variant: 'destructive',
      })
    },
  })

  const deleteProjectMutation = trpc.projects.deleteProject.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Project deleted successfully',
      })
      utils.projects.getProjectsList.invalidate()
      setShowDeleteDialog(false)
      setProjectToDelete(null)
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete project: ${error.message}`,
        variant: 'destructive',
      })
    },
  })

  // ✅ Memoized callbacks
  const handleCreateProject = useCallback(() => {
    if (!newProjectData.name || !newProjectData.subBusinessLine) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }
    // Type-safe mutation call (subBusinessLine is guaranteed to be non-empty here)
    createProjectMutation.mutate({
      name: newProjectData.name,
      subBusinessLine: newProjectData.subBusinessLine as Exclude<typeof newProjectData.subBusinessLine, ''>,
    })
  }, [newProjectData, createProjectMutation, toast])

  const handleDeleteClick = useCallback((projectId: string) => {
    setProjectToDelete(projectId)
    setShowDeleteDialog(true)
  }, [])

  const handleDeleteConfirm = useCallback(() => {
    if (projectToDelete) {
      deleteProjectMutation.mutate({ id: projectToDelete })
    }
  }, [projectToDelete, deleteProjectMutation])

  const handleProjectClick = useCallback(
    (projectId: string) => {
      if (onProjectSelect) {
        onProjectSelect(projectId)
      }
    },
    [onProjectSelect]
  )

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Projects</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Projects</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    )
  }

  // Empty state
  if (!projects || projects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Projects</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">No projects found</p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create First Project
          </Button>
        </CardContent>

        {/* Create Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Add a new project to the system
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  value={newProjectData.name}
                  onChange={(e) =>
                    setNewProjectData({ ...newProjectData, name: e.target.value })
                  }
                  placeholder="Enter project name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sub-business-line">Sub-Business Line</Label>
                <Select
                  value={newProjectData.subBusinessLine}
                  onValueChange={(value) =>
                    setNewProjectData({
                      ...newProjectData,
                      subBusinessLine: value as typeof SUB_BUSINESS_LINES[number],
                    })
                  }
                >
                  <SelectTrigger id="sub-business-line">
                    <SelectValue placeholder="Select sub-business line" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUB_BUSINESS_LINES.map((line) => (
                      <SelectItem key={line} value={line}>
                        {line}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateProject}>Create Project</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>
    )
  }

  // Success state - render projects
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Projects ({projects.length})</CardTitle>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => handleProjectClick(project.id)}
            >
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{project.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{project.subBusinessLine}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteClick(project.id)
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>Add a new project to the system</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                value={newProjectData.name}
                onChange={(e) =>
                  setNewProjectData({ ...newProjectData, name: e.target.value })
                }
                placeholder="Enter project name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sub-business-line">Sub-Business Line</Label>
              <Select
                value={newProjectData.subBusinessLine}
                onValueChange={(value) =>
                  setNewProjectData({
                    ...newProjectData,
                    subBusinessLine: value as typeof SUB_BUSINESS_LINES[number],
                  })
                }
              >
                <SelectTrigger id="sub-business-line">
                  <SelectValue placeholder="Select sub-business line" />
                </SelectTrigger>
                <SelectContent>
                  {SUB_BUSINESS_LINES.map((line) => (
                    <SelectItem key={line} value={line}>
                      {line}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProject}>Create Project</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this project? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
