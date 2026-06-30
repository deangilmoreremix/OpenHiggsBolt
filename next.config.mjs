/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {
      resolveAlias: {
        '@': './src',
      },
    },
  },
  transpilePackages: [
    'studio',
    'ai-agent',
    'workflow-builder',
    'design-agent',
    'src/apps/design-agent/DesignAgent.tsx',
    'src/apps/videco/Videco.tsx',
    'src/apps/vfx-studio/VFXStudio.tsx',
    'src/apps/storyboard/Storyboard.tsx',
    'src/apps/scene-planner/ScenePlanner.tsx',
    'src/apps/thumbnail-studio/ThumbnailStudio.tsx',
    'src/apps/script-writer/ScriptWriter.tsx',
    'src/apps/presentation/Presentation.tsx',
    'src/apps/content-planner/ContentPlanner.tsx',
    'src/apps/music-studio/MusicStudio.tsx',
    'src/apps/cinema/Cinema.tsx',
    'src/apps/video-studio/VideoStudio.tsx',
  ],
};

export default nextConfig;
