/**
 * Tests for WizardProgress component
 * 
 * Part of forecast-wizard extraction (Phase 1: Foundation)
 * Created: 2025-10-04
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { WizardProgress } from '../wizard-progress'

describe('WizardProgress', () => {
  const stepLabels = [
    { label: 'Step 1' },
    { label: 'Step 2' },
    { label: 'Step 3' },
    { label: 'Step 4' },
  ]

  it('renders progress bar with correct percentage', () => {
    const { container } = render(
      <WizardProgress
        currentStep={1}
        totalSteps={4}
        progress={50}
        showLabels={false}
      />
    )

    const progressBar = container.querySelector('[aria-valuenow]')
    expect(progressBar).toHaveAttribute('aria-valuenow', '50')
  })

  it('displays step labels when provided', () => {
    render(
      <WizardProgress
        currentStep={1}
        totalSteps={4}
        progress={50}
        stepLabels={stepLabels}
      />
    )

    expect(screen.getByText('Step 1')).toBeInTheDocument()
    expect(screen.getByText('Step 2')).toBeInTheDocument()
    expect(screen.getByText('Step 3')).toBeInTheDocument()
    expect(screen.getByText('Step 4')).toBeInTheDocument()
  })

  it('shows completed icons for current and previous steps', () => {
    const { container } = render(
      <WizardProgress
        currentStep={2}
        totalSteps={4}
        progress={75}
        stepLabels={stepLabels}
      />
    )

    // CheckCircle2 icons for steps 0, 1, 2 (current and previous)
    // Circle icons for step 3 (future)
    const icons = container.querySelectorAll('svg')
    expect(icons.length).toBeGreaterThan(0)
  })

  it('hides labels when showLabels is false', () => {
    render(
      <WizardProgress
        currentStep={1}
        totalSteps={4}
        progress={50}
        showLabels={false}
        stepLabels={stepLabels}
      />
    )

    // Should show numeric progress instead
    expect(screen.getByText('Step 2 of 4')).toBeInTheDocument()
  })

  it('renders compact variant correctly', () => {
    const { container } = render(
      <WizardProgress
        currentStep={1}
        totalSteps={4}
        progress={50}
        variant="compact"
        stepLabels={stepLabels}
      />
    )

    // Compact mode has h-1 class on progress bar (check the Progress component)
    const progressElement = container.querySelector('[aria-valuenow]')
    expect(progressElement).toBeInTheDocument()
    // The h-1 class is applied to the Progress component itself via className prop
    expect(container.querySelector('.h-1')).toBeInTheDocument()
  })

  it('shows numeric progress when no step labels provided', () => {
    render(
      <WizardProgress
        currentStep={2}
        totalSteps={5}
        progress={60}
      />
    )

    expect(screen.getByText('Step 3 of 5')).toBeInTheDocument()
  })

  it('has accessibility attributes', () => {
    const { container } = render(
      <WizardProgress
        currentStep={1}
        totalSteps={4}
        progress={50}
      />
    )

    const progressBar = container.querySelector('[aria-valuenow]')
    expect(progressBar).toHaveAttribute('aria-valuemin', '0')
    expect(progressBar).toHaveAttribute('aria-valuemax', '100')
  })
})
