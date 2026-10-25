'use client';

import { canRenderMediaOnWeb, renderMediaOnWeb, renderStillOnWeb } from '@remotion/web-renderer';
import type { 
  WebRendererVideoCodec, 
  WebRendererAudioCodec, 
  WebRendererContainer, 
  WebRendererOutputTarget,
  RenderMediaOnWebOptions,
  RenderStillOnWebOptions,
  RenderStillOnWebResult,
  RenderMediaOnWebProgress
} from '@remotion/web-renderer';
import type { ProjectData } from './types';
import { MainComposition } from './preview/Composition';
import { projectEndFrame } from './types';

type RenderOptions = {
  project: ProjectData;
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
  videoCodec?: WebRendererVideoCodec | null;
  audioCodec?: WebRendererAudioCodec | null;
  container?: WebRendererContainer;
  muted?: boolean;
  transparent?: boolean;
  scale?: number;
  licenseKey?: string;
};

type CanRenderResult = {
  canRender: boolean;
  issues: string[];
  videoCodec: WebRendererVideoCodec | null;
  audioCodec: WebRendererAudioCodec | null;
  container: WebRendererContainer | null;
};

type RenderResult = {
  blob: Blob;
  progress: number;
};

type StillResult = {
  blob: Blob;
};

/**
 * Check whether the current browser can render media using the Remotion Web Renderer.
 * Uses mediabunny under the hood — checks for WebCodecs, WebGL, and codec support.
 */
export const canRenderVideo = async (opts: {
  width: number;
  height: number;
  transparent?: boolean;
  muted?: boolean;
  videoCodec?: WebRendererVideoCodec | null;
  audioCodec?: WebRendererAudioCodec | null;
  container?: WebRendererContainer;
}): Promise<CanRenderResult> => {
  const result = await canRenderMediaOnWeb({
    width: opts.width,
    height: opts.height,
    transparent: opts.transparent ?? false,
    muted: opts.muted ?? false,
    videoCodec: opts.videoCodec ?? null,
    audioCodec: opts.audioCodec ?? null,
    container: opts.container ?? 'mp4',
  });

  const outputTarget = result.resolvedOutputTarget as (WebRendererOutputTarget & { container?: WebRendererContainer }) | null;

  return {
    canRender: result.canRender,
    issues: result.issues.map((i) => i.message),
    videoCodec: result.resolvedVideoCodec,
    audioCodec: result.resolvedAudioCodec,
    container: outputTarget?.container ?? null,
  };
};

/**
 * Render a Motion Studio composition to an MP4 Blob entirely in the browser.
 * Uses the Remotion Web Renderer — no server-side rendering required.
 */
export const renderVideoOnWeb = async (opts: RenderOptions): Promise<RenderResult> => {
  const { project, onProgress, signal, muted = false, transparent = false } = opts;
  const { width, height, fps } = project;

  // MainComposition is the React component used by the Remotion Player preview.
  // We wrap it to inject renderExact=true so the web renderer gets the full
  // project duration (matching the server-side export behavior).
  const Component = MainComposition;
  const inputProps = { project, renderExact: true };
  const durationInFrames = Math.max(2, projectEndFrame(project));

  const composition = {
    component: Component as any,
    id: 'Main',
    width,
    height,
    fps,
    durationInFrames,
    defaultProps: inputProps,
  };

  const renderOpts: RenderMediaOnWebOptions<any, any> = {
    composition,
    // CRITICAL: The Remotion Web Renderer drives the component with the
    // `inputProps` option, not via `composition.defaultProps`. Passing
    // `defaultProps` only on the composition object is silently ignored by
    // renderMediaOnWeb, so the component would receive `undefined` props
    // and MainComposition would throw on `project.tracks`. We pass the
    // same payload at both levels so the props are guaranteed to reach
    // the component regardless of which path the web renderer takes.
    inputProps,
    // Remotion license key. Without it the web renderer logs a warning and
    // suppresses the usage/license telemetry POST to https://www.remotion.pro
    // (which the CSP now allows). The team qualifies for Remotion's free
    // license (fewer than 3 employees), so default to "free-license"; a
    // company license can be supplied via NEXT_PUBLIC_REMOTION_LICENSE_KEY
    // without a code change.
    licenseKey: opts.licenseKey ?? process.env.NEXT_PUBLIC_REMOTION_LICENSE_KEY ?? 'free-license',
    videoCodec: opts.videoCodec ?? 'h264',
    audioCodec: opts.audioCodec ?? 'aac',
    container: opts.container ?? 'mp4',
    muted,
    transparent,
    scale: opts.scale ?? 1,
    signal,
    // Force software encoding by default. Hardware encoders are unavailable
    // in headless / sandboxed browsers (including Chromium Headless Shell
    // used by Playwright), so prefer-software ensures the render completes
    // on every supported browser instead of hanging on `isConfigSupported`.
    hardwareAcceleration: 'prefer-software',
    // Safety net: if any registered card calls delayRender() and never
    // resolves (e.g. a remote asset that 404s, a card waiting on a
    // condition that never fires in this environment), the render will
    // fail fast with a clear "delayRender timed out" error rather than
    // hanging the entire export pipeline for minutes.
    delayRenderTimeoutInMilliseconds: 15_000,
    onProgress: (progress: RenderMediaOnWebProgress) => {
      // Privacy-safe stage log: no project content, only frame counts and
      // percentages. Emitted to console for both real users and E2E tests.
      console.log(
        '[motion-studio:export] progress',
        JSON.stringify({
          stage: 'rendering',
          renderedFrames: progress.renderedFrames,
          encodedFrames: progress.encodedFrames,
          progress: Number(progress.progress.toFixed(3)),
          doneIn: progress.doneIn,
          renderEstimatedTime: progress.renderEstimatedTime,
        }),
      );
      onProgress?.(progress.progress);
    },
  };

  console.log(
    '[motion-studio:export] starting',
    JSON.stringify({
      width,
      height,
      fps,
      durationInFrames,
      videoCodec: renderOpts.videoCodec,
      audioCodec: renderOpts.audioCodec,
      container: renderOpts.container,
      muted,
      transparent,
    }),
  );

  const result = await renderMediaOnWeb(renderOpts);

  console.log('[motion-studio:export] encoding finished, awaiting blob');

  const blob = await result.getBlob();

  console.log(
    '[motion-studio:export] complete',
    JSON.stringify({ blobSize: blob.size, blobType: blob.type || 'unknown' }),
  );

  return {
    blob,
    progress: 1,
  };
};

/**
 * Render a still frame from the composition as a PNG Blob.
 */
export const renderStillOnWebExport = async (
  project: ProjectData,
  frame: number,
  signal?: AbortSignal,
): Promise<StillResult> => {
  const { width, height, fps } = project;
  const inputProps = { project, renderExact: true };
  const durationInFrames = Math.max(2, projectEndFrame(project));

  const composition = {
    component: MainComposition as any,
    id: 'Main',
    width,
    height,
    fps,
    durationInFrames,
    defaultProps: inputProps,
  };

  const renderOpts: RenderStillOnWebOptions<any, any> = {
    composition,
    inputProps,
    frame,
    signal,
  };

  const result = await renderStillOnWeb(renderOpts);

  const blob = await result.blob();

  return { blob };
};

/**
 * Create a downloadable URL from a rendered Blob.
 * Call URL.revokeObjectURL(url) when done.
 */
export const createDownloadUrl = (blob: Blob): string => {
  return URL.createObjectURL(blob);
};