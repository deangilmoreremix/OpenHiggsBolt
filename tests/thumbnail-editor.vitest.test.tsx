// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import React from 'react';

const mocks = vi.hoisted(() => ({ refine: vi.fn() }));
vi.mock('@/shared/api/thumbnailService', () => ({ refineThumbnail: (...a: unknown[]) => mocks.refine(...a) }));
vi.mock('@/components/social-publishing/thumbnail/thumbnailMask', async (orig) => {
  const real = await orig<typeof import('@/components/social-publishing/thumbnail/thumbnailMask')>();
  return { ...real, strokesToMaskPng: () => 'data:image/png;base64,TUFTSw==', composeMarkup: () => 'data:image/png;base64,TUFSS1VQ' };
});

import ThumbnailEditor from '@/components/social-publishing/thumbnail/ThumbnailEditor';
import ThumbnailPlatformPreview from '@/components/social-publishing/thumbnail/ThumbnailPlatformPreview';

const SRC = 'data:image/png;base64,QUJD';
const NEW = 'data:image/png;base64,REVG';

function setup(props: Partial<React.ComponentProps<typeof ThumbnailEditor>> = {}) {
  const onApply = vi.fn();
  render(<ThumbnailEditor sourceImageUrl={SRC} model="gpt-image-2.6-sunburst" onApply={onApply} {...props} />);
  return { onApply };
}
const describeIt = (text: string) => fireEvent.change(screen.getByLabelText('Edit instruction'), { target: { value: text } });
const draw = () => {
  const layer = screen.getByTestId('thumbnail-draw-layer');
  (layer as any).getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 50, right: 100, bottom: 50 });
  fireEvent.pointerDown(layer, { clientX: 10, clientY: 10, pointerId: 1 });
  fireEvent.pointerMove(layer, { clientX: 30, clientY: 20, pointerId: 1 });
  fireEvent.pointerUp(layer, { pointerId: 1 });
};

beforeEach(() => { mocks.refine.mockReset(); });
afterEach(cleanup);

describe('ThumbnailEditor', () => {
  it('asks the user to pick a thumbnail first', () => {
    setup({ sourceImageUrl: null });
    expect(screen.getByText(/Generate or pick a thumbnail/)).toBeTruthy();
  });

  it('describe mode sends the instruction and the chosen model, then shows before/after', async () => {
    mocks.refine.mockResolvedValue([{ url: NEW, responseId: 'r1', model: 'gpt-image-2.6-sunburst' }]);
    const { onApply } = setup();
    const apply = screen.getByRole('button', { name: /Apply edit/ }) as HTMLButtonElement;
    expect(apply.disabled).toBe(true);
    describeIt('Make the title bigger');
    fireEvent.click(apply);
    await screen.findByTestId('thumbnail-edit-result');
    const args = mocks.refine.mock.calls[0][0];
    expect(args).toMatchObject({ imageUrl: SRC, prompt: 'Make the title bigger', model: 'gpt-image-2.6-sunburst', quality: 'medium' });
    expect(args.maskUrl).toBeUndefined();
    expect(screen.getByAltText('Edited thumbnail preview')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Before' }));
    expect(screen.getByAltText('Current thumbnail preview').getAttribute('src')).toBe(SRC);
    expect(onApply).not.toHaveBeenCalled(); // nothing changes until the user accepts
    fireEvent.click(screen.getByRole('button', { name: /Use this version/ }));
    expect(onApply).toHaveBeenCalledWith({ url: NEW, responseId: 'r1', revisedPrompt: undefined });
  });

  it('can discard a result and undo an accepted edit', async () => {
    mocks.refine.mockResolvedValue([{ url: NEW }]);
    const { onApply } = setup();
    describeIt('x');
    fireEvent.click(screen.getByRole('button', { name: /Apply edit/ }));
    await screen.findByTestId('thumbnail-edit-result');
    fireEvent.click(screen.getByRole('button', { name: /Discard/ }));
    expect(screen.queryByTestId('thumbnail-edit-result')).toBeNull();
    expect((screen.getByRole('button', { name: 'Undo last edit' }) as HTMLButtonElement).disabled).toBe(true);
    describeIt('y');
    fireEvent.click(screen.getByRole('button', { name: /Apply edit/ }));
    await screen.findByTestId('thumbnail-edit-result');
    fireEvent.click(screen.getByRole('button', { name: /Use this version/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Undo last edit' }));
    expect(onApply).toHaveBeenLastCalledWith({ url: SRC });
  });

  it('paint mode needs a painted area and sends a PNG mask', async () => {
    mocks.refine.mockResolvedValue([{ url: NEW }]);
    setup();
    fireEvent.click(screen.getByRole('tab', { name: 'Paint an area' }));
    describeIt('a city skyline');
    expect((screen.getByRole('button', { name: /Apply edit/ }) as HTMLButtonElement).disabled).toBe(true);
    draw();
    fireEvent.click(screen.getByRole('button', { name: /Apply edit/ }));
    await waitFor(() => expect(mocks.refine).toHaveBeenCalled());
    expect(mocks.refine.mock.calls[0][0].maskUrl).toBe('data:image/png;base64,TUFTSw==');
    expect(mocks.refine.mock.calls[0][0].imageUrl).toBe(SRC);
  });

  it('draw mode sends the marked-up image with the apply-and-remove instruction', async () => {
    mocks.refine.mockResolvedValue([{ url: NEW }]);
    setup();
    fireEvent.click(screen.getByRole('tab', { name: 'Draw on it' }));
    describeIt('move the logo here');
    draw();
    fireEvent.click(screen.getByRole('button', { name: /Apply edit/ }));
    await waitFor(() => expect(mocks.refine).toHaveBeenCalled());
    const args = mocks.refine.mock.calls[0][0];
    expect(args.imageUrl).toBe('data:image/png;base64,TUFSS1VQ');
    expect(args.prompt).toMatch(/remove all of the red markup/);
    expect(args.prompt).toMatch(/move the logo here/);
  });

  it('says so when Images 2.6 was not available and GPT Image 2 was used', async () => {
    mocks.refine.mockResolvedValue([{ url: NEW, model: 'gpt-image-2', fallbackFrom: 'gpt-image-2.6-sunburst' }]);
    setup();
    describeIt('x');
    fireEvent.click(screen.getByRole('button', { name: /Apply edit/ }));
    await screen.findByText(/GPT Image 2 made this edit/);
  });

  it('points to Settings when the OpenAI key is missing', async () => {
    mocks.refine.mockImplementation(async () => { throw new Error('Add your OpenAI API key in Settings to generate thumbnails.'); });
    setup();
    describeIt('x');
    fireEvent.click(screen.getByRole('button', { name: /Apply edit/ }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(/Add your OpenAI key in Settings, then try again/));
  });

  it('shows how the image crops on each platform', () => {
    render(<ThumbnailPlatformPreview imageUrl={SRC} />);
    for (const label of ['YouTube', 'Instagram 1:1', 'IG/FB 4:5', 'Reels / TikTok']) expect(screen.getByAltText(`${label} crop preview`)).toBeTruthy();
  });
});
