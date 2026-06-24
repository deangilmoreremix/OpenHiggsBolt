import useStoryboardStore from '../../stores/useStoryboardStore';

export default function SoundtrackPanel() {
  const scenes = useStoryboardStore((s) => s.scenes);
  const sorted = [...scenes].sort((a, b) => a.scene_number - b.scene_number);

  return (
    <div className="space-y-4 rounded-2xl border border-cutai-border bg-cutai-surface p-4">
      <h3 className="text-sm font-semibold text-cutai-text">Soundtrack Vibe</h3>
      {sorted.length === 0 ? (
        <p className="text-sm text-cutai-muted">Generate a storyboard to see soundtrack suggestions.</p>
      ) : (
        sorted.map((scene) => {
          const st = scene.soundtrack || {};
          return (
            <div key={scene.id} className="rounded-lg border border-cutai-border bg-cutai-bg p-3 space-y-2">
              <p className="text-xs font-medium text-cutai-text">
                Scene {scene.scene_number}: {scene.title}
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-cutai-muted">Genre</span>
                  <p className="text-cutai-text">{st.genre || '—'}</p>
                </div>
                <div>
                  <span className="text-cutai-muted">Tempo</span>
                  <p className="text-cutai-text">{st.tempo || '—'}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-cutai-muted">Instruments</span>
                  <p className="text-cutai-text">{(st.instruments || []).join(', ') || '—'}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-cutai-muted">Reference</span>
                  <p className="font-mono text-[11px] text-cutai-accent">{st.reference_track || '—'}</p>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
