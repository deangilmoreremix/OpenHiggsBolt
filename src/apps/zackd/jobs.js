// Zack D studio: media jobs on top of the app's own MuAPI client (packages/studio/src/muapi.js).
// `api` is injected so the fallback / placeholder logic is unit-testable without the network.
import { MODELS, ASPECT_RATIO, CAPTION_LANGUAGES, CAPTION_THEMES, DEFAULT_CAPTION_LANGUAGE, DEFAULT_CAPTION_THEME, ttsPayload, isPlaceholderUrl } from './zackdPrompts.js';

export class ZackDJobError extends Error {
  constructor(message, code) { super(message); this.name = 'ZackDJobError'; this.code = code; }
}

const outputOf = (res) => res?.url || res?.outputs?.[0] || res?.output?.url || null;

/** Try each model in order; a thrown error or a placeholder/empty output moves on to the next one. */
async function withFallback(models, run) {
  let last = null;
  for (const model of models) {
    try {
      const url = outputOf(await run(model));
      if (url && !isPlaceholderUrl(url)) return { url, model };
      last = new ZackDJobError('The service returned a placeholder instead of generated media (sandbox or unsupported key).', 'placeholder');
    } catch (e) {
      if (e?.name === 'AbortError') throw e;
      if (/\b(401|403)\b/.test(String(e?.message))) throw new ZackDJobError('MuAPI rejected your API key, or the account is out of credit.', 'bad_key');
      last = e;
    }
  }
  if (last instanceof ZackDJobError) throw last;
  const detail = String(last?.message || 'unknown error').replace(/^Generation failed:\s*/i, '').slice(0, 140);
  throw new ZackDJobError(/failed/i.test(detail) ? detail : `Generation failed: ${detail}`, 'failed');
}

export function createJobs(api, apiKey) {
  return {
    // `onRequestId(id)` reports the MuAPI request id so the studio can resume the job after a reload.
    image: ({ prompt, aspect = ASPECT_RATIO, onRequestId }) =>
      withFallback(MODELS.image, (model) => api.generateImage(apiKey, { model, prompt, aspect_ratio: aspect, ...(onRequestId ? { onRequestId } : {}) })),
    clip: ({ imageUrl, prompt, onRequestId }) =>
      withFallback(MODELS.clip, (model) => api.generateI2V(apiKey, { model, prompt, image_url: imageUrl, aspect_ratio: ASPECT_RATIO, resolution: '720p', ...(onRequestId ? { onRequestId } : {}) })),
    narration: ({ text, voice, speed, onRequestId }) =>
      withFallback([MODELS.tts], (model) => api.generateAudio(apiKey, { _modelId: model, ...ttsPayload({ text, voice, speed }), ...(onRequestId ? { onRequestId } : {}) })),
    // Burned-in captions on an already-hosted (public https) video.
    captions: ({ videoUrl, language, theme }) => {
      if (!/^https:\/\/\S{4,2000}$/.test(String(videoUrl || ''))) return Promise.reject(new ZackDJobError('The video must be uploaded first (public https URL).', 'bad_input'));
      return withFallback([MODELS.captions], () => api.generateCaptions(apiKey, {
        video_url: videoUrl,
        language: CAPTION_LANGUAGES.includes(language) ? language : DEFAULT_CAPTION_LANGUAGE,
        theme: CAPTION_THEMES.some((t) => t.value === theme) ? theme : DEFAULT_CAPTION_THEME,
      }));
    },
    music: ({ prompt, duration, onRequestId }) =>
      withFallback(['suno-create-music'], (model) => api.generateAudio(apiKey, { _modelId: model, prompt, duration: Math.min(Math.max(Number(duration) || 30, 10), 180), ...(onRequestId ? { onRequestId } : {}) })),
  };
}

/** Run `fn` over items with at most `limit` in flight; per-item errors come back as results. */
export async function pool(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next; next += 1;
      try { results[i] = { ok: true, value: await fn(items[i], i) }; } catch (error) { results[i] = { ok: false, error }; }
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
