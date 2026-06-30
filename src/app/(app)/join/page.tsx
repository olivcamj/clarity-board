'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useAuthToken } from '../../lib/auth/useAuthToken';
import { joinViaInvite } from '../../lib/api/teams';
import { Spark } from '../../ui/Spark';

type State =
  | { status: 'loading' }
  | { status: 'success'; teamName: string; teamId: string }
  | { status: 'error'; message: string };

function JoinPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const getToken = useAuthToken();
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    if (!token) {
      setState({ status: 'error', message: 'No invite token found in the link.' });
      return;
    }

    (async () => {
      try {
        const authToken = await getToken();
        const result = await joinViaInvite(authToken, token);
        setState({ status: 'success', teamName: result.teamName, teamId: result.teamId });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Invalid or expired invite link.';
        setState({ status: 'error', message });
      }
    })();
  }, [token, getToken]);

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen gap-[24px]"
      style={{ background: 'var(--paper)' }}
    >
      {/* Logo mark */}
      <div
        className="flex items-center justify-center rounded-[10px] mb-[8px]"
        style={{ width: 40, height: 40, background: 'var(--ember)' }}
        aria-hidden="true"
      >
        <Spark size={18} color="#fff" />
      </div>

      {state.status === 'loading' && (
        <>
          <p className="font-display text-[28px] font-normal text-ink">Joining team…</p>
          <p className="font-ui text-[13px] text-ash">Verifying your invite link.</p>
        </>
      )}

      {state.status === 'success' && (
        <>
          <p className="font-display text-[28px] font-normal text-ink">
            You&rsquo;re in.
          </p>
          <p className="font-ui text-[14px] text-soot text-center max-w-[320px]">
            You&rsquo;ve joined <strong>{state.teamName}</strong>. You can now access the team&rsquo;s boards.
          </p>
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="font-ui text-[13px] font-medium text-white px-[20px] py-[10px] rounded-[8px] transition-colors duration-150"
            style={{ background: 'var(--ember)' }}
          >
            Go to workspace
          </button>
        </>
      )}

      {state.status === 'error' && (
        <>
          <p className="font-display text-[28px] font-normal text-ink">Invite invalid</p>
          <p className="font-ui text-[13px] text-ash text-center max-w-[320px]">
            {state.message}
          </p>
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="font-ui text-[13px] text-ash underline"
          >
            Back to workspace
          </button>
        </>
      )}
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--paper)' }}>
          <p className="font-ui text-smoke text-[13px]">Loading…</p>
        </div>
      }
    >
      <JoinPageInner />
    </Suspense>
  );
}
