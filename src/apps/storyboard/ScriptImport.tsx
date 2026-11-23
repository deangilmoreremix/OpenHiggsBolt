import { useMemo, useRef, useState } from 'react'
import { FileText, X } from 'lucide-react'
import { parseScript, scriptToShots, extractCharacters } from './scriptPipeline'
import { useStoryboard } from './StoryboardContext'
import { buttons, panels, semantic } from '@/shared/styles/designTokens'

const MAX_BYTES = 2 * 1024 * 1024

/** Dialog: paste or upload a script (.fdx / .fountain / .txt) and turn it into shots + characters. */
export default function ScriptImport({ onClose }: { onClose: () => void }) {
  const { shots, characters, addShot, addCharacterObject } = useStoryboard()
  const [text, setText] = useState('')
  const [fileName, setFileName] = useState('')
  const [max, setMax] = useState(6)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const result = useMemo(() => {
    if (!text.trim()) return null
    const scenes = parseScript(text, { fileName })
    if (!scenes.length) return null
    return { scenes, shots: scriptToShots(scenes, { maxShotsPerScene: max }), characters: extractCharacters(scenes) }
  }, [text, fileName, max])

  const onFile = async (f?: File) => {
    if (!f) return
    if (f.size > MAX_BYTES) { setError('File is larger than 2 MB. Split the script and import it in parts.'); return }
    setError(null)
    setFileName(f.name)
    setText(await f.text())
  }

  const handleImport = () => {
    if (!result) return
    const known = new Set(characters.map((c) => c.name.toUpperCase()))
    result.characters.filter((c) => !known.has(c.name.toUpperCase())).forEach((c) => addCharacterObject(c))
    result.shots.forEach((s) => addShot({ scene: s.scene, camera: s.camera, duration: s.duration }))
    onClose()
  }

  const total = result ? result.shots.reduce((n, s) => n + (Number(s.duration) || 0), 0) : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" role="dialog" aria-modal="true" aria-label="Import script">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-auto rounded-xl p-5 space-y-3" style={panels.glass}>
        <div className="flex items-center gap-2">
          <FileText size={16} />
          <h2 className="text-sm font-semibold flex-1">Import script</h2>
          <button onClick={onClose} aria-label="Close" className="p-1 rounded-lg" style={buttons.ghost}><X size={14} /></button>
        </div>
        <p className="text-xs" style={{ color: semantic.textMuted }}>Paste a script or upload Final Draft (.fdx), Fountain (.fountain) or plain text. Each scene becomes shots with suggested framing, camera moves and timing.</p>
        <input ref={fileRef} type="file" accept=".fdx,.fountain,.txt,.md,text/plain" aria-label="Upload script file" onChange={(e) => onFile(e.target.files?.[0])} className="text-xs" />
        <textarea value={text} onChange={(e) => { setText(e.target.value); setFileName('') }} aria-label="Script text" rows={10}
          placeholder={'INT. COFFEE SHOP - DAY\n\nMAYA stares at her phone.\n\nMAYA\nHe never called.'}
          className="w-full rounded-xl p-3 text-xs outline-none" style={{ ...panels.card, color: 'white' }} />
        <label className="flex items-center gap-2 text-xs">Max shots per scene
          <input type="number" min={1} max={12} value={max} onChange={(e) => setMax(Math.max(1, Math.min(12, Number(e.target.value) || 6)))} className="w-16 rounded-lg px-2 py-1" style={{ ...panels.card, color: 'white' }} />
        </label>
        {error && <p role="alert" className="text-xs text-red-300">{error}</p>}
        <p role="status" className="text-xs" style={{ color: semantic.textMuted }}>
          {result ? `${result.shots.length} shots across ${result.scenes.length} scenes, ${result.characters.length} characters, about ${total.toFixed(0)}s.${shots.length ? ` They will be added after your ${shots.length} existing shots.` : ''}` : text.trim() ? 'No scenes found in this text.' : ''}
        </p>
        <button onClick={handleImport} disabled={!result} className="py-2 px-4 rounded-xl text-xs font-semibold disabled:opacity-50" style={buttons.primary}>Add to storyboard</button>
      </div>
    </div>
  )
}
