import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Film, Download, Plus, FolderOpen } from 'lucide-react';
import useUIStore from '../../stores/useUIStore';
import useProjectStore from '../../stores/useProjectStore';

export default function Header() {
  const { openExportModal, openNewProjectModal, closeNewProjectModal, newProjectModalOpen, closeNewProjectModal: closeNewProject } = useUIStore();
  const { currentProject } = useProjectStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNewProject = () => {
    openNewProjectModal();
    setMobileOpen(false);
  };

  const handleHome = () => {
    navigate('/');
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-cutai-border bg-cutai-surface/80 px-4 py-3 backdrop-blur md:px-6">
      <div className="flex items-center gap-3">
        <button
          className="md:hidden rounded-lg p-2 text-cutai-muted hover:text-cutai-text"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <button onClick={handleHome} className="flex items-center gap-2 text-cutai-text">
          <Film className="h-5 w-5 text-cutai-accent" />
          <span className="text-lg font-bold tracking-tight">CutAI</span>
        </button>
      </div>

      <div className="hidden md:block text-sm text-cutai-muted truncate max-w-xs">
        {currentProject?.title}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleNewProject}
          className="inline-flex items-center gap-2 rounded-lg bg-cutai-accent px-3 py-1.5 text-sm font-medium text-black hover:bg-cutai-accent/90"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">New Project</span>
        </button>

        {currentProject && (
          <button
            onClick={() => openExportModal()}
            className="inline-flex items-center gap-2 rounded-lg border border-cutai-border px-3 py-1.5 text-sm text-cutai-text hover:border-cutai-accent/60"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Export</span>
          </button>
        )}

        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-lg border border-cutai-border px-3 py-1.5 text-sm text-cutai-text hover:border-cutai-accent/60"
        >
          <FolderOpen size={16} />
          <span className="hidden sm:inline">Projects</span>
        </Link>
      </div>
    </header>
  );
}
