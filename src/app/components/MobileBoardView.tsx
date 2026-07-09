'use client';

import { useState } from 'react';
import type { Task } from '@/types/task';
import { Icon } from '../ui/Icon';
import { TaskCard } from './TaskCard';

interface ColumnMeta {
  dot: string;
  badge: string;
}

interface MobileBoardViewProps {
  columns: Record<string, { name: string; items: Task[] }>;
  columnMeta: Record<string, ColumnMeta>;
  onTaskClick: (taskId: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onAddTask: (columnId: string) => void;
}

export function MobileBoardView({
  columns,
  columnMeta,
  onTaskClick,
  onToggleSubtask,
  onAddTask,
}: MobileBoardViewProps) {
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  const toggleCollapsed = (columnId: string) => {
    setCollapsedIds(prev => {
      const next = new Set(prev);
      if (next.has(columnId)) next.delete(columnId);
      else next.add(columnId);
      return next;
    });
  };

  return (
    <div className="md:hidden px-[16px] py-[16px]">
      <p className="font-ui text-[12px] text-ash italic mb-[16px] px-[2px]">
        Board layout is not supported on small screens — showing tasks grouped by column instead.
      </p>

      {Object.entries(columns).map(([columnId, column]) => {
        const meta = columnMeta[columnId];
        const collapsed = collapsedIds.has(columnId);
        return (
          <section key={columnId} className="mb-[14px] border border-chalk rounded-[10px] overflow-hidden">
            <button
              type="button"
              onClick={() => toggleCollapsed(columnId)}
              aria-expanded={!collapsed}
              className="w-full flex items-center gap-[8px] px-[14px] py-[12px] bg-bone"
            >
              <span
                aria-hidden="true"
                className="w-[7px] h-[7px] rounded-full shrink-0"
                style={{ background: meta?.dot ?? 'var(--chalk)' }}
              />
              <span className="flex-1 text-left font-ui font-semibold text-ink text-[12px] uppercase tracking-widest">
                {column.name}
              </span>
              <span className="font-mono text-[11px] text-smoke" aria-label={`${column.items.length} tasks`}>
                {column.items.length}
              </span>
              {meta?.badge && (
                <span className="font-ui text-[10px] text-ash bg-paper border border-chalk rounded-full px-[7px] py-[2px]">
                  {meta.badge}
                </span>
              )}
              <Icon
                name="chevron-down"
                size={14}
                color="var(--ash)"
                style={{ transform: collapsed ? 'rotate(-90deg)' : 'none', transition: 'transform 150ms ease' }}
              />
            </button>

            {!collapsed && (
              <div className="flex flex-col gap-[8px] p-[12px] bg-paper">
                {column.items.map(item => (
                  <TaskCard
                    key={item.id}
                    task={item}
                    onClick={() => onTaskClick(item.id)}
                    onToggleSubtask={subtaskId => onToggleSubtask(item.id, subtaskId)}
                  />
                ))}

                <button
                  type="button"
                  onClick={() => onAddTask(columnId)}
                  aria-label={`Add task to ${column.name}`}
                  className="flex items-center gap-[6px] w-full px-[10px] py-[8px] rounded-[8px] text-[12px] font-ui text-ash border border-dashed border-chalk bg-transparent cursor-pointer transition-colors duration-150 hover:border-slate hover:text-slate"
                >
                  <Icon name="plus" size={12} color="currentColor" />
                  Add task
                </button>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
