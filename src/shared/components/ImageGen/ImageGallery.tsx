'use client'
/**
 * ImageGallery — displays generated images with download, delete, reuse, zoom
 * Supports both local session images and Supabase community gallery
 */
import { useState } from 'react'
import { Download, Copy, Trash2, ZoomIn, X, Globe, Lock } from 'lucide-react'
import { panels, buttons, semantic } from '@/shared/styles/designTokens'
import type { GeneratedImage, GalleryFilter } from './types'

interface Props {
  images: GeneratedImage[]
  onDelete: (id: string) => void
  onReuse: (image: GeneratedImage) => void
  onDownload: (image: GeneratedImage) => void
  onTogglePublic?: (id: string, isPublic: boolean) => void
  filter?: GalleryFilter
  emptyMessage?: string
  emptyAction?: { label: string; onClick: () => void }
}

export default function ImageGallery({
  images, onDelete, onReuse, onDownload, onTogglePublic,
  emptyMessage = 'No images yet', emptyAction,
}: Props) {
  const [lightbox, setLightbox] = useState<GeneratedImage | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const aspectClass = (img: GeneratedImage) => {
    const ratio = img.aspectRatio
    if (ratio === '9:16') return 'aspect-[9/16]'
    if (ratio === '1:1')  return 'aspect-square'
    if (ratio === '4:3')  return 'aspect-[4/3]'
    return 'aspect-video'
  }

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16" style={{ color: semantic.textDisabled }}>
        <div className="w-16 h-16 rounded-2xl mb-4 flex items-center justify-center" style={{ background: 'var(--bg-card)' }}>
          <ZoomIn size={24} style={{ color: semantic.textDisabled }} />
        </div>
        <p className="text-sm mb-1">{emptyMessage}</p>
        {emptyAction && (
          <button
            onClick={emptyAction.onClick}
            className="mt-3 px-4 py-2 rounded-xl text-xs font-medium transition-all"
            style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)', color: 'var(--color-primary)' }}
          >
            {emptyAction.label}
          </button>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {images.map(img => (
          <div
            key={img.id}
            className="group relative rounded-xl overflow-hidden transition-all"
            style={{ ...panels.card, border: hoveredId === img.id ? '1px solid rgba(34,211,238,0.3)' : undefined }}
            onMouseEnter={() => setHoveredId(img.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            {/* Image */}
            <div
              className={`relative overflow-hidden cursor-pointer ${aspectClass(img)}`}
              onClick={() => setLightbox(img)}
            >
              <img
                src={img.url}
                alt={img.prompt}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <div
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                style={{ background: 'rgba(0,0,0,0.4)' }}
              >
                <ZoomIn size={20} className="text-white" />
              </div>
            </div>

            {/* Info */}
            <div className="p-2">
              <p className="text-xs truncate" style={{ color: semantic.textSecondary }}>{img.prompt}</p>
              <div className="flex gap-1 mt-1 flex-wrap">
                {[img.model, img.quality, img.aspectRatio].filter(Boolean).map((tag, i) => (
                  <span key={i} className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.05)', color: semantic.textMuted }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
              <button
                onClick={e => { e.stopPropagation(); onDownload(img) }}
                title="Download"
                className="p-1.5 rounded-lg transition-all"
                style={buttons.iconOverlay}
              >
                <Download size={11} />
              </button>
              <button
                onClick={e => { e.stopPropagation(); onReuse(img) }}
                title="Reuse settings"
                className="p-1.5 rounded-lg transition-all"
                style={buttons.iconOverlay}
              >
                <Copy size={11} />
              </button>
              {onTogglePublic && (
                <button
                  onClick={e => { e.stopPropagation(); onTogglePublic(img.id, !img.isPublic) }}
                  title={img.isPublic ? 'Make private' : 'Make public'}
                  className="p-1.5 rounded-lg transition-all"
                  style={buttons.iconOverlay}
                >
                  {img.isPublic ? <Globe size={11} style={{ color: 'var(--color-primary)' }} /> : <Lock size={11} />}
                </button>
              )}
              <button
                onClick={e => { e.stopPropagation(); onDelete(img.id) }}
                title="Delete"
                className="p-1.5 rounded-lg transition-all"
                style={{ ...buttons.iconOverlay, color: '#f87171' }}
              >
                <Trash2 size={11} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.94)' }}
          onClick={() => setLightbox(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden animate-fade-in-up"
            style={{ border: '1px solid var(--border-color)' }}
            onClick={e => e.stopPropagation()}
          >
            <img
              src={lightbox.url}
              alt={lightbox.prompt}
              className="max-w-full max-h-[78vh] object-contain"
            />
            <div
              className="absolute bottom-0 left-0 right-0 p-4"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)' }}
            >
              <p className="text-sm mb-2" style={{ color: 'rgba(255,255,255,0.8)' }}>{lightbox.prompt}</p>
              {lightbox.enhancedPrompt && lightbox.enhancedPrompt !== lightbox.prompt && (
                <p className="text-xs mb-2" style={{ color: semantic.textMuted }}>
                  Enhanced: {lightbox.enhancedPrompt}
                </p>
              )}
              <div className="flex gap-2 flex-wrap">
                {[lightbox.model, lightbox.quality, lightbox.style, lightbox.aspectRatio, lightbox.format]
                  .filter(Boolean)
                  .map((tag, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.1)', color: semantic.textMuted }}>
                      {tag}
                    </span>
                  ))}
              </div>
            </div>
            <div className="absolute top-3 right-3 flex gap-2">
              <button onClick={() => onDownload(lightbox)} className="p-2 rounded-xl transition-all" style={buttons.iconOverlay}>
                <Download size={14} />
              </button>
              <button onClick={() => { onReuse(lightbox); setLightbox(null) }} className="p-2 rounded-xl transition-all" style={buttons.iconOverlay}>
                <Copy size={14} />
              </button>
              <button onClick={() => setLightbox(null)} className="p-2 rounded-xl transition-all" style={buttons.iconOverlay}>
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}