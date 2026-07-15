'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '../lib/SocketContext';
import type { PresenceUser, TaskViewersUpdatePayload } from '../types/socket';

// Joins the `task:{taskId}` room while a task modal is open, and returns who
// else is currently viewing that same task. Self-contained join/leave
// lifecycle (unlike useBoardPresence, which deliberately does NOT own
// join-board/leave-board since useTasks already does) — only a task modal
// ever calls this, so there's no risk of two hooks flapping the same room.
export function useTaskViewers(taskId: string | null, boardId: string | null): PresenceUser[] {
  const { socket } = useSocket();
  const [viewers, setViewers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    setViewers([]);
    if (!socket || !taskId || !boardId) return;

    // Re-emitted on every (re)connect, mirroring useTasks' join-board — the
    // server drops room membership on disconnect, so a network blip would
    // otherwise silently stop live viewer updates.
    const view = () => socket.emit('view-task', { taskId, boardId });

    view();
    socket.on('connect', view);

    const onUpdate = (payload: TaskViewersUpdatePayload) => {
      if (payload.taskId === taskId) setViewers(payload.users);
    };
    socket.on('task-viewers:update', onUpdate);

    return () => {
      socket.off('connect', view);
      socket.off('task-viewers:update', onUpdate);
      socket.emit('leave-task', { taskId });
      setViewers([]);
    };
  }, [socket, taskId, boardId]);

  return viewers;
}
