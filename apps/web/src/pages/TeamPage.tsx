import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { Users, Plus, Trash2, Crown, User } from 'lucide-react';

interface Team {
  id: string;
  name: string;
  ownerId: string;
  members: Array<{
    id: string;
    role: string;
    user: { id: string; email: string; name: string | null };
  }>;
}

export default function TeamPage() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTeamName, setNewTeamName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'MEMBER' | 'ADMIN'>('MEMBER');
  const [activeTeam, setActiveTeam] = useState<string | null>(null);

  const fetchTeams = async () => {
    try {
      const res = await api.get('/teams');
      // Backend returns single team or we need to fetch differently
      setTeams(Array.isArray(res.data) ? res.data : res.data ? [res.data] : []);
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
    const res = await api.post('/teams', { name: newTeamName });
    setTeams([...teams, res.data]);
    setNewTeamName('');
  };

  const inviteMember = async (teamId: string) => {
    if (!inviteEmail.trim()) return;
    await api.post(`/teams/${teamId}/members`, { email: inviteEmail, role: inviteRole });
    setInviteEmail('');
    fetchTeams();
  };

  const removeMember = async (teamId: string, userId: string) => {
    await api.delete(`/teams/${teamId}/members/${userId}`);
    fetchTeams();
  };

  if (user?.plan !== 'TEAM') {
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

      {teams.length === 0 ? (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-8">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">Create your first team</h2>
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
              className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Create Team
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {teams.map((team) => (
            <div key={team.id} className="bg-slate-900 rounded-xl border border-slate-800 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">{team.name}</h2>
                <span className="text-xs text-slate-500">{team.members.length} members</span>
              </div>

              <div className="space-y-3 mb-6">
                {team.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between py-2 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm text-white">{member.user.name || member.user.email}</p>
                        <p className="text-xs text-slate-500">{member.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        member.role === 'ADMIN' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-700 text-slate-400'
                      }`}>
                        {member.role}
                      </span>
                      {team.ownerId !== member.user.id && (
                        <button
                          onClick={() => removeMember(team.id, member.user.id)}
                          className="text-slate-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-800 pt-4">
                <button
                  onClick={() => setActiveTeam(activeTeam === team.id ? null : team.id)}
                  className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Invite Member
                </button>

                {activeTeam === team.id && (
                  <div className="mt-3 flex gap-3">
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="Email address"
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                      Send Invite
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
