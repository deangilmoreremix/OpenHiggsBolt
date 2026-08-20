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
    // Dev instances may also use *.clerk.accounts.dev subdomains for the JS bundle.
    const clerkDomain = 'https://clerk.go.smartvid.app';
    const clerkAccountsDev = 'https://*.clerk.accounts.dev';
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${clerkDomain} ${clerkAccountsDev}`,
      `style-src 'self' 'unsafe-inline' ${clerkDomain} ${clerkAccountsDev} https://fonts.googleapis.com`,
      "img-src 'self' data: blob: https:",
      "media-src 'self' data: blob: https:",
      `connect-src 'self' ${clerkDomain} ${clerkAccountsDev} https://api.clerk.com https://muapi.ai https://*.muapi.ai https://*.supabase.co`,
      `font-src 'self' data: ${clerkDomain} ${clerkAccountsDev} https://fonts.gstatic.com`,
      `worker-src 'self' blob:`,
      `frame-src 'self' ${clerkDomain} ${clerkAccountsDev} https://challenges.cloudflare.com`,
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
