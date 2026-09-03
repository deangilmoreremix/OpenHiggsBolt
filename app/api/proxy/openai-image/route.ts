import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { requireApiEntitlement, entitlementForbiddenResponse } from '@/access/apiRequireEntitlement';
import { ENTITLEMENTS } from '@/access/entitlements';
import { getOpenAiKeyForUser } from '@/src/lib/openaiKeyServer';

const BASE = 'https://api.openai.com/v1';

async function resolveUserAndKey(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return { userId: null, key: null, status: 401 as const };

  const key = await getOpenAiKeyForUser();
  if (!key) {
    return { userId: null, key: null, status: 401 as const };
  }

  return { userId, key, status: 200 as const };
}

export async function POST(req: NextRequest) {
  const { userId, key, status } = await resolveUserAndKey(req);
  if (!userId) {
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status });
  }

  const entitlementCheck = await requireApiEntitlement(ENTITLEMENTS.SMARTVIDEO_GO);
  if (!entitlementCheck.allowed) {
    if (entitlementCheck.status === 401) {
      return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
    }
    return entitlementForbiddenResponse(ENTITLEMENTS.SMARTVIDEO_GO);
  }

  try {
    const contentType = req.headers.get('content-type') || '';
    const isMultipart = contentType.startsWith('multipart/');

    let endpoint = isMultipart ? 'images/edits' : 'images/generations';
    let upstreamBody: BodyInit | undefined;
    let upstreamHeaders: Record<string, string> = {
      Authorization: `Bearer ${key}`,
    };

    if (isMultipart) {
      // Forward multipart bodies as-is, preserving boundary and file parts.
      upstreamBody = req.body ?? undefined;
      upstreamHeaders['content-type'] = contentType;
    } else {
      const body = await req.json();
      const { _endpoint, ...upstreamPayload } = body;
      endpoint = _endpoint || endpoint;
      upstreamBody = JSON.stringify(upstreamPayload);
      upstreamHeaders['content-type'] = 'application/json';
    }

    const upstream = await fetch(`${BASE}/${endpoint}`, {
      method: 'POST',
      headers: upstreamHeaders,
      body: upstreamBody,
      signal: AbortSignal.timeout(120000),
    });

    if (upstream.headers.get('content-type')?.includes('text/event-stream')) {
      // Preserve the event stream and do NOT parse it as JSON.
      return new Response(upstream.body ?? undefined, {
        status: upstream.status,
        headers: {
          'content-type': upstream.headers.get('content-type') || 'text/event-stream',
          'cache-control': upstream.headers.get('cache-control') || 'no-cache',
        },
      });
    }

    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
