// @vitest-environment jsdom
import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import ClippingStudio from './ClippingStudio.jsx';
import CinemaStudio from './CinemaStudio.jsx';
import { scopedPersistKey } from '../persistKey.js';

// The studio components expect a global i18n `t` from the app shell.
beforeAll(() => {
  if (!globalThis.t) globalThis.t = (k) => k;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
});

const flush = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });

const TRIGGER_ID = 'personalize-trigger';

/**
 * The app root owns the real Personalization Modal wiring and injects it as
 * the `renderPersonalizeAction` render prop. These tests stand in for it: the
 * renderer records the options it was handed and renders a marker button.
 */
let capturedOptions = null;
function renderPersonalizeAction(options) {
  capturedOptions = options;
  return (
    <button type="button" id={TRIGGER_ID}>
      Personalize
    </button>
  );
}

function mount(element) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(element);
  });
  return { container, root };
}

let roots = [];

beforeEach(() => {
  capturedOptions = null;
  localStorage.clear();
});

afterEach(() => {
  for (const { container, root } of roots) {
    act(() => root.unmount());
    container.remove();
  }
  roots = [];
  localStorage.clear();
});

describe('studio → Personalization Modal hand-off', () => {
  it('ClippingStudio renders no trigger and calls no renderer without a source video', async () => {
    const { container, root } = mount(
      <ClippingStudio apiKey="fake-key" renderPersonalizeAction={renderPersonalizeAction} />,
    );
    roots.push({ container, root });
    await flush();

    expect(container.querySelector(`#${TRIGGER_ID}`)).toBeNull();
    expect(capturedOptions).toBeNull();
  });

  it('ClippingStudio hands the uploaded source video to the renderer', async () => {
    localStorage.setItem(
      'hg_clipping_studio_persistent',
      JSON.stringify({
        videoUrl: 'https://cdn.example.test/source-clip.mp4',
        numHighlights: 3,
        aspectRatio: '9:16',
      }),
    );

    const { container, root } = mount(
      <ClippingStudio apiKey="fake-key" renderPersonalizeAction={renderPersonalizeAction} />,
    );
    roots.push({ container, root });
    await flush();

    expect(container.querySelector(`#${TRIGGER_ID}`)).not.toBeNull();
    expect(capturedOptions).not.toBeNull();
    expect(capturedOptions.originStudio).toBe('clipping');
    expect(capturedOptions.media.mediaType).toBe('video');
    expect(capturedOptions.media.url).toBe('https://cdn.example.test/source-clip.mp4');
    expect(capturedOptions.media.aspectRatio).toBe('9:16');
    expect(typeof capturedOptions.studioProjectId).toBe('string');
    expect(capturedOptions.studioProjectId.length).toBeGreaterThan(0);
  });

  it('CinemaStudio renders no trigger and calls no renderer without a source image', async () => {
    const { container, root } = mount(
      <CinemaStudio apiKey="fake-key" renderPersonalizeAction={renderPersonalizeAction} />,
    );
    roots.push({ container, root });
    await flush();

    expect(container.querySelector(`#${TRIGGER_ID}`)).toBeNull();
    expect(capturedOptions).toBeNull();
  });

  it('CinemaStudio hands the uploaded reference image to the renderer', async () => {
    const key = scopedPersistKey('hg_cinema_studio_persistent', 'fake-key');
    localStorage.setItem(
      key,
      JSON.stringify({ uploadedImage: 'https://cdn.example.test/reference.png' }),
    );

    const { container, root } = mount(
      <CinemaStudio apiKey="fake-key" renderPersonalizeAction={renderPersonalizeAction} />,
    );
    roots.push({ container, root });
    await flush();

    expect(container.querySelector(`#${TRIGGER_ID}`)).not.toBeNull();
    expect(capturedOptions).not.toBeNull();
    expect(capturedOptions.originStudio).toBe('cinema');
    expect(capturedOptions.media.mediaType).toBe('image');
    expect(capturedOptions.media.url).toBe('https://cdn.example.test/reference.png');
    expect(typeof capturedOptions.studioProjectId).toBe('string');
    expect(capturedOptions.studioProjectId.length).toBeGreaterThan(0);
  });
});
