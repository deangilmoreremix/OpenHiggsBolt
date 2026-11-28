import { describe, expect, it } from 'vitest';
import { shouldPromptForKeys } from '../lib/firstLoginKeyPrompt';

describe('first-login key pop-up', () => {
  it('asks a signed-in account that has no MuAPI key anywhere', () => {
    expect(shouldPromptForKeys({ signedIn: true, status: 200, accountKey: '', localKey: '' })).toBe(true);
  });

  it('does not ask again when the key was saved at sign-up', () => {
    expect(shouldPromptForKeys({ signedIn: true, status: 200, accountKey: 'mu_saved_key', localKey: '' })).toBe(false);
  });

  it('does not ask when this browser already has the key', () => {
    expect(shouldPromptForKeys({ signedIn: true, status: 200, accountKey: '', localKey: 'mu_local_key' })).toBe(false);
  });

  it('the OpenAI key is optional: a MuAPI key alone is enough', () => {
    // openaiKey is not an input at all; only the MuAPI key decides.
    expect(shouldPromptForKeys({ signedIn: true, status: 200, accountKey: 'mu_saved_key' })).toBe(false);
  });

  it('does not ask before sign-in has loaded or for signed-out visitors', () => {
    expect(shouldPromptForKeys({ signedIn: false, status: 401 })).toBe(false);
    expect(shouldPromptForKeys({ signedIn: false, status: 200 })).toBe(false);
  });

  it('does not ask when the account could not be read', () => {
    expect(shouldPromptForKeys({ signedIn: true, status: 401 })).toBe(false);
    expect(shouldPromptForKeys({ signedIn: true, status: 500 })).toBe(false);
    expect(shouldPromptForKeys({ signedIn: true, status: null })).toBe(false);
  });

  it('ignores a key that is only whitespace', () => {
    expect(shouldPromptForKeys({ signedIn: true, status: 200, accountKey: '   ', localKey: '' })).toBe(true);
  });
});
