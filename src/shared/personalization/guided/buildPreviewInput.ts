/**
 * Builds the `PreviewInputProps` for the free, browser-only preview from the
 * personalization context.
 *
 * Kept as a standalone helper (rather than inline JSX) so the wizard's step 4,
 * the Advanced Editing overlay editor and the modal's overlay section all build
 * exactly the same input from the same data.
 */

import type {
  AssetLibrary,
  ClientProfile,
  PersonalizationSource,
} from '../types'
import type {
  PersonalizationPreviewSettings,
  PreviewInputProps,
  PreviewVideoRef,
} from '../preview/types'
import { buildDesignProps } from './designProps'

export interface BuildPreviewInputContext {
  source: PersonalizationSource | null
  previewSettings: PersonalizationPreviewSettings
  previewVideo: PreviewVideoRef | null
  clientForm: Partial<ClientProfile>
  assets: AssetLibrary
}

function firstUrl(
  ...candidates: (string | undefined | null)[]
): string | null {
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate
    }
  }
  return null
}

export function buildPreviewInput(
  ctx: BuildPreviewInputContext,
): PreviewInputProps {
  const { source, previewSettings, previewVideo, clientForm, assets } = ctx

  const businessName = clientForm.businessName || clientForm.name || ''
  const website = clientForm.website || ''
  const callToAction =
    clientForm.callToAction ||
    (website ? `Visit ${website}` : clientForm.phone ? `Call ${clientForm.phone}` : '')

  const brand: PreviewInputProps['brand'] = {
    // The headline text itself lives on the layers; this is only the fallback
    // the composition uses when a text layer has no explicit text.
    businessName,
    headline: businessName,
    offer: clientForm.offer || '',
    cta: callToAction,
    phone: clientForm.phone || '',
    website,
    logoUrl: firstUrl(assets.primaryLogo?.uploadedUrl, assets.primaryLogo?.url),
    productUrl: firstUrl(assets.products?.[0]?.uploadedUrl, assets.products?.[0]?.url),
    serviceUrl: firstUrl(
      assets.products?.[1]?.uploadedUrl,
      assets.products?.[1]?.url,
      assets.products?.[0]?.uploadedUrl,
      assets.products?.[0]?.url,
    ),
  }

  // A selected Remotion design travels WITH the input props, so the preview
  // player and the browser export render exactly the same design. Without a
  // selection both fields stay undefined and nothing changes.
  const designId = previewSettings.remotionDesignId
  const designProps = designId
    ? buildDesignProps({
        designId,
        brand,
        brandColors: previewSettings.brandColors,
        overrides: previewSettings.remotionDesignProps,
      })
    : undefined

  return {
    videoUrl: previewVideo?.url || source?.sourceMedia || null,
    posterUrl: previewVideo?.poster || source?.poster || null,
    isImageSource: source?.mediaType === 'image',
    audioUrl: previewSettings.audio?.url ?? null,
    settings: previewSettings,
    brand,
    ...(designId ? { remotionDesignId: designId } : {}),
    ...(designId && designProps ? { remotionDesignProps: designProps } : {}),
  }
}
