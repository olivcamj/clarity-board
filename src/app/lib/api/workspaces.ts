import { apiClient } from './client';

export type WorkspaceRole = 'ADMIN' | 'EDITOR' | 'VIEWER';

export interface Workspace {
  id: string;
  name: string;
  role: WorkspaceRole;
}

export function getMyWorkspaces(token: string): Promise<Workspace[]> {
  return apiClient<Workspace[]>('api/workspace/mine', token);
}

export function updateWorkspace(
  token: string,
  workspaceId: string,
  name: string,
): Promise<Workspace> {
  return apiClient<Workspace>(`api/workspace/${workspaceId}`, token, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  });
}
