import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import { apiRateLimit } from '../middleware/rateLimit';

const router = Router();

function generateSlug(): string {
  return Array.from({ length: 12 }, () =>
    'abcdefghijklmnopqrstuvwxyz0123456789'.charAt(Math.floor(Math.random() * 36))
  ).join('');
}

function getHistoryCutoff(plan: string): Date | null {
  const now = new Date();
  switch (plan) {
    case 'FREE':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'PRO':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case 'TEAM':
      return null; // unlimited
    default:
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
}

router.use(authMiddleware);
router.use(apiRateLimit);

router.get('/', async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { userId },
        {
          team: {
            members: { some: { userId } },
          },
        },
      ],
    },
    include: {
      _count: { select: { webhooks: true } },
      team: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ projects });
});

router.post('/', async (req: AuthRequest, res) => {
  const schema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    teamId: z.string().optional(),
  });

  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const { teamId } = result.data;
  const userId = req.user!.id;

  // If creating for a team, verify membership
  if (teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });
    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this team' });
    }
  } else {
    // Personal project: check plan limit
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { _count: { select: { projects: true } } },
    });
    if (user?.plan === 'FREE' && user._count.projects >= 3) {
      return res.status(403).json({ error: 'Free plan limited to 3 projects' });
    }
  }

  let slug = generateSlug();
  while (await prisma.project.findUnique({ where: { slug } })) {
    slug = generateSlug();
  }

  const project = await prisma.project.create({
    data: {
      name: result.data.name,
      description: result.data.description,
      slug,
      userId: teamId ? null : userId,
      teamId: teamId || null,
    },
    include: {
      _count: { select: { webhooks: true } },
      team: { select: { id: true, name: true } },
    },
  });

  res.status(201).json({
    ...project,
    webhookUrl: `${req.protocol}://${req.get('host')}/hook/${slug}`,
  });
});

router.get('/:id', async (req: AuthRequest, res) => {
  const project = await prisma.project.findFirst({
    where: {
      id: req.params.id,
      OR: [
        { userId: req.user!.id },
        {
          team: {
            members: { some: { userId: req.user!.id } },
          },
        },
      ],
    },
    include: {
      _count: { select: { webhooks: true } },
      webhooks: { orderBy: { createdAt: 'desc' }, take: 1, select: { createdAt: true } },
    },
  });

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const cutoff = getHistoryCutoff(req.user!.plan);
  const countWhere: any = { projectId: project.id };
  if (cutoff) countWhere.createdAt = { gte: cutoff };

  const webhookCount = await prisma.webhook.count({ where: countWhere });

  res.json({
    ...project,
    webhookCount,
    historyLimitDays: cutoff ? Math.round((Date.now() - cutoff.getTime()) / (24 * 60 * 60 * 1000)) : null,
    webhookUrl: `${req.protocol}://${req.get('host')}/hook/${project.slug}`,
  });
});

router.patch('/:id', async (req: AuthRequest, res) => {
  const schema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
  });

  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const project = await prisma.project.updateMany({
    where: {
      id: req.params.id,
      OR: [
        { userId: req.user!.id },
        {
          team: {
            members: { some: { userId: req.user!.id, role: 'ADMIN' } },
          },
        },
      ],
    },
    data: result.data,
  });

  if (project.count === 0) {
    return res.status(404).json({ error: 'Project not found or unauthorized' });
  }

  const updated = await prisma.project.findUnique({ where: { id: req.params.id } });
  res.json(updated);
});

router.delete('/:id', async (req: AuthRequest, res) => {
  const project = await prisma.project.deleteMany({
    where: {
      id: req.params.id,
      OR: [
        { userId: req.user!.id },
        {
          team: {
            members: { some: { userId: req.user!.id, role: 'ADMIN' } },
          },
        },
      ],
    },
  });

  if (project.count === 0) {
    return res.status(404).json({ error: 'Project not found or unauthorized' });
  }

  res.json({ success: true });
});

// Webhook list nested under project (matches spec: GET /api/projects/:projectId/webhooks)
router.get('/:projectId/webhooks', async (req: AuthRequest, res) => {
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
  const cutoff = getHistoryCutoff(req.user!.plan);

  const where: any = { projectId: req.params.projectId };
  if (method) where.method = method.toUpperCase();
  if (cutoff) where.createdAt = { gte: cutoff };

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

export default router;
