import { NextResponse } from 'next/server';

// Same-origin proxy for workflow/agent thumbnails. Some upstream CDNs
// (e.g. cdn.muapi.ai/outputs/*) reject direct cross-origin <img> requests, so
// we fetch server-side (with a Referer) and stream the image back. This is a
// fallback; most thumbnails are served from local files in /public/thumbnails.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_HOSTS = new Set([
  'cdn.muapi.ai',
  'd3adwkbyhxyrtq.cloudfront.net',
  'muapi.ai',
]);

const FETCH_TIMEOUT_MS = 10000;
const MAX_BYTES = 15 * 1024 * 1024; // 15MB safety cap

function errJson(message, status) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get('url');
  if (!target) return errJson('Missing url parameter', 400);

  let parsed;
  try {
    parsed = new URL(target);
  } catch {
    return errJson('Invalid url', 400);
  }

  // SSRF guard: only https + explicit host allowlist.
  if (parsed.protocol !== 'https:' || !ALLOWED_HOSTS.has(parsed.hostname)) {
    return errJson('Host not allowed', 403);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const upstream = await fetch(parsed.toString(), {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        Referer: 'https://muapi.ai/',
      },
    });

    if (!upstream.ok) return errJson(`Upstream ${upstream.status}`, upstream.status);

    const contentType = upstream.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
      return errJson('Upstream did not return an image', 502);
    }

    const buffer = Buffer.from(await upstream.arrayBuffer());
    if (buffer.length > MAX_BYTES) return errJson('Image too large', 502);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        // Cache aggressively at the CDN/browser; thumbnails are immutable.
        'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    const aborted = error?.name === 'AbortError';
    return errJson(aborted ? 'Upstream timeout' : (error?.message || 'Fetch failed'), aborted ? 504 : 502);
  } finally {
    clearTimeout(timer);
  }
}
