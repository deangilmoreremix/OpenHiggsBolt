import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isProtectedRoute = createRouteMatcher([
  '/studio(.*)',
  '/vfx(.*)',
  '/api/v1/protected(.*)',
]);

const isAuthRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/forgot-password(.*)',
]);

function addSecurityHeaders(response) {
  // Prevent MIME type sniffing (CWE-693)
  response.headers.set('X-Content-Type-Options', 'nosniff');
  // Prevent clickjacking (CWE-1021)
  response.headers.set('X-Frame-Options', 'DENY');
  // Enable XSS filter in legacy browsers
  response.headers.set('X-XSS-Protection', '1; mode=block');
  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Content Security Policy - restricts script sources to prevent XSS (CWE-79).
  // connect-src covers *.muapi.ai (not just api.muapi.ai) because generated
  // media, model thumbnails, and other assets are served from cdn.muapi.ai
  // and other muapi subdomains that the renderer fetches directly.
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; media-src 'self' data: blob: https:; connect-src 'self' https://muapi.ai https://*.muapi.ai; font-src 'self' data:;"
  );
  return response;
}

export default clerkMiddleware(async (auth, request) => {
  // Dev-only E2E auth bypass. When the `__e2e_auth_bypass` cookie is present and
  // we are NOT in production, skip Clerk auth so the Playwright suite can run
  // fully offline (no live Clerk session). Never active in production.
  if (
    process.env.NODE_ENV !== 'production' &&
    request.cookies.get('__e2e_auth_bypass')?.value === '1'
  ) {
    return addSecurityHeaders(NextResponse.next());
  }

  const url = request.nextUrl;

  const { userId } = await auth();

  if (isAuthRoute(request) && userId) {
    const dest = url.searchParams.get('redirect_url') || '/studio';
    return addSecurityHeaders(NextResponse.redirect(new URL(dest, request.url)));
  }

  if (isProtectedRoute(request)) {
    if (!userId) {
      const signInUrl = new URL('/sign-in', request.url);
      signInUrl.searchParams.set('redirect_url', url.pathname + url.search);
      return addSecurityHeaders(NextResponse.redirect(signInUrl));
    }
    await auth.protect();
  }

  const isMuApi = url.pathname.startsWith('/api/workflow') ||
                  url.pathname.startsWith('/api/app') ||
                  url.pathname.startsWith('/api/v1');

  if (isMuApi) {
    const isHandledByRoute = url.pathname.startsWith('/api/v1/creative-agent') ||
                            url.pathname.startsWith('/api/v1/get_upload_url');

    if (url.pathname.startsWith('/api/v1') && !isHandledByRoute) {
      const targetUrl = new URL(url.pathname + url.search, 'https://api.muapi.ai');
      // Rewrite preserves the original request headers, which would leak the
      // app's session cookie (Clerk) and muapi_key to api.muapi.ai. Strip
      // cookies and forward only what MuAPI needs.
      const headers = new Headers(request.headers);
      headers.delete('cookie');
      const rewritten = new Request(targetUrl, {
        method: request.method,
        headers,
        body: request.body,
        redirect: 'follow',
      });
      return addSecurityHeaders(NextResponse.rewrite(rewritten));
    }
  }

  return addSecurityHeaders(NextResponse.next());
});

export const config = {
  matcher: [
    '/api/workflow/:path*',
    '/api/app/:path*',
    '/api/v1/:path*',
    '/((?!_next|.*\\..*).*)',
    '/__clerk/:path*',
  ],
};

