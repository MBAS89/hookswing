import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { api } from '../lib/api';

const API_URL = (import.meta as any).env?.VITE_API_URL || undefined;

export interface SupportMessage {
  id: string;
  userId: string;
  message: string;
  isAdmin: boolean;
  read: boolean;
  createdAt: string;
  user?: { id: string; name: string | null; email: string };
}

export function useSupport() {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/support/messages');
      const msgs = res.data.messages || [];
      setMessages(msgs);
      setUnreadCount(msgs.filter((m: SupportMessage) => m.isAdmin && !m.read).length);
    } catch {
      setMessages([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (message: string) => {
    const res = await api.post('/support/messages', { message });
    return res.data.chat;
  }, []);

  const markRead = useCallback(async () => {
    await api.post('/support/mark-read');
    setMessages((prev) => prev.map((m) => (m.isAdmin && !m.read ? { ...m, read: true } : m)));
    setUnreadCount(0);
  }, []);

  // Socket.IO for real-time support messages
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const socket = io(API_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('support:join');
    });

    socket.on('support:message', (msg: SupportMessage) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      if (msg.isAdmin && !msg.read) {
        setUnreadCount((c) => c + 1);
      }
    });

    socket.on('connect_error', (err) => {
      console.error('Support socket error:', err.message);
    });

    return () => {
      socket.emit('support:leave');
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  return {
    messages,
    unreadCount,
    loading,
    fetchMessages,
    sendMessage,
    markRead,
  };
}

// Admin hook for viewing all support conversations
export function useSupportAdmin() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.get('/admin/support');
      setConversations(res.data.conversations || []);
    } catch {
      setConversations([]);
    }
  }, []);

  const fetchMessages = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/support/${userId}`);
      setMessages(res.data.messages || []);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const sendReply = useCallback(async (userId: string, message: string) => {
    const res = await api.post(`/admin/support/${userId}/reply`, { message });
    return res.data.chat;
  }, []);

  const markRead = useCallback(async (userId: string) => {
    await api.post(`/admin/support/${userId}/mark-read`);
    setConversations((prev) =>
      prev.map((c) => (c.user.id === userId ? { ...c, unreadCount: 0 } : c))
    );
  }, []);

  const clearChat = useCallback(async (userId: string) => {
    await api.delete(`/admin/support/${userId}`);
    setConversations((prev) => prev.filter((c) => c.user.id !== userId));
    if (activeUserId === userId) {
      setActiveUserId(null);
      setMessages([]);
    }
  }, [activeUserId]);

  // Socket.IO for real-time admin support messages
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const socket = io(API_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('support:join_admin');
    });

    socket.on('support:message', (msg: SupportMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        // Only add if this is the active conversation
        if (activeUserId && msg.userId === activeUserId) {
          return [...prev, msg];
        }
        return prev;
      });

      setConversations((prev) => {
        const existing = prev.find((c) => c.user.id === msg.userId);
        if (!existing) {
          // New conversation
          return [
            {
              user: msg.user,
              unreadCount: msg.isAdmin ? 0 : 1,
              lastMessageAt: msg.createdAt,
              messageCount: 1,
            },
            ...prev,
          ];
        }
        return prev.map((c) =>
          c.user.id === msg.userId
            ? {
                ...c,
                unreadCount: msg.isAdmin ? c.unreadCount : c.unreadCount + 1,
                lastMessageAt: msg.createdAt,
                messageCount: c.messageCount + 1,
              }
            : c
        );
      });
    });

    socket.on('connect_error', (err) => {
      console.error('Admin support socket error:', err.message);
    });

    return () => {
      socket.emit('support:leave_admin');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [activeUserId]);

  return {
    conversations,
    activeUserId,
    messages,
    loading,
    setActiveUserId,
    fetchConversations,
    fetchMessages,
    sendReply,
    markRead,
    clearChat,
  };
}
