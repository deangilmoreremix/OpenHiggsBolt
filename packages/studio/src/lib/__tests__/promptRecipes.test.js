import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../muapi.js', () => ({
  generateImage: vi.fn(),
  generateI2I: vi.fn(),
  generateI2V: vi.fn(),
  generateVideo: vi.fn(),
  generateAudio: vi.fn(),
  runClipping: vi.fn(),
  generateCharacterVideo: vi.fn(),
}));

import * as muapi from '../../muapi.js';
import registry from '../../skills/registry.json';
import { runSkill, buildParams, recipePromptValues, fillTemplate } from '../promptRecipes.js';

const skill = (slug) => registry.skills.find((s) => s.slug === slug);

beforeEach(() => vi.clearAllMocks());

describe('runSkill', () => {
  it('feeds step 0 output into step 1 via {{phase0.output}}', async () => {
    muapi.generateImage.mockResolvedValue({ url: 'https://x/img.png' });
    muapi.generateI2V.mockResolvedValue({ url: 'https://x/vid.mp4' });
    const events = [];
    await runSkill('key', skill('muapi-product-campaign'), { product_name: 'Mug' }, (i, p) => events.push([i, p.status]));
    expect(muapi.generateImage.mock.calls[0][1].prompt).toContain('Mug');
    expect(muapi.generateI2V.mock.calls[0][1].images_list).toEqual(['https://x/img.png']);
    expect(events).toContainEqual([1, 'done']);
  });

  it('runs a converted image-then-video recipe, feeding the upload and the still into the video step', async () => {
    muapi.generateI2I.mockResolvedValue({ url: 'https://x/logo3d.png' });
    muapi.generateI2V.mockResolvedValue({ url: 'https://x/logo.mp4' });
    const logo = skill('muapi-3d-logo-animation');
    expect(logo.kind).toBe('workflow');
    expect(logo.steps.map((s) => s.type)).toEqual(['image', 'i2v']);
    await runSkill('key', logo, { logo_image: 'https://x/logo2d.png', material_style: 'chrome' }, () => {});
    expect(muapi.generateI2I.mock.calls[0][1].images_list).toEqual(['https://x/logo2d.png']);
    const video = muapi.generateI2V.mock.calls[0][1];
    expect(video.model).toBe('seedance-2-image-to-video-fast');
    expect(video.images_list).toEqual(['https://x/logo3d.png']);
  });

  it('every video-promising workflow ends in a video step fed by the previous output', () => {
    for (const s of registry.skills.filter((k) => !k.hidden && k.kind === 'workflow')) {
      const video = s.steps.filter((st) => st.type === 'i2v' || st.type === 't2v');
      for (const st of video) {
        if (st.type === 'i2v') expect(st.references?.length, s.slug).toBeGreaterThan(0);
      }
    }
  });

  it('runs a character step through the image-to-image dispatch so its reference is forwarded', async () => {
    muapi.generateI2I.mockResolvedValue({ url: 'https://x/char.mp4' });
    const character = {
      steps: [{ type: 'character', endpoint: 'seedance-2-character', prompt: 'x', references: ['{{ref}}'] }],
    };
    await runSkill('key', character, { ref: 'https://x/sheet.png' }, () => {});
    expect(muapi.generateI2I).toHaveBeenCalledTimes(1);
    expect(muapi.generateI2I.mock.calls[0][1].images_list).toEqual(['https://x/sheet.png']);
    expect(muapi.generateI2V).not.toHaveBeenCalled();
  });

  it('pauses at approval and stops when declined', async () => {
    muapi.generateI2I.mockResolvedValue({ url: 'https://x/a.png' });
    muapi.generateImage.mockResolvedValue({ url: 'https://x/a.png' });
    const onApproval = vi.fn().mockResolvedValue(false);
    await expect(
      runSkill('key', skill('muapi-ugc-ads-workflow'), { product_name: 'P', human_image: 'h', product_image: 'p' }, () => {}, { onApproval }),
    ).rejects.toThrow(/approval/);
    expect(onApproval).toHaveBeenCalledWith(1, expect.anything());
    expect(muapi.generateI2V).not.toHaveBeenCalled();
  });

  it('continues past approval when approved', async () => {
    muapi.generateI2I.mockResolvedValue({ url: 'https://x/a.png' });
    muapi.generateImage.mockResolvedValue({ url: 'https://x/a.png' });
    muapi.generateI2V.mockResolvedValue({ url: 'https://x/v.mp4' });
    await runSkill('key', skill('muapi-ugc-ads-workflow'), { product_name: 'P', human_image: 'h', product_image: 'p' }, () => {}, { onApproval: async () => true });
    expect(muapi.generateI2V).toHaveBeenCalledTimes(1);
  });

  it('sends the source video to the clipping service as video_url', async () => {
    muapi.runClipping.mockResolvedValue({ url: 'https://x/clip.mp4' });
    await runSkill('key', skill('muapi-youtube-shorts'), { source_video: 'https://x/long.mp4' }, () => {});
    expect(muapi.runClipping.mock.calls[0][1]).toMatchObject({ video_url: 'https://x/long.mp4', aspect_ratio: '9:16' });
    expect(muapi.runClipping.mock.calls[0][1].images_list).toBeUndefined();
  });

  it('reports the error and rethrows when a step fails', async () => {
    muapi.generateImage.mockRejectedValue(new Error('boom'));
    const events = [];
    await expect(runSkill('key', skill('muapi-social-pack'), { product_name: 'P' }, (i, p) => events.push(p))).rejects.toThrow('boom');
    expect(events.some((e) => e.status === 'error')).toBe(true);
  });

  it('stops when the signal is aborted', async () => {
    const ctl = new AbortController();
    ctl.abort();
    await expect(runSkill('key', skill('muapi-social-pack'), { product_name: 'P' }, () => {}, { signal: ctl.signal })).rejects.toThrow(/cancelled/);
  });
});

describe('rebuilt recipes (Logo Creator, UI Design, Nano Banana, Cinema Director)', () => {
  const REBUILT = ['muapi-logo-creator', 'muapi-ui-design', 'muapi-nano-banana', 'muapi-cinema-director'];

  it('are visible, have real models and no leftover CLI placeholders', () => {
    for (const slug of REBUILT) {
      const s = skill(slug);
      expect(s.hidden, slug).toBeFalsy();
      expect(s.inputs.length, slug).toBeGreaterThan(0);
      for (const step of s.steps) expect(step.endpoint, slug).not.toMatch(/\.(sh|md)$/);
    }
  });

  it('every {{placeholder}} in a rebuilt recipe is a declared input (or the previous step)', () => {
    for (const slug of REBUILT) {
      const s = skill(slug);
      const names = new Set(s.inputs.map((i) => i.name));
      for (const step of s.steps) {
        for (const m of `${step.prompt} ${(step.references || []).join(' ')}`.matchAll(/\{\{(\w+(?:\.\w+)?)\}\}/g)) {
          const ok = names.has(m[1]) || /^phase\d+\.output$/.test(m[1]);
          expect(ok, `${slug}: {{${m[1]}}} is not an input`).toBe(true);
        }
      }
    }
  });

  it('Logo Creator opens in a studio with defaults filled and a visible placeholder for the brand', () => {
    const logo = skill('muapi-logo-creator');
    const prompt = fillTemplate(logo.steps[0].prompt, recipePromptValues(logo));
    expect(prompt).toContain('[Brand name]');
    expect(prompt).toContain('minimalist geometric');
    expect(prompt).not.toMatch(/\{\{|\bfor , /);
  });

  it('Cinema Director runs establishing frame then a camera-move video fed by that frame', async () => {
    muapi.generateImage.mockResolvedValue({ url: 'https://x/frame.png' });
    muapi.generateI2V.mockResolvedValue({ url: 'https://x/shot.mp4' });
    const cinema = skill('muapi-cinema-director');
    expect(cinema.kind).toBe('workflow');
    await runSkill('key', cinema, { scene: 'a lighthouse in a storm', camera_move: 'slow orbit', lens_and_lighting: '50mm', mood: 'lonely' }, () => {});
    expect(muapi.generateImage.mock.calls[0][1].prompt).toContain('a lighthouse in a storm');
    const video = muapi.generateI2V.mock.calls[0][1];
    expect(video.prompt).toContain('Camera: slow orbit');
    expect(video.images_list).toEqual(['https://x/frame.png']);
    expect(video.duration).toBe(5);
  });
});

describe('fillTemplate', () => {
  it('leaves no stray spaces when an optional input is empty', () => {
    const nano = skill('muapi-nano-banana');
    const prompt = fillTemplate(nano.steps[0].prompt, { subject: 'A red fox', action: '', context: 'a forest', composition: 'wide', lighting: 'dawn' });
    expect(prompt).toBe('A red fox. Setting: a forest. Composition: wide. Lighting: dawn. Highly detailed, photorealistic, sharp focus.');
    const logo = skill('muapi-logo-creator');
    const p2 = fillTemplate(logo.steps[0].prompt, { brand_name: 'Northwind', industry: 'gear', style: 'minimal', color_palette: 'green', symbol_idea: '' });
    expect(p2).not.toMatch(/ {2,}| [.,;!?]/);
    expect(p2).toContain('green. The wordmark reads exactly "Northwind"');
  });

  it('does not touch prompts that have no placeholders', () => {
    expect(fillTemplate('keep  this  spacing .', {})).toBe('keep  this  spacing .');
  });
});

describe('recipePromptValues', () => {
  it('uses defaults, a [Label] for required inputs without one, and blanks otherwise', () => {
    const vals = recipePromptValues({
      inputs: [
        { name: 'a', default: 'x' },
        { name: 'b', required: true, label: 'Brand name' },
        { name: 'c_d', required: true },
        { name: 'e' },
      ],
    });
    expect(vals).toEqual({ a: 'x', b: '[Brand name]', c_d: '[c d]', e: '' });
  });
});

describe('buildParams', () => {
  it('fills the prompt template', () => {
    const p = buildParams({ endpoint: 'm', prompt: 'Hi {{name}}' }, { name: 'Al' }, []);
    expect(p.prompt).toBe('Hi Al');
    expect(p.model).toBe('m');
  });
});
