import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const KB_PATH = path.resolve(process.cwd(), 'src/data/studioKnowledgeBase.json');

const REQUIRED_DOC_FIELDS = [
  'shortDescription',
  'fullDescription',
  'whenToUse',
  'whenToUseAnother',
  'bestFor',
  'featureExplanations',
  'inputDetails',
  'modeExplanations',
  'modelExplanations',
  'howToSteps',
  'advancedFeatureExplanations',
  'outputDetails',
  'exampleWorkflows',
  'tips',
  'commonProblems',
  'troubleshootingSteps',
  'limitationDetails',
  'relatedStudioGuidance',
  'academyGuidance',
  'faqs'
];

describe('studioKnowledgeBase content completeness', () => {
  let studios: any[];

  beforeAll(() => {
    const kb = JSON.parse(fs.readFileSync(KB_PATH, 'utf-8'));
    const arr = Array.isArray(kb) ? kb : (kb.studios || []);
    studios = arr;
  });

  it('has 21 studios', () => {
    expect(studios).toHaveLength(21);
  });

  it('every studio has all required documentation fields', () => {
    for (const studio of studios) {
      for (const field of REQUIRED_DOC_FIELDS) {
        expect(studio, `Missing ${field} in ${studio.id}`).toHaveProperty(field);
      }
    }
  });

  it('every shortDescription is a non-empty string', () => {
    for (const studio of studios) {
      expect(typeof studio.shortDescription).toBe('string');
      expect(studio.shortDescription.length).toBeGreaterThan(0);
    }
  });

  it('every fullDescription is a non-empty string', () => {
    for (const studio of studios) {
      expect(typeof studio.fullDescription).toBe('string');
      expect(studio.fullDescription.length).toBeGreaterThan(0);
    }
  });

  it('every whenToUse is a non-empty array', () => {
    for (const studio of studios) {
      expect(Array.isArray(studio.whenToUse)).toBe(true);
      expect(studio.whenToUse.length).toBeGreaterThan(0);
    }
  });

  it('every whenToUseAnother is a non-empty array', () => {
    for (const studio of studios) {
      expect(Array.isArray(studio.whenToUseAnother)).toBe(true);
      expect(studio.whenToUseAnother.length).toBeGreaterThan(0);
    }
  });

  it('every bestFor is a non-empty string', () => {
    for (const studio of studios) {
      expect(typeof studio.bestFor).toBe('string');
      expect(studio.bestFor.length).toBeGreaterThan(0);
    }
  });

  it('every featureExplanations is a non-empty array', () => {
    for (const studio of studios) {
      expect(Array.isArray(studio.featureExplanations)).toBe(true);
      expect(studio.featureExplanations.length).toBeGreaterThan(0);
    }
  });

  it('every inputDetails is a non-empty array', () => {
    for (const studio of studios) {
      expect(Array.isArray(studio.inputDetails)).toBe(true);
      expect(studio.inputDetails.length).toBeGreaterThan(0);
    }
  });

  it('every modeExplanations is a non-empty array', () => {
    for (const studio of studios) {
      expect(Array.isArray(studio.modeExplanations)).toBe(true);
      expect(studio.modeExplanations.length).toBeGreaterThan(0);
    }
  });

  it('every modelExplanations is a non-empty string', () => {
    for (const studio of studios) {
      expect(typeof studio.modelExplanations).toBe('string');
      expect(studio.modelExplanations.length).toBeGreaterThan(0);
    }
  });

  it('every howToSteps is a non-empty array', () => {
    for (const studio of studios) {
      expect(Array.isArray(studio.howToSteps)).toBe(true);
      expect(studio.howToSteps.length).toBeGreaterThan(0);
    }
  });

  it('every advancedFeatureExplanations is a non-empty array', () => {
    for (const studio of studios) {
      expect(Array.isArray(studio.advancedFeatureExplanations)).toBe(true);
      expect(studio.advancedFeatureExplanations.length).toBeGreaterThan(0);
    }
  });

  it('every outputDetails is a non-empty array', () => {
    for (const studio of studios) {
      expect(Array.isArray(studio.outputDetails)).toBe(true);
      expect(studio.outputDetails.length).toBeGreaterThan(0);
    }
  });

  it('every exampleWorkflows is a non-empty array', () => {
    for (const studio of studios) {
      expect(Array.isArray(studio.exampleWorkflows)).toBe(true);
      expect(studio.exampleWorkflows.length).toBeGreaterThan(0);
    }
  });

  it('every tips is a non-empty array', () => {
    for (const studio of studios) {
      expect(Array.isArray(studio.tips)).toBe(true);
      expect(studio.tips.length).toBeGreaterThan(0);
    }
  });

  it('every commonProblems is a non-empty array', () => {
    for (const studio of studios) {
      expect(Array.isArray(studio.commonProblems)).toBe(true);
      expect(studio.commonProblems.length).toBeGreaterThan(0);
    }
  });

  it('every troubleshootingSteps is a non-empty array', () => {
    for (const studio of studios) {
      expect(Array.isArray(studio.troubleshootingSteps)).toBe(true);
      expect(studio.troubleshootingSteps.length).toBeGreaterThan(0);
    }
  });

  it('every limitationDetails is a non-empty array', () => {
    for (const studio of studios) {
      expect(Array.isArray(studio.limitationDetails)).toBe(true);
      expect(studio.limitationDetails.length).toBeGreaterThan(0);
    }
  });

  it('every relatedStudioGuidance is a non-empty array', () => {
    for (const studio of studios) {
      expect(Array.isArray(studio.relatedStudioGuidance)).toBe(true);
      expect(studio.relatedStudioGuidance.length).toBeGreaterThan(0);
    }
  });

  it('every academyGuidance is a non-empty array', () => {
    for (const studio of studios) {
      expect(Array.isArray(studio.academyGuidance)).toBe(true);
      expect(studio.academyGuidance.length).toBeGreaterThan(0);
    }
  });

  it('every faqs is a non-empty array', () => {
    for (const studio of studios) {
      expect(Array.isArray(studio.faqs)).toBe(true);
      expect(studio.faqs.length).toBeGreaterThan(0);
    }
  });

  it('no documentation contains generic AI filler phrases', () => {
    const fillerPhrases = [
      'use the power of AI',
      'harness the power',
      'unlock the potential',
      'revolutionize your',
      'leverage AI'
    ];
    for (const studio of studios) {
      const docText = JSON.stringify(studio).toLowerCase();
      for (const phrase of fillerPhrases) {
        expect(docText).not.toContain(phrase);
      }
    }
  });
});
