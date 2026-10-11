import { NextRequest, NextResponse } from 'next/server';
import { safeApiJson, upstreamErrorResponse } from '@/lib/safeApiResponse';
import { requireApiEntitlement, entitlementForbiddenResponse } from '@/access/apiRequireEntitlement';
import { ENTITLEMENTS } from '@/access/entitlements';
import { getApiKeyFromRequest, isBlockedFileType } from '@/lib/uploadProxyTarget';
import { getUploadLimit, isAllowedUploadMimeType, formatUploadLimit, ALLOWED_UPLOAD_MIME_TYPES } from '@/lib/uploadConfig';

const MUAPI_UPLOAD_URL = 'https://api.muapi.ai/api/v1/upload_file';

// Size limits and the MIME allowlist are imported from the single authoritative
// upload contract (packages/studio/src/uploadContract.js). Never re-declare
// them here — that is how this route previously drifted from the clients.
// Mirrors https://muapi.ai/docs/file-upload:
//   Images 10MB .jpg .png .webp | Videos 50MB .mp4 .mov | Others 10MB .zip .pdf .json

// This route is the retry authority for uploads: the browser sends exactly one
// request and waits longer than this worst case (see the client's policy in
// packages/studio/src/muapi.js). Keep the client budget in sync if changed:
//   worst case = UPLOAD_MAX_RETRIES * UPLOAD_ATTEMPT_TIMEOUT_MS + backoff
const UPLOAD_ATTEMPT_TIMEOUT_MS = 120_000;
// ── Structured failure classification ────────────────────────────────────────
// Every upload failure returns a machine-readable `code` plus a human message.
// The client can branch on `code` without parsing prose; logs get the diagnostic
// detail. NEVER log or return the api key, the raw upstream body, or the user's
// original filename (file metadata can itself be sensitive).

export type UploadFailureCode =
  | 'REJECTED_MULTIPART'
  | 'REJECTED_NO_FILE'
  | 'REJECTED_MIME_TYPE'
  | 'REJECTED_BLOCKED_TYPE'
  | 'REJECTED_TOO_LARGE'
  | 'UNAUTHENTICATED'
  | 'UPSTREAM_UNREACHABLE'
  | 'UPSTREAM_UNAVAILABLE'
  | 'UPSTREAM_REJECTED'
  | 'UPSTREAM_NO_URL'
  | 'INTERNAL';

function fail(code: UploadFailureCode, message: string, status: number) {
  return NextResponse.json({ error: message, code }, { status });
}

/** Extension only — never the full filename. */
function safeExtension(file: File): string {
  const dot = file.name.lastIndexOf('.');
  return dot === -1 ? '(none)' : file.name.slice(dot + 1).toLowerCase().slice(0, 12);
}

/**
 * Server-side diagnostic line. Deliberately excludes the api key, the upstream
 * response body, and the user's filename.
 */
function logUploadFailure(code: UploadFailureCode, detail: Record<string, unknown>) {
  console.warn(`[upload_file] ${code}`, JSON.stringify(detail));
}

const UPLOAD_MAX_RETRIES = 3;
const UPLOAD_BASE_DELAY_MS = 1_000;

async function attemptMuApiUpload(apiKey: string, formData: FormData): Promise<Response> {
  return fetch(MUAPI_UPLOAD_URL, {
    method: 'POST',
    headers: { 'x-api-key': apiKey },
    body: formData,
    signal: AbortSignal.timeout(UPLOAD_ATTEMPT_TIMEOUT_MS),
  });
}

async function uploadWithRetry(apiKey: string, formData: FormData): Promise<Response> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < UPLOAD_MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      // Exponential backoff with a small deterministic jitter, capped so the
      // total added delay stays bounded.
      const delay = Math.min(UPLOAD_BASE_DELAY_MS * 2 ** (attempt - 1), 8000);
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
      logUploadFailure('REJECTED_MULTIPART', { contentType: contentType.slice(0, 80) });
      return fail('REJECTED_MULTIPART', 'Request must be multipart/form-data', 400);
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      logUploadFailure('REJECTED_NO_FILE', { formFields: [...formData.keys()].slice(0, 20) });
      return fail('REJECTED_NO_FILE', 'file is required', 400);
    }

    if (!isAllowedUploadMimeType(file)) {
      logUploadFailure('REJECTED_MIME_TYPE', { mime: file.type || '(empty)', ext: safeExtension(file), bytes: file.size });
      return fail(
        'REJECTED_MIME_TYPE',
        `Invalid file type: ${file.type || 'unknown'}. Allowed: ${[...ALLOWED_UPLOAD_MIME_TYPES].join(', ')}`,
        400
      );
    }

    if (isBlockedFileType(file.name, file.type)) {
      logUploadFailure('REJECTED_BLOCKED_TYPE', { ext: safeExtension(file), mime: file.type || '(empty)' });
      return fail('REJECTED_BLOCKED_TYPE', 'File type is not permitted', 400);
    }

    const maxBytes = getUploadLimit(file);
    if (file.size > maxBytes) {
      logUploadFailure('REJECTED_TOO_LARGE', { bytes: file.size, limit: maxBytes, mime: file.type || '(empty)' });
      return fail(
        'REJECTED_TOO_LARGE',
        `File too large: ${(file.size / 1024 / 1024).toFixed(1)} MB. Maximum: ${formatUploadLimit(maxBytes)}`,
        400
      );
    }

    const apiKey = getApiKeyFromRequest(request);
    if (!apiKey) {
      logUploadFailure('UNAUTHENTICATED', { reason: 'missing_api_key' });
      return fail('UNAUTHENTICATED', 'Unauthorized: Missing API key', 401);
    }

    const uploadForm = new FormData();
    uploadForm.append('file', file);

    let response: Response;
    try {
      response = await uploadWithRetry(apiKey, uploadForm);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';

      // Distinguish "never connected" from "connected then rejected" so the
      // client can decide whether retrying later is worthwhile.
      const isNetwork = error instanceof TypeError || /fetch failed|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|socket hang up/i.test(message);
      const code: UploadFailureCode = isNetwork
        ? 'UPSTREAM_UNREACHABLE'
        : /status 5\d\d/.test(message)
          ? 'UPSTREAM_UNAVAILABLE'
          : 'UPSTREAM_REJECTED';

      // The retry layer's message embeds the raw upstream body, so it is logged
      // to the server only and never returned to the client.
      logUploadFailure(code, {
        attempts: UPLOAD_MAX_RETRIES,
        mime: file.type,
        bytes: file.size,
        upstreamStatus: (message.match(/status (\d{3})/) || [])[1] ?? null,
        errorClass: error instanceof Error ? error.constructor.name : typeof error,
      });
      console.error('[upload_file] upstream detail (server-side only):', message);

      if (isNetwork) {
        return fail('UPSTREAM_UNREACHABLE', 'Unable to reach MuAPI. Please check your connection and try again.', 502);
      }
      if (code === 'UPSTREAM_UNAVAILABLE') {
        return fail('UPSTREAM_UNAVAILABLE', 'MuAPI is temporarily unavailable. Please try again in a moment.', 502);
      }
      return fail('UPSTREAM_REJECTED', 'MuAPI upload failed. Please try again.', 502);
    }

    const parsed = await safeApiJson(response);

    if (response.ok) {
      const url = typeof parsed === 'object' && parsed !== null
        ? (parsed as any).url || (parsed as any).file_url || (parsed as any).data?.url
        : undefined;

      if (!url || typeof url !== 'string') {
        logUploadFailure('UPSTREAM_NO_URL', { upstreamStatus: response.status });
        return fail('UPSTREAM_NO_URL', 'No URL returned from file upload', 502);
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
