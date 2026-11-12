// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import React from 'react';

const mocks = vi.hoisted(() => ({ generate: vi.fn() }));
vi.mock('@/shared/api/thumbnailService', () => ({ generateThumbnail: (...a: unknown[]) => mocks.generate(...a) }));

import ThumbnailConceptPanel from '@/components/social-publishing/thumbnail/ThumbnailConceptPanel';

const FRAME = 'data:image/png;base64,RlJBTUU=';

function setup(props: Partial<React.ComponentProps<typeof ThumbnailConceptPanel>> = {}) {
  const onResults = vi.fn();
  const onGeneratingChange = vi.fn();
  render(<ThumbnailConceptPanel assetType="video" onResults={onResults} onGeneratingChange={onGeneratingChange} {...props} />);
  fireEvent.change(screen.getByLabelText('Video title'), { target: { value: 'I tried 5 mics' } });
  return { onResults, onGeneratingChange };
}
const preview = () => screen.getByTestId('concept-prompt-preview').textContent ?? '';
const generateButton = (name: RegExp) => screen.getByRole('button', { name }) as HTMLButtonElement;

beforeEach(() => {
  mocks.generate.mockReset();
  mocks.generate.mockImplementation(async (p: { prompt: string }) => [{ url: `https://cdn.example/${encodeURIComponent(p.prompt.slice(0, 12))}.png`, model: 'gpt-image-2.6-flare' }]);
});
afterEach(cleanup);

describe('ThumbnailConceptPanel', () => {
  it('presets change the prompt', () => {
    setup();
    const before = preview();
    fireEvent.click(screen.getByRole('radio', { name: /Product hero/ }));
    const after = preview();
    expect(after).not.toBe(before);
    expect(after).toContain('Concept: product hero');
    fireEvent.click(screen.getByRole('radio', { name: /Before \/ after/ }));
    expect(preview()).toContain('Concept: before and after');
  });

  it('subject controls change the prompt', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: /Subject/ }));
    fireEvent.change(screen.getByLabelText('Placement'), { target: { value: 'right' } });
    expect(preview()).toContain('placed on the right of the frame');
  });

  it('sends the chosen model, quality, complexity and size', async () => {
    const { onResults } = setup();
    fireEvent.change(screen.getByLabelText('Model'), { target: { value: 'detail' } });
    fireEvent.change(screen.getByLabelText('Render detail'), { target: { value: 'xhigh' } });
    fireEvent.change(screen.getByLabelText('Composition complexity'), { target: { value: 'high' } });
    fireEvent.click(screen.getByRole('radio', { name: '2' }));
    fireEvent.click(generateButton(/Generate 2 concepts/));
    await waitFor(() => expect(onResults).toHaveBeenCalled());
    expect(mocks.generate).toHaveBeenCalledTimes(1);
    expect(mocks.generate.mock.calls[0][0]).toMatchObject({ model: 'gpt-image-2.6-sunburst', quality: 'xhigh', complexity: 'high', size: '1536x864', aspectRatio: '16:9', n: 2 });
    expect(onResults.mock.calls[0][1]).toEqual({ aspectRatio: '16:9', size: '1536x864' });
  });

  it('3 distinct concepts makes three requests with different prompts', async () => {
    const { onResults, onGeneratingChange } = setup();
    fireEvent.click(screen.getByRole('radio', { name: '3 distinct concepts' }));
    fireEvent.click(generateButton(/Generate 3 distinct concepts/));
    await waitFor(() => expect(onResults).toHaveBeenCalled());
    expect(mocks.generate).toHaveBeenCalledTimes(3);
    const prompts = mocks.generate.mock.calls.map((c) => c[0].prompt as string);
    expect(new Set(prompts).size).toBe(3);
    mocks.generate.mock.calls.forEach((c) => expect(c[0].n).toBe(1));
    expect(onResults.mock.calls[0][0]).toHaveLength(3);
    expect(onGeneratingChange).toHaveBeenCalledWith(3);
    expect(onGeneratingChange).toHaveBeenLastCalledWith(0);
  });

  it('a custom size that breaks the rules shows an error and blocks generation', () => {
    setup();
    fireEvent.change(screen.getByLabelText('Size'), { target: { value: 'custom' } });
    fireEvent.change(screen.getByLabelText('Custom width'), { target: { value: '1281' } });
    expect(screen.getByTestId('concept-panel-error').textContent).toMatch(/multiples of 16/);
    expect(generateButton(/Generate 1 concept/).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Custom width'), { target: { value: '1280' } });
    expect(screen.queryByTestId('concept-panel-error')).toBeNull();
    expect(generateButton(/Generate 1 concept/).disabled).toBe(false);
  });

  it('use original photo sends the source as a reference with the person role', async () => {
    const { onResults } = setup({ frameUrl: FRAME });
    fireEvent.click(screen.getByRole('button', { name: /Subject/ }));
    fireEvent.click(screen.getByLabelText('Use original photo'));
    expect(preview()).toContain('Reference image 1 (video frame) - Use this person exactly');
    fireEvent.click(generateButton(/Generate 1 concept/));
    await waitFor(() => expect(onResults).toHaveBeenCalled());
    expect(mocks.generate.mock.calls[0][0].referenceUrls).toEqual([FRAME]);
  });

  it('use original photo without any photo shows an error', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: /Subject/ }));
    fireEvent.click(screen.getByLabelText('Use original photo'));
    expect(screen.getByTestId('concept-panel-error').textContent).toMatch(/photo/);
    expect(generateButton(/Generate 1 concept/).disabled).toBe(true);
  });

  it('reports a failed generation through onError and shows it', async () => {
    mocks.generate.mockRejectedValue(new Error('OpenAI API key missing'));
    const onError = vi.fn();
    setup({ onError });
    fireEvent.click(generateButton(/Generate 1 concept/));
    await waitFor(() => expect(onError).toHaveBeenCalledWith('OpenAI API key missing'));
    expect(screen.getByTestId('concept-panel-error').textContent).toContain('OpenAI API key missing');
  });

  const addPhotos = async (n: number) => {
    if (!document.querySelector('input[type=file][aria-label="Add reference image"]')) fireEvent.click(screen.getByRole('button', { name: /Reference images/ }));
    const input = document.querySelector('input[type=file][aria-label="Add reference image"]') as HTMLInputElement;
    const files = Array.from({ length: n }, (_, i) => new File([`img${i}`], `p${i}.png`, { type: 'image/png' }));
    fireEvent.change(input, { target: { files } });
  };

  it('never labels more references than the route will use (source image plus 3 extras)', async () => {
    const { onResults } = setup({ frameUrl: FRAME });
    await addPhotos(4);
    await waitFor(() => expect(preview()).toContain('Reference image 4'));
    expect(preview()).not.toContain('Reference image 5');
    fireEvent.click(generateButton(/Generate 1 concept/));
    await waitFor(() => expect(onResults).toHaveBeenCalled());
    expect(mocks.generate.mock.calls[0][0].referenceUrls).toHaveLength(4);
  });

  it('stores no more extras than can be sent, also when the extras came before the source image', async () => {
    const onResults = vi.fn();
    const view = render(<ThumbnailConceptPanel assetType="video" onResults={onResults} onGeneratingChange={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Video title'), { target: { value: 'T' } });
    await addPhotos(4);
    await waitFor(() => expect(preview()).toContain('Reference image 4'));
    view.rerender(<ThumbnailConceptPanel assetType="video" frameUrl={FRAME} onResults={onResults} onGeneratingChange={vi.fn()} />);
    await waitFor(() => expect(preview()).toContain('Reference image 4'));
    expect(preview()).not.toContain('Reference image 5');
    expect(document.querySelectorAll('select[aria-label^="Role for reference"]').length).toBeLessThanOrEqual(3);
  });

  it('use original photo needs a photo with the matching role, not just any reference', async () => {
    setup();
    await addPhotos(1); // a style reference only
    fireEvent.click(screen.getByRole('button', { name: /Subject/ }));
    fireEvent.click(screen.getByLabelText('Use original photo'));
    await waitFor(() => expect(screen.getByTestId('concept-panel-error').textContent).toMatch(/person photo/));
    expect(generateButton(/Generate 1 concept/).disabled).toBe(true);
  });

  it('says exact colours are applied in the designer', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: /Background and style/ }));
    fireEvent.change(screen.getByLabelText('Background type'), { target: { value: 'solid' } });
    expect(document.body.textContent).toMatch(/applied in the thumbnail designer/);
    expect(document.body.textContent).toMatch(/Solid or Gradient background/);
    expect(document.body.textContent).not.toMatch(/not applied yet/);
    expect(document.body.textContent).not.toMatch(/Exact colour is applied in the canvas/);
  });
});
