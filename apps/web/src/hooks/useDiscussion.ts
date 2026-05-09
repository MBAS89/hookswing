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
  const socketRef = useRef<Socket | null>(null);

  const fetchComments = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    try {
      const res = await api.get(`/teams/${teamId}/discussion`);
      setComments(res.data.comments);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    if (!teamId) return;

    fetchComments();

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
      setComments((prev) => [comment, ...prev]);
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
  }, [teamId, fetchComments]);

  const addReply = useCallback(async (webhookId: string, content: string, parentId?: string) => {
    if (!content.trim()) return;
    const res = await api.post(`/webhooks/${webhookId}/comments`, { content: content.trim(), parentId });
    // The socket event 'comment:new' will add it to the list
    return res.data;
  }, []);

  const react = useCallback(async (commentId: string, type: 'like' | 'dislike') => {
    await api.post(`/webhooks/comments/${commentId}/react`, { type });
    // The socket event 'comment:reacted' will update the list
  }, []);

  const deleteComment = useCallback(async (webhookId: string, commentId: string) => {
    await api.delete(`/webhooks/${webhookId}/comments/${commentId}`);
    // The socket event 'comment:deleted' will remove it
  }, []);

  return { comments, loading, fetchComments, addReply, react, deleteComment };
}
