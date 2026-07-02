'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';

const SIDEBAR_STORAGE_KEY = 'clarityboard:sidebar-open';

export function AppFrame({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (stored !== null) setSidebarOpen(stored === 'true');
  }, []);

  const toggleSidebar = (open: boolean) => {
    setSidebarOpen(open);
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(open));
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar isOpen={sidebarOpen} onClose={() => toggleSidebar(false)} />
      <main className="flex-1 overflow-y-auto relative">
        {!sidebarOpen && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Expand sidebar"
            onClick={() => toggleSidebar(true)}
            className="fixed top-[14px] left-[14px] z-10 bg-bone border border-chalk"
          >
            <Icon name="panel-left" size={15} />
          </Button>
        )}
        {children}
      </main>
    </div>
  );
}
