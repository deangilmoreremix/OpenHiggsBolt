/**
 * Adapter for the upstream `bokeh-circles` template.
 *
 * Upstream: `src/components/bokeh-circles/BokehCircles.tsx`
 * (MIT, © 2026 Trimora Inc. / RenderComp).
 *
 * The upstream is a seamless, full-frame particle effect: soft discs that
 * drift over the whole canvas. Its `baseColor` prop is the canvas fill and is
 * forced to `transparent`, and its optional `label` MUST stay `undefined` —
 * the upstream default is the demo string `"Background Demo"`.
 *
 * Stacking-context hazard: the circles use `mix-blend-mode: screen`, which
 * is neutralised by any ancestor with a `transform`, an `opacity < 1`, a
 * `filter` or `isolation`. The composition applies the layer's entrance
 * `transform` and `opacity` to the layer wrapper, and the scale-wrapper adds
 * its own `transform` whenever the box is smaller than the composition.
 *
 * The adapter therefore
 *  - omits the scale transform when the box already is the composition
 *    (the catalog places this design at `scale = 1`), and
 *  - the catalog places it with `animation: 'none'` and `opacity: 1`, so the
 *    composition adds neither a transform nor a reduced opacity.
 *
 * If a blend is neutralised anyway (e.g. the customer moves the layer), the
 * discs still render as soft translucent circles — the effect degrades, it
 * never disappears.
 */

import React from 'react'
import { BokehCircles } from '../_upstream/bokeh-circles/BokehCircles'
import {
  DesignStage,
  TRANSPARENT,
  pickColor,
  type DesignAdapterProps,
} from './shared'

/**
 * Number of discs.
 *
 * The upstream default is 24; over a customer's video that is a very heavy
 * full-frame effect, so the adapter starts lower.
 */
const CIRCLE_COUNT = 16

export const VisualEffectDesign: React.FC<DesignAdapterProps> = (props) => {
  const accent = pickColor([props.colors?.accent], '#ffd1a4')
  const primary = pickColor([props.colors?.primary], '#ffe6c7')
  const text = pickColor([props.colors?.text], '#fff3d6')

  // The upstream assigns a palette entry to each disc pseudo-randomly.
  const palette = [accent, primary, accent, text]

  return (
    <DesignStage designId="visual-effect" props={props}>
      <BokehCircles
        colors={palette}
        baseColor={TRANSPARENT}
        count={CIRCLE_COUNT}
        label={undefined}
        labelColor={pickColor([props.color, text])}
      />
    </DesignStage>
  )
}

export default VisualEffectDesign
