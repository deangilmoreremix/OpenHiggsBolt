/**
 * Motion Director tab tools. They drive the workbench's own store (zustand, src/apps/motion-director/store.ts) and its own agent code:
 * `motion_director_command` runs a sentence through interpretAgentCommand and applyAgentOps exactly like the in-app Motion Agent panel.
 * Not exposed: dragging on the timeline, the Remotion player controls beyond playhead, and rendering/export to a file (needs the browser's renderer and a download).
 */
const str = (max) => ({ type: 'string', maxLength: max });
const fail = (msg) => { throw new Error(msg); };

const overview = (s) => {
  const p = s.project || {};
  return {
    name: p.name, fps: p.fps, width: p.width, height: p.height, background: p.background, themeId: p.themeId,
    selectedClipId: s.selectedClipId, playhead: s.playhead,
    undoSteps: (s.past || []).length, redoSteps: (s.future || []).length,
    tracks: (p.tracks || []).map((tr) => ({
      id: tr.id, name: tr.name, hidden: !!tr.hidden,
      clips: (tr.clips || []).map((c) => ({ id: c.id, cardId: c.cardId, start: c.start, duration: c.duration, opacity: c.opacity, scale: c.scale, x: c.x, y: c.y, props: c.props })),
    })),
  };
};

/**
 * @param {{ store: { getState: () => any }, interpret: (text: string, ctx: any) => { ops: any[], reply: string }, apply: (ops: any[]) => void }} deps
 */
export function motionDirectorTools({ store, interpret, apply }) {
  const state = () => store.getState();
  const clipExists = (id) => (state().project?.tracks || []).some((tr) => (tr.clips || []).some((c) => c.id === id));
  const t = (name, description, risk, properties, required, run) => ({ name, description, risk, schema: { type: 'object', properties, required: required || [] }, run });
  return [
    t('motion_director_get_project', 'The Motion Director project: tracks, clips (card, timing, position, props), selection, playhead and undo depth.', 'read', {}, [], async () => overview(state())),
    t('motion_director_command', 'Say what to change in plain English ("make the title red", "add a lower third"); the studio\'s own Motion Agent turns it into real edits. Returns what it did.', 'write', { text: str(500) }, ['text'], async (a) => {
      const s = state();
      const out = interpret(String(a.text), { project: s.project, selectedClipId: s.selectedClipId });
      if (!out.ops.length) return { applied: 0, reply: out.reply };
      apply(out.ops);
      return { applied: out.ops.length, reply: out.reply, project: overview(state()) };
    }),
    t('motion_director_add_clip', 'Add a card to the timeline.', 'write', { card_id: str(120), track_id: str(80), at_frame: { type: 'integer', minimum: 0 }, props: { type: 'object' } }, ['card_id'], async (a) => {
      apply([{ kind: 'addClip', cardId: String(a.card_id), trackId: a.track_id, at: a.at_frame, props: a.props, label: 'MCP add' }]);
      return overview(state());
    }),
    t('motion_director_update_clip_props', 'Change a clip\'s card properties (text, colours…).', 'write', { clip_id: str(80), props: { type: 'object' } }, ['clip_id', 'props'], async (a) => {
      if (!clipExists(a.clip_id)) fail('No clip with that id.');
      apply([{ kind: 'updateClipProps', clipId: a.clip_id, props: a.props || {}, label: 'MCP props' }]);
      return overview(state());
    }),
    t('motion_director_update_clip', 'Change a clip\'s timing or layer (start, duration, opacity, scale, x, y).', 'write', { clip_id: str(80), start: { type: 'number' }, duration: { type: 'number' }, opacity: { type: 'number', minimum: 0, maximum: 1 }, scale: { type: 'number' }, x: { type: 'number' }, y: { type: 'number' } }, ['clip_id'], async (a) => {
      if (!clipExists(a.clip_id)) fail('No clip with that id.');
      const { clip_id, ...patch } = a;
      apply([{ kind: 'updateClip', clipId: clip_id, patch, label: 'MCP clip' }]);
      return overview(state());
    }),
    t('motion_director_remove_clip', 'Remove a clip from the timeline (undo brings it back).', 'destructive', { clip_id: str(80) }, ['clip_id'], async (a) => {
      if (!clipExists(a.clip_id)) fail('No clip with that id.');
      apply([{ kind: 'removeClip', clipId: a.clip_id, label: 'MCP remove' }]);
      return overview(state());
    }),
    t('motion_director_set_background', 'Set the stage background colour (hex).', 'write', { color: { type: 'string', pattern: '^#[0-9a-fA-F]{3,8}$' } }, ['color'], async (a) => {
      if (!/^#[0-9a-fA-F]{3,8}$/.test(String(a.color))) fail('color must be a hex colour like #101010.');
      apply([{ kind: 'setBackground', color: a.color, label: 'MCP background' }]);
      return { background: state().project?.background };
    }),
    t('motion_director_select_clip', 'Select a clip (the next command acts on it first).', 'write', { clip_id: str(80) }, ['clip_id'], async (a) => {
      if (a.clip_id && !clipExists(a.clip_id)) fail('No clip with that id.');
      state().select(a.clip_id || null); return { selectedClipId: state().selectedClipId };
    }),
    t('motion_director_set_playhead', 'Move the playhead to a frame.', 'write', { frame: { type: 'integer', minimum: 0 } }, ['frame'], async (a) => { state().setPlayhead(Number(a.frame) || 0); return { playhead: state().playhead }; }),
    t('motion_director_undo', 'Undo the last change.', 'write', {}, [], async () => { state().undo(); return overview(state()); }),
    t('motion_director_redo', 'Redo the last undone change.', 'write', {}, [], async () => { state().redo(); return overview(state()); }),
  ];
}
