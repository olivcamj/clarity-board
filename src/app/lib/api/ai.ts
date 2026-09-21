import { apiClient } from './client';
import type { Priority, LabelKey } from '@/types/task';

export interface TaskSuggestion {
  title: string;
  description?: string;
  priority: Priority;
  labels: LabelKey[];
}

export interface AiUsage {
  used: number;
  limit: number;
  remaining: number;
}

export interface GenerateTasksResponse {
  suggestions: TaskSuggestion[];
  usage: AiUsage;
}

export function getAiUsage(token: string): Promise<AiUsage> {
  return apiClient<AiUsage>('api/ai/usage', token);
}

export function generateTasks(
  token: string,
  boardId: string,
  input: string,
): Promise<GenerateTasksResponse> {
  return apiClient<GenerateTasksResponse>(`api/boards/${boardId}/ai/generate-tasks`, token, {
    method: 'POST',
    body: JSON.stringify({ input }),
  });
}

export interface SubtaskSuggestion {
  text: string;
}

export interface BreakdownTaskResponse {
  subtasks: SubtaskSuggestion[];
  usage: AiUsage;
}

export function breakdownTask(
  token: string,
  taskId: string,
): Promise<BreakdownTaskResponse> {
  return apiClient<BreakdownTaskResponse>(`api/tasks/${taskId}/ai/breakdown`, token, {
    method: 'POST',
  });
}
