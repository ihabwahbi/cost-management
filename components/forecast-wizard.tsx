"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  CheckCircle2,
  Circle,
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  FileText,
  Edit3,
  Eye,
  Save,
  Plus,
  Trash2,
  Calculator,
} from "lucide-react"

interface CostBreakdown {
  id: string
  project_id: string
  sub_business_line: string
  cost_line: string
  spend_type: string
  spend_sub_category: string
  budget_cost: number
  _modified?: boolean
  _tempId?: string
}

interface ForecastWizardProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  projectName: string
  currentCosts: CostBreakdown[]
  stagedEntries: CostBreakdown[]
  onSave: (
    changes: Record<string, number>,
    newEntries: CostBreakdown[],
    reason: string
  ) => Promise<void>
  onAddEntry: (entry: Omit<CostBreakdown, 'id'>) => void
  onUpdateEntry: (entry: CostBreakdown) => void
  onDeleteEntry: (id: string) => void
}

type WizardStep = 
  | "review"
  | "modify"
  | "add-reason"
  | "preview"
  | "confirm"

const COST_LINE_OPTIONS = [
  "M&S",
  "Services",
  "Equipment",
  "Labor",
  "Contractors",
  "Consumables",
]

const SPEND_TYPE_OPTIONS = [
  "Operational",
  "Maintenance",
  "Capital",
  "Emergency",
  "Planned",
]

const SUB_BUSINESS_LINE_OPTIONS = [
  "WIS",
  "Drilling",
  "Production",
  "Facilities",
  "Subsea",
  "FPSO",
]

export function ForecastWizard({
  isOpen,
  onClose,
  projectId,
  projectName,
  currentCosts,
  stagedEntries,
  onSave,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
}: ForecastWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>("review")
  const [forecastChanges, setForecastChanges] = useState<Record<string, number>>({})
  const [localStagedEntries, setLocalStagedEntries] = useState<CostBreakdown[]>([])
  const [forecastReason, setForecastReason] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [addingNewEntry, setAddingNewEntry] = useState(false)
  const [newEntry, setNewEntry] = useState<Partial<CostBreakdown>>({
    sub_business_line: SUB_BUSINESS_LINE_OPTIONS[0],
    cost_line: "",
    spend_type: "",
    spend_sub_category: "",
    budget_cost: 0,
  })

  // Initialize with existing staged entries
  useEffect(() => {
    setLocalStagedEntries(stagedEntries)
  }, [stagedEntries])

  // Auto-save draft to localStorage
  useEffect(() => {
    const draftData = {
      projectId,
      forecastChanges,
      localStagedEntries,
      forecastReason,
      currentStep,
      timestamp: new Date().toISOString(),
    }
    localStorage.setItem(`forecast-draft-${projectId}`, JSON.stringify(draftData))
  }, [projectId, forecastChanges, localStagedEntries, forecastReason, currentStep])

  // Load draft on mount
  useEffect(() => {
    const draftKey = `forecast-draft-${projectId}`
    const draftData = localStorage.getItem(draftKey)
    if (draftData) {
      try {
        const parsed = JSON.parse(draftData)
        // Only restore if draft is less than 24 hours old
        const draftAge = Date.now() - new Date(parsed.timestamp).getTime()
        if (draftAge < 24 * 60 * 60 * 1000) {
          setForecastChanges(parsed.forecastChanges || {})
          setLocalStagedEntries(parsed.localStagedEntries || [])
          setForecastReason(parsed.forecastReason || "")
          // Don't restore step to avoid confusion
        }
      } catch (error) {
        console.error("Error loading draft:", error)
      }
    }
  }, [projectId])

  const steps: { key: WizardStep; label: string; icon: React.ReactNode }[] = [
    { key: "review", label: "Review Budget", icon: <Eye className="w-4 h-4" /> },
    { key: "modify", label: "Modify Assumptions", icon: <Edit3 className="w-4 h-4" /> },
    { key: "add-reason", label: "Add Reason", icon: <FileText className="w-4 h-4" /> },
    { key: "preview", label: "Preview Changes", icon: <Calculator className="w-4 h-4" /> },
    { key: "confirm", label: "Confirm & Save", icon: <Save className="w-4 h-4" /> },
  ]

  const currentStepIndex = steps.findIndex(s => s.key === currentStep)
  const progressPercentage = ((currentStepIndex + 1) / steps.length) * 100

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getTotalBudget = () => {
    return currentCosts.reduce((sum, cost) => sum + cost.budget_cost, 0)
  }

  const getTotalForecast = () => {
    const modifiedTotal = currentCosts.reduce((sum, cost) => {
      const newValue = forecastChanges[cost.id]
      return sum + (newValue !== undefined ? newValue : cost.budget_cost)
    }, 0)
    const newEntriesTotal = localStagedEntries.reduce((sum, entry) => sum + entry.budget_cost, 0)
    return modifiedTotal + newEntriesTotal
  }

  const getTotalChange = () => {
    return getTotalForecast() - getTotalBudget()
  }

  const getChangePercentage = () => {
    const total = getTotalBudget()
    if (total === 0) return 0
    return (getTotalChange() / total) * 100
  }

  const getModifiedItemsCount = () => {
    return Object.keys(forecastChanges).length + localStagedEntries.length
  }

  const handleNext = () => {
    const stepIndex = steps.findIndex(s => s.key === currentStep)
    if (stepIndex < steps.length - 1) {
      setCurrentStep(steps[stepIndex + 1].key)
    }
  }

  const handleBack = () => {
    const stepIndex = steps.findIndex(s => s.key === currentStep)
    if (stepIndex > 0) {
      setCurrentStep(steps[stepIndex - 1].key)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(forecastChanges, localStagedEntries, forecastReason)
      
      // Clear draft after successful save
      localStorage.removeItem(`forecast-draft-${projectId}`)
      
      // Reset state
      setForecastChanges({})
      setLocalStagedEntries([])
      setForecastReason("")
      setCurrentStep("review")
      
      onClose()
    } catch (error) {
      console.error("Error saving forecast:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddNewEntry = () => {
    if (
      newEntry.cost_line &&
      newEntry.spend_type &&
      newEntry.spend_sub_category &&
      newEntry.budget_cost
    ) {
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const entry: CostBreakdown = {
        id: tempId,
        project_id: projectId,
        sub_business_line: newEntry.sub_business_line || SUB_BUSINESS_LINE_OPTIONS[0],
        cost_line: newEntry.cost_line,
        spend_type: newEntry.spend_type,
        spend_sub_category: newEntry.spend_sub_category,
        budget_cost: newEntry.budget_cost,
        _tempId: tempId,
      }
      
      setLocalStagedEntries([...localStagedEntries, entry])
      
      // Reset form
      setNewEntry({
        sub_business_line: SUB_BUSINESS_LINE_OPTIONS[0],
        cost_line: "",
        spend_type: "",
        spend_sub_category: "",
        budget_cost: 0,
      })
      setAddingNewEntry(false)
    }
  }

  const handleDeleteStagedEntry = (id: string) => {
    setLocalStagedEntries(localStagedEntries.filter(e => e.id !== id))
  }

  const canProceed = () => {
    switch (currentStep) {
      case "review":
        return true
      case "modify":
        return getModifiedItemsCount() > 0
      case "add-reason":
        return forecastReason.trim().length > 0
      case "preview":
        return true
      case "confirm":
        return true
      default:
        return false
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case "review":
        return (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Review the current budget before making modifications. This will be your baseline for the forecast.
              </AlertDescription>
            </Alert>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Budget Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Budget</p>
                    <p className="text-2xl font-bold">{formatCurrency(getTotalBudget())}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Line Items</p>
                    <p className="text-2xl font-bold">{currentCosts.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p className="text-2xl font-bold">Current</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cost Line</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Sub Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentCosts.map((cost) => (
                    <TableRow key={cost.id}>
                      <TableCell>{cost.cost_line}</TableCell>
                      <TableCell>{cost.spend_type}</TableCell>
                      <TableCell>{cost.spend_sub_category}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(cost.budget_cost)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        )

      case "modify":
        return (
          <div className="space-y-4">
            <Alert>
              <Edit3 className="h-4 w-4" />
              <AlertDescription>
                Modify budget amounts or add new cost items. All changes will be tracked in the forecast version.
              </AlertDescription>
            </Alert>

            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Cost Items</h3>
              {!addingNewEntry && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAddingNewEntry(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Entry
                </Button>
              )}
            </div>

            {addingNewEntry && (
              <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader>
                  <CardTitle className="text-sm">Add New Cost Entry</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Sub Business Line</Label>
                      <Select
                        value={newEntry.sub_business_line}
                        onValueChange={(value) =>
                          setNewEntry({ ...newEntry, sub_business_line: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SUB_BUSINESS_LINE_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Cost Line</Label>
                      <Select
                        value={newEntry.cost_line}
                        onValueChange={(value) =>
                          setNewEntry({ ...newEntry, cost_line: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select cost line" />
                        </SelectTrigger>
                        <SelectContent>
                          {COST_LINE_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Spend Type</Label>
                      <Select
                        value={newEntry.spend_type}
                        onValueChange={(value) =>
                          setNewEntry({ ...newEntry, spend_type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select spend type" />
                        </SelectTrigger>
                        <SelectContent>
                          {SPEND_TYPE_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Sub Category</Label>
                      <Input
                        value={newEntry.spend_sub_category}
                        onChange={(e) =>
                          setNewEntry({ ...newEntry, spend_sub_category: e.target.value })
                        }
                        placeholder="Enter sub category"
                      />
                    </div>
                    <div>
                      <Label>Budget Cost</Label>
                      <Input
                        type="number"
                        value={newEntry.budget_cost}
                        onChange={(e) =>
                          setNewEntry({
                            ...newEntry,
                            budget_cost: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddNewEntry}>
                      Add Entry
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setAddingNewEntry(false)
                        setNewEntry({
                          sub_business_line: SUB_BUSINESS_LINE_OPTIONS[0],
                          cost_line: "",
                          spend_type: "",
                          spend_sub_category: "",
                          budget_cost: 0,
                        })
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="relative border rounded-md flex-1 min-h-0">
              <div className="h-full max-h-[500px] overflow-auto">
                <Table className="w-full min-w-[800px]">
                  <TableHeader className="sticky top-0 bg-background z-10 border-b">
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Status</TableHead>
                      <TableHead className="whitespace-nowrap">Cost Line</TableHead>
                      <TableHead className="whitespace-nowrap">Type</TableHead>
                      <TableHead className="whitespace-nowrap">Sub Category</TableHead>
                      <TableHead className="text-right whitespace-nowrap">Original</TableHead>
                      <TableHead className="text-right whitespace-nowrap">Forecast</TableHead>
                      <TableHead className="w-20"></TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {/* Existing cost items */}
                  {currentCosts.map((cost) => {
                    const isEditing = editingItem === cost.id
                    const hasChange = forecastChanges[cost.id] !== undefined
                    const forecastValue = forecastChanges[cost.id] ?? cost.budget_cost
                    
                    return (
                      <TableRow key={cost.id}>
                        <TableCell className="whitespace-nowrap">
                          {hasChange && (
                            <Badge variant="outline" className="text-xs">
                              Modified
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{cost.cost_line}</TableCell>
                        <TableCell className="whitespace-nowrap">{cost.spend_type}</TableCell>
                        <TableCell className="whitespace-nowrap truncate max-w-[150px]" title={cost.spend_sub_category}>
                          {cost.spend_sub_category}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          {formatCurrency(cost.budget_cost)}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap p-1">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={forecastValue}
                              onChange={(e) =>
                                setForecastChanges({
                                  ...forecastChanges,
                                  [cost.id]: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-28 text-right text-sm"
                              autoFocus
                              onBlur={() => setEditingItem(null)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  setEditingItem(null)
                                }
                              }}
                            />
                          ) : (
                            <button
                              onClick={() => setEditingItem(cost.id)}
                              className="hover:underline text-right w-full"
                            >
                              {formatCurrency(forecastValue)}
                            </button>
                          )}
                        </TableCell>
                        <TableCell className="p-1">
                          {hasChange && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-xs"
                              onClick={() => {
                                const { [cost.id]: _, ...rest } = forecastChanges
                                setForecastChanges(rest)
                              }}
                            >
                              Reset
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  
                  {/* Staged new entries */}
                  {localStagedEntries.map((entry) => (
                    <TableRow key={entry.id} className="bg-amber-50/50">
                      <TableCell className="whitespace-nowrap">
                        <Badge className="text-xs bg-amber-500">New</Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{entry.cost_line}</TableCell>
                      <TableCell className="whitespace-nowrap">{entry.spend_type}</TableCell>
                      <TableCell className="whitespace-nowrap truncate max-w-[150px]" title={entry.spend_sub_category}>
                        {entry.spend_sub_category}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">-</TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {formatCurrency(entry.budget_cost)}
                      </TableCell>
                      <TableCell className="p-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2"
                          onClick={() => handleDeleteStagedEntry(entry.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                </Table>
              </div>
            </div>

            <Card className="bg-gray-50">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Total Changes: {getModifiedItemsCount()} items
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">New Total:</span>
                    <span className="text-lg font-bold">
                      {formatCurrency(getTotalForecast())}
                    </span>
                    {getTotalChange() !== 0 && (
                      <Badge
                        variant={getTotalChange() > 0 ? "default" : "destructive"}
                        className="ml-2"
                      >
                        {getTotalChange() > 0 ? "+" : ""}
                        {formatCurrency(getTotalChange())}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case "add-reason":
        return (
          <div className="space-y-4">
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                Provide a clear reason for this forecast. This will be stored with the version for future reference.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Forecast</Label>
              <Textarea
                id="reason"
                value={forecastReason}
                onChange={(e) => setForecastReason(e.target.value)}
                placeholder="Explain the business rationale for these changes..."
                className="min-h-[200px]"
              />
              <p className="text-xs text-muted-foreground">
                Be specific about what drove these changes (e.g., "Q3 market conditions require
                additional equipment maintenance budget")
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Change Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Items Modified</dt>
                    <dd className="font-semibold">
                      {Object.keys(forecastChanges).length} existing
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Items Added</dt>
                    <dd className="font-semibold">{localStagedEntries.length} new</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Total Change</dt>
                    <dd className="font-semibold">
                      {getTotalChange() > 0 ? "+" : ""}
                      {formatCurrency(getTotalChange())}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Change %</dt>
                    <dd className="font-semibold">
                      {getChangePercentage() > 0 ? "+" : ""}
                      {getChangePercentage().toFixed(1)}%
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>
        )

      case "preview":
        return (
          <div className="space-y-4">
            <Alert>
              <Calculator className="h-4 w-4" />
              <AlertDescription>
                Review all changes before saving. This will create a new forecast version.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle>Forecast Summary</CardTitle>
                <CardDescription>{forecastReason}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Before</h4>
                    <dl className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Total Budget</dt>
                        <dd>{formatCurrency(getTotalBudget())}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Line Items</dt>
                        <dd>{currentCosts.length}</dd>
                      </div>
                    </dl>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">After</h4>
                    <dl className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Total Forecast</dt>
                        <dd className="font-semibold">{formatCurrency(getTotalForecast())}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Line Items</dt>
                        <dd className="font-semibold">
                          {currentCosts.length + localStagedEntries.length}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getTotalChange() >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      )}
                      <span className="font-semibold">Total Change:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-lg font-bold ${
                          getTotalChange() >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {getTotalChange() > 0 ? "+" : ""}
                        {formatCurrency(getTotalChange())}
                      </span>
                      <Badge variant="outline">
                        {getChangePercentage() > 0 ? "+" : ""}
                        {getChangePercentage().toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {Object.keys(forecastChanges).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Modified Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {Object.entries(forecastChanges).map(([costId, newValue]) => {
                        const cost = currentCosts.find((c) => c.id === costId)
                        if (!cost) return null
                        const change = newValue - cost.budget_cost
                        return (
                          <div
                            key={costId}
                            className="flex justify-between items-center text-sm py-1"
                          >
                            <span className="text-muted-foreground">
                              {cost.cost_line} - {cost.spend_sub_category}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">
                                {formatCurrency(cost.budget_cost)}
                              </span>
                              <span>→</span>
                              <span className="font-semibold">
                                {formatCurrency(newValue)}
                              </span>
                              <Badge
                                variant={change > 0 ? "default" : "destructive"}
                                className="text-xs"
                              >
                                {change > 0 ? "+" : ""}
                                {formatCurrency(change)}
                              </Badge>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {localStagedEntries.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">New Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {localStagedEntries.map((entry) => (
                        <div
                          key={entry.id}
                          className="flex justify-between items-center text-sm py-1"
                        >
                          <span className="text-muted-foreground">
                            {entry.cost_line} - {entry.spend_sub_category}
                          </span>
                          <span className="font-semibold">
                            {formatCurrency(entry.budget_cost)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
        )

      case "confirm":
        return (
          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Your forecast is ready to be saved. This will create a new version that can be
                reviewed and compared with previous versions.
              </AlertDescription>
            </Alert>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Ready to Save Forecast</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Version will be created with {getModifiedItemsCount()} changes
                    </p>
                  </div>
                  <div className="pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">New Total:</span>
                      <span className="font-semibold">
                        {formatCurrency(getTotalForecast())}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Change:</span>
                      <span
                        className={`font-semibold ${
                          getTotalChange() >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {getTotalChange() > 0 ? "+" : ""}
                        {formatCurrency(getTotalChange())} ({getChangePercentage() > 0 ? "+" : ""}
                        {getChangePercentage().toFixed(1)}%)
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Reason:</span>
                      <span className="font-semibold text-right max-w-[200px] truncate">
                        {forecastReason}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[95vw] h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Create New Forecast - {projectName}</DialogTitle>
          <DialogDescription>
            Follow the steps to create a new forecast version with tracked changes
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {/* Progress indicator */}
          <div className="space-y-2 flex-shrink-0 pb-4">
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex justify-between">
              {steps.map((step, index) => (
                <div
                  key={step.key}
                  className={`flex items-center gap-1 text-xs ${
                    index <= currentStepIndex
                      ? "text-primary font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  {index <= currentStepIndex ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <Circle className="w-3 h-3" />
                  )}
                  <span className="hidden sm:inline">{step.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Step content */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {renderStepContent()}
          </div>
        </div>

        <DialogFooter className="flex justify-between flex-shrink-0 mt-4">
          <div className="flex gap-2">
            {currentStepIndex > 0 && (
              <Button variant="outline" onClick={handleBack} disabled={isSaving}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            {currentStep === "confirm" ? (
              <Button onClick={handleSave} disabled={isSaving || !canProceed()}>
                {isSaving ? "Saving..." : "Save Forecast"}
              </Button>
            ) : (
              <Button onClick={handleNext} disabled={!canProceed()}>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}