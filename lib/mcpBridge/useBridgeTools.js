'use client';
import { useEffect, useRef } from 'react';
import { setBridgeTools } from './index.js';

/**
 * Offer a studio's tab tools while the component is mounted. `latest` is whatever the tools need to read (the studio's current state/actions);
 * it is kept in a ref so the tools always see the newest render without re-registering. `factory(get)` builds the tool list once.
 */
export function useBridgeTools(studio, latest, factory) {
  const ref = useRef(latest);
  ref.current = latest;
  useEffect(() => {
    setBridgeTools(studio, factory(() => ref.current));
    return () => setBridgeTools(studio, []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studio]);
}
