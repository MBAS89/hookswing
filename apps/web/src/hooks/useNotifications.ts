import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { api } from '../lib/api';

const API_URL = (import.meta as any).env?.VITE_API_URL || undefined;

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;

    // First note (E5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.type = 'sine';
    osc1.frequency.value = 659.25;
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc1.start(now);
    osc1.stop(now + 0.2);

    // Second note (B5) - slightly delayed for a pleasant chime
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = 'sine';
    osc2.frequency.value = 987.77;
    gain2.gain.setValueAtTime(0.12, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.35);
  } catch {
    // Audio not supported or blocked by browser policy
  }
}

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
      playNotificationSound();
    });

    socket.on('connect_error', (err) => {
      console.error('Notification socket error:', err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // Refresh both notifications and preferences
  const refresh = useCallback(async () => {
    await Promise.all([fetchNotifications(), fetchPreferences()]);
  }, [fetchNotifications, fetchPreferences]);

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
    refresh,
  };
}
