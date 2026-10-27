'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Player } from '@remotion/player';
import { semantic } from '@/shared/styles/designTokens';
import { ActivityList, ChatBubble, PlanCard } from '@/apps/design-agent/ui';
import { motionTemplateTitle, resolveMotionTemplate } from '@/data/motionRecipeCatalog';
import { MainComposition } from '../preview/Composition';
import { projectDuration, projectEndFrame, type ProjectData } from '../types';
import { createDownloadUrl, exportMp4, formatEta, guardTabWhileRendering } from '../webRenderer';
import { isProductTextureShot } from '../lib/productShots';
import { RecipePreview } from './RecipePreview';
import type { FilmChatMessage, FilmDirector } from './useFilmDirector';
import type { FilmStep, FilmStepState } from '../lib/filmSteps';

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
  const [render, setRender] = useState<{ status: 'idle' | 'running' | 'done' | 'error'; progress: number; etaMs?: number | null; url?: string; error?: string; draft?: boolean }>({ status: 'idle', progress: 0 });
  const abort = useRef<AbortController | null>(null);
  const inputProps = useMemo(() => ({ project }), [project]);
  useEffect(() => () => {
    abort.current?.abort();
  }, []);
  useEffect(() => () => {
    if (render.url) URL.revokeObjectURL(render.url);
  }, [render.url]);

  /** `draft`: render at 2/3 size (1080p → 720p), about twice as fast — for long films and quick checks. */
  const start = async (draft = false) => {
    abort.current = new AbortController();
    setRender({ status: 'running', progress: 0, draft });
    // Same path as the toolbar export: browser check, then the Remotion web renderer in this tab.
    const releaseGuard = guardTabWhileRendering();
    try {
      const result = await exportMp4({
        project,
        scale: draft ? 2 / 3 : 1,
        signal: abort.current.signal,
        onProgress: (progress, info) => setRender((r) => (r.status === 'running' ? { ...r, progress, etaMs: info?.etaMs ?? null } : r)),
      });
      setRender({ status: 'done', progress: 1, url: createDownloadUrl(result.blob), draft });
    } catch (error) {
      const cancelled = abort.current?.signal.aborted;
      setRender({ status: cancelled ? 'idle' : 'error', progress: 0, error: cancelled ? undefined : error instanceof Error ? error.message : String(error) });
    } finally {
      releaseGuard();
    }
  };

  const fileName = `${(project.name || 'motion-studio-film').replace(/[^\w-]+/g, '-').slice(0, 60)}${render.draft ? '-draft-720p' : ''}.mp4`;
  const filmSec = projectEndFrame(project) / project.fps;
  const draftSize = `${Math.round((project.width * 2) / 3)}×${Math.round((project.height * 2) / 3)}`;

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
          acknowledgeRemotionLicense
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
          <>
            <a href={render.url} download={fileName} className="px-4 py-2 rounded-lg text-xs font-semibold" style={choiceStyle(true)} data-testid="film-download">
              Download MP4{render.draft ? ` (draft ${draftSize})` : ''}
            </a>
            {render.draft && (
              <button type="button" onClick={() => void start(false)} className="px-4 py-2 rounded-lg text-xs" style={choiceStyle(false)}>
                Render full {project.width}×{project.height}
              </button>
            )}
          </>
        ) : (
          <>
            <button type="button" onClick={() => void start(false)} className="px-4 py-2 rounded-lg text-xs font-semibold" style={choiceStyle(true)} data-testid="film-render">
              {render.status === 'error' ? 'Render failed — retry' : 'Render MP4'}
            </button>
            <button
              type="button"
              onClick={() => void start(true)}
              className="px-4 py-2 rounded-lg text-xs"
              style={choiceStyle(false)}
              data-testid="film-render-draft"
              title={`Same frames at ${draftSize} — about twice as fast${filmSec > 20 ? ', handy for a long film' : ''}`}
            >
              Fast draft · {draftSize}
            </button>
          </>
        )}
        {onOpenWorkbench && (
          <button
            type="button"
            onClick={() => {
              // Leaving this view unmounts the card and stops its render: ask first.
              if (render.status === 'running' && !window.confirm('The MP4 is still rendering and leaving will cancel it. Open the workbench anyway?')) return;
              onOpenWorkbench();
            }}
            className="px-4 py-2 rounded-lg text-xs font-semibold"
            style={choiceStyle(false)}
            data-testid="film-open-workbench"
          >
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

const STEP_COLORS: Record<FilmStepState, { border: string; num: string; label: string }> = {
  todo: { border: 'var(--border-color)', num: semantic.textMuted, label: 'Waiting' },
  active: { border: 'rgba(232,176,92,0.7)', num: '#e8b05c', label: 'Working…' },
  done: { border: 'rgba(34,197,94,0.45)', num: '#86efac', label: 'Done' },
  skipped: { border: 'var(--border-color)', num: semantic.textMuted, label: 'Skipped' },
  error: { border: 'rgba(248,113,113,0.6)', num: '#fca5a5', label: 'Problem' },
};

/** The seven workflow steps — Product → Capture → Storyboard → Animate → Beat sync → Frame QA → Deliver — with live state. */
export const FilmSteps: React.FC<{ steps: FilmStep[] }> = ({ steps }) => (
  <ol className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2" data-testid="film-steps" aria-label="Film workflow">
    {steps.map((step, i) => {
      const c = STEP_COLORS[step.state];
      return (
        <li
          key={step.id}
          data-step={step.id}
          data-state={step.state}
          className="rounded-xl p-2.5 min-w-0"
          style={{ background: 'var(--bg-card)', border: `1px solid ${c.border}`, opacity: step.state === 'todo' || step.state === 'skipped' ? 0.65 : 1 }}
          title={step.detail ?? c.label}
        >
          <div className="flex items-center justify-between text-[10px] font-mono" style={{ color: c.num }}>
            <span>{String(i + 1).padStart(2, '0')}</span>
            <span>{step.state === 'active' ? '●' : step.state === 'done' ? '✓' : step.state === 'error' ? '!' : ''}</span>
          </div>
          <div className="mt-1 text-xs font-semibold truncate">{step.title}</div>
          <div className="text-[10px] truncate" style={{ color: semantic.textMuted }}>{step.sub}</div>
          <div className="mt-1 text-[10px] leading-snug line-clamp-2" style={{ color: semantic.textSecondary }}>{step.detail ?? c.label}</div>
        </li>
      );
    })}
  </ol>
);

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
  /** Clears the current conversation and starts a different film. */
  onNewFilm?: () => void;
  /** Show the finished-film card (off in the workbench, where the film is already loaded). */
  showFilm?: boolean;
}

export const FilmDirectorChat: React.FC<FilmDirectorChatProps> = ({ director, history = [], hideOwnMessages, onOpenWorkbench, openLabel, onPickShots, onNewFilm, showFilm = true }) => {
  const { messages, stage, activity, steps, storyboard, film } = director;
  const shown = hideOwnMessages ? history : [...history, ...messages];
  const plan = storyboard?.plan;
  const videos = storyboard?.videos ?? [];
  /** Attached videos sit just before the closing scene, where the build places them. */
  const withVideos = <T,>(steps: T[]): Array<T | { key: string; label: string; detail: string }> => {
    const out: Array<T | { key: string; label: string; detail: string }> = steps.slice();
    out.splice(steps.length > 1 ? steps.length - 1 : steps.length, 0, ...videos.map((v, i) => ({ key: `video-${i}`, label: 'Your video', detail: `${v.sec}s · ${v.name}` })));
    return out;
  };
  return (
    <div className="flex flex-col gap-3" data-testid="film-chat">
      {steps.some((s) => s.state !== 'todo') && (
        // Pinned while the conversation scrolls, so the seven steps stay in view.
        <div className="sticky -top-3 sm:-top-4 z-10 -mx-1 -mt-3 sm:-mt-4 px-1 pt-3 sm:pt-4 pb-1" style={{ background: 'var(--bg-app, #0b0b0d)' }}>
          <FilmSteps steps={steps} />
        </div>
      )}
      {shown.map((m, i) => <FilmMessage key={`${m.ts}-${i}`} message={m} />)}
      {stage === 'offer' && (
        <div className="flex flex-wrap gap-2" data-testid="inkpress-offer">
          <button type="button" onClick={() => director.chooseTemplate('inkpress')} className="px-4 py-2 rounded-lg text-xs font-semibold" style={choiceStyle(true)}>Use Ink Press</button>
          <button type="button" onClick={() => director.chooseTemplate('director')} className="px-4 py-2 rounded-lg text-xs" style={choiceStyle(false)}>Let the director pick shots</button>
          {onPickShots && <button type="button" onClick={onPickShots} className="px-4 py-2 rounded-lg text-xs" style={choiceStyle(false)}>Choose shot cards…</button>}
        </div>
      )}
      {(stage === 'storyboarding' || stage === 'building') && (
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: semantic.textSecondary }} role="status">
            {stage === 'storyboarding' ? 'Storyboarding…' : 'Building the film…'}
          </span>
          <button type="button" onClick={director.stop} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.5)', color: '#fca5a5' }} data-testid="film-stop">
            ■ Stop
          </button>
          {onNewFilm && (
            <button type="button" onClick={() => { director.reset(); onNewFilm(); }} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.5)', color: '#86efac' }} data-testid="film-new">
              New film
            </button>
          )}
        </div>
      )}
      {activity.length > 0 && <ActivityList items={activity} />}
      {storyboard?.capture && (storyboard.capture.logo || storyboard.capture.images?.length) ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl p-2" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid var(--border-color)' }} data-testid="site-assets">
          <span className="text-[11px] mr-1" style={{ color: semantic.textMuted }}>From {storyboard.capture.title || 'your site'}:</span>
          {storyboard.capture.logo && (
            <img src={storyboard.capture.logo} alt="Site logo" title="Logo — goes on the title cards" className="h-10 max-w-[140px] rounded object-contain p-1" style={{ background: '#fff' }} />
          )}
          {(storyboard.capture.images ?? []).map((src, i) => (
            <img key={src} src={src} alt={`Site image ${i + 1}`} title="Site image — used in the product shots" className="h-10 w-16 rounded object-cover" />
          ))}
        </div>
      ) : null}
      {plan && (stage === 'plan' || stage === 'building') && (
        <PlanCard
          testId="director-plan"
          eyebrow={storyboard?.source === 'director' ? 'MOTION DIRECTOR STORYBOARD' : 'INK PRESS STORYBOARD'}
          title={plan.title}
          meta={`${plan.scenes.length + videos.length} scenes · ${Math.round(plan.scenes.reduce((sum, sc) => sum + sc.durationSec, 0) + videos.reduce((sum, v) => sum + v.sec, 0))}s${storyboard?.capture ? ' · uses your site' : ''}`}
          steps={withVideos(plan.scenes.map((scene, i) => {
            const template = scene.kind === 'shot' ? resolveMotionTemplate(scene.recipeId) : undefined;
            const onSite = Boolean(template && storyboard?.capture && isProductTextureShot(template.componentName));
            return {
              key: `${i}-${scene.recipeId || 'title'}`,
              label: template ? motionTemplateTitle(template) : 'Title card',
              detail: [`${scene.durationSec}s`, scene.headline && `“${scene.headline.replace(/\*/g, '')}”`, scene.caption && `caption: ${scene.caption}`, onSite && 'shows your site', scene.transition === 'flash' && 'flash cut'].filter(Boolean).join(' · '),
              media: template ? <RecipePreview recipe={template} playing={false} /> : undefined,
            };
          }))}
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
