'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { io } from 'socket.io-client';
import { DragDropProvider } from '@dnd-kit/react';
import { Draggable } from '../components/Draggable';
import { Droppable } from '../components/Droppable';

// TODO: swap out with actual board and tasks
const initialColumns = {
  todo: {
    name: 'To Do',
    items: [
      { name: 'something here', id: 1, content: "let's do this" },
      { name: 'hello', id: 2, content: 'prolific' },
    ],
  },
  in_review: {
    name: 'In Review',
    items: [],
  },
  approved: {
    name: 'Approved',
    items: [],
  },
};

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL);

export default function TaskBoard() {
  const { user } = useUser();
  const [columns, setColumns] = useState(initialColumns);

  return (
    <DragDropProvider
      onDragEnd={(event) => {
        if (event.canceled) return;

        const sourceId = event.operation.source?.id;
        const targetColumnId = event.operation.target?.id as string;

        if (!sourceId || !targetColumnId) return;

        setColumns((prev) => {
          const sourceColumnId = (Object.keys(prev) as (keyof typeof prev)[]).find((colId) =>
            prev[colId].items.some((item) => String(item.id) === String(sourceId))
          );

          if (!sourceColumnId || sourceColumnId === targetColumnId) return prev;

          const sourceCol = prev[sourceColumnId];
          const targetCol = prev[targetColumnId as keyof typeof prev];
          const movedItem = sourceCol.items.find((item) => String(item.id) === String(sourceId));

          if (!movedItem) return prev;

          const updated = {
            ...prev,
            [sourceColumnId]: {
              ...sourceCol,
              items: sourceCol.items.filter((item) => item.id !== movedItem.id),
            },
            [targetColumnId]: {
              ...targetCol,
              items: [...targetCol.items, movedItem],
            },
          };

          socket.emit('update-tasks', updated);
          return updated;
        });
      }}
    >
      <div className="flex gap-4 p-6">
        {Object.entries(columns).map(([columnId, column]) => (
          <Droppable key={columnId} id={columnId}>
            <h2 className="font-semibold text-gray-500 text-xs uppercase tracking-widest mb-2">
              {column.name}
            </h2>
            {column.items.map((item) => (
              <Draggable key={item.id} id={String(item.id)}>
                <strong className="text-sm font-semibold text-gray-900">{item.name}</strong>
                <p className="text-sm text-gray-500 mt-1">{item.content}</p>
              </Draggable>
            ))}
          </Droppable>
        ))}
      </div>
    </DragDropProvider>
  );
}
