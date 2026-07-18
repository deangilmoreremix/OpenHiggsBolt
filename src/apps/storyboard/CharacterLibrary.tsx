import { useState } from 'react'
import { Plus, Trash2, User, Pencil, Check, X } from 'lucide-react'
import { useStoryboard, type StoryboardCharacter } from './StoryboardContext'
import { panels, buttons, semantic } from '@/shared/styles/designTokens'

export default function CharacterLibrary() {
  const { characters, addCharacter, updateCharacter, removeCharacter } = useStoryboard()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [referenceImageUrl, setReferenceImageUrl] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Partial<StoryboardCharacter>>({})

  const handleAdd = () => {
    if (!name.trim()) return
    addCharacter({
      name: name.trim(),
      description: description.trim() || undefined,
      referenceImageUrl: referenceImageUrl.trim() || undefined,
    })
    setName('')
    setDescription('')
    setReferenceImageUrl('')
  }

  const startEdit = (c: StoryboardCharacter) => {
    setEditingId(c.id)
    setDraft({ name: c.name, description: c.description, referenceImageUrl: c.referenceImageUrl })
  }

  const saveEdit = () => {
    if (!editingId) return
    updateCharacter(editingId, {
      name: (draft.name || '').trim() || 'Unnamed',
      description: (draft.description || '').trim() || undefined,
      referenceImageUrl: (draft.referenceImageUrl || '').trim() || undefined,
    })
    setEditingId(null)
    setDraft({})
  }

  const inputStyle = { ...panels.card, color: 'white' as const }

  return (
    <div className="rounded-xl p-6 space-y-4" style={panels.glass}>
      <div className="flex items-center gap-2">
        <User size={15} style={{ color: 'var(--color-primary)' }} />
        <h2 className="text-sm font-semibold">Characters ({characters.length})</h2>
      </div>
      <p className="text-xs" style={{ color: semantic.textMuted }}>
        Define characters once and attach them to scenes for consistency. Their descriptions are woven into each shot prompt.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name (e.g. Mara)"
          className="rounded-xl p-2 text-sm outline-none"
          style={inputStyle}
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Traits (red coat, scar, 30s)"
          className="rounded-xl p-2 text-sm outline-none"
          style={inputStyle}
        />
        <input
          value={referenceImageUrl}
          onChange={(e) => setReferenceImageUrl(e.target.value)}
          placeholder="Reference image URL (optional)"
          className="rounded-xl p-2 text-sm outline-none"
          style={inputStyle}
        />
      </div>
      <button
        onClick={handleAdd}
        disabled={!name.trim()}
        className="flex items-center gap-2 py-2 px-4 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
        style={buttons.primary}
      >
        <Plus size={16} /> Add Character
      </button>

      {characters.length > 0 && (
        <div className="space-y-2 pt-2">
          {characters.map((c) => (
            <div key={c.id} className="flex items-start gap-3 rounded-xl p-3" style={panels.card}>
              {c.referenceImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.referenceImageUrl}
                  alt={c.name}
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={panels.glass}>
                  <User size={16} style={{ color: semantic.textMuted }} />
                </div>
              )}

              {editingId === c.id ? (
                <div className="flex-1 space-y-2">
                  <input
                    value={draft.name || ''}
                    onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                    className="w-full rounded-lg p-1.5 text-sm outline-none"
                    style={inputStyle}
                  />
                  <input
                    value={draft.description || ''}
                    onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                    placeholder="Traits"
                    className="w-full rounded-lg p-1.5 text-sm outline-none"
                    style={inputStyle}
                  />
                  <input
                    value={draft.referenceImageUrl || ''}
                    onChange={(e) => setDraft((d) => ({ ...d, referenceImageUrl: e.target.value }))}
                    placeholder="Reference image URL"
                    className="w-full rounded-lg p-1.5 text-sm outline-none"
                    style={inputStyle}
                  />
                </div>
              ) : (
                <div className="flex-1">
                  <p className="text-sm font-medium">{c.name}</p>
                  {c.description && (
                    <p className="text-xs mt-0.5" style={{ color: semantic.textMuted }}>{c.description}</p>
                  )}
                </div>
              )}

              <div className="flex items-center gap-1">
                {editingId === c.id ? (
                  <>
                    <button onClick={saveEdit} className="p-1.5 rounded-lg" style={buttons.ghost} title="Save">
                      <Check size={14} />
                    </button>
                    <button onClick={() => { setEditingId(null); setDraft({}) }} className="p-1.5 rounded-lg" style={buttons.ghost} title="Cancel">
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEdit(c)} className="p-1.5 rounded-lg" style={buttons.ghost} title="Edit">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => removeCharacter(c.id)} className="p-1.5 rounded-lg" style={buttons.ghost} title="Remove">
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
