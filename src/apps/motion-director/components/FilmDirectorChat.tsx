'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Player } from '@remotion/player';
import { semantic } from '@/shared/styles/designTokens';
import { ActivityList, ChatBubble, PlanCard } from '@/apps/design-agent/ui';
import { motionTemplateTitle, resolveMotionTemplate } from '@/data/motionRecipeCatalog';
import { MainComposition } from '../preview/Composition';
import { projectDuration, type ProjectData } from '../types';
import { createDownloadUrl, exportMp4, formatEta, guardTabWhileRendering } from '../webRenderer';
import { isProductTextureShot } from '../lib/productShots';
import { RecipePreview } from './RecipePreview';
import type { FilmChatMessage, FilmDirector } from './useFilmDirector';

/**
 * The film conversation as it appears in chat: messages, the Ink Press
 * question, the storyboard card (approve / revise), progress, and the finished
 * film — a player, Render MP4, and Open in Motion Workbench.
 */

const clock = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const FilmMessage: React.FC<{ message: Pick<FilmChatMessage, 'role' | 'content' | 'ts'> }> = ({ message }) => (
  <ChatBubble
    role={message.role}
    preWrap
    below={<div className={`text-[10px] ${message.role === 'user' ? 'text-right' : ''}`} style={{ color: semantic.textMuted }}>{clock(message.ts)}</div>}
  >
    {message.content}
  </ChatBubble>
);

const choiceStyle = (primary: boolean): React.CSSProperties =>
  primary
    ? { background: 'var(--color-primary)', color: 'white' }
    : { background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: semantic.textSecondary };

/** Player + MP4 render + hand-off to the workbench for a built film. */
export const FilmResultCard: React.FC<{ project: ProjectData; onOpenWorkbench?: () => void; openLabel?: string }> = ({ project, onOpenWorkbench, openLabel = 'Open in Motion Workbench' }) => {
  const [render, setRender] = useState<{ status: 'idle' | 'running' | 'done' | 'error'; progress: number; etaMs?: number | null; url?: string; error?: string }>({ status: 'idle', progress: 0 });
  const abort = useRef<AbortController | null>(null);
  const inputProps = useMemo(() => ({ project }), [project]);
  useEffect(() => () => {
    abort.current?.abort();
  }, []);
  useEffect(() => () => {
    if (render.url) URL.revokeObjectURL(render.url);
  }, [render.url]);

  const start = async () => {
    abort.current = new AbortController();
    setRender({ status: 'running', progress: 0 });
    // Same path as the toolbar export: browser check, then the Remotion web renderer in this tab.
    const releaseGuard = guardTabWhileRendering();
    try {
      const result = await exportMp4({
        project,
        signal: abort.current.signal,
        onProgress: (progress, info) => setRender((r) => (r.status === 'running' ? { ...r, progress, etaMs: info?.etaMs ?? null } : r)),
      });
      setRender({ status: 'done', progress: 1, url: createDownloadUrl(result.blob) });
    } catch (error) {
      const cancelled = abort.current?.signal.aborted;
      setRender({ status: cancelled ? 'idle' : 'error', progress: 0, error: cancelled ? undefined : error instanceof Error ? error.message : String(error) });
    } finally {
      releaseGuard();
    }
  };

  const fileName = `${(project.name || 'motion-studio-film').replace(/[^\w-]+/g, '-').slice(0, 60)}.mp4`;

  return (
    <div className="rounded-2xl p-3 space-y-3" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.28)' }} data-testid="film-result">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-xs font-semibold" style={{ color: '#86efac' }}>FINAL FILM</div>
          <div className="text-sm font-semibold">{project.name}</div>
        </div>
        <div className="text-[11px]" style={{ color: semantic.textSecondary }}>
          {project.width}×{project.height} · {project.fps} fps · h264
        </div>
      </div>
      <div className="overflow-hidden rounded-xl" style={{ aspectRatio: `${project.width} / ${project.height}`, maxHeight: 420, background: '#000' }}>
        <Player
          component={MainComposition}
          inputProps={inputProps}
          durationInFrames={projectDuration(project)}
          compositionWidth={project.width}
          compositionHeight={project.height}
          fps={project.fps}
          controls
          loop
          numberOfSharedAudioTags={32}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {render.status === 'running' ? (
          <>
            <button type="button" disabled className="px-4 py-2 rounded-lg text-xs font-semibold opacity-70" style={choiceStyle(true)}>
              Rendering… {Math.round(render.progress * 100)}%
            </button>
            <button type="button" onClick={() => abort.current?.abort()} className="px-3 py-2 rounded-lg text-xs" style={choiceStyle(false)}>Cancel</button>
          </>
        ) : render.status === 'done' && render.url ? (
          <a href={render.url} download={fileName} className="px-4 py-2 rounded-lg text-xs font-semibold" style={choiceStyle(true)} data-testid="film-download">
            Download MP4
          </a>
        ) : (
          <button type="button" onClick={() => void start()} className="px-4 py-2 rounded-lg text-xs font-semibold" style={choiceStyle(true)} data-testid="film-render">
            {render.status === 'error' ? 'Render failed — retry' : 'Render MP4'}
          </button>
        )}
        {onOpenWorkbench && (
          <button type="button" onClick={onOpenWorkbench} className="px-4 py-2 rounded-lg text-xs font-semibold" style={choiceStyle(false)} data-testid="film-open-workbench">
            {openLabel}
          </button>
        )}
        {render.status === 'running' && (
          <span className="text-[11px]" style={{ color: semantic.textSecondary }} data-testid="film-render-status">
            Rendering in this tab with the Remotion web renderer — keep it open.{render.etaMs ? ` ${formatEta(render.etaMs)}.` : ''}
          </span>
        )}
        {render.status === 'error' && <span className="text-[11px]" style={{ color: '#fca5a5' }}>{render.error}</span>}
      </div>
    </div>
  );
};

export interface FilmDirectorChatProps {
  director: FilmDirector;
  /** Messages to show before the director's own (e.g. the session history). */
  history?: Array<Pick<FilmChatMessage, 'role' | 'content' | 'ts'>>;
  /** Hide the director's own messages (when they are already mirrored into `history`). */
  hideOwnMessages?: boolean;
  onOpenWorkbench?: () => void;
  openLabel?: string;
  /** Opens the Templates picker so shots can be chosen by hand. */
  onPickShots?: () => void;
  /** Show the finished-film card (off in the workbench, where the film is already loaded). */
  showFilm?: boolean;
}

export const FilmDirectorChat: React.FC<FilmDirectorChatProps> = ({ director, history = [], hideOwnMessages, onOpenWorkbench, openLabel, onPickShots, showFilm = true }) => {
  const { messages, stage, activity, storyboard, film } = director;
  const shown = hideOwnMessages ? history : [...history, ...messages];
  const plan = storyboard?.plan;
  return (
    <div className="flex flex-col gap-3" data-testid="film-chat">
      {shown.map((m, i) => <FilmMessage key={`${m.ts}-${i}`} message={m} />)}
      {stage === 'offer' && (
        <div className="flex flex-wrap gap-2" data-testid="inkpress-offer">
          <button type="button" onClick={() => director.chooseTemplate('inkpress')} className="px-4 py-2 rounded-lg text-xs font-semibold" style={choiceStyle(true)}>Use Ink Press</button>
          <button type="button" onClick={() => director.chooseTemplate('director')} className="px-4 py-2 rounded-lg text-xs" style={choiceStyle(false)}>Let the director pick shots</button>
          {onPickShots && <button type="button" onClick={onPickShots} className="px-4 py-2 rounded-lg text-xs" style={choiceStyle(false)}>Choose shot cards…</button>}
        </div>
      )}
      {activity.length > 0 && <ActivityList items={activity} />}
      {plan && (stage === 'plan' || stage === 'building') && (
        <PlanCard
          testId="director-plan"
          eyebrow={storyboard?.source === 'director' ? 'MOTION DIRECTOR STORYBOARD' : 'INK PRESS STORYBOARD'}
          title={plan.title}
          meta={`${plan.scenes.length} scenes · ${Math.round(plan.scenes.reduce((sum, sc) => sum + sc.durationSec, 0))}s${storyboard?.capture ? ' · uses your site' : ''}`}
          steps={plan.scenes.map((scene, i) => {
            const template = scene.kind === 'shot' ? resolveMotionTemplate(scene.recipeId) : undefined;
            const onSite = Boolean(template && storyboard?.capture && isProductTextureShot(template.componentName));
            return {
              key: `${i}-${scene.recipeId || 'title'}`,
              label: template ? motionTemplateTitle(template) : 'Title card',
              detail: [`${scene.durationSec}s`, scene.headline && `“${scene.headline.replace(/\*/g, '')}”`, scene.caption && `caption: ${scene.caption}`, onSite && 'shows your site', scene.transition === 'flash' && 'flash cut'].filter(Boolean).join(' · '),
              media: template ? <RecipePreview recipe={template} playing={false} /> : undefined,
            };
          })}
          onApprove={() => void director.approve()}
          onReject={director.revise}
          busy={stage === 'building'}
          approveLabel={stage === 'building' ? 'Building…' : 'Approve & build film'}
          rejectLabel="Revise"
        />
      )}
      {showFilm && film && stage === 'film' && <FilmResultCard project={film.project} onOpenWorkbench={onOpenWorkbench} openLabel={openLabel} />}
    </div>
  );
};

export default FilmDirectorChat;
