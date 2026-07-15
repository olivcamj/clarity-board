import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { AppFrame } from '../components/AppFrame';
import { WorkspaceProvider } from '../lib/WorkspaceContext';
import { SocketProvider } from '../lib/SocketContext';
import { ToastProvider } from '../lib/ToastContext';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sidebarOpenCookie = (await cookies()).get('sidebar-open')?.value;
  const initialSidebarOpen = sidebarOpenCookie !== 'false';

  return (
    <Suspense>
      <WorkspaceProvider>
        <SocketProvider>
          <ToastProvider>
            <AppFrame initialSidebarOpen={initialSidebarOpen}>{children}</AppFrame>
          </ToastProvider>
        </SocketProvider>
      </WorkspaceProvider>
    </Suspense>
  );
}
