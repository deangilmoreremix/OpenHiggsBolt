// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, beforeAll, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import React from 'react';

const mocks = vi.hoisted(() => ({ exportProject: vi.fn(), release: null as null | (() => void) }));
vi.mock('@/components/social-publishing/thumbnail/designer/exportImage', async (orig) => {
  const real = await orig<typeof import('@/components/social-publishing/thumbnail/designer/exportImage')>();
  return { ...real, exportProject: (...a: unknown[]) => mocks.exportProject(...a) };
});
vi.mock('@/components/social-publishing/thumbnail/designer/designerAssets', async (orig) => {
  const real = await orig<typeof import('@/components/social-publishing/thumbnail/designer/designerAssets')>();
  return {
    ...real,
    loadImage: (src: string) => {
      if (src.includes('BAD')) return Promise.reject(new Error('Could not load that picture.'));
      if (src.includes('SLOW')) return new Promise((res) => { mocks.release = () => res({ naturalWidth: 400, naturalHeight: 200, width: 400, height: 200 }); });
      return Promise.resolve({ naturalWidth: 400, naturalHeight: 200, width: 400, height: 200 });
    },
  };
});

import ThumbnailDesigner from '@/components/social-publishing/thumbnail/designer/ThumbnailDesigner';

beforeAll(() => {
  const ctx: any = new Proxy({}, { get(_t, key: string) { if (key === 'measureText') return (t: string) => ({ width: t.length * 10 }); if (key === 'createLinearGradient') return () => ({ addColorStop() {} }); return () => {}; }, set() { return true; } });
  (HTMLCanvasElement.prototype as any).getContext = () => ctx;
});
beforeEach(() => {
  mocks.release = null;
  mocks.exportProject.mockReset();
  mocks.exportProject.mockResolvedValue({ blob: new Blob(['x'], { type: 'image/png' }), type: 'image/png', width: 1280, height: 720, dataUrl: 'data:image/png;base64,eA==', scaledDown: false });
});
afterEach(cleanup);

const exportBtn = () => screen.getByRole('button', { name: /Use this thumbnail/ });

describe('export waits for the pictures it needs', () => {
  it('does not export while the background is still loading, then exports once it is ready', async () => {
    const onDone = vi.fn();
    render(<ThumbnailDesigner backgroundImageUrl="data:image/png;base64,SLOW" aspectRatio="16:9" onDone={onDone} />);
    fireEvent.click(exportBtn());
    await screen.findByText(/Wait for the pictures to finish loading/);
    expect(mocks.exportProject).not.toHaveBeenCalled();
    expect(onDone).not.toHaveBeenCalled();
    mocks.release!();
    await waitFor(() => expect(mocks.release).not.toBeNull());
    await new Promise((r) => setTimeout(r, 0));
    fireEvent.click(exportBtn());
    await waitFor(() => expect(onDone).toHaveBeenCalled());
  });

  it('refuses to export when a picture failed to load', async () => {
    const onDone = vi.fn();
    render(<ThumbnailDesigner backgroundImageUrl="data:image/png;base64,BAD" aspectRatio="16:9" onDone={onDone} />);
    await new Promise((r) => setTimeout(r, 20)); // the load rejects
    fireEvent.click(exportBtn());
    await screen.findByText(/failed to load/);
    expect(mocks.exportProject).not.toHaveBeenCalled();
    expect(onDone).not.toHaveBeenCalled();
  });
});
