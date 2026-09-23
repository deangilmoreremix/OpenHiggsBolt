import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
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
      'vendor/VoiceStudio/frontend/src/*': ['./vendor/VoiceStudio/frontend/src/*'],
      // Map upstream internal aliases used by vendor/VoiceStudio/frontend/src.
      '@/lib/utils': ['./vendor/VoiceStudio/frontend/src/lib/utils.ts'],
      '@/components/ui/*': ['./vendor/VoiceStudio/frontend/src/components/ui/*'],
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'vendor/VoiceStudio/frontend/src/*': ['./vendor/VoiceStudio/frontend/src/*'],
      '@/components/ui/*': ['./vendor/VoiceStudio/frontend/src/components/ui/*'],
      '@/lib': ['./src/lib'],
      '@/lib/*': ['./src/lib/*'],
      '@/lib/utils': ['./vendor/VoiceStudio/frontend/src/lib/utils.ts'],
    };
    return config;
  },
  transpilePackages: ['studio', 'ai-agent', 'workflow-builder', 'design-agent'],
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
