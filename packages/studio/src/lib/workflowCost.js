import { estimateModelCost } from './costEstimate.js';
import { buildParams } from './promptRecipes.js';

const NON_MODEL_STEPS = new Set(['script', 'approval', 'upload']);

/** Counts a workflow's billable steps by kind. */
export function summarizeWorkflowSteps(skill) {
  const summary = { image: 0, video: 0, clipping: 0, other: 0 };
  for (const step of skill?.steps || []) {
    if (NON_MODEL_STEPS.has(step.type)) continue;
    if (step.type === 'image') summary.image += 1;
    else if (step.type === 'i2v' || step.type === 't2v') summary.video += 1;
    else if (step.type === 'clipping') summary.clipping += 1;
    else summary.other += 1;
  }
  return summary;
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** "This will generate 1 image and 1 video." */
export function describeWorkflowOutputs(summary) {
  const parts = [];
  if (summary.image) parts.push(plural(summary.image, 'image'));
  if (summary.video) parts.push(plural(summary.video, 'video'));
  if (summary.clipping) parts.push(plural(summary.clipping, 'clip set'));
  if (summary.other) parts.push(plural(summary.other, 'other output'));
  return parts.length ? `This will generate ${parts.join(' and ')}.` : '';
}

/**
 * Approximate price text from measured runs, used when a live estimate is not
 * available. A 5 s image-to-video step cost about $0.75; image steps $0.02-0.10.
 */
export function staticCostNote(summary) {
  const parts = [];
  if (summary.image) parts.push('about $0.02–0.10 per image');
  if (summary.video) parts.push('about $0.75 per 5 s video');
  if (summary.clipping) parts.push('clipping is billed by video length');
  return parts.length ? `Approximate cost: ${parts.join(', ')}.` : '';
}

export function formatUsd(amount) {
  return amount < 0.1 ? `$${amount.toFixed(3)}` : `$${amount.toFixed(2)}`;
}

/**
 * Live total from the studio's estimate-cost endpoint, one call per model step.
 * Returns null when any step cannot be estimated, so a partial sum is never
 * presented as the total.
 */
export async function estimateWorkflowCost(apiKey, skill, values = {}, estimate = estimateModelCost) {
  if (!apiKey) return null;
  // Clipping is billed by video length and has no per-model estimate: fall back to the static note.
  if ((skill?.steps || []).some((s) => s.type === 'clipping')) return null;
  const steps = (skill?.steps || []).filter((s) => !NON_MODEL_STEPS.has(s.type));
  if (steps.length === 0) return null;
  let total = 0;
  for (const step of steps) {
    const modelId = step.endpoint || step.model;
    const params = buildParams({ ...step, references: [] }, { ...values }, []);
    const { model: _model, ...payload } = params;
    if (!payload.prompt) payload.prompt = 'estimate';
    const cost = await estimate(apiKey, modelId, { ...payload, _modelId: modelId });
    if (typeof cost !== 'number' || Number.isNaN(cost)) return null;
    total += cost;
  }
  return total;
}
