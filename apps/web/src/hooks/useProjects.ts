import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
  _count?: { webhooks: number };
  team?: { id: string; name: string } | null;
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/projects');
      setProjects(res.data.projects);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    const handler = () => fetchProjects();
    window.addEventListener('refresh-projects', handler);
    return () => window.removeEventListener('refresh-projects', handler);
  }, [fetchProjects]);

  const createProject = useCallback(async (name: string, description?: string, teamId?: string) => {
    const res = await api.post('/projects', { name, description, teamId });
    setProjects((prev) => [res.data, ...prev]);
    return res.data;
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    await api.delete(`/projects/${id}`);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return { projects, loading, fetchProjects, createProject, deleteProject };
}
