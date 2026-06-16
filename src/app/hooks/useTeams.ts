'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuthToken } from '../lib/auth/useAuthToken';
import {
  getTeams,
  createTeam,
  // updateTeam,
  deleteTeam,
  Team,
} from '../lib/api/teams';

export function useTeams(autoFetch = true) {
  const getToken = useAuthToken();

  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all teams
   */
  const fetchTeams = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) throw new Error('Missing auth token');

      const data = await getTeams(token, userId);
      setTeams(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch teams'
      );
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  /**
   * Create team
   */
  const create = useCallback(
    async (name: string) => {
      const token = await getToken();
      if (!token) throw new Error('Missing auth token');

      const team = await createTeam(token, { name });

      // optimistic update
      setTeams((prev) => [...prev, team]);

      return team;
    },
    [getToken]
  );

  /**
   * Update team
   */
  // const update = useCallback(
  //   async (teamId: string, name: string) => {
  //     const token = await getToken();
  //     if (!token) throw new Error('Missing auth token');

  //     const updated = await updateTeam(token, teamId, { name });

  //     setTeams((prev) =>
  //       prev.map((t) => (t.id === teamId ? updated : t))
  //     );

  //     return updated;
  //   },
  //   [getToken]
  // );

  /**
   * Delete team
   */
  const remove = useCallback(
    async (teamId: string) => {
      const token = await getToken();
      if (!token) throw new Error('Missing auth token');

      await deleteTeam(token, teamId);

      setTeams((prev) => prev.filter((t) => t.id !== teamId));
    },
    [getToken]
  );

  /**
   * Optional auto-fetch
   */
  useEffect(() => {
    if (autoFetch) {
      // fetchTeams();
    }
  }, [autoFetch, ]); // fetchTeams

  return {
    teams,
    loading,
    error,

    fetchTeams,
    createTeam: create,
    // updateTeam: update,
    deleteTeam: remove,
  };
}