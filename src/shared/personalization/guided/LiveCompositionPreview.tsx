'use client'

import { useEffect, useRef, useState } from 'react'
import { Player, Thumbnail } from '@remotion/player'
import { PersonalizationComposition } from '../preview/PersonalizationComposition'
import type { PreviewInputProps } from '../preview/types'

/**
 * A small, live render of the personalization composition for a gallery card.
 *
 * Shows a still frame (`Thumbnail`) until `playing` is true, then a looping
 * muted Player. Nothing mounts until the card has been near the viewport, so a
 * gallery of many cards stays light, and the caller decides which single card
 * plays. Because it renders the SAME composition as the editor and the export,
 * a card always shows exactly what choosing it produces.
 */

export interface LiveCompositionPreviewProps {
  /** Built lazily, only once the card is on screen. */
  buildInputProps: () => PreviewInputProps
  playing: boolean
  /** Frame the still thumbnail shows. */
  stillFrame: number
  durationInFrames: number
  width: number
  height: number
  fps: number
}

/** Dark backdrop for cards when the customer's video has no poster image. */
export const FALLBACK_BACKDROP =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="9"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#18222d"/><stop offset="1" stop-color="#06090d"/></linearGradient></defs><rect width="16" height="9" fill="url(#g)"/></svg>',
  )

// The composition's props are an interface (no index signature), so the
// Player/Thumbnail generics are widened the same way PersonalizationPlayer does.
const Composition = PersonalizationComposition as unknown as React.ComponentType<Record<string, unknown>>

/** True once the element has been near the viewport. */
function useSeen(ref: React.RefObject<HTMLElement | null>): boolean {
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const element = ref.current
    if (!element || seen || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setSeen(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref, seen])
  return seen
}

export function LiveCompositionPreview({
  buildInputProps,
  playing,
  stillFrame,
  durationInFrames,
  width,
  height,
  fps,
}: LiveCompositionPreviewProps): React.JSX.Element {
  const ref = useRef<HTMLSpanElement>(null)
  const seen = useSeen(ref)
  const props = seen ? (buildInputProps() as unknown as Record<string, unknown>) : null
  const common = {
    component: Composition,
    durationInFrames,
    compositionWidth: width,
    compositionHeight: height,
    fps,
    style: { width: '100%', height: '100%' },
  }
  return (
    <span ref={ref} style={{ position: 'absolute', inset: 0, display: 'block' }}>
      {props ? (
        playing ? (
          <Player {...common} inputProps={props} autoPlay loop initiallyMuted controls={false} acknowledgeRemotionLicense />
        ) : (
          <Thumbnail {...common} inputProps={props} frameToDisplay={Math.min(durationInFrames - 1, Math.max(0, stillFrame))} />
        )
      ) : null}
    </span>
  )
}
