import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

export function useSocket(projectId: string | null, onWebhook: (data: any) => void) {
  const socketRef = useRef<Socket | null>(null);
  const onWebhookRef = useRef(onWebhook);
  onWebhookRef.current = onWebhook;

  useEffect(() => {
    if (!projectId) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const socket = io(API_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('subscribe', projectId);
    });

    socket.on('webhook', (data) => {
      onWebhookRef.current(data);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket.IO error:', err.message);
    });

    return () => {
      socket.emit('unsubscribe', projectId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [projectId]);

  const emit = useCallback((event: string, data: any) => {
    socketRef.current?.emit(event, data);
  }, []);

  return { socket: socketRef.current, emit };
}
