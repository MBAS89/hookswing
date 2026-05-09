import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n';
import ConfirmModal from '../components/ui/ConfirmModal';
import {
  Users, Plus, Trash2, Crown, User, Check, Loader2, X,
  Edit3, LogOut, Shield, FolderGit2, AlertTriangle, ChevronDown,
  Mail, UserCheck, UserX as UserXIcon,
} from 'lucide-react';

interface Team {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  members: Array<{
    id: string;
    role: string;
    user: { id: string; email: string; name: string | null };
  }>;
  projects: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
  }>;
  _count?: { projects: number };
}

interface TeamInvite {
  id: string;
  teamId: string;
  email: string;
  role: string;
  status: string;
  token: string;
  createdAt: string;
  expiresAt: string;
  team?: { id: string; name: string };
  invitedBy?: { id: string; name: string | null; email: string };
}

export default function TeamPage() {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTeamName, setNewTeamName] = useState('');
  const [creating, setCreating] = useState(false);

  // Invite
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'MEMBER' | 'ADMIN'>('MEMBER');
  const [activeInviteTeam, setActiveInviteTeam] = useState<string | null>(null);

  // Pending invites
  const [myInvites, setMyInvites] = useState<TeamInvite[]>([]);
  const [teamInvites, setTeamInvites] = useState<Record<string, TeamInvite[]>>({});

  // Rename
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Transfer ownership
  const [transferTeam, setTransferTeam] = useState<string | null>(null);
  const [transferUserId, setTransferUserId] = useState('');

  // Confirm delete
  const [deleteTeam, setDeleteTeam] = useState<string | null>(null);
  const [leaveConfirm, setLeaveConfirm] = useState<string | null>(null);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const res = await api.get('/teams');
      setTeams(res.data);
    } catch {
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyInvites = async () => {
    try {
      const res = await api.get('/teams/invites/me');
      setMyInvites(res.data);
    } catch {
      setMyInvites([]);
    }
  };

  const fetchTeamInvites = async (teamId: string) => {
    try {
      const res = await api.get(`/teams/${teamId}/invites`);
      setTeamInvites((prev) => ({ ...prev, [teamId]: res.data }));
    } catch {
      setTeamInvites((prev) => ({ ...prev, [teamId]: [] }));
    }
  };

  useEffect(() => {
    fetchTeams();
    fetchMyInvites();
  }, []);

  useEffect(() => {
    const handler = () => {
      fetchTeams();
      fetchMyInvites();
    };
    window.addEventListener('refresh-teams', handler);
    return () => window.removeEventListener('refresh-teams', handler);
  }, []);

  const createTeam = async () => {
    if (!newTeamName.trim()) return;
    setCreating(true);
    try {
      const res = await api.post('/teams', { name: newTeamName });
      setTeams([res.data, ...teams]);
      setNewTeamName('');
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('teamPage.failedCreateTeam'));
      setCreating(false);
      return;
    }
    await refreshUser();
    setCreating(false);
  };

  const renameTeam = async (teamId: string) => {
    if (!editName.trim()) return;
    try {
      const res = await api.patch(`/teams/${teamId}`, { name: editName });
      setTeams(teams.map((t) => (t.id === teamId ? res.data : t)));
      setEditingTeam(null);
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('teamPage.failedRenameTeam'));
    }
  };

  const deleteTeamFn = async (teamId: string) => {
    try {
      await api.delete(`/teams/${teamId}`);
      setTeams(teams.filter((t) => t.id !== teamId));
      setDeleteTeam(null);
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('teamPage.failedDeleteTeam'));
      return;
    }
  };

  const leaveTeam = async (teamId: string) => {
    try {
      await api.post(`/teams/${teamId}/leave`);
      setTeams(teams.filter((t) => t.id !== teamId));
      setLeaveConfirm(null);
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('teamPage.failedLeaveTeam'));
      return;
    }
    await refreshUser();
  };

  const transferOwnership = async (teamId: string) => {
    if (!transferUserId) return;
    try {
      await api.post(`/teams/${teamId}/transfer`, { newOwnerId: transferUserId });
      setTransferTeam(null);
      setTransferUserId('');
      fetchTeams();
      await refreshUser();
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('teamPage.failedTransferOwnership'));
    }
  };

  const inviteMember = async (teamId: string) => {
    if (!inviteEmail.trim()) return;
    try {
      await api.post(`/teams/${teamId}/members`, { email: inviteEmail, role: inviteRole });
      setInviteEmail('');
      setInviteRole('MEMBER');
      setActiveInviteTeam(null);
      fetchTeamInvites(teamId);
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('teamPage.failedInviteMember'));
    }
  };

  const acceptInvite = async (token: string) => {
    try {
      await api.post(`/teams/invites/${token}/accept`);
      setMyInvites((prev) => prev.filter((i) => i.token !== token));
      fetchTeams();
      await refreshUser();
      window.dispatchEvent(new CustomEvent('refresh-projects'));
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('teamPage.failedAcceptInvite'));
    }
  };

  const declineInvite = async (token: string) => {
    try {
      await api.post(`/teams/invites/${token}/decline`);
      setMyInvites((prev) => prev.filter((i) => i.token !== token));
      await refreshUser();
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('teamPage.failedDeclineInvite'));
    }
  };

  const cancelInvite = async (teamId: string, inviteId: string) => {
    try {
      await api.delete(`/teams/${teamId}/invites/${inviteId}`);
      fetchTeamInvites(teamId);
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('teamPage.failedCancelInvite'));
    }
  };

  const removeMember = async (teamId: string, userId: string) => {
    try {
      await api.delete(`/teams/${teamId}/members/${userId}`);
      fetchTeams();
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('teamPage.failedRemoveMember'));
    }
  };

  const updateRole = async (teamId: string, userId: string, role: 'MEMBER' | 'ADMIN') => {
    try {
      await api.patch(`/teams/${teamId}/members/${userId}`, { role });
      fetchTeams();
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('teamPage.failedUpdateRole'));
    }
  };

  const isTeamPlan = user?.plan === 'TEAM';
  const hasTeams = (user?.teams && user.teams.length > 0) || false;

  if (!isTeamPlan && !hasTeams) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Crown className="w-8 h-8 text-amber-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{t('teamPage.teamsRequirePlan')}</h2>
        <p className="text-slate-400 mb-6">{t('teamPage.upgradePrompt')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">{t('teamPage.title')}</h1>

      {/* Create Team — only for Team plan holders */}
      {isTeamPlan && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">{t('teamPage.createTeam')}</h2>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder={t('teamPage.teamNamePlaceholder')}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button
              onClick={createTeam}
              disabled={creating || !newTeamName.trim()}
              className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : t('teamPage.createTeamButton')}
            </button>
          </div>
        </div>
      )}

      {/* My Pending Invites */}
      {myInvites.length > 0 && (
        <div className="mb-8 bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2">
            <Mail className="w-4 h-4" />
            {myInvites.length === 1 ? t('teamPage.onePendingInvite') : t('teamPage.manyPendingInvites').replace('{{count}}', String(myInvites.length))}
          </h2>
          <div className="space-y-3">
            {myInvites.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between bg-slate-900 rounded-lg px-4 py-3">
                <div>
                  <p className="text-sm text-white">
                    <strong>{invite.invitedBy?.name || invite.invitedBy?.email}</strong> {t('teamPage.invitedYouTo')} <strong>{invite.team?.name}</strong>
                  </p>
                  <p className="text-xs text-slate-500">{t('teamPage.asRoleExpires').replace('{{role}}', invite.role).replace('{{date}}', new Date(invite.expiresAt).toLocaleDateString())}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => acceptInvite(invite.token)}
                    className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-400 text-white px-3 py-1.5 rounded-lg text-xs font-medium"
                  >
                    <UserCheck className="w-3 h-3" />
                    {t('common.accept')}
                  </button>
                  <button
                    onClick={() => declineInvite(invite.token)}
                    className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium"
                  >
                    <UserXIcon className="w-3 h-3" />
                    {t('common.decline')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
        </div>
      ) : teams.length === 0 && myInvites.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>{t('teamPage.noTeams')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {teams.map((team) => {
            const isOwner = team.ownerId === user?.id;
            const userMembership = team.members.find((m) => m.user.id === user?.id);
            const isAdmin = userMembership?.role === 'ADMIN';

            return (
              <div key={team.id} className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                {/* Team Header */}
                <div className="p-6 border-b border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {editingTeam === team.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                            autoFocus
                          />
                          <button onClick={() => renameTeam(team.id)} className="text-emerald-400 hover:text-emerald-300">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditingTeam(null)} className="text-slate-500 hover:text-white">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <h2 className="text-lg font-semibold text-white">{team.name}</h2>
                          {isOwner && (
                            <button
                              onClick={() => { setEditingTeam(team.id); setEditName(team.name); }}
                              className="text-slate-500 hover:text-white transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">{t('teamPage.membersCount').replace('{{count}}', String(team.members?.length || 0))}</span>
                      <span className="text-xs text-slate-600">•</span>
                      <span className="text-xs text-slate-500">{t('teamPage.projectsCount').replace('{{count}}', String(team.projects?.length || 0))}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3">
                    {isOwner ? (
                      <>
                        <button
                          onClick={() => setTransferTeam(transferTeam === team.id ? null : team.id)}
                          className="text-xs flex items-center gap-1 text-amber-400 hover:text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-md transition-colors"
                        >
                          <Shield className="w-3 h-3" />
                          {t('teamPage.transfer')}
                        </button>
                        <button
                          onClick={() => setDeleteTeam(team.id)}
                          className="text-xs flex items-center gap-1 text-red-400 hover:text-red-300 bg-red-500/10 px-2.5 py-1 rounded-md transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          {t('teamPage.delete')}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setLeaveConfirm(team.id)}
                        className="text-xs flex items-center gap-1 text-slate-400 hover:text-white bg-slate-800 px-2.5 py-1 rounded-md transition-colors"
                      >
                        <LogOut className="w-3 h-3" />
                        {t('teamPage.leave')}
                      </button>
                    )}
                  </div>

                  {/* Transfer Modal Inline */}
                  {transferTeam === team.id && (
                    <div className="mt-3 p-3 bg-slate-800 rounded-lg border border-slate-700">
                      <p className="text-xs text-slate-400 mb-2">{t('teamPage.selectNewOwner')}</p>
                      <div className="flex gap-2">
                        <select
                          value={transferUserId}
                          onChange={(e) => setTransferUserId(e.target.value)}
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm"
                        >
                          <option value="">{t('teamPage.selectMember')}</option>
                          {team.members
                            .filter((m) => m.user.id !== team.ownerId)
                            .map((m) => (
                              <option key={m.user.id} value={m.user.id}>
                                {m.user.name || m.user.email} {m.role === 'ADMIN' ? `(${t('team.admin')})` : `(${t('team.member')})`}
                              </option>
                            ))}
                        </select>
                        <button
                          onClick={() => transferOwnership(team.id)}
                          disabled={!transferUserId}
                          className="bg-amber-500 hover:bg-amber-400 text-white px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
                        >
                          {t('teamPage.transfer')}
                        </button>
                        <button
                          onClick={() => { setTransferTeam(null); setTransferUserId(''); }}
                          className="text-slate-400 hover:text-white px-2"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Delete Confirm */}
                  {deleteTeam === team.id && (
                    <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-xs text-red-400 mb-2">{t('teamPage.deleteConfirm')}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => deleteTeamFn(team.id)}
                          className="bg-red-500 hover:bg-red-400 text-white px-3 py-1.5 rounded-lg text-xs font-medium"
                        >
                          {t('teamPage.deleteTeamButton')}
                        </button>
                        <button
                          onClick={() => setDeleteTeam(null)}
                          className="text-slate-400 hover:text-white px-3 py-1.5 text-xs"
                        >
                          {t('common.cancel')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Projects */}
                {team.projects?.length > 0 && (
                  <div className="px-6 py-4 border-b border-slate-800">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{t('teamPage.projects')}</h3>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {team.projects.map((project) => (
                        <Link
                          key={project.id}
                          to={`/dashboard/projects/${project.id}`}
                          className="flex items-center gap-2 p-2.5 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors group"
                        >
                          <FolderGit2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm text-white truncate group-hover:text-emerald-300 transition-colors">{project.name}</p>
                            {project.description && (
                              <p className="text-xs text-slate-500 truncate">{project.description}</p>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Members */}
                <div className="px-6 py-4">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{t('teamPage.members')}</h3>
                  <div className="space-y-2">
                    {(team.members || []).map((member) => (
                      <div key={member.id} className="flex items-center justify-between py-2 border-b border-slate-800/50 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-slate-400" />
                          </div>
                          <div>
                            <p className="text-sm text-white">{member.user.name || member.user.email}</p>
                            <p className="text-xs text-slate-500">{member.user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {team.ownerId === member.user.id && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-medium">{t('teamPage.owner')}</span>
                          )}
                          {isAdmin && team.ownerId !== member.user.id ? (
                            <>
                              <select
                                value={member.role}
                                onChange={(e) => updateRole(team.id, member.user.id, e.target.value as 'MEMBER' | 'ADMIN')}
                                className="bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-xs text-white"
                              >
                                <option value="MEMBER">{t('team.member')}</option>
                                <option value="ADMIN">{t('team.admin')}</option>
                              </select>
                              <button
                                onClick={() => removeMember(team.id, member.user.id)}
                                className="text-slate-500 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              member.role === 'ADMIN' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700 text-slate-400'
                            }`}>
                              {member.role === 'ADMIN' ? t('team.admin') : member.role === 'MEMBER' ? t('team.member') : member.role}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pending Invites (admin view) */}
                  {isAdmin && (teamInvites[team.id] || []).length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-800">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{t('teamPage.pendingInvitesSection')}</h4>
                      <div className="space-y-2">
                        {teamInvites[team.id].map((invite) => (
                          <div key={invite.id} className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2">
                            <div className="flex items-center gap-2">
                              <Mail className="w-3.5 h-3.5 text-slate-500" />
                              <span className="text-sm text-slate-300">{invite.email}</span>
                              <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">{invite.role === 'ADMIN' ? t('team.admin') : invite.role === 'MEMBER' ? t('team.member') : invite.role}</span>
                              <span className="text-xs text-slate-600">{t('teamPage.expiresDate').replace('{{date}}', new Date(invite.expiresAt).toLocaleDateString())}</span>
                            </div>
                            <button
                              onClick={() => cancelInvite(team.id, invite.id)}
                              className="text-slate-500 hover:text-red-400 transition-colors"
                              title={t('teamPage.cancelInvite')}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Invite */}
                  {isAdmin && (
                    <div className="mt-4 pt-4 border-t border-slate-800">
                      <button
                        onClick={() => {
                          const opening = activeInviteTeam !== team.id;
                          setActiveInviteTeam(opening ? team.id : null);
                          if (opening) fetchTeamInvites(team.id);
                        }}
                        className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 font-medium"
                      >
                        <Plus className="w-4 h-4" />
                        {t('team.inviteMember')}
                      </button>

                      {activeInviteTeam === team.id && (
                        <div className="mt-3 flex gap-3">
                          <input
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder={t('teamPage.emailPlaceholder')}
                            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                          />
                          <select
                            value={inviteRole}
                            onChange={(e) => setInviteRole(e.target.value as 'MEMBER' | 'ADMIN')}
                            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                          >
                            <option value="MEMBER">{t('team.member')}</option>
                            <option value="ADMIN">{t('team.admin')}</option>
                          </select>
                          <button
                            onClick={() => inviteMember(team.id)}
                            className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-lg font-medium text-sm"
                          >
                            {t('teamPage.inviteButton')}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        open={!!leaveConfirm}
        title={t('teamPage.leaveTeamTitle')}
        message={t('teamPage.leaveTeamConfirm')}
        confirmLabel={t('teamPage.leaveButton')}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={() => leaveConfirm && leaveTeam(leaveConfirm)}
        onCancel={() => setLeaveConfirm(null)}
      />
    </div>
  );
}
