/**
 * Checkpoint properties of one shot, checked on real pixels (the browser's own renderer) at three moments: entering (20 %),
 * the peak of the action (50 %) and settled (3 frames from the end). Every result is tagged:
 *   mechanical            decided by a deterministic measure; counts toward passing the scene
 *   needs-visual-judgement what a program cannot decide (is the composition good, does it read as the card intends); listed, never
 *                          counted as verified, and left to a model-assisted frame review or a person
 * Nothing here claims creative or semantic quality.
 */
export interface Pixels { data: Uint8ClampedArray | number[]; width: number; height: number }
export type CheckKind = 'mechanical' | 'needs-visual-judgement';
export interface PropertyCheck { frame: 'entering' | 'peak' | 'settled'; property: string; kind: CheckKind; ok: boolean; detail: string }
export type Rgb = [number, number, number];

const at = (p: Pixels, i: number): Rgb => [p.data[i], p.data[i + 1], p.data[i + 2]];

/** Standard deviation of luminance: a blank or flat frame has none. */
export function lumaSpread(p: Pixels): number {
  let sum = 0, sq = 0;
  const n = p.data.length / 4;
  for (let i = 0; i < p.data.length; i += 4) { const l = 0.2126 * p.data[i] + 0.7152 * p.data[i + 1] + 0.0722 * p.data[i + 2]; sum += l; sq += l * l; }
  const m = sum / n;
  return Math.sqrt(Math.max(0, sq / n - m * m));
}

export function diffShare(a: Pixels, b: Pixels, tol = 24): number {
  if (a.width !== b.width || a.height !== b.height) return 1;
  let d = 0;
  for (let i = 0; i < a.data.length; i += 4) if (Math.max(Math.abs(a.data[i] - b.data[i]), Math.abs(a.data[i + 1] - b.data[i + 1]), Math.abs(a.data[i + 2] - b.data[i + 2])) > tol) d++;
  return d / (a.data.length / 4);
}

/** Where a colour is in the frame: share of pixels near it, centroid and bounding box (all as fractions of the frame). */
export function colourFootprint(p: Pixels, rgb: Rgb, tol = 40): { share: number; cx: number; cy: number; x0: number; y0: number; x1: number; y1: number } | null {
  let n = 0, sx = 0, sy = 0, x0 = p.width, y0 = p.height, x1 = -1, y1 = -1;
  for (let y = 0; y < p.height; y++) for (let x = 0; x < p.width; x++) {
    const [r, g, b] = at(p, (y * p.width + x) * 4);
    if (Math.abs(r - rgb[0]) <= tol && Math.abs(g - rgb[1]) <= tol && Math.abs(b - rgb[2]) <= tol) { n++; sx += x; sy += y; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  if (!n) return null;
  const px = p.width * p.height;
  return { share: n / px, cx: sx / n / p.width, cy: sy / n / p.height, x0: x0 / p.width, y0: y0 / p.height, x1: (x1 + 1) / p.width, y1: (y1 + 1) / p.height };
}

/** The mean colour of the person's supplied picture, and the colour of its brightest large cell: what to look for in a frame. */
export function pictureColours(p: Pixels, cells = 4): Rgb[] {
  const out: Rgb[] = [];
  const cw = Math.floor(p.width / cells), ch = Math.floor(p.height / cells);
  for (let cy = 0; cy < cells; cy++) for (let cx = 0; cx < cells; cx++) {
    let r = 0, g = 0, b = 0, n = 0;
    for (let y = cy * ch; y < (cy + 1) * ch; y++) for (let x = cx * cw; x < (cx + 1) * cw; x++) { const [pr, pg, pb] = at(p, (y * p.width + x) * 4); r += pr; g += pg; b += pb; n++; }
    out.push([Math.round(r / n), Math.round(g / n), Math.round(b / n)]);
  }
  // distinct cells only
  return out.filter((c, i) => out.findIndex((d) => Math.abs(d[0] - c[0]) + Math.abs(d[1] - c[1]) + Math.abs(d[2] - c[2]) < 40) === i);
}

export interface Checkpoint { name: PropertyCheck['frame']; mine: Pixels; plain: Pixels }

export interface CheckInput {
  checkpoints: Checkpoint[];
  /** Colours of the person's pictures, when their pixels could be read; null = unreadable (remote, tainted): identity then needs judgement. */
  supplied: Rgb[] | null;
  /** The recipe has nothing of the person's to show (a pure-motion recipe). */
  abstract?: boolean;
}

const FLAT = 6; // luminance spread below which a frame is "blank"
const MOVES = 0.005; // share of pixels that must change between two checkpoints for the shot to count as moving
const EDGE_MASS = 0.4; // share of a supplied colour's mass touching the frame edge beyond which it is clipped
const SEEN = 0.01; // share of the frame a supplied picture's colour must fill at some checkpoint

export function checkShot(input: CheckInput): PropertyCheck[] {
  const out: PropertyCheck[] = [];
  const [enter, peak, settled] = input.checkpoints;
  for (const c of input.checkpoints) {
    const spread = lumaSpread(c.mine);
    out.push({ frame: c.name, property: 'visibility', kind: 'mechanical', ok: spread > FLAT, detail: `luminance spread ${spread.toFixed(1)}${spread > FLAT ? '' : ' (blank frame)'}` });
  }
  // Motion progression: the shot goes somewhere between entering, peak and settled (it is not a still).
  if (enter && peak && settled && !input.abstract) {
    const a = diffShare(enter.mine, peak.mine), b = diffShare(peak.mine, settled.mine), c = diffShare(enter.mine, settled.mine);
    out.push({ frame: 'peak', property: 'motionProgression', kind: 'mechanical', ok: Math.max(a, b, c) >= MOVES, detail: `changes between checkpoints: entering→peak ${(a * 100).toFixed(1)}%, peak→settled ${(b * 100).toFixed(1)}%, entering→settled ${(c * 100).toFixed(1)}%` });
  }
  if (!input.abstract) {
    if (input.supplied && input.supplied.length) {
      // Asset identity: a colour of the person's own picture fills part of some frame (and the plain recipe does not already show it).
      let best = 0, where: Checkpoint['name'] = 'peak';
      let clip: { frame: Checkpoint['name']; mass: number } | null = null;
      for (const c of input.checkpoints) for (const rgb of input.supplied) {
        const fp = colourFootprint(c.mine, rgb);
        const base = colourFootprint(c.plain, rgb);
        const own = (fp?.share ?? 0) - (base?.share ?? 0);
        if (own > best) { best = own; where = c.name; }
        // A colour the plain recipe already fills (its own background) says nothing about the picture being cut off.
        if (fp && fp.share > SEEN && (base?.share ?? 0) < 0.05) {
          // clipping: the picture's colour piles against the frame edge (it is cut off)
          const edge = fp.x0 <= 0.002 || fp.x1 >= 0.998 || fp.y0 <= 0.002 || fp.y1 >= 0.998;
          if (edge && fp.share > EDGE_MASS) clip = { frame: c.name, mass: fp.share };
        }
      }
      out.push({ frame: where, property: 'assetIdentity', kind: 'mechanical', ok: best >= SEEN, detail: best >= SEEN ? `a colour of the supplied picture fills ${(best * 100).toFixed(1)}% of the ${where} frame beyond what the plain recipe shows` : 'no colour of the supplied pictures appears in any checked frame beyond the plain recipe' });
      if (clip) out.push({ frame: clip.frame, property: 'clipping', kind: 'mechanical', ok: false, detail: `a supplied picture's colour fills ${(clip.mass * 100).toFixed(0)}% of the frame and touches its edge: it is cut off` });
      else out.push({ frame: 'settled', property: 'clipping', kind: 'mechanical', ok: true, detail: 'no supplied picture is pressed against the frame edge' });
    } else {
      out.push({ frame: 'peak', property: 'assetIdentity', kind: 'needs-visual-judgement', ok: true, detail: 'the supplied pictures\' pixels could not be read here (remote or protected), so it is only known that the shot differs from the plain recipe' });
      if (enter && peak && settled) {
        const d = Math.max(diffShare(peak.mine, peak.plain), diffShare(settled.mine, settled.plain));
        out.push({ frame: 'peak', property: 'differsFromSample', kind: 'mechanical', ok: d >= 0.01, detail: `the shot differs from the plain recipe in ${(d * 100).toFixed(1)}% of the frame` });
      }
    }
    out.push({ frame: 'settled', property: 'subjectLocation / destination / cameraTarget', kind: 'needs-visual-judgement', ok: true, detail: 'whether the subject sits where the recipe\'s card puts it is checked on the fidelity fixtures (e2e/motion-director-fidelity), not from arbitrary pictures' });
    out.push({ frame: 'settled', property: 'textReadable', kind: 'needs-visual-judgement', ok: true, detail: 'readability of words needs a visual review' });
  }
  return out;
}

/** A scene passes when every MECHANICAL check holds; judgement items are listed but never counted as verified. */
export const checksPassed = (checks: readonly PropertyCheck[]): boolean => checks.filter((c) => c.kind === 'mechanical').every((c) => c.ok);
export const judgementItems = (checks: readonly PropertyCheck[]): string[] => checks.filter((c) => c.kind === 'needs-visual-judgement').map((c) => `${c.property} (${c.frame}): ${c.detail}`);
