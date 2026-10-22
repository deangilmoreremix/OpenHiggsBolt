// SPDX-License-Identifier: MIT
/**
 * LogoMaskWipe — adapted for this repository.
 *
 * Source:   https://github.com/deangilmoreremix/free-remotion-templates
 * File:     src/components/logo-mask-wipe/LogoMaskWipe.tsx
 * Licence:  MIT — Copyright (c) 2026 Trimora Inc. (see the upstream LICENSE file)
 *
 * Upstream is MIT licensed; the MIT copyright and permission notice are
 * retained above and the design is redistributed under the same terms.
 *
 * Adaptations for this repository (Remotion 4.0.499, browser render path):
 *  - The exit fade is driven by a `durationInFrames` prop instead of the
 *    upstream module constant, so the design can be timed against the
 *    composition it is placed in.
 *  - The SVG `clipPath` id is made unique per instance (the before/after
 *    preview mounts two players on one page, and duplicate ids would make
 *    the second wipe resolve against the first).
 *  - The accent glow is built with `withAlpha()` instead of the upstream
 *    `accentColor + '22'` hex suffix, so a non-hex brand colour cannot
 *    invalidate the whole `background` shorthand.
 *  - An OPTIONAL `logoImageUrl` lets the customer's own raster logo replace
 *    the inline SVG monogram. The upstream template can only draw a letter
 *    mark, which is a real limitation for a personalization product.
 *  - The upstream `FONT` stack is kept verbatim: no network font loading.
 *  - No `staticFile()`, no CSS `@keyframes`, no `<Sequence>`.
 *  - The design remains a FULL-FRAME scene (it paints `backgroundColor`),
 *    exactly like the upstream template.
 */
import React, { useId } from 'react'
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'
import {
  REMOTION_DESIGN_FONT_SANS,
  withAlpha,
} from '../designTokens'

export const LOGO_MASK_WIPE_FPS = 30
export const LOGO_MASK_WIPE_DURATION_FRAMES = 100

export type LogoMaskWipeProps = {
  /** Full-frame background colour. */
  backgroundColor: string
  /** Accent colour used for the badge, ring and underline. */
  accentColor: string
  /** Colour of the wordmark and the sweeping accent line. */
  textColor: string
  /** Letter mark drawn inside the badge (1–3 characters read best). */
  monogram: string
  /** Business name shown under the badge. */
  brandText: string
  /**
   * Optional absolute URL of the customer's own logo. When set it replaces the
   * inline monogram letter. Must be an absolute URL — the browser export path
   * has no `public/` directory, so `staticFile()` is not available.
   */
  logoImageUrl?: string
  /** Length of the design in frames; drives the exit fade. */
  durationInFrames?: number
  /** Optional font stack override. Defaults to the system sans stack. */
  fontFamily?: string
}

export const defaultLogoMaskWipeProps: LogoMaskWipeProps = {
  backgroundColor: '#0a0800',
  accentColor: '#eab308',
  textColor: '#fefce8',
  monogram: 'A',
  brandText: 'ACME INC.',
  logoImageUrl: '',
  durationInFrames: LOGO_MASK_WIPE_DURATION_FRAMES,
  fontFamily: REMOTION_DESIGN_FONT_SANS,
}

export const LogoMaskWipe: React.FC<LogoMaskWipeProps> = ({
  backgroundColor,
  accentColor,
  textColor,
  monogram,
  brandText,
  logoImageUrl,
  durationInFrames = LOGO_MASK_WIPE_DURATION_FRAMES,
  fontFamily = REMOTION_DESIGN_FONT_SANS,
}) => {
  const frame = useCurrentFrame()
  const { width, height, fps } = useVideoConfig()
  const rawInstanceId = useId()
  const clipId = `lmw-wipe-${rawInstanceId.replace(/[^a-zA-Z0-9]/g, '')}`

  const cx = width / 2
  const cy = height * 0.43
  const R = height * 0.2 // monogram badge radius

  // --- Phase timing ---
  // 0-46: diagonal mask wipe reveals the lockup.
  // 30-60: slight scale settle after reveal.
  // 40-58: brand wordmark fades up.
  const wipe = interpolate(frame, [0, 46], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const textIn = interpolate(frame, [40, 58], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // Gentle scale settle once the reveal lands (slight overshoot down to rest)
  const settle = spring({
    frame: frame - 30,
    fps,
    config: { damping: 16, stiffness: 95, mass: 0.9 },
    durationInFrames: 30,
  })
  const lockupScale = interpolate(settle, [0, 1], [1.06, 1])

  // Hold near full opacity at the end — soft tail, no blank frames.
  const exitOpacity = interpolate(
    frame,
    [durationInFrames - 10, durationInFrames],
    [1, 0.94],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  )

  // --- Diagonal mask geometry ---
  // The clip is a rectangle rotated -28deg whose edge sweeps from top-left
  // to bottom-right across the lockup, revealing it along a diagonal line.
  const diag = Math.hypot(width, height)
  // Travel distance of the wipe edge (a bit past the diagonal for full reveal).
  const edge = interpolate(wipe, [0, 1], [-diag * 0.62, diag * 0.62])
  const maskAngle = -28 // degrees

  // Leading accent line that rides the wipe edge (a sweeping highlight bar).
  const lineVisible = wipe > 0.02 && wipe < 0.985
  const lineLen = R * 3.2

  const logoUrl = typeof logoImageUrl === 'string' ? logoImageUrl.trim() : ''

  return (
    <AbsoluteFill
      data-remotion-design-id="logo-mask-wipe"
      style={{ backgroundColor, overflow: 'hidden' }}
    >
      {/* Faint backdrop glow behind the badge, follows the reveal */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${cx}px ${cy}px, ${withAlpha(
            accentColor,
            0.13,
          )} 0%, transparent ${R * 2.4}px)`,
          opacity: wipe,
        }}
      />

      <AbsoluteFill style={{ opacity: exitOpacity }}>
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          <defs>
            {/* Diagonal reveal mask: a big rectangle rotated and translated so
                its trailing edge wipes the lockup open along the diagonal. */}
            <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
              <rect
                x={cx - diag}
                y={cy - diag}
                width={diag}
                height={diag * 2}
                transform={`rotate(${maskAngle} ${cx} ${cy}) translate(${edge} 0)`}
              />
            </clipPath>
          </defs>

          <g clipPath={`url(#${clipId})`}>
            <g
              transform={`translate(${cx} ${cy}) scale(${lockupScale}) translate(${-cx} ${-cy})`}
            >
              {/* Filled badge */}
              <circle
                cx={cx}
                cy={cy}
                r={R}
                fill={accentColor}
                opacity={0.16}
              />
              {/* Badge ring outline */}
              <circle
                cx={cx}
                cy={cy}
                r={R}
                fill="none"
                stroke={accentColor}
                strokeWidth={height * 0.011}
              />
              {/* Monogram letter — the SVG path used when the customer has no
                  raster logo. A supplied logo is drawn as a sibling layer
                  below so it keeps Remotion's image-loading bookkeeping. */}
              {!logoUrl ? (
                <text
                  x={cx}
                  y={cy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontFamily={fontFamily}
                  fontWeight={800}
                  fontSize={R * 1.15}
                  fill={accentColor}
                  letterSpacing="-0.02em"
                >
                  {monogram}
                </text>
              ) : null}
            </g>
          </g>

          {/* Sweeping accent line riding the wipe edge */}
          {lineVisible && (
            <g transform={`rotate(${maskAngle} ${cx} ${cy})`}>
              <rect
                x={cx + edge - height * 0.004}
                y={cy - lineLen / 2}
                width={height * 0.008}
                height={lineLen}
                fill={textColor}
                opacity={0.85}
              />
            </g>
          )}
        </svg>

        {/* Customer raster logo, when one was supplied. It is drawn as a
            sibling layer (not inside the SVG) so Remotion's <Img> keeps its
            image-loading bookkeeping, and it reveals with the same wipe. */}
        {logoUrl ? (
          <Img
            src={logoUrl}
            style={{
              position: 'absolute',
              left: cx - R * 0.72,
              top: cy - R * 0.72,
              width: R * 1.44,
              height: R * 1.44,
              objectFit: 'contain',
              opacity: wipe,
              transformOrigin: `${cx}px ${cy}px`,
              transform: `scale(${lockupScale})`,
            }}
          />
        ) : null}

        {/* Brand wordmark */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: cy + R + height * 0.07,
            textAlign: 'center',
            fontFamily,
            fontSize: height * 0.05,
            fontWeight: 700,
            color: textColor,
            opacity: textIn,
            transform: `translateY(${(1 - textIn) * height * 0.025}px)`,
            letterSpacing: '0.22em',
          }}
        >
          {brandText}
        </div>

        {/* Underline accent under wordmark */}
        <div
          style={{
            position: 'absolute',
            left: cx - (width * 0.12) / 2,
            top: cy + R + height * 0.155,
            width: width * 0.12 * textIn,
            height: height * 0.004,
            backgroundColor: accentColor,
            opacity: textIn,
            borderRadius: height * 0.004,
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

export default LogoMaskWipe
