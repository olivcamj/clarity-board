'use client';

import { Button } from '../ui/Button';
import { Spark } from '../ui/Spark';

interface TopBarProps {
  title: string;
  subtitle?: string;
  showHomeIcon?: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export function TopBar({ title, subtitle, showHomeIcon, searchQuery, onSearchChange }: TopBarProps) {
  return (
    <nav
      className="flex items-center border-b border-chalk px-[24px] py-[12px] bg-bone"
      aria-label="Top navigation"
    >
      {/* Logo / page label */}
      <div className="flex items-baseline gap-[10px] shrink-0">
        {showHomeIcon ? (
          <span className="flex items-center gap-[6px]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ash)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 11.5 12 4l9 7.5" />
              <path d="M5.5 10v9a1 1 0 0 0 1 1H9.5v-5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v5h3a1 1 0 0 0 1-1v-9" />
            </svg>
            <span className="font-display text-[20px] text-ink leading-none">{title}</span>
          </span>
        ) : (
          <span className="font-display text-[20px] text-ink leading-none">{title}</span>
        )}
        {subtitle && (
          <span className="font-ui text-[12px] text-ash italic">{subtitle}</span>
        )}
      </div>

      {/* Search */}
      <div className="flex-1 flex justify-center px-[32px]">
        <label className="flex items-center gap-[8px] bg-paper border border-chalk rounded-[8px] px-[12px] py-[7px] w-full max-w-[480px] cursor-text">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--ash)" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="search"
            placeholder="Search tasks, people, labels…"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="bg-transparent border-0 outline-none flex-1 text-[13px] font-ui text-ink min-w-0"
            aria-label="Search tasks, people, labels"
          />
        </label>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-[8px] shrink-0">
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Notifications">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </Button>
        <Button type="button" variant="solid" tone="ember" size="sm">
          <Spark size={11} color="#fff" />
          Ask Clarity
        </Button>
      </div>
    </nav>
  );
}
