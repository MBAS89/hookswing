import { useState } from 'react';
import { X, FolderGit2, Loader2, Users } from 'lucide-react';

interface TeamOption {
  id: string;
  name: string;
}

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, description?: string, teamId?: string) => Promise<void>;
  teams?: TeamOption[];
}

export default function CreateProjectModal({ isOpen, onClose, onCreate, teams }: CreateProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [teamId, setTeamId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    setLoading(true);
    try {
      await onCreate(name.trim(), description.trim() || undefined, teamId || undefined);
      setName('');
      setDescription('');
      setTeamId('');
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setName('');
      setDescription('');
      setTeamId('');
      setError('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-slate-900 rounded-xl border border-slate-700 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <FolderGit2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Create Project</h2>
              <p className="text-sm text-slate-400">Get a unique webhook URL</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="project-name" className="block text-sm font-medium text-slate-300 mb-1.5">
              Project Name <span className="text-red-400">*</span>
            </label>
            <input
              id="project-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My SaaS, Stripe Integration, etc."
              autoFocus
              maxLength={100}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            />
          </div>

          {teams && teams.length > 0 && (
            <div>
              <label htmlFor="project-team" className="block text-sm font-medium text-slate-300 mb-1.5">
                Team <span className="text-slate-500">(optional)</span>
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <select
                  id="project-team"
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 appearance-none"
                >
                  <option value="">Personal</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="project-description" className="block text-sm font-medium text-slate-300 mb-1.5">
              Description <span className="text-slate-500">(optional)</span>
            </label>
            <textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this project for?"
              rows={3}
              maxLength={500}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 resize-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg font-medium text-sm text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white py-2.5 rounded-lg font-semibold text-sm transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
