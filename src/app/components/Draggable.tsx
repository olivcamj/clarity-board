import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ReactNode } from 'react';

interface DraggableProps {
  id: string;
  children: ReactNode;
}

export function Draggable({ id, children }: DraggableProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0 : 1,
      }}
      className="select-none"
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}
