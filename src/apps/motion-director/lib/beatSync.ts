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
  // Log-compressed so a loud chorus does not drown the quiet verse's pulse.
  const env = new Float64Array(n);
  for (let i = 0; i < n; i++) env[i] = Math.log1p(60 * Math.max(0, envelope[i]));
  const onset = new Float64Array(n);
  for (let i = 1; i < n; i++) onset[i] = Math.max(0, env[i] - env[i - 1]);
  const mean = onset.reduce((a, b) => a + b, 0) / n;
  for (let i = 0; i < n; i++) onset[i] = Math.max(0, onset[i] - mean);

  // Tempo: lag with the strongest autocorrelation inside the BPM range.
  const minLag = Math.max(1, Math.floor(60 / MAX_BPM / hopSec));
  const maxLag = Math.min(n - 1, Math.ceil(60 / MIN_BPM / hopSec));
  const scores = new Float64Array(maxLag + 2);
  let bestLag = 0;
  let bestScore = 0;
  for (let lag = minLag; lag <= maxLag; lag++) {
    let score = 0;
    for (let i = lag; i < n; i++) score += onset[i] * onset[i - lag];
    scores[lag] = score;
    // Tempo prior (log-normal around 118 bpm) settles half / double-time ties the usual way.
    const bpm = 60 / (lag * hopSec);
    const weighted = score * Math.exp(-0.5 * (Math.log2(bpm / 118) / 0.6) ** 2);
    if (weighted > bestScore) {
      bestScore = weighted;
      bestLag = lag;
    }
  }
  if (!bestLag || bestScore <= 0) return { bpm: 0, beats: [] };

  // A whole-hop lag drifts over a minute of music (1 hop is ~12 ms), so search period and phase
  // together at a fraction of a hop: the grid whose beats collect the most onset strength wins.
  let lagF = bestLag;
  let bestPhase = 0;
  let bestGrid = -1;
  for (let cand = bestLag - 1; cand <= bestLag + 1 + 1e-9; cand += 0.05) {
    if (cand < 1) continue;
    for (let phase = 0; phase < cand; phase += 0.5) {
      let score = 0;
      for (let pos = phase; pos < n; pos += cand) score += onset[Math.round(pos)] ?? 0;
      if (score > bestGrid) {
        bestGrid = score;
        lagF = cand;
        bestPhase = phase;
      }
    }
  }

  const period = lagF * hopSec;
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

/**
 * How well scene cuts sit on the beat grid, measured (never assumed): the share of cuts within
 * `toleranceFrames` of the nearest beat, and the worst miss. Upstream asks for <= 3 frames.
 */
export function syncReport(cutSec: readonly number[], beats: readonly number[], fps = 30, toleranceFrames = 3): { cuts: number; within: number; worstFrames: number } {
  if (!beats.length) return { cuts: cutSec.length, within: 0, worstFrames: 0 };
  let within = 0;
  let worst = 0;
  for (const c of cutSec) {
    const miss = Math.min(...beats.map((b) => Math.abs(b - c))) * fps;
    if (miss <= toleranceFrames) within++;
    worst = Math.max(worst, miss);
  }
  return { cuts: cutSec.length, within, worstFrames: Math.round(worst * 10) / 10 };
}
