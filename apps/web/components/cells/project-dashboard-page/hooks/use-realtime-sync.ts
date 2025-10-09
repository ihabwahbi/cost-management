/**
 * Realtime Sync Hook
 * 
 * Manages Supabase realtime subscription for cost_breakdown table
 * and automatically invalidates React Query queries on database changes
 * 
 * FIXED: Phase B corrected subscription from po_mappings (which has no project_id column)
 * to cost_breakdown (which has project_id column)
 */

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { RealtimePayload } from '../types'

export interface UseRealtimeSyncOptions {
  /** Enable/disable realtime subscription */
  enabled?: boolean
  
  /** Callback when realtime event received */
  onEvent?: (payload: RealtimePayload) => void
}

/**
 * Set up realtime subscription for project dashboard
 * 
 * Subscribes to cost_breakdown table changes and automatically invalidates
 * all dashboard queries to refresh data
 * 
 * @param projectId - Project UUID to filter realtime events
 * @param options - Configuration options
 * 
 * @example
 * function MyDashboard({ projectId }) {
 *   useRealtimeSync(projectId, {
 *     enabled: true,
 *     onEvent: (payload) => console.log('Database changed:', payload)
 *   })
 *   
 *   // Dashboard automatically refreshes when cost_breakdown changes
 * }
 */
export function useRealtimeSync(
  projectId: string,
  options: UseRealtimeSyncOptions = {}
) {
  const { enabled = true, onEvent } = options
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!enabled || !projectId) return

    const supabase = createClient()

    // Event handler for realtime changes
    const handleRealtimeEvent = async (payload: RealtimePayload) => {
      console.log('[Realtime] Cost breakdown changed:', payload)

      // Call custom event handler if provided
      if (onEvent) {
        onEvent(payload)
      }

      // Invalidate ALL dashboard queries to trigger refresh
      // This ensures UI stays in sync with database changes
      await queryClient.invalidateQueries({
        queryKey: ['trpc', 'dashboard']
      })

      // Also explicitly invalidate project details query
      await queryClient.invalidateQueries({
        queryKey: ['trpc', 'dashboard', 'getProjectDetails']
      })
    }

    // Subscribe to cost_breakdown table changes
    // CRITICAL: This table HAS project_id column (unlike po_mappings which doesn't)
    const channel = supabase
      .channel(`dashboard-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',                     // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'cost_breakdown',
          filter: `project_id=eq.${projectId}` // Filter by project
        },
        handleRealtimeEvent
      )
      .subscribe((status) => {
        console.log('[Realtime] Subscription status:', status)
      })

    // Cleanup subscription on unmount or projectId change
    return () => {
      console.log('[Realtime] Unsubscribing from channel:', `dashboard-${projectId}`)
      channel.unsubscribe()
    }
  }, [projectId, enabled, queryClient, onEvent])
}

/**
 * Manual trigger for query invalidation
 * 
 * Use this when you need to manually refresh dashboard data
 * (e.g., from a refresh button)
 * 
 * @param queryClient - React Query client instance
 */
export async function invalidateDashboardQueries(queryClient: ReturnType<typeof useQueryClient>) {
  await queryClient.invalidateQueries({
    queryKey: ['trpc', 'dashboard']
  })
}
