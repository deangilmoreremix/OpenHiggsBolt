// 三级跳切推近（jump-cut-punch-in）——节奏剪辑｜戈达尔跳切/纪录片 punch-in。
// FakeDashboard A 固定构图，放大中心钉在第 2 行中间卡（Deploys）中心
// (1071px, 817px)。三次无补间硬切逐级放大：跳变本身刻意零 interpolate，
// 切换帧一帧到位。每次跳切帧叠 2f 整画面 brightness 0.92 加深脉冲当 tick。
// 关键帧：0–34 scale 1.0 → 帧 35 直跳 1.6（35–36 加深脉冲）→ 帧 70 直跳 2.6
// （70–71 加深脉冲）→ 末挡 86–134 全静止（49f ≥45f）。
// 质感：放大走 CSS zoom（布局级缩放，Chromium 按放大后尺寸栅格化，2.6x 字边仍锐，Q2）；
// 前两挡挡内各有 0.8% 极缓漂移推近（in-out，起止无速度突变）让定格不死，跳变仍是硬切；
// 末挡 16f ease-out 收完后真静止。目标卡是 UI 里真实的"选中态"（强调色细环 + 柔晕），
// 第三跳"就是它"时选中环加深一档；暗角随挡位收紧把视线压向目标，全片 4.5% 颗粒。
import React from 'react';
import { AbsoluteFill, Freeze, useCurrentFrame } from 'remotion';
import { G, FakeDashboard } from '../../_fixtures/Fixtures';
import { EASE, Grain, Vignette, mix, ramp } from '../../_fixtures/Polish';
import { useLiveLayout, type LiveLayout } from '../../_textures/LiveLayoutContext';

export const JUMP_CUT_PUNCH_IN_DURATION = 135; // 35f 全景 + 35f 中景 + 65f 末挡（含 49f 真静止）

// 目标卡片（3×2 网格第 2 行中间卡）几何：
// 侧栏 220 + 内边距 36；卡宽 (1920-220-72-56)/3 = 524.67，卡高 (1080-72-72-28)/2 = 454
const CARD_L = 220 + 36 + 524.67 + 28; // ≈808.67
const CARD_T = 72 + 36 + 454 + 28; // 590
const CARD_W = 524.67;
const CARD_H = 454;

/**
 * The card the zoom lands on. The sample's is the dashboard's second-row middle card. On a customer's page the screen is
 * their captured page (FakeDashboard draws its first 1080px at 1:1), so the shot targets one of THEIR cards that is fully
 * on that first screen (the hero when it is, else the biggest that is), with the selection ring drawn around it.
 * With the sample's layout (or a page with no card on the first screen) it is the original card.
 */
const targetOf = (layout: LiveLayout) => {
  const customer = Boolean(layout.source?.mapped.includes('projects.cards'));
  const sample = { l: CARD_L, t: CARD_T, w: CARD_W, h: CARD_H };
  if (!customer) return sample;
  const onScreen = layout.projects.cards.filter((c) => c.y >= 0 && c.y + c.h <= 1060 && c.x >= 0 && c.x + c.w <= 1920);
  const main = layout.projects.cards[layout.projects.main ?? 0];
  const c = onScreen.includes(main) ? main : [...onScreen].sort((a, b) => b.w * b.h - a.w * a.h)[0];
  return c ? { l: c.x, t: c.y, w: c.w, h: c.h } : sample;
};

export const JUMP_1 = 35;
export const JUMP_2 = 70;
export const STEPS = [1.0, 1.6, 2.6]; // 挡差 ≥1.5×，否则读作画面抖了一下

// 三级硬切挡位（零补间）
export const stepAt = (f: number): number => (f < JUMP_1 ? 0 : f < JUMP_2 ? 1 : 2);

// 挡内漂移：前两挡 35f 内 in-out 推 0.8%（活镜头），末挡 16f ease-out 推 0.8% 后静止
const driftAt = (f: number): number => {
  const st = stepAt(f);
  if (st === 0) return mix(1, 1.008, ramp(f, 0, JUMP_1, EASE.smooth));
  if (st === 1) return mix(1, 1.008, ramp(f, JUMP_1, JUMP_2 - JUMP_1, EASE.smooth));
  return mix(1, 1.008, ramp(f, JUMP_2, 16, EASE.out));
};

// 跳切帧 2f 加深脉冲（整画面 brightness 0.92）
const pulseAt = (f: number): number =>
  (f >= JUMP_1 && f <= JUMP_1 + 1) || (f >= JUMP_2 && f <= JUMP_2 + 1) ? 0.92 : 1;

export const JumpCutPunchIn: React.FC = () => {
  const frame = useCurrentFrame();
  const layout = useLiveLayout();
  const T = React.useMemo(() => targetOf(layout), [layout]);
  const ORIGIN_X = T.l + T.w / 2;
  const ORIGIN_Y = T.t + T.h / 2;
  const st = stepAt(frame);
  const s = STEPS[st]; // 挡位倍率：走 CSS zoom（布局级、每挡只变一次）
  const drift = driftAt(frame); // 挡内漂移：走 transform（亚像素平滑，不触发重排）
  const b = pulseAt(frame);

  // 选中环：前两挡安静存在，第三跳"就是它"起 8f ease-out 加深一档（元素层，不动画面）
  const lock = ramp(frame, JUMP_2, 8, EASE.out);
  const ringA = mix(0.42, 0.85, lock);
  const haloA = mix(0.07, 0.14, lock);

  return (
    <AbsoluteFill style={{ background: G.canvas, overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          filter: b < 1 ? `brightness(${b})` : undefined,
          transform: `scale(${drift})`,
          transformOrigin: `${ORIGIN_X}px ${ORIGIN_Y}px`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            // zoom 连自身 left/top 一起放大：left = O/s − O ⇒ 放大中心 O 在屏上不动（同 origin 跳切）
            left: ORIGIN_X / s - ORIGIN_X,
            top: ORIGIN_Y / s - ORIGIN_Y,
            width: 1920,
            height: 1080,
            zoom: s,
          }}
        >
          <FakeDashboard variant="A" />
          {/* 目标卡选中态：强调色 1.5px 细环 + 柔晕，随构图一起放大 */}
          <div
            style={{
              position: 'absolute',
              left: T.l - 5,
              top: T.t - 5,
              width: T.w + 10,
              height: T.h + 10,
              borderRadius: 19,
              border: `1.5px solid rgba(91,99,211,${ringA.toFixed(3)})`,
              boxShadow: `0 0 0 5px rgba(91,99,211,${haloA.toFixed(3)}), 0 18px 48px -18px rgba(91,99,211,${(haloA * 1.6).toFixed(3)})`,
              boxSizing: 'border-box',
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>
      {/* 镜头暗角：挡位越近压得越重，把视线收向目标卡 */}
      <Vignette strength={[0.1, 0.14, 0.18][st]} inner={0.52} color="#1a1c24" cx={ORIGIN_X / 1920} cy={0.56} />
      {/* 颗粒在末挡推完（86f）冻结，末挡尾段像素级真静止 */}
      <Freeze frame={JUMP_2 + 16} active={frame >= JUMP_2 + 16}>
        <Grain opacity={0.045} />
      </Freeze>
    </AbsoluteFill>
  );
};
