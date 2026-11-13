// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';

vi.mock('@/shared/api/thumbnailService', () => ({ generateThumbnail: vi.fn(), refineThumbnail: vi.fn() }));
vi.mock('@/shared/api/openai', () => ({ enhancePrompt: vi.fn() }));
// The designer itself is covered in thumbnail-designer-ui; here only how the step wires it.
vi.mock('@/components/social-publishing/thumbnail/designer/ThumbnailDesigner', () => ({
  default: (p: any) => (
    <div data-testid="designer-stub" data-bg={p.backgroundImageUrl} data-aspect={p.aspectRatio} data-saved={p.initialProject ? 'yes' : 'no'} data-adj={p.adjustments ? JSON.stringify(p.adjustments) : ''}>
      <button type="button" onClick={() => p.onDone({ dataUrl: 'data:image/png;base64,REVT', project: { version: 1, width: 1280, height: 720, background: { mode: 'image', imageSrc: p.backgroundImageUrl }, layers: [] } })}>finish</button>
      <button type="button" onClick={p.onCancel}>cancel</button>
    </div>
  ),
}));

import ThumbnailStep from '@/components/social-publishing/steps/ThumbnailStep';

const PIC = 'data:image/png;base64,QUJD';
const asset = { type: 'image' as const, url: PIC };
const copy = { master: '', platforms: {}, variants: [] };

function setup(thumbnail: any = {}) {
  const onUpdateThumbnail = vi.fn();
  render(<ThumbnailStep asset={asset} thumbnail={thumbnail} onUpdateThumbnail={onUpdateThumbnail} copy={copy} />);
  return { onUpdateThumbnail };
}
afterEach(cleanup);

describe('ThumbnailStep designer entry', () => {
  it('is disabled until there is a picture to design on', () => {
    setup({});
    expect((screen.getByRole('button', { name: /Design this thumbnail/ }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('opens the designer seeded with the chosen picture and the aspect ratio', () => {
    setup({ imageUrl: PIC, aspectRatio: '4:5' });
    fireEvent.click(screen.getByRole('button', { name: /Design this thumbnail/ }));
    const stub = screen.getByTestId('designer-stub');
    expect(stub.dataset.bg).toBe(PIC);
    expect(stub.dataset.aspect).toBe('4:5');
    expect(stub.dataset.saved).toBe('no');
  });

  it('the exported result becomes the post thumbnail and keeps the design', () => {
    const { onUpdateThumbnail } = setup({ imageUrl: PIC });
    fireEvent.click(screen.getByRole('button', { name: /Design this thumbnail/ }));
    fireEvent.click(screen.getByText('finish'));
    const call = onUpdateThumbnail.mock.calls.at(-1)![0];
    expect(call.imageUrl).toBe('data:image/png;base64,REVT');
    expect(call.design.layers).toEqual([]);
    expect(screen.queryByTestId('designer-stub')).toBeNull();
  });

  it('shows the designed thumbnail and re-opens the saved design', () => {
    const design = { version: 1, width: 1280, height: 720, background: { mode: 'solid' }, layers: [] };
    setup({ imageUrl: 'data:image/png;base64,REVT', design });
    expect(screen.getByAltText('Designed thumbnail')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Edit design/ }));
    expect(screen.getByTestId('designer-stub').dataset.saved).toBe('yes');
  });

  it('Remove design goes back to the concept picture', () => {
    const design = { version: 1, width: 1280, height: 720, background: { mode: 'image', imageSrc: PIC }, layers: [] };
    const { onUpdateThumbnail } = setup({ imageUrl: 'data:image/png;base64,REVT', design });
    fireEvent.click(screen.getByRole('button', { name: 'Remove design' }));
    expect(onUpdateThumbnail).toHaveBeenCalledWith({ imageUrl: PIC, design: undefined });
  });

  it('cancel closes the designer without changing the thumbnail', () => {
    const { onUpdateThumbnail } = setup({ imageUrl: PIC });
    fireEvent.click(screen.getByRole('button', { name: /Design this thumbnail/ }));
    fireEvent.click(screen.getByText('cancel'));
    expect(screen.queryByTestId('designer-stub')).toBeNull();
    expect(onUpdateThumbnail).not.toHaveBeenCalled();
  });

  it('passes the concept panel adjustments to the designer', () => {
    setup({ imageUrl: PIC });
    fireEvent.click(screen.getByRole('button', { name: /Design this thumbnail/ }));
    expect(JSON.parse(screen.getByTestId('designer-stub').dataset.adj!)).toMatchObject({ backgroundBlurPx: 0, contrast: 1.2 });
  });
});
