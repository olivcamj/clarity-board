'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

interface SidebarContextValue {
  /** False outside a SidebarProvider (e.g. the standalone /demo pages) — there's no drawer to open, so TopBar hides its menu button. */
  hasSidebar: boolean;
  mobileSidebarOpen: boolean;
  openMobileSidebar: () => void;
  closeMobileSidebar: () => void;
  toggleMobileSidebar: () => void;
}

const noop = () => {};

const DEFAULT_VALUE: SidebarContextValue = {
  hasSidebar: false,
  mobileSidebarOpen: false,
  openMobileSidebar: noop,
  closeMobileSidebar: noop,
  toggleMobileSidebar: noop,
};

const SidebarContext = createContext<SidebarContextValue>(DEFAULT_VALUE);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const value = useMemo<SidebarContextValue>(() => ({
    hasSidebar: true,
    mobileSidebarOpen,
    openMobileSidebar: () => setMobileSidebarOpen(true),
    closeMobileSidebar: () => setMobileSidebarOpen(false),
    toggleMobileSidebar: () => setMobileSidebarOpen(open => !open),
  }), [mobileSidebarOpen]);

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
