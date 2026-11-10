/**
 * A synthetic captured page with KNOWN geometry, delivered the way a real capture is: a 1920-CSS-px-wide page as a 2x PNG,
 * the page with its cards hidden (the empty plate), and the exact crop of every card. Each card has its own colour and
 * label, so where a recipe draws it in a frame can be measured and compared with where the geometry says it should be.
 */
import fs from 'node:fs';
import path from 'node:path';
import { deflateSync } from 'node:zlib';

export interface FixtureCard { x: number; y: number; w: number; h: number; color: [number, number, number] }
export interface FixtureLayout { pageH: number; cards: FixtureCard[]; bg: [number, number, number] }

const TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc = (buf: Buffer) => {
  let c = 0xffffffff;
  for (const b of buf) c = TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type: string, data: Buffer) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const sum = Buffer.alloc(4);
  sum.writeUInt32BE(crc(body));
  return Buffer.concat([len, body, sum]);
};

/** An RGB raster as PNG. `paint(x, y)` gives the colour of a pixel. */
function png(width: number, height: number, paint: (x: number, y: number) => [number, number, number]): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const raw = Buffer.alloc(height * (1 + width * 3));
  let o = 0;
  for (let y = 0; y < height; y++) {
    raw[o++] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b] = paint(x, y);
      raw[o++] = r;
      raw[o++] = g;
      raw[o++] = b;
    }
  }
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 1 })), chunk('IEND', Buffer.alloc(0))]);
}

const inside = (x: number, y: number, c: FixtureCard) => x >= c.x && x < c.x + c.w && y >= c.y && y < c.y + c.h;
/** A card face: its colour, a darker 8 px border (so its edges are findable) and a lighter bar near the top (so it has structure). */
const face = (c: FixtureCard, lx: number, ly: number): [number, number, number] => {
  const edge = Math.min(lx, ly, c.w - 1 - lx, c.h - 1 - ly);
  if (edge < 4) return [Math.round(c.color[0] * 0.55), Math.round(c.color[1] * 0.55), Math.round(c.color[2] * 0.55)];
  if (ly > 24 && ly < 44 && lx > 20 && lx < c.w * 0.55) return [Math.min(255, c.color[0] + 70), Math.min(255, c.color[1] + 70), Math.min(255, c.color[2] + 70)];
  return c.color;
};

export interface FixtureImages { screen: string; plate: string; crops: string[] }

const uri = (b: Buffer) => `data:image/png;base64,${b.toString('base64')}`;

/** The page (with cards), the page with its cards hidden, and one crop per card; all at 2x. */
export function fixtureImages(layout: FixtureLayout): FixtureImages {
  const W = 1920 * 2;
  const H = layout.pageH * 2;
  const bar = (y: number) => y < 120; // a header bar so the page is not a flat field
  const page = (withCards: boolean) =>
    png(W, H, (px, py) => {
      const x = px / 2;
      const y = py / 2;
      if (withCards) for (const c of layout.cards) if (inside(x, y, c)) return face(c, x - c.x, y - c.y);
      if (bar(py)) return [40, 44, 56];
      return layout.bg;
    });
  return {
    screen: uri(page(true)),
    plate: uri(page(false)),
    crops: layout.cards.map((c) => uri(png(Math.round(c.w * 2), Math.round(c.h * 2), (px, py) => face(c, px / 2, py / 2)))),
  };
}

/** The sample site's own card rectangles (demosrc/_textures/live-layout.json), with a colour each: the twin a customer layout is measured against. */
export function sampleTwin(): FixtureLayout {
  const j = JSON.parse(fs.readFileSync(path.resolve('src/apps/motion-director/demosrc/_textures/live-layout.json'), 'utf8'));
  return { pageH: j.projects.pageH, bg: [234, 238, 242], cards: j.projects.cards.map((c: { x: number; y: number; w: number; h: number }, i: number) => ({ x: c.x, y: c.y, w: c.w, h: c.h, color: COLORS[i % COLORS.length] })) };
}

/** Unique, far-apart colours (none is the page background, the header or a darker/lighter variant of another). */
export const COLORS: Array<[number, number, number]> = [
  [236, 0, 140], [110, 210, 0], [255, 120, 0], [0, 175, 235], [140, 70, 220], [255, 205, 0], [0, 190, 120], [220, 60, 60], [90, 120, 255], [170, 110, 40],
];

/** A customer page unlike the sample: 8 cards in a 3-column grid at other positions and sizes, another page height; card 1 is the biggest (the hero). */
export function customerFixture(): FixtureLayout {
  const cols = [210, 770, 1330];
  const rows = [300, 740, 1180];
  const cards: FixtureCard[] = [];
  let i = 0;
  for (const y of rows) for (const x of cols) {
    if (i >= 8) break;
    const hero = i === 1;
    cards.push({ x, y, w: hero ? 480 : 430, h: hero ? 400 : 360, color: COLORS[i % COLORS.length] });
    i++;
  }
  return { pageH: 1700, bg: [234, 238, 242], cards };
}

/** The layout a capture would report for a fixture (page CSS px; the card order the crops come in). */
export function captureLayoutOf(f: FixtureLayout) {
  return { pageH: f.pageH, sections: [], cards: f.cards.map((c) => ({ x: c.x, y: c.y, width: c.w, height: c.h })) };
}

/** The sample's five detail rows (live-layout.json `detail`), each its own colour: the twin for row shots. */
export function sampleRowsTwin(key: 'detail' | 'papers' = 'detail'): FixtureLayout {
  const j = JSON.parse(fs.readFileSync(path.resolve('src/apps/motion-director/demosrc/_textures/live-layout.json'), 'utf8'));
  const rows = key === 'detail' ? j.detail.rows : j.papers.cards;
  return { pageH: key === 'detail' ? j.detail.pageH : j.papers.pageH, bg: [234, 238, 242], cards: rows.map((c: { x: number; y: number; w: number; h: number }, i: number) => ({ x: c.x, y: c.y, w: c.w, h: c.h, color: COLORS[i % COLORS.length] })) };
}

/** A customer page unlike the sample's detail page: 5 wider, taller rows at another offset, a taller page. */
export function customerRows(): FixtureLayout {
  const cards: FixtureCard[] = [0, 1, 2, 3, 4].map((i) => ({ x: 300, y: 520 + i * 140, w: 1320, h: 118, color: COLORS[i % COLORS.length] }));
  return { pageH: 1500, bg: [234, 238, 242], cards };
}

/** A customer's list page: five tall rows (the stack shot's cards) at another offset and width. */
export function customerPapers(): FixtureLayout {
  const cards: FixtureCard[] = [0, 1, 2, 3, 4].map((i) => ({ x: 300, y: 300 + i * 250, w: 1320, h: 230, color: COLORS[i % COLORS.length] }));
  return { pageH: 1700, bg: [234, 238, 242], cards };
}

/** The layout a capture reports for a page whose blocks are rows: they come as sections. */
export function captureRowsOf(f: FixtureLayout) {
  return { pageH: f.pageH, cards: [], sections: f.cards.map((c) => ({ x: c.x, y: c.y, width: c.w, height: c.h })) };
}
