// ---------------------------------------------------------------------------
// SMARTVIDEO GO AI — Phase 4, batch 3d: NOT UPSTREAM CODE.
// template id : brito-promo (local replacement for `@remotion/transitions`)
//
// The upstream PromoTemplate (remotion-video-templates, MIT — Copyright (c)
// 2026 Alejandro Brito) chains its scenes with `@remotion/transitions`:
//
//     import { TransitionSeries, linearTiming } from "@remotion/transitions";
//     import { fade } from "@remotion/transitions/fade";
//     import { slide } from "@remotion/transitions/slide";
//
// That package is NOT installed in this app and must not be added, so this
// module re-implements exactly the subset of its API the template uses, on
// top of plain remotion `<Sequence>` + `interpolate()`:
//
//   - `<TransitionSeries>` with `.Sequence` and `.Transition` children. As in
//     the real package, a transition OVERLAPS the two neighbouring sequences
//     by its duration, so the total length is
//       Σ sequence durations − Σ transition durations
//     (the formula the template's own `calculateMetadata` uses);
//   - `linearTiming({ durationInFrames })` — linear progress 0 → 1;
//   - `slide({ direction })` — the entering scene slides in from the given
//     edge while the exiting scene is pushed out of the opposite edge, both
//     by 100 % of the frame (the package's default "push" look);
//   - `fade()` — the entering scene fades in (opacity 0 → 1) on top of the
//     exiting scene, which stays fully opaque (the package's default:
//     `shouldFadeOutExitingScene: false`).
//
// The entering scene is always rendered after (on top of) the exiting one,
// and each scene's `useCurrentFrame()` starts at 0 when the scene first
// appears — the same frame semantics as the real `TransitionSeries`.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from "remotion";

export type SlideDirection = "from-left" | "from-right" | "from-top" | "from-bottom";

export type TransitionPresentation =
  | { kind: "slide"; direction: SlideDirection }
  | { kind: "fade" };

export type TransitionTiming = { durationInFrames: number };

/** Linear timing: progress goes 0 → 1 linearly over `durationInFrames`. */
export const linearTiming = (options: { durationInFrames: number }): TransitionTiming => ({
  durationInFrames: Math.max(0, Math.round(options.durationInFrames)),
});

/** Push slide. The package's default direction is "from-left". */
export const slide = (options: { direction?: SlideDirection } = {}): TransitionPresentation => ({
  kind: "slide",
  direction: options.direction ?? "from-left",
});

/** Cross-fade where only the entering scene fades. */
export const fade = (): TransitionPresentation => ({ kind: "fade" });

type SequenceProps = {
  durationInFrames: number;
  children?: React.ReactNode;
};

type TransitionProps = {
  presentation: TransitionPresentation;
  timing: TransitionTiming;
};

/** Marker element; rendered by `TransitionSeries`, never on its own. */
const SeriesSequence: React.FC<SequenceProps> = () => null;
/** Marker element; rendered by `TransitionSeries`, never on its own. */
const SeriesTransition: React.FC<TransitionProps> = () => null;

type Edge = { presentation: TransitionPresentation; durationInFrames: number };

/** Style of a scene `p` (0..1) of the way through entering or exiting. */
function presentationStyle(
  edge: Edge,
  p: number,
  direction: "entering" | "exiting",
): React.CSSProperties {
  if (edge.presentation.kind === "fade") {
    return direction === "entering" ? { opacity: p } : {};
  }
  const d = edge.presentation.direction;
  // Entering: from the named edge to 0. Exiting: from 0 to the opposite edge.
  const sign = d === "from-right" || d === "from-bottom" ? 1 : -1;
  const offset = direction === "entering" ? sign * (1 - p) * 100 : -sign * p * 100;
  const horizontal = d === "from-left" || d === "from-right";
  return {
    transform: horizontal ? `translateX(${offset}%)` : `translateY(${offset}%)`,
  };
}

const SceneLayer: React.FC<{
  durationInFrames: number;
  enter: Edge | null;
  exit: Edge | null;
  children?: React.ReactNode;
}> = ({ durationInFrames, enter, exit, children }) => {
  const frame = useCurrentFrame();
  let style: React.CSSProperties = {};
  if (enter && enter.durationInFrames > 0 && frame < enter.durationInFrames) {
    const p = interpolate(frame, [0, enter.durationInFrames], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    style = presentationStyle(enter, p, "entering");
  } else if (exit && exit.durationInFrames > 0) {
    const start = durationInFrames - exit.durationInFrames;
    if (frame >= start) {
      const p = interpolate(frame, [start, durationInFrames], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      style = presentationStyle(exit, p, "exiting");
    }
  }
  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};

type Scene = {
  key: React.Key;
  from: number;
  durationInFrames: number;
  enter: Edge | null;
  exit: Edge | null;
  children?: React.ReactNode;
};

/** Lays the scenes out on the timeline, overlapping them at transitions. */
export function layoutTransitionSeries(children: React.ReactNode): Scene[] {
  const scenes: Scene[] = [];
  let cursor = 0;
  let pending: Edge | null = null;
  React.Children.toArray(children).forEach((child, index) => {
    if (!React.isValidElement(child)) return;
    if (child.type === SeriesTransition) {
      const props = child.props as TransitionProps;
      const edge: Edge = {
        presentation: props.presentation,
        durationInFrames: props.timing.durationInFrames,
      };
      const previous = scenes[scenes.length - 1];
      if (previous) previous.exit = edge;
      cursor -= edge.durationInFrames;
      pending = edge;
      return;
    }
    if (child.type === SeriesSequence) {
      const props = child.props as SequenceProps;
      const duration = Math.max(1, Math.round(props.durationInFrames));
      scenes.push({
        key: child.key ?? index,
        from: Math.max(0, cursor),
        durationInFrames: duration,
        enter: pending,
        exit: null,
        children: props.children,
      });
      cursor = Math.max(0, cursor) + duration;
      pending = null;
    }
  });
  return scenes;
}

const TransitionSeriesRoot: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const scenes = layoutTransitionSeries(children);
  return (
    <>
      {scenes.map((scene) => (
        <Sequence key={scene.key} from={scene.from} durationInFrames={scene.durationInFrames}>
          <SceneLayer
            durationInFrames={scene.durationInFrames}
            enter={scene.enter}
            exit={scene.exit}
          >
            {scene.children}
          </SceneLayer>
        </Sequence>
      ))}
    </>
  );
};

export const TransitionSeries = Object.assign(TransitionSeriesRoot, {
  Sequence: SeriesSequence,
  Transition: SeriesTransition,
});
