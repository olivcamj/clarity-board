'use client';

import { Suspense, startTransition, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { Draggable } from '../../components/Draggable';
import { Droppable } from '../../components/Droppable';
import { BoardHeader } from '../../components/BoardHeader';
import { TaskCard } from '../../components/TaskCard';
import { TaskModal } from '../../components/TaskModal';
import { MobileBoardView } from '../../components/MobileBoardView';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { LABELS, PEOPLE_BY_ID } from '../../data/labels';
import { useTasks } from '../../hooks/useTasks';
import { useBoardPresence } from '../../hooks/useBoardPresence';
import { useWorkspace } from '../../lib/WorkspaceContext';
import { useAuthToken } from '../../lib/auth/useAuthToken';
import { getTeamMembers, type TeamMember } from '../../lib/api/teams';
import type { Task, Status } from '@/types/task';

function currentWeekRange(): string {
  const now = new Date();
  const sun = new Date(now);
  sun.setDate(now.getDate() - now.getDay());
  const sat = new Date(sun);
  sat.setDate(sun.getDate() + 6);
  const formattedDate = (date: Date) =>
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
  return `${formattedDate(sun)} – ${formattedDate(sat)}`;
}

//  Column metadata 

const COLUMN_META: Record<string, { dot: string; badge: string; status: Status }> = {
  todo:      { dot: 'var(--chalk)', badge: 'next up',       status: 'todo'   },
  in_review: { dot: 'var(--ochre)', badge: 'waiting on us', status: 'review' },
  approved:  { dot: 'var(--sage)',  badge: 'this sprint',   status: 'done'   },
};

// Tasks with status "doing" fall into the todo column (no separate doing column yet)
const STATUS_TO_COLUMN: Record<Status, string> = {
  todo:   'todo',
  doing:  'todo',
  review: 'in_review',
  done:   'approved',
};

// Derive column structure from flat task list

function tasksToColumns(tasks: Task[]): Record<string, { name: string; items: Task[] }> {
  const cols: Record<string, { name: string; items: Task[] }> = {
    todo:      { name: 'To Do',     items: [] },
    in_review: { name: 'In Review', items: [] },
    approved:  { name: 'Approved',  items: [] },
  };
  for (const task of tasks) {
    const colId = STATUS_TO_COLUMN[task.status] ?? 'todo';
    cols[colId].items.push(task);
  }
  return cols;
}

//  Inner board component (needs Suspense for useSearchParams)

function TaskBoardInner() {
  const searchParams = useSearchParams();
  const boardId = searchParams.get('boardId');

  const {
    tasks,
    loading,
    error,
    operationError,
    clearOperationError,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleSubtask,
    addComment,
    editComment,
    removeComment,
  } = useTasks(boardId);

  const { boardsByTeam, user } = useWorkspace();
  const getToken = useAuthToken();
  const onlineUsers = useBoardPresence(boardId);

  const currentBoard = useMemo(() => {
    for (const boards of Object.values(boardsByTeam)) {
      const found = boards.find(b => b.id === boardId);
      if (found) return found;
    }
    return null;
  }, [boardsByTeam, boardId]);

  const [activeId, setActiveId]           = useState<string | null>(null);
  const [searchQuery, setSearchQuery]     = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [createColumnId, setCreateColumnId] = useState<string | null>(null);
  const [teamMembers, setTeamMembers]       = useState<TeamMember[]>([]);

  // Fetch tasks whenever boardId changes
  useEffect(() => {
    if (boardId) fetchTasks();
  }, [boardId, fetchTasks]);

  // Find which team owns this board, then fetch its members
  useEffect(() => {
    if (!boardId) return;
    const teamId = Object.keys(boardsByTeam).find(teamId =>
      boardsByTeam[teamId].some(board => board.id === boardId)
    );
    if (!teamId) return;
    getToken().then(token => getTeamMembers(token, teamId)).then(setTeamMembers).catch(() => {});
  }, [boardId, boardsByTeam, getToken]);

  // Auto-dismiss operation errors after 4 seconds
  useEffect(() => {
    if (!operationError) return;
    const timer = setTimeout(clearOperationError, 4000);
    return () => clearTimeout(timer);
  }, [operationError, clearOperationError]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Derive columns from flat task list
  const columns = useMemo(() => tasksToColumns(tasks), [tasks]);

  const selectedTask = selectedTaskId
    ? tasks.find(t => t.id === selectedTaskId) ?? null
    : null;

  // Header derived data
  const doneTasks = tasks.filter(t => t.status === 'done').length;
  const progress  = tasks.length ? Math.round((doneTasks / tasks.length) * 100) : 0;
  const teamNames = teamMembers.map(m => m.name);
  const onlineNames = onlineUsers.map(user => user.name);
  const columnOptions = Object.entries(columns).map(([id, col]) => ({
    id,
    name: col.name,
    status: COLUMN_META[id]?.status,
  }));

  // Filtered columns for search
  const filteredColumns = searchQuery.trim()
    ? (() => {
        const q = searchQuery.toLowerCase();
        return Object.fromEntries(
          Object.entries(columns).map(([id, col]) => [
            id,
            {
              ...col,
              items: col.items.filter(task =>
                task.title.toLowerCase().includes(q) ||
                (task.labels ?? []).some(l => LABELS[l]?.name.toLowerCase().includes(q)) ||
                (task.assignees ?? []).some(aid => (PEOPLE_BY_ID[aid] ?? '').toLowerCase().includes(q))
              ),
            },
          ])
        );
      })()
    : columns;

  //  Event handlers 

  const handleCreateTask = async (
    fields: Pick<Task, 'title' | 'description' | 'priority' | 'labels' | 'due' | 'sprint' | 'subtasks'>,
    colId: string
  ) => {
    const meta = COLUMN_META[colId];
    const status: Status = meta?.status ?? 'todo';
    await createTask(fields, status);
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) { setActiveId(null); return; }

    const activeTaskId = String(active.id);
    const overId       = String(over.id);
    if (activeTaskId === overId) { setActiveId(null); return; }

    const sourceColId = Object.keys(columns).find(cid =>
      columns[cid].items.some(t => t.id === activeTaskId)
    );
    const targetColId = Object.keys(columns).find(cid =>
      cid === overId || columns[cid].items.some(t => t.id === overId)
    );
    if (!sourceColId || !targetColId) { setActiveId(null); return; }

    if (sourceColId !== targetColId) {
      // Status changed — persist to backend; useTasks' socket listener
      // picks up the resulting task:updated broadcast for other clients.
      // Hiding the drag overlay (setActiveId) and the optimistic status move
      // (inside updateTask) must land in the same commit — otherwise the
      // overlay disappears in an urgent render first, flashing the real card
      // back in its old column before the transition's render catches up.
      const newStatus = COLUMN_META[targetColId]?.status ?? 'todo';
      startTransition(() => {
        setActiveId(null);
        updateTask(activeTaskId, { status: newStatus });
      });
    } else {
      setActiveId(null);
      // Same-column reorder isn't persisted: tasks have no position field yet,
      // and columns are always derived fresh from the tasks array, so there's
      // nothing to apply locally either.
      // TODO: persist position via PATCH /api/tasks/:id { position: newIndex }
    }
  };

  //  No boardId state 

  if (!boardId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen" style={{ background: 'var(--paper)' }}>
        <p className="font-ui text-smoke text-sm">Select a board to view tasks.</p>
      </div>
    );
  }

  //  Loading state 

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen" style={{ background: 'var(--paper)' }}>
        <p className="font-ui text-smoke text-sm">Loading tasks…</p>
      </div>
    );
  }

  // Fatal load error (board couldn't load at all) 

  if (error && tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen" style={{ background: 'var(--paper)' }}>
        <p className="font-ui text-[13px] mb-[8px]" style={{ color: 'var(--rose)' }}>{error}</p>
        <button onClick={fetchTasks} className="font-ui text-[12px] text-ash underline">
          Retry
        </button>
      </div>
    );
  }

  //  Board

    return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--paper)' }}>
      <BoardHeader
        sprintCode={currentWeekRange()}
        sprintLabel="Sprint, looking sharp"
        boardName={currentBoard?.name ?? 'The Board'}
        subtitle={`${doneTasks} of ${tasks.length} done — you're on track.`}
        progress={progress}
        teamNames={teamNames}
        onlineNames={onlineNames}
        hasTeammates={teamMembers.length > 1}
        onNewTask={() => setCreateColumnId('header')}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="hidden md:block flex-1 overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={({ active }: DragStartEvent) => setActiveId(String(active.id))}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <div
            className="flex min-w-max mx-auto"
            style={{ gap: 20, padding: '24px' }}
          >
            {Object.entries(filteredColumns).map(([columnId, column]) => {
              const meta = COLUMN_META[columnId];
              return (
                <Droppable
                  key={columnId}
                  id={columnId}
                  items={column.items.map(t => t.id)}
                  label={column.name}
                  className="w-[260px] sm:w-72 xl:w-80"
                >
                  {/* Column header */}
                  <div className="flex items-center mb-[4px]" style={{ gap: 6 }}>
                    <span
                      aria-hidden="true"
                      className="w-[7px] h-[7px] rounded-full shrink-0"
                      style={{ background: meta?.dot ?? 'var(--chalk)' }}
                    />
                    <h2 className="font-ui font-semibold text-ink text-[12px] uppercase tracking-widest flex-1 m-0">
                      {column.name}
                    </h2>
                    <span className="font-mono text-[11px] text-smoke" aria-label={`${column.items.length} tasks`}>
                      {column.items.length}
                    </span>
                    {meta?.badge && (
                      <span className="font-ui text-[10px] text-ash bg-paper border border-chalk rounded-full px-[7px] py-[2px]">
                        {meta.badge}
                      </span>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Add task to ${column.name}`}
                      onClick={() => setCreateColumnId(columnId)}
                    >
                      <Icon name="plus" size={13} color="var(--ash)" />
                    </Button>
                  </div>

                  {/* Cards */}
                  {column.items.map((item) => (
                    <Draggable key={item.id} id={item.id}>
                      <TaskCard
                        task={item}
                        onClick={() => setSelectedTaskId(item.id)}
                        onToggleSubtask={(subtaskId) => toggleSubtask(item.id, subtaskId)}
                      />
                    </Draggable>
                  ))}

                  {/* Column footer — add task */}
                  <button
                    type="button"
                    onClick={() => setCreateColumnId(columnId)}
                    aria-label={`Add task to ${column.name}`}
                    className="flex items-center gap-[6px] w-full mt-[4px] px-[10px] py-[8px] rounded-[8px] text-[12px] font-ui text-ash border border-dashed border-chalk bg-transparent cursor-pointer transition-colors duration-150 hover:border-slate hover:text-slate"
                  >
                    <Icon name="plus" size={12} color="currentColor" />
                    Add task
                  </button>
                </Droppable>
              );
            })}
          </div>

          {/*
            No dropAnimation: there's no onDragOver handler moving cards
            between column SortableContexts as you drag over them, so at drop
            time the real card's DOM node is still measured in its source
            column. The default drop animation flies the overlay there before
            disappearing — visible as the card "bouncing back" — so it's
            disabled and the overlay just vanishes once the optimistic status
            update lands the real card in its new column.
          */}
          <DragOverlay dropAnimation={null}>
            {activeId
              ? (() => {
                  const activeTask = tasks.find(task => task.id === activeId);
                  return activeTask ? <TaskCard task={activeTask} /> : null;
                })()
              : null}
          </DragOverlay>
        </DndContext>
      </div>

      <MobileBoardView
        columns={filteredColumns}
        columnMeta={COLUMN_META}
        onTaskClick={setSelectedTaskId}
        onToggleSubtask={toggleSubtask}
        onAddTask={setCreateColumnId}
      />

      {/* Task detail / edit modal */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          teamMembers={teamMembers}
          columnId={STATUS_TO_COLUMN[selectedTask.status]}
          columnOptions={columnOptions}
          onClose={() => setSelectedTaskId(null)}
          onSave={(updated) => {
            updateTask(updated.id, updated);
            setSelectedTaskId(null);
          }}
          onDelete={() => {
            deleteTask(selectedTask.id);
            setSelectedTaskId(null);
          }}
          onToggleSubtask={(subtaskId) => toggleSubtask(selectedTask.id, subtaskId)}
          onAddComment={(text) => addComment(selectedTask.id, text)}
          onEditComment={(commentId, text) => editComment(selectedTask.id, commentId, text)}
          onRemoveComment={(commentId) => removeComment(selectedTask.id, commentId)}
          currentUserId={user?.id}
        />
      )}

      {/* Create task modal */}
      {createColumnId && (
        <TaskModal
          mode="create"
          teamMembers={teamMembers}
          columnId={createColumnId === 'header' ? undefined : createColumnId}
          columnOptions={createColumnId === 'header' ? columnOptions : undefined}
          onClose={() => setCreateColumnId(null)}
          onCreate={handleCreateTask}
        />
      )}

      {/* Operation error toast */}
      {operationError && (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed bottom-[24px] left-1/2 -translate-x-1/2 z-50 flex items-center gap-[10px] px-[16px] py-[11px] rounded-[10px] shadow-[var(--shadow-3)]"
          style={{ background: 'var(--ink)', maxWidth: 400 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--rose)" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          <p className="font-ui text-[13px] text-white m-0 flex-1">{operationError}</p>
          <button
            type="button"
            onClick={clearOperationError}
            aria-label="Dismiss"
            className="text-ash hover:text-white transition-colors duration-150 shrink-0"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

// ── Page export (wraps inner component in Suspense for useSearchParams) ────────

export default function TaskBoard() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--paper)' }}>
        <p className="font-ui text-smoke text-sm">Loading…</p>
      </div>
    }>
      <TaskBoardInner />
    </Suspense>
  );
}
