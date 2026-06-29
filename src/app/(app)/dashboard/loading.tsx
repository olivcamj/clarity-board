'use client';
import { useState } from 'react';
import { TopBar } from '../../components/TopBar';

export function DashboardSkeleton() {
  const [searchQuery, setSearchQuery] = useState('');
  return (
    <div className="min-h-screen" style={{ background: 'var(--paper)' }}>
      <TopBar title="Home" showHomeIcon searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <div className="px-[40px] py-[40px]">
        <div className="flex items-start justify-between mb-[24px]">
          <div className="flex flex-col gap-[12px]">
            <div className="h-[10px] w-[160px] rounded bg-chalk animate-pulse" aria-hidden="true" />
            <div className="h-[38px] w-[260px] rounded-[8px] bg-chalk animate-pulse" aria-hidden="true" />
          </div>
          <div className="h-[32px] w-[80px] rounded-[8px] bg-chalk animate-pulse" aria-hidden="true" />
        </div>
        <div className="flex gap-[12px] mb-[28px]">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="h-[64px] rounded-[10px] bg-chalk animate-pulse flex-1" aria-hidden="true" />
          ))}
        </div>
        <div className="h-[240px] rounded-[10px] bg-chalk animate-pulse" aria-hidden="true" />
      </div>
    </div>
  );
}

export default DashboardSkeleton;
