'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

export function SignInGuard({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      const raw = searchParams.get('redirect_url') ?? '/dashboard';
      const safeUrl = raw.startsWith('/') ? raw : '/dashboard';
      router.replace(safeUrl);
    }
  }, [isLoaded, isSignedIn, router, searchParams]);

  // Suppress the sign-in UI until we know the user is not signed in.
  // This prevents the flash of the sign-in page when the Clerk JWT expires
  // mid-session and the middleware redirects here before the client refreshes it.
  if (!isLoaded || isSignedIn) {
    return <div className="min-h-screen" style={{ background: 'var(--paper)' }} />;
  }

  return <>{children}</>;
}
