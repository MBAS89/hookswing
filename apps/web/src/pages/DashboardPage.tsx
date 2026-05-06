import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../hooks/useProjects';
import { FolderGit2, Webhook, Activity, Plus } from 'lucide-react';
import CreateProjectModal from '../components/project/CreateProjectModal';

export default function DashboardPage() {
  const { projects, loading, createProject } = useProjects();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!loading && projects.length > 0) {
      navigate(`/dashboard/projects/${projects[0].id}`);
    }
  }, [loading, projects, navigate]);

  const handleCreate = async (name: string, description?: string) => {
    const project = await createProject(name, description);
    navigate(`/dashboard/projects/${project.id}`);
  };

  if (loading) {
    return <div className="text-slate-400">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 mt-1">Welcome to WebhookVault</p>
      </div>

      {projects.length === 0 ? (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-12 text-center">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Webhook className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">No projects yet</h2>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            Create your first project to get a unique webhook URL and start catching payloads.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-2.5 rounded-lg font-semibold inline-flex items-center gap-2 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => navigate(`/dashboard/projects/${project.id}`)}
              className="bg-slate-900 rounded-xl border border-slate-800 p-6 text-left hover:border-slate-700 transition-all hover:scale-[1.01]"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                  <FolderGit2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{project.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">{project.slug}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Webhook className="w-4 h-4" />
                  <span>{project._count?.webhooks || 0} webhooks</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Activity className="w-4 h-4" />
                  <span>{project.team ? 'Team' : 'Personal'}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <CreateProjectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}
