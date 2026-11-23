// @vitest-environment jsdom
import React, { act } from 'react';
import { describe, expect, it } from 'vitest';
import { createRoot } from 'react-dom/client';
import { Thumbnail } from '@remotion/player';
import { withDemoProps } from '../cards/demoProps';
import { DocumentTypewriterReveal } from '../demosrc/ui-entrance/document-typewriter-reveal/DocumentTypewriterReveal';
import { documentFromCapture } from '../lib/documentContent';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const Wrapped = withDemoProps(DocumentTypewriterReveal as React.ComponentType<Record<string, unknown>>, 'DocumentTypewriterReveal');

const show = async (props: Record<string, unknown>, frame: number) => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  await act(async () => { root.render(<Thumbnail component={Wrapped} compositionWidth={1920} compositionHeight={1080} frameToDisplay={frame} durationInFrames={150} fps={30} inputProps={props} />); });
  await act(async () => { await new Promise((r) => setTimeout(r, 50)); });
  const out = { text: host.textContent ?? '', imgs: Array.from(host.querySelectorAll('img')).map((i) => i.getAttribute('src') ?? '') };
  root.unmount();
  return out;
};

const doc = documentFromCapture({
  headline: 'Seaside Homes: beachfront living',
  description: 'Hand-picked beachfront homes on the Gulf coast. Every listing is walked by our own agents.',
  headings: ['Featured homes', 'Why Seaside', 'Neighbourhoods', 'Open houses', 'Contact us'],
  ctas: ['Book a tour', 'Get the buyer guide'], nav: ['Homes', 'About', 'Journal', 'Contact'],
}, 'Seaside Homes')!;

describe('DocumentTypewriterReveal', () => {
  it('types out the person\'s own document: their words are in the frame, no screenshot, none of the sample\'s words', async () => {
    const { text, imgs } = await show({ documentContent: doc }, 140);
    // Words are separate boxes (the renderer drops spaces inside the camera's zoom), so compare without the spaces.
    const flat = text.replace(/\s+/g, '');
    for (const w of ['Seaside Homes: beachfront living', 'Featured homes', 'Why Seaside', 'Book a tour', 'Homes']) expect(flat, w).toContain(w.replace(/\s+/g, ''));
    expect(imgs.filter((s) => /wbr-full/.test(s)), 'no screenshot of the sample document underneath').toEqual([]);
    for (const sample of ['MotionStudioWeekly', 'showreel', 'Week27']) expect(flat, sample).not.toContain(sample);
  });
  it('with no content it is exactly the sample recipe (its screenshot, its words)', async () => {
    const { text, imgs } = await show({}, 140);
    expect(imgs.some((s) => /wbr-full/.test(s))).toBe(true);
    expect(text).toContain('showreel');
    expect(text).toContain('Motion Studio Weekly');
  });
});
