// Edit Studio tool registry.
//
// Each entry is one standalone tool ("app") shown as a thumbnail card in the
// Edit tab and opened as its own playground at /studio/edit/<slug>. A tool
// lists the models it can run; every model points at one of the catalogs in
// models.js, and the catalog decides which muapi call runs it (see
// editToolRunner.js). The playground UI is derived from the model schema, so
// adding a tool is a data change only.

import {
  t2iModels,
  t2vModels,
  i2iModels,
  i2vModels,
  v2vModels,
  lipsyncModels,
  motionControlModels,
  audioModels,
} from './models.js';

export const EDIT_CATALOGS = Object.freeze({
  t2i: t2iModels,
  t2v: t2vModels,
  i2i: i2iModels,
  i2v: i2vModels,
  v2v: v2vModels,
  lipsync: lipsyncModels,
  motion: motionControlModels,
  audio: audioModels,
});

/** What a catalog's run produces. */
export const CATALOG_OUTPUT = Object.freeze({
  t2i: 'image',
  i2i: 'image',
  t2v: 'video',
  i2v: 'video',
  v2v: 'video',
  lipsync: 'video',
  motion: 'video',
  audio: 'audio',
});

const byIds = (catalog, ids) => ids.map((id) => ({ catalog, id }));
const where = (catalog, predicate) =>
  EDIT_CATALOGS[catalog].filter(predicate).map((model) => ({ catalog, id: model.id }));
const all = (catalog) => where(catalog, () => true);

export const EDIT_TOOL_CATEGORIES = Object.freeze(['All', 'Image', 'Video', 'Audio']);

export const EDIT_TOOLS = Object.freeze([
  {
    slug: 'ai-image-generator',
    name: 'AI Image Generator',
    hint: 'Text to image with every top model',
    description: 'Describe a picture and generate it with Nano Banana, Flux, GPT Image, Seedream and more.',
    media: 'Image',
    icon: 'sparkles',
    gradient: 'from-fuchsia-500/40 via-purple-600/30 to-indigo-700/40',
    models: () => all('t2i'),
    defaultModel: 'nano-banana',
  },
  {
    slug: 'ai-video-generator',
    name: 'AI Video Generator',
    hint: 'Text to video with Veo, Kling, Seedance',
    description: 'Turn a prompt into a video clip using the latest text-to-video models.',
    media: 'Video',
    icon: 'film',
    gradient: 'from-sky-500/40 via-blue-600/30 to-indigo-800/40',
    models: () => all('t2v'),
    defaultModel: 'veo3.1-fast-text-to-video',
  },
  {
    slug: 'image-to-video',
    name: 'Image to Video',
    hint: 'Animate any still image',
    description: 'Upload a photo and bring it to life as a video, guided by an optional prompt.',
    media: 'Video',
    icon: 'play',
    gradient: 'from-cyan-400/40 via-teal-600/30 to-emerald-800/40',
    models: () => all('i2v'),
    defaultModel: 'kling-v2.6-pro-i2v',
  },
  {
    slug: 'image-upscale',
    name: 'Image Upscale',
    hint: 'Sharpen and enlarge up to 4K',
    description: 'Increase resolution and recover detail in low-quality images.',
    media: 'Image',
    icon: 'expand',
    gradient: 'from-amber-400/40 via-orange-500/30 to-rose-700/40',
    models: () => where('i2i', (model) => /upscal/i.test(model.id)),
    defaultModel: 'ai-image-upscaler',
  },
  {
    slug: 'background-remover',
    name: 'Background Remover',
    hint: 'Clean cut-outs in one click',
    description: 'Remove the background from any image and get a transparent PNG.',
    media: 'Image',
    icon: 'scissors',
    gradient: 'from-lime-400/40 via-green-600/30 to-emerald-800/40',
    models: () => byIds('i2i', ['ai-background-remover']),
  },
  {
    slug: 'watermark-remover',
    name: 'Watermark Remover',
    hint: 'Erase logos, captions and text',
    description: 'Remove watermarks, logos, captions and unwanted text from videos.',
    media: 'Video',
    icon: 'eraser',
    gradient: 'from-slate-300/30 via-slate-500/30 to-slate-800/40',
    models: () => where('v2v', (model) => /watermark-remover/.test(model.id)),
    defaultModel: 'video-watermark-remover',
  },
  {
    slug: 'face-swap',
    name: 'Face Swap',
    hint: 'Swap faces in videos and photos',
    description: 'Replace a face in a video or image with the face from a reference photo.',
    media: 'Video',
    icon: 'face',
    gradient: 'from-pink-400/40 via-rose-600/30 to-red-800/40',
    models: () => [...byIds('v2v', ['ai-video-face-swap']), ...byIds('i2i', ['ai-image-face-swap'])],
  },
  {
    slug: 'product-shot',
    name: 'Product Shot',
    hint: 'Studio scenes for your products',
    description: 'Place a product photo into a professional, on-brand scene.',
    media: 'Image',
    icon: 'box',
    gradient: 'from-yellow-300/40 via-amber-500/30 to-orange-800/40',
    models: () => byIds('i2i', ['ai-product-shot', 'ai-product-photography']),
  },
  {
    slug: 'lip-sync',
    name: 'Lip Sync',
    hint: 'Match lips to any voice track',
    description: 'Sync a video or portrait to an audio track for realistic talking footage.',
    media: 'Video',
    icon: 'mic',
    gradient: 'from-violet-400/40 via-purple-600/30 to-fuchsia-800/40',
    models: () => all('lipsync'),
    defaultModel: 'sync-lipsync',
  },
  {
    slug: 'ai-image-editor',
    name: 'AI Image Editor',
    hint: 'Edit images with a prompt',
    description: 'Change objects, styles, clothes or lighting in a photo by describing the edit.',
    media: 'Image',
    icon: 'wand',
    gradient: 'from-indigo-400/40 via-violet-600/30 to-purple-900/40',
    models: () => where('i2i', (model) => /edit/i.test(model.id)),
    defaultModel: 'nano-banana-edit',
  },
  {
    slug: 'ai-video-editor',
    name: 'AI Video Editor',
    hint: 'Restyle and edit footage',
    description: 'Edit an existing video with a prompt: change the scene, style or subject.',
    media: 'Video',
    icon: 'clapper',
    gradient: 'from-blue-400/40 via-indigo-600/30 to-slate-900/40',
    models: () => where('v2v', (model) => /edit|aleph|remix/i.test(model.id)),
    defaultModel: 'seedance-2.5-video-edit',
  },
  {
    slug: 'motion-controls',
    name: 'Motion Controls',
    hint: 'Transfer motion to new characters',
    description: 'Drive new characters and assets with the motion and camera of a reference video.',
    media: 'Video',
    icon: 'motion',
    gradient: 'from-emerald-400/40 via-cyan-600/30 to-blue-900/40',
    models: () => [...all('motion'), ...where('v2v', (model) => /motion-control/.test(model.id))],
  },
  {
    slug: 'ai-audio-music',
    name: 'AI Audio & Music',
    hint: 'Songs, voices and sound effects',
    description: 'Generate music, speech and sound effects from text.',
    media: 'Audio',
    icon: 'music',
    gradient: 'from-orange-400/40 via-red-500/30 to-pink-800/40',
    models: () => all('audio'),
  },
  {
    slug: 'anime-generator',
    name: 'Anime Generator',
    hint: 'Anime art from text or photos',
    description: 'Create anime-style artwork from a prompt, or turn a photo into Ghibli-style art.',
    media: 'Image',
    icon: 'star',
    gradient: 'from-rose-300/40 via-pink-500/30 to-violet-800/40',
    models: () => [...byIds('t2i', ['ai-anime-generator']), ...byIds('i2i', ['ai-ghibli-style'])],
  },
]);

export function getEditToolBySlug(slug) {
  return EDIT_TOOLS.find((tool) => tool.slug === slug) || null;
}

/** Resolves a tool's model references to `{ catalog, model }`, dropping unknown ids. */
export function getEditToolModels(tool) {
  if (!tool) return [];
  const seen = new Set();
  const resolved = [];
  for (const { catalog, id } of tool.models()) {
    const key = `${catalog}:${id}`;
    if (seen.has(key)) continue;
    const model = EDIT_CATALOGS[catalog]?.find((entry) => entry.id === id);
    if (!model) continue;
    seen.add(key);
    resolved.push({ catalog, model });
  }
  return resolved;
}

export function getDefaultEditToolModel(tool) {
  const models = getEditToolModels(tool);
  return models.find(({ model }) => model.id === tool?.defaultModel) || models[0] || null;
}

export function editToolModelKey(entry) {
  return entry ? `${entry.catalog}:${entry.model.id}` : '';
}
