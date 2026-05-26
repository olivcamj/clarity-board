'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { Spark } from '../ui/Spark';

function BoardIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="5" height="18" rx="1" />
      <rect x="10" y="3" width="5" height="12" rx="1" />
      <rect x="17" y="3" width="5" height="16" rx="1" />
    </svg>
  );
}

function TableIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
}

function TimelineIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M3 6h11M8 12h9M3 18h7" strokeWidth="2.5" />
    </svg>
  );
}

function InboxIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 12h-6l-2 3H10l-2-3H2" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}


const VIEW_NAV_ITEMS = [
  { href: '/taskboard', label: 'Board',    icon: <BoardIcon />    },
  { href: '/table',     label: 'Table',    icon: <TableIcon />    },
  { href: '/list',      label: 'List',     icon: <ListIcon />     },
  { href: '/timeline',  label: 'Timeline', icon: <TimelineIcon /> },
] as const;

const WORKSPACE_NAV_ITEMS = [
  { href: '/inbox',    label: 'Inbox',    icon: <InboxIcon />,    badge: 4 as number | undefined },
  { href: '/activity', label: 'Activity', icon: <ActivityIcon />, badge: undefined },
  { href: '/people',   label: 'People',   icon: <PeopleIcon />,   badge: undefined },
] as const;

const PROJECTS = [
  { href: '/projects/launch-v2', label: 'Launch v2.0', dot: 'var(--rose)' },
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
          ? 'bg-bone text-ink font-medium'
          : 'text-ash hover:bg-bone hover:text-ink',
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



const WORKSPACE = { name: 'Kiln Studio', memberCount: 6 };
const SUGGESTIONS_PENDING: number = 3;

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside
      aria-label="App navigation"
      className="w-[260px] shrink-0 h-screen overflow-y-auto flex flex-col border-r border-chalk"
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

      <div className="flex flex-col px-[10px]" style={{ gap: 0 }}>
        {/* Workspace selector */}
        <button
          type="button"
          aria-label={`${WORKSPACE.name} workspace — ${WORKSPACE.memberCount} members. Click to switch.`}
          className="flex items-center gap-[9px] w-full px-[8px] py-[8px] rounded-[8px] text-left hover:bg-sand transition-colors duration-150 mb-[8px]"
        >
          <div
            className="flex items-center justify-center rounded-[6px] font-ui font-semibold text-[11px] shrink-0"
            style={{ width: 26, height: 26, background: 'var(--ochre-soft)', color: 'var(--ochre)', border: '1.5px solid var(--ochre)' }}
            aria-hidden="true"
          >
            {WORKSPACE.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-ui font-medium text-ink text-[13px] m-0 truncate">{WORKSPACE.name}</p>
            <p className="font-ui text-ash text-[11px] m-0">{WORKSPACE.memberCount} members</p>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ash)" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {/* Ask Clarity */}
        <button
          type="button"
          aria-label="Ask Clarity (⌘K)"
          className="flex items-center gap-[8px] w-full px-[10px] py-[8px] rounded-[8px] text-white font-ui font-medium text-[13px] cursor-pointer transition-colors duration-150 mb-[6px]"
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

        {/* Views */}
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

        {/* Projects */}
        <nav aria-label="Projects" className="mt-[18px]">
          <NavSectionLabel>Projects</NavSectionLabel>
          <ul className="list-none m-0 p-0 flex flex-col" style={{ gap: 2 }}>
            {PROJECTS.map(project => (
              <li key={project.href}>
                <Link
                  href={project.href}
                  aria-current={pathname === project.href ? 'page' : undefined}
                  className={[
                    'flex items-center gap-[9px] px-[8px] py-[6px] rounded-[6px] text-[13px] font-ui transition-colors duration-150',
                    pathname === project.href
                      ? 'bg-bone text-ink font-medium'
                      : 'text-ash hover:bg-bone hover:text-ink',
                  ].join(' ')}
                >
                  <span
                    aria-hidden="true"
                    className="w-[7px] h-[7px] rounded-full shrink-0"
                    style={{ background: project.dot }}
                  />
                  {project.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
