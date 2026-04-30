import { useDraggable } from '@dnd-kit/react';
import { ReactNode } from 'react';

interface DraggableProps {
  id: string | number;
  children: ReactNode;
}

export function Draggable({ id, children }: DraggableProps) {
  const { ref, isDragging } = useDraggable({ id });
  return (
    <div
      ref={ref}
      className={`bg-white rounded-lg border border-gray-200 shadow-sm p-4 cursor-grab active:cursor-grabbing transition-opacity select-none ${
        isDragging ? 'opacity-40 shadow-lg' : 'opacity-100 hover:shadow-md'
      }`}
    >
      {children}
    </div>
  );
}
