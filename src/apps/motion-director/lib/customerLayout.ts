import { SAMPLE_LAYOUT, type LiveLayout } from '../demosrc/_textures/LiveLayoutContext';
import type { SiteCapture } from './directorClient';

/**
 * The captured page's geometry in the shape the screenshot recipes read (demosrc/_textures/live-layout.json).
 *
 * What a capture really contains (src/server/browserDiscovery): per route, `layout = { pageH, sections, cards }` in page CSS px
 * on a 1920-wide page, with `cards[i]` <-> `crops[i]` for the photographed page. Whatever a recipe needs that the
 * capture does not contain stays the sample's, and `source` says which is which, so a recipe is never reported as
 * personalised for geometry it did not get.
 */
export interface CustomerLayoutResult {
  layout: LiveLayout;
  /** How many of the page's cards were found (the sample has 10). */
  cards: number;
  /** Recipes can only land on real cards when there are enough of them. */
  usable: boolean;
  /** How many stacked rows were found on the page the row shots play on (the sample has 5). */
  rows: number;
  /** Row shots (RowEmbed) need at least MIN_ROWS real rows. */
  rowsUsable: boolean;
}

export const MIN_ROWS = 3;

interface R { x: number; y: number; width: number; height: number }
/**
 * Stacked rows of a page: wide, short blocks that share a left edge and width, one under another. Taken from the page's
 * sections and cards; the biggest consistent group wins. Fewer than MIN_ROWS means the page has no row structure.
 */
export function rowsOf(pageH: number, blocks: readonly R[]): Array<{ x: number; y: number; w: number; h: number }> {
  const cand = blocks.filter((b) => b.width >= 500 && b.height >= 40 && b.height <= 260 && b.y >= 0 && b.y + b.height <= pageH + 1).sort((a, b) => a.y - b.y);
  let best: R[] = [];
  for (const a of cand) {
    const group: R[] = [];
    for (const b of cand) {
      if (Math.abs(b.x - a.x) > 40 || Math.abs(b.width - a.width) > 80) continue;
      if (group.length && b.y < group[group.length - 1].y + group[group.length - 1].height - 4) continue; // overlaps the previous row
      group.push(b);
    }
    if (group.length > best.length) best = group;
  }
  return best.slice(0, 5).map((b) => ({ x: Math.round(b.x * 100) / 100, y: Math.round(b.y * 100) / 100, w: Math.round(b.width * 100) / 100, h: Math.round(b.height * 100) / 100 }));
}

/** A page needs at least this many card-like blocks for the card shots to have something real to land on. */
export const MIN_CARDS = 3;

const r = (v: number) => Math.round(v * 100) / 100;

export function layoutFromCapture(capture: Pick<SiteCapture, 'pages' | 'page' | 'emptyPlate' | 'brand'> | null | undefined): CustomerLayoutResult {
  const home = capture?.pages?.[0]?.layout;
  const cards = (home?.cards ?? []).filter((c) => c.width >= 120 && c.height >= 60).slice(0, 10);
  const mapped: string[] = [];
  const sample: string[] = ['detail', 'papers', 'wbr', 'float'];
  const layout: LiveLayout = JSON.parse(JSON.stringify(SAMPLE_LAYOUT));
  if (home && home.pageH > 0) {
    layout.projects.pageH = Math.round(home.pageH);
    mapped.push('projects.pageH');
  } else sample.push('projects.pageH');
  if (cards.length >= MIN_CARDS) {
    // Reading order (rows then columns); each card keeps the capture index its crop has.
    const ordered = cards.map((c, i) => ({ c, i })).sort((a, b) => a.c.y - b.c.y || a.c.x - b.c.x);
    layout.projects.cards = ordered.map(({ c, i }) => ({ file: `crop:${i}`, x: r(c.x), y: r(c.y), w: r(c.width), h: r(c.height), title: '' }));
    // The hero is the biggest card among the first screens' worth: it is the one a shot makes the star.
    const early = layout.projects.cards.map((c, k) => ({ k, area: c.w * c.h, near: c.y < Math.max(1200, layout.projects.pageH * 0.6) })).filter((c) => c.near);
    layout.projects.main = (early.length ? early : layout.projects.cards.map((c, k) => ({ k, area: c.w * c.h }))).sort((a, b) => b.area - a.area)[0].k;
    mapped.push('projects.cards');
  } else sample.push('projects.cards');
  const sections = (home?.sections ?? []).slice(0, 5);
  if (sections.length) {
    layout.projects.sections = sections.map((s) => ({ text: '', x: r(s.x), y: r(s.y), w: r(s.width), h: r(s.height) })) as unknown as typeof layout.projects.sections;
    mapped.push('projects.sections');
  }
  // The page the row shots play on is the capture's second page (the sample's detail page), or the first when there is one.
  const detailRoute = capture?.pages?.length ? capture.pages[1 % capture.pages.length]?.layout : null;
  const rows = detailRoute ? rowsOf(detailRoute.pageH, [...(detailRoute.sections ?? []), ...(detailRoute.cards ?? [])] as R[]) : [];
  if (detailRoute && rows.length >= MIN_ROWS) {
    layout.detail.pageH = Math.round(detailRoute.pageH);
    layout.detail.rows = rows;
    mapped.push('detail.pageH', 'detail.rows');
    sample.splice(sample.indexOf('detail'), 1);
  }
  // The papers page (the sample's fourth capture) and the weekly-report page (its third): their heights, and the papers' rows.
  const routeAt = (i: number) => (capture?.pages?.length ? capture.pages[i % capture.pages.length]?.layout ?? null : null);
  const papersRoute = routeAt(3);
  const paperRows = papersRoute ? rowsOf(papersRoute.pageH, [...(papersRoute.sections ?? []), ...(papersRoute.cards ?? [])] as R[]) : [];
  if (papersRoute && paperRows.length >= MIN_ROWS) {
    layout.papers.pageH = Math.round(papersRoute.pageH);
    layout.papers.cards = paperRows as unknown as typeof layout.papers.cards;
    mapped.push('papers.pageH', 'papers.cards');
  }
  const wbrRoute = routeAt(2);
  if (wbrRoute && wbrRoute.pageH > 0) {
    layout.wbr.pageH = Math.round(wbrRoute.pageH);
    mapped.push('wbr.pageH');
  }
  // The empty plate is the page with its cards hidden: it is what shows beneath a lifted or flying card.
  if (capture?.emptyPlate) mapped.push('plate');
  if (capture?.brand?.background) layout.projects.bg = capture.brand.background;
  layout.source = { mapped, sample };
  return { layout, cards: cards.length, usable: cards.length >= MIN_CARDS, rows: rows.length, rowsUsable: rows.length >= MIN_ROWS };
}
