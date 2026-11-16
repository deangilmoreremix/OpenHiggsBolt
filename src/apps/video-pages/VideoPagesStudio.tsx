'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Link2, Eye } from 'lucide-react'
import { listPages, getPage } from '@/src/lib/landingPages/api.js'
import { takeQueuedVideo } from '@/src/lib/landingPages/handoff.js'
import { pageUrl } from '@/src/lib/landingPages/ids.js'
import NewPageFlow from './NewPageFlow'
import PageEditor from './PageEditor'
import { ui } from './ui'

export type PageRow = {
  id: string
  title: string
  video_url: string
  poster_url: string | null
  duration: number | null
  source: Record<string, unknown>
  config: any
  published: boolean
  view_count: number
  created_at: string
  updated_at: string
}

type View = { kind: 'list' } | { kind: 'new'; queued?: any } | { kind: 'edit'; page: PageRow }

/** Video Pages: turn any video into an editable, shareable landing page. */
export default function VideoPagesStudio() {
  const [view, setView] = useState<View>({ kind: 'list' })
  const [pages, setPages] = useState<PageRow[] | null>(null)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    try {
      setPages(await listPages())
      setError('')
    } catch (err) {
      setPages([])
      setError(err instanceof Error ? err.message : 'Could not load your pages')
    }
  }, [])

  useEffect(() => {
    void refresh()
    // "Create landing page" from another studio queues a video; start the new-page flow with it.
    const queued = takeQueuedVideo()
    if (queued) setView({ kind: 'new', queued })
  }, [refresh])

  const open = async (id: string) => {
    try {
      setView({ kind: 'edit', page: await getPage(id) })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open the page')
    }
  }

  if (view.kind === 'new') {
    return (
      <div className={ui.root}>
        <NewPageFlow
          queued={view.queued}
          onCancel={() => setView({ kind: 'list' })}
          onCreated={(page: PageRow) => { void refresh(); setView({ kind: 'edit', page }) }}
        />
      </div>
    )
  }
  if (view.kind === 'edit') {
    return (
      <div className={ui.root}>
        <PageEditor
          page={view.page}
          onBack={() => { void refresh(); setView({ kind: 'list' }) }}
          onChanged={(page: PageRow) => setView({ kind: 'edit', page })}
        />
      </div>
    )
  }

  return (
    <div className={ui.root}>
      <div className={ui.body}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-black text-white">Video Pages</h1>
            <p className="text-sm text-white/50 mt-1">Turn any video into a branded landing page with a call to action, lead form and analytics. Every word, image and section is editable.</p>
          </div>
          <button type="button" className={ui.primary} onClick={() => setView({ kind: 'new' })}>
            <Plus size={14} /> New page
          </button>
        </div>
        {error ? <div className={`${ui.error} mb-4`}>{error}</div> : null}
        {pages === null ? <div className="text-xs text-white/40">Loading your pages…</div> : null}
        {pages && !pages.length && !error ? (
          <div className={`${ui.panel} text-center py-16`}>
            <p className="text-white/70 font-bold">No pages yet</p>
            <p className="text-xs text-white/40 mt-1">Pick a video from your library, upload one or paste a link, then choose one of the 34 designs.</p>
          </div>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(pages || []).map((p) => (
            <button key={p.id} type="button" onClick={() => open(p.id)} className={`${ui.card} text-left hover:border-primary/40 transition-colors`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-bold text-white truncate">{p.title}</div>
                  <div className="text-[11px] text-white/40 mt-0.5 truncate">{p.config?.template || 'page'}</div>
                </div>
                <span className={p.published ? ui.chip : ui.chipMuted}>{p.published ? 'Published' : 'Draft'}</span>
              </div>
              <div className="flex items-center gap-4 mt-4 text-[11px] text-white/50">
                <span className="inline-flex items-center gap-1"><Eye size={12} /> {p.view_count} views</span>
                {p.published ? <span className="inline-flex items-center gap-1 truncate"><Link2 size={12} /> {pageUrl(p.id, '')}</span> : null}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
