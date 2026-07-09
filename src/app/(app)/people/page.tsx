'use client';

import { useEffect, useState } from 'react';
import { TopBar } from '../../components/TopBar';
import { Avatar } from '../../ui/Avatar';
import { useWorkspace } from '../../lib/WorkspaceContext';
import { useAuthToken } from '../../lib/auth/useAuthToken';
import { getTeamMembers, type TeamMember } from '../../lib/api/teams';

export default function PeoplePage() {
  const { teams } = useWorkspace();
  const getToken = useAuthToken();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!teams.length) return;

    let cancelled = false;
    
    async function load() {
      const token = await getToken();
      const results = await Promise.all(teams.map(team => getTeamMembers(token, team.id).catch(() => [])));
      if (cancelled) return;
      const seen = new Set<string>();
      const deduped: TeamMember[] = [];
      for (const list of results) {
        for (const member of list) {
          if (!seen.has(member.id)) { seen.add(member.id); deduped.push(member); }
        }
      }
      setMembers(deduped);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [teams, getToken]);

  return (
    <div className="min-h-screen" style={{ background: 'var(--paper)' }}>
      <TopBar title="People" searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <div className="px-[40px] py-[40px]">
        <div className="mb-[24px]">
          <p className="font-mono text-[10px] text-ash tracking-[0.1em] uppercase mb-[6px]">Workspace</p>
          <h1 className="font-display text-[38px] font-normal text-ink leading-[1.1] m-0">People</h1>
        </div>

        {loading ? (
          <div className="flex flex-col gap-[8px]">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-[12px] px-[16px] py-[12px] border border-chalk rounded-[10px] bg-paper animate-pulse">
                <div className="w-[36px] h-[36px] rounded-full bg-chalk shrink-0" />
                <div className="flex flex-col gap-[6px] flex-1">
                  <div className="h-[12px] w-[120px] rounded bg-chalk" />
                  <div className="h-[10px] w-[180px] rounded bg-chalk" />
                </div>
              </div>
            ))}
          </div>
        ) : members.length === 0 ? (
          <p className="font-ui text-[13px] text-ash italic py-[24px] text-center border border-chalk rounded-[10px]">
            No teammates yet.
          </p>
        ) : (
          <ul className="list-none m-0 p-0 border border-chalk rounded-[10px] divide-y divide-chalk overflow-hidden">
            {members.map(member => (
              <li key={member.id} className="flex items-center gap-[12px] px-[16px] py-[12px] bg-paper">
                <Avatar name={member.name || member.email} size={36} />
                <div className="flex-1 min-w-0">
                  <p className="font-ui font-medium text-[13px] text-ink m-0 truncate">{member.name || '—'}</p>
                  <p className="font-ui text-[11px] text-ash m-0 truncate">{member.email}</p>
                </div>
                <span className="font-mono text-[10px] text-ash tracking-[0.05em] uppercase shrink-0">{member.role}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
