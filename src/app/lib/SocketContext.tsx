'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '@clerk/nextjs';
import { getSocket, disconnectSocket, type AppSocket } from './socket';
import { useAuthToken } from './auth/useAuthToken';

type SocketStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

interface SocketContextValue {
  socket: AppSocket | null;
  status: SocketStatus;
}

const SocketContext = createContext<SocketContextValue | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const { isSignedIn } = useAuth();
  const getToken = useAuthToken();
  const [socket, setSocket] = useState<AppSocket | null>(null);
  const [status, setStatus] = useState<SocketStatus>('idle');

  useEffect(() => {
    if (!isSignedIn) {
      disconnectSocket();
      setSocket(null);
      setStatus('idle');
      return;
    }

    let appSocket: AppSocket;
    try {
      appSocket = getSocket(getToken);
    } catch {
      setStatus('error');
      return;
    }

    const handleConnect = () => setStatus('connected');
    const handleDisconnect = () => setStatus('disconnected');
    const handleConnectError = () => setStatus('error');

    appSocket.on('connect', handleConnect);
    appSocket.on('disconnect', handleDisconnect);
    appSocket.on('connect_error', handleConnectError);

    setSocket(appSocket);
    if (!appSocket.connected) {
      setStatus('connecting');
      appSocket.connect();
    }

    return () => {
      appSocket.off('connect', handleConnect);
      appSocket.off('disconnect', handleDisconnect);
      appSocket.off('connect_error', handleConnectError);
    };
  }, [isSignedIn, getToken]);

  // Tear down the connection on true unmount (e.g. whole app unmounting) 
  // the sign-out case is already handled above when `isSignedIn` flips false.
  useEffect(() => {
    return () => disconnectSocket();
  }, []);

  return (
    <SocketContext.Provider value={{ socket, status }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used inside SocketProvider');
  return ctx;
}
