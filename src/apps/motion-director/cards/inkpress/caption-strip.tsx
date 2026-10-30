import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import type { CardDef } from "../types";
import { CAPTION_STRIP_SCHEMA } from "../cardSchemas";

// 解说字幕条 · Ink Press —— 参数化版（源出 template/src/aifl/Caption.tsx）
// 屏幕空间等宽小字 + 琥珀方点，8f 上浮入场、尾 8f 淡出（FIXED）。开放文案 / 底距 / 字号 / 颜色。

const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

interface Props {
  text?: string;
  bottom?: number;
  fontSize?: number;
  color?: string;
  accent?: string;
  uppercase?: boolean;
  duration?: number;
}

const CaptionStrip: React.FC<Props> = ({
  text = "SEARCH · FILTER · OPEN",
  bottom = 72,
  fontSize = 22,
  color = "#615c54",
  accent = "#b5651d",
  uppercase = true,
  duration = 60,
}) => {
  const frame = useCurrentFrame();
  const inT = interpolate(frame, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const outT = interpolate(frame, [duration - 8, duration], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom,
          display: "flex",
          justifyContent: "center",
          alignItems: "baseline",
          gap: 14,
          padding: "0 7%",
          textAlign: "center",
          fontFamily: MONO,
          fontSize,
          letterSpacing: "0.06em",
          textTransform: uppercase ? "uppercase" : "none",
          color,
          // Over a busy picture the words need their own ground: a soft halo in the opposite tone.
          textShadow: parseInt(color.replace('#', '').slice(0, 2) || '80', 16) > 140 ? '0 2px 16px rgba(0,0,0,0.55)' : '0 0 18px rgba(255,255,255,0.7)',
          opacity: inT * outT,
          transform: `translateY(${(1 - inT) * 8}px)`,
        }}
      >
        <span style={{ width: Math.round(fontSize * 0.26), height: Math.round(fontSize * 0.26), background: accent, display: "inline-block", flex: "none" }} />
        <span>{text}</span>
      </div>
    </AbsoluteFill>
  );
};

export const captionStripCard: CardDef = {
  id: "inkpress-caption",
  name: "解说字幕条",
  category: "内置卡",
  categoryEn: "Built-in cards",
  durationInFrames: 60,
  accent: "#34c759",
  durationProp: "duration",
  component: CaptionStrip as React.ComponentType<Record<string, unknown>>,
  summary: "底部通栏等宽解说条，琥珀方点引导；透明底，叠在任何镜头上",
  schema: CAPTION_STRIP_SCHEMA,
};
