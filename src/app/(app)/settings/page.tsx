'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from '../../ui/Button';
import { SegmentedControl } from '../../ui/SegmentedControl';
import { Spark } from '../../ui/Spark';
import { Toggle } from '../../ui/Toggle';
import { useWorkspace } from '../../lib/WorkspaceContext';
import { useTheme, type ColorTheme } from '../../lib/ThemeContext';

type SettingsSection = 'general' | 'members' | 'clarity-ai' | 'billing' | 'danger-zone';
type DefaultView     = 'board' | 'table' | 'list';

const SETTINGS_SECTIONS: Array<{ id: SettingsSection; label: string; danger?: true }> = [
  { id: 'general',     label: 'General'     },
  { id: 'members',     label: 'Members'     },
  { id: 'clarity-ai',  label: 'Clarity AI'  },
  { id: 'billing',     label: 'Billing'     },
  { id: 'danger-zone', label: 'Danger zone', danger: true },
];

// ── Shared layout primitives ──────────────────────────────────────

function SettingsSectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-[10px] text-ash font-medium tracking-[0.1em] uppercase m-0 mb-[4px]">
      {children}
    </p>
  );
}

interface SettingsRowProps {
  label: string;
  description: string;
  /** Pass the id of the associated control to connect it via <label> */
  htmlFor?: string;
  children: ReactNode;
}

function SettingsRow({ label, description, htmlFor, children }: SettingsRowProps) {
  return (
    <>
      <div className="flex items-center justify-between py-[22px]">
        <div>
          {htmlFor ? (
            <label htmlFor={htmlFor} className="block font-ui font-semibold text-ink text-[14px] m-0 cursor-pointer">
              {label}
            </label>
          ) : (
            <p className="font-ui font-semibold text-ink text-[14px] m-0">{label}</p>
          )}
          <p className="font-ui text-ash text-[13px] leading-[1.5] m-0 mt-[2px]">{description}</p>
        </div>
        <div className="shrink-0 ml-[48px]">{children}</div>
      </div>
      <hr className="border-0 border-t border-chalk m-0" />
    </>
  );
}

// ── Settings panels ───────────────────────────────────────────────

const DEFAULT_VIEW_OPTIONS: Array<{ value: DefaultView; label: string }> = [
  { value: 'board', label: 'Board' },
  { value: 'table', label: 'Table' },
  { value: 'list',  label: 'List'  },
];

const THEME_OPTIONS: Array<{ value: ColorTheme; label: string; icon?: ReactNode }> = [
  {
    value: 'light',
    label: 'Light',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
    ),
  },
  {
    value: 'dark',
    label: 'Dark',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    ),
  },
  { value: 'auto', label: 'Auto' },
];

function GeneralSettings() {
  const { workspaceName, updateWorkspaceName, workspaceRole } = useWorkspace();
  const { theme: colorTheme, setTheme: setColorTheme } = useTheme();
  const isAdmin = workspaceRole === 'ADMIN';
  const [defaultView,      setDefaultView]      = useState<DefaultView>('board');
  const [weeklyDigestOn,   setWeeklyDigestOn]   = useState(true);
  const [pendingName,      setPendingName]       = useState(workspaceName);

  const nameIsDirty = pendingName !== workspaceName;

  const handleSaveWorkspaceName = () => {
    const trimmed = pendingName.trim();
    if (!trimmed || !isAdmin) return;
    updateWorkspaceName(trimmed);
  };

  return (
    <section aria-labelledby="general-heading">
      <SettingsSectionLabel>Workspace</SettingsSectionLabel>
      <h1
        id="general-heading"
        className="font-display text-[42px] font-normal leading-[1.1] text-ink m-0 mb-[32px]"
      >
        Settings &amp; billing
      </h1>

      <hr className="border-0 border-t border-chalk m-0" />

      <SettingsRow
        label="Workspace name"
        description="Shown to all members and in invites."
        htmlFor="workspace-name"
      >
        <div className="flex items-center gap-[8px]">
          <input
            id="workspace-name"
            type="text"
            value={pendingName}
            disabled={!isAdmin}
            onChange={e => setPendingName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSaveWorkspaceName(); }}
            className={[
              'font-ui text-[13px] text-ink bg-paper border border-chalk rounded-[8px] px-[12px] py-[7px] outline-none w-[220px] transition-colors duration-150',
              isAdmin ? 'focus:border-slate' : 'opacity-50 cursor-not-allowed',
            ].join(' ')}
            aria-describedby="workspace-name-hint"
          />
          {nameIsDirty && isAdmin && (
            <Button type="button" variant="solid" size="sm" onClick={handleSaveWorkspaceName}>
              Save
            </Button>
          )}
        </div>
        {!isAdmin && (
          <p className="font-ui text-[11px] text-ash mt-[6px] m-0">
            Only workspace admins can rename the workspace.
          </p>
        )}
        <p id="workspace-name-hint" className="sr-only">Press Enter or click Save to apply.</p>
      </SettingsRow>

      <SettingsRow
        label="Default view"
        description="What members see when they open the workspace."
      >
        <SegmentedControl
          options={DEFAULT_VIEW_OPTIONS}
          value={defaultView}
          onChange={v => setDefaultView(v)}
          groupLabel="Default view"
        />
      </SettingsRow>

      <SettingsRow
        label="Theme"
        description="Changes this device only."
      >
        <SegmentedControl
          options={THEME_OPTIONS}
          value={colorTheme}
          onChange={v => setColorTheme(v)}
          groupLabel="Color theme"
        />
      </SettingsRow>

      <SettingsRow
        label="Weekly digest"
        description="Every Monday at 9am, a short note on what shipped."
      >
        <Toggle
          checked={weeklyDigestOn}
          onChange={setWeeklyDigestOn}
          label="Weekly digest emails"
        />
      </SettingsRow>
    </section>
  );
}

function PlaceholderPanel({ title }: { title: string }) {
  return (
    <section aria-labelledby="placeholder-heading" className="flex flex-col items-center justify-center h-full" style={{ minHeight: 320 }}>
      <p id="placeholder-heading" className="font-display text-[28px] text-ink m-0 mb-[8px]">{title}</p>
      <p className="font-ui text-[14px] text-ash m-0">This section is coming soon.</p>
    </section>
  );
}

const SECTION_PANELS: Record<SettingsSection, ReactNode> = {
  'general':     <GeneralSettings />,
  'members':     <PlaceholderPanel title="Members" />,
  'clarity-ai':  <PlaceholderPanel title="Clarity AI" />,
  'billing':     <PlaceholderPanel title="Billing" />,
  'danger-zone': <PlaceholderPanel title="Danger zone" />,
};

// ── Page ──────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('general');

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--paper)' }}>

        {/* Top nav */}
        <nav
          className="flex items-center border-b border-chalk px-[24px] py-[12px] shrink-0 bg-bone"
          aria-label="Settings navigation"
        >
          <span className="font-display text-[20px] text-ink leading-none shrink-0">Settings</span>

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
                aria-label="Search"
              />
            </label>
          </div>

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

        {/* Settings content */}
        <div className="flex-1 flex overflow-hidden">

          {/* Settings sub-navigation */}
          <nav
            aria-label="Settings sections"
            className="w-[200px] shrink-0 border-r border-chalk overflow-y-auto py-[24px] px-[12px]"
            style={{ background: 'var(--bone)' }}
          >
            <ul role="tablist" aria-orientation="vertical" className="list-none m-0 p-0 flex flex-col" style={{ gap: 2 }}>
              {SETTINGS_SECTIONS.map(({ id, label, danger }) => {
                const isActive = activeSection === id;
                return (
                  <li key={id} role="presentation">
                    <button
                      type="button"
                      role="tab"
                      id={`tab-${id}`}
                      aria-selected={isActive}
                      aria-controls={`panel-${id}`}
                      onClick={() => setActiveSection(id)}
                      className={[
                        'w-full text-left px-[10px] py-[7px] rounded-[8px] text-[13px] font-ui',
                        'transition-colors duration-150 cursor-pointer',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate',
                        isActive
                          ? 'bg-paper shadow-[var(--shadow-1)] text-ink font-medium'
                          : danger
                            ? 'text-rose hover:bg-rose-soft'
                            : 'text-ash hover:bg-sand hover:text-ink',
                      ].filter(Boolean).join(' ')}
                    >
                      {label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Active settings panel */}
          <main
            id={`panel-${activeSection}`}
            role="tabpanel"
            aria-labelledby={`tab-${activeSection}`}
            className="flex-1 overflow-y-auto px-[48px] py-[36px]"
            style={{ maxWidth: 800 }}
          >
            {SECTION_PANELS[activeSection]}
          </main>
        </div>
      </div>
  );
}
