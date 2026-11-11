// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { MOTION_TEMPLATES } from '@/data/motionRecipeCatalog';
import { shotPersonalization, summarizePersonalization } from '../lib/personalization';
import { captureQuality, personalisesWithSite } from '../lib/captureQuality';
import { neutralTexts } from '../lib/retext';
import type { ClipData } from '../types';

const clip = (stem: string, props: Record<string, unknown>): ClipData => ({ id: `c-${stem}`, cardId: `demo:${stem}`, start: 0, duration: 90, inOffset: 0, speed: 1, opacity: 1, scale: 1, x: 0, y: 0, props });

describe('what became of a shot', () => {
  it('a rewritten source is adapted', () => {
    expect(shotPersonalization(clip('RowEmbed', { adaptedCode: 'x', screens: ['a'] }))?.state).toBe('adapted');
  });

  it('a recipe that reads pictures and has them is parameterised', () => {
    expect(shotPersonalization(clip('PageWaterfallWall', { crops: ['a', 'b'] }))?.state).toBe('parameterized');
  });

  it('a recipe that draws its own sample content is unmodified even with a picture inset beside it, and says why', () => {
    expect(MOTION_TEMPLATES.some((t) => t.componentName === 'HitCounter')).toBe(true);
    const r = shotPersonalization(clip('HitCounter', { scenePictures: { crops: ['a'] }, texts: { 'SmartVideo GO': 'Acme' } }));
    expect(r?.state).toBe('unmodified');
    expect(r?.reason).toMatch(/only 1 of its 14 lines/);
    expect(r?.reason).toMatch(/beside it, not in it/);
  });

  it('a recipe whose own lines are mostly replaced is parameterised', () => {
    expect(shotPersonalization(clip('SpotlightHeroCard', { texts: { 'Your product,': 'Acme,' } }))?.state).toBe('parameterized');
  });

  it('a few replaced lines of a text-heavy recipe are not enough', () => {
    expect(shotPersonalization(clip('HitCounter', { texts: { a: 'b', c: 'd' } }))?.state).toBe('unmodified');
  });

  it('not a recipe shot is ignored', () => {
    expect(shotPersonalization({ ...clip('X', {}), cardId: 'inkpress-title-card' })).toBeNull();
  });
});

describe('the summary never counts zero personalised shots as success', () => {
  it('says how many of how many', () => {
    const s = summarizePersonalization([
      { clipId: '1', stem: 'A', name: 'A', state: 'adapted', reason: '' },
      { clipId: '2', stem: 'B', name: 'B', state: 'parameterized', reason: '' },
      { clipId: '3', stem: 'C', name: 'Hit Counter', state: 'unmodified', reason: 'it draws its own sample screen' },
    ]);
    expect(s.line).toBe('Personalised 2 of 3 shots: 1 adapted, 1 parameterised, 1 unmodified');
    expect(s.details).toEqual(['Hit Counter is unmodified: it draws its own sample screen']);
    expect(summarizePersonalization([{ clipId: '3', stem: 'C', name: 'C', state: 'unmodified', reason: 'x' }]).personalized).toBe(0);
  });
});

describe('capture quality', () => {
  it('tells complete, partial and failed apart', () => {
    expect(captureQuality({ partial: false, page: { url: 'https://x/p.png', width: 1, height: 1 } })).toBe('complete');
    expect(captureQuality({ partial: true, page: { url: '', width: 0, height: 0 } })).toBe('partial');
    expect(captureQuality({ partial: false, page: { url: '', width: 0, height: 0 } })).toBe('partial');
    expect(captureQuality(null)).toBe('failed');
    expect(personalisesWithSite({ partial: true, page: { url: '', width: 0, height: 0 } })).toBe(false);
  });
});

describe('demo names and claims become the person\'s own, nothing is invented', () => {
  it('replaces "Your product", the studio brands and a false "real page captures" claim', () => {
    const out = neutralTexts(['Your product,', 'in motion.', 'REAL PAGE CAPTURES', 'SmartVideo GO news', 'Shot recipes'], 'Acme', { sitePages: false, hasPictures: true });
    expect(out).toEqual({ 'Your product,': 'Acme,', 'REAL PAGE CAPTURES': 'YOUR PICTURES', 'SmartVideo GO news': 'Acme news' });
  });

  it('keeps "real page captures" when the pages really were captured', () => {
    expect(neutralTexts(['REAL PAGE CAPTURES'], 'Acme', { sitePages: true, hasPictures: true })).toEqual({});
  });
});
