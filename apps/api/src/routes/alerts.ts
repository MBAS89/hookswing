import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import { apiRateLimit } from '../middleware/rateLimit';

const router = Router({ mergeParams: true });

router.use(authMiddleware);
router.use(apiRateLimit);

function canUseAlerts(plan: string): boolean {
  return plan === 'PRO' || plan === 'TEAM';
}

// List alerts for a project
router.get('/', async (req: AuthRequest, res) => {
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

  const alerts = await prisma.alertConfig.findMany({
    where: { projectId: req.params.projectId },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ alerts, canUseAlerts: canUseAlerts(req.user!.plan) });
});

// Create alert
router.post('/', async (req: AuthRequest, res) => {
  if (!canUseAlerts(req.user!.plan)) {
    return res.status(403).json({ error: 'Alerts require Pro or Team plan' });
  }

  const schema = z.object({
    type: z.enum(['slack', 'discord']),
    url: z.string().url(),
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
        { team: { members: { some: { userId: req.user!.id, role: 'ADMIN' } } } },
      ],
    },
  });

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const alert = await prisma.alertConfig.create({
    data: {
      projectId: req.params.projectId,
      type: result.data.type,
      url: result.data.url,
    },
  });

  res.status(201).json(alert);
});

// Update alert (toggle enabled)
router.patch('/:alertId', async (req: AuthRequest, res) => {
  const schema = z.object({
    enabled: z.boolean().optional(),
    url: z.string().url().optional(),
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
        { team: { members: { some: { userId: req.user!.id, role: 'ADMIN' } } } },
      ],
    },
  });

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const data: any = {};
  if (result.data.enabled !== undefined) data.enabled = result.data.enabled;
  if (result.data.url !== undefined) data.url = result.data.url;

  const alert = await prisma.alertConfig.updateMany({
    where: { id: req.params.alertId, projectId: req.params.projectId },
    data,
  });

  if (alert.count === 0) {
    return res.status(404).json({ error: 'Alert not found' });
  }

  res.json({ success: true });
});

// Delete alert
router.delete('/:alertId', async (req: AuthRequest, res) => {
  const project = await prisma.project.findFirst({
    where: {
      id: req.params.projectId,
      OR: [
        { userId: req.user!.id },
        { team: { members: { some: { userId: req.user!.id, role: 'ADMIN' } } } },
      ],
    },
  });

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  await prisma.alertConfig.deleteMany({
    where: { id: req.params.alertId, projectId: req.params.projectId },
  });

  res.json({ success: true });
});

export default router;
