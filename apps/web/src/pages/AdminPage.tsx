import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import {
  LayoutDashboard, Users, CreditCard, FolderGit2, Radio, Users2,
  Search, Loader2, Crown, ChevronLeft, ChevronRight,
  Shield, TrendingUp, Activity, DollarSign, BarChart3, Globe,
} from 'lucide-react';
import { methodColor } from '../lib/utils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';

const PLAN_COLORS: Record<string, string> = {
  FREE: '#64748b',
  PRO: '#10b981',
  TEAM: '#f59e0b',
};

const STATUS_BADGES: Record<string, string> = {
  FREE: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  PRO: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  TEAM: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'subscriptions' | 'projects' | 'webhooks' | 'teams'>('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data);
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'overview') fetchStats();
  }, [activeTab, fetchStats]);

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500">
        <Shield className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-lg font-bold text-white mb-1">Access Denied</h2>
        <p className="text-sm">This area is restricted to administrators.</p>
      </div>
    );
  }

  const tabs = [
    { key: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
    { key: 'users' as const, label: 'Users', icon: Users },
    { key: 'subscriptions' as const, label: 'Subscriptions', icon: CreditCard },
    { key: 'projects' as const, label: 'Projects', icon: FolderGit2 },
    { key: 'webhooks' as const, label: 'Webhooks', icon: Radio },
    { key: 'teams' as const, label: 'Teams', icon: Users2 },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-amber-500/10 rounded-lg">
          <Shield className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-xs text-slate-500">Platform management & analytics</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 mb-5 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'text-emerald-400 border-emerald-500'
                : 'text-slate-500 border-transparent hover:text-slate-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'overview' && (
          <OverviewTab stats={stats} loading={loading} refresh={fetchStats} />
        )}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'subscriptions' && <SubscriptionsTab />}
        {activeTab === 'projects' && <ProjectsTab />}
        {activeTab === 'webhooks' && <WebhooksTab />}
        {activeTab === 'teams' && <TeamsTab />}
      </div>
    </div>
  );
}

// ── Overview Tab ──
function OverviewTab({ stats, loading, refresh }: { stats: any; loading: boolean; refresh: () => void }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <p>Failed to load stats</p>
        <button onClick={refresh} className="mt-2 text-emerald-400 hover:underline text-sm">Retry</button>
      </div>
    );
  }

  const planData = Object.entries(stats.users.byPlan).map(([plan, count]) => ({
    name: plan,
    value: count as number,
    color: PLAN_COLORS[plan] || '#64748b',
  }));

  const hourlyData = stats.hourlyVolume.map((d: any) => ({
    time: new Date(d.hour).toLocaleTimeString([], { hour: '2-digit' }),
    count: d.count,
  }));

  return (
    <div className="space-y-5">
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Users} label="Total Users" value={stats.users.total} sub={
          `${stats.users.byPlan.PRO || 0} Pro · ${stats.users.byPlan.TEAM || 0} Team`
        } />
        <StatCard icon={FolderGit2} label="Projects" value={stats.projects} />
        <StatCard icon={Radio} label="Webhooks Today" value={stats.webhooks.today} sub={`${stats.webhooks.thisWeek} this week`} />
        <StatCard icon={Users2} label="Teams" value={stats.teams} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Hourly volume */}
        <div className="lg:col-span-2 bg-slate-900 rounded-xl border border-slate-800 p-4">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-500" />
            Webhook Volume (24h)
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData}>
                <defs>
                  <linearGradient id="adminVol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#475569" fontSize={11} tickLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Area type="monotone" dataKey="count" stroke="#10b981" fillOpacity={1} fill="url(#adminVol)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Plan distribution */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-slate-500" />
            Plan Distribution
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={planData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" stroke="none">
                  {planData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-3 mt-2">
            {planData.map((p) => (
              <div key={p.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="text-xs text-slate-400">{p.name} ({p.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* More stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard icon={Globe} label="Active Projects Today" value={stats.activeProjectsToday} />
        <StatCard icon={TrendingUp} label="Webhooks This Month" value={stats.webhooks.thisMonth} />
        <StatCard icon={DollarSign} label="Total Webhooks" value={stats.webhooks.total} />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: number; sub?: string }) {
  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-slate-500" />
        <span className="text-xs text-slate-500 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value.toLocaleString()}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Users Tab ──
function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [changingPlan, setChangingPlan] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (search) params.set('search', search);
      if (planFilter) params.set('plan', planFilter);
      const res = await api.get(`/admin/users?${params}`);
      setUsers(res.data.users);
      setPagination(res.data.pagination);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, planFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const changePlan = async (userId: string, plan: string) => {
    setChangingPlan(userId);
    try {
      await api.patch(`/admin/users/${userId}/plan`, { plan });
      fetchUsers();
    } catch {
      alert('Failed to update plan');
    } finally {
      setChangingPlan(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <select
          value={planFilter}
          onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
        >
          <option value="">All plans</option>
          <option value="FREE">Free</option>
          <option value="PRO">Pro</option>
          <option value="TEAM">Team</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-800/50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Plan</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Projects</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Teams</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="py-12 text-center"><Loader2 className="w-5 h-5 text-emerald-400 animate-spin mx-auto" /></td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-slate-500 text-sm">No users found</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-white font-medium">{u.name || '—'}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_BADGES[u.plan] || STATUS_BADGES.FREE}`}>
                      {u.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{u._count.projects}</td>
                  <td className="px-4 py-3 text-slate-300">{u._count.teams}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.plan}
                      onChange={(e) => changePlan(u.id, e.target.value)}
                      disabled={changingPlan === u.id}
                      className="bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                    >
                      <option value="FREE">Set Free</option>
                      <option value="PRO">Set Pro</option>
                      <option value="TEAM">Set Team</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">{pagination.total} users</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-slate-400">{page} / {pagination.totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Subscriptions Tab ──
function SubscriptionsTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/revenue')
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div>;
  if (!data) return <div className="text-center text-slate-500 py-12">Failed to load</div>;

  const monthlyChart = data.monthlySignups.reduce((acc: any[], curr: any) => {
    const monthLabel = new Date(curr.month).toLocaleDateString([], { month: 'short', year: '2-digit' });
    const existing = acc.find((a: any) => a.month === monthLabel);
    if (existing) {
      existing[curr.plan] = curr.count;
    } else {
      acc.push({ month: monthLabel, [curr.plan]: curr.count });
    }
    return acc;
  }, []);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-slate-500" />
            <span className="text-xs text-slate-500 uppercase tracking-wider">Estimated MRR</span>
          </div>
          <p className="text-2xl font-bold text-white">${data.estimatedMrr.toLocaleString()}</p>
        </div>
        <StatCard icon={Crown} label="Pro Subscribers" value={data.subscriptions.pro.total} sub={`+${data.subscriptions.pro.newThisMonth} this month`} />
        <StatCard icon={Users2} label="Team Subscribers" value={data.subscriptions.team.total} sub={`+${data.subscriptions.team.newThisMonth} this month`} />
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Signups by Plan (Monthly)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" stroke="#475569" fontSize={11} tickLine={false} />
              <YAxis stroke="#475569" fontSize={11} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }} />
              <Bar dataKey="FREE" fill="#64748b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="PRO" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="TEAM" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ── Projects Tab ──
function ProjectsTab() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/projects?page=${page}&limit=20`);
      setProjects(res.data.projects);
      setPagination(res.data.pagination);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-800/50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Project</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Owner</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Webhooks</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Created</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="py-12 text-center"><Loader2 className="w-5 h-5 text-emerald-400 animate-spin mx-auto" /></td></tr>
            ) : projects.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-500 text-sm">No projects</td></tr>
            ) : (
              projects.map((p) => (
                <tr key={p.id} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30">
                  <td className="px-4 py-3">
                    <p className="text-white font-medium">{p.name}</p>
                    <p className="text-xs text-slate-500 font-mono">{p.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-xs">{p.user?.email || p.team?.name || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${p.team ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400 bg-slate-700/30'}`}>
                      {p.team ? 'Team' : 'Personal'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{p._count.webhooks}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{new Date(p.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-sm text-slate-400">{page} / {pagination.totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  );
}

// ── Webhooks Tab ──
function WebhooksTab() {
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const fetchWebhooks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/webhooks?page=${page}&limit=30`);
      setWebhooks(res.data.webhooks);
      setPagination(res.data.pagination);
    } catch {
      setWebhooks([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchWebhooks(); }, [fetchWebhooks]);

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-800/50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Method</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Source</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Project</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Time</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="py-12 text-center"><Loader2 className="w-5 h-5 text-emerald-400 animate-spin mx-auto" /></td></tr>
            ) : webhooks.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-500 text-sm">No webhooks</td></tr>
            ) : (
              webhooks.map((w) => (
                <tr key={w.id} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30">
                  <td className="px-4 py-3">
                    <span className={`text-xs font-mono font-semibold px-1.5 py-0.5 rounded border ${methodColor(w.method)}`}>
                      {w.method}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-xs">{w.source || w.ip}</td>
                  <td className="px-4 py-3 text-slate-300 text-xs">{w.project?.name || '—'}</td>
                  <td className="px-4 py-3">
                    {w.statusCode ? (
                      <span className={`text-xs font-mono ${w.statusCode >= 200 && w.statusCode < 300 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {w.statusCode}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{new Date(w.createdAt).toLocaleTimeString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-sm text-slate-400">{page} / {pagination.totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  );
}

// ── Teams Tab ──
function TeamsTab() {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/teams?page=${page}&limit=20`);
      setTeams(res.data.teams);
      setPagination(res.data.pagination);
    } catch {
      setTeams([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchTeams(); }, [fetchTeams]);

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-800/50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Team</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Owner</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Members</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Projects</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Created</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="py-12 text-center"><Loader2 className="w-5 h-5 text-emerald-400 animate-spin mx-auto" /></td></tr>
            ) : teams.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-500 text-sm">No teams</td></tr>
            ) : (
              teams.map((t) => (
                <tr key={t.id} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30">
                  <td className="px-4 py-3 text-white font-medium">{t.name}</td>
                  <td className="px-4 py-3 text-slate-300 text-xs">{t.owner?.email || '—'}</td>
                  <td className="px-4 py-3 text-slate-300">{t.members?.length || 0}</td>
                  <td className="px-4 py-3 text-slate-300">{t._count?.projects || 0}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{new Date(t.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-sm text-slate-400">{page} / {pagination.totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  );
}
