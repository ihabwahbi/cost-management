"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/client"

const SaveIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M19,21H5a2,2,0,0,1-2-2V5a2,2,0,0,1,2-2H16l3,3V19A2,2,0,0,1,19,21Z" />
    <polyline points="17,21 17,13 7,13 7,21" />
    <polyline points="7,3 7,8 15,8" />
  </svg>
)

const MessageSquareIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M21,15a2,2,0,0,1-2,2H7l-4,4V5a2,2,0,0,1,2-2H19a2,2,0,0,1,2,2Z" />
  </svg>
)

const EditIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2,0,0,0 2 2H14a2 2 0,0,0 2-2V7" />
    <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)

const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22,4 12,14.01 9,11.01" />
  </svg>
)

const TrashIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="m3 6 3 0" />
    <path d="m6 6 0 14c0 1-1 2-2 2h8c1 0 2-1 2-2V6" />
    <path d="m8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    <line x1="10" x2="10" y1="11" y2="17" />
    <line x1="14" x2="14" y1="11" y2="17" />
  </svg>
)

interface PO {
  id: string
  po_number: string
  vendor_name: string
  project_name: string | null
  asset_code: string | null
  fmt_po: boolean
  total_value: number
  po_creation_date: string
  line_items: POLineItem[]
}

interface POLineItem {
  id: string
  description: string
  quantity: number
  line_value: number
  line_item_number: number
}

interface Project {
  id: string
  name: string
  sub_business_line: string
}

interface SpendType {
  spend_type: string
}

interface SpendSubCategory {
  spend_sub_category: string
}

interface CostBreakdown {
  id: string
  project_id: string
  sub_business_line: string
  cost_line: string
  spend_type: string
  spend_sub_category: string
  budget_cost: number
  project: {
    name: string
  }
}

interface DetailsPanelProps {
  selectedPO: PO | null
  costBreakdowns: CostBreakdown[]
  onSaveMapping: (poId: string, costBreakdownId: string, notes?: string) => Promise<boolean>
  onMappingChange?: () => Promise<void>
}

export function DetailsPanel({ selectedPO, costBreakdowns, onSaveMapping, onMappingChange }: DetailsPanelProps) {
  const [selectedProject, setSelectedProject] = useState("")
  const [selectedSpendType, setSelectedSpendType] = useState("")
  const [selectedSpendSubCategory, setSelectedSpendSubCategory] = useState("")
  const [mappingNotes, setMappingNotes] = useState("")
  const [existingMappings, setExistingMappings] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [spendTypes, setSpendTypes] = useState<SpendType[]>([])
  const [spendSubCategories, setSpendSubCategories] = useState<SpendSubCategory[]>([])
  const [availableCostBreakdowns, setAvailableCostBreakdowns] = useState<CostBreakdown[]>([])
  const [editingMapping, setEditingMapping] = useState<string | null>(null)
  const [editProject, setEditProject] = useState("")
  const [editSpendType, setEditSpendType] = useState("")
  const [editSpendSubCategory, setEditSpendSubCategory] = useState("")
  const [editNotes, setEditNotes] = useState("")
  const [hasMappings, setHasMappings] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [showClearConfirmation, setShowClearConfirmation] = useState(false)
  const [clearing, setClearing] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    if (selectedPO) {
      fetchExistingMappings(selectedPO.id)
      setSelectedProject("")
      setSelectedSpendType("")
      setSelectedSpendSubCategory("")
      setMappingNotes("")
    }
  }, [selectedPO])

  useEffect(() => {
    if (selectedProject) {
      fetchSpendTypes(selectedProject)
      setSelectedSpendType("")
      setSelectedSpendSubCategory("")
    }
  }, [selectedProject])

  useEffect(() => {
    if (selectedProject && selectedSpendType) {
      fetchSpendSubCategories(selectedProject, selectedSpendType)
      setSelectedSpendSubCategory("")
    }
  }, [selectedProject, selectedSpendType])

  useEffect(() => {
    if (selectedProject && selectedSpendType && selectedSpendSubCategory) {
      findMatchingCostBreakdown()
    }
  }, [selectedProject, selectedSpendType, selectedSpendSubCategory])

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase.from("projects").select("id, name, sub_business_line").order("name")

      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      console.error("Error fetching projects:", error)
    }
  }

  const fetchSpendTypes = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from("cost_breakdown")
        .select("spend_type")
        .eq("project_id", projectId)
        .order("spend_type")

      if (error) throw error

      const uniqueSpendTypes = Array.from(new Set(data?.map((item) => item.spend_type) || [])).map((spend_type) => ({
        spend_type,
      }))

      setSpendTypes(uniqueSpendTypes)
    } catch (error) {
      console.error("Error fetching spend types:", error)
    }
  }

  const fetchSpendSubCategories = async (projectId: string, spendType: string) => {
    try {
      const { data, error } = await supabase
        .from("cost_breakdown")
        .select("spend_sub_category")
        .eq("project_id", projectId)
        .eq("spend_type", spendType)
        .order("spend_sub_category")

      if (error) throw error

      const uniqueSubCategories = Array.from(new Set(data?.map((item) => item.spend_sub_category) || [])).map(
        (spend_sub_category) => ({ spend_sub_category }),
      )

      setSpendSubCategories(uniqueSubCategories)
    } catch (error) {
      console.error("Error fetching spend sub categories:", error)
    }
  }

  const findMatchingCostBreakdown = async () => {
    try {
      const { data, error } = await supabase
        .from("cost_breakdown")
        .select(`
          *,
          project:projects(name)
        `)
        .eq("project_id", selectedProject)
        .eq("spend_type", selectedSpendType)
        .eq("spend_sub_category", selectedSpendSubCategory)

      if (error) throw error
      setAvailableCostBreakdowns(data || [])
    } catch (error) {
      console.error("Error finding cost breakdown:", error)
    }
  }

  const fetchExistingMappings = async (poId: string) => {
    try {
      const { data, error } = await supabase
        .from("po_mappings")
        .select(`
          *,
          cost_breakdown:cost_breakdown(
            *,
            project:projects(name)
          ),
          po_line_item:po_line_items!inner(
            id,
            po_id
          )
        `)
        .eq("po_line_item.po_id", poId)

      if (error) throw error

      const groupedMappings = (data || []).reduce((acc: any[], mapping: any) => {
        const existingGroup = acc.find((group) => group.cost_breakdown.id === mapping.cost_breakdown.id)
        if (existingGroup) {
          existingGroup.mappings.push(mapping)
        } else {
          acc.push({
            ...mapping,
            mappings: [mapping],
          })
        }
        return acc
      }, [])

      setExistingMappings(groupedMappings)
      setHasMappings(groupedMappings.length > 0)
    } catch (error) {
      console.error("Error fetching existing mappings:", error)
    }
  }

  const handleSaveMapping = async () => {
    if (selectedPO && availableCostBreakdowns.length > 0) {
      setSaving(true)
      const success = await onSaveMapping(selectedPO.id, availableCostBreakdowns[0].id, mappingNotes)

      if (success) {
        await fetchExistingMappings(selectedPO.id)
        if (onMappingChange) {
          await onMappingChange()
        }
        setSelectedProject("")
        setSelectedSpendType("")
        setSelectedSpendSubCategory("")
        setMappingNotes("")
        setIsEditMode(false)
      }
      setSaving(false)
    }
  }

  const handleUpdateMapping = async (mappingGroup: any) => {
    if (!editProject || !editSpendType || !editSpendSubCategory) return

    setSaving(true)
    try {
      const { data: newCostBreakdown, error: cbError } = await supabase
        .from("cost_breakdown")
        .select("id")
        .eq("project_id", editProject)
        .eq("spend_type", editSpendType)
        .eq("spend_sub_category", editSpendSubCategory)
        .single()

      if (cbError) throw cbError

      const updatePromises = mappingGroup.mappings.map((mapping: any) =>
        supabase
          .from("po_mappings")
          .update({
            cost_breakdown_id: newCostBreakdown.id,
            mapping_notes: editNotes,
          })
          .eq("id", mapping.id),
      )

      await Promise.all(updatePromises)

      await fetchExistingMappings(selectedPO!.id)
      if (onMappingChange) {
        await onMappingChange()
      }
      setEditingMapping(null)
      setEditProject("")
      setEditSpendType("")
      setEditSpendSubCategory("")
      setEditNotes("")
    } catch (error) {
      console.error("Error updating mapping:", error)
    }
    setSaving(false)
  }

  const handleClearMapping = async () => {
    if (!selectedPO) return

    setClearing(true)
    try {
      // Delete all mappings for this PO
      const { error } = await supabase
        .from("po_mappings")
        .delete()
        .in(
          "po_line_item_id",
          selectedPO.line_items.map((item) => item.id),
        )

      if (error) throw error

      // Refresh the mappings
      await fetchExistingMappings(selectedPO.id)
      if (onMappingChange) {
        await onMappingChange()
      }
      setShowClearConfirmation(false)
    } catch (error) {
      console.error("Error clearing mapping:", error)
    }
    setClearing(false)
  }

  const startEditMapping = (mappingGroup: any) => {
    setEditingMapping(mappingGroup.id)
    setEditProject(mappingGroup.cost_breakdown.project_id)
    setEditSpendType(mappingGroup.cost_breakdown.spend_type)
    setEditSpendSubCategory(mappingGroup.cost_breakdown.spend_sub_category)
    setEditNotes(mappingGroup.mapping_notes || "")

    fetchSpendTypes(mappingGroup.cost_breakdown.project_id)
    fetchSpendSubCategories(mappingGroup.cost_breakdown.project_id, mappingGroup.cost_breakdown.spend_type)
  }

  const startCreateMapping = () => {
    setIsEditMode(true)
    setSelectedProject("")
    setSelectedSpendType("")
    setSelectedSpendSubCategory("")
    setMappingNotes("")
  }

  const cancelMapping = () => {
    setIsEditMode(false)
    setEditingMapping(null)
    setSelectedProject("")
    setSelectedSpendType("")
    setSelectedSpendSubCategory("")
    setMappingNotes("")
    setEditProject("")
    setEditSpendType("")
    setEditSpendSubCategory("")
    setEditNotes("")
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "N/A"

    return date.toLocaleDateString("en-AU", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }

  if (!selectedPO) {
    return (
      <Card className="h-full rounded-none border-0">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center text-muted-foreground">
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                <MessageSquareIcon className="w-8 h-8" />
              </div>
            </div>
            <h3 className="text-lg font-medium mb-2">Select a PO to see details</h3>
            <p className="text-sm">Choose a Purchase Order from the table to view and edit its mapping details.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full rounded-none border-0">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">PO {selectedPO.po_number}</CardTitle>
          {hasMappings && !isEditMode && (
            <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
              <CheckCircleIcon className="w-3 h-3 mr-1" />
              Mapped
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6 overflow-auto h-[calc(100vh-200px)]">
        {!hasMappings && !isEditMode && (
          <Card className="border-2 border-dashed border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-primary/10 rounded-full flex items-center justify-center">
                  <EditIcon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-medium text-primary mb-2">PO Not Mapped</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  This Purchase Order hasn't been mapped to a project yet. Create a mapping to track costs properly.
                </p>
                <Button onClick={startCreateMapping} className="bg-primary hover:bg-primary/90">
                  <EditIcon className="mr-2 h-4 w-4" />
                  Create Mapping
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {(!hasMappings && isEditMode) || (hasMappings && isEditMode) ? (
          <Card className="border-2 border-dashed border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base text-primary">
                  {hasMappings ? "Update Mapping" : "Create New Mapping"}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={cancelMapping}>
                  Cancel
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project">Project</Label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="spend-type">Spend Type</Label>
                <Select value={selectedSpendType} onValueChange={setSelectedSpendType} disabled={!selectedProject}>
                  <SelectTrigger>
                    <SelectValue placeholder={selectedProject ? "Select spend type" : "Select project first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {spendTypes.map((type) => (
                      <SelectItem key={type.spend_type} value={type.spend_type}>
                        {type.spend_type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="spend-sub-category">Spend Sub Category</Label>
                <Select
                  value={selectedSpendSubCategory}
                  onValueChange={setSelectedSpendSubCategory}
                  disabled={!selectedSpendType}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={selectedSpendType ? "Select spend sub category" : "Select spend type first"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {spendSubCategories.map((category) => (
                      <SelectItem key={category.spend_sub_category} value={category.spend_sub_category}>
                        {category.spend_sub_category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mapping-notes">Notes (Optional)</Label>
                <Textarea
                  id="mapping-notes"
                  placeholder="Add notes about this mapping..."
                  value={mappingNotes}
                  onChange={(e) => setMappingNotes(e.target.value)}
                  className="min-h-[60px] resize-none"
                />
              </div>

              <Button
                onClick={handleSaveMapping}
                className="w-full"
                disabled={
                  !selectedProject ||
                  !selectedSpendType ||
                  !selectedSpendSubCategory ||
                  availableCostBreakdowns.length === 0 ||
                  saving
                }
              >
                <SaveIcon className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : hasMappings ? "Update Mapping" : "Save Mapping"}
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {hasMappings && !isEditMode ? (
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3">
                <CardTitle className="text-base text-green-800">Current Mapping</CardTitle>
                <div className="flex flex-col gap-2 w-full">
                  <Button
                    onClick={startCreateMapping}
                    variant="outline"
                    size="sm"
                    className="border-green-300 text-green-700 hover:bg-green-100 bg-transparent w-full"
                  >
                    <EditIcon className="mr-2 h-4 w-4" />
                    Update Mapping
                  </Button>
                  <Button
                    onClick={() => setShowClearConfirmation(true)}
                    variant="outline"
                    size="sm"
                    className="border-red-300 text-red-700 hover:bg-red-50 bg-transparent w-full"
                  >
                    <TrashIcon className="mr-2 h-4 w-4" />
                    Clear Mapping
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {showClearConfirmation && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <TrashIcon className="w-4 h-4 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-red-800 mb-1">Clear Mapping</h4>
                      <p className="text-sm text-red-700 mb-3 break-words">
                        Are you sure you want to clear the mapping for PO {selectedPO.po_number}? This action cannot be
                        undone.
                      </p>
                      <div className="flex flex-col gap-2 w-full">
                        <Button
                          onClick={handleClearMapping}
                          size="sm"
                          variant="destructive"
                          disabled={clearing}
                          className="w-full"
                        >
                          {clearing ? "Clearing..." : "Yes, Clear Mapping"}
                        </Button>
                        <Button
                          onClick={() => setShowClearConfirmation(false)}
                          size="sm"
                          variant="outline"
                          className="w-full"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {existingMappings.map((mappingGroup) => (
                  <div key={mappingGroup.id} className="p-4 bg-white rounded-lg border border-green-200">
                    {editingMapping === mappingGroup.id ? (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label>Project</Label>
                          <Select value={editProject} onValueChange={setEditProject}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {projects.map((project) => (
                                <SelectItem key={project.id} value={project.id}>
                                  {project.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Spend Type</Label>
                          <Select value={editSpendType} onValueChange={setEditSpendType}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {spendTypes.map((type) => (
                                <SelectItem key={type.spend_type} value={type.spend_type}>
                                  {type.spend_type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Spend Sub Category</Label>
                          <Select value={editSpendSubCategory} onValueChange={setEditSpendSubCategory}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {spendSubCategories.map((category) => (
                                <SelectItem key={category.spend_sub_category} value={category.spend_sub_category}>
                                  {category.spend_sub_category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Notes</Label>
                          <Textarea
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            className="min-h-[60px] resize-none"
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleUpdateMapping(mappingGroup)}
                            disabled={saving}
                            className="w-full"
                          >
                            {saving ? "Saving..." : "Save Changes"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingMapping(null)}
                            className="w-full"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-col gap-3 mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-green-800 mb-1 break-words">
                              {mappingGroup.cost_breakdown.project.name}
                            </h4>
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  {mappingGroup.cost_breakdown.spend_type}
                                </Badge>
                                <span className="text-xs text-muted-foreground">→</span>
                                <Badge variant="secondary" className="text-xs">
                                  {mappingGroup.cost_breakdown.spend_sub_category}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground break-words">
                                {mappingGroup.cost_breakdown.sub_business_line} -{" "}
                                {mappingGroup.cost_breakdown.cost_line}
                              </p>
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <Badge variant="outline" className="text-sm font-semibold">
                              {formatCurrency(selectedPO.total_value)}
                            </Badge>
                          </div>
                        </div>

                        {mappingGroup.mapping_notes && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-muted-foreground">
                            <strong>Notes:</strong> {mappingGroup.mapping_notes}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">PO Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground">Total Value</Label>
                <p className="font-medium">{formatCurrency(selectedPO.total_value)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Creation Date</Label>
                <p className="font-medium">{formatDate(selectedPO.po_creation_date)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Vendor Name</Label>
                <p className="font-medium">{selectedPO.vendor_name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">FMT PO</Label>
                <Badge variant={selectedPO.fmt_po ? "default" : "secondary"}>{selectedPO.fmt_po ? "Yes" : "No"}</Badge>
              </div>
              {selectedPO.project_name && (
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Current Project</Label>
                  <p className="font-medium">{selectedPO.project_name}</p>
                </div>
              )}
              {selectedPO.asset_code && (
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Asset Code</Label>
                  <Badge variant="outline">{selectedPO.asset_code}</Badge>
                </div>
              )}
            </div>

            <Separator />

            <div>
              <Label className="text-muted-foreground mb-2 block">Line Items</Label>
              <div className="space-y-2">
                {selectedPO.line_items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        Line {item.line_item_number}: {item.description}
                      </p>
                      <p className="text-xs text-muted-foreground">Quantity: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium">
                      {isNaN(Number(item.line_value)) || item.line_value == null
                        ? "N/A"
                        : formatCurrency(Number(item.line_value))}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )
}
