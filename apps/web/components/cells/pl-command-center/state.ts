/**
 * PLCommandCenter - State Management
 * 
 * Zustand store for local UI state (live indicator animation)
 */
import { create } from 'zustand';

interface PLCommandCenterState {
  isLive: boolean;
  toggleLive: () => void;
}

export const usePLCommandCenterStore = create<PLCommandCenterState>((set) => ({
  isLive: true,
  toggleLive: () => set((state) => ({ isLive: !state.isLive })),
}));
