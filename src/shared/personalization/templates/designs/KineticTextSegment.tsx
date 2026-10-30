/**
 * Adapter for the upstream `kinetic-text` template from
 * `remotion-video-templates` (Alejandro Brito, MIT).
 *
 * Upstream: `src/templates/KineticText/KineticText.tsx` — not copied into
 * `_upstream/` (the upstream uses `staticFile()` and build-time JSON imports
 * that cannot resolve in the browser renderer; this adapter re-implements
 * the rendering inline with browser-safe primitives).
 *
 * This is a full-canvas intro/outro segment design: it paints kinetic,
 * word-by-word animated text over a solid background. It replaces the
 * customer's video during its duration. Registered as a segment design
 * (`segment: true`) in the catalog.
 *
 * The adapter maps the customer's brand data onto the upstream's props:
 *
 *  - `lines` → one line per brand text slot (headline, offer, cta,
 *    businessName), truncated to 8 lines
 *  - `backgroundColor` → brand primary
 *  - `textColor` → brand text
 *  - `emphasisColor` → brand accent
 *
 * Duration is computed from the line count (same formula as the upstream:
 * per-line stagger + settle + hold + exit), so the segment runs as long as
 * the text needs.
 */

import React from 'react'
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { DesignStage, pickColor, type DesignAdapterProps } from './shared'

const FPS = 30
const STAGGER = 4 // frames between consecutive words entering
const SETTLE = 16 // extra frames for the last word to settle
const HOLD = 42 // frames the finished line stays on screen
const EXIT = 14 // fade-out frames

const MAX_LINES = 8

const lineDuration = (wordCount: number): number =>
  wordCount * STAGGER + SETTLE + HOLD + EXIT

const layoutKinetic = (
  lines: { text: string; emphasis: boolean }[],
): { segments: { start: number; duration: number }[]; totalDuration: number } => {
  let cursor = 0
  const segments = lines.map((line) => {
    const wordCount = line.text.trim().split(/\s+/).filter(Boolean).length || 1
    const duration = lineDuration(wordCount)
    const seg = { start: cursor, duration }
    cursor += duration
    return seg
  })
  return { segments, totalDuration: Math.max(1, cursor) }
}

const Line: React.FC<{
  text: string
  emphasis: boolean
  duration: number
  textColor: string
  emphasisColor: string
}> = ({ text, emphasis, duration, textColor, emphasisColor }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const words = text.trim().split(/\s+/).filter(Boolean)

  const exitStart = duration - EXIT
  const lineOpacity = interpolate(frame, [exitStart, duration], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        opacity: lineOpacity,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: emphasis ? 24 : 20,
          maxWidth: '82%',
        }}
      >
        {words.map((word, i) => {
          const enter = spring({
            frame,
            fps,
            config: { damping: 200 },
            delay: i * STAGGER,
          })
          const y = interpolate(enter, [0, 1], [46, 0])
          const scale = emphasis
            ? interpolate(enter, [0, 1], [0.7, 1])
            : interpolate(enter, [0, 1], [0.9, 1])

          return (
            <span
              key={i}
              style={{
                fontFamily:
                  '-apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                fontWeight: emphasis ? 800 : 700,
                fontSize: emphasis ? 150 : 104,
                lineHeight: 1,
                color: emphasis ? emphasisColor : textColor,
                opacity: enter,
                transform: `translateY(${y}px) scale(${scale})`,
                display: 'inline-block',
              }}
            >
              {word}
            </span>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}

export const KineticTextSegment: React.FC<DesignAdapterProps> = (props) => {
  const headline = props.text || ''
  const offer = props.textSlots?.offer || ''
  const cta = props.textSlots?.cta || ''
  const businessName = props.textSlots?.businessName || ''

  const rawLines = [
    { text: headline, emphasis: false },
    { text: offer, emphasis: false },
    { text: cta, emphasis: true },
    { text: businessName, emphasis: false },
  ]
    .filter((line) => line.text.trim().length > 0)
    .slice(0, MAX_LINES)

  const lines = rawLines.length > 0 ? rawLines : [{ text: 'Your video', emphasis: false }]

  const { segments, totalDuration } = layoutKinetic(lines)

  const backgroundColor = pickColor([props.colors?.primary], '#09090B')
  const textColor = pickColor([props.colors?.text], '#FAFAFA')
  const emphasisColor = pickColor([props.colors?.accent], '#60A5FA')

  return (
    <DesignStage designId="kinetic-text-segment" props={props}>
      <AbsoluteFill style={{ backgroundColor }}>
        {lines.map((line, i) => {
          const seg = segments[i]
          return (
            <Line
              key={i}
              text={line.text}
              emphasis={line.emphasis}
              duration={seg.duration}
              textColor={textColor}
              emphasisColor={emphasisColor}
            />
          )
        })}
      </AbsoluteFill>
    </DesignStage>
  )
}

export default KineticTextSegment
