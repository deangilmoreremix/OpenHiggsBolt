import { useState } from 'react'
import { GripVertical, Trash2, Sparkles, Image as ImageIcon } from 'lucide-react'
import type { Slide } from '@/apps/presentation/lib/parser'

interface SlideEditorCardProps {
  slide: Slide
  index: number
  isActive: boolean
  onClick: () => void
  onUpdate: (updates: Partial<Slide>) => void
  onDelete: () => void
  onRegenerate: () => void
  onGenerateImage: () => void
  disabled?: boolean
}

export default function SlideEditorCard({
  slide,
  index,
  isActive,
  onClick,
  onUpdate,
  onDelete,
  onRegenerate,
  onGenerateImage,
  disabled,
}: SlideEditorCardProps) {
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)

  const handleRegenerate = async () => {
    setIsRegenerating(true)
    try {
      await onRegenerate()
    } finally {
      setIsRegenerating(false)
    }
  }

  const handleGenerateImage = async () => {
    setIsGeneratingImage(true)
    try {
      await onGenerateImage()
    } finally {
      setIsGeneratingImage(false)
    }
  }

  return (
    <div
      onClick={onClick}
      className={`group rounded-xl border transition-all cursor-pointer ${
        isActive
          ? 'border-primary bg-bg-card'
          : 'border-border-color hover:border-secondary bg-bg-app'
      }`}
    >
      <div className="flex items-center gap-2 p-3 border-b border-border-color">
        <div className="text-secondary">
          <GripVertical size={16} />
        </div>
        <span className="text-xs text-secondary w-5">{index + 1}</span>
        <input
          type="text"
          value={slide.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          onClick={(e) => e.stopPropagation()}
          disabled={disabled}
          placeholder="Slide title"
          className="flex-1 bg-transparent text-sm font-medium outline-none min-w-0"
        />
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleRegenerate()
            }}
            disabled={disabled || isRegenerating}
            className="p-1.5 rounded-lg text-secondary hover:text-primary transition-colors disabled:opacity-50"
            title="Regenerate slide"
          >
            <Sparkles size={14} className={isRegenerating ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleGenerateImage()
            }}
            disabled={disabled || isGeneratingImage}
            className="p-1.5 rounded-lg text-secondary hover:text-primary transition-colors disabled:opacity-50"
            title="Generate image"
          >
            <ImageIcon size={14} className={isGeneratingImage ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            disabled={disabled}
            className="p-1.5 rounded-lg text-secondary hover:text-red-400 transition-colors disabled:opacity-50"
            title="Delete slide"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="p-3 space-y-2">
        {slide.bullets.map((bullet, bulletIndex) => (
          <div key={bulletIndex} className="flex items-start gap-2">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
            <input
              type="text"
              value={bullet}
              onChange={(e) => {
                const next = [...slide.bullets]
                next[bulletIndex] = e.target.value
                onUpdate({ bullets: next })
              }}
              onClick={(e) => e.stopPropagation()}
              disabled={disabled}
              placeholder="Bullet point"
              className="flex-1 bg-transparent text-sm outline-none min-w-0"
            />
            <button
              onClick={(e) => {
                e.stopPropagation()
                const next = slide.bullets.filter((_, i) => i !== bulletIndex)
                onUpdate({ bullets: next })
              }}
              className="text-secondary hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onUpdate({ bullets: [...slide.bullets, ''] })
          }}
          className="text-xs text-secondary hover:text-white transition-colors"
        >
          + Add bullet
        </button>
      </div>

      {slide.imageUrl && (
        <div className="px-3 pb-3">
          <img
            src={slide.imageUrl}
            alt=""
            className="w-full h-24 object-cover rounded-lg"
          />
        </div>
      )}
    </div>
  )
}
