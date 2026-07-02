import { Suspense } from 'react';
import { AppFrame } from '../components/AppFrame';
import { WorkspaceProvider } from '../lib/WorkspaceContext';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <WorkspaceProvider>
        <AppFrame>{children}</AppFrame>
      </WorkspaceProvider>
    </Suspense>
  );
}
