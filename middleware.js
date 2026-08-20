import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Clerk is optional. If keys are missing or misconfigured we must NOT take down
// the public landing page and studios — fall back to the simple MuAPI proxy.
const isClerkEnabled = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
);

function muApiProxy(request) {
  const url = request.nextUrl;

  // Catch requests to /api/workflow, /api/app, and /api/v1
  const isMuApi = url.pathname.startsWith('/api/workflow') ||
                  url.pathname.startsWith('/api/app') ||
                  url.pathname.startsWith('/api/v1');

  if (isMuApi) {
    // Exclude paths that have their own dedicated route handlers with custom logic
    const isHandledByRoute = url.pathname.startsWith('/api/v1/creative-agent') ||
                            url.pathname.startsWith('/api/v1/get_upload_url') ||
                            url.pathname.startsWith('/api/v1/upload-binary');

    if (url.pathname.startsWith('/api/v1') && !isHandledByRoute) {
      const targetUrl = new URL(url.pathname + url.search, 'https://api.muapi.ai');
      return NextResponse.rewrite(targetUrl);
    }
  }

  return NextResponse.next();
}

export default isClerkEnabled
  ? clerkMiddleware((auth, request) => muApiProxy(request))
  : function middleware(request) {
      return muApiProxy(request);
    };

// Match the paths we want to proxy, plus all app routes for Clerk.
// NOTE: `config.matcher` must be statically analyzable by Next.js at build time,
// so it cannot be a runtime conditional. We use a single static matcher that
// covers both modes; the per-mode logic lives in the middleware body above
// (Clerk vs. plain MuAPI proxy), and non-proxied paths are a harmless no-op.
export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
