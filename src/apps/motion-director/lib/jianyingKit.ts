/**
 * JianYing kit (upstream references/jianying-export.md): the film split the way the editor wants it —
 * a clean video plate (no captions, no sound), the captions as editable text, the sound effects and music
 * as separate audio — plus a script that builds the draft with pyJianYingDraft on the person's own
 * computer. Installing into JianYing's draft library needs the local app closed and the upstream
 * `mac_draft.py` / `windows_draft.py`, so this web app hands over the kit and does not touch the editor.
 */
import type { ProjectData } from '../types';
import { OUTPUT_AUDIO_OFFSET_F } from './buildFilm';

export interface KitTimeline {
  name: string;
  fps: number;
  width: number;
  height: number;
  totalFrames: number;
  /** Where each scene starts and ends on the plate (the plate is cut into one segment per scene). */
  shots: Array<{ name: string; from: number; to: number }>;
  /** Captions as native text: JianYing size is the pixel size ÷ 10.8, transformY is −1…1 from the middle of the frame. */
  captions: Array<{ text: string; from: number; to: number; size: number; transformY: number; color: [number, number, number] }>;
  /** Sound effects and music; `file` is a path inside the kit's `audio/` folder. */
  audio: Array<{ file: string; role: 'sfx' | 'bgm'; from: number; duration: number; volume: number; label: string }>;
}

const isAudio = (c: { cardId: string }) => c.cardId === 'audio-clip';
const SHOT_CARD = /^(demo:|brand-|inkpress-title-card$|text-basic$|video-clip$|image-clip$)/;

const hexToRgb = (hex: string): [number, number, number] => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return [0.34, 0.33, 0.32];
  const n = parseInt(m[1], 16);
  return [Number(((n >> 16) / 255).toFixed(3)), Number((((n >> 8) & 255) / 255).toFixed(3)), Number(((n & 255) / 255).toFixed(3))];
};

const audioName = (file: string) => file.replace(/^motion-studio\/sfxlib\//, '').replace(/[^\w.-]+/g, '_');

/** The kit's timeline tables, read from the built film. */
export function kitTimeline(project: ProjectData): KitTimeline {
  const clips = project.tracks.filter((t) => !t.hidden).flatMap((t) => t.clips);
  const shots = clips
    .filter((c) => SHOT_CARD.test(c.cardId))
    .sort((a, b) => a.start - b.start)
    .map((c, i) => ({ name: (c.label || c.cardId).replace(/[^\w .-]+/g, '').slice(0, 40) || `shot ${i + 1}`, from: Math.round(c.start), to: Math.round(c.start + c.duration) }));
  const captions = clips
    .filter((c) => c.cardId === 'inkpress-caption' && typeof c.props.text === 'string')
    .sort((a, b) => a.start - b.start)
    .map((c) => {
      const px = Number(c.props.fontSize ?? 56);
      const bottom = Number(c.props.bottom ?? 0);
      const centerY = project.height - bottom - px / 2;
      return {
        text: String(c.props.text),
        from: Math.round(c.start),
        to: Math.round(c.start + c.duration),
        size: Number((px / 10.8).toFixed(2)),
        transformY: Number((1 - (2 * centerY) / project.height).toFixed(3)),
        color: hexToRgb(String(c.props.color ?? '#575552')),
      };
    });
  const audio = clips
    .filter(isAudio)
    .sort((a, b) => a.start - b.start)
    .map((c) => {
      const file = String(c.props.file ?? '');
      const sfx = /sfxlib\//.test(file);
      // The film's sound pins already carry the web renderer's output delay; JianYing plays what it is given.
      const from = sfx ? Math.round(c.start + OUTPUT_AUDIO_OFFSET_F) : Math.round(c.start);
      return { file: `audio/${audioName(file)}`, role: sfx ? ('sfx' as const) : ('bgm' as const), from, duration: Math.round(c.duration), volume: Number(c.props.volume ?? 1), label: c.label ?? '' };
    });
  const total = Math.max(0, ...clips.map((c) => c.start + c.duration));
  return { name: project.name || 'Motion Director film', fps: project.fps, width: project.width, height: project.height, totalFrames: Math.round(total), shots, captions, audio };
}

/** The film without captions and sound: the plate JianYing cuts into scenes. */
export function plateProject(project: ProjectData): ProjectData {
  return {
    ...project,
    tracks: project.tracks
      .map((t) => ({ ...t, clips: t.clips.filter((c) => !isAudio(c) && c.cardId !== 'inkpress-caption') }))
      .filter((t) => t.clips.length),
  };
}

/** Source files of the audio the kit needs: kit path → URL the browser can fetch. */
export function kitAudioSources(project: ProjectData): Array<{ path: string; url: string }> {
  const seen = new Map<string, string>();
  for (const t of project.tracks) {
    for (const c of t.clips) {
      if (!isAudio(c) || typeof c.props.file !== 'string' || !c.props.file) continue;
      const file = c.props.file;
      const path = `audio/${audioName(file)}`;
      if (!seen.has(path)) seen.set(path, /^(https?:|blob:|data:|\/)/.test(file) ? file : `/${file}`);
    }
  }
  return [...seen].map(([path, url]) => ({ path, url }));
}

export const KIT_SCRIPT = `"""Build the JianYing draft from this kit (needs: pip install pyJianYingDraft).

  python build_draft.py            # build the draft into ./staging
  python build_draft.py install    # build, then install into the JianYing draft library
                                   # (close JianYing first; needs mac_draft.py or windows_draft.py
                                   #  from the video-shotcraft repo's jianying-export folder, next to this file)
"""
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import pyJianYingDraft as draft

T = json.load(open(os.path.join(HERE, "timeline.json"), encoding="utf-8"))
FPS = T["fps"]
STAGING = os.path.join(HERE, "staging")
NAME = T["name"]


def f2us(f):
    return round(f * 1_000_000 / FPS)


def rng(f0, f1):
    # each edge rounded on its own, then subtracted: no 1 microsecond gaps or overlaps
    return draft.Timerange(f2us(f0), f2us(f1) - f2us(f0))


os.makedirs(STAGING, exist_ok=True)
folder = draft.DraftFolder(STAGING)
script = folder.create_draft(NAME, T["width"], T["height"], fps=FPS, allow_replace=True)
script.append_track(draft.TrackSpec(draft.TrackType.video, name="plate"))
script.append_track(draft.TrackSpec(draft.TrackType.text, name="captions"))

plate = draft.VideoMaterial(os.path.join(HERE, "plate.mp4"))
plate_frames = int(plate.duration * FPS / 1_000_000)
for shot in T["shots"]:
    if shot["from"] >= plate_frames:
        continue  # a plate shorter than the timeline (an interrupted render): skip what it does not have
    r = rng(shot["from"], min(shot["to"], plate_frames))
    script.add_segment(draft.VideoSegment(plate, r, source_timerange=r), "plate")

for cap in T["captions"]:
    style = draft.TextStyle(size=cap["size"], color=tuple(cap["color"]), align=1, letter_spacing=14)
    script.add_segment(draft.TextSegment(cap["text"], rng(cap["from"], cap["to"]), style=style,
                                         clip_settings=draft.ClipSettings(transform_y=cap["transformY"])), "captions")

# a JianYing track cannot hold overlapping segments: put each sound on the first free lane
lanes, placed = [], []
for a in sorted(T["audio"], key=lambda a: a["from"]):
    mat = draft.AudioMaterial(os.path.join(HERE, a["file"]))
    start = f2us(a["from"])
    dur = min(f2us(a["duration"]), mat.duration, f2us(T["totalFrames"]) - start)
    if dur <= 0:
        continue
    lane = next((i for i, end in enumerate(lanes) if end <= start), len(lanes))
    if lane == len(lanes):
        lanes.append(0)
    lanes[lane] = start + dur
    placed.append((lane, a["role"], start, dur, mat, a["volume"]))
for i in range(len(lanes)):
    script.append_track(draft.TrackSpec(draft.TrackType.audio, name=f"Audio{i + 1}"))
for lane, role, start, dur, mat, volume in placed:
    script.add_segment(draft.AudioSegment(mat, draft.Timerange(start, dur), volume=volume), f"Audio{lane + 1}")

script.save()
draft_dir = os.path.join(STAGING, NAME)
print(f"draft built: {draft_dir} ({len(T['shots'])} scenes, {len(T['captions'])} captions, {len(placed)} sounds)")

if "install" in sys.argv[1:]:
    try:
        import mac_draft as installer
    except ImportError:
        import windows_draft as installer
    info = installer.macify(draft_dir, NAME) if hasattr(installer, "macify") else None
    backup = installer.install(draft_dir, NAME, info) if info else installer.install(draft_dir, NAME)
    print(f"installed into JianYing: {NAME} ({backup})")
`;

export const KIT_README = `JianYing kit
============

plate.mp4       the film without captions and sound, cut into one segment per scene by the script
timeline.json   scenes, captions (native text) and sound cues, in frames at the film's fps
audio/          the sound effects and music the film uses
build_draft.py  builds the draft (pip install pyJianYingDraft)

1. Put mac_draft.py (Mac) or windows_draft.py (Windows) from
   https://github.com/Vincentwei1021/video-shotcraft/tree/main/jianying-export next to build_draft.py.
2. Quit JianYing completely, then run:  python build_draft.py install
   (without "install" it only builds ./staging, so you can look first).
3. Open the draft in JianYing. Captions are editable text; every scene is its own segment (speed, reorder,
   colour); sounds and music are separate tracks. Motion inside a scene is baked into the plate.

JianYing encrypts a draft the first time it saves it; that is one-way. To change the cut, edit timeline.json
and run the script again. The Mac draft carries your computer's device ids: do not share the draft folder,
share the rendered MP4.
`;

/* ---------- a store-only zip, no library ---------- */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export const crc32 = (data: Uint8Array): number => {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

export interface ZipEntry {
  path: string;
  data: Uint8Array;
}

/** A zip with every file stored uncompressed (the plate and the sounds are already compressed). */
export function zipStore(entries: readonly ZipEntry[]): Uint8Array {
  const enc = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  const u16 = (v: DataView, o: number, n: number) => v.setUint16(o, n, true);
  const u32 = (v: DataView, o: number, n: number) => v.setUint32(o, n >>> 0, true);
  for (const e of entries) {
    const name = enc.encode(e.path);
    const crc = crc32(e.data);
    const local = new Uint8Array(30 + name.length);
    const lv = new DataView(local.buffer);
    u32(lv, 0, 0x04034b50);
    u16(lv, 4, 20);
    u16(lv, 6, 0x0800); // UTF-8 names
    u16(lv, 8, 0); // stored
    u16(lv, 10, 0);
    u16(lv, 12, 0x21); // 1980-01-01
    u32(lv, 14, crc);
    u32(lv, 18, e.data.length);
    u32(lv, 22, e.data.length);
    u16(lv, 26, name.length);
    u16(lv, 28, 0);
    local.set(name, 30);
    const head = new Uint8Array(46 + name.length);
    const hv = new DataView(head.buffer);
    u32(hv, 0, 0x02014b50);
    u16(hv, 4, 20);
    u16(hv, 6, 20);
    u16(hv, 8, 0x0800);
    u16(hv, 10, 0);
    u16(hv, 12, 0);
    u16(hv, 14, 0x21);
    u32(hv, 16, crc);
    u32(hv, 20, e.data.length);
    u32(hv, 24, e.data.length);
    u16(hv, 28, name.length);
    u32(hv, 42, offset);
    head.set(name, 46);
    chunks.push(local, e.data);
    central.push(head);
    offset += local.length + e.data.length;
  }
  const centralSize = central.reduce((n, c) => n + c.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  u32(ev, 0, 0x06054b50);
  u16(ev, 8, entries.length);
  u16(ev, 10, entries.length);
  u32(ev, 12, centralSize);
  u32(ev, 16, offset);
  const all = [...chunks, ...central, end];
  const out = new Uint8Array(all.reduce((n, c) => n + c.length, 0));
  let o = 0;
  for (const c of all) {
    out.set(c, o);
    o += c.length;
  }
  return out;
}

/** The kit as a zip: the rendered plate, the tables, the sounds, the script and the instructions. */
export async function buildJianyingKit(project: ProjectData, plate: Blob, fetchAudio: (url: string) => Promise<Uint8Array | null>): Promise<{ zip: Uint8Array; missing: string[] }> {
  const enc = new TextEncoder();
  const entries: ZipEntry[] = [
    { path: 'plate.mp4', data: new Uint8Array(await plate.arrayBuffer()) },
    { path: 'timeline.json', data: enc.encode(JSON.stringify(kitTimeline(project), null, 2)) },
    { path: 'build_draft.py', data: enc.encode(KIT_SCRIPT) },
    { path: 'README.txt', data: enc.encode(KIT_README) },
  ];
  const missing: string[] = [];
  for (const src of kitAudioSources(project)) {
    const data = await fetchAudio(src.url).catch(() => null);
    if (data) entries.push({ path: src.path, data });
    else missing.push(src.path);
  }
  return { zip: zipStore(entries), missing };
}
