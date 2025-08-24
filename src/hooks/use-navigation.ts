'use client'

import { useEffect } from 'react';
import { useNavigationStore, NavigationItem } from '@/stores/navigation';

/**
 * Navigation hook that provides clean interface to navigation store
 * Components should NEVER access the store directly - only through this hook
 */
export function useAppNavigation() {
  const {
    items,
    currentItem,
    isLoading,
    error,
    isInitialized,
    setCurrentItem,
    setError,
    initializeNavigation
  } = useNavigationStore();

  // Only initialize if not already initialized and we're in the browser
  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitialized && !isLoading && !error) {
      initializeNavigation();
    }
  }, [isInitialized, isLoading, error, initializeNavigation]);

  // Public interface - components only use these methods
  const navigateTo = (item: NavigationItem) => {
    setCurrentItem(item);
  };

  const navigateToPath = (path: string) => {
    const item = items.find(navItem => navItem.path === path);
    if (item) {
      setCurrentItem(item);
    }
  };

  const navigateToId = (id: string) => {
    const item = items.find(navItem => navItem.id === id);
    if (item) {
      setCurrentItem(item);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const refresh = async () => {
    await initializeNavigation();
  };

  // Return clean interface
  return {
    // State (read-only)
    items,
    currentItem,
    isLoading,
    error,
    isInitialized,
    
    // Actions
    navigateTo,
    navigateToPath,
    navigateToId,
    clearError,
    refresh,
    
    // Computed properties
    hasItems: items.length > 0,
    isReady: isInitialized && !isLoading && !error,
    currentPath: currentItem?.path || '/',
    currentTitle: currentItem?.title || 'Home'
  };
}

/**
 * Hook for getting navigation item by ID
 * Useful for components that need specific navigation context
 */
export function useNavigationItem(id: string) {
  const { items, currentItem } = useAppNavigation();
  
  const item = items.find(navItem => navItem.id === id);
  const isActive = currentItem?.id === id;
  
  return {
    item,
    isActive,
    exists: !!item
  };
}

/**
 * Hook for getting current navigation context
 * Useful for components that need to know their navigation state
 */
export function useCurrentNavigation() {
  const { currentItem, currentPath, currentTitle, isReady } = useAppNavigation();
  
  return {
    currentItem,
    currentPath,
    currentTitle,
    isReady,
    isHome: currentPath === '/' || !currentItem
  };
}