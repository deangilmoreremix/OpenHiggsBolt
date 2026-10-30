'use client';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

// Register once on the client. Every landing-page effect imports gsap from here
// so the plugins are guaranteed to be registered before use.
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText);
}

/** Matches when the visitor has not asked the OS to reduce motion. */
export const MOTION_OK = '(prefers-reduced-motion: no-preference)';
/** Desktop-class device: precise pointer and a wide viewport. */
export const DESKTOP_MOTION = '(prefers-reduced-motion: no-preference) and (pointer: fine) and (min-width: 1024px)';

export { gsap, ScrollTrigger, SplitText };
