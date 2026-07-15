import type { BackendTask } from '../lib/api/tasks';

// ── Event contract shared with the backend Socket.io gateway ───────────────────
// Rooms are scoped per board (`board:{boardId}`) and per team (`team:{teamId}`).
// Auth happens once at the handshake (Clerk JWT via the `auth` option), so
// client → server payloads never need to carry user identity themselves.
// Keep this file in sync manually with src/api/src/realtime/types.ts.

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

export interface JoinTeamPayload {
  teamId: string;
}

export interface LeaveTeamPayload {
  teamId: string;
}

export interface TeamMemberDto {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface MemberJoinedPayload {
  teamId: string;
  member: TeamMemberDto;
}

export interface ViewTaskPayload {
  taskId: string;
  boardId: string;
}

export interface LeaveTaskPayload {
  taskId: string;
}

export interface TaskViewersUpdatePayload {
  taskId: string;
  users: PresenceUser[];
}

export interface TaskActivityPayload {
  type: 'created' | 'updated' | 'deleted';
  taskId: string;
  taskTitle: string;
  boardId: string;
  actor: PresenceUser;
}

export interface ServerToClientEvents {
  'task:created': (task: BackendTask) => void;
  'task:updated': (task: BackendTask) => void;
  'task:deleted': (payload: TaskDeletedPayload) => void;
  'presence:update': (payload: PresenceUpdatePayload) => void;
  'member:joined': (payload: MemberJoinedPayload) => void;
  'task-viewers:update': (payload: TaskViewersUpdatePayload) => void;
  'task:activity': (payload: TaskActivityPayload) => void;
}

export interface ClientToServerEvents {
  'join-board': (payload: JoinBoardPayload) => void;
  'leave-board': (payload: LeaveBoardPayload) => void;
  'join-team': (payload: JoinTeamPayload) => void;
  'leave-team': (payload: LeaveTeamPayload) => void;
  'view-task': (payload: ViewTaskPayload) => void;
  'leave-task': (payload: LeaveTaskPayload) => void;
}
