// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach, beforeAll } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import React from 'react';

vi.mock('@/components/social-publishing/thumbnail/designer/designerAssets', async (orig) => {
  const real = await orig<typeof import('@/components/social-publishing/thumbnail/designer/designerAssets')>();
  return { ...real, loadImage: (src: string) => (src.includes('BAD') ? Promise.reject(new Error('nope')) : Promise.resolve({ naturalWidth: 10, naturalHeight: 10, width: 10, height: 10 })) };
});
import ThumbnailPlatformPreview from '@/components/social-publishing/thumbnail/ThumbnailPlatformPreview';
import { createProject } from '@/components/social-publishing/thumbnail/designer/model';

beforeAll(() => {
  const ctx: any = new Proxy({}, { get(_t, key: string) { if (key === 'measureText') return (t: string) => ({ width: t.length * 10 }); if (key === 'createLinearGradient') return () => ({ addColorStop() {} }); return () => {}; }, set() { return true; } });
  (HTMLCanvasElement.prototype as any).getContext = () => ctx;
});
afterEach(cleanup);

describe('ThumbnailPlatformPreview load failures', () => {
  it('falls back to the exported picture when a picture of the design cannot load', async () => {
    const project = createProject(1280, 720, { mode: 'image', imageSrc: 'data:image/png;base64,BAD' });
    render(<ThumbnailPlatformPreview project={project} imageUrl="data:image/png;base64,RVhQ" />);
    await waitFor(() => expect(screen.getByAltText('YouTube crop preview')).toBeTruthy());
    expect(screen.queryAllByTestId('platform-preview-canvas')).toHaveLength(0);
  });

  it('keeps drawing the design when every picture loads', async () => {
    const project = createProject(1280, 720, { mode: 'image', imageSrc: 'data:image/png;base64,GOOD' });
    render(<ThumbnailPlatformPreview project={project} imageUrl="data:image/png;base64,RVhQ" />);
    await new Promise((r) => setTimeout(r, 10));
    expect(screen.getAllByTestId('platform-preview-canvas')).toHaveLength(4);
  });
});
