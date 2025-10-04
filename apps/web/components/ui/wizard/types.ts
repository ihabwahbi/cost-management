/**
 * Shared TypeScript types for wizard components
 * 
 * Part of forecast-wizard extraction (Phase 1: Foundation)
 * Created: 2025-10-04
 */

export type WizardStep = string

export interface StepConfig<T extends string = string> {
  id: T
  title: string
  description?: string
  optional?: boolean
}

export interface WizardValidation {
  isValid: boolean
  errors?: string[]
}

export interface WizardNavigationState<T extends string = string> {
  currentStep: T
  currentStepIndex: number
  progress: number
  canGoBack: boolean
  canGoForward: boolean
}
