import { useState } from 'react';
import { X, Copy, Play, Trash2 } from 'lucide-react';
import { methodColor, formatDate, formatBytes } from '../../lib/utils';
import JsonViewer from './JsonViewer';
import type { Webhook } from '../../hooks/useWebhooks';

export default function WebhookDetail({
  webhook,
  onClose,
  onDelete,
  onReplay,
  canReplay,
}: {
  webhook: Webhook;
  onClose: () => void;
  onDelete: (id: string) => void;
  onReplay: (id: string, url: string) => void;
  canReplay?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'headers' | 'body'>('overview');
  const [replayUrl, setReplayUrl] = useState('http://localhost:3000/webhook');
  const [showReplay, setShowReplay] = useState(false);

  const bodySize = webhook.body ? JSON.stringify(webhook.body).length : 0;

  return (
    <div className="bg-slate-900 border-l border-slate-800 w-full lg:w-96 xl:w-[28rem] flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-xs font-mono font-semibold border ${methodColor(webhook.method)}`}>
            {webhook.method}
          </span>
          {webhook.isReplay && (
            <span className="text-xs text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">REPLAY</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {canReplay && (
            <button
              onClick={() => setShowReplay(!showReplay)}
              className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors"
              title="Replay"
            >
              <Play className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => onDelete(webhook.id)}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showReplay && (
        <div className="p-4 border-b border-slate-800 bg-emerald-500/5">
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Target URL</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={replayUrl}
              onChange={(e) => setReplayUrl(e.target.value)}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button
              onClick={() => { onReplay(webhook.id, replayUrl); setShowReplay(false); }}
              className="bg-emerald-500 hover:bg-emerald-400 text-white px-3 py-1.5 rounded-lg text-sm font-medium"
            >
              Replay
            </button>
          </div>
        </div>
      )}

      <div className="flex border-b border-slate-800">
        {(['overview', 'headers', 'body'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'text-emerald-400 border-b-2 border-emerald-500'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wider">ID</label>
              <div className="flex items-center gap-2 mt-1">
                <code className="text-sm text-slate-300 font-mono">{webhook.id}</code>
                <button
                  onClick={() => navigator.clipboard.writeText(webhook.id)}
                  className="text-slate-500 hover:text-white"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wider">Timestamp</label>
              <p className="text-sm text-slate-300 mt-1">{new Date(webhook.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wider">Source IP</label>
              <p className="text-sm text-slate-300 mt-1 font-mono">{webhook.ip}</p>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wider">User Agent</label>
              <p className="text-sm text-slate-300 mt-1 break-all">{webhook.userAgent || '—'}</p>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wider">Source</label>
              <p className="text-sm text-slate-300 mt-1">{webhook.source || 'custom'}</p>
            </div>
            {webhook.statusCode && (
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wider">Response</label>
                <p className="text-sm text-slate-300 mt-1">
                  {webhook.statusCode} {webhook.responseTime && `• ${webhook.responseTime}ms`}
                </p>
              </div>
            )}
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wider">Size</label>
              <p className="text-sm text-slate-300 mt-1">{formatBytes(bodySize)}</p>
            </div>
          </div>
        )}

        {activeTab === 'headers' && (
          <div className="space-y-2">
            {webhook.headers && typeof webhook.headers === 'object' &&
              Object.entries(webhook.headers).map(([key, value]) => (
                <div key={key} className="flex items-start gap-3 py-2 border-b border-slate-800">
                  <span className="text-blue-400 text-sm font-mono shrink-0 w-32 truncate">{key}</span>
                  <span className="text-slate-300 text-sm break-all">
                    {['authorization', 'cookie'].includes(key.toLowerCase()) ? '••••••••' : String(value)}
                  </span>
                </div>
              ))}
          </div>
        )}

        {activeTab === 'body' && (
          <div>
            {webhook.body ? (
              <JsonViewer data={webhook.body} />
            ) : (
              <p className="text-slate-500 text-sm">No body</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
