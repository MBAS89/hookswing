import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ActivityLog from '../components/team/ActivityLog';
import { api } from '../lib/api';
import {
  Loader2, Users2, FolderGit2, Radio, ArrowRight, Activity,
  Crown, Globe, MessageSquare
} from 'lucide-react';
import { methodColor, formatDate } from '../lib/utils';

interface WorkspaceData {
  team: {
    id: string;
    name: string;
    ownerId: string;
    members: Array<{ id: string; role: string; user: { id: string; name: string | null; email: string } }>;
    projects: Array<{ id: string; name: string; slug: string; description: string | null; createdAt: string }>;
  };
  aggregate: {
    totalProjects: number;
    totalWebhooks: number;
    recentWebhooks: Array<{
      id: string; method: string; source: string | null; ip: string;
      createdAt: string; project: { id: string; name: string };
    }>;
  };
}

export default function WorkspacePage() {
  const { teamId } = useParams<{ teamId: string }>();
  const { user } = useAuth();
  const [data, setData] = useState<WorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'activity'>('overview');

  const isTeamMember = user?.teams?.some((t) => t.team.id === teamId) || false;

  useEffect(() => {
    if (!teamId || !isTeamMember) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api.get(`/teams/${teamId}/workspace`)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load workspace'))
      .finally(() => setLoading(false));
  }, [teamId, isTeamMember]);

  if (!isTeamMember) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500">
        <Crown className="w-12 h-12 text-amber-400 mb-4" />
        <h2 className="text-lg font-bold text-white mb-1">Team Workspaces</h2>
        <p className="text-sm">You do not have access to this workspace.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500">
        <p>{error || 'Workspace not found'}</p>
      </div>
    );
  }

  const { team, aggregate } = data;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-amber-500/10 rounded-lg">
            <Users2 className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">{team.name}</h1>
            <p className="text-xs text-slate-500">Shared Workspace</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <FolderGit2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-slate-500 uppercase tracking-wider">Projects</span>
            </div>
            <p className="text-xl font-bold text-white">{aggregate.totalProjects}</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Radio className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-slate-500 uppercase tracking-wider">Webhooks</span>
            </div>
            <p className="text-xl font-bold text-white">{aggregate.totalWebhooks}</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Users2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-slate-500 uppercase tracking-wider">Members</span>
            </div>
            <p className="text-xl font-bold text-white">{team.members.length}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 mb-4">
        {([
          { key: 'overview', label: 'Overview', icon: Globe },
          { key: 'activity', label: 'Activity Log', icon: Activity },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
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

      {activeTab === 'overview' && (
        <div className="flex-1 overflow-auto space-y-4">
          {/* Projects */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-slate-500" />
              Projects
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {team.projects.map((project) => (
                <Link
                  key={project.id}
                  to={`/dashboard/projects/${project.id}`}
                  className="bg-slate-800/50 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg p-4 transition-colors group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white group-hover:text-emerald-400 transition-colors">
                      {project.name}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
                  </div>
                  {project.description && (
                    <p className="text-xs text-slate-500 line-clamp-2">{project.description}</p>
                  )}
                </Link>
              ))}
            </div>
          </div>

          {/* Members */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <Users2 className="w-4 h-4 text-slate-500" />
              Members
            </h3>
            <div className="flex flex-wrap gap-2">
              {team.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-800"
                >
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold">
                    {(member.user.name || member.user.email).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm text-white">{member.user.name || member.user.email}</p>
                    <p className="text-xs text-slate-500 capitalize">{member.role.toLowerCase()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Webhooks */}
          {aggregate.recentWebhooks.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <Radio className="w-4 h-4 text-slate-500" />
                Recent Webhooks
              </h3>
              <div className="space-y-1.5">
                {aggregate.recentWebhooks.map((wh) => (
                  <Link
                    key={wh.id}
                    to={`/dashboard/projects/${wh.project.id}`}
                    className="flex items-center gap-3 bg-slate-800/30 hover:bg-slate-800/60 rounded-lg px-3 py-2 transition-colors"
                  >
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border ${methodColor(wh.method)}`}>
                      {wh.method}
                    </span>
                    <span className="text-xs text-slate-400 truncate flex-1">{wh.source || wh.ip}</span>
                    <span className="text-xs text-slate-500">{wh.project.name}</span>
                    <span className="text-xs text-slate-600">{formatDate(wh.createdAt)}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="flex-1 overflow-auto">
          <ActivityLog teamId={team.id} />
        </div>
      )}
    </div>
  );
}
