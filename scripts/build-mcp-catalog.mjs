// Emits mcp/catalog.json: a brand-neutral, trimmed model catalog for the SmartVideo GO MCP server.
// Run: node scripts/build-mcp-catalog.mjs
import { writeFileSync } from 'node:fs';
import { getImageInputContract, getAuxiliaryImageInputs } from '../packages/studio/src/imageInputContracts.js';
import * as m from '../packages/studio/src/models.js';

// kind -> [source array, studios that use it] (studio ids match the TABS in components/StandaloneShell.js)
const KINDS = {
  t2i: [m.t2iModels, ['image', 'cinema', 'ai-influencer']],
  i2i: [m.i2iModels, ['image', 'edit', 'ai-influencer']],
  t2v: [m.t2vModels, ['video', 'cinema']],
  i2v: [m.i2vModels, ['video', 'cinema']],
  v2v: [m.v2vModels, ['video', 'edit']],
  lipsync: [m.lipsyncModels, ['lipsync']],
  audio: [m.audioModels, ['audio']],
};

const KEEP = ['type', 'title', 'enum', 'default', 'description', 'minimum', 'maximum', 'required'];
const strip = (s) => String(s ?? '').replace(/mu-?api(\.ai)?/gi, '').trim();

const seen = new Set();
const entries = [];
for (const [kind, [list, studios]] of Object.entries(KINDS)) {
  for (const model of list || []) {
    const key = seen.has(model.id) ? `${model.id}:${kind}` : model.id;
    seen.add(model.id);
    const inputs = {};
    for (const [name, def] of Object.entries(model.inputs || {})) {
      inputs[name] = {};
      for (const k of KEEP) if (def[k] !== undefined) inputs[name][k] = k === 'description' ? strip(def[k]) : def[k];
    }
    // Requirements the app enforces before it calls the backend: model.required, promptRequired and the image-input contracts.
    const req = new Set(Array.isArray(model.required) ? model.required : []);
    if (model.promptRequired) req.add('prompt');
    const mode = kind === 'i2i' ? 'i2i' : kind === 't2i' ? 't2i' : null;
    if (mode) {
      const c = getImageInputContract(model, mode);
      if (c.promptRequired) req.add(c.promptField || 'prompt');
      if (c.primaryImageRequired) req.add(model.imageField || 'image_url');
      for (const a of getAuxiliaryImageInputs(model, mode)) if (a.required) req.add(a.field);
    }
    if (kind === 'i2i' || kind === 'i2v') req.add(model.imageField || 'image_url');
    if (kind === 'v2v') req.add(model.videoField || 'video_url');
    for (const name of req) {
      inputs[name] = { ...(inputs[name] || { type: 'string', title: name }), required: true };
    }
    entries.push({
      key, kind, studios, id: model.id, name: strip(model.name), family: model.family,
      endpoint: model.endpoint || model.id, hasPrompt: model.hasPrompt, imageField: model.imageField, videoField: model.videoField, inputs,
    });
  }
}

// Studios that call a fixed backend route instead of a catalog model (see packages/studio/src/muapi.js).
const S = (title, description) => ({ type: 'string', title, description });
const AR = ['16:9', '9:16', '1:1', '4:3', '3:4', '21:9'];
const fixed = (e) => entries.push({ hasPrompt: true, fixedRoute: true, ...e, key: e.key || e.id, name: e.name, endpoint: e.endpoint });
fixed({ id: 'motion-graphics', kind: 'graphics', studios: ['vibe-motion'], name: 'Motion graphics', endpoint: 'motion-graphics',
  inputs: { prompt: { ...S('Prompt', 'Describe the motion graphic.'), required: true }, aspect_ratio: { type: 'string', title: 'Aspect ratio', enum: AR, default: '16:9' }, duration_seconds: { type: 'integer', title: 'Duration (s)', default: 6 } } });
fixed({ id: 'motion-graphics-edit', kind: 'graphics', studios: ['vibe-motion'], name: 'Motion graphics: edit a previous clip', endpoint: 'motion-graphics-edit', hasPrompt: false,
  inputs: { request_id: { ...S('Request id', 'request_id of the clip to edit.'), required: true }, edit_prompt: { ...S('Edit prompt', 'The change to make.'), required: true }, aspect_ratio: { type: 'string', title: 'Aspect ratio', enum: AR, default: '16:9' }, duration_seconds: { type: 'integer', title: 'Duration (s)', default: 6 } } });
fixed({ id: 'ai-clipping', kind: 'clipping', studios: ['clipping'], name: 'AI Clipping', endpoint: 'ai-clipping', hasPrompt: false,
  inputs: { video_url: { ...S('Video', 'Public https video URL.'), required: true }, num_highlights: { type: 'integer', title: 'Highlights', default: 3 }, aspect_ratio: { type: 'string', title: 'Aspect ratio', enum: AR, default: '9:16' }, return_coordinates_only: { type: 'boolean', title: 'Coordinates only' } } });
for (const [id, endpoint, name] of [['marketing-ad', 'seedance-2-vip-omni-reference', 'Marketing ad (omni reference)'], ['marketing-ad-1080p', 'sd-2-vip-omni-reference-1080p', 'Marketing ad 1080p (omni reference)']]) {
  fixed({ id, kind: 'ad', studios: ['marketing'], name, endpoint,
    inputs: { prompt: { ...S('Prompt', 'Ad concept and shots.'), required: true }, aspect_ratio: { type: 'string', title: 'Aspect ratio', enum: AR, default: '16:9' }, duration: { type: 'integer', title: 'Duration (s)', default: 5 }, images_list: { type: 'array', title: 'Reference images', description: 'Public https image URLs.' }, video_files: { type: 'array', title: 'Reference videos', description: 'Public https video URLs.' } } });
}
fixed({ id: 'layers-decompose', kind: 'i2i', studios: ['layers'], name: 'Layers Studio: split image into layers', endpoint: 'bytedance-seedream-5.0-pro-layer', imageField: 'image_url',
  inputs: { image_url: { ...S('Image', 'Public https image URL.'), required: true }, prompt: S('Prompt', 'Optional guidance.'), resolution: { type: 'string', title: 'Resolution', default: 'auto' }, output_format: { type: 'string', title: 'Format', enum: ['png', 'jpeg', 'webp'], default: 'png' } } });
// Motion control: the app prefixes the prompt with a motion-transfer instruction; the MCP takes the raw fields. The "spicy" variant is not exposed.
for (const mc of m.motionControlModels.filter((x) => !/spicy/i.test(x.id))) {
  fixed({ id: mc.id, kind: 'motion', studios: ['motion-control'], name: mc.name, endpoint: mc.endpoint,
    inputs: { video_url: { ...S('Motion video', 'Public https URL of the reference performance video.'), required: true }, images_list: { type: 'array', title: 'Character images', description: `Public https image URLs (max ${mc.maxImages}).`, required: true },
      prompt: S('Prompt', 'Optional extra direction.'), aspect_ratio: { type: 'string', title: 'Aspect ratio', enum: mc.aspectRatios, default: mc.defaultAspectRatio },
      duration: { type: 'integer', title: 'Duration (s)', default: mc.defaultDuration, minimum: mc.minDuration, maximum: mc.maxDuration }, generate_audio: { type: 'boolean', title: 'Generate audio' } } });
}
for (const rc of m.recastModels) {
  fixed({ id: rc.id, kind: 'recast', studios: ['recast'], name: rc.name, endpoint: rc.endpoint, hasPrompt: !!rc.hasPrompt, imageField: rc.imageField, videoField: rc.videoField || 'video_url',
    inputs: { [rc.videoField || 'video_url']: { ...S('Motion video', 'Public https video URL.'), required: true }, ...(rc.imageField ? { [rc.imageField]: { ...S('Character image', 'Public https image URL.'), required: true } } : {}),
      ...(rc.hasPrompt ? { prompt: S('Prompt', 'Optional direction.') } : {}), aspect_ratio: S('Aspect ratio', 'Optional.'), character_orientation: S('Character orientation', 'Optional.') } });
}

writeFileSync(new URL('../mcp/catalog.json', import.meta.url), JSON.stringify(entries));
console.log(`mcp/catalog.json: ${entries.length} models`);
