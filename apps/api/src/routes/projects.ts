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
  });

  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: { _count: { select: { projects: true } } },
  });

  if (user?.plan === 'FREE' && user._count.projects >= 3) {
    return res.status(403).json({ error: 'Free plan limited to 3 projects' });
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
      userId: req.user!.id,
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

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const webhookCount = await prisma.webhook.count({
    where: { projectId: project.id, createdAt: { gte: monthStart } },
  });

  res.json({
    ...project,
    webhookCount,
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

export default router;
