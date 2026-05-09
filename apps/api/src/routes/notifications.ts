import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import { apiRateLimit } from '../middleware/rateLimit';
import { seedDefaultPreferences, notificationTypeLabels } from '../lib/notification';

const router = Router();

router.use(authMiddleware);
router.use(apiRateLimit);

// --- List notifications ---
router.get('/', async (req: AuthRequest, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const unreadOnly = req.query.unread === 'true';

  const where = {
    userId: req.user!.id,
    ...(unreadOnly ? { read: false } : {}),
  };

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({ where }),
  ]);

  res.json({ notifications, total, page, limit });
});

// --- Unread count ---
router.get('/unread-count', async (req: AuthRequest, res) => {
  const count = await prisma.notification.count({
    where: { userId: req.user!.id, read: false },
  });
  res.json({ count });
});

// --- Mark as read ---
router.post('/:id/read', async (req: AuthRequest, res) => {
  const notification = await prisma.notification.updateMany({
    where: { id: req.params.id, userId: req.user!.id },
    data: { read: true },
  });
  res.json({ success: notification.count > 0 });
});

// --- Mark all as read ---
router.post('/read-all', async (req: AuthRequest, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user!.id, read: false },
    data: { read: true },
  });
  res.json({ success: true });
});

// --- Delete notification ---
router.delete('/:id', async (req: AuthRequest, res) => {
  await prisma.notification.deleteMany({
    where: { id: req.params.id, userId: req.user!.id },
  });
  res.json({ success: true });
});

// --- Get preferences ---
router.get('/preferences', async (req: AuthRequest, res) => {
  await seedDefaultPreferences(req.user!.id);
  const prefs = await prisma.notificationPreference.findMany({
    where: { userId: req.user!.id },
  });
  res.json({
    preferences: prefs.map((p) => ({
      ...p,
      label: notificationTypeLabels[p.type as keyof typeof notificationTypeLabels] || p.type,
    })),
  });
});

// --- Update preferences ---
router.patch('/preferences', async (req: AuthRequest, res) => {
  const schema = z.object({
    type: z.string().min(1),
    enabled: z.boolean(),
  });
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  await prisma.notificationPreference.upsert({
    where: { userId_type: { userId: req.user!.id, type: result.data.type } },
    update: { enabled: result.data.enabled },
    create: { userId: req.user!.id, type: result.data.type, enabled: result.data.enabled },
  });

  res.json({ success: true });
});

export default router;
