// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';

vi.mock('@/shared/api/thumbnailService', () => ({ generateThumbnail: vi.fn(), refineThumbnail: vi.fn() }));
vi.mock('@/shared/api/openai', () => ({ enhancePrompt: vi.fn() }));
vi.mock('@/components/social-publishing/thumbnail/designer/ThumbnailDesigner', () => ({
  default: (p: any) => <div data-testid="designer-stub" data-bg={p.backgroundImageUrl} data-aspect={p.aspectRatio} />,
}));
vi.mock('@/components/social-publishing/thumbnail/ThumbnailRefinement', () => ({
  default: (p: any) => <div data-testid="refine-stub" data-src={p.sourceImageUrl ?? ''} />,
}));
vi.mock('@/components/social-publishing/thumbnail/ThumbnailConceptPanel', () => ({
  default: (p: any) => <button type="button" onClick={() => p.onResults([{ url: 'data:image/png;base64,UE9SVA==' }], { aspectRatio: '9:16' })}>make portrait concept</button>,
}));

import ThumbnailStep from '@/components/social-publishing/steps/ThumbnailStep';

const PIC = 'data:image/png;base64,QUJD';
const DESIGNED = 'data:image/png;base64,REVT';
const copy = { master: '', platforms: {}, variants: [] };
function setup(thumbnail: any = {}) {
  const onUpdateThumbnail = vi.fn();
  render(<ThumbnailStep asset={{ type: 'image', url: PIC }} thumbnail={thumbnail} onUpdateThumbnail={onUpdateThumbnail} copy={copy} />);
  return { onUpdateThumbnail };
}
afterEach(cleanup);

describe('ThumbnailStep wiring', () => {
  it('refines the exported design, not the original picture, once a design is saved', () => {
    const design = { version: 1, width: 1280, height: 720, background: { mode: 'image', imageSrc: PIC }, layers: [] };
    const onUpdateThumbnail = vi.fn();
    const ui = (thumbnail: any) => <ThumbnailStep asset={{ type: 'image', url: PIC }} thumbnail={thumbnail} onUpdateThumbnail={onUpdateThumbnail} copy={copy} />;
    const { rerender } = render(ui({ imageUrl: PIC }));
    fireEvent.click(screen.getByText('make portrait concept')); // a generated result is now selected
    rerender(ui({ imageUrl: DESIGNED, design })); // the designer saved a design over it
    expect(screen.getByTestId('refine-stub').dataset.src).toBe(DESIGNED);
  });

  it('Remove design restores the original picture even when the saved background is solid', () => {
    const design = { version: 1, width: 1280, height: 720, background: { mode: 'solid', imageSrc: PIC }, layers: [] };
    const { onUpdateThumbnail } = setup({ imageUrl: DESIGNED, design });
    fireEvent.click(screen.getByRole('button', { name: 'Remove design' }));
    expect(onUpdateThumbnail).toHaveBeenCalledWith({ imageUrl: PIC, design: undefined });
  });

  it('Edit a region is only available when the saved background is a picture', () => {
    const solid = { version: 1, width: 1280, height: 720, background: { mode: 'solid', imageSrc: PIC }, layers: [] };
    setup({ imageUrl: DESIGNED, design: solid });
    expect((screen.getByRole('button', { name: /Edit a region/ }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: /Edit design/ }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('opens the designer on the concept’s aspect ratio even before the parent echoes it back', () => {
    setup({ imageUrl: PIC, aspectRatio: '16:9' });
    fireEvent.click(screen.getByText('make portrait concept'));
    fireEvent.click(screen.getByRole('button', { name: /Design this thumbnail/ }));
    expect(screen.getByTestId('designer-stub').dataset.aspect).toBe('9:16');
  });
});
