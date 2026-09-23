'use client';

import { useState, useEffect, useCallback } from 'react';

const getPrefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function useInterval(callback, delay) {
  const savedCallback = useCallback(() => callback(), [callback]);

  useEffect(() => {
    if (delay === null) return;
    const id = setInterval(savedCallback, delay);
    return () => clearInterval(id);
  }, [savedCallback, delay]);
}

export default function AnimatedHeadline({
  phrases,
  interval = 2800,
  transition = 420,
  className = '',
}) {
  const prefersReducedMotion = getPrefersReducedMotion();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1 % phrases.length);
  const [phase, setPhase] = useState('default');

  useInterval(() => {
    if (prefersReducedMotion) return;
    setPhase('exiting');
    setTimeout(() => {
      setCurrentIndex(nextIndex);
      setNextIndex((nextIndex + 1) % phrases.length);
      setPhase('entering');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setPhase('default');
        });
      });
    }, transition);
  }, prefersReducedMotion ? null : interval);

  if (prefersReducedMotion) {
    return (
      <span className={`inline-flex ${className}`} aria-live="polite">
        <span className="landing-gradient-text">{phrases[0]}</span>
      </span>
    );
  }

  const currentPhrase = phrases[currentIndex];
  const nextPhrase = phrases[nextIndex];

  return (
    <span
      className={`animated-headline ${className}`}
      style={{ textWrap: 'balance' }}
      aria-live="polite"
      aria-atomic="true"
    >
      <span
        className={[
          'animated-word-container',
          'animated-word-container--inline',
          'landing-gradient-text',
          phase === 'default' && 'animated-word--default',
          phase === 'exiting' && 'animated-word--exit',
          phase === 'entering' && 'animated-word--hidden',
          'animated-word--initialized',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-hidden={phase !== 'default'}
      >
        {currentPhrase}
      </span>
      {phase === 'entering' && (
        <span
          className={[
            'animated-word-container',
            'animated-word-container--inline',
            'landing-gradient-text',
            'animated-word--enter',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-hidden
        >
          {nextPhrase}
        </span>
      )}
    </span>
  );
}
