import { create } from 'zustand';
import { createProject, listProjects, deleteProject } from '../services/api';

const useProjectStore = create((set, get) => ({
  projects: [],
  currentProject: null,
  loading: false,
  error: null,

  async fetchProjects() {
    set({ loading: true, error: null });
    try {
      const projects = await listProjects();
      set({ projects, loading: false });
    } catch (e) {
      set({ error: e.message, loading: false });
    }
  },

  async createProject(data) {
    const created = await createProject(data);
    set((s) => ({ projects: [created, ...s.projects] }));
    return created;
  },

  async deleteProject(id) {
    await deleteProject(id);
    set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }));
  },

  setCurrentProject(project) {
    set({ currentProject: project });
  },
}));

export default useProjectStore;
