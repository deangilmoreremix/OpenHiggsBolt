import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createStallGuard } from '../webRenderer';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('export stall guard', () => {
  it('ends a render that stops reporting progress, and says it stalled', () => {
    const guard = createStallGuard(undefined, 1000);
    vi.advanceTimersByTime(1001);
    expect(guard.signal.aborted).toBe(true);
    expect(guard.stalled()).toBe(true);
  });

  it('keeps going while progress arrives', () => {
    const guard = createStallGuard(undefined, 1000);
    for (let i = 0; i < 5; i++) {
      vi.advanceTimersByTime(800);
      guard.ping();
    }
    expect(guard.signal.aborted).toBe(false);
    guard.done();
  });

  it('passes a cancel through without calling it a stall', () => {
    const outer = new AbortController();
    const guard = createStallGuard(outer.signal, 1000);
    outer.abort();
    expect(guard.signal.aborted).toBe(true);
    expect(guard.stalled()).toBe(false);
    guard.done();
  });
});

import { isMusicTrack } from '../types';
describe('music track', () => {
  it('is found by role or by its name in any language, not by one locale', () => {
    expect(isMusicTrack({ name: 'My bed', role: 'music' })).toBe(true);
    expect(isMusicTrack({ name: 'Музыка' })).toBe(true);
    expect(isMusicTrack({ name: '音乐' })).toBe(true);
    expect(isMusicTrack({ name: 'Shots' })).toBe(false);
  });
});
