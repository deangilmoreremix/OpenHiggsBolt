// @vitest-environment jsdom
/**
 * Motion Agent + 会话持久化回归测试。
 *
 * 覆盖：
 *  1) 会话能追加对话，messageCount 是真实条数
 *  2) 解释器把至少 5 种自然语言说法变成真实的 op（而不是回一句"听不懂"）
 *  3) op 落到 store 后工程参数真的变了（Player 的 inputProps 就是这个 project）
 *  4) 会话（含 messages）能落 localStorage 并读回来
 */
import { beforeEach, describe, expect, it } from "vitest";
import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { useStore } from "@/apps/motion-studio/store";
import { interpretAgentCommand, type AgentContext } from "@/apps/motion-studio/lib/agentCommands";
import { applyAgentOps } from "@/apps/motion-studio/lib/agentApply";
import { projectToSession, sessionToOps } from "@/apps/motion-studio/lib/sessionAdapter";
import { MotionAgentPanel } from "@/apps/motion-studio/components/MotionAgentPanel";
import { CARDS } from "@/apps/motion-studio/cards/registry";
import { uid } from "@/apps/motion-studio/types";

const SESSIONS_KEY = "shotcraft-motion-sessions-v1";

const ctx = (): AgentContext => {
  const state = useStore.getState();
  return { project: state.project, selectedClipId: state.selectedClipId, cards: CARDS };
};

const resetStore = () => {
  const state = useStore.getState();
  state.setProject(state.project);
  useStore.setState({ sessions: [], activeSessionId: null, selectedClipId: null });
};

describe("motion studio · motion agent", () => {
  beforeEach(() => {
    localStorage.clear();
    resetStore();
  });

  it("appends user + assistant turns to a session and keeps messageCount real", () => {
    const state = useStore.getState();
    const session = projectToSession(state.project, "Agent session");
    state.addSession(session);

    expect(session.messages).toEqual([]);
    expect(session.messageCount).toBe(0);

    const store = useStore.getState();
    store.appendSessionMessage(session.id, {
      role: "user",
      content: "make the text bigger",
      ts: new Date().toISOString(),
    });
    useStore.getState().appendSessionMessage(session.id, {
      role: "assistant",
      content: "Set the text size on “字卡 · Ink Press” to 128px (was 116px).",
      ts: new Date().toISOString(),
    });

    const saved = useStore.getState().sessions.find((s) => s.id === session.id);
    expect(saved).toBeTruthy();
    expect(saved!.messages.length).toBe(2);
    expect(saved!.messageCount).toBe(2);
    expect(saved!.messages[0].role).toBe("user");
    expect(saved!.messages[0].content).toBe("make the text bigger");
    expect(saved!.messages[1].role).toBe("assistant");
  });

  it("turns at least five different phrasings into real ops", () => {
    const cases: { text: string; expect: (ops: ReturnType<typeof interpretAgentCommand>["ops"]) => void }[] = [
      {
        text: "make the text bigger",
        expect: (ops) => {
          expect(ops.length).toBeGreaterThan(0);
          expect(ops[0].kind).toBe("updateClipProps");
          const props = (ops[0] as { props: Record<string, unknown> }).props;
          expect(Object.keys(props).some((k) => /size/i.test(k))).toBe(true);
        },
      },
      {
        text: "increase the duration to 8s",
        expect: (ops) => {
          expect(ops[0].kind).toBe("updateClip");
          expect((ops[0] as { patch: { duration: number } }).patch.duration).toBe(240);
        },
      },
      {
        text: "change the background to red",
        expect: (ops) => {
          expect(ops.some((o) => o.kind === "setBackground")).toBe(true);
          expect((ops.find((o) => o.kind === "setBackground") as { color: string }).color).toBe("#ef4444");
        },
      },
      {
        text: "set the title to Launch day",
        expect: (ops) => {
          expect(ops[0].kind).toBe("updateClipProps");
          expect((ops[0] as { props: Record<string, unknown> }).props.text).toBe("Launch day");
        },
      },
      {
        text: "add a caption clip",
        expect: (ops) => {
          expect(ops[0].kind).toBe("addClip");
          expect((ops[0] as { cardId: string }).cardId).toBe("inkpress-caption");
        },
      },
      {
        text: "slow down by 0.5x",
        expect: (ops) => {
          expect(ops[0].kind).toBe("updateClip");
          expect((ops[0] as { patch: { speed: number } }).patch.speed).toBe(0.5);
        },
      },
      {
        text: "move the logo to the right",
        expect: (ops) => {
          expect(ops[0].kind).toBe("updateClip");
          expect((ops[0] as { patch: { x: number } }).patch.x).toBeGreaterThan(0);
        },
      },
      {
        text: "speed up by 0.5x",
        expect: (ops) => {
          expect(ops[0].kind).toBe("updateClip");
          expect((ops[0] as { patch: { speed: number } }).patch.speed).toBe(1.5);
        },
      },
      {
        text: "center the title",
        expect: (ops) => {
          expect(ops[0].kind).toBe("updateClip");
          const patch = (ops[0] as { patch: { x: number; y: number } }).patch;
          expect(patch.x).toBe(0);
          expect(patch.y).toBe(0);
        },
      },
    ];

    for (const c of cases) {
      const { ops, reply } = interpretAgentCommand(c.text, ctx());
      expect(ops.length, `no op for "${c.text}"`).toBeGreaterThan(0);
      expect(reply.length).toBeGreaterThan(0);
      c.expect(ops);
    }
  });

  it("applies ops to the real store so the project actually changes", () => {
    const before = useStore.getState().project;
    const target = before.tracks.flatMap((t) => t.clips).find((c) => c.cardId === "inkpress-title-card");
    expect(target).toBeTruthy();

    useStore.setState({ selectedClipId: target!.id });

    const { ops } = interpretAgentCommand("make the text bigger", ctx());
    applyAgentOps(ops);

    const after = useStore.getState().project;
    const clip = after.tracks.flatMap((t) => t.clips).find((c) => c.id === target!.id)!;
    const beforeFont = before.tracks.flatMap((t) => t.clips).find((c) => c.id === target!.id)!.props.fontSize;
    expect(Number(clip.props.fontSize)).toBeGreaterThan(Number(beforeFont ?? 0));

    // 撤销：一步回到改动前
    useStore.getState().undo();
    const undone = useStore.getState().project.tracks
      .flatMap((t) => t.clips)
      .find((c) => c.id === target!.id)!;
    expect(undone.props.fontSize).toBe(beforeFont);
  });

  it("persists sessions with their messages in localStorage", async () => {
    const state = useStore.getState();
    const session = projectToSession(state.project, "Persisted", "a prompt", "demo:HitCounter", "Hit counter");
    state.addSession(session);
    useStore.getState().appendSessionMessage(session.id, {
      role: "user",
      content: "make the text bigger",
      ts: new Date().toISOString(),
    });
    useStore.getState().appendSessionMessage(session.id, {
      role: "assistant",
      content: "Done.",
      ts: new Date().toISOString(),
    });

    // 触发落盘（store 里是 800ms 防抖，这里直接等它落盘）
    await new Promise((r) => setTimeout(r, 1000));

    const raw = localStorage.getItem(SESSIONS_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(Array.isArray(parsed)).toBe(true);
    const found = parsed.find((s: { id: string }) => s.id === session.id);
    expect(found).toBeTruthy();
    expect(found.messages.length).toBe(2);
    expect(found.messageCount).toBe(2);
    expect(found.recipeId).toBe("demo:HitCounter");
    expect(found.recipeName).toBe("Hit counter");
  });

  it("replays a session's turns back into ops", () => {
    const state = useStore.getState();
    const session = projectToSession(state.project, "Replay");
    state.addSession(session);
    useStore.getState().appendSessionMessage(session.id, {
      role: "user",
      content: "increase the duration to 8s",
      ts: new Date().toISOString(),
    });
    useStore.getState().appendSessionMessage(session.id, {
      role: "assistant",
      content: "ok",
      ts: new Date().toISOString(),
    });

    const saved = useStore.getState().sessions.find((s) => s.id === session.id)!;
    const ops = sessionToOps(saved, ctx());
    expect(ops.length).toBe(1);
    expect(ops[0].kind).toBe("updateClip");
  });

  it("keeps a session snapshot in step with the project it edits", async () => {
    const state = useStore.getState();
    const session = projectToSession(state.project, "Snapshot");
    state.addSession(session);

    useStore.getState().updateClipProps(
      state.project.tracks.flatMap((t) => t.clips).find((c) => c.cardId === "inkpress-caption")!.id,
      { text: "CHANGED BY AGENT" },
    );

    await new Promise((r) => setTimeout(r, 1000));

    const saved = useStore.getState().sessions.find((s) => s.id === session.id)!;
    const caption = saved.projectSnapshot.tracks
      .flatMap((t) => t.clips)
      .find((c) => c.cardId === "inkpress-caption");
    expect(caption?.props.text).toBe("CHANGED BY AGENT");
  });

  it("gives demo cards a real prop surface", () => {
    const demo = CARDS["demo:HitCounter"];
    expect(demo).toBeTruthy();
    expect(demo.schema.length).toBeGreaterThan(0);
    const keys = demo.schema.map((f) => f.key);
    expect(keys).toContain("title");
    expect(keys).toContain("titleSize");
    expect(keys).toContain("titleColor");
  });

  it("edits a demo card through its own prop surface", () => {
    const state = useStore.getState();
    const demo = state.project.tracks.flatMap((t) => t.clips).find((c) => c.cardId.startsWith("demo:"));
    expect(demo).toBeTruthy();
    useStore.setState({ selectedClipId: demo!.id });

    const { ops } = interpretAgentCommand("set the title to Ship it", ctx());
    expect(ops[0].kind).toBe("updateClipProps");
    expect((ops[0] as { props: Record<string, unknown> }).props.title).toBe("Ship it");

    const bigger = interpretAgentCommand("make the text bigger", ctx());
    expect(bigger.ops[0].kind).toBe("updateClipProps");
    expect(Object.keys((bigger.ops[0] as { props: Record<string, unknown> }).props)).toContain("titleSize");

    applyAgentOps(ops);
    const after = useStore.getState().project.tracks
      .flatMap((t) => t.clips)
      .find((c) => c.id === demo!.id)!;
    expect(after.props.title).toBe("Ship it");
  });

  it("gives every registered card a usable schema", () => {
    const missing = Object.values(CARDS).filter((c) => !c.schema || c.schema.length === 0);
    expect(missing.map((c) => c.id)).toEqual([]);
  });

  it("creates unique session ids", () => {
    expect(uid("session")).not.toBe(uid("session"));
  });

  it("renders the agent panel and applies what the user types", async () => {
    const state = useStore.getState();
    const session = projectToSession(state.project, "Panel session");
    state.addSession(session);

    const view = render(React.createElement(MotionAgentPanel, { sessionId: session.id }));

    const box = screen.getByPlaceholderText(/Tell the agent/) as HTMLTextAreaElement;
    await act(async () => {
      fireEvent.change(box, { target: { value: "increase the duration to 8s" } });
      fireEvent.click(screen.getByText("Send"));
    });

    const saved = useStore.getState().sessions.find((s) => s.id === session.id)!;
    expect(saved.messages.length).toBe(2);
    expect(saved.messages[0].role).toBe("user");
    expect(saved.messages[1].role).toBe("assistant");
    expect(saved.messages[1].content.length).toBeGreaterThan(0);

    // 指令真的改到了工程上
    const clip = useStore.getState().project.tracks.flatMap((t) => t.clips)[0];
    expect(clip.duration).toBe(240);

    view.unmount();
  });
});
