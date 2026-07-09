'use client';
import { useState } from 'react';
import { TopBar } from '../../components/TopBar';

export function DashboardSkeleton() {
  const [searchQuery, setSearchQuery] = useState('');
  return (
    <div className="min-h-screen" style={{ background: 'var(--paper)' }}>
      <TopBar title="Home" showHomeIcon searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <div className="px-[16px] py-[24px] md:px-[40px] md:py-[40px]">
        <div className="flex flex-col gap-[16px] items-start mb-[24px] md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-[12px]">
            <div className="h-[10px] w-[160px] rounded bg-chalk animate-pulse" aria-hidden="true" />
            <div className="h-[38px] w-[260px] rounded-[8px] bg-chalk animate-pulse" aria-hidden="true" />
          </div>
          <div className="h-[32px] w-[80px] rounded-[8px] bg-chalk animate-pulse" aria-hidden="true" />
        </div>
        <div className="grid grid-cols-1 gap-[10px] mb-[20px] min-[425px]:grid-cols-2 md:flex md:gap-[12px] md:mb-[28px]">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="h-[64px] rounded-[10px] bg-chalk animate-pulse md:flex-1" aria-hidden="true" />
          ))}
        </div>
        <div className="h-[240px] rounded-[10px] bg-chalk animate-pulse" aria-hidden="true" />
      </div>
    </div>
  );
}

export default DashboardSkeleton;
