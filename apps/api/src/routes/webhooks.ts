import { Router } from 'express';
import axios from 'axios';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { logActivity } from '../lib/activity';
import { getEffectivePlan } from '../lib/permissions';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import { apiRateLimit } from '../middleware/rateLimit';
import { getIO } from '../lib/socketio';

function getHistoryCutoff(plan: string): Date | null {
  const now = new Date();
  switch (plan) {
    case 'FREE':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'PRO':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case 'TEAM':
      return null;
    default:
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
}

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
  const effectivePlan = project.teamId ? 'TEAM' : req.user!.plan;
  const cutoff = getHistoryCutoff(effectivePlan);

  const where: any = { projectId: req.params.projectId };
  if (method) where.method = method.toUpperCase();
  if (search) {
    where.OR = [
      { body: { path: [], string_contains: search } },
      { ip: { contains: search } },
      { source: { contains: search } },
    ];
  }
  if (cutoff) where.createdAt = { gte: cutoff };

  const [webhooks, total] = await Promise.all([
    prisma.webhook.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { _count: { select: { comments: true } } },
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

  const effectivePlan = await getEffectivePlan(req.user!.id, webhook.projectId);
  if (effectivePlan === 'FREE') {
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

  const { targetUrl, headers, body } = result.data;

  try {
    const start = Date.now();
    const response = await axios({
      method: webhook.method as any,
      url: targetUrl,
      headers: {
        ...(webhook.headers as Record<string, string>),
        ...headers,
      },
      data: body !== undefined
        ? JSON.stringify(body)
        : (webhook.rawBody || (webhook.body ? JSON.stringify(webhook.body) : undefined)),
      timeout: 30000,
      validateStatus: () => true,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });
    const responseTime = Date.now() - start;

    const createData: any = {
      projectId: webhook.projectId,
      method: webhook.method,
      headers: { ...(webhook.headers as any), ...headers },
      body: body || webhook.body,
      query: webhook.query,
      ip: '127.0.0.1',
      userAgent: 'HookSwing-Replay',
      statusCode: response.status,
      responseBody: typeof response.data === 'string' ? response.data : JSON.stringify(response.data),
      responseTime,
      isReplay: true,
      originalId: webhook.id,
    };
    const replayWebhook = await prisma.webhook.create({ data: createData });

    if (webhook.projectId) getIO()?.to(webhook.projectId).emit('webhook', replayWebhook);

    // Log replay activity for team projects
    const proj = webhook.projectId ? await prisma.project.findUnique({ where: { id: webhook.projectId }, select: { teamId: true } }) : null;
    if (proj?.teamId) {
      await logActivity({
        teamId: proj.teamId,
        userId: req.user!.id,
        action: 'webhook_replayed',
        targetType: 'webhook',
        targetId: webhook.id,
        metadata: { targetUrl, status: response.status },
      });
    }

    res.json({
      replayId: replayWebhook.id,
      status: response.status,
      responseTime,
    });
  } catch (err: any) {
    const message = err.code === 'ECONNREFUSED' ? 'Connection refused — target URL is unreachable'
      : err.code === 'ENOTFOUND' ? 'DNS lookup failed — target URL does not exist'
      : err.code === 'ETIMEDOUT' ? 'Connection timed out'
      : err.message;
    res.status(502).json({ error: 'Replay failed', message });
  }
});

// Browser-based replay: the browser makes the HTTP request, then reports the result
router.post('/:id/replay-record', async (req: AuthRequest, res) => {
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

  const effectivePlan = await getEffectivePlan(req.user!.id, webhook.projectId);
  if (effectivePlan === 'FREE') {
    return res.status(403).json({ error: 'Replay requires Pro or Team plan' });
  }

  const schema = z.object({
    targetUrl: z.string().url(),
    statusCode: z.number().int(),
    responseTime: z.number().int(),
    responseBody: z.string().max(50000).optional(),
    headers: z.record(z.any()).optional(),
    body: z.any().optional(),
    query: z.record(z.any()).optional(),
  });

  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const { targetUrl, statusCode, responseTime, responseBody, headers, body, query } = result.data;

  const createData: any = {
    projectId: webhook.projectId,
    method: webhook.method,
    headers: headers !== undefined ? headers : webhook.headers,
    body: body !== undefined ? body : webhook.body,
    query: query !== undefined ? query : webhook.query,
    ip: '127.0.0.1',
    userAgent: 'HookSwing-Replay',
    statusCode,
    responseBody: responseBody || null,
    responseTime,
    isReplay: true,
    originalId: webhook.id,
  };

  const replayWebhook = await prisma.webhook.create({ data: createData });

  if (webhook.projectId) getIO()?.to(webhook.projectId).emit('webhook', replayWebhook);

  const proj = webhook.projectId ? await prisma.project.findUnique({ where: { id: webhook.projectId }, select: { teamId: true } }) : null;
  if (proj?.teamId) {
    await logActivity({
      teamId: proj.teamId,
      userId: req.user!.id,
      action: 'webhook_replayed',
      targetType: 'webhook',
      targetId: webhook.id,
      metadata: { targetUrl, status: statusCode },
    });
  }

  res.json({
    replayId: replayWebhook.id,
    status: statusCode,
    responseTime,
  });
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

  const wh = await prisma.webhook.findUnique({
    where: { id: req.params.id },
    select: { projectId: true },
  });
  if (wh) {
    const proj = wh?.projectId ? await prisma.project.findUnique({ where: { id: wh.projectId }, select: { teamId: true } }) : null;
    if (proj?.teamId) {
      await logActivity({
        teamId: proj.teamId,
        userId: req.user!.id,
        action: 'webhook_deleted',
        targetType: 'webhook',
        targetId: req.params.id,
      });
    }
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

// Export webhooks as JSON (Pro/Team only)
router.get('/projects/:projectId/export/json', async (req: AuthRequest, res) => {
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

  const effectivePlan = await getEffectivePlan(req.user!.id, project.id);
  if (effectivePlan === 'FREE') {
    return res.status(403).json({ error: 'Export requires Pro or Team plan' });
  }

  const webhooks = await prisma.webhook.findMany({
    where: { projectId: req.params.projectId },
    orderBy: { createdAt: 'desc' },
  });

  if (project.teamId) {
    await logActivity({
      teamId: project.teamId,
      userId: req.user!.id,
      action: 'export_downloaded',
      targetType: 'project',
      targetId: project.id,
      metadata: { format: 'json' },
    });
  }

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${project.name}-webhooks.json"`);
  res.send(JSON.stringify(webhooks, null, 2));
});

// Export webhooks as CSV (Pro/Team only)
router.get('/projects/:projectId/export/csv', async (req: AuthRequest, res) => {
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

  const effectivePlan = await getEffectivePlan(req.user!.id, project.id);
  if (effectivePlan === 'FREE') {
    return res.status(403).json({ error: 'Export requires Pro or Team plan' });
  }

  const webhooks = await prisma.webhook.findMany({
    where: { projectId: req.params.projectId },
    orderBy: { createdAt: 'desc' },
  });

  const headers = ['id', 'method', 'source', 'ip', 'status_code', 'body', 'headers', 'query', 'created_at'];
  const rows = webhooks.map((w) => [
    w.id,
    w.method,
    w.source || '',
    w.ip,
    w.statusCode?.toString() || '',
    JSON.stringify(w.body || '').replace(/"/g, '""'),
    JSON.stringify(w.headers || '').replace(/"/g, '""'),
    JSON.stringify(w.query || '').replace(/"/g, '""'),
    w.createdAt.toISOString(),
  ]);

  const csv = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  if (project.teamId) {
    await logActivity({
      teamId: project.teamId,
      userId: req.user!.id,
      action: 'export_downloaded',
      targetType: 'project',
      targetId: project.id,
      metadata: { format: 'csv' },
    });
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${project.name}-webhooks.csv"`);
  res.send(csv);
});

// --- Webhook comments (Team plan only) ---

router.get('/:id/comments', async (req: AuthRequest, res) => {
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

  const effectivePlan = await getEffectivePlan(req.user!.id, webhook.projectId);
  if (effectivePlan !== 'TEAM') {
    return res.status(403).json({ error: 'Comments require Team plan' });
  }

  const comments = await prisma.webhookComment.findMany({
    where: { webhookId: req.params.id, parentId: null },
    include: {
      user: { select: { id: true, name: true, email: true } },
      reactions: true,
      replies: {
        take: 3,
        orderBy: { createdAt: 'asc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          reactions: true,
        },
      },
      _count: { select: { replies: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  const userId = req.user!.id;
  const enrich = (c: any) => {
    const likes = c.reactions.filter((r: any) => r.type === 'like').length;
    const dislikes = c.reactions.filter((r: any) => r.type === 'dislike').length;
    const userReaction = c.reactions.find((r: any) => r.userId === userId)?.type || null;
    const { reactions, ...rest } = c;
    return {
      ...rest,
      likes,
      dislikes,
      userReaction,
      replies: c.replies?.map(enrich) || [],
    };
  };

  res.json(comments.map(enrich));
});

router.post('/:id/comments', async (req: AuthRequest, res) => {
  const schema = z.object({
    content: z.string().min(1).max(2000),
    parentId: z.string().optional(),
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
    include: { project: { select: { teamId: true } } },
  });

  if (!webhook) {
    return res.status(404).json({ error: 'Webhook not found' });
  }

  const effectivePlan = await getEffectivePlan(req.user!.id, webhook.projectId);
  if (effectivePlan !== 'TEAM') {
    return res.status(403).json({ error: 'Comments require Team plan' });
  }

  if (result.data.parentId) {
    const parent = await prisma.webhookComment.findFirst({
      where: { id: result.data.parentId, webhookId: req.params.id },
    });
    if (!parent) {
      return res.status(404).json({ error: 'Parent comment not found' });
    }
  }

  const comment = await prisma.webhookComment.create({
    data: {
      webhookId: req.params.id,
      userId: req.user!.id,
      content: result.data.content,
      parentId: result.data.parentId || null,
    },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  if (webhook.project?.teamId) {
    await logActivity({
      teamId: webhook.project.teamId,
      userId: req.user!.id,
      action: result.data.parentId ? 'comment_replied' : 'comment_added',
      targetType: 'webhook',
      targetId: req.params.id,
    });
  }

  res.status(201).json({ ...comment, likes: 0, dislikes: 0, userReaction: null, replies: [] });
});

router.delete('/:id/comments/:commentId', async (req: AuthRequest, res) => {
  const comment = await prisma.webhookComment.findFirst({
    where: {
      id: req.params.commentId,
      webhookId: req.params.id,
      userId: req.user!.id,
    },
    include: {
      webhook: {
        include: { project: { select: { teamId: true } } },
      },
    },
  });

  if (!comment) {
    return res.status(404).json({ error: 'Comment not found' });
  }

  const effectivePlan = await getEffectivePlan(req.user!.id, comment.webhook.projectId);
  if (effectivePlan !== 'TEAM') {
    return res.status(403).json({ error: 'Comments require Team plan' });
  }

  await prisma.webhookComment.delete({ where: { id: req.params.commentId } });

  if (comment.webhook.project?.teamId) {
    await logActivity({
      teamId: comment.webhook.project.teamId,
      userId: req.user!.id,
      action: 'comment_deleted',
      targetType: 'webhook',
      targetId: req.params.id,
    });
  }

  res.json({ success: true });
});

// --- Comment reactions (like/dislike) ---

router.post('/comments/:commentId/react', async (req: AuthRequest, res) => {
  const schema = z.object({ type: z.enum(['like', 'dislike']) });
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid reaction type' });
  }

  const comment = await prisma.webhookComment.findFirst({
    where: { id: req.params.commentId },
    include: {
      webhook: {
        include: { project: { select: { teamId: true, userId: true } } },
      },
    },
  });

  if (!comment) {
    return res.status(404).json({ error: 'Comment not found' });
  }

  const hasAccess = comment.webhook.project?.userId === req.user!.id ||
    (comment.webhook.project?.teamId
      ? await prisma.teamMember.findFirst({ where: { teamId: comment.webhook.project.teamId, userId: req.user!.id } })
      : null);

  if (!hasAccess) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const existing = await prisma.commentReaction.findFirst({
    where: { commentId: req.params.commentId, userId: req.user!.id },
  });

  let action: 'added' | 'removed' | 'changed' = 'added';

  if (existing) {
    if (existing.type === result.data.type) {
      await prisma.commentReaction.delete({ where: { id: existing.id } });
      action = 'removed';
    } else {
      await prisma.commentReaction.update({
        where: { id: existing.id },
        data: { type: result.data.type },
      });
      action = 'changed';
    }
  } else {
    await prisma.commentReaction.create({
      data: {
        commentId: req.params.commentId,
        userId: req.user!.id,
        type: result.data.type,
      },
    });
  }

  const counts = await prisma.commentReaction.groupBy({
    by: ['type'],
    where: { commentId: req.params.commentId },
    _count: { type: true },
  });

  const likes = counts.find((c: any) => c.type === 'like')?._count?.type || 0;
  const dislikes = counts.find((c: any) => c.type === 'dislike')?._count?.type || 0;

  res.json({
    action,
    likes,
    dislikes,
    userReaction: action === 'removed' ? null : result.data.type,
  });
});

router.delete('/comments/:commentId/react', async (req: AuthRequest, res) => {
  const comment = await prisma.webhookComment.findFirst({
    where: { id: req.params.commentId },
    include: {
      webhook: {
        include: { project: { select: { teamId: true, userId: true } } },
      },
    },
  });

  if (!comment) {
    return res.status(404).json({ error: 'Comment not found' });
  }

  const hasAccess = comment.webhook.project?.userId === req.user!.id ||
    (comment.webhook.project?.teamId
      ? await prisma.teamMember.findFirst({ where: { teamId: comment.webhook.project.teamId, userId: req.user!.id } })
      : null);

  if (!hasAccess) {
    return res.status(403).json({ error: 'Access denied' });
  }

  await prisma.commentReaction.deleteMany({
    where: { commentId: req.params.commentId, userId: req.user!.id },
  });

  const counts = await prisma.commentReaction.groupBy({
    by: ['type'],
    where: { commentId: req.params.commentId },
    _count: { type: true },
  });

  const likes = counts.find((c: any) => c.type === 'like')?._count?.type || 0;
  const dislikes = counts.find((c: any) => c.type === 'dislike')?._count?.type || 0;

  res.json({ likes, dislikes, userReaction: null });
});

export default router;
