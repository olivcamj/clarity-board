import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { AppFrame } from '../components/AppFrame';
import { WorkspaceProvider } from '../lib/WorkspaceContext';
import { SocketProvider } from '../lib/SocketContext';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sidebarOpenCookie = (await cookies()).get('sidebar-open')?.value;
  const initialSidebarOpen = sidebarOpenCookie !== 'false';

  return (
    <Suspense>
      <WorkspaceProvider>
        <SocketProvider>
          <AppFrame initialSidebarOpen={initialSidebarOpen}>{children}</AppFrame>
        </SocketProvider>
      </WorkspaceProvider>
    </Suspense>
  );
}
