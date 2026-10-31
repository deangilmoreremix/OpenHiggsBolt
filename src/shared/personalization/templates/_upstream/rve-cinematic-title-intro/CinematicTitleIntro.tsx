// ---------------------------------------------------------------------------
// SMARTVIDEO GO AI — Phase 3 upstream template (repo 2: remotion-templates)
// template id : rve-cinematic-title-intro
// upstream    : https://github.com/deangilmoreremix/remotion-templates (main @ 6209b724798e48ff395f8df1a6fa2d26082372b5)
// upstream src: templates/cinematic-title-intro.tsx
// license     : MIT License (React Video Editor). The upstream repository names
//               no copyright holder; the MIT permission notice ships with the
//               design credit in `templates/designs/rveSharedDesign.tsx`.
//
// DEVIATION RECORD: this file is EDITED. The upstream has no props, so every
// hard-coded string, colour and size became an OPTIONAL prop whose default is
// the upstream literal; rendering with no props reproduces the upstream.
// title/subtitle text, background, accent gradient, colours, font sizes, the
// underline max width and the font family are props (fontFamily is new; the
// upstream sets none). `import React` added for the explicit React.FC type.
// ---------------------------------------------------------------------------
import React from "react";
/**
 * Free Remotion Template Component
 * ---------------------------------
 * This template is free to use in your projects!
 * Credit appreciated but not required.
 *
 * Created by the team at https://www.reactvideoeditor.com
 *
 * Happy coding and building amazing videos! 🎉
 */


import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type CinematicTitleIntroProps = {
  title?: string;
  subtitle?: string;
  background?: string;
  accentGradient?: string;
  titleColor?: string;
  subtitleColor?: string;
  titleFontSize?: string | number;
  subtitleFontSize?: string | number;
  underlineMaxWidth?: number;
  fontFamily?: string;
};

export const CinematicTitleIntro: React.FC<CinematicTitleIntroProps> = ({
  title = "Your Story Begins",
  subtitle = "A Cinematic Experience",
  background = "linear-gradient(135deg, #111827 0%, #1a1a2e 100%)",
  accentGradient = "linear-gradient(90deg, #4361ee, #7209b7)",
  titleColor = "white",
  subtitleColor = "rgba(255, 255, 255, 0.8)",
  titleFontSize = "4rem",
  subtitleFontSize = "1.5rem",
  underlineMaxWidth = 320,
  fontFamily,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleY = spring({
    frame,
    fps,
    from: 50,
    to: 0,
    durationInFrames: 40,
    config: {
      damping: 14,
      mass: 0.8,
    },
  });

  const titleOpacity = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 30,
  });

  const underlineWidth = interpolate(frame, [20, 50], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const subtitleOpacity = interpolate(frame, [40, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background,
        fontFamily,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <h1
        style={{
          color: titleColor,
          fontSize: titleFontSize,
          fontWeight: "bold",
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          margin: 0,
          letterSpacing: "0.05em",
        }}
      >
        {title}
      </h1>
      <div
        style={{
          width: `${underlineWidth}%`,
          maxWidth: underlineMaxWidth,
          height: 4,
          background: accentGradient,
          borderRadius: 2,
          marginTop: 16,
        }}
      />
      <p
        style={{
          color: subtitleColor,
          fontSize: subtitleFontSize,
          fontWeight: 300,
          opacity: subtitleOpacity,
          marginTop: 24,
          letterSpacing: "0.1em",
        }}
      >
        {subtitle}
      </p>
    </div>
  );
}


export default CinematicTitleIntro;
