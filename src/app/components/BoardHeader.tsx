'use client';

import { AvatarStack } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Spark } from '../ui/Spark';

interface BoardHeaderProps {
  sprintCode: string;    // "SPRINT 14 · APR 22 – MAY 5"
  sprintLabel: string;   // "Sprint 14, looking sharp"
  boardName: string;     // "The board"
  subtitle: string;      // "3 of 8 done — you're on track."
  progress: number;      // 0–100
  teamNames: string[];
  onNewTask: () => void;
}

export function BoardHeader({
  sprintCode,
  sprintLabel,
  boardName,
  subtitle,
  progress,
  teamNames,
  onNewTask,
}: BoardHeaderProps) {
  return (
    <header>
      {/* ── Top nav ─────────────────────────────── */}
      <nav
        className="flex items-center border-b border-chalk px-[24px] py-[12px] bg-bone"
        aria-label="Board navigation"
      >
        {/* Logo + sprint label */}
        <div className="flex items-baseline gap-[10px] shrink-0">
          <span className="font-display text-[20px] text-ink leading-none">Board</span>
          <span className="font-ui text-[12px] text-ash italic">{sprintLabel}</span>
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

      {/* ── Sprint header ────────────────────────── */}
      <div className="flex items-end justify-between px-[24px] py-[20px] border-b border-chalk bg-paper">
        {/* Left: sprint info + board title */}
        <div>
          <p className="font-mono text-[10px] text-ash tracking-[0.1em] uppercase mb-[6px]">
            {sprintCode}
          </p>
          <h1 className="font-display text-[42px] font-normal leading-[1.1] text-ink mb-[4px]">
            {boardName}
          </h1>
          <p className="font-ui text-[13px] text-ash italic m-0">
            {subtitle}
          </p>
        </div>

        {/* Right: controls */}
        <div className="flex items-center gap-[12px] shrink-0 pb-[4px]">
          {/* Progress */}
          <div className="flex items-center gap-[8px]">
            <div
              className="bg-sand rounded-full overflow-hidden"
              style={{ width: 180, height: 6 }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${progress}% complete`}
            >
              <div
                className="bg-slate rounded-full h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="font-mono text-[12px] text-ash">{progress}%</span>
          </div>

          {/* Divider */}
          <span aria-hidden="true" className="text-chalk text-[18px] font-light">|</span>

          {/* Filter + Group */}
          <div className="flex items-center gap-[4px]">
            <Button type="button" variant="ghost" size="sm" aria-label="Filter tasks">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              Filter
            </Button>
            <Button type="button" variant="ghost" size="sm" aria-label="Group tasks">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <line x1="21" y1="10" x2="3" y2="10" />
                <line x1="21" y1="6"  x2="3" y2="6"  />
                <line x1="21" y1="14" x2="3" y2="14" />
                <line x1="21" y1="18" x2="3" y2="18" />
              </svg>
              Group
            </Button>
          </div>

          {/* Divider */}
          <span aria-hidden="true" className="text-chalk text-[18px] font-light">|</span>

          {/* Team avatars */}
          {teamNames.length > 0 && (
            <AvatarStack names={teamNames} size={28} max={4} />
          )}

          {/* New task */}
          <Button type="button" variant="solid" size="md" onClick={onNewTask}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New task
          </Button>
        </div>
      </div>
    </header>
  );
}
