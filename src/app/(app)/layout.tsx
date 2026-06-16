import { Suspense } from 'react';
import { AppSidebar } from '../components/AppSidebar';
import { WorkspaceProvider } from '../lib/WorkspaceContext';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceProvider>
      <div className="flex h-screen overflow-hidden">
        <Suspense
          fallback={
            <div
              className="w-[260px] shrink-0 border-r border-chalk"
              style={{ background: 'var(--bone)' }}
            />
          }
        >
          <AppSidebar />
        </Suspense>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </WorkspaceProvider>
  );
}
