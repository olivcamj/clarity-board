'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { createContext, useContext, type ReactNode } from 'react';

type Listeners = Record<string, Function> | undefined;

const DragListenersCtx = createContext<Listeners>(undefined);

export function useDragListeners() {
  return useContext(DragListenersCtx);
}

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
    <DragListenersCtx.Provider value={listeners}>
      <div
        ref={setNodeRef}
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
          opacity: isDragging ? 0 : 1,
        }}
        className="select-none"
        {...attributes}
      >
        {children}
      </div>
    </DragListenersCtx.Provider>
  );
}
