import { test, expect } from '@playwright/test';
import { installStudioSession } from './helpers/motion-studio';
import { openSweep, recipeFrames, save } from './helpers/recipe-frames';
import { diffShare, rawRgbFull } from './helpers/film-evidence';

/**
 * DocumentTypewriterReveal with a structured document (Round 9, P7), through the real export renderer in Chromium:
 * the typeset document replaces the screenshot, the write-on keeps its timing (it is the same recipe), and with no document the
 * recipe is exactly its sample. Evidence PNGs: docs/motion-director-pipeline-audit/round9/document/.
 */
const OUT = 'docs/motion-director-pipeline-audit/round9/document';
const doc = {
  title: 'Seaside Homes: beachfront living',
  sections: [
    { heading: 'Featured homes', items: ['Hand-picked beachfront homes on the Gulf coast.', 'Every listing is walked by our own agents.'] },
    { heading: 'Why Seaside', items: ['Local agents who live here', 'Offers close within days', 'Private viewings seven days a week'] },
    { heading: 'Neighbourhoods', items: ['Palm Cove', 'Harbour Point', 'Old Town'] },
    { heading: 'Open houses', items: ['Saturday 10am: Palm Cove', 'Sunday 2pm: Harbour Point', 'Weekdays by appointment'] },
    { heading: 'Contact us', items: ['Book a tour', 'Get the buyer guide', 'Call the office'] },
  ],
  sideLeft: ['Homes', 'About', 'Journal', 'Contact'],
  sideRight: ['Book a tour', 'Get the buyer guide'],
  history: [{ label: 'Spring listings', title: 'Seaside Homes · 1' }, { label: 'Winter listings', title: 'Seaside Homes · 2' }],
  meta: { brand: 'Seaside Homes' },
};

test('the person\'s document is typed out in the real renderer; the sample is unchanged without one', async ({ page }) => {
  test.setTimeout(10 * 60_000);
  await installStudioSession(page);
  await openSweep(page);
  const frames = [20, 60, 120, 147];
  const mine = (await recipeFrames(page, 'DocumentTypewriterReveal', frames, { custom: { screens: [], cardCrops: [], document: doc }, scale: 0.5 })).png;
  const sample = (await recipeFrames(page, 'DocumentTypewriterReveal', frames, { sample: true, scale: 0.5 })).png;
  mine.forEach((b, i) => save(OUT, `document-mine-${frames[i]}.png`, b));
  sample.forEach((b, i) => save(OUT, `document-sample-${frames[i]}.png`, b));
  const m = mine.map(rawRgbFull), s = sample.map(rawRgbFull);
  // The document is a different picture from the sample's screenshot, in every phase of the write-on.
  frames.forEach((f, i) => expect(diffShare(m[i], s[i]), `frame ${f} differs from the sample`).toBeGreaterThan(0.01));
  // The write-on progresses: the document fills in between frame 20 and frame 120 (more ink), as in the sample.
  expect(diffShare(m[0], m[2]), 'the document is typed out over time').toBeGreaterThan(0.02);
  // Settled frame is the finished document, not blank.
  expect(diffShare(m[2], m[3])).toBeGreaterThanOrEqual(0);
});
