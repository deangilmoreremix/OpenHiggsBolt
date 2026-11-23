'use client';
import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Image, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

// Real demo stills already shipped in /public, shown as floating holographic panes.
const PANES = [
  '/media/promptfeed/previews/1523_handheld-16mm-gym-vlog-pov-of-chase-in-an-evening-gym.jpg',
  '/media/promptfeed/previews/1949_handheld-coffee-vlog-with-mini-dv-aesthetic.jpg',
  '/media/promptfeed/previews/2082_tresemm-luxury-haircare-commercial.jpg',
  '/media/promptfeed/previews/1950_animated-forest-riverside-picnic.jpg',
  '/media/promptfeed/previews/2690_cinematic-korean-convenience-store-snack-challenge-vlog.jpg',
  '/media/promptfeed/previews/2291_pixar-style-30-second-3d-animated-short-of-a-beggar-and-a-cr.jpg',
  '/media/promptfeed/previews/2673_15-second-live-action-video-prompt-alex-time-warp-disaster.jpg',
];

const RADIUS = 5.2;

function PaneRing() {
  const group = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.06;
  });

  return (
    <group ref={group} position={[0, 1.3, -2.5]} rotation={[0.08, 0, 0]}>
      {PANES.map((url, i) => {
        const angle = (i / PANES.length) * Math.PI * 2;
        return (
          <Float key={url} speed={1.4} rotationIntensity={0.25} floatIntensity={0.6}>
            <group
              position={[Math.sin(angle) * RADIUS, (i % 2 ? 0.7 : -0.5), Math.cos(angle) * RADIUS]}
              rotation={[0, angle, 0]}
            >
              <Image url={url} scale={[2.4, 1.35]} transparent opacity={0.5} toneMapped={false} />
              {/* Holographic edge */}
              <mesh>
                <planeGeometry args={[2.5, 1.45]} />
                <meshBasicMaterial
                  color={i % 2 ? '#a855f7' : '#22d3ee'}
                  transparent
                  opacity={0.12}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                  side={THREE.DoubleSide}
                />
              </mesh>
            </group>
          </Float>
        );
      })}
    </group>
  );
}

function HaloRings() {
  const a = useRef<THREE.Mesh>(null);
  const b = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (a.current) a.current.rotation.z += delta * 0.12;
    if (b.current) b.current.rotation.z -= delta * 0.08;
  });
  return (
    <group position={[0, 1.6, -3.5]}>
      <mesh ref={a} rotation={[Math.PI / 2.3, 0, 0]}>
        <torusGeometry args={[4.4, 0.012, 16, 200]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.28} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={b} rotation={[Math.PI / 2.05, 0.25, 0]}>
        <torusGeometry args={[5.6, 0.008, 16, 220]} />
        <meshBasicMaterial color="#a855f7" transparent opacity={0.22} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

/** Eases the camera toward the pointer and pulls it back as the hero scrolls away. */
function CameraRig() {
  const { camera } = useThree();
  // The canvas is pointer-events: none so it never blocks the hero CTAs, so
  // track the cursor on the window instead of through R3F events.
  const pointer = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);
  useFrame(() => {
    const { current: p } = pointer;
    const scroll = Math.min(window.scrollY / window.innerHeight, 1.5);
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, p.x * 0.8, 0.04);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, p.y * 0.45 - scroll * 0.6, 0.04);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, 8 + scroll * 3, 0.06);
    camera.lookAt(0, 0, -2.5);
  });
  return null;
}

/**
 * Hero 3D backdrop (React Three Fiber + Drei). Rendered only on desktop by the
 * caller. Stops rendering while the hero is off screen.
 */
export default function HeroScene() {
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

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
        camera={{ position: [0, 0, 8], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <Suspense fallback={null}>
          <PaneRing />
        </Suspense>
        <HaloRings />
        <Sparkles count={90} scale={[14, 7, 8]} size={2.2} speed={0.35} color="#a5f3fc" opacity={0.7} />
        <Sparkles count={40} scale={[12, 6, 6]} size={3} speed={0.25} color="#c4b5fd" opacity={0.5} />
        <CameraRig />
      </Canvas>
    </div>
  );
}
