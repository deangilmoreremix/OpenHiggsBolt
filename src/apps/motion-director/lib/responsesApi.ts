/**
 * Reading what the OpenAI Responses API returned, strictly. A refusal, a response cut short (`status: "incomplete"`), an empty
 * output or text that is not JSON are all FAILURES with their real reason: none of them may become `{}` and travel on as if the
 * model had answered (the validators downstream would then see an empty plan/review and could treat it as a valid, empty answer).
 */
export class ModelOutputError extends Error {
  readonly status = 0;
  constructor(readonly code: 'MODEL_REFUSED' | 'MODEL_INCOMPLETE' | 'BAD_OUTPUT', message: string) {
    super(message);
    this.name = 'ModelOutputError';
  }
}

interface ContentItem { type?: string; text?: string; refusal?: string }
interface OutputItem { type?: string; content?: ContentItem[]; status?: string }
export interface ResponsesPayload { status?: string; output_text?: string; output?: OutputItem[]; incomplete_details?: { reason?: string } | null; error?: { message?: string } | null }

export function extractOutputText(payload: ResponsesPayload | undefined | null): string {
  if (typeof payload?.output_text === 'string' && payload.output_text) return payload.output_text;
  for (const item of Array.isArray(payload?.output) ? payload!.output! : []) {
    for (const content of Array.isArray(item?.content) ? item.content! : []) {
      if (content?.type === 'output_text' && typeof content.text === 'string') return content.text;
    }
  }
  return '';
}

export function readModelOutput(payload: ResponsesPayload | undefined | null): Record<string, unknown> {
  if (!payload || typeof payload !== 'object') throw new ModelOutputError('BAD_OUTPUT', 'OpenAI returned no response body.');
  for (const item of Array.isArray(payload.output) ? payload.output : []) {
    for (const content of Array.isArray(item?.content) ? item.content : []) {
      if (content?.type === 'refusal') throw new ModelOutputError('MODEL_REFUSED', `The model refused the request: ${String(content.refusal ?? 'no reason given').slice(0, 300)}`);
    }
  }
  if (payload.status === 'incomplete') {
    throw new ModelOutputError('MODEL_INCOMPLETE', `The model's answer was cut short (${payload.incomplete_details?.reason ?? 'unknown reason'}), so it cannot be trusted.`);
  }
  if (payload.status === 'failed') throw new ModelOutputError('BAD_OUTPUT', `The model request failed: ${payload.error?.message ?? 'no detail'}`);
  const text = extractOutputText(payload);
  if (!text.trim()) throw new ModelOutputError('BAD_OUTPUT', 'The model returned no output text.');
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new ModelOutputError('BAD_OUTPUT', 'The model returned text that is not valid JSON.');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new ModelOutputError('BAD_OUTPUT', 'The model returned JSON that is not an object.');
  if (Object.keys(parsed as object).length === 0) throw new ModelOutputError('BAD_OUTPUT', 'The model returned an empty JSON object.');
  return parsed as Record<string, unknown>;
}
