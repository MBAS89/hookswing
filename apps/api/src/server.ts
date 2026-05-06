import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { prisma } from './lib/prisma';
import { broadcastToProject, addSSEClient } from './lib/sse';
import { hookRateLimit } from './middleware/rateLimit';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import webhookRoutes from './routes/webhooks';
import teamRoutes from './routes/teams';
import billingRoutes from './routes/billing';
import jwt from 'jsonwebtoken';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// WebSocket connections: slug -> Set<WebSocket>
const wsConnections = new Map<string, Set<any>>();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Stripe webhook needs raw body
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }));

// Public Hook Receiver — raw body BEFORE json parser
app.all('/hook/:slug', hookRateLimit, express.raw({ type: '*/*', limit: '1mb' }), async (req, res) => {
  const slug = req.params.slug;

  const project = await prisma.project.findUnique({
    where: { slug },
    include: { user: true, team: { include: { members: true } } },
  });

  if (!project) {
    return res.status(404).json({ error: 'Hook not found' });
  }

  // Check plan limits
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const webhookCount = await prisma.webhook.count({
    where: { projectId: project.id, createdAt: { gte: monthStart } },
  });

  const owner = project.user || project.team?.ownerId;
  const ownerUser = await prisma.user.findUnique({ where: { id: owner || '' } });
  const plan = ownerUser?.plan || 'FREE';
  const limit = plan === 'FREE' ? 500 : 10000;
  const isDropped = webhookCount >= limit;

  // Parse body
  let body = null;
  const contentType = req.headers['content-type'] || '';
  if (req.body && req.body.length > 0) {
    const rawBody = req.body.toString('utf-8');
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
      query: req.query as any,
      ip: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || null,
      source: inferSource(req.headers),
    },
  });

  if (!isDropped) {
    broadcastToProject(project.id, { type: 'webhook', data: webhook });

    // Broadcast to WebSocket clients
    const connections = wsConnections.get(slug);
    if (connections) {
      const payload = JSON.stringify({ type: 'webhook', data: webhook });
      connections.forEach((ws) => {
        if (ws.readyState === 1) {
          ws.send(payload);
        }
      });
    }
  }

  res.status(200).json({ ok: true, dropped: isDropped });
});

// JSON parser for all other routes
app.use(express.json({ limit: '1mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/billing', billingRoutes);

// SSE Stream
app.get('/api/stream', (req, res) => {
  const token = req.query.token as string;
  const projectId = req.query.projectId as string;

  if (!token || !projectId) {
    return res.status(400).json({ error: 'Missing token or projectId' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders?.();

    res.write(':ok\n\n');
    addSSEClient(projectId, res);
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
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
