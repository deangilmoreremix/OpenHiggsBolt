/**
 * Beat grid for user music, so the director's scene changes land on the beat
 * (upstream ShotCraft does this with librosa offline; this is a light,
 * in-browser equivalent: energy-onset envelope → tempo by autocorrelation →
 * phase by onset alignment). Pure core (`beatsFromEnvelope`) + a browser
 * wrapper that decodes the file.
 */

const MIN_BPM = 70;
const MAX_BPM = 180;

/** Beat times (s) from a per-hop energy envelope. Returns [] when no clear pulse. */
export function beatsFromEnvelope(envelope: ArrayLike<number>, hopSec: number, durationSec: number): { bpm: number; beats: number[] } {
  const n = envelope.length;
  if (n < 16 || hopSec <= 0) return { bpm: 0, beats: [] };
  // Onset strength: half-wave rectified first difference.
  const onset = new Float64Array(n);
  for (let i = 1; i < n; i++) onset[i] = Math.max(0, envelope[i] - envelope[i - 1]);
  const mean = onset.reduce((a, b) => a + b, 0) / n;
  for (let i = 0; i < n; i++) onset[i] = Math.max(0, onset[i] - mean);

  // Tempo: lag with the strongest autocorrelation inside the BPM range.
  const minLag = Math.max(1, Math.floor(60 / MAX_BPM / hopSec));
  const maxLag = Math.min(n - 1, Math.ceil(60 / MIN_BPM / hopSec));
  let bestLag = 0;
  let bestScore = 0;
  for (let lag = minLag; lag <= maxLag; lag++) {
    let score = 0;
    for (let i = lag; i < n; i++) score += onset[i] * onset[i - lag];
    if (score > bestScore) {
      bestScore = score;
      bestLag = lag;
    }
  }
  if (!bestLag || bestScore <= 0) return { bpm: 0, beats: [] };

  // Phase: offset whose beat positions collect the most onset strength.
  let bestPhase = 0;
  let bestPhaseScore = -1;
  for (let phase = 0; phase < bestLag; phase++) {
    let score = 0;
    for (let i = phase; i < n; i += bestLag) score += onset[i];
    if (score > bestPhaseScore) {
      bestPhaseScore = score;
      bestPhase = phase;
    }
  }

  const period = bestLag * hopSec;
  const beats: number[] = [];
  for (let tSec = bestPhase * hopSec; tSec <= durationSec + 1e-6; tSec += period) beats.push(Math.round(tSec * 1000) / 1000);
  return { bpm: Math.round(60 / period), beats };
}

/** Decode an audio URL (object URL or same-origin) and return its beat grid. */
export async function analyzeBeats(url: string): Promise<{ bpm: number; beats: number[] }> {
  const AudioCtx: typeof AudioContext | undefined =
    typeof window !== 'undefined' ? (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) : undefined;
  if (!AudioCtx) return { bpm: 0, beats: [] };
  const data = await (await fetch(url)).arrayBuffer();
  const ctx = new AudioCtx();
  try {
    const audio = await ctx.decodeAudioData(data);
    const channel = audio.getChannelData(0);
    const hop = 512;
    const envelope = new Float64Array(Math.floor(channel.length / hop));
    for (let i = 0; i < envelope.length; i++) {
      let sum = 0;
      for (let j = i * hop; j < (i + 1) * hop; j++) sum += channel[j] * channel[j];
      envelope[i] = Math.sqrt(sum / hop);
    }
    return beatsFromEnvelope(envelope, hop / audio.sampleRate, audio.duration);
  } finally {
    void ctx.close();
  }
}
