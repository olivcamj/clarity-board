'use client';

import { useUser } from '@clerk/nextjs';
import { useState, useEffect, useCallback } from 'react';
import { useAuthToken } from '../lib/auth/useAuthToken';
import { getMeFull, BackendUser } from '../lib/api/users';

export function useBackendUser() {
  // Get Clerk user (from ClerkProvider)
  const { user, isLoaded: clerkLoaded } = useUser();
  const getToken = useAuthToken();
  
  // Local state for backend user data
  const [userData, setUserData] = useState<BackendUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Function to fetch user data from backend
   * Made separate so we can call it manually with refetch()
   */
  const fetchUser = useCallback(async () => {
    // Don't fetch if Clerk user isn't loaded yet
    if (!clerkLoaded) return

    if (!user?.id) {
      setUserData(null)
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get JWT token from Clerk
      // This token proves the user is authenticated
      const token = await getToken();
      console.log(`HERE IS THE  TOKEN : `,  token);

      if (!token) {
        throw new Error('Failed to get authentication token');
      }
      const data = await getMeFull(token);
      console.log('DATA from the request', data);
      setUserData(data);
    } catch (err) {
      console.error('Failed to fetch user from backend:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user');
    } finally {
      setLoading(false);
    }
  }, [user?.id, clerkLoaded, getToken]);

  /**
   * Fetch user data when:
   * - Component mounts
   * - Clerk user loads
   * - Clerk user changes (login/logout)
   */
  useEffect(() => {
    // const style = 'color: darkblue; background-color: white; font-size: 1.5em; font-weight: bold;';
    console.log('%cuseEffect fired', 'color: darkblue; background-color: white; font-size: 1.5em; font-weight: bold;', { clerkLoaded, userId: user?.id });
    if (clerkLoaded && user?.id) {
      fetchUser();
    }
  }, [fetchUser, clerkLoaded, user?.id]); 

  return {
    userData,      // User data from database
    loading,       // True while fetching
    error,         // Error message if fetch failed
    refetch: fetchUser, // Manual refetch function
  };
}
