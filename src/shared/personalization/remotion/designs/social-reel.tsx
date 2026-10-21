// SPDX-License-Identifier: MIT
/**
 * SocialReel — adapted for this repository.
 *
 * Source:   https://github.com/deangilmoreremix/free-remotion-templates
 * File:     src/components/social-reel/SocialReel.tsx
 * Licence:  MIT — Copyright (c) 2026 Trimora Inc. (see the upstream LICENSE file)
 *
 * Upstream is MIT licensed; the MIT copyright and permission notice are
 * retained above and the design is redistributed under the same terms.
 *
 * Adaptations for this repository (Remotion 4.0.499, browser render path):
 *  - The upstream template hardcodes a 1920x1080 landscape stage with a
 *    608x1080 phone mock-up. Both are now derived from the composition size
 *    and every internal pixel value is scaled by the same factor, so the
 *    design keeps its proportions at 16:9, 9:16, 1:1 and 4:5.
 *  - The Ken-Burns zoom and the progress bar are driven by a
 *    `durationInFrames` prop instead of the upstream module constant.
 *  - The upstream `SANS` stack is kept verbatim: no network font loading.
 *  - No `staticFile()`, no CSS `@keyframes`.
 *  - `<Sequence>` is used exactly as upstream, for the progressive reveal of
 *    the catch copy / second copy / info panel / CTA. `<Sequence>` resolves
 *    its own timing from the separate sequence context, but it also registers
 *    itself with Remotion's `SequenceManager`, whose default value throws.
 *    This repository already provides a no-op `SequenceManager` for exactly
 *    this reason (`NOOP_SEQUENCE_MANAGER` in
 *    `src/shared/personalization/preview/PersonalizationComposition.tsx`).
 *    The design therefore MUST be rendered as a descendant of that provider.
 *  - The design remains a FULL-FRAME scene (it paints the stage and the
 *    player's own gradient), exactly like the upstream template.
 */
import React from 'react'
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'
import { REMOTION_DESIGN_FONT_SANS } from '../designTokens'

/**
 * Social Reel — generic short-form social video player promo
 *
 * A neutral "vertical video player" UI (avatar / handle / like-comment-share
 * rail / progress bar) wrapped in a landscape stage, cycling through a
 * catch-copy -> second-copy -> info-panel -> CTA sequence.
 *
 * Motion preserved from the source template:
 *  - FadeIn-up entrances (opacity + translateY via interpolate)
 *  - AccentLine scaleX wipe (left/center grow)
 *  - PulseButton sin-wave scale pulse on the CTA after a spring entrance
 *  - Ken-Burns slow zoom on the backdrop
 *
 * Self-contained: react / remotion only, Latin system fonts, no external CDN,
 * no brand colors/logos/wordmarks — fully fictional ("Streamly" / @aria.studio).
 */

export const SOCIAL_REEL_FPS = 30
export const SOCIAL_REEL_DURATION_FRAMES = 150

const SANS = REMOTION_DESIGN_FONT_SANS

export type SocialReelProps = {
  brandName: string
  handle: string
  headline: string
  headlineAccent: string
  secondCopy: string
  infoLines: string[]
  ctaText: string
  accentColor: string
  bgFrom: string
  bgVia: string
  bgTo: string
  caption: string
  likeCount: string
  /** Length of the design in frames; drives the progress bar and the zoom. */
  durationInFrames?: number
  /** Optional font stack override. Defaults to the system sans stack. */
  fontFamily?: string
}

export const defaultSocialReelProps: SocialReelProps = {
  brandName: 'Streamly',
  handle: '@aria.studio',
  headline: 'Make it',
  headlineAccent: 'unmissable',
  secondCopy: 'Stories that\nscroll-stop',
  infoLines: ['New drop / Studio Aria', 'Open daily 10:00 — 20:00', 'Link in profile'],
  ctaText: 'Watch the full reel',
  accentColor: '#4f8cff',
  bgFrom: '#1b1d2a',
  bgVia: '#222540',
  bgTo: '#10243f',
  caption: 'behind the scenes ✦ no.07',
  likeCount: '12.4k',
  durationInFrames: SOCIAL_REEL_DURATION_FRAMES,
  fontFamily: SANS,
}

// ─── FadeIn (opacity + directional slide) ─────────────────────
const FadeIn: React.FC<{
  children: React.ReactNode
  delay?: number
  duration?: number
  direction?: 'up' | 'down' | 'none'
  distance?: number
  unit?: number
}> = ({ children, delay = 0, duration = 20, direction = 'up', distance = 30, unit = 1 }) => {
  const frame = useCurrentFrame()
  const progress = interpolate(frame, [delay, delay + duration], [0, 1], {
    easing: Easing.out(Easing.ease),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  let transform = 'none'
  if (direction === 'up') transform = `translateY(${(1 - progress) * distance * unit}px)`
  if (direction === 'down') transform = `translateY(${(1 - progress) * -distance * unit}px)`
  return <div style={{ opacity: progress, transform }}>{children}</div>
}

// ─── AccentLine (scaleX wipe) ─────────────────────────────────
const AccentLine: React.FC<{
  color: string
  delay?: number
  duration?: number
  width?: number
  height?: number
  unit?: number
}> = ({ color, delay = 0, duration = 20, width = 120, height = 5, unit = 1 }) => {
  const frame = useCurrentFrame()
  const scaleX = interpolate(frame, [delay, delay + duration], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  return (
    <div
      style={{
        width: width * unit,
        height: height * unit,
        backgroundColor: color,
        borderRadius: 3 * unit,
        transform: `scaleX(${scaleX})`,
        transformOrigin: 'center',
      }}
    />
  )
}

// ─── PulseButton (spring entrance + sin-wave pulse) ───────────
const PulseButton: React.FC<{
  text: string
  color: string
  delay?: number
  unit?: number
  fontFamily?: string
}> = ({ text, color, delay = 0, unit = 1, fontFamily = SANS }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const entrance = spring({
    frame: frame - delay,
    fps,
    config: { damping: 20, stiffness: 300 },
  })
  const pulse = interpolate(Math.sin((frame - delay) * 0.08), [-1, 1], [0.97, 1.03])
  const scale = entrance < 0.95 ? entrance : entrance * pulse
  return (
    <div
      style={{
        opacity: entrance,
        transform: `scale(${scale})`,
        backgroundColor: color,
        borderRadius: 50,
        padding: `${18 * unit}px ${56 * unit}px`,
        boxShadow: `0 ${10 * unit}px ${32 * unit}px ${color}55`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily,
      }}
    >
      <span style={{ fontSize: 34 * unit, fontWeight: 700, color: '#ffffff', letterSpacing: '0.01em' }}>
        {text}
      </span>
    </div>
  )
}

// ─── Generic social action glyphs (no brand iconography) ──────
const HeartGlyph: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M12 20s-7-4.6-7-9.3A3.7 3.7 0 0 1 12 8a3.7 3.7 0 0 1 7 2.7C19 15.4 12 20 12 20z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinejoin="round"
    />
  </svg>
)

const CommentGlyph: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M4 5h16v11H9l-5 4V5z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinejoin="round"
    />
  </svg>
)

const ShareGlyph: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M4 12l16-7-5 16-4-6-7-3z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinejoin="round"
    />
  </svg>
)

const ActionRail: React.FC<{
  accent: string
  likeCount: string
  frame: number
  unit: number
  fontFamily: string
}> = ({ accent, likeCount, frame, unit, fontFamily }) => {
  // subtle heart-tap pop, looping, no brand association
  const beat = (frame % 90) / 90
  const heartScale = 1 + Math.max(0, Math.sin(beat * Math.PI * 2)) * 0.12
  const railText = 'rgba(255,255,255,0.85)'
  const item = (icon: React.ReactNode, label: string, scale = 1) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 * unit }}>
      <div
        style={{
          width: 64 * unit,
          height: 64 * unit,
          borderRadius: 32 * unit,
          background: 'rgba(255,255,255,0.10)',
          border: `1px solid rgba(255,255,255,0.18)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${scale})`,
        }}
      >
        {icon}
      </div>
      <span style={{ fontSize: 18 * unit, color: railText, fontFamily, fontWeight: 600 }}>
        {label}
      </span>
    </div>
  )
  return (
    <div
      style={{
        position: 'absolute',
        right: 28 * unit,
        bottom: 130 * unit,
        display: 'flex',
        flexDirection: 'column',
        gap: 26 * unit,
        alignItems: 'center',
      }}
    >
      {item(<HeartGlyph size={30 * unit} color={accent} />, likeCount, heartScale)}
      {item(<CommentGlyph size={28 * unit} color="#ffffff" />, '318')}
      {item(<ShareGlyph size={28 * unit} color="#ffffff" />, 'Share')}
    </div>
  )
}

// ─── Top bar: avatar + handle + follow chip (generic) ─────────
const TopBar: React.FC<{
  brandName: string
  handle: string
  accent: string
  unit: number
  fontFamily: string
}> = ({ brandName, handle, accent, unit, fontFamily }) => (
  <div
    style={{
      position: 'absolute',
      top: 28 * unit,
      left: 28 * unit,
      right: 28 * unit,
      display: 'flex',
      alignItems: 'center',
      gap: 14 * unit,
      zIndex: 5,
    }}
  >
    <div
      style={{
        width: 56 * unit,
        height: 56 * unit,
        borderRadius: 28 * unit,
        background: `linear-gradient(135deg, ${accent}, #ffffff22)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily,
        fontWeight: 800,
        fontSize: 24 * unit,
        color: '#fff',
        border: `2px solid rgba(255,255,255,0.4)`,
      }}
    >
      {brandName.charAt(0).toUpperCase()}
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 * unit }}>
      <span style={{ fontSize: 22 * unit, fontWeight: 700, color: '#fff', fontFamily }}>
        {brandName}
      </span>
      <span style={{ fontSize: 16 * unit, color: 'rgba(255,255,255,0.7)', fontFamily }}>
        {handle}
      </span>
    </div>
    <div
      style={{
        marginLeft: 6 * unit,
        padding: `${8 * unit}px ${20 * unit}px`,
        borderRadius: 22 * unit,
        border: `1.5px solid rgba(255,255,255,0.6)`,
        fontSize: 16 * unit,
        fontWeight: 700,
        color: '#fff',
        fontFamily,
      }}
    >
      Follow
    </div>
  </div>
)

// ─── Bottom caption + progress bar ────────────────────────────
const BottomChrome: React.FC<{
  caption: string
  accent: string
  progress: number
  unit: number
  fontFamily: string
}> = ({ caption, accent, progress, unit, fontFamily }) => (
  <>
    <div
      style={{
        position: 'absolute',
        left: 28 * unit,
        bottom: 70 * unit,
        right: 130 * unit,
        display: 'flex',
        alignItems: 'center',
        gap: 10 * unit,
      }}
    >
      <span style={{ fontSize: 19 * unit, color: 'rgba(255,255,255,0.9)', fontFamily, fontWeight: 500 }}>
        {caption}
      </span>
    </div>
    <div
      style={{
        position: 'absolute',
        left: 28 * unit,
        right: 28 * unit,
        bottom: 44 * unit,
        height: 5 * unit,
        borderRadius: 3 * unit,
        background: 'rgba(255,255,255,0.22)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${progress * 100}%`,
          height: '100%',
          background: accent,
          borderRadius: 3 * unit,
        }}
      />
    </div>
  </>
)

// ─── The vertical "phone" video player (carries the reel motion) ─
const PlayerBody: React.FC<SocialReelProps & { unit: number; fontFamily: string }> = (p) => {
  const frame = useCurrentFrame()
  const duration = p.durationInFrames ?? SOCIAL_REEL_DURATION_FRAMES
  const u = p.unit
  // Ken-Burns slow zoom on the backdrop
  const kb = interpolate(frame, [0, duration], [1, 1.08], {
    extrapolateRight: 'clamp',
  })
  const progress = interpolate(frame, [0, duration], [0, 1], {
    extrapolateRight: 'clamp',
  })

  // Scene windows scaled to the 150-frame total (was 5 scenes over 15s @ 1080x1920)
  const S = (sec: number) => Math.round((sec / 5) * 30) // remap 15s plan -> 5s clip
  return (
    <AbsoluteFill style={{ background: p.bgFrom, overflow: 'hidden' }}>
      {/* backdrop gradient with Ken-Burns zoom */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(150deg, ${p.bgFrom} 0%, ${p.bgVia} 50%, ${p.bgTo} 100%)`,
          transform: `scale(${kb})`,
          transformOrigin: 'center',
        }}
      />
      {/* soft vignette for legibility */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(120% 80% at 50% 35%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.45) 100%)',
        }}
      />

      <TopBar
        brandName={p.brandName}
        handle={p.handle}
        accent={p.accentColor}
        unit={u}
        fontFamily={p.fontFamily}
      />
      <ActionRail
        accent={p.accentColor}
        likeCount={p.likeCount}
        frame={frame}
        unit={u}
        fontFamily={p.fontFamily}
      />
      <BottomChrome
        caption={p.caption}
        accent={p.accentColor}
        progress={progress}
        unit={u}
        fontFamily={p.fontFamily}
      />

      {/* --- Scene 1: catch copy + accent wipe (0-1.6s) --- */}
      <Sequence from={0} durationInFrames={S(8)} layout="none">
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
          <FadeIn delay={4} duration={16} direction="up" unit={u}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 * u }}>
              <AccentLine color={p.accentColor} delay={6} width={120} unit={u} />
              <div
                style={{
                  fontSize: 78 * u,
                  fontWeight: 800,
                  color: '#fff',
                  fontFamily: p.fontFamily,
                  textAlign: 'center',
                  lineHeight: 1.08,
                  letterSpacing: '-0.01em',
                }}
              >
                {p.headline}
                <br />
                <span style={{ color: p.accentColor }}>{p.headlineAccent}</span>
              </div>
            </div>
          </FadeIn>
        </AbsoluteFill>
      </Sequence>

      {/* --- Scene 2: second copy (1.6-3.0s) --- */}
      <Sequence from={S(8)} durationInFrames={S(7)} layout="none">
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
          <FadeIn delay={2} duration={16} direction="up" unit={u}>
            <div
              style={{
                fontSize: 70 * u,
                fontWeight: 800,
                color: '#fff',
                fontFamily: p.fontFamily,
                textAlign: 'center',
                lineHeight: 1.1,
                whiteSpace: 'pre-line',
              }}
            >
              {p.secondCopy}
            </div>
          </FadeIn>
        </AbsoluteFill>
      </Sequence>

      {/* --- Scene 3: info panel (3.0-4.6s) --- */}
      {/* from starts exactly where Scene 2 ends (no overlap window) so the second-copy
          text and the info card never cross-fade into each other; end frame unchanged. */}
      <Sequence from={S(8) + S(7)} durationInFrames={S(13) + S(10) - (S(8) + S(7))} layout="none">
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
          <FadeIn delay={0} duration={18} direction="up" unit={u}>
            <div
              style={{
                padding: `${28 * u}px ${44 * u}px`,
                background: 'rgba(0,0,0,0.55)',
                borderRadius: 18 * u,
                border: '1px solid rgba(255,255,255,0.12)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12 * u,
              }}
            >
              {p.infoLines.map((line, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 30 * u,
                    fontWeight: 400,
                    color: '#fff',
                    fontFamily: p.fontFamily,
                    lineHeight: 1.5,
                    letterSpacing: '0.02em',
                    textAlign: 'center',
                  }}
                >
                  {line}
                </div>
              ))}
            </div>
          </FadeIn>
        </AbsoluteFill>
      </Sequence>

      {/* --- Scene 4: CTA pulse (3.4-5.0s) --- */}
      <Sequence from={S(17)} durationInFrames={S(8)} layout="none">
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
          <PulseButton text={p.ctaText} color={p.accentColor} delay={0} unit={u} fontFamily={p.fontFamily} />
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  )
}

export const SocialReel: React.FC<SocialReelProps> = (props) => {
  const { width, height } = useVideoConfig()
  const fontFamily = props.fontFamily ?? SANS
  // The upstream template is a 1920x1080 landscape stage framing a 9:16
  // vertical player. Both are derived from the composition size so the same
  // proportions survive every supported aspect ratio.
  const stageHeight = Math.min(height * 0.94, width * (16 / 9) * 0.94)
  const playerH = stageHeight
  const playerW = playerH * (9 / 16)
  // 1 at the upstream authoring size (a 1080-tall player).
  const unit = playerH / 1080

  return (
    <AbsoluteFill
      data-remotion-design-id="social-reel"
      style={{
        background:
          'radial-gradient(120% 120% at 50% 0%, #2a2d3a 0%, #14151c 55%, #0b0c11 100%)',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          width: playerW,
          height: playerH,
          borderRadius: 36 * unit,
          overflow: 'hidden',
          position: 'relative',
          boxShadow: `0 ${40 * unit}px ${120 * unit}px rgba(0,0,0,0.6), 0 0 0 ${2 * unit}px rgba(255,255,255,0.06)`,
        }}
      >
        <PlayerBody {...props} unit={unit} fontFamily={fontFamily} />
      </div>
    </AbsoluteFill>
  )
}

export default SocialReel
