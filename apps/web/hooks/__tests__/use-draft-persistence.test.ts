import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useDraftPersistence } from '../use-draft-persistence'

describe('useDraftPersistence', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })
  
  afterEach(() => {
    vi.useRealTimers()
  })
  
  // ✅ CRITICAL: Test BA-009 - Debouncing (Pitfall #1 fix)
  it('debounces localStorage writes (BA-009)', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
    
    const { rerender } = renderHook(
      ({ data }) => useDraftPersistence({ storageKey: 'test', data }),
      { initialProps: { data: { value: 1 } } }
    )
    
    // Rapid changes (simulate user typing)
    rerender({ data: { value: 2 } })
    rerender({ data: { value: 3 } })
    rerender({ data: { value: 4 } })
    rerender({ data: { value: 5 } })
    
    // Should not have saved yet (debounced)
    expect(setItemSpy).not.toHaveBeenCalled()
    
    // Fast-forward past debounce delay
    vi.runAllTimers()
    
    // Should have saved only ONCE (debounced)
    expect(setItemSpy).toHaveBeenCalledTimes(1)
    expect(setItemSpy).toHaveBeenCalledWith(
      'test',
      expect.stringContaining('"value":5')
    )
  })
  
  it('saves draft after debounce delay', () => {
    renderHook(() =>
      useDraftPersistence({
        storageKey: 'test',
        data: { value: 42 }
      })
    )
    
    // Should not be saved immediately
    expect(localStorage.getItem('test')).toBeNull()
    
    // Fast-forward past debounce delay
    vi.runAllTimers()
    
    const saved = localStorage.getItem('test')
    expect(saved).toBeTruthy()
    const parsed = JSON.parse(saved!)
    expect(parsed.data.value).toBe(42)
  })
  
  // BA-010: Draft age expiration
  it('restores draft on mount if not expired (BA-010)', () => {
    const onRestore = vi.fn()
    const draftData = { value: 42 }
    
    localStorage.setItem('test', JSON.stringify({
      data: draftData,
      timestamp: Date.now()
    }))
    
    renderHook(() =>
      useDraftPersistence({
        storageKey: 'test',
        data: {},
        onRestore
      })
    )
    
    expect(onRestore).toHaveBeenCalledWith(draftData)
  })
  
  it('clears expired draft (BA-010)', () => {
    const onRestore = vi.fn()
    const oldTimestamp = Date.now() - (25 * 60 * 60 * 1000) // 25 hours ago
    
    localStorage.setItem('test', JSON.stringify({
      data: { value: 42 },
      timestamp: oldTimestamp
    }))
    
    renderHook(() =>
      useDraftPersistence({
        storageKey: 'test',
        data: {},
        onRestore,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      })
    )
    
    expect(onRestore).not.toHaveBeenCalled()
    expect(localStorage.getItem('test')).toBeNull()
  })
  
  // BA-011: Draft cleanup on save
  it('clearDraft removes from localStorage (BA-011)', () => {
    const { result } = renderHook(() =>
      useDraftPersistence({ storageKey: 'test', data: { value: 42 } })
    )
    
    // Wait for debounced save
    vi.runAllTimers()
    expect(localStorage.getItem('test')).toBeTruthy()
    
    // Clear draft
    result.current.clearDraft()
    
    expect(localStorage.getItem('test')).toBeNull()
  })
  
  it('clearDraft cancels pending save', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
    
    const { result } = renderHook(() =>
      useDraftPersistence({ storageKey: 'test', data: { value: 42 } })
    )
    
    // Clear before debounce completes
    result.current.clearDraft()
    
    // Fast-forward
    vi.advanceTimersByTime(1000)
    
    // Should NOT have saved (cleared before timeout)
    expect(setItemSpy).not.toHaveBeenCalled()
  })
  
  it('cancels pending save on unmount', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
    
    const { unmount } = renderHook(() =>
      useDraftPersistence({ storageKey: 'test', data: { value: 42 } })
    )
    
    // Unmount before debounce completes
    unmount()
    
    // Fast-forward
    vi.advanceTimersByTime(1000)
    
    // Should NOT have saved (unmounted before timeout)
    expect(setItemSpy).not.toHaveBeenCalled()
  })
  
  it('uses custom debounce delay', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
    
    renderHook(() =>
      useDraftPersistence({
        storageKey: 'test',
        data: { value: 42 },
        debounceMs: 500 // Custom delay
      })
    )
    
    // After 400ms - should not be saved
    vi.advanceTimersByTime(400)
    expect(setItemSpy).not.toHaveBeenCalled()
    
    // After 500ms - should be saved
    vi.advanceTimersByTime(100)
    expect(setItemSpy).toHaveBeenCalledTimes(1)
  })
  
  it('handles invalid JSON in localStorage gracefully', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const onRestore = vi.fn()
    
    localStorage.setItem('test', 'invalid json')
    
    // Should not crash
    renderHook(() =>
      useDraftPersistence({
        storageKey: 'test',
        data: {},
        onRestore
      })
    )
    
    expect(onRestore).not.toHaveBeenCalled()
    expect(consoleErrorSpy).toHaveBeenCalled()
    
    consoleErrorSpy.mockRestore()
  })
})
