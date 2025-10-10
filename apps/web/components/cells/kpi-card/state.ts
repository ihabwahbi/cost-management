/**
 * KPICard State Management
 * 
 * Minimal local UI state using Zustand
 * For this simple component, we don't need complex state management
 * All data state is managed by tRPC React Query
 */

import { create } from 'zustand';

interface KPICardState {
  // Future: Add UI state if needed (e.g., expanded/collapsed, tooltips)
  // For now, this Cell has no local UI state
}

export const useKPICardStore = create<KPICardState>((set) => ({}));
