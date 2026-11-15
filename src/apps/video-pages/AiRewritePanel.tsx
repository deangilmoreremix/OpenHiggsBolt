'use client'

import { useState } from 'react'
import { Sparkles, Undo2 } from 'lucide-react'
import { applyChanges, proposeRewrite, sectionList } from '@/src/lib/landingPages/rewrite.js'
import { ui } from './ui'

type Change = { id: string; path: (string | number)[]; section: number; text: string; after: string }

/**
 * Rewrite the page's WORDS with AI. Only text values are sent and written back; sections, layout, links,
 * images and form fields are untouched. You review every change before it is applied, and can undo.
 */
export default function AiRewritePanel({ getData, applyData, context }: { getData: () => any; applyData: (d: any) => void; context: string }) {
  const [open, setOpen] = useState(false)
  const [scope, setScope] = useState('')
  const [instruction, setInstruction] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [needKey, setNeedKey] = useState(false)
  const [proposal, setProposal] = useState<{ changes: Change[]; skipped: number } | null>(null)
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [before, setBefore] = useState<any>(null)
  const [done, setDone] = useState('')

  const sections = open ? (sectionList(getData()) as { index: number; label: string; count: number }[]) : []

  const run = async () => {
    setBusy(true); setError(''); setNeedKey(false); setDone(''); setProposal(null)
    try {
      const r = await proposeRewrite(getData(), { section: scope === '' ? null : Number(scope), instruction: instruction.trim(), context })
      setProposal(r)
      setPicked(new Set(r.changes.map((c: Change) => c.id)))
    } catch (err: any) {
      if (err?.code === 'OPENAI_KEY_REQUIRED') setNeedKey(true)
      setError(err?.message || 'The AI rewrite failed.')
    } finally { setBusy(false) }
  }

  const apply = () => {
    if (!proposal) return
    const chosen = proposal.changes.filter((c) => picked.has(c.id))
    if (!chosen.length) { setProposal(null); return }
    setBefore(JSON.parse(JSON.stringify(getData())))
    applyData(applyChanges(getData(), chosen))
    setDone(`Applied ${chosen.length} change${chosen.length === 1 ? '' : 's'}. Save to keep them.`)
    setProposal(null)
  }

  const undo = () => {
    if (!before) return
    applyData(before); setBefore(null); setDone('Restored the text from before the rewrite.')
  }

  return (
    <div className={ui.panel}>
      <button type="button" className="flex w-full items-center gap-2 text-left text-sm font-bold text-primary" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <Sparkles size={14} /> Rewrite with AI
      </button>
      {open ? (
        <div className="mt-3 flex flex-col gap-3">
          <p className="text-xs text-white/50">Rewrites the words only (headlines, buttons, text, names, quotes, numbers). Sections, layout, links, images and form fields stay exactly as they are. You review every change before it is applied. Uses your own OpenAI key.</p>
          <div className="flex flex-wrap items-end gap-2">
            <select aria-label="What to rewrite" className={`${ui.input} max-w-xs`} value={scope} onChange={(e) => setScope(e.target.value)}>
              <option value="">Whole page</option>
              {sections.filter((s) => s.count).map((s) => <option key={s.index} value={String(s.index)}>{`${s.index + 1}. ${s.label} (${s.count} texts)`}</option>)}
            </select>
            <input className={`${ui.input} flex-1 min-w-[16rem]`} maxLength={300} placeholder="What should change? e.g. friendlier, for dentists in Texas, shorter" value={instruction} onChange={(e) => setInstruction(e.target.value)} />
            <button type="button" className={ui.primary} disabled={busy} onClick={() => void run()}>{busy ? 'Rewriting…' : 'Rewrite'}</button>
            {before ? <button type="button" className={ui.ghost} onClick={undo}><Undo2 size={14} /> Undo last rewrite</button> : null}
          </div>
          {error ? <div className={ui.error}>{error}{needKey ? ' Open Settings from the top bar to add it.' : ''}</div> : null}
          {done ? <div className={ui.ok}>{done}</div> : null}
          {proposal ? (
            proposal.changes.length ? (
              <div className="flex flex-col gap-2">
                <div className="max-h-72 overflow-y-auto custom-scrollbar rounded-lg border border-white/10 p-2 flex flex-col gap-1">
                  {proposal.changes.map((c) => (
                    <label key={c.id} className="flex cursor-pointer items-start gap-2 rounded p-1 hover:bg-white/5 text-xs">
                      <input type="checkbox" checked={picked.has(c.id)} onChange={() => setPicked((p) => { const n = new Set(p); if (n.has(c.id)) n.delete(c.id); else n.add(c.id); return n })} />
                      <span className="min-w-0">
                        <span className="block text-white/40 line-through break-words">{c.text}</span>
                        <span className="block text-primary break-words">{c.after}</span>
                      </span>
                    </label>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" className={ui.primary} disabled={!picked.size} onClick={apply}>{`Apply ${picked.size} change${picked.size === 1 ? '' : 's'}`}</button>
                  <button type="button" className={ui.ghost} onClick={() => setProposal(null)}>Discard</button>
                  {proposal.skipped ? <span className="text-[11px] text-white/40">{proposal.skipped} text{proposal.skipped === 1 ? '' : 's'} kept as they were (the AI broke a {'{{token}}'} or marker).</span> : null}
                </div>
              </div>
            ) : <div className="text-xs text-amber-300">The AI returned nothing usable. Try a different instruction.</div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
