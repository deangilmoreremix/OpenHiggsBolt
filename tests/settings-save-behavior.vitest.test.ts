import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildHandlers } from '../app/api/auth/muapi-key/route';

describe('POST /api/auth/muapi-key — OpenAI independence', () => {
  let handlers: ReturnType<typeof buildHandlers>;
  let updatePayloads: any[] = [];

  beforeEach(() => {
    updatePayloads = [];
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-secret';
  });

  function makeBuilder() {
    const builder = {
      update: (payload: any) => {
        updatePayloads.push(payload);
        return {
          eq: () => ({
            select: () => ({ data: [{ clerk_user_id: 'user-1' }], error: null }),
          }),
        };
      },
      insert: (payload: any) => {
        updatePayloads.push(payload);
        return { error: null };
      },
    };
    return builder;
  }

  const mockAuth = async () => ({ userId: 'user-1' });
  const mockSb = () => ({ from: () => makeBuilder() });

  function postReq(body: Record<string, unknown>) {
    return new Request('http://localhost/api/auth/muapi-key', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  it('saves MuAPI key alone', async () => {
    handlers = buildHandlers({ auth: mockAuth, getSupabaseAdmin: mockSb });
    const res = await handlers.POST(postReq({ key: 'muapi-key-123', openaiKey: '' }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
  });

  it('saves both MuAPI and OpenAI keys', async () => {
    handlers = buildHandlers({ auth: mockAuth, getSupabaseAdmin: mockSb });
    const res = await handlers.POST(postReq({ key: 'muapi-key-123', openaiKey: 'sk-openai-456' }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(updatePayloads[0].openai_key).not.toBeNull();
  });

  it('preserves OpenAI when updating MuAPI only', async () => {
    handlers = buildHandlers({ auth: mockAuth, getSupabaseAdmin: mockSb });
    const res = await handlers.POST(postReq({ key: 'new-muapi-key', openaiKey: 'sk-existing-openai' }));
    expect(res.status).toBe(200);
    expect(updatePayloads[0].openai_key).not.toBeNull();
    expect(updatePayloads[0].muapi_key).not.toBeNull();
  });

  it('still requires MuAPI key even when only updating OpenAI', async () => {
    handlers = buildHandlers({ auth: mockAuth, getSupabaseAdmin: mockSb });
    const res = await handlers.POST(postReq({ key: '', openaiKey: 'sk-openai-456' }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.ok).toBe(false);
  });
});
