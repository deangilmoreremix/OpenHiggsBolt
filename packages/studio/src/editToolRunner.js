// Turns an Edit Studio playground (tool + model + form state) into the
// existing muapi.js calls. Everything the playground renders — upload slots,
// prompt, parameter fields — is derived here from the model schema so the
// UI and the request always agree.

import {
  generateImage,
  generateI2I,
  generateVideo,
  generateI2V,
  processV2V,
  processLipSync,
  processMotionControl,
  generateAudio,
} from './muapi.js';
import { getMediaCapability } from './modelCapabilities.js';
import { getImageInputContract, getAuxiliaryImageInputs } from './imageInputContracts.js';
import { getSupplementalModelInputs } from './modelParameters.js';
import { CATALOG_OUTPUT } from './editTools.js';

const COMMON_FIELD_KEYS = ['aspect_ratio', 'resolution', 'quality', 'duration', 'mode'];

const hasText = (value) => typeof value === 'string' && value.trim().length > 0;

function isListKey(key) {
  return /(?:_list|_urls|_files)$/.test(key);
}

/**
 * Upload slots for a model: `{ key, kind, label, max, required }`.
 * `key` is the request param the uploaded URL(s) are sent as.
 */
export function getEditToolSlots(catalog, model) {
  if (!model) return [];
  const slots = [];
  const image = getMediaCapability(model, 'image');
  const video = getMediaCapability(model, 'video');
  const audio = getMediaCapability(model, 'audio');
  const isRequired = (field) => (model.required || []).includes(field);

  switch (catalog) {
    case 'i2i': {
      const contract = getImageInputContract(model, 'i2i');
      slots.push({
        key: 'images_list',
        kind: 'image',
        label: contract.primaryImageLabel,
        max: Math.max(1, image.maxItems || 1),
        required: true,
      });
      for (const aux of getAuxiliaryImageInputs(model, 'i2i')) {
        slots.push({ key: aux.field, kind: 'image', label: aux.label, max: 1, required: !!aux.required });
      }
      break;
    }
    case 'i2v': {
      if (image.separateLastItem) {
        slots.push({ key: 'image_url', kind: 'image', label: 'Start frame', max: 1, required: true });
        slots.push({ key: 'last_image', kind: 'image', label: 'End frame', max: 1, required: false });
      } else {
        slots.push({
          key: 'images_list',
          kind: 'image',
          label: image.maxItems > 1 ? 'Images' : 'Image',
          max: Math.max(1, image.maxItems || 1),
          required: true,
        });
      }
      if (video.field) slots.push({ key: 'video_url', kind: 'video', label: 'Reference video', max: 1, required: isRequired(video.field) });
      if (audio.field) slots.push({ key: 'audio_url', kind: 'audio', label: 'Audio', max: 1, required: isRequired(audio.field) });
      break;
    }
    case 'v2v': {
      slots.push({ key: 'video_url', kind: 'video', label: 'Source video', max: 1, required: true });
      if (image.field) {
        const faceSwap = /face-swap/.test(model.id);
        const motion = /motion-control/.test(model.id);
        slots.push({
          key: 'image_url',
          kind: 'image',
          label: faceSwap ? 'Face image' : motion ? 'Character image' : 'Reference image',
          max: 1,
          required: faceSwap || motion || isRequired(image.field),
        });
      }
      if (audio.field) slots.push({ key: 'audio_url', kind: 'audio', label: 'Audio', max: 1, required: isRequired(audio.field) });
      break;
    }
    case 'lipsync': {
      if (model.category === 'image') {
        slots.push({ key: 'image_url', kind: 'image', label: 'Portrait image', max: 1, required: true });
      } else {
        slots.push({ key: 'video_url', kind: 'video', label: 'Source video', max: 1, required: true });
      }
      slots.push({ key: 'audio_url', kind: 'audio', label: 'Audio track', max: 1, required: true });
      break;
    }
    case 'motion': {
      slots.push({ key: 'video_url', kind: 'video', label: 'Motion reference video', max: 1, required: true });
      slots.push({
        key: 'images_list',
        kind: 'image',
        label: 'Character / asset images',
        max: Math.max(1, model.maxImages || 1),
        required: true,
      });
      break;
    }
    case 'audio': {
      for (const [kind, capability] of [['image', image], ['video', video], ['audio', audio]]) {
        if (!capability.field) continue;
        slots.push({
          key: capability.field,
          kind,
          label: kind === 'audio' ? 'Source audio' : kind === 'video' ? 'Source video' : 'Image',
          max: capability.isArray ? Math.max(1, capability.maxItems || 1) : 1,
          required: isRequired(capability.field),
        });
      }
      break;
    }
    default:
      break;
  }
  return slots;
}

/** `{ show, required, placeholder }` for the prompt box. */
export function getEditToolPrompt(catalog, model) {
  if (!model) return { show: false, required: false, placeholder: '' };
  switch (catalog) {
    case 't2i': {
      const contract = getImageInputContract(model, 't2i');
      return { show: true, required: true, placeholder: contract.promptPlaceholder };
    }
    case 'i2i': {
      const contract = getImageInputContract(model, 'i2i');
      const show = contract.promptRequired || (model.hasPrompt ?? Boolean(model.inputs?.prompt));
      return { show, required: contract.promptRequired, placeholder: contract.promptPlaceholder };
    }
    case 't2v':
      return { show: model.hasPrompt !== false, required: true, placeholder: 'Describe the video you want to create' };
    case 'i2v':
      return { show: model.hasPrompt !== false, required: !!model.promptRequired, placeholder: 'Describe the motion (optional)' };
    case 'v2v':
      return { show: !!model.hasPrompt, required: !!model.promptRequired, placeholder: 'Describe the edit' };
    case 'lipsync':
      return { show: !!model.hasPrompt, required: false, placeholder: 'Describe the performance (optional)' };
    case 'motion':
      return { show: true, required: false, placeholder: 'Extra direction for the scene (optional)' };
    case 'audio':
      return {
        show: Boolean(model.inputs?.prompt),
        required: (model.required || []).includes('prompt'),
        placeholder: model.inputs?.prompt?.description || 'Describe the audio you want',
      };
    default:
      return { show: false, required: false, placeholder: '' };
  }
}

/** Parameter fields `{ key, schema }` shown under the uploads. */
export function getEditToolFields(catalog, model) {
  if (!model) return [];
  if (catalog === 'motion') {
    const fields = [
      {
        key: 'mode',
        schema: { type: 'string', title: 'Mode', enum: ['motion_transfer', 'objects_swap'], default: 'motion_transfer' },
      },
    ];
    if (model.aspectRatios?.length) {
      fields.push({
        key: 'aspect_ratio',
        schema: { type: 'string', title: 'Aspect Ratio', enum: model.aspectRatios, default: model.defaultAspectRatio || model.aspectRatios[0] },
      });
    }
    fields.push({
      key: 'duration',
      schema: {
        type: 'int',
        title: 'Duration (seconds)',
        minValue: model.minDuration || 4,
        maxValue: model.maxDuration || 15,
        step: 1,
        default: model.defaultDuration || 5,
      },
    });
    if (model.supportsAudio) {
      fields.push({ key: 'generate_audio', schema: { type: 'boolean', title: 'Generate audio', default: false } });
    }
    return fields;
  }

  const slotKeys = new Set(getEditToolSlots(catalog, model).map((slot) => slot.key));
  // The prompt box owns the prompt input (i2i contracts may rename it, e.g.
  // Product Shot's scene_description).
  slotKeys.add('prompt');
  if (catalog === 'i2i') slotKeys.add(getImageInputContract(model, 'i2i').promptField);
  const common = COMMON_FIELD_KEYS
    .filter((key) => model.inputs?.[key] && !slotKeys.has(key))
    .map((key) => ({ key, schema: model.inputs[key] }));
  const commonKeys = new Set(common.map((field) => field.key));
  const supplemental = getSupplementalModelInputs(model).filter(
    ({ key }) => !commonKeys.has(key) && !slotKeys.has(key),
  );
  return [...common, ...supplemental];
}

export function getDefaultEditToolValues(catalog, model) {
  const values = {};
  for (const { key, schema } of getEditToolFields(catalog, model)) {
    if (schema.default !== undefined) values[key] = schema.default;
    else if (schema.type === 'boolean') values[key] = false;
    else if (schema.type === 'array') values[key] = [];
    else values[key] = '';
  }
  return values;
}

/** First problem with the form, or null when it can be submitted. */
export function validateEditToolInput(catalog, model, { prompt = '', uploads = {} } = {}) {
  if (!model) return 'Choose a model.';
  for (const slot of getEditToolSlots(catalog, model)) {
    if (slot.required && !(uploads[slot.key] || []).some(hasText)) {
      return `Please add: ${slot.label.toLowerCase()}.`;
    }
  }
  const promptConfig = getEditToolPrompt(catalog, model);
  if (promptConfig.show && promptConfig.required && !hasText(prompt)) {
    return 'Please enter a prompt.';
  }
  return null;
}

function cleanValues(values = {}) {
  const cleaned = {};
  for (const [key, value] of Object.entries(values)) {
    if (value === '' || value === undefined || value === null) continue;
    if (Array.isArray(value) && value.length === 0) continue;
    cleaned[key] = value;
  }
  return cleaned;
}

/** Builds the params object handed to the muapi.js function for a catalog. */
export function buildEditToolParams(catalog, model, { prompt = '', uploads = {}, values = {} } = {}) {
  const params = { ...cleanValues(values), model: model.id };
  if (hasText(prompt)) params.prompt = prompt.trim();
  for (const slot of getEditToolSlots(catalog, model)) {
    const urls = (uploads[slot.key] || []).filter(hasText).slice(0, slot.max);
    if (urls.length === 0) continue;
    params[slot.key] = slot.max > 1 || isListKey(slot.key) ? urls : urls[0];
  }
  if (Array.isArray(params.images_list) && params.images_list.length > 0 && !params.image_url && catalog !== 'motion') {
    params.image_url = params.images_list[0];
  }
  if (catalog === 'v2v') params.includeDeclaredInputs = true;
  if (catalog === 'audio') {
    delete params.model;
    params._modelId = model.id;
    if (Object.hasOwn(values, 'model') && hasText(values.model)) params.model = values.model;
  }
  return params;
}

const RUNNERS = {
  t2i: generateImage,
  i2i: generateI2I,
  t2v: generateVideo,
  i2v: generateI2V,
  v2v: processV2V,
  lipsync: processLipSync,
  motion: processMotionControl,
  audio: generateAudio,
};

const EXTENSION_TYPES = [
  [/\.(png|jpe?g|webp|gif|avif)(\?|$)/i, 'image'],
  [/\.(mp4|webm|mov|m4v)(\?|$)/i, 'video'],
  [/\.(mp3|wav|m4a|aac|ogg|flac)(\?|$)/i, 'audio'],
];

export function detectOutputType(url, catalog) {
  for (const [pattern, type] of EXTENSION_TYPES) {
    if (pattern.test(url || '')) return type;
  }
  return CATALOG_OUTPUT[catalog] || 'image';
}

/**
 * Runs the tool and resolves to `{ outputs: [{ url, type }], requestId, raw }`.
 */
export async function runEditTool(apiKey, { catalog, model, prompt, uploads, values, onRequestId }) {
  const runner = RUNNERS[catalog];
  if (!runner) throw new Error(`Unsupported tool type: ${catalog}`);
  const params = buildEditToolParams(catalog, model, { prompt, uploads, values });
  if (onRequestId) params.onRequestId = onRequestId;
  const result = await runner(apiKey, params);
  const urls = [
    ...(Array.isArray(result?.outputs) ? result.outputs : []),
    ...(Array.isArray(result?.images) ? result.images : []),
  ].filter((url) => typeof url === 'string' && url);
  if (urls.length === 0 && result?.url) urls.push(result.url);
  const unique = [...new Set(urls)];
  if (unique.length === 0) throw new Error('The tool finished but returned no output.');
  return {
    outputs: unique.map((url) => ({ url, type: detectOutputType(url, catalog) })),
    requestId: result?.request_id || null,
    raw: result,
  };
}
