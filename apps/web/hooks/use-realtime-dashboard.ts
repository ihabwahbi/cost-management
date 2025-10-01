import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface UseRealtimeDashboardOptions {
  onUpdate: () => void
  tables?: string[]
}

/**
 * Custom hook for real-time dashboard updates with proper cleanup and debouncing
 * Batches updates to prevent render cascades and memory leaks
 */
export function useRealtimeDashboard({ 
  onUpdate,
  tables = ['po_line_items', 'po_mappings', 'projects', 'cost_breakdown']
}: UseRealtimeDashboardOptions) {
  const supabase = createClient()
  const channelRef = useRef<RealtimeChannel | null>(null)
  const updateQueueRef = useRef(new Set<string>())
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    let mounted = true

    // Batch updates to prevent cascade renders
    const processUpdates = () => {
      if (mounted && updateQueueRef.current.size > 0) {
        console.log(`Processing ${updateQueueRef.current.size} real-time updates`)
        onUpdate()
        updateQueueRef.current.clear()
      }
    }

    // Debounced update processor
    const scheduleUpdate = (id: string) => {
      updateQueueRef.current.add(id)
      
      // Clear existing timer
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current)
      }
      
      // Schedule new update batch in 500ms
      updateTimerRef.current = setTimeout(() => {
        processUpdates()
      }, 500)
    }

    // Create real-time channel
    const channel = supabase
      .channel('dashboard-updates')
      .on('presence', { event: 'sync' }, () => {
        console.log('Dashboard presence synced')
      })

    // Subscribe to each table
    tables.forEach(table => {
      channel.on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table 
        },
        (payload) => {
          if (!mounted) return
          
          console.log(`Real-time update from ${table}:`, payload.eventType)
          const newRecord = payload.new as Record<string, any> | undefined
          const oldRecord = payload.old as Record<string, any> | undefined
          const recordId = newRecord?.id || oldRecord?.id || 'unknown'
          scheduleUpdate(`${table}-${recordId}`)
        }
      )
    })

    // Subscribe to channel
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Real-time dashboard connected')
      } else if (status === 'CHANNEL_ERROR') {
        console.error('Real-time dashboard connection error')
      } else if (status === 'TIMED_OUT') {
        console.warn('Real-time dashboard connection timed out')
      }
    })

    channelRef.current = channel

    // Cleanup function
    return () => {
      mounted = false
      
      // Clear any pending updates
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current)
        updateTimerRef.current = null
      }
      
      // Clean up channel subscription
      if (channelRef.current) {
        console.log('Cleaning up real-time dashboard connection')
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      
      // Clear update queue
      updateQueueRef.current.clear()
    }
  }, [onUpdate, tables, supabase])
}

/**
 * Utility function to debounce any function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }
    
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(later, wait)
  }
}