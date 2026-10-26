'use client';

import { useEffect, useRef, useState } from 'react';
import { useT } from './i18n';
import { useStore } from './store';
import { canRenderVideo, renderVideoOnWeb, createDownloadUrl } from './webRenderer';

type JobState = {
  id: string;
  status: 'queued' | 'running' | 'done' | 'error';
  progress: number;
  filename?: string;
  blob?: Blob;
  error?: string;
};

const ExportButton: React.FC = () => {
  const t = useT();
  const [job, setJob] = useState<JobState | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const stopRendering = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  const start = async () => {
    const project = useStore.getState().project;

    // First, check if the browser can render media on web
    let canRenderResult;
    try {
      console.log('[motion-studio:export] canRender check starting', JSON.stringify({ width: project.width, height: project.height }));
      canRenderResult = await canRenderVideo({
      width: project.width as number,
      height: project.height as number,
    });
      console.log('[motion-studio:export] canRender result', JSON.stringify({ canRender: canRenderResult.canRender, issues: canRenderResult.issues, resolvedVideoCodec: canRenderResult.videoCodec, resolvedAudioCodec: canRenderResult.audioCodec }));
    } catch (e) {
      console.error('[motion-studio:export] canRender threw', e);
      window.alert(t('export.startFailed') + ': ' + (e instanceof Error ? e.message : String(e)));
      return;
    }

    if (!canRenderResult.canRender) {
      const detail = canRenderResult.issues.length
        ? canRenderResult.issues.join(', ')
        : 'This browser cannot encode MP4 in this configuration.';
      console.error('[motion-studio:export] canRender=false', detail);
      window.alert(t('export.startFailed') + ': ' + detail);
      return;
    }

    // Generate a fake ID for tracking (not really needed, but we keep the state structure)
    const id = Math.random().toString(36).substring(2, 9);
    setJob({ id, status: 'queued', progress: 0 });
    abortControllerRef.current = new AbortController();

    try {
      const result = await renderVideoOnWeb({
        project,
        onProgress: (progress) => {
          if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
            setJob((prev) => (prev ? { ...prev, progress, status: 'running' } : null));
          }
        },
        signal: abortControllerRef.current.signal,
      });

      // If we get here, the render completed successfully
      if (!abortControllerRef.current?.signal.aborted) {
        setJob((prev) => (prev ? { ...prev, status: 'done', progress: 1, blob: result.blob } : null));
      }
    } catch (e) {
      // If the render was aborted, we don't show an error
      if (abortControllerRef.current?.signal.aborted) {
        console.log('[motion-studio:export] cancelled by user');
        setJob((prev) => (prev ? { ...prev, status: 'error', error: 'Render cancelled.' } : null));
      } else {
        const msg = e instanceof Error ? e.message : String(e);
        console.error('[motion-studio:export] render failed', e);
        window.alert(t('export.startFailed') + ': ' + msg);
        setJob((prev) => (prev ? { ...prev, status: 'error', error: msg } : null));
      }
    } finally {
      abortControllerRef.current = null;
    }
  };

  // We don't need to resume a render because it's all client-side and doesn't survive a refresh.
  // However, we can keep the effect to clean up on unmount.
  useEffect(() => {
    return () => {
      stopRendering();
    };
  }, []);

  const downloadUrl = job?.blob ? createDownloadUrl(job.blob) : undefined;

  // Clean up the object URL when the blob or component unmounts.
  useEffect(() => {
    return () => {
      stopRendering();
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
  }, [downloadUrl]);

  if (job?.status === 'running' || job?.status === 'queued') {
    return (
      <button className="btn primary" disabled>
        {t('export.running', { pct: Math.round((job.progress ?? 0) * 100) })}
      </button>
    );
  }
  if (job?.status === 'done') {
    return (
      <>
        <a
          className="btn"
          href={downloadUrl}
          download={`${(job.filename ?? 'Motion Studio')}-${new Date()
            .toISOString()
            .slice(0, 19)
            .replace(/[:T]/g, '-')}.mp4`}
          title={t('export.revealTitle')}
        >
          {t('export.done')}
        </a>
        <button className="btn primary" onClick={start}>
          {t('export.again')}
        </button>
      </>
    );
  }
  if (job?.status === 'error') {
    return (
      <button
        className="btn danger"
        title={job.error}
        onClick={start}
      >
        {t('export.failedRetry')}
      </button>
    );
  }
  return (
    <button className="btn primary" title={t('export.title')} onClick={start}>
      {t('export.film')}
    </button>
  );
};

export default ExportButton;