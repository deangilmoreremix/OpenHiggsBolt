'use client';
import { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';

/** Lightweight particle backdrop (Drei Sparkles). Desktop only, paused off screen. */
export default function ParticleField() {
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = wrap.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrap} className="absolute inset-0">
      <Canvas
        dpr={[1, 1.5]}
        frameloop={visible ? 'always' : 'never'}
        camera={{ position: [0, 0, 6], fov: 50 }}
        gl={{ alpha: true, antialias: false, powerPreference: 'low-power' }}
      >
        <Sparkles count={120} scale={[12, 5, 4]} size={2.4} speed={0.3} color="#a5f3fc" opacity={0.65} />
        <Sparkles count={60} scale={[12, 5, 4]} size={3.2} speed={0.2} color="#c4b5fd" opacity={0.5} />
      </Canvas>
    </div>
  );
}
