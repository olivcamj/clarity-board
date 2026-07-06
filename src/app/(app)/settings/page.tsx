'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { SegmentedControl } from '../../ui/SegmentedControl';
import { Toggle } from '../../ui/Toggle';
import { TopBar } from '../../components/TopBar';
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
  { value: 'light', label: 'Light', icon: <Icon name="sun" size={13} /> },
  { value: 'dark',  label: 'Dark',  icon: <Icon name="moon" size={13} /> },
  { value: 'auto',  label: 'Auto' },
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

      {/* <SettingsRow
        label="Default view"
        description="What members see when they open the workspace."
      >
        <SegmentedControl
          options={DEFAULT_VIEW_OPTIONS}
          value={defaultView}
          onChange={updateView => setDefaultView(updateView)}
          groupLabel="Default view"
        />
      </SettingsRow> */}

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

      {/* <SettingsRow
        label="Weekly digest"
        description="Every Monday at 9am, a short note on what shipped."
      >
        <Toggle
          checked={weeklyDigestOn}
          onChange={setWeeklyDigestOn}
          label="Weekly digest emails"
        />
      </SettingsRow> */}
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
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--paper)' }}>

        <TopBar title="Settings" searchQuery={searchQuery} onSearchChange={setSearchQuery} />

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
