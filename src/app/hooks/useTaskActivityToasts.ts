'use client';

import { useEffect } from 'react';
import { useSocket } from '../lib/SocketContext';
import { useToast } from '../lib/ToastContext';
import type { TaskActivityPayload } from '../types/socket';

const VERB: Record<TaskActivityPayload['type'], string> = {
  created: 'added',
  updated: 'updated',
  deleted: 'deleted',
};

// Listens for task:activity on the current board and pops a toast for
// teammates' actions — skips events the current user caused themselves,
// since they already saw the change happen live.
export function useTaskActivityToasts(boardId: string | null, currentUserId: string | null): void {
  const { socket } = useSocket();
  const { push } = useToast();

  useEffect(() => {
    if (!socket || !boardId) return;

    const onActivity = (payload: TaskActivityPayload) => {
      if (payload.boardId !== boardId) return;
      if (payload.actor.id === currentUserId) return;
      push(`${payload.actor.name} ${VERB[payload.type]} '${payload.taskTitle}'`);
    };

    socket.on('task:activity', onActivity);
    return () => {
      socket.off('task:activity', onActivity);
    };
  }, [socket, boardId, currentUserId, push]);
}
