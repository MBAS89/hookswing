import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FolderGit2, Users, Settings, X, Plus, Users2, Globe, Terminal, Shield, Trash2, Zap, MessageSquare, Send, ChevronUp, ChevronDown, Loader2,
} from 'lucide-react';
import Logo from '../Logo';
import { useProjects } from '../../hooks/useProjects';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { api } from '../../lib/api';
import CreateProjectModal from '../project/CreateProjectModal';
import ConfirmModal from '../ui/ConfirmModal';

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { projects, createProject, deleteProject } = useProjects();
  const { user, pendingInvites, logout } = useAuth();
  const toast = useToast();

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: Zap, label: 'Tester', href: '/dashboard/tester' },
    { icon: Users, label: 'Team', href: '/dashboard/team', badge: pendingInvites > 0 ? pendingInvites : undefined },
    { icon: Terminal, label: 'CLI', href: '/dashboard/cli' },
    ...(user?.role === 'ADMIN' ? [{ icon: Shield, label: 'Admin', href: '/dashboard/admin' }] : []),
  ];

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackSubject, setFeedbackSubject] = useState('improvement');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const handleCreate = async (name: string, description?: string, teamId?: string) => {
    const project = await createProject(name, description, teamId);
    navigate(`/dashboard/projects/${project.id}`);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteProject(deleteConfirm.id);
      if (location.pathname === `/dashboard/projects/${deleteConfirm.id}`) {
        navigate('/dashboard');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete project');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const canDeleteProject = (project: typeof projects[0]) => {
    if (!project.team) {
      return user?.plan === 'PRO' || user?.plan === 'TEAM';
    }
    const membership = user?.teams?.find((t) => t.team.id === project.team?.id);
    return membership?.role === 'ADMIN';
  };

  const personalProjects = projects.filter((p) => !p.team);
  const teamProjects = projects.filter((p) => p.team);

  const teamOptions = user?.teams
    ?.filter((t) => t.role === 'ADMIN')
    ?.map((t) => ({ id: t.team.id, name: t.team.name })) || [];
  const isTeamPlan = user?.plan === 'TEAM';
  const hasAnyTeams = (user?.teams && user.teams.length > 0) || false;

  return (
    <>
      <ConfirmModal
        open={!!deleteConfirm}
        title="Delete Project"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside className={`fixed lg:relative inset-y-0 left-0 z-50 w-64 h-screen lg:h-full bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-out lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
          <Link to="/" className="flex items-center gap-2">
            <Logo className="w-8 h-8" />
            <span className="text-lg font-bold text-white">HookSwing</span>
          </Link>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto py-4 px-3 space-y-6">
          {/* Menu */}
          <div>
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Menu</span>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === item.href
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge ? (
                    <span className="bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              ))}
            </nav>
          </div>

          {/* Personal Projects */}
          <div>
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Projects</span>
              <button onClick={() => setModalOpen(true)} className="text-slate-500 hover:text-emerald-400 transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <nav className="space-y-1">
              {personalProjects.map((project) => (
                <div key={project.id} className="group relative">
                  <Link
                    to={`/dashboard/projects/${project.id}`}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors pr-8 ${
                      location.pathname === `/dashboard/projects/${project.id}`
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <FolderGit2 className="w-4 h-4 shrink-0" />
                    <span className="truncate">{project.name}</span>
                  </Link>
                  {canDeleteProject(project) && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ id: project.id, name: project.name }); }}
                      className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                      title="Delete project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
              {personalProjects.length === 0 && teamProjects.length === 0 && (
                <p className="px-3 text-xs text-slate-600">No projects yet</p>
              )}
            </nav>
          </div>

          {/* Workspaces */}
          {hasAnyTeams && (
            <div>
              <div className="flex items-center justify-between px-3 mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Workspaces</span>
              </div>
              <nav className="space-y-1">
                {user?.teams?.map((membership) => (
                  <Link
                    key={membership.team.id}
                    to={`/dashboard/workspace/${membership.team.id}`}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      location.pathname === `/dashboard/workspace/${membership.team.id}`
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Globe className="w-4 h-4 shrink-0 text-amber-400" />
                    <span className="truncate">{membership.team.name}</span>
                  </Link>
                ))}
              </nav>
            </div>
          )}

          {/* Team Projects */}
          {teamProjects.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-3 mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Team Projects</span>
              </div>
              <nav className="space-y-1">
                {teamProjects.map((project) => (
                  <div key={project.id} className="group relative">
                    <Link
                      to={`/dashboard/projects/${project.id}`}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors pr-8 ${
                        location.pathname === `/dashboard/projects/${project.id}`
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <Users2 className="w-4 h-4 shrink-0 text-amber-400" />
                      <span className="truncate">{project.name}</span>
                    </Link>
                    {canDeleteProject(project) && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ id: project.id, name: project.name }); }}
                        className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                        title="Delete project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </nav>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-slate-800 space-y-2">
          {/* Feedback */}
          <div>
            <button
              onClick={() => setFeedbackOpen(!feedbackOpen)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="flex-1 text-left">Send Feedback</span>
              {feedbackOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {feedbackOpen && (
              <div className="mt-2 px-3 space-y-2">
                <select
                  value={feedbackSubject}
                  onChange={(e) => setFeedbackSubject(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="improvement">Improvement</option>
                  <option value="bug">Found a Bug</option>
                  <option value="suggestion">Suggestion</option>
                  <option value="feature_request">Feature Request</option>
                  <option value="other">Other</option>
                </select>
                <textarea
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  placeholder="Tell us more..."
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 resize-none"
                />
                <button
                  onClick={async () => {
                    if (!feedbackMessage.trim()) return;
                    setFeedbackLoading(true);
                    try {
                      await api.post('/feedback', { subject: feedbackSubject, message: feedbackMessage.trim() });
                      toast.success('Feedback sent! Thank you.');
                      setFeedbackMessage('');
                      setFeedbackOpen(false);
                    } catch (err: any) {
                      toast.error(err.response?.data?.error || 'Failed to send feedback');
                    } finally {
                      setFeedbackLoading(false);
                    }
                  }}
                  disabled={feedbackLoading || !feedbackMessage.trim()}
                  className="w-full flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                >
                  {feedbackLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  Send
                </button>
              </div>
            )}
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Log Out
          </button>
        </div>
      </aside>

      <CreateProjectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreate}
        teams={teamOptions}
      />
    </>
  );
}
