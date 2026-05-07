import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import { io, Socket } from 'socket.io-client';
import { Terminal, Trash2 } from 'lucide-react';

type LineType = 'input' | 'output' | 'error' | 'success' | 'webhook' | 'info';

interface Line {
  type: LineType;
  text: string;
  timestamp: string;
}

const API_URL = window.location.origin;

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

// Ref that the socket callbacks read — always points to the latest closures.
const liveRef = {
  addLine: (type: LineType, text: string) => {},
  setListening: (v: boolean) => {},
  setForwarding: (v: boolean) => {},
  setForwardStats: (fn: (prev: typeof _forwardStats) => typeof _forwardStats) => {},
};

function setSocket(s: Socket | null) { _socket = s; }

export default function CliPage() {
  const { user } = useAuth();
  const [lines, setLines] = useState<Line[]>(_lines);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>(_history);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [listening, setListening] = useState(_listening);
  const [forwarding, setForwarding] = useState(_forwarding);
  const [forwardStats, setForwardStats] = useState({ ..._forwardStats });
  const inputRef = useRef<HTMLInputElement>(null);
  const linesEndRef = useRef<HTMLDivElement>(null);

  // ── Keep liveRef always pointing to latest closures ──
  liveRef.addLine = (type: LineType, text: string) => {
    const line: Line = { type, text, timestamp: new Date().toLocaleTimeString() };
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

  // Auto-scroll to bottom
  useEffect(() => {
    linesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Welcome message (only once per session)
  useEffect(() => {
    if (!_hasWelcomed) {
      _hasWelcomed = true;
      liveRef.addLine('info', 'WebhookVault Browser CLI v1.0.0');
      liveRef.addLine('info', 'Type "help" for available commands.');
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

    api.get('/projects')
      .then((res) => {
        const project = res.data.projects.find((p: any) => p.slug === slug);
        if (!project) {
          liveRef.addLine('error', `Project "${slug}" not found.`);
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
        });

        setSocket(socket);
        _forwardUrl = targetUrl;
        liveRef.setListening(true);
        liveRef.setForwarding(!!targetUrl);
        liveRef.setForwardStats(() => ({ total: 0, success: 0, failed: 0 }));

        socket.on('connect', () => {
          liveRef.addLine('success', 'Connected. Waiting for webhooks...');
          socket.emit('subscribe', project.id);
        });

        socket.on('webhook', async (webhook: any) => {
          const size = webhook.body ? JSON.stringify(webhook.body).length : 0;
          const sizeStr = size > 1024 ? `${(size / 1024).toFixed(1)}KB` : `${size}B`;
          const text = `[${new Date(webhook.createdAt).toLocaleTimeString()}]  ${webhook.method.padEnd(6)}  ${webhook.source || webhook.ip}  ${sizeStr}`;
          liveRef.addLine('webhook', text);

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

            const start = performance.now();
            const res = await fetch(targetUrl, {
              method: webhook.method,
              headers,
              body,
            });
            const responseTime = Math.round(performance.now() - start);

            if (res.ok) {
              liveRef.setForwardStats((prev) => ({ ...prev, success: prev.success + 1 }));
              liveRef.addLine('success', `  → ${res.status} OK in ${responseTime}ms`);
            } else {
              liveRef.setForwardStats((prev) => ({ ...prev, failed: prev.failed + 1 }));
              liveRef.addLine('error', `  → ${res.status} ${res.statusText} in ${responseTime}ms`);
              if (res.status === 404 && !_showed404Hint) {
                _showed404Hint = true;
                liveRef.addLine('info', `  Your local server got the request but returned 404.`);
                liveRef.addLine('info', `  Make sure you have a route matching ${new URL(targetUrl).pathname}`);
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

        socket.on('disconnect', () => {
          liveRef.addLine('info', 'Disconnected.');
          liveRef.setListening(false);
        });

        socket.on('connect_error', (err) => {
          if (!_listening) return;
          liveRef.addLine('error', `Connection error: ${err.message}`);
          liveRef.setListening(false);
        });
      })
      .catch(() => {
        liveRef.addLine('error', 'Failed to fetch projects.');
      });
  }, [stopListening]);

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
        liveRef.addLine('output', '  listen <slug>       Watch webhooks without forwarding');
        liveRef.addLine('output', '  stop                Stop listening');
        liveRef.addLine('output', '  replay <id> <url>   Replay a webhook to a URL');
        liveRef.addLine('output', '  curl <id>           Copy curl command to replay a webhook');
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
          const project = res.data.projects.find((p: any) => p.slug === slug);
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
        const fwdUrl = args[1];
        if (!fwdSlug || !fwdUrl) {
          liveRef.addLine('error', 'Usage: forward <project-slug> <local-url>');
          liveRef.addLine('info', '  Example: forward my-project http://localhost:3000/webhook');
          break;
        }
        if (_listening) {
          liveRef.addLine('error', 'Already active. Type "stop" first.');
          break;
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
        const replayUrl = args[1];
        if (!replayId || !replayUrl) {
          liveRef.addLine('error', 'Usage: replay <webhook-id> <target-url>');
          break;
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
      case 'webhook': return 'text-sky-400';
      case 'info': return 'text-slate-500';
      default: return 'text-slate-300';
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-medium text-white">WebhookVault CLI</span>
          {_listening && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              {_forwarding ? 'Forwarding' : 'Listening'}
            </span>
          )}
        </div>
        <button
          onClick={() => { _lines = []; setLines([]); }}
          className="text-slate-500 hover:text-white transition-colors"
          title="Clear"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Terminal output */}
      <div
        className="flex-1 overflow-auto p-4 font-mono text-sm"
        onClick={() => inputRef.current?.focus()}
      >
        {lines.map((line, i) => (
          <div key={i} className={`${lineColor(line.type)} whitespace-pre-wrap break-all leading-relaxed`}>
            {line.type === 'webhook' ? (
              <span>{line.text}</span>
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
