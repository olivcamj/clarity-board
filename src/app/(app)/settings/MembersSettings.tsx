'use client';

import { useCallback, useEffect, useState } from 'react';
import { useWorkspace } from '../../lib/WorkspaceContext';
import { useAuthToken } from '../../lib/auth/useAuthToken';
import {
  getTeamMembers,
  createInvite,
  removeTeamMember,
  type TeamMember,
  type MemberRole,
  type InviteResult,
} from '../../lib/api/teams';
import { useTeamMembersRealtime } from '../../hooks/useTeamMembersRealtime';
import { Avatar } from '../../ui/Avatar';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { SegmentedControl } from '../../ui/SegmentedControl';
import { ConfirmDialog } from '../../ui/ConfirmDialog';

function SettingsSectionLabel({ children }: { children: string }) {
  return (
    <p className="font-mono text-[10px] text-ash font-medium tracking-[0.1em] uppercase m-0 mb-[4px]">
      {children}
    </p>
  );
}

const ROLE_OPTIONS: Array<{ value: MemberRole; label: string }> = [
  { value: 'EDITOR', label: 'Editor' },
  { value: 'ADMIN',  label: 'Admin'  },
  { value: 'VIEWER', label: 'Viewer' },
];

type RemoveTarget = { teamId: string; member: TeamMember } | null;

function InvitePanel({ teamId }: { teamId: string }) {
  const getToken = useAuthToken();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<MemberRole>('EDITOR');
  const [invite, setInvite] = useState<InviteResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const token = await getToken();
      const result = await createInvite(token, teamId, role);
      setInvite(result);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!invite) return;
    await navigator.clipboard.writeText(invite.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!open) {
    return (
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <Icon name="plus" size={13} color="var(--ash)" />
        Invite member
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-[10px] p-[14px] rounded-[10px] border border-chalk bg-bone">
      <div className="flex items-center gap-[10px]">
        <SegmentedControl options={ROLE_OPTIONS} value={role} onChange={v => setRole(v)} groupLabel="Invite role" />
        <Button type="button" variant="solid" size="sm" onClick={handleGenerate} disabled={generating}>
          <Icon name="link" size={12} />
          {generating ? 'Generating…' : 'Generate link'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => { setOpen(false); setInvite(null); }}
        >
          Cancel
        </Button>
      </div>

      {invite && (
        <div className="flex flex-col gap-[4px]">
          <div className="flex items-center gap-[8px]">
            <input
              readOnly
              value={invite.url}
              onFocus={e => e.currentTarget.select()}
              className="flex-1 min-w-0 text-[12px] font-mono bg-paper border border-chalk rounded-[6px] px-[10px] py-[6px] outline-none text-ink"
            />
            <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
              {copied ? <Icon name="check" size={12} /> : null}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
          <p className="font-ui text-[11px] text-ash m-0">
            Single use — expires in 7 days.
          </p>
        </div>
      )}
    </div>
  );
}

export function MembersSettings() {
  const { teams, user } = useWorkspace();
  const getToken = useAuthToken();
  const [members, setMembers] = useState<Record<string, TeamMember[]>>({});
  const [loading, setLoading] = useState(true);
  const [removeTarget, setRemoveTarget] = useState<RemoveTarget>(null);
  const [removing, setRemoving] = useState(false);

  const teamsKey = teams.map(team => team.id).join(',');

  useEffect(() => {
    if (!teams.length) {
      setMembers({});
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      const token = await getToken();
      const results = await Promise.allSettled(
        teams.map(team => getTeamMembers(token, team.id).then(list => ({ teamId: team.id, list })))
      );
      if (cancelled) return;

      const byTeam: Record<string, TeamMember[]> = {};
      for (const result of results) {
        if (result.status === 'fulfilled') byTeam[result.value.teamId] = result.value.list;
      }
      setMembers(byTeam);
      setLoading(false);
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamsKey, getToken]);

  const handleMemberJoined = useCallback((teamId: string, member: TeamMember) => {
    setMembers(prev => {
      const existing = prev[teamId] ?? [];
      const index = existing.findIndex(m => m.id === member.id);
      const updated = index === -1 ? [...existing, member] : existing.map(m => (m.id === member.id ? member : m));
      return { ...prev, [teamId]: updated };
    });
  }, []);

  useTeamMembersRealtime(teams.map(team => team.id), handleMemberJoined);

  async function handleConfirmRemove() {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      const token = await getToken();
      await removeTeamMember(token, removeTarget.teamId, removeTarget.member.id);
      setMembers(prev => ({
        ...prev,
        [removeTarget.teamId]: (prev[removeTarget.teamId] ?? []).filter(m => m.id !== removeTarget.member.id),
      }));
      setRemoveTarget(null);
    } finally {
      setRemoving(false);
    }
  }

  return (
    <section aria-labelledby="members-heading">
      <SettingsSectionLabel>Workspace</SettingsSectionLabel>
      <h1
        id="members-heading"
        className="font-display text-[42px] font-normal leading-[1.1] text-ink m-0 mb-[32px]"
      >
        Members
      </h1>

      {loading ? (
        <div className="flex flex-col gap-[8px]">
          {[1, 2].map(i => (
            <div key={i} className="flex items-center gap-[12px] px-[16px] py-[12px] border border-chalk rounded-[10px] bg-paper animate-pulse">
              <div className="w-[36px] h-[36px] rounded-full bg-chalk shrink-0" />
              <div className="flex flex-col gap-[6px] flex-1">
                <div className="h-[12px] w-[120px] rounded bg-chalk" />
                <div className="h-[10px] w-[180px] rounded bg-chalk" />
              </div>
            </div>
          ))}
        </div>
      ) : teams.length === 0 ? (
        <p className="font-ui text-[13px] text-ash italic py-[24px] text-center border border-chalk rounded-[10px]">
          You&rsquo;re not part of any teams yet.
        </p>
      ) : (
        <div className="flex flex-col gap-[36px]">
          {teams.map(team => {
            const isAdmin = team.role === 'ADMIN';
            const teamMembers = members[team.id] ?? [];
            return (
              <div key={team.id}>
                <div className="flex items-center gap-[10px] mb-[14px]">
                  <h2 className="font-mono text-[11px] text-ash uppercase tracking-[0.08em] m-0 shrink-0">
                    {team.name}
                  </h2>
                  <div className="flex-1 h-px bg-chalk" />
                  {isAdmin && <InvitePanel teamId={team.id} />}
                </div>

                {teamMembers.length === 0 ? (
                  <p className="font-ui text-[13px] text-ash italic py-[16px] text-center border border-chalk rounded-[10px]">
                    No members yet.
                  </p>
                ) : (
                  <ul className="list-none m-0 p-0 border border-chalk rounded-[10px] divide-y divide-chalk overflow-hidden">
                    {teamMembers.map(member => (
                      <li key={member.id} className="flex items-center gap-[12px] px-[16px] py-[12px] bg-paper">
                        <Avatar name={member.name || member.email} size={36} />
                        <div className="flex-1 min-w-0">
                          <p className="font-ui font-medium text-[13px] text-ink m-0 truncate">{member.name || '—'}</p>
                          <p className="font-ui text-[11px] text-ash m-0 truncate">{member.email}</p>
                        </div>
                        <span className="font-mono text-[10px] text-ash tracking-[0.05em] uppercase shrink-0">
                          {member.role}
                        </span>
                        {isAdmin && member.id !== user?.id && (
                          <Button
                            type="button"
                            variant="ghost"
                            tone="rose"
                            size="sm"
                            onClick={() => setRemoveTarget({ teamId: team.id, member })}
                          >
                            Remove
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={removeTarget !== null}
        title={removeTarget ? `Remove ${removeTarget.member.name || removeTarget.member.email}?` : ''}
        message="They'll lose access to this team's boards immediately. This cannot be undone."
        confirmLabel="Remove"
        loading={removing}
        onConfirm={handleConfirmRemove}
        onCancel={() => setRemoveTarget(null)}
      />
    </section>
  );
}
