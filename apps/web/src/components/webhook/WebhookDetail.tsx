import { useState, useEffect } from 'react';
import { X, Copy, Play, Trash2, MessageSquare, Send, Loader2, Check, AlertCircle, Maximize2, RotateCcw, Code, Globe, FileJson, Link } from 'lucide-react';
import { methodColor, formatDate, formatBytes } from '../../lib/utils';
import { api } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import JsonViewer from './JsonViewer';
import WebhookModal from './WebhookModal';
import type { Webhook } from '../../hooks/useWebhooks';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string | null; email: string };
}

export default function WebhookDetail({
  webhook,
  onClose,
  onDelete,
  onReplay,
  canReplay,
  isTeamProject,
}: {
  webhook: Webhook;
  onClose: () => void;
  onDelete: (id: string) => void;
  onReplay: (id: string, url: string) => void;
  canReplay?: boolean;
  isTeamProject?: boolean;
}) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'headers' | 'body' | 'comments'>('overview');
  const [replayUrl, setReplayUrl] = useState(() => localStorage.getItem('lastReplayUrl') || 'http://localhost:3000/webhook');
  const [showReplay, setShowReplay] = useState(false);
  const [replayLoading, setReplayLoading] = useState(false);
  const [replayResult, setReplayResult] = useState<{status: number; responseTime: number} | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Editable replay fields
  const [replayHeaders, setReplayHeaders] = useState('');
  const [replayBody, setReplayBody] = useState('');
  const [replayQuery, setReplayQuery] = useState('');
  const [replayActiveTab, setReplayActiveTab] = useState<'url' | 'headers' | 'body' | 'query'>('url');
  const [replayJsonError, setReplayJsonError] = useState('');

  // Initialize replay fields from webhook data
  useEffect(() => {
    if (showReplay) {
      setReplayHeaders(JSON.stringify(webhook.headers || {}, null, 2));
      setReplayBody(webhook.rawBody || JSON.stringify(webhook.body || {}, null, 2));
      setReplayQuery(JSON.stringify(webhook.query || {}, null, 2));
      setReplayJsonError('');
    }
  }, [showReplay, webhook]);



  // Comments (Team plan or team project)
  const isTeamPlan = user?.plan === 'TEAM' || !!isTeamProject;
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);

  useEffect(() => {
    if (!isTeamPlan) return;
    setCommentsLoading(true);
    api.get(`/webhooks/${webhook.id}/comments`)
      .then((res) => setComments(res.data))
      .catch(() => setComments([]))
      .finally(() => setCommentsLoading(false));
  }, [webhook.id, isTeamPlan]);

  const addComment = async () => {
    if (!commentText.trim()) return;
    setCommentLoading(true);
    try {
      const res = await api.post(`/webhooks/${webhook.id}/comments`, { content: commentText.trim() });
      setComments((prev) => [...prev, res.data]);
      setCommentText('');
    } catch {
      alert('Failed to add comment');
    } finally {
      setCommentLoading(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;
    try {
      await api.delete(`/webhooks/${webhook.id}/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      alert('Failed to delete comment');
    }
  };

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
          <button
            onClick={() => setShowModal(true)}
            className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 rounded transition-colors"
            title="Expand view"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
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
        <div className="p-4 border-b border-slate-800 bg-emerald-500/5 space-y-3">
          {/* Replay tabs */}
          <div className="flex border-b border-slate-700/50">
            {([
              { id: 'url' as const, label: 'URL', icon: Globe },
              { id: 'headers' as const, label: 'Headers', icon: Code },
              { id: 'body' as const, label: 'Body', icon: FileJson },
              { id: 'query' as const, label: 'Query', icon: Link },
            ]).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setReplayActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                  replayActiveTab === tab.id
                    ? 'text-emerald-400 border-b-2 border-emerald-500'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <tab.icon className="w-3 h-3" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* URL tab */}
          {replayActiveTab === 'url' && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Target URL</label>
              <input
                type="text"
                value={replayUrl}
                onChange={(e) => { setReplayUrl(e.target.value); localStorage.setItem('lastReplayUrl', e.target.value); }}
                placeholder="http://localhost:3000/webhook"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
              />
              <p className="text-xs text-slate-500 mt-1">The request will be sent to this URL from your browser.</p>
            </div>
          )}

          {/* Headers tab */}
          {replayActiveTab === 'headers' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-400">Headers (JSON)</label>
                <button
                  onClick={() => setReplayHeaders(JSON.stringify(webhook.headers || {}, null, 2))}
                  className="text-[10px] text-slate-500 hover:text-emerald-400 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              </div>
              <textarea
                value={replayHeaders}
                onChange={(e) => setReplayHeaders(e.target.value)}
                rows={8}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
              />
            </div>
          )}

          {/* Body tab */}
          {replayActiveTab === 'body' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-400">Body</label>
                <button
                  onClick={() => setReplayBody(webhook.rawBody || JSON.stringify(webhook.body || {}, null, 2))}
                  className="text-[10px] text-slate-500 hover:text-emerald-400 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              </div>
              <textarea
                value={replayBody}
                onChange={(e) => setReplayBody(e.target.value)}
                rows={10}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
              />
            </div>
          )}

          {/* Query tab */}
          {replayActiveTab === 'query' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-400">Query Params (JSON)</label>
                <button
                  onClick={() => setReplayQuery(JSON.stringify(webhook.query || {}, null, 2))}
                  className="text-[10px] text-slate-500 hover:text-emerald-400 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              </div>
              <textarea
                value={replayQuery}
                onChange={(e) => setReplayQuery(e.target.value)}
                rows={6}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
              />
            </div>
          )}

          {replayJsonError && (
            <div className="flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
              <AlertCircle className="w-3.5 h-3.5" />
              {replayJsonError}
            </div>
          )}

          {/* Send button */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={async () => {
                setReplayJsonError('');

                // Parse edited fields
                let parsedHeaders: any;
                let parsedBody: any;
                let parsedQuery: any;
                try {
                  parsedHeaders = JSON.parse(replayHeaders || '{}');
                } catch {
                  setReplayJsonError('Headers: Invalid JSON');
                  setReplayActiveTab('headers');
                  return;
                }
                try {
                  parsedBody = replayBody.trim() || undefined;
                  // Try to parse as JSON, if fails keep as string
                  try { parsedBody = JSON.parse(replayBody); } catch { /* keep as raw string */ }
                } catch {
                  setReplayJsonError('Body: Invalid');
                  setReplayActiveTab('body');
                  return;
                }
                try {
                  parsedQuery = JSON.parse(replayQuery || '{}');
                } catch {
                  setReplayJsonError('Query: Invalid JSON');
                  setReplayActiveTab('query');
                  return;
                }

                setReplayLoading(true);
                setReplayResult(null);
                try {
                  // Strip hop-by-hop headers
                  const headers: Record<string, string> = {};
                  for (const [k, v] of Object.entries(parsedHeaders)) {
                    const key = k.toLowerCase();
                    if (['content-length', 'transfer-encoding', 'connection', 'host', 'expect', 'keep-alive'].includes(key)) continue;
                    headers[k] = String(v);
                  }

                  // Build URL with query params
                  let url = replayUrl;
                  const queryString = new URLSearchParams();
                  for (const [k, v] of Object.entries(parsedQuery || {})) {
                    if (v !== undefined && v !== null) queryString.append(k, String(v));
                  }
                  if (queryString.toString()) {
                    url += (url.includes('?') ? '&' : '?') + queryString.toString();
                  }

                  // Prepare body
                  let body: string | undefined;
                  if (typeof parsedBody === 'string') {
                    body = parsedBody;
                  } else if (parsedBody !== undefined) {
                    body = JSON.stringify(parsedBody);
                    headers['content-type'] = headers['content-type'] || 'application/json';
                  }

                  // Make request from BROWSER (can reach localhost)
                  const start = performance.now();
                  const fetchRes = await fetch(url, {
                    method: webhook.method,
                    headers,
                    body,
                  });
                  const responseTime = Math.round(performance.now() - start);
                  let responseBody = '';
                  try { responseBody = await fetchRes.text(); } catch { /* ignore */ }

                  // Report result to backend for recording
                  const recordRes = await api.post(`/webhooks/${webhook.id}/replay-record`, {
                    targetUrl: replayUrl,
                    statusCode: fetchRes.status,
                    responseTime,
                    responseBody: responseBody.slice(0, 50000),
                    headers: parsedHeaders,
                    body: parsedBody,
                    query: parsedQuery,
                  });

                  setReplayResult(recordRes.data);
                } catch (err: any) {
                  setReplayResult({ status: 0, responseTime: 0 });
                  const msg = err.name === 'TypeError' && err.message?.includes('Failed to fetch')
                    ? 'Could not reach target URL. Check CORS settings on your local server (e.g. app.use(cors()) in Express).'
                    : (err.response?.data?.error || err.message || 'Replay failed');
                  alert(msg);
                } finally {
                  setReplayLoading(false);
                }
              }}
              disabled={replayLoading}
              className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-1.5"
            >
              {replayLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Send Replay
            </button>
            <button
              onClick={() => {
                setReplayHeaders(JSON.stringify(webhook.headers || {}, null, 2));
                setReplayBody(webhook.rawBody || JSON.stringify(webhook.body || {}, null, 2));
                setReplayQuery(JSON.stringify(webhook.query || {}, null, 2));
                setReplayJsonError('');
              }}
              disabled={replayLoading}
              className="text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset All
            </button>
          </div>

          {replayResult && (
            <div className={`flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg ${
              replayResult.status >= 200 && replayResult.status < 300
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : replayResult.status === 0
                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}>
              {replayResult.status >= 200 && replayResult.status < 300 ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5" />
              )}
              {replayResult.status === 0 ? 'Replay failed' : `Response: ${replayResult.status} in ${replayResult.responseTime}ms`}
            </div>
          )}
        </div>
      )}

      <div className="flex border-b border-slate-800">
        {(['overview', 'headers', 'body', 'comments'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-sm font-medium capitalize transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === tab
                ? 'text-emerald-400 border-b-2 border-emerald-500'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab === 'comments' && <MessageSquare className="w-3.5 h-3.5" />}
            {tab}
            {tab === 'comments' && comments.length > 0 && (
              <span className="text-[10px] bg-slate-700 text-slate-300 px-1 rounded-full">{comments.length}</span>
            )}
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

        {activeTab === 'comments' && (
          <div className="space-y-3">
            {!isTeamPlan ? (
              <div className="text-center py-8 text-slate-500">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Comments require Team plan</p>
              </div>
            ) : (
              <>
                {/* Add comment */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addComment()}
                    placeholder="Add a comment..."
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={addComment}
                    disabled={commentLoading || !commentText.trim()}
                    className="bg-emerald-500 hover:bg-emerald-400 text-white px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    {commentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>

                {/* Comments list */}
                {commentsLoading ? (
                  <div className="flex items-center justify-center h-20">
                    <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                  </div>
                ) : comments.length === 0 ? (
                  <p className="text-sm text-slate-600 text-center py-4">No comments yet</p>
                ) : (
                  <div className="space-y-2">
                    {comments.map((comment) => (
                      <div key={comment.id} className="bg-slate-800/50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-[10px] font-bold">
                              {(comment.user.name || comment.user.email).charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs font-medium text-slate-300">
                              {comment.user.name || comment.user.email}
                            </span>
                            <span className="text-xs text-slate-600">{formatDate(comment.createdAt)}</span>
                          </div>
                          {comment.user.id === user?.id && (
                            <button
                              onClick={() => deleteComment(comment.id)}
                              className="text-slate-600 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-slate-200">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <WebhookModal webhook={webhook} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
