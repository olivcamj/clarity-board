'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';

const SIDEBAR_COOKIE_NAME = 'sidebar-open';
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export function AppFrame({
  children,
  initialSidebarOpen,
}: {
  children: ReactNode;
  initialSidebarOpen: boolean;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(initialSidebarOpen);

  const toggleSidebar = (open: boolean) => {
    setSidebarOpen(open);
    document.cookie = `${SIDEBAR_COOKIE_NAME}=${open}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}; samesite=lax`;
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar isOpen={sidebarOpen} onClose={() => toggleSidebar(false)} />
      {!sidebarOpen && (
        <div
          className="w-[44px] shrink-0 h-screen flex flex-col items-center pt-[18px] border-r border-chalk"
          style={{ background: 'var(--bone)' }}
        >
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Expand sidebar"
            onClick={() => toggleSidebar(true)}
          >
            <Icon name="panel-left" size={15} />
          </Button>
        </div>
      )}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
