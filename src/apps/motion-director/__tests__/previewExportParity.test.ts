import { describe, expect, it } from 'vitest';
import { blurSamples, isExporting, setExportMode } from '../demosrc/_fixtures/ExportMode';
import { projectDuration, projectEndFrame, type ProjectData } from '../types';

/**
 * Preview and export draw the same MainComposition. What differs is written down here, so a change to either
 * side has to change this test too. (A pixel comparison of the two needs a browser and a session: see the
 * e2e notes in UPSTREAM-METHOD.md.)
 */
const film = (endFrames: number, fps = 30): ProjectData => ({ name: 't', fps, width: 1920, height: 1080, background: '#000', tracks: [{ id: 'a', name: 'Shots', clips: [{ id: 'c', cardId: 'text-basic', start: 0, duration: endFrames, inOffset: 0, speed: 1, opacity: 1, scale: 1, x: 0, y: 0, props: {} }] }] }) as unknown as ProjectData;

describe('preview vs export: the known differences', () => {
  it('the preview runs one second past the export, and at least five seconds', () => {
    const p = film(300);
    expect(projectDuration(p) - projectEndFrame(p)).toBe(p.fps);
    expect(projectDuration(film(30))).toBe(5 * 30);
    const wide = film(240, 24);
    expect(projectDuration(wide) - projectEndFrame(wide)).toBe(24);
  });

  it('only export mode draws fewer motion-blur samples (about a third, never below 3)', () => {
    setExportMode(false);
    expect([12, 8, 3].map(blurSamples)).toEqual([12, 8, 3]);
    setExportMode(true);
    expect(isExporting()).toBe(true);
    expect([12, 8, 3, 2].map(blurSamples)).toEqual([4, 3, 3, 2]);
    setExportMode(false);
  });
});
