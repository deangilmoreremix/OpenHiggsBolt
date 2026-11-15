import React from 'react'
import type { BusinessDiscoveryRecord } from './types'
import type { BusinessEnrichment } from '@/server/businessEnrichment/types'
import { lookalikes, nearbyCompetitors } from './leadInsights'

const MUTED = '#8b98a5', TEXT = '#e6edf3', CYAN = '#29d3f2'

export interface LeadInsightsPanelProps {
  business: BusinessDiscoveryRecord
  results: BusinessDiscoveryRecord[]
  enrichment?: BusinessEnrichment | null
  onPick?: (b: BusinessDiscoveryRecord) => void
}

/** For the selected business: how its own site looks, plus similar and nearby businesses from the search already run. */
export function LeadInsightsPanel({ business, results, enrichment, onPick }: LeadInsightsPanelProps) {
  const similar = lookalikes(business, results)
  const nearby = nearbyCompetitors(business, results)
  const q = enrichment?.siteSignals?.quality
  if (!similar.length && !nearby.length && !q) return null
  const yes = (v: boolean) => (v ? '✓' : '✗')
  return (
    <div data-testid="lead-insights" style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 10, color: MUTED }}>
      {q && (
        <div data-testid="site-quality" title={`Read from the homepage ${q.sourceUrl}. Hints, not a grade.`}>
          <span style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: 9 }}>Website check</span>{' '}
          {yes(q.https)} HTTPS · {yes(q.mobileViewport)} mobile-ready · {yes(q.hasTitle)} title · {yes(q.hasMetaDescription)} description · {yes(q.hasStructuredData)} structured data
          {q.copyrightYear ? ` · © ${q.copyrightYear}` : ''}
        </div>
      )}
      {similar.length > 0 && (
        <div data-testid="lookalikes">
          <span style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: 9 }}>Similar businesses in this search</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
            {similar.map((b) => (
              <button key={b.id} type="button" onClick={(e) => { e.stopPropagation(); onPick?.(b) }} style={{ background: 'transparent', border: 0, padding: 0, color: CYAN, cursor: 'pointer', fontSize: 10 }}>{b.name}</button>
            ))}
          </div>
        </div>
      )}
      {nearby.length > 0 && (
        <div data-testid="competitors">
          <span style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: 9 }}>Nearest competitors</span>
          <div style={{ marginTop: 2, color: TEXT }}>
            {nearby.map(({ business: b, miles }) => <div key={b.id}>{b.name} <span style={{ color: MUTED }}>· {miles} mi</span></div>)}
          </div>
        </div>
      )}
    </div>
  )
}
