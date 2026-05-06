import { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useWebhooks } from '../hooks/useWebhooks';
import { useSSE } from '../hooks/useSSE';
import WebhookCard from '../components/webhook/WebhookCard';
import WebhookDetail from '../components/webhook/WebhookDetail';
import { Loader2, RefreshCw, Filter, Trash2 } from 'lucide-react';
import { api } from '../lib/api';

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const { webhooks, loading, fetchWebhooks, addWebhook, deleteWebhook, replayWebhook } = useWebhooks(id || null);
  const [selectedWebhook, setSelectedWebhook] = useState<any>(null);
  const [filterMethod, setFilterMethod] = useState('');

  useSSE(id || null, useCallback((data) => {
    if (data.type === 'webhook' && data.data) {
      addWebhook(data.data);
    }
  }, [addWebhook]));

  const handleBulkDelete = async () => {
    if (!confirm('Delete all webhooks in this project?')) return;
    await api.post(`/webhooks/projects/${id}/webhooks/bulk-delete`);
    fetchWebhooks();
    setSelectedWebhook(null);
  };

  const filtered = filterMethod
    ? webhooks.filter((w) => w.method.toUpperCase() === filterMethod)
    : webhooks;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-white">Webhook Feed</h1>
          <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-full">
            {filtered.length} webhooks
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Filter className="w-4 h-4 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-4 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">All methods</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
          <button
            onClick={() => fetchWebhooks()}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleBulkDelete}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <p>No webhooks yet</p>
              <p className="text-sm mt-1">Send a test request to see it here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((webhook) => (
                <WebhookCard
                  key={webhook.id}
                  webhook={webhook}
                  selected={selectedWebhook?.id === webhook.id}
                  onClick={() => setSelectedWebhook(webhook)}
                />
              ))}
            </div>
          )}
        </div>

        {selectedWebhook && (
          <WebhookDetail
            webhook={selectedWebhook}
            onClose={() => setSelectedWebhook(null)}
            onDelete={(id) => { deleteWebhook(id); setSelectedWebhook(null); }}
            onReplay={(id, url) => { replayWebhook(id, url); }}
          />
        )}
      </div>
    </div>
  );
}
