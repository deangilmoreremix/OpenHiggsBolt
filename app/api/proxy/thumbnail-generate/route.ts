import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { requireApiEntitlement, entitlementForbiddenResponse } from '@/access/apiRequireEntitlement';
import { ENTITLEMENTS } from '@/access/entitlements';
import { getOpenAiKeyForUser } from '@/src/lib/openaiKeyServer';
import { checkDestination, createPinnedFetch } from '@/src/lib/networkSafety';

/**
 * Thumbnail generation for the Social Publish modal (opened from every studio).
 *
 * This route used to forward to `generate-thumbnail` / `refine-thumbnail`
 * edge functions that were never added to the repo, so every request failed.
 * It now calls the OpenAI Images API directly with the signed-in user's key:
 *
 *   - `generate` with no reference images  -> images/generations
 *   - `generate` with reference images     -> images/edits (references as image[])
 *   - `refine`                             -> images/edits on the chosen thumbnail
 *
 * The response shape (`urls`, `request_id`, `revised_prompt`) is what
 * `src/shared/api/thumbnailService.ts` already reads.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const OPENAI_BASE = 'https://api.openai.com/v1';
const UPSTREAM_TIMEOUT_MS = 180_000;
const REFERENCE_TIMEOUT_MS = 15_000;
const MAX_REFERENCE_BYTES = 20 * 1024 * 1024;
const MAX_REFERENCES = 4;

const GPT_IMAGE_MODELS = new Set(['gpt-image-2', 'gpt-image-1', 'gpt-image-1.5', 'gpt-image-1-mini']);
const DEFAULT_MODEL = 'gpt-image-2';

type Action = 'generate' | 'refine';

function errorJson(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/** gpt-image models take three sizes; pick the one closest to the requested ratio. */
function gptImageSize(aspectRatio: string): string {
  switch (aspectRatio) {
    case '16:9':
    case '3:2':
    case '4:3':
      return '1536x1024';
    case '9:16':
    case '4:5':
    case '2:3':
    case '3:4':
      return '1024x1536';
    default:
      return '1024x1024';
  }
}

function dalle3Size(aspectRatio: string): string {
  switch (aspectRatio) {
    case '16:9':
    case '3:2':
    case '4:3':
      return '1792x1024';
    case '9:16':
    case '4:5':
    case '2:3':
    case '3:4':
      return '1024x1792';
    default:
      return '1024x1024';
  }
}

function clampCount(n: unknown): number {
  const value = Number(n);
  if (!Number.isFinite(value)) return 1;
  return Math.min(Math.max(Math.round(value), 1), 4);
}

function normalizeQuality(q: unknown): 'low' | 'medium' | 'high' {
  return q === 'low' || q === 'high' ? q : 'medium';
}

function buildPrompt(body: Record<string, any>, aspectRatio: string): string {
  const parts: string[] = [];
  const base = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  if (base) parts.push(base);
  parts.push(`Composition: a ${aspectRatio} social media thumbnail.`);
  // ThumbnailStep already folds headline/subheadline into the prompt; only add
  // them here when a caller sends them without doing that.
  if (typeof body.headline === 'string' && body.headline.trim() && !base.includes(body.headline.trim())) {
    parts.push(`Render the headline text "${body.headline.trim()}" in large, legible type.`);
  }
  if (typeof body.subheadline === 'string' && body.subheadline.trim() && !base.includes(body.subheadline.trim())) {
    parts.push(`Smaller supporting text: "${body.subheadline.trim()}".`);
  }
  return parts.join(' ').slice(0, 30_000);
}

type ImagePart = { blob: Blob; filename: string };

function extensionFor(type: string): string {
  if (type.includes('jpeg') || type.includes('jpg')) return 'jpg';
  if (type.includes('webp')) return 'webp';
  return 'png';
}

/** Decodes a data: URL or downloads a public https image (SSRF-guarded). */
async function loadImage(source: string, index: number): Promise<ImagePart> {
  if (source.startsWith('data:image/')) {
    const match = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i.exec(source);
    if (!match) throw new Error('Reference image is not a valid data URL');
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length > MAX_REFERENCE_BYTES) throw new Error('Reference image is too large (20MB max)');
    const type = match[1].toLowerCase();
    return { blob: new Blob([buffer], { type }), filename: `reference-${index}.${extensionFor(type)}` };
  }

  const destination = await checkDestination(source, {});
  if (!destination.ok || destination.protocol !== 'https:') {
    throw new Error('Reference image URL is not allowed');
  }
  const pinnedFetch = createPinnedFetch(destination);
  const res = (await pinnedFetch(destination.url, {
    method: 'GET',
    headers: { Accept: 'image/*' },
    signal: AbortSignal.timeout(REFERENCE_TIMEOUT_MS),
  })) as Response;
  if (!res.ok) throw new Error(`Could not download reference image (${res.status})`);
  const type = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (!type.startsWith('image/')) throw new Error('Reference URL did not return an image');
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length > MAX_REFERENCE_BYTES) throw new Error('Reference image is too large (20MB max)');
  return { blob: new Blob([buffer], { type }), filename: `reference-${index}.${extensionFor(type)}` };
}

type OpenAiImageResponse = {
  data?: { url?: string; b64_json?: string; revised_prompt?: string }[];
  error?: { message?: string; code?: string };
  output_format?: string;
};

function toUrls(payload: OpenAiImageResponse): { urls: string[]; revised?: string } {
  const format = payload.output_format || 'png';
  const urls: string[] = [];
  let revised: string | undefined;
  for (const item of payload.data || []) {
    if (item.b64_json) urls.push(`data:image/${format};base64,${item.b64_json}`);
    else if (item.url) urls.push(item.url);
    if (!revised && item.revised_prompt) revised = item.revised_prompt;
  }
  return { urls, revised };
}

async function readUpstream(res: Response): Promise<OpenAiImageResponse> {
  const text = await res.text();
  try {
    return JSON.parse(text) as OpenAiImageResponse;
  } catch {
    return { error: { message: text.slice(0, 300) || `OpenAI error ${res.status}` } };
  }
}

function upstreamError(res: Response, payload: OpenAiImageResponse) {
  if (payload.error?.code === 'moderation_blocked') {
    return errorJson('Content moderation blocked this request. Please revise the prompt.', 400);
  }
  const message = payload.error?.message || `OpenAI image error (${res.status})`;
  // 401 from OpenAI means the stored key is wrong, not that the user is signed out.
  const status = res.status === 401 ? 400 : res.status;
  return errorJson(res.status === 401 ? 'Your OpenAI API key was rejected. Update it in Settings.' : message, status);
}

async function generations(key: string, model: string, prompt: string, aspectRatio: string, n: number, quality: string) {
  if (model === 'dall-e-3') {
    // dall-e-3 only returns one image per request.
    const calls = Array.from({ length: n }, () =>
      fetch(`${OPENAI_BASE}/images/generations`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt: prompt.slice(0, 4000),
          n: 1,
          size: dalle3Size(aspectRatio),
          quality: quality === 'high' ? 'hd' : 'standard',
          response_format: 'b64_json',
        }),
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      }),
    );
    const responses = await Promise.all(calls);
    const urls: string[] = [];
    let revised: string | undefined;
    for (const res of responses) {
      const payload = await readUpstream(res);
      if (!res.ok) return { error: upstreamError(res, payload) };
      const out = toUrls(payload);
      urls.push(...out.urls);
      revised = revised || out.revised;
    }
    return { urls, revised };
  }

  const res = await fetch(`${OPENAI_BASE}/images/generations`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, n, size: gptImageSize(aspectRatio), quality }),
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });
  const payload = await readUpstream(res);
  if (!res.ok) return { error: upstreamError(res, payload) };
  return toUrls(payload);
}

async function edits(key: string, model: string, prompt: string, aspectRatio: string, n: number, quality: string, images: ImagePart[]) {
  const form = new FormData();
  form.append('model', model);
  form.append('prompt', prompt);
  form.append('n', String(n));
  form.append('size', gptImageSize(aspectRatio));
  form.append('quality', quality);
  for (const image of images) form.append('image[]', image.blob, image.filename);

  const res = await fetch(`${OPENAI_BASE}/images/edits`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: form,
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });
  const payload = await readUpstream(res);
  if (!res.ok) return { error: upstreamError(res, payload) };
  return toUrls(payload);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return errorJson('UNAUTHENTICATED', 401);

  const entitlementCheck = await requireApiEntitlement(ENTITLEMENTS.SMARTVIDEO_GO);
  if (!entitlementCheck.allowed) {
    if (entitlementCheck.status === 401) return errorJson('UNAUTHENTICATED', 401);
    return entitlementForbiddenResponse(ENTITLEMENTS.SMARTVIDEO_GO);
  }

  const key = await getOpenAiKeyForUser();
  if (!key) {
    return errorJson('Add your OpenAI API key in Settings to generate thumbnails.', 400);
  }

  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return errorJson('Invalid JSON body', 400);
  }

  const action: Action = body.action === 'refine' ? 'refine' : 'generate';
  const aspectRatio = typeof body.aspect_ratio === 'string' ? body.aspect_ratio : '16:9';
  const n = clampCount(body.n);
  const quality = normalizeQuality(body.quality);
  const requestedModel = typeof body.model === 'string' ? body.model : DEFAULT_MODEL;

  const prompt = action === 'refine'
    ? (typeof body.prompt === 'string' ? body.prompt.trim() : '')
    : buildPrompt(body, aspectRatio);
  if (!prompt) return errorJson('A prompt is required', 400);

  // Images that shape the result: the thumbnail being refined, or the
  // reference images (studio output, uploads) for a fresh generation.
  const sources: string[] = [];
  if (action === 'refine') {
    if (typeof body.image_url !== 'string' || !body.image_url) {
      return errorJson('image_url is required to refine a thumbnail', 400);
    }
    sources.push(body.image_url);
  } else {
    if (typeof body.image_url === 'string' && body.image_url) sources.push(body.image_url);
    if (Array.isArray(body.reference_urls)) {
      for (const ref of body.reference_urls) if (typeof ref === 'string' && ref) sources.push(ref);
    }
  }
  const uniqueSources = Array.from(new Set(sources)).slice(0, MAX_REFERENCES);

  // Image editing needs a gpt-image model; dall-e-3 can only generate from text.
  let model = requestedModel === 'dall-e-3' || GPT_IMAGE_MODELS.has(requestedModel) ? requestedModel : DEFAULT_MODEL;
  if (uniqueSources.length > 0 && model === 'dall-e-3') model = DEFAULT_MODEL;

  try {
    let result: { urls?: string[]; revised?: string; error?: NextResponse };
    if (uniqueSources.length > 0) {
      let images: ImagePart[];
      try {
        images = await Promise.all(uniqueSources.map((src, i) => loadImage(src, i)));
      } catch (err: any) {
        return errorJson(err?.message || 'Could not read a reference image', 400);
      }
      result = await edits(key, model, prompt, aspectRatio, n, quality, images);
    } else {
      result = await generations(key, model, prompt, aspectRatio, n, quality);
    }

    if (result.error) return result.error;
    if (!result.urls || result.urls.length === 0) {
      return errorJson('The image service returned no thumbnails. Try again.', 502);
    }

    return NextResponse.json({
      urls: result.urls,
      request_id: `thumb_${Date.now().toString(36)}`,
      revised_prompt: result.revised,
      model,
    });
  } catch (err: any) {
    const timedOut = err?.name === 'TimeoutError' || err?.name === 'AbortError';
    return errorJson(timedOut ? 'Thumbnail generation timed out. Try again.' : (err?.message || 'Internal server error'), timedOut ? 504 : 500);
  }
}
