'use client'

import { useEffect, useRef, useState } from 'react'
import { normalizeVideo } from '@/src/lib/landingPages/handoff.js'
import { ui } from './ui'

export type Video = { url: string; posterUrl: string | null; title: string; source: Record<string, unknown> }

/** Pick the video or picture that goes on the page: from your library, a file you upload, or a pasted link. */
export default function MediaChooser({ onPick }: { onPick: (v: Video) => void }) {
  const [library, setLibrary] = useState<any[] | null>(null)
  const [link, setLink] = useState('')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let live = true
    // Everything a studio saved that can become a page: videos and pictures, newest first.
    import('studio/src/lib/assetStore.js')
      .then(async (m) => {
        const list = m.listAssets as (o: { kind?: string; limit?: number }) => Promise<any[]>
        const [videos, images] = await Promise.all([list({ kind: 'video', limit: 60 }).catch(() => []), list({ kind: 'image', limit: 60 }).catch(() => [])])
        const when = (a: any) => String(a?.created_at || a?.createdAt || '')
        return [...(videos || []).map((a) => ({ ...a, kind: 'video' })), ...(images || []).map((a) => ({ ...a, kind: 'image' }))].sort((a, b) => when(b).localeCompare(when(a)))
      })
      .then((rows) => { if (live) setLibrary(rows || []) })
      .catch(() => { if (live) setLibrary([]) })
    return () => { live = false }
  }, [])

  const useLink = () => {
    const v = normalizeVideo({ url: link.trim(), kind: 'video' }, { allowImage: true })
    if (!v) { setError('Paste a permanent https link to a video file (.mp4, .webm, .mov) or a picture (.png, .jpg, .webp).'); return }
    setError(''); onPick(v)
  }

  const upload = async (file?: File | null) => {
    if (!file) return
    setBusy('Uploading…'); setError('')
    try {
      const { saveUploadedFile } = await import('studio/src/lib/assetStore.js')
      const asset = await saveUploadedFile(file)
      const v = asset ? normalizeVideo(asset, { allowImage: true }) : null
      if (!v) throw new Error('Could not upload that file. Videos up to 100MB (mp4, webm, mov) or pictures (png, jpg, webp) work best.')
      onPick(v)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally { setBusy('') }
  }

  return (
    <div data-media-chooser className="grid gap-4 lg:grid-cols-[1fr_20rem] mb-6">
      <div className={ui.panel}>
        <div className="text-xs font-bold text-white/70 mb-2">Choose a video or picture from your library</div>
        {library === null ? <div className="text-xs text-white/40">Loading…</div> : null}
        {library && !library.length ? <div className="text-xs text-white/40">Nothing yet. Make a video or picture in any studio, or upload or paste a link.</div> : null}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto custom-scrollbar">
          {(library || []).map((a) => (
            <button key={a.id} type="button" onClick={() => { const v = normalizeVideo(a, { allowImage: true }); if (v) onPick(v) }} className="rounded-lg overflow-hidden border border-white/10 hover:border-primary/50 bg-black">
              {a.kind === 'image'
                ? <img src={a.url} alt={a.name || ''} className="h-20 w-full object-cover" loading="lazy" />
                : <video src={a.url} className="h-20 w-full object-cover" muted preload="metadata" />}
              <div className="px-2 py-1 text-[10px] text-white/60 truncate text-left">{a.name || (a.kind === 'image' ? 'Picture' : 'Video')}</div>
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {error ? <div className={ui.error}>{error}</div> : null}
        <div className={ui.panel}>
          <div className="text-xs font-bold text-white/70 mb-2">Upload a file</div>
          <input ref={fileRef} type="file" accept="video/mp4,video/webm,video/quicktime,image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => void upload(e.target.files?.[0])} />
          <button type="button" className={ui.ghost} disabled={!!busy} onClick={() => fileRef.current?.click()}>{busy || 'Choose a video or picture file'}</button>
        </div>
        <div className={ui.panel}>
          <div className="text-xs font-bold text-white/70 mb-2">Paste a video or picture link</div>
          <input className={ui.input} value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://…/video.mp4" />
          <button type="button" className={`${ui.ghost} mt-2`} onClick={useLink}>Use link</button>
        </div>
      </div>
    </div>
  )
}
