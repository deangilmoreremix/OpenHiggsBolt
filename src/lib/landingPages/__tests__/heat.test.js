import { describe, it, expect, vi } from 'vitest';
import { createHeatCollector, viewportClass, permille, heatCells } from '../heat.js';

const fakeEnv = () => {
  const handlers = {}; const winHandlers = {};
  const doc = {
    documentElement: { scrollWidth: 1000, clientWidth: 1000, scrollHeight: 2000, clientHeight: 800, scrollTop: 0 }, visibilityState: 'visible',
    addEventListener: (t, f) => { (handlers[t] ||= []).push(f); }, removeEventListener: (t, f) => { handlers[t] = (handlers[t] || []).filter((x) => x !== f); },
  };
  const win = { innerWidth: 1280, innerHeight: 800, scrollY: 0, addEventListener: (t, f) => { (winHandlers[t] ||= []).push(f); }, removeEventListener: (t, f) => { winHandlers[t] = (winHandlers[t] || []).filter((x) => x !== f); } };
  return { doc, win, fire: (t, e) => (handlers[t] || []).forEach((f) => f(e)), fireWin: (t, e) => (winHandlers[t] || []).forEach((f) => f(e)), handlers };
};

describe('heat collector', () => {
  it('classifies the viewport and converts to permille', () => {
    expect(viewportClass(390)).toBe('mobile'); expect(viewportClass(800)).toBe('tablet'); expect(viewportClass(1400)).toBe('desktop');
    expect(permille(500, 1000)).toBe(500); expect(permille(5000, 1000)).toBe(1000); expect(permille(-5, 1000)).toBe(0); expect(permille(1, 0)).toBe(0);
  });
  it('records clicks, scroll depth steps and each watched second once; sends nothing else', () => {
    const e = fakeEnv(); const sent = [];
    const c = createHeatCollector({ send: (b) => sent.push(...b), win: e.win, doc: e.doc, setTimer: () => 1, clearTimer: () => {} });
    e.fire('click', { pageX: 500, pageY: 400, target: { textContent: 'secret' } });
    e.win.scrollY = 0; e.fireWin('scroll'); e.win.scrollY = 700; e.fireWin('scroll'); e.win.scrollY = 700; e.fireWin('scroll');
    const video = { tagName: 'VIDEO', paused: false, currentTime: 3.4 };
    e.fire('timeupdate', { target: video }); e.fire('timeupdate', { target: video });
    e.fire('timeupdate', { target: { tagName: 'VIDEO', paused: true, currentTime: 9 } });
    c.flush();
    expect(sent.filter((x) => x.t === 'click')).toEqual([{ t: 'click', x: 500, y: 200, vp: 'desktop' }]);
    expect(sent.filter((x) => x.t === 'scroll').map((x) => x.d)).toEqual([40, 70]);
    expect(sent.filter((x) => x.t === 'watch')).toEqual([{ t: 'watch', s: 3, vp: 'desktop' }]);
    expect(JSON.stringify(sent)).not.toContain('secret');
    expect(Object.keys(sent.find((x) => x.t === 'click')).sort()).toEqual(['t', 'vp', 'x', 'y']);
    c.stop();
    expect(e.handlers.click).toHaveLength(0);
  });
  it('does not measure scroll depth before the page has rendered', () => {
    vi.useFakeTimers();
    const e = fakeEnv(); const sent = [];
    const c = createHeatCollector({ send: (b) => sent.push(...b), win: e.win, doc: e.doc, setTimer: () => 1, clearTimer: () => {} });
    c.flush(); expect(sent.filter((x) => x.t === 'scroll')).toHaveLength(0);
    vi.advanceTimersByTime(2100); c.flush(); expect(sent.filter((x) => x.t === 'scroll').map((x) => x.d)).toEqual([40]);
    c.stop(); vi.useRealTimers();
  });
  it('sends in batches of at most 40', () => {
    const e = fakeEnv(); const batches = [];
    const c = createHeatCollector({ send: (b) => batches.push(b), win: e.win, doc: e.doc, setTimer: () => 1, clearTimer: () => {} });
    for (let i = 0; i < 95; i++) e.fire('click', { pageX: i, pageY: i });
    c.flush();
    expect(batches.every((b) => b.length <= 40)).toBe(true);
    expect(batches.flat().filter((x) => x.t === 'click')).toHaveLength(95);
  });
  it('turns database rows into overlay cells', () => {
    const cells = heatCells([{ cx: 20, cy: 12, clicks: 8, sessions: 4 }, { cx: 0, cy: 0, clicks: 2, sessions: 3 }, { cx: 1, cy: 1, clicks: 0 }]);
    expect(cells).toHaveLength(2); expect(cells[0]).toMatchObject({ left: 50, top: 30, size: 2.5, weight: 1 }); expect(cells[1].weight).toBe(0.25);
  });
});

