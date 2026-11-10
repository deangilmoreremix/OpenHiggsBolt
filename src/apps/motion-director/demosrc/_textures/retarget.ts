/**
 * Retargeting a shot's composition onto another page.
 *
 * A recipe's camera and its decorations were tuned in the sample page's coordinates around one anchor (the hero card,
 * the rows, the card grid). To play the same shot on a customer's page the anchor moves and changes size; everything
 * authored around it must follow, so the shot keeps its composition: the same share of the frame, the same angle,
 * the same timing. A similarity (uniform scale `k` + shift) from the sample anchor to the customer's anchor does that.
 * With the sample's own anchor it is the identity, which is why an unpersonalised shot is untouched.
 */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Similarity {
  /** Customer units per sample unit. */
  k: number;
  tx: number;
  ty: number;
  identity: boolean;
  /** A sample page point on the customer's page. */
  point: (x: number, y: number) => { x: number; y: number };
  /** A sample length on the customer's page. */
  len: (v: number) => number;
  /** A camera zoom that frames the same share of the frame as the sample's zoom did. */
  zoom: (z: number) => number;
  /** CSS for a layer authored in sample coordinates (origin 0 0): scales its 3D depth too. */
  css: string;
}

const EPS = 1e-6;
const centre = (r: Rect) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });

export function similarity(sample: Rect, customer: Rect): Similarity {
  const k = sample.w > 0 && customer.w > 0 ? customer.w / sample.w : 1;
  const s = centre(sample);
  const c = centre(customer);
  const tx = c.x - s.x * k;
  const ty = c.y - s.y * k;
  const identity = Math.abs(k - 1) < EPS && Math.abs(tx) < EPS && Math.abs(ty) < EPS;
  return {
    k,
    tx,
    ty,
    identity,
    point: (x, y) => (identity ? { x, y } : { x: x * k + tx, y: y * k + ty }),
    len: (v) => (identity ? v : v * k),
    zoom: (z) => (identity ? z : z / k),
    css: identity ? '' : `translate(${tx}px, ${ty}px) scale3d(${k}, ${k}, ${k})`,
  };
}

export const unionRect = (rects: readonly Rect[]): Rect => {
  const x0 = Math.min(...rects.map((r) => r.x));
  const y0 = Math.min(...rects.map((r) => r.y));
  const x1 = Math.max(...rects.map((r) => r.x + r.w));
  const y1 = Math.max(...rects.map((r) => r.y + r.h));
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
};
