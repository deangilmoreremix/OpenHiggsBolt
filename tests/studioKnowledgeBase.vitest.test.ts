import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const KB_PATH = path.resolve(process.cwd(), 'src/data/studioKnowledgeBase.json');
const SHELL_PATH = path.resolve(process.cwd(), 'components/StandaloneShell.js');
const LANDING_PATH = path.resolve(process.cwd(), 'components/landing/landingData.js');
const DEMO_MAP_PATH = path.resolve(process.cwd(), 'src/data/studioDemoMap.ts');

describe('studioKnowledgeBase source-of-truth', () => {
  let studios: any[];
  let shell: string;
  let landing: string;
  let demoMap: string;

  beforeAll(() => {
    const kb = JSON.parse(fs.readFileSync(KB_PATH, 'utf-8'));
    studios = Array.isArray(kb) ? kb : (kb.studios || []);
    shell = fs.readFileSync(SHELL_PATH, 'utf-8');
    landing = fs.readFileSync(LANDING_PATH, 'utf-8');
    demoMap = fs.readFileSync(DEMO_MAP_PATH, 'utf-8');
  });

  it('is a non-empty array', () => {
    expect(Array.isArray(studios)).toBe(true);
    expect(studios.length).toBeGreaterThan(0);
  });

  it('has exactly 21 entries', () => {
    expect(studios).toHaveLength(21);
  });

  it('every entry has required fields', () => {
    const required = [
      'id', 'name', 'route', 'description', 'keyFeatures', 'howToUse',
      'inputs', 'requiredInputs', 'optionalInputs', 'generationModes',
      'modelCapabilities', 'advancedFeatures', 'outputs', 'limitations',
      'troubleshooting', 'relatedStudios', 'sourceFiles', 'verification'
    ];
    for (const entry of studios) {
      for (const field of required) {
        expect(entry).toHaveProperty(field);
      }
    }
  });

  it('every id is a non-empty string', () => {
    for (const entry of studios) {
      expect(typeof entry.id).toBe('string');
      expect(entry.id.length).toBeGreaterThan(0);
    }
  });

  it('every route starts with /', () => {
    for (const entry of studios) {
      expect(entry.route.startsWith('/')).toBe(true);
    }
  });

  it('every sourceFiles path exists on disk', () => {
    for (const entry of studios) {
      for (const file of entry.sourceFiles) {
        const resolved = path.resolve(process.cwd(), file);
        expect(fs.existsSync(resolved), `Missing source file: ${file}`).toBe(true);
      }
    }
  });

  it('all TABS ids are present in the knowledge base', () => {
    const tabIds = [
      'image', 'video', 'audio', 'clipping', 'vibe-motion', 'lipsync',
      'cinema', 'storyboard', 'marketing', 'recast', 'layers', 'workflows',
      'agents', 'design-agent', 'vfx-studio', 'thumbnail-studio',
      'ai-influencer', 'social-publishing', 'go-ai-viral'
    ];
    const kbIds = new Set(studios.map(e => e.id));
    for (const id of tabIds) {
      expect(kbIds.has(id), `Missing KB entry for tab: ${id}`).toBe(true);
    }
  });

  it('includes standalone studio pages not in TABS', () => {
    const kbIds = new Set(studios.map(e => e.id));
    expect(kbIds.has('photo-studio')).toBe(true);
    expect(kbIds.has('brand-studio')).toBe(true);
  });

  it('verification metadata includes verifiedAt and verifiedBy', () => {
    for (const entry of studios) {
      expect(entry.verification).toBeDefined();
      expect(entry.verification.verifiedAt).toBeDefined();
      expect(entry.verification.verifiedBy).toBeDefined();
    }
  });

  it('no entry has empty keyFeatures array', () => {
    for (const entry of studios) {
      expect(Array.isArray(entry.keyFeatures)).toBe(true);
      expect(entry.keyFeatures.length).toBeGreaterThan(0);
    }
  });

  it('no entry has empty inputs array', () => {
    for (const entry of studios) {
      expect(Array.isArray(entry.inputs)).toBe(true);
      expect(entry.inputs.length).toBeGreaterThan(0);
    }
  });

  it('no entry has empty outputs array', () => {
    for (const entry of studios) {
      expect(Array.isArray(entry.outputs)).toBe(true);
      expect(entry.outputs.length).toBeGreaterThan(0);
    }
  });

  it('relatedStudios only reference known studio slugs', () => {
    const knownSlugs = new Set(studios.map(e => e.id));
    for (const entry of studios) {
      for (const related of entry.relatedStudios) {
        expect(knownSlugs.has(related), `Unknown related studio: ${related} in ${entry.id}`).toBe(true);
      }
    }
  });

  it('file is valid JSON with no parse errors', () => {
    expect(() => JSON.parse(fs.readFileSync(KB_PATH, 'utf-8'))).not.toThrow();
  });
});
