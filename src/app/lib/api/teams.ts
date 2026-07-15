import { apiClient } from './client';

export interface Team {
  id: string;
  name: string;
  memberCount?: number;
  boardCount?: number;
}

export interface CreateTeamPayload {
  name: string;
}

export type MemberRole = 'ADMIN' | 'EDITOR' | 'VIEWER';

export interface InviteResult {
  token: string;
  url: string;
}

export interface JoinResult {
  teamId: string;
  role: MemberRole;
  teamName: string;
}

export function getTeams(token: string, userId: string): Promise<Team[]> {
  return apiClient<Team[]>(`api/team?userId=${userId}`, token);
}

export function createTeam(token: string, payload: CreateTeamPayload): Promise<Team> {
  return apiClient<Team>('api/team', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function deleteTeam(token: string, teamId: string): Promise<{ message: string }> {
  return apiClient<{ message: string }>(`api/team/${teamId}`, token, {
    method: 'DELETE',
  });
}

export function createInvite(
  token: string,
  teamId: string,
  role: MemberRole,
): Promise<InviteResult> {
  return apiClient<InviteResult>(`api/team/${teamId}/invite`, token, {
    method: 'POST',
    body: JSON.stringify({ role }),
  });
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function getTeamMembers(token: string, teamId: string): Promise<TeamMember[]> {
  return apiClient<TeamMember[]>(`api/team/${teamId}/members`, token);
}

export function joinViaInvite(token: string, inviteToken: string): Promise<JoinResult> {
  return apiClient<JoinResult>('api/team/join', token, {
    method: 'POST',
    body: JSON.stringify({ token: inviteToken }),
  });
}

export function removeTeamMember(token: string, teamId: string, userId: string): Promise<unknown> {
  return apiClient<unknown>(`api/team/${teamId}/users/${userId}`, token, {
    method: 'DELETE',
  });
}