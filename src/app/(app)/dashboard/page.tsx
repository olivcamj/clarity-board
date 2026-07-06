'use client';

import Link from 'next/link';
import { startTransition, useEffect, useMemo, useState } from 'react';
import { useWorkspace } from '../../lib/WorkspaceContext';
import { DashboardSkeleton } from './loading';
import { useAuthToken } from '../../lib/auth/useAuthToken';
import { updateTask as apiUpdateTask } from '../../lib/api/tasks';
import { TopBar } from '../../components/TopBar';
import { StatCards } from '../../components/dashboard/StatCards';
import { MyTasksList, type MyTask } from '../../components/dashboard/MyTasksList';
import { ClaritySuggestions } from '../../components/dashboard/ClaritySuggestions';
import { ActivityFeed } from '../../components/dashboard/ActivityFeed';
import { CreateMenu } from '../../components/dashboard/CreateMenu';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import type { Status } from '../../types/task';
import type { Board } from '../../lib/api/boards';

function greeting(name: string) {
  const h = new Date().getHours();
  const time = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  return `Good ${time}, ${name.split(' ')[0]}`;
}

function dateLine() {
  return new Date()
    .toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    .toUpperCase();
}

function startOfDay(value: string) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(value + 'T00:00:00') : new Date(value);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function BoardCard({
  board,
  teamName,
  onDelete,
}: {
  board: Board;
  teamName: string;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative group">
      <Link
        href={`/taskboard?boardId=${board.id}`}
        className="flex flex-col gap-[6px] p-[16px] rounded-[10px] border border-chalk bg-paper transition-colors duration-150 hover:border-slate no-underline"
      >
        <span className="font-ui font-medium text-[13px] text-ink group-hover:text-slate transition-colors duration-150 leading-snug pr-[20px]">
          {board.name}
        </span>
        <span className="font-mono text-[10px] text-ash">{teamName}</span>
        {board.taskCount !== undefined && (
          <span className="font-mono text-[10px] text-ash">
            {board.taskCount} task{board.taskCount !== 1 ? 's' : ''}
          </span>
        )}
      </Link>
      <div className="absolute top-[8px] right-[8px]">
        <button
          type="button"
          onClick={event => { event.preventDefault(); setMenuOpen(isOpen => !isOpen); }}
          className="opacity-0 group-hover:opacity-100 focus:opacity-100 flex items-center justify-center w-[20px] h-[20px] rounded-[4px] text-ash hover:text-ink hover:bg-sand transition-all duration-150 font-ui text-[13px] leading-none"
          aria-label="Board options"
        >
          ⋮
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-[24px] z-20 bg-paper border border-chalk rounded-[8px] shadow-md py-[4px] min-w-[140px]">
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

type DeleteTarget = { boardId: string; boardName: string; teamId: string } | null;

export default function DashboardPage() {
  const { user, teams, boardsByTeam, loading, error, refetch, deleteBoard } = useWorkspace();
  const getToken = useAuthToken();
  const [searchQuery, setSearchQuery] = useState('');
  // Optimistically hide tasks being marked done while the request is in flight
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [deleting, setDeleting] = useState(false);

  // WorkspaceProvider fetches the user (and its tasks) once and persists across
  // navigation, so due-today/overdue stats go stale after editing tasks on the
  // taskboard. Refetch on every dashboard visit to pick up those changes.
  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // `/api/users/me/full` returns tasks straight from Prisma (status is the
  // raw uppercase enum), unlike the per-board task endpoint which lowercases
  // it via TaskResponseDto — normalize it here.
  const myTasks = useMemo<MyTask[]>(() => {
    if (!user) return [];
    return user.tasks
      .filter(task => task.status.toLowerCase() !== 'done' && !completingIds.has(task.id))
      .map(task => ({
        id: task.id,
        title: task.title,
        status: task.status.toLowerCase() as Status,
        due: task.due,
        board: task.board,
      }))
      .sort((taskA, taskB) => {
        if (!taskA.due && !taskB.due) return 0;
        if (!taskA.due) return 1;
        if (!taskB.due) return -1;
        return taskA.due.localeCompare(taskB.due);
      })
      .slice(0, 6);
  }, [user, completingIds]);

  const stats = useMemo(() => {
    if (!user) return { dueToday: 0, overdue: 0, inFlight: 0 };
    const today = startOfDay(new Date().toISOString());
    let dueToday = 0;
    let overdue = 0;
    let inFlight = 0;
    for (const task of user.tasks) {
      const status = task.status.toLowerCase();
      if (status === 'done') continue;
      if (status === 'doing' || status === 'review') inFlight++;
      if (task.due) {
        const due = startOfDay(task.due);
        if (due < today) overdue++;
        else if (due === today) dueToday++;
      }
    }
    return { dueToday, overdue, inFlight };
  }, [user]);

  const allBoards = useMemo(
    () => teams.flatMap(team => (boardsByTeam[team.id] ?? []).map(board => ({ board, teamName: team.name, teamId: team.id }))),
    [teams, boardsByTeam]
  );

  async function handleBoardDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteBoard(deleteTarget.boardId, deleteTarget.teamId);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  function handleComplete(taskId: string) {
    setCompletingIds(prev => new Set(prev).add(taskId));
    startTransition(async () => {
      try {
        const token = await getToken();
        await apiUpdateTask(token, taskId, { status: 'done' });
      } finally {
        refetch();
      }
    });
  }

  // Only block on the full-page skeleton for the true first load — background
  // refetches (mount-effect staleness refresh, post-complete refresh) should
  // update in place, not flash the whole page back to a loading state.
  if (loading && !user) return <DashboardSkeleton />;

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
        <div className="flex items-start justify-between mb-[24px]">
          <div>
            <p className="font-mono text-[10px] text-ash tracking-[0.1em] uppercase mb-[6px]">
              {dateLine()}
            </p>
            <h1 className="font-display text-[38px] font-normal text-ink leading-[1.1] m-0">
              {user?.name ? greeting(user.name) : 'Your workspace'}
            </h1>
          </div>
          <CreateMenu />
        </div>

        <StatCards dueToday={stats.dueToday} overdue={stats.overdue} inFlight={stats.inFlight} />

        <div className="grid gap-[32px]" style={{ gridTemplateColumns: '1fr 360px' }}>
          <MyTasksList tasks={myTasks} onComplete={handleComplete} searchQuery={searchQuery} />
          <div>
            <ClaritySuggestions />
            <ActivityFeed />
          </div>
        </div>

        {/* No. II — Your boards */}
        {allBoards.length > 0 && (
          <section className="mt-[48px]">
            <div className="mb-[14px]">
              <p className="font-mono text-[10px] text-ember tracking-[0.1em] uppercase mb-[4px]">No. II</p>
              <h2 className="font-display text-[28px] font-normal text-ink m-0">
                Your <em>boards.</em>
              </h2>
            </div>
            <div className="grid gap-[12px]" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
              {allBoards.map(({ board, teamName, teamId }) => (
                <BoardCard
                  key={board.id}
                  board={board}
                  teamName={teamName}
                  onDelete={() => setDeleteTarget({ boardId: board.id, boardName: board.name, teamId })}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={`Delete "${deleteTarget?.boardName}"?`}
        message="This will permanently delete the board and all its tasks. This cannot be undone."
        loading={deleting}
        onConfirm={handleBoardDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
