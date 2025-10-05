"use client"

import { useState } from "react"
import { useWizardNavigation } from "@/hooks/use-wizard-navigation"
import { useForecastCalculations } from "@/hooks/use-forecast-calculations"
import { useDraftPersistence } from "@/hooks/use-draft-persistence"
import { WizardShell } from "@/components/ui/wizard/wizard-shell"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Edit3,
  Eye,
  Save,
  FileText,
  Calculator,
} from "lucide-react"
import { NewEntryForm } from "./components/new-entry-form"
import { ForecastEditableTable } from "./components/forecast-editable-table"
import { ChangeSummaryFooter } from "./components/change-summary-footer"
import { BudgetReviewStep } from "./steps/budget-review-step"
import { ReasonStep } from "./steps/reason-step"
import { PreviewStep } from "./steps/preview-step"
import { ConfirmStep } from "./steps/confirm-step"

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
  const [localStagedEntries, setLocalStagedEntries] = useState<CostBreakdown[]>(stagedEntries)
  const [forecastReason, setForecastReason] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // ✅ USE HOOK: Memoized calculations
  const {
    totalBudget,
    totalForecast,
    totalChange,
    changePercentage,
    modifiedCount,
    newEntriesCount,
    excludedCount,
  } = useForecastCalculations({
    currentCosts,
    forecastChanges,
    newEntries: localStagedEntries,
  })

  // ✅ USE HOOK: Draft persistence with debouncing (Pitfall #1 fix)
  const { clearDraft } = useDraftPersistence({
    storageKey: `forecast-draft-${projectId}`,
    data: {
      forecastChanges,
      localStagedEntries,
      forecastReason,
    },
    onRestore: (draft) => {
      setForecastChanges(draft.forecastChanges || {})
      setLocalStagedEntries(draft.localStagedEntries || [])
      setForecastReason(draft.forecastReason || "")
    },
  })

  // Step labels for wizard shell
  const stepLabels = [
    { label: "Review Budget", icon: <Eye className="w-4 h-4" /> },
    { label: "Modify Assumptions", icon: <Edit3 className="w-4 h-4" /> },
    { label: "Add Reason", icon: <FileText className="w-4 h-4" /> },
    { label: "Preview Changes", icon: <Calculator className="w-4 h-4" /> },
    { label: "Confirm & Save", icon: <Save className="w-4 h-4" /> },
  ]



  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(forecastChanges, localStagedEntries, forecastReason)
      
      // ✅ Clear draft after successful save (using hook)
      clearDraft()
      
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
        return modifiedCount + newEntriesCount > 0
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
              modifiedCount={modifiedCount}
              newEntriesCount={newEntriesCount}
              excludedCount={excludedCount}
              totalChange={totalChange}
              changePercentage={changePercentage}
            />
          </div>
        )

      case "add-reason":
        return (
          <ReasonStep
            reason={forecastReason}
            onReasonChange={setForecastReason}
            changeSummary={{
              modifiedCount,
              newEntriesCount,
              excludedCount,
              totalChange,
              changePercentage,
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
              currentTotal: totalBudget,
              forecastTotal: totalForecast,
              totalChange,
              changePercentage,
            }}
          />
        )

      case "confirm":
        return (
          <ConfirmStep
            isSaving={isSaving}
            totalChanges={modifiedCount + newEntriesCount}
            totalForecast={totalForecast}
            totalChange={totalChange}
            changePercentage={changePercentage}
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