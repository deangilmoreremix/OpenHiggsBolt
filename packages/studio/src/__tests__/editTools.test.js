import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../muapi.js', () => {
  const ok = (name) => vi.fn(async (_key, params) => ({ name, params, outputs: ['https://cdn.example.com/out.png'], request_id: 'req-1' }));
  return {
    generateImage: ok('generateImage'),
    generateI2I: ok('generateI2I'),
    generateVideo: ok('generateVideo'),
    generateI2V: ok('generateI2V'),
    processV2V: ok('processV2V'),
    processLipSync: ok('processLipSync'),
    processMotionControl: ok('processMotionControl'),
    generateAudio: ok('generateAudio'),
  };
});

import * as muapi from '../muapi.js';
import {
  EDIT_TOOLS,
  getDefaultEditToolModel,
  getEditToolBySlug,
  getEditToolModels,
} from '../editTools.js';
import {
  buildEditToolParams,
  getEditToolFields,
  getEditToolPrompt,
  getEditToolSlots,
  runEditTool,
  validateEditToolInput,
} from '../editToolRunner.js';

const REQUESTED_TOOLS = [
  'AI Image Generator', 'AI Video Generator', 'Image to Video', 'Image Upscale',
  'Background Remover', 'Watermark Remover', 'Face Swap', 'Product Shot', 'Lip Sync',
  'AI Image Editor', 'AI Video Editor', 'Motion Controls', 'AI Audio & Music', 'Anime Generator',
];

const toolModel = (slug, id) => getEditToolModels(getEditToolBySlug(slug)).find((entry) => entry.model.id === id);

describe('Edit Studio tool registry', () => {
  it('lists the 14 requested tools with unique slugs', () => {
    expect(EDIT_TOOLS.map((tool) => tool.name)).toEqual(REQUESTED_TOOLS);
    expect(new Set(EDIT_TOOLS.map((tool) => tool.slug)).size).toBe(EDIT_TOOLS.length);
  });

  it('resolves at least one model for every tool, and the declared default exists', () => {
    for (const tool of EDIT_TOOLS) {
      const models = getEditToolModels(tool);
      expect(models.length, tool.slug).toBeGreaterThan(0);
      if (tool.defaultModel) {
        expect(getDefaultEditToolModel(tool).model.id, tool.slug).toBe(tool.defaultModel);
      }
    }
  });

  it('derives a usable form for every model of every tool', () => {
    for (const tool of EDIT_TOOLS) {
      for (const { catalog, model } of getEditToolModels(tool)) {
        const slots = getEditToolSlots(catalog, model);
        const prompt = getEditToolPrompt(catalog, model);
        const fields = getEditToolFields(catalog, model);
        expect(slots.length > 0 || prompt.show || fields.length > 0, `${tool.slug}/${model.id} has no inputs`).toBe(true);
        expect(new Set(slots.map((slot) => slot.key)).size).toBe(slots.length);
        const slotKeys = new Set(slots.map((slot) => slot.key));
        for (const field of fields) expect(slotKeys.has(field.key)).toBe(false);
      }
    }
  });
});

describe('Edit Studio runner', () => {
  beforeEach(() => vi.clearAllMocks());

  it('background remover needs an image and sends it as image_url', async () => {
    const { catalog, model } = toolModel('background-remover', 'ai-background-remover');
    expect(getEditToolPrompt(catalog, model).show).toBe(false);
    expect(validateEditToolInput(catalog, model, { uploads: {} })).toMatch(/image/i);

    const uploads = { images_list: ['https://cdn.example.com/in.png'] };
    expect(validateEditToolInput(catalog, model, { uploads })).toBeNull();
    const result = await runEditTool('key', { catalog, model, uploads, values: {} });
    expect(muapi.generateI2I).toHaveBeenCalledTimes(1);
    const params = muapi.generateI2I.mock.calls[0][1];
    expect(params.model).toBe('ai-background-remover');
    expect(params.image_url).toBe('https://cdn.example.com/in.png');
    expect(result.outputs).toEqual([{ url: 'https://cdn.example.com/out.png', type: 'image' }]);
  });

  it('video face swap sends the video and the face image to processV2V', async () => {
    const { catalog, model } = toolModel('face-swap', 'ai-video-face-swap');
    expect(getEditToolSlots(catalog, model).map((slot) => slot.key)).toEqual(['video_url', 'image_url']);
    await runEditTool('key', {
      catalog,
      model,
      uploads: { video_url: ['https://x/v.mp4'], image_url: ['https://x/face.png'] },
      values: {},
    });
    expect(muapi.processV2V.mock.calls[0][1]).toMatchObject({
      model: 'ai-video-face-swap',
      video_url: 'https://x/v.mp4',
      image_url: 'https://x/face.png',
    });
  });

  it('lip sync uses the video + audio slots', () => {
    const { catalog, model } = toolModel('lip-sync', 'sync-lipsync');
    const params = buildEditToolParams(catalog, model, {
      uploads: { video_url: ['https://x/v.mp4'], audio_url: ['https://x/a.mp3'] },
    });
    expect(params).toMatchObject({ model: 'sync-lipsync', video_url: 'https://x/v.mp4', audio_url: 'https://x/a.mp3' });
  });

  it('motion control sends images as a list and its settings', async () => {
    const tool = getEditToolBySlug('motion-controls');
    const { catalog, model } = getEditToolModels(tool).find((entry) => entry.catalog === 'motion');
    await runEditTool('key', {
      catalog,
      model,
      uploads: { video_url: ['https://x/v.mp4'], images_list: ['https://x/1.png', 'https://x/2.png'] },
      values: { duration: 6, mode: 'objects_swap' },
    });
    expect(muapi.processMotionControl.mock.calls[0][1]).toMatchObject({
      video_url: 'https://x/v.mp4',
      images_list: ['https://x/1.png', 'https://x/2.png'],
      duration: 6,
      mode: 'objects_swap',
    });
  });

  it('text tools require a prompt', () => {
    const { catalog, model } = getDefaultEditToolModel(getEditToolBySlug('ai-image-generator'));
    expect(validateEditToolInput(catalog, model, { prompt: '' })).toMatch(/prompt/i);
    expect(validateEditToolInput(catalog, model, { prompt: 'a cat' })).toBeNull();
  });

  it('audio passes the catalog model id separately from a model-version input', () => {
    const { catalog, model } = toolModel('ai-audio-music', 'suno-create-music');
    const params = buildEditToolParams(catalog, model, { prompt: 'song', values: { model: 'V5', style: 'Jazz' } });
    expect(params).toMatchObject({ _modelId: 'suno-create-music', model: 'V5', style: 'Jazz', prompt: 'song' });
  });
});

describe('Edit Studio AI thumbnails', () => {
  it('every tool points at its generated thumbnail and has a generation prompt', async () => {
    const { THUMBNAIL_PROMPTS } = await import('../../../../scripts/generate-edit-tool-thumbnails.mjs');
    expect(Object.keys(THUMBNAIL_PROMPTS).sort()).toEqual(EDIT_TOOLS.map((tool) => tool.slug).sort());
    for (const tool of EDIT_TOOLS) {
      expect(tool.thumbnail).toBe(`/thumbnails/edit-tools/${tool.slug}.webp`);
    }
  });
});
