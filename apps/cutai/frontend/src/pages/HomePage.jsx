import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import useProjectStore from '../stores/useProjectStore';
import useUIStore from '../stores/useUIStore';
import { createProject, deleteProject as apiDeleteProject } from '../services/api';
import Modal from '../components/shared/Modal';
import Badge from '../components/shared/Badge';

export default function HomePage() {
  const { projects, fetchProjects, createProject, deleteProject, loading } = useProjectStore();
  const { newProjectModalOpen, closeNewProjectModal } = useUIStore();
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const project = await createProject({ title: title.trim(), genre: genre.trim() });
    closeNewProjectModal();
    setTitle('');
    setGenre('');
    navigate(`/project/${project.id}`);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    await apiDeleteProject(id);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-cutai-text">Projects</h1>
          <p className="text-sm text-cutai-muted">Your storyboards at a glance.</p>
        </div>
        <button
          onClick={() => useUIStore.setState({ newProjectModalOpen: true })}
          className="inline-flex items-center gap-2 rounded-lg bg-cutai-accent px-4 py-2 text-sm font-medium text-black hover:bg-cutai-accent/90"
        >
          <Plus size={16} />
          New Project
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-cutai-muted">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-cutai-border bg-cutai-surface/40 p-10 text-center">
          <p className="text-lg font-medium text-cutai-text">No projects yet.</p>
          <p className="mt-1 text-sm text-cutai-muted">Create your first storyboard.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className="group relative flex cursor-pointer flex-col gap-3 rounded-xl border border-cutai-border bg-cutai-surface p-4 text-left transition hover:border-cutai-accent/60 hover:shadow-lg"
              onClick={() => navigate(`/project/${project.id}`)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-cutai-text">{project.title}</h3>
                  <p className="text-xs text-cutai-muted">{project.genre}</p>
                </div>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    await handleDelete(project.id);
                  }}
                  className="rounded-lg p-1.5 text-cutai-muted hover:bg-cutai-border hover:text-cutai-text"
                  aria-label="Delete project"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Badge>{project.genre || 'Untitled'}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={newProjectModalOpen}
        onClose={closeNewProjectModal}
        title="New Project"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-cutai-muted">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-cutai-border bg-cutai-bg px-3 py-2 text-sm text-cutai-text outline-none focus:border-cutai-accent"
              placeholder="My Film"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-cutai-muted">Genre</label>
            <input
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full rounded-lg border border-cutai-border bg-cutai-bg px-3 py-2 text-sm text-cutai-text outline-none focus:border-cutai-accent"
              placeholder="Noir Thriller"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={closeNewProjectModal}
              className="rounded-lg border border-cutai-border px-4 py-2 text-sm text-cutai-muted hover:text-cutai-text"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-cutai-accent px-4 py-2 text-sm font-medium text-black hover:bg-cutai-accent/90"
            >
              Create
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
