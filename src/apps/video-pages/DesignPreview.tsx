'use client'

import { useEffect, useRef, useState } from 'react'
import { Render } from '@puckeditor/core'
import '@puckeditor/core/no-external.css'
import '@/src/lib/landingPages/puck/designCss.js'
import { puckConfig } from '@/src/lib/landingPages/puck/config.jsx'
import { PageContext } from '@/src/lib/landingPages/puck/context.js'

const PAGE_WIDTH = 1280
const SAMPLE_TOKENS = { firstname: 'Alex', company: 'Brightline' }
const PREVIEW_PAGE = { id: 'preview', title: 'Preview', video_url: '', poster_url: null }

/** A small, non-interactive picture of the real landing page: the design rendered at 1280px wide and scaled to the card.
 *  It is only drawn once the card scrolls into view, so a grid of 34 designs stays light. */
export default function DesignPreview({ data, aspect = 0.72, label }: { data: any; aspect?: number; label: string }) {
  const box = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [seen, setSeen] = useState(false)

  useEffect(() => {
    const el = box.current
    if (!el) return
    setWidth(el.clientWidth)
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => setWidth(el.clientWidth)) : null
    ro?.observe(el)
    const io = typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) { setSeen(true); io?.disconnect() } }, { rootMargin: '200px' })
      : null
    if (io) io.observe(el); else setSeen(true)
    return () => { ro?.disconnect(); io?.disconnect() }
  }, [])

  const scale = width ? width / PAGE_WIDTH : 0
  return (
    <div ref={box} role="img" aria-label={`Preview of ${label}`} className="relative w-full overflow-hidden rounded-lg bg-black/40 border border-white/5" style={{ aspectRatio: `1 / ${aspect}` }}>
      {seen && scale ? (
        <div aria-hidden="true" style={{ width: PAGE_WIDTH, transform: `scale(${scale})`, transformOrigin: 'top left', pointerEvents: 'none', position: 'absolute', top: 0, left: 0 }} {...({ inert: '' } as object)}>
          <PageContext.Provider value={{ page: PREVIEW_PAGE, tokens: SAMPLE_TOKENS, handlers: {}, preview: true }}>
            <Render config={puckConfig as any} data={data} />
          </PageContext.Provider>
        </div>
      ) : null}
    </div>
  )
}
