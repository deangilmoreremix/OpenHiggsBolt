import React from "react";
import { AbsoluteFill, cancelRender, continueRender, delayRender } from "remotion";
import { applyTextOverrides, parseTextMap } from "../lib/textOverrides";
import { LiveTextureContext, textureOverrides } from "../demosrc/_fixtures/liveTexture";
import { adaptedNow, prepareAdapted } from "../lib/adaptedRuntime";
import { AdaptedBoundary, type AdaptedComponent } from "../lib/shotAdapter";

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
  /** Words the recipe draws -> the words to draw instead (see lib/textOverrides). */
  texts?: unknown;
  /** The recipe's source as the shot-adapter agent rewrote it for this site (see lib/adaptLoop). */
  adaptedCode?: string;
  /** Which recipe the adapted source replaces (its exported name). */
  adaptedStem?: string;
}

/** The adapted component of a clip, compiled on demand; frames wait for it (delayRender) so stills and exports never show the plain recipe by mistake. */
const useAdapted = (code: unknown, stem: unknown): AdaptedComponent | null => {
  const src = typeof code === "string" && code ? code : "";
  const name = typeof stem === "string" ? stem : "";
  const [, bump] = React.useReducer((n: number) => n + 1, 0);
  const ready = src ? adaptedNow(src) : null;
  React.useEffect(() => {
    if (!src || ready !== undefined) return;
    const handle = delayRender("adapted shot");
    let live = true;
    prepareAdapted(src, name)
      .then(() => {
        if (live) bump();
      })
      .catch((e) => cancelRender(e))
      .finally(() => continueRender(handle));
    return () => {
      live = false;
    };
  }, [src, name, ready]);
  return ready ?? null;
};

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
      texts,
    } = props as DemoOverlayProps;
    const Adapted = useAdapted((props as DemoOverlayProps).adaptedCode, (props as DemoOverlayProps).adaptedStem);
    const textMap = React.useMemo(() => parseTextMap(texts), [texts]);
    const hasTexts = Object.keys(textMap).length > 0;
    const innerRef = React.useRef<HTMLDivElement>(null);
    // After every commit (animated text changes per frame) swap the recipe's words for the clip's.
    React.useLayoutEffect(() => {
      if (hasTexts && innerRef.current) applyTextOverrides(innerRef.current, textMap);
    });
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
          {hasTexts ? (
            <div ref={innerRef} style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
              {Adapted ? <AdaptedBoundary fallback={<Inner />}><Adapted {...props} /></AdaptedBoundary> : <Inner />}
            </div>
          ) : Adapted ? (
            <AdaptedBoundary fallback={<Inner />}><Adapted {...props} /></AdaptedBoundary>
          ) : (
            <Inner />
          )}
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
