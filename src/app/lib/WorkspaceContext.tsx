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
import { useBackendUser } from '../hooks/useBackendUser';
import { useAuthToken } from './auth/useAuthToken';
import { getBoardsByTeam, createBoard as apiCreateBoard, type Board } from './api/boards';
import { createTeam as apiCreateTeam, type Team } from './api/teams';
import type { BackendUser } from './api/users';

interface WorkspaceContextValue {
  user: BackendUser | null;
  teams: Array<{ id: string; name: string }>;
  boardsByTeam: Record<string, Board[]>;
  loading: boolean;
  error: string | null;
  createTeam: (name: string) => Promise<Team>;
  createBoard: (teamId: string, name: string) => Promise<Board>;
  refetch: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { userData, loading: userLoading, error: userError, refetch: refetchUser } = useBackendUser();
  const getToken = useAuthToken();

  const [boardsByTeam, setBoardsByTeam] = useState<Record<string, Board[]>>({});
  const [boardsLoading, setBoardsLoading] = useState(false);

  const teams = useMemo(() => userData?.teams ?? [], [userData?.teams]);

  useEffect(() => {
    if (!teams.length) {
      setBoardsByTeam({});
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
  }, [teams, getToken]);

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

  return (
    <WorkspaceContext.Provider
      value={{
        user: userData,
        teams,
        boardsByTeam,
        loading: userLoading || boardsLoading,
        error: userError,
        createTeam: createTeamFn,
        createBoard: createBoardFn,
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
