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
};

export default nextConfig;
