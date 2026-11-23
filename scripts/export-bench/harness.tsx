import { exportMp4, renderVideoOnWeb } from '/home/user/OpenHiggsBolt/src/apps/motion-director/webRenderer';
import { planToProject } from '/home/user/OpenHiggsBolt/src/apps/motion-director/lib/buildFilm';
import { MOTION_TEMPLATES } from '/home/user/OpenHiggsBolt/src/data/motionRecipeCatalog';
const q = new URLSearchParams(location.search);
const ids = (q.get('r') ?? 'ListReveal,PaperTitleCard').split(',');
const shots = ids.map((n) => MOTION_TEMPLATES.find((t) => t.componentName === n)!).filter(Boolean);
const plan: any = { title: 't', summary: '', palette: { background: '#f7f4ee', text: '#1c1a17', accent: '#b5651d' }, scenes: shots.map((s) => ({ kind: 'shot', recipeId: s.id, durationSec: Number(q.get('d') ?? 2), headline: 'h', caption: '', transition: 'cut' })) };
const project = planToProject(plan, { aspectRatio: '16:9' });
(window as any).run = async (opts: any) => {
  const t0 = performance.now();
  const frames: number[] = [];
  await exportMp4({ project, scale: opts.scale ?? 1, muted: true, tuning: opts.tuning, onProgress: (p: number) => frames.push(p) } as any);
  return { ms: Math.round(performance.now() - t0), frames: Math.round(project.tracks.flatMap((t) => t.clips).reduce((m, c) => Math.max(m, c.start + c.duration), 0)) };
};
(window as any).ready = true;
(window as any).names = MOTION_TEMPLATES.map((t) => t.componentName);
(window as any).runOne = async (name: string, sec: number, limitMs: number) => {
  const shot = MOTION_TEMPLATES.find((t) => t.componentName === name)!;
  const pl: any = { ...plan, scenes: [{ kind: 'shot', recipeId: shot.id, durationSec: sec, headline: 'h', caption: '', transition: 'cut' }] };
  const pr = planToProject(pl, { aspectRatio: '16:9' });
  const frames = pr.tracks.flatMap((t) => t.clips).reduce((m, c) => Math.max(m, c.start + c.duration), 0);
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), limitMs);
  const t0 = performance.now();
  try {
    await exportMp4({ project: pr, muted: true, signal: ac.signal, tuning: { pageResponsiveness: 'disabled' } } as any);
    return { name, ms: Math.round(performance.now() - t0), frames };
  } catch (e: any) {
    if (ac.signal.aborted) return { name, ms: limitMs, frames, slow: true };
    throw e;
  } finally { clearTimeout(timer); }
};
