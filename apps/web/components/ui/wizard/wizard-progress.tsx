/**
 * WizardProgress Component
 * 
 * Visual progress indicator for wizards with step labels
 * Extracted from forecast-wizard progress bar section
 * 
 * Part of forecast-wizard extraction (Phase 1: Foundation)
 * Created: 2025-10-04
 * Reusability: ⭐⭐⭐⭐⭐ (Highly reusable)
 */

import { Progress } from '@/components/ui/progress'
import { CheckCircle2, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface WizardProgressProps {
  currentStep: number
  totalSteps: number
  progress: number
  showLabels?: boolean
  variant?: 'default' | 'compact'
  stepLabels?: Array<{
    label: string
    icon?: React.ReactNode
  }>
}

export function WizardProgress({
  currentStep,
  totalSteps,
  progress,
  showLabels = true,
  variant = 'default',
  stepLabels,
}: WizardProgressProps) {
  const isCompact = variant === 'compact'

  return (
    <div className="space-y-2">
      {/* Progress bar */}
      <Progress 
        value={progress} 
        className={cn('h-2', isCompact && 'h-1')} 
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      />

      {/* Step labels */}
      {showLabels && stepLabels && (
        <div className="flex justify-between">
          {stepLabels.map((step, index) => (
            <div
              key={index}
              className={cn(
                'flex items-center gap-1 text-xs',
                index <= currentStep
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground'
              )}
            >
              {index <= currentStep ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <Circle className="w-3 h-3" />
              )}
              {!isCompact && (
                <span className="hidden sm:inline">{step.label}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Simple numeric progress (compact mode or no labels) */}
      {(!showLabels || !stepLabels) && (
        <div className="text-xs text-center text-muted-foreground">
          Step {currentStep + 1} of {totalSteps}
        </div>
      )}
    </div>
  )
}
