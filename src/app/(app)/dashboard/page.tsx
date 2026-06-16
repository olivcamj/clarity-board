'use client';

import Link from 'next/link';
import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { useWorkspace } from '../../lib/WorkspaceContext';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { TopBar } from '../../components/TopBar';
import type { Board } from '../../lib/api/boards';

function greeting(name: string) {
  const h = new Date().getHours();
  const time = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  return `Good ${time}, ${name.split(' ')[0]}`;
}

function BoardCard({ board }: { board: Board }) {
  return (
    <Link
      href={`/taskboard?boardId=${board.id}`}
      className="flex flex-col gap-[6px] p-[18px] rounded-[10px] border border-chalk bg-paper transition-colors duration-150 hover:border-slate no-underline group"
    >
      <span className="font-ui font-medium text-[14px] text-ink group-hover:text-slate transition-colors duration-150 leading-snug">
        {board.name}
      </span>
      {board.taskCount !== undefined && (
        <span className="font-mono text-[11px] text-ash">
          {board.taskCount} task{board.taskCount !== 1 ? 's' : ''}
        </span>
      )}
    </Link>
  );
}

function NewBoardCard({ teamId }: { teamId: string }) {
  const { createBoard } = useWorkspace();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      await createBoard(teamId, trimmed);
      setName('');
      setCreating(false);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') submit();
    if (e.key === 'Escape') { setCreating(false); setName(''); }
  }

  if (creating) {
    return (
      <div className="flex items-center gap-[8px] p-[14px] rounded-[10px] border border-slate bg-paper">
        <input
          autoFocus
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Board name…"
          className="flex-1 text-[13px] font-ui bg-transparent border-0 outline-none text-ink placeholder:text-ash min-w-0"
        />
        <Button type="button" variant="solid" size="sm" onClick={submit} disabled={!name.trim() || loading}>
          {loading ? '…' : 'Add'}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => { setCreating(false); setName(''); }}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setCreating(true)}
      className="flex items-center justify-center gap-[6px] p-[18px] rounded-[10px] border border-dashed border-chalk text-[13px] font-ui text-ash transition-colors duration-150 hover:border-slate hover:text-slate bg-transparent cursor-pointer w-full"
    >
      <Icon name="plus" size={13} color="currentColor" />
      New board
    </button>
  );
}

function NewTeamForm() {
  const { createTeam } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      await createTeam(trimmed);
      setName('');
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <Icon name="plus" size={13} color="var(--ash)" />
        New team
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-[8px]">
      <input
        autoFocus
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === 'Escape') { setOpen(false); setName(''); } }}
        placeholder="Team name…"
        className="text-[13px] font-ui bg-bone border border-chalk rounded-[6px] px-[10px] py-[6px] outline-none focus:border-slate transition-colors duration-150"
      />
      <Button type="submit" variant="solid" size="sm" disabled={!name.trim() || loading}>
        {loading ? '…' : 'Create'}
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={() => { setOpen(false); setName(''); }}>
        Cancel
      </Button>
    </form>
  );
}

export default function DashboardPage() {
  const { user, teams, boardsByTeam, loading, error } = useWorkspace();
  const [searchQuery, setSearchQuery] = useState('');

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--paper)' }}>
        <TopBar title="Home" showHomeIcon searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <div className="px-[40px] py-[40px]">
          {/* Header skeleton */}
          <div className="flex items-start justify-between mb-[40px]">
            <div className="flex flex-col gap-[12px]">
              <div className="h-[38px] w-[260px] rounded-[8px] bg-chalk animate-pulse" aria-hidden="true" />
              <div className="h-[13px] w-[80px] rounded bg-chalk animate-pulse" aria-hidden="true" />
            </div>
            <div className="h-[32px] w-[90px] rounded-[8px] bg-chalk animate-pulse" aria-hidden="true" />
          </div>

          {/* Team + board cards skeleton */}
          <div className="flex flex-col gap-[36px]">
            {[3, 2].map((cardCount, i) => (
              <section key={i} aria-hidden="true">
                <div className="flex items-center gap-[10px] mb-[14px]">
                  <div className="h-[10px] w-[64px] rounded bg-chalk animate-pulse" />
                  <div className="flex-1 h-px bg-chalk" />
                </div>
                <div className="grid gap-[12px]" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
                  {Array.from({ length: cardCount }).map((_, j) => (
                    <div key={j} className="p-[18px] rounded-[10px] border border-chalk flex flex-col gap-[8px]">
                      <div className="h-[14px] rounded bg-chalk animate-pulse" style={{ width: `${60 + j * 15}%` }} />
                      <div className="h-[10px] w-[48px] rounded bg-chalk animate-pulse" />
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--paper)' }}>
        <TopBar title="Home" showHomeIcon searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 57px)' }}>
          <p className="font-ui text-[13px]" style={{ color: 'var(--rose)' }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--paper)' }}>
      <TopBar title="Home" showHomeIcon searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <div className="px-[40px] py-[40px]">
        {/* Page header */}
        <div className="flex items-start justify-between mb-[40px]">
          <div>
            <h1 className="font-display text-[38px] font-normal text-ink leading-[1.1] mb-[4px]">
              {user?.name ? greeting(user.name) : 'Your workspace'}
            </h1>
            <p className="font-ui text-[13px] text-ash m-0">
              {teams.length === 0
                ? 'Create a team to get started.'
                : `${teams.length} team${teams.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <NewTeamForm />
        </div>

        {/* No teams empty state */}
        {teams.length === 0 && (
          <div className="flex flex-col items-center justify-center py-[80px]">
            <p className="font-ui text-[14px] text-ash text-center">
              You&rsquo;re not part of any teams yet.
            </p>
          </div>
        )}

        {/* Team sections */}
        <div className="flex flex-col gap-[36px]">
          {teams.map(team => {
            const boards = boardsByTeam[team.id] ?? [];
            return (
              <section key={team.id}>
                <div className="flex items-center gap-[10px] mb-[14px]">
                  <h2 className="font-mono text-[11px] text-ash uppercase tracking-[0.08em] m-0 shrink-0">
                    {team.name}
                  </h2>
                  <div className="flex-1 h-px bg-chalk" />
                </div>

                <div
                  className="grid gap-[12px]"
                  style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}
                >
                  {boards.map(board => (
                    <BoardCard key={board.id} board={board} />
                  ))}
                  <NewBoardCard teamId={team.id} />
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
