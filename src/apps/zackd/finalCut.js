// In-browser final cut for the Zack D studio, via @remotion/web-renderer (same engine and
// capability checks as src/shared/personalization/webExport.ts). Never throws: failures are
// returned as { ok: false, reason, error }.
import { preferredWebRenderProfile, WEB_RENDER_EXTENSION, WEB_RENDER_MIME_TYPE } from '@/shared/personalization/finalOutput';
import { toPlayablePreviewMediaUrl } from '@/shared/personalization/preview/remoteMedia';
import { planFinalCut } from './finalCutPlan.js';

/** A clip's real length in seconds (upstream ffprobes every clip), or null if the browser cannot tell. */
export function probeDuration(src, timeoutMs = 20000) {
  return new Promise((resolve) => {
    const v = document.createElement('video');
    let settled = false;
    const done = (d) => { if (settled) return; settled = true; v.removeAttribute('src'); v.load?.(); resolve(Number.isFinite(d) && d > 0 ? d : null); };
    v.preload = 'metadata'; v.muted = true;
    v.onloadedmetadata = () => done(v.duration);
    v.onerror = () => done(null);
    setTimeout(() => done(null), timeoutMs);
    v.src = toPlayablePreviewMediaUrl(src); // remote MuAPI hosts go through the same-origin proxy
  });
}

export async function renderFinalCut({ shots, narrationUrl = null, musicUrl = null, keepClipAudio = true, mixVoice = false, trimToPlanned = false, onProgress, signal }) {
  if (typeof window === 'undefined') return { ok: false, reason: 'unsupported-browser', error: 'The final cut is rendered in your browser.' };
  let plan;
  // `shots` carry { src, planned, zoom }; the real length of each clip is measured here, as upstream does with ffprobe.
  const measured = await Promise.all(shots.map((s) => (s.duration > 0 ? s.duration : probeDuration(s.src))));
  const withDurations = shots.map((s, i) => ({ ...s, duration: measured[i] ?? s.planned ?? 3 }));
  const voice = !!(mixVoice && (narrationUrl || musicUrl));
  try { plan = planFinalCut(withDurations, { keepClipAudio, mixVoice: voice, hasNarration: !!(mixVoice && narrationUrl), trimToPlanned }); } catch (e) { return { ok: false, reason: 'bad-input', error: e.message }; }

  let renderer;
  try { renderer = await import('@remotion/web-renderer'); } catch (e) {
    return { ok: false, reason: 'unsupported-browser', error: `Could not load the in-browser video renderer: ${e?.message || e}` };
  }
  const empty = [];
  const [mp4v, webmv] = await Promise.all([
    renderer.getEncodableVideoCodecs('mp4').catch(() => empty),
    renderer.getEncodableVideoCodecs('webm').catch(() => empty),
  ]);
  const profile = preferredWebRenderProfile({ h264: mp4v.includes('h264'), vp9: webmv.includes('vp9'), vp8: webmv.includes('vp8') });
  const audioCodecs = await renderer.getEncodableAudioCodecs(profile.container).catch(() => empty);
  const audioCodec = (profile.container === 'mp4' ? ['aac'] : ['opus', 'vorbis']).find((c) => audioCodecs.includes(c)) || null;
  const hasAudio = plan.keepClipAudio || voice; // clip sound counts: the render must not be muted

  const capability = await renderer.canRenderMediaOnWeb({
    container: profile.container, videoCodec: profile.videoCodec, audioCodec, width: plan.width, height: plan.height, muted: !hasAudio || !audioCodec,
  }).catch((e) => ({ canRender: false, issues: [{ severity: 'error', message: e?.message || 'capability check failed' }] }));
  if (!capability.canRender) {
    return { ok: false, reason: 'unsupported-browser', error: capability.issues.filter((i) => i.severity === 'error').map((i) => i.message).join(' ') || 'This browser cannot encode video.' };
  }

  const { ZackDComposition } = await import('./ZackDComposition.jsx');
  const inputProps = { clips: plan.clips, narrationUrl: voice ? narrationUrl : null, musicUrl: voice ? musicUrl : null, transitions: plan.transitions, keepClipAudio: plan.keepClipAudio, clipVolume: plan.clipVolume };
  try {
    const result = await renderer.renderMediaOnWeb({
      composition: { id: 'ZackDComposition', component: ZackDComposition, width: plan.width, height: plan.height, fps: plan.fps, durationInFrames: plan.durationInFrames, defaultProps: inputProps },
      inputProps,
      container: profile.container,
      videoCodec: profile.videoCodec,
      audioCodec,
      muted: !hasAudio || !audioCodec,
      signal,
      onProgress: ({ progress }) => onProgress?.(Math.min(1, Math.max(0, Number(progress) || 0))),
    });
    return {
      ok: true,
      blob: await result.getBlob(),
      mimeType: WEB_RENDER_MIME_TYPE[profile.container],
      extension: WEB_RENDER_EXTENSION[profile.container],
      warning: hasAudio && !audioCodec ? 'This browser cannot encode audio for the chosen format, so the video has no sound.' : null,
    };
  } catch (e) {
    if (signal?.aborted) return { ok: false, reason: 'cancelled', error: 'Render cancelled.' };
    return { ok: false, reason: 'render-failed', error: e?.message || 'The in-browser render failed.' };
  }
}
