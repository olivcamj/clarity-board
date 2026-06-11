import { apiClient } from './client';
import type { Task, Status, Priority, LabelKey, Subtask, TaskComment, Attachment } from '@/types/task';

// ── Backend response shapes ────────────────────────────────────────────────────

export interface BackendTaskComment {
  id: string;
  text: string;
  isAI: boolean;
  createdAt: string;
  author?: { id: string; name: string };
}

export interface BackendSubtask {
  id: string;
  text: string;
  done: boolean;
  position: number;
}

export interface BackendAttachment {
  id: string;
  kind: 'link' | 'file';
  label: string;
  href?: string;
}

export interface BackendTask {
  id: string;
  boardId: string;
  title: string;
  description?: string;
  /** Already lowercase from TaskResponseDto: "todo"|"doing"|"review"|"done" */
  status: string;
  /** Already lowercase from TaskResponseDto: "high"|"med"|"low" */
  priority: string;
  labels: string[];
  due?: string;
  sprint?: string;
  position: number;
  aiGenerated: boolean;
  source?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; name: string };
  assignees: Array<{ id: string; name: string }>;
  subtasks: BackendSubtask[];
  comments: BackendTaskComment[];
  attachments: BackendAttachment[];
}

// ── Request payload shapes ────────────────────────────────────────────────────
// Backend DTOs use Prisma enum values (uppercase). We type them here and
// convert from the frontend's lowercase Status/Priority in the API functions.

export type BackendTaskStatus = 'TODO' | 'DOING' | 'REVIEW' | 'DONE';
export type BackendPriority = 'HIGH' | 'MED' | 'LOW';

export interface CreateTaskPayload {
  title: string;
  description?: string;
  status?: BackendTaskStatus;
  priority?: BackendPriority;
  labels?: string[];
  due?: string;
  sprint?: string;
  position?: number;
  aiGenerated?: boolean;
  source?: string;
  assigneeIds?: string[];
}

export type UpdateTaskPayload = Partial<CreateTaskPayload>;

export interface CreateSubtaskPayload {
  text: string;
  done?: boolean;
}

export interface UpdateSubtaskPayload {
  text?: string;
  done?: boolean;
  position?: number;
}

export interface CreateCommentPayload {
  text: string;
  isAI?: boolean;
}

// ── Case-conversion helpers (internal) ───────────────────────────────────────

const STATUS_UP: Record<string, BackendTaskStatus> = {
  todo:   'TODO',
  doing:  'DOING',
  review: 'REVIEW',
  done:   'DONE',
};

const PRIORITY_UP: Record<string, BackendPriority> = {
  high: 'HIGH',
  med:  'MED',
  low:  'LOW',
};

function toBackendStatus(s: string): BackendTaskStatus {
  return STATUS_UP[s] ?? 'TODO';
}

function toBackendPriority(p: string): BackendPriority {
  return PRIORITY_UP[p] ?? 'MED';
}

// ── Adapter: BackendTask → frontend Task ─────────────────────────────────────

export function adaptBackendTask(bt: BackendTask): Task {
  return {
    id:          bt.id,
    title:       bt.title,
    description: bt.description,
    status:      bt.status as Status,
    priority:    bt.priority as Priority,
    labels:      bt.labels as LabelKey[],
    due:         bt.due,
    sprint:      bt.sprint,
    createdAt:   bt.createdAt,
    createdBy:   bt.createdBy.id,
    ai:          bt.aiGenerated,
    source:      bt.source,
    // Assignees stored as IDs to match existing PEOPLE_BY_ID lookup pattern
    assignees:   bt.assignees.map(a => a.id),
    subtasks:    bt.subtasks.map((s): Subtask => ({
      id:   s.id,
      text: s.text,
      done: s.done,
    })),
    attachments: bt.attachments.map((a): Attachment => ({
      kind:  a.kind,
      label: a.label,
      href:  a.href,
    })),
    // `comments` on Task is a count; full thread goes in `conversation`
    comments:     bt.comments.length,
    conversation: bt.comments.map((c): TaskComment => ({
      id:        c.id,
      authorId:  c.author?.id ?? 'clarity',
      text:      c.text,
      timestamp: c.createdAt,
      isAI:      c.isAI,
    })),
  };
}

// Board-scoped

export function getTasksByBoard(token: string, boardId: string): Promise<BackendTask[]> {
  return apiClient<BackendTask[]>(`api/boards/${boardId}/tasks`, token);
}

export function createTask(
  token: string,
  boardId: string,
  payload: CreateTaskPayload,
): Promise<BackendTask> {
  const body: CreateTaskPayload = {
    ...payload,
    status:   payload.status   ? toBackendStatus(payload.status)   : undefined,
    priority: payload.priority ? toBackendPriority(payload.priority) : undefined,
  };
  return apiClient<BackendTask>(`api/boards/${boardId}/tasks`, token, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// Task-scoped

export function getTask(token: string, taskId: string): Promise<BackendTask> {
  return apiClient<BackendTask>(`api/tasks/${taskId}`, token);
}

export function updateTask(
  token: string,
  taskId: string,
  payload: UpdateTaskPayload,
): Promise<BackendTask> {
  const body: UpdateTaskPayload = {
    ...payload,
    status:   payload.status   ? toBackendStatus(payload.status)   : undefined,
    priority: payload.priority ? toBackendPriority(payload.priority) : undefined,
  };
  return apiClient<BackendTask>(`api/tasks/${taskId}`, token, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function deleteTask(
  token: string,
  taskId: string,
): Promise<{ message: string }> {
  return apiClient<{ message: string }>(`api/tasks/${taskId}`, token, {
    method: 'DELETE',
  });
}

// Subtasks

export function addSubtask(
  token: string,
  taskId: string,
  payload: CreateSubtaskPayload,
): Promise<BackendTask> {
  return apiClient<BackendTask>(`api/tasks/${taskId}/subtasks`, token, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateSubtask(
  token: string,
  taskId: string,
  subtaskId: string,
  payload: UpdateSubtaskPayload,
): Promise<BackendTask> {
  return apiClient<BackendTask>(`api/tasks/${taskId}/subtasks/${subtaskId}`, token, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function removeSubtask(
  token: string,
  taskId: string,
  subtaskId: string,
): Promise<BackendTask> {
  return apiClient<BackendTask>(`api/tasks/${taskId}/subtasks/${subtaskId}`, token, {
    method: 'DELETE',
  });
}

// Comments

export function addComment(
  token: string,
  taskId: string,
  payload: CreateCommentPayload,
): Promise<BackendTask> {
  return apiClient<BackendTask>(`api/tasks/${taskId}/comments`, token, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function removeComment(
  token: string,
  taskId: string,
  commentId: string,
): Promise<BackendTask> {
  return apiClient<BackendTask>(`api/tasks/${taskId}/comments/${commentId}`, token, {
    method: 'DELETE',
  });
}
