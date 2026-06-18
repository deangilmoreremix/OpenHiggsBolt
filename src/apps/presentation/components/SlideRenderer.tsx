import type { Slide } from '@/apps/presentation/lib/parser'
import type { ThemeProperties } from '@/apps/presentation/lib/themes'

interface SlideRendererProps {
  slide: Slide
  theme: ThemeProperties
  variant?: 'thumbnail' | 'preview' | 'fullscreen'
  className?: string
  style?: React.CSSProperties
}

export default function SlideRenderer({
  slide,
  theme,
  variant = 'preview',
  className = '',
  style,
}: SlideRendererProps) {
  const isFullscreen = variant === 'fullscreen'
  const isThumbnail = variant === 'thumbnail'

  const containerClasses = isFullscreen
    ? 'w-full h-full'
    : isThumbnail
      ? 'w-full aspect-video'
      : 'w-full aspect-video'

  return (
    <div
      className={`${containerClasses} relative overflow-hidden rounded-xl ${className}`}
      style={{
        background: theme.background,
        color: theme.colors.text,
        fontFamily: theme.fonts.body,
        ...style,
      }}
    >
      <div className="absolute inset-0 p-8 flex flex-col justify-center">
        <h2
          className={`font-bold mb-4 ${isFullscreen ? 'text-5xl md:text-6xl' : isThumbnail ? 'text-sm truncate' : 'text-2xl md:text-3xl'}`}
          style={{ color: theme.colors.heading, fontFamily: theme.fonts.heading }}
        >
          {slide.title}
        </h2>

        {slide.bullets.length > 0 && (
          <ul className={`space-y-2 ${isFullscreen ? 'text-xl md:text-2xl' : isThumbnail ? 'text-[10px] leading-tight' : 'text-sm md:text-base'}`}>
            {slide.bullets.map((bullet, index) => (
              <li key={index} className="flex items-start gap-2">
                <span
                  className="mt-1.5 rounded-full shrink-0"
                  style={{
                    width: isThumbnail ? 3 : 6,
                    height: isThumbnail ? 3 : 6,
                    backgroundColor: theme.colors.primary,
                  }}
                />
                <span className={isThumbnail ? 'line-clamp-2' : ''}>{bullet}</span>
              </li>
            ))}
          </ul>
        )}

        {slide.imageUrl && (
          <img
            src={slide.imageUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
          />
        )}
      </div>
    </div>
  )
}
