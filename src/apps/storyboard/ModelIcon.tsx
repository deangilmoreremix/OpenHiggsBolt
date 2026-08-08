import { PROVIDER_LOGOS, invertLogos, getProviderStyle } from './models'

interface ModelIconProps {
  provider: string
  providerName?: string
  /** Tailwind sizing classes, e.g. "w-full h-full" (the icon fills its parent). */
  className?: string
  /** Use a round crop (for sidebar/provider tabs). */
  rounded?: boolean
  /** Optional explicit size in px (when the parent isn't sized). */
  size?: number
}

/**
 * Renders a provider logo from PROVIDER_LOGOS. If the provider has no logo entry,
 * falls back to a colored two-letter badge from getProviderStyle(). Dark logos
 * (openai, blackforest, runway, ideogram, lightricks, grok) are inverted to show
 * up against the dark UI.
 *
 * Ported from packages/studio/src/components/ImageStudio.jsx.
 */
export default function ModelIcon({
  provider,
  providerName,
  className = 'w-full h-full',
  rounded = false,
  size,
}: ModelIconProps) {
  const logo = PROVIDER_LOGOS[provider]

  const style = size ? { width: size, height: size } : undefined
  const roundedCls = rounded ? 'rounded-full' : ''

  if (logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logo}
        alt={providerName || provider}
        style={style}
        className={`${className} object-contain p-1 ${roundedCls} ${
          invertLogos.includes(provider) ? 'invert' : ''
        }`}
      />
    )
  }

  const badge = getProviderStyle(provider)
  return (
    <span
      style={style}
      className={`${className} ${roundedCls} flex items-center justify-center rounded-md border font-bold text-[10px] uppercase ${badge.bg}`}
    >
      {badge.text}
    </span>
  )
}
