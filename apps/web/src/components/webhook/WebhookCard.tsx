import { useState, useEffect } from 'react';
import { methodColor, statusColor, formatDate, formatBytes } from '../../lib/utils';
import { GitCompare, ChevronDown, ChevronUp, Copy, Play, RotateCcw, Globe, Hash, FileJson, Link2, Loader2, Check, AlertCircle, Zap, MessageSquare } from 'lucide-react';
import JsonViewer from './JsonViewer';
import JsonEditor from './JsonEditor';
import { api } from '../../lib/api';

function formatReplayBody(rawBody: string | null | undefined, body: any): string {
  if (rawBody) {
    try { return JSON.stringify(JSON.parse(rawBody), null, 2); } catch { return rawBody; }
  }
  return JSON.stringify(body || {}, null, 2);
}

interface Webhook {
  id: string;
  method: string;
  headers: any;
  body: any;
  rawBody?: string | null;
  query: any;
  ip: string;
  userAgent: string | null;
  source: string | null;
  statusCode: number | null;
  responseTime: number | null;
  isReplay: boolean;
  originalId: string | null;
  createdAt: string;
  _count?: { comments: number };
}

export default function WebhookCard({
  webhook,
  selected,
  onClick,
  onCompare,
  compareMode,
  isCompareSelected,
  canReplay,
}: {
  webhook: Webhook;
  selected: boolean;
  onClick: () => void;
  onCompare?: () => void;
  compareMode?: boolean;
  isCompareSelected?: boolean;
  canReplay?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'headers' | 'body' | 'query' | 'replay'>('body');
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
    if (expanded && activeTab === 'replay') {
      setReplayHeaders(JSON.stringify(webhook.headers || {}, null, 2));
      setReplayBody(formatReplayBody(webhook.rawBody, webhook.body));
      setReplayQuery(JSON.stringify(webhook.query || {}, null, 2));
      setReplayJsonError('');
    }
  }, [expanded, activeTab, webhook]);

  const handleReplay = async () => {
    setReplayJsonError('');
    let parsedHeaders: any, parsedBody: any, parsedQuery: any;
    try { parsedHeaders = JSON.parse(replayHeaders || '{}'); } catch { setReplayJsonError('Headers: Invalid JSON'); setReplaySubTab('headers'); return; }
    try { parsedBody = replayBody.trim() || undefined; try { parsedBody = JSON.parse(replayBody); } catch { /* raw string */ } } catch { setReplayJsonError('Body: Invalid'); setReplaySubTab('body'); return; }
    try { parsedQuery = JSON.parse(replayQuery || '{}'); } catch { setReplayJsonError('Query: Invalid JSON'); setReplaySubTab('query'); return; }

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
    <div className={`rounded-lg border transition-all ${selected ? 'bg-emerald-500/5 border-emerald-500/30' : isCompareSelected ? 'bg-amber-500/5 border-amber-500/30' : 'bg-slate-800/50 border-slate-800 hover:border-slate-700'}`}>
      <button onClick={onClick} className="w-full text-left p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className={`px-2 py-0.5 rounded text-xs font-mono font-semibold border ${methodColor(webhook.method)}`}>{webhook.method}</span>
          {webhook.statusCode && <span className={`w-2 h-2 rounded-full ${statusColor(webhook.statusCode)}`} />}
          {webhook.isReplay && <span className="text-xs text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">REPLAY</span>}
          {webhook._count && webhook._count.comments > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded ml-1">
              <MessageSquare className="w-3 h-3" />{webhook._count.comments}
            </span>
          )}
          <span className="text-xs text-slate-500 ml-auto">{formatDate(webhook.createdAt)}</span>
          {onCompare && (
            <span onClick={(e) => { e.stopPropagation(); onCompare(); }} className={`shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium cursor-pointer transition-colors ${isCompareSelected ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : compareMode ? 'bg-slate-700 text-slate-300 border border-slate-600 hover:bg-slate-600' : 'bg-slate-800 text-slate-500 border border-slate-700 hover:text-slate-300 hover:bg-slate-700'}`} title="Select for compare">
              <GitCompare className="w-3 h-3" />{compareMode ? 'Pick' : 'Diff'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span>{webhook.source || 'custom'}</span><span>•</span><span>{formatBytes(bodySize)}</span><span>•</span><span className="font-mono">{webhook.ip}</span>
          {webhook.statusCode && <><span>•</span><span className={`font-mono ${webhook.statusCode >= 200 && webhook.statusCode < 300 ? 'text-emerald-400' : webhook.statusCode >= 400 ? 'text-red-400' : 'text-amber-400'}`}>{webhook.statusCode}</span></>}
          <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} className="ml-auto flex items-center gap-1 text-slate-500 hover:text-emerald-400 transition-colors px-1.5 py-0.5 rounded hover:bg-slate-700/50">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}<span className="text-[10px]">{expanded ? 'Collapse' : 'Expand'}</span>
          </button>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-800">
          <div className="flex border-b border-slate-800">
            {(
              [{id:'overview',label:'Overview'},{id:'headers',label:'Headers'},{id:'body',label:'Body'},{id:'query',label:'Query'},...(canReplay?[{id:'replay',label:'Replay'}]:[{id:undefined,label:''}].filter(()=>false))] as {id:'overview'|'headers'|'body'|'query'|'replay';label:string}[]
            ).map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex-1 py-2 text-xs font-medium capitalize transition-colors ${activeTab===t.id?'text-emerald-400 border-b-2 border-emerald-500':'text-slate-500 hover:text-slate-300'}`}>{t.label}</button>
            ))}
          </div>
          <div className="p-4 max-h-[32rem] overflow-auto">
            {activeTab==='overview'&&(
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between"><span className="text-slate-500 text-xs uppercase tracking-wider">ID</span><div className="flex items-center gap-1.5"><code className="text-slate-300 font-mono text-xs">{webhook.id.slice(0,16)}…</code><button onClick={()=>navigator.clipboard.writeText(webhook.id)} className="text-slate-600 hover:text-white"><Copy className="w-3 h-3"/></button></div></div>
                <div className="flex items-center justify-between"><span className="text-slate-500 text-xs uppercase tracking-wider">Timestamp</span><span className="text-slate-300">{new Date(webhook.createdAt).toLocaleString()}</span></div>
                <div className="flex items-center justify-between"><span className="text-slate-500 text-xs uppercase tracking-wider">IP</span><span className="text-slate-300 font-mono text-xs">{webhook.ip}</span></div>
                {webhook.userAgent&&<div className="flex items-center justify-between"><span className="text-slate-500 text-xs uppercase tracking-wider">User Agent</span><span className="text-slate-300 text-xs truncate max-w-[200px]">{webhook.userAgent}</span></div>}
                {webhook.statusCode&&<div className="flex items-center justify-between"><span className="text-slate-500 text-xs uppercase tracking-wider">Response</span><span className="text-slate-300">{webhook.statusCode} {webhook.responseTime&&`• ${webhook.responseTime}ms`}</span></div>}
                <div className="flex items-center justify-between"><span className="text-slate-500 text-xs uppercase tracking-wider">Size</span><span className="text-slate-300">{formatBytes(bodySize)}</span></div>
              </div>
            )}
            {activeTab==='headers'&&(
              <div className="space-y-1.5">
                {webhook.headers&&typeof webhook.headers==='object'?Object.entries(webhook.headers).map(([k,v])=>(
                  <div key={k} className="flex items-start gap-3 py-1.5 border-b border-slate-800/50 last:border-0"><span className="text-blue-400 text-xs font-mono shrink-0 w-28 truncate">{k}</span><span className="text-slate-300 text-xs break-all">{['authorization','cookie'].includes(k.toLowerCase())?'••••••••':String(v)}</span></div>
                )):<p className="text-xs text-slate-500">No headers</p>}
              </div>
            )}
            {activeTab==='body'&&(<div>{webhook.body?<JsonViewer data={webhook.body}/>:<p className="text-xs text-slate-500">No body</p>}</div>)}
            {activeTab==='query'&&(
              <div className="space-y-1.5">
                {webhook.query&&typeof webhook.query==='object'&&Object.keys(webhook.query).length>0?Object.entries(webhook.query).map(([k,v])=>(
                  <div key={k} className="flex items-start gap-3 py-1.5 border-b border-slate-800/50 last:border-0"><span className="text-emerald-400 text-xs font-mono shrink-0 w-28 truncate">{k}</span><span className="text-slate-300 text-xs break-all">{String(v)}</span></div>
                )):<p className="text-xs text-slate-500">No query params</p>}
              </div>
            )}

            {/* ===== REPLAY TAB ===== */}
            {activeTab==='replay'&&canReplay&&(
              <div className="space-y-4">
                {/* Method badge */}
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-mono font-semibold border ${methodColor(webhook.method)}`}>{webhook.method}</span>
                  <span className="text-xs text-slate-500">Replay this webhook with custom URL, headers, body, and query params</span>
                </div>

                {/* Replay sub-tabs */}
                <div className="flex gap-2">
                  {([
                    {id:'url' as const, label:'Target URL', icon:Globe, color:'text-emerald-400', bg:'bg-emerald-500/10', border:'border-emerald-500/20'},
                    {id:'headers' as const, label:'Headers', icon:Hash, color:'text-sky-400', bg:'bg-sky-500/10', border:'border-sky-500/20'},
                    {id:'body' as const, label:'Body', icon:FileJson, color:'text-purple-400', bg:'bg-purple-500/10', border:'border-purple-500/20'},
                    {id:'query' as const, label:'Query', icon:Link2, color:'text-amber-400', bg:'bg-amber-500/10', border:'border-amber-500/20'},
                  ]).map(tab => (
                    <button key={tab.id} onClick={()=>setReplaySubTab(tab.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${replaySubTab===tab.id?`${tab.color} ${tab.bg} ${tab.border} border`:'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}>
                      <tab.icon className="w-3.5 h-3.5"/>{tab.label}
                    </button>
                  ))}
                </div>

                {/* URL */}
                {replaySubTab==='url'&&(
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-emerald-400 flex items-center gap-1.5"><Globe className="w-3.5 h-3.5"/>Target URL</label>
                    <input type="text" value={replayUrl} onChange={e=>{setReplayUrl(e.target.value);localStorage.setItem('lastReplayUrl',e.target.value)}} placeholder="http://localhost:3000/webhook" className="w-full bg-slate-950 border border-emerald-500/20 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-mono"/>
                    <p className="text-[11px] text-slate-500">Request sent from your browser — localhost works.</p>
                  </div>
                )}

                {/* Headers */}
                {replaySubTab==='headers'&&(
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-sky-400 flex items-center gap-1.5"><Hash className="w-3.5 h-3.5"/>Headers <span className="text-slate-600">(JSON)</span></label>
                      <button onClick={()=>setReplayHeaders(JSON.stringify(webhook.headers||{},null,2))} className="text-[10px] text-slate-500 hover:text-sky-400 flex items-center gap-1"><RotateCcw className="w-3 h-3"/>Reset</button>
                    </div>
                    <JsonEditor value={replayHeaders} onChange={setReplayHeaders} rows={10} accentColor="sky" />
                  </div>
                )}

                {/* Body */}
                {replaySubTab==='body'&&(
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-purple-400 flex items-center gap-1.5"><FileJson className="w-3.5 h-3.5"/>Body</label>
                      <button onClick={()=>setReplayBody(formatReplayBody(webhook.rawBody, webhook.body))} className="text-[10px] text-slate-500 hover:text-purple-400 flex items-center gap-1"><RotateCcw className="w-3 h-3"/>Reset</button>
                    </div>
                    <JsonEditor value={replayBody} onChange={setReplayBody} rows={10} accentColor="purple" />
                  </div>
                )}

                {/* Query */}
                {replaySubTab==='query'&&(
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-amber-400 flex items-center gap-1.5"><Link2 className="w-3.5 h-3.5"/>Query Params <span className="text-slate-600">(JSON)</span></label>
                      <button onClick={()=>setReplayQuery(JSON.stringify(webhook.query||{},null,2))} className="text-[10px] text-slate-500 hover:text-amber-400 flex items-center gap-1"><RotateCcw className="w-3 h-3"/>Reset</button>
                    </div>
                    <JsonEditor value={replayQuery} onChange={setReplayQuery} rows={6} accentColor="amber" />
                  </div>
                )}

                {replayJsonError&&(
                  <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20"><AlertCircle className="w-3.5 h-3.5"/>{replayJsonError}</div>
                )}

                {/* Send */}
                <div className="flex items-center gap-3 pt-1">
                  <button onClick={handleReplay} disabled={replayLoading} className="bg-emerald-500 hover:bg-emerald-400 text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]">
                    {replayLoading?<Loader2 className="w-4 h-4 animate-spin" />:<Zap className="w-4 h-4"/>}Send Replay
                  </button>
                  <button onClick={resetAll} disabled={replayLoading} className="text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5"/>Reset All
                  </button>
                </div>

                {replayResult&&(
                  <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-xl font-medium ${replayResult.status>=200&&replayResult.status<300?'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20':replayResult.status===0?'bg-red-500/10 text-red-400 border border-red-500/20':'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                    {replayResult.status>=200&&replayResult.status<300?<Check className="w-4 h-4"/>:<AlertCircle className="w-4 h-4"/>}
                    {replayResult.status===0?'Replay failed':`Response: ${replayResult.status} in ${replayResult.responseTime}ms`}
                  </div>
                )}
              </div>
            )}
            {!canReplay&&activeTab==='replay'&&(
              <div className="text-center py-8 text-slate-500"><Play className="w-8 h-8 mx-auto mb-2 opacity-50"/><p className="text-sm">Replay requires Pro or Team plan</p></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
