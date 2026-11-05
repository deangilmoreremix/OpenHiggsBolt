// In-browser final cut for the Zack D studio, via @remotion/web-renderer (same engine and
// capability checks as src/shared/personalization/webExport.ts). Never throws: failures are
// returned as { ok: false, reason, error }.
import { preferredWebRenderProfile, WEB_RENDER_EXTENSION, WEB_RENDER_MIME_TYPE } from '@/shared/personalization/finalOutput';
import { planFinalCut } from './finalCutPlan.js';

export async function renderFinalCut({ shots, narrationUrl = null, musicUrl = null, onProgress, signal }) {
  if (typeof window === 'undefined') return { ok: false, reason: 'unsupported-browser', error: 'The final cut is rendered in your browser.' };
  let plan;
  try { plan = planFinalCut(shots); } catch (e) { return { ok: false, reason: 'bad-input', error: e.message }; }

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
  const hasAudio = !!(narrationUrl || musicUrl);

  const capability = await renderer.canRenderMediaOnWeb({
    container: profile.container, videoCodec: profile.videoCodec, audioCodec, width: plan.width, height: plan.height, muted: !hasAudio || !audioCodec,
  }).catch((e) => ({ canRender: false, issues: [{ severity: 'error', message: e?.message || 'capability check failed' }] }));
  if (!capability.canRender) {
    return { ok: false, reason: 'unsupported-browser', error: capability.issues.filter((i) => i.severity === 'error').map((i) => i.message).join(' ') || 'This browser cannot encode video.' };
  }

  const { ZackDComposition } = await import('./ZackDComposition.jsx');
  const inputProps = { clips: plan.clips, narrationUrl, musicUrl, transitionFrames: plan.transitionFrames };
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
