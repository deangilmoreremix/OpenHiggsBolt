/**
 * Approved director plan → editable Motion Studio project.
 *
 * Builds the same structure as the Ink Press template / demo project: a Shots
 * track (recipe shots and title cards back to back), a Captions track, a
 * Transitions track (flash cuts on the scene changes the plan asked for), the
 * paper background, an SFX track (a whoosh on each cut, an impact on flash
 * cuts), and an optional music track. Every clip is an ordinary
 * card with props, so the whole film stays editable in the Workbench.
 */
import { CARDS } from '../cards/registry';
import { CARD_FPS, type CardDef } from '../cards/types';
import type { AspectRatio } from '../projectContract';
import { t } from '../i18n';
import { uid, type ClipData, type ProjectData } from '../types';
import { motionCardId, resolveMotionTemplate } from '@/data/motionRecipeCatalog';
import { isProductTextureShot } from './productShots';
import type { DirectorPlan } from './directorPlan';

export interface FilmCapture {
  /** Captured page URLs (1920 CSS px wide, 2x). */
  screens: string[];
  /** Captured element crops (cards). */
  crops: string[];
}

/** A video the user attached; it plays as its own scene before the closing card. */
export interface FilmVideo {
  url: string;
  name: string;
  /** Probed length in seconds, when known. */
  durationSec?: number;
}

export interface FilmMusic {
  url: string;
  name: string;
  /** Beat times (seconds) used to snap scene changes; empty = no snapping. */
  beats?: number[];
}

const FPS = 30;
const FLASH_FRAMES = 10;
/** Sound effects served from public/ (copied from the ShotCraft SFX library). */
const SFX_CUT = 'motion-studio/sfxlib/transition/swoosh-quick.mp3';
const SFX_FLASH = 'motion-studio/sfxlib/impact/impact-transition.mp3';
const SFX_FRAMES = 24;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Screen time an attached video gets as its own scene: its length, kept between 2 and 8 seconds. */
export const videoSceneSec = (v: { durationSec?: number }): number => clamp(v.durationSec ?? 4, 2, 8);

/** Delivery size of a built film: full HD at 30 fps, h264 on export. */
export const filmDimensions = (ratio: AspectRatio): { width: number; height: number } =>
  ratio === '9:16' ? { width: 1080, height: 1920 } : ratio === '1:1' ? { width: 1080, height: 1080 } : { width: 1920, height: 1080 };

const clip = (cardId: string, start: number, duration: number, props: Record<string, unknown>, extra: Partial<ClipData> = {}): ClipData => ({
  id: uid('clip'),
  cardId,
  start,
  duration,
  inOffset: 0,
  speed: 1,
  opacity: 1,
  scale: 1,
  x: 0,
  y: 0,
  props,
  ...extra,
});

/**
 * Play a recipe's whole motion inside the scene: speed up or slow down within
 * a range that keeps the shot's tuned timing recognisable, then let it hold.
 */
const fitSpeed = (card: CardDef, durationFrames: number): number => {
  if (card.timing === 'realtime') return 1;
  const scale = FPS / (card.sourceFps ?? CARD_FPS);
  return Math.round((clamp(card.durationInFrames / (durationFrames * scale), 0.7, 1.4) / scale) * 100) / 100;
};

/** Move each scene boundary to the nearest beat within `window` seconds, keeping scenes ≥ `minSec`. */
export function snapToBeats(durations: number[], beats: number[], window = 0.35, minSec = 1.2): number[] {
  if (!beats.length || durations.length < 2) return durations.slice();
  const bounds: number[] = [];
  let acc = 0;
  for (const d of durations) bounds.push((acc += d));
  const snapped = bounds.map((b, i) => {
    if (i === bounds.length - 1) return b;
    let best = b;
    let bestDist = window;
    for (const beat of beats) {
      const dist = Math.abs(beat - b);
      if (dist <= bestDist) {
        best = beat;
        bestDist = dist;
      }
    }
    return best;
  });
  const out: number[] = [];
  let prev = 0;
  for (let i = 0; i < snapped.length; i++) {
    const end = i === snapped.length - 1 ? snapped[i] : Math.max(snapped[i], prev + minSec);
    out.push(Math.max(minSec, end - prev));
    prev = prev + out[i];
  }
  return out;
}

export function planToProject(
  plan: DirectorPlan,
  opts: {
    aspectRatio: AspectRatio;
    capture?: FilmCapture | null;
    music?: FilmMusic | null;
    /** Brand Kit logo, stamped on the title / call-to-action cards. */
    logo?: string | null;
    videos?: FilmVideo[];
  },
): ProjectData {
  const { width, height } = filmDimensions(opts.aspectRatio);
  const palette = plan.palette;
  const durations = snapToBeats(plan.scenes.map((s) => s.durationSec), opts.music?.beats ?? []);
  const screens = opts.capture?.screens ?? [];
  const crops = opts.capture?.crops ?? [];

  const shots: ClipData[] = [];
  const captions: ClipData[] = [];
  const flashes: ClipData[] = [];
  const sfx: ClipData[] = [];
  let at = 0;
  const videos = opts.videos ?? [];
  const lastIndex = plan.scenes.length - 1;
  /** A scene change: whoosh on every cut, impact + white flash on flash cuts. */
  const cut = (flash: boolean) => {
    if (flash) flashes.push(clip('inkpress-flash-cut', Math.max(0, at - FLASH_FRAMES / 2), FLASH_FRAMES, {}));
    sfx.push(clip('audio-clip', Math.max(0, at - SFX_FRAMES / 2), SFX_FRAMES, { file: flash ? SFX_FLASH : SFX_CUT, volume: 0.6 }, { label: flash ? 'Impact' : 'Whoosh' }));
  };

  plan.scenes.forEach((scene, i) => {
    // Attached videos play just before the closing scene (or at the end of a one-scene film).
    if (i === lastIndex && lastIndex > 0) {
      for (const v of videos) {
        const frames = Math.round(videoSceneSec(v) * FPS);
        shots.push(clip('video-clip', at, frames, { file: v.url, fit: 'cover', muted: Boolean(opts.music?.url) }, { label: v.name.slice(0, 32) }));
        at += frames;
        cut(false);
      }
    }
    const frames = Math.max(2, Math.round(durations[i] * FPS));
    if (scene.kind === 'title') {
      shots.push(
        clip('inkpress-title-card', at, frames, {
          text: scene.headline,
          sub: scene.caption,
          bg: palette.background,
          ink: palette.text,
          accent: palette.accent,
          ...(opts.logo ? { logo: opts.logo } : {}),
        }, { label: scene.headline.slice(0, 24) }),
      );
    } else {
      const template = resolveMotionTemplate(scene.recipeId);
      const cardId = template ? motionCardId(template) : '';
      const card = CARDS[cardId];
      if (!template || !card) return;
      const usesCapture = isProductTextureShot(template.componentName) && (screens.length > 0 || crops.length > 0);
      shots.push(
        // Shots carry their own typography; the headline goes in the caption
        // strip rather than over the shot.
        clip(cardId, at, frames, {
          accent: palette.accent,
          ...(usesCapture ? { screens, crops } : {}),
        }, { speed: fitSpeed(card, frames) }),
      );
      const line = scene.caption || scene.headline;
      if (line) {
        captions.push(clip('inkpress-caption', at, frames, { text: line, color: palette.text, accent: palette.accent }));
      }
    }
    at += frames;
    if (i < lastIndex) cut(scene.transition === 'flash');
  });
  if (lastIndex === 0) {
    for (const v of videos) {
      cut(false);
      const frames = Math.round(videoSceneSec(v) * FPS);
      shots.push(clip('video-clip', at, frames, { file: v.url, fit: 'cover', muted: Boolean(opts.music?.url) }, { label: v.name.slice(0, 32) }));
      at += frames;
    }
  }

  const total = Math.max(at, FPS);
  const tracks = [
    { id: uid('track'), name: t('track.transitions'), clips: flashes },
    { id: uid('track'), name: t('track.captions'), clips: captions },
    { id: uid('track'), name: t('track.shots'), clips: shots },
    { id: uid('track'), name: t('track.background'), clips: [clip('bg-paper', 0, total, { color: palette.background })] },
    { id: uid('track'), name: t('track.sfx'), clips: sfx },
  ];
  if (opts.music?.url) {
    tracks.push({
      id: uid('track'),
      name: t('track.music'),
      clips: [clip('audio-clip', 0, total, { file: opts.music.url }, { label: opts.music.name.slice(0, 32) })],
    });
  }

  return {
    name: plan.title,
    fps: FPS,
    width,
    height,
    background: palette.background,
    tracks: tracks.filter((track) => track.clips.length > 0 || track.name === t('track.shots')),
  };
}
