import { describe, expect, it } from 'vitest';
import { MODULES } from '@/content/resellerAcademy';

describe('every Reseller Academy lesson is a guided walkthrough', () => {
  for (const m of MODULES) for (const l of m.lessons) {
    it(`${l.id}: short, stepwise, every step says what you should see`, () => {
      expect(l.minutes).toBeLessThan(20);
      expect(l.follow.length).toBeGreaterThanOrEqual(3);
      for (const s of l.follow) {
        expect(s.text.trim().length).toBeGreaterThan(0);
        expect((s.expect ?? '').trim().length, `${l.id}: "${s.text.slice(0, 40)}" has no expect`).toBeGreaterThan(0);
      }
      expect(l.complete.length).toBeGreaterThanOrEqual(2);
      expect(JSON.stringify(l)).not.toMatch(/sk_(live|test)_[A-Za-z0-9]{8,}|whsec_[A-Za-z0-9]{8,}/);
    });
  }
});
