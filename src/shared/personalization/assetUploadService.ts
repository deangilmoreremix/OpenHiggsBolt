/**
 * Domain-level asset upload service for the Personalization system.
 *
 * This abstraction ensures the Personalization state does not depend on
 * which infrastructure stores or uploads media. The current implementation
 * delegates to MuAPI's upload_file endpoint, but can be replaced or
 * extended without touching domain/state code.
 */

import { uploadFile } from '@/packages/studio/src/muapi'

export interface UploadPersonalizationAssetInput {
  file: File
}

export interface UploadPersonalizationAssetResult {
  url: string
}

/**
 * Upload a personalization asset and return a durable URL.
 *
 * Callers (state/domain code) only need to know that an upload produces a URL.
 * The underlying storage infrastructure is an implementation detail.
 */
export async function uploadPersonalizationAsset(
  apiKey: string,
  { file }: UploadPersonalizationAssetInput,
): Promise<UploadPersonalizationAssetResult> {
  const url = await uploadFile(apiKey, file, () => {
    // Progress hook reserved for future UI feedback
  })
  return { url }
}
