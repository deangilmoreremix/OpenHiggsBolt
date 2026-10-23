import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store";
import { sessionClipCount } from "../types";
import { MOTION_CATEGORIES } from "@/data/motionRecipeCatalog";
import MotionAgentPanel from "./MotionAgentPanel";

const TABS = [
  { id: "starters", label: "Starters" },
  { id: "recipes", label: "My Motion Recipes" },
  { id: "sessions", label: "My Sessions" },
];

/**
 * 起步提示词：由 MOTION_CATEGORIES 派生（每个分类给一句可直接开拍的指令），
 * 不再是写死的三条假数据。
 */
const STARTERS = MOTION_CATEGORIES.map((c) => ({
  id: `starter-${c.key}`,
  name: c.labelEn,
  category: c.label,
  prompt: `${c.labelEn} sequence: 3 shots, one kinetic title card, and a caption strip.`,
  aspectRatio: "16:9",
  duration: 15,
}));

const timeAgo = (iso) => {
  const d = new Date(iso);
  const sec = Math.floor((Date.now() - d) / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const emptyProject = (name) => ({
  name,
  fps: 30,
  width: 1920,
  height: 1080,
  background: "#030303",
  tracks: [],
});

/** 会话正在编辑的配方名（卡片 / 模板） */
const recipeLabel = (s) => s.recipeName || s.recipeId || null;

/** 会话摘要：画幅 · 时长 · 片段数 · 对话条数 */
const sessionMeta = (s) => {
  const tracks = s.projectSnapshot.tracks;
  const clipCount = tracks.reduce((sum, t) => sum + t.clips.length, 0);
  const fps = s.projectSnapshot.fps || 30;
  const end = tracks.reduce((m, t) => Math.max(m, ...t.clips.map((c) => c.start + c.duration)), 0);
  const duration = Math.round((end / fps) * 10) / 10;
  return [
    s.aspectRatio && `${s.aspectRatio}`,
    duration > 0 && `${duration}s`,
    clipCount > 0 && `${clipCount} clips`,
    (s.messages?.length ?? 0) > 0 && `${s.messages.length} msg`,
  ]
    .filter(Boolean)
    .join(" · ");
};

const SessionRow = ({ s, active, showRecipe, onSelect, onDelete, meta }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: 8,
      borderRadius: 7,
      background: active ? "rgba(34,211,238,0.12)" : "#111",
      border: "1px solid rgba(255,255,255,0.06)",
      cursor: "pointer",
    }}
    onClick={() => onSelect(s.id)}
  >
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          fontWeight: 600,
          fontSize: 13,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {s.name}
      </div>
      {showRecipe && recipeLabel(s) ? (
        <div
          style={{
            fontSize: 11,
            color: "#22d3ee",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            marginTop: 2,
          }}
        >
          {recipeLabel(s)}
        </div>
      ) : s.prompt ? (
        <div
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.5)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            marginTop: 2,
          }}
        >
          {s.prompt}
        </div>
      ) : null}
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
        {meta(s)} · {timeAgo(s.updatedAt)}
      </div>
    </div>
    <button
      onClick={(e) => {
        e.stopPropagation();
        onDelete(s.id);
      }}
      style={{
        border: 0,
        borderRadius: 5,
        background: "transparent",
        color: "rgba(255,255,255,0.35)",
        padding: 4,
        fontSize: 14,
        cursor: "pointer",
        lineHeight: 1,
        opacity: 0.6,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = "#f87171";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = "rgba(255,255,255,0.35)";
      }}
    >
      ×
    </button>
  </div>
);

export default function SessionPanel() {
  const navigate = useNavigate();
  const sessions = useStore((s) => s.sessions);
  const activeId = useStore((s) => s.activeSessionId);
  const selectSession = useStore((s) => s.selectSession);
  const addSession = useStore((s) => s.addSession);
  const deleteSession = useStore((s) => s.deleteSession);
  const applySession = useStore((s) => s.applySession);
  const [tab, setTab] = useState("sessions");

  const active = sessions.find((s) => s.id === activeId) ?? null;

  // “我的动效配方” = 用户自己攒出来的会话（有片段的），按更新时间倒序
  const userRecipes = useMemo(
    () =>
      [...sessions]
        .filter((s) => sessionClipCount(s) > 0 || (s.messages?.length ?? 0) > 0)
        .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)),
    [sessions],
  );

  const handleNewSession = () => {
    const session = {
      id: `session_${Date.now().toString(36)}`,
      name: "Untitled Session",
      projectSnapshot: emptyProject("Untitled"),
      updatedAt: new Date().toISOString(),
      messageCount: 0,
      messages: [],
    };
    addSession(session);
    navigate("/motion/new");
  };


  return (
    <div style={{ display: "flex", flex: 1, minHeight: 0, background: "#030303", color: "#fff" }}>
      <div
        style={{
          width: 340,
          flex: "none",
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid rgba(255,255,255,0.05)",
          background: "#0a0a0a",
        }}
      >
        <div
          style={{
            padding: "12px 14px",
            fontWeight: 600,
            fontSize: "13px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          Session Panel
        </div>
        <div
          style={{
            display: "flex",
            gap: 2,
            margin: 10,
            padding: 2,
            background: "rgba(255,255,255,0.03)",
            borderRadius: 9,
          }}
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1,
                border: 0,
                borderRadius: 7,
                background: tab === t.id ? "#3b3b41" : "transparent",
                color: tab === t.id ? "#fff" : "rgba(255,255,255,0.5)",
                padding: 6,
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "4px 10px 12px" }}>
          {tab === "starters" && (
            <>
              <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>
                Starter prompts
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {STARTERS.map((tpl) => (
                  <div
                    key={tpl.id}
                    style={{
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 7,
                      padding: 10,
                      background: "#111",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      const session = {
                        id: `session_${Date.now().toString(36)}`,
                        name: tpl.name,
                        prompt: tpl.prompt,
                        aspectRatio: tpl.aspectRatio,
                        duration: tpl.duration,
                        recipeId: tpl.id,
                        recipeName: tpl.name,
                        projectSnapshot: emptyProject(tpl.name),
                        updatedAt: new Date().toISOString(),
                        messageCount: 0,
                        messages: [],
                      };
                      addSession(session);
                      navigate("/motion/new");
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{tpl.name}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.4 }}>
                      {tpl.prompt}
                    </div>
                    <div style={{ marginTop: 6, fontSize: 10, color: "rgba(255,255,255,0.4)" }}>
                      {tpl.aspectRatio} · {tpl.duration}s
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          {tab === "recipes" && (
            <>
              <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>
                My Motion Recipes ({userRecipes.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {userRecipes.map((s) => (
                  <SessionRow
                    key={s.id}
                    s={s}
                    active={s.id === activeId}
                    showRecipe
                    onSelect={selectSession}
                    onDelete={deleteSession}
                    meta={sessionMeta}
                  />
                ))}
                {userRecipes.length === 0 && (
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", padding: 10 }}>
                    Your motion recipes land here — a session you edited becomes a recipe you can keep
                    and re-open.
                  </div>
                )}
              </div>
            </>
          )}
          {tab === "sessions" && (
            <>
              <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>
                My Sessions ({sessions.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {sessions.map((s) => (
                  <SessionRow
                    key={s.id}
                    s={s}
                    active={s.id === activeId}
                    showRecipe
                    onSelect={selectSession}
                    onDelete={deleteSession}
                    meta={sessionMeta}
                  />
                ))}
                {sessions.length === 0 && (
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", padding: 10 }}>
                    No sessions yet. Create one to start saving your edits.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {!active ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: 10 }}>
              Select a session to open its chat view
            </div>
            <button onClick={handleNewSession} className="btn primary" style={{ padding: "8px 16px", fontSize: 13 }}>
              Create New Session
            </button>
          </div>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "14px 18px",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                background: "#0a0a0a",
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{active.name}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
                  {recipeLabel(active) ? (
                    <span style={{ color: "#22d3ee" }}>{recipeLabel(active)}</span>
                  ) : null}
                  {recipeLabel(active) ? " · " : ""}
                  {sessionMeta(active)} · {timeAgo(active.updatedAt)}
                </div>
              </div>
              <div style={{ marginLeft: "auto" }}>
                <button
                  onClick={() => applySession(active.id)}
                  className="btn"
                  style={{ marginRight: 8, padding: "6px 12px", fontSize: 12 }}
                >
                  Open in Editor
                </button>
                <button
                  onClick={() => deleteSession(active.id)}
                  className="btn danger"
                  style={{ padding: "6px 12px", fontSize: 12 }}
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Agent 对话：真实消息流 + 输入框 */}
            <MotionAgentPanel
              sessionId={active.id}
              recipeId={active.recipeId}
              recipeName={active.recipeName}
            />

            <div style={{ padding: "10px 16px", borderTop: "1px solid rgba(255,255,255,0.05)", background: "#0a0a0a" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>
                Timeline ({sessionClipCount(active)} clips)
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8 }}>
                {active.projectSnapshot.tracks.map((track) => (
                  <div
                    key={track.id}
                    style={{
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 7,
                      padding: 8,
                      background: "#030303",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: "rgba(255,255,255,0.4)",
                        marginBottom: 6,
                        textTransform: "uppercase",
                      }}
                    >
                      {track.name}
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
                      {track.clips.length} clip{track.clips.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                ))}
                {active.projectSnapshot.tracks.length === 0 && (
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
                    Empty timeline — create a new session to start building.
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
