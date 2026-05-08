import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FolderGit2, Users, Settings, X, Plus, Users2, Globe, Terminal, Shield, Trash2,
} from 'lucide-react';
import Logo from '../Logo';
import { useProjects } from '../../hooks/useProjects';
import { useAuth } from '../../hooks/useAuth';
import CreateProjectModal from '../project/CreateProjectModal';

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { projects, createProject, deleteProject } = useProjects();
  const { user, logout } = useAuth();

  useEffect(() => {
    onClose();
  }, [location.pathname, onClose]);

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: Users, label: 'Team', href: '/dashboard/team' },
    { icon: Terminal, label: 'CLI', href: '/dashboard/cli' },
    ...(user?.role === 'ADMIN' ? [{ icon: Shield, label: 'Admin', href: '/dashboard/admin' }] : []),
  ];

  const [modalOpen, setModalOpen] = useState(false);

  const handleCreate = async (name: string, description?: string, teamId?: string) => {
    const project = await createProject(name, description, teamId);
    navigate(`/dashboard/projects/${project.id}`);
  };

  const handleDelete = async (projectId: string, projectName: string) => {
    if (!confirm(`Delete project "${projectName}"? This cannot be undone.`)) return;
    try {
      await deleteProject(projectId);
      if (location.pathname === `/dashboard/projects/${projectId}`) {
        navigate('/dashboard');
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete project');
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
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside className={`fixed lg:relative inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform lg:translate-x-0 lg:h-full ${open ? 'translate-x-0' : '-translate-x-full'}`}>
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
                  {item.label}
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
                      onClick={(e) => { e.stopPropagation(); handleDelete(project.id, project.name); }}
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
                        onClick={(e) => { e.stopPropagation(); handleDelete(project.id, project.name); }}
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

        <div className="p-3 border-t border-slate-800">
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
