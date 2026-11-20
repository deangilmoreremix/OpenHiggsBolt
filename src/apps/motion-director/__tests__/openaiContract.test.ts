import { describe, expect, it } from 'vitest';
import { ModelOutputError, readModelOutput } from '../lib/responsesApi';
import { strictSchemaProblems } from '../lib/strictSchema';
import { BRIEF_JSON_SCHEMA, DIRECTION_JSON_SCHEMA, EDIT_JSON_SCHEMA, MAPPING_JSON_SCHEMA, PLAN_JSON_SCHEMA, RETEXT_JSON_SCHEMA } from '../lib/directorPlan';
import { ADAPT_JSON_SCHEMA } from '../lib/adaptPrompt';
import { CHAT_JSON_SCHEMA, FINAL_REVIEW_JSON_SCHEMA, REVIEW_JSON_SCHEMA } from '../lib/directorSchemas';
import { directorFailure } from '../../../../app/api/motion-studio/lib/directorFailure';

const SCHEMAS: Record<string, unknown> = { PLAN_JSON_SCHEMA, EDIT_JSON_SCHEMA, RETEXT_JSON_SCHEMA, BRIEF_JSON_SCHEMA, DIRECTION_JSON_SCHEMA, MAPPING_JSON_SCHEMA, ADAPT_JSON_SCHEMA, FINAL_REVIEW_JSON_SCHEMA, REVIEW_JSON_SCHEMA, CHAT_JSON_SCHEMA };

describe('every schema sent to OpenAI is strict-valid (a violation is an HTTP 400 on the first real call)', () => {
  for (const [name, schema] of Object.entries(SCHEMAS)) {
    it(name, () => expect(strictSchemaProblems(schema)).toEqual([]));
  }
  it('the checker really catches the usual mistakes', () => {
    expect(strictSchemaProblems({ type: 'object', properties: { a: { type: 'string' } }, required: [] })).toEqual(expect.arrayContaining([expect.stringContaining('additionalProperties'), expect.stringContaining('not in required')]));
    expect(strictSchemaProblems({ type: 'array' })).toEqual([expect.stringContaining('items')]);
    expect(strictSchemaProblems({ type: 'object', additionalProperties: false, properties: {}, required: [], allOf: [] })).toHaveLength(1);
  });
});

describe('reading a Responses API result', () => {
  const ok = (text: string) => ({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text }] }] });
  it('returns the parsed object of a completed answer (output_text or output[].content[])', () => {
    expect(readModelOutput(ok('{"a":1}'))).toEqual({ a: 1 });
    expect(readModelOutput({ output_text: '{"b":2}' })).toEqual({ b: 2 });
  });
  it('a refusal, a truncated answer, an empty body, non-JSON and `{}` are failures with their real reason', () => {
    const fail = (payload: unknown) => { try { readModelOutput(payload as never); } catch (e) { return e as ModelOutputError; } return null; };
    expect(fail({ status: 'completed', output: [{ content: [{ type: 'refusal', refusal: 'cannot help' }] }] })).toMatchObject({ code: 'MODEL_REFUSED' });
    expect(fail({ status: 'incomplete', incomplete_details: { reason: 'max_output_tokens' }, output: [] })?.message).toMatch(/max_output_tokens/);
    expect(fail({ status: 'incomplete' })).toMatchObject({ code: 'MODEL_INCOMPLETE' });
    expect(fail(ok(''))).toMatchObject({ code: 'BAD_OUTPUT' });
    expect(fail(ok('not json'))).toMatchObject({ code: 'BAD_OUTPUT' });
    expect(fail(ok('{}'))).toMatchObject({ code: 'BAD_OUTPUT' });
    expect(fail(ok('[1]'))).toMatchObject({ code: 'BAD_OUTPUT' });
    expect(fail(null)).toMatchObject({ code: 'BAD_OUTPUT' });
    expect(fail({ status: 'failed', error: { message: 'boom' } })?.message).toMatch(/boom/);
  });
  it('the route answers a model failure with its code and message (HTTP 502), and keeps OpenAI\'s own statuses', async () => {
    const r = directorFailure(new ModelOutputError('MODEL_REFUSED', 'The model refused the request: x'));
    expect(r.status).toBe(502);
    expect(await r.json()).toMatchObject({ code: 'MODEL_REFUSED' });
    const e429 = Object.assign(new Error('slow down'), { status: 429 });
    expect(directorFailure(e429).status).toBe(429);
    const e401 = Object.assign(new Error('bad key'), { status: 401 });
    expect((await directorFailure(e401).json()).code).toBe('OPENAI_KEY_REJECTED');
    const timeout = Object.assign(new Error('t'), { name: 'TimeoutError' });
    expect(directorFailure(timeout).status).toBe(504);
  });
});

describe('rate limits are respected, not guessed', () => {
  it('a 429 carries the server\'s Retry-After to the client and the adapt loop waits at least that long', async () => {
    const e = Object.assign(new Error('slow'), { status: 429, retryAfterMs: 20_000 });
    const r = directorFailure(e);
    expect(r.status).toBe(429);
    expect(r.headers.get('Retry-After')).toBe('20');
    expect((await r.json()).retryAfterMs).toBe(20000);
  });
  it('a model that does not exist for the key is its own error, not a generic failure', async () => {
    const e = Object.assign(new Error('The model `gpt-6-astra` does not exist'), { status: 404 });
    const r = directorFailure(e);
    expect((await r.json()).code).toBe('OPENAI_MODEL_UNAVAILABLE');
  });
});
