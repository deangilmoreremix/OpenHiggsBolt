'use client';

import { useCallback, useMemo } from 'react';
import { useStore } from '../store';
import MotionHistoryGallery from './MotionHistoryGallery';

/** 会话时长（秒）：优先用会话自带的时长，否则按快照里的片段末尾算 */
const durationOf = (session) => {
  if (typeof session.duration === 'number' && session.duration > 0) return session.duration;
  const snapshot = session.projectSnapshot;
  if (!snapshot) return 0;
  const fps = snapshot.fps || 30;
  const end = snapshot.tracks.reduce(
    (max, track) =>
      track.clips.reduce((m, clip) => Math.max(m, clip.start + clip.duration), max),
    0,
  );
  return end / fps;
};

/** 画廊要的一句文案：会话自带 prompt，没有就用第一条用户消息 */
const promptOf = (session) =>
  session.prompt ??
  session.messages?.find((m) => m.role === 'user')?.content ??
  undefined;

/**
 * 历史画廊 —— 把 store 里真实的会话（连同 Agent 对话）喂给画廊组件。
 *
 * 画廊本身只认「一串会话」，这里负责：
 *  - 从 store 读 sessions（真实数据，不是假数据）
 *  - 把每条会话的对话（messages）折成画廊要的文案 / 时长
 *  - 点开 = 把会话快照载回工作台；Remix = 复制一份；删除 = 删会话
 */
export default function MotionHistorySection() {
  const sessions = useStore((s) => s.sessions);
  const selectSession = useStore((s) => s.selectSession);
  const applySession = useStore((s) => s.applySession);
  const deleteSession = useStore((s) => s.deleteSession);
  const addSession = useStore((s) => s.addSession);

  const items = useMemo(
    () =>
      [...sessions]
        .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
        .map((session) => ({ ...session, prompt: promptOf(session), duration: durationOf(session) })),
    [sessions],
  );

  /** 画廊右上角的计数：所有会话里的对话条数（会话 + 消息） */
  const entryCount = useMemo(
    () => sessions.reduce((sum, s) => sum + (s.messages?.length ?? 0), 0),
    [sessions],
  );

  const handleSelect = useCallback(
    (session) => {
      selectSession(session.id);
      applySession(session.id);
    },
    [selectSession, applySession],
  );

  const handleRemix = useCallback(
    (session) => {
      const now = new Date().toISOString();
      addSession({
        ...session,
        id: `session_${Date.now().toString(36)}`,
        name: `${session.name} (Remix)`,
        sourceSessionId: session.id,
        projectSnapshot: JSON.parse(JSON.stringify(session.projectSnapshot ?? {})),
        updatedAt: now,
        messageCount: 0,
        messages: [],
      });
    },
    [addSession],
  );

  const handleDelete = useCallback((id) => deleteSession(id), [deleteSession]);

  return (
    <div className="ms-history" data-testid="motion-history-section">
      <MotionHistoryGallery
        sessions={items}
        onSelect={handleSelect}
        onRemix={handleRemix}
        onDelete={handleDelete}
        entryCount={entryCount}
      />
    </div>
  );
}
