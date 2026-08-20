import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isProtectedRoute = createRouteMatcher([
  '/studio(.*)',
  '/vfx(.*)',
  '/api/vfx(.*)',
  '/api/v1/protected(.*)',
]);

const isAuthRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/forgot-password(.*)',
]);

// Complete CSP delivered at runtime. We intentionally set this in middleware
// (not next.config.mjs headers()) because Next.js 15 augments/normalizes CSP
// defined via headers(), which stripped Clerk's cross-origin style/font/connect
// origins and dropped frame-src — leaving /sign-in, /sign-up and the password-reset
// pages blank. Middleware-set response headers are not rewritten by Next.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.go.smartvid.app https://*.clerk.accounts.dev",
  "style-src 'self' 'unsafe-inline' https://clerk.go.smartvid.app https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "media-src 'self' data: blob: https:",
  "connect-src 'self' https://clerk.go.smartvid.app https://*.clerk.accounts.dev https://api.clerk.com https://muapi.ai https://*.muapi.ai https://*.supabase.co",
  "font-src 'self' data: https://clerk.go.smartvid.app https://fonts.gstatic.com",
  "worker-src 'self' blob:",
  "frame-src 'self' https://clerk.go.smartvid.app https://*.clerk.accounts.dev https://challenges.cloudflare.com",
].join('; ');

export default clerkMiddleware(async (auth, request) => {
  // Dev-only E2E auth bypass. When the `__e2e_auth_bypass` cookie is present and
  // we are NOT in production, skip Clerk auth so the Playwright suite can run
  // fully offline (no live Clerk session). Never active in production.
  if (
    process.env.NODE_ENV !== 'production' &&
    request.cookies.get('__e2e_auth_bypass')?.value === '1'
  ) {
    return NextResponse.next()
  }

  const url = request.nextUrl;

  const { userId } = await auth();

  if (isAuthRoute(request) && userId) {
    const dest = url.searchParams.get('redirect_url') || '/studio';
    return NextResponse.redirect(new URL(dest, request.url));
  }

  if (isProtectedRoute(request)) {
    if (!userId) {
      const signInUrl = new URL('/sign-in', request.url);
      signInUrl.searchParams.set('redirect_url', url.pathname + url.search);
      return NextResponse.redirect(signInUrl);
    }
    await auth.protect();
  }

  const isMuApi = url.pathname.startsWith('/api/workflow') ||
                  url.pathname.startsWith('/api/app') ||
                  url.pathname.startsWith('/api/v1');

  if (isMuApi) {
    const isHandledByRoute = url.pathname.startsWith('/api/v1/creative-agent') ||
                             url.pathname.startsWith('/api/v1/get_upload_url') ||
                             url.pathname.startsWith('/api/v1/upload-binary');

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
      return NextResponse.rewrite(rewritten);
    }
  }

  const response = NextResponse.next();
  response.headers.set('Content-Security-Policy', CSP);
  return response;
});

export const config = {
  matcher: [
    '/api/workflow/:path*',
    '/api/app/:path*',
    '/api/vfx/:path*',
    '/api/v1/:path*',
    '/((?!_next|.*\\..*).*)',
    '/__clerk/:path*',
  ],
};
