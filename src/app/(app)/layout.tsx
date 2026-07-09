import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { AppFrame } from '../components/AppFrame';
import { WorkspaceProvider } from '../lib/WorkspaceContext';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sidebarOpenCookie = (await cookies()).get('sidebar-open')?.value;
  const initialSidebarOpen = sidebarOpenCookie !== 'false';

  return (
    <Suspense>
      <WorkspaceProvider>
        <AppFrame initialSidebarOpen={initialSidebarOpen}>{children}</AppFrame>
      </WorkspaceProvider>
    </Suspense>
  );
}
