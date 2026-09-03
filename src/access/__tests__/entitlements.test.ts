import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ENTITLEMENTS } from '../entitlements';

describe('entitlements', () => {
  it('defines all expected entitlement keys', () => {
    expect(ENTITLEMENTS.SMARTVIDEO_GO).toBe('smartvideo_go');
    expect(ENTITLEMENTS.SMARTVIDEO_AI).toBe('smartvideo_ai');
    expect(ENTITLEMENTS.FOUNDERS).toBe('founders');
  });

  it('ENTITLEMENTS values are unique', () => {
    const values = Object.values(ENTITLEMENTS);
    expect(new Set(values).size).toBe(values.length);
  });
});
