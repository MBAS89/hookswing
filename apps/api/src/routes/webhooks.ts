import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import { apiRateLimit } from '../middleware/rateLimit';
import { broadcastToProject } from '../lib/sse';

const router = Router();

router.use(authMiddleware);
router.use(apiRateLimit);

router.get('/projects/:projectId/webhooks', async (req: AuthRequest, res) => {
  const project = await prisma.project.findFirst({
    where: {
      id: req.params.projectId,
      OR: [
        { userId: req.user!.id },
        { team: { members: { some: { userId: req.user!.id } } } },
      ],
    },
  });

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
  const method = req.query.method as string | undefined;
  const search = req.query.search as string | undefined;

  const where: any = { projectId: req.params.projectId };
  if (method) where.method = method.toUpperCase();
  if (search) {
    where.OR = [
      { body: { path: [], string_contains: search } },
      { ip: { contains: search } },
      { source: { contains: search } },
    ];
  }

  const [webhooks, total] = await Promise.all([
    prisma.webhook.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.webhook.count({ where }),
  ]);

  res.json({
    webhooks,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

router.get('/:id', async (req: AuthRequest, res) => {
  const webhook = await prisma.webhook.findFirst({
    where: {
      id: req.params.id,
      project: {
        OR: [
          { userId: req.user!.id },
          { team: { members: { some: { userId: req.user!.id } } } },
        ],
      },
    },
  });

  if (!webhook) {
    return res.status(404).json({ error: 'Webhook not found' });
  }

  res.json(webhook);
});

router.post('/:id/replay', async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (user?.plan === 'FREE') {
    return res.status(403).json({ error: 'Replay requires Pro or Team plan' });
  }

  const schema = z.object({
    targetUrl: z.string().url(),
    headers: z.record(z.string()).optional(),
    body: z.any().optional(),
  });

  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const webhook = await prisma.webhook.findFirst({
    where: {
      id: req.params.id,
      project: {
        OR: [
          { userId: req.user!.id },
          { team: { members: { some: { userId: req.user!.id } } } },
        ],
      },
    },
  });

  if (!webhook) {
    return res.status(404).json({ error: 'Webhook not found' });
  }

  const { targetUrl, headers, body } = result.data;

  try {
    const start = Date.now();
    const response = await fetch(targetUrl, {
      method: webhook.method,
      headers: {
        ...(webhook.headers as Record<string, string>),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const responseTime = Date.now() - start;

    const createData: any = {
      projectId: webhook.projectId,
      method: webhook.method,
      headers: { ...(webhook.headers as any), ...headers },
      body: body || webhook.body,
      query: webhook.query,
      ip: '127.0.0.1',
      userAgent: 'WebhookVault-Replay',
      statusCode: response.status,
      responseBody: await response.text().catch(() => null),
      responseTime,
      isReplay: true,
      originalId: webhook.id,
    };
    const replayWebhook = await prisma.webhook.create({ data: createData });

    broadcastToProject(webhook.projectId, { type: 'webhook', data: replayWebhook });

    res.json({
      replayId: replayWebhook.id,
      status: response.status,
      responseTime,
    });
  } catch (err: any) {
    res.status(502).json({ error: 'Replay failed', message: err.message });
  }
});

router.delete('/:id', async (req: AuthRequest, res) => {
  const webhook = await prisma.webhook.deleteMany({
    where: {
      id: req.params.id,
      project: {
        OR: [
          { userId: req.user!.id },
          { team: { members: { some: { userId: req.user!.id } } } },
        ],
      },
    },
  });

  if (webhook.count === 0) {
    return res.status(404).json({ error: 'Webhook not found' });
  }

  res.json({ success: true });
});

router.post('/projects/:projectId/webhooks/bulk-delete', async (req: AuthRequest, res) => {
  const schema = z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  });

  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const project = await prisma.project.findFirst({
    where: {
      id: req.params.projectId,
      OR: [
        { userId: req.user!.id },
        { team: { members: { some: { userId: req.user!.id } } } },
      ],
    },
  });

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const where: any = { projectId: req.params.projectId };
  if (result.data.startDate) where.createdAt = { gte: new Date(result.data.startDate) };
  if (result.data.endDate) where.createdAt = { ...where.createdAt, lte: new Date(result.data.endDate) };

  const { count } = await prisma.webhook.deleteMany({ where });
  res.json({ deleted: count });
});

export default router;
