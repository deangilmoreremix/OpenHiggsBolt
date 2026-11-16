'use client'

import { useEffect, useRef, useState } from 'react'
import { createPage, updatePage, addContacts } from '@/src/lib/landingPages/api.js'
import { defaultConfig, TEMPLATES } from '@/src/lib/landingPages/templates.js'
import { normalizeVideo } from '@/src/lib/landingPages/handoff.js'
import { applyCustomerToPuck, brandForConfig, toContactFields } from '@/src/lib/landingPages/customerProfile.js'
import CustomerPanel, { useCustomerChoice } from './CustomerPanel'
import { useCustomers } from './useCustomers'
import DesignPreview from './DesignPreview'
import { ui } from './ui'

type Video = { url: string; posterUrl: string | null; title: string; source: Record<string, unknown> }

/** Pick a video (library, upload, link) and a design, then create the page. */
export default function NewPageFlow({ queued, onCancel, onCreated }: { queued?: Video; onCancel: () => void; onCreated: (page: any) => void }) {
  const [video, setVideo] = useState<Video | null>(queued || null)
  const [library, setLibrary] = useState<any[] | null>(null)
  const [link, setLink] = useState('')
  const [template, setTemplate] = useState('puck-starter')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const { customers, activeId, loading: customersLoading } = useCustomers()
  const choice = useCustomerChoice(customers, activeId)

  useEffect(() => {
    let live = true
    import('studio/src/lib/assetStore.js')
      .then((m) => (m.listAssets as (o: { kind?: string; limit?: number }) => Promise<any[]>)({ kind: 'video', limit: 60 }))
      .then((rows) => { if (live) setLibrary(rows || []) })
      .catch(() => { if (live) setLibrary([]) })
    return () => { live = false }
  }, [])

  const useLink = () => {
    const v = normalizeVideo({ url: link.trim(), kind: 'video' }, { allowImage: true })
    if (!v) { setError('Paste a permanent https link to a video file (.mp4, .webm, .mov) or a picture (.png, .jpg, .webp).'); return }
    setError(''); setVideo(v)
  }

  const upload = async (file?: File | null) => {
    if (!file) return
    setBusy('Uploading…'); setError('')
    try {
      const { saveUploadedFile } = await import('studio/src/lib/assetStore.js')
      const asset = await saveUploadedFile(file)
      const v = asset ? normalizeVideo({ ...asset, kind: 'video' }) : null
      if (!v) throw new Error('Could not upload that file. Videos up to 100MB (mp4, webm, mov) work best.')
      setVideo(v)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally { setBusy('') }
  }

  const create = async () => {
    if (!video) return
    setBusy('Creating…'); setError('')
    try {
      const one = choice.selected.length === 1 ? choice.selected[0] : null
      const withBrand = !!one && choice.brand
      const config = defaultConfig(template, { title: video.title, ...(withBrand ? { brand: brandForConfig(one) } : {}) })
      if (withBrand && config.puck) config.puck = applyCustomerToPuck(config.puck, one).data
      let page = await createPage({ title: video.title, videoUrl: video.url, posterUrl: video.posterUrl, source: video.source, config })
      const rows = choice.selected.map(toContactFields).filter(Boolean).map((fields: any) => ({ fields }))
      if (rows.length) {
        // the editor previews as the first of them; a failure here must not lose the page
        try { await addContacts(page.id, rows) } catch { /* the Personal links tab can add them again */ }
      }
      onCreated(page)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the page')
      setBusy('')
    }
  }

  return (
    <div className={ui.body}>
      <div className="flex items-center justify-between gap-3 mb-6">
        <h1 className="text-xl font-black text-white">New page</h1>
        <button type="button" className={ui.ghost} onClick={onCancel}>Cancel</button>
      </div>
      {error ? <div className={`${ui.error} mb-4`}>{error}</div> : null}

      <section className="mb-8">
        <div className={`${ui.label} mb-2`}>1. Choose the video</div>
        {video ? (
          <div className={`${ui.panel} flex items-center gap-4`}>
            <video src={video.url} className="h-20 w-36 rounded-lg bg-black object-cover" muted preload="metadata" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-white truncate">{video.title}</div>
              <div className="text-[11px] text-white/40 truncate">{video.url}</div>
            </div>
            <button type="button" className={ui.ghost} onClick={() => setVideo(null)}>Change</button>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
            <div className={ui.panel}>
              <div className="text-xs font-bold text-white/70 mb-2">From your library</div>
              {library === null ? <div className="text-xs text-white/40">Loading…</div> : null}
              {library && !library.length ? <div className="text-xs text-white/40">No videos yet. Make one in any studio, or upload or paste a link.</div> : null}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto custom-scrollbar">
                {(library || []).map((a) => (
                  <button key={a.id} type="button" onClick={() => { const v = normalizeVideo({ ...a, kind: 'video' }); if (v) setVideo(v) }} className="rounded-lg overflow-hidden border border-white/10 hover:border-primary/50 bg-black">
                    <video src={a.url} className="h-20 w-full object-cover" muted preload="metadata" />
                    <div className="px-2 py-1 text-[10px] text-white/60 truncate text-left">{a.name || 'Video'}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className={ui.panel}>
                <div className="text-xs font-bold text-white/70 mb-2">Upload a file</div>
                <input ref={fileRef} type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" onChange={(e) => void upload(e.target.files?.[0])} />
                <button type="button" className={ui.ghost} disabled={!!busy} onClick={() => fileRef.current?.click()}>Choose a video file</button>
              </div>
              <div className={ui.panel}>
                <div className="text-xs font-bold text-white/70 mb-2">Paste a video or picture link</div>
                <input className={ui.input} value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://…/video.mp4" />
                <button type="button" className={`${ui.ghost} mt-2`} onClick={useLink}>Use link</button>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="mb-8">
        <div className={`${ui.label} mb-2`}>2. Choose a design</div>
        <p className="text-xs text-white/40 mb-3">Every design is a real, responsive landing page. After you create it you can change every word, image, link and section.</p>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {TEMPLATES.map((t: any) => (
            <button key={t.id} type="button" aria-pressed={template === t.id} onClick={() => setTemplate(t.id)} className={`${ui.card} text-left transition-colors ${template === t.id ? 'border-primary bg-primary/10' : 'hover:border-white/20'}`}>
              <div className="mb-2"><DesignPreview data={t.puckData} label={t.name} /></div>
              <div className="text-xs font-bold text-white leading-tight">{t.name}</div>
              <div className="text-[10px] text-white/40 mt-1 line-clamp-2">{t.description}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <div className={`${ui.label} mb-2`}>3. Who is it for?</div>
        <CustomerPanel customers={customers} loading={customersLoading} choice={choice} />
      </section>

      <button type="button" className={ui.primary} disabled={!video || !!busy} onClick={() => void create()}>
        {busy || 'Create page'}
      </button>
    </div>
  )
}
