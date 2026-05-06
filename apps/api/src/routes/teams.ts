import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import { apiRateLimit } from '../middleware/rateLimit';

const router = Router();

router.use(authMiddleware);
router.use(apiRateLimit);

// --- List all teams for current user ---
router.get('/', async (req: AuthRequest, res) => {
  const teams = await prisma.team.findMany({
    where: {
      members: { some: { userId: req.user!.id } },
    },
    include: {
      members: {
        include: { user: { select: { id: true, email: true, name: true } } },
      },
      _count: { select: { projects: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(teams);
});

// --- Create team ---
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
    include: {
      members: { include: { user: { select: { id: true, email: true, name: true } } } },
      _count: { select: { projects: true } },
    },
  });

  res.status(201).json(team);
});

// --- Get single team ---
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
      projects: {
        select: { id: true, name: true, slug: true, description: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      },
      _count: { select: { projects: true } },
    },
  });

  if (!team) {
    return res.status(404).json({ error: 'Team not found' });
  }

  res.json(team);
});

// --- Rename team ---
router.patch('/:id', async (req: AuthRequest, res) => {
  const schema = z.object({
    name: z.string().min(1).max(100),
  });

  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const team = await prisma.team.findFirst({
    where: {
      id: req.params.id,
      ownerId: req.user!.id,
    },
  });

  if (!team) {
    return res.status(403).json({ error: 'Only team owner can rename' });
  }

  const updated = await prisma.team.update({
    where: { id: req.params.id },
    data: { name: result.data.name },
    include: {
      members: { include: { user: { select: { id: true, email: true, name: true } } } },
      _count: { select: { projects: true } },
    },
  });

  res.json(updated);
});

// --- Delete team ---
router.delete('/:id', async (req: AuthRequest, res) => {
  const team = await prisma.team.findFirst({
    where: {
      id: req.params.id,
      ownerId: req.user!.id,
    },
  });

  if (!team) {
    return res.status(403).json({ error: 'Only team owner can delete' });
  }

  await prisma.team.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// --- Leave team (non-owner) ---
router.post('/:id/leave', async (req: AuthRequest, res) => {
  const team = await prisma.team.findFirst({
    where: {
      id: req.params.id,
      members: { some: { userId: req.user!.id } },
    },
  });

  if (!team) {
    return res.status(404).json({ error: 'Team not found' });
  }

  if (team.ownerId === req.user!.id) {
    return res.status(400).json({ error: 'Owner cannot leave. Transfer ownership or delete the team.' });
  }

  await prisma.teamMember.deleteMany({
    where: { teamId: req.params.id, userId: req.user!.id },
  });

  res.json({ success: true });
});

// --- Transfer ownership ---
router.post('/:id/transfer', async (req: AuthRequest, res) => {
  const schema = z.object({
    newOwnerId: z.string().min(1),
  });

  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const team = await prisma.team.findFirst({
    where: {
      id: req.params.id,
      ownerId: req.user!.id,
    },
  });

  if (!team) {
    return res.status(403).json({ error: 'Only team owner can transfer ownership' });
  }

  // Verify new owner is a team member
  const member = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: { teamId: req.params.id, userId: result.data.newOwnerId },
    },
  });

  if (!member) {
    return res.status(400).json({ error: 'New owner must be a team member' });
  }

  // Ensure new owner is ADMIN
  if (member.role !== 'ADMIN') {
    await prisma.teamMember.update({
      where: { id: member.id },
      data: { role: 'ADMIN' },
    });
  }

  await prisma.team.update({
    where: { id: req.params.id },
    data: { ownerId: result.data.newOwnerId },
  });

  res.json({ success: true });
});

// --- Invite member ---
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

  const existing = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId: req.params.id, userId: invitedUser.id } },
  });

  if (existing) {
    return res.status(409).json({ error: 'User is already a team member' });
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

// --- Update member role ---
router.patch('/:id/members/:userId', async (req: AuthRequest, res) => {
  const schema = z.object({
    role: z.enum(['MEMBER', 'ADMIN']),
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

  // Cannot change owner's role
  if (team.ownerId === req.params.userId) {
    return res.status(400).json({ error: 'Cannot change team owner role' });
  }

  await prisma.teamMember.updateMany({
    where: { teamId: req.params.id, userId: req.params.userId },
    data: { role: result.data.role },
  });

  res.json({ success: true });
});

// --- Remove member ---
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

  // Cannot remove owner
  if (team.ownerId === req.params.userId) {
    return res.status(400).json({ error: 'Cannot remove team owner' });
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
