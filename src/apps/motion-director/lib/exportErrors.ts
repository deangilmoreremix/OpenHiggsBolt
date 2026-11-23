/**
 * Plain-language export errors. The web renderer's own messages name browser internals (VideoEncoder, delayRender,
 * WebGL); the person needs the cause and what to do about it. The first matching rule wins.
 */
const RULES: Array<{ test: RegExp; cause: string; remedy: string }> = [
  { test: /webcodecs|videoencoder|videodecoder|audioencoder/i, cause: "This browser can't encode video (it has no WebCodecs support)", remedy: 'Use a recent desktop Chrome or Edge.' },
  { test: /webgl/i, cause: "This browser can't use WebGL, which the renderer needs", remedy: 'Turn on hardware acceleration in the browser settings, or use desktop Chrome or Edge.' },
  { test: /h\.?264|avc|codec|encoder|container/i, cause: "This browser can't encode an H.264 MP4 at this size", remedy: 'Try the Fast draft (720p) option, or use desktop Chrome or Edge.' },
  { test: /delayrender|timed out|timeout/i, cause: 'A shot took too long to load (a picture or font did not arrive in time)', remedy: 'Check your connection and try again.' },
  { test: /stopped making progress/i, cause: 'The export stopped making progress and was ended', remedy: 'Try again, or use the Fast draft option for a lighter render.' },
  { test: /out of memory|allocation|memory/i, cause: 'The browser ran out of memory', remedy: 'Close other tabs and use the Fast draft option.' },
];

/** What went wrong with an export and what to do, in one sentence or two. Never empty. */
export function explainExportProblem(input: unknown): string {
  const raw = Array.isArray(input) ? input.join('; ') : input instanceof Error ? input.message : String(input ?? '');
  const hit = RULES.find((r) => r.test.test(raw));
  if (hit) return `The export could not run: ${hit.cause}. ${hit.remedy}`;
  const detail = raw.trim().replace(/\.$/, '');
  return `The export failed${detail ? `: ${detail}` : ''}. Try again, or use the Fast draft option.`;
}
