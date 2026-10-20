import { NextRequest, NextResponse } from 'next/server';

/**
 * Same-origin proxy for the upstream ShotCraft preview clips.
 *
 * WHY THIS EXISTS
 * ---------------
 * The Motion Studio preview clips are published by the upstream `video-shotcraft`
 * repository as GitHub release assets. Two browser policies make a direct
 * cross-origin reference unusable in the Step 4 preview:
 *
 *   1. CORS — GitHub release assets do not send `Access-Control-Allow-Origin`,
 *      so any `fetch()`-based media loader is rejected. The Remotion player
 *      (mediabunny `UrlSource`) slices the clip with `fetch()` + `Range`
 *      requests, so it fails outright.
 *   2. CSP — `connect-src` would have to allow `github.com` for that fetch,
 *      which would widen the app's outbound allow-list for every page.
 *
 * Proxying through this route fixes both: the browser only ever talks to its
 * own origin, so there is no CORS pre-flight and no new CSP origin is needed
 * for `connect-src`. The bytes served are the *existing* upstream MP4s — this
 * route never generates, re-encodes or substitutes a video.
 *
 * `Range` support is forwarded verbatim so the player can seek.
 */

// The upstream base is a compile-time constant. The request path only ever
// selects a file name inside it, so this route cannot be pointed at another
// host (no SSRF surface).
const UPSTREAM_RELEASE_BASE =
  'https://github.com/Vincentwei1021/video-shotcraft/releases/download/gallery-media';

/** Only lowercase kebab-case style keys are accepted (e.g. `basic-3d-scene`). */
const STYLE_KEY_PATTERN = /^[a-z0-9][a-z0-9-]{0,80}$/;

/**
 * Hosts the upstream redirect chain is allowed to reach.
 *
 * GitHub serves release assets from `github.com` and redirects to
 * `release-assets.githubusercontent.com` (an Azure-backed asset CDN). The
 * redirect is followed manually so that every hop is validated BEFORE the
 * request is made — `redirect: 'follow'` would let an unexpected `Location`
 * aim the server at an arbitrary host.
 */
const ALLOWED_UPSTREAM_HOSTS = ['github.com'];
const ALLOWED_UPSTREAM_HOST_SUFFIXES = ['.githubusercontent.com'];

function isAllowedUpstreamHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return (
    ALLOWED_UPSTREAM_HOSTS.includes(host) ||
    ALLOWED_UPSTREAM_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix))
  );
}

/** Maximum number of upstream redirects that will be followed. */
const MAX_UPSTREAM_REDIRECTS = 5;

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ styleKey?: string }> },
): Promise<Response> {
  const { styleKey } = await params;

  // The catalog stores the URL as `/api/media/shotcraft/<styleKey>.mp4`; the
  // upstream release asset is `<styleKey>.mp4`, so an optional extension on
  // the incoming path is stripped before validation.
  const key = typeof styleKey === 'string' ? styleKey.replace(/\.mp4$/i, '') : '';

  if (!key || !STYLE_KEY_PATTERN.test(key)) {
    return NextResponse.json({ error: 'Invalid media key' }, { status: 400 });
  }

  const upstreamUrl = `${UPSTREAM_RELEASE_BASE}/${key}.mp4`;

  // Forward the client's Range header so the player can seek, and ask the
  // upstream for the exact bytes requested.
  const range = req.headers.get('range');
  const headers: Record<string, string> = { 'User-Agent': 'OpenHiggsBolt-Personalization-Preview' };
  if (range) headers.Range = range;

  // One deadline for the whole redirect chain, not one per hop.
  const signal = AbortSignal.timeout(30_000);

  let upstream: Response;
  try {
    upstream = await fetchUpstream(upstreamUrl, headers, signal);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upstream fetch failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }

  // A 4xx from the upstream is a client-visible condition and must not be
  // masked as a 502: 404 = unknown style key, 416 = unsatisfiable range.
  // 5xx is an upstream fault and is reported as 502.
  if (!upstream.ok && upstream.status !== 206) {
    const status = upstream.status === 404 ? 404 : upstream.status === 416 ? 416 : 502;
    const errorHeaders: Record<string, string> = {};
    const unsatisfiedRange = upstream.headers.get('content-range');
    if (status === 416 && unsatisfiedRange) errorHeaders['Content-Range'] = unsatisfiedRange;
    return NextResponse.json(
      { error: `Upstream returned ${upstream.status}` },
      { status, headers: errorHeaders },
    );
  }

  const responseHeaders = new Headers();
  // The upstream release assets are served as `application/octet-stream`. This
  // route only ever serves MP4s, so the real media type is declared explicitly
  // rather than forwarded — the player needs to know it is a video.
  responseHeaders.set('Content-Type', 'video/mp4');
  responseHeaders.set('Accept-Ranges', upstream.headers.get('accept-ranges') || 'bytes');

  // `fetch()` transparently decodes a gzip/br encoded body but leaves the
  // upstream headers untouched, so in that case the upstream Content-Length
  // no longer describes the bytes being streamed. Drop both headers and let
  // the runtime frame the response instead of sending a wrong length.
  if (!upstream.headers.get('content-encoding')) {
    const contentLength = upstream.headers.get('content-length');
    if (contentLength) responseHeaders.set('Content-Length', contentLength);
  }

  const contentRange = upstream.headers.get('content-range');
  if (contentRange) responseHeaders.set('Content-Range', contentRange);

  // Release assets are immutable, so the CDN can hold them indefinitely.
  responseHeaders.set('Cache-Control', 'public, max-age=31536000, immutable');

  return new Response(upstream.body, {
    status: upstream.status === 206 ? 206 : 200,
    headers: responseHeaders,
  });
}

/**
 * Fetch the upstream release asset, following GitHub's redirect chain
 * manually so every hop is checked against the allowed host list before the
 * request is issued. An unexpected `Location` aborts the chain instead of
 * being fetched.
 */
async function fetchUpstream(
  initialUrl: string,
  headers: Record<string, string>,
  signal: AbortSignal,
): Promise<Response> {
  let currentUrl = initialUrl;

  for (let hop = 0; hop <= MAX_UPSTREAM_REDIRECTS; hop += 1) {
    const response = await fetch(currentUrl, { headers, redirect: 'manual', signal });

    const isRedirect = response.status >= 300 && response.status < 400;
    if (!isRedirect) return response;

    const location = response.headers.get('location');
    // Release the redirect response body so the socket is not left dangling.
    await response.body?.cancel().catch(() => {});
    if (!location) return response;

    let nextUrl: URL;
    try {
      nextUrl = new URL(location, currentUrl);
    } catch {
      throw new Error('Upstream returned an unusable redirect target');
    }
    if (!isAllowedUpstreamHost(nextUrl.hostname)) {
      throw new Error(`Upstream redirect left the allowed hosts (${nextUrl.hostname})`);
    }
    currentUrl = nextUrl.toString();
  }

  throw new Error('Upstream redirect chain was too long');
}
