'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '../lib/SocketContext';
import type { PresenceUpdatePayload, PresenceUser } from '../types/socket';

// Listens for presence snapshots for a board room. Does NOT itself emit
// join-board/leave-board — useTasks(boardId) already owns that room's
// lifecycle, and having two hooks independently join/leave the same room
// risks flapping membership (especially under React StrictMode's dev
// double-invoke). Callers must use this alongside useTasks(boardId) for the
// same board.
export function useBoardPresence(boardId: string | null): PresenceUser[] {
  const { socket } = useSocket();
  const [users, setUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    setUsers([]);
    if (!socket || !boardId) return;

    const onUpdate = (payload: PresenceUpdatePayload) => {
      if (payload.boardId === boardId) setUsers(payload.users);
    };
    socket.on('presence:update', onUpdate);

    return () => {
      socket.off('presence:update', onUpdate);
      setUsers([]);
    };
  }, [socket, boardId]);

  return users;
}
