/**
 * Adapter for the upstream `starfield` template.
 *
 * Upstream: `src/components/starfield/Starfield.tsx`
 * (MIT, © 2026 Trimora Inc. / RenderComp).
 *
 * The upstream is a full-frame particle field: stars stream radially outward
 * from the centre of the composition. Its `baseColor` prop is the canvas fill
 * and is forced to `transparent` (it is consumed as a plain `backgroundColor`,
 * so `"transparent"` is safe — see A6's contract addition C4).
 *
 * Two upstream values must never be reachable:
 *  - `baseColor` defaults to the opaque `#02030a` canvas;
 *  - `label` defaults to the demo string `"BACKGROUND"`, so the adapter always
 *    passes `undefined` and the upstream renders no label at all.
 *
 * The design is placed full-frame (`scale = 1`, `animation: 'none'`,
 * `opacity: 1`) because it is a whole-canvas effect. The upstream uses no
 * `mix-blend-mode` and no `filter`, so it does not suffer the stacking-context
 * trap that `bokeh-circles` has — it rasterises identically in the browser
 * export.
 */

import React from 'react'
import { Starfield } from '../_upstream/starfield-warp/Starfield'
import { useDesignFonts } from './fonts'
import {
  DesignStage,
  TRANSPARENT,
  pickColor,
  type DesignAdapterProps,
} from './shared'

/**
 * The upstream's own motion constants.
 *
 * `STAR_COUNT` is one third of the upstream's 180: every star is an
 * absolutely positioned div with a gradient and a glow, and the effect runs
 * for 150 frames, so 180 shadowed elements per frame is a heavy full-frame
 * effect over a customer's video (the same call the bokeh adapter made with
 * its disc count). 60 streaks still read as a full warp field.
 */
const STAR_COUNT = 60
const WARP_SPEED = 4

export const StarfieldWarpDesign: React.FC<DesignAdapterProps> = (props) => {
  useDesignFonts()

  return (
    <DesignStage designId="starfield-warp" props={props}>
      <Starfield
        count={STAR_COUNT}
        starColor={pickColor(
          [props.colors?.text, props.colors?.accent, props.colors?.primary],
          '#ffffff',
        )}
        baseColor={TRANSPARENT}
        warpSpeed={WARP_SPEED}
        label={undefined}
        labelColor={pickColor([props.color, props.colors?.text], '#ffffff')}
      />
    </DesignStage>
  )
}

export default StarfieldWarpDesign
