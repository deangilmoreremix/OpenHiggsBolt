'use client'

import { useMemo, useState } from 'react'
import type { Customer } from './useCustomers'
import { ui } from './ui'

/** Which customers a new page is for. Default: the active customer (or the only one); "all" for hand-in contacts. */
export function useCustomerChoice(customers: Customer[], activeId: string, preselect: 'active' | 'all' = 'active') {
  const [touched, setTouched] = useState<Set<string> | null>(null)
  const [brandOn, setBrandOn] = useState(true)
  const chosen = useMemo(() => touched ?? new Set(preselect === 'all' ? customers.map((c) => c.id) : activeId ? [activeId] : customers.length === 1 ? [customers[0].id] : []), [touched, preselect, customers, activeId])
  const selected = useMemo(() => customers.filter((c) => chosen.has(c.id)), [customers, chosen])
  return {
    chosen, selected,
    brand: brandOn && selected.length === 1, brandOn, setBrandOn,
    clear: () => setTouched(new Set()),
    toggle: (id: string) => { const next = new Set(chosen); if (next.has(id)) next.delete(id); else next.add(id); setTouched(next) },
  }
}

export type CustomerChoice = ReturnType<typeof useCustomerChoice>

export default function CustomerPanel({ customers, loading, choice }: { customers: Customer[]; loading: boolean; choice: CustomerChoice }) {
  const n = choice.selected.length
  return (
    <section data-customer-panel className="rounded-xl border border-white/10 bg-white/[0.04] p-3 mb-4" aria-label="Personalize for">
      <div className="text-[11px] font-bold uppercase tracking-widest text-white/60 mb-2">Personalize for</div>
      {loading && !customers.length ? <div className="text-xs text-white/40">Looking for your customers…</div> : null}
      {!loading && !customers.length ? <div className="text-xs text-white/40">No customer found yet. Add one in the Personalization window (Find your business) and it appears here with their logo, colours and details.</div> : null}
      {customers.length ? (
        <>
          <label className="flex items-center gap-2 text-sm text-white/80 mb-1 cursor-pointer">
            <input type="checkbox" data-customer-none checked={n === 0} onChange={choice.clear} /> Nobody (plain design)
          </label>
          <div data-customer-list className="max-h-36 overflow-y-auto grid gap-1 custom-scrollbar">
            {customers.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-sm text-white cursor-pointer">
                <input type="checkbox" data-customer-id={c.id} checked={choice.chosen.has(c.id)} onChange={() => choice.toggle(c.id)} />
                <span>{c.label}</span>
                <span className="text-xs text-white/40">{[c.tokens.firstname && `${c.tokens.firstname} ${c.tokens.lastname || ''}`.trim(), c.tokens.city, c.source === 'lead' ? 'lead' : ''].filter(Boolean).join(' · ')}</span>
              </label>
            ))}
          </div>
          <label className={`flex items-center gap-2 text-xs mt-2 cursor-pointer ${n === 1 ? '' : 'opacity-50'}`}>
            <input type="checkbox" data-customer-brand disabled={n !== 1} checked={choice.brand} onChange={(e) => choice.setBrandOn(e.target.checked)} /> Write their logo, colour, name and details into the page
          </label>
          <div className={`${ui.label} mt-1 normal-case tracking-normal`}>
            {n === 0 ? 'The design is used as is.' : n === 1 ? 'A personal link is made for them, so their name, company and city fill in on the page.' : `One page, ${n} personal links (their own name, company and city on each). The page itself stays generic.`}
          </div>
        </>
      ) : null}
    </section>
  )
}
