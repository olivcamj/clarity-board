// Local mirror of the frontend's event contract at
// /src/app/types/socket.ts keep the two files in sync manually, since this
// is a separate Nest app and can't import across the workspace boundary.
// Rooms are scoped per board (`board:{boardId}`) and per team (`team:{teamId}`).

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

// Augments socket.data: set once at handshake by the auth middleware,
// read by the join/leave/disconnect handlers.
export interface SocketData {
  user?: PresenceUser;
  boardIds?: Set<string>;
  teamIds?: Set<string>;
}
