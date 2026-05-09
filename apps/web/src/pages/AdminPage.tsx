import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { api } from '../lib/api';
import { useSupportAdmin } from '../hooks/useSupport';
import {
  LayoutDashboard, Users, CreditCard, FolderGit2, Radio, Users2,
  Search, Loader2, Crown, ChevronLeft, ChevronRight,
  Shield, TrendingUp, Activity, DollarSign, BarChart3, Globe,
  XCircle, AlertTriangle, Bell, Send, Trash2, ToggleLeft, ToggleRight,
  Check, Loader2 as LoaderIcon, MessageSquare, MessageCircle, Headphones,
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
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'subscriptions' | 'projects' | 'webhooks' | 'teams' | 'alerts' | 'feedback' | 'support'>('overview');
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
    { key: 'alerts' as const, label: 'Alerts', icon: Bell },
    { key: 'feedback' as const, label: 'Feedback', icon: MessageSquare },
    { key: 'support' as const, label: 'Support', icon: Headphones },
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
        {activeTab === 'alerts' && <AlertsTab />}
        {activeTab === 'feedback' && <FeedbackTab />}
        {activeTab === 'support' && <SupportTab />}
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
  const toast = useToast();
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
      toast.error('Failed to update plan');
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

  const revenueChart = (data.revenueByMonth || []).map((r: any) => ({
    month: r.month,
    revenue: r.revenue,
  }));

  const subs = data.stripeSubscriptions || [];
  const planBreakdown = [
    { name: 'Free', value: data.subscriptions.free?.total || 0, color: '#64748b' },
    { name: 'Pro', value: data.subscriptions.pro.total, color: '#10b981' },
    { name: 'Team', value: data.subscriptions.team.total, color: '#f59e0b' },
  ];

  return (
    <div className="space-y-5">
      {/* Revenue KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-slate-500" />
            <span className="text-xs text-slate-500 uppercase tracking-wider">Total Revenue</span>
          </div>
          <p className="text-2xl font-bold text-white">${(data.totalRevenue / 100).toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-0.5">Lifetime</p>
        </div>
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-slate-500" />
            <span className="text-xs text-slate-500 uppercase tracking-wider">MRR</span>
          </div>
          <p className="text-2xl font-bold text-white">${data.estimatedMrr.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-0.5">ARR ~${data.estimatedArr?.toLocaleString() || 0}</p>
        </div>
        <StatCard icon={Crown} label="Pro Subscribers" value={data.subscriptions.pro.total} sub={`+${data.subscriptions.pro.newThisMonth} this month`} />
        <StatCard icon={Users2} label="Team Subscribers" value={data.subscriptions.team.total} sub={`+${data.subscriptions.team.newThisMonth} this month`} />
      </div>

      {/* Subscription Health */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-slate-500 uppercase tracking-wider">Active</span>
          </div>
          <p className="text-xl font-bold text-white">{data.activeSubscriptions}</p>
        </div>
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-red-400" />
            <span className="text-xs text-slate-500 uppercase tracking-wider">Canceled</span>
          </div>
          <p className="text-xl font-bold text-white">{data.canceledSubscriptions}</p>
        </div>
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-slate-500 uppercase tracking-wider">Past Due</span>
          </div>
          <p className="text-xl font-bold text-white">{data.pastDueSubscriptions}</p>
        </div>
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-slate-500 uppercase tracking-wider">Churn Rate</span>
          </div>
          <p className="text-xl font-bold text-white">{data.churnRate}%</p>
          <p className="text-xs text-slate-500 mt-0.5">ARPU ${data.arpu}</p>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Signups */}
        <div className="lg:col-span-2 bg-slate-900 rounded-xl border border-slate-800 p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Signups by Plan (Monthly)</h3>
          <div className="h-56">
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

        {/* Plan Distribution */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Plan Distribution</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={planBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" stroke="none">
                  {planBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-3 mt-2">
            {planBreakdown.map((p) => (
              <div key={p.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="text-xs text-slate-400">{p.name} ({p.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue trend */}
      {revenueChart.length > 0 && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Revenue Trend (Monthly)</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChart}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#475569" fontSize={11} tickLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }} formatter={(v: any) => [`$${Number(v).toLocaleString()}`, 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#revGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Stripe Subscriptions Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Stripe Subscriptions ({subs.length})</h3>
        {subs.length === 0 ? (
          <p className="text-sm text-slate-500">No Stripe subscriptions found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500">
                  <th className="py-2 pr-4 font-medium">User</th>
                  <th className="py-2 pr-4 font-medium">Plan</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Started</th>
                  <th className="py-2 pr-4 font-medium">Renews</th>
                  <th className="py-2 pr-4 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {subs.map((sub: any) => (
                  <tr key={sub.id}>
                    <td className="py-2 pr-4 text-white">
                      <p className="font-medium">{sub.userName}</p>
                      <p className="text-xs text-slate-500">{sub.userEmail}</p>
                    </td>
                    <td className="py-2 pr-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        sub.plan === 'TEAM' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {sub.plan}
                      </span>
                    </td>
                    <td className="py-2 pr-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        sub.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
                        sub.status === 'canceled' ? 'bg-red-500/10 text-red-400' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>
                        {sub.status}
                      </span>
                      {sub.cancelAtPeriodEnd && <span className="text-xs text-amber-400 ml-1">(ends)</span>}
                    </td>
                    <td className="py-2 pr-4 text-slate-400">{new Date(sub.startDate).toLocaleDateString()}</td>
                    <td className="py-2 pr-4 text-slate-400">{new Date(sub.currentPeriodEnd).toLocaleDateString()}</td>
                    <td className="py-2 pr-4 text-white">
                      {sub.amount ? `$${(sub.amount / 100).toFixed(2)}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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


// ── Alerts Tab ──
const ADMIN_ALERT_EVENT_OPTIONS = [
  { value: 'user_registered', label: '👤 New User Registered' },
  { value: 'subscription_created', label: '💳 New Subscription' },
  { value: 'subscription_updated', label: '🔄 Subscription Updated' },
  { value: 'subscription_cancelled', label: '❌ Subscription Cancelled' },
  { value: 'payment_failed', label: '⚠️ Payment Failed' },
  { value: 'payment_succeeded', label: '✅ Payment Succeeded' },
  { value: 'plan_changed_by_admin', label: '🔧 Plan Changed by Admin' },
  { value: 'support_message', label: '💬 Support Message' },
];

function AlertsTab() {
  const toast = useToast();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/alerts');
      setAlerts(res.data.alerts || []);
    } catch {
      toast.error('Failed to load admin alerts');
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  };

  const addAlert = async () => {
    if (!botToken.trim() || !chatId.trim() || selectedEvents.length === 0) {
      toast.error('Bot token, chat ID, and at least one event are required');
      return;
    }
    setSaving(true);
    try {
      await api.post('/admin/alerts', {
        type: 'telegram',
        botToken: botToken.trim(),
        chatId: chatId.trim(),
        events: selectedEvents,
      });
      toast.success('Admin alert created');
      setBotToken('');
      setChatId('');
      setSelectedEvents([]);
      setShowForm(false);
      fetchAlerts();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create alert');
    } finally {
      setSaving(false);
    }
  };

  const toggleAlert = async (id: string, enabled: boolean) => {
    try {
      await api.patch(`/admin/alerts/${id}`, { enabled: !enabled });
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, enabled: !enabled } : a))
      );
      toast.success(enabled ? 'Alert disabled' : 'Alert enabled');
    } catch {
      toast.error('Failed to toggle alert');
    }
  };

  const deleteAlert = async (id: string) => {
    try {
      await api.delete(`/admin/alerts/${id}`);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
      toast.success('Alert deleted');
    } catch {
      toast.error('Failed to delete alert');
    }
  };

  const testAlert = async (id: string) => {
    setTesting(id);
    try {
      await api.post(`/admin/alerts/${id}/test`);
      toast.success('Test message sent!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Test failed');
    } finally {
      setTesting(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Admin Alerts</h3>
          <p className="text-xs text-slate-500">Get notified on Telegram when platform events occur</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {showForm ? <XCircle className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Add Alert'}
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 space-y-4">
          <h4 className="text-sm font-semibold text-white">New Telegram Alert</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Bot Token</label>
              <input
                type="text"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                placeholder="123456:ABC-DEF..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Chat ID</label>
              <input
                type="text"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                placeholder="-1001234567890"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-2">Events to notify</label>
            <div className="flex flex-wrap gap-2">
              {ADMIN_ALERT_EVENT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => toggleEvent(opt.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    selectedEvents.includes(opt.value)
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-300'
                  }`}
                >
                  {selectedEvents.includes(opt.value) && <Check className="w-3 h-3" />}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={addAlert}
              disabled={saving}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {saving ? <LoaderIcon className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Create Alert
            </button>
          </div>
        </div>
      )}

      {/* Alert List */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No admin alerts configured</p>
          <p className="text-xs mt-1">Add one to get notified on platform events</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const cfg = (alert.config || {}) as { chatId?: string; botToken?: string };
            return (
              <div key={alert.id} className="bg-slate-900 rounded-xl border border-slate-800 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
                        Telegram
                      </span>
                      <span className="text-xs text-slate-500">Chat: <code className="text-slate-400">{cfg.chatId}</code></span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {alert.events.map((e: string) => {
                        const opt = ADMIN_ALERT_EVENT_OPTIONS.find((o) => o.value === e);
                        return (
                          <span key={e} className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                            {opt?.label || e}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => testAlert(alert.id)}
                      disabled={testing === alert.id}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {testing === alert.id ? <LoaderIcon className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                      Test
                    </button>
                    <button
                      onClick={() => toggleAlert(alert.id, alert.enabled)}
                      className="text-slate-400 hover:text-white transition-colors"
                      title={alert.enabled ? 'Disable' : 'Enable'}
                    >
                      {alert.enabled ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => deleteAlert(alert.id)}
                      className="text-slate-500 hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


// ── Feedback Tab ──
const FEEDBACK_STATUS_BADGES: Record<string, string> = {
  open: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  in_progress: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  closed: 'bg-slate-700 text-slate-400 border-slate-600',
};

const FEEDBACK_STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

const FEEDBACK_SUBJECT_LABELS: Record<string, string> = {
  improvement: 'Improvement',
  bug: 'Bug',
  suggestion: 'Suggestion',
  feature_request: 'Feature Request',
  other: 'Other',
};

function FeedbackTab() {
  const toast = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/feedback');
      setItems(res.data.feedback || []);
    } catch {
      toast.error('Failed to load feedback');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchFeedback(); }, [fetchFeedback]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/admin/feedback/${id}/status`, { status });
      setItems((prev) => prev.map((f) => (f.id === id ? { ...f, status } : f)));
      toast.success('Status updated');
    } catch {
      toast.error('Failed to update status');
    }
  };

  const deleteFeedback = async (id: string) => {
    try {
      await api.delete(`/admin/feedback/${id}`);
      setItems((prev) => prev.filter((f) => f.id !== id));
      toast.success('Feedback deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const filtered = statusFilter === 'all' ? items : items.filter((f) => f.status === statusFilter);

  const counts = {
    all: items.length,
    open: items.filter((f) => f.status === 'open').length,
    in_progress: items.filter((f) => f.status === 'in_progress').length,
    resolved: items.filter((f) => f.status === 'resolved').length,
    closed: items.filter((f) => f.status === 'closed').length,
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {(['all', 'open', 'in_progress', 'resolved', 'closed'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              statusFilter === s
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            {s === 'all' ? 'All' : FEEDBACK_STATUS_LABELS[s]} ({counts[s]})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No feedback yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((f) => (
            <div key={f.id} className="bg-slate-900 rounded-xl border border-slate-800 p-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${FEEDBACK_STATUS_BADGES[f.status] || 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                      {FEEDBACK_STATUS_LABELS[f.status] || f.status}
                    </span>
                    <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                      {FEEDBACK_SUBJECT_LABELS[f.subject] || f.subject}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(f.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-white whitespace-pre-wrap">{f.message}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-[10px] font-bold">
                      {(f.user?.name || f.user?.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs text-slate-400">{f.user?.name || f.user?.email}</span>
                    {f.user?.plan && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${STATUS_BADGES[f.user.plan] || ''}`}>
                        {f.user.plan}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={f.status}
                    onChange={(e) => updateStatus(f.id, e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                  <button
                    onClick={() => deleteFeedback(f.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


// ── Support Tab ──
function SupportTab() {
  const toast = useToast();
  const {
    conversations,
    activeUserId,
    messages,
    loading,
    typingUsers,
    setActiveUserId,
    fetchConversations,
    fetchMessages,
    sendReply,
    markRead,
    clearChat,
    emitTyping,
  } = useSupportAdmin();
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  useEffect(() => {
    if (activeUserId) {
      fetchMessages(activeUserId);
      markRead(activeUserId);
    }
  }, [activeUserId, fetchMessages, markRead]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!replyText.trim() || !activeUserId) return;
    setSending(true);
    try {
      await sendReply(activeUserId, replyText.trim());
      setReplyText('');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const activeConversation = conversations.find((c) => c.user.id === activeUserId);

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-220px)] min-h-[400px]">
      {/* Conversations List */}
      <div className="lg:w-72 shrink-0 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-white">Conversations</h3>
          <p className="text-xs text-slate-500">{conversations.length} total</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Headphones className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No support chats yet</p>
            </div>
          ) : (
            conversations.map((c) => (
              <button
                key={c.user.id}
                onClick={() => setActiveUserId(c.user.id)}
                className={`w-full text-left px-4 py-3 border-b border-slate-800/50 transition-colors ${
                  activeUserId === c.user.id ? 'bg-emerald-500/10' : 'hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-[10px] font-bold shrink-0">
                    {(c.user.name || c.user.email).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{c.user.name || c.user.email}</p>
                    <p className="text-[10px] text-slate-500 truncate">{c.user.plan} • {c.messageCount} messages</p>
                  </div>
                  {c.unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shrink-0">
                      {c.unreadCount}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  {new Date(c.lastMessageAt).toLocaleString()}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden flex flex-col min-h-0">
        {!activeUserId ? (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            <div className="text-center">
              <Headphones className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Select a conversation to start chatting</p>
            </div>
          </div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-[10px] font-bold">
                  {(activeConversation?.user.name || activeConversation?.user.email || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{activeConversation?.user.name || activeConversation?.user.email}</p>
                  <p className="text-[10px] text-slate-500">{activeConversation?.user.plan} • {activeConversation?.user.email}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (window.confirm('Clear this entire conversation?')) {
                    clearChat(activeUserId);
                  }
                }}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Clear
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? (
                <div className="flex items-center justify-center h-20">
                  <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No messages yet</p>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.isAdmin ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${
                      msg.isAdmin
                        ? 'bg-emerald-500/20 text-emerald-300 rounded-br-sm'
                        : 'bg-slate-800 text-slate-200 rounded-bl-sm'
                    }`}>
                      <p className="break-words">{msg.message}</p>
                      <p className="text-[10px] text-slate-500 mt-1 text-right">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="px-4 py-3 border-t border-slate-800 flex flex-col gap-2">
              {activeUserId && typingUsers.has(activeUserId) && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 px-1">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  User is typing…
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => { setReplyText(e.target.value); if (activeUserId) emitTyping(activeUserId); }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && replyText.trim() && !sending) {
                      handleSend();
                    }
                  }}
                  placeholder="Type your reply..."
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !replyText.trim()}
                  className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
