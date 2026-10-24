import React from "react";
import { AbsoluteFill } from "remotion";
import { LiveTextureContext, textureOverrides } from "../demosrc/_fixtures/liveTexture";

/**
 * 动效库（demo 卡）的 props 包装层。
 *
 * demo 组件是顶部常量驱动的、不接受任何 props，所以它们在属性面板里是空的
 * （`cards/demoCards.ts` 过去写死 `schema: []`）。这层包装给 150 张 demo 卡
 * 一个真实的属性面：标题文本 / 标题字号 / 标题颜色 / 强调色 / 画面染色。
 *
 * 默认值是空标题 + 0 强度染色，所以**不改变任何现有画面**——只有用户（或
 * Motion Agent）真的改了 props 才会出现覆盖层。
 */

interface DemoOverlayProps {
  title?: string;
  titleSize?: number;
  titleColor?: string;
  accent?: string;
  tint?: string;
  tintOpacity?: number;
  /** Captured product pages (1920 CSS px wide, 2x) for the screenshot-based shots. */
  screens?: string[];
  /** Captured element crops (cards) for the same shots. */
  crops?: string[];
}

const num = (v: unknown, fallback: number) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
};

export const withDemoProps = (
  Inner: React.ComponentType<Record<string, unknown>>,
): React.ComponentType<Record<string, unknown>> => {
  const Wrapped: React.FC<Record<string, unknown>> = (props) => {
    const {
      title = "",
      titleSize = 64,
      titleColor = "#ffffff",
      accent = "#22d3ee",
      tint = "#000000",
      tintOpacity = 0,
      screens,
      crops,
    } = props as DemoOverlayProps;
    const textures = React.useMemo(
      () => textureOverrides(Array.isArray(screens) ? screens : [], Array.isArray(crops) ? crops : []),
      [screens, crops],
    );
    const size = Math.max(8, num(titleSize, 64));
    const wash = Math.min(1, Math.max(0, num(tintOpacity, 0)));
    const label = String(title ?? "").trim();

    return (
      <AbsoluteFill>
        <LiveTextureContext.Provider value={textures}>
          <Inner />
        </LiveTextureContext.Provider>
        {wash > 0 ? (
          <AbsoluteFill style={{ background: tint, opacity: wash, mixBlendMode: "overlay" }} />
        ) : null}
        {label ? (
          <AbsoluteFill
            style={{
              justifyContent: "flex-end",
              alignItems: "flex-start",
              padding: "0 72px 72px",
              pointerEvents: "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <span
                style={{
                  width: Math.max(6, Math.round(size * 0.07)),
                  height: size * 0.86,
                  background: accent,
                  borderRadius: 4,
                  flex: "none",
                }}
              />
              <span
                style={{
                  fontSize: size,
                  fontWeight: 700,
                  lineHeight: 1.08,
                  color: titleColor,
                  fontFamily: "Inter, system-ui, -apple-system, sans-serif",
                  textShadow: "0 2px 18px rgba(0,0,0,0.45)",
                }}
              >
                {label}
              </span>
            </div>
          </AbsoluteFill>
        ) : null}
      </AbsoluteFill>
    );
  };
  Wrapped.displayName = `DemoProps(${Inner.displayName ?? Inner.name ?? "Shot"})`;
  return Wrapped;
};
