/**
 * NOTICE — code provenance & rebrand.
 * Motion Studio (formerly "ShotCraft Workbench") is the motion-editing surface of
 * SmartVideo GO. This module is derived from `video-shotcraft` by Wei Yihao
 * (vincentwei1021), licensed under Apache-2.0, and has been rebranded as
 * Motion Studio / SmartVideo GO.
 *   Original project : https://github.com/vincentwei1021/video-shotcraft (Apache-2.0)
 *   License          : http://www.apache.org/licenses/LICENSE-2.0
 * Customer-facing "ShotCraft / Workbench" branding has been replaced with
 * "Motion Studio / SmartVideo GO". Internal identifiers (storage keys, card ids,
 * palette format id, the `@proj/workbench` manifest contract, ...) are intentionally
 * kept unchanged for backwards compatibility with existing saved projects/palettes.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import LibraryPanel from "./panels/LibraryPanel";
import { Inspector } from "./panels/Inspector";
import { PreviewPanel } from "./preview/PreviewPanel";
import { Timeline } from "./timeline/Timeline";
import SessionPanel from "./components/SessionPanel";
import MotionAgentPanel from "./components/MotionAgentPanel";
import MotionHistorySection from "./components/MotionHistorySection";
import MotionPromptPanel from "./components/MotionPromptPanel";
import { findClip, resetProject, useStore } from "./store";
import { seekTo, togglePlay } from "./playerRef";
import type { ClipData, ProjectData, SessionData, TrackData } from "./types";
import { applyLocaleToDocument, LOCALES, useLocale, useT, type Locale } from "./i18n";
import { MOTION_CATEGORIES, motionCardId, type MotionTemplate } from "@/data/motionRecipeCatalog";
import ExportButton from "./ExportButton";
import "./styles.css";

const isEditable = (el: EventTarget | null) =>
  el instanceof HTMLElement &&
  (["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName) || el.isContentEditable);

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === "string";
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const isPosNum = (v: unknown): v is number => isNum(v) && v > 0;

/** Clip shape the timeline, the inspector and the Player all rely on. */
const isClipShape = (v: unknown): v is ClipData =>
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

const isTrackShape = (v: unknown): v is TrackData =>
  isObj(v) &&
  isStr(v.id) &&
  isStr(v.name) &&
  Array.isArray(v.clips) &&
  v.clips.every(isClipShape) &&
  (v.hidden === undefined || typeof v.hidden === "boolean");

/**
 * A project JSON the studio can install: the required fields plus every nested
 * track and clip. Without this a `{"tracks":[]}` object reaches the store, the
 * Player and the autosave, and `projectDuration()` turns into NaN.
 */
const isProjectShape = (v: unknown): v is ProjectData =>
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

/** 面板尺寸：可拖拽调整，落 localStorage */
const usePanelSize = (key: string, def: number) => {
  const [v, setV] = useState<number>(() => {
    const s = localStorage.getItem(key);
    return s ? Number(s) : def;
  });
  useEffect(() => {
    localStorage.setItem(key, String(v));
  }, [key, v]);
  return [v, setV] as const;
};

/** 右侧工作台（Agent / Prompt / History）的三个面 */
type RailTab = "agent" | "prompt" | "history";

/** 拖拽分隔条：pointerdown 后跟踪位移，交给回调换算尺寸 */
const startSplit = (
  e: React.PointerEvent,
  onMove: (dx: number, dy: number) => void,
) => {
  e.preventDefault();
  const sx = e.clientX;
  const sy = e.clientY;
  const mm = (ev: PointerEvent) => onMove(ev.clientX - sx, ev.clientY - sy);
  const up = () => window.removeEventListener("pointermove", mm);
  window.addEventListener("pointermove", mm);
  window.addEventListener("pointerup", up, { once: true });
};

export const App: React.FC = () => {
  const t = useT();
  const locale = useLocale((s) => s.locale);
  const setLocale = useLocale((s) => s.setLocale);
  useEffect(() => applyLocaleToDocument(locale), [locale]);
  const project = useStore((s) => s.project);
  const sessions = useStore((s) => s.sessions);
  const activeSessionId = useStore((s) => s.activeSessionId);
  const selectSession = useStore((s) => s.selectSession);
  const setPreview = useStore((s) => s.setPreview);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const canUndo = useStore((s) => s.past.length > 0);
  const canRedo = useStore((s) => s.future.length > 0);
  const updateName = (name: string) =>
    useStore.setState((s) => ({ project: { ...s.project, name } }));
  const fileRef = useRef<HTMLInputElement>(null);
  // wb-* localStorage keys are kept (they carry the original "workbench" branding,
  // not a customer-facing label) so returning users keep their saved panel sizes.
  const [libW, setLibW] = usePanelSize("wb-lib-w", 224);
  const [inspW, setInspW] = usePanelSize("wb-insp-w", 300);
  const [railW, setRailW] = usePanelSize("wb-rail-w", 360);
  const [tlH, setTlH] = usePanelSize("wb-tl-h", 264);
  const [viewMode, setViewMode] = useState<"library" | "sessions">("library");
  // 右侧工作台：Agent 对话 / 提示词与素材 / 历史画廊
  const [railOpen, setRailOpen] = useState(false);
  const [railTab, setRailTab] = useState<RailTab>("agent");

  /** 顶栏按钮：再点一次同一个面 = 收起；点别的面 = 切过去 */
  const toggleRail = (tab: RailTab) => {
    if (railOpen && railTab === tab) {
      setRailOpen(false);
      return;
    }
    setRailTab(tab);
    setRailOpen(true);
  };

  const handleSelectRecipe = (recipe: MotionTemplate) => {
    // The catalog id (`<category>/<slug>/<Component>`) is NOT a card id — the
    // registry keys demo cards as `demo:<Stem>`. Bridge it before previewing,
    // otherwise the preview falls back to a placeholder / empty composition.
    setPreview({ kind: "card", cardId: motionCardId(recipe) });
  };

  /** Library → timeline: insert the shot at the playhead on the selected
   *  clip's track (or the bottom track when nothing is selected). */
  const handleAddToTimeline = useCallback((recipe: MotionTemplate) => {
    const s = useStore.getState();
    const cardId = motionCardId(recipe);
    const selected = s.selectedClipId ? findClip(s.project, s.selectedClipId) : null;
    const trackId =
      selected?.track.id ?? s.project.tracks[s.project.tracks.length - 1]?.id;
    s.addClip(cardId, trackId, s.playhead);
  }, []);

  /** 右侧工作台「提示词」面：把描述落成时间轨上的一张文字卡（素材已随选择落轨） */
  const handlePromptGenerate = useCallback((payload: { prompt?: string }) => {
    const text = (payload?.prompt ?? "").trim();
    if (!text) return;
    const s = useStore.getState();
    const selected = s.selectedClipId ? findClip(s.project, s.selectedClipId) : null;
    const trackId =
      selected?.track.id ?? s.project.tracks[s.project.tracks.length - 1]?.id;
    if (!trackId) return;
    s.addClip("text-basic", trackId, s.playhead, {
      props: { content: text },
      label: text.slice(0, 24),
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isEditable(e.target)) return;
      const s = useStore.getState();
      if (e.key === " ") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "Backspace" || e.key === "Delete") {
        if (s.selectedClipId) s.removeClip(s.selectedClipId);
      } else if (e.key.toLowerCase() === "s" && !e.metaKey && !e.ctrlKey) {
        if (s.selectedClipId) s.splitClip(s.selectedClipId, s.playhead);
      } else if (e.key.toLowerCase() === "d" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (s.selectedClipId) s.duplicateClip(s.selectedClipId);
      } else if (e.key.toLowerCase() === "z" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (e.shiftKey) s.redo();
        else s.undo();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        const step = (e.shiftKey ? 10 : 1) * (e.key === "ArrowLeft" ? -1 : 1);
        const f = Math.max(0, s.playhead + step);
        seekTo(f);
        s.setPlayhead(f);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${project.name || "motion-studio-project"}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importJson = (file: File) => {
    file.text().then((text) => {
      try {
        const p = JSON.parse(text);
        if (!isProjectShape(p)) throw new Error("bad format");
        useStore.getState().setProject(p);
      } catch {
        window.alert(t("import.invalid"));
      }
    });
  };

  return (
    <div className="app">
      <header className="topbar">
        <span className="logo">Motion <b>Studio</b></span>
        <input
          className="project-name"
          value={project.name}
          onChange={(e) => updateName(e.target.value)}
          spellCheck={false}
        />
        <span style={{ flex: 1 }} />
        <button className="btn" disabled={!canUndo} onClick={undo} title={t("undo.title")}>
          {t("undo")}
        </button>
        <button className="btn" disabled={!canRedo} onClick={redo} title={t("redo.title")}>
          {t("redo")}
        </button>
        <span className="tl-sep" />
        <button
          className={`btn${railOpen && railTab === "agent" ? " primary" : ""}`}
          onClick={() => toggleRail("agent")}
          title={t("nav.agent.title")}
          aria-pressed={railOpen && railTab === "agent"}
          data-testid="topbar-agent-toggle"
        >
          {t("rail.agent")}
        </button>
        <button
          className={`btn${railOpen && railTab === "history" ? " primary" : ""}`}
          onClick={() => toggleRail("history")}
          title={t("nav.history.title")}
          aria-pressed={railOpen && railTab === "history"}
          data-testid="topbar-history-toggle"
        >
          {t("rail.history")}
        </button>
        <span className="tl-sep" />
        <ExportButton />
        <button className="btn" onClick={exportJson}>{t("exportJson")}</button>
        <button className="btn" onClick={() => fileRef.current?.click()}>{t("import")}</button>
        <button
          className="btn"
          onClick={() => window.confirm(t("reset.confirm")) && resetProject()}
        >
          {t("reset")}
        </button>
        <span className="tl-sep" />
        <select
          className="btn interface-language"
          value={locale}
          onChange={(e) => setLocale(e.target.value as Locale)}
          title={t("lang.title")}
          aria-label={t("lang.title")}
        >
          {LOCALES.map((l) => (
            <option key={l.id} value={l.id}>{l.label}</option>
          ))}
        </select>
        <span className="tl-sep" />
        <select
          className="btn session-select"
          value={activeSessionId ?? ""}
          onChange={(e) => {
            if (e.target.value) selectSession(e.target.value);
            setViewMode("sessions");
          }}
        >
          <option value="">{t("session.placeholder")}</option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importJson(f);
            e.target.value = "";
          }}
        />
      </header>

      <main className="main">
        <div className="panel-wrap" style={{ width: libW }}>
          {viewMode === "library" ? (
            <LibraryPanel
              categories={MOTION_CATEGORIES.map((c) => c.key)}
              onSelectRecipe={handleSelectRecipe}
              onAddToTimeline={handleAddToTimeline}
            />
          ) : (
            <SessionPanel />
          )}
        </div>
        <div
          className="splitter v"
          title={t("split.library")}
          onPointerDown={(e) => {
            const start = libW;
            startSplit(e, (dx) => setLibW(clamp(start + dx, 160, 440)));
          }}
        />
        <PreviewPanel />
        <div
          className="splitter v"
          title={t("split.inspector")}
          onPointerDown={(e) => {
            const start = inspW;
            startSplit(e, (dx) => setInspW(clamp(start - dx, 220, 500)));
          }}
        />
        <div className="panel-wrap" style={{ width: inspW }}>
          <Inspector />
        </div>
        {railOpen && (
          <>
            <div
              className="splitter v"
              title={t("split.inspector")}
              onPointerDown={(e) => {
                const start = railW;
                startSplit(e, (dx) => setRailW(clamp(start - dx, 260, 640)));
              }}
            />
            <div className="panel-wrap" style={{ width: railW }}>
              <div className="ms-rail" data-testid="studio-rail">
                <div className="ms-rail-tabs" role="tablist" aria-label="Studio side panel">
              {(
                [
                  { id: "agent", label: t("rail.agent") },
                  { id: "prompt", label: t("rail.prompt") },
                  { id: "history", label: t("rail.history") },
                ] as { id: RailTab; label: string }[]
              ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={railTab === tab.id}
                      className={`ms-rail-tab${railTab === tab.id ? " on" : ""}`}
                      onClick={() => setRailTab(tab.id)}
                      data-testid={`rail-tab-${tab.id}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div className="ms-rail-body">
                  {railTab === "agent" && <MotionAgentPanel />}
                  {railTab === "prompt" && (
                    <MotionPromptPanel onGenerate={handlePromptGenerate} />
                  )}
                  {railTab === "history" && <MotionHistorySection />}
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      <div
        className="splitter h"
        title={t("split.timeline")}
        onPointerDown={(e) => {
          const start = tlH;
          startSplit(e, (_dx, dy) => setTlH(clamp(start - dy, 150, 600)));
        }}
      />
      <div className="panel-wrap" style={{ height: tlH }}>
        <Timeline />
      </div>
    </div>
  );
};
