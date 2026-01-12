/**
 * Bot Store (Zustand)
 * Global state management for bot status and UI state
 */

import { create } from 'zustand';

type BotStatus = 'running' | 'stopped' | 'error' | 'connecting';

interface BotStore {
  // Bot State
  status: BotStatus;
  isConnected: boolean;
  lastUpdated: Date | null;
  error: string | null;

  // UI State
  currentPath: string;
  sidebarOpen: boolean;

  // Actions
  setStatus: (status: BotStatus) => void;
  setConnected: (connected: boolean) => void;
  setError: (error: string | null) => void;
  setLastUpdated: (date: Date) => void;
  setCurrentPath: (path: string) => void;
  toggleSidebar: () => void;
  reset: () => void;
}

const initialState = {
  status: 'connecting' as BotStatus,
  isConnected: false,
  lastUpdated: null,
  error: null,
  currentPath: '/',
  sidebarOpen: true,
};

export const useBotStore = create<BotStore>((set) => ({
  ...initialState,

  setStatus: (status) => set({ status }),

  setConnected: (isConnected) => set({ isConnected }),

  setError: (error) => set({ error, status: error ? 'error' : 'stopped' }),

  setLastUpdated: (lastUpdated) => set({ lastUpdated }),

  setCurrentPath: (currentPath) => set({ currentPath }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  reset: () => set(initialState),
}));

export default useBotStore;
