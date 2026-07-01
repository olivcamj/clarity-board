'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import type { ReactNode } from 'react';
import { UserButton } from '@clerk/nextjs';
import { Spark } from '../ui/Spark';
import { Icon } from '../ui/Icon';
import { useWorkspace } from '../lib/WorkspaceContext';

// VIEW_NAV_ITEMS hidden until post-MVP (Table, List, Timeline not yet implemented)
// const VIEW_NAV_ITEMS = [
//   { href: '/taskboard', label: 'Board',    icon: <Icon name="board" size={15} />    },
//   { href: '/table',     label: 'Table',    icon: <Icon name="table" size={15} />    },
//   { href: '/list',      label: 'List',     icon: <Icon name="list" size={15} />     },
//   { href: '/timeline',  label: 'Timeline', icon: <Icon name="timeline" size={15} /> },
// ] as const;

const WORKSPACE_NAV_ITEMS = [
  { href: '/dashboard', label: 'Home',     icon: <Icon name="home" size={15} />,     badge: undefined as number | undefined },
  { href: '/teams',     label: 'Teams',    icon: <Icon name="teams" size={15} />,    badge: undefined as number | undefined },
  { href: '/inbox',     label: 'Inbox',    icon: <Icon name="inbox" size={15} />,    badge: undefined as number | undefined },
  { href: '/activity',  label: 'Activity', icon: <Icon name="activity" size={15} />, badge: undefined },
  { href: '/people',    label: 'People',   icon: <Icon name="people" size={15} />,   badge: undefined },
] as const;



function NavSectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-[10px] text-ash font-medium tracking-[0.1em] uppercase m-0 mb-[4px] px-[8px]">
      {children}
    </p>
  );
}

function NavItem({
  href,
  label,
  icon,
  badge,
  isActive,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  badge?: number;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={[
        'flex items-center gap-[9px] px-[8px] py-[6px] rounded-[6px] text-[13px] font-ui',
        'transition-colors duration-150 w-full',
        isActive
          ? 'bg-bone text-ink font-medium active:bg-sand'
          : 'text-ash hover:bg-bone hover:text-ink active:bg-sand',
      ].join(' ')}
    >
      {icon}
      <span className="flex-1">{label}</span>
      {badge !== undefined && (
        <span
          className="font-mono text-[10px] font-medium text-white rounded-full px-[5px] py-[1px] shrink-0"
          style={{ background: 'var(--slate)', minWidth: 18, textAlign: 'center' }}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}



const SUGGESTIONS_PENDING: number = 3;

export function AppSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentBoardId = searchParams.get('boardId');
  const { teams, boardsByTeam, user, workspaceName, loading } = useWorkspace();
  const allBoards = teams.flatMap(team => boardsByTeam[team.id] ?? []);

  return (
    <aside
      aria-label="App navigation"
      className="w-[260px] shrink-0 h-screen overflow-hidden flex flex-col border-r border-chalk"
      style={{ background: 'var(--bone)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-[8px] px-[16px] pt-[18px] pb-[14px]">
        <div
          className="flex items-center justify-center rounded-[6px] shrink-0"
          style={{ width: 24, height: 24, background: 'var(--ember)', color: '#fff' }}
          aria-hidden="true"
        >
          <Spark size={13} color="#fff" />
        </div>
        <span className="font-display text-[16px] text-ink leading-none">ClarityBoard</span>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col px-[10px]" style={{ gap: 0 }}>
        {/* Workspace selector */}
        <button
          type="button"
          aria-label={`${workspaceName} workspace. Click to switch.`}
          className="flex items-center gap-[9px] w-full px-[8px] py-[8px] rounded-[8px] text-left hover:bg-sand active:bg-biscuit transition-colors duration-150 mb-[8px]"
        >
          <div
            className="flex items-center justify-center rounded-[6px] font-ui font-semibold text-[11px] shrink-0"
            style={{ width: 26, height: 26, background: 'var(--ochre-soft)', color: 'var(--ochre)', border: '1.5px solid var(--ochre)' }}
            aria-hidden="true"
          >
            {workspaceName.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-ui font-medium text-ink text-[13px] m-0 truncate">{workspaceName}</p>
            <p className="font-ui text-ash text-[11px] m-0">{teams.length} team{teams.length !== 1 ? 's' : ''}</p>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ash)" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {/* Ask Clarity */}
        <button
          type="button"
          aria-label="Ask Clarity (⌘K)"
          className="flex items-center gap-[8px] w-full px-[10px] py-[8px] rounded-[8px] text-white font-ui font-medium text-[13px] cursor-pointer transition-[colors,opacity] duration-150 active:opacity-80 mb-[6px]"
          style={{ background: 'var(--ember)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--ember-hot)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--ember)')}
        >
          <Spark size={12} color="#fff" />
          <span className="flex-1 text-left">Ask Clarity</span>
          <kbd
            aria-hidden="true"
            className="font-mono text-[10px] rounded-[4px] px-[5px] py-[2px]"
            style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}
          >
            ⌘K
          </kbd>
        </button>

        {SUGGESTIONS_PENDING > 0 && (
          <p className="font-ui text-[11px] italic px-[8px] mb-[14px] m-0" style={{ color: 'var(--ember)' }}>
            {SUGGESTIONS_PENDING} suggestion{SUGGESTIONS_PENDING !== 1 ? 's' : ''} waiting.
          </p>
        )}

        {/* Views — hidden until post-MVP (Table, List, Timeline not yet implemented)
        <nav aria-label="Views">
          <NavSectionLabel>Views</NavSectionLabel>
          <ul className="list-none m-0 p-0 flex flex-col" style={{ gap: 2 }}>
            {VIEW_NAV_ITEMS.map(item => (
              <li key={item.href}>
                <NavItem
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
                />
              </li>
            ))}
          </ul>
        </nav>
        */}

        {/* Workspace */}
        <nav aria-label="Workspace" className="mt-[18px]">
          <NavSectionLabel>Workspace</NavSectionLabel>
          <ul className="list-none m-0 p-0 flex flex-col" style={{ gap: 2 }}>
            {WORKSPACE_NAV_ITEMS.map(item => (
              <li key={item.href}>
                <NavItem
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  badge={item.badge}
                  isActive={pathname === item.href}
                />
              </li>
            ))}
          </ul>
        </nav>

        {/* Boards */}
        <nav aria-label="Boards" className="mt-[18px]">
          <NavSectionLabel>Boards</NavSectionLabel>
          <ul className="list-none m-0 p-0 flex flex-col" style={{ gap: 2 }}>
            {loading ? (
              [44, 60, 36].map((w, i) => (
                <li key={i} className="flex items-center gap-[9px] px-[8px] py-[7px]" aria-hidden="true">
                  <span className="w-[7px] h-[7px] rounded-full bg-chalk animate-pulse shrink-0" />
                  <span className="h-[10px] rounded bg-chalk animate-pulse" style={{ width: w }} />
                </li>
              ))
            ) : (
              <>
                {allBoards.map(board => {
                  const isActive = currentBoardId === board.id;
                  return (
                    <li key={board.id}>
                      <NavItem
                        href={`/taskboard?boardId=${board.id}`}
                        label={board.name}
                        icon={
                          <span
                            aria-hidden="true"
                            className="w-[7px] h-[7px] rounded-full shrink-0 mt-[1px]"
                            style={{ background: isActive ? 'var(--slate)' : 'var(--chalk)' }}
                          />
                        }
                        isActive={isActive}
                      />
                    </li>
                  );
                })}
                {allBoards.length === 0 && (
                  <li>
                    <Link
                      href="/teams"
                      className="flex items-center gap-[9px] px-[8px] py-[6px] rounded-[6px] text-[12px] font-ui text-ash transition-colors duration-150 hover:text-ink"
                    >
                      + Create a board
                    </Link>
                  </li>
                )}
              </>
            )}
          </ul>
        </nav>
      </div>

      {/* Footer — user identity + settings */}
      <div className="border-t border-chalk px-[12px] py-[10px] flex items-center gap-[10px]">
        {loading || !user ? (
          <>
            <div className="w-[30px] h-[30px] rounded-full bg-chalk animate-pulse shrink-0" aria-hidden="true" />
            <div className="flex-1 flex flex-col gap-[6px]">
              <div className="h-[10px] w-[80px] rounded bg-chalk animate-pulse" aria-hidden="true" />
              <div className="h-[9px] w-[120px] rounded bg-chalk animate-pulse" aria-hidden="true" />
            </div>
            <div className="w-[28px] h-[28px] rounded-[6px] bg-chalk animate-pulse shrink-0" aria-hidden="true" />
          </>
        ) : (
          <>
            <UserButton
              appearance={{ elements: { avatarBox: 'w-[30px] h-[30px]' } }}
            />

            <div className="flex-1 min-w-0">
              <p className="font-ui font-medium text-[13px] text-ink m-0 truncate leading-snug">
                {user.name || 'Unnamed user'}
              </p>
              <p className="font-ui text-[11px] text-ash m-0 truncate leading-snug">
                {user.email}
              </p>
            </div>

            <Link
              href="/settings"
              aria-label="Settings"
              className="shrink-0 flex items-center justify-center w-[28px] h-[28px] rounded-[6px] text-ash transition-colors duration-150 hover:bg-sand hover:text-ink active:bg-biscuit"
            >
              <Icon name="settings" size={15} />
            </Link>
          </>
        )}
      </div>
    </aside>
  );
}
