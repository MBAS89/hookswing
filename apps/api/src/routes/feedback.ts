import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import { apiRateLimit } from '../middleware/rateLimit';

const router = Router();

router.use(authMiddleware);
router.use(apiRateLimit);

const FEEDBACK_SUBJECTS = [
  'improvement',
  'bug',
  'suggestion',
  'feature_request',
  'other',
] as const;

// --- Submit feedback ---
router.post('/', async (req: AuthRequest, res) => {
  const schema = z.object({
    subject: z.enum(FEEDBACK_SUBJECTS),
    message: z.string().min(1).max(5000),
  });

  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const feedback = await prisma.feedback.create({
    data: {
      userId: req.user!.id,
      subject: result.data.subject,
      message: result.data.message,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  res.status(201).json({ feedback });
});

// --- Get my feedback ---
router.get('/my', async (req: AuthRequest, res) => {
  const feedback = await prisma.feedback.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ feedback });
});

export default router;
