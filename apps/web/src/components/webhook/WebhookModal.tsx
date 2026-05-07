import { useState } from 'react';
import { X, Copy, CheckCircle2, AlertCircle, Clock, Globe, Hash, FileJson, ArrowRightLeft, MessageSquare, Terminal } from 'lucide-react';
import { methodColor, statusColor, formatBytes, formatDate } from '../../lib/utils';
import JsonViewer from './JsonViewer';
import type { Webhook } from '../../hooks/useWebhooks';

interface WebhookModalProps {
  webhook: Webhook;
  onClose: () => void;
}

export default function WebhookModal({ webhook, onClose }: WebhookModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'headers' | 'body' | 'query' | 'response'>('overview');
  const [copied, setCopied] = useState(false);
  const bodySize = webhook.body ? JSON.stringify(webhook.body).length : 0;

  const copyId = () => {
    navigator.clipboard.writeText(webhook.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs = [
    { key: 'overview' as const, label: 'Overview', icon: Globe },
    { key: 'headers' as const, label: 'Headers', icon: Hash },
    { key: 'body' as const, label: 'Body', icon: FileJson },
    { key: 'query' as const, label: 'Query', icon: ArrowRightLeft },
    ...(webhook.statusCode ? [{ key: 'response' as const, label: 'Response', icon: Terminal }] : []),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-800/50">
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 rounded-md text-sm font-mono font-bold border ${methodColor(webhook.method)}`}>
              {webhook.method}
            </span>
            {webhook.statusCode && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700">
                <span className={`w-2 h-2 rounded-full ${statusColor(webhook.statusCode)}`} />
                <span className={`text-sm font-mono font-semibold ${
                  webhook.statusCode >= 200 && webhook.statusCode < 300 ? 'text-emerald-400'
                    : webhook.statusCode >= 400 ? 'text-red-400'
                    : 'text-amber-400'
                }`}>
                  {webhook.statusCode}
                </span>
                {webhook.responseTime && (
                  <span className="text-xs text-slate-500">{webhook.responseTime}ms</span>
                )}
              </div>
            )}
            {webhook.isReplay && (
              <span className="flex items-center gap-1 text-xs text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-1 rounded-md">
                <Clock className="w-3 h-3" />
                REPLAY
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 px-5">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'text-emerald-400 border-emerald-500'
                  : 'text-slate-500 border-transparent hover:text-slate-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-5">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoCard label="ID" value={webhook.id} monospace copy onCopy={copyId} copied={copied} />
              <InfoCard label="Timestamp" value={new Date(webhook.createdAt).toLocaleString()} />
              <InfoCard label="Relative Time" value={formatDate(webhook.createdAt)} />
              <InfoCard label="Source IP" value={webhook.ip} monospace />
              <InfoCard label="Source" value={webhook.source || 'custom'} />
              <InfoCard label="User Agent" value={webhook.userAgent || '—'} />
              <InfoCard label="Size" value={formatBytes(bodySize)} />
              <InfoCard label="Is Replay" value={webhook.isReplay ? 'Yes' : 'No'} />
              {webhook.originalId && (
                <InfoCard label="Original ID" value={webhook.originalId} monospace />
              )}
              {webhook.statusCode && (
                <InfoCard
                  label="Response Status"
                  value={`${webhook.statusCode} ${webhook.responseTime ? `(${webhook.responseTime}ms)` : ''}`}
                  highlight={webhook.statusCode >= 200 && webhook.statusCode < 300 ? 'success'
                    : webhook.statusCode >= 400 ? 'error'
                    : 'warning'}
                />
              )}
            </div>
          )}

          {activeTab === 'headers' && (
            <div className="bg-slate-800/50 rounded-xl border border-slate-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-800/80">
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-2.5 w-1/3">Header</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-2.5">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {webhook.headers && typeof webhook.headers === 'object' && Object.entries(webhook.headers).length > 0 ? (
                    Object.entries(webhook.headers).map(([key, value]) => (
                      <tr key={key} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30">
                        <td className="px-4 py-2.5 text-blue-400 font-mono text-xs">{key}</td>
                        <td className="px-4 py-2.5 text-slate-300 break-all">
                          {['authorization', 'cookie'].includes(key.toLowerCase()) ? (
                            <span className="text-slate-600">••••••••</span>
                          ) : (
                            String(value)
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="px-4 py-8 text-center text-slate-500 text-sm">No headers</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'body' && (
            <div>
              {webhook.body ? (
                <JsonViewer data={webhook.body} />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                  <FileJson className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm">No body</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'query' && (
            <div className="bg-slate-800/50 rounded-xl border border-slate-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-800/80">
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-2.5 w-1/3">Parameter</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-2.5">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {webhook.query && typeof webhook.query === 'object' && Object.entries(webhook.query).length > 0 ? (
                    Object.entries(webhook.query).map(([key, value]) => (
                      <tr key={key} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30">
                        <td className="px-4 py-2.5 text-emerald-400 font-mono text-xs">{key}</td>
                        <td className="px-4 py-2.5 text-slate-300 break-all">{String(value)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="px-4 py-8 text-center text-slate-500 text-sm">No query parameters</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'response' && (
            <div className="space-y-4">
              {webhook.statusCode && (
                <div className="flex items-center gap-3 bg-slate-800/50 rounded-xl border border-slate-800 p-4">
                  {webhook.statusCode >= 200 && webhook.statusCode < 300 ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-red-400" />
                  )}
                  <div>
                    <p className="text-lg font-bold text-white">{webhook.statusCode}</p>
                    {webhook.responseTime && (
                      <p className="text-xs text-slate-500">{webhook.responseTime}ms response time</p>
                    )}
                  </div>
                </div>
              )}

              {webhook.responseBody ? (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Response Body</h4>
                  <div className="bg-slate-800/50 rounded-xl border border-slate-800 p-4 overflow-auto max-h-[50vh]">
                    <pre className="text-sm text-slate-300 font-mono whitespace-pre-wrap">{webhook.responseBody}</pre>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                  <MessageSquare className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm">No response body</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  label,
  value,
  monospace,
  copy,
  onCopy,
  copied,
  highlight,
}: {
  label: string;
  value: string;
  monospace?: boolean;
  copy?: boolean;
  onCopy?: () => void;
  copied?: boolean;
  highlight?: 'success' | 'error' | 'warning';
}) {
  const highlightClass = highlight === 'success' ? 'text-emerald-400'
    : highlight === 'error' ? 'text-red-400'
    : highlight === 'warning' ? 'text-amber-400'
    : 'text-slate-200';

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-800 p-4">
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{label}</p>
      <div className="flex items-center gap-2">
        <p className={`text-sm ${monospace ? 'font-mono' : ''} ${highlightClass} break-all`}>
          {value}
        </p>
        {copy && (
          <button
            onClick={onCopy}
            className="text-slate-500 hover:text-emerald-400 transition-colors shrink-0"
          >
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
}
