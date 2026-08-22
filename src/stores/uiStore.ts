import { create } from 'zustand';
import type { TabKey } from '../types';

interface UIState {
  activeTab: TabKey;
  visitedTabs: Set<TabKey>;
  isSidebarOpen: boolean;
  isMobileDrawerOpen: boolean;
  timeRange: string;
  isTimeMenuOpen: boolean;
  previewTab: string;
  isHoveringMockup: boolean;
  pauseAutoCycleUntil: number;
  setActiveTab: (tab: TabKey) => void;
  setSidebarOpen: (open: boolean) => void;
  setMobileDrawerOpen: (open: boolean) => void;
  setTimeRange: (range: string) => void;
  setTimeMenuOpen: (open: boolean) => void;
  setPreviewTab: (tab: string) => void;
  setHoveringMockup: (hovering: boolean) => void;
  setPauseAutoCycleUntil: (time: number) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: 'today',
  visitedTabs: new Set(['today']),
  isSidebarOpen: true,
  isMobileDrawerOpen: false,
  timeRange: '7d',
  isTimeMenuOpen: false,
  previewTab: 'Money',
  isHoveringMockup: false,
  pauseAutoCycleUntil: 0,

  setActiveTab: (tab) => set((state) => ({
    activeTab: tab,
    visitedTabs: new Set([...state.visitedTabs, tab]),
  })),

  setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),

  setMobileDrawerOpen: (isMobileDrawerOpen) => set({ isMobileDrawerOpen }),

  setTimeRange: (timeRange) => set({ timeRange }),

  setTimeMenuOpen: (isTimeMenuOpen) => set({ isTimeMenuOpen }),

  setPreviewTab: (previewTab) => set({ previewTab }),

  setHoveringMockup: (isHoveringMockup) => set({ isHoveringMockup }),

  setPauseAutoCycleUntil: (pauseAutoCycleUntil) => set({ pauseAutoCycleUntil }),
}));