'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { fetchPageStats, getFormSettings, listPageLeads, saveFormSettings, testFormWebhooks } from '@/src/lib/landingPages/api.js'
import { ui } from './ui'

type Lead = { id: string; contactId: string | null; who: string; createdAt: string; answers: Record<string, string> }
type Settings = { webhookEnabled: boolean; webhook: string; webhook2: string; webhook3: string; emailEnabled: boolean; emailAddress: string; emailAddress2: string; emailAddress3: string; espProvider: string; espListId: string }

const csvCell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
export const leadsCsv = (rows: Lead[]) => {
  if (!rows.length) return ''
  const keys = Array.from(new Set(rows.flatMap((r) => Object.keys(r.answers))))
  const head = ['When', 'Who', 'Personal link', ...keys]
  return [head.map(csvCell).join(','), ...rows.map((r) => [r.createdAt, r.who, r.contactId || '', ...keys.map((k) => r.answers[k] ?? '')].map(csvCell).join(','))].join('\r\n')
}

/** Leads from this page, matched to the personal link they came from, plus where each lead is delivered. */
export default function LeadsTab({ pageId, published }: { pageId: string; published: boolean }) {
  const [leads, setLeads] = useState<Lead[] | null>(null)
  const [views, setViews] = useState(0)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  useEffect(() => {
    let live = true
    Promise.all([listPageLeads(pageId), fetchPageStats(pageId).catch(() => null)])
      .then(([rows, stats]: [Lead[], { views: number } | null]) => { if (live) { setLeads(rows); setViews(stats?.views || 0) } })
      .catch((e: Error) => { if (live) setError(e.message) })
    return () => { live = false }
  }, [pageId])

  const shown = useMemo(() => (leads || []).filter((r) => !query.trim() || `${r.who} ${Object.values(r.answers).join(' ')}`.toLowerCase().includes(query.trim().toLowerCase())), [leads, query])
  const cols = useMemo(() => Array.from(new Set(shown.flatMap((r) => Object.keys(r.answers)))).slice(0, 8), [shown])
  const download = () => {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([leadsCsv(leads || [])], { type: 'text/csv' })); a.download = `leads-${pageId}.csv`; a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 5000)
  }
  if (error) return <div className={ui.error}>{error}</div>
  if (!leads) return <div className="text-xs text-white/40">Loading…</div>
  const personal = leads.filter((l) => l.contactId).length
  const kpis: [string, string | number][] = [['Leads', leads.length], ['From personal links', personal], ['Direct visits', leads.length - personal], ['Of viewers signed up', views ? `${Math.min(100, Math.round((leads.length / views) * 100))}%` : '–']]
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        {kpis.map(([k, v]) => <div key={k} className={ui.card}><div className={ui.label}>{k}</div><div className="text-2xl font-black text-white mt-1">{v}</div></div>)}
      </div>
      {!published ? <p className="text-xs text-white/40">Publish the page to start collecting leads.</p> : null}
      <section className={`${ui.panel} flex flex-col gap-3`}>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="flex-1 text-sm font-extrabold uppercase tracking-wide text-white">Leads from this page</h3>
          <input className={`${ui.input} max-w-[12rem]`} placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search leads" />
          <button type="button" className={ui.ghost} disabled={!leads.length} onClick={download}><Download size={13} /> CSV</button>
        </div>
        {!shown.length ? <p className="text-sm text-white/40">{leads.length ? 'No leads match.' : 'No leads yet. Form answers appear here, matched to the personal link they came from.'}</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-white/80">
              <thead><tr className="text-[11px] uppercase tracking-wide text-white/40"><th className="px-2 py-1">When</th><th className="px-2 py-1">Who</th>{cols.map((c) => <th key={c} className="px-2 py-1 whitespace-nowrap">{c}</th>)}</tr></thead>
              <tbody>{shown.map((r) => (
                <tr key={r.id} className="border-t border-white/5">
                  <td className="px-2 py-1 whitespace-nowrap text-white/40">{new Date(r.createdAt).toLocaleString()}</td>
                  <td className="px-2 py-1 whitespace-nowrap">{r.who}</td>
                  {cols.map((c) => <td key={c} className="px-2 py-1">{r.answers[c] ?? ''}</td>)}
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
      <DeliveryCard pageId={pageId} />
    </div>
  )
}

function DeliveryCard({ pageId }: { pageId: string }) {
  const [s, setS] = useState<Settings | null>(null)
  const [status, setStatus] = useState('')
  useEffect(() => { let live = true; getFormSettings(pageId).then((v: Settings) => { if (live) setS(v) }).catch((e: Error) => { if (live) setStatus(e.message) }); return () => { live = false } }, [pageId])
  const set = useCallback((k: keyof Settings, v: string | boolean) => setS((cur) => (cur ? { ...cur, [k]: v } : cur)), [])
  if (!s) return <div className="text-xs text-white/40">{status || 'Loading delivery settings…'}</div>
  const text = (k: keyof Settings, label: string, type = 'text', placeholder = '') => (
    <label className="flex flex-col gap-1"><span className={ui.label}>{label}</span><input className={ui.input} type={type} placeholder={placeholder} value={String(s[k] ?? '')} onChange={(e) => set(k, e.target.value)} data-key={k} /></label>
  )
  const check = (k: keyof Settings, label: string) => (<label className="flex items-center gap-2 text-sm text-white"><input type="checkbox" checked={!!s[k]} onChange={(e) => set(k, e.target.checked)} data-key={k} />{label}</label>)
  const save = async () => { try { setS(await saveFormSettings(pageId, s)); setStatus('Saved.') } catch (e) { setStatus((e as Error).message) } }
  const test = async () => {
    setStatus('Sending a test…')
    try {
      const r: { host: string; ok: boolean; status: number | null; error: string | null }[] = await testFormWebhooks(pageId)
      setStatus(r.map((x) => (x.ok ? `✓ ${x.host}` : `✗ ${x.host} (${x.error || `HTTP ${x.status}`})`)).join(' · '))
    } catch (e) { setStatus((e as Error).message) }
  }
  return (
    <details className={ui.panel}>
      <summary className="cursor-pointer text-sm font-extrabold uppercase tracking-wide text-white">Where leads go</summary>
      <div className="flex flex-col gap-3 mt-3">
        <p className="text-xs text-white/40">Every lead is saved here first. Webhooks run after it is saved, signed and retried. Addresses are private to you and never appear on the public page.</p>
        {check('webhookEnabled', 'Send each lead to a webhook')}
        {text('webhook', 'Webhook address (https)', 'url', 'https://hooks.example.com/…')}
        {text('webhook2', 'Webhook address 2 (optional)', 'url')}
        {text('webhook3', 'Webhook address 3 (optional)', 'url')}
        <div className="flex flex-wrap gap-2">
          <button type="button" className={ui.primary} onClick={() => void save()}>Save</button>
          <button type="button" className={ui.ghost} onClick={() => void test()}>Test webhook</button>
        </div>
        {status ? <p className="text-xs text-white/60" role="status">{status}</p> : null}
        <p className="text-[11px] text-white/30">E-mail notifications and Kit / MailerLite list delivery are available for pages managed in the timeline editor app; here webhooks are supported.</p>
      </div>
    </details>
  )
}
