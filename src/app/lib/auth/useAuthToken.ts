'use client';

import { useAuth } from '@clerk/nextjs';
import { useCallback } from 'react';

export function useAuthToken() {
  const { getToken } = useAuth();

  return useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('No auth token');
    return token;
  }, [getToken]);
}
