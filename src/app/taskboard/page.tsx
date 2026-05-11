'use client';

import { useState, startTransition } from 'react';
import { useUser } from '@clerk/nextjs';
import { io } from 'socket.io-client';
import { DragDropProvider } from '@dnd-kit/react';
import { isSortableOperation } from '@dnd-kit/react/sortable';
import { Draggable } from '../components/Draggable';
import { Droppable } from '../components/Droppable';
import { TaskCard } from '../components/TaskCard';
import type { Task } from '@/types/task';

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
  const [boardEl, setBoardEl] = useState<HTMLDivElement | null>(null);

  return (
    <div className="w-full overflow-x-auto" style={{ background: 'var(--paper)' }}>
    <DragDropProvider
      onDragEnd={(event) => {
        if (event.canceled) return;

        const { source, target } = event.operation;
        if (!source || !target) return;

        startTransition(() => {
          setColumns((prev) => {
            let updated = { ...prev };

            if (isSortableOperation(event.operation)) {
              const src = event.operation.source;
              const tgt = event.operation.target;
              const sourceGroup = String(src.sortable.initialGroup);
              const targetGroup = String(tgt.sortable.group);
              const sourceIdx = src.sortable.initialIndex;
              const targetIdx = tgt.sortable.index;

              if (sourceGroup === targetGroup) {
                const items = [...updated[sourceGroup].items];
                const [moved] = items.splice(sourceIdx, 1);
                items.splice(targetIdx, 0, moved);
                updated = { ...updated, [sourceGroup]: { ...updated[sourceGroup], items } };
              } else {
                const sourceItems = [...updated[sourceGroup].items];
                const [moved] = sourceItems.splice(sourceIdx, 1);
                const targetItems = [...updated[targetGroup].items];
                targetItems.splice(targetIdx, 0, moved);
                updated = {
                  ...updated,
                  [sourceGroup]: { ...updated[sourceGroup], items: sourceItems },
                  [targetGroup]: { ...updated[targetGroup], items: targetItems },
                };
              }
            } else {
              const targetColumnId = String(target.id);
              const sourceId = String(source.id);
              const sourceColumnId = Object.keys(prev).find((colId) =>
                prev[colId].items.some((item) => item.id === sourceId)
              );

              if (!sourceColumnId || sourceColumnId === targetColumnId) return prev;

              const sourceItems = [...updated[sourceColumnId].items];
              const movedIdx = sourceItems.findIndex((item) => item.id === sourceId);
              const [moved] = sourceItems.splice(movedIdx, 1);

              updated = {
                ...updated,
                [sourceColumnId]: { ...updated[sourceColumnId], items: sourceItems },
                [targetColumnId]: {
                  ...updated[targetColumnId],
                  items: [...updated[targetColumnId].items, moved],
                },
              };
            }

            return updated;
          });

          socket.emit('update-tasks');
        });
      }}
    >
      <div ref={setBoardEl} className="flex min-w-max mx-auto" style={{ gap: 20, padding: '24px' }}>
        {Object.entries(columns).map(([columnId, column]) => (
          <Droppable key={columnId} id={columnId} label={column.name} className="w-[260px] sm:w-72 xl:w-80">
            <h2 className="font-bold text-ash text-xs uppercase tracking-widest mb-2" aria-hidden="true">
              {column.name}
            </h2>
            {column.items.map((item, index) => (
              <Draggable key={item.id} id={item.id} index={index} group={columnId} container={boardEl}>
                <TaskCard
                  task={item}
                  onToggleSubtask={(subtaskId) => {
                    startTransition(() => {
                      setColumns((prev) => {
                        const col = prev[columnId];
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
                    });
                  }}
                />
              </Draggable>
            ))}
          </Droppable>
        ))}
      </div>
      </DragDropProvider>
    </div>
  );
}
