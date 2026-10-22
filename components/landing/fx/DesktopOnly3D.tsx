'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useMediaQuery } from './useMediaQuery';
import { DESKTOP_MOTION } from './gsap';

const HeroScene = dynamic(() => import('./HeroScene'), { ssr: false });
const ParticleField = dynamic(() => import('./ParticleField'), { ssr: false });

const SCENES = { hero: HeroScene, particles: ParticleField };

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

/**
 * Mounts a Three.js scene only on desktop-class devices with WebGL and no
 * reduced-motion preference, and only after the browser is idle, so the 3D
 * bundle never competes with the first paint. Everyone else keeps the
 * existing CSS backdrop.
 */
export default function DesktopOnly3D({
  scene,
  className = '',
  fullBleed = false,
}: {
  scene: keyof typeof SCENES;
  className?: string;
  /** Span the full viewport width even inside a max-width container. */
  fullBleed?: boolean;
}) {
  const desktop = useMediaQuery(DESKTOP_MOTION);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!desktop || !supportsWebGL()) return;
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 600));
    const cancel = window.cancelIdleCallback ?? window.clearTimeout;
    const id = idle(() => setReady(true), { timeout: 2000 } as IdleRequestOptions);
    return () => cancel(id as number);
  }, [desktop]);

  if (!desktop || !ready) return null;
  const Scene = SCENES[scene];
  return (
    <div
      aria-hidden="true"
      className={`fx-fade-in pointer-events-none absolute ${fullBleed ? 'inset-y-0 left-1/2 w-screen -translate-x-1/2' : 'inset-0'} ${className}`}
    >
      <Scene />
    </div>
  );
}
