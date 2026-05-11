'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { io } from 'socket.io-client';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Draggable } from '../components/Draggable';
import { Droppable } from '../components/Droppable';
import { BoardHeader } from '../components/BoardHeader';
import { TaskCard } from '../components/TaskCard';
import { TaskModal } from '../components/TaskModal';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { PEOPLE_BY_ID } from '../data/labels';
import type { Task, Status } from '@/types/task';

// Column display metadata — dot color, label badge, status for new tasks
const COLUMN_META: Record<string, { dot: string; badge: string; status: Status }> = {
  todo:      { dot: 'var(--chalk)', badge: 'next up',       status: 'todo'   },
  in_review: { dot: 'var(--ochre)', badge: 'waiting on us', status: 'review' },
  approved:  { dot: 'var(--sage)',  badge: 'this sprint',   status: 'done'   },
};

const initialColumns: Record<string, { name: string; items: Task[] }> = {
  todo: {
    name: 'To Do',
    items: [
      {
        id: 'task-1',
        title: 'Redesign onboarding flow',
        description: 'Revamp the new user experience based on recent UX research findings.',
        status: 'todo',
        priority: 'high',
        labels: ['design', 'frontend'],
        assignees: ['u1', 'u3'],
        due: 'May 10',
        comments: 3,
      },
      {
        id: 'task-2',
        title: 'Fix auth token refresh bug',
        description: 'Tokens expire silently on long sessions — users get 401s without warning.',
        status: 'todo',
        priority: 'high',
        labels: ['bug', 'backend'],
        assignees: ['u2'],
        due: 'May 8',
        comments: 5,
        subtasks: [
          { id: 's1', text: 'Reproduce reliably in staging', done: true },
          { id: 's2', text: 'Patch refresh interceptor', done: false },
          { id: 's3', text: 'Add integration test', done: false },
        ],
      },
      {
        id: 'task-3',
        title: 'Draft sprint retrospective template',
        status: 'todo',
        priority: 'low',
        labels: ['research'],
        assignees: ['u4'],
        ai: true,
      },
    ],
  },
  in_review: {
    name: 'In Review',
    items: [
      {
        id: 'task-4',
        title: 'Migrate board API to NestJS',
        description: 'Move all board CRUD endpoints from Express handlers to the new NestJS module.',
        status: 'review',
        priority: 'med',
        labels: ['backend', 'infra'],
        assignees: ['u2', 'u5'],
        comments: 2,
        attachments: [{ kind: 'link', label: 'PR #42' }],
      },
      {
        id: 'task-5',
        title: 'Accessibility audit — task cards',
        status: 'review',
        priority: 'med',
        labels: ['frontend', 'design'],
        assignees: ['u6'],
      },
    ],
  },
  approved: {
    name: 'Approved',
    items: [
      {
        id: 'task-6',
        title: 'Set up Prisma schema',
        status: 'done',
        priority: 'low',
        labels: ['backend', 'infra'],
        assignees: ['u2'],
        comments: 1,
      },
    ],
  },
};

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL);

export default function TaskBoard() {
  const { user } = useUser();
  const [columns, setColumns] = useState(initialColumns);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  // null = closed, string = creating in that column, 'header' = creating from header (shows column picker)
  const [createColumnId, setCreateColumnId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const selectedTask = selectedTaskId
    ? Object.values(columns).flatMap(c => c.items).find(t => t.id === selectedTaskId)
    : null;

  // Derived header data
  const allTasks  = Object.values(columns).flatMap(c => c.items);
  const doneTasks = allTasks.filter(t => t.status === 'done').length;
  const progress  = allTasks.length ? Math.round((doneTasks / allTasks.length) * 100) : 0;
  const teamNames = [
    ...new Set(
      allTasks
        .flatMap(t => t.assignees ?? [])
        .map(id => PEOPLE_BY_ID[id])
        .filter((n): n is string => Boolean(n))
    ),
  ];
  const columnOptions = Object.entries(columns).map(([id, col]) => ({ id, name: col.name }));

  const handleCreateTask = (
    fields: Pick<Task, 'title' | 'description' | 'priority' | 'labels' | 'due' | 'sprint' | 'subtasks'>,
    colId: string
  ) => {
    const meta = COLUMN_META[colId];
    const newTask: Task = {
      id: `task-${Date.now()}`,
      status: meta?.status ?? 'todo',
      ...fields,
    };
    setColumns(prev => ({
      ...prev,
      [colId]: {
        ...prev[colId],
        items: [...prev[colId].items, newTask],
      },
    }));
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--paper)' }}>
      <BoardHeader
        sprintCode="SPRINT 14 · APR 22 – MAY 5"
        sprintLabel="Sprint 14, looking sharp"
        boardName="The board"
        subtitle={`${doneTasks} of ${allTasks.length} done — you're on track.`}
        progress={progress}
        teamNames={teamNames}
        onNewTask={() => setCreateColumnId('header')}
      />

      <div className="flex-1 overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={({ active }: DragStartEvent) => setActiveId(String(active.id))}
          onDragEnd={({ active, over }: DragEndEvent) => {
            setActiveId(null);
            if (!over) return;

            const activeId = String(active.id);
            const overId   = String(over.id);
            if (activeId === overId) return;

            setColumns((prev) => {
              const sourceColId = Object.keys(prev).find(cid =>
                prev[cid].items.some(t => t.id === activeId)
              );
              // `over` can be a column id or an item id
              const targetColId = Object.keys(prev).find(cid =>
                cid === overId || prev[cid].items.some(t => t.id === overId)
              );
              if (!sourceColId || !targetColId) return prev;

              const sourceItems = [...prev[sourceColId].items];
              const oldIndex    = sourceItems.findIndex(t => t.id === activeId);

              if (sourceColId === targetColId) {
                const newIndex = sourceItems.findIndex(t => t.id === overId);
                return {
                  ...prev,
                  [sourceColId]: { ...prev[sourceColId], items: arrayMove(sourceItems, oldIndex, newIndex) },
                };
              }

              const [moved]     = sourceItems.splice(oldIndex, 1);
              const targetItems = [...prev[targetColId].items];
              const overIndex   = targetItems.findIndex(t => t.id === overId);
              targetItems.splice(overIndex >= 0 ? overIndex : targetItems.length, 0, moved);

              socket.emit('update-tasks');
              return {
                ...prev,
                [sourceColId]: { ...prev[sourceColId], items: sourceItems },
                [targetColId]: { ...prev[targetColId], items: targetItems },
              };
            });
          }}
          onDragCancel={() => setActiveId(null)}
        >
          <div
            className="flex min-w-max mx-auto"
            style={{ gap: 20, padding: '24px' }}
          >
            {Object.entries(columns).map(([columnId, column]) => {
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
                        onToggleSubtask={(subtaskId) => {
                          setColumns((prev) => {
                            const col   = prev[columnId];
                            const tasks = col.items.map((t) =>
                              t.id !== item.id ? t : {
                                ...t,
                                subtasks: (t.subtasks ?? []).map((s) =>
                                  s.id === subtaskId ? { ...s, done: !s.done } : s
                                ),
                              }
                            );
                            return { ...prev, [columnId]: { ...col, items: tasks } };
                          });
                        }}
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

          <DragOverlay>
            {activeId ? (() => {
              const activeTask = Object.values(columns).flatMap(c => c.items).find(t => t.id === activeId);
              return activeTask ? <TaskCard task={activeTask} /> : null;
            })() : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Task detail / edit modal */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => setSelectedTaskId(null)}
          onSave={(updated) => {
            setColumns((prev) => {
              const colId = Object.keys(prev).find(cid =>
                prev[cid].items.some(t => t.id === updated.id)
              );
              if (!colId) return prev;
              const col = prev[colId];
              return {
                ...prev,
                [colId]: { ...col, items: col.items.map(t => t.id === updated.id ? updated : t) },
              };
            });
          }}
          onToggleSubtask={(subtaskId) => {
            setColumns((prev) => {
              const colId = Object.keys(prev).find(cid =>
                prev[cid].items.some(t => t.id === selectedTask.id)
              );
              if (!colId) return prev;
              const col = prev[colId];
              return {
                ...prev,
                [colId]: {
                  ...col,
                  items: col.items.map((t) =>
                    t.id !== selectedTask.id ? t : {
                      ...t,
                      subtasks: (t.subtasks ?? []).map((s) =>
                        s.id === subtaskId ? { ...s, done: !s.done } : s
                      ),
                    }
                  ),
                },
              };
            });
          }}
        />
      )}

      {/* Create task modal */}
      {createColumnId && (
        <TaskModal
          mode="create"
          columnId={createColumnId === 'header' ? undefined : createColumnId}
          columnOptions={createColumnId === 'header' ? columnOptions : undefined}
          onClose={() => setCreateColumnId(null)}
          onCreate={handleCreateTask}
        />
      )}
    </div>
  );
}
