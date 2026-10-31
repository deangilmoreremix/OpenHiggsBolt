// ---------------------------------------------------------------------------
// SMARTVIDEO GO AI — Phase 3 upstream template (repo 2: remotion-templates)
// template id : rve-logo-typewriter
// upstream    : https://github.com/deangilmoreremix/remotion-templates (main @ 6209b724798e48ff395f8df1a6fa2d26082372b5)
// upstream src: templates/logo-typewriter.tsx
// license     : MIT License (React Video Editor). The upstream repository names
//               no copyright holder; the MIT permission notice ships with the
//               design credit in `templates/designs/rveSharedDesign.tsx`.
//
// DEVIATION RECORD: this file is EDITED. The upstream has no props, so every
// hard-coded string, colour and size became an OPTIONAL prop whose default is
// the upstream literal; rendering with no props reproduces the upstream.
// text, background (upstream: backgroundColor), icon gradient, an optional
// icon image (NEW: the customer's logo replaces the gradient dot), colours,
// sizes and font family are props.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

export type LogoTypewriterProps = {
  text?: string;
  background?: string;
  iconGradient?: string;
  iconImage?: string;
  textColor?: string;
  cursorColor?: string;
  fontSize?: string | number;
  iconSize?: string | number;
  fontFamily?: string;
};

export const LogoTypewriter: React.FC<LogoTypewriterProps> = ({
  text: textValue = "ACME STUDIO",
  background = "#111827",
  iconGradient = "linear-gradient(135deg, #4361ee, #7209b7)",
  iconImage,
  textColor = "white",
  cursorColor = "#3b82f6",
  fontSize = "2rem",
  iconSize = "50px",
  fontFamily = "Inter, sans-serif",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const text = textValue;

  // Icon appears first via spring scale
  const iconScale = spring({
    frame,
    fps,
    config: { damping: 10, stiffness: 150, mass: 0.6 },
  });

  // Typewriter starts after icon settles
  const typeStart = 15;
  const charsPerFrame = 0.15;
  const charsVisible = Math.min(
    Math.floor(Math.max(0, frame - typeStart) * charsPerFrame),
    text.length
  );
  const displayedText = text.slice(0, charsVisible);

  // Blinking cursor
  const cursorVisible = Math.floor(frame / 15) % 2 === 0;
  const showCursor = frame > typeStart && (charsVisible < text.length || cursorVisible);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {/* Icon */}
        <div
          style={{
            width: iconSize,
            height: iconSize,
            borderRadius: "50%",
            background: iconImage ? `center / contain no-repeat url("${iconImage}")` : iconGradient,
            transform: `scale(${iconScale})`,
            flexShrink: 0,
          }}
        />
        {/* Typewriter text */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <span
            style={{
              color: textColor,
              fontSize,
              fontWeight: "bold",
              fontFamily,
              letterSpacing: "0.08em",
              whiteSpace: "pre",
            }}
          >
            {displayedText}
          </span>
          {showCursor && (
            <span
              style={{
                color: cursorColor,
                fontSize,
                fontWeight: "bold",
                fontFamily,
                marginLeft: "2px",
              }}
            >
              |
            </span>
          )}
        </div>
      </div>
    </div>
  );
}


export default LogoTypewriter;
