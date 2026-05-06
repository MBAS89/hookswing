import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import { apiRateLimit } from '../middleware/rateLimit';

const router = Router();

router.use(authMiddleware);
router.use(apiRateLimit);

router.post('/', async (req: AuthRequest, res) => {
  const schema = z.object({
    name: z.string().min(1).max(100),
  });

  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (user?.plan !== 'TEAM') {
    return res.status(403).json({ error: 'Teams require Team plan' });
  }

  const team = await prisma.team.create({
    data: {
      name: result.data.name,
      ownerId: req.user!.id,
      members: {
        create: {
          userId: req.user!.id,
          role: 'ADMIN',
        },
      },
    },
    include: { members: { include: { user: { select: { id: true, email: true, name: true } } } } },
  });

  res.status(201).json(team);
});

router.get('/:id', async (req: AuthRequest, res) => {
  const team = await prisma.team.findFirst({
    where: {
      id: req.params.id,
      members: { some: { userId: req.user!.id } },
    },
    include: {
      members: {
        include: { user: { select: { id: true, email: true, name: true } } },
      },
      projects: { select: { id: true, name: true, slug: true } },
    },
  });

  if (!team) {
    return res.status(404).json({ error: 'Team not found' });
  }

  res.json(team);
});

router.post('/:id/members', async (req: AuthRequest, res) => {
  const schema = z.object({
    email: z.string().email(),
    role: z.enum(['MEMBER', 'ADMIN']).optional(),
  });

  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const team = await prisma.team.findFirst({
    where: {
      id: req.params.id,
      members: { some: { userId: req.user!.id, role: 'ADMIN' } },
    },
  });

  if (!team) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  const invitedUser = await prisma.user.findUnique({
    where: { email: result.data.email },
  });

  if (!invitedUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  const member = await prisma.teamMember.create({
    data: {
      teamId: req.params.id,
      userId: invitedUser.id,
      role: result.data.role || 'MEMBER',
    },
    include: { user: { select: { id: true, email: true, name: true } } },
  });

  res.status(201).json(member);
});

router.delete('/:id/members/:userId', async (req: AuthRequest, res) => {
  const team = await prisma.team.findFirst({
    where: {
      id: req.params.id,
      members: { some: { userId: req.user!.id, role: 'ADMIN' } },
    },
  });

  if (!team) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  await prisma.teamMember.deleteMany({
    where: {
      teamId: req.params.id,
      userId: req.params.userId,
    },
  });

  res.json({ success: true });
});

export default router;
