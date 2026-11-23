import { describe, expect, it } from 'vitest';
import {
  muapiAuthMessage,
  isMuapiKeyAuthMessage,
  MUAPI_KEY_REJECTED_MESSAGE,
  MUAPI_KEY_MISSING_MESSAGE,
} from '../lib/muapiAuthMessage';

const MUAPI_403 = '{"detail":"Not authorized: missing or invalid credentials","error":{"code":"FORBIDDEN","message":"Not authorized: missing or invalid credentials"}}';

describe('muapiAuthMessage', () => {
  it("turns MuAPI's raw 403 body into a 'key rejected' message", () => {
    expect(muapiAuthMessage(MUAPI_403)).toBe(MUAPI_KEY_REJECTED_MESSAGE);
    expect(muapiAuthMessage(JSON.parse(MUAPI_403))).toBe(MUAPI_KEY_REJECTED_MESSAGE);
  });

  it("maps our proxy's missing-key 401 to the missing-key message", () => {
    expect(muapiAuthMessage('{"error":"Unauthorized: Missing API key"}')).toBe(MUAPI_KEY_MISSING_MESSAGE);
  });

  it('falls back to the rejected message when there is no body', () => {
    expect(muapiAuthMessage(undefined)).toBe(MUAPI_KEY_REJECTED_MESSAGE);
    expect(muapiAuthMessage('')).toBe(MUAPI_KEY_REJECTED_MESSAGE);
  });

  it('passes other messages through unchanged', () => {
    expect(muapiAuthMessage('{"detail":"Insufficient credits"}')).toBe('Insufficient credits');
  });

  it('recognises its own messages so a later success can clear them', () => {
    expect(isMuapiKeyAuthMessage(MUAPI_KEY_REJECTED_MESSAGE)).toBe(true);
    expect(isMuapiKeyAuthMessage(MUAPI_KEY_MISSING_MESSAGE)).toBe(true);
    expect(isMuapiKeyAuthMessage('We couldn\'t save your keys.')).toBe(false);
    expect(isMuapiKeyAuthMessage(null)).toBe(false);
  });
});
