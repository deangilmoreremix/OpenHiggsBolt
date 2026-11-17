'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, Copy, ExternalLink, Search, X } from 'lucide-react'
import { Puck } from '@puckeditor/core'
import '@puckeditor/core/no-external.css'
import '@/src/lib/landingPages/puck/designCss.js'
import '@/src/styles/landing-pages/studio-puck-theme.css'
import { puckConfig } from '@/src/lib/landingPages/puck/config.jsx'
import { PageContext } from '@/src/lib/landingPages/puck/context.js'
import { TEMPLATES, defaultConfig, sanitizePuck } from '@/src/lib/landingPages/templates.js'
import { sampleSections } from '@/src/lib/landingPages/sampleContent.js'
import { createPage, updatePage, addContacts } from '@/src/lib/landingPages/api.js'
import { pageUrl, personalUrl } from '@/src/lib/landingPages/ids.js'
import { exportLinksCsv } from '@/src/lib/landingPages/csv.js'
import { applyCustomerToPuck, brandForConfig, customerTokens, toContactFields } from '@/src/lib/landingPages/customerProfile.js'
import CustomerPanel, { useCustomerChoice } from './CustomerPanel'
import { useCustomers } from './useCustomers'
import DesignPreview from './DesignPreview'
import { ui } from './ui'
import type { PickedPage } from './LandingPagePicker'

type Video = { url: string; posterUrl: string | null; title: string; source: Record<string, unknown> }
const SAMPLE_TOKENS = { firstname: 'Alex', lastname: 'Rivera', company: 'Brightline', role: 'Head of Growth' }
const CHIPS: { id: string; label: string; match: (id: string) => boolean }[] = [
  { id: 'all', label: 'All', match: () => true },
  { id: 'saas', label: 'SaaS & outreach', match: (id) => /^puck-(starter|leadiq|lead|reach|mono|poster|enterprise|neon|pb-(pro|agency|enterprise|analytics|creator))$/.test(id) },
  { id: 'local', label: 'Local business', match: (id) => /^puck-(local|persona|spark|pb-(eats|auto|health|shop)|pa-(bistro|motors|local|spa|fitness)|pc-gym|pc-(grooming|drone)-short|pd-(grooming|drone|bees)-long|pd-restaurant)$/.test(id) },
  { id: 'real', label: 'Property & travel', match: (id) => /^puck-(pb-agent|pa-(estate|travel)|pc-realestate|realtor|dreamhome)$/.test(id) },
  { id: 'trades', label: 'Home services', match: (id) => /^puck-pc-(plumbing|pest|landscape|cleaning|moving|solar|roofing|hvac|detailing|(septic|radon|crawl|tub|pool)-(long|short))$|^puck-pd-(grease-long|backflow-long|septic-pumping|crawl-worker|crawl-neon)$|^puck-pc-(crawl-beforeafter|septic-elite)$/.test(id) },
  { id: 'care', label: 'Health, beauty & kids', match: (id) => /^puck-pc-(vet|vision|preschool)$/.test(id) || /^puck-pd-(dental|chiro|medspa|salon)$/.test(id) },
  { id: 'more', label: 'Other', match: (id) => /^puck-(pa-(business|learn|creative)|results|pc-insurance)$/.test(id) },
]
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])'

export default function LandingPagePickerModal({ video, onPick, onClose, openStudio, customers: given, preselect }: {
  video: Video | null
  customers?: any[]
  preselect?: 'active' | 'all'
  onPick?: (p: PickedPage) => void
  onClose: () => void
  openStudio?: () => void
}) {
  const [view, setView] = useState<'grid' | 'edit' | 'done'>('grid')
  const [templateId, setTemplateId] = useState('')
  const [q, setQ] = useState('')
  const [chip, setChip] = useState('all')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState<PickedPage | null>(null)
  const [note, setNote] = useState('')
  const data = useRef<any>(null)
  const root = useRef<HTMLDivElement>(null)

  const { customers, activeId, loading } = useCustomers(given)
  const choice = useCustomerChoice(customers, activeId, preselect)
  // The page being edited: the design, with the chosen customer's brand written in when asked for.
  const [session, setSession] = useState<{ cfg: any; applied: string[]; plain: boolean; n: number } | null>(null)
  const template = useMemo(() => TEMPLATES.find((t: any) => t.id === templateId), [templateId])
  const list = useMemo(() => {
    const m = CHIPS.find((c) => c.id === chip) || CHIPS[0]
    const s = q.trim().toLowerCase()
    return (TEMPLATES as any[]).filter((t) => m.match(t.id) && (!s || `${t.name} ${t.description}`.toLowerCase().includes(s)))
  }, [q, chip])

  const pageRow = useMemo(() => ({ id: 'preview', title: video?.title || '', video_url: video?.url || '', poster_url: video?.posterUrl || null }), [video])
  const initial = session?.cfg ?? null
  const one = choice.selected.length === 1 ? choice.selected[0] : null
  const previewTokens = choice.selected.length ? customerTokens(choice.selected[0]) : SAMPLE_TOKENS

  // Esc closes (or goes back); Tab stays inside the dialog; background does not scroll.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); if (view === 'edit' && !busy) setView('grid'); else onClose(); return }
      if (e.key !== 'Tab' || !root.current) return
      const nodes = Array.from(root.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => n.offsetParent !== null)
      if (!nodes.length) return
      const first = nodes[0], last = nodes[nodes.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey, true)
    root.current?.focus()
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', onKey, true) }
  }, [view, busy, onClose])

  const choose = (id: string, plain = false) => {
    const t = (TEMPLATES as any[]).find((x) => x.id === id)
    const withBrand = !!one && choice.brand && !plain
    const withImage = !!one && choice.image && !plain // the picture option works even with the brand option off
    let cfg = defaultConfig(id, { title: video?.title || '', ...(withBrand ? { brand: brandForConfig(one) } : {}) })
    let applied: string[] = []
    if (withBrand || withImage) { const r = applyCustomerToPuck(cfg.puck, one, { useImage: choice.image, brand: withBrand }); cfg = { ...cfg, puck: r.data }; applied = r.applied }
    data.current = cfg.puck || t?.puckData
    setSession((prev) => ({ cfg, applied, plain, n: (prev?.n || 0) + 1 }))
    setTemplateId(id); setError(''); setView('edit')
  }

  const save = async () => {
    if (!video || !initial) return
    setBusy('Saving…'); setError('')
    try {
      const puck = sanitizePuck(data.current) || initial.puck
      const page = await createPage({ title: video.title, videoUrl: video.url, posterUrl: video.posterUrl, source: video.source, config: { ...initial, puck } })
      // one personal link per chosen customer (their own name, company and city on the page)
      const rows = choice.selected.map(toContactFields).filter(Boolean).map((fields: any) => ({ fields }))
      let contacts: any[] = []; let contactError = ''
      if (rows.length) { try { contacts = await addContacts(page.id, rows) } catch (err) { contactError = err instanceof Error ? err.message : 'Could not make the personal links' } }
      const picked: PickedPage = { id: page.id, url: pageUrl(page.id, typeof window !== 'undefined' ? window.location.origin : ''), published: !!page.published, page, contacts, contactError }
      setSaved(picked); setView('done'); onPick?.(picked)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the page')
    } finally { setBusy('') }
  }

  const publish = async () => {
    if (!saved) return
    const tpl: any = template
    const samples = tpl ? sampleSections(saved.page.config?.puck, tpl.puckData, tpl.sampleTypes || []) : []
    if (samples.length && !window.confirm(`${samples.length} section${samples.length === 1 ? ' still uses' : 's still use'} sample content (made-up names, numbers or quotes). Publish anyway?`)) return
    setBusy('Publishing…'); setError('')
    try {
      const page = await updatePage(saved.id, { published: true })
      const next = { ...saved, published: !!page.published, page }
      setSaved(next); onPick?.(next)
      try { await navigator.clipboard.writeText(next.url); setNote('Link copied') } catch { setNote('Published') }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not publish')
    } finally { setBusy('') }
  }

  const copy = useCallback(async () => {
    if (!saved) return
    try { await navigator.clipboard.writeText(saved.url); setNote('Link copied') } catch { setNote('Copy failed') }
  }, [saved])

  const body = (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-xl flex items-center justify-center p-2 md:p-6" onMouseDown={(e) => { if (e.target === e.currentTarget && view !== 'edit') onClose() }}>
      <div ref={root} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Landing pages" className="w-full max-w-7xl h-full max-h-[94vh] flex flex-col rounded-2xl border border-white/10 bg-panel-bg overflow-hidden focus:outline-none">
        <div className="flex items-center gap-3 px-4 md:px-6 py-3 border-b border-white/5">
          {view === 'edit' ? <button type="button" className={ui.ghost} onClick={() => setView('grid')} disabled={!!busy}><ArrowLeft size={14} /> All pages</button> : null}
          <h2 className="text-sm font-black text-white uppercase tracking-widest">{view === 'done' ? 'Page saved' : view === 'edit' ? template?.name : 'Choose a landing page'}</h2>
          <div className="flex-1" />
          {view === 'edit' ? <button type="button" className={ui.primary} disabled={!!busy || !video} onClick={() => void save()}>{busy || 'Save as my page'}</button> : null}
          <button type="button" aria-label="Close" className={ui.ghost} onClick={onClose}><X size={14} /></button>
        </div>
        {error ? <div className="px-4 md:px-6 pt-3"><div className={ui.error}>{error}</div></div> : null}
        {!video ? <div className="px-4 md:px-6 pt-3"><div className={ui.error}>This video can't be used on a page (it needs a permanent https link).</div></div> : null}

        {view === 'grid' ? (
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 md:p-6">
            <CustomerPanel customers={customers} loading={loading} choice={choice} />
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <label className="relative flex-1 min-w-[12rem] max-w-sm">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input className={`${ui.input} pl-9`} placeholder="Search designs" aria-label="Search designs" value={q} onChange={(e) => setQ(e.target.value)} />
              </label>
              {CHIPS.map((c) => <button key={c.id} type="button" aria-pressed={chip === c.id} className={ui.pill(chip === c.id).replace('flex-1 ', 'px-3 ')} onClick={() => setChip(c.id)}>{c.label}</button>)}
            </div>
            {video ? <p className="text-xs text-white/40 mb-4">Click a design to see the full page with your video in it, edit every word, then save.</p> : null}
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {list.map((t: any) => (
                <button key={t.id} type="button" disabled={loading} onClick={() => choose(t.id)} className={`${ui.card} text-left hover:border-primary/50 transition-colors`}>
                  <div className="mb-2"><DesignPreview data={t.puckData} label={t.name} /></div>
                  <div className="text-xs font-bold text-white leading-tight">{t.name}</div>
                  <div className="text-[10px] text-white/40 mt-1 line-clamp-2">{t.description}</div>
                </button>
              ))}
              {!list.length ? <div className="text-xs text-white/40 col-span-full">No designs match.</div> : null}
            </div>
          </div>
        ) : view === 'edit' && initial ? (
          <div className="flex-1 min-h-0 p-3 md:p-4 flex flex-col gap-2">
            <p className="text-xs text-white/40">Click any text to edit it. Use the left panel to add, remove or reorder sections.</p>
            {choice.selected.length ? (
              <p data-personalized-note className="text-xs text-primary flex flex-wrap items-center gap-2">
                <span>
                  {session && !session.plain && one && (choice.brand || choice.image)
                    ? `Personalized for ${one.label}${session.applied.length ? `: ${session.applied.join(', ')} filled in` : ''}. Previewing as ${choice.selected[0].label}.`
                    : one ? `Plain design. Previewing as ${one.label}.` : `${choice.selected.length} personal links will be made when you save. Previewing as ${choice.selected[0].label}.`}
                </span>
                {session && !session.plain && one && (choice.brand || choice.image) ? <button type="button" className="underline text-white" onClick={() => choose(templateId, true)}>Use the plain design</button> : null}
              </p>
            ) : null}
            <div className="hb-puck flex-1 min-h-0 rounded-2xl border border-white/10 overflow-hidden">
              <PageContext.Provider value={{ page: pageRow, tokens: previewTokens, handlers: {}, preview: true }}>
                <Puck key={session?.n} config={puckConfig as any} data={initial.puck} onChange={(d) => { const n = sanitizePuck(d); if (n) data.current = n }} onPublish={() => void save()} />
              </PageContext.Provider>
            </div>
          </div>
        ) : saved ? (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col items-start gap-4 max-w-2xl">
            <div className={ui.ok}>Saved to Video Pages with your video attached{saved.published ? ' and published.' : ' as a draft.'}</div>
            <div className={`${ui.panel} w-full break-all text-xs text-white/70`}>{saved.url}</div>
            {saved.contactError ? <div className="text-sm text-amber-300">The page is saved, but the personal links were not made: {saved.contactError}. Add them from Video Pages &gt; Personal links.</div> : null}
            {saved.contacts?.length ? (
              <div data-personal-links className={`${ui.panel} w-full grid gap-1 text-xs`}>
                <div className="text-white/80">{saved.contacts.length} personal link{saved.contacts.length === 1 ? '' : 's'} (they work once the page is published)</div>
                {saved.contacts.slice(0, 4).map((c: any) => <div key={c.id} className="break-all text-white/50">{[c.fields?.firstname, c.fields?.lastname].filter(Boolean).join(' ') || c.fields?.company || 'Contact'}: {personalUrl(saved.id, c.id, typeof window !== 'undefined' ? window.location.origin : '')}</div>)}
                {saved.contacts.length > 4 ? <div className="text-white/40">and {saved.contacts.length - 4} more</div> : null}
                <button type="button" className={`${ui.ghost} justify-self-start`} onClick={async () => { try { await navigator.clipboard.writeText(exportLinksCsv(saved.contacts, saved.id, window.location.origin)); setNote('Links copied') } catch { setNote('Copy failed') } }}>Copy all links (CSV)</button>
              </div>
            ) : null}
            {note ? <div className="text-xs text-primary font-bold">{note}</div> : null}
            <div className="flex flex-wrap gap-2">
              {saved.published ? <button type="button" className={ui.ghost} onClick={() => void copy()}><Copy size={14} /> Copy link</button> : <button type="button" className={ui.primary} disabled={!!busy} onClick={() => void publish()}>{busy || 'Publish and copy link'}</button>}
              {saved.published ? <a className={ui.ghost} href={pageUrl(saved.id, '')} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} /> Open</a> : null}
              {openStudio ? <button type="button" className={ui.ghost} onClick={() => { onClose(); openStudio() }}>Open in Video Pages</button> : null}
              <button type="button" className={ui.ghost} onClick={onClose}>Done</button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
  return typeof document === 'undefined' ? null : createPortal(body, document.body)
}
