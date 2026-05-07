import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { logActivity } from '../lib/activity';
import { getEffectivePlan } from '../lib/permissions';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import { apiRateLimit } from '../middleware/rateLimit';

const router = Router({ mergeParams: true });

router.use(authMiddleware);
router.use(apiRateLimit);

async function canUseAlerts(userId: string, projectId: string): Promise<boolean> {
  const plan = await getEffectivePlan(userId, projectId);
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

  res.json({ alerts, canUseAlerts: await canUseAlerts(req.user!.id, req.params.projectId) });
});

// Create alert
router.post('/', async (req: AuthRequest, res) => {
  if (!await canUseAlerts(req.user!.id, req.params.projectId)) {
    return res.status(403).json({ error: 'Alerts require Pro or Team plan' });
  }

  const schema = z.discriminatedUnion('type', [
    z.object({
      type: z.literal('slack'),
      url: z.string().url(),
    }),
    z.object({
      type: z.literal('discord'),
      url: z.string().url(),
    }),
    z.object({
      type: z.literal('telegram'),
      botToken: z.string().min(1),
      chatId: z.string().min(1),
    }),
  ]);

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

  const data: any = {
    projectId: req.params.projectId,
    type: result.data.type,
  };

  if (result.data.type === 'slack' || result.data.type === 'discord') {
    data.url = result.data.url;
  } else if (result.data.type === 'telegram') {
    data.url = `https://api.telegram.org/bot${result.data.botToken}/sendMessage`;
    data.config = { chatId: result.data.chatId, botToken: result.data.botToken };
  }

  const alert = await prisma.alertConfig.create({ data });

  if (project.teamId) {
    await logActivity({
      teamId: project.teamId,
      userId: req.user!.id,
      action: 'alert_added',
      targetType: 'project',
      targetId: project.id,
      metadata: { alertType: result.data.type },
    });
  }

  res.status(201).json(alert);
});

// Update alert (toggle enabled)
router.patch('/:alertId', async (req: AuthRequest, res) => {
  const schema = z.object({
    enabled: z.boolean().optional(),
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

  const alert = await prisma.alertConfig.updateMany({
    where: { id: req.params.alertId, projectId: req.params.projectId },
    data,
  });

  if (alert.count === 0) {
    return res.status(404).json({ error: 'Alert not found' });
  }

  const proj = await prisma.project.findUnique({
    where: { id: req.params.projectId },
    select: { teamId: true },
  });
  if (proj?.teamId && result.data.enabled !== undefined) {
    await logActivity({
      teamId: proj.teamId,
      userId: req.user!.id,
      action: 'alert_toggled',
      targetType: 'project',
      targetId: req.params.projectId,
      metadata: { alertId: req.params.alertId, enabled: result.data.enabled },
    });
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

  if (project.teamId) {
    await logActivity({
      teamId: project.teamId,
      userId: req.user!.id,
      action: 'alert_removed',
      targetType: 'project',
      targetId: project.id,
      metadata: { alertId: req.params.alertId },
    });
  }

  res.json({ success: true });
});

export default router;
