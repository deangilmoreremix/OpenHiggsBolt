/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {
      resolveAlias: {
        '@': './src',
      },
    },
  },
  transpilePackages: ['studio', 'ai-agent', 'workflow-builder', 'design-agent'],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
