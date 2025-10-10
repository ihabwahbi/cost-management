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

const SUB_BUSINESS_LINE_OPTIONS = ["WIS", "Drilling", "Production", "Facilities", "Subsea", "FPSO"]

const SUB_BUSINESS_LINE_MAPPING: Record<string, string> = {
  "WIS": "Wireline",
  "Drilling": "Drilling & Measurement",
  "Production": "Production Systems",
  "Facilities": "Well Construction",
  "Subsea": "OneSubsea",
  "FPSO": "Completions"
}

interface CostBreakdown {
  id: string
  project_id: string
  sub_business_line: string
  cost_line: string
  spend_type: string
  spend_sub_category: string
  budget_cost: number
}

export default function ProjectsPage() {
  const { toast } = useToast()
  const router = useRouter()
  const utils = trpc.useUtils()
  
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
  const { data: projects, isLoading } = trpc.projects.getProjectsList.useQuery({})
  
  // Fetch wizard data when needed
  const { data: wizardData } = trpc.costBreakdown.getCostBreakdownByVersion.useQuery(
    {
      projectId: showForecastWizard || "",
      versionNumber: showForecastWizard ? (activeVersion[showForecastWizard] ?? "latest") : "latest"
    },
    { enabled: !!showForecastWizard }
  )
  
  const createProject = trpc.projects.createProject.useMutation({
    onSuccess: () => {
      toast({ title: "Project created successfully" })
      setCreatingNewProject(false)
      setNewProjectData({ name: "", sub_business_line: "" })
      utils.projects.getProjectsList.invalidate()
    },
    onError: (error) => {
      toast({ title: "Failed to create project", description: error.message, variant: "destructive" })
    }
  })
  
  const deleteProject = trpc.projects.deleteProject.useMutation({
    onSuccess: () => {
      toast({ title: "Project deleted successfully" })
      utils.projects.getProjectsList.invalidate()
    },
    onError: (error) => {
      toast({ title: "Failed to delete project", description: error.message, variant: "destructive" })
    }
  })
  
  const createForecast = trpc.forecasts.createForecastVersion.useMutation({
    onSuccess: () => {
      toast({ title: "Forecast created successfully" })
      setShowForecastWizard(null)
      // Invalidate relevant queries
      if (showForecastWizard) {
        utils.costBreakdown.getCostBreakdownByVersion.invalidate()
        utils.forecasts.getForecastVersions.invalidate()
      }
    },
    onError: (error) => {
      toast({ title: "Failed to create forecast", description: error.message, variant: "destructive" })
    }
  })
  
  // ========================================
  // ORCHESTRATION FUNCTIONS (5 functions max)
  // ========================================
  const filteredProjects = projects?.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.subBusinessLine.toLowerCase().includes(searchTerm.toLowerCase())
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
    // Map to API's expected field name and enum values
    const mappedLine = SUB_BUSINESS_LINE_MAPPING[newProjectData.sub_business_line]
    if (!mappedLine) {
      toast({ title: "Validation Error", description: "Invalid sub business line", variant: "destructive" })
      return
    }
    createProject.mutate({
      name: newProjectData.name,
      subBusinessLine: mappedLine as "Wireline" | "Drilling & Measurement" | "Well Construction" | "Completions" | "OneSubsea" | "Production Systems"
    })
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
                className="border rounded px-3 py-2"
              >
                <option value="">Select Sub Business Line</option>
                {SUB_BUSINESS_LINE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
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
                    <p className="text-sm text-muted-foreground">{project.subBusinessLine}</p>
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
                          deleteProject.mutate({ id: project.id })
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
      {showForecastWizard && wizardData && (
        <ForecastWizard
          isOpen={true}
          onClose={() => setShowForecastWizard(null)}
          projectId={showForecastWizard}
          projectName={projects?.find(p => p.id === showForecastWizard)?.name || ""}
          currentCosts={wizardData.map(item => ({
            id: item.id,
            project_id: item.projectId,
            sub_business_line: item.subBusinessLine,
            cost_line: item.costLine,
            spend_type: item.spendType,
            spend_sub_category: item.spendSubCategory,
            budget_cost: item.budgetCost
          }))}
          stagedEntries={[]}
          onSave={async (changes, newEntries, reason) => {
            // Transform changes and newEntries to mutation format
            // changes is already a Record<string, number | null>
            await createForecast.mutateAsync({
              projectId: showForecastWizard,
              reason,
              changes, // Pass as-is
              newEntries: newEntries.map(entry => ({
                subBusinessLine: entry.sub_business_line,
                costLine: entry.cost_line,
                spendType: entry.spend_type,
                spendSubCategory: entry.spend_sub_category,
                budgetCost: entry.budget_cost
              }))
            })
          }}
        />
      )}
    </div>
  )
}
