'use client'

import { useCallback, useEffect, useState } from 'react'
import { syncConnect, syncDisconnect, syncGroups, syncPush, syncStatus } from '@/src/lib/landingPages/api.js'
import { ui } from './ui'

type Group = { id: string; name: string }

/** Send this page's contacts (with their personal links) to your MailerLite account. The key is stored encrypted on the server. */
export default function SyncPanel({ pageId, contactsWithEmail }: { pageId: string; contactsWithEmail: number }) {
  const [status, setStatus] = useState<{ connected: boolean; masked: string } | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [group, setGroup] = useState('')
  const [token, setToken] = useState('')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)

  const load = useCallback(async () => {
    try {
      const s = await syncStatus()
      setStatus(s)
      if (s.connected) setGroups(await syncGroups().catch(() => []))
    } catch (err) {
      setStatus({ connected: false, masked: '' })
      setNote({ kind: 'error', text: err instanceof Error && err.message ? err.message : 'Could not load the MailerLite connection.' })
    }
  }, [])
  useEffect(() => { void load() }, [load])

  const connect = async () => {
    setBusy(true); setNote(null)
    try {
      await syncConnect(token.trim())
      setToken('')
      await load()
      setNote({ kind: 'ok', text: 'MailerLite connected.' })
    } catch (err) {
      setNote({ kind: 'error', text: err instanceof Error ? err.message : 'Could not connect' })
    } finally { setBusy(false) }
  }

  const disconnect = async () => {
    if (!window.confirm('Disconnect MailerLite? Your saved token is deleted.')) return
    try { await syncDisconnect(); setGroups([]); setStatus({ connected: false, masked: '' }) } catch (err) { setNote({ kind: 'error', text: err instanceof Error ? err.message : 'Could not disconnect' }) }
  }

  const push = async () => {
    setBusy(true); setNote(null)
    let pushed = 0; let failed = 0; let offset: number | null = 0; let limited = false
    try {
      while (offset !== null) {
        const res: { pushed: number; failed: unknown[]; rateLimited: boolean; next: number | null } = await syncPush(pageId, group, offset)
        pushed += res.pushed; failed += res.failed.length
        if (res.rateLimited) { limited = true; break }
        offset = res.next
      }
      setNote({ kind: failed || limited ? 'error' : 'ok', text: `Sent ${pushed} contact${pushed === 1 ? '' : 's'} to MailerLite${failed ? `, ${failed} not sent` : ''}${limited ? '. MailerLite is rate limiting; try the rest in a minute.' : '.'} Use the "video page url" field in your email.` })
    } catch (err) {
      setNote({ kind: 'error', text: err instanceof Error ? err.message : 'Sync failed' })
    } finally { setBusy(false) }
  }

  return (
    <div className={ui.panel}>
      <div className={`${ui.label} mb-2`}>MailerLite</div>
      {note ? <div className={`${note.kind === 'ok' ? ui.ok : ui.error} mb-3`}>{note.text}</div> : null}
      {!status ? <div className="text-xs text-white/40">Loading…</div> : null}
      {status && !status.connected ? (
        <div className="flex flex-col gap-2 max-w-xl">
          <p className="text-xs text-white/50">Paste a MailerLite API token (MailerLite → Integrations → API). It is stored encrypted and only used to send your contacts.</p>
          <div className="flex gap-2">
            <input className={ui.input} type="password" autoComplete="off" placeholder="MailerLite API token" value={token} onChange={(e) => setToken(e.target.value)} />
            <button type="button" className={ui.primary} disabled={busy || token.trim().length < 20} onClick={() => void connect()}>Connect</button>
          </div>
        </div>
      ) : null}
      {status?.connected ? (
        <div className="flex flex-col gap-3">
          <div className="text-xs text-white/60">Connected ({status.masked}). <button type="button" className={ui.danger} onClick={() => void disconnect()}>Disconnect</button></div>
          <div className="flex flex-wrap items-center gap-2">
            <select aria-label="MailerLite group" className={`${ui.input} max-w-xs`} value={group} onChange={(e) => setGroup(e.target.value)}>
              <option value="">No group</option>
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <button type="button" className={ui.primary} disabled={busy || !contactsWithEmail} onClick={() => void push()}>{busy ? 'Sending…' : `Send ${contactsWithEmail} contact${contactsWithEmail === 1 ? '' : 's'}`}</button>
          </div>
          <p className="text-[11px] text-white/40">Each subscriber gets their personal link in a custom field called “video page url”, so your email can use it. Only contacts with an email are sent.</p>
        </div>
      ) : null}
    </div>
  )
}
