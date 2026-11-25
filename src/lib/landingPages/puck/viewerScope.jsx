import { ViewerContext } from './context.js';

const VIEWER_KEYS = ['viewerStart', 'viewerEnd', 'viewerPosterAt', 'viewerSubtitles', 'viewerOverlay', 'viewerCtaAt', 'viewerCtaLabel', 'viewerCtaUrl'];

function ViewerScope({ render, props }) {
  const value = {};
  VIEWER_KEYS.forEach((k) => { value[k.slice(6).replace(/^./, (c) => c.toLowerCase())] = props[k]; });
  return <ViewerContext.Provider value={value}>{render(props)}</ViewerContext.Provider>;
}

/** Components that hold a video slot hand their viewer options down to the player. */
export function withViewerOptions(components) {
  for (const comp of Object.values(components)) {
    const orig = comp.render;
    if (typeof orig !== 'function' || !comp.fields?.slotImage || orig.__viewer) continue;
    const wrapped = (props) => <ViewerScope render={orig} props={props} />;
    wrapped.__viewer = true;
    comp.render = wrapped;
  }
  return components;
}
