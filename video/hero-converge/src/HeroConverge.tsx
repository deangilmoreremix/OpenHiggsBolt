// SmartVideo GO hero — bezier-source-converge-merge, then a mirrored fan-out.
// Part 1 keeps the card's tuned timing verbatim (168f window, normalized t): staggered draw-on,
// inOutCubic convergence along the real curve, three-stage shrink, two whole packet cycles, reverse erase.
// The merge point is the first frame of the SmartVideo GO logo animation (a dot), which then plays
// into the play tile. Part 2 mirrors the same cubic outward to five output cards. Part 3 resumes the
// logo animation into the full lockup and lands the caption.
// Design coords 640×360 (DesignStage scales to the composition size).
import React from 'react';
import { AbsoluteFill, Freeze, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { DesignStage, E, lerp, seg } from './lib/Motion';
import { EASE, Grain, Vignette } from './lib/Polish';

export const HERO_FPS = 30;
export const HERO_DURATION = 435;

// ---- landing-page tokens (components/landing, app/globals.css) ----
const SANS = 'Inter, "Helvetica Neue", Arial, sans-serif';
const TXT = '#ffffff';
const DIM = 'rgba(255,255,255,0.28)';
const GLASS = 'rgba(255,255,255,0.04)';
const GLASS_LINE = 'rgba(255,255,255,0.10)';
const ACCENT = '#9487d6'; // logo lavender — the only accent in the foreground
const ACCENT_HI = '#c3bbf5';
const CYAN = '#22d3ee';

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

// ---- layout ----
const W = 640, H = 360;
const XC = 290, YC = 180; // merge point = logo tile centre
const X0 = 110; // source node rest position
const LEAD_X = 12; // straight lead starts here (card: off-frame -22)
const K = (XC - X0) / 258; // card cubic span is 258 (74→332); scale its control points by K
const NODE = 34; // source node diameter (card: 44, reduced for six rows)
const CARD_X = 410, CARD_W = 200, CARD_H = 40;

// card timing: 168f window → normalized t
const CARD_FRAMES = 168;
// fan-out window starts as the logo tile finishes forming
const FAN_START = 168;
const LOGO_RESUME = 300;

// ---- logo video timing (SmartVideo_GO_Logo_v2, 30fps, 201f) ----
const LOGO_DOT_FRAME = 8; // single dot
const LOGO_GROW_FROM = 16; // dot → tile outline → play glyph → ring pulse
const LOGO_TILE_FRAME = 45; // tile alone, centred — last clean frame before its ring pulse
const LOGO_END = 201;
const LOGO_RATE = 1.5; // lockup + particles, slightly brisker so the loop stays ~14.5s
const LOGO_W = 360; // video drawn at 360×202.8 design units, centred on the tile
const LOGO_H = (LOGO_W * 338) / 600;
const LOGO_PAN = 320 - XC; // card's closing pan: bring the lockup to frame centre

type Pt = { x: number; y: number };

// ---- icons (24 viewbox, stroked) ----
const ICON: Record<string, React.ReactNode> = {
  branding: (
    <>
      <path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.6-.8 1.6-1.6 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.7-1.6 1.6-1.6H16a5 5 0 0 0 5-5c0-4-4-7.4-9-7.4z" />
      <path d="M7.5 11h.01M10.5 7.5h.01M15 8h.01" />
    </>
  ),
  photos: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2.2" />
      <circle cx="9" cy="10" r="1.8" />
      <path d="M21 16l-5-5L6 20" />
    </>
  ),
  products: (
    <>
      <path d="M21 8l-9-5-9 5v8l9 5 9-5z" />
      <path d="M3 8l9 5 9-5M12 13v8" />
    </>
  ),
  services: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 13h18" />
    </>
  ),
  people: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5M16 4.8a3 3 0 0 1 0 6M21 20c0-2.6-1.5-4.5-3.8-5.2" />
    </>
  ),
  offers: (
    <>
      <path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z" />
      <path d="M7.5 7.5h.01" />
    </>
  ),
  videos: (
    <>
      <rect x="2.5" y="5" width="14" height="14" rx="2.4" />
      <path d="M16.5 10l5-3v10l-5-3" />
    </>
  ),
  ads: (
    <>
      <path d="M3 10v4a1 1 0 0 0 1 1h2l5 4V5L6 9H4a1 1 0 0 0-1 1z" />
      <path d="M15 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" />
    </>
  ),
  graphics: <path d="M12 3l9 5-9 5-9-5zM3 13l9 5 9-5M3 17.5l9 5 9-5" />,
  viral: (
    <path d="M12 21c-3.9 0-7-2.8-7-6.6 0-3.3 2.2-5.3 3.6-7 .4 1.7 1.4 2.9 2.6 3.4C11 7.5 12.3 4.8 14.8 3c-.3 2.6.9 4.3 2.2 6 1.2 1.6 2 3.2 2 5.4 0 3.8-3.1 6.6-7 6.6z" />
  ),
  studios: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
      <path d="M17 13.5v7M13.5 17h7" />
    </>
  ),
};

const Icon: React.FC<{ name: string; size: number; color: string; width?: number }> = ({ name, size, color, width = 1.6 }) => (
  <svg width={Math.max(0.1, size)} height={Math.max(0.1, size)} viewBox="0 0 24 24" fill="none" stroke={color}
    strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">
    {ICON[name]}
  </svg>
);

// ---- sources (left) ----
const SRCS = ['Branding', 'Photos', 'Products', 'Services', 'People', 'Offers'].map((label, i) => ({
  label,
  icon: label.toLowerCase(),
  y: YC + (i - 2.5) * 46,
}));

// ---- outputs (right) ----
const OUTS = [
  { title: 'Videos', line: 'Branded promos from their real assets', icon: 'videos' },
  { title: 'Ads', line: 'High-converting campaigns for their offers', icon: 'ads' },
  { title: 'Graphics', line: 'Cleaned-up, on-brand visuals', icon: 'graphics' },
  { title: 'Viral Campaigns', line: 'Proven concepts, personalized for them', icon: 'viral' },
  { title: '20+ AI Studios', line: 'Every format, one workflow', icon: 'studios' },
].map((o, i) => ({ ...o, y: YC + (i - 2) * 54 }));

// ---- geometry: lead line + cubic, sampled to an arc-length table (pure, deterministic) ----
// Converge path (card): M LEAD,y L X0,y C X0+112K,y X0+140K,YC XC,YC
// Fan-out path (mirror): M XC,YC C XC+dx·(1−140/258),YC XC+dx·(1−112/258),ya xa,ya
const SAMPLES = 1600;
const cubicAt = (p0: Pt, p1: Pt, p2: Pt, p3: Pt, u: number): Pt => {
  const v = 1 - u;
  return {
    x: v * v * v * p0.x + 3 * v * v * u * p1.x + 3 * v * u * u * p2.x + u * u * u * p3.x,
    y: v * v * v * p0.y + 3 * v * v * u * p1.y + 3 * v * u * u * p2.y + u * u * u * p3.y,
  };
};
const mkGeom = (lead: [Pt, Pt] | null, c: [Pt, Pt, Pt, Pt]) => {
  const leadLen = lead ? Math.hypot(lead[1].x - lead[0].x, lead[1].y - lead[0].y) : 0;
  const cum: number[] = [0];
  let prev = c[0], acc = 0;
  for (let k = 1; k <= SAMPLES; k++) {
    const p = cubicAt(c[0], c[1], c[2], c[3], k / SAMPLES);
    acc += Math.hypot(p.x - prev.x, p.y - prev.y);
    cum.push(acc);
    prev = p;
  }
  const len = leadLen + acc;
  const pointAt = (s: number): Pt => {
    const sc = Math.max(0, Math.min(len, s));
    if (lead && sc <= leadLen) return { x: lead[0].x + ((lead[1].x - lead[0].x) * sc) / leadLen, y: lead[0].y };
    const target = sc - leadLen;
    let lo = 0, hi = SAMPLES;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] < target) lo = mid + 1; else hi = mid;
    }
    const i = Math.max(1, lo);
    const s0 = cum[i - 1], s1 = cum[i];
    const u = (i - 1 + (s1 > s0 ? (target - s0) / (s1 - s0) : 0)) / SAMPLES;
    return cubicAt(c[0], c[1], c[2], c[3], u);
  };
  const d = (lead ? `M ${lead[0].x},${lead[0].y} L ${lead[1].x},${lead[1].y} ` : `M ${c[0].x},${c[0].y} `) +
    `C ${c[1].x},${c[1].y} ${c[2].x},${c[2].y} ${c[3].x},${c[3].y}`;
  return { len, pointAt, f0: leadLen / len, d };
};

const IN_GEOMS = SRCS.map((s) =>
  mkGeom(
    [{ x: LEAD_X, y: s.y }, { x: X0, y: s.y }],
    [{ x: X0, y: s.y }, { x: X0 + 112 * K, y: s.y }, { x: X0 + 140 * K, y: YC }, { x: XC, y: YC }],
  ),
);
const OUT_GEOMS = OUTS.map((o) => {
  const dx = CARD_X - XC;
  return mkGeom(null, [
    { x: XC, y: YC },
    { x: XC + dx * (1 - 140 / 258), y: YC },
    { x: XC + dx * (1 - 112 / 258), y: o.y },
    { x: CARD_X, y: o.y },
  ]);
});

const TAIL = 9;
const TAIL_GAP = 0.0055;

// Packet with comet tail, travelling along a geometry at path fraction `ph` (card: 6px head, 2.6 tail radius).
const Packet: React.FC<{ geom: ReturnType<typeof mkGeom>; ph: number; op: number; from: number; reverse?: boolean }> = ({
  geom, ph, op, from, reverse,
}) => {
  if (op <= 0.01) return null;
  const at = (p: number) => geom.pointAt(geom.len * (from + (1 - from) * p));
  const head = at(ph);
  return (
    <>
      {Array.from({ length: TAIL }, (_, j) => TAIL - j).map((j) => {
        const pj = ph - j * TAIL_GAP;
        if (pj < 0 || (reverse && pj > 1)) return null;
        const q = at(pj);
        const r = 2.4 * (1 - j / (TAIL + 1));
        return (
          <div key={j} style={{
            position: 'absolute', left: 0, top: 0, width: r * 2, height: r * 2, borderRadius: '50%', background: ACCENT,
            transform: `translate(${(q.x - r).toFixed(2)}px,${(q.y - r).toFixed(2)}px)`,
            opacity: (op * 0.4 * (1 - j / (TAIL + 1))).toFixed(3),
          }} />
        );
      })}
      <div style={{
        position: 'absolute', left: 0, top: 0, width: 5.5, height: 5.5, borderRadius: '50%',
        background: `radial-gradient(circle at 35% 35%, ${ACCENT_HI}, ${ACCENT})`,
        boxShadow: `0 0 0 1.5px rgba(148,135,214,0.18), 0 0 6px rgba(148,135,214,0.75)`,
        transform: `translate(${(head.x - 2.75).toFixed(2)}px,${(head.y - 2.75).toFixed(2)}px)`,
        opacity: op.toFixed(3),
      }} />
    </>
  );
};

// ---- background: hero black + the two blurred orbs (cyan left, purple right) + grain/vignette ----
const Background: React.FC = () => {
  const f = useCurrentFrame();
  const drift = Math.sin(f / 70) * 6;
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#000' }}>
      <div style={{ position: 'absolute', inset: 0,
        background:
          `radial-gradient(circle at calc(14% + ${drift / 3}px) 30%, rgba(34,211,238,0.16) 0%, rgba(34,211,238,0) 26%),` +
          `radial-gradient(circle at calc(84% - ${drift / 3}px) 62%, rgba(168,85,247,0.18) 0%, rgba(168,85,247,0) 32%)`,
      }} />
      <Vignette strength={0.45} color="#000000" inner={0.5} />
      <Grain opacity={0.07} blend="soft-light" scale={1 / 3} />
    </div>
  );
};

// ---- logo: SmartVideo GO animation, screen-blended so its black plate disappears ----
const LogoVideo: React.FC<{ startFrom: number; rate?: number }> = ({ startFrom, rate = 1 }) => (
  <OffthreadVideo src={staticFile('brand/smartvideo-go-logo.mp4')} startFrom={startFrom} playbackRate={rate} muted
    style={{ width: '100%', height: '100%' }} />
);

export const HeroConverge: React.FC = () => {
  const frame = useCurrentFrame();

  // ===== Part 1: card timeline (normalized over 168f, values from the card) =====
  const t = Math.min(1, frame / (CARD_FRAMES - 1));
  const conv = seg(t, 0.34, 0.74, E.inOutCubic);
  const erase = seg(t, 0.78, 0.9, E.outQuad);
  const pkCycle = (seg(t, 0.1, 0.74, E.linear) * 2) % 1;
  const badgeIn = seg(t, 0.16, 0.26, E.outCubic);
  const labelOut = seg(t, 0.3, 0.4, EASE.out);

  // ===== Part 2: mirrored fan-out (same stagger/draw/packet grammar, local frames) =====
  const u = frame - FAN_START;
  const fanErase = seg(u, 117, 137, E.outQuad);
  const fanPkCycle = (seg(u, 14, 110, E.linear) * 2) % 1;
  const fanPkOn = seg(u, 14, 24) * (1 - seg(u, 104, 114));
  const cardsOut = seg(u, 125, 140, EASE.out);
  const pubIn = seg(u, 60, 72, EASE.out);

  // ===== Part 3: lockup + caption =====
  const pan = seg(frame, LOGO_RESUME, LOGO_RESUME + 30, EASE.smooth);
  const capShow = seg(frame, 340, 352, EASE.out);
  const capInn = seg(frame, 340, 372);
  const outro = seg(frame, 420, 434, EASE.out);

  // plate under the tile: hides curve ends / packets behind the tile while it sits at the merge point
  const plateOn = seg(frame, 128, 150) * (1 - seg(frame, LOGO_RESUME, LOGO_RESUME + 8));

  const CAP_WORDS = 'Videos, ads, graphics & viral campaigns — built for that business.'.split(' ');
  const CAP_ST = 0.78 / CAP_WORDS.length;
  const CAP_WIN = CAP_ST * 1.5;

  return (
    <AbsoluteFill style={{ opacity: 1 - outro }}>
      <DesignStage w={W} h={H} bg="#000">
        <Background />
        <div style={{ position: 'absolute', inset: 0, fontFamily: SANS, WebkitFontSmoothing: 'antialiased' }}>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
            <defs>
              <linearGradient id="in-stroke" gradientUnits="userSpaceOnUse" x1={LEAD_X} y1={0} x2={XC} y2={0}>
                <stop offset="0" stopColor="rgba(255,255,255,0.10)" />
                <stop offset="0.5" stopColor="rgba(255,255,255,0.30)" />
                <stop offset="1" stopColor={ACCENT} />
              </linearGradient>
              <linearGradient id="out-stroke" gradientUnits="userSpaceOnUse" x1={XC} y1={0} x2={CARD_X} y2={0}>
                <stop offset="0" stopColor={ACCENT} />
                <stop offset="1" stopColor="rgba(255,255,255,0.28)" />
              </linearGradient>
            </defs>
            {/* converge curves: dashoffset draw-on, then reverse erase from the source end */}
            {SRCS.map((s, i) => {
              const { len, d } = IN_GEOMS[i];
              const draw = seg(t, 0.04 + i * 0.045, 0.04 + i * 0.045 + 0.17, E.outQuad);
              const off = erase > 0 ? -erase * len : len * (1 - draw);
              return (
                <path key={i} d={d} fill="none" stroke="url(#in-stroke)" strokeWidth={0.9} strokeLinecap="round"
                  strokeDasharray={len} strokeDashoffset={off.toFixed(1)}
                  opacity={(draw * (1 - clamp01((erase - 0.85) / 0.15))).toFixed(3)} />
              );
            })}
            {/* fan-out curves: same draw-on stagger (0.045·168 ≈ 7f, window 0.17·168 ≈ 28f), erase retreats from the tile */}
            {frame >= FAN_START && OUTS.map((o, i) => {
              const { len, d } = OUT_GEOMS[i];
              const draw = seg(u, 4 + i * 7, 4 + i * 7 + 28, E.outQuad);
              const off = fanErase > 0 ? -fanErase * len : len * (1 - draw);
              return (
                <path key={i} d={d} fill="none" stroke="url(#out-stroke)" strokeWidth={0.9} strokeLinecap="round"
                  strokeDasharray={len} strokeDashoffset={off.toFixed(1)}
                  opacity={(draw * (1 - clamp01((fanErase - 0.85) / 0.15))).toFixed(3)} />
              );
            })}
          </svg>

          {/* sources: label + glass node; node slides along its real curve with the three-stage shrink */}
          {frame < CARD_FRAMES && SRCS.map((s, i) => {
            const { len, pointAt, f0 } = IN_GEOMS[i];
            const frac = f0 + (1 - f0) * conv;
            const pt = pointAt(len * frac);
            const size = conv < 0.75 ? lerp(conv / 0.75, NODE, 12) : lerp((conv - 0.75) / 0.25, 12, 0);
            const appear = seg(t, 0.02 + i * 0.03, 0.02 + i * 0.03 + 0.1, EASE.overshoot);
            const appearOp = seg(t, 0.02 + i * 0.03, 0.02 + i * 0.03 + 0.06, EASE.out);
            const ph = (pkCycle + i * 0.13) % 1;
            const draw = seg(t, 0.04 + i * 0.045, 0.04 + i * 0.045 + 0.17, E.outQuad);
            const pkOn = seg(t, 0.1, 0.16) * (1 - seg(t, 0.7, 0.76)) * draw;
            const pkOp = pkOn * (1 - Math.abs(ph - 0.5) * 0.6);
            return (
              <React.Fragment key={i}>
                <Packet geom={IN_GEOMS[i]} ph={ph} op={pkOp} from={f0} />
                <div style={{
                  position: 'absolute', left: 0, top: s.y - 15, width: X0 - NODE / 2 - 8, textAlign: 'right',
                  font: `500 9.5px/1 ${SANS}`, color: 'rgba(255,255,255,0.72)', letterSpacing: '-0.005em',
                  opacity: (appearOp * (1 - labelOut)).toFixed(3),
                  transform: `translateX(${(-4 * (1 - appearOp) - 6 * labelOut).toFixed(2)}px)`,
                }}>
                  {s.label}
                </div>
                <div style={{
                  position: 'absolute', left: 0, top: 0, borderRadius: '50%', boxSizing: 'border-box',
                  background: 'radial-gradient(circle at 50% 30%, rgba(255,255,255,0.10), rgba(255,255,255,0.03) 70%), #07070b',
                  border: `0.6px solid ${GLASS_LINE}`,
                  boxShadow: `inset 0 0.5px 0 rgba(255,255,255,0.14), 0 2px 10px rgba(0,0,0,0.6)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: Math.max(0.1, size), height: Math.max(0.1, size),
                  transform: `translate(${(pt.x - size / 2).toFixed(2)}px,${(pt.y - size / 2).toFixed(2)}px) scale(${appear.toFixed(3)})`,
                  opacity: (appearOp * (conv > 0.92 ? clamp01((1 - conv) / 0.08) : 1)).toFixed(3),
                }}>
                  <Icon name={s.icon} size={size * 0.48} color="rgba(255,255,255,0.86)" />
                </div>
              </React.Fragment>
            );
          })}

          {/* fan-out packets + output cards */}
          {frame >= FAN_START && OUTS.map((o, i) => {
            const geom = OUT_GEOMS[i];
            const ph = (fanPkCycle + i * 0.13) % 1;
            const pkOp = fanPkOn * seg(u, 4 + i * 7, 4 + i * 7 + 28, E.outQuad) * (1 - Math.abs(ph - 0.5) * 0.6);
            const reach = 4 + i * 7 + 20; // curve front reaches the card ≈ here
            const pop = seg(u, reach, reach + 14, EASE.overshoot);
            const popOp = seg(u, reach, reach + 8, EASE.out);
            const lit = seg(u, reach, reach + 6) * (1 - seg(u, reach + 8, reach + 30, EASE.out));
            return (
              <React.Fragment key={i}>
                <Packet geom={geom} ph={ph} op={pkOp} from={0} />
                <div style={{
                  position: 'absolute', left: CARD_X, top: o.y - CARD_H / 2, width: CARD_W, height: CARD_H,
                  boxSizing: 'border-box', borderRadius: 10, padding: '0 10px', display: 'flex', alignItems: 'center', gap: 9,
                  background: `linear-gradient(180deg, rgba(255,255,255,0.06), ${GLASS}), rgba(8,8,12,0.72)`,
                  border: `0.6px solid ${lit > 0 ? `rgba(148,135,214,${(0.25 + 0.6 * lit).toFixed(3)})` : GLASS_LINE}`,
                  boxShadow: `inset 0 0.5px 0 rgba(255,255,255,0.10), 0 0 ${(14 * lit).toFixed(1)}px rgba(148,135,214,${(0.35 * lit).toFixed(3)})`,
                  transformOrigin: 'left center',
                  transform: `translateX(${(6 * (1 - popOp)).toFixed(2)}px) scale(${lerp(pop, 0.92, 1).toFixed(3)})`,
                  opacity: (popOp * (1 - cardsOut)).toFixed(3),
                }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 6, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(148,135,214,0.12)', border: '0.5px solid rgba(148,135,214,0.35)',
                  }}>
                    <Icon name={o.icon} size={13} color={ACCENT_HI} width={1.7} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ font: `650 9.5px/1.15 ${SANS}`, color: TXT, letterSpacing: '-0.01em' }}>{o.title}</div>
                    <div style={{ font: `400 7px/1.3 ${SANS}`, color: 'rgba(255,255,255,0.6)', marginTop: 2, whiteSpace: 'nowrap' }}>{o.line}</div>
                  </div>
                </div>
              </React.Fragment>
            );
          })}

          {/* publish tag under the cards */}
          {frame >= FAN_START && (
            <div style={{
              position: 'absolute', left: CARD_X, top: OUTS[OUTS.length - 1].y + CARD_H / 2 + 10,
              display: 'flex', alignItems: 'center', gap: 5, padding: '4px 9px', borderRadius: 999,
              border: `0.6px solid ${GLASS_LINE}`, background: GLASS,
              font: `600 7px/1 ${SANS}`, color: 'rgba(255,255,255,0.75)', letterSpacing: '0.01em',
              opacity: (pubIn * (1 - cardsOut)).toFixed(3), transform: `translateY(${(3 * (1 - pubIn)).toFixed(2)}px)`,
            }}>
              <span style={{ color: CYAN }}>Publish</span>
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>→</span>
              <span>YouTube · Instagram · TikTok</span>
            </div>
          )}

          {/* opaque plate under the tile (card: the merge point must sit on an opaque disc) */}
          <div style={{
            position: 'absolute', left: XC - 25, top: YC - 25, width: 50, height: 50, borderRadius: 12,
            background: '#050508', opacity: plateOn,
          }} />

          {/* logo animation at the merge point; screen blend drops its black background */}
          <div style={{
            position: 'absolute', left: XC - LOGO_W / 2, top: YC - LOGO_H / 2, width: LOGO_W, height: LOGO_H,
            mixBlendMode: 'screen', opacity: badgeIn,
            transform: `translateX(${(pan * LOGO_PAN).toFixed(2)}px)`,
          }}>
            {frame < 124 && (
              <Freeze frame={LOGO_DOT_FRAME}><LogoVideo startFrom={0} /></Freeze>
            )}
            <Sequence from={124} durationInFrames={LOGO_TILE_FRAME - LOGO_GROW_FROM} layout="none">
              <LogoVideo startFrom={LOGO_GROW_FROM} />
            </Sequence>
            <Sequence from={124 + LOGO_TILE_FRAME - LOGO_GROW_FROM} durationInFrames={LOGO_RESUME - (124 + LOGO_TILE_FRAME - LOGO_GROW_FROM)} layout="none">
              <Freeze frame={LOGO_TILE_FRAME}><LogoVideo startFrom={0} /></Freeze>
            </Sequence>
            <Sequence from={LOGO_RESUME} layout="none">
              {frame < LOGO_RESUME + (LOGO_END - LOGO_TILE_FRAME) / LOGO_RATE - 1 ? (
                <LogoVideo startFrom={LOGO_TILE_FRAME} rate={LOGO_RATE} />
              ) : (
                <Freeze frame={LOGO_END - 1}><LogoVideo startFrom={0} /></Freeze>
              )}
            </Sequence>
          </div>

          {/* caption: card's word-by-word deepen, in the landing gradient */}
          <div style={{
            position: 'absolute', left: 0, width: W, top: YC + 40, display: 'flex', justifyContent: 'center', flexWrap: 'nowrap',
            opacity: capShow, transform: `translateY(${((1 - capShow) * 4).toFixed(2)}px)`,
          }}>
            {CAP_WORDS.map((w, i) => {
              const q = clamp01((capInn - i * CAP_ST) / CAP_WIN);
              return (
                <span key={i} style={{
                  font: `600 13px/1.25 ${SANS}`, marginRight: i === CAP_WORDS.length - 1 ? 0 : 3.6,
                  letterSpacing: (-0.012 - 0.02 * (1 - q)).toFixed(4) + 'em',
                  backgroundImage: q > 0 ? 'linear-gradient(90deg, #ffffff 0%, #a5f3fc 42%, #c4b5fd 100%)' : 'none',
                  backgroundSize: `${W}px 100%`, backgroundPosition: `${-i * 30}px 0`,
                  WebkitBackgroundClip: 'text', backgroundClip: 'text',
                  color: q >= 1 ? 'transparent' : q > 0 ? `rgba(255,255,255,${lerp(q, 0.28, 0)})` : DIM,
                }}>
                  {w}
                </span>
              );
            })}
          </div>
        </div>
      </DesignStage>
    </AbsoluteFill>
  );
};

