// SPDX-License-Identifier: MIT
/**
 * LowerThirdGlassCard — adapted for this repository.
 *
 * Source:   https://github.com/deangilmoreremix/free-remotion-templates
 * File:     src/components/lower-third-glass-card/LowerThirdGlassCard.tsx
 * Licence:  MIT — Copyright (c) 2026 Trimora Inc. (see the upstream LICENSE file)
 *
 * Upstream is MIT licensed; the MIT copyright and permission notice are
 * retained above and the design is redistributed under the same terms.
 *
 * Adaptations for this repository (Remotion 4.0.499, browser render path):
 *  - TRANSPARENT OVERLAY. The upstream template paints a full-frame
 *    `AbsoluteFill` background plus an ambient radial wash, which would hide
 *    the customer's video. Both are removed so the lower third composites
 *    over the footage.
 *  - `backgroundColor` keeps its meaning ("the design's background colour")
 *    but is now used as the card's own tint. The canvas renderer drops the
 *    frosted-glass `backdrop-filter` (there is no backdrop to blur), so the
 *    panel carries a translucent tint of its own and stays legible over any
 *    footage. The `backdrop-filter` is kept for the in-browser preview.
 *  - The exit fade is driven by a `durationInFrames` prop instead of the
 *    upstream module constant.
 *  - The upstream `FONT` stack is kept verbatim: no network font loading.
 *  - Name and title are clipped with an ellipsis so a long personalised name
 *    cannot spill out of the card.
 *  - No `staticFile()`, no CSS `@keyframes`, no `<Sequence>`.
 */
import React from 'react'
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'
import {
  REMOTION_DESIGN_FONT_SANS,
  withAlpha,
} from '../designTokens'

export const LOWER_THIRD_GLASS_CARD_FPS = 30
export const LOWER_THIRD_GLASS_CARD_DURATION_FRAMES = 120

export type LowerThirdGlassCardProps = {
  /** Tint used for the card surface. */
  backgroundColor: string
  /** Accent colour for the left bar and the inner glow. */
  accentColor: string
  /** Colour of the name and title. */
  textColor: string
  /** Speaker / business name. */
  nameText: string
  /** Role or subtitle. */
  titleText: string
  /** Length of the design in frames; drives the exit fade. */
  durationInFrames?: number
  /** Optional font stack override. Defaults to the system sans stack. */
  fontFamily?: string
}

export const defaultLowerThirdGlassCardProps: LowerThirdGlassCardProps = {
  backgroundColor: '#0c1a2e',
  accentColor: '#06b6d4',
  textColor: '#f0f9ff',
  nameText: 'Alex Morgan',
  titleText: 'Head of Product, Acme Inc.',
  durationInFrames: LOWER_THIRD_GLASS_CARD_DURATION_FRAMES,
  fontFamily: REMOTION_DESIGN_FONT_SANS,
}

export const LowerThirdGlassCard: React.FC<LowerThirdGlassCardProps> = ({
  backgroundColor,
  accentColor,
  textColor,
  nameText,
  titleText,
  durationInFrames = LOWER_THIRD_GLASS_CARD_DURATION_FRAMES,
  fontFamily = REMOTION_DESIGN_FONT_SANS,
}) => {
  const frame = useCurrentFrame()
  const { width, height, fps } = useVideoConfig()

  // Card slides up from below the safe area
  const cardIn = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 90 },
    durationInFrames: 28,
  })
  const nameIn = spring({
    frame: frame - 12,
    fps,
    config: { damping: 16, stiffness: 110 },
    durationInFrames: 20,
  })
  const titleIn = interpolate(frame, [24, 42], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  // Hold visible; gently fade at the very end and keep terminal opacity at 0 exactly on the last frame range.
  const exitOpacity = interpolate(
    frame,
    [durationInFrames - 16, durationInFrames - 1],
    [1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  )

  // Inner glow pulse driven by sin so it never lands on a dead frame
  const glowPulse = 0.5 + 0.5 * Math.sin(frame * 0.08)

  // Card geometry (responsive)
  const cardW = width * 0.42
  const cardH = height * 0.2
  const cardX = width * 0.06
  const restY = height * 0.74
  const cardY = restY + (1 - cardIn) * height * 0.18
  const radius = height * 0.022

  const padX = cardW * 0.07
  const textMaxWidth = cardW - padX * 2

  return (
    // Transparent root: the lower third sits on top of the customer's video.
    <AbsoluteFill
      data-remotion-design-id="lower-third-glass-card"
      style={{ overflow: 'hidden', pointerEvents: 'none' }}
    >
      <div
        style={{
          position: 'absolute',
          left: cardX,
          top: cardY,
          width: cardW,
          height: cardH,
          opacity: cardIn * exitOpacity,
        }}
      >
        {/* Glass card body. The translucent tint replaces the frosted-glass
            backdrop blur, which the canvas renderer cannot reproduce. */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            borderRadius: radius,
            background: `linear-gradient(135deg, ${withAlpha(
              backgroundColor,
              0.82,
            )} 0%, ${withAlpha(backgroundColor, 0.62)} 100%)`,
            border: '1px solid rgba(255,255,255,0.22)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            boxShadow: `0 ${height * 0.018}px ${height * 0.05}px rgba(0,0,0,0.45)`,
            overflow: 'hidden',
          }}
        >
          {/* Inner accent glow */}
          <div
            style={{
              position: 'absolute',
              left: '-10%',
              top: '-40%',
              width: '60%',
              height: '180%',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${withAlpha(
                accentColor,
                0.33,
              )} 0%, transparent 70%)`,
              opacity: 0.45 + glowPulse * 0.45,
            }}
          />
          {/* Top sheen highlight */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              height: '42%',
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 100%)',
            }}
          />
          {/* Left accent bar */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: '18%',
              width: cardW * 0.012,
              height: '64%',
              borderRadius: 99,
              backgroundColor: accentColor,
              boxShadow: `0 0 ${height * 0.02}px ${accentColor}`,
            }}
          />
        </div>

        {/* Name */}
        <div
          style={{
            position: 'absolute',
            left: padX,
            top: cardH * 0.24,
            maxWidth: textMaxWidth,
            fontFamily,
            fontSize: height * 0.058,
            fontWeight: 800,
            color: textColor,
            opacity: nameIn,
            transform: `translateY(${(1 - nameIn) * 12}px)`,
            letterSpacing: '0.01em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            textShadow: '0 2px 12px rgba(0,0,0,0.4)',
          }}
        >
          {nameText}
        </div>

        {/* Title */}
        <div
          style={{
            position: 'absolute',
            left: padX,
            top: cardH * 0.6,
            maxWidth: textMaxWidth,
            fontFamily,
            fontSize: height * 0.026,
            fontWeight: 500,
            color: textColor,
            opacity: titleIn * 0.85,
            transform: `translateY(${(1 - titleIn) * 6}px)`,
            letterSpacing: '0.05em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {titleText}
        </div>
      </div>
    </AbsoluteFill>
  )
}

export default LowerThirdGlassCard
