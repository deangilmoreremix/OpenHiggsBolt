import { useRef, useState } from 'react'
import { Plus, Trash2, User, Pencil, Check, X, Upload, Loader2 } from 'lucide-react'
import { useStoryboard, type StoryboardCharacter } from './StoryboardContext'
import { panels, buttons, semantic } from '@/shared/styles/designTokens'
import { uploadReferenceImage } from '@/api/storyboard'

/** Reference image URL input with an upload button; pasting a URL still works. */
function ReferenceImageField({
  value,
  onChange,
  inputClassName,
}: {
  value: string
  onChange: (url: string) => void
  inputClassName: string
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setError(null)
    setProgress(0)
    try {
      onChange(await uploadReferenceImage(file, setProgress))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setProgress(null)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Reference image (upload or paste URL)"
          className={`flex-1 min-w-0 ${inputClassName}`}
          style={{ ...panels.card, color: 'white' }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={progress !== null}
          className="flex items-center gap-1 px-2 rounded-lg text-xs transition-all disabled:opacity-50"
          style={buttons.ghost}
          title="Upload a reference image"
        >
          {progress !== null ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
          {progress !== null ? `${progress}%` : 'Upload'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
      {error && <p className="text-[11px]" style={{ color: '#f87171' }}>{error}</p>}
    </div>
  )
}

export default function CharacterLibrary() {
  const { characters, addCharacterObject, updateCharacter, removeCharacter } = useStoryboard()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [referenceImageUrl, setReferenceImageUrl] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Partial<StoryboardCharacter>>({})

  const handleAdd = () => {
    if (!name.trim()) return
    addCharacterObject({
      name: name.trim(),
      description: description.trim() || undefined,
      referenceImageUrl: referenceImageUrl.trim() || undefined,
    })
    setName('')
    setDescription('')
    setReferenceImageUrl('')
  }

  const startEdit = (c: StoryboardCharacter) => {
    setEditingId(c.id || null)
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
        <ReferenceImageField
          value={referenceImageUrl}
          onChange={setReferenceImageUrl}
          inputClassName="rounded-xl p-2 text-sm outline-none"
        />
      </div>
      {referenceImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={referenceImageUrl} alt="Reference preview" className="w-16 h-16 rounded-lg object-cover" />
      )}
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
                  <ReferenceImageField
                    value={draft.referenceImageUrl || ''}
                    onChange={(url) => setDraft((d) => ({ ...d, referenceImageUrl: url }))}
                    inputClassName="rounded-lg p-1.5 text-sm outline-none"
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
                    <button onClick={() => c.id && removeCharacter(c.id)} className="p-1.5 rounded-lg" style={buttons.ghost} title="Remove">
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
