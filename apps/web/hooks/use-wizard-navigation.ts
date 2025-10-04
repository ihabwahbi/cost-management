/**
 * useWizardNavigation Hook
 * 
 * Generic, type-safe wizard navigation logic extracted from forecast-wizard
 * Handles step progression, progress calculation, and navigation guards
 * 
 * Part of forecast-wizard extraction (Phase 1: Foundation)
 * Created: 2025-10-04
 * Reusability: ⭐⭐⭐⭐⭐ (Highly reusable)
 */

import { useState, useCallback, useMemo } from 'react'

export interface WizardNavigationOptions<T extends string> {
  steps: readonly T[]
  initialStep?: T
  onStepChange?: (step: T) => void
}

export interface WizardNavigationReturn<T extends string> {
  currentStep: T
  setCurrentStep: (step: T) => void
  currentStepIndex: number
  progress: number  // 0-100
  canGoBack: boolean
  canGoForward: boolean
  goNext: () => void
  goBack: () => void
  goToStep: (step: T) => void
}

export function useWizardNavigation<T extends string>({
  steps,
  initialStep,
  onStepChange,
}: WizardNavigationOptions<T>): WizardNavigationReturn<T> {
  const [currentStep, setCurrentStepState] = useState<T>(
    initialStep ?? steps[0]
  )

  const currentStepIndex = useMemo(
    () => steps.findIndex((s) => s === currentStep),
    [steps, currentStep]
  )

  const progress = useMemo(
    () => ((currentStepIndex + 1) / steps.length) * 100,
    [currentStepIndex, steps.length]
  )

  const canGoBack = currentStepIndex > 0
  const canGoForward = currentStepIndex < steps.length - 1

  const setCurrentStep = useCallback(
    (step: T) => {
      setCurrentStepState(step)
      onStepChange?.(step)
    },
    [onStepChange]
  )

  const goNext = useCallback(() => {
    if (canGoForward) {
      const nextStep = steps[currentStepIndex + 1]
      setCurrentStep(nextStep)
    }
  }, [canGoForward, steps, currentStepIndex, setCurrentStep])

  const goBack = useCallback(() => {
    if (canGoBack) {
      const prevStep = steps[currentStepIndex - 1]
      setCurrentStep(prevStep)
    }
  }, [canGoBack, steps, currentStepIndex, setCurrentStep])

  const goToStep = useCallback(
    (step: T) => {
      if (steps.includes(step)) {
        setCurrentStep(step)
      }
    },
    [steps, setCurrentStep]
  )

  return {
    currentStep,
    setCurrentStep,
    currentStepIndex,
    progress,
    canGoBack,
    canGoForward,
    goNext,
    goBack,
    goToStep,
  }
}
