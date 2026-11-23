'use client'

import { useEffect, useMemo, useState } from 'react'
import { fetchContactStats, fetchPageHeat, listContacts } from '@/src/lib/landingPages/api.js'
import { heatCells } from '@/src/lib/landingPages/heat.js'
import { pageUrl } from '@/src/lib/landingPages/ids.js'
import { ui } from './ui'

type Heat = {
  clicks: { cx: number; cy: number; clicks: number; sessions: number }[]
  scroll: { depth: number; sessions: number; totalSessions: number }[]
  watch: { sec: number; plays: number; sessions: number }[]
  contacts: { contactId: string; sessions: number; clicks: number; maxScroll: number; watchedSeconds: number; lastSeen: string | null }[]
}
type View = 'clicks' | 'scroll' | 'watch' | 'contacts'
const WIDTH: Record<string, number> = { all: 1280, desktop: 1280, tablet: 768, mobile: 390 }
const NEED_MORE = 'Not enough visits yet. A spot or second appears once at least 3 different visitors reached it, so no single visitor can be picked out.'

/** Heat maps for a page: clicks over the live page, scroll depth, video watched, and one row per personal link. */
export default function HeatPanel({ pageId, published }: { pageId: string; published: boolean }) {
  const [view, setView] = useState<View>('clicks')
  const [viewport, setViewport] = useState('all')
  const [days, setDays] = useState(30)
  const [heat, setHeat] = useState<Heat | null>(null)
  const [people, setPeople] = useState<{ stats: any[]; contacts: any[] }>({ stats: [], contacts: [] })
  const [error, setError] = useState('')
  useEffect(() => {
    if (!published) return
    let live = true
    setHeat(null); setError('')
    Promise.all([fetchPageHeat(pageId, { days, viewport }), fetchContactStats(pageId).catch(() => []), listContacts(pageId).catch(() => [])])
      .then(([h, stats, contacts]) => { if (live) { setHeat(h); setPeople({ stats, contacts }) } })
      .catch((e: Error) => { if (live) setError(e.message) })
    return () => { live = false }
  }, [pageId, published, days, viewport])

  if (!published) return <p className="text-xs text-white/40">Publish the page to start collecting heat maps. Visitors on the public page are sampled; the editor preview is not.</p>
  return (
    <section className={`${ui.panel} flex flex-col gap-3`}>
      <h3 className="text-sm font-extrabold uppercase tracking-wide text-white">Heat maps</h3>
      <div className="flex flex-wrap items-center gap-2">
        {([['clicks', 'Clicks'], ['scroll', 'Scroll depth'], ['watch', 'Video watched'], ['contacts', 'Personal links']] as [View, string][]).map(([id, label]) => (
          <button key={id} type="button" className={ui.pill(view === id)} style={{ flex: 'none', padding: '0.4rem 0.75rem' }} onClick={() => setView(id)}>{label}</button>
        ))}
        <select className={`${ui.input} max-w-[10rem]`} value={viewport} onChange={(e) => setViewport(e.target.value)} aria-label="Device">
          {[['all', 'All devices'], ['desktop', 'Desktop'], ['tablet', 'Tablet'], ['mobile', 'Mobile']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select className={`${ui.input} max-w-[10rem]`} value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label="Time range">
          {[[7, 'Last 7 days'], [30, 'Last 30 days'], [90, 'Last 90 days']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      {error ? <div className={ui.error}>{error}</div> : !heat ? <div className="text-xs text-white/40">Loading…</div> : view === 'clicks' ? <ClickMap pageId={pageId} rows={heat.clicks} viewport={viewport} /> : view === 'scroll' ? <ScrollBars rows={heat.scroll} /> : view === 'watch' ? <WatchBars rows={heat.watch} /> : <PeopleTable heat={heat.contacts} {...people} />}
    </section>
  )
}

function ClickMap({ pageId, rows, viewport }: { pageId: string; rows: Heat['clicks']; viewport: string }) {
  const cells = useMemo(() => heatCells(rows), [rows])
  const [h, setH] = useState(1600)
  if (!cells.length) return <p className="text-sm text-white/40">{NEED_MORE}</p>
  const w = WIDTH[viewport] || 1280
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-white/40">{cells.reduce((n, c) => n + c.clicks, 0)} clicks in {cells.length} hot spot{cells.length === 1 ? '' : 's'}. Warmer = more clicks. Only spots with 3 or more visitors are shown.</p>
      <div className="overflow-auto rounded-xl border border-white/10 bg-black" style={{ maxHeight: '70vh' }}>
        <div className="relative mx-auto" style={{ width: w }}>
          <iframe title="Your page" src={`${pageUrl(pageId)}?embed=1`} style={{ width: w, height: h, border: 0, display: 'block' }}
            onLoad={(e) => { try { setH((e.currentTarget.contentDocument as Document).documentElement.scrollHeight) } catch { /* keep the default height */ } }} />
          <div className="absolute inset-0 pointer-events-none">
            {cells.map((c) => (
              <div key={`${c.left}-${c.top}`} title={`${c.clicks} click${c.clicks === 1 ? '' : 's'} from ${c.sessions} visitors`}
                style={{ position: 'absolute', left: `${c.left}%`, top: `${c.top}%`, width: `${c.size}%`, height: `${c.size}%`, borderRadius: '50%', transform: `scale(${1.6 + c.weight})`,
                  background: `radial-gradient(circle, rgba(255,60,40,${0.25 + 0.6 * c.weight}), rgba(255,200,0,${0.12 + 0.3 * c.weight}) 60%, transparent 72%)` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ScrollBars({ rows }: { rows: Heat['scroll'] }) {
  if (!rows.length) return <p className="text-sm text-white/40">{NEED_MORE}</p>
  const total = rows[0].totalSessions || 0
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs text-white/40">{total} visitors. Each bar is the share who scrolled at least that far.</p>
      {rows.map((r) => { const pct = total ? Math.round((r.sessions / total) * 100) : 0; return (
        <div key={r.depth} className="flex items-center gap-2 text-xs text-white/60">
          <span className="w-10">{r.depth}%</span><div className="flex-1 h-3 rounded bg-white/10 overflow-hidden"><div className="h-full bg-primary" style={{ width: `${pct}%` }} /></div><span className="w-10 text-right">{pct}%</span>
        </div>) })}
    </div>
  )
}

function WatchBars({ rows }: { rows: Heat['watch'] }) {
  if (!rows.length) return <p className="text-sm text-white/40">{NEED_MORE}</p>
  const max = Math.max(1, ...rows.map((r) => r.sessions))
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-white/40">How many visitors watched each second of the video. Dips show where people leave or skip.</p>
      <div className="flex items-end gap-px h-32 overflow-x-auto">
        {rows.slice(0, 600).map((r) => <div key={r.sec} title={`${r.sec}s: ${r.sessions} visitors`} className="bg-primary/80 min-w-[3px] flex-1" style={{ height: `${Math.max(4, (r.sessions / max) * 100)}%` }} />)}
      </div>
    </div>
  )
}

/** One row per personal link: views, watch time, scroll, clicks and leads. Exported for the unit test. */
export function peopleRows(heat: Heat['contacts'], stats: any[], contacts: any[]) {
  const names = new Map(contacts.map((c) => [c.id, [c.fields?.firstname, c.fields?.lastname].filter(Boolean).join(' ') || c.fields?.company || `Link ${String(c.id).slice(0, 6)}`]))
  const h = new Map(heat.map((x) => [x.contactId, x])); const s = new Map(stats.map((x) => [x.contactId, x]))
  return [...new Set([...h.keys(), ...s.keys()])].map((id) => {
    const a: any = h.get(id) || {}; const b: any = s.get(id) || {}
    return { contactId: id, who: names.get(id) || `Link ${String(id).slice(0, 6)}`, views: b.views || 0, plays: b.plays || 0, watchedSeconds: a.watchedSeconds || 0, maxScroll: a.maxScroll || 0, clicks: a.clicks || 0, completed: b.completes || 0, leads: b.leads || 0, lastSeen: a.lastSeen || b.lastSeen || null }
  }).sort((x, y) => String(y.lastSeen || '').localeCompare(String(x.lastSeen || '')))
}

function PeopleTable({ heat, stats, contacts }: { heat: Heat['contacts']; stats: any[]; contacts: any[] }) {
  const rows = useMemo(() => peopleRows(heat, stats, contacts), [heat, stats, contacts])
  if (!rows.length) return <p className="text-sm text-white/40">No one has opened a personal link yet. Each link's views, watch time, scroll, clicks and leads show here.</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-white/80">
        <thead><tr className="text-[11px] uppercase tracking-wide text-white/40">{['Who', 'Views', 'Plays', 'Seconds watched', 'Scrolled', 'Clicks', 'Watched to end', 'Leads', 'Last seen'].map((c) => <th key={c} className="px-2 py-1 whitespace-nowrap">{c}</th>)}</tr></thead>
        <tbody>{rows.map((r) => (
          <tr key={r.contactId} className="border-t border-white/5">{[r.who, r.views, r.plays, r.watchedSeconds, `${r.maxScroll}%`, r.clicks, r.completed, r.leads, r.lastSeen ? new Date(r.lastSeen).toLocaleString() : ''].map((v, i) => <td key={i} className="px-2 py-1 whitespace-nowrap">{String(v)}</td>)}</tr>
        ))}</tbody>
      </table>
    </div>
  )
}
