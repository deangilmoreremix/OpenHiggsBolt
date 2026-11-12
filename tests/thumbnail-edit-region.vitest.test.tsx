// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, beforeAll, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react';
import React from 'react';

const mocks = vi.hoisted(() => ({ refine: vi.fn(), exportProject: vi.fn() }));
vi.mock('@/components/social-publishing/thumbnail/designer/exportImage', async (orig) => {
  const real = await orig<typeof import('@/components/social-publishing/thumbnail/designer/exportImage')>();
  return { ...real, exportProject: (...a: unknown[]) => mocks.exportProject(...a) };
});
vi.mock('@/shared/api/thumbnailService', () => ({ refineThumbnail: (...a: unknown[]) => mocks.refine(...a) }));
vi.mock('@/components/social-publishing/thumbnail/thumbnailMask', async (orig) => {
  const real = await orig<typeof import('@/components/social-publishing/thumbnail/thumbnailMask')>();
  return { ...real, strokesToMaskPng: (...a: unknown[]) => { (globalThis as any).__maskArgs = a; return 'data:image/png;base64,TUFTSw=='; }, composeMarkup: () => 'data:image/png;base64,TUFSS1VQ' };
});
vi.mock('@/components/social-publishing/thumbnail/designer/designerAssets', async (orig) => {
  const real = await orig<typeof import('@/components/social-publishing/thumbnail/designer/designerAssets')>();
  return { ...real, loadImage: async () => ({ naturalWidth: 400, naturalHeight: 200, width: 400, height: 200 }) };
});

import EditRegionPanel from '@/components/social-publishing/thumbnail/designer/EditRegionPanel';
import ThumbnailDesigner from '@/components/social-publishing/thumbnail/designer/ThumbnailDesigner';
import ThumbnailPlatformPreview from '@/components/social-publishing/thumbnail/ThumbnailPlatformPreview';
import { createProject, addLayer, makeTextLayer } from '@/components/social-publishing/thumbnail/designer/model';

const SRC = 'data:image/png;base64,QUJD';
const NEW = 'data:image/png;base64,REVG';

beforeAll(() => {
  const ctx: any = new Proxy({}, {
    get(_t, key: string) {
      if (key === 'measureText') return (t: string) => ({ width: t.length * 10 });
      if (key === 'createLinearGradient') return () => ({ addColorStop() {} });
      return () => {};
    },
    set() { return true; },
  });
  (HTMLCanvasElement.prototype as any).getContext = () => ctx;
});

function setup(props: Partial<React.ComponentProps<typeof EditRegionPanel>> = {}) {
  const onAccept = vi.fn();
  const utils = render(<EditRegionPanel sourceUrl={SRC} boxWidth={1280} boxHeight={720} model="gpt-image-2.6-sunburst" onAccept={onAccept} {...props} />);
  return { onAccept, ...utils };
}
const describeIt = (text: string) => fireEvent.change(screen.getByLabelText('Edit instruction'), { target: { value: text } });
const draw = () => {
  const layer = screen.getByTestId('thumbnail-draw-layer');
  (layer as any).getBoundingClientRect = () => ({ left: 0, top: 0, width: 640, height: 360, right: 640, bottom: 360 });
  fireEvent.pointerDown(layer, { clientX: 10, clientY: 10, pointerId: 1 });
  fireEvent.pointerMove(layer, { clientX: 30, clientY: 20, pointerId: 1 });
  fireEvent.pointerUp(layer, { pointerId: 1 });
};
const loadCurrent = (w = 1280, h = 720) => {
  const img = screen.getByAltText('Current background preview');
  Object.defineProperty(img, 'naturalWidth', { value: w, configurable: true });
  Object.defineProperty(img, 'naturalHeight', { value: h, configurable: true });
  fireEvent.load(img);
};
const applyBtn = () => screen.getByRole('button', { name: /Apply edit/ }) as HTMLButtonElement;

beforeEach(() => {
  mocks.exportProject.mockReset();
  mocks.exportProject.mockImplementation(async (_p: unknown, _a: unknown, opts: { format: string }) => ({ blob: new Blob(['x'], { type: opts.format }), type: opts.format, width: 1280, height: 720, dataUrl: `data:${opts.format};base64,eA==`, scaledDown: false }));
  mocks.refine.mockReset(); (globalThis as any).__maskArgs = undefined; });
afterEach(cleanup);

describe('EditRegionPanel', () => {
  it('describe mode sends the instruction and the chosen model, then shows before/after; nothing changes until accepted', async () => {
    mocks.refine.mockResolvedValue([{ url: NEW, responseId: 'r1', model: 'gpt-image-2.6-sunburst' }]);
    const { onAccept } = setup();
    expect(applyBtn().disabled).toBe(true);
    describeIt('Make the sky darker');
    fireEvent.click(applyBtn());
    await screen.findByTestId('thumbnail-edit-result');
    const args = mocks.refine.mock.calls[0][0];
    expect(args).toMatchObject({ imageUrl: SRC, prompt: 'Make the sky darker', model: 'gpt-image-2.6-sunburst', quality: 'medium' });
    expect(args.maskUrl).toBeUndefined();
    expect(screen.getByAltText('Edited background preview')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Before' }));
    expect(screen.getByAltText('Current background preview').getAttribute('src')).toBe(SRC);
    expect(onAccept).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /Use this version/ }));
    expect(onAccept).toHaveBeenCalledWith({ url: NEW, responseId: 'r1', revisedPrompt: undefined });
  });

  it('can discard a result', async () => {
    mocks.refine.mockResolvedValue([{ url: NEW }]);
    const { onAccept } = setup();
    describeIt('x');
    fireEvent.click(applyBtn());
    await screen.findByTestId('thumbnail-edit-result');
    fireEvent.click(screen.getByRole('button', { name: /Discard/ }));
    expect(screen.queryByTestId('thumbnail-edit-result')).toBeNull();
    expect(onAccept).not.toHaveBeenCalled();
  });

  it('paint mode needs a painted area and sends a PNG mask of the picture size', async () => {
    mocks.refine.mockResolvedValue([{ url: NEW }]);
    setup();
    fireEvent.click(screen.getByRole('tab', { name: 'Paint an area' }));
    describeIt('a city skyline');
    expect(applyBtn().disabled).toBe(true);
    loadCurrent();
    draw();
    fireEvent.click(applyBtn());
    await waitFor(() => expect(mocks.refine).toHaveBeenCalled());
    expect(mocks.refine.mock.calls[0][0].maskUrl).toBe('data:image/png;base64,TUFTSw==');
    expect(mocks.refine.mock.calls[0][0].imageUrl).toBe(SRC);
    const [w, h, strokes] = (globalThis as any).__maskArgs;
    expect([w, h]).toEqual([1280, 720]); // jsdom reports no natural size, so the box size is used
    expect(strokes).toHaveLength(1);
  });

  it('ignores drawing until the current picture has loaded (its size is unknown before that)', () => {
    setup();
    fireEvent.click(screen.getByRole('tab', { name: 'Paint an area' }));
    describeIt('x');
    draw();
    expect(applyBtn().disabled).toBe(true);
    loadCurrent();
    draw();
    expect(applyBtn().disabled).toBe(false);
  });

  it('maps the pointer through the cover crop into the picture pixels', async () => {
    setup();
    const img = screen.getByAltText('Current background preview') as HTMLImageElement;
    // A 2560 x 720 picture shown in a 1280 x 720 box: scale 1, 640px cropped off each side.
    Object.defineProperty(img, 'naturalWidth', { value: 2560 });
    Object.defineProperty(img, 'naturalHeight', { value: 720 });
    fireEvent.load(img);
    fireEvent.click(screen.getByRole('tab', { name: 'Paint an area' }));
    describeIt('x');
    draw(); // pointer at (10, 10) on a 640x360 element = box (20, 20) = picture (660, 20)
    mocks.refine.mockResolvedValue([{ url: NEW }]);
    fireEvent.click(applyBtn());
    await waitFor(() => expect(mocks.refine).toHaveBeenCalled());
    const [w, h, strokes] = (globalThis as any).__maskArgs;
    expect([w, h]).toEqual([2560, 720]);
    expect(strokes[0].points[0]).toEqual({ x: 660, y: 20 });
  });

  it('draw mode sends the marked-up image with the apply-and-remove instruction; the note is optional', async () => {
    mocks.refine.mockResolvedValue([{ url: NEW }]);
    setup();
    fireEvent.click(screen.getByRole('tab', { name: 'Draw on it' }));
    expect(applyBtn().disabled).toBe(true);
    loadCurrent();
    draw();
    expect(applyBtn().disabled).toBe(false);
    describeIt('move the logo here');
    fireEvent.click(applyBtn());
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
    fireEvent.click(applyBtn());
    await screen.findByText(/GPT Image 2 made this edit/);
  });

  it('points to Settings when the OpenAI key is missing', async () => {
    mocks.refine.mockImplementation(async () => { throw new Error('Add your OpenAI API key in Settings to generate thumbnails.'); });
    setup();
    describeIt('x');
    fireEvent.click(applyBtn());
    await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(/Add your OpenAI key in Settings, then try again/));
  });

  it('drops an edit result that finishes after the background changed', async () => {
    let resolve!: (v: unknown) => void;
    mocks.refine.mockImplementation(() => new Promise((r) => { resolve = r; }));
    const onAccept = vi.fn();
    const { rerender } = render(<EditRegionPanel sourceUrl={SRC} boxWidth={1280} boxHeight={720} onAccept={onAccept} />);
    describeIt('x');
    fireEvent.click(applyBtn());
    rerender(<EditRegionPanel sourceUrl="data:image/png;base64,Qg==" boxWidth={1280} boxHeight={720} onAccept={onAccept} />);
    resolve([{ url: NEW }]);
    await new Promise((r) => setTimeout(r, 20));
    expect(screen.queryByTestId('thumbnail-edit-result')).toBeNull();
    expect(applyBtn().disabled).toBe(false); // not stuck busy (the instruction is kept)
  });
});

describe('Edit a region inside the designer', () => {
  const BG = 'data:image/png;base64,QUJD';
  const layerDump = (el: HTMLElement) => el.textContent;

  async function openDesigner(project?: any) {
    const done = vi.fn();
    render(<ThumbnailDesigner initialProject={project} backgroundImageUrl={BG} aspectRatio="16:9" headline="BIG NEWS" model="gpt-image-2" onDone={done} />);
    fireEvent.click(screen.getByRole('button', { name: /Edit a region/ }));
    return { done };
  }
  const rowNames = () => screen.queryAllByTestId('layer-row').map((r) => r.querySelector('button')!.textContent);

  it('accepting swaps only the background through history: layers stay identical and Undo restores the old picture', async () => {
    mocks.refine.mockResolvedValue([{ url: NEW }]);
    const { done } = await openDesigner();
    describeIt('darker sky');
    fireEvent.click(applyBtn());
    await screen.findByTestId('thumbnail-edit-result');
    fireEvent.click(screen.getByRole('button', { name: /Use this version/ }));
    await screen.findByText(/layers were not touched/);
    // the panel now edits the new background
    expect(screen.getByAltText('Current background preview').getAttribute('src')).toBe(NEW);
    fireEvent.click(screen.getByRole('button', { name: /Back to the design/ }));
    expect(rowNames()).toEqual(['Headline']);
    fireEvent.click(screen.getByRole('button', { name: /Use this thumbnail/ }));
    await waitFor(() => expect(done).toHaveBeenCalled());
    const after = done.mock.calls.at(-1)![0].project;
    expect(after.background.imageSrc).toBe(NEW);
    expect(after.layers).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    fireEvent.click(screen.getByRole('button', { name: /Use this thumbnail/ }));
    await waitFor(() => expect(done).toHaveBeenCalledTimes(2));
    const undone = done.mock.calls.at(-1)![0].project;
    expect(undone.background.imageSrc).toBe(BG);
    expect(undone.layers).toEqual(after.layers); // exactly the same layers before and after
  });

  it('Save as variant stores the current background and the strip switches between versions', async () => {
    const { done } = await openDesigner();
    fireEvent.click(screen.getByRole('button', { name: /Back to the design/ }));
    fireEvent.click(screen.getByRole('tab', { name: 'Background' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save as variant' }));
    expect((screen.getByRole('button', { name: 'Save as variant' }) as HTMLButtonElement).disabled).toBe(true); // already saved
    expect(within(screen.getByRole('list', { name: 'Saved background versions' })).getAllByRole('listitem')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: /Use this thumbnail/ }));
    await waitFor(() => expect(done).toHaveBeenCalled());
    expect(done.mock.calls.at(-1)![0].project.variants).toEqual([BG]);
    void layerDump;
  });

  it('is unavailable without a picture background', () => {
    const p = addLayer(createProject(1280, 720), makeTextLayer(createProject(1280, 720), 'headline', 'X'));
    render(<ThumbnailDesigner initialProject={p} onDone={vi.fn()} />);
    expect((screen.getByRole('button', { name: /Edit a region/ }) as HTMLButtonElement).disabled).toBe(true);
  });
});

describe('ThumbnailPlatformPreview', () => {
  it('shows how the image crops on each platform', () => {
    render(<ThumbnailPlatformPreview imageUrl={SRC} />);
    for (const label of ['YouTube', 'Instagram 1:1', 'IG/FB 4:5', 'Reels / TikTok']) expect(screen.getByAltText(`${label} crop preview`)).toBeTruthy();
  });

  it('marks the YouTube duration badge, the Reels caption strip, the safe area and a phone frame; they can be turned off', () => {
    render(<ThumbnailPlatformPreview imageUrl={SRC} />);
    expect(screen.getByTestId('duration-badge').textContent).toBe('12:34');
    expect(screen.getAllByTestId('safe-area')).toHaveLength(4);
    expect(screen.getAllByTestId('covered-zone').length).toBe(3); // 1 on YouTube, 2 on Reels
    expect(screen.getByTestId('phone-frame')).toBeTruthy();
    fireEvent.click(screen.getByRole('checkbox'));
    expect(screen.queryAllByTestId('safe-area')).toHaveLength(0);
    expect(screen.queryAllByTestId('covered-zone')).toHaveLength(0);
  });

  it('draws the layered project (not only the flat picture) when given one', async () => {
    const project = addLayer(createProject(1280, 720, { mode: 'image', imageSrc: SRC }), makeTextLayer(createProject(1280, 720), 'headline', 'HI'));
    render(<ThumbnailPlatformPreview project={project} imageUrl={SRC} />);
    expect(screen.getAllByTestId('platform-preview-canvas')).toHaveLength(4);
    expect(screen.queryByAltText('YouTube crop preview')).toBeNull();
  });
});

describe('Edit a region: natural size survives accepting a previewed edit', () => {
  const sized = (img: HTMLElement, w: number, h: number) => {
    Object.defineProperty(img, 'naturalWidth', { value: w, configurable: true });
    Object.defineProperty(img, 'naturalHeight', { value: h, configurable: true });
    fireEvent.load(img);
  };

  it('uses the edited picture’s real size for the next mask even though no second load fires', async () => {
    mocks.refine.mockResolvedValue([{ url: NEW }]);
    const onAccept = vi.fn();
    const { rerender } = render(<EditRegionPanel sourceUrl={SRC} boxWidth={1280} boxHeight={720} model="gpt-image-2.6-sunburst" onAccept={onAccept} />);
    sized(screen.getByAltText('Current background preview'), 1000, 720);
    describeIt('darker sky');
    fireEvent.click(applyBtn());
    await screen.findByTestId('thumbnail-edit-result');
    sized(screen.getByAltText('Edited background preview'), 1000, 720); // the After preview loads
    fireEvent.click(screen.getByRole('button', { name: /Use this version/ }));
    // the parent adopts the new picture; the <img> already shows it, so the browser fires no new load
    rerender(<EditRegionPanel sourceUrl={NEW} boxWidth={1280} boxHeight={720} model="gpt-image-2.6-sunburst" onAccept={onAccept} />);
    fireEvent.click(screen.getByRole('tab', { name: /Paint an area/ }));
    draw();
    describeIt('a skyline');
    fireEvent.click(applyBtn());
    await waitFor(() => expect((globalThis as any).__maskArgs).toBeDefined());
    expect((globalThis as any).__maskArgs.slice(0, 2)).toEqual([1000, 720]);
  });

  it('after discarding a loaded preview, drawing waits until the original has loaded again', async () => {
    mocks.refine.mockResolvedValue([{ url: NEW }]);
    setup();
    sized(screen.getByAltText('Current background preview'), 1000, 720);
    describeIt('darker sky');
    fireEvent.click(applyBtn());
    await screen.findByTestId('thumbnail-edit-result');
    sized(screen.getByAltText('Edited background preview'), 1000, 720);
    fireEvent.click(screen.getByRole('button', { name: /Discard/ }));
    fireEvent.click(screen.getByRole('tab', { name: /Draw on it/ }));
    draw();
    describeIt('move the text here');
    // the <img> is switching back to the original but has not reloaded: markup must not read it
    expect(applyBtn().disabled).toBe(true);
    sized(screen.getByAltText('Current background preview'), 1000, 720);
    draw();
    expect(applyBtn().disabled).toBe(false);
  });
});
