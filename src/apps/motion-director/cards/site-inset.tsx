/**
 * Site inset — a framed picture of the user's own site (a captured page,
 * card crop or site image) floating in a corner of a shot. Film building adds
 * one to every non-product shot so the site's imagery is on screen in every
 * scene. Pure function of the frame: a short slide-and-fade in, then it holds.
 */
import React from "react";
import { AbsoluteFill, interpolate, staticFile, useCurrentFrame } from "remotion";
import type { CardDef } from "./types";

const src = (file: string): string =>
  /^(?:blob:|data:|https?:\/\/)/i.test(file) ? file : staticFile(file);

type SiteInsetProps = {
  file?: string;
  side?: "left" | "right";
  sizePct?: number;
  label?: string;
  accent?: string;
};

export const SiteInset: React.FC<SiteInsetProps> = ({
  file = "",
  side = "right",
  sizePct = 32,
  label = "",
  accent = "#b5651d",
}) => {
  const frame = useCurrentFrame();
  if (!file) return null;
  const enter = interpolate(frame, [0, 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const from = side === "left" ? -1 : 1;
  const size = `${sizePct}%`;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
        <div
          style={{
          position: "absolute",
          top: "7%",
          [side === "left" ? "left" : "right"]: "4%",
          width: size,
          height: size,
          opacity: enter,
          transform: `translateX(${from * (1 - enter) * 100}px)`,
        }}
      >
        <div
          className="rounded-lg overflow-hidden shadow-lg border border-white/20"
          style={{
            width: "100%",
            height: "100%",
            background: accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src={src(file)}
            alt={label || "Site"}
            style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.9 }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const siteInsetCard: CardDef = {
  id: "site-inset",
  name: "Site inset",
  component: SiteInset,
  category: "effects",
  durationInFrames: 120,
  schema: [
    { type: "text", key: "file", label: "Site image URL", default: "" },
    { type: "select", key: "side", label: "Side", default: "right", options: [{ value: "left", label: "Left" }, { value: "right", label: "Right" }] },
    { type: "number", key: "sizePct", label: "Size %", default: 32, min: 10, max: 80, unit: "%" },
    { type: "text", key: "label", label: "Label", default: "" },
    { type: "color", key: "accent", label: "Accent", default: "#b5651d" },
  ],
};
