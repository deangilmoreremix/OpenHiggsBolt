/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    resolveAlias: {
      '@': './src',
    },
  },
  transpilePackages: ['studio', 'ai-agent', 'workflow-builder', 'design-agent'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    // Clerk-hosted assets are served from the instance domain (clerk.go.smartvid.app),
    // a different origin than the app, so they must be allow-listed here. Without
    // this the Netlify Essential Next.js plugin's default CSP blocks Clerk's JS/CSS
    // and API calls, leaving the /sign-in, /sign-up and password-reset pages blank.
    const clerkDomain = 'https://clerk.go.smartvid.app';
    const clerkInstanceDomain = 'https://touched-stud-74.clerk.accounts.dev';

    // Hardening (VIDEO_STUDIO_AUDIT §8 rec 7): drop 'unsafe-eval' from script-src in
    // production. Next.js dev tooling (React Refresh / webpack HMR) executes eval, so
    // we keep it ONLY outside production to avoid breaking `next dev`. 'unsafe-inline'
    // is intentionally retained: Next.js App Router inlines the RSC flight payload as
    // a <script> and Clerk injects inline bootstrap scripts, so removing it would break
    // client-side hydration. A nonce/hash migration is required to drop it (see report).
    const devEval = process.env.NODE_ENV !== 'production' ? " 'unsafe-eval'" : '';

    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${devEval} ${clerkDomain} ${clerkInstanceDomain} https://*.clerk.accounts.dev https://cdn.muapi.ai`,
      `style-src 'self' 'unsafe-inline' ${clerkDomain} https://fonts.googleapis.com`,
      "img-src 'self' data: blob: https:",
      "media-src 'self' data: blob: https:",
      `connect-src 'self' ${clerkDomain} ${clerkInstanceDomain} https://api.clerk.com https://muapi.ai https://*.muapi.ai https://*.supabase.co`,
      `font-src 'self' data: ${clerkDomain} https://fonts.gstatic.com`,
    ].join('; ');

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
