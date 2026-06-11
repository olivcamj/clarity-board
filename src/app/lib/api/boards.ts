import { apiClient } from './client';

export interface BoardTask {
  id: string;
  title: string;
  status: string;
  assignedTo?: { id: string; name: string };
}

export interface Board {
  id: string;
  name: string;
  teamId: string;
  teamName?: string;
  taskCount?: number;
  tasks?: BoardTask[];
}

export interface CreateBoardPayload {
  name: string;
  teamId: string;
}

export function getBoardsByTeam(token: string, teamId: string): Promise<Board[]> {
  return apiClient(`api/boards/team/${teamId}`, token);
}

export function getBoard(token: string, boardId: string): Promise<Board> {
  return apiClient(`api/boards/${boardId}`, token);
}

export function createBoard(token: string, payload: CreateBoardPayload): Promise<Board> {
  return apiClient('api/boards', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateBoard(token: string, boardId: string, name: string): Promise<Board> {
  return apiClient(`api/boards/${boardId}`, token, {
    method: 'PUT',
    body: JSON.stringify({ name }),
  });
}

export function deleteBoard(token: string, boardId: string): Promise<{ message: string }> {
  return apiClient(`api/boards/${boardId}`, token, {
    method: 'DELETE',
  });
}
