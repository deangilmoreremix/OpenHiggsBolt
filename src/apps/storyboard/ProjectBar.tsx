import { FolderOpen, Plus, Trash2 } from 'lucide-react'
import { useStoryboard } from './StoryboardContext'
import { panels, buttons, semantic } from '@/shared/styles/designTokens'

export default function ProjectBar() {
  const { projects, projectId, projectName, shots, createProject, switchProject, deleteProject } = useStoryboard()

  // The active project's entry is only refreshed on switch, so read its name
  // and scene count from live state.
  const label = (p: (typeof projects)[number]) => {
    const isCurrent = p.id === projectId
    const name = (isCurrent ? projectName : p.projectName) || 'Untitled'
    const count = isCurrent ? shots.length : p.shots?.length ?? p.shotCount ?? 0
    return `${name} (${count} scene${count === 1 ? '' : 's'})`
  }

  return (
    <div className="flex items-center gap-2 flex-wrap rounded-xl p-3" style={panels.glass}>
      <FolderOpen size={15} style={{ color: 'var(--color-primary)' }} />
      <span className="text-xs font-medium mr-1" style={{ color: semantic.textLabel }}>PROJECT</span>
      <select
        value={projectId ?? ''}
        onChange={(e) => switchProject(e.target.value)}
        className="rounded-lg p-1.5 text-sm outline-none max-w-xs"
        style={{ ...panels.card, color: 'white' }}
        aria-label="Switch project"
      >
        {projects.map((p) => (
          <option key={p.id} value={p.id} style={{ background: '#111' }}>
            {label(p)}
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
      {projectId && (
        <button
          onClick={() => {
            if (confirm('Delete this project and its scenes? This cannot be undone.')) deleteProject(projectId)
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
