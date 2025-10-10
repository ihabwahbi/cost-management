/**
 * Tests for useWizardNavigation hook
 * 
 * Part of forecast-wizard extraction (Phase 1: Foundation)
 * Created: 2025-10-04
 */

import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useWizardNavigation } from '../use-wizard-navigation'

describe('useWizardNavigation', () => {
  const steps = ['step1', 'step2', 'step3', 'step4'] as const

  it('initializes with first step by default', () => {
    const { result } = renderHook(() =>
      useWizardNavigation({ steps })
    )

    expect(result.current.currentStep).toBe('step1')
    expect(result.current.currentStepIndex).toBe(0)
    expect(result.current.progress).toBe(25) // 1/4 = 25%
  })

  it('initializes with custom initial step', () => {
    const { result } = renderHook(() =>
      useWizardNavigation({ steps, initialStep: 'step2' })
    )

    expect(result.current.currentStep).toBe('step2')
    expect(result.current.currentStepIndex).toBe(1)
    expect(result.current.progress).toBe(50) // 2/4 = 50%
  })

  it('navigates forward correctly', () => {
    const { result } = renderHook(() =>
      useWizardNavigation({ steps })
    )

    act(() => {
      result.current.goNext()
    })

    expect(result.current.currentStep).toBe('step2')
    expect(result.current.currentStepIndex).toBe(1)
    expect(result.current.progress).toBe(50)
  })

  it('navigates backward correctly', () => {
    const { result } = renderHook(() =>
      useWizardNavigation({ steps, initialStep: 'step3' })
    )

    act(() => {
      result.current.goBack()
    })

    expect(result.current.currentStep).toBe('step2')
    expect(result.current.currentStepIndex).toBe(1)
  })

  it('prevents navigation beyond first step', () => {
    const { result } = renderHook(() =>
      useWizardNavigation({ steps })
    )

    expect(result.current.canGoBack).toBe(false)

    act(() => {
      result.current.goBack()
    })

    expect(result.current.currentStep).toBe('step1')
  })

  it('prevents navigation beyond last step', () => {
    const { result } = renderHook(() =>
      useWizardNavigation({ steps, initialStep: 'step4' })
    )

    expect(result.current.canGoForward).toBe(false)

    act(() => {
      result.current.goNext()
    })

    expect(result.current.currentStep).toBe('step4')
  })

  it('jumps to specific step', () => {
    const { result } = renderHook(() =>
      useWizardNavigation({ steps })
    )

    act(() => {
      result.current.goToStep('step3')
    })

    expect(result.current.currentStep).toBe('step3')
    expect(result.current.currentStepIndex).toBe(2)
  })

  it('calls onStepChange callback', () => {
    const onStepChange = vi.fn()
    const { result } = renderHook(() =>
      useWizardNavigation({ steps, onStepChange })
    )

    act(() => {
      result.current.goNext()
    })

    expect(onStepChange).toHaveBeenCalledWith('step2')
  })

  it('calculates progress correctly at each step', () => {
    const { result } = renderHook(() =>
      useWizardNavigation({ steps })
    )

    expect(result.current.progress).toBe(25) // step1: 1/4

    act(() => result.current.goNext())
    expect(result.current.progress).toBe(50) // step2: 2/4

    act(() => result.current.goNext())
    expect(result.current.progress).toBe(75) // step3: 3/4

    act(() => result.current.goNext())
    expect(result.current.progress).toBe(100) // step4: 4/4
  })

  it('updates navigation guards correctly', () => {
    const { result } = renderHook(() =>
      useWizardNavigation({ steps })
    )

    // At first step
    expect(result.current.canGoBack).toBe(false)
    expect(result.current.canGoForward).toBe(true)

    // At middle step
    act(() => result.current.goToStep('step2'))
    expect(result.current.canGoBack).toBe(true)
    expect(result.current.canGoForward).toBe(true)

    // At last step
    act(() => result.current.goToStep('step4'))
    expect(result.current.canGoBack).toBe(true)
    expect(result.current.canGoForward).toBe(false)
  })
})
