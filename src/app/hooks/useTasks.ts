'use client';

import { startTransition, useCallback, useOptimistic, useRef, useState } from 'react';
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

type OptimisticPatch =
  | { type: 'update'; id: string; changes: Partial<Task> }
  | { type: 'delete'; id: string }
  | { type: 'toggleSubtask'; taskId: string; subtaskId: string };

function applyPatch(state: Task[], patch: OptimisticPatch): Task[] {
  switch (patch.type) {
    case 'update':
      return state.map(task => task.id === patch.id ? { ...task, ...patch.changes } : task);
    case 'delete':
      return state.filter(task => task.id !== patch.id);
    case 'toggleSubtask':
      return state.map(task =>
        task.id !== patch.taskId ? task : {
          ...task,
          subtasks: (task.subtasks ?? []).map(subtask =>
            subtask.id === patch.subtaskId ? { ...subtask, done: !subtask.done } : subtask
          ),
        }
      );
  }
}

export function useTasks(boardId: string | null) {
  const getToken = useAuthToken();
  const [serverTasks, setServerTasks] = useState<Task[]>([]);
  const serverTasksRef = useRef<Task[]>([]);
  serverTasksRef.current = serverTasks;

  const [tasks, applyOptimistic] = useOptimistic(serverTasks, applyPatch);

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
      setServerTasks(data.map(adaptBackendTask));
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
      setServerTasks(prev => [...prev, tempTask]);

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
        setServerTasks(prev => prev.map(task => (task.id === tempId ? finalTask : task)));
        return finalTask;
      } catch (err) {
        setServerTasks(prev => prev.filter(task => task.id !== tempId));
        setOpError(err instanceof Error ? err.message : 'Failed to create task');
      }
    },
    [getToken, boardId, setOpError]
  );

  // ── Update ───────────────────────────────────────────────────────────────────

  const updateTask = useCallback(
    async (taskId: string, updates: Partial<Task>) => {
      // Immediate optimistic display; capture server state for manual revert on error
      applyOptimistic({ type: 'update', id: taskId, changes: updates });
      const previousServer = serverTasksRef.current;

      try {
        const token = await getToken();
        const payload: Record<string, unknown> = { ...updates };
        if (Array.isArray(payload.assignees)) {
          payload.assigneeIds = payload.assignees;
          delete payload.assignees;
        }
        const updated = await apiUpdateTask(token, taskId, payload);
        const result = adaptBackendTask(updated);
        setServerTasks(prev => prev.map(task => (task.id === taskId ? result : task)));
        return result;
      } catch (err) {
        setServerTasks(previousServer);
        setOpError(err instanceof Error ? err.message : 'Failed to update task');
      }
    },
    [getToken, setOpError, applyOptimistic]
  );

  // ── Delete ───────────────────────────────────────────────────────────────────

  const deleteTask = useCallback(
    (taskId: string) => {
      startTransition(async () => {
        applyOptimistic({ type: 'delete', id: taskId });
        try {
          const token = await getToken();
          await apiDeleteTask(token, taskId);
          setServerTasks(prev => prev.filter(task => task.id !== taskId));
        } catch (err) {
          setOpError(err instanceof Error ? err.message : 'Failed to delete task');
          // startTransition auto-reverts the optimistic patch on error
        }
      });
    },
    [getToken, setOpError, applyOptimistic]
  );

  // ── Toggle subtask ───────────────────────────────────────────────────────────

  const toggleSubtask = useCallback(
    (taskId: string, subtaskId: string) => {
      // Task is still being created — real IDs aren't available yet
      if (taskId.startsWith('temp-') || subtaskId.startsWith('s')) {
        setServerTasks(prev =>
          prev.map(task =>
            task.id !== taskId
              ? task
              : {
                  ...task,
                  subtasks: (task.subtasks ?? []).map(subtask =>
                    subtask.id === subtaskId ? { ...subtask, done: !subtask.done } : subtask
                  ),
                }
          )
        );
        return;
      }

      startTransition(async () => {
        const task = serverTasksRef.current.find(task => task.id === taskId);
        const subtask = task?.subtasks?.find(subtask => subtask.id === subtaskId);
        if (!subtask) return;

        applyOptimistic({ type: 'toggleSubtask', taskId, subtaskId });
        try {
          const token = await getToken();
          const updated = await apiUpdateSubtask(token, taskId, subtaskId, {
            done: !subtask.done,
          });
          setServerTasks(prev =>
            prev.map(task => (task.id === taskId ? adaptBackendTask(updated) : task))
          );
        } catch (err) {
          setOpError(err instanceof Error ? err.message : 'Failed to toggle subtask');
          // startTransition auto-reverts the optimistic patch on error
        }
      });
    },
    [getToken, setOpError, applyOptimistic]
  );

  // ── Comments ─────────────────────────────────────────────────────────────────

  const addComment = useCallback(
    async (taskId: string, text: string, isAI = false) => {
      try {
        const token = await getToken();
        const updated = await apiAddComment(token, taskId, { text, isAI });
        setServerTasks(prev =>
          prev.map(task => (task.id === taskId ? adaptBackendTask(updated) : task))
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
        setServerTasks(prev =>
          prev.map(task => (task.id === taskId ? adaptBackendTask(updated) : task))
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
