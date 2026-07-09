'use client';

import { useActionState, useState } from 'react';
import { useWorkspace } from '../../lib/WorkspaceContext';
import { Button } from '../../ui/Button';
import { SubmitButton } from '../../ui/SubmitButton';
import { Icon } from '../../ui/Icon';

type Mode = 'closed' | 'menu' | 'team' | 'board';

export function CreateMenu() {
  const { teams, createTeam, createBoard } = useWorkspace();
  const [mode, setMode] = useState<Mode>('closed');
  const [teamId, setTeamId] = useState('');

  function reset() {
    setMode('closed');
    setTeamId('');
  }

  const [, teamAction] = useActionState(
    async (_prev: null, formData: FormData) => {
      const name = (formData.get('name') as string).trim();
      if (!name) return null;
      await createTeam(name);
      reset();
      return null;
    },
    null
  );

  const [, boardAction] = useActionState(
    async (_prev: null, formData: FormData) => {
      const name = (formData.get('name') as string).trim();
      const tid = formData.get('teamId') as string;
      if (!name || !tid) return null;
      await createBoard(tid, name);
      reset();
      return null;
    },
    null
  );

  if (mode === 'team') {
    return (
      <form action={teamAction} className="flex items-center gap-[8px]">
        <input
          autoFocus
          name="name"
          type="text"
          onKeyDown={e => { if (e.key === 'Escape') reset(); }}
          placeholder="Team name…"
          className="text-[13px] font-ui bg-bone border border-chalk rounded-[6px] px-[10px] py-[6px] outline-none focus:border-slate transition-colors duration-150"
        />
        <SubmitButton variant="solid" size="sm">Create</SubmitButton>
        <Button type="button" variant="ghost" size="sm" onClick={reset}>Cancel</Button>
      </form>
    );
  }

  if (mode === 'board') {
    return (
      <form action={boardAction} className="flex items-center gap-[8px]">
        <select
          autoFocus
          name="teamId"
          value={teamId}
          onChange={e => setTeamId(e.target.value)}
          className="text-[13px] font-ui bg-bone border border-chalk rounded-[6px] px-[10px] py-[6px] outline-none focus:border-slate transition-colors duration-150"
        >
          <option value="" disabled>Choose a team…</option>
          {teams.map(team => (
            <option key={team.id} value={team.id}>{team.name}</option>
          ))}
        </select>
        <input
          name="name"
          type="text"
          onKeyDown={e => { if (e.key === 'Escape') reset(); }}
          placeholder="Board name…"
          className="text-[13px] font-ui bg-bone border border-chalk rounded-[6px] px-[10px] py-[6px] outline-none focus:border-slate transition-colors duration-150"
        />
        <SubmitButton variant="solid" size="sm" disabled={!teamId}>Create</SubmitButton>
        <Button type="button" variant="ghost" size="sm" onClick={reset}>Cancel</Button>
      </form>
    );
  }

  if (mode === 'menu') {
    return (
      <div className="flex items-center gap-[6px]">
        <Button type="button" variant="outline" size="sm" onClick={() => setMode('team')}>New team</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setMode('board')} disabled={teams.length === 0}>New board</Button>
        <Button type="button" variant="ghost" size="sm" onClick={reset}>Cancel</Button>
      </div>
    );
  }

  return (
    <Button type="button" variant="solid" size="sm" onClick={() => setMode('menu')}>
      <Icon name="plus" size={11} color="#fff" />
      New
    </Button>
  );
}
