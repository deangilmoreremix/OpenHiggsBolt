'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { MOUNT_ALL_EVENT } from './SmoothScroll';

/**
 * Mounts its children only once they come within about one and a half
 * screens of the viewport, so the long demo showcase doesn't build hundreds
 * of cards up front. Until then it reserves roughly the section's height.
 *
 * The wrapper stays in place afterwards and carries the section's `id`, so
 * anchors and observers (IndustryNav) keep a stable element; give the inner
 * section no id of its own. An in-page jump mounts everything first
 * (MOUNT_ALL_EVENT, fired by scrollToTarget) so it lands accurately.
 */
export default function NearViewport({
  id,
  children,
  placeholderClassName = 'min-h-[1200px] lg:min-h-[1100px]',
}: {
  id?: string;
  children: ReactNode;
  /** Reserved height before mounting; close to the real section's height. */
  placeholderClassName?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    if (near) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setNear(true);
      return;
    }
    const mount = () => setNear(true);
    const io = new IntersectionObserver(([entry]) => entry.isIntersecting && mount(), { rootMargin: '150% 0px' });
    io.observe(el);
    window.addEventListener(MOUNT_ALL_EVENT, mount);
    return () => {
      io.disconnect();
      window.removeEventListener(MOUNT_ALL_EVENT, mount);
    };
  }, [near]);

  return (
    <div ref={ref} id={id} data-anchor={id ? '' : undefined} className={near ? undefined : placeholderClassName}>
      {near ? children : null}
    </div>
  );
}
