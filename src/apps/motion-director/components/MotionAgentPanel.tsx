'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { semantic } from "@/shared/styles/designTokens";
import { ChatBubble, PromptCard, PromptInput, SendButton, useTypingPlaceholder } from "@/apps/design-agent/ui";
import { useStore } from "../store";
import { CARDS } from "../cards/registry";
import { interpretAgentCommand, AGENT_HELP, type AgentContext } from "../lib/agentCommands";
import { applyAgentOps } from "../lib/agentApply";
import { projectToSession } from "../lib/sessionAdapter";
import { applyDirectorOps, requestEdit, DirectorError } from "../lib/directorClient";
import type { ProjectData, SessionMessage } from "../types";
import type { AspectRatio } from "../projectContract";
import { useFilmDirector } from "./useFilmDirector";
import { isFilmRequest, isNewFilmRequest } from "../lib/filmChat";
import { FilmDirectorChat } from "./FilmDirectorChat";
import { requestExport } from "../ExportButton";

/**
 * Motion Agent —— 工作室里的对话式改片面板。
 *
 * 一条指令 → 解释器（`lib/agentCommands.ts`，本地确定性、无外部 LLM / 无付费
 * API）→ 真实 store 改动（`lib/agentApply.ts`）→ Remotion Player 重渲染。
 * 每一轮对话都写进当前会话（session.messages），会话面板能回看。
 */

const SUGGESTIONS = [
  "Use video-shotcraft to make a promo for my product",
  "Use the deck-deal-flyin and row-embed shot cards to present this feature",
  "render the MP4",
  "make the text bigger",
  "set the duration to 8s",
  "change the background to red",
  "slow down by 0.5x",
  "add a caption clip",
];

const RENDER_RE = /\b(?:render|export)\b[^.]{0,30}\b(?:mp4|video|film|movie)\b|^\s*(?:render|export)\s*(?:it)?\s*[.!]?\s*$/i;

const aspectOf = (p: ProjectData): AspectRatio => (p.width === p.height ? "1:1" : p.height > p.width ? "9:16" : "16:9");

const clock = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const Bubble: React.FC<{ message: SessionMessage }> = ({ message }) => (
  <ChatBubble
    role={message.role}
    preWrap
    below={
      <div className={`text-[10px] ${message.role === "user" ? "text-right" : ""}`} style={{ color: semantic.textMuted }}>
        {clock(message.ts)}
      </div>
    }
  >
    {message.content}
  </ChatBubble>
);

export interface MotionAgentPanelProps {
  /** 要写入对话的会话；不给时用当前会话 */
  sessionId?: string | null;
  /** 这个会话在编辑的配方（新建会话时记下） */
  recipeId?: string;
  recipeName?: string;
}

export const MotionAgentPanel: React.FC<MotionAgentPanelProps> = ({
  sessionId,
  recipeId,
  recipeName,
}) => {
  const sessions = useStore((s) => s.sessions);
  const activeSessionId = useStore((s) => s.activeSessionId);
  const addSession = useStore((s) => s.addSession);
  const appendSessionMessage = useStore((s) => s.appendSessionMessage);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const targetId = sessionId ?? activeSessionId;
  const session = useMemo(
    () => sessions.find((s) => s.id === targetId) ?? null,
    [sessions, targetId],
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [session?.messages.length, targetId]);

  /** Session the film conversation writes into (created on first use). */
  const ensureSession = useCallback((): string => {
    const current = sessionId ?? useStore.getState().activeSessionId;
    if (current && useStore.getState().sessions.some((s) => s.id === current)) return current;
    const state = useStore.getState();
    const created = projectToSession(state.project, state.project.name || "Untitled Session", undefined, recipeId, recipeName);
    state.addSession(created);
    return created.id;
  }, [sessionId, recipeId, recipeName]);

  const director = useFilmDirector({
    settings: () => ({
      aspectRatio: aspectOf(useStore.getState().project),
      durationSec: 20,
      brandKit: null,
      media: [],
      pickedRecipes: [],
    }),
    onMessage: (m) => useStore.getState().appendSessionMessage(ensureSession(), { role: m.role, content: m.content, ts: m.ts }),
    // Already in the workbench: the built film replaces the project (one undo step brings the old one back).
    onBuilt: (film) => useStore.getState().setProject(film.project),
    // Once there is a film to edit, only an explicit ask starts a new one; edits stay edits.
    isRequest: (text) =>
      useStore.getState().project.tracks.some((t) => t.clips.length > 0) ? isNewFilmRequest(text) : isFilmRequest(text),
    editFallback: true,
  });

  // The film conversation belongs to one session: switching to another session starts it
  // afresh. (The first message creates a session; going from none to that one is not a switch.)
  const resetDirector = director.reset;
  const prevTargetRef = useRef(targetId);
  useEffect(() => {
    const prev = prevTargetRef.current;
    prevTargetRef.current = targetId;
    if (prev && targetId !== prev) resetDirector();
  }, [targetId, resetDirector]);

  const send = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text) return;

      // New film / shot requests, the Ink Press answer and storyboard revisions go to the film director.
      if (director.send(text)) {
        setDraft("");
        return;
      }

      if (RENDER_RE.test(text)) {
        const sid = ensureSession();
        const now = new Date().toISOString();
        useStore.getState().appendSessionMessage(sid, { role: "user", content: text, ts: now });
        requestExport();
        useStore.getState().appendSessionMessage(sid, { role: "assistant", content: "Rendering the MP4 with Remotion (h264, the same frames as the preview). Progress shows on the Export button; it turns into a download link when done.", ts: now });
        setDraft("");
        return;
      }

      let id = targetId;
      if (!id) {
        const state = useStore.getState();
        const created = projectToSession(
          state.project,
          state.project.name || "Untitled Session",
          undefined,
          recipeId,
          recipeName,
        );
        state.addSession(created);
        id = created.id;
      }

      const state = useStore.getState();
      const ctx: AgentContext = {
        project: state.project,
        selectedClipId: state.selectedClipId,
        cards: CARDS,
      };
      const { ops, reply } = interpretAgentCommand(text, ctx);
      const sessionId = id;
      state.appendSessionMessage(sessionId, { role: "user", content: text, ts: new Date().toISOString() });
      setDraft("");

      if (ops.length) {
        applyAgentOps(ops);
        state.appendSessionMessage(sessionId, { role: "assistant", content: reply, ts: new Date().toISOString() });
        return;
      }
      // Not one of the built-in commands: ask the AI director for real edits.
      setThinking(true);
      requestEdit(text, useStore.getState().project)
        .then((result) => {
          const applied = applyDirectorOps(result.ops);
          return applied ? result.reply : `${result.reply}${result.ops.length ? "" : `\n\n${AGENT_HELP}`}`;
        })
        .catch((error) =>
          error instanceof DirectorError && (error.status === 401 || error.status === 403)
            ? `${reply}\n\n(${error.message})`
            : `${reply}\n\n(The AI director could not be reached: ${error instanceof Error ? error.message : "error"})`,
        )
        .then((content) => {
          useStore.getState().appendSessionMessage(sessionId, { role: "assistant", content, ts: new Date().toISOString() });
        })
        .finally(() => setThinking(false));
    },
    [targetId, recipeId, recipeName, director, ensureSession],
  );

  const messages = session?.messages ?? [];
  const typing = useTypingPlaceholder(SUGGESTIONS, Boolean(draft));

  return (
    <div className="flex min-h-0 flex-1 flex-col" style={{ background: "var(--bg-app)" }}>
      <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-8 text-center">
            <div className="text-sm font-semibold">Motion Agent</div>
            <p className="max-w-md text-xs leading-relaxed" style={{ color: semantic.textSecondary }}>{AGENT_HELP}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="px-3 py-1.5 rounded-full text-[11px] transition-all hover:text-white"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", color: semantic.textSecondary }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => <Bubble key={`${m.ts}-${i}`} message={m} />)
        )}
        <FilmDirectorChat director={director} hideOwnMessages showFilm={false} />
        {thinking && (
          <div className="text-xs" style={{ color: "#60a5fa" }} role="status">● Director is editing the film…</div>
        )}
      </div>

      <div className="flex-shrink-0 p-3 border-t" style={{ borderColor: "var(--border-color)" }}>
        <PromptCard compact>
          <PromptInput
            value={draft}
            onChange={setDraft}
            onSubmit={() => send(draft)}
            typingText={typing}
            placeholder="Ask for a film — “make a promo for my product” — or tell the agent what to change…"
            aria-label="Tell the agent what to change"
            rows={2}
          />
          <div className="flex items-center gap-2">
            <span className="text-[10px]" style={{ color: semantic.textMuted }}>
              {session ? `${messages.length} message${messages.length === 1 ? "" : "s"}` : "Starts a session on first send"}
            </span>
            <div className="flex-1" />
            <SendButton onClick={() => send(draft)} disabled={!draft.trim() || thinking || director.stage === "storyboarding" || director.stage === "building"} active={Boolean(draft.trim())} label="Send" />
          </div>
        </PromptCard>
      </div>
    </div>
  );
};

export default MotionAgentPanel;
