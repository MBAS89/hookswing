import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { api } from '../lib/api';

const API_URL = (import.meta as any).env?.VITE_API_URL || undefined;

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, any>;
  read: boolean;
  createdAt: string;
}

export interface NotificationPreference {
  id: string;
  type: string;
  enabled: boolean;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // Fetch notifications + unread count
  const fetchNotifications = useCallback(async () => {
    try {
      const [notifRes, countRes] = await Promise.all([
        api.get('/notifications'),
        api.get('/notifications/unread-count'),
      ]);
      setNotifications(notifRes.data.notifications || []);
      setUnreadCount(countRes.data.count || 0);
    } catch (e) {
      // silent fail
    }
  }, []);

  const fetchPreferences = useCallback(async () => {
    try {
      const res = await api.get('/notifications/preferences');
      setPreferences(res.data.preferences || []);
    } catch (e) {
      // silent fail
    }
  }, []);

  // Mark single read
  const markRead = useCallback(async (id: string) => {
    await api.post(`/notifications/${id}/read`);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  // Mark all read
  const markAllRead = useCallback(async () => {
    await api.post('/notifications/read-all');
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (id: string) => {
    await api.delete(`/notifications/${id}`);
    const wasUnread = notifications.find((n) => n.id === id)?.read === false;
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1));
  }, [notifications]);

  // Update preference
  const updatePreference = useCallback(async (type: string, enabled: boolean) => {
    await api.patch('/notifications/preferences', { type, enabled });
    setPreferences((prev) =>
      prev.map((p) => (p.type === type ? { ...p, enabled } : p))
    );
  }, []);

  // Socket.IO for real-time notifications
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const socket = io(API_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      // user room joined automatically on server
    });

    socket.on('notification', (notif: Notification) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((c) => c + 1);
    });

    socket.on('connect_error', (err) => {
      console.error('Notification socket error:', err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
    fetchPreferences();
  }, [fetchNotifications, fetchPreferences]);

  return {
    notifications,
    unreadCount,
    preferences,
    loading,
    markRead,
    markAllRead,
    deleteNotification,
    updatePreference,
    refresh: fetchNotifications,
  };
}
