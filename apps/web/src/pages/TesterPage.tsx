import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { useToast } from '../hooks/useToast';
import {
  Send, Loader2, CheckCircle, AlertCircle, Clock,
  Globe, Code2, FileJson, ChevronDown, Zap, RefreshCw,
  ArrowRight, KeyRound, Play,
} from 'lucide-react';
import JsonViewer from '../components/webhook/JsonViewer';

interface Provider {
  key: string;
  name: string;
  events: { key: string; label: string }[];
}

interface TestResponse {
  success: boolean;
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body: any;
  };
  response: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: any;
  } | null;
  responseTime: number;
  source: string;
  error?: string;
}

export default function TesterPage() {
  const toast = useToast();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [customPayload, setCustomPayload] = useState('');
  const [useCustomPayload, setUseCustomPayload] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<TestResponse | null>(null);
  const [history, setHistory] = useState<TestResponse[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<'request' | 'response' | 'headers'>('response');

  // Fetch providers on mount
  useEffect(() => {
    api.get('/tester/providers')
      .then((res) => {
        setProviders(res.data.providers);
        setLoadingProviders(false);
      })
      .catch(() => setLoadingProviders(false));
  }, []);

  // Reset event when provider changes
  useEffect(() => {
    setSelectedEvent('');
    setCustomPayload('');
    setUseCustomPayload(false);
  }, [selectedProvider]);

  const currentProvider = providers.find((p) => p.key === selectedProvider);
  const currentEvent = currentProvider?.events.find((e) => e.key === selectedEvent);

  const handleSend = useCallback(async () => {
    if (!targetUrl.trim()) {
      toast.error('Please enter a target URL');
      return;
    }
    if (!selectedProvider || !selectedEvent) {
      toast.error('Please select a provider and event type');
      return;
    }

    setSending(true);
    setResult(null);

    try {
      const body: any = { targetUrl, provider: selectedProvider, eventType: selectedEvent };
      if (useCustomPayload && customPayload.trim()) {
        try {
          body.customPayload = JSON.parse(customPayload);
        } catch {
          toast.error('Custom payload is not valid JSON');
          setSending(false);
          return;
        }
      }

      const res = await api.post('/tester/send', body);
      setResult(res.data);
      setHistory((prev) => [res.data, ...prev].slice(0, 20));
    } catch (err: any) {
      setResult({
        success: false,
        request: { method: 'POST', url: targetUrl, headers: {}, body: {} },
        response: null,
        responseTime: 0,
        source: selectedProvider,
        error: err.response?.data?.error || err.message || 'Request failed',
      });
    } finally {
      setSending(false);
    }
  }, [targetUrl, selectedProvider, selectedEvent, useCustomPayload, customPayload]);

  const statusColor = (status?: number) => {
    if (!status) return 'text-slate-500';
    if (status >= 200 && status < 300) return 'text-emerald-400';
    if (status >= 300 && status < 400) return 'text-purple-400';
    if (status >= 400 && status < 500) return 'text-amber-400';
    return 'text-red-400';
  };

  const statusBg = (status?: number) => {
    if (!status) return 'bg-slate-500/10';
    if (status >= 200 && status < 300) return 'bg-emerald-500/10';
    if (status >= 300 && status < 400) return 'bg-purple-500/10';
    if (status >= 400 && status < 500) return 'bg-amber-500/10';
    return 'bg-red-500/10';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Zap className="w-6 h-6 text-emerald-400" />
            Webhook Tester
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Send realistic test payloads from 15+ providers to any URL. Inspect responses instantly.
          </p>
        </div>
        {history.length > 0 && (
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-sm text-slate-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Clock className="w-4 h-4" />
            History ({history.length})
          </button>
        )}
      </div>

      {/* History Panel */}
      {showHistory && history.length > 0 && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
          <h3 className="text-sm font-medium text-white mb-3">Recent Tests</h3>
          <div className="space-y-2 max-h-48 overflow-auto">
            {history.map((h, i) => (
              <button
                key={i}
                onClick={() => setResult(h)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors text-left"
              >
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${statusColor(h.response?.status)} ${statusBg(h.response?.status)}`}>
                  {h.response?.status || 'ERR'}
                </span>
                <span className="text-xs text-slate-400">{h.request.method}</span>
                <span className="text-xs text-slate-300 truncate flex-1">{h.request.url}</span>
                <span className="text-xs text-slate-500">{h.responseTime}ms</span>
                <span className="text-xs text-slate-600 capitalize">{h.source}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Form */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 space-y-5">
        {/* Provider & Event Row */}
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Provider */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" />
              Provider
            </label>
            <div className="relative">
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                disabled={loadingProviders}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white appearance-none focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">Select a provider...</option>
                {providers.map((p) => (
                  <option key={p.key} value={p.key}>{p.name}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Event Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5" />
              Event Type
            </label>
            <div className="relative">
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                disabled={!selectedProvider}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white appearance-none focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50"
              >
                <option value="">Select an event...</option>
                {currentProvider?.events.map((e) => (
                  <option key={e.key} value={e.key}>{e.label}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Target URL */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" />
            Target URL
          </label>
          <input
            type="url"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            placeholder="https://hookswing.com/hook/your-slug or any URL"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
          />
          <p className="text-[11px] text-slate-600">
            Send to your HookSwing URL to inspect in the dashboard, or any external endpoint.
          </p>
        </div>

        {/* Custom Payload Toggle */}
        {selectedProvider && selectedEvent && (
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={useCustomPayload}
                onChange={(e) => setUseCustomPayload(e.target.checked)}
                className="rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
              />
              Edit payload before sending
            </label>

            {useCustomPayload && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5" />
                  Custom Payload (JSON)
                </label>
                <textarea
                  value={customPayload}
                  onChange={(e) => setCustomPayload(e.target.value)}
                  placeholder="{}"
                  rows={8}
                  spellCheck={false}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 resize-y"
                />
              </div>
            )}
          </div>
        )}

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={sending || !selectedProvider || !selectedEvent || !targetUrl.trim()}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition-all hover:scale-[1.02] shadow-lg shadow-emerald-500/20"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {sending ? 'Sending...' : 'Send Test Payload'}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          {/* Result Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
            <div className="flex items-center gap-3">
              {result.success && result.response ? (
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-400" />
              )}
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${statusColor(result.response?.status)}`}>
                  {result.response?.status || '—'}
                </span>
                <span className="text-sm text-slate-500">
                  {result.response?.statusText || result.error || 'No response'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {result.responseTime}ms
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 capitalize">
                {result.source}
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-800">
            {([
              { id: 'response' as const, label: 'Response', icon: FileJson },
              { id: 'request' as const, label: 'Request', icon: ArrowRight },
              { id: 'headers' as const, label: 'Response Headers', icon: Code2 },
            ]).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-emerald-400 border-b-2 border-emerald-500'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-4 max-h-[32rem] overflow-auto">
            {activeTab === 'response' && (
              <div>
                {result.error && !result.response ? (
                  <div className="flex items-center gap-2 text-sm text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    {result.error}
                  </div>
                ) : result.response?.body ? (
                  <JsonViewer data={result.response.body} />
                ) : (
                  <p className="text-sm text-slate-500">No response body</p>
                )}
              </div>
            )}

            {activeTab === 'request' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-emerald-400 font-mono font-bold">{result.request.method}</span>
                  <span className="text-slate-300 font-mono">{result.request.url}</span>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500">Headers</p>
                  {Object.entries(result.request.headers).map(([k, v]) => (
                    <div key={k} className="flex items-start gap-3 text-xs py-1 border-b border-slate-800/50 last:border-0">
                      <span className="text-sky-400 font-mono shrink-0 w-40 truncate">{k}</span>
                      <span className="text-slate-300 break-all">{String(v)}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500">Body</p>
                  <JsonViewer data={result.request.body} />
                </div>
              </div>
            )}

            {activeTab === 'headers' && (
              <div className="space-y-1">
                {result.response?.headers ? (
                  Object.entries(result.response.headers).map(([k, v]) => (
                    <div key={k} className="flex items-start gap-3 text-xs py-1 border-b border-slate-800/50 last:border-0">
                      <span className="text-sky-400 font-mono shrink-0 w-40 truncate">{k}</span>
                      <span className="text-slate-300 break-all">{String(v)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No response headers</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!result && !sending && (
        <div className="text-center py-12 text-slate-600">
          <Zap className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Select a provider, event, and target URL to start testing</p>
        </div>
      )}
    </div>
  );
}
