import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

export interface Webhook {
  id: string;
  method: string;
  headers: any;
  body: any;
  query: any;
  ip: string;
  userAgent: string | null;
  source: string | null;
  statusCode: number | null;
  responseTime: number | null;
  isReplay: boolean;
  originalId: string | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function useWebhooks(projectId: string | null) {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);

  const fetchWebhooks = useCallback(async (page = 1) => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await api.get(`/projects/${projectId}/webhooks?page=${page}`);
      setWebhooks(res.data.webhooks);
      setPagination(res.data.pagination);
    } catch {
      setWebhooks([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchWebhooks(1);
  }, [fetchWebhooks]);

  const addWebhook = useCallback((webhook: Webhook) => {
    setWebhooks((prev) => [webhook, ...prev].slice(0, pagination.limit));
  }, [pagination.limit]);

  const deleteWebhook = useCallback(async (id: string) => {
    await api.delete(`/webhooks/${id}`);
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const replayWebhook = useCallback(async (id: string, targetUrl: string) => {
    const res = await api.post(`/webhooks/${id}/replay`, { targetUrl });
    return res.data;
  }, []);

  return { webhooks, pagination, loading, fetchWebhooks, addWebhook, deleteWebhook, replayWebhook };
}
