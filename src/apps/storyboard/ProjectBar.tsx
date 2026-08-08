import { FolderOpen, Plus, Trash2 } from 'lucide-react'
import { useStoryboard } from './StoryboardContext'
import { panels, buttons, semantic } from '@/shared/styles/designTokens'

export default function ProjectBar() {
  const { projects, projectId, createProject, switchProject, deleteProject } = useStoryboard()

  return (
    <div className="flex items-center gap-2 flex-wrap rounded-xl p-3 mb-6" style={panels.glass}>
      <FolderOpen size={15} style={{ color: 'var(--color-primary)' }} />
      <span className="text-xs font-medium mr-1" style={{ color: semantic.textLabel }}>PROJECT</span>
      <select
        value={projectId ?? ''}
        onChange={(e) => switchProject(e.target.value)}
        className="rounded-lg p-1.5 text-sm outline-none max-w-xs"
        style={{ ...panels.card, color: 'white' }}
      >
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {(p.projectName || 'Untitled') + ` (${p.shotCount})`}
          </option>
        ))}
      </select>
      <button
        onClick={() => createProject()}
        className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs transition-all"
        style={buttons.ghost}
        title="New project"
      >
        <Plus size={13} /> New
      </button>
      {projects.length > 1 && projectId && (
        <button
          onClick={() => {
            if (confirm('Delete this project? This cannot be undone.')) deleteProject(projectId)
          }}
          className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs transition-all"
          style={buttons.ghost}
          title="Delete current project"
        >
          <Trash2 size={13} /> Delete
        </button>
      )}
    </div>
  )
}
