import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import type { CardDef } from "../types";
import { SEAM_WIPE_SCHEMA, SEAM_BARN_SCHEMA, SEAM_DIP_SCHEMA } from "../cardSchemas";

// Seam transitions placed on the cut between two scenes. The seam is the middle frame:
// the first half covers the outgoing scene, the second half uncovers the incoming one,
// so the real cut happens while the frame is fully covered.

const ease = Easing.inOut(Easing.cubic);
/** 0 → 1 over the first half, 1 → 0 over the second (1 = fully covered at the cut). */
const cover = (frame: number, duration: number) =>
  interpolate(frame, [0, duration / 2, duration], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });

type Dir = "left" | "right" | "up" | "down";

interface WipeProps {
  color?: string;
  dir?: Dir;
  duration?: number;
}

const SeamWipe: React.FC<WipeProps> = ({ color = "#14110f", dir = "right", duration = 16 }) => {
  const frame = useCurrentFrame();
  const half = duration / 2;
  // Enter from `dir`'s opposite edge to cover, leave through `dir`'s edge.
  const t = frame < half
    ? interpolate(frame, [0, half], [-100, 0], { extrapolateRight: "clamp", easing: ease })
    : interpolate(frame, [half, duration], [0, 100], { extrapolateLeft: "clamp", easing: ease });
  const vertical = dir === "up" || dir === "down";
  const sign = dir === "left" || dir === "up" ? -1 : 1;
  const off = t * sign;
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        background: color,
        transform: vertical ? `translateY(${off}%)` : `translateX(${off}%)`,
      }}
    />
  );
};

interface BarnProps {
  color?: string;
  duration?: number;
}

const SeamBarn: React.FC<BarnProps> = ({ color = "#14110f", duration = 16 }) => {
  const frame = useCurrentFrame();
  const c = cover(frame, duration);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "50.2%", background: color, transform: `translateX(${(c - 1) * 100}%)` }} />
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "50.2%", background: color, transform: `translateX(${(1 - c) * 100}%)` }} />
    </AbsoluteFill>
  );
};

interface DipProps {
  color?: string;
  duration?: number;
}

const SeamDip: React.FC<DipProps> = ({ color = "#14110f", duration = 14 }) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{ pointerEvents: "none", background: color, opacity: cover(frame, duration) }} />;
};

const base = { category: "内置卡", categoryEn: "Built-in cards", accent: "#f7c948", durationProp: "duration" } as const;

export const seamWipeCard: CardDef = {
  ...base,
  id: "inkpress-seam-wipe",
  name: "擦除转场",
  nameEn: "Wipe seam",
  durationInFrames: 16,
  component: SeamWipe as React.ComponentType<Record<string, unknown>>,
  summary: "A colour panel sweeps across the cut; the scene changes while it covers the frame.",
  schema: SEAM_WIPE_SCHEMA,
};

export const seamBarnCard: CardDef = {
  ...base,
  id: "inkpress-seam-barn",
  name: "对开门转场",
  nameEn: "Barn-door seam",
  durationInFrames: 16,
  component: SeamBarn as React.ComponentType<Record<string, unknown>>,
  summary: "Two panels close from the sides and open on the next scene.",
  schema: SEAM_BARN_SCHEMA,
};

export const seamDipCard: CardDef = {
  ...base,
  id: "inkpress-seam-dip",
  name: "渐隐转场",
  nameEn: "Dip seam",
  durationInFrames: 14,
  component: SeamDip as React.ComponentType<Record<string, unknown>>,
  summary: "The frame dips into the page colour and comes back on the next scene.",
  schema: SEAM_DIP_SCHEMA,
};
