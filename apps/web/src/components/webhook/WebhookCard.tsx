import { useState } from 'react';
import { methodColor, statusColor, formatDate, formatBytes } from '../../lib/utils';
import { GitCompare, ChevronDown, ChevronUp, Copy, Play } from 'lucide-react';
import JsonViewer from './JsonViewer';

interface Webhook {
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

export default function WebhookCard({
  webhook,
  selected,
  onClick,
  onCompare,
  onReplayClick,
  compareMode,
  isCompareSelected,
  canReplay,
}: {
  webhook: Webhook;
  selected: boolean;
  onClick: () => void;
  onCompare?: () => void;
  onReplayClick?: () => void;
  compareMode?: boolean;
  isCompareSelected?: boolean;
  canReplay?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'headers' | 'body'>('body');
  const bodySize = webhook.body ? JSON.stringify(webhook.body).length : 0;

  return (
    <div
      className={`rounded-lg border transition-all ${
        selected
          ? 'bg-emerald-500/5 border-emerald-500/30'
          : isCompareSelected
          ? 'bg-amber-500/5 border-amber-500/30'
          : 'bg-slate-800/50 border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Card header — clickable for selection, or expand toggle */}
      <button
        onClick={onClick}
        className="w-full text-left p-4"
      >
        <div className="flex items-center gap-2 mb-2">
          <span className={`px-2 py-0.5 rounded text-xs font-mono font-semibold border ${methodColor(webhook.method)}`}>
            {webhook.method}
          </span>
          {webhook.statusCode && (
            <span className={`w-2 h-2 rounded-full ${statusColor(webhook.statusCode)}`} />
          )}
          {webhook.isReplay && (
            <span className="text-xs text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">REPLAY</span>
          )}

          <span className="text-xs text-slate-500 ml-auto">{formatDate(webhook.createdAt)}</span>

          {onCompare && (
            <span
              onClick={(e) => { e.stopPropagation(); onCompare(); }}
              className={`shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium cursor-pointer transition-colors ${
                isCompareSelected
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : compareMode
                  ? 'bg-slate-700 text-slate-300 border border-slate-600 hover:bg-slate-600'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 hover:text-slate-300 hover:bg-slate-700'
              }`}
              title="Select for compare"
            >
              <GitCompare className="w-3 h-3" />
              {compareMode ? 'Pick' : 'Diff'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span>{webhook.source || 'custom'}</span>
          <span>•</span>
          <span>{formatBytes(bodySize)}</span>
          <span>•</span>
          <span className="font-mono">{webhook.ip}</span>
          {webhook.statusCode && (
            <>
              <span>•</span>
              <span className={`font-mono ${webhook.statusCode >= 200 && webhook.statusCode < 300 ? 'text-emerald-400' : webhook.statusCode >= 400 ? 'text-red-400' : 'text-amber-400'}`}>
                {webhook.statusCode}
              </span>
            </>
          )}

          {canReplay && onReplayClick && (
            <button
              onClick={(e) => { e.stopPropagation(); onReplayClick(); }}
              className="flex items-center gap-1 text-slate-500 hover:text-emerald-400 transition-colors px-1.5 py-0.5 rounded hover:bg-slate-700/50"
              title="Replay"
            >
              <Play className="w-3 h-3" />
              <span className="text-[10px]">Replay</span>
            </button>
          )}
          {/* Expand toggle */}
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="flex items-center gap-1 text-slate-500 hover:text-emerald-400 transition-colors px-1.5 py-0.5 rounded hover:bg-slate-700/50"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span className="text-[10px]">{expanded ? 'Collapse' : 'Expand'}</span>
          </button>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-slate-800">
          {/* Tabs */}
          <div className="flex border-b border-slate-800">
            {(['overview', 'headers', 'body'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 text-xs font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? 'text-emerald-400 border-b-2 border-emerald-500'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-4 space-y-3 max-h-80 overflow-auto">
            {activeTab === 'overview' && (
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-xs uppercase tracking-wider">ID</span>
                  <div className="flex items-center gap-1.5">
                    <code className="text-slate-300 font-mono text-xs">{webhook.id.slice(0, 16)}…</code>
                    <button
                      onClick={() => navigator.clipboard.writeText(webhook.id)}
                      className="text-slate-600 hover:text-white"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-xs uppercase tracking-wider">Timestamp</span>
                  <span className="text-slate-300">{new Date(webhook.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-xs uppercase tracking-wider">IP</span>
                  <span className="text-slate-300 font-mono text-xs">{webhook.ip}</span>
                </div>
                {webhook.userAgent && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-xs uppercase tracking-wider">User Agent</span>
                    <span className="text-slate-300 text-xs truncate max-w-[200px]">{webhook.userAgent}</span>
                  </div>
                )}
                {webhook.statusCode && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-xs uppercase tracking-wider">Response</span>
                    <span className="text-slate-300">
                      {webhook.statusCode} {webhook.responseTime && `• ${webhook.responseTime}ms`}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-xs uppercase tracking-wider">Size</span>
                  <span className="text-slate-300">{formatBytes(bodySize)}</span>
                </div>
              </div>
            )}

            {activeTab === 'headers' && (
              <div className="space-y-1.5">
                {webhook.headers && typeof webhook.headers === 'object' ? (
                  Object.entries(webhook.headers).map(([key, value]) => (
                    <div key={key} className="flex items-start gap-3 py-1.5 border-b border-slate-800/50 last:border-0">
                      <span className="text-blue-400 text-xs font-mono shrink-0 w-28 truncate">{key}</span>
                      <span className="text-slate-300 text-xs break-all">
                        {['authorization', 'cookie'].includes(key.toLowerCase()) ? '••••••••' : String(value)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">No headers</p>
                )}
              </div>
            )}

            {activeTab === 'body' && (
              <div>
                {webhook.body ? (
                  <JsonViewer data={webhook.body} />
                ) : (
                  <p className="text-xs text-slate-500">No body</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
