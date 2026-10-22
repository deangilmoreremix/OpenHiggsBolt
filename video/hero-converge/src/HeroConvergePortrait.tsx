// SmartVideo GO hero — portrait (4:5) cut for phones.
// Part 1 is bezier-source-converge-merge rotated 90°: six sources in a row along the top, each lead drops
// straight down then bends on the card's cubic into the merge point; timing values are the card's, unchanged.
// Part 2: the logo tile pans up (card's closing-pan grammar) and a single rail carries the fan-out down the
// left edge into five full-width cards, so text can be phone-sized. Part 3 matches the landscape cut.
// Design coords 360×450 (DesignStage scales to 1080×1350).
import React from 'react';
import { AbsoluteFill, Freeze, Sequence, useCurrentFrame } from 'remotion';
import { DesignStage, E, lerp, seg } from './lib/Motion';
import { EASE } from './lib/Polish';
import {
  ACCENT, ACCENT_HI, Background, CYAN, DIM, GLASS, GLASS_LINE, Geom, Icon, LOGO_DOT_FRAME, LOGO_END,
  LOGO_GROW_FROM, LOGO_RATE, LOGO_TILE_FRAME, LogoVideo, OUT_COPY, Packet, PersonalizedBadge, Pt, SANS,
  SRC_LABELS, Sparkle, TXT, clamp01, cubicAt,
} from './HeroConverge';

export const PORTRAIT_DURATION = 447;

const W = 360, H = 450;

// ---- part 1 layout (card rotated) ----
const XC = 180, YC = 300; // merge point
const Y0 = 150; // source node rest row
const LEAD_TOP = 116; // lead line starts just under the label
const K = (YC - Y0) / 258; // card cubic span 258 → scale control offsets
const NODE = 34;
const SRCS = SRC_LABELS.map((label, i) => ({ label, icon: label.toLowerCase(), x: 30 + i * 60 }));

// ---- part 2 layout ----
const TOP = { x: 180, y: 64 }; // logo tile centre after the pan up
const TOP_SCALE = 0.8;
const MID = { x: 180, y: 206 }; // lockup centre in part 3
const RAIL_X = 22;
const CARD_X = 40, CARD_W = 306, CARD_H = 48;
const OUTS = OUT_COPY.map((o, i) => ({ ...o, y: 148 + i * 56 }));

// ---- timing ----
const CARD_FRAMES = 168;
const GROW_AT = 124; // dot starts growing as the last node is swallowed (card conv end, t=0.74)
const TILE_AT = GROW_AT + (LOGO_TILE_FRAME - LOGO_GROW_FROM);
const PAN_UP = [146, 176] as const;
const FAN_START = 176;
const LOGO_RESUME = FAN_START + 132;

const LOGO_W = 330;
const LOGO_H = (LOGO_W * 338) / 600;

// ---- generic path: lines + cubics, sampled to an arc-length table (pure, deterministic) ----
type Seg = { k: 'L'; to: Pt } | { k: 'C'; c1: Pt; c2: Pt; to: Pt };
const PER_SEG = 400;
const mkPath = (start: Pt, segs: Seg[], leadSegs = 0) => {
  const pts: Pt[] = [start];
  let cur = start, leadLen = 0;
  segs.forEach((s, si) => {
    const from = cur;
    for (let k = 1; k <= PER_SEG; k++) {
      const u = k / PER_SEG;
      pts.push(s.k === 'L' ? { x: lerp(u, from.x, s.to.x), y: lerp(u, from.y, s.to.y) } : cubicAt(from, s.c1, s.c2, s.to, u));
    }
    if (si < leadSegs) leadLen += Math.hypot(s.to.x - from.x, s.to.y - from.y);
    cur = s.to;
  });
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const len = cum[cum.length - 1];
  const pointAt = (sArc: number): Pt => {
    const s = Math.max(0, Math.min(len, sArc));
    let lo = 0, hi = cum.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] < s) lo = mid + 1; else hi = mid;
    }
    const i = Math.max(1, lo);
    const q = cum[i] > cum[i - 1] ? (s - cum[i - 1]) / (cum[i] - cum[i - 1]) : 0;
    return { x: lerp(q, pts[i - 1].x, pts[i].x), y: lerp(q, pts[i - 1].y, pts[i].y) };
  };
  const d = `M ${start.x},${start.y} ` + segs.map((s) =>
    s.k === 'L' ? `L ${s.to.x},${s.to.y}` : `C ${s.c1.x},${s.c1.y} ${s.c2.x},${s.c2.y} ${s.to.x},${s.to.y}`).join(' ');
  const geom: Geom = { len, pointAt };
  return { ...geom, d, f0: leadLen / len };
};

// converge: lead drops from LEAD_TOP to Y0, then the card's cubic (rotated) into (XC,YC)
const IN_GEOMS = SRCS.map((s) =>
  mkPath({ x: s.x, y: LEAD_TOP }, [
    { k: 'L', to: { x: s.x, y: Y0 } },
    { k: 'C', c1: { x: s.x, y: Y0 + 112 * K }, c2: { x: XC, y: Y0 + 140 * K }, to: { x: XC, y: YC } },
  ], 1),
);
// fan-out: from the tile, bend to the rail, run down, round the corner into the card's left edge
const RAIL_TOP = 124;
const OUT_GEOMS = OUTS.map((o) =>
  mkPath({ x: TOP.x, y: TOP.y }, [
    { k: 'C', c1: { x: TOP.x, y: TOP.y + 40 }, c2: { x: RAIL_X, y: RAIL_TOP - 34 }, to: { x: RAIL_X, y: RAIL_TOP } },
    { k: 'L', to: { x: RAIL_X, y: o.y - 10 } },
    { k: 'C', c1: { x: RAIL_X, y: o.y - 4.5 }, c2: { x: RAIL_X + 4.5, y: o.y }, to: { x: RAIL_X + 10, y: o.y } },
    { k: 'L', to: { x: CARD_X, y: o.y } },
  ]),
);

export const HeroConvergePortrait: React.FC = () => {
  const frame = useCurrentFrame();

  // ===== part 1: card timeline, verbatim =====
  const t = Math.min(1, frame / (CARD_FRAMES - 1));
  const conv = seg(t, 0.34, 0.74, E.inOutCubic);
  const erase = seg(t, 0.78, 0.9, E.outQuad);
  const pkCycle = (seg(t, 0.1, 0.74, E.linear) * 2) % 1;
  const badgeIn = seg(t, 0.16, 0.26, E.outCubic);
  const labelOut = seg(conv, 0.05, 0.25, EASE.out);

  // ===== part 2 =====
  const u = frame - FAN_START;
  const fanErase = seg(u, 117, 137, E.outQuad);
  const fanPkCycle = (seg(u, 14, 110, E.linear) * 2) % 1;
  const fanPkOn = seg(u, 14, 24) * (1 - seg(u, 104, 114));
  const cardsOut = seg(u, 125, 140, EASE.out);
  const pubIn = seg(u, 60, 72, EASE.out);
  const persIn = seg(u, 0, 12, EASE.out);

  // ===== logo camera: merge point → top (fan-out) → centre (lockup) =====
  const up = seg(frame, PAN_UP[0], PAN_UP[1], EASE.smooth);
  const down = seg(frame, LOGO_RESUME, LOGO_RESUME + 30, EASE.smooth);
  const logoX = XC;
  const logoY = lerp(down, lerp(up, YC, TOP.y), MID.y);
  const logoS = lerp(down, lerp(up, 1, TOP_SCALE), 1);
  const plateOn = seg(frame, 128, 150) * (1 - seg(frame, LOGO_RESUME, LOGO_RESUME + 8));

  // ===== part 3 =====
  const capShow = seg(frame, 352, 364, EASE.out);
  const capInn = seg(frame, 352, 384);
  const outro = seg(frame, 432, 446, EASE.out);
  const CAP_WORDS = 'Every video, ad, graphic & campaign — personalized for that business.'.split(' ');
  const CAP_BREAK = CAP_WORDS.indexOf('—'); // line break after the dash
  const CAP_ST = 0.78 / CAP_WORDS.length;
  const CAP_WIN = CAP_ST * 1.5;

  return (
    <AbsoluteFill style={{ opacity: 1 - outro }}>
      <DesignStage w={W} h={H} bg="#000">
        <Background />
        <div style={{ position: 'absolute', inset: 0, fontFamily: SANS, WebkitFontSmoothing: 'antialiased' }}>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
            <defs>
              <linearGradient id="p-in" gradientUnits="userSpaceOnUse" x1={0} y1={LEAD_TOP} x2={0} y2={YC}>
                <stop offset="0" stopColor="rgba(255,255,255,0.10)" />
                <stop offset="0.5" stopColor="rgba(255,255,255,0.30)" />
                <stop offset="1" stopColor={ACCENT} />
              </linearGradient>
              <linearGradient id="p-out" gradientUnits="userSpaceOnUse" x1={0} y1={TOP.y} x2={0} y2={H}>
                <stop offset="0" stopColor={ACCENT} />
                <stop offset="1" stopColor="rgba(255,255,255,0.30)" />
              </linearGradient>
            </defs>
            {frame < CARD_FRAMES && SRCS.map((s, i) => {
              const { len, d } = IN_GEOMS[i];
              const draw = seg(t, 0.04 + i * 0.045, 0.04 + i * 0.045 + 0.17, E.outQuad);
              const off = erase > 0 ? -erase * len : len * (1 - draw);
              return (
                <path key={i} d={d} fill="none" stroke="url(#p-in)" strokeWidth={0.9} strokeLinecap="round"
                  strokeDasharray={len} strokeDashoffset={off.toFixed(1)}
                  opacity={(draw * (1 - clamp01((erase - 0.85) / 0.15))).toFixed(3)} />
              );
            })}
            {frame >= FAN_START && OUTS.map((o, i) => {
              const { len, d } = OUT_GEOMS[i];
              const draw = seg(u, 4 + i * 7, 4 + i * 7 + 28, E.outQuad);
              const off = fanErase > 0 ? -fanErase * len : len * (1 - draw);
              return (
                <path key={i} d={d} fill="none" stroke="url(#p-out)" strokeWidth={0.9} strokeLinecap="round"
                  strokeDasharray={len} strokeDashoffset={off.toFixed(1)}
                  opacity={(draw * (1 - clamp01((fanErase - 0.85) / 0.15))).toFixed(3)} />
              );
            })}
          </svg>

          {/* sources: label over its lead line, node slides down its real curve with the three-stage shrink */}
          {frame < CARD_FRAMES && SRCS.map((s, i) => {
            const g = IN_GEOMS[i];
            const pt = g.pointAt(g.len * (g.f0 + (1 - g.f0) * conv));
            const size = conv < 0.75 ? lerp(conv / 0.75, NODE, 12) : lerp((conv - 0.75) / 0.25, 12, 0);
            const appear = seg(t, 0.02 + i * 0.03, 0.02 + i * 0.03 + 0.1, EASE.overshoot);
            const appearOp = seg(t, 0.02 + i * 0.03, 0.02 + i * 0.03 + 0.06, EASE.out);
            const draw = seg(t, 0.04 + i * 0.045, 0.04 + i * 0.045 + 0.17, E.outQuad);
            const ph = (pkCycle + i * 0.13) % 1;
            const pkOp = seg(t, 0.1, 0.16) * (1 - seg(t, 0.7, 0.76)) * draw * (1 - Math.abs(ph - 0.5) * 0.6);
            return (
              <React.Fragment key={i}>
                <Packet geom={g} ph={ph} op={pkOp} from={g.f0} drawn={draw} />
                <div style={{
                  position: 'absolute', left: s.x - 30, width: 60, top: LEAD_TOP - 19, textAlign: 'center',
                  font: `500 12px/1 ${SANS}`, color: 'rgba(255,255,255,0.8)', whiteSpace: 'nowrap',
                  opacity: (appearOp * (1 - labelOut)).toFixed(3),
                  transform: `translateY(${(3 * (1 - appearOp)).toFixed(2)}px)`,
                }}>
                  {s.label}
                </div>
                <div style={{
                  position: 'absolute', left: 0, top: 0, borderRadius: '50%', boxSizing: 'border-box',
                  background: 'radial-gradient(circle at 50% 30%, rgba(255,255,255,0.10), rgba(255,255,255,0.03) 70%), #07070b',
                  border: `0.6px solid ${GLASS_LINE}`,
                  boxShadow: 'inset 0 0.5px 0 rgba(255,255,255,0.14), 0 2px 10px rgba(0,0,0,0.6)',
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

          {/* personalization tag above the tile while it feeds the cards */}
          {frame >= FAN_START && (
            <div style={{
              position: 'absolute', left: 0, width: W, top: 14, display: 'flex', justifyContent: 'center',
              opacity: (persIn * (1 - cardsOut)).toFixed(3), transform: `translateY(${(3 * (1 - persIn)).toFixed(2)}px)`,
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '4.5px 10px', borderRadius: 999,
                border: '0.6px solid rgba(148,135,214,0.45)', background: 'rgba(148,135,214,0.10)',
                font: `600 11px/1 ${SANS}`, color: ACCENT_HI, whiteSpace: 'nowrap',
              }}>
                <Sparkle size={10} />
                Personalized to their brand
              </div>
            </div>
          )}

          {/* fan-out packets + full-width cards */}
          {frame >= FAN_START && OUTS.map((o, i) => {
            const g = OUT_GEOMS[i];
            const draw = seg(u, 4 + i * 7, 4 + i * 7 + 28, E.outQuad);
            const ph = (fanPkCycle + i * 0.13) % 1;
            const pkOp = fanPkOn * draw * (1 - Math.abs(ph - 0.5) * 0.6);
            const reach = 4 + i * 7 + 20;
            const pop = seg(u, reach, reach + 14, EASE.overshoot);
            const popOp = seg(u, reach, reach + 8, EASE.out);
            const lit = seg(u, reach, reach + 6) * (1 - seg(u, reach + 8, reach + 30, EASE.out));
            return (
              <React.Fragment key={i}>
                <Packet geom={g} ph={ph} op={pkOp} from={0} drawn={draw} />
                <div style={{
                  position: 'absolute', left: CARD_X, top: o.y - CARD_H / 2, width: CARD_W, height: CARD_H,
                  boxSizing: 'border-box', borderRadius: 11, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 10,
                  background: `linear-gradient(180deg, rgba(255,255,255,0.06), ${GLASS}), rgba(8,8,12,0.72)`,
                  border: `0.6px solid ${lit > 0 ? `rgba(148,135,214,${(0.25 + 0.6 * lit).toFixed(3)})` : GLASS_LINE}`,
                  boxShadow: `inset 0 0.5px 0 rgba(255,255,255,0.10), 0 0 ${(14 * lit).toFixed(1)}px rgba(148,135,214,${(0.35 * lit).toFixed(3)})`,
                  transformOrigin: 'left center',
                  transform: `translateX(${(6 * (1 - popOp)).toFixed(2)}px) scale(${lerp(pop, 0.94, 1).toFixed(3)})`,
                  opacity: (popOp * (1 - cardsOut)).toFixed(3),
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(148,135,214,0.12)', border: '0.5px solid rgba(148,135,214,0.35)',
                  }}>
                    <Icon name={o.icon} size={16} color={ACCENT_HI} width={1.7} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                      <div style={{ font: `650 14.5px/1.1 ${SANS}`, color: TXT, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>{o.title}</div>
                      <div style={{ zoom: 1.3 }}>
                        <PersonalizedBadge on={seg(u, reach + 4, reach + 14, EASE.overshoot)} />
                      </div>
                    </div>
                    <div style={{ font: `400 11.5px/1.25 ${SANS}`, color: 'rgba(255,255,255,0.66)', marginTop: 3, whiteSpace: 'nowrap' }}>{o.line}</div>
                  </div>
                </div>
              </React.Fragment>
            );
          })}

          {frame >= FAN_START && (
            <div style={{
              position: 'absolute', left: CARD_X, top: OUTS[OUTS.length - 1].y + CARD_H / 2 + 8,
              display: 'flex', alignItems: 'center', gap: 6, padding: '5px 11px', borderRadius: 999,
              border: `0.6px solid ${GLASS_LINE}`, background: GLASS,
              font: `600 10.5px/1 ${SANS}`, color: 'rgba(255,255,255,0.8)', whiteSpace: 'nowrap',
              opacity: (pubIn * (1 - cardsOut)).toFixed(3), transform: `translateY(${(3 * (1 - pubIn)).toFixed(2)}px)`,
            }}>
              <span style={{ color: CYAN }}>Publish</span>
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>→</span>
              <span>YouTube · Instagram · TikTok</span>
            </div>
          )}

          {/* opaque plate under the tile — follows the logo camera */}
          <div style={{
            position: 'absolute', left: logoX - 25, top: logoY - 25, width: 50, height: 50, borderRadius: 12,
            background: '#050508', opacity: plateOn, transform: `scale(${logoS.toFixed(3)})`,
          }} />

          {/* logo animation (screen-blended), driven by the logo camera */}
          <div style={{
            position: 'absolute', left: logoX - LOGO_W / 2, top: logoY - LOGO_H / 2, width: LOGO_W, height: LOGO_H,
            mixBlendMode: 'screen', opacity: badgeIn, transform: `scale(${logoS.toFixed(3)})`,
          }}>
            {frame < GROW_AT && <Freeze frame={LOGO_DOT_FRAME}><LogoVideo startFrom={0} /></Freeze>}
            <Sequence from={GROW_AT} durationInFrames={TILE_AT - GROW_AT} layout="none">
              <LogoVideo startFrom={LOGO_GROW_FROM} />
            </Sequence>
            <Sequence from={TILE_AT} durationInFrames={LOGO_RESUME - TILE_AT} layout="none">
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

          {/* caption: word-by-word deepen, wraps to two lines */}
          <div style={{
            position: 'absolute', left: 12, width: W - 24, top: MID.y + 44, display: 'flex', flexWrap: 'wrap',
            justifyContent: 'center', rowGap: 4, opacity: capShow, transform: `translateY(${((1 - capShow) * 4).toFixed(2)}px)`,
          }}>
            {CAP_WORDS.map((w, i) => {
              const q = clamp01((capInn - i * CAP_ST) / CAP_WIN);
              return (
                <React.Fragment key={i}>
                <span style={{
                  font: `600 16.5px/1.25 ${SANS}`, marginRight: i === CAP_WORDS.length - 1 ? 0 : 5,
                  letterSpacing: (-0.012 - 0.02 * (1 - q)).toFixed(4) + 'em',
                  backgroundImage: q > 0 ? 'linear-gradient(90deg, #ffffff 0%, #a5f3fc 42%, #c4b5fd 100%)' : 'none',
                  backgroundSize: `${W}px 100%`, backgroundPosition: `${-(i % 6) * 50}px 0`,
                  WebkitBackgroundClip: 'text', backgroundClip: 'text',
                  color: q >= 1 ? 'transparent' : q > 0 ? `rgba(255,255,255,${lerp(q, 0.28, 0)})` : DIM,
                }}>
                  {w}
                </span>
                {i === CAP_BREAK && <span style={{ flexBasis: '100%', height: 0 }} />}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </DesignStage>
    </AbsoluteFill>
  );
};
