import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import {
  Users, Plus, Trash2, Crown, User, Check, Loader2, X,
  Edit3, LogOut, Shield, FolderGit2, AlertTriangle, ChevronDown,
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

export default function TeamPage() {
  const { user, updateUser } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTeamName, setNewTeamName] = useState('');
  const [creating, setCreating] = useState(false);

  // Invite
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'MEMBER' | 'ADMIN'>('MEMBER');
  const [activeInviteTeam, setActiveInviteTeam] = useState<string | null>(null);

  // Rename
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Transfer ownership
  const [transferTeam, setTransferTeam] = useState<string | null>(null);
  const [transferUserId, setTransferUserId] = useState('');

  // Confirm delete
  const [deleteTeam, setDeleteTeam] = useState<string | null>(null);

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

  useEffect(() => {
    fetchTeams();
  }, []);

  const createTeam = async () => {
    if (!newTeamName.trim()) return;
    setCreating(true);
    try {
      const res = await api.post('/teams', { name: newTeamName });
      setTeams([res.data, ...teams]);
      setNewTeamName('');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create team');
      setCreating(false);
      return;
    }
    // Refresh auth context in background — don't block or error if this fails
    try {
      const meRes = await api.get('/auth/me');
      updateUser(meRes.data.user);
    } catch {
      // Auth refresh failed but team was created — ignore
    }
    setCreating(false);
  };

  const renameTeam = async (teamId: string) => {
    if (!editName.trim()) return;
    try {
      const res = await api.patch(`/teams/${teamId}`, { name: editName });
      setTeams(teams.map((t) => (t.id === teamId ? res.data : t)));
      setEditingTeam(null);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to rename team');
    }
  };

  const deleteTeamFn = async (teamId: string) => {
    try {
      await api.delete(`/teams/${teamId}`);
      setTeams(teams.filter((t) => t.id !== teamId));
      setDeleteTeam(null);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete team');
      return;
    }
    // Refresh auth context in background
    try {
      const meRes = await api.get('/auth/me');
      updateUser(meRes.data.user);
    } catch {
      // ignore
    }
  };

  const leaveTeam = async (teamId: string) => {
    if (!confirm('Are you sure you want to leave this team?')) return;
    try {
      await api.post(`/teams/${teamId}/leave`);
      setTeams(teams.filter((t) => t.id !== teamId));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to leave team');
      return;
    }
    // Refresh auth context in background
    try {
      const meRes = await api.get('/auth/me');
      updateUser(meRes.data.user);
    } catch {
      // ignore
    }
  };

  const transferOwnership = async (teamId: string) => {
    if (!transferUserId) return;
    try {
      await api.post(`/teams/${teamId}/transfer`, { newOwnerId: transferUserId });
      setTransferTeam(null);
      setTransferUserId('');
      fetchTeams();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to transfer ownership');
    }
  };

  const inviteMember = async (teamId: string) => {
    if (!inviteEmail.trim()) return;
    try {
      await api.post(`/teams/${teamId}/members`, { email: inviteEmail, role: inviteRole });
      setInviteEmail('');
      setInviteRole('MEMBER');
      setActiveInviteTeam(null);
      fetchTeams();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to invite member');
    }
  };

  const removeMember = async (teamId: string, userId: string) => {
    try {
      await api.delete(`/teams/${teamId}/members/${userId}`);
      fetchTeams();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to remove member');
    }
  };

  const updateRole = async (teamId: string, userId: string, role: 'MEMBER' | 'ADMIN') => {
    try {
      await api.patch(`/teams/${teamId}/members/${userId}`, { role });
      fetchTeams();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update role');
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
        <h2 className="text-2xl font-bold text-white mb-2">Teams require Team plan</h2>
        <p className="text-slate-400 mb-6">Upgrade to Team ($49/mo) to create workspaces and invite unlimited members.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Teams</h1>

      {/* Create Team — only for Team plan holders */}
      {isTeamPlan && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">Create a Team</h2>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="Team name (e.g. Backend Squad)"
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button
              onClick={createTeam}
              disabled={creating || !newTeamName.trim()}
              className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Team'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
        </div>
      ) : teams.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No teams yet. Create one above.</p>
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
                      <span className="text-xs text-slate-500">{team.members.length} members</span>
                      <span className="text-xs text-slate-600">•</span>
                      <span className="text-xs text-slate-500">{team.projects.length} projects</span>
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
                          Transfer
                        </button>
                        <button
                          onClick={() => setDeleteTeam(team.id)}
                          className="text-xs flex items-center gap-1 text-red-400 hover:text-red-300 bg-red-500/10 px-2.5 py-1 rounded-md transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => leaveTeam(team.id)}
                        className="text-xs flex items-center gap-1 text-slate-400 hover:text-white bg-slate-800 px-2.5 py-1 rounded-md transition-colors"
                      >
                        <LogOut className="w-3 h-3" />
                        Leave
                      </button>
                    )}
                  </div>

                  {/* Transfer Modal Inline */}
                  {transferTeam === team.id && (
                    <div className="mt-3 p-3 bg-slate-800 rounded-lg border border-slate-700">
                      <p className="text-xs text-slate-400 mb-2">Select new owner (must be an admin):</p>
                      <div className="flex gap-2">
                        <select
                          value={transferUserId}
                          onChange={(e) => setTransferUserId(e.target.value)}
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm"
                        >
                          <option value="">Select member...</option>
                          {team.members
                            .filter((m) => m.role === 'ADMIN' && m.user.id !== user?.id)
                            .map((m) => (
                              <option key={m.user.id} value={m.user.id}>
                                {m.user.name || m.user.email}
                              </option>
                            ))}
                        </select>
                        <button
                          onClick={() => transferOwnership(team.id)}
                          disabled={!transferUserId}
                          className="bg-amber-500 hover:bg-amber-400 text-white px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
                        >
                          Transfer
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
                      <p className="text-xs text-red-400 mb-2">This will delete the team and all its projects. This cannot be undone.</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => deleteTeamFn(team.id)}
                          className="bg-red-500 hover:bg-red-400 text-white px-3 py-1.5 rounded-lg text-xs font-medium"
                        >
                          Delete Team
                        </button>
                        <button
                          onClick={() => setDeleteTeam(null)}
                          className="text-slate-400 hover:text-white px-3 py-1.5 text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Projects */}
                {team.projects && team.projects.length > 0 && (
                  <div className="px-6 py-4 border-b border-slate-800">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Projects</h3>
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
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Members</h3>
                  <div className="space-y-2">
                    {team.members.map((member) => (
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
                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-medium">Owner</span>
                          )}
                          {isAdmin && team.ownerId !== member.user.id ? (
                            <>
                              <select
                                value={member.role}
                                onChange={(e) => updateRole(team.id, member.user.id, e.target.value as 'MEMBER' | 'ADMIN')}
                                className="bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-xs text-white"
                              >
                                <option value="MEMBER">Member</option>
                                <option value="ADMIN">Admin</option>
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
                              {member.role}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Invite */}
                  {isAdmin && (
                    <div className="mt-4 pt-4 border-t border-slate-800">
                      <button
                        onClick={() => setActiveInviteTeam(activeInviteTeam === team.id ? null : team.id)}
                        className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 font-medium"
                      >
                        <Plus className="w-4 h-4" />
                        Invite Member
                      </button>

                      {activeInviteTeam === team.id && (
                        <div className="mt-3 flex gap-3">
                          <input
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="Email address"
                            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                          />
                          <select
                            value={inviteRole}
                            onChange={(e) => setInviteRole(e.target.value as 'MEMBER' | 'ADMIN')}
                            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                          >
                            <option value="MEMBER">Member</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                          <button
                            onClick={() => inviteMember(team.id)}
                            className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-lg font-medium text-sm"
                          >
                            Invite
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
    </div>
  );
}
