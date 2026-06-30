'use client';

import { useMemo, useState } from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { Draggable } from '../../components/Draggable';
import { Droppable } from '../../components/Droppable';
import { BoardHeader } from '../../components/BoardHeader';
import { TaskCard } from '../../components/TaskCard';
import { TaskModal } from '../../components/TaskModal';
import type { TeamMemberOption } from '../../components/TaskModal';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { LABELS, PEOPLE_BY_ID } from '../../data/labels';
import type { Task, Status } from '../../types/task';

const COLUMN_META: Record<string, { dot: string; badge: string; status: Status }> = {
  todo:      { dot: 'var(--chalk)', badge: 'next up',       status: 'todo'   },
  in_review: { dot: 'var(--ochre)', badge: 'waiting on us', status: 'review' },
  approved:  { dot: 'var(--sage)',  badge: 'this sprint',   status: 'done'   },
};

const STATUS_TO_COLUMN: Record<Status, string> = {
  todo:   'todo',
  doing:  'todo',
  review: 'in_review',
  done:   'approved',
};

const COLUMN_NAMES: Record<string, string> = {
  todo:      'To Do',
  in_review: 'In Review',
  approved:  'Approved',
};

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

interface DemoTaskboardClientProps {
  boardId: string;
  boardName: string;
  sprint: string;
  initialTasks: Task[];
  teamMembers: TeamMemberOption[];
  teamNames: string[];
}

export function DemoTaskboardClient({
  boardId,
  boardName,
  sprint,
  initialTasks,
  teamMembers,
  teamNames,
}: DemoTaskboardClientProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [createColumnId, setCreateColumnId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const columns = useMemo(() => tasksToColumns(tasks), [tasks]);

  const selectedTask = selectedTaskId
    ? tasks.find(t => t.id === selectedTaskId) ?? null
    : null;

  const doneTasks = tasks.filter(task => task.status === 'done').length;
  const progress = tasks.length ? Math.round((doneTasks / tasks.length) * 100) : 0;
  const columnOptions = Object.entries(columns).map(([id, col]) => ({ id, name: col.name }));

  const filteredColumns = searchQuery.trim()
    ? (() => {
        const query = searchQuery.toLowerCase();
        return Object.fromEntries(
          Object.entries(columns).map(([id, col]) => [
            id,
            {
              ...col,
              items: col.items.filter(task =>
                task.title.toLowerCase().includes(query) ||
                (task.labels ?? []).some(l => LABELS[l]?.name.toLowerCase().includes(query)) ||
                (task.assignees ?? []).some(aid => (PEOPLE_BY_ID[aid] ?? '').toLowerCase().includes(query))
              ),
            },
          ])
        );
      })()
    : columns;

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    if (!over) return;

    const activeTaskId = String(active.id);
    const overId = String(over.id);
    if (activeTaskId === overId) return;

    const sourceColId = Object.keys(columns).find(cid =>
      columns[cid].items.some(task => task.id === activeTaskId)
    );
    const targetColId = Object.keys(columns).find(cid =>
      cid === overId || columns[cid].items.some(t => t.id === overId)
    );
    if (!sourceColId || !targetColId) return;

    if (sourceColId !== targetColId) {
      const newStatus = COLUMN_META[targetColId]?.status ?? 'todo';
      setTasks(prev =>
        prev.map(task => task.id === activeTaskId ? { ...task, status: newStatus } : task)
      );
    } else {
      const sourceItems = columns[sourceColId].items;
      const oldIndex = sourceItems.findIndex(task => task.id === activeTaskId);
      const newIndex = sourceItems.findIndex(task => task.id === overId);
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(sourceItems, oldIndex, newIndex);
        setTasks(prev => {
          const otherTasks = prev.filter(task => STATUS_TO_COLUMN[task.status] !== sourceColId);
          return [...reordered, ...otherTasks];
        });
      }
    }
  }

  function handleCreateTask(
    fields: Pick<Task, 'title' | 'description' | 'priority' | 'labels' | 'due' | 'sprint' | 'subtasks' | 'assignees'>,
    colId: string
  ) {
    const meta = COLUMN_META[colId];
    const newTask: Task = {
      ...fields,
      id: `DEMO-${Date.now()}`,
      status: meta?.status ?? 'todo',
    };
    setTasks(prev => [...prev, newTask]);
    setCreateColumnId(null);
  }

  function handleUpdateTask(taskId: string, updated: Task) {
    setTasks(prev => prev.map(task => task.id === taskId ? { ...task, ...updated } : task));
    setSelectedTaskId(null);
  }

  function handleDeleteTask(taskId: string) {
    setTasks(prev => prev.filter(task => task.id !== taskId));
    setSelectedTaskId(null);
  }

  function handleToggleSubtask(taskId: string, subtaskId: string) {
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId
          ? {
              ...task,
              subtasks: (task.subtasks ?? []).map(subtask =>
                subtask.id === subtaskId ? { ...subtask, done: !subtask.done } : subtask
              ),
            }
          : task
      )
    );
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--paper)' }}>
      <BoardHeader
        sprintCode={`${sprint.toUpperCase()} · DEMO`}
        sprintLabel={`${sprint}, looking sharp`}
        boardName={boardName}
        subtitle={`${doneTasks} of ${tasks.length} done — you're on track.`}
        progress={progress}
        teamNames={teamNames}
        onNewTask={() => setCreateColumnId('header')}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="flex-1 overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={({ active }: DragStartEvent) => setActiveId(String(active.id))}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <div className="flex min-w-max mx-auto" style={{ gap: 20, padding: '24px' }}>
            {Object.entries(filteredColumns).map(([columnId, column]) => {
              const meta = COLUMN_META[columnId];
              return (
                <Droppable
                  key={columnId}
                  id={columnId}
                  items={column.items.map(task => task.id)}
                  label={column.name}
                  className="w-[260px] sm:w-72 xl:w-80"
                >
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

                  {column.items.map(item => (
                    <Draggable key={item.id} id={item.id}>
                      <TaskCard
                        task={item}
                        onClick={() => setSelectedTaskId(item.id)}
                        onToggleSubtask={(subtaskId) => handleToggleSubtask(item.id, subtaskId)}
                      />
                    </Draggable>
                  ))}

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
            {activeId
              ? (() => {
                  const activeTask = tasks.find(t => t.id === activeId);
                  return activeTask ? <TaskCard task={activeTask} /> : null;
                })()
              : null}
          </DragOverlay>
        </DndContext>
      </div>

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          teamMembers={teamMembers}
          onClose={() => setSelectedTaskId(null)}
          onSave={async (updated) => handleUpdateTask(updated.id, updated)}
          onDelete={async () => handleDeleteTask(selectedTask.id)}
          onToggleSubtask={(subtaskId) => handleToggleSubtask(selectedTask.id, subtaskId)}
        />
      )}

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
    </div>
  );
}
