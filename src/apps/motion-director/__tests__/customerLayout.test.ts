// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { layoutFromCapture, rowsOf, MIN_CARDS, MIN_ROWS } from '../lib/customerLayout';
import { similarity, unionRect } from '../demosrc/_textures/retarget';
import { SAMPLE_LAYOUT } from '../demosrc/_textures/LiveLayoutContext';
import { GEOMETRY_UNMAPPED, LAYOUT_NEEDS, LAYOUT_RECIPES, planToProject } from '../lib/buildFilm';
import { MOTION_TEMPLATES } from '@/data/motionRecipeCatalog';

const rect = (x: number, y: number, width: number, height: number) => ({ x, y, width, height });
const capture = (pages: Array<{ pageH: number; cards?: ReturnType<typeof rect>[]; sections?: ReturnType<typeof rect>[] }>, emptyPlate: string | null = null) =>
  ({
    pages: pages.map((p, i) => ({ name: `p${i}`, path: `/${i}`, url: '', width: 3840, height: 0, layout: { pageH: p.pageH, cards: p.cards ?? [], sections: p.sections ?? [] } })),
    page: { url: '', width: 0, height: 0 },
    emptyPlate,
    brand: { background: '#eef', text: null, accent: null, fontFamily: null },
  }) as never;

describe('layoutFromCapture: the customer page in the shape the recipes read', () => {
  it('takes the page\'s own cards, in reading order, with the crop index each keeps', () => {
    const cards = [rect(900, 300, 400, 300), rect(100, 300, 400, 300), rect(100, 700, 400, 300), rect(500, 700, 400, 300)];
    const r = layoutFromCapture(capture([{ pageH: 1500, cards }]));
    expect(r.usable).toBe(true);
    expect(r.layout.projects.pageH).toBe(1500);
    expect(r.layout.projects.cards.map((c) => [c.x, c.y])).toEqual([[100, 300], [900, 300], [100, 700], [500, 700]]);
    // The card at (900,300) was capture card 0: its crop is crop:0
    expect(r.layout.projects.cards[1].file).toBe('crop:0');
    expect(r.layout.source?.mapped).toContain('projects.cards');
    expect(r.layout.source?.sample).not.toContain('projects.cards');
  });

  it('needs MIN_CARDS real cards; fewer keeps the sample\'s boxes and says so', () => {
    const r = layoutFromCapture(capture([{ pageH: 1500, cards: [rect(0, 0, 400, 300), rect(500, 0, 400, 300)] }]));
    expect(MIN_CARDS).toBe(3);
    expect(r.usable).toBe(false);
    expect(r.layout.source?.sample).toContain('projects.cards');
    expect(r.layout.projects.cards).toEqual(SAMPLE_LAYOUT.projects.cards);
  });

  it('records the empty plate only when the capture has one', () => {
    const cards = [rect(0, 0, 400, 300), rect(500, 0, 400, 300), rect(1000, 0, 400, 300)];
    expect(layoutFromCapture(capture([{ pageH: 900, cards }], 'data:image/png;base64,AA')).layout.source?.mapped).toContain('plate');
    expect(layoutFromCapture(capture([{ pageH: 900, cards }])).layout.source?.mapped).not.toContain('plate');
  });

  it('finds stacked rows on the second capture page (detail) and the fourth (papers), each with its own height', () => {
    const rows = [0, 1, 2, 3, 4].map((i) => rect(300, 400 + i * 140, 1300, 118));
    const r = layoutFromCapture(capture([{ pageH: 900 }, { pageH: 1500, sections: rows }, { pageH: 1100 }, { pageH: 1700, sections: rows }]));
    expect(r.rowsUsable).toBe(true);
    expect(r.layout.detail.pageH).toBe(1500);
    expect(r.layout.detail.rows).toHaveLength(5);
    expect(r.layout.detail.rows[0]).toMatchObject({ x: 300, y: 400, w: 1300, h: 118 });
    expect(r.layout.papers.pageH).toBe(1700);
    expect(r.layout.source?.mapped).toEqual(expect.arrayContaining(['detail.rows', 'papers.cards5', 'wbr.pageH']));
  });

  it('does not invent rows a page does not have', () => {
    const r = layoutFromCapture(capture([{ pageH: 900, sections: [rect(0, 0, 1920, 600), rect(0, 700, 1920, 200)] }]));
    expect(r.rowsUsable).toBe(false);
    expect(r.layout.detail.rows).toEqual(SAMPLE_LAYOUT.detail.rows);
    expect(r.layout.source?.mapped).not.toContain('detail.rows');
  });
});

describe('rowsOf', () => {
  it('keeps the biggest group that shares a left edge and width, one under another', () => {
    const blocks = [rect(100, 100, 1200, 100), rect(100, 220, 1200, 100), rect(100, 340, 1200, 100), rect(700, 50, 600, 50), rect(100, 120, 1200, 40)];
    const rows = rowsOf(2000, blocks);
    expect(rows).toHaveLength(3);
    expect(rows.every((r) => r.x === 100 && r.w === 1200)).toBe(true);
    expect(MIN_ROWS).toBe(3);
  });
  it('drops blocks that are not wide short rows', () => {
    expect(rowsOf(2000, [rect(0, 0, 300, 300), rect(0, 400, 1900, 900)])).toEqual([]);
  });
});

describe('similarity: carrying a composition from the sample\'s anchor to the customer\'s', () => {
  it('is the identity for the sample\'s own anchor, so an unpersonalised shot is untouched', () => {
    const c = SAMPLE_LAYOUT.projects.cards[3];
    const s = similarity({ x: c.x, y: c.y, w: c.w, h: c.h }, { x: c.x, y: c.y, w: c.w, h: c.h });
    expect(s.identity).toBe(true);
    expect(s.point(123, 456)).toEqual({ x: 123, y: 456 });
    expect(s.zoom(2.4)).toBe(2.4);
    expect(s.css).toBe('');
  });
  it('maps the sample anchor\'s centre to the customer anchor\'s centre and keeps its share of the frame', () => {
    const s = similarity({ x: 100, y: 100, w: 200, h: 100 }, { x: 500, y: 700, w: 400, h: 220 });
    expect(s.k).toBe(2);
    expect(s.point(200, 150)).toEqual({ x: 700, y: 810 });
    expect(s.zoom(2)).toBe(1); // a card twice as wide needs half the zoom to fill the same part of the frame
  });
  it('unionRect covers every rectangle', () => {
    expect(unionRect([{ x: 10, y: 10, w: 5, h: 5 }, { x: 30, y: 40, w: 10, h: 10 }])).toEqual({ x: 10, y: 10, w: 30, h: 40 });
  });
});

describe('which recipes carry the customer\'s layout', () => {
  it('lists the repaired recipes and what each reads; none is also marked unmapped', () => {
    expect([...LAYOUT_RECIPES].sort()).toEqual(Object.keys(LAYOUT_NEEDS).sort());
    for (const stem of Object.keys(GEOMETRY_UNMAPPED)) expect(LAYOUT_RECIPES.has(stem)).toBe(false);
    // 11 of the 12 recipes that import live-layout.json are retargeted, the 12th is named with its reason, and JumpCutPunchIn
    // (which draws the captured page through FakeDashboard) is retargeted as well.
    expect(LAYOUT_RECIPES.size).toBe(12);
    expect(Object.keys(GEOMETRY_UNMAPPED)).toEqual(['DocumentTypewriterReveal']);
    expect(LAYOUT_RECIPES.has('JumpCutPunchIn')).toBe(true);
  });
});

describe('planToProject hands the customer\'s layout only to the recipes that read it', () => {
  const id = (c: string) => MOTION_TEMPLATES.find((t) => t.componentName === c)!.id;
  const plan = {
    title: 't', summary: '', palette: { background: '#101018', text: '#ffffff', accent: '#8b6bff' },
    scenes: [
      { kind: 'shot', recipeId: id('SpotlightHeroCard'), durationSec: 5, headline: 'a', caption: 'b', transition: 'cut' },
      { kind: 'shot', recipeId: id('RowEmbed'), durationSec: 5, headline: 'a', caption: 'b', transition: 'cut' },
      { kind: 'shot', recipeId: id('DocumentTypewriterReveal'), durationSec: 5, headline: 'a', caption: 'b', transition: 'cut' },
    ],
  } as never;
  const clipsOf = (layout: unknown) => {
    const project = planToProject(plan, { aspectRatio: '16:9', capture: { screens: ['data:image/png;base64,AA'], crops: [], cardCrops: ['data:image/png;base64,AA'], emptyPlate: null, liveLayout: layout, title: 'Acme' } as never });
    return project.tracks.flatMap((t: { clips?: Array<{ props?: Record<string, unknown> }> }) => t.clips ?? []).filter((c: { props?: Record<string, unknown> }) => c.props && 'accent' in c.props);
  };
  it('a layout with cards but no rows reaches the card shot, not the row shot', () => {
    const cards = [0, 1, 2, 3].map((i) => rect(100 + i * 450, 300, 400, 300));
    const { layout } = layoutFromCapture(capture([{ pageH: 1500, cards }]));
    const clips = clipsOf(layout);
    const withLayout = clips.filter((c: { props?: Record<string, unknown> }) => c.props?.liveLayout);
    expect(withLayout).toHaveLength(1);
  });
  it('the shot whose structure a capture cannot give plays as the sample demo, without the customer\'s pictures', () => {
    const rows = [0, 1, 2, 3, 4].map((i) => rect(300, 400 + i * 140, 1300, 118));
    const { layout } = layoutFromCapture(capture([{ pageH: 1500, sections: rows }]));
    const doc = clipsOf(layout).find((c: { props?: Record<string, unknown> }) => c.props && !('liveLayout' in c.props) && !('screens' in c.props));
    expect(doc).toBeTruthy();
  });
});
