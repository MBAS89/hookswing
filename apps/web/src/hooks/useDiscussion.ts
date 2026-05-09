import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { api } from '../lib/api';

const API_URL = (import.meta as any).env?.VITE_API_URL || undefined;

export interface DiscussionComment {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string | null; email: string };
  likes: number;
  dislikes: number;
  userReaction: 'like' | 'dislike' | null;
  replies: DiscussionComment[];
  _count?: { replies: number };
  webhook: { id: string; method: string; source: string | null; projectId: string };
  projectName: string;
}

export function useDiscussion(teamId: string | null) {
  const [comments, setComments] = useState<DiscussionComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const lastFetchedRef = useRef<string | null>(null);

  // Fetch comments on mount / teamId change
  useEffect(() => {
    if (!teamId) {
      setComments([]);
      setError(null);
      lastFetchedRef.current = null;
      return;
    }

    // Prevent double-fetch in React Strict Mode for the same teamId
    if (lastFetchedRef.current === teamId) return;
    lastFetchedRef.current = teamId;

    let cancelled = false;
    setLoading(true);
    setError(null);

    api.get(`/teams/${teamId}/discussion`)
      .then((res) => {
        if (!cancelled) setComments(res.data.comments ?? []);
      })
      .catch((err) => {
        if (!cancelled) {
          setComments([]);
          setError(err.response?.data?.error || 'Failed to load discussions');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [teamId]);

  // Socket.IO for real-time updates
  useEffect(() => {
    if (!teamId) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const socket = io(API_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('team:join', teamId);
    });

    socket.on('comment:new', (comment: DiscussionComment) => {
      setComments((prev) => {
        // Prevent duplicates
        if (prev.some((c) => c.id === comment.id)) return prev;
        return [comment, ...prev];
      });
    });

    socket.on('comment:deleted', ({ commentId }: { commentId: string }) => {
      setComments((prev) =>
        prev
          .filter((c) => c.id !== commentId)
          .map((c) => ({ ...c, replies: c.replies.filter((r) => r.id !== commentId) }))
      );
    });

    socket.on('comment:reacted', ({ commentId, likes, dislikes }: { commentId: string; likes: number; dislikes: number }) => {
      setComments((prev) =>
        prev.map((c) => {
          if (c.id === commentId) return { ...c, likes, dislikes };
          return { ...c, replies: c.replies.map((r) => (r.id === commentId ? { ...r, likes, dislikes } : r)) };
        })
      );
    });

    return () => {
      socket.emit('team:leave', teamId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [teamId]);

  const fetchComments = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/teams/${teamId}/discussion`);
      setComments(res.data.comments ?? []);
      lastFetchedRef.current = teamId;
    } catch (err: any) {
      setComments([]);
      setError(err.response?.data?.error || 'Failed to load discussions');
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  const addReply = useCallback(async (webhookId: string, content: string, parentId?: string) => {
    if (!content.trim()) return;
    const res = await api.post(`/webhooks/${webhookId}/comments`, { content: content.trim(), parentId });
    return res.data;
  }, []);

  const react = useCallback(async (commentId: string, type: 'like' | 'dislike') => {
    await api.post(`/webhooks/comments/${commentId}/react`, { type });
  }, []);

  const deleteComment = useCallback(async (webhookId: string, commentId: string) => {
    await api.delete(`/webhooks/${webhookId}/comments/${commentId}`);
  }, []);

  return { comments, loading, error, fetchComments, addReply, react, deleteComment };
}
