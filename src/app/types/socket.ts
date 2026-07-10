import type { BackendTask } from '../lib/api/tasks';

// ── Event contract shared with the (future) backend Socket.io gateway ──────────
// Rooms are scoped per board: `board:{boardId}`. Auth happens once at the
// handshake (Clerk JWT via the `auth` option), so client → server payloads
// never need to carry user identity themselves.

export interface JoinBoardPayload {
  boardId: string;
}

export interface LeaveBoardPayload {
  boardId: string;
}

export interface TaskDeletedPayload {
  id: string;
}

export interface PresenceUser {
  id: string;
  name: string;
}

export interface PresenceUpdatePayload {
  boardId: string;
  users: PresenceUser[];
}

export interface ServerToClientEvents {
  'task:created': (task: BackendTask) => void;
  'task:updated': (task: BackendTask) => void;
  'task:deleted': (payload: TaskDeletedPayload) => void;
  'presence:update': (payload: PresenceUpdatePayload) => void;
}

export interface ClientToServerEvents {
  'join-board': (payload: JoinBoardPayload) => void;
  'leave-board': (payload: LeaveBoardPayload) => void;
}
