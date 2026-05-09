import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import { io, Socket } from 'socket.io-client';
import { Terminal, Trash2, Wifi, WifiOff, Zap } from 'lucide-react';

type LineType = 'input' | 'output' | 'error' | 'success' | 'webhook' | 'info' | 'warn';

interface WebhookMeta {
  method?: string;
  path?: string;
  statusCode?: number;
  responseTime?: number;
  source?: string;
  size?: string;
}

interface Line {
  type: LineType;
  text: string;
  timestamp: string;
  meta?: WebhookMeta;
}

const API_URL = window.location.origin;

/**
 * Normalize a user-provided URL for local forwarding/testing.
 * "3000" → "http://localhost:3000"
 * "localhost:3000" → "http://localhost:3000"
 * Full URLs → left as-is
 */
function normalizeUrl(url: string): string {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  if (/^\d+$/.test(url)) return `http://localhost:${url}`;
  if (/^[a-zA-Z0-9_.-]+(:\d+)?$/.test(url)) return `http://${url}`;
  return url;
}

// ── Module-level singleton state ──
// Persists across route changes so the CLI survives navigation.
let _lines: Line[] = [];
let _history: string[] = [];
let _socket: Socket | null = null;
let _listening = false;
let _forwarding = false;
let _forwardUrl = '';
let _forwardStats = { total: 0, success: 0, failed: 0 };
let _hasWelcomed = false;
let _showed404Hint = false;
let _sessionStart: number | null = null;
let _planLimit = { used: 0, limit: 500 };
let _reconnectAttempts = 0;

// Ref that the socket callbacks read — always points to the latest closures.
const liveRef = {
  addLine: (type: LineType, text: string, meta?: WebhookMeta) => {},
  setListening: (v: boolean) => {},
  setForwarding: (v: boolean) => {},
  setForwardStats: (fn: (prev: typeof _forwardStats) => typeof _forwardStats) => {},
  setSessionStart: (v: number | null) => {},
  setPlanLimit: (v: typeof _planLimit) => {},
  setReconnectAttempts: (v: number) => {},
};

function setSocket(s: Socket | null) { _socket = s; }

function formatDuration(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const h = String(Math.floor(totalSec / 3600)).padStart(2, '0');
  const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
  const s = String(totalSec % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function buildProgressBar(used: number, limit: number) {
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const filled = Math.floor(pct / 10);
  const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);
  return { pct, bar };
}

// ── Small HookSwing Logo SVG ──
function CliLogo({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 1350 1600" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M675 1.61273L1348.5 267.613V888.279C1348.5 1260.68 675 1597.61 675 1597.61C675 1597.61 1.5 1260.68 1.5 888.279V267.613L675 1.61273Z" fill="#10B981" stroke="#059669" strokeWidth="3" />
      <path opacity="0.3" d="M675 161.613L1168.5 374.184V852.47C1168.5 1135.9 675 1401.61 675 1401.61C675 1401.61 181.5 1135.9 181.5 852.47V374.184L675 161.613Z" fill="#059669" />
      <path opacity="0.9" d="M425.5 1065.61C454.219 1065.61 477.5 1042.33 477.5 1013.61C477.5 984.894 454.219 961.613 425.5 961.613C396.781 961.613 373.5 984.894 373.5 1013.61C373.5 1042.33 396.781 1065.61 425.5 1065.61Z" fill="white" />
      <path opacity="0.7" d="M605 1065.61C633.995 1065.61 657.5 1042.33 657.5 1013.61C657.5 984.894 633.995 961.613 605 961.613C576.005 961.613 552.5 984.894 552.5 1013.61C552.5 1042.33 576.005 1065.61 605 1065.61Z" fill="white" />
      <path opacity="0.5" d="M778.5 1065.61C807.219 1065.61 830.5 1042.33 830.5 1013.61C830.5 984.894 807.219 961.613 778.5 961.613C749.781 961.613 726.5 984.894 726.5 1013.61C726.5 1042.33 749.781 1065.61 778.5 1065.61Z" fill="white" />
      <path opacity="0.5" d="M924.5 1065.61C953.219 1065.61 976.5 1042.33 976.5 1013.61C976.5 984.894 953.219 961.613 924.5 961.613C895.781 961.613 872.5 984.894 872.5 1013.61C872.5 1042.33 895.781 1065.61 924.5 1065.61Z" fill="white" fillOpacity="0.5" />
    </svg>
  );
}

// ── Method & Status Color Helpers ──
function methodColor(method: string) {
  const m = method.toUpperCase();
  if (m === 'GET') return 'text-sky-400';
  if (m === 'POST') return 'text-emerald-400';
  if (m === 'PUT') return 'text-amber-400';
  if (m === 'PATCH') return 'text-purple-400';
  if (m === 'DELETE') return 'text-red-400';
  return 'text-slate-300';
}

function methodBg(method: string) {
  const m = method.toUpperCase();
  if (m === 'GET') return 'bg-sky-500/10';
  if (m === 'POST') return 'bg-emerald-500/10';
  if (m === 'PUT') return 'bg-amber-500/10';
  if (m === 'PATCH') return 'bg-purple-500/10';
  if (m === 'DELETE') return 'bg-red-500/10';
  return 'bg-slate-500/10';
}

function statusColor(code?: number) {
  if (!code) return 'text-slate-500';
  if (code >= 200 && code < 300) return 'text-emerald-400';
  if (code >= 300 && code < 400) return 'text-purple-400';
  if (code >= 400 && code < 500) return 'text-amber-400';
  if (code >= 500) return 'text-red-400';
  return 'text-slate-300';
}

export default function CliPage() {
  const { user } = useAuth();
  const [lines, setLines] = useState<Line[]>(_lines);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>(_history);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [listening, setListening] = useState(_listening);
  const [forwarding, setForwarding] = useState(_forwarding);
  const [forwardStats, setForwardStats] = useState({ ..._forwardStats });
  const [sessionStart, setSessionStart] = useState<number | null>(_sessionStart);
  const [sessionTime, setSessionTime] = useState('00:00:00');
  const [planLimit, setPlanLimit] = useState({ ..._planLimit });
  const [reconnectAttempts, setReconnectAttempts] = useState(_reconnectAttempts);
  const inputRef = useRef<HTMLInputElement>(null);
  const linesEndRef = useRef<HTMLDivElement>(null);
  const sessionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Keep liveRef always pointing to latest closures ──
  liveRef.addLine = (type: LineType, text: string, meta?: WebhookMeta) => {
    const line: Line = { type, text, timestamp: new Date().toLocaleTimeString(), meta };
    _lines = [..._lines, line];
    setLines(_lines);
  };
  liveRef.setListening = (v: boolean) => { _listening = v; setListening(v); };
  liveRef.setForwarding = (v: boolean) => { _forwarding = v; setForwarding(v); };
  liveRef.setForwardStats = (fn: (prev: typeof _forwardStats) => typeof _forwardStats) => {
    setForwardStats((prev) => {
      const next = fn(prev);
      _forwardStats = next;
      return next;
    });
  };
  liveRef.setSessionStart = (v: number | null) => { _sessionStart = v; setSessionStart(v); };
  liveRef.setPlanLimit = (v: typeof _planLimit) => { _planLimit = v; setPlanLimit(v); };
  liveRef.setReconnectAttempts = (v: number) => { _reconnectAttempts = v; setReconnectAttempts(v); };

  // Auto-scroll to bottom
  useEffect(() => {
    linesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Session timer
  useEffect(() => {
    if (sessionStart) {
      sessionTimerRef.current = setInterval(() => {
        setSessionTime(formatDuration(Date.now() - sessionStart));
      }, 1000);
    } else {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
        sessionTimerRef.current = null;
      }
      setSessionTime('00:00:00');
    }
    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
        sessionTimerRef.current = null;
      }
    };
  }, [sessionStart]);

  // Fetch usage stats
  const fetchUsage = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data.usage) {
        liveRef.setPlanLimit(res.data.usage);
      }
    } catch {
      // ignore
    }
  }, []);

  // Welcome message (only once per session)
  useEffect(() => {
    if (!_hasWelcomed) {
      _hasWelcomed = true;
      liveRef.addLine('info', 'HookSwing Browser CLI v1.1.0');
      liveRef.addLine('info', 'Type "help" for available commands.');
      liveRef.addLine('info', 'Tip: Type just the port number (e.g. 3000) — it becomes http://localhost:3000');
      liveRef.addLine('info', '');
    }
  }, []);

  const stopListening = useCallback(() => {
    if (_socket) {
      _socket.io.opts.reconnection = false;
      _socket.disconnect();
      setSocket(null);
    }
    liveRef.setListening(false);
    liveRef.setForwarding(false);
    liveRef.setSessionStart(null);
    liveRef.setReconnectAttempts(0);
    _forwardUrl = '';
    _showed404Hint = false;
  }, []);

  const startForwarding = useCallback((slug: string, targetUrl: string) => {
    stopListening();

    const token = localStorage.getItem('accessToken');
    if (!token) {
      liveRef.addLine('error', 'Not authenticated. Please log in.');
      return;
    }

    // Reset state
    liveRef.setForwardStats(() => ({ total: 0, success: 0, failed: 0 }));
    liveRef.setSessionStart(Date.now());
    liveRef.setReconnectAttempts(0);
    fetchUsage();

    api.get('/projects')
      .then((res) => {
        const project = res.data.projects.find((p: any) => p.slug === slug || p.customSlug === slug);
        if (!project) {
          liveRef.addLine('error', `Project "${slug}" not found.`);
          liveRef.setSessionStart(null);
          return;
        }

        if (targetUrl) {
          liveRef.addLine('info', `Forwarding ${project.name} (${slug}) → ${targetUrl}`);
        } else {
          liveRef.addLine('info', `Listening to ${project.name} (${slug})`);
        }
        liveRef.addLine('info', 'Type "stop" to disconnect.');

        const socket = io(API_URL, {
          auth: { token },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 10000,
        });

        setSocket(socket);
        _forwardUrl = targetUrl;
        liveRef.setListening(true);
        liveRef.setForwarding(!!targetUrl);

        socket.on('connect', () => {
          liveRef.setReconnectAttempts(0);
          if (_reconnectAttempts > 0) {
            liveRef.addLine('success', 'Reconnected. Waiting for webhooks...');
          } else {
            liveRef.addLine('success', 'Connected. Waiting for webhooks...');
          }
          socket.emit('subscribe', project.id);
        });

        socket.on('webhook', async (webhook: any) => {
          const size = webhook.body ? JSON.stringify(webhook.body).length : 0;
          const sizeStr = size > 1024 ? `${(size / 1024).toFixed(1)}KB` : `${size}B`;
          const time = new Date(webhook.createdAt).toLocaleTimeString();
          const method = webhook.method?.toUpperCase() || 'UNKNOWN';
          const path = webhook.path || '/';
          const rawSource = webhook.source || webhook.ip || 'custom';
          const source = webhook.eventType ? `${rawSource}:${webhook.eventType}` : rawSource;

          liveRef.addLine('webhook', `[${time}]  ${method.padEnd(6)}  ${path.padEnd(18)}  ${sizeStr.padEnd(6)}  (${source})`, {
            method,
            path,
            source,
            size: sizeStr,
          });

          liveRef.setForwardStats((prev) => ({ ...prev, total: prev.total + 1 }));

          if (!targetUrl) return;

          try {
            const headers: Record<string, string> = {};
            const rawHeaders = (webhook.headers || {}) as Record<string, string>;
            for (const [k, v] of Object.entries(rawHeaders)) {
              const key = k.toLowerCase();
              if (['content-length', 'transfer-encoding', 'connection', 'host', 'expect', 'keep-alive'].includes(key)) continue;
              headers[k] = String(v);
            }

            let body: string | undefined = webhook.rawBody;
            if (!body && webhook.body) {
              body = typeof webhook.body === 'string' ? webhook.body : JSON.stringify(webhook.body);
              headers['content-type'] = headers['content-type'] || 'application/json';
            }

            // ── Path preservation ──
            const forwardTarget = targetUrl.replace(/\/$/, '') + (webhook.path || '');

            const start = performance.now();
            const res = await fetch(forwardTarget, {
              method: webhook.method,
              headers,
              body,
            });
            const responseTime = Math.round(performance.now() - start);

            if (res.ok) {
              liveRef.setForwardStats((prev) => ({ ...prev, success: prev.success + 1 }));
              liveRef.addLine('success', `  → ${res.status} OK in ${responseTime}ms`, { statusCode: res.status, responseTime });
            } else {
              liveRef.setForwardStats((prev) => ({ ...prev, failed: prev.failed + 1 }));
              liveRef.addLine('error', `  → ${res.status} ${res.statusText} in ${responseTime}ms`, { statusCode: res.status, responseTime });
              if (res.status === 404 && !_showed404Hint) {
                _showed404Hint = true;
                liveRef.addLine('info', `  Your local server got the request but returned 404.`);
                liveRef.addLine('info', `  Make sure you have a route matching ${new URL(forwardTarget).pathname}`);
              }
            }
          } catch (err: any) {
            liveRef.setForwardStats((prev) => ({ ...prev, failed: prev.failed + 1 }));
            if (err.name === 'TypeError' && err.message?.includes('Failed to fetch')) {
              liveRef.addLine('error', '  → CORS blocked or unreachable.');
              liveRef.addLine('info', '  Tip: Add "app.use(cors())" in Express, or "server: { cors: true }" in Vite.');
            } else {
              liveRef.addLine('error', `  → ${err.message || 'Request failed'}`);
            }
          }
        });

        socket.on('disconnect', (reason) => {
          if (reason === 'io client disconnect') {
            // Intentional disconnect — handled by stopListening
            return;
          }
          liveRef.addLine('warn', `Disconnected: ${reason}`);
          liveRef.setListening(false);
        });

        socket.on('connect_error', (err) => {
          if (!_listening) return;
          liveRef.addLine('error', `Connection error: ${err.message}`);
        });

        socket.on('reconnect_attempt', (attempt) => {
          liveRef.setReconnectAttempts(attempt);
          liveRef.addLine('warn', `Reconnecting... (attempt ${attempt})`);
        });

        socket.on('reconnect_failed', () => {
          liveRef.addLine('error', 'Failed to reconnect after multiple attempts.');
          liveRef.setListening(false);
          liveRef.setSessionStart(null);
        });
      })
      .catch(() => {
        liveRef.addLine('error', 'Failed to fetch projects.');
        liveRef.setSessionStart(null);
      });
  }, [stopListening, fetchUsage]);

  const executeCommand = useCallback(async (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;

    setHistory((prev) => {
      const next = [trimmed, ...prev].slice(0, 100);
      _history = next;
      return next;
    });
    setHistoryIndex(-1);

    liveRef.addLine('input', `> ${trimmed}`);

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (cmd) {
      case 'help':
      case '?':
        liveRef.addLine('output', 'Available commands:');
        liveRef.addLine('output', '  help                Show this help message');
        liveRef.addLine('output', '  whoami              Show current user');
        liveRef.addLine('output', '  projects, list      List your projects');
        liveRef.addLine('output', '  webhooks <slug>     List recent webhooks for a project');
        liveRef.addLine('output', '  forward <slug> <url> Forward webhooks to a local server');
        liveRef.addLine('output', '                       (port shorthand: 3000 → http://localhost:3000)');
        liveRef.addLine('output', '  listen <slug>       Watch webhooks without forwarding');
        liveRef.addLine('output', '  stop                Stop listening');
        liveRef.addLine('output', '  replay <id> <url>   Replay a webhook to a URL');
        liveRef.addLine('output', '                       (port shorthand: 3000 → http://localhost:3000)');
        liveRef.addLine('output', '  curl <id>           Copy curl command to replay a webhook');
        liveRef.addLine('output', '  tester <provider> <event> <url>  Send a test payload');
        liveRef.addLine('output', '                                    (port shorthand: 3000 → http://localhost:3000)');
        liveRef.addLine('output', '  clear               Clear terminal');
        break;

      case 'whoami':
        if (user) {
          liveRef.addLine('output', `Email:    ${user.email}`);
          liveRef.addLine('output', `Name:     ${user.name || '—'}`);
          liveRef.addLine('output', `Plan:     ${user.plan}`);
          liveRef.addLine('output', `Teams:    ${user.teams?.length || 0}`);
        } else {
          liveRef.addLine('error', 'Not authenticated.');
        }
        break;

      case 'projects':
      case 'list':
        try {
          const res = await api.get('/projects');
          const projects = res.data.projects;
          if (projects.length === 0) {
            liveRef.addLine('output', 'No projects yet.');
          } else {
            liveRef.addLine('output', `${'Slug'.padEnd(14)} ${'Name'.padEnd(22)} Webhooks`);
            liveRef.addLine('output', '─'.repeat(50));
            for (const p of projects) {
              const count = p._count?.webhooks || 0;
              const teamBadge = p.team ? '[T]' : '[P]';
              liveRef.addLine('output', `${teamBadge} ${p.slug.padEnd(12)} ${p.name.slice(0, 20).padEnd(22)} ${count}`);
            }
          }
        } catch {
          liveRef.addLine('error', 'Failed to fetch projects.');
        }
        break;

      case 'webhooks': {
        const slug = args[0];
        if (!slug) {
          liveRef.addLine('error', 'Usage: webhooks <project-slug>');
          break;
        }
        try {
          const res = await api.get('/projects');
          const project = res.data.projects.find((p: any) => p.slug === slug || p.customSlug === slug);
          if (!project) {
            liveRef.addLine('error', `Project "${slug}" not found.`);
            break;
          }
          const whRes = await api.get(`/projects/${project.id}/webhooks?limit=10`);
          const webhooks = whRes.data.webhooks;
          if (webhooks.length === 0) {
            liveRef.addLine('output', 'No webhooks yet.');
          } else {
            liveRef.addLine('output', `${'Method'.padEnd(8)} ${'Source'.padEnd(18)} ${'Size'.padEnd(8)} Time`);
            liveRef.addLine('output', '─'.repeat(60));
            for (const w of webhooks) {
              const size = w.body ? JSON.stringify(w.body).length : 0;
              const sizeStr = size > 1024 ? `${(size / 1024).toFixed(1)}KB` : `${size}B`;
              const time = new Date(w.createdAt).toLocaleTimeString();
              liveRef.addLine('output', `${w.method.padEnd(8)} ${(w.source || w.ip).slice(0, 18).padEnd(18)} ${sizeStr.padEnd(8)} ${time}`);
            }
          }
        } catch {
          liveRef.addLine('error', 'Failed to fetch webhooks.');
        }
        break;
      }

      case 'forward': {
        const fwdSlug = args[0];
        const rawFwdUrl = args[1];
        if (!fwdSlug || !rawFwdUrl) {
          liveRef.addLine('error', 'Usage: forward <project-slug> <local-url>');
          liveRef.addLine('info', '  Example: forward my-project 3000');
          liveRef.addLine('info', '           forward my-project localhost:3000');
          liveRef.addLine('info', '           forward my-project http://localhost:3000');
          break;
        }
        if (_listening) {
          liveRef.addLine('error', 'Already active. Type "stop" first.');
          break;
        }
        const fwdUrl = normalizeUrl(rawFwdUrl);
        if (fwdUrl !== rawFwdUrl) {
          liveRef.addLine('info', `Normalized "${rawFwdUrl}" → ${fwdUrl}`);
        }
        startForwarding(fwdSlug, fwdUrl);
        break;
      }

      case 'listen': {
        const listenSlug = args[0];
        if (!listenSlug) {
          liveRef.addLine('error', 'Usage: listen <project-slug>');
          break;
        }
        if (_listening) {
          liveRef.addLine('error', 'Already active. Type "stop" first.');
          break;
        }
        startForwarding(listenSlug, '');
        break;
      }

      case 'stop':
        if (!_listening) {
          liveRef.addLine('error', 'Not currently active.');
        } else {
          if (_forwarding && _forwardStats.total > 0) {
            liveRef.addLine('info', `Stats: ${_forwardStats.total} forwarded │ ${_forwardStats.success} success │ ${_forwardStats.failed} failed`);
          }
          stopListening();
          liveRef.addLine('info', 'Stopped.');
        }
        break;

      case 'replay': {
        const replayId = args[0];
        const rawReplayUrl = args[1];
        if (!replayId || !rawReplayUrl) {
          liveRef.addLine('error', 'Usage: replay <webhook-id> <target-url>');
          liveRef.addLine('info', '  Example: replay wh_abc123 3000');
          break;
        }
        const replayUrl = normalizeUrl(rawReplayUrl);
        if (replayUrl !== rawReplayUrl) {
          liveRef.addLine('info', `Normalized "${rawReplayUrl}" → ${replayUrl}`);
        }
        try {
          liveRef.addLine('info', `Replaying ${replayId} → ${replayUrl}...`);
          const res = await api.post(`/webhooks/${replayId}/replay`, { targetUrl: replayUrl });
          const { status, responseTime } = res.data;
          const color = status >= 200 && status < 300 ? 'success' : 'error';
          liveRef.addLine(color as LineType, `  Response: ${status} in ${responseTime}ms`);
        } catch (err: any) {
          liveRef.addLine('error', err.response?.data?.error || err.message || 'Replay failed');
        }
        break;
      }

      case 'curl': {
        const curlId = args[0];
        if (!curlId) {
          liveRef.addLine('error', 'Usage: curl <webhook-id>');
          break;
        }
        try {
          const res = await api.get(`/webhooks/${curlId}`);
          const wh = res.data;
          const headers = Object.entries(wh.headers || {})
            .map(([k, v]) => `-H "${k}: ${v}"`)
            .join(' ');
          const body = wh.body ? `-d '${JSON.stringify(wh.body).replace(/'/g, "'\"'\"'")}'` : '';
          const cmd = `curl -X ${wh.method} ${headers} ${body} <your-url>`;
          liveRef.addLine('output', cmd);
          navigator.clipboard.writeText(cmd);
          liveRef.addLine('success', 'Copied to clipboard!');
        } catch {
          liveRef.addLine('error', `Webhook "${curlId}" not found.`);
        }
        break;
      }

      case 'tester': {
        const tProvider = args[0];
        const tEvent = args[1];
        const rawTUrl = args[2];
        if (!tProvider || !tEvent || !rawTUrl) {
          liveRef.addLine('error', 'Usage: tester <provider> <event> <target-url>');
          liveRef.addLine('info', '  Example: tester stripe invoice.payment_succeeded 3000');
          liveRef.addLine('info', '           tester stripe invoice.payment_succeeded localhost:3000');
          liveRef.addLine('info', '  Providers: stripe, github, paypal, shopify, twilio, slack, discord, microsoft_teams, sendgrid, mailgun, zoom, calendly, typeform, google, square, generic');
          break;
        }
        const tUrl = normalizeUrl(rawTUrl);
        if (tUrl !== rawTUrl) {
          liveRef.addLine('info', `Normalized "${rawTUrl}" → ${tUrl}`);
        }
        try {
          liveRef.addLine('info', `Sending ${tProvider}/${tEvent} → ${tUrl}...`);
          const res = await api.post('/tester/send', { targetUrl: tUrl, provider: tProvider, eventType: tEvent });
          const { response, responseTime, source } = res.data;
          if (response) {
            const color = response.status >= 200 && response.status < 300 ? 'success' : 'error';
            liveRef.addLine(color as LineType, `  ${response.status} ${response.statusText} in ${responseTime}ms — source: ${source}`);
          } else {
            liveRef.addLine('error', '  No response received');
          }
        } catch (err: any) {
          liveRef.addLine('error', err.response?.data?.error || err.message || 'Test failed');
        }
        break;
      }

      case 'clear':
      case 'cls':
        _lines = [];
        setLines([]);
        break;

      default:
        liveRef.addLine('error', `Unknown command: "${cmd}". Type "help" for available commands.`);
    }
  }, [user, startForwarding, stopListening]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHistoryIndex((prev) => {
        const next = Math.min(prev + 1, _history.length - 1);
        if (_history[next]) setInput(_history[next]);
        return next;
      });
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHistoryIndex((prev) => {
        const next = Math.max(prev - 1, -1);
        if (next === -1) setInput('');
        else if (_history[next]) setInput(_history[next]);
        return next;
      });
    }
  };

  const lineColor = (type: LineType) => {
    switch (type) {
      case 'input': return 'text-emerald-400';
      case 'error': return 'text-red-400';
      case 'success': return 'text-emerald-400';
      case 'webhook': return 'text-slate-300';
      case 'info': return 'text-slate-500';
      case 'warn': return 'text-amber-400';
      default: return 'text-slate-300';
    }
  };

  const { bar: usageBar } = buildProgressBar(planLimit.used + forwardStats.total, planLimit.limit);

  return (
    <div className="h-full flex flex-col bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <CliLogo className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium text-white">HookSwing CLI</span>
          {_listening && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              {_forwarding ? 'Forwarding' : 'Listening'}
            </span>
          )}
          {reconnectAttempts > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
              <WifiOff className="w-3 h-3" />
              Reconnecting {reconnectAttempts}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {listening && (
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400">
              <Zap className="w-3 h-3 text-emerald-400" />
              <span className="text-slate-300">{sessionTime}</span>
              <span className="text-slate-600">|</span>
              <span>{planLimit.used + forwardStats.total} / {planLimit.limit}</span>
              <span className="text-emerald-500">{usageBar.slice(0, filledCount(planLimit.used + forwardStats.total, planLimit.limit))}</span>
              <span className="text-slate-700">{usageBar.slice(filledCount(planLimit.used + forwardStats.total, planLimit.limit))}</span>
            </div>
          )}
          <button
            onClick={() => { _lines = []; setLines([]); }}
            className="text-slate-500 hover:text-white transition-colors"
            title="Clear"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Terminal output */}
      <div
        className="flex-1 overflow-auto p-4 font-mono text-sm"
        onClick={() => inputRef.current?.focus()}
      >
        {lines.map((line, i) => (
          <div key={i} className={`${lineColor(line.type)} whitespace-pre-wrap break-all leading-relaxed`}>
            {line.type === 'webhook' && line.meta ? (
              <WebhookLine meta={line.meta} />
            ) : line.type === 'info' ? (
              <span className="text-slate-600"># {line.text}</span>
            ) : (
              <span>{line.text}</span>
            )}
          </div>
        ))}
        <div ref={linesEndRef} />
      </div>

      {/* Input line */}
      <div className="flex items-center gap-2 px-4 py-3 bg-slate-900 border-t border-slate-800">
        <span className="text-emerald-400 font-mono text-sm shrink-0">{'>'}</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent text-slate-200 font-mono text-sm outline-none placeholder-slate-600"
          placeholder={_listening ? 'Type "stop" to stop...' : 'Type a command...'}
          autoComplete="off"
          spellCheck={false}
        />
      </div>
    </div>
  );
}

// ── Helper for progress bar filled count ──
function filledCount(used: number, limit: number) {
  const pct = Math.min(100, Math.round((used / limit) * 100));
  return Math.floor(pct / 10);
}

// ── Rich Webhook Line Renderer ──
function WebhookLine({ meta }: { meta: WebhookMeta }) {
  return (
    <span className="inline-flex items-center gap-2">
      {meta.method && (
        <span className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-xs font-bold ${methodColor(meta.method)} ${methodBg(meta.method)} min-w-[3rem]`}>
          {meta.method}
        </span>
      )}
      {meta.path !== undefined && (
        <span className="text-slate-300">{meta.path}</span>
      )}
      {meta.statusCode !== undefined && (
        <span className={`text-xs font-bold ${statusColor(meta.statusCode)}`}>
          {meta.statusCode}
        </span>
      )}
      {meta.responseTime !== undefined && (
        <span className="text-slate-500 text-xs">{meta.responseTime}ms</span>
      )}
      {meta.source && (
        <span className="text-slate-500 text-xs">({meta.source})</span>
      )}
      {meta.size && (
        <span className="text-slate-600 text-xs">{meta.size}</span>
      )}
    </span>
  );
}
