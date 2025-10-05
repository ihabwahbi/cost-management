'use client'

import { useMemo, useState } from 'react'
import { trpc } from '@/lib/trpc'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog'
import { VersionHistoryTimeline } from '@/components/version-history-timeline'
import { Plus, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface VersionManagementCellProps {
  projectId: string
  projectName: string
  activeVersion: number | "latest"
  onVersionChange: (versionNumber: number | "latest") => void
  onOpenForecastWizard: () => void
}

export function VersionManagementCell({
  projectId,
  projectName,
  activeVersion,
  onVersionChange,
  onOpenForecastWizard,
}: VersionManagementCellProps) {
  const { toast } = useToast()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [versionToDelete, setVersionToDelete] = useState<number | null>(null)
  
  // Query 1: Get all forecast versions for this project
  const { data: versions, isLoading: versionsLoading } = trpc.forecasts.getForecastVersions.useQuery(
    { projectId },
    {
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000, // 1 minute
    }
  )
  
  // Mutation: Delete forecast version
  const utils = trpc.useUtils()
  const deleteMutation = trpc.forecasts.deleteForecastVersion.useMutation({
    onSuccess: (data) => {
      // Invalidate versions query to refresh list
      utils.forecasts.getForecastVersions.invalidate({ projectId })
      
      // If deleted version was active, switch to latest
      if (activeVersion === data.versionNumber) {
        onVersionChange('latest')
      }
      
      toast({
        title: "Version Deleted",
        description: `Version ${data.versionNumber} has been removed`,
      })
      
      setDeleteDialogOpen(false)
      setVersionToDelete(null)
    },
    onError: (error) => {
      toast({
        title: "Deletion Failed",
        description: error.message,
        variant: "destructive",
      })
    }
  })
  
  // Memoize version options for Select component
  const versionOptions = useMemo(() => {
    if (!versions) return []
    
    return [
      { value: 'latest', label: `Latest (v${versions[0]?.versionNumber ?? 0})` },
      ...versions.map(v => ({
        value: v.versionNumber.toString(),
        label: `Version ${v.versionNumber}`,
      })),
    ]
  }, [versions])

  // Transform versions for VersionHistoryTimeline (camelCase → snake_case)
  const transformedVersions = useMemo(() => {
    if (!versions) return []
    
    return versions.map(v => ({
      id: v.id,
      project_id: v.projectId,
      version_number: v.versionNumber,
      reason_for_change: v.reasonForChange,
      created_at: v.createdAt ?? '',
      created_by: v.createdBy ?? '',
    }))
  }, [versions])
  
  const handleVersionSelect = (value: string) => {
    if (value === 'latest') {
      onVersionChange('latest')
    } else {
      onVersionChange(parseInt(value, 10))
    }
  }
  
  const handleDeleteClick = (versionNumber: number) => {
    if (versionNumber === 0) {
      toast({
        title: "Cannot Delete",
        description: "Version 0 (baseline) cannot be deleted",
        variant: "destructive",
      })
      return
    }
    
    setVersionToDelete(versionNumber)
    setDeleteDialogOpen(true)
  }
  
  const confirmDelete = () => {
    if (versionToDelete === null) return
    
    deleteMutation.mutate({
      projectId,
      versionNumber: versionToDelete,
    })
  }
  
  if (versionsLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-10 w-48 animate-pulse bg-gray-200 rounded" />
        <div className="h-10 w-32 animate-pulse bg-gray-200 rounded" />
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      {/* Version Selection Controls */}
      <div className="flex items-center gap-2">
        <Select
          value={activeVersion.toString()}
          onValueChange={handleVersionSelect}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select version" />
          </SelectTrigger>
          <SelectContent>
            {versionOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button
          onClick={onOpenForecastWizard}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Forecast
        </Button>
        
        {activeVersion !== 'latest' && activeVersion > 0 && (
          <Button
            variant="destructive"
            size="icon"
            onClick={() => handleDeleteClick(activeVersion as number)}
            aria-label={`Delete version ${activeVersion}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {/* Version Timeline */}
      <VersionHistoryTimeline
        versions={transformedVersions}
        currentVersion={activeVersion}
        onVersionSelect={(versionNumber) => onVersionChange(versionNumber)}
      />
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Version {versionToDelete}?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. All forecast data for this version will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Version"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
