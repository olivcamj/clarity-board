'use client';

import { AvatarStack } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { TopBar } from './TopBar';

interface BoardHeaderProps {
  sprintCode: string;
  sprintLabel: string;
  boardName: string;
  subtitle: string;
  progress: number;      // 0–100
  teamNames: string[];
  hasTeammates?: boolean;
  onNewTask: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export function BoardHeader({
  sprintCode,
  sprintLabel,
  boardName,
  subtitle,
  progress,
  teamNames,
  hasTeammates = false,
  onNewTask,
  searchQuery,
  onSearchChange,
}: BoardHeaderProps) {
  return (
    <header>
      <TopBar title="Board" subtitle={sprintLabel} searchQuery={searchQuery} onSearchChange={onSearchChange} />

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

          {/* Filter (only when there are teammates to filter by) */}
          {hasTeammates && (
            <>
              <span aria-hidden="true" className="text-chalk text-[18px] font-light">|</span>
              <Button type="button" variant="ghost" size="sm" aria-label="Filter tasks">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                Filter
              </Button>
              <span aria-hidden="true" className="text-chalk text-[18px] font-light">|</span>
            </>
          )}

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
