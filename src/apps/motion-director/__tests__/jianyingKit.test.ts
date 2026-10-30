import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MOTION_TEMPLATES } from '@/data/motionRecipeCatalog';
import { OUTPUT_AUDIO_OFFSET_F, planToProject } from '../lib/buildFilm';
import type { DirectorPlan } from '../lib/directorPlan';
import { crc32, kitAudioSources, kitTimeline, plateProject, zipStore } from '../lib/jianyingKit';

const palette = { background: '#101018', text: '#ffffff', accent: '#8b6bff' };
const sc = (recipeId: string, kind: 'shot' | 'title' = 'shot', durationSec = 4) => ({ kind, recipeId, durationSec, headline: 'Line', caption: 'A caption', transition: 'cut' as const });
const film = () => {
  const plan: DirectorPlan = { title: 't', summary: '', palette, scenes: [sc('brand/url-scan'), sc(MOTION_TEMPLATES[0].id), sc('brand/hub'), sc('', 'title', 3)] };
  return planToProject(plan, { aspectRatio: '16:9', capture: { screens: ['https://img/p.jpg'], crops: [], title: 'Acme', sections: [0, 900], pageH: 3000, sectionNames: ['Hero'], nav: ['A', 'B'], address: 'acme.com' }, brand: { name: 'Acme' } });
};

describe('JianYing kit', () => {
  it('reads scenes, captions and sounds from the film, sounds shifted back by the output delay', () => {
    const project = film();
    const t = kitTimeline(project);
    expect(t.shots.length).toBeGreaterThanOrEqual(4);
    expect(t.captions.length).toBeGreaterThan(0);
    expect(t.captions[0].size).toBeCloseTo(Number(project.tracks.flatMap((x) => x.clips).find((c) => c.cardId === 'inkpress-caption')!.props.fontSize) / 10.8, 1);
    expect(t.captions[0].transformY).toBeLessThan(0);
    const sfxClip = project.tracks.flatMap((x) => x.clips).find((c) => c.cardId === 'audio-clip' && /sfxlib/.test(String(c.props.file)))!;
    const sfx = t.audio.find((a) => a.role === 'sfx')!;
    expect(sfx.from).toBe(Math.round(sfxClip.start + OUTPUT_AUDIO_OFFSET_F));
    expect(sfx.file.startsWith('audio/')).toBe(true);
  });

  it('the plate has no captions and no sound', () => {
    const plate = plateProject(film());
    const clips = plate.tracks.flatMap((x) => x.clips);
    expect(clips.some((c) => c.cardId === 'audio-clip' || c.cardId === 'inkpress-caption')).toBe(false);
    expect(clips.length).toBeGreaterThan(0);
    expect(kitAudioSources(film()).every((s) => s.path.startsWith('audio/') && s.url.startsWith('/motion-studio/'))).toBe(true);
  });

  it('writes a zip that a real unzip accepts, with the right checksums', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
    const dir = mkdtempSync(join(tmpdir(), 'kit-'));
    const zip = zipStore([
      { path: 'a.txt', data: new TextEncoder().encode('hello') },
      { path: 'audio/b.bin', data: new Uint8Array([1, 2, 3, 4, 250]) },
      { path: 'unicode-é.txt', data: new TextEncoder().encode('é') },
    ]);
    const file = join(dir, 'kit.zip');
    writeFileSync(file, zip);
    const listing = execFileSync('python3', ['-c', 'import sys,zipfile;z=zipfile.ZipFile(sys.argv[1]);print(z.testzip());print(sorted(z.namelist()));print(z.read("a.txt").decode())', file]).toString();
    expect(listing).toContain('None');
    expect(listing).toContain("'a.txt'");
    expect(listing).toContain('hello');
    expect(readFileSync(file).length).toBe(zip.length);
  });
});
