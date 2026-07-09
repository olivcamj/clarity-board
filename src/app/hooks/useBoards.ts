'use client';

import { useCallback, useState } from 'react';
import { useAuthToken } from '../lib/auth/useAuthToken';
import {
  getBoardsByTeam,
  createBoard,
  updateBoard,
  deleteBoard,
  Board,
  CreateBoardPayload,
} from '../lib/api/boards';

export function useBoards() {
  const getToken = useAuthToken();

  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBoardsByTeam = useCallback(
    async (teamId: string) => {
      setLoading(true);
      setError(null);
      try {
        const token = await getToken();
        const data = await getBoardsByTeam(token, teamId);
        setBoards(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch boards');
      } finally {
        setLoading(false);
      }
    },
    [getToken]
  );

  const create = useCallback(
    async (payload: CreateBoardPayload) => {
      const token = await getToken();
      const board = await createBoard(token, payload);
      setBoards((prev) => [...prev, board]);
      return board;
    },
    [getToken]
  );

  const update = useCallback(
    async (boardId: string, name: string) => {
      const token = await getToken();
      const updated = await updateBoard(token, boardId, name);
      setBoards((prev) => prev.map((board) => (board.id === boardId ? updated : board)));
      return updated;
    },
    [getToken]
  );

  const remove = useCallback(
    async (boardId: string) => {
      const token = await getToken();
      await deleteBoard(token, boardId);
      setBoards((prev) => prev.filter((board) => board.id !== boardId));
    },
    [getToken]
  );

  return {
    boards,
    loading,
    error,
    fetchBoardsByTeam,
    createBoard: create,
    updateBoard: update,
    deleteBoard: remove,
  };
}
