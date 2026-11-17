import React from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { capiteStyleById, capiteTextCss, capiteWordCss } from '../captions/capiteStyles'
import { activeCue, captionWords, cueEntrance, type CaptionSettings } from './captions'
import { TEXT_SHADOW } from './textStyle'
import { fontStackById } from './presets'
import { hexWithAlpha } from './effects'

/**
 * The caption line on screen at this frame, with the spoken word highlighted. Plain text, a rounded box and a text shadow, which
 * the browser exporter draws (a box radius of half the line height, not 999px, as the exporter does not clamp it). The live Player,
 * the editor and the export all draw it with this one component.
 */
export const CaptionsLayer: React.FC<{ captions: CaptionSettings | undefined; compH: number; fontFamily?: string }> = ({ captions, compH, fontFamily }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  if (!captions?.enabled || captions.cues.length === 0) return null
  const cue = activeCue(captions.cues, frame, fps)
  if (!cue) return null
  const st = captions.style
  const fontSize = Math.round(compH * st.size)
  const words = captionWords(cue, frame, fps, st.highlight)
  // One of the 27 Capite looks: its font, outline and word animation, still following the person's own colour, caps, weight and box controls.
  const base = capiteStyleById(st.look)
  const look = base ? { ...base, primaryColor: st.color, highlightColor: st.highlightColor } : undefined
  const activeIdx = words.findIndex((w) => w.active)
  const { opacity, rise } = cueEntrance(cue, frame, fps)
  const edge = Math.round(compH * 0.07)
  const place: React.CSSProperties =
    st.position === 'top' ? { top: edge } : st.position === 'middle' ? { top: '50%', marginTop: -fontSize } : { bottom: edge }
  return (
    <AbsoluteFill style={{ zIndex: 900, pointerEvents: 'none', opacity, transform: rise ? `translateY(${rise * compH}px)` : undefined }} data-testid="captions-layer">
      <div style={{ position: 'absolute', left: '5%', right: '5%', display: 'flex', justifyContent: 'center', ...place }}>
        <div
          data-testid="caption-line"
          style={{
            maxWidth: '100%',
            textAlign: 'center',
            fontFamily: fontStackById(fontFamily),
            fontSize,
            fontWeight: st.bold ? 800 : 500,
            lineHeight: 1.2,
            letterSpacing: st.uppercase ? '0.02em' : '-0.005em',
            color: st.color,
            textShadow: st.box ? 'none' : TEXT_SHADOW,
            ...(look ? { ...(capiteTextCss(look, fontSize, fontStackById(fontFamily)) as React.CSSProperties), fontWeight: st.bold ? 800 : 500, textTransform: st.uppercase ? 'uppercase' : 'none', textShadow: st.box ? 'none' : (capiteTextCss(look, fontSize, fontStackById(fontFamily)).textShadow as string | undefined) } : {}),
            ...(st.box
              ? { background: hexWithAlpha(st.boxColor, st.boxOpacity), padding: '0.25em 0.6em', borderRadius: '0.6em' }
              : {}),
          }}
        >
          {words.map((w, i) => (
            <React.Fragment key={i}>
              {i > 0 ? ' ' : null}
              <span data-testid="caption-word" data-active={w.active ? '1' : '0'} style={look
                ? { color: st.color, textTransform: st.uppercase ? 'uppercase' : undefined, ...(capiteWordCss(look, st.highlight === 'none' ? 'idle' : w.active ? 'active' : activeIdx >= 0 && i < activeIdx ? 'spoken' : 'idle', fontSize) as React.CSSProperties) }
                : { color: w.active ? st.highlightColor : st.color, textTransform: st.uppercase ? 'uppercase' : undefined }}>
                {w.text}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  )
}
