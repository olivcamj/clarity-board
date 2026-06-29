'use client';
import { useState } from 'react';
import { TopBar } from '../../components/TopBar';

export function TeamsSkeleton() {
  const [searchQuery, setSearchQuery] = useState('');
  return (
    <div className="min-h-screen" style={{ background: 'var(--paper)' }}>
      <TopBar title="Teams" searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <div className="px-[40px] py-[40px]">
        <div className="flex items-start justify-between mb-[40px]">
          <div className="flex flex-col gap-[12px]">
            <div className="h-[38px] w-[260px] rounded-[8px] bg-chalk animate-pulse" aria-hidden="true" />
            <div className="h-[13px] w-[80px] rounded bg-chalk animate-pulse" aria-hidden="true" />
          </div>
          <div className="h-[32px] w-[90px] rounded-[8px] bg-chalk animate-pulse" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-[36px]">
          {[3, 2].map((cardCount, i) => (
            <section key={i} aria-hidden="true">
              <div className="flex items-center gap-[10px] mb-[14px]">
                <div className="h-[10px] w-[64px] rounded bg-chalk animate-pulse" />
                <div className="flex-1 h-px bg-chalk" />
              </div>
              <div className="grid gap-[12px]" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
                {Array.from({ length: cardCount }).map((_, j) => (
                  <div key={j} className="p-[18px] rounded-[10px] border border-chalk flex flex-col gap-[8px]">
                    <div className="h-[14px] rounded bg-chalk animate-pulse" style={{ width: `${60 + j * 15}%` }} />
                    <div className="h-[10px] w-[48px] rounded bg-chalk animate-pulse" />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TeamsSkeleton;
