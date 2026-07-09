import { Suspense } from 'react';
import demoData from '../lib/demo/demo-data.json';
import { DemoSidebar } from './components/DemoSidebar';

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Suspense
        fallback={
          <div
            className="w-[260px] shrink-0 border-r border-chalk"
            style={{ background: 'var(--bone)' }}
          />
        }
      >
        <DemoSidebar boards={demoData.boards} user={demoData.currentUser} />
      </Suspense>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
