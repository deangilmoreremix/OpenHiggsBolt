'use client'

import { CheckCircle2, Loader2, PlayCircle, ShieldCheck } from 'lucide-react'
import { useDemoPersonalize } from '../DemoPersonalizeProvider'
import { BeforeAfterPreview } from '../preview/BeforeAfterPreview'
import { buildPreviewInput } from './buildPreviewInput'
import { OverlayEditor } from './OverlayEditor'
import { C, badgeStyle, chipStyle, hintStyle, labelStyle, panelStyle, primaryButtonStyle, secondaryButtonStyle, softPanelStyle } from './tokens'
import { PREVIEW_ASPECT_RATIOS } from '../preview/types'
import { PREVIEW_LAYOUTS } from '../preview/presets'

/**
 * Simple Mode step 4 — free Before/After preview, direct on-video overlay
 * editing, approval and handoff to the existing final-generation workflow.
 *
 * Nothing here calls MuAPI or OpenAI: the preview is 100% browser-local.
 */
export function StepPreviewApprove(): React.JSX.Element {
  const ctx = useDemoPersonalize()
  const {
    source,
    access,
    clientForm = {},
    assets,
    previewSettings,
    previewVideo,
    updatePreviewComposition,
    setPreviewLayout,
    previewApproved,
    approvePersonalization,
    createFinalVideo,
    generation,
  } = ctx

  const isAnonymous = access !== 'authenticated'
  const generating = generation?.status === 'generating' || generation?.status === 'personalizing-prompt'
  const inputProps = buildPreviewInput({ source, previewSettings, previewVideo, clientForm, assets })

  const handleCreate = async () => {
    if (generating) return
    try {
      await createFinalVideo()
    } catch {
      /* generation errors surface through the existing generation state */
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: C.text }}>Preview and approve</h2>
        <p style={{ margin: '4px 0 0', color: C.muted, fontSize: 12, lineHeight: 1.55 }}>
          Watch the original and your personalized version side by side. Drag, resize and edit your branding
          directly on the video below. Previews are free and run in your browser.
        </p>
      </div>

      {/* ── Before / After ──────────────────────────────────────────────── */}
      <div style={panelStyle}>
        <BeforeAfterPreview inputProps={inputProps} defaultMode="toggle" />
      </div>

      {/* ── Quick adjustments ───────────────────────────────────────────── */}
      <div style={panelStyle}>
        <h3 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em', color: C.text }}>
          Quick adjustments
        </h3>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {PREVIEW_LAYOUTS.map((layout) => (
            <button
              key={layout.id}
              type="button"
              onClick={() => setPreviewLayout(layout.id)}
              aria-pressed={previewSettings.layout === layout.id}
              style={chipStyle(previewSettings.layout === layout.id)}
            >
              {layout.name}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 12 }}>
          <div>
            <label style={labelStyle} htmlFor="guided-aspect">Video shape</label>
            <select
              id="guided-aspect"
              value={previewSettings.aspectRatio}
              onChange={(event) =>
                updatePreviewComposition({ aspectRatio: event.target.value as (typeof PREVIEW_ASPECT_RATIOS)[number] })
              }
              style={{ ...softPanelStyle, width: '100%', color: C.text, fontSize: 12 }}
            >
              {PREVIEW_ASPECT_RATIOS.map((ratio) => (
                <option key={ratio} value={ratio}>{ratio}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle} htmlFor="guided-fps">Smoothness (frames per second)</label>
            <select
              id="guided-fps"
              value={previewSettings.fps}
              onChange={(event) => updatePreviewComposition({ fps: Number(event.target.value) })}
              style={{ ...softPanelStyle, width: '100%', color: C.text, fontSize: 12 }}
            >
              <option value={24}>24</option>
              <option value={30}>30</option>
              <option value={60}>60</option>
            </select>
          </div>
          <div>
            <label style={labelStyle} htmlFor="guided-duration">Length (seconds)</label>
            <input
              id="guided-duration"
              type="number"
              min={1}
              max={120}
              value={Math.round(previewSettings.durationInFrames / (previewSettings.fps || 30))}
              onChange={(event) => {
                const seconds = Math.max(1, Number(event.target.value) || 1)
                updatePreviewComposition({ durationInFrames: Math.round(seconds * (previewSettings.fps || 30)) })
              }}
              style={{ ...softPanelStyle, width: '100%', color: C.text, fontSize: 12 }}
            />
          </div>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 7, color: C.text, fontSize: 12, marginTop: 12, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={previewSettings.showEndCard}
            onChange={(event) => updatePreviewComposition({ showEndCard: event.target.checked })}
          />
          End with a branded card (logo, contact details and final call to action)
        </label>
      </div>

      {/* ── Direct on-video overlay editing ─────────────────────────────── */}
      <OverlayEditor inputProps={inputProps} />

      {/* ── Approve & create ────────────────────────────────────────────── */}
      <div style={{ ...panelStyle, border: `1px solid ${previewApproved ? 'rgba(40,201,139,.45)' : C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          <ShieldCheck size={15} color={previewApproved ? C.green : C.cyan} />
          <h3 style={{ margin: 0, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em', color: C.text }}>
            Approve and create
          </h3>
          {previewApproved && <span style={badgeStyle('green')}><CheckCircle2 size={10} /> Approved</span>}
        </div>
        <p style={{ ...hintStyle, marginBottom: 12 }}>
          Approving saves your layout, colors and overlay positions. Creating the final video renders it with your
          account&apos;s generation workflow — the preview itself never charges anything.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => approvePersonalization()}
            disabled={generating}
            style={{ ...secondaryButtonStyle, opacity: previewApproved ? 0.6 : 1 }}
          >
            {previewApproved ? 'Approved' : 'Approve this personalization'}
          </button>
          {isAnonymous ? (
            <span style={{ color: C.muted, fontSize: 12 }}>
              Sign in to create your final video — the preview is always free.
            </span>
          ) : (
            <button
              type="button"
              onClick={handleCreate}
              disabled={generating}
              style={{ ...primaryButtonStyle, display: 'inline-flex', alignItems: 'center', gap: 8, opacity: generating ? 0.6 : 1 }}
            >
              {generating ? <Loader2 size={14} className="animate-spin" /> : <PlayCircle size={14} />}
              {generating ? `Creating… ${generation?.progress || 0}%` : 'Create final video'}
            </button>
          )}
        </div>
        {generating && generation?.progressMessage && (
          <p style={{ ...hintStyle, marginTop: 8, color: C.cyan }}>{generation.progressMessage}</p>
        )}
      </div>
    </div>
  )
}
