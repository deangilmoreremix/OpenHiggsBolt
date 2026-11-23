'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Copy, Download, ExternalLink, Trash2, Upload } from 'lucide-react'
import { addContacts, fetchContactStats, listContacts, removeContact } from '@/src/lib/landingPages/api.js'
import { buildContacts, CONTACT_FIELDS, contactLabel, exportLinksCsv, guessMapping, MAX_CONTACTS_PER_IMPORT, parseCsv } from '@/src/lib/landingPages/csv.js'
import { personalUrl } from '@/src/lib/landingPages/ids.js'
import SyncPanel from './SyncPanel'
import { ui } from './ui'

type Contact = { id: string; fields: Record<string, string>; created_at: string }
type Activity = { contactId: string; views: number; plays: number; maxProgress: number; ctaClicks: number; leads: number; lastSeen: string | null }

const FIELD_LABELS: Record<string, string> = { firstname: 'First name', lastname: 'Last name', company: 'Company', companylogo: 'Company logo (https)', role: 'Role', city: 'City', custom1: 'Custom 1', custom2: 'Custom 2', custom3: 'Custom 3 (or a personal picture link)', email: 'Email' }

/** Personal links: one link per contact (/p/<id>?c=<contact>), CSV import, export and who watched. */
export default function ContactsTab({ pageId, published }: { pageId: string; published: boolean }) {
  const [contacts, setContacts] = useState<Contact[] | null>(null)
  const [activity, setActivity] = useState<Record<string, Activity>>({})
  const [csv, setCsv] = useState<{ headers: string[]; rows: string[][] } | null>(null)
  const [mapping, setMapping] = useState<string[]>([])
  const [note, setNote] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [one, setOne] = useState({ firstname: '', company: '', email: '' })
  const fileRef = useRef<HTMLInputElement>(null)
  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  const refresh = useCallback(async () => {
    try {
      const [rows, stats] = await Promise.all([listContacts(pageId), fetchContactStats(pageId).catch(() => [])])
      setContacts(rows)
      setActivity(Object.fromEntries((stats as Activity[]).map((s) => [s.contactId, s])))
    } catch (err) {
      setContacts([])
      setNote({ kind: 'error', text: err instanceof Error ? err.message : 'Could not load contacts' })
    }
  }, [pageId])
  useEffect(() => { void refresh() }, [refresh])

  const existing = useMemo(() => new Set((contacts || []).map((c) => (c.fields.email || '').toLowerCase()).filter(Boolean)), [contacts])
  const preview = useMemo(() => (csv ? buildContacts(csv.rows, mapping, { existing }) : null), [csv, mapping, existing])

  const readFile = async (file?: File | null) => {
    if (!file) return
    const parsed = parseCsv(await file.text())
    if (!parsed.headers.length || !parsed.rows.length) { setNote({ kind: 'error', text: 'That file has no rows. Use a CSV with a header row.' }); return }
    setCsv(parsed); setMapping(guessMapping(parsed.headers)); setNote(null)
  }

  const importAll = async () => {
    if (!preview?.contacts.length) return
    setBusy(true); setNote(null)
    try {
      const added = await addContacts(pageId, preview.contacts)
      setNote({ kind: 'ok', text: `Added ${added.length} contact${added.length === 1 ? '' : 's'}, each with a personal link.` })
      setCsv(null)
      await refresh()
    } catch (err) {
      setNote({ kind: 'error', text: err instanceof Error ? err.message : 'Import failed' })
    } finally { setBusy(false) }
  }

  const addOne = async () => {
    setBusy(true); setNote(null)
    try {
      await addContacts(pageId, [{ fields: one }])
      setOne({ firstname: '', company: '', email: '' })
      await refresh()
    } catch (err) {
      setNote({ kind: 'error', text: err instanceof Error ? err.message : 'Could not add the contact' })
    } finally { setBusy(false) }
  }

  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); setNote({ kind: 'ok', text: 'Link copied' }) } catch { setNote({ kind: 'error', text: 'Copy failed' }) }
  }

  const exportCsv = () => {
    const blob = new Blob([exportLinksCsv(contacts || [], pageId, origin)], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = 'personal-links.csv'; a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }

  const remove = async (id: string) => {
    if (!window.confirm('Remove this contact? Their personal link will stop showing their name.')) return
    try { await removeContact(pageId, id); await refresh() } catch (err) { setNote({ kind: 'error', text: err instanceof Error ? err.message : 'Could not remove' }) }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-white/40">Each contact gets their own link. Their name and company fill the page's {'{{tokens}}'}, and you see who watched. {published ? '' : 'Publish the page first so the links work.'}</p>
      {note ? <div className={note.kind === 'ok' ? ui.ok : ui.error}>{note.text}</div> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className={ui.panel}>
          <div className={`${ui.label} mb-2`}>Import a CSV</div>
          <input ref={fileRef} type="file" accept=".csv,text/csv,text/plain" className="hidden" onChange={(e) => void readFile(e.target.files?.[0])} />
          <button type="button" className={ui.ghost} onClick={() => fileRef.current?.click()}><Upload size={14} /> Choose a CSV file</button>
          <p className="text-[11px] text-white/40 mt-2">Up to {MAX_CONTACTS_PER_IMPORT} rows. Columns like first name, company and email are matched for you.</p>
          {csv ? (
            <div className="mt-3 flex flex-col gap-2">
              {csv.headers.map((h, i) => (
                <label key={i} className="flex items-center gap-2 text-xs text-white/70">
                  <span className="w-1/3 truncate" title={h}>{h || `Column ${i + 1}`}</span>
                  <select className={ui.input} value={mapping[i] || ''} onChange={(e) => setMapping((m) => m.map((v, j) => (j === i ? e.target.value : v)))}>
                    <option value="">Ignore</option>
                    {CONTACT_FIELDS.map((f: string) => <option key={f} value={f}>{FIELD_LABELS[f] || f}</option>)}
                  </select>
                </label>
              ))}
              {preview ? (
                <div className="text-xs text-white/60">
                  {preview.contacts.length} ready to import{preview.skipped.length ? `, ${preview.skipped.length} skipped (${[...new Set(preview.skipped.map((s: { reason: string }) => s.reason))].join(', ')})` : ''}.
                </div>
              ) : null}
              <div className="flex gap-2">
                <button type="button" className={ui.primary} disabled={busy || !preview?.contacts.length} onClick={() => void importAll()}>{busy ? 'Importing…' : `Import ${preview?.contacts.length || 0}`}</button>
                <button type="button" className={ui.ghost} onClick={() => setCsv(null)}>Cancel</button>
              </div>
            </div>
          ) : null}
        </div>
        <div className={ui.panel}>
          <div className={`${ui.label} mb-2`}>Add one contact</div>
          <div className="grid grid-cols-3 gap-2">
            <input className={ui.input} placeholder="First name" value={one.firstname} onChange={(e) => setOne({ ...one, firstname: e.target.value })} />
            <input className={ui.input} placeholder="Company" value={one.company} onChange={(e) => setOne({ ...one, company: e.target.value })} />
            <input className={ui.input} placeholder="Email" value={one.email} onChange={(e) => setOne({ ...one, email: e.target.value })} />
          </div>
          <button type="button" className={`${ui.ghost} mt-2`} disabled={busy || !(one.firstname || one.company || one.email)} onClick={() => void addOne()}>Add contact</button>
        </div>
      </div>

      <SyncPanel pageId={pageId} contactsWithEmail={(contacts || []).filter((c) => c.fields.email).length} />

      <div className={ui.panel}>
        <div className="flex items-center justify-between mb-3">
          <div className={ui.label}>{contacts ? `${contacts.length} contact${contacts.length === 1 ? '' : 's'}` : 'Contacts'}</div>
          <button type="button" className={ui.ghost} disabled={!contacts?.length} onClick={exportCsv}><Download size={14} /> Export links (CSV)</button>
        </div>
        {contacts === null ? <div className="text-xs text-white/40">Loading…</div> : null}
        {contacts && !contacts.length ? <div className="text-xs text-white/40">No contacts yet. Import a CSV or add one above.</div> : null}
        <div className="flex flex-col divide-y divide-white/5">
          {(contacts || []).map((c) => {
            const a = activity[c.id]
            return (
              <div key={c.id} className="flex flex-wrap items-center gap-3 py-2 text-xs">
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-white truncate">{contactLabel(c)}</div>
                  <div className="text-white/40 truncate">{[c.fields.company, c.fields.email].filter(Boolean).join(' · ')}</div>
                </div>
                <div className="text-white/50 w-56">
                  {a ? `${a.views} view${a.views === 1 ? '' : 's'} · ${a.maxProgress}% watched${a.ctaClicks ? ` · ${a.ctaClicks} click${a.ctaClicks === 1 ? '' : 's'}` : ''}${a.leads ? ' · lead' : ''}` : 'Not opened yet'}
                </div>
                <button type="button" className={ui.ghost} onClick={() => void copy(personalUrl(pageId, c.id, origin))}><Copy size={12} /> Copy link</button>
                <a className={ui.ghost} href={personalUrl(pageId, c.id, '')} target="_blank" rel="noopener noreferrer"><ExternalLink size={12} /> Preview</a>
                <button type="button" aria-label="Remove contact" className="text-red-400 hover:text-red-300" onClick={() => void remove(c.id)}><Trash2 size={14} /></button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
