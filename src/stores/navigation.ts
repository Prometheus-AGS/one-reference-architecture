'use client'

import { create } from 'zustand';

export interface NavigationItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  path: string;
  component?: string;
  isActive?: boolean;
}

interface NavigationState {
  items: NavigationItem[];
  currentItem: NavigationItem | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

interface NavigationActions {
  setCurrentItem: (item: NavigationItem) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  initializeNavigation: () => Promise<void>;
}

type NavigationStore = NavigationState & NavigationActions;

// Define navigation items for the architecture demo
const navigationItems: NavigationItem[] = [
  {
    id: 'home',
    title: 'Home',
    description: 'Architecture overview',
    icon: 'Home',
    path: '/dashboard',
    component: 'HomePage'
  },
  {
    id: 'database',
    title: 'Database Integration',
    description: 'PGLite embedded database with real-time',
    icon: 'Database',
    path: '/dashboard/database',
    component: 'DatabaseClient'
  },
  {
    id: 'data-access',
    title: 'Data Access',
    description: 'File system, environment, system information',
    icon: 'HardDrive',
    path: '/dashboard/data',
    component: 'DataAccessDemo'
  },
  {
    id: 'proxy-system',
    title: 'Transparent Proxy',
    description: 'Automatic request forwarding',
    icon: 'Network',
    path: '/dashboard/proxy',
    component: 'ProxyDemo'
  },
  {
    id: 'performance',
    title: 'Performance Metrics',
    description: 'Memory usage, startup times, and benchmarks',
    icon: 'Activity',
    path: '/dashboard/performance',
    component: 'PerformanceDemo'
  }
];

// Initialize with default items immediately to prevent hydration mismatch
const initialItems = navigationItems.map((item, index) => ({
  ...item,
  isActive: index === 0
}));

export const useNavigationStore = create<NavigationStore>((set, get) => ({
  // State - Initialize with data to match server/client
  items: initialItems,
  currentItem: initialItems[0],
  isLoading: false,
  error: null,
  isInitialized: true,

  // Actions
  setCurrentItem: (item: NavigationItem) => {
    set((state) => ({
      items: state.items.map(navItem => ({
        ...navItem,
        isActive: navItem.id === item.id
      })),
      currentItem: item,
      error: null
    }));
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setError: (error: string | null) => {
    set({ error, isLoading: false });
  },

  initializeNavigation: async () => {
    const state = get();
    
    // Prevent multiple initializations
    if (state.isInitialized) {
      return;
    }
    
    try {
      set({ isLoading: true });
      
      // Simulate async initialization (could be API calls, etc.)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Set navigation items with first item as default
      const itemsWithActive = navigationItems.map((item, index) => ({
        ...item,
        isActive: index === 0
      }));
      
      set({
        items: itemsWithActive,
        currentItem: itemsWithActive[0],
        isLoading: false,
        error: null,
        isInitialized: true
      });
      
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to initialize navigation',
        isLoading: false
      });
    }
  }
}));