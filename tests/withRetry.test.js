import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const delay = (ms) => new Promise(r => setTimeout(r, ms));

describe('withRetry', () => {
  it('resolves on first success', async () => {
    const { withRetry } = await import('../packages/Open-AI-Design-Agent/packages/design-agent/src/lib/withRetry.ts');
    let calls = 0;
    const result = await withRetry(async () => {
      calls++;
      return 'ok';
    });
    assert.equal(result, 'ok');
    assert.equal(calls, 1);
  });

  it('retries on 5xx and eventually succeeds', async () => {
    const { withRetry } = await import('../packages/Open-AI-Design-Agent/packages/design-agent/src/lib/withRetry.ts');
    let calls = 0;
    const result = await withRetry(async () => {
      calls++;
      if (calls < 3) {
        const err = new Error('boom');
        err.response = { status: 502 };
        throw err;
      }
      return 'recovered';
    }, { retries: 3, baseDelayMs: 10 });
    assert.equal(result, 'recovered');
    assert.equal(calls, 3);
  });

  it('does not retry on 400 client errors', async () => {
    const { withRetry } = await import('../packages/Open-AI-Design-Agent/packages/design-agent/src/lib/withRetry.ts');
    let calls = 0;
    try {
      await withRetry(async () => {
        calls++;
        const err = new Error('bad request');
        err.response = { status: 400 };
        throw err;
      }, { retries: 3, baseDelayMs: 10 });
      assert.fail('should have thrown');
    } catch (err) {
      assert.equal((err).message, 'bad request');
    }
    assert.equal(calls, 1);
  });

  it('aborts immediately when signal is already aborted', async () => {
    const { withRetry } = await import('../packages/Open-AI-Design-Agent/packages/design-agent/src/lib/withRetry.ts');
    const controller = new AbortController();
    controller.abort();
    try {
      await withRetry(async () => 'nope', { signal: controller.signal });
      assert.fail('should have thrown');
    } catch (err) {
      assert.equal((err).message, 'Aborted');
    }
  });
});
