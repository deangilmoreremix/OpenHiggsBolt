import type { DiscoveredAsset } from '../types'
import { editSmartVideoGoImage } from './imageEditApi'
import { getAssetRecipe, getOperation, type EditorOperationId } from './imageEditRegistry'

export type BatchVideoReadyContext = {
  businessName?: string
  industry?: string
}

export type BatchVideoReadyResult = {
  dataUrl: string
  operation: 'video_ready'
  prompt: string
  model: 'gpt-image-2.5-flare' | 'gpt-image-2.5-sunburst'
  quality: 'medium' | 'high'
  transparent: boolean
  videoReady: true
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, encoded = ''] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] || 'image/png'
  const binary = atob(encoded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

async function prepareDataUrl(url: string): Promise<string> {
  if (url.startsWith('data:')) return url
  if (url.startsWith('blob:')) {
    const response = await fetch(url)
    if (!response.ok) throw new Error('Unable to read local asset')
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = () => reject(reader.error || new Error('Unable to read local asset'))
      reader.readAsDataURL(blob)
    })
  }

  const response = await fetch('/api/personalization/download-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ urls: [url] }),
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload?.error || 'Unable to prepare discovered asset')
  const result = payload?.results?.[0]
  if (!result?.ok || !result?.dataUrl) throw new Error(result?.error || 'Unable to download discovered asset')
  return result.dataUrl as string
}

function buildPrompt(
  asset: DiscoveredAsset,
  operationId: EditorOperationId,
  context: BatchVideoReadyContext,
) {
  const recipe = getAssetRecipe(asset.category)
  const operation = getOperation(operationId)
  const business = [context.businessName, context.industry].filter(Boolean).join(' - ')
  return [
    'Edit this image for SmartVideo GO.',
    operation.prompt,
    recipe.preserve.length ? 'Preserve: ' + recipe.preserve.join(', ') + '.' : '',
    business ? 'Business context: ' + business + '.' : '',
    'This is an automatic Make Video Ready workflow. Do not make creative changes that are not required by the asset recipe.',
  ].filter(Boolean).join(' ')
}

export async function makeDiscoveredAssetVideoReady(
  asset: DiscoveredAsset,
  context: BatchVideoReadyContext = {},
  onStep?: (step: number, total: number, label: string) => void,
): Promise<BatchVideoReadyResult> {
  const recipe = getAssetRecipe(asset.category)
  const steps = recipe.makeVideoReadySteps.length
    ? recipe.makeVideoReadySteps
    : ['video_ready'] as EditorOperationId[]

  let source = await prepareDataUrl(asset.editedDataUrl || asset.previewUrl)
  let preserveTransparency = false
  let finalPrompt = ''
  let finalModel: BatchVideoReadyResult['model'] = 'gpt-image-2.5-flare'
  let finalQuality: BatchVideoReadyResult['quality'] = 'medium'

  for (let index = 0; index < steps.length; index += 1) {
    const stepId = steps[index]
    const operation = getOperation(stepId)
    preserveTransparency =
      preserveTransparency ||
      Boolean(operation.transparency) ||
      (stepId === 'video_ready' && recipe.transparencyRecommended)

    finalModel = operation.precision || recipe.precisionRecommended
      ? 'gpt-image-2.5-sunburst'
      : 'gpt-image-2.5-flare'
    finalQuality = finalModel === 'gpt-image-2.5-sunburst' ? 'high' : 'medium'
    finalPrompt = buildPrompt(asset, stepId, context)

    onStep?.(index + 1, steps.length, operation.label)

    const results = await editSmartVideoGoImage({
      operation: stepId,
      prompt: finalPrompt,
      image: dataUrlToBlob(source),
      model: finalModel,
      quality: finalQuality,
      size: 'auto',
      outputFormat: 'png',
      background: preserveTransparency ? 'transparent' : 'auto',
      inputFidelity: operation.precision || recipe.precisionRecommended ? 'high' : 'low',
    })

    const first = results?.[0]
    if (first?.b64_json) {
      source = 'data:image/png;base64,' + first.b64_json
    } else if (first?.url) {
      source = await prepareDataUrl(first.url)
    } else {
      throw new Error(operation.label + ' did not return an edited image')
    }
  }

  return {
    dataUrl: source,
    operation: 'video_ready',
    prompt: finalPrompt,
    model: finalModel,
    quality: finalQuality,
    transparent: preserveTransparency,
    videoReady: true,
  }
}
