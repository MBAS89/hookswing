import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../lib/api';

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string | null; email: string };
  likes: number;
  dislikes: number;
  userReaction: 'like' | 'dislike' | null;
  replies: Comment[];
  _count?: { replies: number };
}

// Simple in-memory cache shared across hook instances.
// Keyed by webhookId. Cleared on page refresh.
const commentCache = new Map<string, Comment[]>();

export function useComments(webhookId: string | null) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const fetchedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!webhookId) {
      setComments([]);
      fetchedIdRef.current = null;
      return;
    }
    if (fetchedIdRef.current === webhookId) return;
    fetchedIdRef.current = webhookId;

    const cached = commentCache.get(webhookId);
    if (cached) {
      setComments(cached);
      return;
    }

    setLoading(true);
    api.get(`/webhooks/${webhookId}/comments`)
      .then((res) => {
        const data = res.data as Comment[];
        commentCache.set(webhookId, data);
        setComments(data);
      })
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
  }, [webhookId]);

  const addComment = useCallback(async (content: string, parentId?: string) => {
    if (!webhookId || !content.trim()) return null;
    const res = await api.post(`/webhooks/${webhookId}/comments`, { content: content.trim(), parentId });
    const newComment = res.data as Comment;

    setComments((prev) => {
      let next: Comment[];
      if (parentId) {
        next = prev.map((c) =>
          c.id === parentId
            ? { ...c, replies: [...c.replies, newComment], _count: { ...(c._count || { replies: 0 }), replies: (c._count?.replies || 0) + 1 } }
            : c
        );
      } else {
        next = [...prev, newComment];
      }
      commentCache.set(webhookId, next);
      return next;
    });
    return newComment;
  }, [webhookId]);

  const deleteComment = useCallback(async (commentId: string) => {
    if (!webhookId) return;
    await api.delete(`/webhooks/${webhookId}/comments/${commentId}`);
    setComments((prev) => {
      const next = prev.filter((c) => c.id !== commentId).map((c) => ({
        ...c,
        replies: c.replies.filter((r) => r.id !== commentId),
      }));
      commentCache.set(webhookId, next);
      return next;
    });
  }, [webhookId]);

  const reactComment = useCallback(async (commentId: string, type: 'like' | 'dislike') => {
    const res = await api.post(`/webhooks/comments/${commentId}/react`, { type });
    const { likes, dislikes, userReaction } = res.data;

    setComments((prev) => {
      const next = prev.map((c) => {
        if (c.id === commentId) {
          return { ...c, likes, dislikes, userReaction };
        }
        return {
          ...c,
          replies: c.replies.map((r) =>
            r.id === commentId ? { ...r, likes, dislikes, userReaction } : r
          ),
        };
      });
      if (webhookId) commentCache.set(webhookId, next);
      return next;
    });
  }, [webhookId]);

  const refresh = useCallback(() => {
    if (!webhookId) return;
    commentCache.delete(webhookId);
    fetchedIdRef.current = null;
    setLoading(true);
    api.get(`/webhooks/${webhookId}/comments`)
      .then((res) => {
        const data = res.data as Comment[];
        commentCache.set(webhookId, data);
        setComments(data);
      })
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
  }, [webhookId]);

  return { comments, loading, addComment, deleteComment, reactComment, refresh };
}
