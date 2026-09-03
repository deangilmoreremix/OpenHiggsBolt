import { describe, expect, it } from 'vitest';
import { videoModelCatalog } from './modelFamilies.js';
import {
  buildVideoWorkflowMediaParams,
  getVideoWorkflowMediaSlots,
  resolvePersistedVideoWorkflowSelection,
  resolveVideoBaseVariant,
  resolveVideoWorkflowVariant,
  validateVideoWorkflowMedia,
} from './videoWorkflows.js';

describe('video workflow parity', () => {
  it('resolves a real base variant when leaving a specialized workflow', () => {
    const workflowVariant = resolveVideoWorkflowVariant(
      'seedance-2',
      'keyframes',
      'seedance-2-first-last-frame',
    );
    expect(workflowVariant?.model?.id).toBeTruthy();

    const baseVariant = resolveVideoBaseVariant(
      'seedance-2',
      workflowVariant.model.id,
    );
    expect(baseVariant?.model?.id).toBeTruthy();
    expect(baseVariant.model.id).not.toBe(workflowVariant.model.id);
    expect(baseVariant.mode).toBe('t2v');
  });

  it('recovers keyframe workflow selection from persisted media state', () => {
    const variantId = 'seedance-2-first-last-frame';
    const restored = resolvePersistedVideoWorkflowSelection(
      variantId,
      null,
      { hasEndFrame: true },
    );

    expect(restored.family?.id).toBe('seedance-2');
    expect(restored.variant?.model?.id).toBeTruthy();
    expect(restored.workflowId).toBe('keyframes');
  });

  it('keeps first and last frames separate in validation and payload mapping', () => {
    const variant = resolveVideoWorkflowVariant(
      'seedance-2',
      'keyframes',
      'seedance-2-first-last-frame',
    );
    expect(variant?.model).toBeTruthy();

    const slots = getVideoWorkflowMediaSlots(variant.model, 'keyframes');
    const startSlot = slots.find((slot) => slot.id === 'startFrame');
    const endSlot = slots.find((slot) => slot.id === 'endFrame');
    expect(startSlot).toBeTruthy();
    expect(endSlot).toBeTruthy();

    const media = {
      startFrame: ['https://example.com/start.jpg'],
      endFrame: ['https://example.com/end.jpg'],
    };
    expect(validateVideoWorkflowMedia('keyframes', media, variant.model)).toEqual({
      valid: true,
      message: '',
    });

    const payload = buildVideoWorkflowMediaParams(variant.model, 'keyframes', media);
    if (startSlot.field === endSlot.field && startSlot.index !== undefined && endSlot.index !== undefined) {
      expect(payload[startSlot.field][startSlot.index]).toBe(media.startFrame[0]);
      expect(payload[endSlot.field][endSlot.index]).toBe(media.endFrame[0]);
    } else {
      const startValue = payload[startSlot.field];
      const endValue = payload[endSlot.field];
      expect(Array.isArray(startValue) ? startValue[0] : startValue).toBe(media.startFrame[0]);
      expect(Array.isArray(endValue) ? endValue[0] : endValue).toBe(media.endFrame[0]);
    }
  });

  it('requires both media roles for motion transfer when the model exposes them', () => {
    const variant = resolveVideoWorkflowVariant(
      'kling-v3',
      'motion_transfer',
      'kling-v3.0-pro-motion-control',
    );
    expect(variant?.model).toBeTruthy();
    expect(
      validateVideoWorkflowMedia(
        'motion_transfer',
        { characterImage: ['https://example.com/character.jpg'] },
        variant.model,
      ).valid,
    ).toBe(false);
    expect(
      validateVideoWorkflowMedia(
        'motion_transfer',
        {
          characterImage: ['https://example.com/character.jpg'],
          drivingVideo: ['https://example.com/motion.mp4'],
        },
        variant.model,
      ).valid,
    ).toBe(true);
  });

  it('keeps the workflow catalog tied to the current model catalog', () => {
    expect(videoModelCatalog.familyById.get('seedance-2')).toBeTruthy();
    expect(videoModelCatalog.familyById.get('kling-v3')).toBeTruthy();
  });
});
