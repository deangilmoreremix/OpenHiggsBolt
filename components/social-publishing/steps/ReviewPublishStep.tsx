'use client'

import React, { useState } from 'react'
import {
  ArrowLeft,
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
  X,
  Send,
} from 'lucide-react'
import type { ReviewPublishStepProps, PublishResult } from '../types'
import AssetPreviewCard from '../review/AssetPreviewCard'
import CopyPreviewCard from '../review/CopyPreviewCard'
import ThumbnailPreviewCard from '../review/ThumbnailPreviewCard'
import DestinationsSummaryCard from '../review/DestinationsSummaryCard'

const PLATFORMS: Record<string, { name: string; accent: string }> = {
  youtube: { name: 'YouTube', accent: '#ff0033' },
  instagram: { name: 'Instagram', accent: '#e1306c' },
  tiktok: { name: 'TikTok', accent: '#22d3ee' },
  facebook: { name: 'Facebook', accent: '#1877f2' },
  linkedin: { name: 'LinkedIn', accent: '#0a66c2' },
  pinterest: { name: 'Pinterest', accent: '#e60023' },
  threads: { name: 'Threads', accent: '#fff' },
  x: { name: 'X', accent: '#fff' },
}

function getResultForPlatform(results: PublishResult[], platform: string): PublishResult | undefined {
  return results.find((r) => r.platform === platform)
}

export default function ReviewPublishStep({
  asset,
  copy,
  thumbnail,
  destinations,
  publishResults,
  onConfirm,
  onBack,
  publishing,
}: ReviewPublishStepProps) {
  const [retrying, setRetrying] = useState<string | null>(null)
  const enabledDestinations = destinations.filter((d) => d.enabled && d.accountId)
  const hasEnabledDestinations = enabledDestinations.length > 0

  const allPublished = publishResults.length > 0 && publishResults.every((r) => r.status === 'published')
  const hasFailures = publishResults.some((r) => r.status === 'failed')
  const hasResults = publishResults.length > 0

  const publishedCount = publishResults.filter((r) => r.status === 'published').length
  const failedCount = publishResults.filter((r) => r.status === 'failed').length
  const inProgressCount = publishResults.filter((r) => r.status === 'queued' || r.status === 'uploading' || r.status === 'processing').length

  const handleRetry = async (platform: string) => {
    setRetrying(platform)
    try {
      await onConfirm()
    } finally {
      setRetrying(null)
    }
  }

  if (allPublished && !publishing) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4">
          <CheckCircle2 size={32} className="text-emerald-400" />
        </div>
        <h2 className="text-base font-semibold text-white mb-1">Published successfully</h2>
        <p className="text-xs text-white/50 mb-6">
          Published to {publishedCount} of {publishResults.length} platforms
        </p>

        <div className="w-full max-w-sm space-y-2 mb-6">
          {publishResults.map((r) => {
            const meta = PLATFORMS[r.platform] || { name: r.platform, accent: '#22d3ee' }
            return (
              <div
                key={r.platform}
                className="flex items-center justify-between gap-3 p-2.5 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: r.status === 'published' ? '#10b981' : '#ef4444' }}
                  />
                  <span className="text-xs text-white/80">{meta.name}</span>
                </div>
                {r.url && (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] text-[#22d3ee] hover:underline"
                  >
                    View <ExternalLink size={10} />
                  </a>
                )}
              </div>
            )
          })}
        </div>

        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white/70 hover:text-white hover:bg-white/10 transition-all"
        >
          <X size={14} />
          Close
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Review & Publish</h2>
          <p className="text-[11px] text-white/40">
            {asset.type === 'video' ? 'Video' : 'Image'} · {asset.studio || 'Social Publishing'}
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/60 hover:text-white hover:bg-white/10 transition-all"
        >
          <ArrowLeft size={13} />
          Back
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <AssetPreviewCard asset={asset} />
        <ThumbnailPreviewCard thumbnail={thumbnail} />
      </div>

      <CopyPreviewCard copy={copy} />

      <DestinationsSummaryCard destinations={destinations} />

      {hasResults && (
        <div
          aria-live="polite"
          className="rounded-xl border p-3"
          style={{
            background: hasFailures ? 'rgba(239,68,68,0.06)' : 'rgba(34,211,238,0.06)',
            borderColor: hasFailures ? 'rgba(239,68,68,0.15)' : 'rgba(34,211,238,0.15)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-white">
              {publishing ? 'Publishing…' : 'Publish results'}
            </span>
            <span className="text-[10px] text-white/40">
              {publishedCount}/{publishResults.length} published
            </span>
          </div>

          <div className="space-y-2">
            {publishResults.map((r) => {
              const meta = PLATFORMS[r.platform] || { name: r.platform, accent: '#22d3ee' }
              const isPublishing = publishing && (r.status === 'queued' || r.status === 'uploading' || r.status === 'processing')
              const isPublished = r.status === 'published'
              const isFailed = r.status === 'failed'
              const isRetrying = retrying === r.platform

              return (
                <div
                  key={r.platform}
                  className="flex items-center justify-between gap-3 p-2 rounded-lg"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isPublishing && <Loader2 size={14} className="animate-spin text-[#22d3ee] shrink-0" />}
                    {isPublished && <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />}
                    {isFailed && <XCircle size={14} className="text-red-400 shrink-0" />}
                    {!isPublishing && !isPublished && !isFailed && (
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white/20 shrink-0" />
                    )}
                    <span className="text-xs text-white/80 truncate">{meta.name}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isFailed && r.error && (
                      <span className="text-[10px] text-red-400/80 max-w-[120px] truncate" title={r.error}>
                        {r.error}
                      </span>
                    )}
                    {isPublished && r.url && (
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[11px] text-[#22d3ee] hover:underline"
                      >
                        View <ExternalLink size={10} />
                      </a>
                    )}
                    {isFailed && (
                      <button
                        type="button"
                        onClick={() => handleRetry(r.platform)}
                        disabled={isRetrying}
                        className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] text-white/60 hover:text-white hover:bg-white/10 transition-all disabled:opacity-40"
                      >
                        {isRetrying ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
                        Retry
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {!publishing && !hasResults && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/15">
          <span className="text-[11px] text-amber-300/80">
            Ready to publish to {enabledDestinations.length} destination{enabledDestinations.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={onConfirm}
        disabled={!hasEnabledDestinations || publishing}
        className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-[#22d3ee] text-black font-semibold text-sm hover:bg-[#22d3ee]/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {publishing ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Publishing…
          </>
        ) : (
          <>
            <Send size={16} />
            Publish to {enabledDestinations.length} platform{enabledDestinations.length !== 1 ? 's' : ''}
          </>
        )}
      </button>
    </div>
  )
}
