"use client"

import { useState, useEffect } from "react"
import { useWizardNavigation } from "@/hooks/use-wizard-navigation"
import { WizardShell } from "@/components/ui/wizard/wizard-shell"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Edit3,
  Eye,
  Save,
  FileText,
  Calculator,
} from "lucide-react"
import { NewEntryForm } from "./forecast-wizard/components/new-entry-form"
import { ForecastEditableTable } from "./forecast-wizard/components/forecast-editable-table"
import { ChangeSummaryFooter } from "./forecast-wizard/components/change-summary-footer"
import { BudgetReviewStep } from "./forecast-wizard/steps/budget-review-step"
import { ReasonStep } from "./forecast-wizard/steps/reason-step"
import { PreviewStep } from "./forecast-wizard/steps/preview-step"
import { ConfirmStep } from "./forecast-wizard/steps/confirm-step"

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
          <BudgetReviewStep
            costs={currentCosts}
            projectName={projectName}
          />
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
          <ReasonStep
            reason={forecastReason}
            onReasonChange={setForecastReason}
            changeSummary={{
              modifiedCount: Object.entries(forecastChanges).filter(([_, v]) => v !== null).length,
              newEntriesCount: localStagedEntries.length,
              excludedCount: getExcludedCount(),
              totalChange: getTotalChange(),
              changePercentage: getChangePercentage(),
            }}
          />
        )

      case "preview":
        return (
          <PreviewStep
            currentCosts={currentCosts}
            forecastChanges={forecastChanges}
            newEntries={localStagedEntries}
            reason={forecastReason}
            totals={{
              currentTotal: getTotalBudget(),
              forecastTotal: getTotalForecast(),
              totalChange: getTotalChange(),
              changePercentage: getChangePercentage(),
            }}
          />
        )

      case "confirm":
        return (
          <ConfirmStep
            isSaving={isSaving}
            totalChanges={getModifiedItemsCount()}
            totalForecast={getTotalForecast()}
            totalChange={getTotalChange()}
            changePercentage={getChangePercentage()}
            reason={forecastReason}
          />
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