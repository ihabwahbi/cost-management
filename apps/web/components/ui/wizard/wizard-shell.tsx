/**
 * WizardShell Component
 * 
 * Generic wizard dialog wrapper with integrated navigation and progress
 * Extracted from forecast-wizard dialog structure
 * 
 * Part of forecast-wizard extraction (Phase 1: Foundation)
 * Created: 2025-10-04
 * Reusability: ⭐⭐⭐⭐⭐ (Highly reusable)
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { WizardProgress } from './wizard-progress'

export interface WizardShellProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  currentStep: number
  totalSteps: number
  progress: number
  canGoBack: boolean
  canGoForward: boolean
  onBack: () => void
  onNext: () => void
  nextLabel?: string
  backLabel?: string
  nextDisabled?: boolean
  isSaving?: boolean
  isConfirmStep?: boolean
  onConfirm?: () => void
  confirmLabel?: string
  children: React.ReactNode
  stepLabels?: Array<{
    label: string
    icon?: React.ReactNode
  }>
}

export function WizardShell({
  isOpen,
  onClose,
  title,
  description,
  currentStep,
  totalSteps,
  progress,
  canGoBack,
  canGoForward,
  onBack,
  onNext,
  nextLabel = 'Next',
  backLabel = 'Back',
  nextDisabled = false,
  isSaving = false,
  isConfirmStep = false,
  onConfirm,
  confirmLabel = 'Confirm',
  children,
  stepLabels,
}: WizardShellProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[95vw] h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>

        {/* Main content area with progress */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Progress indicator */}
          <div className="flex-shrink-0 pb-4">
            <WizardProgress
              currentStep={currentStep}
              totalSteps={totalSteps}
              progress={progress}
              stepLabels={stepLabels}
            />
          </div>

          {/* Step content (scrollable) */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {children}
          </div>
        </div>

        {/* Footer with navigation */}
        <DialogFooter className="flex justify-between flex-shrink-0 mt-4">
          {/* Left side - Back button */}
          <div className="flex gap-2">
            {canGoBack && (
              <Button
                variant="outline"
                onClick={onBack}
                disabled={isSaving}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {backLabel}
              </Button>
            )}
          </div>

          {/* Right side - Cancel and Next/Confirm */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            
            {isConfirmStep && onConfirm ? (
              <Button
                onClick={onConfirm}
                disabled={isSaving || nextDisabled}
              >
                {isSaving ? 'Saving...' : confirmLabel}
              </Button>
            ) : (
              <Button
                onClick={onNext}
                disabled={nextDisabled || !canGoForward}
              >
                {nextLabel}
                {canGoForward && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
