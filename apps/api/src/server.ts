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
import billingRoutes from './routes/billing';
import alertRoutes from './routes/alerts';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { setIO } from './lib/socketio';

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

// Stripe webhook needs raw body
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }));

// Public Hook Receiver — raw body BEFORE json parser
// Handles /hook/:slug and /hook/:slug/any/extra/paths (some services append paths)
async function handleHook(req: express.Request, res: express.Response) {
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

  // Check plan limits
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const webhookCount = await prisma.webhook.count({
    where: { projectId: project.id, createdAt: { gte: monthStart } },
  });

  const ownerId = project.userId || project.team?.ownerId;
  const ownerUser = await prisma.user.findUnique({ where: { id: ownerId || '' } });
  const plan = ownerUser?.plan || 'FREE';
  const limit = plan === 'FREE' ? 500 : 10000;
  const isDropped = webhookCount >= limit;

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
      source: inferSource(req.headers),
    },
  });

  if (!isDropped) {
    // Socket.IO broadcast to project room
    io.to(project.id).emit('webhook', webhook);

    // Broadcast to WebSocket clients (CLI)
    const connections = wsConnections.get(slug);
    if (connections) {
      const payload = JSON.stringify({ type: 'webhook', data: webhook });
      connections.forEach((ws) => {
        if (ws.readyState === 1) {
          ws.send(payload);
        }
      });
    }

    // Fire alerts (async, don't block response)
    fireAlerts(project.id, webhook, req.headers['host'] as string);
  }

  res.status(200).json({ ok: true, dropped: isDropped });
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
                text: { type: 'plain_text', text: '🪝 WebhookVault Alert', emoji: true },
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
                  { type: 'mrkdwn', text: `<https://${host}/dashboard/projects/${projectId}|View in WebhookVault>` },
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
                footer: { text: 'WebhookVault' },
                timestamp: new Date(webhook.createdAt).toISOString(),
              },
            ],
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
app.use('/api/billing', billingRoutes);
app.use('/api/projects/:projectId/alerts', alertRoutes);

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
    jwt.verify(token, process.env.JWT_SECRET!);
    next();
  } catch {
    next(new Error('Authentication error: invalid token'));
  }
});

io.on('connection', (socket) => {
  socket.on('subscribe', (projectId: string) => {
    socket.join(projectId);
  });

  socket.on('unsubscribe', (projectId: string) => {
    socket.leave(projectId);
  });
});

function inferSource(headers: any): string | null {
  const ua = headers['user-agent'] || '';
  if (ua.includes('Stripe')) return 'stripe';
  if (ua.includes('GitHub')) return 'github';
  if (headers['x-github-event']) return 'github';
  if (headers['x-stripe-signature']) return 'stripe';
  if (ua.includes('Twilio')) return 'twilio';
  if (headers['x-twilio-signature']) return 'twilio';
  if (ua.includes('PayPal')) return 'paypal';
  if (headers['x-paypal-transmission-id']) return 'paypal';
  return null;
}

// WebSocket handling
wss.on('connection', (ws, req) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const token = url.searchParams.get('token');

  if (!token) {
    ws.close(1008, 'Missing token');
    return;
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET!);
  } catch {
    ws.close(1008, 'Invalid token');
    return;
  }

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      if (data.action === 'subscribe' && data.slug) {
        const connections = wsConnections.get(data.slug) || new Set();
        connections.add(ws);
        wsConnections.set(data.slug, connections);
      }
    } catch {
      // ignore invalid messages
    }
  });

  ws.on('close', () => {
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
