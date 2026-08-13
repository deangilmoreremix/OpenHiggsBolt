'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, Wand2, Loader2, ChevronDown, ChevronUp, RefreshCw, Check, AlertCircle } from 'lucide-react';
import type { ThumbnailStepProps, CopyState, ThumbnailState } from '../types';
import { generateThumbnail, type ThumbnailGenerateResult } from '@/shared/api/thumbnailService';
import { enhancePrompt } from '@/shared/api/openai';
import RecommendedThumbnails from '../thumbnail/RecommendedThumbnails';
import ExploreIdeas from '../thumbnail/ExploreIdeas';
import ReferenceUploadZone from '../thumbnail/ReferenceUploadZone';
import ThumbnailGenerationResults from '../thumbnail/ThumbnailGenerationResults';
import ThumbnailRefinement from '../thumbnail/ThumbnailRefinement';

const ASPECT_PRESETS = [
  { value: '16:9', label: 'YouTube 16:9', platforms: ['YouTube'] },
  { value: '1:1', label: 'Instagram 1:1', platforms: ['Instagram', 'Facebook'] },
  { value: '4:5', label: 'IG/FB 4:5', platforms: ['Instagram', 'Facebook'] },
  { value: '9:16', label: 'Reels/TikTok 9:16', platforms: ['Instagram', 'TikTok', 'Facebook'] },
] as const;

const MODEL_OPTIONS = [
  { value: 'gpt-image-2', label: 'GPT Image 2', description: 'Best quality, recommended' },
  { value: 'gpt-image-1', label: 'GPT Image 1', description: 'Faster, good quality' },
  { value: 'dall-e-3', label: 'DALL·E 3', description: 'Classic prompt-following' },
  { value: 'flux-dev', label: 'Flux Dev', description: 'MuAPI model' },
] as const;

type GenerationCount = 1 | 2 | 3 | 4;

export default function ThumbnailStep({
  asset,
  thumbnail,
  onUpdateThumbnail,
  copy,
}: ThumbnailStepProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>(thumbnail.templateId)
  const [viewMode, setViewMode] = useState<'recommended' | 'explore'>('recommended')

  const [prompt, setPrompt] = useState('')
  const [enhancedPrompt, setEnhancedPrompt] = useState('')
  const [selectedModel, setSelectedModel] = useState<string>(MODEL_OPTIONS[0].value)
  const [aspectRatio, setAspectRatio] = useState<string>(thumbnail.aspectRatio || '16:9')
  const [generationCount, setGenerationCount] = useState<GenerationCount>(1)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [style, setStyle] = useState('vibrant')

  const [results, setResults] = useState<ThumbnailGenerateResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [generating, setGenerating] = useState(false)
  const [generatingCount, setGeneratingCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const [references, setReferences] = useState<string[]>(thumbnail.references || [])
  const [showAdvanced, setShowAdvanced] = useState(false)

  const [headline, setHeadline] = useState(copy.headline || '')
  const [subheadline, setSubheadline] = useState(copy.subheadline || '')
  const [font, setFont] = useState('Inter')
  const [fontSize, setFontSize] = useState(48)
  const [textAlignment, setTextAlignment] = useState<'left' | 'center' | 'right'>('center')
  const [textPosition, setTextPosition] = useState<'top' | 'center' | 'bottom'>('bottom')
  const [textWeight, setTextWeight] = useState<'normal' | 'bold' | 'black'>('bold')
  const [textColor, setTextColor] = useState('#ffffff')
  const [hasStroke, setHasStroke] = useState(true)
  const [hasShadow, setHasShadow] = useState(true)

  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (thumbnail.templateId && thumbnail.templateId !== selectedTemplateId) {
      setSelectedTemplateId(thumbnail.templateId)
    }
    if (thumbnail.aspectRatio && thumbnail.aspectRatio !== aspectRatio) {
      setAspectRatio(thumbnail.aspectRatio)
    }
  }, [thumbnail])

  useEffect(() => {
    return () => { abortControllerRef.current?.abort() }
  }, [])

  const buildFullPrompt = useCallback(() => {
    let base = enhancedPrompt || prompt
    if (!base && selectedTemplateId) {
      const templatePrompts: Record<string, string> = {
        'creator-reaction': 'YouTuber-style reaction face, dramatic lighting, bold yellow text overlay area, high contrast, shocked expression, clean background',
        'product-hero': 'Premium product photography studio, dramatic key light, soft shadow, clean white background, commercial lighting, 8K product shot',
        'workspace-makeover': 'Modern minimalist workspace, natural window light, clean desk setup, professional yet inviting, warm tones',
        'face-reveal': 'Dramatic portrait reveal, rim lighting, mystery atmosphere, face partially in shadow, cinematic',
        'edu-explainer': 'Educational infographic style, clean white background, bold iconography, clear visual metaphor, modern design',
        'editorial-cover': 'Magazine cover style, bold typography composition, dramatic color palette, minimalist layout, premium feel',
        'social-viral': 'Viral social media thumbnail, high saturation, bold contrasting colors, eye-catching focal point',
        'marketing-ctr': 'High-CTR thumbnail, before/after composition, arrow graphics, bold result numbers, contrasting colors',
        'funny-meme': 'Meme-style thumbnail, exaggerated expression, bold text area, high contrast, comedic timing',
        'creative-3d': '3D rendered scene, isometric perspective, vibrant materials, soft volumetric lighting',
        'lifestyle-blog': 'Lifestyle blogger thumbnail, warm natural light, cozy aesthetic, soft pastels, relatable composition',
        'business-podcast': 'Professional podcast thumbnail, headshot composition, clean gradient background, bold episode number',
      }
      base = templatePrompts[selectedTemplateId] || ''
    }

    const textParts: string[] = []
    if (headline) textParts.push(`HEADLINE TEXT: "${headline}"`)
    if (subheadline) textParts.push(`SUBHEADLINE TEXT: "${subheadline}"`)
    if (textParts.length > 0) {
      base += '. ' + textParts.join('. ') + '. Leave clear space for text overlay at ' + textPosition + '.'
    }
    if (references.length > 0) {
      base += ' Reference images provided for style/content guidance.'
    }
    const stylePrompts: Record<string, string> = {
      'cinematic': 'Cinematic lighting, movie poster style, ultra detailed.',
      'vibrant': 'Vibrant saturated colors, eye-catching, bold composition, high contrast.',
      'bold-text': 'Designed for text overlay, clear focal point, bold graphic design.',
      'face-focus': 'Close-up portrait, expressive face, shallow depth of field, emotional.',
      'minimal': 'Minimalist design, clean background, elegant, lots of negative space.',
      'neon': 'Neon glow effects, cyberpunk aesthetic, dark background, futuristic.',
      'retro': 'Retro vintage style, film grain, muted tones, classic design.',
      'photorealism': 'Photorealistic, ultra high resolution, professional photography, 8K.',
    }
    if (style && stylePrompts[style]) {
      base += ' ' + stylePrompts[style]
    }
    return base
  }, [prompt, enhancedPrompt, selectedTemplateId, headline, subheadline, textPosition, references, style])

  const handleEnhance = useCallback(async () => {
    if (!prompt.trim() || isEnhancing) return
    setIsEnhancing(true)
    try {
      const result = await enhancePrompt(prompt)
      if (result) setEnhancedPrompt(result)
    } catch { /* noop */ }
    finally { setIsEnhancing(false) }
  }, [prompt, isEnhancing])

  const handleGenerate = useCallback(async () => {
    const fullPrompt = buildFullPrompt()
    if (!fullPrompt.trim() && !selectedTemplateId) return

    setError(null)
    setGenerating(true)
    setGeneratingCount(generationCount)
    setResults([])
    setSelectedIndex(null)

    abortControllerRef.current?.abort()
    const ac = new AbortController()
    abortControllerRef.current = ac

    try {
      const genResults = await generateThumbnail({
        prompt: fullPrompt,
        model: selectedModel,
        aspectRatio,
        n: generationCount,
        headline,
        subheadline,
        templateId: selectedTemplateId,
        referenceUrls: references.length > 0 ? references : undefined,
        style,
        quality: 'medium',
      })

      if (ac.signal.aborted) return
      setResults(genResults)
      if (genResults.length > 0) {
        setSelectedIndex(0)
        onUpdateThumbnail({
          imageUrl: genResults[0].url,
          responseId: genResults[0].responseId,
          templateId: selectedTemplateId,
          aspectRatio,
          references: references.length > 0 ? references : undefined,
        })
      }
    } catch (err) {
      if (ac.signal.aborted) return
      const message = err instanceof Error ? err.message : 'Generation failed'
      setError(message)
    } finally {
      if (!ac.signal.aborted) {
        setGenerating(false)
        setGeneratingCount(0)
      }
    }
  }, [buildFullPrompt, selectedTemplateId, selectedModel, aspectRatio, generationCount, headline, subheadline, references, style, onUpdateThumbnail])

  const handleSelectResult = useCallback((index: number) => {
    setSelectedIndex(index)
    if (results[index]) {
      onUpdateThumbnail({
        imageUrl: results[index].url,
        responseId: results[index].responseId,
      })
    }
  }, [results, onUpdateThumbnail])

  const handleDownloadResult = useCallback((url: string, _index: number) => {
    const a = document.createElement('a')
    a.href = url
    a.download = `thumbnail-${Date.now()}.png`
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }, [])

  const handleRefineResults = useCallback((refineResults: ThumbnailGenerateResult[]) => {
    const refined = refineResults.map(r => ({
      url: r.url,
      responseId: r.responseId,
      revisedPrompt: r.revisedPrompt,
    }))
    setResults(refined)
    if (refined.length > 0) {
      setSelectedIndex(0)
      onUpdateThumbnail({
        imageUrl: refined[0].url,
        responseId: refined[0].responseId,
      })
    }
  }, [onUpdateThumbnail])

  const handleAutoFillFromWrite = useCallback(() => {
    const sourceHeadline = copy.headline || copy.title || ''
    const sourceSubject = copy.subject || ''
    const sourceVisualIdea = copy.visualIdea || ''
    if (sourceHeadline) setHeadline(sourceHeadline)
    const parts = [sourceHeadline, sourceSubject, sourceVisualIdea].filter(Boolean)
    if (parts.length > 0) setPrompt(parts.join(' — '))
  }, [copy])

  const hasWriteContent = useMemo(() => !!(copy.headline || copy.title || copy.subject || copy.visualIdea), [copy])

  return (
    <div className="space-y-4" role="region" aria-label="Thumbnail creation step">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'var(--color-primary, #22d3ee)' }}>
            <Image size={13} className="text-black" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white tracking-tight">Thumbnail</h2>
            <p className="text-[10px] text-white/40">Create a click-worthy thumbnail for {asset.type === 'video' ? 'your video' : 'your image'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/50">{aspectRatio}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#22d3ee]/10 text-[#22d3ee] border border-[#22d3ee]/20">{selectedModel}</span>
        </div>
      </div>

      {hasWriteContent && (
        <button
          type="button"
          onClick={handleAutoFillFromWrite}
          className="flex items-center gap-2 w-full p-3 rounded-xl text-left transition-all hover:bg-white/[0.04]"
          style={{ border: '1px dashed rgba(34,211,238,0.25)', background: 'rgba(34,211,238,0.03)' }}
          aria-label="Auto-fill thumbnail from Write step content"
        >
          <Wand2 size={13} className="text-[#22d3ee] shrink-0" />
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-[#22d3ee]">Auto-fill from Write step</p>
            <p className="text-[10px] text-white/30 truncate">
              {[copy.headline, copy.title, copy.subject, copy.visualIdea].filter(Boolean).slice(0, 2).join(' · ') || 'Use write step content'}
            </p>
          </div>
        </button>
      )}

      <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <button type="button" onClick={() => setViewMode('recommended')} className="flex-1 py-1.5 rounded-md text-[11px] font-medium transition-all" style={{ background: viewMode === 'recommended' ? 'rgba(255,255,255,0.08)' : 'transparent', color: viewMode === 'recommended' ? 'white' : 'rgba(255,255,255,0.4)' }} aria-pressed={viewMode === 'recommended'}>Recommended</button>
        <button type="button" onClick={() => setViewMode('explore')} className="flex-1 py-1.5 rounded-md text-[11px] font-medium transition-all" style={{ background: viewMode === 'explore' ? 'rgba(255,255,255,0.08)' : 'transparent', color: viewMode === 'explore' ? 'white' : 'rgba(255,255,255,0.4)' }} aria-pressed={viewMode === 'explore'}>Explore Ideas</button>
      </div>

      {viewMode === 'recommended' && (
        <RecommendedThumbnails onSelectTemplate={setSelectedTemplateId} selectedTemplateId={selectedTemplateId} copy={copy} assetType={asset.type} />
      )}
      {viewMode === 'explore' && (
        <ExploreIdeas onSelectTemplate={setSelectedTemplateId} selectedTemplateId={selectedTemplateId} copy={copy} />
      )}

      {selectedTemplateId && (
        <ReferenceUploadZone templateId={selectedTemplateId} references={references} onUpdate={(updates) => { setReferences(updates.references || references); onUpdateThumbnail({ references: updates.references || references }) }} disabled={generating} />
      )}

      <div className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-widest text-white/40">Aspect Ratio</p>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Aspect ratio options">
          {ASPECT_PRESETS.map(preset => {
            const isSelected = aspectRatio === preset.value
            return (
              <button key={preset.value} type="button" role="radio" aria-checked={isSelected} onClick={() => { setAspectRatio(preset.value); onUpdateThumbnail({ aspectRatio: preset.value }) }} disabled={generating} className="px-3 py-2 rounded-xl text-[11px] font-medium transition-all disabled:opacity-50" style={{ background: isSelected ? 'rgba(34,211,238,0.12)' : 'rgba(255,255,255,0.04)', color: isSelected ? '#22d3ee' : 'rgba(255,255,255,0.5)', border: `1px solid ${isSelected ? 'rgba(34,211,238,0.3)' : 'rgba(255,255,255,0.08)'}` }}>
                <span className="block font-bold">{preset.label}</span>
                <span className="text-[9px] opacity-60">{preset.platforms.join(', ')}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-widest text-white/40">Prompt</p>
        <div className="relative rounded-xl" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <textarea value={prompt} onChange={(e) => { setPrompt(e.target.value); setEnhancedPrompt('') }} placeholder={selectedTemplateId ? 'Describe what you want in this thumbnail…' : 'Describe the thumbnail you want to create…'} rows={3} disabled={generating} className="w-full resize-none text-sm outline-none rounded-xl p-3 pr-10 disabled:opacity-50" style={{ color: 'white', background: 'transparent' }} aria-label="Thumbnail generation prompt" />
          <button type="button" onClick={handleEnhance} disabled={isEnhancing || !prompt.trim() || generating} title="AI enhance prompt" className="absolute top-2 right-2 p-1.5 rounded-lg transition-all disabled:opacity-40" style={{ background: 'rgba(34,211,238,0.1)' }} aria-label="Enhance prompt with AI">
            {isEnhancing ? <Loader2 size={13} className="animate-spin text-[#22d3ee]" /> : <Wand2 size={13} className="text-[#22d3ee]" />}
          </button>
        </div>
        {enhancedPrompt && <div className="p-2 rounded-lg text-[11px]" style={{ background: 'rgba(34,211,238,0.05)', border: '1px solid rgba(34,211,238,0.15)', color: 'rgba(255,255,255,0.6)' }}><span style={{ color: '#22d3ee' }}>Enhanced: </span>{enhancedPrompt}</div>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} disabled={generating} className="text-[11px] rounded-xl px-3 py-2 pr-8 appearance-none disabled:opacity-50" style={{ background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }} aria-label="Image generation model">
            {MODEL_OPTIONS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
        </div>
        <div className="flex gap-1" role="radiogroup" aria-label="Number of variations">
          {([1, 2, 3, 4] as GenerationCount[]).map(n => (
            <button key={n} type="button" role="radio" aria-checked={generationCount === n} onClick={() => setGenerationCount(n)} disabled={generating} className="w-8 h-8 rounded-lg text-xs font-bold transition-all disabled:opacity-50" style={{ background: generationCount === n ? 'rgba(34,211,238,0.15)' : 'rgba(255,255,255,0.04)', color: generationCount === n ? '#22d3ee' : 'rgba(255,255,255,0.4)', border: `1px solid ${generationCount === n ? 'rgba(34,211,238,0.3)' : 'rgba(255,255,255,0.08)'}` }}>
              {n}
            </button>
          ))}
        </div>
        <button type="button" onClick={handleGenerate} disabled={generating || (!prompt.trim() && !selectedTemplateId)} className="flex-1 min-w-[120px] h-10 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2" style={{ background: 'var(--color-primary, #22d3ee)', color: 'black' }} aria-label={`Generate ${generationCount} thumbnail${generationCount > 1 ? 's' : ''}`}>
          {generating ? <><Loader2 size={14} className="animate-spin" />Generating…</> : <><Image size={14} />Generate {generationCount > 1 ? `${generationCount}` : ''}</>}
        </button>
      </div>

      <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-1.5 text-[11px] transition-all text-white/40 hover:text-white/70" aria-expanded={showAdvanced}>
        {showAdvanced ? <ChevronUp size={12} /> : <ChevronDown size={12} />} Advanced options
      </button>

      {showAdvanced && (
        <div className="space-y-3 p-4 rounded-xl" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <p className="text-[11px] font-medium text-white/40 mb-2">Style</p>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'cinematic', label: 'Cinematic' }, { id: 'vibrant', label: 'Vibrant' },
                { id: 'bold-text', label: 'Bold Text' }, { id: 'face-focus', label: 'Face Focus' },
                { id: 'minimal', label: 'Minimal' }, { id: 'neon', label: 'Neon' },
                { id: 'retro', label: 'Retro' }, { id: 'photorealism', label: 'Photo' },
              ].map(s => (
                <button key={s.id} type="button" onClick={() => setStyle(s.id)} disabled={generating} className="px-2 py-1 rounded-lg text-[10px] font-medium transition-all disabled:opacity-50" style={{ background: style === s.id ? 'rgba(34,211,238,0.12)' : 'rgba(255,255,255,0.04)', color: style === s.id ? '#22d3ee' : 'rgba(255,255,255,0.4)', border: `1px solid ${style === s.id ? 'rgba(34,211,238,0.25)' : 'rgba(255,255,255,0.06)'}` }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[11px] font-medium text-white/40">Text Overlay</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-white/30 mb-1">Headline</label>
                <input type="text" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Main headline" disabled={generating} className="w-full px-2.5 py-1.5 rounded-lg text-[11px] disabled:opacity-50 outline-none" style={{ background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }} aria-label="Headline text" />
              </div>
              <div>
                <label className="block text-[10px] text-white/30 mb-1">Subheadline</label>
                <input type="text" value={subheadline} onChange={(e) => setSubheadline(e.target.value)} placeholder="Sub-headline" disabled={generating} className="w-full px-2.5 py-1.5 rounded-lg text-[11px] disabled:opacity-50 outline-none" style={{ background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }} aria-label="Subheadline text" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] text-white/30 mb-1">Font</label>
                <select value={font} onChange={(e) => setFont(e.target.value)} disabled={generating} className="w-full px-2 py-1.5 rounded-lg text-[10px] disabled:opacity-50 outline-none" style={{ background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }} aria-label="Font family">
                  {['Inter', 'Arial', 'Helvetica', 'Impact', 'Roboto', 'Montserrat', 'Bebas Neue'].map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-white/30 mb-1">Size: {fontSize}px</label>
                <input type="range" min={16} max={120} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} disabled={generating} className="w-full accent-[#22d3ee] disabled:opacity-50" aria-label="Font size" />
              </div>
              <div>
                <label className="block text-[10px] text-white/30 mb-1">Weight</label>
                <select value={textWeight} onChange={(e) => setTextWeight(e.target.value as typeof textWeight)} disabled={generating} className="w-full px-2 py-1.5 rounded-lg text-[10px] disabled:opacity-50 outline-none" style={{ background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }} aria-label="Font weight">
                  {[{ v: 'normal', l: 'Normal' }, { v: 'bold', l: 'Bold' }, { v: 'black', l: 'Black' }].map(w => <option key={w.v} value={w.v}>{w.l}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] text-white/30 mb-1">Alignment</label>
                <div className="flex gap-1">
                  {(['left', 'center', 'right'] as const).map(a => (
                    <button key={a} type="button" onClick={() => setTextAlignment(a)} disabled={generating} aria-pressed={textAlignment === a} className="flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all disabled:opacity-50 capitalize" style={{ background: textAlignment === a ? 'rgba(34,211,238,0.12)' : 'rgba(255,255,255,0.04)', color: textAlignment === a ? '#22d3ee' : 'rgba(255,255,255,0.4)', border: `1px solid ${textAlignment === a ? 'rgba(34,211,238,0.25)' : 'rgba(255,255,255,0.06)'}` }}>{a}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-white/30 mb-1">Position</label>
                <div className="flex gap-1">
                  {(['top', 'center', 'bottom'] as const).map(p => (
                    <button key={p} type="button" onClick={() => setTextPosition(p)} disabled={generating} aria-pressed={textPosition === p} className="flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all disabled:opacity-50 capitalize" style={{ background: textPosition === p ? 'rgba(34,211,238,0.12)' : 'rgba(255,255,255,0.04)', color: textPosition === p ? '#22d3ee' : 'rgba(255,255,255,0.4)', border: `1px solid ${textPosition === p ? 'rgba(34,211,238,0.25)' : 'rgba(255,255,255,0.06)'}` }}>{p}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-white/30 mb-1">Color</label>
                <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} disabled={generating} className="w-full h-8 rounded-lg cursor-pointer disabled:opacity-50" aria-label="Text color" />
              </div>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={hasStroke} onChange={(e) => setHasStroke(e.target.checked)} disabled={generating} className="accent-[#22d3ee] disabled:opacity-50" />
                <span className="text-[10px] text-white/50">Stroke outline</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={hasShadow} onChange={(e) => setHasShadow(e.target.checked)} disabled={generating} className="accent-[#22d3ee] disabled:opacity-50" />
                <span className="text-[10px] text-white/50">Drop shadow</span>
              </label>
            </div>
          </div>
        </div>
      )}

      <ThumbnailGenerationResults results={results} selectedIndex={selectedIndex} onSelect={handleSelectResult} generating={generating} error={error} generatingCount={generatingCount} onRetry={generating ? undefined : handleGenerate} onDownload={handleDownloadResult} thumbnail={thumbnail} onUpdateThumbnail={onUpdateThumbnail} />

      <ThumbnailRefinement sourceImageUrl={selectedIndex !== null && results[selectedIndex] ? results[selectedIndex].url : null} aspectRatio={aspectRatio} disabled={generating} onResults={handleRefineResults} />

      {selectedTemplateId && (
        <div className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <span className="text-[10px] text-white/30">Template: {selectedTemplateId}</span>
          <button type="button" onClick={() => { setSelectedTemplateId(undefined); onUpdateThumbnail({ templateId: undefined }) }} disabled={generating} className="text-[10px] text-white/30 hover:text-red-400 transition-colors disabled:opacity-50" aria-label="Clear template selection">Clear</button>
        </div>
      )}
    </div>
  )
}
