import { createSafeRouter } from '../middleware/safeRouter';
import { z } from 'zod';
import axios from 'axios';
import { prisma } from '../lib/prisma';
import { stripe } from '../lib/stripe';
import { getIO } from '../lib/socketio';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import { adminMiddleware } from '../middleware/admin';
import { apiRateLimit } from '../middleware/rateLimit';

const router = createSafeRouter();

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

  const previous = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: { plan: true, email: true },
  });

  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: { plan: result.data.plan },
    select: { id: true, email: true, name: true, plan: true },
  });

  if (previous && previous.plan !== result.data.plan) {
    const { fireAdminAlert } = await import('../lib/adminAlerts');
    fireAdminAlert('plan_changed_by_admin', {
      email: updated.email,
      name: updated.name,
      plan: updated.plan,
      previousPlan: previous.plan,
      adminEmail: req.user!.email,
    }).catch(() => {});

    const { createNotification } = await import('../lib/notification');
    createNotification({
      userId: updated.id,
      type: 'plan_changed',
      title: 'Plan Changed',
      message: `Your plan has been changed from ${previous.plan} to ${updated.plan} by an admin`,
      data: { previousPlan: previous.plan, newPlan: updated.plan, source: 'admin', adminEmail: req.user!.email },
    }).catch(() => {});
  }

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
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

  const [
    proUsers,
    teamUsers,
    proUsersThisMonth,
    teamUsersThisMonth,
    totalFreeUsers,
  ] = await Promise.all([
    prisma.user.count({ where: { plan: 'PRO' } }),
    prisma.user.count({ where: { plan: 'TEAM' } }),
    prisma.user.count({ where: { plan: 'PRO', createdAt: { gte: monthStart } } }),
    prisma.user.count({ where: { plan: 'TEAM', createdAt: { gte: monthStart } } }),
    prisma.user.count({ where: { plan: 'FREE' } }),
  ]);

  const proPrice = 19;
  const teamPrice = 49;
  const estimatedMrr = proUsers * proPrice + teamUsers * teamPrice;
  const estimatedArr = estimatedMrr * 12;

  // Plan changes over last 6 months
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
  let totalRevenue = 0;
  let activeCount = 0;
  let canceledCount = 0;
  let pastDueCount = 0;
  let revenueByMonth: Array<{ month: string; revenue: number }> = [];

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

    // Calculate total revenue from all invoices
    const invoices = await stripe.invoices.list({ limit: 100 });
    totalRevenue = invoices.data.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0);

    // Revenue by month from invoices
    const monthlyRevenueMap = new Map<string, number>();
    for (const inv of invoices.data) {
      if (inv.status === 'paid') {
        const month = new Date(inv.created * 1000).toISOString().slice(0, 7);
        monthlyRevenueMap.set(month, (monthlyRevenueMap.get(month) || 0) + inv.amount_paid);
      }
    }
    revenueByMonth = Array.from(monthlyRevenueMap.entries())
      .map(([month, revenue]) => ({ month, revenue: revenue / 100 }))
      .sort((a, b) => a.month.localeCompare(b.month));

    stripeSubscriptions = subs.data.map((sub) => {
      const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
      const user = userByCustomer.get(customerId);
      const plan = (sub.items.data[0]?.price?.id === process.env.STRIPE_PRICE_TEAM || sub.items.data[0]?.price?.id === process.env.STRIPE_PRICE_TEAM_YEARLY) ? 'TEAM' : 'PRO';
      if (sub.status === 'active') activeCount++;
      else if (sub.status === 'canceled') canceledCount++;
      else if (sub.status === 'past_due') pastDueCount++;
      return {
        id: sub.id,
        userId: user?.id,
        userName: user?.name || user?.email || 'Unknown',
        userEmail: user?.email,
        status: sub.status,
        plan,
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

  const paidUsers = proUsers + teamUsers;
  const arpu = paidUsers > 0 ? estimatedMrr / paidUsers : 0;
  const churnRate = activeCount + canceledCount > 0 ? (canceledCount / (activeCount + canceledCount)) * 100 : 0;

  res.json({
    subscriptions: {
      pro: { total: proUsers, newThisMonth: proUsersThisMonth, price: proPrice },
      team: { total: teamUsers, newThisMonth: teamUsersThisMonth, price: teamPrice },
      free: { total: totalFreeUsers },
    },
    estimatedMrr,
    estimatedArr,
    totalRevenue,
    arpu: Math.round(arpu * 100) / 100,
    churnRate: Math.round(churnRate * 100) / 100,
    activeSubscriptions: activeCount,
    canceledSubscriptions: canceledCount,
    pastDueSubscriptions: pastDueCount,
    monthlySignups: monthlySignups.map((m) => ({
      month: new Date(m.month).toISOString(),
      plan: m.plan,
      count: Number(m.count),
    })),
    revenueByMonth,
    stripeSubscriptions,
  });
});

// ── Admin Alert Configs ──
router.get('/alerts', async (_req: AuthRequest, res) => {
  const alerts = await prisma.adminAlertConfig.findMany({
    orderBy: { createdAt: 'desc' },
  });
  res.json({ alerts });
});

router.post('/alerts', async (req: AuthRequest, res) => {
  const schema = z.object({
    type: z.literal('telegram'),
    botToken: z.string().min(1),
    chatId: z.string().min(1),
    events: z.array(z.string()).min(1),
  });

  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const { botToken, chatId, events } = result.data;
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  const alert = await prisma.adminAlertConfig.create({
    data: {
      type: 'telegram',
      url,
      config: { botToken, chatId },
      events,
    },
  });

  res.json({ alert });
});

router.patch('/alerts/:id', async (req: AuthRequest, res) => {
  const schema = z.object({
    enabled: z.boolean().optional(),
    events: z.array(z.string()).optional(),
    botToken: z.string().min(1).optional(),
    chatId: z.string().min(1).optional(),
  });

  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const existing = await prisma.adminAlertConfig.findUnique({
    where: { id: req.params.id },
  });
  if (!existing) {
    return res.status(404).json({ error: 'Alert not found' });
  }

  const update: any = {};
  if (result.data.enabled !== undefined) update.enabled = result.data.enabled;
  if (result.data.events !== undefined) update.events = result.data.events;

  if (result.data.botToken || result.data.chatId) {
    const cfg = (existing.config || {}) as any;
    const botToken = result.data.botToken || cfg.botToken;
    const chatId = result.data.chatId || cfg.chatId;
    if (botToken) {
      update.url = `https://api.telegram.org/bot${botToken}/sendMessage`;
      update.config = { ...cfg, botToken, chatId };
    }
  }

  const alert = await prisma.adminAlertConfig.update({
    where: { id: req.params.id },
    data: update,
  });

  res.json({ alert });
});

router.delete('/alerts/:id', async (req: AuthRequest, res) => {
  await prisma.adminAlertConfig.delete({
    where: { id: req.params.id },
  });
  res.json({ success: true });
});

// ── Test Admin Alert ──
router.post('/alerts/:id/test', async (req: AuthRequest, res) => {
  const { id } = req.params;
  const config = await prisma.adminAlertConfig.findUnique({ where: { id } });
  if (!config) {
    return res.status(404).json({ error: 'Alert not found' });
  }

  try {
    const cfg = (config.config || {}) as { chatId?: string; botToken?: string };
    if (!cfg.chatId || !config.url) {
      return res.status(400).json({ error: 'Missing chat ID or bot token' });
    }

    await axios.post(
      config.url,
      {
        chat_id: cfg.chatId,
        text: '<b>🧪 HookSwing Admin Alert Test</b>\n\nThis is a test message from your admin dashboard. If you see this, your alert is configured correctly!',
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      },
      { timeout: 5000 }
    );

    res.json({ success: true });
  } catch (err: any) {
    const telegramError = err.response?.data?.description || err.message;
    console.error('[AdminAlert] Test failed:', telegramError);
    res.status(500).json({ error: `Telegram: ${telegramError}` });
  }
});

// ── Feedback Management ──
router.get('/feedback', async (_req: AuthRequest, res) => {
  const feedback = await prisma.feedback.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, email: true, plan: true } },
    },
  });
  res.json({ feedback });
});

router.patch('/feedback/:id/status', async (req: AuthRequest, res) => {
  const schema = z.object({
    status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
  });
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const feedback = await prisma.feedback.update({
    where: { id: req.params.id },
    data: { status: result.data.status },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  res.json({ feedback });
});

router.delete('/feedback/:id', async (req: AuthRequest, res) => {
  await prisma.feedback.delete({
    where: { id: req.params.id },
  });
  res.json({ success: true });
});

// ── Support Chat Management ──
router.get('/support', async (_req: AuthRequest, res) => {
  const messages = await prisma.supportChat.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, email: true, plan: true } },
    },
  });

  // Group by user and get unread count per user
  const userMap = new Map<string, any>();
  for (const msg of messages) {
    const uid = msg.userId;
    if (!userMap.has(uid)) {
      userMap.set(uid, {
        user: msg.user,
        messages: [],
        unreadCount: 0,
        lastMessageAt: msg.createdAt,
      });
    }
    const entry = userMap.get(uid);
    entry.messages.push(msg);
    if (!msg.isAdmin && !msg.read) {
      entry.unreadCount++;
    }
  }

  const conversations = Array.from(userMap.values()).map((e) => ({
    user: e.user,
    unreadCount: e.unreadCount,
    lastMessageAt: e.lastMessageAt,
    messageCount: e.messages.length,
  }));

  res.json({ conversations });
});

router.get('/support/:userId', async (req: AuthRequest, res) => {
  const messages = await prisma.supportChat.findMany({
    where: { userId: req.params.userId },
    orderBy: { createdAt: 'asc' },
    include: {
      user: { select: { id: true, name: true, email: true, plan: true } },
    },
  });
  res.json({ messages });
});

router.post('/support/:userId/reply', async (req: AuthRequest, res) => {
  const schema = z.object({
    message: z.string().min(1).max(2000),
  });

  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const chat = await prisma.supportChat.create({
    data: {
      userId: req.params.userId,
      message: result.data.message,
      isAdmin: true,
      read: false,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  const io = getIO();
  if (io) {
    io.to(`support:${req.params.userId}`).emit('support:message', chat);
    io.to('support:admin').emit('support:message', chat);
  }

  res.status(201).json({ chat });
});

router.post('/support/:userId/mark-read', async (req: AuthRequest, res) => {
  await prisma.supportChat.updateMany({
    where: { userId: req.params.userId, isAdmin: false, read: false },
    data: { read: true },
  });
  res.json({ success: true });
});

router.delete('/support/:userId', async (req: AuthRequest, res) => {
  await prisma.supportChat.deleteMany({
    where: { userId: req.params.userId },
  });
  res.json({ success: true });
});

export default router;
