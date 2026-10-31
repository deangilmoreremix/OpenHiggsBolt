'use client'

import { useState } from 'react'
import { CheckCircle2, Download, Loader2, PlayCircle, ShieldCheck, Sparkles, Upload, X } from 'lucide-react'
import { useDemoPersonalize } from '../DemoPersonalizeProvider'
import { uploadPersonalizationAsset } from '../assetUploadService'
import { BeforeAfterPreview } from '../preview/BeforeAfterPreview'
import { buildPreviewInput } from './buildPreviewInput'
import { OverlayEditor } from './OverlayEditor'
import { C, badgeStyle, chipStyle, hintStyle, labelStyle, panelStyle, primaryButtonStyle, secondaryButtonStyle, softPanelStyle } from './tokens'
import { DEFAULT_PREVIEW_BRAND_COLORS, PREVIEW_ASPECT_RATIOS } from '../preview/types'
import { LAYER_IDS_BY_LAYOUT, PREVIEW_LAYOUTS } from '../preview/presets'
import { LAYER_LABELS } from './layerChanges'
import { DesignGallery } from './DesignGallery'
import { getRemotionDesignFixedSvgIdWarning } from '../templates/catalog'
import { chooseFinalOutputPath } from '../finalOutput'

const BRAND_COLOR_FIELDS = [
  ['Primary', 'primary'],
  ['Accent', 'accent'],
  ['Text', 'text'],
] as const

const stepLabelStyle: React.CSSProperties = {
  ...labelStyle,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  marginBottom: 6,
}

const stepNumberStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 16,
  height: 16,
  borderRadius: 999,
  background: C.cyanSoft,
  border: `1px solid ${C.cyanBorder}`,
  color: C.cyan,
  fontSize: 9,
  fontWeight: 800,
}

/**
 * Simple Mode step 4 — free Before/After preview, direct on-video overlay
 * editing, approval and handoff to one of two clearly different final-video
 * paths: a local branded render (overlays baked onto the selected video, no AI
 * credits) or the existing AI generation flow (changes that need new imagery).
 *
 * The branded render and AI generation are separate operations and the UI never
 * implies otherwise. Nothing in the preview itself calls MuAPI or OpenAI.
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
    updatePreviewBrandColors = () => {},
    setPreviewLayout,
    remotionDesignTemplates = [],
    activeRemotionDesignId = null,
    setRemotionDesign = () => {},
    remotionDesignError = null,
    previewApproved,
    approvePersonalization,
    createFinalVideo,
    cancelExport,
    apiKey,
    generation,
    result,
    mode,
  } = ctx

  const isAnonymous = access !== 'authenticated'
  const generating = generation?.status === 'generating' || generation?.status === 'processing' || generation?.status === 'personalizing-prompt'
  const inputProps = buildPreviewInput({ source, previewSettings, previewVideo, clientForm, assets })
  // Overlay-only personalizations render locally; AI modes keep the generation
  // pipeline. The active path is the primary action; the other stays visible
  // (and disabled) so the two operations are never conflated.
  const finalPath = chooseFinalOutputPath({ personalizationMode: mode || null })
  const isBrandedPath = finalPath === 'branded-render'
  // Phase 3 item 13: some frozen upstream designs hardcode SVG `id`s, so a
  // second instance of the same design is clipped by the first. The catalog
  // declares which designs are constrained; Step 4 shows a non-blocking
  // note next to the "Designs" chip row when the selected one is affected.
  const fixedSvgIdWarning = getRemotionDesignFixedSvgIdWarning(activeRemotionDesignId)

  const brandColors = { ...DEFAULT_PREVIEW_BRAND_COLORS, ...(previewSettings.brandColors ?? {}) }
  const activeLayout = PREVIEW_LAYOUTS.find((layout) => layout.id === previewSettings.layout) ?? null
  const activeDesign = remotionDesignTemplates.find((design) => design.id === activeRemotionDesignId) ?? null
  const [showVideoAdvanced, setShowVideoAdvanced] = useState(false)
  const [showCompare, setShowCompare] = useState(false)

  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  const handleCreate = async () => {
    if (generating) return
    try {
      await createFinalVideo()
    } catch {
      /* generation errors surface through the existing generation state */
    }
  }

  const handleDownload = () => {
    if (!result?.url) return
    const link = document.createElement('a')
    link.href = result.url
    link.download = (result.metadata?.fileName as string) || 'personalized-video.mp4'
    link.rel = 'noopener'
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  const handleUpload = async () => {
    if (!result?.url || !apiKey) return
    setIsUploading(true)
    setUploadError(null)
    setUploadSuccess(false)
    try {
      const response = await fetch(result.url)
      const blob = await response.blob()
      const fileName = (result.metadata?.fileName as string) || `personalized-video.${blob.type.replace('video/', '')}`
      const file = new File([blob], fileName, { type: blob.type })
      await uploadPersonalizationAsset(apiKey, { file })
      setUploadSuccess(true)
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: C.text }}>Preview and approve</h2>
        <p style={{ margin: '4px 0 0', color: C.muted, fontSize: 12, lineHeight: 1.55 }}>
          Pick a starting look, optionally add an animated design, then fine-tune each item directly on the
          video. Previews are free and run in your browser.
        </p>
      </div>

      {/* ── Quick adjustments ───────────────────────────────────────────── */}
      <div style={panelStyle}>
        <h3 style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em', color: C.text }}>
          Quick adjustments
        </h3>
        <p style={{ ...hintStyle, marginTop: 0, marginBottom: 12 }}>
          Every choice here shows up straight away in the editor below — that preview is exactly what gets rendered.
        </p>

        <div style={stepLabelStyle}>
          <span style={stepNumberStyle}>1</span> Starting look
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {PREVIEW_LAYOUTS.map((layout) => (
            <button
              key={layout.id}
              type="button"
              onClick={() => setPreviewLayout(layout.id)}
              aria-pressed={previewSettings.layout === layout.id}
              title={layout.description}
              style={chipStyle(previewSettings.layout === layout.id)}
            >
              {layout.name}
            </button>
          ))}
        </div>
        {activeLayout ? (
          <p style={{ ...hintStyle, marginTop: 6 }}>
            {activeLayout.description} Places: {LAYER_IDS_BY_LAYOUT[activeLayout.id].map((kind) => LAYER_LABELS[kind]).join(', ')}.
          </p>
        ) : null}

        {remotionDesignTemplates.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={stepLabelStyle}>
              <span style={stepNumberStyle}>2</span> Animated design <span style={{ color: C.muted, fontWeight: 600, textTransform: 'none', letterSpacing: 0 }}>(optional — added on top of your starting look)</span>
            </div>
            <p style={{ ...hintStyle, marginTop: 0, marginBottom: 8 }}>
              Each card shows the design with your own logo, text and colors. Hover a card to watch it play,
              click to add it.
            </p>
            <DesignGallery
              designs={remotionDesignTemplates}
              activeDesignId={activeRemotionDesignId}
              onSelect={setRemotionDesign}
              inputProps={inputProps}
            />
            {activeDesign ? <p style={{ ...hintStyle, marginTop: 8 }}>{activeDesign.description}</p> : null}
            {fixedSvgIdWarning ? (
              <p role="note" style={{ ...hintStyle, marginTop: 8 }}>
                {fixedSvgIdWarning}
              </p>
            ) : null}
            {remotionDesignError ? (
              <p style={{ ...hintStyle, color: C.danger, marginTop: 8 }}>{remotionDesignError}</p>
            ) : null}
          </div>
        )}

        <div style={{ marginTop: 14 }}>
          <div style={stepLabelStyle}>
            <span style={stepNumberStyle}>{remotionDesignTemplates.length > 0 ? 3 : 2}</span> Colors
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            {BRAND_COLOR_FIELDS.map(([label, key]) => (
              <label key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4, color: C.muted, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>
                {label}
                <input
                  type="color"
                  aria-label={`${label} color`}
                  value={brandColors[key]}
                  onChange={(event) => updatePreviewBrandColors({ [key]: event.target.value })}
                  style={{ width: 52, height: 34, borderRadius: 8, border: `1px solid ${C.border}`, background: C.field, padding: 3 }}
                />
              </label>
            ))}
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, color: C.muted, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', minWidth: 140, flex: '1 1 140px' }}>
              Shade behind text
              <input
                type="range"
                aria-label="Shade behind text"
                min={0}
                max={0.6}
                step={0.02}
                value={brandColors.backgroundDim}
                onChange={(event) => updatePreviewBrandColors({ backgroundDim: Number(event.target.value) })}
                style={{ width: '100%', accentColor: C.cyan }}
              />
            </label>
          </div>
          <p style={{ ...hintStyle, marginTop: 6 }}>
            Primary → design backgrounds and shapes · Accent → buttons and highlights · Text → headlines and
            captions. A color picked on a single item overrides these.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 12, marginTop: 14 }}>
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
        <button
          type="button"
          onClick={() => setShowVideoAdvanced((open) => !open)}
          aria-expanded={showVideoAdvanced}
          style={{ background: 'transparent', border: 'none', color: C.muted, cursor: 'pointer', padding: 0, fontSize: 11, fontWeight: 700, marginTop: 10 }}
        >
          {showVideoAdvanced ? '▾' : '▸'} Advanced
        </button>
        {showVideoAdvanced && (
          <div style={{ marginTop: 8, maxWidth: 240 }}>
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
        )}
      </div>

      {/* ── Direct on-video overlay editing ─────────────────────────────── */}
      <OverlayEditor inputProps={inputProps} />

      {/* ── Before / After (on demand) ──────────────────────────────────── */}
      <div style={panelStyle}>
        <button
          type="button"
          onClick={() => setShowCompare((open) => !open)}
          aria-expanded={showCompare}
          style={{ ...secondaryButtonStyle, minHeight: 32 }}
        >
          {showCompare ? 'Hide comparison' : 'Compare with the original video'}
        </button>
        {showCompare ? (
          <div style={{ marginTop: 12 }}>
            <BeforeAfterPreview inputProps={inputProps} defaultMode="toggle" />
          </div>
        ) : null}
      </div>

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
          Approving saves your layout, colors and overlay positions. Previews are always free — choose
          how the final video is produced below: a branded render bakes your approved overlays onto the
          selected video, while AI generation is only for changes that need new imagery.
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={generating || !isBrandedPath}
                  aria-pressed={isBrandedPath}
                  style={{
                    ...(isBrandedPath ? primaryButtonStyle : secondaryButtonStyle),
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    opacity: generating ? 0.6 : isBrandedPath ? 1 : 0.5,
                  }}
                >
                  {generating && isBrandedPath ? <Loader2 size={14} className="animate-spin" /> : <PlayCircle size={14} />}
                  {generating && isBrandedPath
                    ? `Rendering… ${generation?.progress || 0}%`
                    : 'Render branded video'}
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={generating || isBrandedPath}
                  aria-pressed={!isBrandedPath}
                  style={{
                    ...(isBrandedPath ? secondaryButtonStyle : primaryButtonStyle),
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    opacity: generating ? 0.6 : isBrandedPath ? 0.5 : 1,
                  }}
                >
                  {generating && !isBrandedPath ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  {generating && !isBrandedPath
                    ? `Generating… ${generation?.progress || 0}%`
                    : 'Generate with AI'}
                </button>
              </div>
              <p style={{ ...hintStyle, color: isBrandedPath ? C.cyan : C.muted }}>
                <strong style={{ fontWeight: 800 }}>Render branded video</strong> bakes your approved
                overlays (logo, text, CTA, end card) onto the selected video — no AI credits used.
              </p>
              <p style={{ ...hintStyle, color: isBrandedPath ? C.muted : C.cyan }}>
                <strong style={{ fontWeight: 800 }}>Generate with AI</strong> uses your account&apos;s AI
                generation for changes that need new imagery or footage.
              </p>
              {generating && isBrandedPath && (
                <button
                  type="button"
                  onClick={() => cancelExport()}
                  style={{
                    ...secondaryButtonStyle,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    marginTop: 4,
                    border: `1px solid ${C.danger}`,
                    color: C.danger,
                    background: 'rgba(239,91,103,.10)',
                  }}
                >
                  <X size={14} />
                  Cancel render
                </button>
              )}
            </div>
          )}
        </div>
        {generating && generation?.progressMessage && (
          <p style={{ ...hintStyle, marginTop: 8, color: C.cyan }}>{generation.progressMessage}</p>
        )}
        {generation?.status === 'error' && generation?.errorMessage && (
          <p style={{ ...hintStyle, marginTop: 8, color: C.danger }}>{generation.errorMessage}</p>
        )}
        {generation?.status === 'complete' && result?.type === 'video' && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginTop: 12 }}>
            <button
              type="button"
              onClick={handleDownload}
              style={{ ...primaryButtonStyle, display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <Download size={14} />
              Download video
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={isUploading || uploadSuccess}
              style={{ ...secondaryButtonStyle, display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {isUploading ? 'Uploading…' : uploadSuccess ? 'Uploaded' : 'Upload to Asset Library'}
            </button>
            {uploadError && <p style={{ ...hintStyle, color: C.danger }}>{uploadError}</p>}
            {uploadSuccess && <p style={{ ...hintStyle, color: C.green }}>Uploaded to Asset Library</p>}
          </div>
        )}
      </div>
    </div>
  )
}
