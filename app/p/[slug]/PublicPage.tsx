'use client'

import { useEffect, useMemo, useState } from 'react'
import { Render } from '@puckeditor/core'
import '@puckeditor/core/no-external.css'
import '@/src/lib/landingPages/puck/designCss.js'
import { puckConfig } from '@/src/lib/landingPages/puck/config.jsx'
import { PageContext } from '@/src/lib/landingPages/puck/context.js'
import { tokensFromQuery } from '@/src/lib/landingPages/templates.js'
import { recordPageEvent, recordPageHeat, submitPageLead } from '@/src/lib/landingPages/api.js'
import { createHeatCollector } from '@/src/lib/landingPages/heat.js'

type PublicPageProps = {
  page: { id: string; title: string; video_url: string; poster_url: string | null; duration: number | null }
  data: any
  contactId: string | null
  tokens: Record<string, string>
}

/**
 * The public landing page: the same responsive components the studio edits, rendered with the page's
 * video, the viewer's personalisation tokens and tracking. No sign-in, no app shell.
 */
export default function PublicPage({ page, data, contactId, tokens: serverTokens }: PublicPageProps) {
  // URL tokens (?firstname=Ann) are read after mount so the server and first client render match.
  const [urlTokens, setUrlTokens] = useState<Record<string, string>>({})
  useEffect(() => {
    setUrlTokens(tokensFromQuery(window.location.search))
    if (new URLSearchParams(window.location.search).get('embed') === '1') document.documentElement.classList.add('vp-embed')
    void recordPageEvent(page.id, { kind: 'view', contactId })
    // Heat samples (clicks, scroll depth, watched seconds) for the owner's heat maps. Embeds are skipped.
    if (new URLSearchParams(window.location.search).get('embed') === '1') return
    const session = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`.slice(0, 24).padEnd(8, '0')
    const heat = createHeatCollector({ send: (events: unknown[]) => void recordPageHeat(page.id, { session, events, contactId }) })
    return () => heat.stop()
  }, [page.id, contactId])

  const ctx = useMemo(() => {
    const track = (kind: string) => void recordPageEvent(page.id, { kind, contactId })
    return {
      page,
      tokens: { ...urlTokens, ...serverTokens },
      preview: false,
      handlers: {
        onPlay: () => track('play'),
        onProgress: (kind: string) => track(kind),
        onComplete: () => track('complete'),
        onCta: () => track('cta_click'),
        onLike: () => track('like'),
        onLead: async (fields: Record<string, string>, meta?: { kind?: string }) => {
          try {
            await submitPageLead({ pageId: page.id, contactId, data: fields, kind: meta?.kind })
            return { ok: true }
          } catch (err) {
            return { error: err instanceof Error ? err.message : 'Could not send. Please try again.' }
          }
        },
      },
    }
  }, [page, contactId, urlTokens, serverTokens])

  return (
    <PageContext.Provider value={ctx}>
      <Render config={puckConfig as any} data={data} />
    </PageContext.Provider>
  )
}
