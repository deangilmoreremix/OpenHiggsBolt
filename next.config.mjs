import { fileURLToPath } from 'node:url'

/** @type {import('next').NextConfig} */

// Pin the app root to this config's own directory. Without it Next.js infers
// the workspace root from the first lockfile it finds and wrongly picks the
// parent monorepo (this worktree has its own pnpm-lock.yaml).
const rootDir = fileURLToPath(new URL('.', import.meta.url))

const nextConfig = {
  experimental: {
    cacheComponents: false,
  },
  turbopack: {
    root: rootDir,
    resolveAlias: {
      '@': ['./src', './'],
      '@/components': ['./components', './src/shared/components'],
      '@/components/*': ['./components/*', './src/shared/components/*'],
      '@/api': ['./src/shared/api'],
      '@/api/*': ['./src/shared/api/*'],
      '@/types': ['./src/types', './src/shared/types'],
      '@/types/*': ['./src/types/*', './src/shared/types/*'],
      '@/stores': ['./src/stores'],
      '@/stores/*': ['./src/stores/*'],
    },
  },
  transpilePackages: [
    'studio',
    'ai-agent',
    'workflow-builder',
    'design-agent',
    // Remotion ships untranspiled ESM; the Personalization Modal preview
    // (Player + composition) is imported by client components, so the
    // packages must go through the Next.js compiler.
    'remotion',
    '@remotion/player',
  ],
  serverExternalPackages: [
    'electron',
    'app-builder-bin',
    '@typescript-eslint',
    'figlet',
    '7zip-bin',
    'es-abstract',
    'playwright',
    'got-scraping',
    'get-stream',
    '@crawlee/cheerio',
  ],
  // Same root as turbopack.root: tracing must resolve against this worktree,
  // not the parent monorepo whose lockfile Next.js otherwise prefers.
  outputFileTracingRoot: rootDir,
  outputFileTracingExcludes: {
    '*': [
      'node_modules/playwright/**',
      'node_modules/@playwright/**',
      'node_modules/electron/**',
      'node_modules/electron-builder/**',
      'node_modules/app-builder-bin/**',
      'node_modules/7zip-bin/**',
      'node_modules/**/*.map',
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  allowedDevOrigins: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://192.168.1.103:3000',
    // Add any additional origins you use during development
    // e.g., 'http://localhost:3001', 'http://127.0.0.1:3001'
  ],
};

export default nextConfig;
