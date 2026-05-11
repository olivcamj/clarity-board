'use client';

import { useEffect } from 'react';

export default function TaskBoardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[TaskBoard]', error);
  }, [error]);

  return (
    <div style={{ width: '100%', overflowX: 'auto', background: 'var(--paper)' }}>
      <div style={{ display: 'flex', gap: 20, padding: 24, minWidth: 'max-content', margin: '0 auto' }}>
        <div
          style={{
            width: 260,
            minHeight: 384,
            flexShrink: 0,
            background: 'var(--bone)',
            borderRadius: 12,
            padding: 14,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'var(--rose-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
              flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2ZM7.25 5a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-1.5 0V5Zm.75 7a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"
                fill="var(--rose)"
              />
            </svg>
          </div>

          <p
            className="font-ui font-semibold text-ink text-center"
            style={{ fontSize: 14, marginBottom: 4 }}
          >
            Board failed to load
          </p>
          <p
            className="font-ui text-ash text-center"
            style={{ fontSize: 12, lineHeight: 1.5, marginBottom: 20 }}
          >
            {error.message ?? 'Something went wrong. Your tasks are safe.'}
          </p>

          <button
            onClick={reset}
            className="font-ui font-medium"
            style={{
              fontSize: 12,
              padding: '7px 16px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              background: 'var(--slate)',
              color: '#fff',
              transition: 'background 150ms',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--slate-hot)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--slate)')}
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}
