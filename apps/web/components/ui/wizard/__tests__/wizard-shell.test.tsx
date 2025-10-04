/**
 * Tests for WizardShell component
 * 
 * Part of forecast-wizard extraction (Phase 1: Foundation)
 * Created: 2025-10-04
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { WizardShell } from '../wizard-shell'

describe('WizardShell', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    title: 'Test Wizard',
    description: 'Test wizard description',
    currentStep: 1,
    totalSteps: 4,
    progress: 50,
    canGoBack: true,
    canGoForward: true,
    onBack: vi.fn(),
    onNext: vi.fn(),
    children: <div>Wizard content</div>,
  }

  it('renders wizard dialog when open', () => {
    render(<WizardShell {...defaultProps} />)

    expect(screen.getByText('Test Wizard')).toBeInTheDocument()
    expect(screen.getByText('Test wizard description')).toBeInTheDocument()
    expect(screen.getByText('Wizard content')).toBeInTheDocument()
  })

  it('calls onBack when back button clicked', () => {
    const onBack = vi.fn()
    render(<WizardShell {...defaultProps} onBack={onBack} />)

    const backButton = screen.getByText('Back')
    fireEvent.click(backButton)

    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('calls onNext when next button clicked', () => {
    const onNext = vi.fn()
    render(<WizardShell {...defaultProps} onNext={onNext} />)

    const nextButton = screen.getByText('Next')
    fireEvent.click(nextButton)

    expect(onNext).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when cancel button clicked', () => {
    const onClose = vi.fn()
    render(<WizardShell {...defaultProps} onClose={onClose} />)

    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('hides back button when canGoBack is false', () => {
    render(<WizardShell {...defaultProps} canGoBack={false} />)

    expect(screen.queryByText('Back')).not.toBeInTheDocument()
  })

  it('disables next button when nextDisabled is true', () => {
    render(<WizardShell {...defaultProps} nextDisabled={true} />)

    const nextButton = screen.getByText('Next')
    expect(nextButton).toBeDisabled()
  })

  it('disables next button when canGoForward is false', () => {
    render(<WizardShell {...defaultProps} canGoForward={false} />)

    const nextButton = screen.getByText('Next')
    expect(nextButton).toBeDisabled()
  })

  it('shows custom next label', () => {
    render(<WizardShell {...defaultProps} nextLabel="Continue" />)

    expect(screen.getByText('Continue')).toBeInTheDocument()
  })

  it('shows custom back label', () => {
    render(<WizardShell {...defaultProps} backLabel="Previous" />)

    expect(screen.getByText('Previous')).toBeInTheDocument()
  })

  it('shows confirm button on confirm step', () => {
    const onConfirm = vi.fn()
    render(
      <WizardShell
        {...defaultProps}
        isConfirmStep={true}
        onConfirm={onConfirm}
        confirmLabel="Save Changes"
      />
    )

    const confirmButton = screen.getByText('Save Changes')
    fireEvent.click(confirmButton)

    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('Next')).not.toBeInTheDocument()
  })

  it('shows saving state', () => {
    render(
      <WizardShell
        {...defaultProps}
        isSaving={true}
        isConfirmStep={true}
        onConfirm={vi.fn()}
      />
    )

    expect(screen.getByText('Saving...')).toBeInTheDocument()
  })

  it('disables back and cancel buttons when saving', () => {
    render(
      <WizardShell
        {...defaultProps}
        isSaving={true}
      />
    )

    // Back and Cancel buttons should be explicitly disabled when isSaving=true
    const backButton = screen.getByRole('button', { name: /back/i })
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    
    expect(backButton).toBeDisabled()
    expect(cancelButton).toBeDisabled()
    
    // Next button exists (additional disabled state controlled by nextDisabled prop)
    expect(screen.getByText('Next')).toBeInTheDocument()
  })

  it('renders step labels in progress', () => {
    const stepLabels = [
      { label: 'Step 1' },
      { label: 'Step 2' },
      { label: 'Step 3' },
      { label: 'Step 4' },
    ]

    render(
      <WizardShell
        {...defaultProps}
        stepLabels={stepLabels}
      />
    )

    expect(screen.getByText('Step 1')).toBeInTheDocument()
    expect(screen.getByText('Step 2')).toBeInTheDocument()
  })
})
