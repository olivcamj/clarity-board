'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import type { ReactNode } from 'react';
import { Spark } from '../../ui/Spark';
import { ClarityLogo } from '../../ui/ClarityLogo';
import { Avatar } from '../../ui/Avatar';
import { Icon } from '../../ui/Icon';

interface DemoBoard {
  id: string;
  name: string;
}

interface DemoUser {
  name: string;
  email: string;
}

interface DemoSidebarProps {
  boards: DemoBoard[];
  user: DemoUser;
}

const WORKSPACE_NAV_ITEMS = [
  { href: '/demo/dashboard', label: 'Home', icon: <Icon name="home" size={15} /> },
] as const;

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

function NavSectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-[10px] text-ash font-medium tracking-[0.1em] uppercase m-0 mb-[4px] px-[8px]">
      {children}
    </p>
  );
}

export function DemoSidebar({ boards, user }: DemoSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentBoardId = searchParams.get('boardId');

  return (
    <aside
      aria-label="App navigation"
      className="w-[260px] shrink-0 h-screen overflow-hidden flex flex-col border-r border-chalk"
      style={{ background: 'var(--bone)' }}
    >
      {/* Demo banner */}
      <Link
        href="/sign-up"
        className="flex items-center justify-between px-[12px] py-[7px] text-[11px] font-ui font-medium no-underline transition-opacity duration-150 hover:opacity-80"
        style={{ background: 'var(--ember)', color: '#fff' }}
      >
        <span>Demo mode — exploring Kiln Studio</span>
        <span className="font-mono text-[10px] opacity-80">Sign up free →</span>
      </Link>

      {/* Logo */}
      <div className="flex items-center gap-[8px] px-[16px] pt-[14px] pb-[14px]">
        <ClarityLogo size={24} />
        <span className="font-display text-[16px] text-ink leading-none">ClarityBoard</span>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col px-[10px]">
        {/* Workspace selector */}
        <div
          className="flex items-center gap-[9px] w-full px-[8px] py-[8px] rounded-[8px] mb-[8px]"
        >
          <div
            className="flex items-center justify-center rounded-[6px] font-ui font-semibold text-[11px] shrink-0"
            style={{ width: 26, height: 26, background: 'var(--ochre-soft)', color: 'var(--ochre)', border: '1.5px solid var(--ochre)' }}
            aria-hidden="true"
          >
            KS
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-ui font-medium text-ink text-[13px] m-0 truncate">Kiln Studio</p>
            <p className="font-ui text-ash text-[11px] m-0">6 members</p>
          </div>
        </div>

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

        <p className="font-ui text-[11px] italic px-[8px] mb-[14px] m-0" style={{ color: 'var(--ember)' }}>
          3 suggestions waiting.
        </p>

        {/* Workspace nav */}
        <nav aria-label="Workspace" className="mt-[18px]">
          <NavSectionLabel>Workspace</NavSectionLabel>
          <ul className="list-none m-0 p-0 flex flex-col" style={{ gap: 2 }}>
            {WORKSPACE_NAV_ITEMS.map(item => (
              <li key={item.href}>
                <NavItem
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
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
            {boards.map(board => {
              const isActive = currentBoardId === board.id;
              return (
                <li key={board.id}>
                  <NavItem
                    href={`/demo/taskboard?boardId=${board.id}`}
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
          </ul>
        </nav>
      </div>

      {/* Footer */}
      <div className="border-t border-chalk px-[12px] py-[10px] flex items-center gap-[10px]">
        <Avatar name={user.name} size={30} />
        <div className="flex-1 min-w-0">
          <p className="font-ui font-medium text-[13px] text-ink m-0 truncate leading-snug">{user.name}</p>
          <p className="font-ui text-[11px] text-ash m-0 truncate leading-snug">{user.email}</p>
        </div>
        <Link
          href="/sign-up"
          aria-label="Sign up"
          className="shrink-0 flex items-center justify-center w-[28px] h-[28px] rounded-[6px] text-ash transition-colors duration-150 hover:bg-sand hover:text-ink"
        >
          <Icon name="settings" size={15} />
        </Link>
      </div>
    </aside>
  );
}
