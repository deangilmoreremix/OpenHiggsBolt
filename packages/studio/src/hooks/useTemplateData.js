import { useEffect, useRef, useState } from 'react';

const VALID_ASPECT_RATIOS = new Set([
  '1:1',
  '16:9',
  '9:16',
  '4:3',
  '3:4',
  '4:5',
  '3:2',
  '2:3',
  '21:9',
  '9:21',
]);

export function isValidAspectRatio(value) {
  if (!value || typeof value !== 'string') return false;
  return VALID_ASPECT_RATIOS.has(value.trim());
}

export function normalizeAspectRatio(value, fallback = '16:9') {
  if (!value || typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return isValidAspectRatio(trimmed) ? trimmed : fallback;
}

export function useTemplateData(templateData, onApply) {
  const [appliedTemplateId, setAppliedTemplateId] = useState(null);
  const [applyError, setApplyError] = useState(null);
  const templateApplied = useRef(null);

  useEffect(() => {
    if (!templateData) {
      setAppliedTemplateId(null);
      return;
    }

    const templateId =
      (templateData.sourceRepo && templateData.slug
        ? `${templateData.sourceRepo}|${templateData.slug}`
        : templateData.slug) || null;

    if (!templateId || templateApplied.current === templateId) {
      return;
    }

    templateApplied.current = templateId;
    setAppliedTemplateId(templateId);
    setApplyError(null);

    try {
      if (onApply) {
        onApply(templateData);
      }
    } catch (error) {
      setApplyError(error);
      console.error('Failed to apply templateData:', error);
    }
  }, [templateData, onApply]);

  const reset = () => {
    templateApplied.current = null;
    setAppliedTemplateId(null);
    setApplyError(null);
  };

  return {
    appliedTemplateId,
    applyError,
    reset,
    isTemplateApplied: Boolean(appliedTemplateId),
  };
}
