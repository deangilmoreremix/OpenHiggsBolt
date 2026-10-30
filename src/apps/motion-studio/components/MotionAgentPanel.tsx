'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  PromptComposer,
  PromptTextarea as PromptTextareaBase,
  PromptAction as PromptActionBase,
  PromptFooter,
} from "studio/src/components/prompt/PromptComposer";
import { useStore } from "../store";
import { CARDS } from "../cards/registry";
import { interpretAgentCommand, AGENT_HELP, type AgentContext } from "../lib/agentCommands";
import { applyAgentOps } from "../lib/agentApply";
import { projectToSession } from "../lib/sessionAdapter";
import type { SessionMessage } from "../types";

/**
 * 上游 primitives 是 .jsx（没有类型声明），TS 推不出 props。
 * 这里只补一层类型，不改实现：仍然用的是 studio 的 PromptComposer / PromptTextarea。
 */
type ComposerTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  maxHeightMobile?: number;
  maxHeightDesktop?: number;
};

const PromptTextarea = PromptTextareaBase as unknown as React.ForwardRefExoticComponent<
  ComposerTextareaProps & React.RefAttributes<HTMLTextAreaElement>
>;

type ComposerActionProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: React.ReactNode;
};

const PromptAction = PromptActionBase as unknown as React.ForwardRefExoticComponent<
  ComposerActionProps & React.RefAttributes<HTMLButtonElement>
>;

/**
 * Motion Agent —— 工作室里的对话式改片面板。
 *
 * 一条指令 → 解释器（`lib/agentCommands.ts`，本地确定性、无外部 LLM / 无付费
 * API）→ 真实 store 改动（`lib/agentApply.ts`）→ Remotion Player 重渲染。
 * 每一轮对话都写进当前会话（session.messages），会话面板能回看。
 */

const SUGGESTIONS = [
  "make the text bigger",
  "set the duration to 8s",
  "change the background to red",
  "slow down by 0.5x",
  "add a caption clip",
];

const clock = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const Bubble: React.FC<{ message: SessionMessage }> = ({ message }) => {
  const user = message.role === "user";
  return (
    <div className={`flex ${user ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          "max-w-[85%] rounded-xl border px-3 py-2 text-[13px] leading-relaxed",
          user
            ? "border-[#22d3ee]/25 bg-[#22d3ee]/10 text-white"
            : "border-white/5 bg-[#0a0a0a] text-white/80",
        ].join(" ")}
      >
        <div className="whitespace-pre-wrap break-words">{message.content}</div>
        <div className="mt-1 text-[10px] text-white/30">{clock(message.ts)}</div>
      </div>
    </div>
  );
};

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

  const send = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text) return;

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
      applyAgentOps(ops);

      const ts = new Date().toISOString();
      state.appendSessionMessage(id, { role: "user", content: text, ts });
      state.appendSessionMessage(id, { role: "assistant", content: reply, ts });
      setDraft("");
    },
    [targetId, recipeId, recipeName],
  );

  const messages = session?.messages ?? [];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 bg-[#030303] p-4">
      <div
        ref={scrollRef}
        className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto rounded-xl border border-white/5 bg-[#030303] p-3"
      >
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-8 text-center">
            <div className="text-[13px] font-semibold text-white/80">Motion Agent</div>
            <p className="max-w-md text-[12px] leading-relaxed text-white/45">{AGENT_HELP}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-lg border border-white/5 bg-white/[0.03] px-2.5 py-1 text-[11px] text-white/60 transition-colors hover:border-[#22d3ee]/30 hover:text-[#22d3ee]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => <Bubble key={`${m.ts}-${i}`} message={m} />)
        )}
      </div>

      <PromptComposer
        positionClassName="relative w-full"
        panelClassName="!rounded-xl !border-white/5 !bg-[#030303] !p-3 !shadow-none"
      >
        <PromptTextarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(draft);
            }
          }}
          placeholder="Tell the agent what to change — “make the text bigger”, “set the duration to 8s”…"
          className="text-white placeholder:text-white/25"
        />
        <PromptFooter className="!border-white/5">
          <span className="text-[11px] text-white/30">
            {session ? `${messages.length} message${messages.length === 1 ? "" : "s"}` : "Starts a session on first send"}
          </span>
          <PromptAction onClick={() => send(draft)} disabled={!draft.trim()} className="!px-5 !py-2">
            Send
          </PromptAction>
        </PromptFooter>
      </PromptComposer>
    </div>
  );
};

export default MotionAgentPanel;
