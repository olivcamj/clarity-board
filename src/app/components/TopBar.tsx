'use client';

import { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Spark } from '../ui/Spark';
import { useSidebar } from '../lib/SidebarContext';

interface TopBarProps {
  title: string;
  subtitle?: string;
  showHomeIcon?: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export function TopBar({ title, subtitle, showHomeIcon, searchQuery, onSearchChange }: TopBarProps) {
  const { toggleMobileSidebar } = useSidebar();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  // If the window is resized/rotated back past `md` while the mobile search
  // row (which is `md:hidden`) is open, collapse it — otherwise the desktop
  // row stays hidden and the header renders blank.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const handleChange = () => { if (mq.matches) setMobileSearchOpen(false); };
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  const searchInput = (
    <label className="flex items-center gap-[8px] bg-paper border border-chalk rounded-[8px] px-[12px] py-[7px] w-full max-w-[480px] cursor-text">
      <Icon name="search" size={13} color="var(--ash)" stroke={2} />
      <input
        type="search"
        placeholder="Search tasks, people, labels…"
        value={searchQuery}
        onChange={e => onSearchChange(e.target.value)}
        className="bg-transparent border-0 outline-none flex-1 text-[13px] font-ui text-ink min-w-0"
        aria-label="Search tasks, people, labels"
      />
    </label>
  );

  return (
    <nav
      className="flex items-center border-b border-chalk px-[16px] md:px-[24px] py-[12px] bg-bone gap-[8px]"
      aria-label="Top navigation"
    >
      {mobileSearchOpen ? (
        <div className="flex items-center gap-[8px] w-full md:hidden">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Close search"
            onClick={() => setMobileSearchOpen(false)}
          >
            <Icon name="chevron-left" size={16} />
          </Button>
          {searchInput}
        </div>
      ) : (
        <>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Open menu"
            className="md:hidden"
            onClick={toggleMobileSidebar}
          >
            <Icon name="menu" size={16} />
          </Button>

          {/* Logo / page label */}
          <div className="flex items-baseline gap-[10px] shrink-0 min-w-0">
            {showHomeIcon ? (
              <span className="flex items-center gap-[6px] min-w-0">
                <Icon name="home" size={16} color="var(--ash)" />
                <span className="font-display text-[20px] text-ink leading-none truncate">{title}</span>
              </span>
            ) : (
              <span className="font-display text-[20px] text-ink leading-none truncate">{title}</span>
            )}
            {subtitle && (
              <span className="hidden md:inline font-ui text-[12px] text-ash italic">{subtitle}</span>
            )}
          </div>

          {/* Search — desktop only, collapses to icon below md */}
          <div className="hidden md:flex flex-1 justify-center px-[32px]">
            {searchInput}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-[4px] md:gap-[8px] shrink-0 ml-auto md:ml-0">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Search"
              className="md:hidden"
              onClick={() => setMobileSearchOpen(true)}
            >
              <Icon name="search" size={15} stroke={2} />
            </Button>
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Notifications">
              <Icon name="bell" size={16} />
            </Button>
            <Button type="button" variant="solid" tone="ember" size="sm" aria-label="Ask Clarity">
              <Spark size={11} color="#fff" />
              <span className="hidden md:inline">Ask Clarity</span>
            </Button>
          </div>
        </>
      )}
    </nav>
  );
}
