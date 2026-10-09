import { NextResponse } from 'next/server';
import { getApiKeyFromRequest, validateUploadProxyTarget } from '@/lib/uploadProxyTarget';
import { resolveMuAPIKey } from '../../vfx/_helpers';
import { safeApiJson, upstreamErrorResponse } from '@/lib/safeApiResponse';

export const dynamic = 'force-dynamic';

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

const ALLOWED_S3_FORM_FIELDS = new Set([
  'key',
  'AWSAccessKeyId',
  'policy',
  'signature',
  'file',
  'content-type-range',
  'acl',
  'success_action_redirect',
  'success_action_status',
  'Content-Type',
  'Content-Disposition',
]);

export async function POST(request) {
    try {
        const apiKey = getApiKeyFromRequest(request);
        if (!apiKey) {
            return NextResponse.json({ error: 'Unauthorized: Missing API key' }, { status: 401 });
        }

        const resolvedKey = await resolveMuAPIKey(request);
        if (!resolvedKey) {
            return NextResponse.json({ error: 'Unauthorized: Missing API key' }, { status: 401 });
        }

        const formData = await request.formData();

        const fileEntry = Array.from(formData.entries()).find(([_, value]) => value && typeof value === 'object' && typeof value.name === 'string');
        if (!fileEntry) {
            return NextResponse.json({ error: 'file is required' }, { status: 400 });
        }

        const targetUrl = formData.get('x-proxy-target-url');
        if (!targetUrl) {
            return NextResponse.json({ error: 'Missing proxy target URL' }, { status: 400 });
        }

        const validatedTarget = await validateUploadProxyTarget(targetUrl);
        if (!validatedTarget.ok) {
            return NextResponse.json(
                { error: 'Invalid upload target', reason: validatedTarget.reason },
                { status: 400 }
            );
        }

        const fileContentType = formData.get('Content-Type') || formData.get('content-type') || '';
        const fileMimeType = (fileEntry[1].type || fileContentType || '').toLowerCase().split(';')[0].trim();

        if (!ALLOWED_UPLOAD_MIME_TYPES.has(fileMimeType)) {
            return NextResponse.json(
                { error: 'Invalid file type', reason: 'mime_type_not_allowed' },
                { status: 400 }
            );
        }

        const s3FormData = new FormData();
        for (const [key, value] of formData.entries()) {
            if (key === 'x-proxy-target-url') continue;
            if (ALLOWED_S3_FORM_FIELDS.has(key)) {
                s3FormData.append(key, value);
            }
        }

        const s3Response = await fetch(validatedTarget.url, {
            method: 'POST',
            body: s3FormData,
            signal: AbortSignal.timeout(120000),
        });

        if (s3Response.ok || s3Response.status === 204) {
            const headers = new Headers();
            for (const [key, value] of s3Response.headers.entries()) {
                if (['etag', 'location', 'x-amz-request-id'].includes(key.toLowerCase())) {
                    headers.set(key, value);
                }
            }

            if (s3Response.status === 204) {
                return new Response(null, { status: 204, headers });
            }

            const body = await safeApiJson(s3Response);
            return new Response(JSON.stringify(body), {
                status: s3Response.status,
                headers,
            });
        } else {
            const rawError = await s3Response.text();
            console.error('S3 Proxy Error:', rawError);
            const parsed = await safeApiJson(new Response(rawError));
            return upstreamErrorResponse(s3Response, parsed);
        }
    } catch (error) {
        console.error('Upload Proxy Exception:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
