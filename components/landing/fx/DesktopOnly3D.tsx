'use client';
import { Component, useEffect, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { useMediaQuery } from './useMediaQuery';
import { DESKTOP_MOTION } from './gsap';

const HeroScene = dynamic(() => import('./HeroScene'), { ssr: false });
const ParticleField = dynamic(() => import('./ParticleField'), { ssr: false });

const SCENES = { hero: HeroScene, particles: ParticleField };

// three r163+ renders with WebGL 2 only, so a WebGL 1 context is not enough.
function supportsWebGL2() {
  try {
    return Boolean(document.createElement('canvas').getContext('webgl2'));
  } catch {
    return false;
  }
}

/** Keeps a renderer failure (lost/blocked GPU context) from reaching the page. */
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * Mounts a Three.js scene only on desktop-class devices with WebGL 2 and no
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
    if (!desktop || !supportsWebGL2()) return;
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
      <SceneBoundary>
        <Scene />
      </SceneBoundary>
    </div>
  );
}
