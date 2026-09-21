'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Check,
  ChevronDown,
  FlipHorizontal,
  FlipVertical,
  Loader2,
  Maximize2,
  MessageSquare,
  RotateCw,
  Scissors,
  SlidersHorizontal,
  Sparkles,
  Wand2,
  X,
} from 'lucide-react'
import { editImage, type ImageSize } from '@/src/shared/api/openaiImage'
import type { AssetRole, DiscoveredAssetCategory } from '../types'

export type PersonalizationImageEditorAsset = {
  id: string
  name?: string
  imageUrl: string
  category?: DiscoveredAssetCategory
  role?: AssetRole
  source: 'discovered' | 'library'
  businessName?: string
  industry?: string
}

export type ImageEditorApplyResult = {
  dataUrl: string
  originalUrl: string
  operation: string
  prompt: string
  model: 'gpt-image-2.5-flare' | 'gpt-image-2.5-sunburst' | 'local'
  quality: string
  transparent: boolean
  videoReady: boolean
}

type Props = {
  open: boolean
  asset: PersonalizationImageEditorAsset | null
  onClose: () => void
  onApply: (result: ImageEditorApplyResult) => Promise<void> | void
}

type ModelMode = 'auto' | 'fast' | 'precision'
type AspectRatio = 'original' | '9:16' | '16:9' | '1:1' | '4:5'
type ToolId = 'video_ready' | 'remove_background' | 'enhance' | 'reframe' | 'cleanup'

type Version = {
  id: string
  label: string
  dataUrl: string | null
  operation: string
  prompt: string
  model: ImageEditorApplyResult['model']
  transparent: boolean
  videoReady: boolean
}

const C = {
  bg: '#080b0f',
  modal: '#101419',
  panel: '#151a20',
  panelSoft: '#12171c',
  field: '#0d1116',
  border: 'rgba(255,255,255,.10)',
  borderStrong: 'rgba(255,255,255,.16)',
  text: '#f7f9fb',
  muted: 'rgba(255,255,255,.58)',
  muted2: 'rgba(255,255,255,.36)',
  cyan: '#29d3f2',
  cyanSoft: 'rgba(41,211,242,.12)',
  cyanBorder: 'rgba(41,211,242,.45)',
  green: '#28c98b',
} as const

const aspectSizes: Record<Exclude<AspectRatio, 'original'>, ImageSize> = {
  '9:16': '1024x1792',
  '16:9': '1792x1024',
  '1:1': '1024x1024',
  '4:5': '1024x1280',
}

const aspectCanvas: Record<Exclude<AspectRatio, 'original'>, [number, number]> = {
  '9:16': [1024, 1792],
  '16:9': [1792, 1024],
  '1:1': [1024, 1024],
  '4:5': [1024, 1280],
}

function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',')
  const header = parts[0] || ''
  const base64 = parts[1] || ''
  const mime = header.match(/:(.*?);/)?.[1] || 'image/png'
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error || new Error('Unable to read image'))
    reader.readAsDataURL(blob)
  })
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Unable to load image'))
    img.src = dataUrl
  })
}

function getRoleLabel(role?: AssetRole) {
  return role ? role.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()) : null
}

function isCutoutAsset(asset: PersonalizationImageEditorAsset | null) {
  if (!asset) return false
  return (
    asset.category === 'person' ||
    asset.category === 'logo' ||
    asset.category === 'product' ||
    asset.role === 'presenter_identity' ||
    asset.role === 'face_identity' ||
    asset.role === 'character_identity' ||
    asset.role === 'logo' ||
    asset.role === 'product_reference' ||
    asset.role === 'cta_graphic'
  )
}

function isPrecisionSensitive(asset: PersonalizationImageEditorAsset | null) {
  if (!asset) return false
  return (
    asset.category === 'person' ||
    asset.category === 'logo' ||
    asset.category === 'product' ||
    asset.role === 'presenter_identity' ||
    asset.role === 'face_identity' ||
    asset.role === 'character_identity' ||
    asset.role === 'logo' ||
    asset.role === 'product_reference'
  )
}

function recommendedActions(asset: PersonalizationImageEditorAsset | null): ToolId[] {
  if (!asset) return ['video_ready', 'enhance', 'reframe']
  if (asset.category === 'logo' || asset.role === 'logo') return ['video_ready', 'remove_background', 'enhance', 'reframe']
  if (asset.category === 'person' || asset.role?.includes('identity')) return ['video_ready', 'remove_background', 'enhance', 'reframe']
  if (asset.category === 'product' || asset.role === 'product_reference') return ['video_ready', 'remove_background', 'enhance', 'cleanup', 'reframe']
  return ['video_ready', 'enhance', 'cleanup', 'reframe']
}

function buildPrompt(
  asset: PersonalizationImageEditorAsset,
  operation: ToolId | 'custom',
  customPrompt: string,
  aspect: AspectRatio,
) {
  const businessContext = [asset.businessName, asset.industry].filter(Boolean).join(' - ')
  const context = businessContext ? ' Business context: ' + businessContext + '.' : ''
  const preserve = isPrecisionSensitive(asset)
    ? ' Preserve the primary subject, identity, recognizable product or logo, proportions, brand colors, important text, and composition unless the requested edit specifically requires a change.'
    : ' Preserve the important business subject, branding, and composition unless the requested edit specifically requires a change.'

  if (operation === 'remove_background') {
    return 'Edit this image by isolating the primary subject and removing the entire background. Return a clean transparent-background asset with natural, precise edges. Preserve hair detail, product geometry, facial identity, logos, colors, text, proportions, and the original subject as closely as possible. Do not add new objects.' + context
  }
  if (operation === 'enhance') {
    return 'Edit this image to improve professional visual quality. Improve lighting, exposure, color balance, clarity, edge detail, and overall polish while keeping the subject, identity, product, logo, text, framing, and business branding unchanged. Do not invent new objects or redesign the image.' + context
  }
  if (operation === 'cleanup') {
    return 'Edit this image to remove minor distracting clutter and visual artifacts while keeping the primary subject and business branding intact. Preserve people, products, logos, signage, text, architecture, and important scene details unless they are clearly incidental background distractions. Keep the result realistic.' + context
  }
  if (operation === 'reframe') {
    const target = aspect === 'original' ? 'the current composition' : 'a ' + aspect + ' composition'
    return 'Edit and intelligently reframe this image for ' + target + '. Keep the primary subject fully visible and naturally composed. Extend or reconstruct only the surrounding scene when necessary instead of cutting off important people, products, logos, or business details.' + preserve + context
  }
  if (operation === 'video_ready') {
    const transparent = isCutoutAsset(asset)
    let purpose = 'a polished video asset'
    if (asset.category === 'logo' || asset.role === 'logo') purpose = 'a clean logo overlay'
    else if (asset.category === 'person' || asset.role?.includes('identity')) purpose = 'a professional presenter overlay'
    else if (asset.category === 'product' || asset.role === 'product_reference') purpose = 'a professional product overlay'
    return 'Edit this image so it is ready to use as ' + purpose + ' in SmartVideo. Improve visual quality and composition, remove unnecessary visual distractions, preserve the actual subject and brand identity, and create clean usable edges.' +
      (transparent ? ' Isolate the primary subject from the background and return it on a transparent background.' : '') +
      (aspect !== 'original' ? ' Compose it for ' + aspect + '.' : '') + preserve + context
  }
  return 'Edit the supplied image according to this request: ' + customPrompt.trim() + '.' + preserve + context
}

const toolMeta: Record<ToolId, { label: string; description: string; icon: typeof Sparkles }> = {
  video_ready: { label: 'Make Video Ready', description: 'Automatically prepare this asset for video use.', icon: Sparkles },
  remove_background: { label: 'Remove Background', description: 'Create a clean transparent cutout.', icon: Scissors },
  enhance: { label: 'Clean / Enhance', description: 'Improve lighting, clarity and polish.', icon: Wand2 },
  reframe: { label: 'Reframe', description: 'Prepare the composition for another format.', icon: Maximize2 },
  cleanup: { label: 'Clean Up', description: 'Remove minor distractions and artifacts.', icon: SlidersHorizontal },
}

function PreviewPanel({ label, src }: { label: string; src: string }) {
  return (
    <div className="overflow-hidden rounded-2xl" style={{ border: '1px solid ' + C.border, background: C.modal }}>
      <div className="px-3 py-2 text-[9px] font-black uppercase" style={{ borderBottom: '1px solid ' + C.border, color: C.muted }}>
        {label}
      </div>
      <div className="grid min-h-[320px] place-items-center p-3" style={{ background: '#101419' }}>
        <img src={src} alt={label} className="max-h-[62vh] max-w-full object-contain" />
      </div>
    </div>
  )
}

function Slider({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}) {
  return (
    <label className="block">
      <div className="mb-1 flex items-center justify-between text-[8px] font-bold uppercase" style={{ color: C.muted }}>
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-cyan-400" />
    </label>
  )
}

export default function ImageEditorModal({ open, asset, onClose, onApply }: Props) {
  const [modelMode, setModelMode] = useState<ModelMode>('auto')
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('original')
  const [currentDataUrl, setCurrentDataUrl] = useState<string | null>(null)
  const [versions, setVersions] = useState<Version[]>([])
  const [customPrompt, setCustomPrompt] = useState('')
  const [busyLabel, setBusyLabel] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showMoreTools, setShowMoreTools] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [compare, setCompare] = useState(false)

  const [rotation, setRotation] = useState(0)
  const [flipX, setFlipX] = useState(false)
  const [flipY, setFlipY] = useState(false)
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [saturation, setSaturation] = useState(100)
  const [opacity, setOpacity] = useState(100)
  const [zoom, setZoom] = useState(100)

  useEffect(() => {
    if (!open || !asset) return
    setModelMode('auto')
    setAspectRatio('original')
    setCurrentDataUrl(null)
    setVersions([{ id: 'original', label: 'Original', dataUrl: null, operation: 'original', prompt: '', model: 'local', transparent: false, videoReady: false }])
    setCustomPrompt('')
    setBusyLabel(null)
    setSaving(false)
    setError(null)
    setShowMoreTools(false)
    setShowAdvanced(false)
    setCompare(false)
    setRotation(0)
    setFlipX(false)
    setFlipY(false)
    setBrightness(100)
    setContrast(100)
    setSaturation(100)
    setOpacity(100)
    setZoom(100)
  }, [open, asset?.id])

  const recommended = useMemo(() => recommendedActions(asset), [asset])
  const displayUrl = currentDataUrl || asset?.imageUrl || ''
  const currentVersion = versions.find((v) => v.dataUrl === currentDataUrl) || versions[0]
  const hasChanges = Boolean(currentDataUrl)

  const resolvedModel = useMemo<'gpt-image-2.5-flare' | 'gpt-image-2.5-sunburst'>(() => {
    if (modelMode === 'fast') return 'gpt-image-2.5-flare'
    if (modelMode === 'precision') return 'gpt-image-2.5-sunburst'
    return isPrecisionSensitive(asset) ? 'gpt-image-2.5-sunburst' : 'gpt-image-2.5-flare'
  }, [modelMode, asset])

  const prepareSourceDataUrl = useCallback(async () => {
    if (currentDataUrl) return currentDataUrl
    if (!asset?.imageUrl) throw new Error('No image is available to edit')
    if (asset.imageUrl.startsWith('data:')) return asset.imageUrl
    if (asset.imageUrl.startsWith('blob:')) {
      const response = await fetch(asset.imageUrl)
      if (!response.ok) throw new Error('Unable to read local image')
      return blobToDataUrl(await response.blob())
    }
    const response = await fetch('/api/personalization/download-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ urls: [asset.imageUrl] }),
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(payload?.error || 'Unable to prepare image for editing')
    const result = payload?.results?.[0]
    if (!result?.ok || !result?.dataUrl) throw new Error(result?.error || 'Unable to download image')
    return result.dataUrl as string
  }, [asset?.imageUrl, currentDataUrl])

  const pushVersion = useCallback((version: Omit<Version, 'id'>) => {
    const next: Version = { ...version, id: 'version_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7) }
    setVersions((prev) => [...prev, next])
    setCurrentDataUrl(next.dataUrl)
  }, [])

  const runAiEdit = useCallback(async (operation: ToolId | 'custom', custom = '') => {
    if (!asset || (operation === 'custom' && !custom.trim())) return
    setBusyLabel(operation === 'custom' ? 'Applying AI edit' : toolMeta[operation].label)
    setError(null)
    try {
      const sourceDataUrl = await prepareSourceDataUrl()
      const blob = dataUrlToBlob(sourceDataUrl)
      const prompt = buildPrompt(asset, operation, custom, aspectRatio)
      const transparent = operation === 'remove_background' || (operation === 'video_ready' && isCutoutAsset(asset))
      const quality = resolvedModel === 'gpt-image-2.5-sunburst' ? 'high' : 'medium'
      const size = aspectRatio === 'original' ? 'auto' : aspectSizes[aspectRatio]
      const results = await editImage({
        prompt,
        image: blob,
        model: resolvedModel,
        n: 1,
        quality,
        size,
        output_format: 'png',
        background: transparent ? 'transparent' : 'auto',
        input_fidelity: isPrecisionSensitive(asset) ? 'high' : 'low',
      })
      const first = results?.[0]
      let nextDataUrl = first?.b64_json ? 'data:image/png;base64,' + first.b64_json : ''
      if (!nextDataUrl && first?.url) {
        const response = await fetch('/api/personalization/download-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ urls: [first.url] }),
        })
        const payload = await response.json().catch(() => ({}))
        nextDataUrl = payload?.results?.[0]?.dataUrl || ''
      }
      if (!nextDataUrl) throw new Error('The image edit completed without an image result')
      pushVersion({
        label: operation === 'custom' ? 'AI Edit' : toolMeta[operation].label,
        dataUrl: nextDataUrl,
        operation,
        prompt,
        model: resolvedModel,
        transparent,
        videoReady: operation === 'video_ready',
      })
      if (operation === 'custom') setCustomPrompt('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image edit failed')
    } finally {
      setBusyLabel(null)
    }
  }, [asset, aspectRatio, prepareSourceDataUrl, pushVersion, resolvedModel])

  const applyLocalAdjustments = useCallback(async () => {
    if (!asset) return
    setBusyLabel('Applying local edits')
    setError(null)
    try {
      const sourceDataUrl = await prepareSourceDataUrl()
      const img = await loadImage(sourceDataUrl)
      let canvasWidth = img.naturalWidth
      let canvasHeight = img.naturalHeight
      if (aspectRatio !== 'original') [canvasWidth, canvasHeight] = aspectCanvas[aspectRatio]
      const maxEdge = 2048
      const edgeScale = Math.min(1, maxEdge / Math.max(canvasWidth, canvasHeight))
      canvasWidth = Math.max(1, Math.round(canvasWidth * edgeScale))
      canvasHeight = Math.max(1, Math.round(canvasHeight * edgeScale))
      const canvas = document.createElement('canvas')
      canvas.width = canvasWidth
      canvas.height = canvasHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Browser canvas is unavailable')
      ctx.clearRect(0, 0, canvasWidth, canvasHeight)
      ctx.save()
      ctx.translate(canvasWidth / 2, canvasHeight / 2)
      ctx.rotate((rotation * Math.PI) / 180)
      ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1)
      ctx.globalAlpha = opacity / 100
      ctx.filter = 'brightness(' + brightness + '%) contrast(' + contrast + '%) saturate(' + saturation + '%)'
      const contain = Math.min(canvasWidth / img.naturalWidth, canvasHeight / img.naturalHeight)
      const scale = contain * (zoom / 100)
      const drawWidth = img.naturalWidth * scale
      const drawHeight = img.naturalHeight * scale
      ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight)
      ctx.restore()
      pushVersion({
        label: 'Local Adjustments',
        dataUrl: canvas.toDataURL('image/png'),
        operation: 'local_adjustments',
        prompt: '',
        model: 'local',
        transparent: currentVersion?.transparent || false,
        videoReady: currentVersion?.videoReady || false,
      })
      setRotation(0); setFlipX(false); setFlipY(false); setBrightness(100); setContrast(100); setSaturation(100); setOpacity(100); setZoom(100)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Local edit failed')
    } finally {
      setBusyLabel(null)
    }
  }, [asset, aspectRatio, brightness, contrast, currentVersion?.transparent, currentVersion?.videoReady, flipX, flipY, opacity, prepareSourceDataUrl, pushVersion, rotation, saturation, zoom])

  const handleApply = useCallback(async () => {
    if (!asset) return
    if (!currentDataUrl) { onClose(); return }
    setSaving(true)
    setError(null)
    try {
      await onApply({
        dataUrl: currentDataUrl,
        originalUrl: asset.imageUrl,
        operation: currentVersion?.operation || 'edit',
        prompt: currentVersion?.prompt || '',
        model: currentVersion?.model || 'local',
        quality: currentVersion?.model === 'gpt-image-2.5-sunburst' ? 'high' : currentVersion?.model === 'local' ? 'local' : 'medium',
        transparent: currentVersion?.transparent || false,
        videoReady: currentVersion?.videoReady || false,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save edited asset')
    } finally {
      setSaving(false)
    }
  }, [asset, currentDataUrl, currentVersion, onApply, onClose])

  if (!open || !asset) return null
  const categoryLabel = (asset.category && asset.category !== 'irrelevant' ? asset.category.replace(/_/g, ' ') : null) || getRoleLabel(asset.role) || 'Image Asset'
  const allTools = (Object.keys(toolMeta) as ToolId[]).filter((id) => !recommended.includes(id))

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 md:p-5" style={{ background: 'rgba(0,0,0,.82)', backdropFilter: 'blur(10px)' }} role="dialog" aria-modal="true" aria-label="SmartVideo Image Editor">
      <div className="flex h-[96vh] w-full max-w-[1500px] flex-col overflow-hidden" style={{ background: C.modal, border: '1px solid ' + C.borderStrong, borderRadius: 22, boxShadow: '0 28px 90px rgba(0,0,0,.55)', color: C.text }}>
        <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-5" style={{ borderBottom: '1px solid ' + C.border }}>
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-9 w-9 flex-none place-items-center rounded-xl" style={{ background: C.cyanSoft, color: C.cyan }}><Sparkles size={18} /></div>
            <div className="min-w-0">
              <div className="text-[12px] font-black uppercase tracking-[.12em]">SmartVideo Image Editor</div>
              <div className="truncate text-[10px] capitalize" style={{ color: C.muted }}>{categoryLabel} · {asset.name || 'Business asset'}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && <button type="button" onClick={() => setCompare((v) => !v)} className="rounded-lg px-3 py-2 text-[10px] font-extrabold uppercase" style={{ border: '1px solid ' + (compare ? C.cyanBorder : C.border), color: compare ? C.cyan : C.text }}>{compare ? 'Editing View' : 'Compare'}</button>}
            <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg" style={{ border: '1px solid ' + C.border, color: C.muted }} aria-label="Close image editor"><X size={16} /></button>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[250px_minmax(0,1fr)_290px]">
          <aside className="hidden overflow-y-auto p-4 lg:block" style={{ borderRight: '1px solid ' + C.border }}>
            <div className="mb-2 text-[9px] font-black uppercase tracking-[.14em]" style={{ color: C.muted }}>Smart Actions</div>
            <div className="space-y-2">
              {recommended.map((id) => {
                const meta = toolMeta[id]; const Icon = meta.icon
                return <button key={id} type="button" disabled={Boolean(busyLabel)} onClick={() => runAiEdit(id)} className="w-full rounded-xl p-3 text-left disabled:opacity-50" style={{ border: '1px solid ' + (id === 'video_ready' ? C.cyanBorder : C.border), background: id === 'video_ready' ? C.cyanSoft : C.panelSoft }}>
                  <div className="mb-1 flex items-center gap-2"><Icon size={14} style={{ color: C.cyan }} /><span className="text-[10px] font-extrabold uppercase">{meta.label}</span></div>
                  <div className="text-[9px] leading-4" style={{ color: C.muted }}>{meta.description}</div>
                </button>
              })}
            </div>
            {allTools.length > 0 && <div className="mt-3">
              <button type="button" onClick={() => setShowMoreTools((v) => !v)} className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-[10px] font-extrabold uppercase" style={{ color: C.muted }}>More AI Tools <ChevronDown size={13} className={showMoreTools ? 'rotate-180' : ''} /></button>
              {showMoreTools && <div className="mt-1 space-y-1">{allTools.map((id) => <button key={id} type="button" disabled={Boolean(busyLabel)} onClick={() => runAiEdit(id)} className="w-full rounded-lg px-3 py-2 text-left text-[10px] disabled:opacity-50" style={{ border: '1px solid ' + C.border, color: C.text }}>{toolMeta[id].label}</button>)}</div>}
            </div>}
          </aside>

          <main className="flex min-h-0 flex-col overflow-hidden" style={{ background: C.bg }}>
            <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-3 md:p-5">
              {compare ? <div className="grid w-full max-w-[1100px] grid-cols-1 gap-3 md:grid-cols-2"><PreviewPanel label="Original" src={asset.imageUrl} /><PreviewPanel label="Edited" src={displayUrl} /></div> :
                <div className="relative flex h-full min-h-[330px] w-full max-w-[1050px] items-center justify-center overflow-hidden rounded-2xl" style={{ border: '1px solid ' + C.border, background: '#101419' }}>
                  <img src={displayUrl} alt={asset.name || 'Image being edited'} className="max-h-full max-w-full object-contain transition-all" style={{ transform: 'scale(' + (zoom / 100) + ') rotate(' + rotation + 'deg) scaleX(' + (flipX ? -1 : 1) + ') scaleY(' + (flipY ? -1 : 1) + ')', filter: 'brightness(' + brightness + '%) contrast(' + contrast + '%) saturate(' + saturation + '%)', opacity: opacity / 100 }} />
                  {busyLabel && <div className="absolute inset-0 grid place-items-center bg-black/65"><div className="rounded-2xl px-6 py-5 text-center" style={{ background: C.modal, border: '1px solid ' + C.cyanBorder }}><Loader2 size={24} className="mx-auto mb-3 animate-spin" style={{ color: C.cyan }} /><div className="text-[11px] font-extrabold uppercase">{busyLabel}</div><div className="mt-1 text-[9px]" style={{ color: C.muted }}>SmartVideo is preparing your asset.</div></div></div>}
                </div>}
            </div>
            <div className="px-3 pb-3 md:px-5 md:pb-4">
              <div className="mb-2 flex gap-2 overflow-x-auto pb-1 lg:hidden">
                {recommended.slice(0, 4).map((id) => { const Icon = toolMeta[id].icon; return <button key={id} type="button" disabled={Boolean(busyLabel)} onClick={() => runAiEdit(id)} className="flex-none rounded-lg px-3 py-2 text-[9px] font-extrabold uppercase disabled:opacity-50" style={{ border: '1px solid ' + (id === 'video_ready' ? C.cyanBorder : C.border), background: id === 'video_ready' ? C.cyanSoft : C.panel }}><Icon size={11} className="mr-1 inline" style={{ color: C.cyan }} />{toolMeta[id].label}</button> })}
              </div>
              <div className="flex items-center gap-2 overflow-x-auto rounded-xl p-2" style={{ border: '1px solid ' + C.border, background: C.panelSoft }}>
                {versions.map((version) => { const active = version.dataUrl === currentDataUrl; return <button key={version.id} type="button" onClick={() => setCurrentDataUrl(version.dataUrl)} className="flex-none rounded-lg px-3 py-2 text-[9px] font-bold" style={{ border: '1px solid ' + (active ? C.cyanBorder : C.border), background: active ? C.cyanSoft : C.field, color: active ? C.cyan : C.text }}>{version.label}</button> })}
              </div>
            </div>
          </main>

          <aside className="min-h-0 overflow-y-auto p-4" style={{ borderLeft: '1px solid ' + C.border }}>
            <div className="mb-4">
              <div className="mb-2 text-[9px] font-black uppercase tracking-[.14em]" style={{ color: C.muted }}>AI Mode</div>
              <div className="grid grid-cols-3 gap-1 rounded-xl p-1" style={{ background: C.field, border: '1px solid ' + C.border }}>
                {(['auto', 'fast', 'precision'] as ModelMode[]).map((mode) => <button key={mode} type="button" onClick={() => setModelMode(mode)} className="rounded-lg px-2 py-2 text-[9px] font-extrabold uppercase" style={{ background: modelMode === mode ? C.cyanSoft : 'transparent', color: modelMode === mode ? C.cyan : C.muted }}>{mode}</button>)}
              </div>
              <div className="mt-1 text-[8px]" style={{ color: C.muted2 }}>{resolvedModel === 'gpt-image-2.5-sunburst' ? 'Precision editing' : 'Fast high-quality editing'}</div>
            </div>

            <div className="mb-4">
              <div className="mb-2 text-[9px] font-black uppercase tracking-[.14em]" style={{ color: C.muted }}>Video Format</div>
              <div className="grid grid-cols-5 gap-1">{(['original', '9:16', '16:9', '1:1', '4:5'] as AspectRatio[]).map((ratio) => <button key={ratio} type="button" onClick={() => setAspectRatio(ratio)} className="rounded-lg px-1 py-2 text-[8px] font-bold" style={{ border: '1px solid ' + (aspectRatio === ratio ? C.cyanBorder : C.border), color: aspectRatio === ratio ? C.cyan : C.muted, background: aspectRatio === ratio ? C.cyanSoft : C.field }}>{ratio === 'original' ? 'Orig' : ratio}</button>)}</div>
            </div>

            <div className="mb-4">
              <div className="mb-2 flex items-center gap-2 text-[9px] font-black uppercase tracking-[.14em]" style={{ color: C.muted }}><MessageSquare size={12} /> Ask AI to Edit</div>
              <textarea value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} rows={4} placeholder="Example: Remove the truck behind the contractor but keep the person exactly the same." className="w-full resize-none rounded-xl p-3 text-[11px] outline-none" style={{ background: C.field, border: '1px solid ' + C.border, color: C.text }} />
              <button type="button" disabled={!customPrompt.trim() || Boolean(busyLabel)} onClick={() => runAiEdit('custom', customPrompt)} className="mt-2 w-full rounded-xl py-2.5 text-[10px] font-black uppercase disabled:opacity-50" style={{ background: C.cyan, color: '#041014' }}><Sparkles size={12} className="mr-1 inline" /> Edit Image</button>
            </div>

            <button type="button" onClick={() => setShowAdvanced((v) => !v)} className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-[10px] font-extrabold uppercase" style={{ border: '1px solid ' + C.border, background: C.panelSoft }}>Advanced Local Editor <ChevronDown size={13} className={showAdvanced ? 'rotate-180' : ''} /></button>

            {showAdvanced && <div className="mt-3 space-y-3 rounded-xl p-3" style={{ border: '1px solid ' + C.border, background: C.field }}>
              <div className="grid grid-cols-3 gap-1">
                <button type="button" onClick={() => setRotation((v) => (v + 90) % 360)} className="rounded-lg py-2" style={{ border: '1px solid ' + C.border }} title="Rotate"><RotateCw size={13} className="mx-auto" /></button>
                <button type="button" onClick={() => setFlipX((v) => !v)} className="rounded-lg py-2" style={{ border: '1px solid ' + (flipX ? C.cyanBorder : C.border) }} title="Flip horizontal"><FlipHorizontal size={13} className="mx-auto" /></button>
                <button type="button" onClick={() => setFlipY((v) => !v)} className="rounded-lg py-2" style={{ border: '1px solid ' + (flipY ? C.cyanBorder : C.border) }} title="Flip vertical"><FlipVertical size={13} className="mx-auto" /></button>
              </div>
              <Slider label="Zoom" value={zoom} min={50} max={180} onChange={setZoom} />
              <Slider label="Brightness" value={brightness} min={50} max={150} onChange={setBrightness} />
              <Slider label="Contrast" value={contrast} min={50} max={150} onChange={setContrast} />
              <Slider label="Saturation" value={saturation} min={0} max={180} onChange={setSaturation} />
              <Slider label="Opacity" value={opacity} min={10} max={100} onChange={setOpacity} />
              <button type="button" disabled={Boolean(busyLabel)} onClick={applyLocalAdjustments} className="w-full rounded-lg py-2 text-[9px] font-extrabold uppercase disabled:opacity-50" style={{ border: '1px solid ' + C.cyanBorder, color: C.cyan, background: C.cyanSoft }}>Apply Local Adjustments</button>
            </div>}

            {error && <div className="mt-3 rounded-xl p-3 text-[10px] leading-4" style={{ border: '1px solid rgba(239,91,103,.35)', background: 'rgba(239,91,103,.08)', color: '#ff9ba3' }}>{error}</div>}

            <div className="mt-4 rounded-xl p-3" style={{ border: '1px solid ' + C.border, background: C.panelSoft }}>
              <div className="mb-1 flex items-center gap-2 text-[9px] font-black uppercase" style={{ color: C.green }}><Check size={12} /> Asset Protection</div>
              <div className="text-[9px] leading-4" style={{ color: C.muted }}>SmartVideo prompts the AI to preserve identity, products, logos, important text, proportions and brand treatment unless your requested edit requires a change.</div>
            </div>
          </aside>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-5" style={{ borderTop: '1px solid ' + C.border }}>
          <div className="text-[9px]" style={{ color: C.muted }}>{hasChanges ? String(versions.length - 1) + ' edit version' + (versions.length - 1 === 1 ? '' : 's') + ' · Original always preserved' : 'Original asset is unchanged'}</div>
          <div className="flex items-center gap-2">
            {hasChanges && <button type="button" onClick={() => setCurrentDataUrl(null)} className="rounded-lg px-3 py-2 text-[10px] font-extrabold uppercase" style={{ border: '1px solid ' + C.border, color: C.muted }}>Restore Original</button>}
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-[10px] font-extrabold uppercase" style={{ border: '1px solid ' + C.border, color: C.text }}>Cancel</button>
            <button type="button" onClick={handleApply} disabled={saving || Boolean(busyLabel)} className="rounded-lg px-5 py-2 text-[10px] font-black uppercase disabled:opacity-50" style={{ background: C.cyan, color: '#041014' }}>{saving ? <Loader2 size={12} className="mr-1 inline animate-spin" /> : <Check size={12} className="mr-1 inline" />}{hasChanges ? 'Use Edited Asset' : 'Use This Asset'}</button>
          </div>
        </footer>
      </div>
    </div>
  )
}
