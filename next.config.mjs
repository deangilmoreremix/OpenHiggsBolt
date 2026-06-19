/** @type {import('next').NextConfig} */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const __dirname = new URL('.', import.meta.url).pathname;

const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };
    return config;
  },
  transpilePackages: ['studio', 'ai-agent', 'workflow-builder', 'design-agent'],
};

export default nextConfig;
