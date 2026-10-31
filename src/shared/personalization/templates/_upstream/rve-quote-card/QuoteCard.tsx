// ---------------------------------------------------------------------------
// SMARTVIDEO GO AI — Phase 3 upstream template (repo 2: remotion-templates)
// template id : rve-quote-card
// upstream    : https://github.com/deangilmoreremix/remotion-templates (main @ 6209b724798e48ff395f8df1a6fa2d26082372b5)
// upstream src: templates/quote-card.tsx
// license     : MIT License (React Video Editor). The upstream repository names
//               no copyright holder; the MIT permission notice ships with the
//               design credit in `templates/designs/rveSharedDesign.tsx`.
//
// DEVIATION RECORD: this file is EDITED. The upstream has no props, so every
// hard-coded string, colour and size became an OPTIONAL prop whose default is
// the upstream literal; rendering with no props reproduces the upstream.
// quote, attribution, background (upstream: backgroundColor), colours, sizes,
// max width and both font families are props.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame, interpolate } from "remotion";

export type QuoteCardProps = {
  quote?: string;
  attribution?: string;
  background?: string;
  accentColor?: string;
  textColor?: string;
  attributionColor?: string;
  markSize?: string | number;
  quoteSize?: string | number;
  attributionSize?: string | number;
  maxWidth?: string | number;
  quoteFontFamily?: string;
  fontFamily?: string;
};

export const QuoteCard: React.FC<QuoteCardProps> = ({
  quote = "Design is not just what it looks like. Design is how it works.",
  attribution = "— Steve Jobs",
  background = "#111827",
  accentColor = "#3b82f6",
  textColor = "white",
  attributionColor = "#9ca3af",
  markSize = "6rem",
  quoteSize = "1.8rem",
  attributionSize = "1.1rem",
  maxWidth = "700px",
  quoteFontFamily = "Georgia, serif",
  fontFamily = "Inter, sans-serif",
}) => {
  const frame = useCurrentFrame();

  const quoteMarkOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const textOpacity = interpolate(frame, [10, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const attributionOpacity = interpolate(frame, [30, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const attributionX = interpolate(frame, [30, 45], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "4rem",
        overflow: "hidden",
      }}
    >
      <span
        style={{
          color: accentColor,
          fontSize: markSize,
          fontWeight: 700,
          lineHeight: 1,
          opacity: quoteMarkOpacity,
          fontFamily: quoteFontFamily,
          marginBottom: "1rem",
        }}
      >
        {"\u201C"}
      </span>
      <p
        style={{
          color: textColor,
          fontSize: quoteSize,
          fontWeight: 400,
          lineHeight: 1.6,
          textAlign: "center",
          maxWidth,
          margin: 0,
          opacity: textOpacity,
          fontFamily: quoteFontFamily,
          fontStyle: "italic",
        }}
      >
        {quote}
      </p>
      <p
        style={{
          color: attributionColor,
          fontSize: attributionSize,
          fontWeight: 500,
          margin: 0,
          marginTop: "2rem",
          opacity: attributionOpacity,
          transform: `translateX(${attributionX}px)`,
          fontFamily,
        }}
      >
        {attribution}
      </p>
    </div>
  );
}


export default QuoteCard;
