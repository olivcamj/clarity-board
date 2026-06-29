'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { useWorkspace } from '../../lib/WorkspaceContext';
import { Button } from '../../ui/Button';
import { SubmitButton } from '../../ui/SubmitButton';
import { Icon } from '../../ui/Icon';
import { TopBar } from '../../components/TopBar';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { TeamsSkeleton } from './loading';
import type { Board } from '../../lib/api/boards';

function BoardCard({
  board,
  onDelete,
}: {
  board: Board;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative group">
      <Link
        href={`/taskboard?boardId=${board.id}`}
        className="flex flex-col gap-[6px] p-[18px] rounded-[10px] border border-chalk bg-paper transition-colors duration-150 hover:border-slate no-underline"
      >
        <span className="font-ui font-medium text-[14px] text-ink group-hover:text-slate transition-colors duration-150 leading-snug pr-[24px]">
          {board.name}
        </span>
        {board.taskCount !== undefined && (
          <span className="font-mono text-[11px] text-ash">
            {board.taskCount} task{board.taskCount !== 1 ? 's' : ''}
          </span>
        )}
      </Link>

      {/* ⋮ menu */}
      <div className="absolute top-[10px] right-[10px]">
        <button
          type="button"
          onClick={e => { e.preventDefault(); setMenuOpen(v => !v); }}
          className="opacity-0 group-hover:opacity-100 focus:opacity-100 flex items-center justify-center w-[22px] h-[22px] rounded-[4px] text-ash hover:text-ink hover:bg-sand transition-all duration-150 font-ui text-[14px] leading-none"
          aria-label="Board options"
        >
          ⋮
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-[26px] z-20 bg-paper border border-chalk rounded-[8px] shadow-md py-[4px] min-w-[140px]">
              <button
                type="button"
                onClick={() => { setMenuOpen(false); onDelete(); }}
                className="w-full text-left px-[12px] py-[7px] font-ui text-[12px] text-rose hover:bg-rose-soft transition-colors duration-150"
              >
                Delete board
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function NewBoardCard({ teamId }: { teamId: string }) {
  const { createBoard } = useWorkspace();
  const [creating, setCreating] = useState(false);

  const [, formAction] = useActionState(
    async (_prev: null, formData: FormData) => {
      const name = (formData.get('boardName') as string).trim();
      if (!name) return null;
      await createBoard(teamId, name);
      setCreating(false);
      return null;
    },
    null
  );

  if (creating) {
    return (
      <form action={formAction} className="flex items-center gap-[8px] p-[14px] rounded-[10px] border border-slate bg-paper">
        <input
          autoFocus
          name="boardName"
          type="text"
          onKeyDown={e => { if (e.key === 'Escape') setCreating(false); }}
          placeholder="Board name…"
          className="flex-1 text-[13px] font-ui bg-transparent border-0 outline-none text-ink placeholder:text-ash min-w-0"
        />
        <SubmitButton variant="solid" size="sm">Add</SubmitButton>
        <Button type="button" variant="ghost" size="sm" onClick={() => setCreating(false)}>
          Cancel
        </Button>
      </form>
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

  const [, formAction] = useActionState(
    async (_prev: null, formData: FormData) => {
      const name = (formData.get('teamName') as string).trim();
      if (!name) return null;
      await createTeam(name);
      setOpen(false);
      return null;
    },
    null
  );

  if (!open) {
    return (
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <Icon name="plus" size={13} color="var(--ash)" />
        New team
      </Button>
    );
  }

  return (
    <form action={formAction} className="flex items-center gap-[8px]">
      <input
        autoFocus
        name="teamName"
        type="text"
        onKeyDown={e => { if (e.key === 'Escape') setOpen(false); }}
        placeholder="Team name…"
        className="text-[13px] font-ui bg-bone border border-chalk rounded-[6px] px-[10px] py-[6px] outline-none focus:border-slate transition-colors duration-150"
      />
      <SubmitButton variant="solid" size="sm">Create</SubmitButton>
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
        Cancel
      </Button>
    </form>
  );
}

type DeleteTarget = { kind: 'board'; boardId: string; boardName: string; teamId: string } | { kind: 'team'; teamId: string; teamName: string } | null;

export default function TeamsPage() {
  const { teams, boardsByTeam, deleteTeam, deleteBoard, loading, error } = useWorkspace();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmTitle = deleteTarget === null ? '' : deleteTarget.kind === 'board'
    ? `Delete "${deleteTarget.boardName}"?`
    : `Delete "${deleteTarget.teamName}"?`;

  const confirmMessage = deleteTarget === null ? '' : deleteTarget.kind === 'board'
    ? 'This will permanently delete the board and all its tasks. This cannot be undone.'
    : 'This will permanently delete the team, all its boards, and every task inside them. This cannot be undone.';

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.kind === 'board') {
        await deleteBoard(deleteTarget.boardId, deleteTarget.teamId);
      } else {
        await deleteTeam(deleteTarget.teamId);
      }
      setDeleteTarget(null);
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <TeamsSkeleton />;

  if (error) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--paper)' }}>
        <TopBar title="Teams" searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 57px)' }}>
          <p className="font-ui text-[13px]" style={{ color: 'var(--rose)' }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--paper)' }}>
      <TopBar title="Teams" searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <div className="px-[40px] py-[40px]">
        <div className="flex items-start justify-between mb-[40px]">
          <div>
            <p className="font-ui text-[13px] text-ash m-0">
              {teams.length === 0
                ? 'Create a team to get started.'
                : `${teams.length} team${teams.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <NewTeamForm />
        </div>

        {teams.length === 0 && (
          <div className="flex flex-col items-center justify-center py-[80px]">
            <p className="font-ui text-[14px] text-ash text-center">
              You&rsquo;re not part of any teams yet.
            </p>
          </div>
        )}

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
                  <Button
                    size='md'
                    onClick={() => setDeleteTarget({ kind: 'team', teamId: team.id, teamName: team.name })}
                    className="font-ui text-[11px] text-ash hover:text-rose transition-colors duration-150 shrink-0"
                  >
                    Delete team
                  </Button>
                </div>

                <div
                  className="grid gap-[12px]"
                  style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}
                >
                  {boards.map(board => (
                    <BoardCard
                      key={board.id}
                      board={board}
                      onDelete={() => setDeleteTarget({ kind: 'board', boardId: board.id, boardName: board.name, teamId: team.id })}
                    />
                  ))}
                  <NewBoardCard teamId={team.id} />
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={confirmTitle}
        message={confirmMessage}
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
