import * as muapi from '../muapi.js';

export function fillTemplate(prompt, values) {
  let hadPlaceholder = false;
  const filled = prompt.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    hadPlaceholder = true;
    return (values && values[key]) || '';
  });
  if (!hadPlaceholder) return filled;
  // An empty optional input leaves a stray double space or a space before the
  // punctuation ("A red fox ." / "contrast.  The"); tidy only what filling can cause.
  return filled.replace(/[ \t]{2,}/g, ' ').replace(/ +([.,;!?])/g, '$1');
}

/**
 * Values used to pre-fill a recipe's prompt when it opens in a studio: each input's
 * default, or a visible "[Label]" placeholder for a required input with no default,
 * so the person sees what to replace instead of a silent blank.
 */
export function recipePromptValues(skill) {
  const vals = {};
  for (const input of skill?.inputs || []) {
    if (input.default) vals[input.name] = input.default;
    else if (input.required) vals[input.name] = `[${input.label || input.name.replace(/_/g, ' ')}]`;
    else vals[input.name] = '';
  }
  return vals;
}

export const SKILL_CAMERA_CHIPS = [
  'slow push-in',
  'dolly in',
  'crane up',
  'orbit / 360',
  'whip pan',
  'rack focus',
  'gimbal shot',
  'FPV long take',
  'static / locked-off',
  'top-down',
];

export function resolveRef(token, inputValues, stepOutputs) {
  if (!token) return token;
  const phaseMatch = token.match(/\{\{phase(\d+)\.output\}\}/);
  if (phaseMatch) {
    const n = parseInt(phaseMatch[1], 10);
    return stepOutputs[n]?.url;
  }
  const nameMatch = token.match(/\{\{(\w+)\}\}/);
  if (nameMatch) {
    const name = nameMatch[1];
    return inputValues[name];
  }
  return token;
}

export function buildParams(step, inputValues, stepOutputs) {
  const phaseVars = {};
  for (let n = 0; n < stepOutputs.length; n++) {
    phaseVars[`phase${n}.output`] = stepOutputs[n]?.url;
  }
  const prompt = fillTemplate(step.prompt || '', { ...inputValues, ...phaseVars });
  const params = {
    model: step.endpoint,
    prompt,
    aspect_ratio: step.aspectRatio || '16:9',
  };
  if (step.duration !== undefined) params.duration = step.duration;
  if (step.resolution !== undefined) params.resolution = step.resolution;
  if (step.audio !== undefined) params.generate_audio = step.audio;
  const refs = (step.references || []).map((ref) => {
    if (typeof ref === 'string') {
      return { url: resolveRef(ref, inputValues, stepOutputs), role: null };
    }
    return { url: resolveRef(ref.url, inputValues, stepOutputs), role: ref.role || null };
  });
  const urls = refs.map((r) => r.url).filter(Boolean);
  if (step.type === 'clipping') {
    // The clipping service takes a single source video, not an images_list.
    return {
      video_url: urls[0],
      aspect_ratio: step.aspectRatio || '9:16',
      num_highlights: step.numHighlights,
    };
  }
  if (urls.length > 0) {
    params.images_list = urls;
  }
  const withRole = refs.filter((r) => r.role);
  if (withRole.length > 0) {
    params.references = withRole.map((r) => ({ url: r.url, role: r.role }));
  }
  return params;
}

function getUrl(result) {
  return (
    result?.url ||
    result?.outputs?.[0] ||
    result?.output?.video ||
    ''
  );
}

export async function runSkill(apiKey, skill, inputValues, onStep, options = {}) {
  const { onApproval, signal } = options;
  const stepOutputs = [];
  for (let i = 0; i < skill.steps.length; i++) {
    const step = skill.steps[i];
    if (signal?.aborted) throw new Error('Run cancelled');
    onStep(i, { status: 'running' });
    try {
      if (step.type === 'approval') {
        // Pause until the person approves the previous output; false = stop here.
        const approved = onApproval ? await onApproval(i, step) : true;
        if (!approved) throw new Error('Run stopped at approval step');
        onStep(i, { status: 'done', note: step.note || '' });
        continue;
      }
      if (step.type === 'script') {
        onStep(i, { status: 'done', note: step.note || '' });
        continue;
      }
      if (step.type === 'upload') {
        const token = step.inputName
          ? '{{' + step.inputName + '}}'
          : step.references?.[0] || '';
        const url = resolveRef(token, inputValues, stepOutputs);
        onStep(i, { status: 'done', url });
        continue;
      }
      const params = buildParams(step, inputValues, stepOutputs);
      let result;
      if (step.type === 'image') {
        result = params.images_list
          ? await muapi.generateI2I(apiKey, params)
          : await muapi.generateImage(apiKey, params);
      } else if (step.type === 'i2v') {
        result = await muapi.generateI2V(apiKey, params);
      } else if (step.type === 't2v') {
        result = await muapi.generateVideo(apiKey, params);
      } else if (step.type === 'audio') {
        result = await muapi.generateAudio(apiKey, params);
      } else if (step.type === 'character') {
        // generateCharacterVideo is a stub. The character model (seedance-2-character)
        // is registered as an image-to-image model, and generateI2V would not find it
        // and would drop the reference images, so dispatch through generateI2I.
        result = await muapi.generateI2I(apiKey, params);
      } else if (step.type === 'clipping') {
        result = await muapi.runClipping(apiKey, params);
      } else {
        // edit and any other step: image-to-image
        result = await muapi.generateI2I(apiKey, params);
      }
      const url = getUrl(result);
      stepOutputs[i] = { url };
      onStep(i, { status: 'done', url });
    } catch (e) {
      onStep(i, { status: 'error', error: String(e) });
      throw e;
    }
  }
  return stepOutputs;
}
