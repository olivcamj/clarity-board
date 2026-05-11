import { useSortable } from '@dnd-kit/react/sortable';
import { RestrictToElement } from '@dnd-kit/dom/modifiers';
import { ReactNode } from 'react';

interface DraggableProps {
  id: string | number;
  index: number;
  group: string;
  children: ReactNode;
  container?: HTMLElement | null;
}

export function Draggable({ id, index, group, children, container }: DraggableProps) {
  const { ref, isDragging } = useSortable({
    id,
    index,
    group,
    modifiers: container ? [RestrictToElement.configure({ element: container })] : [],
  });
  return (
    <div
      ref={ref}
      className="select-none"
      style={{ opacity: isDragging ? 0.4 : 1, transition: 'opacity 150ms' }}
    >
      {children}
    </div>
  );
}
