'use client';

import { useEffect } from 'react';
import { Button } from '../../ui/Button';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Dashboard]', error);
  }, [error]);

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--paper)' }}>
      <div className="flex-1 flex items-center justify-center p-[24px]">
        <div className="flex flex-col items-center text-center" style={{ maxWidth: 320, gap: 0 }}>
          <div
            className="flex items-center justify-center shrink-0"
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'var(--rose-soft)',
              marginBottom: 16,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2ZM7.25 5a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-1.5 0V5Zm.75 7a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"
                fill="var(--rose)"
              />
            </svg>
          </div>

          <p className="font-ui font-semibold text-ink text-[14px] m-0" style={{ marginBottom: 6 }}>
            Dashboard failed to load
          </p>
          <p className="font-ui text-ash text-[13px] leading-[1.5] m-0" style={{ marginBottom: 24 }}>
            {error.message ?? 'Something went wrong. Your data is safe.'}
          </p>

          <Button variant="solid" size="md" onClick={reset}>
            Try again
          </Button>
        </div>
      </div>
    </div>
  );
}
