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
import type { BrandInput } from '../demosrc/_fixtures/Brand';
import { uid, type ClipData, type ProjectData } from '../types';
import { motionCardId, resolveMotionTemplate } from '@/data/motionRecipeCatalog';
import { isProductTextureShot } from './productShots';
import { BRAND_SCENES, isBrandScene, type DirectorPlan } from './directorPlan';

export interface FilmCapture {
  /** Captured page URLs (1920 CSS px wide, 2x). */
  screens: string[];
  /** Captured element crops (cards). */
  crops: string[];
  /** The site's name, shown on the inset pictures. */
  title?: string;
  /** Where the page's sections start (CSS px from the top of `screens[0]`) and its height; the insets show them one by one. */
  sections?: number[];
  pageH?: number;
  /** Section headings, best effort in page order, used as the inset labels. */
  sectionNames?: string[];
  /** The site's menu entries and calls to action: the nodes of the hub and the closing line. */
  nav?: string[];
  ctas?: string[];
  /** The site's address as typed (host and path). */
  address?: string;
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
const sfxFile = (name: string) => `motion-studio/sfxlib/${name}.mp3`;
/** The sound cues of each brand scene: [file, frames after the scene starts, length, volume, label]. */
const BRAND_SOUNDS: Record<string, ReadonlyArray<readonly [string, number, number, number, string]>> = {
  'brand/url-scan': [['text/typewriter-digital', 4, 54, 0.45, 'Typing'], ['data/data-scan', 54, 60, 0.5, 'Scan']],
  'brand/hub': [['light/light-sweep-magic', 6, 40, 0.45, 'Sweep'], ['ui/ui-message-pop', 34, 20, 0.35, 'Node pop']],
  'brand/feature-zoom': [['camera/zoom-air-fast', 0, 30, 0.45, 'Push-in']],
  'brand/logo-reveal': [['impact/impact-cine-big', 2, 60, 0.7, 'Impact'], ['light/stardust-swish', 12, 48, 0.5, 'Sparkle']],
};
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
    /** The company the film is for: the recipe demos speak with its name, colours, font, logo and words instead of SmartVideo GO. */
    brand?: BrandInput | null;
    /** Scene index -> (template words -> the words to draw), from the director or the site's own words. */
    texts?: Record<number, Record<string, string>>;
  },
): ProjectData {
  const { width, height } = filmDimensions(opts.aspectRatio);
  const palette = plan.palette;
  const durations = snapToBeats(plan.scenes.map((s) => s.durationSec), opts.music?.beats ?? []);
  const screens = opts.capture?.screens ?? [];
  const crops = opts.capture?.crops ?? [];
  /** CSS px of a 1920-wide page that a 16:10 inset shows. */
const INSET_PAGE_H = 1200;
/** Pictures of the user's site for the shots that cannot draw captured pages themselves. */
  const insetPool = [...crops, ...screens];

  const shots: ClipData[] = [];
  const insets: ClipData[] = [];
  const captions: ClipData[] = [];
  const flashes: ClipData[] = [];
  const sfx: ClipData[] = [];
  let at = 0;
  let featureZooms = 0;
  const videos = opts.videos ?? [];
  const lastIndex = plan.scenes.length - 1;
  /** A scene change: whoosh on every cut, impact + white flash on flash cuts. */
  const cut = (flash: boolean) => {
    if (flash) flashes.push(clip('inkpress-flash-cut', Math.max(0, at - FLASH_FRAMES / 2), FLASH_FRAMES, {}));
    sfx.push(clip('audio-clip', Math.max(0, at - SFX_FRAMES / 2), SFX_FRAMES, { file: flash ? SFX_FLASH : SFX_CUT, volume: 0.6 }, { label: flash ? 'Impact' : 'Whoosh' }));
  };

  // A film of a captured site closes on the site's logo, call to action and address.
  const scenes = plan.scenes.map((sc, i) =>
    opts.brand && opts.capture && sc.kind === 'title' && i === plan.scenes.length - 1 && i > 0
      ? { ...sc, kind: 'shot' as const, recipeId: 'brand/logo-reveal' }
      : sc,
  );
  scenes.forEach((scene, i) => {
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
      sfx.push(clip('audio-clip', at + 4, Math.min(20, frames - 4), { file: sfxFile('text/typewriter-hit-soft'), volume: 0.4 }, { label: 'Stamp' }));
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
    } else if (isBrandScene(scene.recipeId)) {
      const page = screens[0] ?? crops[0] ?? '';
      const look = { bg: palette.background, ink: palette.text, accent: palette.accent, ...(opts.brand?.font ? { font: opts.brand.font } : {}) };
      const title = scene.headline.replace(/\*/g, '');
      const names = [...(opts.capture?.nav ?? []), ...(opts.capture?.sectionNames ?? [])].filter((v, n, all) => v && all.indexOf(v) === n);
      let props: Record<string, unknown> = look;
      if (scene.recipeId === 'brand/url-scan') {
        props = { ...look, file: page, url: opts.capture?.address ?? opts.brand?.repo ?? '', labels: (opts.capture?.sectionNames ?? []).slice(0, 5).join('\n') || 'BRANDING\nPEOPLE\nPRODUCTS\nOFFERS\nSERVICES' };
      } else if (scene.recipeId === 'brand/hub') {
        props = { ...look, file: page, title, labels: names.slice(0, 10).join('\n') };
      } else if (scene.recipeId === 'brand/feature-zoom') {
        const k = featureZooms++;
        const ys = opts.capture?.sections ?? [];
        const pageH = opts.capture?.pageH ?? 0;
        const bySection = Boolean(screens[0] && pageH > INSET_PAGE_H && ys.length >= 2);
        const focusY = bySection ? Math.round(Math.min(1, Math.max(0, (ys[k % ys.length] - 60) / (pageH - INSET_PAGE_H))) * 100) : 0;
        props = { ...look, file: bySection ? screens[0] : (insetPool[k % Math.max(1, insetPool.length)] ?? page), focusY, label: (bySection ? opts.capture?.sectionNames?.[k % ys.length] : '') || '', text: title };
      } else {
        props = { ...look, logo: opts.brand?.logo ?? opts.logo ?? '', name: opts.brand?.name ?? opts.capture?.title ?? '', cta: title, url: opts.capture?.address ?? opts.brand?.repo ?? '' };
      }
      for (const [file, offset, len, volume, label] of BRAND_SOUNDS[scene.recipeId] ?? []) {
        if (offset < frames) sfx.push(clip('audio-clip', at + offset, Math.min(len, frames - offset), { file: sfxFile(file), volume }, { label }));
      }
      shots.push(clip(BRAND_SCENES[scene.recipeId].cardId, at, frames, props, { label: BRAND_SCENES[scene.recipeId].title }));
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
          ...(opts.texts?.[i] && Object.keys(opts.texts[i]).length ? { texts: opts.texts[i] } : {}),
        }, { speed: fitSpeed(card, frames) }),
      );
      // A shot that draws its own sample UI still shows the user's site: a framed picture in a corner.
      if (!usesCapture && insetPool.length) {
        const k = insets.length;
        // One section of the page per scene when the page is tall enough to have them: hero, features, pricing…
        const ys = opts.capture?.sections ?? [];
        const pageH = opts.capture?.pageH ?? 0;
        const bySection = Boolean(screens[0] && pageH > INSET_PAGE_H && ys.length >= 2);
        const focusY = bySection ? Math.round(Math.min(1, Math.max(0, (ys[k % ys.length] - 60) / (pageH - INSET_PAGE_H))) * 100) : 0;
        const label = (bySection ? opts.capture?.sectionNames?.[k % ys.length] : '') || opts.capture?.title || '';
        insets.push(
          clip('site-inset', at, frames, { file: bySection ? screens[0] : insetPool[k % insetPool.length], side: k % 2 === 0 ? 'right' : 'left', accent: palette.accent, label: label.slice(0, 40), focusY }, { label: 'Site' }),
        );
      }
      // `*word*` marks emphasis on the title card only; everywhere else the markers are dropped.
      const line = (scene.caption || scene.headline).replace(/\*/g, '');
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
    { id: uid('track'), name: 'Site', clips: insets },
    { id: uid('track'), name: t('track.shots'), clips: shots },
    { id: uid('track'), name: t('track.background'), clips: [clip('bg-paper', 0, total, { color: palette.background })] },
    { id: uid('track'), name: t('track.sfx'), clips: sfx },
  ];
  if (opts.music?.url) {
    tracks.push({
      id: uid('track'),
      name: t('track.music'),
      // Music sits under the SFX at about a third of full volume, with a 1 s fade in and out.
      clips: [clip('audio-clip', 0, total, { file: opts.music.url, volume: 0.34, fadeInFrames: 30, fadeOutFrames: 30, durationFrames: total }, { label: opts.music.name.slice(0, 32) })],
    });
  }

  return {
    name: plan.title,
    fps: FPS,
    width,
    height,
    background: palette.background,
    ...(opts.brand ? { brand: opts.brand } : {}),
    tracks: tracks.filter((track) => track.clips.length > 0 || track.name === t('track.shots')),
  };
}
