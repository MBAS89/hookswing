import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import { useTranslation } from '../i18n';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area,
} from 'recharts';
import {
  Activity, Webhook, FolderGit2, TrendingUp, TrendingDown,
  Zap, Clock, Globe, ArrowRight, Loader2, Crown,
} from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface DashboardStats {
  totalWebhooksToday: number;
  totalWebhooksWeek: number;
  totalWebhooksMonth: number;
  activeProjects: number;
  methodBreakdown: Record<string, number>;
  sourceBreakdown: Record<string, number>;
  hourlyVolume: Array<{ hour: string; count: number }>;
  dailyVolume: Array<{ day: string; count: number }>;
  recentWebhooks: Array<{
    id: string; method: string; source: string | null; ip: string; createdAt: string;
    project: { name: string };
  }>;
  planLimit: { used: number; limit: number };
  topProjects: Array<{ id: string; name: string; count: number; teamName?: string }>;
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/dashboard/stats')
      .then((res) => setStats(res.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500">
        <Activity className="w-12 h-12 mb-4 opacity-30" />
        <p>{t('common.error')}</p>
      </div>
    );
  }

  const planPercent = Math.min(100, Math.round((stats.planLimit.used / stats.planLimit.limit) * 100));
  const planColor = planPercent > 90 ? 'text-red-400' : planPercent > 70 ? 'text-amber-400' : 'text-emerald-400';
  const planBarColor = planPercent > 90 ? 'bg-red-500' : planPercent > 70 ? 'bg-amber-500' : 'bg-emerald-500';

  const methodData = Object.entries(stats.methodBreakdown).map(([name, value]) => ({ name, value }));
  const sourceData = Object.entries(stats.sourceBreakdown).map(([name, value]) => ({ name, value }));

  const weekChange = stats.totalWebhooksWeek > 0
    ? Math.round(((stats.totalWebhooksToday / (stats.totalWebhooksWeek / 7)) - 1) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('layout.dashboard')}</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Welcome back{user?.name ? `, ${user.name}` : ''} — here's what's happening
          </p>
        </div>
        {user?.plan !== 'FREE' && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-xs font-medium">
            <Crown className="w-3.5 h-3.5" />
            {user?.plan}
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t('dashboard.recentWebhooks')}
          value={stats.totalWebhooksToday}
          icon={<Webhook className="w-5 h-5" />}
          trend={weekChange}
        />
        <StatCard
          label="This Week"
          value={stats.totalWebhooksWeek}
          icon={<Activity className="w-5 h-5" />}
        />
        <StatCard
          label={t('dashboard.thisMonth')}
          value={stats.totalWebhooksMonth}
          icon={<Zap className="w-5 h-5" />}
        />
        <StatCard
          label={t('dashboard.projects')}
          value={stats.activeProjects}
          icon={<FolderGit2 className="w-5 h-5" />}
        />
      </div>

      {/* Plan Usage */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">{t('account.plan')}</h3>
            <span className="text-xs text-slate-500">{user?.plan || 'FREE'}</span>
          </div>
          <span className={`text-sm font-bold ${planColor}`}>
            {stats.planLimit.used.toLocaleString()} / {stats.planLimit.limit.toLocaleString()}
          </span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2.5">
          <div className={`${planBarColor} h-2.5 rounded-full transition-all`} style={{ width: `${planPercent}%` }} />
        </div>
        <p className="text-xs text-slate-500 mt-2">
          {planPercent}% used this month • {stats.planLimit.limit - stats.planLimit.used} remaining
        </p>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Hourly Volume */}
        <div className="lg:col-span-2 bg-slate-900 rounded-xl border border-slate-800 p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Webhook Volume — Last 24 Hours
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={stats.hourlyVolume}>
              <defs>
                <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="hour" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff' }}
                itemStyle={{ color: '#10b981' }}
              />
              <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorVolume)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Volume */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            Last 7 Days
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.dailyVolume}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="day" stroke="#64748b" fontSize={10} tickLine={false} angle={-20} textAnchor="end" height={50} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff' }}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Method Breakdown */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-purple-400" />
            Methods
          </h3>
          {methodData.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">{t('common.loading')}</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={methodData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">
                    {methodData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {methodData.map((entry, i) => (
                  <div key={entry.name} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-xs text-slate-400">{entry.name}</span>
                    <span className="text-xs text-slate-500">({entry.value})</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Source Breakdown */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-amber-400" />
            Sources
          </h3>
          {sourceData.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">{t('common.loading')}</p>
          ) : (
            <div className="space-y-3">
              {sourceData.map((entry, i) => {
                const total = sourceData.reduce((a, b) => a + b.value, 0);
                const pct = Math.round((entry.value / total) * 100);
                return (
                  <div key={entry.name}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-white capitalize">{entry.name.toLowerCase()}</span>
                      <span className="text-slate-400">{entry.value} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Projects */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <FolderGit2 className="w-4 h-4 text-emerald-400" />
            {t('layout.projects')}
          </h3>
          {stats.topProjects.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">{t('layout.noProjects')}</p>
          ) : (
            <div className="space-y-2.5">
              {stats.topProjects.map((proj, i) => (
                <button
                  key={proj.id}
                  onClick={() => navigate(`/dashboard/projects/${proj.id}`)}
                  className="w-full flex items-center gap-3 p-2.5 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors text-left group"
                >
                  <div className="w-7 h-7 bg-slate-800 rounded-lg flex items-center justify-center text-xs font-bold text-slate-400">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate group-hover:text-emerald-300 transition-colors">{proj.name}</p>
                    {proj.teamName && (
                      <p className="text-xs text-amber-400">{proj.teamName}</p>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-white">{proj.count}</span>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Webhooks */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-sky-400" />
          {t('dashboard.recentWebhooks')}
        </h3>
        {stats.recentWebhooks.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-8">{t('dashboard.noWebhooks')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-800">
                  <th className="pb-3 font-medium">{t('layout.projects')}</th>
                  <th className="pb-3 font-medium">{t('common.method')}</th>
                  <th className="pb-3 font-medium">{t('common.source')}</th>
                  <th className="pb-3 font-medium">IP</th>
                  <th className="pb-3 font-medium text-right">{t('common.time')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {stats.recentWebhooks.map((wh) => (
                  <tr key={wh.id} className="group hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 text-sm text-white">{wh.project.name}</td>
                    <td className="py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        wh.method === 'POST' ? 'bg-emerald-500/10 text-emerald-400' :
                        wh.method === 'GET' ? 'bg-blue-500/10 text-blue-400' :
                        wh.method === 'DELETE' ? 'bg-red-500/10 text-red-400' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>
                        {wh.method}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-slate-400 capitalize">{wh.source || 'Unknown'}</td>
                    <td className="py-3 text-sm text-slate-500 font-mono">{wh.ip}</td>
                    <td className="py-3 text-sm text-slate-500 text-right">
                      {new Date(wh.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
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

function StatCard({ label, value, icon, trend }: { label: string; value: number; icon: React.ReactNode; trend?: number }) {
  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 hover:border-slate-700 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-slate-500 uppercase tracking-wider">{label}</span>
        <div className="text-slate-400">{icon}</div>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold text-white">{value.toLocaleString()}</span>
        {trend !== undefined && trend !== 0 && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
}
