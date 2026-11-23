'use client';

import { useEffect } from 'react';
import { mountStudioTooltips } from './tooltipLayer';

/** Mounts the hover-help layer once for the studio shell. Renders nothing. */
export default function StudioTooltips() {
  useEffect(() => mountStudioTooltips(), []);
  return null;
}
