'use client';
import { useEffect, useState } from 'react';
import { DotLottieReact, setWasmUrl, type DotLottie } from '@lottiefiles/dotlottie-react';

// Self-hosted player runtime: the default CDN URL is blocked by the site CSP.
// public/lottie/dotlottie-player.wasm must match the installed
// @lottiefiles/dotlottie-web version (copy it again after upgrading).
setWasmUrl('/lottie/dotlottie-player.wasm');

/** dotLottie animation that plays while `playing` is true and rests otherwise. */
export default function LottieIcon({
  src,
  playing,
  className = '',
}: {
  src: string;
  playing: boolean;
  className?: string;
}) {
  const [player, setPlayer] = useState<DotLottie | null>(null);

  useEffect(() => {
    if (!player) return;
    if (playing) player.play();
    else player.pause();
  }, [player, playing]);

  return (
    <DotLottieReact
      src={src}
      loop
      autoplay={playing}
      dotLottieRefCallback={setPlayer}
      className={className}
      renderConfig={{ autoResize: true }}
    />
  );
}
