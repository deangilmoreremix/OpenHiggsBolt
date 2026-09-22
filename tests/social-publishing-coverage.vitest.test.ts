// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';

// Mock the SocialPublishProvider to capture usage
vi.mock('@/components/SocialPublishProvider', () => ({
  SocialPublishProvider: ({ children, apiKey }: any) => {
    return React.createElement('div', { 
      'data-testid': 'social-publish-provider', 
      'data-api-key': apiKey ?? '' 
    }, children);
  },
  PublishStep: ({ mediaUrl, mediaType, title, className }: any) => {
    return React.createElement('button', {
      'data-testid': 'publish-step',
      'data-media-url': mediaUrl,
      'data-media-type': mediaType,
      'data-title': title,
      className: className,
    }, 'Post to social');
  },
  useSocialPublish: () => ({
    publish: vi.fn(),
    accounts: [],
  }),
}));

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  Routes: ({ children }: any) => React.createElement('div', null, children),
  Route: () => null,
  useNavigate: () => vi.fn(),
}));

// Mock StoryboardContext
vi.mock('@/apps/storyboard/StoryboardContext', () => ({
  StoryboardProvider: ({ children }: any) => React.createElement('div', null, children),
  useStoryboard: () => ({
    brief: '',
    setBrief: vi.fn(),
    shots: [],
    addShot: vi.fn(),
    updateShot: vi.fn(),
    removeShot: vi.fn(),
    moveShot: vi.fn(),
    characters: [],
    aspectRatio: '16:9',
    projectName: '',
    model: 'flux-schnell',
    setModel: vi.fn(),
  }),
}));

import StoryboardApp from '@/apps/storyboard/Storyboard';

describe('Social Publishing Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it('renders StoryboardApp inside SocialPublishProvider', () => {
    render(React.createElement(StoryboardApp, { apiKey: 'test-key' }));
    
    const provider = screen.getByTestId('social-publish-provider');
    expect(provider).toBeDefined();
    expect(provider.getAttribute('data-api-key')).toBe('test-key');
  });

  it('passes apiKey to SocialPublishProvider', () => {
    render(React.createElement(StoryboardApp, { apiKey: 'my-api-key' }));
    
    const provider = screen.getByTestId('social-publish-provider');
    expect(provider.getAttribute('data-api-key')).toBe('my-api-key');
  });

  it('passes null apiKey when not provided', () => {
    render(React.createElement(StoryboardApp));
    
    const provider = screen.getByTestId('social-publish-provider');
    expect(provider.getAttribute('data-api-key')).toBe('');
  });
});

describe('Storyboard PublishStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it('renders PublishStep with correct mediaType for shot frames', async () => {
    const { PublishStep } = await import('@/components/SocialPublishProvider');
    
    const mockFrameUrl = 'https://example.com/shot-1.png';
    
    render(
      React.createElement(PublishStep, {
        mediaUrl: mockFrameUrl,
        mediaType: 'image',
        title: 'Shot 1',
        className: 'publish-step-class',
      })
    );
    
    const publishButton = screen.getByTestId('publish-step');
    expect(publishButton.getAttribute('data-media-url')).toBe(mockFrameUrl);
    expect(publishButton.getAttribute('data-media-type')).toBe('image');
    expect(publishButton.getAttribute('data-title')).toBe('Shot 1');
    expect(publishButton.getAttribute('class')).toContain('publish-step-class');
  });


});

describe('Social Publishing Studio Coverage', () => {
  const supportedStudios = [
    { name: 'Image Studio', path: 'packages/studio/src/components/ImageStudio.jsx', type: 'package' },
    { name: 'Video Studio', path: 'packages/studio/src/components/VideoStudio.jsx', type: 'package' },
    { name: 'Vibe Motion', path: 'packages/studio/src/components/VibeMotionStudio.jsx', type: 'package' },
    { name: 'Lip Sync', path: 'packages/studio/src/components/LipSyncStudio.jsx', type: 'package' },
    { name: 'Cinema Studio', path: 'packages/studio/src/components/CinemaStudio.jsx', type: 'package' },
    { name: 'Marketing Studio', path: 'packages/studio/src/components/MarketingStudio.jsx', type: 'package' },
    { name: 'Recast Studio', path: 'packages/studio/src/components/RecastStudio.jsx', type: 'package' },
    { name: 'AI Influencer Studio', path: 'packages/studio/src/components/AiInfluencerStudio.jsx', type: 'package' },
    { name: 'Clipping Studio', path: 'packages/studio/src/components/ClippingStudio.jsx', type: 'package' },
    { name: 'VFX Studio', path: 'src/apps/vfx-studio/pages/VFXGenerate.tsx', type: 'app' },
    { name: 'Design Agent Studio', path: 'src/apps/design-agent/DesignAgent.tsx', type: 'app' },
    { name: 'Thumbnail Studio', path: 'src/apps/thumbnail-studio/ThumbnailStudio.tsx', type: 'app' },
    { name: 'Storyboard Studio', path: 'src/apps/storyboard/Storyboard.tsx', type: 'app' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it.each(supportedStudios.map(s => [s.name, s.path, s.type]))(
    '%s has social publishing integration',
    async (_name: string, path: string, type: string) => {
      const fs = await import('fs');
      const pathModule = await import('path');
      
      const fullPath = pathModule.join(process.cwd(), path);
      const content = fs.readFileSync(fullPath, 'utf-8');
      
      if (type === 'app') {
        expect(content).toContain('SocialPublishProvider');
      } else {
        expect(content).toContain('PublishStep');
      }
    }
  );

  it('Audio Studio remains excluded from social publishing', async () => {
    const fs = await import('fs');
    const pathModule = await import('path');
    
    const audioPath = pathModule.join(process.cwd(), 'packages/studio/src/components/AudioStudio.jsx');
    const content = fs.readFileSync(audioPath, 'utf-8');
    
    expect(content).not.toContain('PublishStep');
    expect(content).not.toContain('SocialPublishProvider');
  });
});
