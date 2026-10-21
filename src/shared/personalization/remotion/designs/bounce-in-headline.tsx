// SPDX-License-Identifier: MIT
/**
 * BounceInHeadline — adapted for this repository.
 *
 * Source:   https://github.com/deangilmoreremix/free-remotion-templates
 * File:     src/components/bounce-in-headline/BounceInHeadline.tsx
 * Licence:  MIT — Copyright (c) 2026 Trimora Inc. (see the upstream LICENSE file)
 *
 * Upstream is MIT licensed; the MIT copyright and permission notice are
 * retained above and the design is redistributed under the same terms.
 *
 * Adaptations for this repository (Remotion 4.0.499, browser render path):
 *  - The fixed 130px headline is re-derived from the composition height so the
 *    design holds its proportions at 16:9, 9:16, 1:1 and 4:5.
 *  - The bounce height (a pixel value in the upstream template) is scaled by
 *    the same factor, so it behaves identically at every export size.
 *  - The upstream `FONT_SANS` stack is kept verbatim: no network font loading.
 *  - No `staticFile()`, no CSS `@keyframes`, no `<Sequence>`.
 *  - The design remains a FULL-FRAME scene (it paints `background`), exactly
 *    like the upstream template.
 */
import React from 'react'
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion'
import {
  REMOTION_DESIGN_FONT_SANS,
  designScale,
} from '../designTokens'

export const BOUNCE_IN_HEADLINE_FPS = 30
export const BOUNCE_IN_HEADLINE_DURATION_FRAMES = 120

export type BounceInHeadlineProps = {
  /** The copy that bounces in. */
  headline: string
  /** Full-frame background colour. */
  background: string
  /** Headline colour. */
  color: string
  /** number of bounces */
  bounces: number
  /** max bounce height (px, authored against a 1080p-tall composition) */
  height: number
  /** entrance delay (frames) */
  delay: number
  /** total effect length (frames) */
  duration: number
  /** Optional font stack override. Defaults to the system sans stack. */
  fontFamily?: string
}

export const defaultBounceInHeadlineProps: BounceInHeadlineProps = {
  headline: 'Make It Bounce',
  background: '#111827',
  color: '#fbbf24',
  bounces: 3,
  height: 120,
  delay: 8,
  duration: 36,
  fontFamily: REMOTION_DESIGN_FONT_SANS,
}

export const BounceInHeadline: React.FC<BounceInHeadlineProps> = ({
  headline,
  background,
  color,
  bounces,
  height,
  delay,
  duration,
  fontFamily = REMOTION_DESIGN_FONT_SANS,
}) => {
  const frame = useCurrentFrame()
  const { height: compositionHeight } = useVideoConfig()
  const scale = designScale(compositionHeight)

  const progress = interpolate(frame, [delay, delay + duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const opacity = interpolate(progress, [0, 0.1], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // damped abs(sin) for multiple bounces
  const bounceY =
    progress >= 1
      ? 0
      : Math.abs(Math.sin(progress * Math.PI * bounces)) *
        height *
        scale *
        (1 - progress)

  return (
    <AbsoluteFill
      data-remotion-design-id="bounce-in-headline"
      style={{
        backgroundColor: background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          fontFamily,
          fontSize: Math.round(130 * scale),
          fontWeight: 900,
          color,
          letterSpacing: Math.round(6 * scale),
          opacity,
          transform: `translateY(${-bounceY}px)`,
          textAlign: 'center',
          maxWidth: '90%',
          wordBreak: 'break-word',
        }}
      >
        {headline}
      </div>
    </AbsoluteFill>
  )
}

export default BounceInHeadline
