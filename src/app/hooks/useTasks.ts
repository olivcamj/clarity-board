'use client';

import { useCallback, useState } from 'react';
import { useAuthToken } from '../lib/auth/useAuthToken';
import {
  getTasksByBoard,
  createTask as apiCreateTask,
  updateTask as apiUpdateTask,
  deleteTask as apiDeleteTask,
  updateSubtask as apiUpdateSubtask,
  addSubtask as apiAddSubtask,
  addComment as apiAddComment,
  removeComment as apiRemoveComment,
  adaptBackendTask,
} from '../lib/api/tasks';
import type { Task, Status } from '@/types/task';

// Fields the caller provides when creating a task
export type CreateTaskFields = Pick<
  Task,
  'title' | 'description' | 'priority' | 'labels' | 'due' | 'sprint' | 'subtasks'
> & { status?: Status };

export function useTasks(boardId: string | null) {
  const getToken = useAuthToken();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Separate from `error` — transient failures that don't warrant replacing the board
  const [operationError, setOperationError] = useState<string | null>(null);

  const setOpError = useCallback((msg: string) => {
    setOperationError(msg);
  }, []);

  // ── Fetch ────────────────────────────────────────────────────────────────────

  const fetchTasks = useCallback(async () => {
    if (!boardId) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const data = await getTasksByBoard(token, boardId);
      setTasks(data.map(adaptBackendTask));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, [getToken, boardId]);

  // ── Create ───────────────────────────────────────────────────────────────────

  const createTask = useCallback(
    async (fields: CreateTaskFields, status: Status = 'todo') => {
      if (!boardId) return;

      // Optimistic: insert a placeholder with a temp ID
      const tempId = `temp-${Date.now()}`;
      const tempTask: Task = {
        id:       tempId,
        title:    fields.title,
        status,
        priority: fields.priority ?? 'med',
        ...fields,
      };
      setTasks(prev => [...prev, tempTask]);

      try {
        const token = await getToken();

        // CreateTaskDto has no subtasks field — create task first, then chain subtasks
        const { subtasks: pendingSubtasks, ...rest } = fields;
        const created = await apiCreateTask(token, boardId, {
          title:       rest.title,
          description: rest.description,
          status:      status.toUpperCase() as 'TODO' | 'DOING' | 'REVIEW' | 'DONE',
          priority:    (rest.priority ?? 'med').toUpperCase() as 'HIGH' | 'MED' | 'LOW',
          labels:      rest.labels,
          due:         rest.due,
          sprint:      rest.sprint,
        });

        let finalTask = adaptBackendTask(created);

        // Chain subtask creation if any were provided
        if (pendingSubtasks?.length) {
          let latestBackend = created;
          for (const subtask of pendingSubtasks) {
            latestBackend = await apiAddSubtask(token, latestBackend.id, {
              text: subtask.text,
              done: subtask.done,
            });
          }
          finalTask = adaptBackendTask(latestBackend);
        }

        // Replace the temp entry with the real task
        setTasks(prev => prev.map(t => (t.id === tempId ? finalTask : t)));
        return finalTask;
      } catch (err) {
        setTasks(prev => prev.filter(t => t.id !== tempId));
        setOpError(err instanceof Error ? err.message : 'Failed to create task');
      }
    },
    [getToken, boardId, setOpError]
  );

  // ── Update ───────────────────────────────────────────────────────────────────

  const updateTask = useCallback(
    async (taskId: string, updates: Partial<Task>) => {
      const previous = tasks;
      setTasks(prev =>
        prev.map(t => (t.id === taskId ? { ...t, ...updates } : t))
      );

      try {
        const token = await getToken();
        const payload: Record<string, unknown> = { ...updates };
        if (Array.isArray(payload.assignees)) {
          payload.assigneeIds = payload.assignees;
          delete payload.assignees;
        }
        const updated = await apiUpdateTask(token, taskId, payload);
        setTasks(prev =>
          prev.map(t => (t.id === taskId ? adaptBackendTask(updated) : t))
        );
        return adaptBackendTask(updated);
      } catch (err) {
        setTasks(previous);
        setOpError(err instanceof Error ? err.message : 'Failed to update task');
      }
    },
    [getToken, tasks, setOpError]
  );

  // ── Delete ───────────────────────────────────────────────────────────────────

  const deleteTask = useCallback(
    async (taskId: string) => {
      const previous = tasks;
      setTasks(prev => prev.filter(t => t.id !== taskId));

      try {
        const token = await getToken();
        await apiDeleteTask(token, taskId);
      } catch (err) {
        setTasks(previous);
        setOpError(err instanceof Error ? err.message : 'Failed to delete task');
      }
    },
    [getToken, tasks, setOpError]
  );

  // ── Toggle subtask ───────────────────────────────────────────────────────────

  const toggleSubtask = useCallback(
    async (taskId: string, subtaskId: string) => {
      // Task is still being created — real IDs aren't available yet
      if (taskId.startsWith('temp-') || subtaskId.startsWith('s')) {
        // Still optimistically flip the local state so the UI feels responsive
        setTasks(prev =>
          prev.map(t =>
            t.id !== taskId
              ? t
              : {
                  ...t,
                  subtasks: (t.subtasks ?? []).map(s =>
                    s.id === subtaskId ? { ...s, done: !s.done } : s
                  ),
                }
          )
        );
        return;
      }

      const previous = tasks;
      const task = tasks.find(t => t.id === taskId);
      const subtask = task?.subtasks?.find(s => s.id === subtaskId);
      if (!subtask) return;

      setTasks(prev =>
        prev.map(t =>
          t.id !== taskId
            ? t
            : {
                ...t,
                subtasks: (t.subtasks ?? []).map(s =>
                  s.id === subtaskId ? { ...s, done: !s.done } : s
                ),
              }
        )
      );

      try {
        const token = await getToken();
        const updated = await apiUpdateSubtask(token, taskId, subtaskId, {
          done: !subtask.done,
        });
        setTasks(prev =>
          prev.map(t => (t.id === taskId ? adaptBackendTask(updated) : t))
        );
      } catch (err) {
        setTasks(previous);
        setOpError(err instanceof Error ? err.message : 'Failed to toggle subtask');
      }
    },
    [getToken, tasks, setOpError]
  );

  // ── Comments ─────────────────────────────────────────────────────────────────

  const addComment = useCallback(
    async (taskId: string, text: string, isAI = false) => {
      try {
        const token = await getToken();
        const updated = await apiAddComment(token, taskId, { text, isAI });
        setTasks(prev =>
          prev.map(t => (t.id === taskId ? adaptBackendTask(updated) : t))
        );
      } catch (err) {
        setOpError(err instanceof Error ? err.message : 'Failed to add comment');
      }
    },
    [getToken, setOpError]
  );

  const removeComment = useCallback(
    async (taskId: string, commentId: string) => {
      try {
        const token = await getToken();
        const updated = await apiRemoveComment(token, taskId, commentId);
        setTasks(prev =>
          prev.map(t => (t.id === taskId ? adaptBackendTask(updated) : t))
        );
      } catch (err) {
        setOpError(err instanceof Error ? err.message : 'Failed to remove comment');
      }
    },
    [getToken, setOpError]
  );

  return {
    tasks,
    loading,
    error,
    operationError,
    clearOperationError: () => setOperationError(null),
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleSubtask,
    addComment,
    removeComment,
  };
}
