import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import { apiRateLimit } from '../middleware/rateLimit';

const router = Router();

router.use(authMiddleware);
router.use(apiRateLimit);

router.get('/stats', async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const now = new Date();

  // Get all projects the user has access to
  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { userId },
        { team: { members: { some: { userId } } } },
      ],
    },
    select: { id: true, name: true, slug: true, team: { select: { name: true } } },
  });

  const projectIds = projects.map((p) => p.id);

  if (projectIds.length === 0) {
    return res.json({
      totalWebhooksToday: 0,
      totalWebhooksWeek: 0,
      totalWebhooksMonth: 0,
      activeProjects: 0,
      methodBreakdown: {},
      sourceBreakdown: {},
      hourlyVolume: [],
      dailyVolume: [],
      recentWebhooks: [],
      planLimit: { used: 0, limit: req.user!.plan === 'FREE' ? 500 : 10000 },
      topProjects: [],
    });
  }

  // Time ranges
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Counts
  const [totalToday, totalWeek, totalMonth] = await Promise.all([
    prisma.webhook.count({ where: { projectId: { in: projectIds }, createdAt: { gte: todayStart } } }),
    prisma.webhook.count({ where: { projectId: { in: projectIds }, createdAt: { gte: weekStart } } }),
    prisma.webhook.count({ where: { projectId: { in: projectIds }, createdAt: { gte: monthStart } } }),
  ]);

  // Method breakdown
  const methodRows = await prisma.webhook.groupBy({
    by: ['method'],
    where: { projectId: { in: projectIds }, createdAt: { gte: weekStart } },
    _count: { method: true },
  });
  const methodBreakdown: Record<string, number> = {};
  methodRows.forEach((r) => { methodBreakdown[r.method] = r._count.method; });

  // Source breakdown
  const sourceRows = await prisma.webhook.groupBy({
    by: ['source'],
    where: { projectId: { in: projectIds }, createdAt: { gte: weekStart } },
    _count: { source: true },
  });
  const sourceBreakdown: Record<string, number> = {};
  sourceRows.forEach((r) => { sourceBreakdown[r.source || 'Unknown'] = r._count.source; });

  // Hourly volume (last 24 hours)
  const hourlyVolume: Array<{ hour: string; count: number }> = [];
  for (let i = 23; i >= 0; i--) {
    const hourStart = new Date(now.getTime() - i * 60 * 60 * 1000);
    const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
    const count = await prisma.webhook.count({
      where: { projectId: { in: projectIds }, createdAt: { gte: hourStart, lt: hourEnd } },
    });
    hourlyVolume.push({
      hour: hourStart.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
      count,
    });
  }

  // Daily volume (last 7 days)
  const dailyVolume: Array<{ day: string; count: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    const count = await prisma.webhook.count({
      where: { projectId: { in: projectIds }, createdAt: { gte: dayStart, lt: dayEnd } },
    });
    dailyVolume.push({
      day: dayStart.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      count,
    });
  }

  // Recent webhooks
  const recentWebhooks = await prisma.webhook.findMany({
    where: { projectId: { in: projectIds } },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true, method: true, source: true, ip: true, createdAt: true,
      project: { select: { name: true } },
    },
  });

  // Top projects by webhook count (this month)
  const projectCounts = await Promise.all(
    projectIds.map(async (pid) => {
      const count = await prisma.webhook.count({
        where: { projectId: pid, createdAt: { gte: monthStart } },
      });
      const proj = projects.find((p) => p.id === pid);
      return { id: pid, name: proj?.name || 'Unknown', count, teamName: proj?.team?.name };
    })
  );
  const topProjects = projectCounts.sort((a, b) => b.count - a.count).slice(0, 5);

  // Plan limit
  const limit = req.user!.plan === 'FREE' ? 500 : 10000;

  res.json({
    totalWebhooksToday: totalToday,
    totalWebhooksWeek: totalWeek,
    totalWebhooksMonth: totalMonth,
    activeProjects: projects.length,
    methodBreakdown,
    sourceBreakdown,
    hourlyVolume,
    dailyVolume,
    recentWebhooks,
    planLimit: { used: totalMonth, limit },
    topProjects,
  });
});

export default router;
