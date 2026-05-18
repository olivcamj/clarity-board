'use client';

import { useEffect } from 'react';
import { Button } from '../ui/Button';

function SkeletonBar({ width, height = 10, color = 'var(--sand)' }: { width: string | number; height?: number; color?: string }) {
  return (
    <div
      className="shrink-0"
      style={{ width, height, borderRadius: 4, background: color }}
    />
  );
}

function GhostHeader() {
  return (
    <header aria-hidden="true">
      <div className="flex items-center border-b border-chalk px-[24px] py-[12px] bg-bone" style={{ gap: 10 }}>
        <SkeletonBar width={56} height={14} />
        <div className="flex-1 flex justify-center px-[32px]">
          <div className="w-full max-w-[480px] rounded-[8px]" style={{ height: 34, background: 'var(--sand)' }} />
        </div>
        <SkeletonBar width={90} height={28} />
      </div>
      <div className="flex items-end justify-between px-[24px] py-[20px] border-b border-chalk bg-paper">
        <div className="flex flex-col" style={{ gap: 10 }}>
          <SkeletonBar width={160} height={8}  color="var(--biscuit)" />
          <SkeletonBar width={200} height={38} />
          <SkeletonBar width={220} height={10} color="var(--biscuit)" />
        </div>
        <div className="flex items-center pb-[4px]" style={{ gap: 12 }}>
          <SkeletonBar width={180} height={6}  color="var(--biscuit)" />
          <SkeletonBar width={56}  height={28} color="var(--biscuit)" />
          <SkeletonBar width={60}  height={28} color="var(--biscuit)" />
          <SkeletonBar width={88}  height={30} />
        </div>
      </div>
    </header>
  );
}

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
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--paper)' }}>
      <GhostHeader />

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
            Board failed to load
          </p>
          <p className="font-ui text-ash text-[13px] leading-[1.5] m-0" style={{ marginBottom: 24 }}>
            {error.message ?? 'Something went wrong. Your tasks are safe.'}
          </p>

          <Button variant="solid" size="md" onClick={reset}>
            Try again
          </Button>
        </div>
      </div>
    </div>
  );
}
