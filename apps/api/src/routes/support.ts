import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import { apiRateLimit } from '../middleware/rateLimit';
import { getIO } from '../lib/socketio';
import { fireAdminAlert } from '../lib/adminAlerts';

const router = Router();

router.use(authMiddleware);
router.use(apiRateLimit);

// --- User: Send support message ---
router.post('/messages', async (req: AuthRequest, res) => {
  const schema = z.object({
    message: z.string().min(1).max(2000),
  });

  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const chat = await prisma.supportChat.create({
    data: {
      userId: req.user!.id,
      message: result.data.message,
      isAdmin: false,
      read: false,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  // Emit to user's support room and admin room
  const io = getIO();
  if (io) {
    io.to(`support:${req.user!.id}`).emit('support:message', chat);
    io.to('support:admin').emit('support:message', chat);
  }

  // Fire admin alert
  fireAdminAlert('support_message', {
    userId: req.user!.id,
    email: req.user!.email,
    name: req.user!.name,
    message: result.data.message.slice(0, 100),
  }).catch(() => {});

  res.status(201).json({ chat });
});

// --- User: Get my support messages ---
router.get('/messages', async (req: AuthRequest, res) => {
  const messages = await prisma.supportChat.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'asc' },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
  res.json({ messages });
});

// --- User: Mark messages as read ---
router.post('/mark-read', async (req: AuthRequest, res) => {
  await prisma.supportChat.updateMany({
    where: { userId: req.user!.id, isAdmin: true, read: false },
    data: { read: true },
  });
  res.json({ success: true });
});

export default router;
