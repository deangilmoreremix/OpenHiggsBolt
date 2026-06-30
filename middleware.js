import { NextResponse } from 'next/server';

/**
 * Next.js middleware — request rewriting for the Muapi.ai proxy.
 *
 * This middleware intercepts three top-level API surfaces and rewrites
 * matching requests to https://api.muapi.ai so the browser sees a same-origin
 * path (and so server-side route handlers can attach auth, cookies, etc.).
 *
 * Path scope (in resolution order):
 *   1. /api/workflow/*  — workflow runner proxy
 *   2. /api/app/*       — embedded "apps" proxy
 *   3. /api/v1/*        — general Muapi.ai v1 proxy
 *
 * Exclusion list (handled by dedicated route files in app/api/, NOT rewritten):
 *   - /api/v1/creative-agent     (custom streaming + tool-call handling)
 *   - /api/v1/get_upload_url     (returns presigned S3 URLs)
 *   - /api/v1/upload-binary      (binary streaming proxy to S3)
 *
 * Anything else under /api/v1/* is rewritten to https://api.muapi.ai<path>.
 */

export function middleware(request) {
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

// Match the paths we want to proxy
export const config = {
    matcher: [
        '/api/workflow/:path*', 
        '/api/app/:path*',
        '/api/v1/:path*'
    ],
};
