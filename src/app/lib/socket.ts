import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '../types/socket';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL;

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: AppSocket | null = null;

// Lazy singleton —> connecting is the caller's responsibility (call `.connect()`
// once auth is ready), so a signed-out user never opens a socket at all.
export function getSocket(getToken: () => Promise<string>): AppSocket {
  if (socket) return socket;

  if (!SOCKET_URL) {
    throw new Error(
      'NEXT_PUBLIC_SOCKET_URL is not set — cannot connect to the realtime server.'
    );
  }

  socket = io(SOCKET_URL, {
    autoConnect: false,
    // Re-invoked on every (re)connection attempt, so a token that expired
    // since the last connect is refreshed automatically on reconnect.
    auth: (authCallback) => {
      getToken()
        .then((token) => authCallback({ token }))
        .catch(() => authCallback({}));
    },
  });

  return socket;
}

export function disconnectSocket() {
  if (!socket) return;
  socket.disconnect();
  socket = null;
}
