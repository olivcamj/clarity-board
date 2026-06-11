import { apiClient } from './client';

export interface BackendUser {
  id: string;
  clerkId: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  teams: Array<{ id: string; name: string; role: string }>;
  createdTasks: Array<{
    id: string;
    title: string;
    status: string;
    board: { id: string; name: string };
  }>;
  assignedTasks: Array<{
    id: string;
    title: string;
    status: string;
    board: { id: string; name: string };
  }>;
}

export function getMe(token: string): Promise<BackendUser> {
  return apiClient<BackendUser>('api/users/me', token);
}

export function getMeFull(token: string): Promise<BackendUser> {
  return apiClient<BackendUser>('api/users/me/full', token);
}
