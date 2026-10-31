// ---------------------------------------------------------------------------
// SMARTVIDEO GO AI — Phase 3 upstream template (repo 2: remotion-templates)
// template id : rve-text-highlight
// upstream    : https://github.com/deangilmoreremix/remotion-templates (main @ 6209b724798e48ff395f8df1a6fa2d26082372b5)
// upstream src: templates/text-highlight.tsx
// license     : MIT License (React Video Editor). The upstream repository names
//               no copyright holder; the MIT permission notice ships with the
//               design credit in `templates/designs/rveSharedDesign.tsx`.
//
// DEVIATION RECORD: this file is EDITED. The upstream has no props, so every
// hard-coded string, colour and size became an OPTIONAL prop whose default is
// the upstream literal; rendering with no props reproduces the upstream.
// words, background, highlight gradient, text colour, font size, max width
// and font family are props.
// ---------------------------------------------------------------------------
import React from "react";
/** Free Remotion Template Component
 * ---------------------------------
 * This template is free to use in your projects!
 * Credit appreciated but not required.
 *
 * Created by the team at https://www.reactvideoeditor.com
 *
 * Happy coding and building amazing videos! 🎉
 */


import { useCurrentFrame, interpolate, useVideoConfig } from "remotion";

export type TextHighlightProps = {
  words?: string[];
  background?: string;
  highlight?: string;
  textColor?: string;
  fontSize?: string | number;
  maxWidth?: string | number;
  fontFamily?: string;
};

export const TextHighlight: React.FC<TextHighlightProps> = ({
  words: wordsValue = ["Build", "amazing", "videos", "with", "code"],
  background = "linear-gradient(180deg, #111827, #1f2937)",
  highlight = "linear-gradient(135deg, #3b82f6, #7209b7)",
  textColor = "white",
  fontSize = "3.5rem",
  maxWidth = "700px",
  fontFamily = "Inter, sans-serif",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const words = wordsValue;
  const framesPerWord = Math.floor(fps * 0.6);

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
        fontFamily,
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          gap: "16px",
          maxWidth,
          padding: "40px",
        }}
      >
        {words.map((word, i) => {
          const wordStart = i * framesPerWord;
          const highlightProgress = interpolate(
            frame,
            [wordStart, wordStart + framesPerWord * 0.5],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          const isHighlighted = highlightProgress > 0;

          return (
            <span
              key={i}
              style={{
                position: "relative",
                display: "inline-block",
                fontSize,
                fontWeight: "bold",
                color: textColor,
                padding: "4px 12px",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${highlightProgress * 100}%`,
                  background: highlight,
                  borderRadius: "6px",
                  zIndex: 0,
                  opacity: isHighlighted ? 0.85 : 0,
                }}
              />
              <span style={{ position: "relative", zIndex: 1 }}>{word}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}


export default TextHighlight;
