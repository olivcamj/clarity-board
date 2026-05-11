import { useDroppable } from '@dnd-kit/react';
import { ReactNode } from 'react';

interface DroppableProps {
  id: string;
  children: ReactNode;
  className?: string;
  label?: string;
}

export function Droppable({ id, children, className = '', label }: DroppableProps) {
  const { ref, isDropTarget } = useDroppable({ id });
  return (
    <section
      ref={ref}
      aria-label={label}
      className={`flex flex-col rounded-xl min-h-96 shrink-0 transition-colors ${
        isDropTarget ? 'bg-slate-soft ring-2 ring-slate' : 'bg-bone'
      } ${className}`}
      style={{ gap: 8, padding: 14, borderRadius: 12 }}
    >
      {children}
    </section>
  );
}
