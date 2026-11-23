'use client'

import { useEffect, useState } from 'react'
import { fetchPageStats } from '@/src/lib/landingPages/api.js'
import HeatPanel from './HeatPanel'
import { ui } from './ui'

type Stats = { views: number; plays: number; completes: number; ctaClicks: number; leads: number; uniqueContacts: number; likes: number }

export default function AnalyticsTab({ pageId, published = true }: { pageId: string; published?: boolean }) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let live = true
    fetchPageStats(pageId).then((s: Stats) => { if (live) setStats(s) }).catch((e: Error) => { if (live) setError(e.message) })
    return () => { live = false }
  }, [pageId])

  if (error) return <div className={ui.error}>{error}</div>
  if (!stats) return <div className="text-xs text-white/40">Loading…</div>
  const rate = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : '–')
  const cards: [string, string | number][] = [
    ['Views', stats.views], ['Plays', stats.plays], ['Play rate', rate(stats.plays, stats.views)], ['Completed', stats.completes],
    ['Button clicks', stats.ctaClicks], ['Leads', stats.leads], ['Likes', stats.likes], ['People (personal links)', stats.uniqueContacts],
  ]
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        {cards.map(([label, value]) => (
          <div key={label} className={ui.card}>
            <div className={ui.label}>{label}</div>
            <div className="text-2xl font-black text-white mt-1">{value}</div>
          </div>
        ))}
      </div>
      <HeatPanel pageId={pageId} published={published} />
    </div>
  )
}
