// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react';
import React from 'react';

const mocks = vi.hoisted(() => ({ exportProject: vi.fn(), cutOut: vi.fn() }));

vi.mock('@/components/social-publishing/thumbnail/designer/exportImage', async (orig) => {
  const real = await orig<typeof import('@/components/social-publishing/thumbnail/designer/exportImage')>();
  return { ...real, exportProject: (...a: unknown[]) => mocks.exportProject(...a) };
});
vi.mock('@/components/social-publishing/thumbnail/designer/designerAssets', async (orig) => {
  const real = await orig<typeof import('@/components/social-publishing/thumbnail/designer/designerAssets')>();
  const fakeImage = { naturalWidth: 400, naturalHeight: 200, width: 400, height: 200 };
  return { ...real, loadImage: async () => fakeImage, cutOutSubject: (...a: unknown[]) => mocks.cutOut(...a) };
});

import ThumbnailDesigner, { type DesignerResult } from '@/components/social-publishing/thumbnail/designer/ThumbnailDesigner';
import { createProject } from '@/components/social-publishing/thumbnail/designer/model';
import type { TextLayer, ShapeLayer, ImageLayer } from '@/components/social-publishing/thumbnail/designer/model';

beforeAll(() => {
  const ctx: any = new Proxy({}, {
    get(_t, key: string) {
      if (key === 'measureText') return (t: string) => ({ width: t.length * 10 });
      if (key === 'createLinearGradient') return () => ({ addColorStop() {} });
      return () => {};
    },
    set() { return true },
  });
  (HTMLCanvasElement.prototype as any).getContext = () => ctx;
});

const BG = 'data:image/png;base64,QUJD';
let done: ReturnType<typeof vi.fn>;

function setup(props: Partial<React.ComponentProps<typeof ThumbnailDesigner>> = {}) {
  done = vi.fn();
  const utils = render(<ThumbnailDesigner backgroundImageUrl={BG} aspectRatio="16:9" onDone={done} {...props} />);
  const stage = screen.getByTestId('designer-stage');
  // 1280 x 720 canvas shown at 640 x 360: one screen pixel is two canvas pixels.
  (stage as any).getBoundingClientRect = () => ({ left: 0, top: 0, width: 640, height: 360, right: 640, bottom: 360, x: 0, y: 0 });
  return { ...utils, stage };
}

const add = (name: RegExp | string) => fireEvent.click(within(screen.getByRole('toolbar', { name: 'Add to thumbnail' })).getByRole('button', { name }));
const rows = () => screen.queryAllByTestId('layer-row').map((r) => r.querySelector('button')!.textContent);
async function exportNow() {
  fireEvent.click(screen.getByRole('button', { name: /Use this thumbnail/ }));
  await waitFor(() => expect(done).toHaveBeenCalled());
  return done.mock.calls[done.mock.calls.length - 1][0] as DesignerResult;
}
const layerOf = <T,>(r: DesignerResult, name: string) => r.project.layers.find((l) => l.name === name) as unknown as T;

beforeEach(() => {
  mocks.exportProject.mockReset();
  mocks.cutOut.mockReset();
  mocks.exportProject.mockImplementation(async (_p: unknown, _a: unknown, opts: { format: string }) => ({ blob: new Blob(['x'], { type: opts.format }), type: opts.format, width: 1280, height: 720, dataUrl: `data:${opts.format};base64,eA==`, scaledDown: false }));
});
afterEach(cleanup);

describe('ThumbnailDesigner layers', () => {
  it('adds headline, subtitle and shapes, selects the new layer and shows its inspector', () => {
    setup();
    expect(screen.getByText(/No layers yet/)).toBeTruthy();
    add('Headline');
    add('Arrow');
    expect(rows()).toEqual(['Arrow', 'Headline']); // top-most first
    expect(screen.getByRole('button', { name: 'Select Arrow' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByTestId('designer-inspector').textContent).toMatch(/Edit shape/);
    fireEvent.click(screen.getByRole('button', { name: 'Select Headline' }));
    expect(screen.getByTestId('designer-inspector').textContent).toMatch(/Edit text/);
    expect((screen.getByLabelText('Layer name') as HTMLInputElement).value).toBe('Headline');
  });

  it('seeds a headline layer from the post copy', () => {
    setup({ headline: 'Big news' });
    expect(rows()).toEqual(['Headline']);
    fireEvent.click(screen.getByRole('button', { name: 'Select Headline' }));
    expect((screen.getByDisplayValue('Big news') as HTMLTextAreaElement).tagName).toBe('TEXTAREA');
  });

  it('reorders layers with forward / backward', () => {
    setup();
    add('Headline');
    add('Arrow');
    fireEvent.click(screen.getByRole('button', { name: 'Send Arrow backward' }));
    expect(rows()).toEqual(['Headline', 'Arrow']);
    fireEvent.click(screen.getByRole('button', { name: 'Bring Arrow forward' }));
    expect(rows()).toEqual(['Arrow', 'Headline']);
    expect((screen.getByRole('button', { name: 'Bring Arrow forward' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('locks and hides a layer: handles go away and the toggles reflect the state', () => {
    setup();
    add('Headline');
    expect(screen.getByTestId('designer-handles')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Lock Headline' }));
    expect(screen.getByRole('button', { name: 'Unlock Headline' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.queryByTestId('designer-handles')).toBeNull();
    expect(screen.getByText(/layer is locked/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Unlock Headline' }));
    expect(screen.getByTestId('designer-handles')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Hide Headline' }));
    expect(screen.getByRole('button', { name: 'Show Headline' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.queryByTestId('designer-handles')).toBeNull();
  });

  it('a locked layer cannot be dragged or picked on the canvas', () => {
    const { stage } = setup();
    add('Headline');
    fireEvent.click(screen.getByRole('button', { name: 'Lock Headline' }));
    fireEvent.pointerDown(stage, { clientX: 100, clientY: 210, pointerId: 1 });
    fireEvent.pointerMove(stage, { clientX: 200, clientY: 250, pointerId: 1 });
    fireEvent.pointerUp(stage, { pointerId: 1 });
    expect(screen.queryByTestId('designer-handles')).toBeNull(); // click on a locked layer deselects
  });

  it('duplicates and deletes layers, and Delete on the canvas removes the selection', () => {
    const { stage } = setup();
    add('Headline');
    fireEvent.click(screen.getByRole('button', { name: 'Duplicate Headline' }));
    expect(rows()).toEqual(['Headline copy', 'Headline']);
    fireEvent.keyDown(stage, { key: 'Delete' });
    expect(rows()).toEqual(['Headline']);
    fireEvent.click(screen.getByRole('button', { name: 'Delete Headline' }));
    expect(rows()).toEqual([]);
  });

  it('undo and redo step through changes', () => {
    setup();
    add('Headline');
    add('Arrow');
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(rows()).toEqual(['Headline']);
    fireEvent.click(screen.getByRole('button', { name: 'Redo' }));
    expect(rows()).toEqual(['Arrow', 'Headline']);
  });
});

describe('ThumbnailDesigner canvas gestures', () => {
  const leftPct = () => parseFloat(screen.getByTestId('designer-handles').style.left);
  const widthPct = () => parseFloat(screen.getByTestId('designer-handles').style.width);

  it('arrow keys nudge the selected layer (Shift moves 10)', () => {
    const { stage } = setup();
    add('Headline');
    const before = leftPct();
    fireEvent.keyDown(stage, { key: 'ArrowRight' });
    expect(leftPct()).toBeCloseTo(before + 100 / 1280, 3);
    fireEvent.keyDown(stage, { key: 'ArrowRight', shiftKey: true });
    expect(leftPct()).toBeCloseTo(before + (100 * 11) / 1280, 3);
  });

  it('dragging a layer moves it by the pointer distance', () => {
    const { stage } = setup();
    add('Headline'); // x 64, y 396 on the 1280 x 720 canvas
    const before = leftPct();
    fireEvent.pointerDown(stage, { clientX: 100, clientY: 210, pointerId: 1 }); // canvas (200, 420)
    fireEvent.pointerMove(stage, { clientX: 150, clientY: 210, pointerId: 1 }); // +100 canvas px
    fireEvent.pointerUp(stage, { pointerId: 1 });
    expect(leftPct()).toBeCloseTo(before + (100 / 1280) * 100, 1);
  });

  it('dragging a handle resizes, and the rotate knob turns the layer', () => {
    const { stage } = setup();
    add('Headline'); // w 768
    const w0 = widthPct();
    fireEvent.pointerDown(screen.getByLabelText('Resize e'), { clientX: 416, clientY: 250, pointerId: 1 });
    fireEvent.pointerMove(stage, { clientX: 466, clientY: 250, pointerId: 1 }); // +100 canvas px
    fireEvent.pointerUp(stage, { pointerId: 1 });
    expect(widthPct()).toBeCloseTo(w0 + (100 / 1280) * 100, 1);

    fireEvent.pointerDown(screen.getByLabelText('Rotate layer'), { clientX: 200, clientY: 100, pointerId: 2 });
    fireEvent.pointerMove(stage, { clientX: 600, clientY: 250, pointerId: 2 }); // to the right of the centre: about 90 degrees
    fireEvent.pointerUp(stage, { pointerId: 2 });
    const turn = /rotate\((-?[\d.]+)deg\)/.exec(screen.getByTestId('designer-handles').style.transform);
    expect(Number(turn?.[1])).toBeGreaterThan(60);
  });

  it('clicking empty canvas clears the selection', () => {
    const { stage } = setup();
    add('Headline');
    fireEvent.pointerDown(stage, { clientX: 10, clientY: 10, pointerId: 1 });
    fireEvent.pointerUp(stage, { pointerId: 1 });
    expect(screen.queryByTestId('designer-handles')).toBeNull();
    expect(screen.queryByTestId('designer-inspector')).toBeNull();
  });
});

describe('ThumbnailDesigner inspector, background and checks', () => {
  it('edits text properties', async () => {
    setup();
    add('Headline');
    fireEvent.change(screen.getByDisplayValue('YOUR HEADLINE'), { target: { value: 'Free tool' } });
    fireEvent.change(screen.getByLabelText('Size'), { target: { value: '80' } });
    fireEvent.change(screen.getByLabelText('Colour'), { target: { value: '#ff0000' } });
    fireEvent.change(screen.getByLabelText('Font'), { target: { value: 'Georgia, serif' } });
    fireEvent.click(screen.getByRole('button', { name: 'Centre' }));
    fireEvent.change(screen.getByLabelText('Outline width'), { target: { value: '9' } });
    fireEvent.click(screen.getByLabelText('Drop shadow'));
    fireEvent.click(screen.getByLabelText('Filled box'));
    fireEvent.change(screen.getByLabelText('Box colour'), { target: { value: '#112233' } });
    fireEvent.change(screen.getByLabelText('Words to highlight'), { target: { value: 'free, ' } });
    fireEvent.change(screen.getByLabelText('Highlight colour'), { target: { value: '#00ff00' } });
    const t = layerOf<TextLayer>(await exportNow(), 'Headline');
    expect(t).toMatchObject({ text: 'Free tool', fontSize: 80, color: '#ff0000', fontFamily: 'Georgia, serif', align: 'center', strokeWidth: 9 });
    expect(t.shadow).toBeNull(); // the headline preset has a shadow; the checkbox turned it off
    expect(t.box?.color).toBe('#112233');
    expect(t.highlight).toEqual({ words: ['free'], color: '#00ff00' });
  });

  it('edits shape and image properties', async () => {
    setup();
    add('Badge');
    fireEvent.change(screen.getByLabelText('Badge label'), { target: { value: 'SALE' } });
    fireEvent.change(screen.getByLabelText('Fill colour'), { target: { value: '#00aa00' } });
    fireEvent.change(screen.getByLabelText('Opacity'), { target: { value: '50' } });
    fireEvent.change(screen.getByLabelText('Rotation'), { target: { value: '-10' } });
    fireEvent.change(screen.getByLabelText('Upload photo'), { target: { files: [new File(['x'], 'p.png', { type: 'image/png' })] } });
    await screen.findByRole('button', { name: 'Select Photo' });
    fireEvent.change(screen.getByLabelText('Outline'), { target: { value: 'glow' } });
    fireEvent.click(screen.getByRole('button', { name: 'Fill' }));
    const r = await exportNow();
    expect(layerOf<ShapeLayer>(r, 'Badge')).toMatchObject({ label: 'SALE', fill: '#00aa00', opacity: 0.5, rotation: -10 });
    expect(layerOf<ImageLayer>(r, 'Photo')).toMatchObject({ outline: 'glow', fit: 'cover' });
  });

  it('background controls: type, colour, and adjustments', async () => {
    setup();
    fireEvent.click(screen.getByRole('tab', { name: 'Background' }));
    fireEvent.click(screen.getByRole('button', { name: 'Solid' }));
    fireEvent.change(screen.getByLabelText('Background colour'), { target: { value: '#123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Gradient' }));
    fireEvent.change(screen.getByLabelText('Gradient to'), { target: { value: '#abcdef' } });
    fireEvent.change(screen.getByLabelText('Blur'), { target: { value: '12' } });
    fireEvent.change(screen.getByLabelText('Brightness'), { target: { value: '120' } });
    fireEvent.change(screen.getByLabelText('Contrast'), { target: { value: '90' } });
    fireEvent.change(screen.getByLabelText('Saturation'), { target: { value: '140' } });
    const bg = (await exportNow()).project.background;
    expect(bg).toMatchObject({ mode: 'gradient', color: '#123456', to: '#abcdef', blur: 12, brightness: 120, contrast: 90, saturation: 140, imageSrc: BG });
  });

  it('applies the concept panel adjustments to the background and offers the planned colour', async () => {
    setup({ adjustments: { backgroundColor: '#336699', backgroundBlurPx: 6, contrast: 1.2, saturation: 0.8 } });
    fireEvent.click(screen.getByRole('tab', { name: 'Background' }));
    fireEvent.click(screen.getByRole('button', { name: /Use the planned colour/ }));
    const bg = (await exportNow()).project.background;
    expect(bg).toMatchObject({ mode: 'solid', color: '#336699', blur: 6, contrast: 120, saturation: 80 });
  });

  it('checks panel shows the warning and clicking it opens the layer', () => {
    setup();
    add('Headline');
    fireEvent.click(screen.getByRole('tab', { name: /Checks/ }));
    fireEvent.click(screen.getByText(/close to the edge/));
    expect(screen.getByRole('tab', { name: 'Layers' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByTestId('designer-inspector')).toBeTruthy();
  });

  it('shows a phone-size preview', () => {
    setup();
    expect(screen.getByTestId('designer-phone-preview')).toBeTruthy();
  });
});

describe('ThumbnailDesigner cut out and export', () => {
  it('cuts out the subject of an image layer through the image-edit helper', async () => {
    mocks.cutOut.mockResolvedValue('data:image/png;base64,Q1VU');
    setup();
    fireEvent.change(screen.getByLabelText('Upload subject'), { target: { files: [new File(['x'], 's.jpg', { type: 'image/jpeg' })] } });
    await screen.findByRole('button', { name: 'Select Subject' });
    await waitFor(() => expect(screen.getByRole('button', { name: /Cut out subject/ })).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: /Cut out subject/ }));
    await waitFor(() => expect(mocks.cutOut).toHaveBeenCalledTimes(1));
    await waitFor(() => expect((screen.getByLabelText('Outline') as HTMLSelectElement).value).toBe('white'));
    const l = layerOf<ImageLayer>(await exportNow(), 'Subject');
    expect(l.src).toBe('data:image/png;base64,Q1VU');
    expect(l.role).toBe('subject');
  });

  it('shows a message when the cut-out fails and keeps the layer', async () => {
    mocks.cutOut.mockRejectedValue(new Error('Add your OpenAI key'));
    setup();
    fireEvent.change(screen.getByLabelText('Upload logo'), { target: { files: [new File(['x'], 'l.png', { type: 'image/png' })] } });
    await screen.findByRole('button', { name: 'Select Logo' });
    await waitFor(() => expect(screen.getByRole('button', { name: /Cut out subject/ })).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: /Cut out subject/ }));
    expect((await screen.findByRole('alert')).textContent).toMatch(/Add your OpenAI key/);
    expect(rows()).toEqual(['Logo']);
  });

  it('rejects a non-image upload', async () => {
    setup();
    fireEvent.change(screen.getByLabelText('Upload logo'), { target: { files: [new File(['x'], 'l.txt', { type: 'text/plain' })] } });
    expect((await screen.findByRole('alert')).textContent).toMatch(/PNG, JPEG or WebP/);
    expect(rows()).toEqual([]);
  });

  it('exports with the 2 MB target and hands a file and data URL to onDone', async () => {
    setup();
    add('Headline');
    fireEvent.click(screen.getByRole('radio', { name: 'JPEG' }));
    const r = await exportNow();
    const [project, , opts] = mocks.exportProject.mock.calls[0];
    expect(opts).toEqual({ format: 'image/jpeg', maxBytes: 2 * 1024 * 1024 });
    expect(project.layers).toHaveLength(1);
    expect(r.file).toBeInstanceOf(File);
    expect(r.file.name).toMatch(/\.jpg$/);
    expect(r.file.type).toBe('image/jpeg');
    expect(r.dataUrl).toMatch(/^data:image\/jpeg/);
    expect(r.project.width).toBe(1280);
    expect((await screen.findByRole('status')).textContent).toMatch(/1280 × 720, JPEG/);
  });

  it('reports an export failure instead of calling onDone', async () => {
    mocks.exportProject.mockRejectedValue(new Error('The thumbnail could not be made small enough.'));
    setup();
    fireEvent.click(screen.getByRole('button', { name: /Use this thumbnail/ }));
    expect((await screen.findByRole('alert')).textContent).toMatch(/small enough/);
    expect(done).not.toHaveBeenCalled();
  });

  it('continues a saved design instead of starting a new one', () => {
    const p = createProject(1080, 1080);
    setup({ initialProject: p, backgroundImageUrl: BG });
    expect(screen.getByText('1080 × 1080')).toBeTruthy();
  });

  it('Back calls onCancel', () => {
    const onCancel = vi.fn();
    setup({ onCancel });
    fireEvent.click(screen.getByRole('button', { name: /Back/ }));
    expect(onCancel).toHaveBeenCalled();
  });
});
