import { useState, useEffect } from 'react';
import { X, Copy, CheckCircle2, AlertCircle, Clock, Globe, Hash, FileJson, ArrowRightLeft, MessageSquare, Terminal, Play, RotateCcw, Loader2, Check, Link2, Zap } from 'lucide-react';
import { methodColor, statusColor, formatBytes, formatDate } from '../../lib/utils';
import JsonViewer from './JsonViewer';
import JsonEditor from './JsonEditor';
import { api } from '../../lib/api';
import type { Webhook } from '../../hooks/useWebhooks';

function formatReplayBody(rawBody: string | null | undefined, body: any): string {
  if (rawBody) {
    try { return JSON.stringify(JSON.parse(rawBody), null, 2); } catch { return rawBody; }
  }
  return JSON.stringify(body || {}, null, 2);
}

interface WebhookModalProps {
  webhook: Webhook;
  onClose: () => void;
  canReplay?: boolean;
}

export default function WebhookModal({ webhook, onClose, canReplay }: WebhookModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'headers' | 'body' | 'query' | 'response' | 'replay'>('overview');
  const [copied, setCopied] = useState(false);
  const bodySize = webhook.body ? JSON.stringify(webhook.body).length : 0;

  // Replay state
  const [replayUrl, setReplayUrl] = useState(() => localStorage.getItem('lastReplayUrl') || 'http://localhost:3000/webhook');
  const [replayHeaders, setReplayHeaders] = useState('');
  const [replayBody, setReplayBody] = useState('');
  const [replayQuery, setReplayQuery] = useState('');
  const [replayLoading, setReplayLoading] = useState(false);
  const [replayResult, setReplayResult] = useState<{status: number; responseTime: number} | null>(null);
  const [replayJsonError, setReplayJsonError] = useState('');
  const [replaySubTab, setReplaySubTab] = useState<'url' | 'headers' | 'body' | 'query'>('url');

  useEffect(() => {
    setReplayHeaders(JSON.stringify(webhook.headers || {}, null, 2));
    setReplayBody(formatReplayBody(webhook.rawBody, webhook.body));
    setReplayQuery(JSON.stringify(webhook.query || {}, null, 2));
    setReplayJsonError('');
  }, [webhook]);

  const copyId = () => { navigator.clipboard.writeText(webhook.id); setCopied(true); setTimeout(()=>setCopied(false),2000); };

  const tabs = [
    { key: 'overview' as const, label: 'Overview', icon: Globe },
    { key: 'headers' as const, label: 'Headers', icon: Hash },
    { key: 'body' as const, label: 'Body', icon: FileJson },
    { key: 'query' as const, label: 'Query', icon: ArrowRightLeft },
    ...(webhook.statusCode ? [{ key: 'response' as const, label: 'Response', icon: Terminal }] : []),
    ...(canReplay ? [{ key: 'replay' as const, label: 'Replay', icon: Play }] : []),
  ];

  const handleReplay = async () => {
    setReplayJsonError('');
    let parsedHeaders: any, parsedBody: any, parsedQuery: any;
    try { parsedHeaders = JSON.parse(replayHeaders || '{}'); } catch { setReplayJsonError('Headers: Invalid JSON'); return; }
    try { parsedBody = replayBody.trim() || undefined; try { parsedBody = JSON.parse(replayBody); } catch { /* raw */ } } catch { setReplayJsonError('Body: Invalid'); return; }
    try { parsedQuery = JSON.parse(replayQuery || '{}'); } catch { setReplayJsonError('Query: Invalid JSON'); return; }

    setReplayLoading(true); setReplayResult(null);
    try {
      const headers: Record<string, string> = {};
      for (const [k, v] of Object.entries(parsedHeaders)) { const key = k.toLowerCase(); if (['content-length','transfer-encoding','connection','host','expect','keep-alive'].includes(key)) continue; headers[k] = String(v); }
      let url = replayUrl;
      const qs = new URLSearchParams();
      for (const [k, v] of Object.entries(parsedQuery || {})) { if (v !== undefined && v !== null) qs.append(k, String(v)); }
      if (qs.toString()) url += (url.includes('?') ? '&' : '?') + qs.toString();
      let body: string | undefined;
      if (typeof parsedBody === 'string') body = parsedBody;
      else if (parsedBody !== undefined) { body = JSON.stringify(parsedBody); headers['content-type'] = headers['content-type'] || 'application/json'; }
      const start = performance.now();
      const fetchRes = await fetch(url, { method: webhook.method, headers, body });
      const responseTime = Math.round(performance.now() - start);
      let responseBody = ''; try { responseBody = await fetchRes.text(); } catch { /* ignore */ }
      const recordRes = await api.post(`/webhooks/${webhook.id}/replay-record`, { targetUrl: replayUrl, statusCode: fetchRes.status, responseTime, responseBody: responseBody.slice(0, 50000), headers: parsedHeaders, body: parsedBody, query: parsedQuery });
      setReplayResult(recordRes.data);
    } catch (err: any) {
      setReplayResult({ status: 0, responseTime: 0 });
      const msg = err.name === 'TypeError' && err.message?.includes('Failed to fetch') ? 'Could not reach target URL. Check CORS on your server.' : (err.response?.data?.error || err.message || 'Replay failed');
      alert(msg);
    } finally { setReplayLoading(false); }
  };

  const resetAll = () => {
    setReplayHeaders(JSON.stringify(webhook.headers || {}, null, 2));
    setReplayBody(formatReplayBody(webhook.rawBody, webhook.body));
    setReplayQuery(JSON.stringify(webhook.query || {}, null, 2));
    setReplayJsonError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-800/50">
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 rounded-md text-sm font-mono font-bold border ${methodColor(webhook.method)}`}>{webhook.method}</span>
            {webhook.statusCode && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700">
                <span className={`w-2 h-2 rounded-full ${statusColor(webhook.statusCode)}`} />
                <span className={`text-sm font-mono font-semibold ${webhook.statusCode >= 200 && webhook.statusCode < 300 ? 'text-emerald-400' : webhook.statusCode >= 400 ? 'text-red-400' : 'text-amber-400'}`}>{webhook.statusCode}</span>
                {webhook.responseTime && <span className="text-xs text-slate-500">{webhook.responseTime}ms</span>}
              </div>
            )}
            {webhook.isReplay && (
              <span className="flex items-center gap-1 text-xs text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-1 rounded-md"><Clock className="w-3 h-3"/>REPLAY</span>
            )}
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"><X className="w-5 h-5"/></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 px-5">
          {tabs.map(tab => (
            <button key={tab.key} onClick={()=>setActiveTab(tab.key)} className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab===tab.key?'text-emerald-400 border-emerald-500':'text-slate-500 border-transparent hover:text-slate-300'}`}>
              <tab.icon className="w-4 h-4"/>{tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-5">
          {activeTab==='overview'&&(
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoCard label="ID" value={webhook.id} monospace copy onCopy={copyId} copied={copied} />
              <InfoCard label="Timestamp" value={new Date(webhook.createdAt).toLocaleString()} />
              <InfoCard label="Relative Time" value={formatDate(webhook.createdAt)} />
              <InfoCard label="Source IP" value={webhook.ip} monospace />
              <InfoCard label="Source" value={webhook.source || 'custom'} />
              <InfoCard label="User Agent" value={webhook.userAgent || '—'} />
              <InfoCard label="Size" value={formatBytes(bodySize)} />
              <InfoCard label="Is Replay" value={webhook.isReplay ? 'Yes' : 'No'} />
              {webhook.originalId && <InfoCard label="Original ID" value={webhook.originalId} monospace />}
              {webhook.statusCode && <InfoCard label="Response Status" value={`${webhook.statusCode} ${webhook.responseTime ? `(${webhook.responseTime}ms)` : ''}`} highlight={webhook.statusCode >= 200 && webhook.statusCode < 300 ? 'success' : webhook.statusCode >= 400 ? 'error' : 'warning'} />}
            </div>
          )}

          {activeTab==='headers'&&(
            <div className="bg-slate-800/50 rounded-xl border border-slate-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-700 bg-slate-800/80"><th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-2.5 w-1/3">Header</th><th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-2.5">Value</th></tr></thead>
                <tbody>
                  {webhook.headers && typeof webhook.headers==='object' && Object.entries(webhook.headers).length>0 ? Object.entries(webhook.headers).map(([k,v])=>(
                    <tr key={k} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30"><td className="px-4 py-2.5 text-blue-400 font-mono text-xs">{k}</td><td className="px-4 py-2.5 text-slate-300 break-all">{['authorization','cookie'].includes(k.toLowerCase())?<span className="text-slate-600">••••••••</span>:String(v)}</td></tr>
                  )):<tr><td colSpan={2} className="px-4 py-8 text-center text-slate-500 text-sm">No headers</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {activeTab==='body'&&(<div>{webhook.body?<JsonViewer data={webhook.body}/>:<div className="flex flex-col items-center justify-center py-16 text-slate-500"><FileJson className="w-10 h-10 mb-3 opacity-30"/><p className="text-sm">No body</p></div>}</div>)}

          {activeTab==='query'&&(
            <div className="bg-slate-800/50 rounded-xl border border-slate-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-700 bg-slate-800/80"><th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-2.5 w-1/3">Parameter</th><th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-2.5">Value</th></tr></thead>
                <tbody>
                  {webhook.query && typeof webhook.query==='object' && Object.entries(webhook.query).length>0 ? Object.entries(webhook.query).map(([k,v])=>(
                    <tr key={k} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30"><td className="px-4 py-2.5 text-emerald-400 font-mono text-xs">{k}</td><td className="px-4 py-2.5 text-slate-300 break-all">{String(v)}</td></tr>
                  )):<tr><td colSpan={2} className="px-4 py-8 text-center text-slate-500 text-sm">No query parameters</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {activeTab==='response'&&(
            <div className="space-y-4">
              {webhook.statusCode && (
                <div className="flex items-center gap-3 bg-slate-800/50 rounded-xl border border-slate-800 p-4">
                  {webhook.statusCode >= 200 && webhook.statusCode < 300 ? <CheckCircle2 className="w-6 h-6 text-emerald-400"/> : <AlertCircle className="w-6 h-6 text-red-400"/>}
                  <div><p className="text-lg font-bold text-white">{webhook.statusCode}</p>{webhook.responseTime && <p className="text-xs text-slate-500">{webhook.responseTime}ms response time</p>}</div>
                </div>
              )}
              {webhook.responseBody ? (
                <div><h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Response Body</h4><div className="bg-slate-800/50 rounded-xl border border-slate-800 p-4 overflow-auto max-h-[50vh]"><pre className="text-sm text-slate-300 font-mono whitespace-pre-wrap">{webhook.responseBody}</pre></div></div>
              ):(<div className="flex flex-col items-center justify-center py-16 text-slate-500"><MessageSquare className="w-10 h-10 mb-3 opacity-30"/><p className="text-sm">No response body</p></div>)}
            </div>
          )}

          {/* ===== REPLAY TAB ===== */}
          {activeTab==='replay'&&canReplay&&(
            <div className="space-y-5 max-w-2xl">
              {/* Method + description */}
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 rounded-md text-sm font-mono font-bold border ${methodColor(webhook.method)}`}>{webhook.method}</span>
                <span className="text-sm text-slate-400">Replay with custom URL, headers, body, and query params</span>
              </div>

              {/* Colorful sub-tabs */}
              <div className="flex gap-2">
                {([
                  {id:'url', label:'Target URL', icon:Globe, color:'text-emerald-400', bg:'bg-emerald-500/10', border:'border-emerald-500/20', bar:'bg-emerald-500/30'},
                  {id:'headers', label:'Headers', icon:Hash, color:'text-sky-400', bg:'bg-sky-500/10', border:'border-sky-500/20', bar:'bg-sky-500/30'},
                  {id:'body', label:'Body', icon:FileJson, color:'text-purple-400', bg:'bg-purple-500/10', border:'border-purple-500/20', bar:'bg-purple-500/30'},
                  {id:'query', label:'Query', icon:Link2, color:'text-amber-400', bg:'bg-amber-500/10', border:'border-amber-500/20', bar:'bg-amber-500/30'},
                ] as const).map(tab => (
                  <button key={tab.id} onClick={()=>setReplaySubTab(tab.id)} className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${replaySubTab===tab.id?`${tab.color} ${tab.bg} ${tab.border} border shadow-sm`:'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}>
                    <tab.icon className="w-3.5 h-3.5"/>{tab.label}
                  </button>
                ))}
              </div>

              {/* Target URL */}
              {replaySubTab==='url'&&(
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-emerald-400 flex items-center gap-2"><Globe className="w-4 h-4"/>Target URL</label>
                  <input type="text" value={replayUrl} onChange={e=>{setReplayUrl(e.target.value);localStorage.setItem('lastReplayUrl',e.target.value)}} placeholder="http://localhost:3000/webhook" className="w-full bg-slate-950 border-2 border-emerald-500/20 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 font-mono transition-colors"/>
                  <p className="text-xs text-slate-500">Request is sent from your browser — localhost works perfectly.</p>
                </div>
              )}

              {/* Headers */}
              {replaySubTab==='headers'&&(
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-sky-400 flex items-center gap-2"><Hash className="w-4 h-4"/>Headers <span className="text-slate-600 font-normal text-xs">JSON</span></label>
                    <button onClick={()=>setReplayHeaders(JSON.stringify(webhook.headers||{},null,2))} className="text-xs text-slate-500 hover:text-sky-400 flex items-center gap-1 transition-colors"><RotateCcw className="w-3 h-3"/>Reset</button>
                  </div>
                  <JsonEditor value={replayHeaders} onChange={setReplayHeaders} rows={12} accentColor="sky" />
                </div>
              )}

              {/* Body */}
              {replaySubTab==='body'&&(
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-purple-400 flex items-center gap-2"><FileJson className="w-4 h-4"/>Body</label>
                    <button onClick={()=>setReplayBody(formatReplayBody(webhook.rawBody, webhook.body))} className="text-xs text-slate-500 hover:text-purple-400 flex items-center gap-1 transition-colors"><RotateCcw className="w-3 h-3"/>Reset</button>
                  </div>
                  <JsonEditor value={replayBody} onChange={setReplayBody} rows={14} accentColor="purple" />
                </div>
              )}

              {/* Query */}
              {replaySubTab==='query'&&(
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-amber-400 flex items-center gap-2"><Link2 className="w-4 h-4"/>Query Params <span className="text-slate-600 font-normal text-xs">JSON</span></label>
                    <button onClick={()=>setReplayQuery(JSON.stringify(webhook.query||{},null,2))} className="text-xs text-slate-500 hover:text-amber-400 flex items-center gap-1 transition-colors"><RotateCcw className="w-3 h-3"/>Reset</button>
                  </div>
                  <JsonEditor value={replayQuery} onChange={setReplayQuery} rows={8} accentColor="amber" />
                </div>
              )}

              {replayJsonError&&(
                <div className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20"><AlertCircle className="w-4 h-4"/>{replayJsonError}</div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button onClick={handleReplay} disabled={replayLoading} className="bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-3 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]">
                  {replayLoading?<Loader2 className="w-4 h-4 animate-spin" />:<Zap className="w-4 h-4"/>}Send Replay
                </button>
                <button onClick={resetAll} disabled={replayLoading} className="text-sm text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-5 py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1.5 font-medium">
                  <RotateCcw className="w-3.5 h-3.5"/>Reset All
                </button>
              </div>

              {replayResult&&(
                <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-xl font-semibold ${replayResult.status>=200&&replayResult.status<300?'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20':replayResult.status===0?'bg-red-500/10 text-red-400 border border-red-500/20':'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                  {replayResult.status>=200&&replayResult.status<300?<Check className="w-5 h-5"/>:<AlertCircle className="w-5 h-5"/>}
                  {replayResult.status===0?'Replay failed':`Response: ${replayResult.status} in ${replayResult.responseTime}ms`}
                </div>
              )}
            </div>
          )}

          {activeTab==='replay'&&!canReplay&&(
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <Play className="w-12 h-12 mb-3 opacity-30"/>
              <p className="text-lg font-medium">Replay requires Pro or Team plan</p>
              <p className="text-sm text-slate-600 mt-1">Upgrade to replay webhooks with custom headers, body, and query params</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value, monospace, copy, onCopy, copied, highlight }: {
  label: string; value: string; monospace?: boolean; copy?: boolean; onCopy?: () => void; copied?: boolean; highlight?: 'success' | 'error' | 'warning';
}) {
  const highlightClass = highlight === 'success' ? 'text-emerald-400' : highlight === 'error' ? 'text-red-400' : highlight === 'warning' ? 'text-amber-400' : 'text-slate-200';
  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-800 p-4">
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{label}</p>
      <div className="flex items-center gap-2">
        <p className={`text-sm ${monospace ? 'font-mono' : ''} ${highlightClass} break-all`}>{value}</p>
        {copy && <button onClick={onCopy} className="text-slate-500 hover:text-emerald-400 transition-colors shrink-0">{copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}</button>}
      </div>
    </div>
  );
}
