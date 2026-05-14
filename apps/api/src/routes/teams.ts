import { createSafeRouter } from '../middleware/safeRouter';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { logActivity } from '../lib/activity';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import { apiRateLimit } from '../middleware/rateLimit';
import { createNotification, notifyTeamAdmins } from '../lib/notification';
import { decryptWebhooks } from '../lib/encryption';

const router = createSafeRouter();

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
      projects: {
        select: { id: true, name: true, slug: true, description: true },
        orderBy: { createdAt: 'desc' },
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
      projects: { select: { id: true, name: true, slug: true, description: true } },
      _count: { select: { projects: true } },
    },
  });

  await logActivity({
    teamId: team.id,
    userId: req.user!.id,
    action: 'team_created',
    targetType: 'team',
    targetId: team.id,
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

  await logActivity({
    teamId: req.params.id,
    userId: req.user!.id,
    action: 'team_renamed',
    targetType: 'team',
    targetId: req.params.id,
    metadata: { oldName: team.name, newName: result.data.name },
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

// --- Workspace data ---
router.get('/:id/workspace', async (req: AuthRequest, res) => {
  const team = await prisma.team.findFirst({
    where: {
      id: req.params.id,
      members: { some: { userId: req.user!.id } },
    },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      projects: {
        select: { id: true, name: true, slug: true, description: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!team) {
    return res.status(404).json({ error: 'Team not found' });
  }

  const projectIds = team.projects.map((p) => p.id);
  const totalWebhooks = await prisma.webhook.count({
    where: { projectId: { in: projectIds } },
  });
  const recentWebhooks = await prisma.webhook.findMany({
    where: { projectId: { in: projectIds } },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { project: { select: { id: true, name: true } } },
  });

  res.json({
    team: {
      id: team.id,
      name: team.name,
      ownerId: team.ownerId,
      members: team.members,
      projects: team.projects,
    },
    aggregate: {
      totalProjects: team.projects.length,
      totalWebhooks,
      recentWebhooks: decryptWebhooks(recentWebhooks),
    },
  });
});

// --- Activity log ---
router.get('/:id/activity', async (req: AuthRequest, res) => {
  const team = await prisma.team.findFirst({
    where: {
      id: req.params.id,
      members: { some: { userId: req.user!.id } },
    },
  });

  if (!team) {
    return res.status(404).json({ error: 'Team not found' });
  }

  const logs = await prisma.activityLog.findMany({
    where: { teamId: req.params.id },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  res.json(logs);
});

// --- Discussion feed: all comments across team webhooks ---
router.get('/:id/discussion', async (req: AuthRequest, res) => {
  const team = await prisma.team.findFirst({
    where: {
      id: req.params.id,
      members: { some: { userId: req.user!.id } },
    },
    include: {
      projects: { select: { id: true, name: true } },
    },
  });

  if (!team) {
    return res.status(404).json({ error: 'Team not found' });
  }

  const projectIds = team.projects.map((p) => p.id);

  if (projectIds.length === 0) {
    return res.json({ comments: [] });
  }

  const comments = await prisma.webhookComment.findMany({
    where: {
      webhook: { projectId: { in: projectIds } },
      parentId: null,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      reactions: true,
      webhook: {
        select: { id: true, method: true, source: true, projectId: true },
      },
      replies: {
        orderBy: { createdAt: 'asc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          reactions: true,
          webhook: {
            select: { id: true, method: true, source: true, projectId: true },
          },
          _count: { select: { replies: true } },
        },
      },
      _count: { select: { replies: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  const projectMap = new Map<string, string>();
  for (const p of team.projects) {
    projectMap.set(p.id, p.name);
  }

  const userId = req.user!.id;
  const enrich = (c: any): any => {
    const likes = c.reactions?.filter((r: any) => r.type === 'like').length ?? 0;
    const dislikes = c.reactions?.filter((r: any) => r.type === 'dislike').length ?? 0;
    const userReaction = c.reactions?.find((r: any) => r.userId === userId)?.type || null;
    const projectName = c.webhook?.projectId ? (projectMap.get(c.webhook.projectId) || 'Unknown') : 'Unknown';
    const { reactions, ...rest } = c;
    return {
      ...rest,
      likes,
      dislikes,
      userReaction,
      projectName,
      replies: c.replies?.map(enrich) ?? [],
    };
  };

  res.json({ comments: comments.map(enrich) });
});

// --- Clear activity log (owner only) ---
router.delete('/:id/activity', async (req: AuthRequest, res) => {
  const team = await prisma.team.findFirst({
    where: {
      id: req.params.id,
      ownerId: req.user!.id,
    },
  });

  if (!team) {
    return res.status(403).json({ error: 'Only team owner can clear activity log' });
  }

  await prisma.activityLog.deleteMany({
    where: { teamId: req.params.id },
  });

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

  const teamBeforeLeave = await prisma.team.findUnique({
    where: { id: req.params.id },
    select: { name: true },
  });

  await prisma.teamMember.deleteMany({
    where: { teamId: req.params.id, userId: req.user!.id },
  });

  if (teamBeforeLeave) {
    const leaver = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { name: true, email: true } });
    await notifyTeamAdmins({
      teamId: req.params.id,
      excludeUserId: req.user!.id,
      type: 'member_left',
      title: 'Member Left',
      message: `${leaver?.name || leaver?.email || 'A member'} left ${teamBeforeLeave.name}.`,
      data: { teamId: req.params.id, userId: req.user!.id },
    });
    await logActivity({
      teamId: req.params.id,
      userId: req.user!.id,
      action: 'member_left',
      targetType: 'member',
      targetId: req.user!.id,
      metadata: { name: leaver?.name, email: leaver?.email },
    });
  }

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

  // Verify new owner has Team plan
  const newOwner = await prisma.user.findUnique({
    where: { id: result.data.newOwnerId },
    select: { plan: true },
  });
  if (newOwner?.plan !== 'TEAM') {
    return res.status(403).json({ error: 'New owner must have Team plan' });
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

  await logActivity({
    teamId: req.params.id,
    userId: req.user!.id,
    action: 'team_transferred',
    targetType: 'member',
    targetId: result.data.newOwnerId,
  });

  // Notify new owner
  const transferTeam = await prisma.team.findUnique({ where: { id: req.params.id }, select: { name: true } });
  const oldOwner = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { name: true, email: true } });
  await createNotification({
    userId: result.data.newOwnerId,
    type: 'ownership_transferred',
    title: 'You are now the team owner',
    message: `${oldOwner?.name || oldOwner?.email || 'The previous owner'} transferred ownership of ${transferTeam?.name || 'the team'} to you.`,
    data: { teamId: req.params.id },
  });

  res.json({ success: true });
});

// --- Invite member (creates pending invite) ---
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

  const email = result.data.email.toLowerCase().trim();

  // Check if already a member
  const invitedUser = await prisma.user.findUnique({ where: { email } });
  if (invitedUser) {
    const existing = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: req.params.id, userId: invitedUser.id } },
    });
    if (existing) {
      return res.status(409).json({ error: 'User is already a team member' });
    }
  }

  // Check for existing pending invite to same email
  const existingInvite = await prisma.teamInvite.findFirst({
    where: {
      teamId: req.params.id,
      email,
      status: 'PENDING',
      expiresAt: { gt: new Date() },
    },
  });
  if (existingInvite) {
    return res.status(409).json({ error: 'An invite is already pending for this email' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invite = await prisma.teamInvite.create({
    data: {
      teamId: req.params.id,
      email,
      role: result.data.role || 'MEMBER',
      token,
      invitedById: req.user!.id,
      expiresAt,
    },
    include: {
      team: { select: { id: true, name: true } },
      invitedBy: { select: { id: true, name: true, email: true } },
    },
  });

  // Send in-app notification to invited user
  if (invitedUser) {
    await createNotification({
      userId: invitedUser.id,
      type: 'team_invite',
      title: `Invited to ${team.name}`,
      message: `${invite.invitedBy.name || invite.invitedBy.email} invited you to join ${team.name} as ${result.data.role || 'MEMBER'}.`,
      data: { teamId: team.id, inviteToken: token, role: result.data.role || 'MEMBER' },
    });
  }

  await logActivity({
    teamId: req.params.id,
    userId: req.user!.id,
    action: 'member_invited',
    targetType: 'member',
    targetId: invitedUser?.id || email,
    metadata: { email, role: result.data.role || 'MEMBER' },
  });

  res.status(201).json(invite);
});

// --- List pending invites for a team ---
router.get('/:id/invites', async (req: AuthRequest, res) => {
  const team = await prisma.team.findFirst({
    where: {
      id: req.params.id,
      members: { some: { userId: req.user!.id, role: 'ADMIN' } },
    },
  });

  if (!team) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  const invites = await prisma.teamInvite.findMany({
    where: {
      teamId: req.params.id,
      status: 'PENDING',
      expiresAt: { gt: new Date() },
    },
    include: {
      invitedBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(invites);
});

// --- Cancel an invite ---
router.delete('/:id/invites/:inviteId', async (req: AuthRequest, res) => {
  const team = await prisma.team.findFirst({
    where: {
      id: req.params.id,
      members: { some: { userId: req.user!.id, role: 'ADMIN' } },
    },
  });

  if (!team) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  await prisma.teamInvite.updateMany({
    where: {
      id: req.params.inviteId,
      teamId: req.params.id,
      status: 'PENDING',
    },
    data: { status: 'CANCELLED' },
  });

  res.json({ success: true });
});

// --- Get my pending invites ---
router.get('/invites/me', async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { email: true },
  });

  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  const invites = await prisma.teamInvite.findMany({
    where: {
      email: user.email.toLowerCase().trim(),
      status: 'PENDING',
      expiresAt: { gt: new Date() },
    },
    include: {
      team: { select: { id: true, name: true } },
      invitedBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(invites);
});

// --- Accept invite ---
router.post('/invites/:token/accept', async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { email: true },
  });

  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  const invite = await prisma.teamInvite.findFirst({
    where: {
      token: req.params.token,
      email: user.email.toLowerCase().trim(),
      status: 'PENDING',
      expiresAt: { gt: new Date() },
    },
    include: { team: true },
  });

  if (!invite) {
    return res.status(404).json({ error: 'Invite not found or expired' });
  }

  // Check not already a member
  const existing = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId: invite.teamId, userId: req.user!.id } },
  });

  if (!existing) {
    await prisma.teamMember.create({
      data: {
        teamId: invite.teamId,
        userId: req.user!.id,
        role: invite.role,
      },
    });
  }

  await prisma.teamInvite.update({
    where: { id: invite.id },
    data: { status: 'ACCEPTED', acceptedAt: new Date() },
  });

  await logActivity({
    teamId: invite.teamId,
    userId: req.user!.id,
    action: 'member_joined',
    targetType: 'member',
    targetId: req.user!.id,
    metadata: { email: user.email, role: invite.role },
  });

  // Notify team admins
  const accepter = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { name: true, email: true } });
  await notifyTeamAdmins({
    teamId: invite.teamId,
    type: 'team_invite_accepted',
    title: 'Invite Accepted',
    message: `${accepter?.name || accepter?.email || 'A user'} accepted the invite to join ${invite.team.name}.`,
    data: { teamId: invite.teamId, userId: req.user!.id },
  });

  res.json({ success: true, teamId: invite.teamId });
});

// --- Decline invite ---
router.post('/invites/:token/decline', async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { email: true },
  });

  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  const declinedInvite = await prisma.teamInvite.findFirst({
    where: { token: req.params.token, email: user.email.toLowerCase().trim(), status: 'PENDING' },
    include: { team: true },
  });

  await prisma.teamInvite.updateMany({
    where: {
      token: req.params.token,
      email: user.email,
      status: 'PENDING',
    },
    data: { status: 'DECLINED', declinedAt: new Date() },
  });

  if (declinedInvite) {
    const decliner = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { name: true, email: true } });
    await notifyTeamAdmins({
      teamId: declinedInvite.teamId,
      type: 'team_invite_declined',
      title: 'Invite Declined',
      message: `${decliner?.name || decliner?.email || 'A user'} declined the invite to join ${declinedInvite.team.name}.`,
      data: { teamId: declinedInvite.teamId },
    });
  }

  res.json({ success: true });
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

  await logActivity({
    teamId: req.params.id,
    userId: req.user!.id,
    action: 'member_role_changed',
    targetType: 'member',
    targetId: req.params.userId,
    metadata: { newRole: result.data.role },
  });

  // Notify affected user
  const changer = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { name: true, email: true } });
  await createNotification({
    userId: req.params.userId,
    type: 'role_changed',
    title: 'Your role has changed',
    message: `${changer?.name || changer?.email || 'An admin'} changed your role to ${result.data.role} in ${team.name}.`,
    data: { teamId: req.params.id, newRole: result.data.role },
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

  const removedTeam = await prisma.team.findUnique({ where: { id: req.params.id }, select: { name: true } });

  await prisma.teamMember.deleteMany({
    where: {
      teamId: req.params.id,
      userId: req.params.userId,
    },
  });

  await logActivity({
    teamId: req.params.id,
    userId: req.user!.id,
    action: 'member_removed',
    targetType: 'member',
    targetId: req.params.userId,
  });

  // Notify removed user
  const remover = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { name: true, email: true } });
  await createNotification({
    userId: req.params.userId,
    type: 'member_removed',
    title: 'Removed from team',
    message: `${remover?.name || remover?.email || 'An admin'} removed you from ${removedTeam?.name || 'the team'}.`,
    data: { teamId: req.params.id },
  });

  res.json({ success: true });
});

export default router;
