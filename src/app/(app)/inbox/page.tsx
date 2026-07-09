'use client';

import { useState } from 'react';
import { TopBar } from '../../components/TopBar';

export default function InboxPage() {
  const [searchQuery, setSearchQuery] = useState('');
  return (
    <div className="min-h-screen" style={{ background: 'var(--paper)' }}>
      <TopBar title="Inbox" searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <div className="flex flex-col items-center justify-center" style={{ height: 'calc(100vh - 57px)' }}>
        <p className="font-display text-[28px] font-normal text-ink mb-[8px]">Inbox</p>
        <p className="font-ui text-[13px] text-ash">Coming soon.</p>
      </div>
    </div>
  );
}
