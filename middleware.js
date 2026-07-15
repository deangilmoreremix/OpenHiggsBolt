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

export default clerkMiddleware(async (auth, request) => {
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

  return NextResponse.next();
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
