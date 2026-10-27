/** 工程数据模型：Project → Track → Clip。所有时间量以时间轴帧为单位（默认 30fps）。 */

export interface ClipData {
  id: string;
  cardId: string;
  /** 时间轴上的起点（帧） */
  start: number;
  /** 时间轴上占据的长度（帧）——可短于/长于卡片原始时长（裁剪/定格延长） */
  duration: number;
  /** 裁入点：从卡片素材的第几帧开始播（源帧），控制动效的进场时机 */
  inOffset: number;
  /** 变速倍率：每走 1 时间轴帧，源时间前进 speed 帧 */
  speed: number;
  /** 图层不透明度 0–1 */
  opacity: number;
  /** 图层整体缩放 */
  scale: number;
  /** 图层位移（px，合成坐标系） */
  x: number;
  y: number;
  /** 卡片专属属性覆盖（缺省值来自卡片 schema） */
  props: Record<string, unknown>;
  /** 时间轨上显示的自定义标签（缺省显示卡片名）——导入成片时的镜头/音效用它标注 */
  label?: string;
}

export interface TrackData {
  id: string;
  name: string;
  hidden?: boolean;
  clips: ClipData[];
}

export interface ProjectData {
  /** Visual preset; absent means the manifest's default, preserving older JSON. */
  themeId?: string;
  themeColors?: Record<string, string>;
  name: string;
  fps: number;
  width: number;
  height: number;
  /** 舞台底色（成片工程 AbsoluteFill 的 background；缺省近黑） */
  background?: string;
  /** 由哪个成片清单导入（清单 name + total）——`?import=project` 用它判断是否需要重新导入 */
  source?: string;
  tracks: TrackData[];
}

let seq = 0;
export const uid = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}${(seq++).toString(36)}`;

/** 内容精确结束帧（最晚 clip 结束；导出成片用，不带余量） */
export const projectEndFrame = (project: ProjectData): number => {
  let end = 0;
  for (const t of project.tracks)
    for (const c of t.clips) end = Math.max(end, c.start + c.duration);
  return end;
};

/** 工程总时长（帧）：最晚 clip 结束 + 1s 余量，最短 5s（编辑预览用；按工程 fps 换算） */
export const projectDuration = (project: ProjectData): number =>
  Math.max(5 * project.fps, projectEndFrame(project) + project.fps);

/** 会话里的一条对话（用户指令 / Agent 回执）。 */
export interface SessionMessage {
  role: "user" | "assistant";
  content: string;
  /** ISO 时间戳 */
  ts: string;
}

/** 会话快照：把一个工程状态作为可再打开的“会话”保存，供 SessionPanel 列表/恢复用。 */
export interface SessionData {
  id: string;
  name: string;
  prompt?: string;
  aspectRatio?: string;
  duration?: number;
  projectSnapshot: ProjectData;
  updatedAt: string;
  /** 对话条数（= messages.length，保留旧字段名以兼容既有存档） */
  messageCount: number;
  sourceSessionId?: string;
  /** 本会话在编辑的动效配方（卡片 / 模板 id）——用于跨多轮继续编辑同一配方 */
  recipeId?: string;
  /** 配方的展示名（卡片名 / 模板名） */
  recipeName?: string;
  /** 与会话一起保存的完整对话 */
  messages: SessionMessage[];
}

/** 会话里的素材片段总数（对话气条里的消息条数类比）。 */
export const sessionClipCount = (session: SessionData): number =>
  session.projectSnapshot.tracks.reduce((sum, t) => sum + t.clips.length, 0);

/** 兼容旧存档：老会话没有 messages 字段，补一个空数组。 */
export const normalizeSession = (session: SessionData): SessionData => ({
  ...session,
  messages: Array.isArray(session.messages) ? session.messages : [],
  messageCount: Array.isArray(session.messages)
    ? session.messages.length
    : (session.messageCount ?? 0),
});

// —— Strict project shape guards (used by loadSaved and importJson) ——

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === "string";
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const isPosNum = (v: unknown): v is number => isNum(v) && v > 0;

/** Clip shape the timeline, the inspector and the Player all rely on. */
export const isClipShape = (v: unknown): v is ClipData =>
  isObj(v) &&
  isStr(v.id) &&
  isStr(v.cardId) &&
  isNum(v.start) &&
  v.start >= 0 &&
  isPosNum(v.duration) &&
  isNum(v.inOffset) &&
  v.inOffset >= 0 &&
  isPosNum(v.speed) &&
  isNum(v.opacity) &&
  isNum(v.scale) &&
  isNum(v.x) &&
  isNum(v.y) &&
  isObj(v.props) &&
  (v.label === undefined || isStr(v.label));

export const isTrackShape = (v: unknown): v is TrackData =>
  isObj(v) &&
  isStr(v.id) &&
  isStr(v.name) &&
  Array.isArray(v.clips) &&
  v.clips.every(isClipShape) &&
  (v.hidden === undefined || typeof v.hidden === "boolean");

/** A project JSON the studio can install: the required fields plus every nested
 *  track and clip. Without this a `{"tracks":[]}` object reaches the store, the
 *  Player and the autosave, and `projectDuration()` turns into NaN. */
export const isProjectShape = (v: unknown): v is ProjectData =>
  isObj(v) &&
  isStr(v.name) &&
  isPosNum(v.fps) &&
  isPosNum(v.width) &&
  isPosNum(v.height) &&
  Array.isArray(v.tracks) &&
  v.tracks.every(isTrackShape) &&
  (v.themeId === undefined || isStr(v.themeId)) &&
  (v.background === undefined || isStr(v.background)) &&
  (v.source === undefined || isStr(v.source)) &&
  (v.themeColors === undefined ||
    (isObj(v.themeColors) && Object.values(v.themeColors).every(isStr)));
