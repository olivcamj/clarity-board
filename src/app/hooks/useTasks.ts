'use client';

import { startTransition, useCallback, useEffect, useOptimistic, useRef, useState } from 'react';
import { useAuthToken } from '../lib/auth/useAuthToken';
import { useSocket } from '../lib/SocketContext';
import {
  getTasksByBoard,
  createTask as apiCreateTask,
  updateTask as apiUpdateTask,
  deleteTask as apiDeleteTask,
  updateSubtask as apiUpdateSubtask,
  addSubtask as apiAddSubtask,
  removeSubtask as apiRemoveSubtask,
  addComment as apiAddComment,
  updateComment as apiUpdateComment,
  removeComment as apiRemoveComment,
  adaptBackendTask,
  type BackendTask,
} from '../lib/api/tasks';
import type { Task, Status } from '@/types/task';
import type { TaskDeletedPayload } from '../types/socket';

// Fields the caller provides when creating a task
export type CreateTaskFields = Pick<
  Task,
  'title' | 'description' | 'priority' | 'labels' | 'due' | 'sprint' | 'subtasks'
> & { status?: Status };

// Fields the backend's UpdateTaskDto whitelists — anything else (id, createdAt,
// createdBy, ai, subtasks, attachments, comments, conversation, ...) gets
// rejected with a 400 if sent, since the API uses forbidNonWhitelisted.
const UPDATABLE_TASK_FIELDS = [
  'title', 'description', 'status', 'priority', 'labels', 'due', 'sprint', 'assignees', 'source',
] as const satisfies readonly (keyof Task)[];

type OptimisticPatch =
  | { type: 'update'; id: string; changes: Partial<Task> }
  | { type: 'delete'; id: string }
  | { type: 'toggleSubtask'; taskId: string; subtaskId: string; done: boolean };

function applyPatch(state: Task[], patch: OptimisticPatch): Task[] {
  switch (patch.type) {
    case 'update':
      return state.map(task => task.id === patch.id ? { ...task, ...patch.changes } : task);
    case 'delete':
      return state.filter(task => task.id !== patch.id);
    case 'toggleSubtask':
      // An explicit target (not "!subtask.done") so re-applying this patch is
      // idempotent. The subtask endpoint broadcasts task:updated to the whole
      // board room, including the toggling client's own socket — if that
      // broadcast lands in serverTasks while this optimistic transition is
      // still pending, React re-runs this reducer against the new base state.
      // A relative flip would re-toggle an already-correct value back to
      // wrong (checked → unchecked → checked flicker); a fixed target won't.
      return state.map(task =>
        task.id !== patch.taskId ? task : {
          ...task,
          subtasks: (task.subtasks ?? []).map(subtask =>
            subtask.id === patch.subtaskId ? { ...subtask, done: patch.done } : subtask
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

  //  Fetch

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

  //  Realtime sync, join the board's room and merge broadcast task events
  // into serverTasks. Upsert-by-id/filter-by-id makes this idempotent, so a
  // broadcast echo of this client's own optimistic REST-driven change just
  // re-applies harmlessly instead of duplicating or erroring.

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket || !boardId) return;

    // Re-emitted on every (re)connect too. The server drops room membership
    // on disconnect, so a network blip would otherwise silently stop updates.
    const join = () => socket.emit('join-board', { boardId });

    join();
    socket.on('connect', join);

    const upsertTask = (backendTask: BackendTask) => {
      const incomingTask = adaptBackendTask(backendTask);

      setServerTasks(prevTasks => {
        const existingIndex = prevTasks.findIndex(existingTask => existingTask.id === incomingTask.id);
        return existingIndex === -1
          ? [...prevTasks, incomingTask]
          : prevTasks.map(existingTask => (existingTask.id === incomingTask.id ? incomingTask : existingTask));
      });
    };

    const removeTask = ({ id }: TaskDeletedPayload) => {
      setServerTasks(prev => prev.filter(prevTask => prevTask.id !== id));
    };

    socket.on('task:created', upsertTask);
    socket.on('task:updated', upsertTask);
    socket.on('task:deleted', removeTask);

    return () => {
      socket.off('connect', join);
      socket.off('task:created', upsertTask);
      socket.off('task:updated', upsertTask);
      socket.off('task:deleted', removeTask);
      socket.emit('leave-board', { boardId });
    };
  }, [socket, boardId]);

  // Create

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
          status,
          priority:    rest.priority ?? 'med',
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

        // Replace the temp entry with the real task. Upsert-by-real-id rather
        // than a plain map-by-tempId: the server broadcasts task:created to
        // the whole board room, including the creator's own socket, so if
        // that broadcast's upsertTask (below) wins the race and already
        // appended an entry under the real id before this REST response
        // lands, a plain tempId→finalTask replace would leave two entries
        // with the same real id — the exact "two identical cards" bug.
        setServerTasks(prev => {
          const withoutTemp = prev.filter(task => task.id !== tempId);
          const existingIndex = withoutTemp.findIndex(task => task.id === finalTask.id);
          return existingIndex === -1
            ? [...withoutTemp, finalTask]
            : withoutTemp.map(task => (task.id === finalTask.id ? finalTask : task));
        });
        return finalTask;
      } catch (err) {
        setServerTasks(prev => prev.filter(task => task.id !== tempId));
        setOpError(err instanceof Error ? err.message : 'Failed to create task');
      }
    },
    [getToken, boardId, setOpError]
  );

  // Update
  const updateTask = useCallback(
    (taskId: string, updates: Partial<Task>) => {
      const previousServer = serverTasksRef.current;
      // Dispatch and the network call must share one transition — a transition
      // only keeps the optimistic value visible while it's pending, and a
      // synchronous callback is "done" the instant it returns. Splitting the
      // dispatch into its own transition let React discard the optimistic
      // patch before the request resolved, snapping the card back to its old
      // column and then jumping again once the real response landed.
      startTransition(async () => {
        applyOptimistic({ type: 'update', id: taskId, changes: updates });

        try {
          const token = await getToken();
          // Only forward fields the backend's UpdateTaskDto actually accepts —
          // callers (e.g. the edit modal) pass a full Task, and its whitelist
          // validation 400s on any extra property (id, createdAt, subtasks, ...).
          const payload: Record<string, unknown> = {};
          for (const key of UPDATABLE_TASK_FIELDS) {
            if (key in updates) payload[key] = updates[key];
          }
          if (Array.isArray(payload.assignees)) {
            payload.assigneeIds = payload.assignees;
            delete payload.assignees;
          }
          const updated = await apiUpdateTask(token, taskId, payload);
          let latestBackend = updated;

          // UpdateTaskDto deliberately excludes subtasks — they're a related
          // child model with their own endpoints, not a field on the task
          // itself. So subtask adds/removes/edits made in the draft have to
          // be diffed against what the server had before this save and
          // replayed through addSubtask/updateSubtask/removeSubtask, or
          // they'd silently vanish the moment this response overwrites the
          // optimistic view (the "subtask disappears after a few seconds" bug).
          if (updates.subtasks) {
            const existingSubtasks = previousServer.find(task => task.id === taskId)?.subtasks ?? [];
            const existingById = new Map(existingSubtasks.map(subtask => [subtask.id, subtask]));
            const nextById = new Map(updates.subtasks.map(subtask => [subtask.id, subtask]));

            for (const subtask of updates.subtasks) {
              if (!existingById.has(subtask.id)) {
                latestBackend = await apiAddSubtask(token, taskId, { text: subtask.text, done: subtask.done });
              }
            }
            for (const subtask of existingSubtasks) {
              if (!nextById.has(subtask.id)) {
                latestBackend = await apiRemoveSubtask(token, taskId, subtask.id);
              }
            }
            for (const subtask of updates.subtasks) {
              const previous = existingById.get(subtask.id);
              if (previous && (previous.text !== subtask.text || previous.done !== subtask.done)) {
                latestBackend = await apiUpdateSubtask(token, taskId, subtask.id, { text: subtask.text, done: subtask.done });
              }
            }
          }

          const result = adaptBackendTask(latestBackend);
          setServerTasks(prev => prev.map(task => (task.id === taskId ? result : task)));
        } catch (err) {
          setServerTasks(previousServer);
          setOpError(err instanceof Error ? err.message : 'Failed to update task');
        }
      });
    },
    [getToken, setOpError, applyOptimistic]
  );

  // Delete

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

  //  Toggle subtask
  
  const toggleSubtask = useCallback(
    (taskId: string, subtaskId: string) => {
      // Task is still being created --> real IDs aren't available yet
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

        const nextDone = !subtask.done;
        applyOptimistic({ type: 'toggleSubtask', taskId, subtaskId, done: nextDone });
        try {
          const token = await getToken();
          const updated = await apiUpdateSubtask(token, taskId, subtaskId, {
            done: nextDone,
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

  //  Comments

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

  const editComment = useCallback(
    async (taskId: string, commentId: string, text: string) => {
      try {
        const token = await getToken();
        const updated = await apiUpdateComment(token, taskId, commentId, { text });
        setServerTasks(prev =>
          prev.map(task => (task.id === taskId ? adaptBackendTask(updated) : task))
        );
      } catch (err) {
        setOpError(err instanceof Error ? err.message : 'Failed to edit comment');
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
    editComment,
    removeComment,
  };
}
