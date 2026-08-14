'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  Copy as CopyIcon,
  Loader2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Hash,
  MessageSquare,
  Target,
  Wand2,
  Type,
  AlignLeft,
  ImageIcon,
  Film,
} from 'lucide-react'
import { WriteStepProps, CopyState } from '../types'
import { SocialCopyEditor } from '../copy/SocialCopyEditor'
import { AiWritingToolbar } from '../copy/AiWritingToolbar'
import { PlatformCopyTabs } from '../copy/PlatformCopyTabs'
import { CopyVariantCards } from '../copy/CopyVariantCards'
import {
  generateCopy,
  rewrite,
  enhance,
  shorten,
  expand,
  hook,
  cta,
  hashtags,
  professional,
  conversational,
  persuasive,
  platformize,
  refine,
} from '@/shared/api/socialCopyService'

const PLATFORMS = [
  { id: 'master', label: 'Master' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'facebook', label: 'Facebook' },
]

const VARIANT_LABELS = [
  { id: 'v1', label: 'VERSION 1 — Direct' },
  { id: 'v2', label: 'VERSION 2 — High Energy' },
  { id: 'v3', label: 'VERSION 3 — Storytelling' },
]

type Tone = 'professional' | 'conversational' | 'persuasive'
type Length = 'short' | 'medium' | 'long'

const emptyPlatforms: CopyState['platforms'] = {
  youtube: { title: '', description: '' },
  instagram: { caption: '' },
  tiktok: { caption: '' },
  facebook: { caption: '' },
}

function buildEmptyCopy(master = ''): CopyState {
  return {
    master,
    platforms: JSON.parse(JSON.stringify(emptyPlatforms)),
    variants: VARIANT_LABELS.map((v) => ({
      id: v.id,
      label: v.label,
      text: '',
    })),
  }
}

function getPrefillTopic(asset: WriteStepProps['asset']): string {
  return (
    asset.title ||
    asset.description ||
    asset.prompt ||
    asset.script ||
    asset.studio ||
    ''
  )
}

export function WriteStep({ asset, copy, onUpdateCopy }: WriteStepProps) {
  const [topic, setTopic] = useState(getPrefillTopic(asset))
  const [activePlatform, setActivePlatform] = useState('master')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [localCopy, setLocalCopy] = useState<CopyState>(() =>
    copy.master || (copy.variants?.length || 0) > 0 ? copy : buildEmptyCopy('')
  )

  useEffect(() => {
    setTopic(getPrefillTopic(asset))
  }, [asset])

  const currentText = useMemo(() => {
    if (activePlatform === 'master') return localCopy.master
    return localCopy.platforms[activePlatform]?.caption || ''
  }, [activePlatform, localCopy])

  const counts = useMemo(() => {
    const text = currentText || ''
    const chars = text.length
    const words = text.trim() ? text.trim().split(/\s+/).length : 0
    const hashCount = (text.match(/#\w+/g) || []).length
    return { chars, words, hashCount }
  }, [currentText])

  const platformWarnings = useMemo(() => {
    const warnings: string[] = []
    const chars = counts.chars
    if (activePlatform === 'youtube' && chars > 5000) warnings.push('YouTube description exceeds 5000 chars')
    if (activePlatform === 'instagram' && chars > 2200) warnings.push('Instagram caption exceeds 2200 chars')
    if (activePlatform === 'tiktok' && chars > 2200) warnings.push('TikTok caption exceeds 2200 chars')
    if (activePlatform === 'facebook' && chars > 63206) warnings.push('Facebook post exceeds 63206 chars')
    if (counts.hashCount > 30) warnings.push('Too many hashtags may reduce reach')
    return warnings
  }, [activePlatform, counts])

  function emit(copyState: CopyState) {
    setLocalCopy(copyState)
    onUpdateCopy(copyState)
  }

  function updateMaster(text: string) {
    emit({ ...localCopy, master: text })
  }

  function updatePlatformText(platformId: string, text: string) {
    const next = {
      ...localCopy,
      platforms: {
        ...localCopy.platforms,
        [platformId]: {
          ...localCopy.platforms[platformId],
          caption: text,
        },
      },
    }
    emit(next)
  }

  async function handleGenerateVariants() {
    if (!topic.trim()) {
      setError('Enter a post topic first')
      return
    }
    setLoading(true)
    setError(null)
    setStatus('Generating copy variants…')
    try {
      const result = await generateCopy(topic, asset)
      const master = result.masterPost || ''
      const variants = localCopy.variants.map((v, idx) => ({
        ...v,
        text: result.variants?.[idx] || '',
      }))
      const next: CopyState = {
        ...localCopy,
        master,
        variants,
        selectedVariantId: 'v1',
      }
      emit(next)
      setStatus('Variants generated')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate copy')
    } finally {
      setLoading(false)
    }
  }

  async function handleAiAction(
    action: 'write' | 'improve' | 'hook' | 'cta' | 'hashtags' | 'tone' | 'length' | 'platformize' | 'refine',
    tone?: Tone,
    length?: Length
  ) {
    if (action === 'write') {
      await handleGenerateVariants()
      return
    }
    const base = currentText || topic
    if (!base.trim()) {
      setError('Add some copy first')
      return
    }
    setLoading(true)
    setError(null)
    setStatus(`Running ${action}…`)
    try {
      let resultText = ''
      switch (action) {
        case 'improve':
          resultText = (await enhance(base, asset)).masterPost || base
          break
        case 'hook':
          resultText = (await hook(base, asset)).masterPost || base
          break
        case 'cta':
          resultText = (await cta(base, asset)).masterPost || base
          break
        case 'hashtags':
          resultText = (await hashtags(base, asset)).masterPost || base
          break
        case 'tone':
          if (!tone) throw new Error('Select a tone')
          const toneResult =
            tone === 'professional'
              ? await professional(base, asset)
              : tone === 'conversational'
                ? await conversational(base, asset)
                : await persuasive(base, asset)
          resultText = toneResult.masterPost || base
          break
        case 'length':
          if (!length) throw new Error('Select a length')
          if (length === 'short') {
            resultText = (await shorten(base, asset)).masterPost || base
          } else if (length === 'long') {
            resultText = (await expand(base, asset)).masterPost || base
          } else {
            resultText = base
          }
          break
        case 'platformize':
          resultText = (await platformize(base, activePlatform === 'master' ? 'youtube' : activePlatform, asset)).masterPost || base
          break
        case 'refine':
          resultText = (await refine(base, asset)).masterPost || base
          break
        default:
          throw new Error('Unknown action')
      }
      if (activePlatform === 'master') {
        updateMaster(resultText)
      } else {
        updatePlatformText(activePlatform, resultText)
      }
      setStatus('Done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI action failed')
    } finally {
      setLoading(false)
    }
  }

  function handleSelectVariant(id: string) {
    const variant = localCopy.variants.find((v) => v.id === id)
    if (!variant) return
    emit({
      ...localCopy,
      master: variant.text,
      selectedVariantId: id,
    })
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Write</h2>
          <p className="text-[11px] text-white/40">
            {asset.type === 'video' ? 'Video' : 'Image'} · {asset.studio || 'Social Publishing'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setLocalCopy(buildEmptyCopy(''))
              onUpdateCopy(buildEmptyCopy(''))
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/70 hover:text-white hover:bg-white/10 transition-all"
          >
            <RefreshCw size={13} />
            Reset
          </button>
        </div>
      </div>

      <div
        className="rounded-xl border p-4"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <label className="block text-[11px] font-bold uppercase tracking-wide text-white/40 mb-1.5">
          Post topic
        </label>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="What is this post about?"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#22d3ee]/50"
        />
      </div>

      <SocialCopyEditor
        text={currentText}
        onChange={(text) => {
          if (activePlatform === 'master') updateMaster(text)
          else updatePlatformText(activePlatform, text)
        }}
        counts={counts}
        warnings={platformWarnings}
        loading={loading}
      />

      <AiWritingToolbar
        onAction={handleAiAction}
        loading={loading}
        disabled={!topic.trim() && !currentText}
      />

      <PlatformCopyTabs
        platforms={PLATFORMS}
        active={activePlatform}
        onChange={setActivePlatform}
      />

      <CopyVariantCards
        variants={localCopy.variants}
        selectedId={localCopy.selectedVariantId}
        onSelect={handleSelectVariant}
        onGenerate={handleGenerateVariants}
        loading={loading}
      />

      {(status || error) && (
        <div
          aria-live="polite"
          className="flex items-start gap-2 rounded-lg p-3 text-xs"
          style={{
            background: error ? 'rgba(239,68,68,0.1)' : 'rgba(34,211,238,0.1)',
            border: `1px solid ${error ? 'rgba(239,68,68,0.2)' : 'rgba(34,211,238,0.2)'}`,
            color: error ? '#fca5a5' : '#a5f3fc',
          }}
        >
          {error ? <AlertCircle size={14} className="mt-0.5 flex-shrink-0" /> : <Sparkles size={14} className="mt-0.5 flex-shrink-0" />}
          <span>{error || status}</span>
        </div>
      )}
    </div>
  )
}
