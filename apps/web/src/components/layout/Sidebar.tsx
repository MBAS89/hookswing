import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FolderGit2, Users, Settings, X, Plus, Users2, Globe, Terminal, Shield, Trash2, Zap, MessageSquare, Send, ChevronUp, ChevronDown, Loader2, Headphones, Maximize2, Minimize2,
} from 'lucide-react';
import Logo from '../Logo';
import { useProjects } from '../../hooks/useProjects';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { api } from '../../lib/api';
import { useSupport } from '../../hooks/useSupport';
import { useTranslation } from '../../i18n';
import { LanguageSwitcher } from '../../i18n/LanguageSwitcher';
import CreateProjectModal from '../project/CreateProjectModal';
import ConfirmModal from '../ui/ConfirmModal';

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { projects, createProject, deleteProject } = useProjects();
  const { user, pendingInvites, logout } = useAuth();
  const toast = useToast();

  const { t } = useTranslation();

  const navItems = [
    { icon: LayoutDashboard, label: t('layout.dashboard'), href: '/dashboard' },
    { icon: Zap, label: t('layout.tester'), href: '/dashboard/tester' },
    { icon: Users, label: t('layout.team'), href: '/dashboard/team', badge: pendingInvites > 0 ? pendingInvites : undefined },
    { icon: Terminal, label: t('layout.cli'), href: '/dashboard/cli' },
    ...(user?.role === 'ADMIN' ? [{ icon: Shield, label: t('layout.admin'), href: '/dashboard/admin' }] : []),
  ];

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackSubject, setFeedbackSubject] = useState('improvement');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const hasSupport = user?.plan === 'PRO' || user?.plan === 'TEAM';
  const {
    messages: supportMessages,
    unreadCount: supportUnread,
    loading: supportLoading,
    isTyping: supportTyping,
    adminJoined: supportAdminJoined,
    fetchMessages: fetchSupportMessages,
    sendMessage: sendSupportMessage,
    markRead: markSupportRead,
    emitTyping: emitSupportTyping,
  } = useSupport();
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportExpanded, setSupportExpanded] = useState(false);
  const [supportText, setSupportText] = useState('');
  const [supportSending, setSupportSending] = useState(false);
  const supportScrollRef = useRef<HTMLDivElement>(null);
  const supportExpandedScrollRef = useRef<HTMLDivElement>(null);

  const [showBusyMessage, setShowBusyMessage] = useState(false);
  const busyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [feedbackExpanded, setFeedbackExpanded] = useState(false);

  useEffect(() => {
    if (hasSupport) {
      fetchSupportMessages();
    }
  }, [hasSupport, fetchSupportMessages]);

  useEffect(() => {
    if (supportOpen && supportScrollRef.current) {
      supportScrollRef.current.scrollTop = supportScrollRef.current.scrollHeight;
    }
  }, [supportMessages, supportOpen]);

  useEffect(() => {
    if (supportExpanded && supportExpandedScrollRef.current) {
      supportExpandedScrollRef.current.scrollTop = supportExpandedScrollRef.current.scrollHeight;
    }
  }, [supportMessages, supportExpanded]);

  useEffect(() => {
    if (supportOpen && supportUnread > 0) {
      markSupportRead();
    }
  }, [supportOpen, supportUnread, markSupportRead]);

  // Clear busy timer and message when admin replies
  useEffect(() => {
    const hasAdminReply = supportMessages.some((m) => m.isAdmin);
    if (hasAdminReply) {
      if (busyTimerRef.current) {
        clearTimeout(busyTimerRef.current);
        busyTimerRef.current = null;
      }
      setShowBusyMessage(false);
    }
  }, [supportMessages]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (busyTimerRef.current) {
        clearTimeout(busyTimerRef.current);
      }
    };
  }, []);

  const handleCreate = async (name: string, description?: string, teamId?: string) => {
    const project = await createProject(name, description, teamId);
    navigate(`/dashboard/projects/${project.id}`);
  };

  const handleSendSupport = async () => {
    if (!supportText.trim()) return;
    setSupportSending(true);
    try {
      await sendSupportMessage(supportText.trim());
      setSupportText('');
      // Start 15-min "admins are busy" timer if this is the first user message with no admin reply yet
      const hasAdminReply = supportMessages.some((m) => m.isAdmin);
      if (!hasAdminReply && !busyTimerRef.current) {
        busyTimerRef.current = setTimeout(() => {
          setShowBusyMessage(true);
        }, 15 * 60 * 1000);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to send message');
    } finally {
      setSupportSending(false);
    }
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
        title={t('layout.deleteProject')}
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`}
        confirmLabel={t('common.confirm')}
        cancelLabel={t('common.cancel')}
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
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />
            <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto py-4 px-3 space-y-6">
          {/* Menu */}
          <div>
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('layout.menu')}</span>
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
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('layout.projects')}</span>
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
                      title={t('layout.deleteProject')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
              {personalProjects.length === 0 && teamProjects.length === 0 && (
                <p className="px-3 text-xs text-slate-600">{t('layout.noProjects')}</p>
              )}
            </nav>
          </div>

          {/* Workspaces */}
          {hasAnyTeams && (
            <div>
              <div className="flex items-center justify-between px-3 mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('layout.workspaces')}</span>
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
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('layout.teamProjects')}</span>
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
          {/* Live Support */}
          {hasSupport && (
            <div className="relative">
              <button
                onClick={() => setSupportOpen(!supportOpen)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <Headphones className="w-4 h-4" />
                <span className="flex-1 text-left">{t('layout.liveSupport')}</span>
                {supportUnread > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {supportUnread}
                  </span>
                )}
                {supportOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {supportOpen && (
                <div className="mt-2 px-3 flex flex-col" style={{ height: '280px' }}>
                  <div className="flex items-center justify-end mb-1">
                    <button
                      onClick={() => setSupportExpanded(true)}
                      className="p-1 rounded text-slate-500 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                      title="Expand"
                    >
                      <Maximize2 className="w-3 h-3" />
                    </button>
                  </div>
                  <div
                    ref={supportScrollRef}
                    className="flex-1 overflow-y-auto space-y-2 mb-2 pr-1"
                  >
                    {supportLoading ? (
                      <div className="flex items-center justify-center h-20">
                        <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-center">
                          <div className="bg-slate-800/80 border border-slate-700/50 rounded-lg px-3 py-2 text-center max-w-[90%]">
                            <p className="text-[11px] text-slate-300 leading-relaxed">
                              👋 {t('layout.supportWelcome')}
                            </p>
                          </div>
                        </div>
                        {supportMessages.length === 0 ? (
                          <p className="text-xs text-slate-500 text-center py-4">{t('layout.supportPlaceholder')}</p>
                        ) : (
                              supportMessages.map((msg) => (
                            <div
                              key={msg.id}
                              className={`flex ${msg.isAdmin ? 'justify-start' : 'justify-end'}`}
                            >
                              <div
                                className={`max-w-[85%] px-2.5 py-1.5 rounded-lg text-xs ${
                                  msg.isAdmin
                                    ? 'bg-slate-800 text-slate-200'
                                    : 'bg-emerald-500/20 text-emerald-300'
                                }`}
                              >
                                <p className="break-words">{msg.message}</p>
                                <p className="text-[9px] text-slate-500 mt-0.5 text-right">
                                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                        {showBusyMessage && (
                          <div className="flex justify-center">
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 text-center max-w-[90%]">
                              <p className="text-[11px] text-amber-300 leading-relaxed">
                                ⏳ {t('layout.busyMessage')}
                              </p>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  {supportAdminJoined && (
                    <div className="flex justify-center mb-1">
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2.5 py-1">
                        <p className="text-[10px] text-emerald-400 font-medium">👋 {t('layout.adminJoined')}</p>
                      </div>
                    </div>
                  )}
                  {supportTyping && (
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 px-1">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                      {t('layout.supportTyping')}
                    </div>
                  )}
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={supportText}
                      onChange={(e) => { setSupportText(e.target.value); emitSupportTyping(); }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && supportText.trim() && !supportSending) {
                          handleSendSupport();
                        }
                      }}
                      placeholder={t('layout.supportPlaceholder')}
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      onClick={handleSendSupport}
                      disabled={supportSending || !supportText.trim()}
                      className="shrink-0 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      {supportSending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Feedback */}
          <div className="relative">
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
                <div className="flex items-center justify-end">
                  <button
                    onClick={() => setFeedbackExpanded(true)}
                    className="p-1 rounded text-slate-500 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                    title="Expand"
                  >
                    <Maximize2 className="w-3 h-3" />
                  </button>
                </div>
                <select
                  value={feedbackSubject}
                  onChange={(e) => setFeedbackSubject(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="improvement">{t('layout.feedbackTypes.improvement')}</option>
                  <option value="bug">{t('layout.feedbackTypes.bug')}</option>
                  <option value="suggestion">{t('layout.feedbackTypes.suggestion')}</option>
                  <option value="feature_request">{t('layout.feedbackTypes.feature_request')}</option>
                  <option value="other">{t('layout.feedbackTypes.other')}</option>
                </select>
                <textarea
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  placeholder={t('layout.feedbackMessage')}
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
                  {t('layout.feedbackSend')}
                </button>
              </div>
            )}
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Settings className="w-4 h-4" />
            {t('layout.logout')}
          </button>
        </div>
      </aside>

      {/* Expanded Support Modal */}
      {supportExpanded && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col" style={{ height: 'min(600px, 80vh)' }}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Headphones className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">{t('layout.liveSupport')}</h3>
              </div>
              <button
                onClick={() => setSupportExpanded(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
            <div ref={supportExpandedScrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {supportLoading ? (
                <div className="flex items-center justify-center h-20">
                  <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                </div>
              ) : (
                <>
                  <div className="flex justify-center">
                    <div className="bg-slate-800/80 border border-slate-700/50 rounded-lg px-4 py-2.5 text-center max-w-[85%]">
                      <p className="text-xs text-slate-300 leading-relaxed">
                        👋 {t('layout.supportWelcome')}
                      </p>
                    </div>
                  </div>
                  {supportMessages.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-8">{t('layout.supportPlaceholder')}</p>
                  ) : (
                    supportMessages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.isAdmin ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[80%] px-3.5 py-2.5 rounded-xl text-sm ${msg.isAdmin ? 'bg-slate-800 text-slate-200' : 'bg-emerald-500/20 text-emerald-300'}`}>
                          <p className="break-words">{msg.message}</p>
                          <p className="text-[10px] text-slate-500 mt-1 text-right">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  {showBusyMessage && (
                    <div className="flex justify-center">
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2.5 text-center max-w-[85%]">
                        <p className="text-xs text-amber-300 leading-relaxed">
                          ⏳ {t('layout.busyMessage')}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="p-3 border-t border-slate-800 flex flex-col gap-2">
              {supportAdminJoined && (
                <div className="flex justify-center">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-1.5">
                    <p className="text-xs text-emerald-400 font-medium">👋 {t('layout.adminJoined')}</p>
                  </div>
                </div>
              )}
              {supportTyping && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 px-1">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  {t('layout.supportTyping')}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={supportText}
                  onChange={(e) => { setSupportText(e.target.value); emitSupportTyping(); }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && supportText.trim() && !supportSending) {
                      handleSendSupport();
                    }
                  }}
                  placeholder={t('layout.supportPlaceholder')}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              <button
                onClick={handleSendSupport}
                disabled={supportSending || !supportText.trim()}
                className="shrink-0 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white px-3 py-2 rounded-lg transition-colors"
              >
                {supportSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expanded Feedback Modal */}
      {feedbackExpanded && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col" style={{ height: 'min(500px, 70vh)' }}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">{t('layout.feedback')}</h3>
              </div>
              <button
                onClick={() => setFeedbackExpanded(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">{t('layout.feedbackSubject')}</label>
                <select
                  value={feedbackSubject}
                  onChange={(e) => setFeedbackSubject(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="improvement">Improvement</option>
                  <option value="bug">Found a Bug</option>
                  <option value="suggestion">Suggestion</option>
                  <option value="feature_request">Feature Request</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="flex-1 flex flex-col">
                <label className="block text-xs font-medium text-slate-400 mb-1.5">{t('layout.feedbackMessage')}</label>
                <textarea
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  placeholder={t('layout.feedbackMessage')}
                  className="flex-1 min-h-[120px] w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>
            </div>
            <div className="p-3 border-t border-slate-800">
              <button
                onClick={async () => {
                  if (!feedbackMessage.trim()) return;
                  setFeedbackLoading(true);
                  try {
                    await api.post('/feedback', { subject: feedbackSubject, message: feedbackMessage.trim() });
                    toast.success('Feedback sent! Thank you.');
                    setFeedbackMessage('');
                    setFeedbackExpanded(false);
                    setFeedbackOpen(false);
                  } catch (err: any) {
                    toast.error(err.response?.data?.error || 'Failed to send feedback');
                  } finally {
                    setFeedbackLoading(false);
                  }
                }}
                disabled={feedbackLoading || !feedbackMessage.trim()}
                className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                {feedbackLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {t('layout.feedback')}
              </button>
            </div>
          </div>
        </div>
      )}

      <CreateProjectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreate}
        teams={teamOptions}
      />
    </>
  );
}
