import { describe, expect, it } from 'vitest';
import {
  MOTION_TEMPLATES,
  MOTION_TEMPLATE_CARDS,
  englishRecipeName,
  motionTemplateTitle,
  searchMotionTemplates,
} from '../motionRecipeCatalog';

describe('English recipe titles', () => {
  it('turns upstream keys into readable English', () => {
    expect(englishRecipeName('crash-zoom-punch · CrashImpactReal')).toBe('Crash Zoom Punch · Crash Impact Real');
    expect(englishRecipeName('basic-3d-scene')).toBe('Basic 3D Scene');
    expect(englishRecipeName('chart-live-moves · AxisRescaleShockV2')).toBe('Chart Live Moves · Axis Rescale Shock V2');
    expect(englishRecipeName('fui-hud-moves · ReticleLockOn')).toBe('FUI HUD Moves · Reticle Lock On');
  });

  it('gives every shot and card an ASCII English title with no raw keys left', () => {
    for (const t of [...MOTION_TEMPLATES, ...MOTION_TEMPLATE_CARDS]) {
      const title = motionTemplateTitle(t);
      expect(title.replace(' · ', '').length).toBeGreaterThan(0);
      expect(/^[\x20-\x7e·]+$/.test(title), `${t.id}: ${title}`).toBe(true);
      expect(title, `${t.id} still kebab-case`).not.toMatch(/[a-z]-[a-z]/);
    }
  });

  it('search matches the English title', () => {
    const hits = searchMotionTemplates('crash zoom');
    expect(hits.some((t) => t.slug === 'crash-zoom-punch')).toBe(true);
  });
});
