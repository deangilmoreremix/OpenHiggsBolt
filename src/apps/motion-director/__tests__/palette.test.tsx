import { afterEach, describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AS_DESIGNED, DIRECTOR_THEMES, PRESET_PALETTES, resolvePalette, SITE_THEME, skinLook } from '../lib/palette';
import { LOOKS, designedLook } from '../demosrc/_fixtures/Look';
import { FONT } from '../demosrc/_fixtures/Polish';
import { setClipPalette, setFilmPalette } from '../demosrc/_fixtures/skin';

afterEach(() => {
  setFilmPalette(null);
  setClipPalette(undefined);
});

describe('palettes as upstream THEMES.md', () => {
  it('offers the upstream presets with their exact colours, plus As designed and Your site', () => {
    const ids = DIRECTOR_THEMES.map((t) => t.id);
    expect(ids).toEqual([AS_DESIGNED, SITE_THEME, 'modern-light', 'midnight', 'solar-pop', 'coral-burst', 'color-play', 'deep-ocean', 'obsidian-violet', 'vintage-kraft']);
    expect(PRESET_PALETTES.midnight.accent).toBe('#61d9ef');
    expect(Object.keys(PRESET_PALETTES['vintage-kraft']).sort()).toEqual(['accent', 'border', 'field', 'muted', 'page', 'surface', 'text']);
    expect(DIRECTOR_THEMES[0].palette).toBeUndefined(); // as designed: no palette editor, like Ink Press
  });

  it('resolves preset, then film colours, then the clip, dropping invalid values', () => {
    expect(resolvePalette(AS_DESIGNED)).toBeNull();
    const p = resolvePalette('midnight', { accent: '#ff0000', text: 'red' }, { accent: '#00ff00' })!;
    expect(p.page).toBe(PRESET_PALETTES.midnight.page);
    expect(p.text).toBe(PRESET_PALETTES.midnight.text);
    expect(p.accent).toBe('#00ff00');
  });
});

describe('re-skinning the recipe looks', () => {
  it('a same-polarity palette repaints ground, surfaces, text and accent', () => {
    const look = skinLook(designedLook('midnight'), PRESET_PALETTES['deep-ocean']);
    expect(look.bg[1]).toBe('#0b1620');
    expect(look.surface).toBe('#142735');
    expect(look.ink).toBe('#e8f1f5');
    expect(look.accent).toBe('#7cc8b4');
    expect(look.line).toBe('#304957');
  });

  it('a palette of the other polarity only brings its accent (the recipe keeps its ground)', () => {
    const look = skinLook(designedLook('midnight'), PRESET_PALETTES['coral-burst']);
    expect(look.bg).toEqual(designedLook('midnight').bg);
    expect(look.ink).toBe(designedLook('midnight').ink);
    expect(look.accent).toBe('#d94e59');
  });

  it('the film palette reaches recipes through LOOKS, and null restores the designed look', () => {
    setFilmPalette(PRESET_PALETTES['obsidian-violet']);
    expect(LOOKS.aurora.accent).toBe('#bca0e8');
    setFilmPalette(null);
    expect(LOOKS.aurora.accent).toBe(designedLook('aurora').accent);
  });

  it('two clips in one frame draw in their own palettes', () => {
    const Recipe = () => <i>{LOOKS.midnight.accent}</i>;
    const Clip: React.FC<{ palette?: Record<string, string> }> = ({ palette }) => {
      setClipPalette(palette ? resolvePalette(AS_DESIGNED, undefined, palette) : undefined);
      return <Recipe />;
    };
    setFilmPalette({ accent: '#123456' });
    const html = renderToStaticMarkup(<div><Clip palette={{ accent: '#ff0000' }} /><Clip /><Clip palette={{ accent: '#00ff00' }} /></div>);
    expect(html).toBe('<div><i>#ff0000</i><i>#123456</i><i>#00ff00</i></div>');
  });

  it('the product font leads the sans stack', () => {
    setFilmPalette({ accent: '#123456', font: '"Inter Tight"' });
    expect(FONT.sans.startsWith('"Inter Tight", ')).toBe(true);
    setFilmPalette(null);
    expect(FONT.sans.startsWith('-apple-system')).toBe(true);
  });
});
