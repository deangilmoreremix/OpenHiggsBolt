import { NextRequest, NextResponse } from 'next/server';
import { safeApiJson, upstreamErrorResponse } from '@/lib/safeApiResponse';
import { requireApiEntitlement, entitlementForbiddenResponse } from '@/access/apiRequireEntitlement';
import { ENTITLEMENTS } from '@/access/entitlements';
import { getApiKeyFromRequest } from '@/lib/uploadProxyTarget';

const MUAPI_UPLOAD_URL = 'https://api.muapi.ai/api/v1/upload_file';

const ALLOWED_UPLOAD_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/webm',
  'audio/mpeg',
  'audio/wav',
  'audio/webm',
]);

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

    const response = await fetch(MUAPI_UPLOAD_URL, {
      method: 'POST',
      headers: { 'x-api-key': apiKey },
      body: uploadForm,
      signal: AbortSignal.timeout(120_000),
    });

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
