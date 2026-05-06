import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useWebhooks } from '../hooks/useWebhooks';
import { useSocket } from '../hooks/useSocket';
import WebhookCard from '../components/webhook/WebhookCard';
import WebhookDetail from '../components/webhook/WebhookDetail';
import { Loader2, RefreshCw, Filter, Trash2, Copy, Check, SatelliteDish } from 'lucide-react';
import { api } from '../lib/api';

interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  webhookUrl: string;
  webhookCount: number;
  historyLimitDays: number | null;
}

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { webhooks, loading, fetchWebhooks, addWebhook, deleteWebhook, replayWebhook } = useWebhooks(id || null);
  const [selectedWebhook, setSelectedWebhook] = useState<any>(null);
  const [filterMethod, setFilterMethod] = useState('');

  useEffect(() => {
    if (!id) return;
    setProjectLoading(true);
    api.get(`/projects/${id}`)
      .then((res) => setProject(res.data))
      .catch(() => setProject(null))
      .finally(() => setProjectLoading(false));
  }, [id]);

  useSocket(id || null, useCallback((webhook) => {
    addWebhook(webhook);
  }, [addWebhook]));

  const handleBulkDelete = async () => {
    if (!confirm('Delete all webhooks in this project?')) return;
    await api.post(`/webhooks/projects/${id}/webhooks/bulk-delete`);
    fetchWebhooks();
    setSelectedWebhook(null);
  };

  const copyUrl = () => {
    if (!project?.webhookUrl) return;
    navigator.clipboard.writeText(project.webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filtered = filterMethod
    ? webhooks.filter((w) => w.method.toUpperCase() === filterMethod)
    : webhooks;

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Project Header */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-white">{project?.name || 'Project'}</h1>
            {project?.description && (
              <p className="text-sm text-slate-400 mt-0.5">{project.description}</p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Webhooks this month</p>
            <p className="text-xl font-bold text-white">{project?.webhookCount || 0}</p>
            {project?.historyLimitDays && (
              <p className="text-xs text-amber-400 mt-0.5">{project.historyLimitDays}-day history</p>
            )}
            {project?.historyLimitDays === null && (
              <p className="text-xs text-emerald-400 mt-0.5">Unlimited history</p>
            )}
          </div>
        </div>

        {project?.webhookUrl && (
          <div className="mt-4">
            <label className="text-xs text-slate-500 uppercase tracking-wider mb-1.5 block">
              Your Webhook URL — paste this into Stripe, GitHub, etc.
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 flex items-center gap-3">
                <SatelliteDish className="w-4 h-4 text-emerald-400 shrink-0" />
                <code className="text-sm text-emerald-400 font-mono truncate">{project.webhookUrl}</code>
              </div>
              <button
                onClick={copyUrl}
                className="shrink-0 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Webhook Feed */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-white">Webhook Feed</h2>
          {project?.historyLimitDays && (
            <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
              {project.historyLimitDays}-day history
            </span>
          )}
          {project?.historyLimitDays === null && (
            <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              Unlimited history
            </span>
          )}
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
              <p className="text-sm mt-1">Send a test request to your URL above</p>
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
