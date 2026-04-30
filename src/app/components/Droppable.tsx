import { useDroppable } from '@dnd-kit/react';
import { ReactNode } from 'react';

interface DroppableProps {
  id: string;
  children: ReactNode;
}

export function Droppable({ id, children }: DroppableProps) {
  const { ref, isDropTarget } = useDroppable({ id });
  return (
    <div
      ref={ref}
      className={`flex flex-col gap-2 rounded-xl p-4 min-h-96 w-72 transition-colors ${
        isDropTarget ? 'bg-indigo-50 ring-2 ring-indigo-300' : 'bg-gray-100'
      }`}
    >
      {children}
    </div>
  );
}
