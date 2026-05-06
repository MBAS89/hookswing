import { useEffect, useRef, useCallback } from 'react';

export function useSSE(projectId: string | null, onMessage: (data: any) => void) {
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (!projectId) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const url = `/api/stream?projectId=${projectId}&token=${token}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      es.close();
      setTimeout(connect, 3000);
    };
  }, [projectId, onMessage]);

  useEffect(() => {
    connect();
    return () => {
      eventSourceRef.current?.close();
    };
  }, [connect]);
}
