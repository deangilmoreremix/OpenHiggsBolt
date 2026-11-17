// Emits mcp/catalog.json: a brand-neutral, trimmed model catalog for the SmartVideo GO MCP server.
// Run: node scripts/build-mcp-catalog.mjs
import { writeFileSync } from 'node:fs';
import * as m from '../packages/studio/src/models.js';

// kind -> [source array, studios that use it] (studio ids match the TABS in components/StandaloneShell.js)
const KINDS = {
  t2i: [m.t2iModels, ['image', 'cinema', 'marketing', 'ai-influencer', 'storyboard', 'thumbnail-studio']],
  i2i: [m.i2iModels, ['image', 'edit', 'layers', 'ai-influencer', 'thumbnail-studio']],
  t2v: [m.t2vModels, ['video', 'cinema']],
  i2v: [m.i2vModels, ['video', 'cinema', 'vibe-motion']],
  v2v: [m.v2vModels, ['video', 'edit']],
  lipsync: [m.lipsyncModels, ['lipsync']],
  audio: [m.audioModels, ['audio']],
  motion: [m.motionControlModels, ['motion-control']],
  recast: [m.recastModels, ['recast']],
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
    entries.push({
      key, kind, studios, id: model.id, name: strip(model.name), family: model.family,
      endpoint: model.endpoint || model.id, hasPrompt: model.hasPrompt, imageField: model.imageField, videoField: model.videoField, inputs,
    });
  }
}

// Studios that call a fixed backend route instead of a catalog model (see packages/studio/src/muapi.js).
const str = (title, description) => ({ type: 'string', title, description });
entries.push(
  {
    key: 'marketing-ad', kind: 'i2v', studios: ['marketing'], id: 'marketing-ad', name: 'Marketing Studio ad (omni reference)',
    endpoint: 'seedance-2-vip-omni-reference', hasPrompt: true,
    inputs: {
      prompt: str('Prompt', 'Ad concept and shots.'),
      aspect_ratio: { type: 'string', title: 'Aspect ratio', enum: ['16:9', '9:16', '1:1', '4:3', '3:4', '21:9'], default: '16:9' },
      duration: { type: 'integer', title: 'Duration (s)', default: 5, minimum: 4, maximum: 15 },
      images_list: { type: 'array', title: 'Reference images', description: 'Public https image URLs.' },
      video_files: { type: 'array', title: 'Reference videos', description: 'Public https video URLs.' },
    },
  },
  {
    key: 'layers-decompose', kind: 'i2i', studios: ['layers'], id: 'layers-decompose', name: 'Layers Studio: split image into layers',
    endpoint: 'bytedance-seedream-5.0-pro-layer', hasPrompt: true, imageField: 'image_url',
    inputs: {
      image_url: { ...str('Image', 'Public https image URL.'), required: true },
      prompt: str('Prompt', 'Optional guidance for the split.'),
      resolution: { type: 'string', title: 'Resolution', default: 'auto' },
      output_format: { type: 'string', title: 'Format', enum: ['png', 'jpeg', 'webp'], default: 'png' },
    },
  },
);

writeFileSync(new URL('../mcp/catalog.json', import.meta.url), JSON.stringify(entries));
console.log(`mcp/catalog.json: ${entries.length} models`);
