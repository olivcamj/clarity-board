import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ReactNode } from 'react';

interface DroppableProps {
  id: string;
  items: string[];
  children: ReactNode;
  className?: string;
  label?: string;
}

export function Droppable({ id, items, children, className = '', label }: DroppableProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <SortableContext id={id} items={items} strategy={verticalListSortingStrategy}>
      <section
        ref={setNodeRef}
        aria-label={label}
        className={`flex flex-col rounded-xl min-h-96 shrink-0 transition-colors ${
          isOver ? 'bg-slate-soft ring-2 ring-slate' : 'bg-bone'
        } ${className}`}
        style={{ gap: 8, padding: 14, borderRadius: 12 }}
      >
        {children}
      </section>
    </SortableContext>
  );
}
