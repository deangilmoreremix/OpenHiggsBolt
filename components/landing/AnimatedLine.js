'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

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

export default function AnimatedLine({
  text,
  words,
  interval = 3000,
  transition = 400,
  className = '',
}) {
  const prefersReducedMotion = getPrefersReducedMotion();

  const [state, setState] = useState(() =>
    words.map((word) => ({
      index: 0,
      phase: 'default',
    }))
  );

  const timersRef = useRef([]);

  useEffect(() => {
    if (prefersReducedMotion || words.length === 0) return;

    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    const timers = words.map((word, i) => {
      const timeout = setInterval(() => {
        setState((prev) => {
          const item = prev[i];
          if (item.phase !== 'default') return prev;

          const updated = [...prev];
          updated[i] = { ...item, phase: 'exiting' };
          return updated;
        });

        const timerId = setTimeout(() => {
          setState((prev) => {
            const item = prev[i];
            const nextPhraseIndex = (item.index + 1) % word.phrases.length;

            const updated = [...prev];
            updated[i] = {
              index: nextPhraseIndex,
              phase: 'entering',
            };
            return updated;
          });

          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              setState((prev) => {
                const item = prev[i];
                if (item.phase !== 'entering') return prev;
                const updated = [...prev];
                updated[i] = { ...item, phase: 'default' };
                return updated;
              });
            });
          });
        }, transition);

        timersRef.current.push(timerId);
        return timeout;
      }, word.interval || interval);

      return timeout;
    });

    return () => {
      timers.forEach(clearInterval);
      timersRef.current.forEach(clearTimeout);
    };
  }, [prefersReducedMotion, interval, transition, words]);

  if (prefersReducedMotion) {
    return (
      <span className={className} aria-live="polite">
        {text.split('[ANIMATED]').map((part, i) => (
          <span key={i}>
            {part}
            {i < words.length && (
              <span className="landing-gradient-text">{words[i].phrases[0]}</span>
            )}
          </span>
        ))}
      </span>
    );
  }

  let animatedWordIndex = 0;
  const parts = text.split('[ANIMATED]');

  const nodes = parts.map((part, i) => {
    const wordNode =
      i < words.length ? (
        <span
          key={`word-${i}`}
          className="animated-word-container animated-word-container--inline"
          aria-atomic="true"
        >
          {(() => {
            const item = state[animatedWordIndex];
            const word = words[animatedWordIndex];

            return (
              <span
                className={[
                  'animated-word landing-gradient-text',
                  item.phase === 'default'
                    ? 'animated-word--default'
                    : item.phase === 'exiting'
                      ? 'animated-word--exit'
                      : item.phase === 'entering'
                        ? 'animated-word--enter'
                        : 'animated-word--default',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {word.phrases[item.index]}
              </span>
            );
          })()}
        </span>
      ) : null;

    const nextIndex = animatedWordIndex + (wordNode ? 1 : 0);
    animatedWordIndex = nextIndex;

    return (
      <span key={i}>
        {part}
        {wordNode}
      </span>
    );
  });

  return (
    <span className={className} aria-live="polite" style={{ textWrap: 'balance' }}>
      {nodes}
    </span>
  );
}
