import { useEffect, useMemo, useRef, useState } from 'react'
import { Play, Pause, X } from 'lucide-react'
import { buildAnimaticTimeline, cameraMoveTransform } from './scriptPipeline'
import type { StoryboardShot } from './StoryboardContext'
import { buttons, panels } from '@/shared/styles/designTokens'

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
const okUrl = (u: string | null) => (u && /^(https?:|data:image\/|blob:)/i.test(u) ? u : null)

/** Timed playback of the storyboard frames with camera-move motion and optional audio. */
export default function AnimaticPlayer({ shots, onClose }: { shots: StoryboardShot[]; onClose: () => void }) {
  const tl = useMemo(() => buildAnimaticTimeline(shots), [shots])
  const [t, setT] = useState(0)
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioUrl = useRef<string | null>(null)
  const [audioName, setAudioName] = useState('')

  useEffect(() => {
    if (!playing) return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      setT((prev) => {
        const next = prev + dt
        if (next >= tl.total) { setPlaying(false); return tl.total }
        return next
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, tl.total])

  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    if (playing) { a.currentTime = t; a.play().catch(() => undefined) } else a.pause()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing])

  useEffect(() => () => { audioRef.current?.pause(); if (audioUrl.current) URL.revokeObjectURL(audioUrl.current) }, [])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const e = tl.at(t)
  const src = e ? okUrl(e.imageUrl) : null
  const toggle = () => { if (!playing && t >= tl.total) setT(0); setPlaying((p) => !p) }
  const seek = (v: number) => { setT(v); if (audioRef.current) audioRef.current.currentTime = v }
  const onAudio = (f?: File) => {
    if (!f) return
    if (audioUrl.current) URL.revokeObjectURL(audioUrl.current)
    audioUrl.current = URL.createObjectURL(f)
    audioRef.current = new Audio(audioUrl.current)
    setAudioName(f.name)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" role="dialog" aria-modal="true" aria-label="Animatic">
      <div className="w-full max-w-4xl rounded-xl p-4 space-y-3" style={panels.glass}>
        <div className="flex items-center"><h2 className="text-sm font-semibold flex-1">Animatic</h2>
          <button onClick={onClose} aria-label="Close" className="p-1 rounded-lg" style={buttons.ghost}><X size={14} /></button></div>
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
          {src ? <img src={src} alt="" className="w-full h-full object-cover" style={{ transform: cameraMoveTransform(e!.move, (t - e!.start) / e!.duration) }} />
            : <span className="text-sm text-white/50">{e ? `Shot ${e.label} has no image yet` : 'No shots'}</span>}
          {e?.caption && <div className="absolute bottom-0 inset-x-0 p-3 text-center text-sm bg-gradient-to-t from-black/80 to-transparent">{e.caption}</div>}
          {e && <div className="absolute top-2 left-2 text-[10px] bg-black/60 rounded px-2 py-1">{e.label} · {e.move}</div>}
        </div>
        <input type="range" min={0} max={Math.max(0.01, tl.total)} step={0.01} value={t} onChange={(ev) => seek(Number(ev.target.value))} aria-label="Animatic position" className="w-full" />
        <div className="flex items-center gap-3 text-xs">
          <button onClick={toggle} disabled={!shots.length} className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg disabled:opacity-50" style={buttons.primary}>
            {playing ? <Pause size={14} /> : <Play size={14} />}{playing ? 'Pause' : t >= tl.total && tl.total > 0 ? 'Replay' : 'Play'}
          </button>
          <span className="tabular-nums">{fmt(t)} / {fmt(tl.total)}</span>
          <label className="ml-auto cursor-pointer py-1.5 px-3 rounded-lg" style={buttons.ghost}>
            {audioName ? `Audio: ${audioName.slice(0, 24)}` : 'Add audio'}
            <input type="file" accept="audio/*" hidden onChange={(ev) => onAudio(ev.target.files?.[0])} />
          </label>
        </div>
      </div>
    </div>
  )
}
