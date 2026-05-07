import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { stripe } from '../lib/stripe';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import { adminMiddleware } from '../middleware/admin';
import { apiRateLimit } from '../middleware/rateLimit';

const router = Router();

router.use(authMiddleware);
router.use(adminMiddleware);
router.use(apiRateLimit);

// ── Platform Overview Stats ──
router.get('/stats', async (req: AuthRequest, res) => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsers,
    usersByPlan,
    totalProjects,
    totalTeams,
    totalWebhooks,
    webhooksToday,
    webhooksWeek,
    webhooksMonth,
    activeToday,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.groupBy({ by: ['plan'], _count: { plan: true } }),
    prisma.project.count(),
    prisma.team.count(),
    prisma.webhook.count(),
    prisma.webhook.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.webhook.count({ where: { createdAt: { gte: weekStart } } }),
    prisma.webhook.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.webhook.groupBy({ by: ['projectId'], where: { createdAt: { gte: todayStart } }, _count: { projectId: true } }).then((r) => r.length),
  ]);

  const planBreakdown: Record<string, number> = {};
  for (const u of usersByPlan) {
    planBreakdown[u.plan] = u._count.plan;
  }

  // Hourly webhook volume for the last 24h
  const hourlyData = await prisma.$queryRaw<
    Array<{ hour: string; count: bigint }>
  >`
    SELECT DATE_TRUNC('hour', created_at) as hour, COUNT(*) as count
    FROM webhooks
    WHERE created_at >= ${new Date(now.getTime() - 24 * 60 * 60 * 1000)}
    GROUP BY hour
    ORDER BY hour ASC
  `;

  res.json({
    users: { total: totalUsers, byPlan: planBreakdown },
    projects: totalProjects,
    teams: totalTeams,
    webhooks: {
      total: totalWebhooks,
      today: webhooksToday,
      thisWeek: webhooksWeek,
      thisMonth: webhooksMonth,
    },
    activeProjectsToday: activeToday,
    hourlyVolume: hourlyData.map((d) => ({
      hour: new Date(d.hour).toISOString(),
      count: Number(d.count),
    })),
  });
});

// ── List All Users ──
router.get('/users', async (req: AuthRequest, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const search = (req.query.search as string) || '';
  const plan = (req.query.plan as string) || '';

  const where: any = {};
  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { name: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (plan) {
    where.plan = plan;
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        role: true,
        createdAt: true,
        twoFactorEnabled: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        _count: {
          select: { projects: true, teams: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  res.json({
    users,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

// ── Get Single User Details ──
router.get('/users/:id', async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      email: true,
      name: true,
      plan: true,
      role: true,
      createdAt: true,
      twoFactorEnabled: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      projects: {
        select: { id: true, name: true, slug: true, createdAt: true, _count: { select: { webhooks: true } } },
      },
      teams: {
        include: {
          team: { select: { id: true, name: true } },
        },
      },
      sessions: { select: { id: true, createdAt: true, expiresAt: true } },
    },
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(user);
});

// ── Update User Plan ──
router.patch('/users/:id/plan', async (req: AuthRequest, res) => {
  const schema = z.object({
    plan: z.enum(['FREE', 'PRO', 'TEAM']),
  });

  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid plan' });
  }

  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: { plan: result.data.plan },
    select: { id: true, email: true, name: true, plan: true },
  });

  res.json(updated);
});

// ── List All Projects ──
router.get('/projects', async (req: AuthRequest, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      include: {
        user: { select: { id: true, email: true, name: true } },
        team: { select: { id: true, name: true } },
        _count: { select: { webhooks: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.project.count(),
  ]);

  res.json({
    projects,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

// ── List All Webhooks ──
router.get('/webhooks', async (req: AuthRequest, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

  const [webhooks, total] = await Promise.all([
    prisma.webhook.findMany({
      include: {
        project: { select: { id: true, name: true, slug: true, userId: true, teamId: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.webhook.count(),
  ]);

  res.json({
    webhooks,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

// ── List All Teams ──
router.get('/teams', async (req: AuthRequest, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

  const [teams, total] = await Promise.all([
    prisma.team.findMany({
      include: {
        owner: { select: { id: true, email: true, name: true } },
        members: {
          include: { user: { select: { id: true, email: true, name: true } } },
        },
        _count: { select: { projects: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.team.count(),
  ]);

  res.json({
    teams,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

// ── Revenue / Subscription Data ──
router.get('/revenue', async (req: AuthRequest, res) => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    proUsers,
    teamUsers,
    proUsersThisMonth,
    teamUsersThisMonth,
  ] = await Promise.all([
    prisma.user.count({ where: { plan: 'PRO' } }),
    prisma.user.count({ where: { plan: 'TEAM' } }),
    prisma.user.count({ where: { plan: 'PRO', createdAt: { gte: monthStart } } }),
    prisma.user.count({ where: { plan: 'TEAM', createdAt: { gte: monthStart } } }),
  ]);

  const proPrice = 19;
  const teamPrice = 49;
  const estimatedMrr = proUsers * proPrice + teamUsers * teamPrice;

  // Plan changes over last 6 months
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
  const monthlySignups = await prisma.$queryRaw<
    Array<{ month: string; plan: string; count: bigint }>
  >`
    SELECT DATE_TRUNC('month', created_at) as month, plan, COUNT(*) as count
    FROM users
    WHERE created_at >= ${sixMonthsAgo}
    GROUP BY month, plan
    ORDER BY month ASC
  `;

  // Fetch real Stripe subscriptions with user details
  let stripeSubscriptions: any[] = [];
  try {
    const subs = await stripe.subscriptions.list({
      status: 'all',
      limit: 100,
      expand: ['data.customer'],
    });

    const customerIds = subs.data.map((s) =>
      typeof s.customer === 'string' ? s.customer : s.customer.id
    );

    const users = await prisma.user.findMany({
      where: { stripeCustomerId: { in: customerIds } },
      select: { id: true, name: true, email: true, stripeCustomerId: true },
    });

    const userByCustomer = new Map(users.map((u) => [u.stripeCustomerId, u]));

    stripeSubscriptions = subs.data.map((sub) => {
      const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
      const user = userByCustomer.get(customerId);
      return {
        id: sub.id,
        userId: user?.id,
        userName: user?.name || user?.email || 'Unknown',
        userEmail: user?.email,
        status: sub.status,
        plan: (sub.items.data[0]?.price?.id === process.env.STRIPE_PRICE_TEAM || sub.items.data[0]?.price?.id === process.env.STRIPE_PRICE_TEAM_YEARLY) ? 'TEAM' : 'PRO',
        startDate: new Date(sub.start_date * 1000).toISOString(),
        currentPeriodStart: new Date(sub.current_period_start * 1000).toISOString(),
        currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        amount: sub.items.data[0]?.price?.unit_amount,
        currency: sub.items.data[0]?.price?.currency,
      };
    });
  } catch {
    // Stripe may not be configured; ignore
  }

  res.json({
    subscriptions: {
      pro: { total: proUsers, newThisMonth: proUsersThisMonth, price: proPrice },
      team: { total: teamUsers, newThisMonth: teamUsersThisMonth, price: teamPrice },
    },
    estimatedMrr,
    monthlySignups: monthlySignups.map((m) => ({
      month: new Date(m.month).toISOString(),
      plan: m.plan,
      count: Number(m.count),
    })),
    stripeSubscriptions,
  });
});

export default router;
