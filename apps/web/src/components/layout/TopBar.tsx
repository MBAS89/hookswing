import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  Crown,
  User,
  LogOut,
  ChevronDown,
  Check,
  X,
  Trash2,
  CheckCheck,
  Loader2,
  Users,
  MessageSquare,
  Zap,
  Shield,
  CreditCard,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { api } from '../../lib/api';

const typeIcons: Record<string, React.ElementType> = {
  team_invite: Users,
  team_invite_accepted: Users,
  team_invite_declined: Users,
  member_left: Users,
  member_removed: Users,
  role_changed: Shield,
  ownership_transferred: Shield,
  comment_added: MessageSquare,
  comment_replied: MessageSquare,
  webhook_received: Zap,
  plan_changed: CreditCard,
  project_created: Zap,
};

const typeColors: Record<string, string> = {
  team_invite: 'bg-emerald-500/10 text-emerald-400',
  team_invite_accepted: 'bg-emerald-500/10 text-emerald-400',
  team_invite_declined: 'bg-red-500/10 text-red-400',
  member_left: 'bg-amber-500/10 text-amber-400',
  member_removed: 'bg-red-500/10 text-red-400',
  role_changed: 'bg-blue-500/10 text-blue-400',
  ownership_transferred: 'bg-purple-500/10 text-purple-400',
  comment_added: 'bg-cyan-500/10 text-cyan-400',
  comment_replied: 'bg-cyan-500/10 text-cyan-400',
  webhook_received: 'bg-emerald-500/10 text-emerald-400',
  plan_changed: 'bg-amber-500/10 text-amber-400',
  project_created: 'bg-emerald-500/10 text-emerald-400',
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const {
    notifications,
    unreadCount,
    markRead,
    markAllRead,
    deleteNotification,
    refresh,
  } = useNotifications();
  const [processing, setProcessing] = useState<Record<string, boolean>>({});

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAcceptInvite = async (token: string, notifId: string) => {
    setProcessing((p) => ({ ...p, [token]: true }));
    try {
      await api.post(`/teams/invites/${token}/accept`);
      await markRead(notifId);
      await refreshUser();
      refresh();
    } catch (e) {
      // silent
    } finally {
      setProcessing((p) => ({ ...p, [token]: false }));
    }
  };

  const handleDeclineInvite = async (token: string, notifId: string) => {
    setProcessing((p) => ({ ...p, [token]: true }));
    try {
      await api.post(`/teams/invites/${token}/decline`);
      await markRead(notifId);
      await refreshUser();
      refresh();
    } catch (e) {
      // silent
    } finally {
      setProcessing((p) => ({ ...p, [token]: false }));
    }
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
  };

  const handleDelete = async (id: string) => {
    await deleteNotification(id);
  };

  const handleNotifClick = (n: any) => {
    if (!n.read) {
      markRead(n.id);
    }
    if (n.data?.teamId) {
      navigate(`/dashboard/teams`);
      setNotifOpen(false);
    } else if (n.data?.projectId) {
      navigate(`/dashboard/projects/${n.data.projectId}`);
      setNotifOpen(false);
    }
  };

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-4 sm:px-6">
      <button onClick={onMenuClick} className="lg:hidden text-slate-400 hover:text-white">
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-4">
        {user?.plan !== 'FREE' && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-xs font-medium">
            <Crown className="w-3.5 h-3.5" />
            {user?.plan}
          </div>
        )}

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative text-slate-400 hover:text-white transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-3 w-[360px] max-h-[480px] bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                <h3 className="text-sm font-semibold text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                  >
                    <CheckCheck className="w-3 h-3" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="overflow-y-auto flex-1">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                    <Bell className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-sm">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((n) => {
                    const Icon = typeIcons[n.type] || AlertCircle;
                    const colorClass = typeColors[n.type] || 'bg-slate-700 text-slate-400';
                    const isInvite = n.type === 'team_invite';
                    return (
                      <div
                        key={n.id}
                        className={`group px-4 py-3 border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors ${
                          n.read ? 'opacity-70' : ''
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div
                              className="cursor-pointer"
                              onClick={() => handleNotifClick(n)}
                            >
                              <p className="text-sm text-white font-medium leading-snug">
                                {n.title}
                              </p>
                              <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                                {n.message}
                              </p>
                            </div>

                            {isInvite && n.data?.inviteToken && !n.read && (
                              <div className="flex gap-2 mt-2">
                                <button
                                  onClick={() => handleAcceptInvite(n.data.inviteToken, n.id)}
                                  disabled={processing[n.data.inviteToken]}
                                  className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-md hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                                >
                                  {processing[n.data.inviteToken] ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Check className="w-3 h-3" />
                                  )}
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleDeclineInvite(n.data.inviteToken, n.id)}
                                  disabled={processing[n.data.inviteToken]}
                                  className="flex items-center gap-1 px-2.5 py-1 bg-red-500/10 text-red-400 text-xs rounded-md hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                >
                                  <X className="w-3 h-3" />
                                  Decline
                                </button>
                              </div>
                            )}

                            <div className="flex items-center justify-between mt-1.5">
                              <span className="text-[10px] text-slate-500">
                                {timeAgo(n.createdAt)}
                              </span>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {!n.read && (
                                  <button
                                    onClick={() => markRead(n.id)}
                                    className="p-1 text-slate-500 hover:text-emerald-400 transition-colors"
                                    title="Mark read"
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDelete(n.id)}
                                  className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {notifications.length > 0 && (
                <div className="px-4 py-2 border-t border-slate-800 text-center">
                  <button
                    onClick={() => { setNotifOpen(false); navigate('/dashboard/account?tab=notifications'); }}
                    className="text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    Notification settings
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Avatar Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 hover:bg-slate-800 rounded-lg px-2 py-1.5 transition-colors"
          >
            <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
            </div>
            <span className="hidden sm:block text-sm text-slate-300">{user?.name || user?.email}</span>
            <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden z-50">
              <button
                onClick={() => { setDropdownOpen(false); navigate('/dashboard/account'); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <User className="w-4 h-4" />
                Account
              </button>
              <div className="border-t border-slate-800" />
              <button
                onClick={() => { setDropdownOpen(false); logout(); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-slate-800 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
