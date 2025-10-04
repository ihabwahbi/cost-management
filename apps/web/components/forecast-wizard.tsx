"use client"

import { useState, useEffect } from "react"
import { useWizardNavigation } from "@/hooks/use-wizard-navigation"
import { WizardShell } from "@/components/ui/wizard/wizard-shell"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
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
import { Button } from "@/components/ui/button"
import {
  CheckCircle2,
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
import { NewEntryForm } from "./forecast-wizard/components/new-entry-form"
import { ForecastEditableTable } from "./forecast-wizard/components/forecast-editable-table"
import { ChangeSummaryFooter } from "./forecast-wizard/components/change-summary-footer"

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
    changes: Record<string, number | null>, // null = excluded from forecast
    newEntries: CostBreakdown[],
    reason: string
  ) => Promise<void>
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
}: ForecastWizardProps) {
  // Wizard navigation using extracted hook
  const steps = ["review", "modify", "add-reason", "preview", "confirm"] as const
  const {
    currentStep,
    goNext,
    goBack,
    canGoBack,
    canGoForward,
    progress,
    currentStepIndex,
  } = useWizardNavigation({
    steps,
    initialStep: "review" as WizardStep,
  })
  const [forecastChanges, setForecastChanges] = useState<Record<string, number | null>>({}) // null = excluded
  const [localStagedEntries, setLocalStagedEntries] = useState<CostBreakdown[]>([])
  const [forecastReason, setForecastReason] = useState("")
  const [isSaving, setIsSaving] = useState(false)

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

  // Step labels for wizard shell
  const stepLabels = [
    { label: "Review Budget", icon: <Eye className="w-4 h-4" /> },
    { label: "Modify Assumptions", icon: <Edit3 className="w-4 h-4" /> },
    { label: "Add Reason", icon: <FileText className="w-4 h-4" /> },
    { label: "Preview Changes", icon: <Calculator className="w-4 h-4" /> },
    { label: "Confirm & Save", icon: <Save className="w-4 h-4" /> },
  ]

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
      // null = excluded (contributes $0), undefined = unchanged (use original), number = modified value
      if (newValue === null) return sum + 0 // Excluded
      if (newValue === undefined) return sum + cost.budget_cost // Unchanged
      return sum + newValue // Modified
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
    // Count only actual modifications (not exclusions)
    const modifiedCount = Object.entries(forecastChanges).filter(([_, value]) => value !== null).length
    return modifiedCount + localStagedEntries.length
  }

  const getExcludedCount = () => {
    return Object.values(forecastChanges).filter(value => value === null).length
  }

  // Navigation handlers are now provided by useWizardNavigation hook
  // goNext() and goBack() replace handleNext() and handleBack()

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(forecastChanges, localStagedEntries, forecastReason)
      
      // Clear draft after successful save
      localStorage.removeItem(`forecast-draft-${projectId}`)
      
      // Reset state (note: currentStep managed by hook, will reset on next open)
      setForecastChanges({})
      setLocalStagedEntries([])
      setForecastReason("")
      
      onClose()
    } catch (error) {
      console.error("Error saving forecast:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddNewEntry = (entry: CostBreakdown) => {
    setLocalStagedEntries([...localStagedEntries, entry])
  }

  const handleDeleteStagedEntry = (id: string) => {
    setLocalStagedEntries(localStagedEntries.filter(e => e.id !== id))
  }

  const handleResetChange = (id: string) => {
    const { [id]: _, ...rest } = forecastChanges
    setForecastChanges(rest)
  }

  const handleValueChange = (id: string, newValue: number) => {
    setForecastChanges({
      ...forecastChanges,
      [id]: newValue,
    })
  }

  const handleExcludeEntry = (id: string) => {
    setForecastChanges({
      ...forecastChanges,
      [id]: null, // null = excluded from forecast
    })
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
              <NewEntryForm
                projectId={projectId}
                onSubmit={handleAddNewEntry}
                options={{
                  costLines: COST_LINE_OPTIONS,
                  spendTypes: SPEND_TYPE_OPTIONS,
                  subCategories: [], // Subcategory is free text input
                  subBusinessLines: SUB_BUSINESS_LINE_OPTIONS,
                }}
              />
            </div>

            <ForecastEditableTable
              entries={[...currentCosts, ...localStagedEntries]}
              forecastChanges={forecastChanges}
              onValueChange={handleValueChange}
              onResetChange={handleResetChange}
              onDeleteEntry={handleDeleteStagedEntry}
              onExcludeEntry={handleExcludeEntry}
            />

            <ChangeSummaryFooter
              modifiedCount={Object.entries(forecastChanges).filter(([_, v]) => v !== null).length}
              newEntriesCount={localStagedEntries.length}
              excludedCount={getExcludedCount()}
              totalChange={getTotalChange()}
              changePercentage={getChangePercentage()}
            />
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
                        
                        // Handle excluded entries (newValue === null)
                        if (newValue === null) {
                          return (
                            <div
                              key={costId}
                              className="flex justify-between items-center text-sm py-1 opacity-60"
                            >
                              <span className="text-muted-foreground">
                                {cost.cost_line} - {cost.spend_sub_category}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground line-through">
                                  {formatCurrency(cost.budget_cost)}
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                  Excluded
                                </Badge>
                              </div>
                            </div>
                          )
                        }
                        
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
    <WizardShell
      isOpen={isOpen}
      onClose={onClose}
      title={`Create New Forecast - ${projectName}`}
      description="Follow the steps to create a new forecast version with tracked changes"
      currentStep={currentStepIndex}
      totalSteps={stepLabels.length}
      progress={progress}
      canGoBack={canGoBack}
      canGoForward={canGoForward}
      onBack={goBack}
      onNext={goNext}
      nextLabel="Next"
      backLabel="Back"
      nextDisabled={!canProceed()}
      isSaving={isSaving}
      isConfirmStep={currentStep === "confirm"}
      onConfirm={handleSave}
      confirmLabel="Save Forecast"
      stepLabels={stepLabels}
    >
      {renderStepContent()}
    </WizardShell>
  )
}