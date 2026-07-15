'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useSearchParams } from 'next/navigation';
import { useBackendUser } from '../hooks/useBackendUser';
import { useAuthToken } from './auth/useAuthToken';
import { getBoardsByTeam, createBoard as apiCreateBoard, deleteBoard as apiDeleteBoard, type Board } from './api/boards';
import { createTeam as apiCreateTeam, deleteTeam as apiDeleteTeam, type Team } from './api/teams';
import { getMyWorkspaces, updateWorkspace, type Workspace, type WorkspaceRole } from './api/workspaces';
import type { BackendUser } from './api/users';

interface WorkspaceContextValue {
  user: BackendUser | null;
  workspaceName: string;
  updateWorkspaceName: (name: string) => void;
  workspaceRole: WorkspaceRole | null;
  teams: Array<{ id: string; name: string; role: string; workspaceId: string | null }>;
  boardsByTeam: Record<string, Board[]>;
  loading: boolean;
  error: string | null;
  createTeam: (name: string) => Promise<Team>;
  createBoard: (teamId: string, name: string) => Promise<Board>;
  deleteTeam: (teamId: string) => Promise<void>;
  deleteBoard: (boardId: string, teamId: string) => Promise<void>;
  refetch: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { userData, loading: userLoading, error: userError, refetch: refetchUser } = useBackendUser();
  const getToken = useAuthToken();
  const searchParams = useSearchParams();
  const currentBoardId = searchParams.get('boardId');

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [boardsByTeam, setBoardsByTeam] = useState<Record<string, Board[]>>({});
  // Starts true so there's no gap frame between userLoading flipping off
  // and this effect kicking in — otherwise the dashboard briefly renders
  // with stale/empty boards before the skeleton reappears.
  const [boardsLoading, setBoardsLoading] = useState(true);

  const teams = useMemo(() => userData?.teams ?? [], [userData?.teams]);
  // userData is a new object on every refetch, so `teams` gets a new array
  // reference even when the team list is unchanged — key the boards effect
  // off team ids instead, or a background refetch (e.g. after completing a
  // task) would re-fetch every board on every team unnecessarily.
  const teamsKey = teams.map(team => team.id).join(',');

  // Fetch workspaces once after the user has loaded
  useEffect(() => {
    if (userLoading) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        const data = await getMyWorkspaces(token);
        if (!cancelled) setWorkspaces(data);
      } catch {
        // silently ignore — sidebar falls back to empty string
      }
    })();
    return () => { cancelled = true; };
  }, [userLoading, getToken]);

  // Fetch boards whenever teams change
  useEffect(() => {
    if (userLoading) return;

    if (!teams.length) {
      setBoardsByTeam({});
      setBoardsLoading(false);
      return;
    }

    let cancelled = false;
    setBoardsLoading(true);

    (async () => {
      const token = await getToken();
      const results = await Promise.allSettled(
        teams.map(team =>
          getBoardsByTeam(token, team.id).then(boards => ({ teamId: team.id, boards }))
        )
      );

      if (cancelled) return;

      const byTeam: Record<string, Board[]> = {};
      for (const record of results) {
        if (record.status === 'fulfilled') byTeam[record.value.teamId] = record.value.boards;
      }
      setBoardsByTeam(byTeam);
      setBoardsLoading(false);
    })().catch(() => {
      if (!cancelled) setBoardsLoading(false);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLoading, teamsKey, getToken]);

  // Index workspaces by id for O(1) lookup
  const workspacesById = useMemo(
    () => Object.fromEntries(workspaces.map(w => [w.id, w])),
    [workspaces],
  );

  // Derive the current workspace purely from in-memory data — no network call on navigation
  const currentWorkspace = useMemo((): Workspace | null => {
    if (!currentBoardId) return workspaces[0] ?? null;

    for (const team of userData?.teams ?? []) {
      const boards = boardsByTeam[team.id] ?? [];
      if (boards.some(b => b.id === currentBoardId)) {
        return team.workspaceId ? (workspacesById[team.workspaceId] ?? null) : null;
      }
    }
    return workspaces[0] ?? null;
  }, [currentBoardId, userData?.teams, boardsByTeam, workspacesById, workspaces]);

  const workspaceName = currentWorkspace?.name ?? '';
  const workspaceRole = (currentWorkspace?.role ?? null) as WorkspaceRole | null;

  const updateWorkspaceName = useCallback(async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || !currentWorkspace) return;
    const token = await getToken();
    const updated = await updateWorkspace(token, currentWorkspace.id, trimmed);
    setWorkspaces(prev => prev.map(workspace => workspace.id === updated.id ? { ...workspace, name: updated.name } : workspace));
  }, [getToken, currentWorkspace]);

  const createTeamFn = useCallback(
    async (name: string) => {
      const token = await getToken();
      const team = await apiCreateTeam(token, { name });
      refetchUser();
      return team;
    },
    [getToken, refetchUser]
  );

  const createBoardFn = useCallback(
    async (teamId: string, name: string) => {
      const token = await getToken();
      const board = await apiCreateBoard(token, { name, teamId });
      setBoardsByTeam(prev => ({
        ...prev,
        [teamId]: [...(prev[teamId] ?? []), board],
      }));
      return board;
    },
    [getToken]
  );

  const deleteTeamFn = useCallback(
    async (teamId: string) => {
      const token = await getToken();
      const boards = boardsByTeam[teamId] ?? [];
      await Promise.all(boards.map(board => apiDeleteBoard(token, board.id)));
      await apiDeleteTeam(token, teamId);
      refetchUser();
    },
    [getToken, refetchUser, boardsByTeam]
  );

  const deleteBoardFn = useCallback(
    async (boardId: string, teamId: string) => {
      const token = await getToken();
      await apiDeleteBoard(token, boardId);
      setBoardsByTeam(prev => ({
        ...prev,
        [teamId]: (prev[teamId] ?? []).filter(board => board.id !== boardId),
      }));
    },
    [getToken]
  );

  return (
    <WorkspaceContext.Provider
      value={{
        user: userData,
        workspaceName,
        updateWorkspaceName,
        workspaceRole,
        teams,
        boardsByTeam,
        loading: userLoading || boardsLoading,
        error: userError,
        createTeam: createTeamFn,
        createBoard: createBoardFn,
        deleteTeam: deleteTeamFn,
        deleteBoard: deleteBoardFn,
        refetch: refetchUser,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used inside WorkspaceProvider');
  return ctx;
}
