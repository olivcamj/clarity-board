import { Suspense } from 'react';
import { AppSidebar } from '../components/AppSidebar';
import { WorkspaceProvider } from '../lib/WorkspaceContext';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <WorkspaceProvider>
        <div className="flex h-screen overflow-hidden">
          <AppSidebar />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </WorkspaceProvider>
    </Suspense>
  );
}
