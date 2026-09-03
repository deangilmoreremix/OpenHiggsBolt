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
    },
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
