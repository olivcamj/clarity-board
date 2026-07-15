'use client';

import { useEffect } from 'react';
import { useSocket } from '../lib/SocketContext';
import type { MemberJoinedPayload, TeamMemberDto } from '../types/socket';

// Joins the `team:{teamId}` room for every team passed in, and reports newly
// joined members back to the caller so a members list can be kept live.
// `onMemberJoined` is intentionally excluded from the effect deps — callers
// should wrap it in useCallback, but re-running the join/leave cycle on every
// render (because of an unmemoized callback) would flap room membership.
export function useTeamMembersRealtime(
  teamIds: string[],
  onMemberJoined: (teamId: string, member: TeamMemberDto) => void,
): void {
  const { socket } = useSocket();
  const teamIdsKey = teamIds.join(',');

  useEffect(() => {
    if (!socket || !teamIds.length) return;

    // Re-emitted on every (re)connect, mirroring useTasks' join-board — the
    // server drops room membership on disconnect, so a network blip would
    // otherwise silently stop live member updates.
    const joinAll = () => teamIds.forEach(teamId => socket.emit('join-team', { teamId }));

    joinAll();
    socket.on('connect', joinAll);

    const onJoined = (payload: MemberJoinedPayload) => {
      onMemberJoined(payload.teamId, payload.member);
    };
    socket.on('member:joined', onJoined);

    return () => {
      socket.off('connect', joinAll);
      socket.off('member:joined', onJoined);
      teamIds.forEach(teamId => socket.emit('leave-team', { teamId }));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, teamIdsKey]);
}
