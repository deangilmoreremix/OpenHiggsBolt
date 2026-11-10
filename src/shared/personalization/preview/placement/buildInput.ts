import { layoutDefaultGeometry } from '../presets'
import { roleForLayer } from '../mediaRoles'
import { resolveLayerImageUrl, resolveLayerText } from '../layerContent'
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
    layers: settings.layers.map((layer) => {
      const facts = layer.kind === 'design' && layer.designId ? args.designFacts?.(layer.designId) : undefined
      const intended = layoutDefaultGeometry(settings.layout, layer.kind, settings.aspectRatio)
      return {
        layer,
        role: roleForLayer(layer, facts ? { id: facts.id, category: facts.category } : null),
        text: layer.kind === 'design' || layer.kind === 'endCard' || layer.kind === 'logo' ||
          layer.kind === 'productImage' || layer.kind === 'serviceImage'
          ? ''
          : resolveLayerText(layer, brand),
        intended,
        imageUrl: resolveLayerImageUrl(layer, brand),
        imageAspect: args.imageAspects?.[resolveLayerImageUrl(layer, brand)],
        designSupported: layer.kind === 'design' ? facts?.supported ?? false : undefined,
      }
    }),
  }
}
