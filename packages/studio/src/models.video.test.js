// UNIT — video model helpers exported from models.js.
// Asserts sane outputs for representative model ids: a Seedance (ByteDance)
// and a Veo (Google) T2V model, plus an I2V model with maxImages / lastImageField.
//
// NOTE on getQualitiesForModel: per VIDEO_STUDIO_AUDIT.md §5 it is a *local*
// helper defined inside VideoStudio.jsx (not exported from models.js), so it
// cannot be imported here without modifying that component (disallowed). The
// final test below instead pins the exact data shape getQualitiesForModel reads
// (model.inputs.quality.enum), which guards the same contract.
import { describe, it, expect } from 'vitest';
import {
  t2vModels,
  getAspectRatiosForVideoModel,
  getDurationsForModel,
  getResolutionsForVideoModel,
  getModesForModel,
  getMaxImagesForI2VModel,
} from './models.js';

describe('getAspectRatiosForVideoModel', () => {
  it('returns declared enum for Seedance 2.0 T2V', () => {
    expect(getAspectRatiosForVideoModel('seedance-v2.0-t2v')).toEqual([
      '16:9',
      '9:16',
      '4:3',
      '3:4',
    ]);
  });

  it('returns declared enum for Veo 3 T2V', () => {
    expect(getAspectRatiosForVideoModel('veo3-text-to-video')).toEqual(['16:9', '9:16']);
  });

  it('falls back to a default set for an unknown model id', () => {
    expect(getAspectRatiosForVideoModel('does-not-exist')).toEqual(['16:9']);
  });
});

describe('getDurationsForModel', () => {
  it('returns the duration enum for Seedance 2.0 T2V', () => {
    expect(getDurationsForModel('seedance-v2.0-t2v')).toEqual([5, 10, 15]);
  });

  it('returns [] when the model declares no duration (Veo 3)', () => {
    expect(getDurationsForModel('veo3-text-to-video')).toEqual([]);
  });

  it('returns the single-value enum for Veo 3.1 T2V', () => {
    expect(getDurationsForModel('veo3.1-text-to-video')).toEqual([8]);
  });
});

describe('getResolutionsForVideoModel', () => {
  it('returns [] when the model declares no resolution (Seedance 2.0)', () => {
    expect(getResolutionsForVideoModel('seedance-v2.0-t2v')).toEqual([]);
  });

  it('returns the resolution enum for Veo 3.1 T2V', () => {
    expect(getResolutionsForVideoModel('veo3.1-text-to-video')).toEqual(['1080p']);
  });

  it('returns [] for an unknown model id', () => {
    expect(getResolutionsForVideoModel('nope')).toEqual([]);
  });
});

describe('getModesForModel', () => {
  it('returns the mode enum for a mode-capable model (Grok Imagine)', () => {
    expect(getModesForModel('grok-imagine-text-to-video')).toEqual([
      'fun',
      'normal',
      'spicy',
    ]);
  });

  it('returns [] for a model without a mode input (Seedance 2.0 T2V)', () => {
    expect(getModesForModel('seedance-v2.0-t2v')).toEqual([]);
  });

  it('returns [] for an unknown model id', () => {
    expect(getModesForModel('nope')).toEqual([]);
  });
});

describe('getMaxImagesForI2VModel', () => {
  it('returns the explicit maxImages when declared (Seedance 2.0 I2V)', () => {
    expect(getMaxImagesForI2VModel('seedance-v2.0-i2v')).toBe(5);
  });

  it('returns 2 when lastImageField is present but maxImages is not (Kling v2.1 Master I2V)', () => {
    expect(getMaxImagesForI2VModel('kling-v2.1-master-i2v')).toBe(2);
  });

  it('returns 1 as the base case (AI Video Effects)', () => {
    expect(getMaxImagesForI2VModel('ai-video-effects')).toBe(1);
  });

  it('returns 1 for an unknown model id', () => {
    expect(getMaxImagesForI2VModel('nope')).toBe(1);
  });
});

describe('getQualitiesForModel contract (data shape the local helper reads)', () => {
  const findT2V = (id) => t2vModels.find((m) => m.id === id);

  it('Seedance 2.0 T2V exposes a quality enum the helper would return', () => {
    expect(findT2V('seedance-v2.0-t2v')?.inputs?.quality?.enum).toEqual(['high', 'basic']);
  });

  it('Wan 2.1 T2V exposes a quality enum the helper would return', () => {
    expect(findT2V('wan2.1-text-to-video')?.inputs?.quality?.enum).toEqual(['medium', 'high']);
  });

  it('Veo 3 T2V has no quality input, so the helper would return []', () => {
    expect(findT2V('veo3-text-to-video')?.inputs?.quality?.enum ?? []).toEqual([]);
  });
});
