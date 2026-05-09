import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { Server as SocketIOServer } from 'socket.io';
import { prisma } from './lib/prisma';
import { hookRateLimit } from './middleware/rateLimit';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import webhookRoutes from './routes/webhooks';
import teamRoutes from './routes/teams';
import notificationRoutes from './routes/notifications';
import billingRoutes from './routes/billing';
import alertRoutes from './routes/alerts';
import dashboardRoutes from './routes/dashboard';
import adminRoutes from './routes/admin';
import testerRoutes from './routes/tester';
import feedbackRoutes from './routes/feedback';
import supportRoutes from './routes/support';
import securityScanRoutes from './routes/securityScans';
import badgeRoutes from './routes/badge';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { setIO, getIO } from './lib/socketio';
import { createNotification } from './lib/notification';

// Request timeout middleware — prevents hanging requests from consuming connections
const REQUEST_TIMEOUT_MS = 30000;
function timeoutMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  req.setTimeout(REQUEST_TIMEOUT_MS, () => {
    res.status(504).json({ error: 'Request timeout' });
  });
  next();
}

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ noServer: true });
const io = new SocketIOServer(server, {
  cors: {
    origin: true,
    credentials: true,
  },
  path: '/socket.io',
});
setIO(io);

// Route WebSocket upgrades manually to avoid ws <-> Socket.IO conflict
server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url || '/', `http://${request.headers.host}`).pathname;

  if (pathname === '/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  }
  // Socket.IO handles /socket.io upgrades internally
});

// WebSocket connections: slug -> Set<WebSocket>
const wsConnections = new Map<string, Set<any>>();

app.set('trust proxy', 1);

app.use(cors({
  origin: true,
  credentials: true,
}));

// Request timeout for all routes
app.use(timeoutMiddleware);

// Stripe webhook needs raw body
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }));

// Public Hook Receiver — raw body BEFORE json parser
// Handles /hook/:slug and /hook/:slug/any/extra/paths (some services append paths)
async function handleHook(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const slug = req.params.slug;

    // Try customSlug first, then fall back to auto-generated slug
    let project = await prisma.project.findUnique({
      where: { customSlug: slug },
      include: { user: true, team: { include: { members: true } } },
    });

    if (!project) {
      project = await prisma.project.findUnique({
        where: { slug },
        include: { user: true, team: { include: { members: true } } },
      });
    }

    if (!project) {
      return res.status(404).json({ error: 'Hook not found' });
    }

    // Check plan limits using immutable global usage counter per owner
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    // The owner is the user who pays for this project
    const ownerId = project.userId || project.team?.ownerId;
    const ownerUser = await prisma.user.findUnique({ where: { id: ownerId || '' } });
    const plan = ownerUser?.plan || 'FREE';
    const limit = plan === 'FREE' ? 500 : 10000;

    const usage = await prisma.webhookUsage.upsert({
      where: { userId_year_month: { userId: ownerId || '', year, month } },
      update: { count: { increment: 1 } },
      create: { userId: ownerId || '', year, month, count: 1 },
    });

    const isDropped = usage.count > limit;

    // Parse body — keep raw for signature verification, parsed for UI
    let body = null;
    let rawBody = null;
    const contentType = req.headers['content-type'] || '';
    if (req.body && req.body.length > 0) {
      rawBody = req.body.toString('utf-8');
      if (contentType.includes('application/json')) {
        try { body = JSON.parse(rawBody); } catch { body = rawBody; }
      } else {
        body = rawBody;
      }
    }

    // Detect source and event type
    const source = inferSource(req.headers);
    const eventType = inferEventType(req.headers, body, source);

    // Store webhook
    const webhook = await prisma.webhook.create({
      data: {
        projectId: project.id,
        method: req.method,
        headers: req.headers as any,
        body,
        rawBody,
        query: req.query as any,
        ip: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || null,
        source,
        eventType,
      },
    });

    // Compute original request path (after the slug) for CLI forwarding
    const webhookPath = req.params[0] ? `/${req.params[0]}` : '/';

    if (!isDropped) {
      // Socket.IO broadcast to project room
      io.to(project.id).emit('webhook', { ...webhook, path: webhookPath, _count: { comments: 0 } });

      // Broadcast to WebSocket clients (CLI)
      const connections = wsConnections.get(slug);
      if (connections) {
        const active = Array.from(connections).filter((ws) => ws.readyState === 1);
        if (active.length > 1) {
          console.log(`[WS] Broadcasting webhook to ${active.length} connections for slug: ${slug}`);
        }
        const payload = JSON.stringify({ type: 'webhook', data: { ...webhook, path: webhookPath } });
        active.forEach((ws) => ws.send(payload));
      }

      // Fire alerts (async, don't block response)
      fireAlerts(project.id, webhook, req.headers['host'] as string);

      // In-app notification for project owner
      const notifyUserId = project.userId || project.team?.ownerId;
      if (notifyUserId) {
        createNotification({
          userId: notifyUserId,
          type: 'webhook_received',
          title: 'Webhook Received',
          message: `New ${webhook.method} webhook received in ${project.name}`,
          data: { projectId: project.id, projectName: project.name, webhookId: webhook.id, method: webhook.method },
        }).catch(() => {});
      }
    }

    res.status(200).json({ ok: true, dropped: isDropped });
  } catch (err: any) {
    console.error('[handleHook] Error:', err.message);
    next(err);
  }
}

async function fireAlerts(projectId: string, webhook: any, host: string) {
  try {
    const alerts = await prisma.alertConfig.findMany({
      where: { projectId, enabled: true },
    });

    for (const alert of alerts) {
      try {
        if (alert.type === 'slack') {
          await axios.post(alert.url, {
            text: `🪝 Webhook received`,
            blocks: [
              {
                type: 'header',
                text: { type: 'plain_text', text: '🪝 HookSwing Alert', emoji: true },
              },
              {
                type: 'section',
                fields: [
                  { type: 'mrkdwn', text: `*Method:*\n${webhook.method}` },
                  { type: 'mrkdwn', text: `*Source:*\n${webhook.source || 'Unknown'}` },
                  { type: 'mrkdwn', text: `*Time:*\n${new Date(webhook.createdAt).toLocaleString()}` },
                  { type: 'mrkdwn', text: `*IP:*\n${webhook.ip}` },
                ],
              },
              {
                type: 'section',
                text: { type: 'mrkdwn', text: `\`\`\`json\n${JSON.stringify(webhook.body || {}, null, 2).slice(0, 2800)}\n\`\`\`` },
              },
              {
                type: 'context',
                elements: [
                  { type: 'mrkdwn', text: `<https://${host}/dashboard/projects/${projectId}|View in HookSwing>` },
                ],
              },
            ],
          }, { timeout: 5000 });
        } else if (alert.type === 'discord') {
          await axios.post(alert.url, {
            embeds: [
              {
                title: '🪝 Webhook Received',
                color: 0x10b981,
                fields: [
                  { name: 'Method', value: webhook.method, inline: true },
                  { name: 'Source', value: webhook.source || 'Unknown', inline: true },
                  { name: 'IP', value: webhook.ip, inline: true },
                  { name: 'Time', value: new Date(webhook.createdAt).toLocaleString(), inline: true },
                  { name: 'Body', value: '```json\n' + JSON.stringify(webhook.body || {}, null, 2).slice(0, 1000) + '\n```' },
                ],
                footer: { text: 'HookSwing' },
                timestamp: new Date(webhook.createdAt).toISOString(),
              },
            ],
          }, { timeout: 5000 });
        } else if (alert.type === 'telegram') {
          const config = alert.config as any;
          const text = [
            '🪝 <b>HookSwing Alert</b>',
            '',
            `<b>Method:</b> ${webhook.method}`,
            `<b>Source:</b> ${webhook.source || 'Unknown'}`,
            `<b>IP:</b> ${webhook.ip}`,
            `<b>Time:</b> ${new Date(webhook.createdAt).toLocaleString()}`,
            '',
            '<b>Body:</b>',
            '<pre>' + JSON.stringify(webhook.body || {}, null, 2).slice(0, 3500) + '</pre>',
            '',
            `<a href="https://${host}/dashboard/projects/${projectId}">View in HookSwing</a>`,
          ].join('\n');

          await axios.post(alert.url, {
            chat_id: config?.chatId,
            text,
            parse_mode: 'HTML',
            disable_web_page_preview: true,
          }, { timeout: 5000 });
        }
      } catch (err) {
        // Silently fail individual alerts so one bad URL doesn't break others
        console.error(`Alert failed (${alert.type}):`, (err as any).message);
      }
    }
  } catch {
    // Silently fail alerts
  }
}

app.all('/hook/:slug', hookRateLimit, express.raw({ type: '*/*', limit: '1mb' }), handleHook);
app.all('/hook/:slug/*', hookRateLimit, express.raw({ type: '*/*', limit: '1mb' }), handleHook);

// Healthcheck endpoint (must be public, no auth)
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// JSON parser for all other routes
app.use(express.json({ limit: '1mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/projects/:projectId/alerts', alertRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tester', testerRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/security-scans', securityScanRoutes);
app.use('/shield', badgeRoutes);

// Serve frontend static files (production only)
const webDistPath = path.resolve(__dirname, '../../web/dist');
app.use(express.static(webDistPath));

// SPA catch-all — serve index.html for any non-API route
app.get('*', (req, res, next) => {
  if (
    req.path.startsWith('/api') ||
    req.path.startsWith('/hook') ||
    req.path.startsWith('/ws') ||
    req.path.startsWith('/health') ||
    req.path.startsWith('/socket.io')
  ) {
    return next();
  }
  res.sendFile(path.join(webDistPath, 'index.html'));
});

// Socket.IO auth middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token as string;
  if (!token) {
    return next(new Error('Authentication error: no token'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    (socket as any).userId = decoded.userId;
    next();
  } catch {
    next(new Error('Authentication error: invalid token'));
  }
});

io.on('connection', (socket) => {
  const userId = (socket as any).userId;
  if (userId) {
    socket.join(`user:${userId}`);
  }

  socket.on('subscribe', (projectId: string) => {
    socket.join(projectId);
  });

  socket.on('unsubscribe', (projectId: string) => {
    socket.leave(projectId);
  });

  socket.on('support:join', () => {
    if (userId) {
      socket.join(`support:${userId}`);
    }
  });

  socket.on('support:join_admin', () => {
    socket.join('support:admin');
  });

  // Admin joins a specific user's support room (for typing + admin-joined notify)
  socket.on('support:join_user', (targetUserId: string) => {
    socket.join(`support:${targetUserId}`);
    const io = getIO();
    if (io) {
      io.to(`support:${targetUserId}`).emit('support:admin_joined', {
        joinedAt: new Date().toISOString(),
      });
    }
  });

  socket.on('support:leave', () => {
    if (userId) {
      socket.leave(`support:${userId}`);
    }
  });

  socket.on('support:leave_admin', () => {
    socket.leave('support:admin');
  });

  // Typing indicators for support chat
  socket.on('support:typing', ({ to, isAdmin }: { to?: string; isAdmin?: boolean }) => {
    if (isAdmin && to) {
      // Admin typing → notify user
      io.to(`support:${to}`).emit('support:typing', { isAdmin: true });
    } else if (userId) {
      // User typing → notify admins
      io.to('support:admin').emit('support:typing', { userId, isAdmin: false });
    }
  });

  socket.on('support:stop_typing', ({ to, isAdmin }: { to?: string; isAdmin?: boolean }) => {
    if (isAdmin && to) {
      io.to(`support:${to}`).emit('support:stop_typing', { isAdmin: true });
    } else if (userId) {
      io.to('support:admin').emit('support:stop_typing', { userId, isAdmin: false });
    }
  });

  socket.on('team:join', (teamId: string) => {
    socket.join(`team:${teamId}`);
  });

  socket.on('team:leave', (teamId: string) => {
    socket.leave(`team:${teamId}`);
  });
});

function inferSource(headers: any): string | null {
  const ua = (headers['user-agent'] || '').toLowerCase();
  const h: Record<string, any> = Object.fromEntries(
    Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])
  );

  if (ua.includes('stripe')) return 'stripe';
  if (h['x-stripe-signature']) return 'stripe';

  if (ua.includes('github')) return 'github';
  if (h['x-github-event']) return 'github';

  if (ua.includes('twilio')) return 'twilio';
  if (h['x-twilio-signature']) return 'twilio';

  if (ua.includes('paypal')) return 'paypal';
  if (h['x-paypal-transmission-id']) return 'paypal';

  if (ua.includes('shopify')) return 'shopify';
  if (h['x-shopify-topic']) return 'shopify';

  if (ua.includes('slack')) return 'slack';
  if (h['x-slack-signature']) return 'slack';

  if (ua.includes('discord')) return 'discord';
  if (h['x-signature-ed25519']) return 'discord';

  if (ua.includes('microsoft teams')) return 'microsoft_teams';

  if (ua.includes('sendgrid')) return 'sendgrid';

  if (ua.includes('mailgun')) return 'mailgun';

  if (ua.includes('zoom')) return 'zoom';

  if (ua.includes('calendly')) return 'calendly';
  if (h['calendly-webhook-signature']) return 'calendly';

  if (ua.includes('typeform')) return 'typeform';

  if (ua.includes('square')) return 'square';
  if (h['x-square-signature']) return 'square';

  if (ua.includes('google')) return 'google';
  if (ua.includes('apis-google')) return 'google';

  if (h['x-webhook-source']) return String(h['x-webhook-source']);

  return null;
}

function inferEventType(headers: any, body: any, source: string | null): string | null {
  if (!body || typeof body !== 'object') return null;

  const h: Record<string, any> = Object.fromEntries(
    Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])
  );

  switch (source) {
    case 'stripe':
      return body.type || null;

    case 'github': {
      const event = h['x-github-event'];
      const action = body.action;
      if (event && action) return `${event}.${action}`;
      return event || action || null;
    }

    case 'paypal':
      return body.event_type || null;

    case 'shopify':
      return h['x-shopify-topic'] || null;

    case 'twilio': {
      if (body.MessageStatus) return `sms.${body.MessageStatus}`;
      if (body.CallStatus) return `call.${body.CallStatus}`;
      if (body.Direction) return `incoming.${body.Direction}`;
      return null;
    }

    case 'slack':
      return body.command || body.type || body.callback_id || null;

    case 'discord':
      return body.type !== undefined ? `interaction.${body.type}` : null;

    case 'microsoft_teams':
      return body.type || null;

    case 'sendgrid':
      if (Array.isArray(body) && body[0]?.event) return body[0].event;
      return body.event || null;

    case 'mailgun':
      return body.event || null;

    case 'zoom':
      return body.event || null;

    case 'calendly':
      return body.event || null;

    case 'typeform':
      return body.event_type || null;

    case 'google': {
      if (body.message?.attributes?.eventType) return body.message.attributes.eventType;
      return body.type || null;
    }

    case 'square':
      return body.type || null;

    default:
      return body.event || body.type || body.event_type || null;
  }
}

// WebSocket handling
wss.on('connection', (ws, req) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const token = url.searchParams.get('token');

  console.log(`[WS] Connection attempt from ${req.socket.remoteAddress} — token present: ${!!token}`);

  if (!token) {
    console.log('[WS] Rejected — missing token');
    ws.close(1008, 'Missing token');
    return;
  }

  let tokenValid = false;
  try {
    jwt.verify(token, process.env.JWT_SECRET!);
    tokenValid = true;
  } catch {
    // Not an access token — try refresh token
    try {
      jwt.verify(token, process.env.JWT_REFRESH_SECRET!);
      tokenValid = true;
    } catch {
      tokenValid = false;
    }
  }

  if (!tokenValid) {
    console.log('[WS] Rejected — invalid token');
    ws.close(1008, 'Invalid token');
    return;
  }

  console.log('[WS] Token verified — connection accepted');

  // Data-frame heartbeat (proxies can't strip JSON like they can ping/pong)
  let heartbeatTimeout: NodeJS.Timeout | null = null;

  function resetHeartbeatTimeout() {
    if (heartbeatTimeout) clearTimeout(heartbeatTimeout);
    heartbeatTimeout = setTimeout(() => {
      console.log('[WS] Heartbeat timeout — terminating connection');
      ws.terminate();
    }, 45000);
  }

  resetHeartbeatTimeout();

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      if (data.action === 'subscribe' && data.slug) {
        const connections = wsConnections.get(data.slug) || new Set();
        connections.add(ws);
        wsConnections.set(data.slug, connections);
        console.log(`[WS] Client subscribed to slug: ${data.slug} — ${connections.size} total connection(s)`);
      } else if (data.action === 'heartbeat') {
        resetHeartbeatTimeout();
        if (ws.readyState === 1) {
          ws.send(JSON.stringify({ type: 'heartbeat' }));
        }
      }
    } catch {
      // ignore invalid messages
    }
  });

  ws.on('error', (err) => {
    console.error('[WS] Client error:', err.message);
  });

  ws.on('close', (code, reason) => {
    if (heartbeatTimeout) clearTimeout(heartbeatTimeout);
    console.log(`[WS] Client disconnected — code: ${code}, reason: ${reason?.toString() || 'none'}`);
    wsConnections.forEach((connections, slug) => {
      connections.delete(ws);
      if (connections.size === 0) {
        wsConnections.delete(slug);
      }
    });
  });
});

app.use(errorHandler);

export { app, server };
