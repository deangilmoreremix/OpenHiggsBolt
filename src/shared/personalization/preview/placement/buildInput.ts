import { layoutDefaultGeometry } from '../presets'
import { roleForLayer } from '../mediaRoles'
import { endCardFrames } from '../endCard'
import { resolveLayerImageUrl, resolveLayerText } from '../layerContent'
import { resolveImageStyle, shadowBleedPx } from '../imageStyle'
import type { PersonalizationPreviewSettings, PreviewInputProps } from '../types'
import type { LumaSample, PlacementInput, ProtectedZone } from './types'

/**
 * Builds the placement/quality input from the project's own settings.
 * `designRoleOf` maps a design id to { id, category, supported } — passed in so
 * this stays free of the template registry.
 */
export function buildPlacementInput(args: {
  settings: PersonalizationPreviewSettings
  brand: PreviewInputProps['brand']
  zones?: ProtectedZone[]
  samples?: LumaSample[]
  /** Measured natural aspect ratio (w/h) per image URL. */
  imageAspects?: Record<string, number>
  source?: PlacementInput['source']
  designFacts?: (designId: string) => { id: string; category?: string; supported: boolean } | undefined
}): PlacementInput {
  const { settings, brand } = args
  return {
    width: settings.width,
    height: settings.height,
    fps: settings.fps,
    durationInFrames: settings.durationInFrames,
    zones: args.zones ?? settings.protectedZones ?? [],
    samples: args.samples ?? [],
    textColor: settings.brandColors.text,
    source: args.source,
    endCardStartFrame: settings.showEndCard ? endCardFrames(settings.durationInFrames).start : null,
    layers: settings.layers.map((layer) => {
      const facts = layer.kind === 'design' && layer.designId ? args.designFacts?.(layer.designId) : undefined
      const intended = layoutDefaultGeometry(settings.layout, layer.kind, settings.aspectRatio)
      const role = roleForLayer(layer, facts ? { id: facts.id, category: facts.category } : null)
      const imageUrl = resolveLayerImageUrl(layer, brand)
      // What an image actually occupies once styled: a circle is a square, a covering image
      // fills its whole box, a contained one hugs the picture; its shadow adds a bleed.
      const hints = settings.imageHints?.[imageUrl]
      const styled = layer.kind === 'logo' || layer.kind === 'productImage' || layer.kind === 'serviceImage'
        ? resolveImageStyle({ role, layerStyle: layer.imageStyle, hints }).style
        : null
      // the shared hints are what the composition frames by, so they win
      const measuredAspect = hints?.aspect ?? args.imageAspects?.[imageUrl]
      const imageAspect = !styled
        ? measuredAspect
        : styled.shape === 'circle' ? 1 : styled.fit === 'cover' ? undefined : measuredAspect
      return {
        layer,
        role,
        text: layer.kind === 'design' || layer.kind === 'endCard' || layer.kind === 'logo' ||
          layer.kind === 'productImage' || layer.kind === 'serviceImage'
          ? ''
          : resolveLayerText(layer, brand),
        intended,
        imageUrl,
        imageAspect,
        bleedPx: styled ? shadowBleedPx(styled, settings.height) : 0,
        designSupported: layer.kind === 'design' ? facts?.supported ?? false : undefined,
      }
    }),
  }
}
