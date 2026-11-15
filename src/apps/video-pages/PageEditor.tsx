'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, Copy, ExternalLink, Save } from 'lucide-react'
import { Puck } from '@puckeditor/core'
import '@puckeditor/core/no-external.css'
import '@/src/lib/landingPages/puck/designCss.js'
import '@/src/styles/landing-pages/studio-puck-theme.css'
import { puckConfig } from '@/src/lib/landingPages/puck/config.jsx'
import { PageContext } from '@/src/lib/landingPages/puck/context.js'
import { getTemplate, sanitizePuck } from '@/src/lib/landingPages/templates.js'
import { sampleSections } from '@/src/lib/landingPages/sampleContent.js'
import { deletePage, updatePage } from '@/src/lib/landingPages/api.js'
import { embedCode, pageUrl } from '@/src/lib/landingPages/ids.js'
import AnalyticsTab from './AnalyticsTab'
import ContactsTab from './ContactsTab'
import { ui } from './ui'
import type { PageRow } from './VideoPagesStudio'

const SAMPLE_TOKENS = { firstname: 'Alex', lastname: 'Rivera', company: 'Brightline', role: 'Head of Growth' }
type Tab = 'design' | 'contacts' | 'analytics'

export default function PageEditor({ page, onBack, onChanged }: { page: PageRow; onBack: () => void; onChanged: (p: PageRow) => void }) {
  const [tab, setTab] = useState<Tab>('design')
  const [title, setTitle] = useState(page.title)
  const [published, setPublished] = useState(page.published)
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const data = useRef<any>(page.config?.puck)
  const [sampleCount, setSampleCount] = useState(0)

  const tpl = getTemplate(page.config?.template)
  const countSamples = useCallback((d: any) => sampleSections(d, tpl.puckData, tpl.sampleTypes || []).length, [tpl])
  useEffect(() => { setSampleCount(countSamples(data.current)) }, [countSamples])

  const save = async (patch: Partial<{ published: boolean }> = {}) => {
    setBusy(true); setNote(null)
    try {
      const puck = sanitizePuck(data.current)
      const saved: PageRow = await updatePage(page.id, { title, config: { ...page.config, puck }, ...patch })
      setPublished(saved.published); setDirty(false)
      setNote({ kind: 'ok', text: 'Saved' })
      onChanged(saved)
      return saved
    } catch (err) {
      setNote({ kind: 'error', text: err instanceof Error ? err.message : 'Could not save' })
      return null
    } finally { setBusy(false) }
  }

  const togglePublish = async () => {
    if (!published) {
      const samples = sampleSections(data.current, tpl.puckData, tpl.sampleTypes || [])
      if (samples.length && !window.confirm(`${samples.length} section${samples.length === 1 ? ' still uses' : 's still use'} sample content (made-up names, numbers or quotes). Publish anyway?`)) return
    }
    await save({ published: !published })
  }

  const remove = async () => {
    if (!window.confirm('Delete this page and its analytics? The link will stop working.')) return
    try { await deletePage(page.id); onBack() } catch (err) { setNote({ kind: 'error', text: err instanceof Error ? err.message : 'Could not delete' }) }
  }

  const copy = async (text: string, what: string) => {
    try { await navigator.clipboard.writeText(text); setNote({ kind: 'ok', text: `${what} copied` }) } catch { setNote({ kind: 'error', text: 'Copy failed' }) }
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <div className="w-full flex-1 flex flex-col min-h-0">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 pt-5 flex flex-wrap items-center gap-3">
        <button type="button" className={ui.ghost} onClick={onBack}><ArrowLeft size={14} /> Pages</button>
        <input aria-label="Page title" className={`${ui.input} max-w-sm`} value={title} maxLength={200} onChange={(e) => { setTitle(e.target.value); setDirty(true) }} />
        <span className={published ? ui.chip : ui.chipMuted}>{published ? 'Published' : 'Draft'}</span>
        <div className="flex-1" />
        {published ? (
          <>
            <button type="button" className={ui.ghost} onClick={() => void copy(pageUrl(page.id, origin), 'Link')}><Copy size={14} /> Copy link</button>
            <button type="button" className={ui.ghost} onClick={() => void copy(embedCode(page.id, origin), 'Embed code')}>Embed</button>
            <a className={ui.ghost} href={pageUrl(page.id, '')} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} /> Open</a>
          </>
        ) : null}
        <button type="button" className={ui.ghost} disabled={busy} onClick={() => void togglePublish()}>{published ? 'Unpublish' : 'Publish'}</button>
        <button type="button" className={ui.primary} disabled={busy || !dirty} onClick={() => void save()}><Save size={14} /> {busy ? 'Saving…' : 'Save'}</button>
      </div>
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 mt-3 flex items-center gap-6 border-b border-white/5">
        {(['design', 'contacts', 'analytics'] as Tab[]).map((t) => (
          <button key={t} type="button" className={ui.tab(tab === t)} onClick={() => setTab(t)}>
            {t === 'design' ? 'Design' : t === 'contacts' ? 'Personal links' : 'Analytics'}
            {tab === t ? <span className={ui.tabLine} /> : null}
          </button>
        ))}
      </div>
      {note ? <div className={`max-w-7xl mx-auto w-full px-4 md:px-6 mt-3`}><div className={note.kind === 'ok' ? ui.ok : ui.error}>{note.text}</div></div> : null}

      <div className="flex-1 min-h-0 w-full max-w-7xl mx-auto px-4 md:px-6 py-4 overflow-y-auto custom-scrollbar">
        {tab === 'design' ? (
          <div className="flex flex-col gap-3">
            {sampleCount ? <div className="text-xs text-amber-300 font-bold">{sampleCount} section{sampleCount === 1 ? '' : 's'} still use sample content (made-up names, numbers, quotes). Replace before sharing.</div> : null}
            <p className="text-xs text-white/40">Click any text on the page to edit it. Use the left panel to add, remove and reorder sections, then Save.</p>
            <div className="hb-puck rounded-2xl border border-white/10 overflow-hidden" style={{ height: '76vh' }}>
              <PageContext.Provider value={{ page, tokens: SAMPLE_TOKENS, handlers: {}, preview: true }}>
                <Puck
                  config={puckConfig as any}
                  data={page.config?.puck}
                  onChange={(d) => { const next = sanitizePuck(d); if (!next) return; data.current = next; setDirty(true); setSampleCount(countSamples(next)) }}
                  onPublish={() => void save()}
                />
              </PageContext.Provider>
            </div>
            <button type="button" className={`${ui.danger} self-start mt-4`} onClick={() => void remove()}>Delete this page</button>
          </div>
        ) : tab === 'contacts' ? (
          <ContactsTab pageId={page.id} published={published} />
        ) : (
          <AnalyticsTab pageId={page.id} />
        )}
      </div>
    </div>
  )
}
