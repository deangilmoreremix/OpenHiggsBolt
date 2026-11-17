export const brand = {
  name: 'SmartVideo GO',
  slug: 'smartvideo-go',
  prefix: 'smartvideo',
  version: '0.1.0',
  envVar: 'SMARTVIDEO_GO_API_KEY',
  gatewayEnvVar: 'SMARTVIDEO_GO_API_URL',
  gatewayUrl: 'https://go.smartvid.app/api/mcp-gateway',
};

// Bundled snapshot ids whose backend route differs (live route check).
export const endpointFixes = {
  'ai-image-upscaler': 'ai-image-upscale',
  'bytedance-seedream-5.0-pro-edit': 'seedream-5.0-pro-edit',
  'bytedance-seedream-5.0-pro': 'seedream-5.0-pro',
};
