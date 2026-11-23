// lib/zackdFunction.js
// Zack D for the MCP: request builders for the media steps and the two text steps (trends, beat-map script).
// Media models, voices, caption options and the TTS payload are the studio's own (src/apps/zackd/zackdPrompts.js), so the MCP asks
// for what the studio asks for. The text steps use the user's own OpenAI key (saved in Settings).
//
// Note: the app's Zack D drafts its script offline (a starter beat map the user edits). Generating the script and topic ideas with
// a language model is an MCP addition, modelled on the SmartVid version; it is not something this app's UI does.
import {
  ASPECT_RATIO, MODELS, CAPTION_LANGUAGES, CAPTION_THEMES, DEFAULT_CAPTION_LANGUAGE, DEFAULT_CAPTION_THEME,
  ttsPayload, scriptInstructions, trendInstructions, parseJsonLoose, normalizeBeats,
} from '../src/apps/zackd/zackdPrompts.js';

const IMAGE_ASPECTS = ['9:16', '16:9', '1:1'];
const RESPONSES_MODEL = process.env.OPENAI_RESPONSES_TEXT_MODEL || 'gpt-5.6-sol';
const TIMEOUT_MS = 90_000;
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

/** { models: [endpoint, ...], payload } for one media step, or { error }. Mirrors what src/apps/zackd/jobs.js sends. */
export function buildMedia(body = {}) {
  if (body.kind === 'image') {
    const prompt = String(body.prompt || '').trim();
    if (!prompt) return { error: 'prompt is required' };
    if (prompt.length > 2000) return { error: 'prompt is too long (max 2000 characters)' };
    return { models: MODELS.image, payload: { prompt, aspect_ratio: IMAGE_ASPECTS.includes(body.aspect) ? body.aspect : ASPECT_RATIO } };
  }
  if (body.kind === 'clip') {
    const prompt = String(body.prompt || '').trim();
    const imageUrl = String(body.imageUrl || '').trim();
    if (!prompt) return { error: 'prompt is required' };
    if (!/^https:\/\/[^\s]{4,2000}$/.test(imageUrl)) return { error: 'imageUrl must be an https URL' };
    return { models: MODELS.clip, payload: { image_url: imageUrl, prompt: prompt.slice(0, 2000), aspect_ratio: ASPECT_RATIO, resolution: '720p' } };
  }
  if (body.kind === 'tts') {
    const text = String(body.text || '').trim();
    if (!text) return { error: 'text is required' };
    if (text.length > 3000) return { error: 'text is too long (max 3000 characters)' };
    return { models: [MODELS.tts], payload: ttsPayload({ text, voice: body.voice, speed: body.speed }) };
  }
  if (body.kind === 'music') {
    return { models: ['suno-create-music'], payload: { prompt: String(body.prompt || 'Tense, curious, playful science documentary underscore').slice(0, 500), duration: clamp(Number(body.duration) || 30, 10, 180) } };
  }
  if (body.kind === 'captions') {
    const videoUrl = String(body.videoUrl || '').trim();
    if (!/^https:\/\/[^\s]{4,2000}$/.test(videoUrl)) return { error: 'videoUrl must be an https URL' };
    return {
      models: [MODELS.captions],
      payload: {
        video_url: videoUrl,
        language: CAPTION_LANGUAGES.includes(body.language) ? body.language : DEFAULT_CAPTION_LANGUAGE,
        theme: CAPTION_THEMES.some((t) => t.value === body.theme) ? body.theme : DEFAULT_CAPTION_THEME,
      },
    };
  }
  return { error: 'kind must be image, clip, tts, music or captions' };
}

function extractText(data) {
  if (typeof data?.output_text === 'string' && data.output_text.trim()) return data.output_text.trim();
  return (data?.output || [])
    .filter((o) => o.type === 'message')
    .flatMap((m) => (m.content || []).filter((c) => c.type === 'output_text').map((c) => c.text))
    .join('\n')
    .trim();
}

async function llmJson(instructions, input, { apiKey, fetchImpl = fetch }) {
  let res;
  try {
    res = await fetchImpl('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: RESPONSES_MODEL, instructions, input, store: false }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (e) {
    throw Object.assign(new Error(e?.name === 'TimeoutError' || e?.name === 'AbortError' ? 'The script service timed out.' : 'Could not reach the script service.'), { status: 502 });
  }
  if (!res.ok) {
    const keyProblem = res.status === 401 ? 'OpenAI rejected your API key. Check it in Settings.' : res.status === 429 ? 'Your OpenAI account is rate-limited or out of credit.' : null;
    throw Object.assign(new Error(keyProblem || `The script service returned an error (${res.status}).`), { status: keyProblem ? res.status : 502 });
  }
  const parsed = parseJsonLoose(extractText(await res.json()));
  if (!parsed) throw Object.assign(new Error('The script service returned an unreadable answer. Try again.'), { status: 502 });
  return parsed;
}

const json = (statusCode, body) => ({ statusCode, body: JSON.stringify(body) });

/** Text steps. `keys.openai` is the owner's saved OpenAI key. Returns { statusCode, body } like the gateway's other studios. */
export async function handleText(body, { openai } = {}, { fetchImpl = fetch } = {}) {
  const action = body?.action;
  if (action !== 'trends' && action !== 'script') return json(400, { ok: false, error: { message: 'Unknown action' } });
  if (!openai) return json(401, { ok: false, error: { message: 'This step uses your OpenAI key. Save it in Settings, then try again.' } });
  try {
    if (action === 'trends') {
      const query = String(body.query || '').trim().slice(0, 200);
      const out = await llmJson(trendInstructions(), query ? `Niche or keyword: ${query}` : 'Any strong topics right now.', { apiKey: openai, fetchImpl });
      const topics = (Array.isArray(out.topics) ? out.topics : []).slice(0, 8)
        .map((t) => ({ topic: String(t?.topic || '').slice(0, 160), hook: String(t?.hook || '').slice(0, 300), category: String(t?.category || '').slice(0, 60) }))
        .filter((t) => t.topic);
      return topics.length ? json(200, { ok: true, topics }) : json(502, { ok: false, error: { message: 'No topics came back. Try again.' } });
    }
    const topic = String(body.topic || '').trim().slice(0, 200);
    if (!topic) return json(400, { ok: false, error: { message: 'topic is required' } });
    const out = await llmJson(scriptInstructions({ maxBeats: body.maxBeats }), `Topic: ${topic}`, { apiKey: openai, fetchImpl });
    return json(200, { ok: true, map: normalizeBeats(out, { topic }) });
  } catch (err) {
    return json(err?.status && err.status < 600 ? err.status : 502, { ok: false, error: { message: err?.message || 'Request failed.' } });
  }
}
