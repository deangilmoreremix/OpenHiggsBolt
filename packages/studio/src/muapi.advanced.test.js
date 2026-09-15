import { describe, it, expect, vi } from 'vitest';
import { generateVideo, executeWorkflow, buildWorkflowApiSnippets } from './muapi.js';
import { buildSupplementalInputPayload } from './modelParameters.js';
import { getVideoModelById } from './models.js';

// Load full model definitions from models.js
const seedance25 = getVideoModelById('seedance-2.5-text-to-video');
const klingOmni = getVideoModelById('kling-v3.0-omni-pro-text-to-video');

describe('generateVideo supplemental input pass-through', () => {
  async function runWith(modelId, params) {
    let capturedBody = null;
    global.fetch = vi.fn(async (url, opts) => {
      const method = opts?.method || 'GET';
      if (method === 'POST') {
        capturedBody = JSON.parse(opts.body);
        return { ok: true, json: async () => ({ request_id: 'r' }) };
      }
      return {
        ok: true,
        json: async () => ({ status: 'succeeded', url: 'https://example.com/video.mp4' }),
      };
    });
    const result = await generateVideo('fakekey', { model: modelId, ...params });
    return { result, capturedBody };
  }

  it('Seedance 2.5: forwards defined supplemental inputs (generate_audio, camera_fixed)', async () => {
    const { result, capturedBody } = await runWith('seedance-2.5-text-to-video', {
      prompt: 'x',
      generate_audio: false,
      camera_fixed: true,
    });

    expect(result.url).toBe('https://example.com/video.mp4');
    expect(capturedBody.prompt).toBe('x');
    expect(capturedBody.generate_audio).toBe(false);
    expect(capturedBody.camera_fixed).toBe(true);
  });

  it('Seedance 2.5: only includes explicitly provided supplemental inputs in payload', async () => {
    const { capturedBody } = await runWith('seedance-2.5-text-to-video', {
      prompt: 'x',
    });

    expect(capturedBody.prompt).toBe('x');
    // Supplemental inputs are only forwarded when explicitly provided
    expect(capturedBody).not.toHaveProperty('generate_audio');
    expect(capturedBody).not.toHaveProperty('camera_fixed');
  });

  it('Kling 3.0 Omni: forwards defined supplemental inputs (generate_audio)', async () => {
    const { capturedBody } = await runWith('kling-v3.0-omni-pro-text-to-video', {
      prompt: 'x',
      generate_audio: true,
    });

    expect(capturedBody.prompt).toBe('x');
    expect(capturedBody.generate_audio).toBe(true);
  });

  it('buildSupplementalInputPayload: maps only defined model inputs', () => {
    const values = {
      generate_audio: false,
      camera_fixed: true,
      negative_prompt: 'no cats', // NOT a defined input for Seedance
      seed: 42,                   // NOT a defined input for Seedance
    };

    const payload = buildSupplementalInputPayload(seedance25, values);

    expect(payload.generate_audio).toBe(false);
    expect(payload.camera_fixed).toBe(true);
    expect(payload).not.toHaveProperty('negative_prompt');
    expect(payload).not.toHaveProperty('seed');
  });

  it('buildSupplementalInputPayload: handles empty values', () => {
    const payload = buildSupplementalInputPayload(seedance25, {});
    expect(payload).toEqual({});
  });

  it('buildSupplementalInputPayload: applies defaults for undefined/null values', () => {
    const values = {
      generate_audio: undefined,
      camera_fixed: null,
    };

    const payload = buildSupplementalInputPayload(seedance25, values);

    // undefined/null values fall back to schema defaults
    expect(payload.generate_audio).toBe(true);   // default
    expect(payload.camera_fixed).toBe(false);   // default
  });
});

describe('executeWorkflow webhook payload', () => {
  it('sends webhook_url when provided', async () => {
    let capturedBody = null;
    global.fetch = vi.fn(async (url, opts) => {
      const method = opts?.method || 'GET';
      if (method === 'POST') {
        capturedBody = JSON.parse(opts.body);
        return { ok: true, json: async () => ({ run_id: 'run-123' }) };
      }
      return {
        ok: true,
        json: async () => ({ status: 'completed', outputs: ['https://example.com/out.png'] }),
      };
    });

    await executeWorkflow('fake-key', 'wf-1', { prompt: 'hello' }, 'https://example.com/webhook');

    expect(capturedBody).toEqual({
      inputs: { prompt: 'hello' },
      webhook_url: 'https://example.com/webhook',
    });
  });

  it('omits webhook_url when not provided', async () => {
    let capturedBody = null;
    global.fetch = vi.fn(async (url, opts) => {
      const method = opts?.method || 'GET';
      if (method === 'POST') {
        capturedBody = JSON.parse(opts.body);
        return { ok: true, json: async () => ({ run_id: 'run-123' }) };
      }
      return {
        ok: true,
        json: async () => ({ status: 'completed', outputs: ['https://example.com/out.png'] }),
      };
    });

    await executeWorkflow('fake-key', 'wf-1', { prompt: 'hello' });

    expect(capturedBody).toEqual({
      inputs: { prompt: 'hello' },
    });
    expect(capturedBody).not.toHaveProperty('webhook_url');
  });
});

describe('buildWorkflowApiSnippets', () => {
  it('includes webhook_url in snippets when provided', () => {
    const snippets = buildWorkflowApiSnippets('wf-1', { prompt: 'hello' }, { webhookUrl: 'https://example.com/webhook' });

    const parsed = JSON.parse(snippets.json);
    expect(parsed).toEqual({
      inputs: { prompt: 'hello' },
      webhook_url: 'https://example.com/webhook',
    });
  });

  it('omits webhook_url from snippets when not provided', () => {
    const snippets = buildWorkflowApiSnippets('wf-1', { prompt: 'hello' }, {});

    const parsed = JSON.parse(snippets.json);
    expect(parsed).toEqual({
      inputs: { prompt: 'hello' },
    });
    expect(parsed).not.toHaveProperty('webhook_url');
  });
});
