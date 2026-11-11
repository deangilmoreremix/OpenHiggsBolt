import { describe, it, expect } from 'vitest';
import fixtures from './fixtures/upstream-fixtures.json';
import {
  normalizeBeats, characterSheetPrompt, keyframePrompt, clipPrompt, ttsPayload, narrationText, allShots, MODELS, DEFAULT_TTS_SPEED, UPSTREAM_VOICE, IMAGE_PREFIX,
} from '../zackdPrompts.js';
import { createJobs } from '../jobs.js';
import { planFinalCut } from '../finalCutPlan.js';

const map = normalizeBeats(fixtures.beats, { topic: fixtures.beats.topic });
const shots = allShots(map);
const sheets = map.character_sheets;

describe('prompts and requests match what upstream sends', () => {
  it('character sheets: exact prompt, 16:9, nano-banana-2 first', () => {
    fixtures.character_sheets.forEach((f, i) => {
      expect(sheets[i].id).toBe(f.sheet);
      expect(characterSheetPrompt(sheets[i])).toBe(f.payload.prompt);
      expect(MODELS.image[0]).toBe(f.endpoint);
    });
  });

  it('keyframes: exact prompt with the provider prefix and "Anchored on character sheet refs"', () => {
    expect(fixtures.keyframes).toHaveLength(shots.length);
    fixtures.keyframes.forEach((f, i) => {
      expect(keyframePrompt(shots[i], sheets)).toBe(f.payload.prompt);
      expect(f.payload.prompt.startsWith(IMAGE_PREFIX)).toBe(true);
    });
  });

  it('clips: exact Veo prompt, veo3.1-fast first, through the app\'s own MuAPI client call shape', async () => {
    const seen = [];
    const api = { generateI2V: async (_k, p) => { seen.push(p); return { url: 'https://cdn.example.com/c.mp4' }; } };
    const jobs = createJobs(api, 'KEY');
    for (let i = 0; i < shots.length; i += 1) {
      await jobs.clip({ imageUrl: 'https://cdn.example.com/kf.png', prompt: clipPrompt(shots[i]) });
      const f = fixtures.clips[i];
      expect(seen[i]).toEqual({ model: f.endpoint, prompt: f.payload.prompt, image_url: 'https://cdn.example.com/kf.png', aspect_ratio: f.payload.aspect_ratio, resolution: f.payload.resolution });
    }
    expect(MODELS.clip).toEqual([fixtures.clips[0].endpoint, fixtures.clips[0].fallback_endpoint]);
  });

  it('narration: one call, all beats joined by a space, speed 1.1, the upstream voice is available', () => {
    const [f] = fixtures.audio;
    expect(narrationText(map)).toBe(f.payload.text);
    expect(ttsPayload({ text: narrationText(map), voice: UPSTREAM_VOICE })).toMatchObject({ text: f.payload.text, voice_id: f.payload.voice_id, speed: f.payload.speed });
    expect(DEFAULT_TTS_SPEED).toBe(f.payload.speed);
    expect(MODELS.tts).toBe(f.endpoint);
  });

  it('known, intentional difference: the image fallback is flux-dev-image (upstream flux-dev 404s on MuAPI)', () => {
    expect(fixtures.keyframes[0].fallback_endpoint).toBe('flux-dev');
    expect(MODELS.image[1]).toBe('flux-dev-image');
  });
});

describe('cut length follows upstream (real clip lengths and its transition rule)', () => {
  it('matches upstream\'s total for each recorded layout, within frame rounding', () => {
    for (const sc of Object.values(fixtures.filter_graphs)) {
      const ci = sc.clip_info;
      // upstream: total = sum(d) - sum(min(td, d_i, timeline_i))
      let timeline = ci[0].duration;
      for (let i = 1; i < ci.length; i += 1) { const d = sc.transition_duration > 0 ? Math.min(sc.transition_duration, ci[i].duration, timeline) : 0; timeline += ci[i].duration - d; }
      const plan = planFinalCut(ci.map((c, i) => ({ src: `c${i}`, duration: c.duration })), { transitionSec: sc.transition_duration });
      expect(Math.abs(plan.durationInFrames / 30 - timeline)).toBeLessThan(0.08 * ci.length);
    }
  });
});
