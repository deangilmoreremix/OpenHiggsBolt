import { NextRequest, NextResponse } from 'next/server';
import { safeApiJson, upstreamErrorResponse } from '@/lib/safeApiResponse';
import { requireApiEntitlement, entitlementForbiddenResponse } from '@/access/apiRequireEntitlement';
import { ENTITLEMENTS } from '@/access/entitlements';
import { getApiKeyFromRequest, isBlockedFileType } from '@/lib/uploadProxyTarget';

const MUAPI_UPLOAD_URL = 'https://api.muapi.ai/api/v1/upload_file';

// Mirrors the MuAPI File Upload API contract (https://muapi.ai/docs/file-upload):
//   Images  10MB  .jpg .png .webp
//   Videos  50MB  .mp4 .mov
//   Others  10MB  .zip .pdf .json
const ALLOWED_UPLOAD_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'audio/mpeg',
  'audio/wav',
  'audio/webm',
  'application/zip',
  'application/pdf',
  'application/json',
]);

const UPLOAD_MAX_RETRIES = 3;
const UPLOAD_BASE_DELAY_MS = 1_000;

async function attemptMuApiUpload(apiKey: string, formData: FormData): Promise<Response> {
  return fetch(MUAPI_UPLOAD_URL, {
    method: 'POST',
    headers: { 'x-api-key': apiKey },
    body: formData,
    signal: AbortSignal.timeout(120_000),
  });
}

async function uploadWithRetry(apiKey: string, formData: FormData): Promise<Response> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < UPLOAD_MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const delay = UPLOAD_BASE_DELAY_MS * attempt;
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    try {
      const response = await attemptMuApiUpload(apiKey, formData);
      if (response.ok) return response;
      
      // Don't retry on client errors (4xx) except 429
      const status = response.status;
      if (status >= 400 && status < 500 && status !== 429) {
        return response;
      }
      
      // For 5xx and 429, we'll retry
      const text = await response.text().catch(() => '');
      lastError = new Error(`MuAPI upload failed with status ${status}: ${text}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Network error during upload');
    }
  }
  
  throw lastError || new Error('MuAPI upload failed after retries');
}

export async function POST(request: NextRequest) {
  const entitlementCheck = await requireApiEntitlement(ENTITLEMENTS.SMARTVIDEO_GO);
  if (!entitlementCheck.allowed) {
    if (entitlementCheck.status === 401) {
      return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
    }
    return entitlementForbiddenResponse(ENTITLEMENTS.SMARTVIDEO_GO);
  }

  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Request must be multipart/form-data' }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }

    if (!ALLOWED_UPLOAD_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Allowed: ${[...ALLOWED_UPLOAD_MIME_TYPES].join(', ')}` },
        { status: 400 }
      );
    }

    if (isBlockedFileType(file.name, file.type)) {
      return NextResponse.json(
        { error: `Blocked file extension or MIME type: ${file.name}` },
        { status: 400 }
      );
    }

    const maxBytes = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json(
        { error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)} MB. Maximum: ${file.type.startsWith('video/') ? '50 MB' : '10 MB'}` },
        { status: 400 }
      );
    }

    const apiKey = getApiKeyFromRequest(request);
    if (!apiKey) {
      return NextResponse.json({ error: 'Unauthorized: Missing API key' }, { status: 401 });
    }

    const uploadForm = new FormData();
    uploadForm.append('file', file);

    let response: Response;
    try {
      response = await uploadWithRetry(apiKey, uploadForm);
    } catch (error) {
      console.error('MuAPI upload failed after retries:', error);
      
      if (error instanceof TypeError) {
        return NextResponse.json(
          { error: 'Unable to reach MuAPI. Please check your connection and try again.' },
          { status: 502 }
        );
      }
      
      const message = error instanceof Error ? error.message : 'Unknown error';
      if (/MuAPI upload failed with status 5\d\d/.test(message)) {
        return NextResponse.json(
          { error: 'MuAPI is temporarily unavailable. Please try again in a moment.' },
          { status: 502 }
        );
      }
      
      return NextResponse.json(
        { error: message || 'MuAPI upload failed. Please try again.' },
        { status: 502 }
      );
    }

    const parsed = await safeApiJson(response);

    if (response.ok) {
      const url = typeof parsed === 'object' && parsed !== null
        ? (parsed as any).url || (parsed as any).file_url || (parsed as any).data?.url
        : undefined;

      if (!url || typeof url !== 'string') {
        return NextResponse.json({ error: 'No URL returned from file upload' }, { status: 502 });
      }

      return NextResponse.json({
        url,
        name: file.name,
        size: file.size,
        type: file.type,
      });
    }

    return upstreamErrorResponse(response, parsed);
  } catch (error) {
    console.error('Upload file exception:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
